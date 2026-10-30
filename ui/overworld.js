import { state } from '../systems/state.js';
import {
  tryMovePlayer, updateOverworld, exitOverworld,
  combatFlee
} from '../systems/overworld.js';
import { getEffStats } from '../systems/stats.js';
import { saveGame } from '../systems/save.js';
import { addItem } from '../systems/inventory.js';
import { saveAndMenu } from './menu.js';
import { LOCATIONS } from '../data/locations.js';
import { ENEMIES } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { emit, on } from '../systems/events.js';
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
let worldTime = 0;
let deathParticles = [];
let fireflies = [];
let fogLayers = [];
let lightning = { timer: 0, flash: 0 };
let bloodSplats = [];
let lowHpPulse = 0;
let corpses = [];
let snowAccum = 0;
let lastTileKey = null;
let tileDamageTimer = 0;
let _weatherEffectApplied = null;

let bloomCanvas = null, bloomCtx = null;

const THEMES = {
  default:   { colors: { 0: '#1a2e1a', 1: '#3a2a1a', 2: '#0f170f', 3: '#101a2e', 4: '#2a2a2a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.5)', fog: 0.85, weather: 'none', tint: 'rgba(40, 60, 40, 0.15)' },
  village:   { colors: { 0: '#2a3a2a', 1: '#4a3a2a', 2: '#3a2a1a', 3: '#2a4a6a', 4: '#4a4a3a' }, vignette: 0.3, shadow: 'rgba(0,0,0,0.3)', fog: 0.6, weather: 'none', tint: 'rgba(255, 200, 100, 0.05)' },
  forest:    { colors: { 0: '#0f1a0f', 1: '#2a1a0a', 2: '#050a05', 3: '#0a2a3a', 4: '#1a1a0a' }, vignette: 0.7, shadow: 'rgba(0,0,0,0.6)', fog: 0.9, weather: 'rain', tint: 'rgba(0, 60, 0, 0.2)' },
  ruins:     { colors: { 0: '#2a2a2a', 1: '#3a3a3a', 2: '#1a1a1a', 3: '#2a3a4a', 4: '#4a4a4a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.5)', fog: 0.85, weather: 'none', tint: 'rgba(60, 60, 60, 0.1)' },
  shadow:    { colors: { 0: '#0a000a', 1: '#1a0a1a', 2: '#050005', 3: '#2a0a3a', 4: '#1a0a1a' }, vignette: 0.9, shadow: 'rgba(0,0,0,0.9)', fog: 0.98, weather: 'ash', tint: 'rgba(60, 0, 60, 0.2)' },
  swamp:     { colors: { 0: '#1a2a0a', 1: '#2a1a0a', 2: '#0a1a0a', 3: '#1a2a3a', 4: '#1a1a1a' }, vignette: 0.8, shadow: 'rgba(0,0,0,0.7)', fog: 0.9, weather: 'rain', tint: 'rgba(40, 50, 0, 0.2)' },
  graveyard: { colors: { 0: '#0a0a1a', 1: '#2a2a3a', 2: '#05050a', 3: '#1a1a2a', 4: '#3a3a3a' }, vignette: 0.85, shadow: 'rgba(0,0,0,0.8)', fog: 0.95, weather: 'none', tint: 'rgba(30, 30, 70, 0.2)' },
  volcano:   { colors: { 0: '#1a0a00', 1: '#2a1a00', 2: '#0a0000', 3: '#8a2a00', 4: '#1a0a0a' }, vignette: 0.7, shadow: 'rgba(0,0,0,0.6)', fog: 0.85, weather: 'embers', tint: 'rgba(100, 30, 0, 0.2)' },
  ice:       { colors: { 0: '#1a2a4a', 1: '#3a4a6a', 2: '#0a1a2a', 3: '#4a8aaa', 4: '#6a8a9a' }, vignette: 0.6, shadow: 'rgba(0,0,0,0.4)', fog: 0.8, weather: 'snow', tint: 'rgba(0, 60, 120, 0.15)' },
  desert:    { colors: { 0: '#5a4a2a', 1: '#6a5a3a', 2: '#3a2a1a', 3: '#2a5a7a', 4: '#3a3a2a' }, vignette: 0.5, shadow: 'rgba(0,0,0,0.35)', fog: 0.7, weather: 'none', tint: 'rgba(200, 150, 50, 0.15)' },
  library:   { colors: { 0: '#1a0a2a', 1: '#3a1a4a', 2: '#0a001a', 3: '#4a1a7a', 4: '#2a1a3a' }, vignette: 0.8, shadow: 'rgba(0,0,0,0.7)', fog: 0.9, weather: 'none', tint: 'rgba(80, 0, 120, 0.2)' },
  dragon:    { colors: { 0: '#1a0a00', 1: '#2a0a00', 2: '#0a0000', 3: '#8a1a00', 4: '#2a0a0a' }, vignette: 0.85, shadow: 'rgba(0,0,0,0.8)', fog: 0.9, weather: 'embers', tint: 'rgba(120, 0, 0, 0.25)' }
};

const MOD_LABEL = { poisonous: '☣️ ядовитый', armored: '🛡️ бронированный', swift: '💨 стремительный', vampiric: '🧛 вампирский', regenerating: '💚 регенерирующий', berserk: '💢 берсерк' };

function getTheme(name) { return THEMES[name] || THEMES.default; }

function edgeSpawn() {
  const side = Math.floor(Math.random() * 4);
  const band = 70 + Math.random() * 50;
  if (side === 0) return { x: Math.random() * band, y: Math.random() * VIEW_H };
  if (side === 1) return { x: VIEW_W - Math.random() * band, y: Math.random() * VIEW_H };
  if (side === 2) return { x: Math.random() * VIEW_W, y: Math.random() * band };
  return { x: Math.random() * VIEW_W, y: VIEW_H - Math.random() * band };
}

// ==================== ОПАСНЫЕ ТАЙЛЫ ====================
function getTileDanger(tileType, locId) {
  if (tileType === undefined || tileType === null) return null;
  if ((locId === 'volcano' || locId === 'dragon') && tileType === 3) {
    return { type: 'lava', dmg: 1, every: 90, color: '#ff4010', name: '🔥 Лава' };
  }
  if (locId === 'swamp' && tileType === 3) {
    return { type: 'poison', dmg: 1, every: 180, color: '#60a060', name: '☠️ Болото' };
  }
  if (locId === 'ruins' && tileType === 4) {
    return { type: 'spike', dmg: 2, every: 0, color: '#a06060', name: '⚠️ Шипы' };
  }
  return null;
}

// ==================== СЕКРЕТНЫЕ КОМНАТЫ (2) ====================
function generateSecrets(ow) {
  const secrets = [];
  const loc = LOCATIONS[ow.locationId];
  if (!loc) return secrets;
  if (ow.locationId === 'village') return secrets; // в деревне нет секретов

  // Шанс: 20% что на карте будет 1 секрет, 5% что 2
  const roll = Math.random();
  let count = 0;
  if (roll < 0.05) count = 2;
  else if (roll < 0.20) count = 1;
  if (count === 0) return secrets;

  // Ищем кандидатов — «стены» (камни 4 или деревья 2), рядом с которыми проходимый тайл
  const candidates = [];
  for (let y = 1; y < ow.rows - 1; y++) {
    if (!ow.map[y]) continue;
    for (let x = 1; x < ow.cols - 1; x++) {
      const t = ow.map[y][x];
      if (t !== 4 && t !== 2) continue;
      let access = null;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nt = ow.map[y+dy]?.[x+dx];
        if (nt === 0 || nt === 1) { access = { ax: x+dx, ay: y+dy }; break; }
      }
      if (access) candidates.push({ x, y, ax: access.ax, ay: access.ay });
    }
  }
  if (!candidates.length) return secrets;

  for (let i = 0; i < count && candidates.length; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    const c = candidates.splice(idx, 1)[0];
    const typeRoll = Math.random();
    const rewardType = typeRoll < 0.60 ? 'chest' : typeRoll < 0.90 ? 'elite' : 'loot';
    secrets.push({
      tx: c.x, ty: c.y,
      wx: c.x * ow.tile + ow.tile / 2,
      wy: c.y * ow.tile + ow.tile / 2,
      ax: c.ax * ow.tile + ow.tile / 2,
      ay: c.ay * ow.tile + ow.tile / 2,
      rewardType,
      opened: false,
      startedAt: performance.now()
    });
  }
  return secrets;
}

function tryOpenSecret() {
  const ow = state.overworld;
  if (!ow || !ow.secretWalls) return;
  if (ow.combat || ow.defeated) return;
  const p = ow.player;
  for (const sw of ow.secretWalls) {
    if (sw.opened) continue;
    const dist = Math.hypot(sw.wx - p.x, sw.wy - p.y);
    if (dist < ow.tile * 1.6) {
      openSecret(sw);
      return;
    }
  }
}

function openSecret(sw) {
  const ow = state.overworld;
  const p = state.game.player;
  sw.opened = true;

  // Эффект: взрыв искр
  for (let i = 0; i < 30; i++) {
    (ow.particles ||= []).push({
      x: sw.wx, y: sw.wy,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 1, maxLife: 1,
      size: 2 + Math.random() * 3,
      color: i % 2 === 0 ? '#c9a227' : '#ffe060'
    });
  }

  if (sw.rewardType === 'chest') {
    (ow.chests ||= []).push({
      x: sw.ax, y: sw.ay,
      opened: false,
      _secret: true
    });
    emit('toast', '🪙 Найден древний сундук!');
    emit('log', { channel: 'game', msg: '✨ Вы обнаружили скрытую нишу с сундуком.', cls: 'success' });
  } else if (sw.rewardType === 'elite') {
    const pool = (LOCATIONS[ow.locationId]?.enemies) || ['goblin', 'skeleton', 'wolf'];
    const enemyId = pool[Math.floor(Math.random() * pool.length)];
    const def = ENEMIES[enemyId];
    if (def) {
      (ow.enemies ||= []).push({
        x: sw.ax, y: sw.ay,
        enemyId,
        hp: Math.round((def.hp || 30) * 1.5),
        maxHp: Math.round((def.hp || 30) * 1.5),
        boss: false, elite: true, dead: false,
        state: 'idle',
        modifier: null,
        homeX: sw.ax, homeY: sw.ay,
        wanderTimer: 0, chaseCooldown: 0
      });
    }
    emit('toast', '⚠️ Пробуждён древний страж!');
    emit('log', { channel: 'game', msg: '👁️ Из тьмы вышел страж.', cls: 'danger' });
  } else {
    // Лут — золото и зелья
    const gold = 30 + Math.floor(Math.random() * 50);
    p.gold = (p.gold || 0) + gold;
    addItem('health-potion', 1);
    addItem('mana-potion', 1);
    emit('toast', `💰 +${gold} золота, +2 зелья`);
    emit('log', { channel: 'game', msg: `✨ Скрытая ниша: +${gold}💰, +2 зелья.`, cls: 'success' });
  }
}

function initWeather(themeName) {
  weatherParticles = [];
  fireflies = [];
  fogLayers = [];
  
  const theme = getTheme(themeName);
  const count = theme.weather === 'none' ? 0 : 50;
  for (let i = 0; i < count; i++) {
    weatherParticles.push({
      x: Math.random() * VIEW_W, y: Math.random() * VIEW_H,
      speed: 2 + Math.random() * 4, size: Math.random() * 2 + 1, angle: Math.random() * Math.PI * 2
    });
  }

  if (['forest', 'swamp'].includes(themeName)) {
    for (let i = 0; i < 12; i++) {
      fireflies.push({
        x: Math.random() * VIEW_W, y: Math.random() * VIEW_H,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    fogLayers.push({
      x: Math.random() * VIEW_W,
      y: Math.random() * VIEW_H,
      speed: 0.15 + Math.random() * 0.3,
      alpha: 0.04 + Math.random() * 0.06,
      size: 300 + Math.random() * 200
    });
  }

  if (!bloomCanvas) {
    bloomCanvas = document.createElement('canvas');
    bloomCanvas.width = VIEW_W;
    bloomCanvas.height = VIEW_H;
    bloomCtx = bloomCanvas.getContext('2d');
  }

  lightning = { timer: 5 + Math.random() * 5, flash: 0 };
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
  footprints = []; deathParticles = []; hurtFlash = 0; worldTime = 0; bloodSplats = []; lowHpPulse = 0;
  corpses = []; snowAccum = 0; lastTileKey = null; tileDamageTimer = 0;
  _weatherEffectApplied = null;
  initWeather(state.overworld ? state.overworld.locationId : 'default');

  // Генерируем секреты для текущей локации
  if (state.overworld) {
    state.overworld.secretWalls = generateSecrets(state.overworld);
    if (state.overworld.secretWalls.length > 0) {
      console.log('[secrets] на карте спрятано:', state.overworld.secretWalls.length);
    }
  }

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
  if (code === 'KeyE') return 'e';
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

  // Открытие секретной стены по E
  if (k === 'e' && !state.overworld.combat) {
    e.preventDefault();
    tryOpenSecret();
    return;
  }

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

// ==================== УВЕДОМЛЕНИЯ О ДОСТИЖЕНИЯХ ====================
let _achCount = 0;
export function showAchievementNotification(data) {
  if (!data) return;
  const name = data.name || data.title || 'Открыто';
  const desc = data.desc || data.description || '';
  const icon = data.icon || '🏆';

  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; right: 20px; top: ${20 + (_achCount * 92)}px;
    z-index: 10000; display: flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, #2a1a0a 0%, #0a0500 100%);
    border: 2px solid #c9a227; border-radius: 8px;
    padding: 12px 18px; color: #e8dac8;
    box-shadow: 0 0 30px rgba(201, 162, 39, 0.6), inset 0 0 15px rgba(201, 162, 39, 0.1);
    transform: translateX(140%); opacity: 0;
    transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.3s;
    max-width: 320px; font-family: Georgia, serif;
  `;
  el.innerHTML = `
    <div style="font-size: 32px; filter: drop-shadow(0 0 8px #ffd060);">${icon}</div>
    <div style="flex: 1;">
      <div style="font-size: 10px; letter-spacing: 2px; color: #c9a227; text-transform: uppercase;">Достижение</div>
      <div style="font-size: 16px; font-weight: bold; color: #ffd060; margin: 2px 0;">${name}</div>
      <div style="font-size: 12px; color: #a89878;">${desc}</div>
    </div>
  `;
  document.body.appendChild(el);
  _achCount++;

  requestAnimationFrame(() => {
    el.style.transform = 'translateX(0)';
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.transform = 'translateX(140%)';
    el.style.opacity = '0';
    setTimeout(() => {
      el.remove();
      _achCount = Math.max(0, _achCount - 1);
    }, 500);
  }, 4000);
}

on('achievement', showAchievementNotification);
on('achievement:unlocked', showAchievementNotification);
on('achievements:unlocked', showAchievementNotification);

function tick(ts) {
  const dt = Math.min(50, ts - lastTs) / 16.67; lastTs = ts;
  if (state.overworld && state.overworld.active) {
    if (!paused) {
      worldTime += dt * 0.005;

      const ow = state.overworld;
      const p = state.game.player;
      const theme = getTheme(ow.locationId);

      // Погодные эффекты в бою
      if (ow.combat) {
        if (theme.weather === 'rain' && _weatherEffectApplied !== 'def') {
          p.effects = (p.effects || []).filter(e => e._weatherEffect !== true);
          p.effects.push({ id: 'defBuff', duration: 999, _weatherEffect: true });
          _weatherEffectApplied = 'def';
        } else if (ow.locationId === 'shadow' && _weatherEffectApplied !== 'atk') {
          p.effects = (p.effects || []).filter(e => e._weatherEffect !== true);
          p.effects.push({ id: 'atkBuff', duration: 999, _weatherEffect: true });
          _weatherEffectApplied = 'atk';
        }
      } else {
        if (_weatherEffectApplied) {
          p.effects = (p.effects || []).filter(e => e._weatherEffect !== true);
          _weatherEffectApplied = null;
        }
      }

      // Движение (с замедлением на снегу)
      if (!ow.combat && !ow.defeated) {
        const k = ow.keys; let dx = 0, dy = 0;
        if (k['w'] || k['arrowup']) dy -= 1; if (k['s'] || k['arrowdown']) dy += 1;
        if (k['a'] || k['arrowleft']) dx -= 1; if (k['d'] || k['arrowright']) dx += 1;
        
        if (dx || dy) {
          const isSnow = theme.weather === 'snow';
          const needAccum = isSnow ? 1.18 : 1.0;
          snowAccum += 1;
          if (snowAccum >= needAccum) {
            snowAccum -= needAccum;
            tryMovePlayer(dx, dy);
            
            const pp = ow.player;
            if (Math.hypot(pp.x - lastFootprintPos.x, pp.y - lastFootprintPos.y) > 15) {
              footprints.push({ x: pp.x, y: pp.y + 10, life: 1.0, angle: Math.atan2(dy, dx) });
              lastFootprintPos = { x: pp.x, y: pp.y };
              if (footprints.length > 30) footprints.shift();
            }
          }
        } else {
          snowAccum = Math.min(snowAccum, 0.9);
        }
      }

      // Опасные тайлы
      if (!ow.combat && !ow.defeated && state.game) {
        const tileX = Math.floor(ow.player.x / ow.tile);
        const tileY = Math.floor(ow.player.y / ow.tile);
        const tileType = ow.map[tileY]?.[tileX];
        const danger = getTileDanger(tileType, ow.locationId);
        const tileKey = `${tileX},${tileY}`;

        if (danger) {
          if (danger.type === 'spike') {
            if (tileKey !== lastTileKey) {
              p.hp = Math.max(1, p.hp - danger.dmg);
              ow.player.hp = p.hp;
              (ow.floatingNumbers ||= []).push({
                x: ow.player.x, y: ow.player.y - 30,
                text: `-${danger.dmg}`, life: 1.0, type: 'damage'
              });
              hurtFlash = 1.0;
            }
          } else {
            tileDamageTimer += dt;
            if (tileDamageTimer >= danger.every) {
              tileDamageTimer = 0;
              p.hp = Math.max(1, p.hp - danger.dmg);
              ow.player.hp = p.hp;
              (ow.floatingNumbers ||= []).push({
                x: ow.player.x + (Math.random() * 20 - 10),
                y: ow.player.y - 30,
                text: `-${danger.dmg}`, life: 1.0, type: 'damage'
              });
              hurtFlash = 0.5;
            }
          }
        } else {
          tileDamageTimer = 0;
        }
        lastTileKey = tileKey;
      }

      updateOverworld(dt);
      updateWeather(dt);
      updateFireflies(dt);
      updateFog(dt);
      updateLightning(dt);

      for (let i = footprints.length - 1; i >= 0; i--) {
        footprints[i].life -= dt * 0.02;
        if (footprints[i].life <= 0) footprints.splice(i, 1);
      }

      if (hurtFlash > 0) hurtFlash -= dt * 0.1;

      for (let i = bloodSplats.length - 1; i >= 0; i--) {
        bloodSplats[i].life -= dt * 0.03;
        if (bloodSplats[i].life <= 0) bloodSplats.splice(i, 1);
      }

      for (let i = corpses.length - 1; i >= 0; i--) {
        corpses[i].life -= dt * 0.002;
        if (corpses[i].life <= 0) corpses.splice(i, 1);
      }

      if (p.hp / p.maxHp < 0.25) lowHpPulse += dt * 0.1;
      else lowHpPulse = 0;

      for (let i = deathParticles.length - 1; i >= 0; i--) {
        let dp = deathParticles[i];
        dp.x += dp.vx * dt; dp.y += dp.vy * dt;
        dp.vy += 0.2 * dt;
        dp.life -= dt * 0.03;
        if (dp.life <= 0) deathParticles.splice(i, 1);
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

function updateFireflies(dt) {
  if (!['forest', 'swamp'].includes(state.overworld.locationId)) return;
  const dayPhase = (worldTime % 120) / 120;
  const isNight = dayPhase >= 0.5 && dayPhase < 0.8;

  for (let f of fireflies) {
    f.phase += dt * 0.02 * f.speed;
    if (isNight) {
      f.x = (f.x + Math.cos(f.phase) * f.speed * dt + VIEW_W) % VIEW_W;
      f.y = (f.y + Math.sin(f.phase * 0.7) * f.speed * dt + VIEW_H) % VIEW_H;
    }
  }
}

function updateFog(dt) {
  for (let layer of fogLayers) {
    layer.x += layer.speed * dt * 0.5;
    if (layer.x > VIEW_W + layer.size) layer.x = -layer.size;
  }
}

function updateLightning(dt) {
  const theme = getTheme(state.overworld.locationId);
  if (theme.weather !== 'rain') { lightning.flash = 0; return; }
  
  lightning.timer -= dt * 0.016;
  if (lightning.timer <= 0) {
    lightning.flash = 1.0;
    lightning.timer = 8 + Math.random() * 12;
  }
  if (lightning.flash > 0) lightning.flash -= dt * 0.08;
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

function drawFireflies(ctx) {
  if (!['forest', 'swamp'].includes(state.overworld.locationId)) return;
  const dayPhase = (worldTime % 120) / 120;
  const isNight = dayPhase >= 0.5 && dayPhase < 0.8;
  if (!isNight) return;

  ctx.save();
  for (let f of fireflies) {
    const flicker = 0.4 + 0.6 * Math.abs(Math.sin(f.phase * 3));
    ctx.globalAlpha = flicker * 0.9;
    ctx.fillStyle = '#a0ff60';
    ctx.shadowBlur = 12; ctx.shadowColor = '#80ff40';
    ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawFogLayers(ctx) {
  const theme = getTheme(state.overworld.locationId);
  const baseAlpha = theme.fog > 0.85 ? 1.5 : 0.8;
  
  ctx.save();
  for (let layer of fogLayers) {
    const grad = ctx.createRadialGradient(layer.x, layer.y, 0, layer.x, layer.y, layer.size);
    grad.addColorStop(0, `rgba(200, 200, 220, ${layer.alpha * baseAlpha})`);
    grad.addColorStop(1, 'rgba(200, 200, 220, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(layer.x - layer.size, layer.y - layer.size, layer.size * 2, layer.size * 2);
  }
  ctx.restore();
}

function drawBloom(ctx) {
  bloomCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  bloomCtx.save();
  bloomCtx.globalCompositeOperation = 'lighter';
  
  const ow = state.overworld;
  const cam = ow.camera;
  const p = ow.player;

  if (state.game.player.class === 'mage') {
    const grd = bloomCtx.createRadialGradient(p.x - cam.x, p.y - cam.y, 5, p.x - cam.x, p.y - cam.y, 60);
    grd.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
    grd.addColorStop(1, 'rgba(100, 200, 255, 0)');
    bloomCtx.fillStyle = grd;
    bloomCtx.fillRect(p.x - cam.x - 60, p.y - cam.y - 60, 120, 120);
  } else if (state.game.player.class === 'priest') {
    const grd = bloomCtx.createRadialGradient(p.x - cam.x, p.y - cam.y - 20, 5, p.x - cam.x, p.y - cam.y - 20, 40);
    grd.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
    grd.addColorStop(1, 'rgba(255, 220, 100, 0)');
    bloomCtx.fillStyle = grd;
    bloomCtx.fillRect(p.x - cam.x - 40, p.y - cam.y - 60, 80, 80);
  }

  for (const c of ow.chests) {
    if (c.opened) continue;
    const cx = c.x - cam.x, cy = c.y - cam.y;
    if (cx < -100 || cx > VIEW_W + 100 || cy < -100 || cy > VIEW_H + 100) continue;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 400);
    const grd = bloomCtx.createRadialGradient(cx, cy, 5, cx, cy, 40 + pulse * 10);
    grd.addColorStop(0, 'rgba(255, 200, 0, 0.5)');
    grd.addColorStop(1, 'rgba(255, 200, 0, 0)');
    bloomCtx.fillStyle = grd;
    bloomCtx.fillRect(cx - 60, cy - 60, 120, 120);
  }

  for (const ev of ow.events || []) {
    const ex = ev.x - cam.x, ey = ev.y - cam.y;
    if (ex < -100 || ex > VIEW_W + 100 || ey < -100 || ey > VIEW_H + 100) continue;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    const grd = bloomCtx.createRadialGradient(ex, ey, 10, ex, ey, 80 + pulse * 20);
    grd.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
    grd.addColorStop(1, 'rgba(255, 220, 100, 0)');
    bloomCtx.fillStyle = grd;
    bloomCtx.fillRect(ex - 120, ey - 120, 240, 240);
  }

  for (const e of ow.enemies) {
    if (e.dead) continue;
    if (!e.boss && !e.elite) continue;
    const ex = e.x - cam.x, ey = e.y - cam.y;
    if (ex < -100 || ex > VIEW_W + 100 || ey < -100 || ey > VIEW_H + 100) continue;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 500);
    const color = e.boss ? '176, 96, 255' : '255, 165, 0';
    const grd = bloomCtx.createRadialGradient(ex, ey, 5, ex, ey, (e.boss ? 70 : 50) + pulse * 15);
    grd.addColorStop(0, `rgba(${color}, 0.5)`);
    grd.addColorStop(1, `rgba(${color}, 0)`);
    bloomCtx.fillStyle = grd;
    bloomCtx.fillRect(ex - 100, ey - 100, 200, 200);
  }

  bloomCtx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(8px)';
  ctx.drawImage(bloomCanvas, 0, 0);
  ctx.filter = 'none';
  ctx.restore();
}

function drawTile(ctx, type, x, y, size, themeName, colors) {
  const half = size / 2;
  ctx.fillStyle = colors[type] || '#2a4a2a';
  ctx.fillRect(x, y, size, size);

  if (type === 0 || type === 1) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x, y + size - 4, size, 4);
  }

  if (type === 0) {
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
    const isLava = (themeName === 'volcano' || themeName === 'dragon');
    const isPoison = (themeName === 'swamp');
    
    if (isLava || isPoison) {
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 400 + x * 0.01 + y * 0.01));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (isLava) ctx.fillStyle = `rgba(255, 80, 0, ${0.3 + pulse * 0.3})`;
      else ctx.fillStyle = `rgba(100, 200, 80, ${0.15 + pulse * 0.15})`;
      ctx.fillRect(x, y, size, size);
      ctx.restore();
    }

    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    const offset = (performance.now() / 20) % 20;
    ctx.beginPath(); ctx.moveTo(x + offset, y + 12); ctx.quadraticCurveTo(x + 10 + offset, y + 8, x + 20 + offset, y + 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10 - offset, y + 32); ctx.quadraticCurveTo(x + 20 - offset, y + 28, x + 30 - offset, y + 32); ctx.stroke();
  } else if (type === 4) {
    if (themeName === 'ruins') {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 500 + x * 0.02 + y * 0.02);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(180, 40, 40, ${0.1 + pulse * 0.15})`;
      ctx.fillRect(x, y, size, size);
      ctx.restore();
    }
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
  const isLowHp = hpPct < 0.25;
  const hpPulse = isLowHp ? 0.75 + 0.25 * Math.sin(performance.now() / 200) : 1;
  
  ctx.fillStyle = '#333'; ctx.fillRect(hudX + 10, hudY + 15, 180, 12);
  ctx.fillStyle = isLowHp ? `rgba(220, 40, 40, ${hpPulse})` : '#ff4444'; 
  ctx.fillRect(hudX + 10, hudY + 15, 180 * hpPct, 12);
  ctx.fillStyle = '#fff'; ctx.fillText(`HP ${p.hp}/${p.maxHp}`, hudX + 15, hudY + 21);

  const mpPct = p.mp / p.maxMp;
  const mpColor = pClass === 'warrior' ? '#d000ff' : '#00c3ff';
  ctx.fillStyle = '#333'; ctx.fillRect(hudX + 10, hudY + 35, 180, 12);
  ctx.fillStyle = mpColor; ctx.fillRect(hudX + 10, hudY + 35, 180 * mpPct, 12);
  ctx.fillStyle = '#fff'; ctx.fillText(`${pClass === 'warrior' ? 'Ярость' : 'MP'} ${p.mp}/${p.maxMp}`, hudX + 15, hudY + 41);

  ctx.fillStyle = '#ffd060'; ctx.fillText(`⚔️ Урон: ${stats.atk}`, hudX + 10, hudY + 65);
  ctx.fillStyle = '#60ff60'; ctx.fillText(`🛡️ Броня: ${stats.def}`, hudX + 115, hudY + 65);

  const theme = getTheme(state.overworld?.locationId);
  let iconY = hudY + 90;
  ctx.font = '11px Georgia';
  if (theme.weather === 'snow') { ctx.fillStyle = '#a0d0ff'; ctx.fillText('❄️ Замедление −15%', hudX + 10, iconY); }
  else if (theme.weather === 'rain') { ctx.fillStyle = '#a0b0ff'; ctx.fillText('🌧️ Защита +50% (в бою)', hudX + 10, iconY); }
  else if (state.overworld?.locationId === 'shadow') { ctx.fillStyle = '#c090ff'; ctx.fillText('🌑 Атака +30% (в бою)', hudX + 10, iconY); }
}

function render() {
  const canvas = document.getElementById('overworld-canvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); const ow = state.overworld; const cam = ow.camera; const theme = getTheme(ow.theme);

  const player = state.game.player;
  const isLowHp = player.hp / player.maxHp < 0.25;
  let shakeX = 0, shakeY = 0;
  if (isLowHp) {
    shakeX = (Math.random() - 0.5) * 1.5 * Math.sin(lowHpPulse * 5);
    shakeY = (Math.random() - 0.5) * 1.5 * Math.sin(lowHpPulse * 5);
  }

  ctx.save();
  if (ow.shake && ow.shake.t > 0) ctx.translate((Math.random() * 2 - 1) * ow.shake.mag, (Math.random() * 2 - 1) * ow.shake.mag);
  ctx.translate(shakeX, shakeY);
  
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

  // ============= СЕКРЕТНЫЕ СТЕНЫ: МЕРЦАНИЕ =============
  if (!ow.combat && ow.secretWalls) {
    for (const sw of ow.secretWalls) {
      if (sw.opened) continue;
      const sx = sw.tx * ow.tile - cam.x;
      const sy = sw.ty * ow.tile - cam.y;
      if (sx < -60 || sx > VIEW_W + 60 || sy < -60 || sy > VIEW_H + 60) continue;
      const pulse = 0.5 + 0.5 * Math.sin((performance.now() - sw.startedAt) / 400);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(200, 200, 255, ${0.08 + pulse * 0.1})`;
      ctx.fillRect(sx, sy, ow.tile, ow.tile);
      // Внутренний контур
      ctx.strokeStyle = `rgba(255, 240, 180, ${0.15 + pulse * 0.15})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 6, sy + 6, ow.tile - 12, ow.tile - 12);
      ctx.restore();
    }
  }

  // Трупы
  for (let c of corpses) {
    const sx = c.x - cam.x, sy = c.y - cam.y;
    if (sx < -50 || sx > VIEW_W + 50 || sy < -50 || sy > VIEW_H + 50) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, c.life * 1.2);
    ctx.fillStyle = 'rgba(60, 10, 10, 0.5)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 5, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200, 190, 170, 0.6)';
    ctx.fillRect(sx - 8, sy, 4, 1.5);
    ctx.fillRect(sx - 2, sy - 1, 4, 1.5);
    ctx.fillRect(sx + 5, sy + 1, 4, 1.5);
    ctx.fillStyle = 'rgba(80, 40, 40, 0.5)';
    ctx.beginPath(); ctx.arc(sx - 3, sy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  for (let f of footprints) {
    const sx = f.x - cam.x, sy = f.y - cam.y;
    if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
    ctx.save(); 
    ctx.globalAlpha = f.life * 0.4; 
    ctx.fillStyle = isLowHp ? '#8b0000' : '#000';
    ctx.beginPath(); ctx.ellipse(sx, sy, 4, 2, f.angle, 0, Math.PI * 2); ctx.fill(); 
    ctx.restore();
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
      if (!e._hasExploded) {
        e._hasExploded = true;
        const isBoss = e.boss;
        const count = isBoss ? 30 : 15;
        const color = isBoss ? '#b060ff' : e.elite ? '#ffa500' : '#d63030';
        for (let i = 0; i < count; i++) {
          deathParticles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 2,
            size: Math.random() * 4 + 2,
            color: color, life: 1.0
          });
        }
        if (corpses.length < 20) {
          corpses.push({ x: e.x, y: e.y, life: 1.0, boss: isBoss, elite: e.elite, enemyId: e.enemyId });
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
  ctx.fillStyle = isLowHp ? `rgba(220, 40, 40, ${0.75 + 0.25 * Math.sin(performance.now() / 200)})` : '#d63030'; 
  ctx.fillRect(px - bw / 2, py - 42, bw * (p.hp / p.maxHp), 4);
  ctx.fillStyle = state.game.player.class === 'warrior' ? '#d000ff' : '#3060d6';
  ctx.fillRect(px - bw / 2, py - 36, bw * (p.mp / p.maxMp), 3);

  // Подсказка про E
  if (!ow.combat && ow.secretWalls) {
    for (const sw of ow.secretWalls) {
      if (sw.opened) continue;
      const dist = Math.hypot(sw.wx - p.x, sw.wy - p.y);
      if (dist < ow.tile * 1.6) {
        const hx = sw.wx - cam.x, hy = sw.wy - cam.y;
        ctx.font = 'bold 13px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        const txt = '[E] Открыть';
        ctx.strokeText(txt, hx, hy - 46);
        ctx.fillStyle = '#ffd060';
        ctx.fillText(txt, hx, hy - 46);
      }
    }
  }

  for (const part of ow.particles || []) {
    const sx = part.x - cam.x, sy = part.y - cam.y;
    if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, part.life / part.maxLife)); ctx.fillStyle = part.color;
    ctx.shadowBlur = 8; ctx.shadowColor = part.color; ctx.beginPath(); ctx.arc(sx, sy, part.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  for (const fn of (ow.floatingNumbers || [])) {
    const sx = fn.x - cam.x, sy = fn.y - cam.y;
    const bounce = Math.sin(fn.life * Math.PI) * 15;
    ctx.save(); 
    ctx.globalAlpha = Math.max(0, Math.min(1, fn.life)); 
    ctx.font = 'bold 22px Montserrat, sans-serif'; 
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; 
    ctx.fillStyle = fn.type === 'heal' ? '#60ff60' : fn.type === 'crit' ? '#ffd060' : '#ff4040'; 
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; 
    ctx.strokeText(fn.text, sx, sy - bounce); 
    ctx.fillText(fn.text, sx, sy - bounce); 
    ctx.restore();
    
    if (fn.type === 'damage' || fn.text.startsWith('-')) {
      hurtFlash = 1.0;
      if (bloodSplats.length < 8) {
        for (let i = 0; i < 2; i++) {
          const pos = edgeSpawn();
          bloodSplats.push({
            x: pos.x, y: pos.y,
            size: 3 + Math.random() * 4,
            life: 0.5 + Math.random() * 0.3,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }
    }
  }

  if (ow.combat) {
    const e = ow.combat.enemy; const ex = e.x - cam.x, ey = e.y - cam.y;
    ctx.strokeStyle = 'rgba(201,162,39,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  }

  drawBloom(ctx);

  const dayPhase = (worldTime % 120) / 120;
  let nightAlpha = 0;
  let nightColor = 'rgba(10, 20, 50, ';

  if (dayPhase > 0.3 && dayPhase < 0.5) {
    const t = (dayPhase - 0.3) / 0.2;
    nightAlpha = t * 0.4;
    nightColor = `rgba(80, 20, 0, `;
  } else if (dayPhase >= 0.5 && dayPhase < 0.8) {
    nightAlpha = 0.5;
    nightColor = `rgba(10, 20, 50, `;
  } else if (dayPhase >= 0.8 && dayPhase < 1.0) {
    const t = (dayPhase - 0.8) / 0.2;
    nightAlpha = (1 - t) * 0.5;
    nightColor = `rgba(50, 20, 50, `;
  }

  if (nightAlpha > 0 && !['village', 'library'].includes(ow.locationId)) {
    ctx.fillStyle = nightColor + nightAlpha + ')';
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }

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

    // Секретные стены подсвечивают вокруг себя маленькую зону (только когда близко)
    if (!ow.combat && ow.secretWalls) {
      for (const sw of ow.secretWalls) {
        if (sw.opened) continue;
        const dist = Math.hypot(sw.wx - p.x, sw.wy - p.y);
        if (dist < ow.tile * 3) {
          const cx = sw.wx - cam.x, cy = sw.wy - cam.y;
          const grad2 = fctx.createRadialGradient(cx, cy, 5, cx, cy, 50);
          grad2.addColorStop(0, 'rgba(0,0,0,0.6)');
          grad2.addColorStop(1, 'rgba(0,0,0,0)');
          fctx.fillStyle = grad2; fctx.beginPath(); fctx.arc(cx, cy, 50, 0, Math.PI * 2); fctx.fill();
        }
      }
    }

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

  drawFireflies(ctx);
  drawFogLayers(ctx);
  drawWeather(ctx);

  if (lightning.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${lightning.flash * 0.5})`;
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }

  if (theme.tint) {
    ctx.fillStyle = theme.tint;
    ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }

  const gradient = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 150, VIEW_W / 2, VIEW_H / 2, 500);
  gradient.addColorStop(0, 'rgba(0,0,0,0)'); gradient.addColorStop(1, `rgba(0,0,0,${theme.vignette || 0.4})`);
  ctx.fillStyle = gradient; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);

  if (isLowHp) {
    const pulse = 0.06 + 0.04 * Math.sin(lowHpPulse * 2);
    const hurtGrad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 200, VIEW_W / 2, VIEW_H / 2, 450);
    hurtGrad.addColorStop(0, 'rgba(255,0,0,0)');
    hurtGrad.addColorStop(1, `rgba(200,0,0,${pulse})`);
    ctx.fillStyle = hurtGrad; ctx.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40);
  }

  if (hurtFlash > 0) {
    const hurtGrad = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 250, VIEW_W / 2, VIEW_H / 2, 450);
    hurtGrad.addColorStop(0, 'rgba(255,0,0,0)');
    hurtGrad.addColorStop(1, `rgba(200,0,0,${hurtFlash * 0.12})`);
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

  for (let b of bloodSplats) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillStyle = '#6a0000';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x + b.size * 0.9, b.y + b.size * 0.5, b.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  // Секретные стены на миникарте НЕ отображаются
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