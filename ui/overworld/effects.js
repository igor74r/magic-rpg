import { state } from '../../systems/state.js';

export const VIEW_W = 800, VIEW_H = 500;

let weatherParticles = [];

let fireflies = [];

let fogLayers = [];

let lightning = { timer: 0, flash: 0 };

let bloomCanvas = null, bloomCtx = null;

export const THEMES = {
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


export const MOD_LABEL = { poisonous: '☣️ ядовитый', armored: '🛡️ бронированный', swift: '💨 стремительный', vampiric: '🧛 вампирский', regenerating: '💚 регенерирующий', berserk: '💢 берсерк' };

export function getTheme(name) { return THEMES[name] || THEMES.default; }


export function initWeather(themeName) {
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

export function updateWeather(dt) {
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

export function updateFireflies(dt, worldTime) {
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

export function updateFog(dt) {
  for (let layer of fogLayers) {
    layer.x += layer.speed * dt * 0.5;
    if (layer.x > VIEW_W + layer.size) layer.x = -layer.size;
  }
}

export function updateLightning(dt) {
  const theme = getTheme(state.overworld.locationId);
  if (theme.weather !== 'rain') { lightning.flash = 0; return; }
  
  lightning.timer -= dt * 0.016;
  if (lightning.timer <= 0) {
    lightning.flash = 1.0;
    lightning.timer = 8 + Math.random() * 12;
  }
  if (lightning.flash > 0) lightning.flash -= dt * 0.08;
}

export function getLightningFlash() { return lightning.flash; }

export function drawWeather(ctx) {
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

export function drawFireflies(ctx, worldTime) {
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

export function drawFogLayers(ctx) {
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

export function drawBloom(ctx) {
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

