import { state } from '../state.js';
import { playSound } from '../audio.js';
import { TILE, isWalkable } from './map.js';
import { isVillagePositionBlocked } from './collisions.js';
import { openChest } from './spawn.js';
import { enterCombat } from './combat.js';
import { updateParticles } from './particles.js';
import { getMovementDelta } from './movement.js';

const VIEW_W = 800, VIEW_H = 500;

function canOccupy(ow, x, y, radius = 9) {
  const locationId = ow.sourceLocationId || ow.locationId;
  return isWalkable(ow.map, ow.cols, ow.rows, x, y, locationId)
    && (locationId !== 'village' || !isVillagePositionBlocked(x, y, radius));
}
const AGGRO_RANGE = 200, LEASH_RANGE = 340, COMBAT_RANGE = 44, CAMERA_LERP = 0.15;

export function initCamera(playerPos, cols, rows) {
  const mapW = cols * TILE, mapH = rows * TILE;
  let cx = playerPos.x - VIEW_W / 2, cy = playerPos.y - VIEW_H / 2;
  cx = mapW <= VIEW_W ? (mapW - VIEW_W) / 2 : Math.max(0, Math.min(mapW - VIEW_W, cx));
  cy = mapH <= VIEW_H ? (mapH - VIEW_H) / 2 : Math.max(0, Math.min(mapH - VIEW_H, cy));
  return { x: cx, y: cy };
}

export function tryMovePlayer(dx, dy, deltaFrames = 1) {
  const ow = state.overworld;
  if (!ow || !ow.active || ow.combat || ow.defeated) return;
  const step = getMovementDelta(dx, dy, deltaFrames);
  if (step.x === 0 && step.y === 0) return;
  const p = ow.player, r = 12;
  let moved = false;
  const nx = p.x + step.x, ny = p.y + step.y;
  if (canOccupy(ow, nx, p.y, r)
      && isWalkable(ow.map, ow.cols, ow.rows, nx - r, p.y, (ow.sourceLocationId || ow.locationId))
      && isWalkable(ow.map, ow.cols, ow.rows, nx + r, p.y, (ow.sourceLocationId || ow.locationId))) { p.x = nx; moved = true; }
  if (canOccupy(ow, p.x, ny, r)
      && isWalkable(ow.map, ow.cols, ow.rows, p.x, ny - r, (ow.sourceLocationId || ow.locationId))
      && isWalkable(ow.map, ow.cols, ow.rows, p.x, ny + r, (ow.sourceLocationId || ow.locationId))) { p.y = ny; moved = true; }
  p.x = Math.max(TILE / 2, Math.min(ow.cols * TILE - TILE / 2, p.x));
  p.y = Math.max(TILE / 2, Math.min(ow.rows * TILE - TILE / 2, p.y));
  if (moved) {
    const now = performance.now();
    if (ow.lastStepSoundAt === undefined || now - ow.lastStepSoundAt >= 175) {
      playSound('step');
      ow.lastStepSoundAt = now;
    }
  }
}

