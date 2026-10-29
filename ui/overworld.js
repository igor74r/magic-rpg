import { state } from '../systems/state.js';
import {
  tryMovePlayer, updateOverworld, exitOverworld,
  combatFlee
} from '../systems/overworld.js';
import { getEffStats } from '../systems/stats.js';
import { saveGame } from '../systems/save.js';
import { saveAndMenu } from './menu.js';
import { LOCATIONS } from '../data/locations.js';
import { ENEMIES } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { emit } from '../systems/events.js';
import { drawPlayerByClass, drawEnemyByType, drawStatic, EFFECTS_DATA, MODIFIERS_LABEL } from './overworld/models.js';
import { 
  renderCombatPanel, getSubPanel, setSubPanel, 
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub, 
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee 
} from './overworld/combat-panel.js';

const VIEW_W = 800, VIEW_H = 500;
let rafId = null, lastTs = 0, listenersAttached = false, lastNpcKey = '', autosaveTimer = null, autosaveAt = 0, paused = false, nearNpc = null;

const THEMES = {
  default: { colors: { 0: '#2a4a2a', 1: '#6a5a3a', 2: '#1a3a1a', 3: '#1a3a6a', 4: '#5a5a5a' }, vignette: 0.4, shadow: 'rgba(0,0,0,0.4)' },
  village: { colors: { 0: '#4a6a4a', 1: '#7a6a5a', 2: '#5a4a3a', 3: '#4a8ac8', 4: '#8a7a6a' }, vignette: 0.1, shadow: 'rgba(0,0,0,0.2)' },
  swamp: { colors: { 0: '#2a3a1a', 1: '#4a3a1a', 2: '#1a2a1a', 3: '#2a4a5a', 4: '#3a2a2a' }, vignette: 0.7, shadow: 'rgba(0,0,0,0.6)' },
  graveyard: { colors: { 0: '#1a1a2a', 1: '#4a4a5a', 2: '#0a0a1a', 3: '#2a2a4a', 4: '#6a5a5a' }, vignette: 0.85, shadow: 'rgba(0,0,0,0.8)' },
  volcano: { colors: { 0: '#3a1a0a', 1: '#5a3a0a', 2: '#1a0a0a', 3: '#ff6020', 4: '#2a1a1a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.5)' },
  ice: { colors: { 0: '#2a3a5a', 1: '#6a7a9a', 2: '#1a2a4a', 3: '#6ac8ff', 4: '#a0c0d0' }, vignette: 0.5, shadow: 'rgba(0,0,0,0.3)' },
  desert: { colors: { 0: '#8a6a3a', 1: '#a08050', 2: '#6a4a2a', 3: '#4a8ac8', 4: '#5a4a3a' }, vignette: 0.35, shadow: 'rgba(0,0,0,0.25)' },
  library: { colors: { 0: '#2a1a3a', 1: '#5a3a6a', 2: '#1a0a2a', 3: '#6a3a9a', 4: '#4a3a5a' }, vignette: 0.75, shadow: 'rgba(0,0,0,0.7)' },
  dragon: { colors: { 0: '#3a1a0a', 1: '#5a2a0a', 2: '#1a0a0a', 3: '#ff4010', 4: '#4a2a1a' }, vignette: 0.8, shadow: 'rgba(0,0,0,0.7)' }
};

const MOD_LABEL = { poisonous: '☣️ ядовитый', armored: '🛡️ бронированный', swift: '💨 стремительный', vampiric: '🧛 вампирский', regenerating: '💚 регенерирующий', berserk: '💢 берсерк' };

function getTheme(name) { return THEMES[name] || THEMES.default; }

export function initOverworld() {
  if (!listenersAttached) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    listenersAttached = true;
    const canvas = document.getElementById('overworld-canvas');
    if (canvas) { canvas.addEventListener('mousemove', onCanvasMouseMove); canvas.addEventListener('mouseleave', hideMapTooltip); }
  }
  setSubPanel(null); lastNpcKey = ''; paused = false; nearNpc = null;
  closePauseMenu(); startAutosave();
  if (!rafId) { lastTs = performance.now(); rafId = requestAnimationFrame(tick); }
  renderCombatPanel(); renderNpcPanel();
}

