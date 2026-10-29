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

let weatherParticles = [];
let footprints = [];
let lastFootprintPos = { x: 0, y: 0 };
let hurtFlash = 0;
let worldTime = 0; // Для смены дня и ночи
let deathParticles = []; // Частицы при смерти врагов

const THEMES = {
  default:   { colors: { 0: '#1a2e1a', 1: '#3a2a1a', 2: '#0f170f', 3: '#101a2e', 4: '#2a2a2a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.5)', fog: 0.85, weather: 'none' },
  village:   { colors: { 0: '#2a3a2a', 1: '#4a3a2a', 2: '#3a2a1a', 3: '#2a4a6a', 4: '#4a4a3a' }, vignette: 0.3, shadow: 'rgba(0,0,0,0.3)', fog: 0.6, weather: 'none' },
  forest:    { colors: { 0: '#0f1a0f', 1: '#2a1a0a', 2: '#050a05', 3: '#0a2a3a', 4: '#1a1a0a' }, vignette: 0.7, shadow: 'rgba(0,0,0,0.6)', fog: 0.9, weather: 'rain' },
  ruins:     { colors: { 0: '#2a2a2a', 1: '#3a3a3a', 2: '#1a1a1a', 3: '#2a3a4a', 4: '#4a4a4a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.5)', fog: 0.85, weather: 'none' },
  shadow:    { colors: { 0: '#0a000a', 1: '#1a0a1a', 2: '#050005', 3: '#2a0a3a', 4: '#1a0a1a' }, vignette: 0.9, shadow: 'rgba(0,0,0,0.9)', fog: 0.98, weather: 'ash' },
  swamp:     { colors: { 0: '#1a2a0a', 1: '#2a1a0a', 2: '#0a1a0a', 3: '#1a2a3a', 4: '#1a1a1a' }, vignette: 0.8, shadow: 'rgba(0,0,0,0.7)', fog: 0.9, weather: 'rain' },
  graveyard: { colors: { 0: '#0a0a1a', 1: '#2a2a3a', 2: '#05050a', 3: '#1a1a2a', 4: '#3a3a3a' }, vignette: 0.85, shadow: 'rgba(0,0,0,0.8)', fog: 0.95, weather: 'none' },
  volcano:   { colors: { 0: '#1a0a00', 1: '#2a1a00', 2: '#0a0000', 3: '#8a2a00', 4: '#1a0a0a' }, vignette: 0.7, shadow: 'rgba(0,0,0,0.6)', fog: 0.85, weather: 'embers' },
  ice:       { colors: { 0: '#1a2a4a', 1: '#3a4a6a', 2: '#0a1a2a', 3: '#4a8aaa', 4: '#6a8a9a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.4)', fog: 0.8, weather: 'snow' },
  desert:    { colors: { 0: '#5a4a2a', 1: '#6a5a3a', 2: '#3a2a1a', 3: '#2a5a7a', 4: '#3a3a2a' }, vignette: 0.5, shadow: 'rgba(0,0,0,0.35)', fog: 0.7, weather: 'none' },
  library:   { colors: { 0: '#1a0a2a', 1: '#3a1a4a', 2: '#0a001a', 3: '#4a1a7a', 4: '#2a1a3a' }, vignette: 0.8, shadow: 'rgba(0,0,0,0.7)', fog: 0.9, weather: 'none' },
  dragon:    { colors: { 0: '#1a0a00', 1: '#2a0a00', 2: '#0a0000', 3: '#8a1a00', 4: '#2a0a0a' }, vignette: 0.85, shadow: 'rgba(0,0,0,0.8)', fog: 0.9, weather: 'embers' }
};

const MOD_LABEL = { poisonous: '☣️ ядовитый', armored: '🛡️ бронированный', swift: '💨 стремительный', vampiric: '🧛 вампирский', regenerating: '💚 регенерирующий', berserk: '💢 берсерк' };

function getTheme(name) { return THEMES[name] || THEMES.default; }

function initWeather(themeName) {
  weatherParticles = [];
  const theme = getTheme(themeName);
  const count = theme.weather === 'none' ? 0 : 50;
  for (let i = 0; i < count; i++) {
    weatherParticles.push({
      x: Math.random() * VIEW_W, y: Math.random() * VIEW_H,
      speed: 2 + Math.random() * 4, size: Math.random() * 2 + 1, angle: Math.random() * Math.PI * 2
    });
  }
}

export function initOverworld() {
  if (!listenersAttached) {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    listenersAttached = true;
    const canvas = document.getElementById('overworld-canvas');
    if (canvas) { canvas.addEventListener('mousemove', onCanvasMouseMove); canvas.addEventListener('mouseleave', hideMapTooltip); }
  }
  setSubPanel(null); lastNpcKey = ''; paused = false; nearNpc = null;
  footprints = []; deathParticles = []; hurtFlash = 0; worldTime = 0;
  initWeather(state.overworld ? state.overworld.locationId : 'default');
  closePauseMenu(); startAutosave();
  if (!rafId) { lastTs = performance.now(); rafId = requestAnimationFrame(tick); }
  renderCombatPanel(); renderNpcPanel();
  initMobileDpad();
}

function initMobileDpad() {
  const dpad = document.getElementById('mobile-dpad');
  if (!dpad) return;
  if (dpad.dataset.bound) return;
  if (!window.matchMedia('(pointer: coarse)').matches && window.innerWidth >= 900) return;
  dpad.style.display = 'block';
  dpad.dataset.bound = '1';
  dpad.querySelectorAll('.dpad-btn').forEach(btn => {
    const key = btn.dataset.key;
    const setKey = (val) => { if (state.overworld) state.overworld.keys[key] = val; };
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); setKey(true); }, { passive: false });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); setKey(false); }, { passive: false });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); setKey(false); }, { passive: false });
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); setKey(true); });
    btn.addEventListener('mouseup', () => setKey(false));
    btn.addEventListener('mouseleave', () => setKey(false));
  });
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
      worldTime += dt * 0.005; // Время идет

      if (!state.overworld.combat && !state.overworld.defeated) {
        const k = state.overworld.keys; let dx = 0, dy = 0;
        if (k['w'] || k['arrowup']) dy -= 1; if (k['s'] || k['arrowdown']) dy += 1;
        if (k['a'] || k['arrowleft']) dx -= 1; if (k['d'] || k['arrowright']) dx += 1;
        if (dx || dy) {
          tryMovePlayer(dx, dy);
          const p = state.overworld.player;
          if (Math.hypot(p.x - lastFootprintPos.x, p.y - lastFootprintPos.y) > 15) {
            footprints.push({ x: p.x, y: p.y + 10, life: 1.0, angle: Math.atan2(dy, dx) });
            lastFootprintPos = { x: p.x, y: p.y };
            if (footprints.length > 30) footprints.shift();
          }
        }
      }
      updateOverworld(dt);
      updateWeather(dt);

      for (let i = footprints.length - 1; i >= 0; i--) {
        footprints[i].life -= dt * 0.02;
        if (footprints[i].life <= 0) footprints.splice(i, 1);
      }

      if (hurtFlash > 0) hurtFlash -= dt * 0.05;

      // Обновление частиц смерти
      for (let i = deathParticles.length - 1; i >= 0; i--) {
        let p = deathParticles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 0.2 * dt; // Гравитация
        p.life -= dt * 0.03;
        if (p.life <= 0) deathParticles.splice(i, 1);
      }
    }
    render(); renderCombatPanel(); renderNpcPanel();
  }
  rafId = requestAnimationFrame(tick);
}

