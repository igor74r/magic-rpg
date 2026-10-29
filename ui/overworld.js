import { state } from '../systems/state.js';
import {
  tryMovePlayer, updateOverworld, exitOverworld,
  combatAttack, combatCastSpell, combatUseItem, combatBlock, combatFlee,
  combatUseAbility
} from '../systems/overworld.js';
import { getEffStats } from '../systems/stats.js';
import { saveGame } from '../systems/save.js';
import { saveAndMenu } from './menu.js';
import { LOCATIONS } from '../data/locations.js';
import { ENEMIES } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { SPELLS } from '../data/spells.js';
import { CLASSES } from '../data/classes.js';
import { emit } from '../systems/events.js';

const VIEW_W = 800, VIEW_H = 500;
let rafId = null, lastTs = 0, listenersAttached = false, subPanel = null, lastPanelKey = '', lastNpcKey = '', autosaveTimer = null, autosaveAt = 0, paused = false, nearNpc = null;

const THEMES = {
  default: { colors: { 0: '#2a4a2a', 1: '#6a5a3a', 2: '#1a3a1a', 3: '#1a3a6a', 4: '#5a5a5a' }, icons: { 2: '🌲', 3: '💧', 4: '🪨' }, vignette: 0.4 },
  village: { colors: { 0: '#4a6a4a', 1: '#7a6a5a', 2: '#5a4a3a', 3: '#4a8ac8', 4: '#8a7a6a' }, icons: { 2: '🏠', 3: '⛲', 4: '🚧' }, vignette: 0.1 },
  swamp: { colors: { 0: '#2a3a1a', 1: '#4a3a1a', 2: '#1a2a1a', 3: '#2a4a5a', 4: '#3a2a2a' }, icons: { 2: '🍄', 3: '💧', 4: '🦴' }, vignette: 0.7 },
  graveyard: { colors: { 0: '#1a1a2a', 1: '#4a4a5a', 2: '#0a0a1a', 3: '#2a2a4a', 4: '#6a5a5a' }, icons: { 2: '🪦', 3: '💧', 4: '🦴' }, vignette: 0.85 },
  volcano: { colors: { 0: '#3a1a0a', 1: '#5a3a0a', 2: '#1a0a0a', 3: '#ff6020', 4: '#2a1a1a' }, icons: { 2: '🔥', 3: '🌋', 4: '🗿' }, vignette: 0.6 },
  ice: { colors: { 0: '#2a3a5a', 1: '#6a7a9a', 2: '#1a2a4a', 3: '#6ac8ff', 4: '#a0c0d0' }, icons: { 2: '🌲', 3: '🧊', 4: '⛰️' }, vignette: 0.5 },
  desert: { colors: { 0: '#8a6a3a', 1: '#a08050', 2: '#6a4a2a', 3: '#4a8ac8', 4: '#5a4a3a' }, icons: { 2: '🌵', 3: '💧', 4: '🏜️' }, vignette: 0.35 },
  library: { colors: { 0: '#2a1a3a', 1: '#5a3a6a', 2: '#1a0a2a', 3: '#6a3a9a', 4: '#4a3a5a' }, icons: { 2: '📚', 3: '💧', 4: '🪑' }, vignette: 0.75 },
  dragon: { colors: { 0: '#3a1a0a', 1: '#5a2a0a', 2: '#1a0a0a', 3: '#ff4010', 4: '#4a2a1a' }, icons: { 2: '🔥', 3: '🌋', 4: '💎' }, vignette: 0.8 }
};
function getTheme(name) { return THEMES[name] || THEMES.default; }

export function initOverworld() {
  if (!listenersAttached) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    listenersAttached = true;
    const canvas = document.getElementById('overworld-canvas');
    if (canvas) { canvas.addEventListener('mousemove', onCanvasMouseMove); canvas.addEventListener('mouseleave', hideMapTooltip); }
  }
  subPanel = null; lastPanelKey = ''; lastNpcKey = ''; paused = false; nearNpc = null;
  closePauseMenu(); startAutosave();
  if (!rafId) { lastTs = performance.now(); rafId = requestAnimationFrame(tick); }
  renderCombatPanel(); renderNpcPanel();
}