function startAutosave() {
  if (autosaveTimer) return;
  autosaveTimer = setInterval(() => {
    const ow = state.overworld;
    if (ow && ow.active && !ow.combat && !ow.defeated && !paused && state.settings?.autoSave !== false) { saveGame(); autosaveAt = performance.now(); }
  }, 30000);
}

function getLogicalKey(e) {
  const code = e.code;
  if (code === 'KeyW' || code === 'ArrowUp') return 'w';
  if (code === 'KeyS' || code === 'ArrowDown') return 's';
  if (code === 'KeyA' || code === 'ArrowLeft') return 'a';
  if (code === 'KeyD' || code === 'ArrowRight') return 'd';
  if (code === 'Space') return ' ';
  if (code === 'Escape') return 'escape';
  if (code === 'Digit1' || code === 'Numpad1') return '1';
  if (code === 'Digit2' || code === 'Numpad2') return '2';
  if (code === 'Digit3' || code === 'Numpad3') return '3';
  if (code === 'Digit4' || code === 'Numpad4') return '4';
  if (code === 'Digit5' || code === 'Numpad5') return '5';
  if (code === 'Digit6' || code === 'Numpad6') return '6';
  return e.key.toLowerCase();
}

function onKeyDown(e) {
  if (!state.overworld || !state.overworld.active) return;
  const k = getLogicalKey(e);
  if (paused) { if (k === 'escape') { e.preventDefault(); closePauseMenu(); } return; }
  if (k === 'escape') {
    e.preventDefault(); if (state.overworld.defeated) return;
    if (getSubPanel()) { setSubPanel(null); renderCombatPanel(); }
    else if (state.overworld.combat) { if (confirm('Сбежать из боя? Это считается побегом.')) combatFlee(false); }
    else openPauseMenu();
    return;
  }
  if (state.overworld.defeated) return;

  if (state.overworld.combat) {
    const c = state.overworld.combat;
    if (getSubPanel()) {
      const n = parseInt(k, 10);
      if (!isNaN(n) && n >= 1) {
        e.preventDefault();
        if (getSubPanel() === 'spells') { const id = state.game.player.spells[n - 1]; if (id) owCast(id); }
        else if (getSubPanel() === 'items') { const items = state.game.player.inventory.filter(it => ITEMS[it.id]?.type === 'consumable'); const it = items[n - 1]; if (it) owUseItem(it.id); }
        else if (getSubPanel() === 'abilities') { const cls = CLASSES[state.game.player.class]; const abs = (cls.abilities || []).filter(a => !a.passive); const ab = abs[n - 1]; if (ab) owUseAbility(ab.id); }
      }
      return;
    }
    if (c.turn !== 'player') return;
    if (k === ' ' || k === '1') { e.preventDefault(); owAttack(); return; }
    if (k === '2') { e.preventDefault(); owOpenSpells(); return; }
    if (k === '3') { e.preventDefault(); owOpenItems(); return; }
    if (k === '4') { e.preventDefault(); owFlee(); return; }
    if (k === '5') { e.preventDefault(); owBlock(); return; }
    if (k === '6') { e.preventDefault(); owOpenAbilities(); return; }
    return;
  }
  if (['w', 'a', 's', 'd'].includes(k)) { e.preventDefault(); state.overworld.keys[k] = true; }
}

function onKeyUp(e) {
  if (!state.overworld) return;
  const k = getLogicalKey(e);
  state.overworld.keys[k] = false;
}

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