function updateWeather(dt) {
  const theme = getTheme(state.overworld.locationId);
  if (theme.weather === 'none') return;
  for (let p of weatherParticles) {
    if (theme.weather === 'rain') {
      p.y += p.speed * 3 * dt; p.x -= p.speed * 1.5 * dt;
      if (p.y > VIEW_H) { p.y = -10; p.x = Math.random() * VIEW_W + 100; }
      if (p.x < -10) p.x = VIEW_W + 10;
    } else if (theme.weather === 'snow') {
      p.y += p.speed * 0.5 * dt; p.x += Math.sin(performance.now() / 1000 + p.angle) * 0.5 * dt;
      if (p.y > VIEW_H) { p.y = -10; p.x = Math.random() * VIEW_W; }
    } else if (theme.weather === 'embers' || theme.weather === 'ash') {
      p.y -= p.speed * 0.3 * dt; p.x += Math.sin(performance.now() / 800 + p.angle) * 0.8 * dt;
      if (p.y < -10) { p.y = VIEW_H + 10; p.x = Math.random() * VIEW_W; }
    }
  }
}

function drawWeather(ctx) {
  const theme = getTheme(state.overworld.locationId);
  if (theme.weather === 'none') return;
  ctx.save();
  if (theme.weather === 'rain') {
    ctx.strokeStyle = 'rgba(150, 180, 255, 0.3)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let p of weatherParticles) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 4, p.y + 12); } ctx.stroke();
  } else if (theme.weather === 'snow') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let p of weatherParticles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
  } else if (theme.weather === 'embers') {
    ctx.fillStyle = 'rgba(255, 100, 0, 0.8)'; ctx.shadowBlur = 8; ctx.shadowColor = '#ff4000';
    for (let p of weatherParticles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
  } else if (theme.weather === 'ash') {
    ctx.fillStyle = 'rgba(80, 60, 80, 0.4)';
    for (let p of weatherParticles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

// ==================== ОТРИСОВКА ТАЙЛОВ ====================
function drawTile(ctx, type, x, y, size, themeName, colors) {
  const half = size / 2;
  ctx.fillStyle = colors[type] || '#2a4a2a';
  ctx.fillRect(x, y, size, size);

  if (type === 0 || type === 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x, y + size - 4, size, 4);
  }

  if (type === 0) {
    // Колышущаяся трава
    const wind = Math.sin(worldTime * 2 + x * 0.05) * 3;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.moveTo(x + 10, y + 30); ctx.quadraticCurveTo(x + 15 + wind, y + 25, x + 15 + wind, y + 20); ctx.lineTo(x + 18, y + 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 30, y + 40); ctx.quadraticCurveTo(x + 35 + wind, y + 35, x + 35 + wind, y + 30); ctx.lineTo(x + 38, y + 40); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 25, y + 10, 3, 2); ctx.fillRect(x + 5, y + 45, 2, 2);
  } else if (type === 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(x + 10, y + 10, 4, 3); ctx.fillRect(x + 30, y + 25, 5, 4); ctx.fillRect(x + 15, y + 40, 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 20, y + 15, 2, 2);
  } else if (type === 2) {
    if (themeName === 'village') {
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 6, y + 16, size - 12, size - 12);
      ctx.fillStyle = '#5a2a1a'; ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + half, y - 2); ctx.lineTo(x + size, y + 18); ctx.fill();
      ctx.fillStyle = '#ffcc00'; ctx.fillRect(x + 18, y + 26, 8, 8);
      ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x + 22, y + 26, 1, 8); ctx.fillRect(x + 18, y + 30, 8, 1);
    } else {
      const wind = Math.sin(worldTime * 1.5 + x * 0.02) * 2;
      ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x + half - 4, y + 32, 8, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + half, y + 28, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f2a0f'; ctx.beginPath(); ctx.arc(x + half + wind, y + 24, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a3a1a'; ctx.beginPath(); ctx.arc(x + half - 4 + wind, y + 20, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a4a2a'; ctx.beginPath(); ctx.arc(x + half + 2 + wind, y + 18, 10, 0, Math.PI * 2); ctx.fill();
    }
  } else if (type === 3) {
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    const offset = (performance.now() / 20) % 20;
    ctx.beginPath(); ctx.moveTo(x + offset, y + 12); ctx.quadraticCurveTo(x + 10 + offset, y + 8, x + 20 + offset, y + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10 - offset, y + 32); ctx.quadraticCurveTo(x + 20 - offset, y + 28, x + 30 - offset, y + 32); ctx.stroke();
  } else if (type === 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.ellipse(x + 20, y + 34, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.moveTo(x + 8, y + 32); ctx.lineTo(x + 18, y + 10); ctx.lineTo(x + 40, y + 14); ctx.lineTo(x + 36, y + 36); ctx.fill();
    ctx.fillStyle = '#6a6a6a'; ctx.beginPath(); ctx.moveTo(x + 18, y + 10); ctx.lineTo(x + 40, y + 14); ctx.lineTo(x + 30, y + 18); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 26, y + 16); ctx.lineTo(x + 22, y + 26); ctx.lineTo(x + 28, y + 32); ctx.stroke();
  }
}