function startAutosave() {
  if (autosaveTimer) return;
  autosaveTimer = setInterval(() => {
    const ow = state.overworld;
    if (ow && ow.active && !ow.combat && !ow.defeated && !paused) { saveGame(); autosaveAt = performance.now(); }
  }, 30000);
}

function onKeyDown(e) {
  if (!state.overworld || !state.overworld.active) return;
  const k = e.key.toLowerCase();
  if (paused) { if (k === 'escape') { e.preventDefault(); closePauseMenu(); } return; }
  if (k === 'escape') {
    e.preventDefault(); if (state.overworld.defeated) return;
    if (subPanel) { subPanel = null; renderCombatPanel(); }
    else if (state.overworld.combat) { if (confirm('Сбежать из боя? Это считается побегом.')) combatFlee(false); }
    else openPauseMenu();
    return;
  }
  if (state.overworld.defeated) return;

  if (state.overworld.combat) {
    const c = state.overworld.combat;
    if (subPanel) {
      const n = parseInt(k, 10);
      if (!isNaN(n) && n >= 1) {
        e.preventDefault();
        if (subPanel === 'spells') { const id = state.game.player.spells[n - 1]; if (id) owCast(id); }
        else if (subPanel === 'items') { const items = state.game.player.inventory.filter(it => ITEMS[it.id]?.type === 'consumable'); const it = items[n - 1]; if (it) owUseItem(it.id); }
        else if (subPanel === 'abilities') { const cls = CLASSES[state.game.player.class]; const abs = (cls.abilities || []).filter(a => !a.passive); const ab = abs[n - 1]; if (ab) owUseAbility(ab.id); }
      }
      return;
    }
    if (c.turn !== 'player') return;
    if (k === ' ' || k === '1') { e.preventDefault(); combatAttack(); renderCombatPanel(); return; }
    if (k === '2') { e.preventDefault(); owOpenSpells(); return; }
    if (k === '3') { e.preventDefault(); owOpenItems(); return; }
    if (k === '4') { e.preventDefault(); owFlee(); return; }
    if (k === '5') { e.preventDefault(); owBlock(); return; }
    if (k === '6') { e.preventDefault(); owOpenAbilities(); return; }
    return;
  }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { e.preventDefault(); state.overworld.keys[k] = true; }
}

function onKeyUp(e) { if (!state.overworld) return; state.overworld.keys[e.key.toLowerCase()] = false; }
export function closeDialogAndResume() { paused = false; lastNpcKey = ''; renderNpcPanel(); }

function tick(ts) {
  const dt = Math.min(50, ts - lastTs) / 16.67; lastTs = ts;
  if (state.overworld && state.overworld.active) {
    if (!paused) {
      if (!state.overworld.combat && !state.overworld.defeated) {
        const k = state.overworld.keys; let dx = 0, dy = 0;
        if (k['w'] || k['arrowup']) dy -= 1; if (k['s'] || k['arrowdown']) dy += 1;
        if (k['a'] || k['arrowleft']) dx -= 1; if (k['d'] || k['arrowright']) dx += 1;
        if (dx || dy) tryMovePlayer(dx, dy);
      }
      updateOverworld(dt);
    }
    render(); renderCombatPanel(); renderNpcPanel();
  }
  rafId = requestAnimationFrame(tick);
}

