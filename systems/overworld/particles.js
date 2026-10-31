import { state } from '../state.js';

export const PARTICLE_PRESETS = {
  spark:   { colors: ['#ffd060', '#ffa500', '#ff6060'], speed: 2.5, size: 3,   life: 1.5, gravity: 0.15 },
  smoke:   { colors: ['#6a5a5a', '#3a2a2a', '#8a7a7a'], speed: 1.2, size: 4,   life: 2.0, gravity: -0.05 },
  levelup: { colors: ['#ffd060', '#c9a227', '#ffedb0'], speed: 2.0, size: 3.5, life: 2.0, gravity: -0.10 },
  hurt:    { colors: ['#ff4040', '#d63030', '#ff8080'], speed: 2.0, size: 3,   life: 1.2, gravity: 0.10 }
};

export function spawnParticles(x, y, type, count) {
  const ow = state.overworld;
  if (!ow) return;
  if (!ow.particles) ow.particles = [];
  const preset = PARTICLE_PRESETS[type];
  if (!preset) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = preset.speed * (0.5 + Math.random() * 0.8);
    ow.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: preset.colors[Math.floor(Math.random() * preset.colors.length)],
      size: preset.size * (0.7 + Math.random() * 0.6),
      life: preset.life,
      maxLife: preset.life,
      gravity: preset.gravity
    });
  }
}

export function updateParticles(dt) {
  const ow = state.overworld;
  if (!ow || !ow.particles) return;
  for (const p of ow.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.vx *= 0.98;
    p.life -= dt * 0.02;
  }
  ow.particles = ow.particles.filter(p => p.life > 0);
}