function drawHud(ctx, p, stats, pClass) {
  const hudX = 12, hudY = 12;
  ctx.fillStyle = 'rgba(10, 6, 18, 0.85)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(hudX, hudY, 200, 80, 8); else ctx.rect(hudX, hudY, 200, 80);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.6)'; ctx.lineWidth = 2; ctx.stroke();

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
  
  ctx.fillStyle = theme.colors[0] || '#2a4a2a'; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  const time = performance.now() * 0.001; ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc((i * 137 + Math.sin(time + i) * 20) % VIEW_W, (i * 73 + Math.cos(time * 0.5 + i) * 15) % VIEW_H, 1.5, 0, Math.PI * 2); ctx.fill(); }

  const startCol = Math.max(0, Math.floor(cam.x / ow.tile)), startRow = Math.max(0, Math.floor(cam.y / ow.tile));
  const endCol = Math.min(ow.cols, startCol + Math.ceil(VIEW_W / ow.tile) + 2), endRow = Math.min(ow.rows, startRow + Math.ceil(VIEW_H / ow.tile) + 2);

  for (let y = startRow; y < endRow; y++) {
    if (!ow.map[y]) continue;
    for (let x = startCol; x < endCol; x++) {
      const tile = ow.map[y][x];
      if (tile !== undefined) drawTile(ctx, tile, x * ow.tile - cam.x, y * ow.tile - cam.y, ow.tile, ow.locationId, theme.colors);
    }
  }

  for (let f of footprints) {
    const sx = f.x - cam.x, sy = f.y - cam.y;
    if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
    ctx.save(); ctx.globalAlpha = f.life * 0.4; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(sx, sy, 4, 2, f.angle, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  for (const c of ow.chests) {
    if (c.opened) continue;
    const sx = c.x - cam.x, sy = c.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    ctx.fillStyle = theme.shadow; ctx.beginPath(); ctx.ellipse(sx, sy + 8, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2010'; ctx.fillRect(sx - 14, sy - 4, 28, 16); ctx.strokeRect(sx - 14, sy - 4, 28, 16);
    ctx.fillStyle = '#5a3a20'; ctx.beginPath(); ctx.arc(sx, sy - 4, 14, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(sx - 3, sy + 2, 6, 6);
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffcc00'; ctx.fillStyle = 'rgba(255, 204, 0, 0.4)'; ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }

  const p = ow.player; nearNpc = null;

  for (const obj of ow.statics || []) {
    const sx = obj.x - cam.x, sy = obj.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(obj.x - p.x, obj.y - p.y);
    if (dist < obj.interactionRadius && !ow.combat) {
      nearNpc = obj;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; ctx.lineWidth = 2; ctx.stroke();
    }
    drawStatic(ctx, obj, sx, sy, theme.shadow);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(obj.name, sx, sy - 30); ctx.fillStyle = '#d4c8a8'; ctx.fillText(obj.name, sx, sy - 30);
  }

  for (const npc of ow.npcs || []) {
    const sx = npc.x - cam.x, sy = npc.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(npc.x - p.x, npc.y - p.y);
    if (dist < npc.interactionRadius && !ow.combat) {
      nearNpc = npc;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; ctx.lineWidth = 2; ctx.stroke();
    }
    drawStatic(ctx, npc, sx, sy, theme.shadow);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(npc.name, sx, sy - 30); ctx.fillStyle = '#d4c8a8'; ctx.fillText(npc.name, sx, sy - 30);
  }

  for (const ev of ow.events || []) {
    const sx = ev.x - cam.x, sy = ev.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    const dist = Math.hypot(ev.x - p.x, ev.y - p.y);
    if (dist < ev.interactionRadius && !ow.combat) {
      nearNpc = ev;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'; ctx.lineWidth = 2; ctx.stroke();
    }
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    ctx.fillStyle = `rgba(255, 215, 0, ${0.1 + pulse * 0.15})`; ctx.beginPath(); ctx.arc(sx, sy, 24 + pulse * 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ev.emoji, sx, sy);
    ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.strokeText(ev.name, sx, sy - 24); ctx.fillStyle = '#ffd060'; ctx.fillText(ev.name, sx, sy - 24);
  }

  const loc = LOCATIONS[ow.locationId];
  const questEnemyId = loc?.shard && !state.game.shards[loc.shard] ? loc.shardFrom : null;
  const now = performance.now();

  for (const e of ow.enemies) {
    if (e.dead) {
      // Спавним частицы, если враг только что умер
      if (!e._hasExploded) {
        e._hasExploded = true;
        const def = ENEMIES[e.enemyId];
        const isBoss = e.boss;
        const count = isBoss ? 30 : 15;
        const color = isBoss ? '#b060ff' : e.elite ? '#ffa500' : '#d63030';
        for (let i = 0; i < count; i++) {
          deathParticles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            size: Math.random() * 4 + 2,
            color: color,
            life: 1.0
          });
        }
      }
      continue;
    }
    
    const sx = e.x - cam.x, sy = e.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    if (questEnemyId && e.enemyId === questEnemyId) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);
      ctx.fillStyle = `rgba(180,60,255,${0.15 + pulse * 0.2})`; ctx.beginPath(); ctx.arc(sx, sy, 34 + pulse * 5, 0, Math.PI * 2); ctx.fill();
    }
    if (e.state === 'chase') { ctx.fillStyle = 'rgba(255,60,60,0.1)'; ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI * 2); ctx.fill(); }
    
    let eLungeX = 0, eLungeY = 0;
    if (ow.combat && ow.combat.enemy === e && ow.combat.turn === 'enemy') {
       eLungeX = Math.cos(now / 50) * 5; 
    }
    
    drawEnemyByType(ctx, e, sx + eLungeX, sy + eLungeY, theme.shadow);

    const distToPlayer = Math.hypot(e.x - ow.player.x, e.y - ow.player.y);
    if (distToPlayer < 300) {
      const def = ENEMIES[e.enemyId];
      const label = e.boss ? '☠ ' + def.name : e.elite ? '★ ' + def.name : def.name;
      const labelY = sy - (e.boss ? 55 : e.elite ? 45 : 32);
      ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      ctx.strokeText(label, sx, labelY); ctx.fillStyle = e.boss ? '#b060ff' : e.elite ? '#ffd060' : '#d4c8a8'; ctx.fillText(label, sx, labelY);
    }
  }

  // Частицы смерти (рисуем поверх врагов, но под игроком)
  for (let p of deathParticles) {
    const sx = p.x - cam.x, sy = p.y - cam.y;
    if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8; ctx.shadowColor = p.color;
    ctx.beginPath(); ctx.arc(sx, sy, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  let pLungeX = 0, pLungeY = 0;
  if (ow.combat && ow.combat.turn === 'player' && ow.combat.lastPlayerAction) {
    const pulse = Math.sin(now / 50);
    if (pulse > 0) pLungeX = 5; 
  }

  drawPlayerByClass(ctx, p.x - cam.x + pLungeX, p.y - cam.y + pLungeY, state.game.player.class, theme.shadow);

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
    ctx.shadowBlur = 8; ctx.shadowColor = part.color; ctx.beginPath(); ctx.arc(sx, sy, part.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Улучшенные цифры урона (подпрыгивают)
  for (const fn of ow.floatingNumbers) {
    const sx = fn.x - cam.x, sy = fn.y - cam.y;
    const bounce = Math.sin(fn.life * Math.PI) * 15; // Прыжок вверх
    ctx.save(); 
    ctx.globalAlpha = Math.max(0, Math.min(1, fn.life)); 
    ctx.font = 'bold 22px Montserrat, sans-serif'; 
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
    ctx.fillStyle = fn.type === 'heal' ? '#60ff60' : fn.type === 'crit' ? '#ffd060' : '#ff4040'; 
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; 
    ctx.strokeText(fn.text, sx, sy - bounce); 
    ctx.fillText(fn.text, sx, sy - bounce); 
    ctx.restore();
    if (fn.type === 'damage' || fn.text.startsWith('-')) hurtFlash = 1.0;
  }

  if (ow.combat) {
    const e = ow.combat.enemy; const ex = e.x - cam.x, ey = e.y - cam.y;
    ctx.strokeStyle = 'rgba(201,162,39,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  }

  // ==================== СМЕНА ДНЯ И НОЧИ ====================
  // Цикл длится 120 секунд. 0-40 (день), 40-60 (закат), 60-100 (ночь), 100-120 (рассвет)
  const dayPhase = (worldTime % 120) / 120;
  let nightAlpha = 0;
  let nightColor = 'rgba(10, 20, 50, '; // Темно-синий

  if (dayPhase > 0.3 && dayPhase < 0.5) {
    // Закат
    const t = (dayPhase - 0.3) / 0.2;
    nightAlpha = t * 0.4;
    nightColor = `rgba(80, 20, 0, `; // Оранжево-красный
  } else if (dayPhase >= 0.5 && dayPhase < 0.8) {
    // Ночь
    nightAlpha = 0.5;
    nightColor = `rgba(10, 20, 50, `;
  } else if (dayPhase >= 0.8 && dayPhase < 1.0) {
    // Рассвет
    const t = (dayPhase - 0.8) / 0.2;
    nightAlpha = (1 - t) * 0.5;
    nightColor = `rgba(50, 20, 50, `;
  }

  if (nightAlpha > 0 && !['village', 'library'].includes(ow.locationId)) {
    ctx.fillStyle = nightColor + nightAlpha + ')';
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }

  // Туман войны + Свет
  const fogIntensity = ow.combat ? 0.2 : theme.fog;
  if (fogIntensity > 0) {
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = VIEW_W; fogCanvas.height = VIEW_H;
    const fctx = fogCanvas.getContext('2d');
    fctx.fillStyle = `rgba(0,0,0,${fogIntensity})`;
    fctx.fillRect(0, 0, VIEW_W, VIEW_H);

    fctx.globalCompositeOperation = 'destination-out';
    let lightGrad = fctx.createRadialGradient(px, py, 20, px, py, 180);
    lightGrad.addColorStop(0, 'rgba(0,0,0,1)'); lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
    fctx.fillStyle = lightGrad; fctx.beginPath(); fctx.arc(px, py, 180, 0, Math.PI * 2); fctx.fill();

    for (const c of ow.chests) {
      if (c.opened) continue;
      const cx = c.x - cam.x, cy = c.y - cam.y;
      if (cx < -200 || cx > VIEW_W + 200 || cy < -200 || cy > VIEW_H + 200) continue;
      const pulse = 0.5 + 0.5 * Math.sin(now / 300);
      lightGrad = fctx.createRadialGradient(cx, cy, 10, cx, cy, 80 + pulse * 20);
      lightGrad.addColorStop(0, 'rgba(0,0,0,0.8)'); lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = lightGrad; fctx.beginPath(); fctx.arc(cx, cy, 100, 0, Math.PI * 2); fctx.fill();
    }

    for (const ev of ow.events || []) {
      const ex = ev.x - cam.x, ey = ev.y - cam.y;
      if (ex < -200 || ex > VIEW_W + 200 || ey < -200 || ey > VIEW_H + 200) continue;
      const pulse = 0.5 + 0.5 * Math.sin(now / 200);
      lightGrad = fctx.createRadialGradient(ex, ey, 20, ex, ey, 120 + pulse * 30);
      lightGrad.addColorStop(0, 'rgba(0,0,0,0.9)'); lightGrad.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = lightGrad; fctx.beginPath(); fctx.arc(ex, ey, 150, 0, Math.PI * 2); fctx.fill();
    }
    ctx.drawImage(fogCanvas, 0, 0);
  }

  drawWeather(ctx);

  const gradient = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 150, VIEW_W / 2, VIEW_H / 2, 500);
  gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, `rgba(0,0,0,${theme.vignette || 0.4})`);
  ctx.fillStyle = gradient; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  if (hurtFlash > 0) {
    const hurtGrad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 100, VIEW_W / 2, VIEW_H / 2, 400);
    hurtGrad.addColorStop(0, 'rgba(255,0,0,0)'); hurtGrad.addColorStop(1, `rgba(255,0,0,${hurtFlash * 0.6})`);
    ctx.fillStyle = hurtGrad; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }

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

  const isEvent = !!nearNpc.isEvent;
  const infoText = isEvent
    ? `<b style="color:#ffd060;">✨ ${nearNpc.name}</b> — вы нашли что-то интересное.`
    : `<b style="color:#c9a227;">${nearNpc.name}</b> — вы подошли к объекту. Выберите действие:`;
  document.getElementById('npc-panel-info').innerHTML = infoText;

  const actions = document.getElementById('npc-panel-actions');
  const btnStyle = isEvent ? 'background:linear-gradient(180deg,#8a6a1a,#4a2a0a);border-color:#ffd060;' : 'background:linear-gradient(180deg,#2a5a3a,#1b3a2a);border-color:#60ff60;';
  const btnLabel = isEvent ? '✨ Исследовать' : '💬 Взаимодействовать';
  actions.innerHTML = `<button onclick="GameAPI.interactNpc('${nearNpc.id}')" style="${btnStyle}">${btnLabel}</button>`;
}