function drawTile(ctx, type, x, y, size, themeName, colors) {
  const half = size / 2;
  ctx.fillStyle = colors[type] || '#2a4a2a';
  ctx.fillRect(x, y, size, size);

  if (type === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x + 10, y + 15, 2, 6);
    ctx.fillRect(x + 30, y + 25, 2, 6);
    ctx.fillRect(x + 20, y + 35, 2, 6);
  } else if (type === 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(x, y + size - 2, size, 2);
  } else if (type === 2) {
    if (themeName === 'village') {
      ctx.fillStyle = '#8a7a6a';
      ctx.fillRect(x + 8, y + 16, size - 16, size - 16);
      ctx.fillStyle = '#6a3a2a';
      ctx.beginPath();
      ctx.moveTo(x, y + 16); ctx.lineTo(x + half, y); ctx.lineTo(x + size, y + 16);
      ctx.fill();
    } else {
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(x + 18, y + 30, 12, 18);
      ctx.fillStyle = '#1e4d1e';
      ctx.beginPath();
      ctx.moveTo(x + half, y + 4); ctx.lineTo(x + size - 4, y + 34); ctx.lineTo(x + 4, y + 34);
      ctx.fill();
      ctx.fillStyle = '#2a6a2a';
      ctx.beginPath();
      ctx.moveTo(x + half, y + 12); ctx.lineTo(x + size - 8, y + 38); ctx.lineTo(x + 8, y + 38);
      ctx.fill();
    }
  } else if (type === 3) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.quadraticCurveTo(x + 12, y + 5, x + 24, y + 10);
    ctx.quadraticCurveTo(x + 36, y + 15, x + 48, y + 10);
    ctx.stroke();
  } else if (type === 4) {
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 30); ctx.lineTo(x + 20, y + 10); ctx.lineTo(x + 40, y + 15); ctx.lineTo(x + 38, y + 38);
    ctx.fill();
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawHud(ctx, p, stats, pClass) {
  const hudX = 12, hudY = 12;
  ctx.fillStyle = 'rgba(10, 6, 18, 0.85)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(hudX, hudY, 200, 80, 8);
  else ctx.rect(hudX, hudY, 200, 80);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 12px Montserrat, sans-serif';

  const hpPct = p.hp / p.maxHp;
  ctx.fillStyle = '#333'; ctx.fillRect(hudX + 10, hudY + 15, 180, 12);
  ctx.fillStyle = '#ff4444'; ctx.fillRect(hudX + 10, hudY + 15, 180 * hpPct, 12);
  ctx.fillStyle = '#fff'; ctx.fillText(`HP ${p.hp}/${p.maxHp}`, hudX + 15, hudY + 21);

  const mpPct = p.mp / p.maxMp;
  const mpColor = pClass === 'warrior' ? '#d000ff' : '#00c3ff';
  ctx.fillStyle = '#333'; ctx.fillRect(hudX + 10, hudY + 35, 180, 12);
  ctx.fillStyle = mpColor; ctx.fillRect(hudX + 10, hudY + 35, 180 * mpPct, 12);
  ctx.fillStyle = '#fff'; ctx.fillText(`${pClass === 'warrior' ? 'Ярость' : 'MP'} ${p.mp}/${p.maxMp}`, hudX + 15, hudY + 41);

  ctx.fillStyle = '#ffd060'; ctx.fillText(`⚔️ Урон: ${stats.atk}`, hudX + 10, hudY + 65);
  ctx.fillStyle = '#60ff60'; ctx.fillText(`🛡️ Броня: ${stats.def}`, hudX + 115, hudY + 65);
}