function render() {
  const canvas = document.getElementById('overworld-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); const ow = state.overworld; const cam = ow.camera; const theme = getTheme(ow.theme);
  ctx.save();
  if (ow.shake && ow.shake.t > 0) ctx.translate((Math.random() * 2 - 1) * ow.shake.mag, (Math.random() * 2 - 1) * ow.shake.mag);
  ctx.fillStyle = '#05020a'; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  const time = performance.now() * 0.001; ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc((i * 137 + Math.sin(time + i) * 20) % VIEW_W, (i * 73 + Math.cos(time * 0.5 + i) * 15) % VIEW_H, 1.5, 0, Math.PI * 2); ctx.fill(); }

  const startCol = Math.max(0, Math.floor(cam.x / ow.tile)), startRow = Math.max(0, Math.floor(cam.y / ow.tile));
  const endCol = Math.min(ow.cols, startCol + Math.ceil(VIEW_W / ow.tile) + 1), endRow = Math.min(ow.rows, startRow + Math.ceil(VIEW_H / ow.tile) + 1);

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const t = ow.map[y][x], sx = x * ow.tile - cam.x, sy = y * ow.tile - cam.y;
      ctx.fillStyle = theme.colors[t] || '#2a4a2a'; ctx.fillRect(sx, sy, ow.tile, ow.tile);
      if (theme.icons[t]) { ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(theme.icons[t], sx + ow.tile / 2, sy + ow.tile / 2); }
    }
  }

  for (const c of ow.chests) {
    if (c.opened) continue;
    const sx = c.x - cam.x, sy = c.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📦', sx, sy);
  }

  const p = ow.player; nearNpc = null;
  
  for (const obj of ow.statics || []) {
    const sx = obj.x - cam.x, sy = obj.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(obj.x - p.x, obj.y - p.y);
    if (dist < obj.interactionRadius && !ow.combat) {
      nearNpc = obj; 
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(obj.emoji, sx, sy);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(obj.name, sx, sy - 28); ctx.fillStyle = '#d4c8a8'; ctx.fillText(obj.name, sx, sy - 28);
  }

  for (const npc of ow.npcs || []) {
    const sx = npc.x - cam.x, sy = npc.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
    if (dist < npc.interactionRadius && !ow.combat) {
      nearNpc = npc;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(npc.emoji, sx, sy);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(npc.name, sx, sy - 28); ctx.fillStyle = '#d4c8a8'; ctx.fillText(npc.name, sx, sy - 28);
  }

  const loc = LOCATIONS[ow.locationId];
  const questEnemyId = loc?.shard && !state.game.shards[loc.shard] ? loc.shardFrom : null;
  const now = performance.now();

  for (const e of ow.enemies) {
    if (e.dead) continue;
    const sx = e.x - cam.x, sy = e.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    if (questEnemyId && e.enemyId === questEnemyId) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);
      ctx.fillStyle = `rgba(180,60,255,${0.2 + pulse * 0.2})`; ctx.beginPath(); ctx.arc(sx, sy, 32 + pulse * 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(180,60,255,${0.6 + pulse * 0.4})`; ctx.lineWidth = 2; ctx.stroke();
    } else if (e.boss) {
      ctx.fillStyle = 'rgba(180,50,255,0.30)'; ctx.beginPath(); ctx.arc(sx, sy, 36, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(180,50,255,0.85)'; ctx.lineWidth = 2; ctx.stroke();
    } else if (e.elite) {
      ctx.fillStyle = 'rgba(255,200,50,0.28)'; ctx.beginPath(); ctx.arc(sx, sy, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,50,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (e.state === 'chase') { ctx.fillStyle = 'rgba(255,60,60,0.15)'; ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ENEMIES[e.enemyId].emoji, sx, sy);
    if (e.boss) { ctx.font = 'bold 20px serif'; ctx.fillStyle = '#b060ff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeText('☠', sx + 20, sy - 20); ctx.fillText('☠', sx + 20, sy - 20); }
    else if (e.elite) { ctx.font = 'bold 20px serif'; ctx.fillStyle = '#ffd060'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeText('★', sx + 20, sy - 20); ctx.fillText('★', sx + 20, sy - 20); }
    const distToPlayer = Math.hypot(e.x - ow.player.x, e.y - ow.player.y);
    if (distToPlayer < 260) {
      const def = ENEMIES[e.enemyId];
      const label = e.boss ? '☠ ' + def.name : e.elite ? '★ ' + def.name : def.name;
      ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.strokeText(label, sx, sy - 34); ctx.fillStyle = e.boss ? '#b060ff' : e.elite ? '#ffd060' : '#d4c8a8'; ctx.fillText(label, sx, sy - 34);
    }
    const bw = 40; ctx.fillStyle = '#0a0612'; ctx.fillRect(sx - bw / 2, sy - 28, bw, 4); ctx.fillStyle = e.boss ? '#b060ff' : e.elite ? '#ffa500' : '#d63030'; ctx.fillRect(sx - bw / 2, sy - 28, bw * (e.hp / e.maxHp), 4);
  }

  const px = p.x - cam.x, py = p.y - cam.y;
  ctx.font = '38px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(CLASSES[state.game.player.class].emoji, px, py);
  const bw = 50; ctx.fillStyle = '#0a0612'; ctx.fillRect(px - bw / 2, py - 30, bw, 4); ctx.fillRect(px - bw / 2, py - 24, bw, 3);
  ctx.fillStyle = '#d63030'; ctx.fillRect(px - bw / 2, py - 30, bw * (p.hp / p.maxHp), 4); 
  
  const pClass = state.game.player.class;
  ctx.fillStyle = pClass === 'warrior' ? '#d000ff' : '#3060d6'; // <--- ФИОЛЕТОВЫЙ ЦВЕТ ДЛЯ ЯРОСТИ
  ctx.fillRect(px - bw / 2, py - 24, bw * (p.mp / p.maxMp), 3);

  for (const part of ow.particles || []) {
    const sx = part.x - cam.x, sy = part.y - cam.y;
    if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, part.life / part.maxLife)); ctx.fillStyle = part.color; ctx.beginPath(); ctx.arc(sx, sy, part.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  for (const fn of ow.floatingNumbers) {
    const sx = fn.x - cam.x, sy = fn.y - cam.y;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, fn.life)); ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fn.type === 'heal' ? '#60ff60' : fn.type === 'crit' ? '#ffd060' : '#ff4040'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(fn.text, sx, sy); ctx.fillText(fn.text, sx, sy); ctx.restore();
  }

  if (ow.combat) {
    const e = ow.combat.enemy; const ex = e.x - cam.x, ey = e.y - cam.y;
    ctx.strokeStyle = 'rgba(201,162,39,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  }

  const gradient = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 150, VIEW_W / 2, VIEW_H / 2, 500);
  gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, `rgba(0,0,0,${theme.vignette || 0.4})`);
  ctx.fillStyle = gradient; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  if (ow.shake && ow.shake.t > 0 && ow.combat) {
    let targetX, targetY, color;
    if (ow.shake.mag === 8) { targetX = ow.combat.enemy.x - cam.x; targetY = ow.combat.enemy.y - cam.y; color = '#ffd060'; }
    else if (ow.shake.mag === 5) { targetX = ow.player.x - cam.x; targetY = ow.player.y - cam.y; color = '#ff4040'; }
    if (color) {
      const radius = 60 * (1 - (ow.shake.t / 0.3)); const flashGrad = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, radius + 20);
      flashGrad.addColorStop(0, color); flashGrad.addColorStop(0.5, color + '80'); flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = flashGrad; ctx.beginPath(); ctx.arc(targetX, targetY, radius + 20, 0, Math.PI * 2); ctx.fill();
    }
  }

  const stats = getEffStats();
  const hudX = 12, hudY = 12;
  ctx.fillStyle = 'rgba(10, 6, 18, 0.75)'; ctx.fillRect(hudX, hudY, 190, 74);
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(hudX, hudY, 190, 74);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 14px Georgia';
  ctx.fillStyle = '#ff6060'; ctx.fillText(`❤️ HP: ${p.hp} / ${p.maxHp}`, hudX + 10, hudY + 18);
  
  const mpLabel = pClass === 'warrior' ? '🔥 Ярость' : '💙 MP';
  ctx.fillStyle = pClass === 'warrior' ? '#d000ff' : '#60a0ff'; // <--- ФИОЛЕТОВЫЙ ЦВЕТ ДЛЯ HUD
  ctx.fillText(`${mpLabel}: ${p.mp} / ${p.maxMp}`, hudX + 10, hudY + 38);
  
  ctx.font = '13px Georgia'; ctx.fillStyle = '#ffd060'; ctx.fillText(`⚔️ Урон: ${stats.atk}`, hudX + 10, hudY + 58);
  ctx.fillStyle = '#60ff60'; ctx.fillText(`🛡️ Броня: ${stats.def}`, hudX + 105, hudY + 58);
  ctx.restore();

  drawMinimap(ctx, ow);
  if (performance.now() - autosaveAt < 1500) {
    ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText('💾 сохранено', 12, VIEW_H - 12); ctx.fillStyle = 'rgba(96,255,96,0.9)'; ctx.fillText('💾 сохранено', 12, VIEW_H - 12);
  }
}

function renderNpcPanel() {
  const panel = document.getElementById('npc-panel');
  if (!panel) return;
  const ow = state.overworld;
  if (!ow || ow.combat || !nearNpc || paused) { panel.style.display = 'none'; lastNpcKey = ''; return; }
  const key = nearNpc.id;
  if (key === lastNpcKey) return;
  lastNpcKey = key;
  panel.style.display = 'block';
  document.getElementById('npc-panel-info').innerHTML = `<b style="color:#c9a227;">${nearNpc.emoji} ${nearNpc.name}</b> — вы подошли к объекту. Выберите действие:`;
  const actions = document.getElementById('npc-panel-actions');
  actions.innerHTML = `<button onclick="GameAPI.interactNpc('${nearNpc.id}')" style="background:linear-gradient(180deg,#2a5a3a,#1a3a2a);border-color:#60ff60;">💬 Взаимодействовать</button>`;
}

function drawMinimap(ctx, ow) {
  const size = 140, pad = 8, x0 = VIEW_W - size - pad, y0 = pad;
  const mapW = ow.cols * ow.tile, mapH = ow.rows * ow.tile; const scaleX = size / mapW, scaleY = size / mapH;
  ctx.fillStyle = 'rgba(10,6,18,0.82)'; ctx.fillRect(x0, y0, size, size);
  for (const e of ow.enemies) { if (e.dead) continue; const sx = x0 + e.x * scaleX, sy = y0 + e.y * scaleY; ctx.fillStyle = e.boss ? '#b060ff' : e.elite ? '#ffa500' : '#ff4040'; const s = e.boss ? 5 : e.elite ? 4 : 2; ctx.fillRect(sx - s / 2, sy - s / 2, s, s); }
  for (const c of ow.chests) { if (c.opened) continue; const sx = x0 + c.x * scaleX, sy = y0 + c.y * scaleY; ctx.fillStyle = '#ffd060'; ctx.fillRect(sx - 1, sy - 1, 2, 2); }
  for (const n of ow.npcs || []) { const sx = x0 + n.x * scaleX, sy = y0 + n.y * scaleY; ctx.fillStyle = '#60ff60'; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3); }
  for (const o of ow.statics || []) { const sx = x0 + o.x * scaleX, sy = y0 + o.y * scaleY; ctx.fillStyle = '#ffa500'; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3); }
  const camSx = x0 + ow.camera.x * scaleX, camSy = y0 + ow.camera.y * scaleY; const camW = VIEW_W * scaleX, camH = VIEW_H * scaleY;
  ctx.strokeStyle = 'rgba(201,162,39,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(camSx, camSy, camW, camH);
  const px = x0 + ow.player.x * scaleX, py = y0 + ow.player.y * scaleY; ctx.fillStyle = '#60ff60'; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, size, size);
}

let mapTooltipEl = null;
function onCanvasMouseMove(e) {
  const ow = state.overworld;
  if (!ow || !ow.active || paused || ow.combat || ow.defeated) { hideMapTooltip(); return; }
  const canvas = e.currentTarget; const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX + ow.camera.x, my = (e.clientY - rect.top) * scaleY + ow.camera.y;
  let hovered = null;
  for (const en of ow.enemies) { if (en.dead) continue; if (Math.hypot(en.x - mx, en.y - my) < 28) { hovered = en; break; } }
  if (!hovered) { hideMapTooltip(); return; }
  showMapTooltip(e.clientX, e.clientY, hovered);
}

const MOD_LABEL = { poisonous: '☣️ ядовитый', armored: '🛡️ бронированный', swift: '💨 стремительный', vampiric: '🧛 вампирский', regenerating: '💚 регенерирующий', berserk: '💢 берсерк' };

function showMapTooltip(cx, cy, enemy) {
  const def = ENEMIES[enemy.enemyId]; const modName = enemy.modifier ? ` (${MOD_LABEL[enemy.modifier]})` : '';
  const nameColor = enemy.boss ? '#b060ff' : enemy.elite ? '#ffd060' : '#c9a227'; const prefix = enemy.boss ? '☠ ' : enemy.elite ? '★ ' : '';
  let html = `<div class="map-tt-name" style="color:${nameColor};">${prefix}${def.name}${modName}</div>`;
  html += `<div class="map-tt-row">❤️ HP: ${enemy.hp}/${enemy.maxHp}</div><div class="map-tt-row">⚔️ Атака: ${def.attack}</div><div class="map-tt-row">🛡️ Защита: ${def.defense}</div>`;
  if (enemy.elite) html += `<div class="map-tt-row" style="color:#ffd060;">★ Элитный (HP×1.5, атака×1.3)</div>`;
  if (enemy.boss) html += `<div class="map-tt-row" style="color:#b060ff;">☠ Мини-босс</div>`;
  if (def.special) html += `<div class="map-tt-row" style="color:#ffa500;">⚠️ ${def.special.name} (кажд. ${def.special.every} х.)</div>`;
  if (!mapTooltipEl) { mapTooltipEl = document.createElement('div'); mapTooltipEl.id = 'map-tooltip'; mapTooltipEl.className = 'map-tooltip'; document.body.appendChild(mapTooltipEl); }
  mapTooltipEl.innerHTML = html;
  const pad = 16; let x = cx + pad, y = cy + pad; const rect = mapTooltipEl.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 10) x = cx - rect.width - pad; if (y + rect.height > window.innerHeight - 10) y = cy - rect.height - pad; if (x < 10) x = 10; if (y < 10) y = 10;
  mapTooltipEl.style.left = x + 'px'; mapTooltipEl.style.top = y + 'px';
}

function hideMapTooltip() { if (mapTooltipEl) { mapTooltipEl.remove(); mapTooltipEl = null; } }

function openPauseMenu() {
  if (document.getElementById('pause-overlay')) return;
  paused = true; hideMapTooltip();
  const div = document.createElement('div'); div.id = 'pause-overlay'; div.className = 'pause-overlay';
  div.innerHTML = `<div class="pause-panel"><h2>⏸️ Пауза</h2><button onclick="GameAPI.owPauseResume()">▶️ Продолжить</button><button onclick="GameAPI.owPauseSaveVillage()">💾 Сохранить и в деревню</button><button onclick="GameAPI.owPauseExit()">🚪 Сохранить и в меню</button></div>`;
  document.body.appendChild(div);
}

function closePauseMenu() { const el = document.getElementById('pause-overlay'); if (el) el.remove(); paused = false; }
export function owPauseResume() { closePauseMenu(); }
export function owPauseSaveVillage() { saveGame(); closePauseMenu(); exitOverworld(); }
export function owPauseExit() { saveGame(); closePauseMenu(); state.overworld = null; emit('overworld:end'); saveAndMenu(); }

const EFFECTS_DATA = { poison: { name: 'Отравление', icon: '☠️', color: '#60a060' }, burn: { name: 'Ожог', icon: '🔥', color: '#ff6020' }, bleed: { name: 'Кровотечение', icon: '🩸', color: '#d63030' }, stun: { name: 'Оглушение', icon: '💫', color: '#d6c030' }, atkBuff: { name: 'Боевой клич', icon: '📢', color: '#ffd060' }, defBuff: { name: 'Щит маны', icon: '🛡️', color: '#60a0ff' }, lifesteal: { name: 'Кровожадность', icon: '🩸', color: '#d63030' }, strength: { name: 'Эликсир силы', icon: '💪', color: '#ff9060' }, manaShield: { name: 'Эликсир маны', icon: '💧', color: '#60d0ff' }, elderBlessing: { name: 'Благословение', icon: '✨', color: '#ffd060' } };
const MODIFIERS_LABEL = { poisonous: { name: 'Ядовитый', prefix: '☣️', color: '#60a060' }, armored: { name: 'Бронированный', prefix: '🛡️', color: '#a0a0a0' }, swift: { name: 'Стремительный', prefix: '💨', color: '#60a0ff' }, vampiric: { name: 'Вампирский', prefix: '🧛', color: '#800060' }, regenerating: { name: 'Регенерирующий', prefix: '💚', color: '#60ff60' }, berserk: { name: 'Берсерк', prefix: '💢', color: '#ff4040' } };

function renderCombatPanel() {
  const panel = document.getElementById('combat-panel'); if (!panel) return;
  const ow = state.overworld; if (!ow || !ow.combat) { panel.style.display = 'none'; lastPanelKey = ''; return; }
  const c = ow.combat; const p = state.game.player; const cls = CLASSES[p.class];
  const cdKey = cls.abilities?.map(a => `${a.id}:${p.cooldowns?.[a.id] || 0}`).join(',') || '';
  const pEffKey = (p.effects || []).map(e => `${e.id}:${e.duration}`).join(','); const eEffKey = (c.enemy.effects || []).map(e => `${e.id}:${e.duration}`).join(',');
  const key = `${c.turn}|${c.enemy.hp}|${subPanel}|${p.hp}|${p.mp}|${p.inventory.length}|${ow.log.length}|${c.turnCount}|${c.blocking}|${cdKey}|${pEffKey}|${eEffKey}|${c.playerChargeNext}|${ow.rifFloor}|${ow.rifMode}`;
  if (key === lastPanelKey) return; lastPanelKey = key;
  panel.style.display = 'block'; const def = ENEMIES[c.enemy.enemyId]; const prefix = c.enemy.boss ? '☠ ' : c.enemy.elite ? '★ ' : '';
  const nameColor = c.enemy.boss ? '#b060ff' : c.enemy.elite ? '#ffd060' : '#d4c8a8';
  let specialLine = '';
  if (def.special) { const every = def.special.every; const rem = every - (c.turnCount % every); if (rem === 1) specialLine = ` · <span style="color:#ff4040;font-weight:bold;">⚠️ ${def.special.name} — следующий ход!</span>`; else specialLine = ` · <span style="color:#ffa500;">${def.special.name} через ${rem} хода</span>`; }
  const blockLine = c.blocking ? ` · <span style="color:#60ff60;">🛡️ блок</span>` : ''; const modLine = c.enemy.modifier ? ` · <span style="color:${MODIFIERS_LABEL[c.enemy.modifier].color};">${MODIFIERS_LABEL[c.enemy.modifier].prefix} ${MODIFIERS_LABEL[c.enemy.modifier].name}</span>` : '';
  const chargeLine = c.playerChargeNext ? ` · <span style="color:#ffd060;">⚡ рывок готов</span>` : ''; const riftLine = ow.rifMode ? ` · <span style="color:#b060ff;font-weight:bold;">🌀 Этаж ${ow.rifFloor}</span>` : '';
  const renderEffectBadges = (effects) => { if (!effects || !effects.length) return ''; return '<div style="display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle;">' + effects.map(e => { const d = EFFECTS_DATA[e.id]; if (!d) return ''; return `<span class="fx-badge" style="border-color:${d.color};color:${d.color};" title="${d.name} (${e.duration})">${d.icon}${e.duration}</span>`; }).join('') + '</div>'; };
  const playerEffects = renderEffectBadges(p.effects); const enemyEffects = renderEffectBadges(c.enemy.effects);
  const hotkeyHint = subPanel ? `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1]–[9] — выбрать · [Esc] — отмена</div>` : `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1] Атака · [2] Магия · [3] Предмет · [4] Побег · [5] Блок · [6] Способность · [Пробел] — быстрая атака · [Esc] — выйти</div>`;
  document.getElementById('combat-panel-info').innerHTML = `⚔️ <b style="color:${nameColor};">${prefix}${def.name}</b> — ${c.enemy.hp}/${c.enemy.maxHp} HP${enemyEffects}${riftLine} · Ход: ${c.turn === 'player' ? '<span style="color:#60ff60;">ваш</span>' : '<span style="color:#ff6060;">врага</span>'}${specialLine}${blockLine}${modLine}${chargeLine}<br><small style="color:#a89060;">Вы${playerEffects} · ${ow.log.slice(-2).map(l => l.msg).join(' · ')}</small>` + hotkeyHint;
  
  const actions = document.getElementById('combat-panel-actions');
  if (c.turn !== 'player') { actions.innerHTML = `<button disabled style="grid-column:1/-1;">Ход противника...</button>`; return; }
  
  if (subPanel === 'spells') { 
    const btns = p.spells.map((id, i) => { 
      const sp = SPELLS[id]; 
      let disabled = p.mp < sp.cost;
      if (id === 'sacrifice') disabled = p.hp <= p.maxHp * sp.selfDamagePct;
      return `<button onclick="GameAPI.owCast('${id}')" ${disabled ? 'disabled' : ''} style="font-size:13px;">[${i + 1}] ${sp.icon} ${sp.name} ${sp.cost > 0 ? `(${sp.cost})` : '(0)'}</button>`; 
    }).join(''); 
    actions.innerHTML = btns + `<button onclick="GameAPI.owCloseSub()" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`; 
    return; 
  }
  
  if (subPanel === 'items') { 
    const items = p.inventory.filter(it => ITEMS[it.id].type === 'consumable'); 
    const btns = items.map((it, i) => { const item = ITEMS[it.id]; return `<button onclick="GameAPI.owUseItem('${it.id}')" style="font-size:13px;">[${i + 1}] ${item.icon} ${item.name} ×${it.qty}</button>`; }).join(''); 
    actions.innerHTML = (btns || `<p style="color:#a89060;grid-column:1/-1;text-align:center;">Нет предметов</p>`) + `<button onclick="GameAPI.owCloseSub()" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`; 
    return; 
  }
  
  if (subPanel === 'abilities') { 
    const abilities = cls.abilities || []; 
    const btns = abilities.filter(a => !a.passive).map((a, i) => { const cd = p.cooldowns?.[a.id] || 0; const noMp = p.mp < (a.cost || 0); const can = cd === 0 && !noMp; const label = cd > 0 ? `⌛ ${cd}` : (noMp ? 'мало' : `${a.cost || 0}`); return `<button onclick="GameAPI.owUseAbility('${a.id}')" ${can ? '' : 'disabled'} style="font-size:13px;" title="${a.desc}">[${i + 1}] ${a.icon} ${a.name} <small style="color:#a89060;">(${label})</small></button>`; }).join(''); 
    actions.innerHTML = btns + `<button onclick="GameAPI.owCloseSub()" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`; 
    return; 
  }

  const hideMagic = p.class === 'warrior';
  actions.innerHTML = `
    <button onclick="GameAPI.owAttack()">[1] ⚔️ Атака</button>
    ${!hideMagic ? `<button onclick="GameAPI.owOpenSpells()" ${p.spells.length === 0 ? 'disabled' : ''}>[2] ✨ Магия</button>` : ''}
    <button onclick="GameAPI.owOpenItems()" ${p.inventory.filter(i => ITEMS[i.id].type === 'consumable').length === 0 ? 'disabled' : ''}>[3] 🎒 Предмет</button>
    <button onclick="GameAPI.owFlee()">[4] 🏃 Побег</button>
    <button onclick="GameAPI.owBlock()" style="background:linear-gradient(180deg,#2a5a8b,#1a3a6a);border-color:#60a0ff;">[5] 🛡️ Блок</button>
    <button onclick="GameAPI.owOpenAbilities()" style="background:linear-gradient(180deg,#5a2a7a,#3a1a4a);border-color:#b060ff;">[6] ✨ Способность</button>`;
}

export function owOpenSpells() { subPanel = 'spells'; renderCombatPanel(); }
export function owOpenItems() { subPanel = 'items'; renderCombatPanel(); }
export function owOpenAbilities() { subPanel = 'abilities'; renderCombatPanel(); }
export function owCloseSub() { subPanel = null; renderCombatPanel(); }
export function owAttack() { combatAttack(); subPanel = null; renderCombatPanel(); }
export function owCast(id) { combatCastSpell(id); subPanel = null; renderCombatPanel(); }
export function owUseItem(id) { combatUseItem(id); subPanel = null; renderCombatPanel(); }
export function owBlock() { combatBlock(); subPanel = null; renderCombatPanel(); }
export function owUseAbility(id) { combatUseAbility(id); subPanel = null; renderCombatPanel(); }
export function owFlee() { combatFlee(false); subPanel = null; renderCombatPanel(); }