function drawMinimap(ctx, ow) {
  const size = 140, pad = 8, x0 = VIEW_W - size - pad, y0 = pad;
  const mapW = ow.cols * ow.tile, mapH = ow.rows * ow.tile; const scaleX = size / mapW, scaleY = size / mapH;
  ctx.fillStyle = 'rgba(10,6,18,0.82)'; ctx.fillRect(x0, y0, size, size);
  const theme = getTheme(ow.theme);
  ctx.fillStyle = theme.colors[0] || '#2a4a2a'; ctx.globalAlpha = 0.3; ctx.fillRect(x0, y0, size, size); ctx.globalAlpha = 1.0;
  for (const e of ow.enemies) { if (e.dead) continue; const sx = x0 + e.x * scaleX, sy = y0 + e.y * scaleY; ctx.fillStyle = e.boss ? '#b060ff' : e.elite ? '#ffa500' : '#ff4040'; const s = e.boss ? 5 : e.elite ? 4 : 2; ctx.fillRect(sx - s / 2, sy - s / 2, s, s); }
  for (const c of ow.chests) { if (c.opened) continue; const sx = x0 + c.x * scaleX, sy = y0 + c.y * scaleY; ctx.fillStyle = '#ffd060'; ctx.fillRect(sx - 1, sy - 1, 2, 2); }
  for (const n of ow.npcs || []) { const sx = x0 + n.x * scaleX, sy = y0 + n.y * scaleY; ctx.fillStyle = '#60ff60'; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3); }
  for (const o of ow.statics || []) { const sx = x0 + o.x * scaleX, sy = y0 + o.y * scaleY; ctx.fillStyle = '#ffa500'; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3); }
  for (const ev of ow.events || []) { const sx = x0 + ev.x * scaleX, sy = y0 + ev.y * scaleY; ctx.fillStyle = '#ffd060'; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3); }
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

export { 
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub, 
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee 
};