function render() {
  const canvas = document.getElementById('overworld-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); const ow = state.overworld; const cam = ow.camera; const theme = getTheme(ow.theme);

  ctx.save();
  if (ow.shake && ow.shake.t > 0) ctx.translate((Math.random() * 2 - 1) * ow.shake.mag, (Math.random() * 2 - 1) * ow.shake.mag);
  ctx.fillStyle = '#05020a'; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  const time = performance.now() * 0.001; ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc((i * 137 + Math.sin(time + i) * 20) % VIEW_W, (i * 73 + Math.cos(time * 0.5 + i) * 15) % VIEW_H, 1.5, 0, Math.PI * 2); ctx.fill(); }

  const startCol = Math.max(0, Math.floor(cam.x / ow.tile)), startRow = Math.max(0, Math.floor(cam.y / ow.tile));
  const endCol = Math.min(ow.cols, startCol + Math.ceil(VIEW_W / ow.tile) + 1), endRow = Math.min(ow.rows, startRow + Math.ceil(VIEW_H / ow.tile) + 1);

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      drawTile(ctx, ow.map[y][x], x * ow.tile - cam.x, y * ow.tile - cam.y, ow.tile, ow.locationId, theme.colors);
    }
  }

  for (const c of ow.chests) {
    if (c.opened) continue;
    const sx = c.x - cam.x, sy = c.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    ctx.shadowBlur = 12; ctx.shadowColor = '#ffcc00';
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(sx - 12, sy - 10, 24, 14);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(sx - 12, sy - 2, 24, 14);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(sx - 12, sy - 2, 24, 3);
  }

  const p = ow.player; nearNpc = null;

  for (const obj of ow.statics || []) {
    const sx = obj.x - cam.x, sy = obj.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(obj.x - p.x, obj.y - p.y);
    if (dist < obj.interactionRadius && !ow.combat) {
      nearNpc = obj;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    drawStatic(ctx, obj, sx, sy, theme.shadow);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(obj.name, sx, sy - 24); ctx.fillStyle = '#d4c8a8'; ctx.fillText(obj.name, sx, sy - 24);
  }

  for (const npc of ow.npcs || []) {
    const sx = npc.x - cam.x, sy = npc.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
    if (dist < npc.interactionRadius && !ow.combat) {
      nearNpc = npc;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    drawStatic(ctx, npc, sx, sy, theme.shadow);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(npc.name, sx, sy - 24); ctx.fillStyle = '#d4c8a8'; ctx.fillText(npc.name, sx, sy - 24);
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
      ctx.fillStyle = `rgba(180,60,255,${0.2 + pulse * 0.2})`; ctx.beginPath(); ctx.arc(sx, sy, 34 + pulse * 5, 0, Math.PI * 2); ctx.fill();
    }
    if (e.state === 'chase') {
      ctx.fillStyle = 'rgba(255,60,60,0.15)'; ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI * 2); ctx.fill();
    }
    drawEnemyByType(ctx, e, sx, sy, theme.shadow);

    const distToPlayer = Math.hypot(e.x - ow.player.x, e.y - ow.player.y);
    if (distToPlayer < 300) {
      const def = ENEMIES[e.enemyId];
      const label = e.boss ? '☠ ' + def.name : e.elite ? '★ ' + def.name : def.name;
      const labelY = sy - (e.boss ? 55 : e.elite ? 45 : 32);
      ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.strokeText(label, sx, labelY); ctx.fillStyle = e.boss ? '#b060ff' : e.elite ? '#ffd060' : '#d4c8a8'; ctx.fillText(label, sx, labelY);
    }
  }

  drawPlayerByClass(ctx, p.x - cam.x, p.y - cam.y, state.game.player.class, theme.shadow);

  const px = p.x - cam.x, py = p.y - cam.y;
  const bw = 50;
  ctx.fillStyle = '#05020a'; ctx.fillRect(px - bw / 2, py - 42, bw, 4); ctx.fillRect(px - bw / 2, py - 36, bw, 3);
  ctx.fillStyle = '#d63030'; ctx.fillRect(px - bw / 2, py - 42, bw * (p.hp / p.maxHp), 4);
  ctx.fillStyle = state.game.player.class === 'warrior' ? '#d000ff' : '#3060d6';
  ctx.fillRect(px - bw / 2, py - 36, bw * (p.mp / p.maxMp), 3);

  for (const part of ow.particles || []) {
    const sx = part.x - cam.x, sy = part.y - cam.y;
    if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, part.life / part.maxLife)); ctx.fillStyle = part.color;
    ctx.shadowBlur = 8; ctx.shadowColor = part.color;
    ctx.beginPath(); ctx.arc(sx, sy, part.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  for (const fn of ow.floatingNumbers) {
    const sx = fn.x - cam.x, sy = fn.y - cam.y;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, fn.life)); ctx.font = 'bold 22px Montserrat, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = fn.type === 'heal' ? '#60ff60' : fn.type === 'crit' ? '#ffd060' : '#ff4040'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(fn.text, sx, sy); ctx.fillText(fn.text, sx, sy); ctx.restore();
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
  drawHud(ctx, p, stats, state.game.player.class);
  ctx.restore();

  drawMinimap(ctx, ow);
  if (performance.now() - autosaveAt < 1500) {
    ctx.font = 'bold 12px Montserrat, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
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
  document.getElementById('npc-panel-info').innerHTML = `<b style="color:#c9a227;">${nearNpc.name}</b> — вы подошли к объекту. Выберите действие:`;
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

// Экспортируем всё для main.js
export { 
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub, 
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee 
};