export function updateOverworld(dt) {
  const ow = state.overworld;
  if (!ow || !ow.active) return;
  updateCamera();
  if (ow.shake && ow.shake.t > 0) { ow.shake.t -= dt * 0.0167; if (ow.shake.t <= 0) { ow.shake.t = 0; ow.shake.mag = 0; } }
  updateParticles(dt);
  ow.floatingNumbers = ow.floatingNumbers.filter(fn => { fn.life -= dt * 0.02; fn.y -= dt * 0.6; return fn.life > 0; });

  const now = performance.now();
  for (const e of ow.enemies) {
    if (e.dead && e.respawnAt && now >= e.respawnAt) {
      e.dead = false; e.hp = e.maxHp; e.x = e.homeX; e.y = e.homeY; e.state = 'idle'; e.respawnAt = 0; e.effects = []; e.phase = 0;
    }
  }

  if (ow.combat || ow.defeated) return;

  // AI NPC
  for (const npc of ow.npcs) {
    const distToPlayer = Math.hypot(npc.x - ow.player.x, npc.y - ow.player.y);
    
    // Если игрок близко, NPC останавливается
    if (distToPlayer < npc.interactionRadius + 20) {
      npc.state = 'idle';
      continue;
    }

    // Иначе гуляет вокруг дома
    npc.wanderTimer -= dt * 0.02;
    if (npc.wanderTimer <= 0) {
      npc.wanderTimer = 2 + Math.random() * 4;
      const a = Math.random() * Math.PI * 2;
      npc.wanderDx = Math.cos(a);
      npc.wanderDy = Math.sin(a);
    }
    const dHome = Math.hypot(npc.x - npc.homeX, npc.y - npc.homeY);
    const wanderRadius = Number.isFinite(npc.wanderRadius) ? npc.wanderRadius : 80;
    if (dHome > wanderRadius) {
      npc.wanderDx = (npc.homeX - npc.x) / (dHome || 1);
      npc.wanderDy = (npc.homeY - npc.y) / (dHome || 1);
    }
    const spd = (npc.wanderSpeed || 0.5) * dt;
    const nx = npc.x + npc.wanderDx * spd, ny = npc.y + npc.wanderDy * spd;
    if (canOccupy(ow, nx, npc.y, 8)) npc.x = nx; else npc.wanderDx = -npc.wanderDx;
    if (canOccupy(ow, npc.x, ny, 8)) npc.y = ny; else npc.wanderDy = -npc.wanderDy;
  }

  for (const e of ow.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - ow.player.x, e.y - ow.player.y);
    if (d < COMBAT_RANGE) { enterCombat(e); return; }
    if (d < AGGRO_RANGE) e.state = 'chase';
    else if (d > LEASH_RANGE) e.state = 'idle';

    if (e.state === 'chase') {
      const dx = ow.player.x - e.x, dy = ow.player.y - e.y;
      const ln = Math.hypot(dx, dy) || 1, spd = 2.2 * dt;
      const nx = e.x + (dx / ln) * spd, ny = e.y + (dy / ln) * spd;
      if (canOccupy(ow, nx, e.y, 9)) e.x = nx;
      if (canOccupy(ow, e.x, ny, 9)) e.y = ny;
    } else {
      e.wanderTimer -= dt * 0.02;
      if (e.wanderTimer <= 0) {
        e.wanderTimer = 2 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        e.wanderDx = Math.cos(a); e.wanderDy = Math.sin(a);
      }
      const dHome = Math.hypot(e.x - e.homeX, e.y - e.homeY);
      if (dHome > 100) {
        e.wanderDx = (e.homeX - e.x) / (dHome || 1);
        e.wanderDy = (e.homeY - e.y) / (dHome || 1);
      }
      const spd = 0.9 * dt;
      const nx = e.x + e.wanderDx * spd, ny = e.y + e.wanderDy * spd;
      if (isWalkable(ow.map, ow.cols, ow.rows, nx, e.y, (ow.sourceLocationId || ow.locationId))) e.x = nx; else e.wanderDx = -e.wanderDx;
      if (isWalkable(ow.map, ow.cols, ow.rows, e.x, ny, (ow.sourceLocationId || ow.locationId))) e.y = ny; else e.wanderDy = -e.wanderDy;
    }
  }

  for (const c of ow.chests) {
    if (c.opened) continue;
    if (Math.hypot(c.x - ow.player.x, c.y - ow.player.y) < 40) openChest(c);
  }
}

function updateCamera() {
  const ow = state.overworld;
  const mapW = ow.cols * ow.tile, mapH = ow.rows * ow.tile;
  let targetX, targetY;
  if (mapW <= VIEW_W) targetX = (mapW - VIEW_W) / 2;
  else targetX = Math.max(0, Math.min(mapW - VIEW_W, ow.player.x - VIEW_W / 2));
  if (mapH <= VIEW_H) targetY = (mapH - VIEW_H) / 2;
  else targetY = Math.max(0, Math.min(mapH - VIEW_H, ow.player.y - VIEW_H / 2));
  ow.camera.x += (targetX - ow.camera.x) * CAMERA_LERP;
  ow.camera.y += (targetY - ow.camera.y) * CAMERA_LERP;
}