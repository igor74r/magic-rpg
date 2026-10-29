export const MODIFIERS_LABEL = {
  poisonous:    { name: 'Ядовитый',       prefix: '☣️',  color: '#60a060' },
  armored:      { name: 'Бронированный',  prefix: '🛡️', color: '#a0a0a0' },
  swift:        { name: 'Стремительный',  prefix: '💨',  color: '#60a0ff' },
  vampiric:     { name: 'Вампирский',     prefix: '🧛',  color: '#800060' },
  regenerating: { name: 'Регенерирующий', prefix: '💚',  color: '#60ff60' },
  berserk:      { name: 'Берсерк',        prefix: '💢',  color: '#ff4040' }
};

export const EFFECTS_DATA = {
  poison:        { name: 'Отравление',    icon: '☠️', color: '#60a060' },
  burn:          { name: 'Ожог',          icon: '🔥', color: '#ff6020' },
  bleed:         { name: 'Кровотечение',  icon: '🩸', color: '#d63030' },
  stun:          { name: 'Оглушение',     icon: '💫', color: '#d6c030' },
  atkBuff:       { name: 'Боевой клич',   icon: '📢', color: '#ffd060' },
  defBuff:       { name: 'Щит маны',      icon: '🛡️', color: '#60a0ff' },
  lifesteal:     { name: 'Кровожадность', icon: '🩸', color: '#d63030' },
  strength:      { name: 'Эликсир силы',  icon: '💪', color: '#ff9060' },
  manaShield:    { name: 'Эликсир маны',  icon: '💧', color: '#60d0ff' },
  elderBlessing: { name: 'Благословение', icon: '✨', color: '#ffd060' }
};

// ==================== ИГРОК ====================
export function drawPlayerByClass(ctx, x, y, playerClass, shadowColor) {
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (playerClass === 'warrior') {
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x - 7, y + 8, 5, 8);
    ctx.fillRect(x + 2, y + 8, 5, 8);
    ctx.fillStyle = '#b03030';
    ctx.fillRect(x - 11, y - 6, 22, 16);
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(x - 11, y - 6, 22, 4);
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(x - 12, y - 4, 5, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(x, y - 16, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 8, y - 16, 16, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 6, y - 15, 4, 2);
    ctx.fillRect(x + 2, y - 15, 4, 2);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(x + 14, y - 8, 3, 22);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 12, y - 8, 7, 4);
    ctx.fillStyle = '#ffd060';
    ctx.beginPath();
    ctx.moveTo(x + 15.5, y - 12);
    ctx.lineTo(x + 17.5, y - 8);
    ctx.lineTo(x + 13.5, y - 8);
    ctx.closePath();
    ctx.fill();

  } else if (playerClass === 'mage') {
    ctx.fillStyle = '#3a1560';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 16);
    ctx.lineTo(x + 10, y + 16);
    ctx.lineTo(x + 8, y + 2);
    ctx.lineTo(x - 8, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a2090';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2);
    ctx.lineTo(x + 10, y + 2);
    ctx.lineTo(x + 7, y - 8);
    ctx.lineTo(x - 7, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe060';
    ctx.fillRect(x - 5, y + 5, 2, 2);
    ctx.fillRect(x + 3, y + 10, 2, 2);
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 10);
    ctx.lineTo(x + 5, y - 10);
    ctx.lineTo(x, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a1060';
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 18);
    ctx.lineTo(x + 11, y - 18);
    ctx.lineTo(x + 4, y - 40);
    ctx.lineTo(x - 4, y - 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a0540';
    ctx.fillRect(x - 13, y - 19, 26, 3);
    ctx.fillStyle = '#ffe060';
    ctx.beginPath();
    ctx.arc(x, y - 24, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x + 13, y - 12, 3, 30);
    ctx.shadowBlur = 12; ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#a0f0ff';
    ctx.beginPath();
    ctx.arc(x + 14.5, y - 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

  } else if (playerClass === 'priest') {
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 16);
    ctx.lineTo(x + 10, y + 16);
    ctx.lineTo(x + 8, y - 8);
    ctx.lineTo(x - 8, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffd060';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x - 8, y + 3, 16, 2);
    ctx.fillRect(x - 1, y - 6, 2, 6);
    ctx.fillRect(x - 3, y - 4, 6, 2);
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a060';
    ctx.beginPath();
    ctx.arc(x, y - 16, 6, Math.PI, 0);
    ctx.fill();
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffd060';
    ctx.strokeStyle = '#ffd060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 24, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 13, y - 10, 2, 28);
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x + 11, y - 12, 6, 2);
    ctx.fillRect(x + 13.5, y - 15, 1, 6);
  }
}

// ==================== ВРАГИ ====================
export function drawEnemyByType(ctx, e, x, y, shadowColor) {
  const size = e.boss ? 22 : e.elite ? 16 : 12;
  const isBoss = e.boss;
  const isElite = e.elite;
  let glowColor = null;
  if (isBoss) glowColor = '#b060ff';
  else if (isElite) glowColor = '#ffa500';

  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x, y + size - 2, size, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (glowColor) { ctx.shadowBlur = isBoss ? 20 : 10; ctx.shadowColor = glowColor; }

  if (e.modifier) {
    const m = MODIFIERS_LABEL[e.modifier];
    if (m) {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const id = e.enemyId;

  if (id === 'goblin') {
    ctx.fillStyle = '#3a7030';
    ctx.beginPath();
    ctx.moveTo(x - size + 2, y - 4); ctx.lineTo(x - size - 8, y - 10); ctx.lineTo(x - size + 2, y - 8);
    ctx.moveTo(x + size - 2, y - 4); ctx.lineTo(x + size + 8, y - 10); ctx.lineTo(x + size - 2, y - 8);
    ctx.fill();
    ctx.fillStyle = '#4a8040';
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 4, y - 2, 2.5, 0, Math.PI * 2); ctx.arc(x + 4, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 2, 1, 0, Math.PI * 2); ctx.arc(x + 4, y - 2, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 3, y + 5, 2, 3);
    ctx.fillRect(x + 1, y + 5, 2, 3);

  } else if (id === 'skeleton' || id === 'skeleton-archer') {
    ctx.fillStyle = '#f0ead0';
    ctx.beginPath(); ctx.arc(x, y - 4, size * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - size * 0.5, y + 2, size, 4);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 5, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0ead0';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - size * 0.7, y + 8 + i * 3, size * 1.4, 2);
    if (id === 'skeleton-archer') {
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + size + 4, y, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + size + 4, y - 8); ctx.lineTo(x + size + 4, y + 8); ctx.stroke();
    }

  } else if (id === 'wolf' || id === 'frost-wolf') {
    const c = id === 'frost-wolf' ? '#8cc8e8' : '#505050';
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(x - 2, y, size * 1.3, size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + size * 0.7, y - 3, size * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y - size * 0.6); ctx.lineTo(x + size * 0.45, y - size * 1.0); ctx.lineTo(x + size * 0.75, y - size * 0.55);
    ctx.fill();
    ctx.fillStyle = id === 'frost-wolf' ? '#00c8ff' : '#ff4040';
    ctx.beginPath(); ctx.arc(x + size * 0.9, y - 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - size * 1.2, y); ctx.quadraticCurveTo(x - size * 1.6, y - 6, x - size * 1.5, y - 10); ctx.stroke();

  } else if (id === 'ghost' || id === 'wraith' || id === 'dust-wraith') {
    const c = id === 'dust-wraith' ? '#a08050' : id === 'wraith' ? '#4a4a6a' : '#a0d0ff';
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y - 4, size, Math.PI, 0);
    ctx.lineTo(x + size, y + 6);
    ctx.quadraticCurveTo(x + size * 0.66, y + 12, x + size * 0.33, y + 8);
    ctx.quadraticCurveTo(x, y + 14, x - size * 0.33, y + 8);
    ctx.quadraticCurveTo(x - size * 0.66, y + 12, x - size, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 6, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 6, 2, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'dark-knight') {
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x - 10, y - 6, 20, 20);
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath(); ctx.arc(x - 11, y - 4, 5, 0, Math.PI * 2); ctx.arc(x + 11, y - 4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath(); ctx.arc(x, y - 14, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2020';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff2020';
    ctx.fillRect(x - 6, y - 15, 12, 3);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8a1010';
    ctx.fillRect(x + 13, y - 10, 3, 24);
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(x + 11, y - 10, 7, 4);

  } else if (id === 'shadow-mage') {
    ctx.fillStyle = '#1a0a2a';
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 20); ctx.lineTo(x + 14, y + 20); ctx.lineTo(x + 10, y - 8); ctx.lineTo(x - 10, y - 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0a0010';
    ctx.beginPath(); ctx.arc(x, y - 10, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b060ff';
    ctx.shadowBlur = 12; ctx.shadowColor = '#b060ff';
    ctx.beginPath(); ctx.arc(x - 4, y - 10, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + 16, y - 16, 3, 36);
    ctx.fillStyle = '#b060ff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#b060ff';
    ctx.beginPath(); ctx.arc(x + 17.5, y - 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (id === 'grave-king') {
    ctx.fillStyle = '#d0c8a8';
    ctx.beginPath(); ctx.arc(x, y - 6, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 10, y + 4, 20, 6);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 6, y - 8, 3, 0, Math.PI * 2); ctx.arc(x + 6, y - 8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.arc(x - 6, y - 8, 1.5, 0, Math.PI * 2); ctx.arc(x + 6, y - 8, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd060';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 20); ctx.lineTo(x - 12, y - 28); ctx.lineTo(x - 8, y - 24);
    ctx.lineTo(x - 4, y - 32); ctx.lineTo(x, y - 24); ctx.lineTo(x + 4, y - 32);
    ctx.lineTo(x + 8, y - 24); ctx.lineTo(x + 12, y - 28); ctx.lineTo(x + 12, y - 20);
    ctx.closePath(); ctx.fill();

  } else if (id === 'fire-elemental') {
    const grd = ctx.createLinearGradient(x, y - size * 1.2, x, y + size);
    grd.addColorStop(0, '#ffff00');
    grd.addColorStop(0.5, '#ff8000');
    grd.addColorStop(1, '#a00000');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.3);
    ctx.quadraticCurveTo(x + size * 1.2, y - size * 0.3, x + size, y + size * 0.5);
    ctx.quadraticCurveTo(x + size * 0.5, y + size, x, y + size * 0.7);
    ctx.quadraticCurveTo(x - size * 0.5, y + size, x - size, y + size * 0.5);
    ctx.quadraticCurveTo(x - size * 1.2, y - size * 0.3, x, y - size * 1.3);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 3, y, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y, 1.5, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'magma-golem') {
    ctx.fillStyle = '#5a2a0a';
    ctx.fillRect(x - 14, y - 10, 28, 26);
    ctx.fillStyle = '#4a1a0a';
    ctx.fillRect(x - 10, y - 22, 20, 14);
    ctx.strokeStyle = '#ff6000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 18); ctx.lineTo(x - 2, y - 10); ctx.lineTo(x + 6, y - 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2); ctx.lineTo(x + 4, y + 8);
    ctx.stroke();
    ctx.fillStyle = '#ff8000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff8000';
    ctx.fillRect(x - 6, y - 18, 4, 3);
    ctx.fillRect(x + 2, y - 18, 4, 3);
    ctx.shadowBlur = 0;

  } else if (id === 'flame-lord') {
    ctx.fillStyle = '#ff4000';
    ctx.shadowBlur = 25; ctx.shadowColor = '#ff4000';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const px = x + Math.cos(a) * 16;
      const py = y + Math.sin(a) * 16;
      ctx.fillStyle = i % 2 ? '#ff8020' : '#ffff00';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 5, y - 2, 3, 0, Math.PI * 2); ctx.arc(x + 5, y - 2, 3, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'ice-elemental') {
    ctx.fillStyle = '#a0e0ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#a0e0ff';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.3);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size * 1.3);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#004080';
    ctx.beginPath(); ctx.arc(x - 3, y - 2, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 2, 1.5, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'ice-queen') {
    ctx.fillStyle = '#80c8e8';
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 22); ctx.lineTo(x + 18, y + 22); ctx.lineTo(x + 10, y - 4); ctx.lineTo(x - 10, y - 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a0e0ff';
    ctx.beginPath(); ctx.arc(x, y - 8, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0f8ff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#a0e0ff';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 16);
    ctx.lineTo(x - 12, y - 26); ctx.lineTo(x - 6, y - 22); ctx.lineTo(x - 2, y - 30);
    ctx.lineTo(x + 2, y - 22); ctx.lineTo(x + 8, y - 26); ctx.lineTo(x + 12, y - 22); ctx.lineTo(x + 12, y - 16);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0080c0';
    ctx.beginPath(); ctx.arc(x - 3, y - 10, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 10, 1.5, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'sand-worm') {
    ctx.fillStyle = '#c8a060';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x - 10 + i * 7, y + Math.sin(i) * 3, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x + 10, y - 3, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x + 12, y - 6, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + 10, y + 4);
    ctx.fill();

  } else if (id === 'sand-king') {
    ctx.fillStyle = '#c89860';
    ctx.fillRect(x - 12, y - 6, 24, 22);
    ctx.fillStyle = '#e0c090';
    ctx.beginPath(); ctx.arc(x, y - 12, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a07040';
    ctx.beginPath();
    ctx.arc(x, y - 18, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 12, y - 18, 24, 6);
    ctx.fillStyle = '#ff2040';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff2040';
    ctx.beginPath(); ctx.arc(x, y - 16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x, y + 2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 4, y - 12, 1.5, 0, Math.PI * 2); ctx.arc(x + 4, y - 12, 1.5, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'flying-tome') {
    ctx.fillStyle = '#8a4a2a';
    ctx.fillRect(x - 12, y - 8, 24, 16);
    ctx.strokeStyle = '#5a2a1a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 12, y - 8, 24, 16);
    ctx.fillStyle = '#f0ead0';
    ctx.fillRect(x - 10, y - 6, 20, 12);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y, 2, 0, Math.PI * 2); ctx.arc(x + 4, y, 2, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'book-guardian') {
    ctx.fillStyle = '#6a2a1a';
    ctx.fillRect(x - 16, y - 12, 32, 22);
    ctx.strokeStyle = '#3a1a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 16, y - 12, 32, 22);
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x - 3, y - 12, 6, 22);
    ctx.fillStyle = '#ffe000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 8, y - 2, 2, 0, Math.PI * 2); ctx.arc(x + 8, y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (id === 'archmage') {
    ctx.fillStyle = '#4a1a80';
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 20); ctx.lineTo(x + 14, y + 20); ctx.lineTo(x + 8, y - 8); ctx.lineTo(x - 8, y - 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath(); ctx.arc(x, y - 12, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a0a4a';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 16); ctx.lineTo(x + 12, y - 16); ctx.lineTo(x, y - 38);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe060';
    ctx.fillRect(x - 12, y - 17, 24, 3);
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x, y + 6);
    ctx.fill();
    ctx.fillStyle = '#3a1a0a';
    ctx.fillRect(x + 16, y - 16, 3, 36);
    ctx.shadowBlur = 15; ctx.shadowColor = '#ffd060';
    ctx.fillStyle = '#ffe060';
    ctx.beginPath(); ctx.arc(x + 17.5, y - 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (id === 'dragonling') {
    ctx.fillStyle = '#c04020';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a2010';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 4); ctx.lineTo(x - 20, y - 12); ctx.lineTo(x - 8, y + 2);
    ctx.moveTo(x + 8, y - 4); ctx.lineTo(x + 20, y - 12); ctx.lineTo(x + 8, y + 2);
    ctx.fill();
    ctx.fillStyle = '#c04020';
    ctx.beginPath(); ctx.arc(x, y - 8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe000';
    ctx.beginPath(); ctx.arc(x + 2, y - 9, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a1a0a';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 14); ctx.lineTo(x - 6, y - 20); ctx.lineTo(x - 2, y - 15);
    ctx.moveTo(x + 4, y - 14); ctx.lineTo(x + 6, y - 20); ctx.lineTo(x + 2, y - 15);
    ctx.fill();

  } else if (id === 'fire-drake') {
    ctx.fillStyle = '#8a2010';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a1008';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 4); ctx.lineTo(x - 30, y - 16); ctx.lineTo(x - 12, y + 6);
    ctx.moveTo(x + 12, y - 4); ctx.lineTo(x + 30, y - 16); ctx.lineTo(x + 12, y + 6);
    ctx.fill();
    ctx.fillStyle = '#8a2010';
    ctx.beginPath(); ctx.arc(x, y - 12, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 3, y - 13, 2.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#3a0a04';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 20); ctx.lineTo(x - 10, y - 28); ctx.lineTo(x - 2, y - 21);
    ctx.moveTo(x + 6, y - 20); ctx.lineTo(x + 10, y - 28); ctx.lineTo(x + 2, y - 21);
    ctx.fill();
    ctx.fillStyle = '#ff8000';
    ctx.shadowBlur = 12; ctx.shadowColor = '#ff8000';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 4); ctx.lineTo(x, y + 4); ctx.lineTo(x + 4, y - 4);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (id === 'dragon-guardian') {
    ctx.fillStyle = '#2a3a2a';
    ctx.fillRect(x - 14, y - 8, 28, 22);
    ctx.fillStyle = '#3a4a3a';
    ctx.beginPath(); ctx.arc(x, y - 14, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2a1a';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 8 + i * 8, y - 24); ctx.lineTo(x - 6 + i * 8, y - 30); ctx.lineTo(x - 4 + i * 8, y - 24);
      ctx.fill();
    }
    ctx.fillStyle = '#00ff80';
    ctx.shadowBlur = 8; ctx.shadowColor = '#00ff80';
    ctx.beginPath(); ctx.arc(x - 4, y - 14, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (id === 'ancient-dragon') {
    ctx.fillStyle = '#8a1010';
    ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.ellipse(x, y + 6, 24, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5a0808';
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 4); ctx.lineTo(x - 38, y - 20); ctx.lineTo(x - 14, y + 8);
    ctx.moveTo(x + 14, y - 4); ctx.lineTo(x + 38, y - 20); ctx.lineTo(x + 14, y + 8);
    ctx.fill();
    ctx.fillStyle = '#8a1010';
    ctx.beginPath(); ctx.arc(x, y - 16, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe000';
    ctx.shadowBlur = 15; ctx.shadowColor = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 4, y - 17, 3, 0, Math.PI * 2); ctx.arc(x + 4, y - 17, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2a0404';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 26); ctx.lineTo(x - 14, y - 38); ctx.lineTo(x - 2, y - 27);
    ctx.moveTo(x + 8, y - 26); ctx.lineTo(x + 14, y - 38); ctx.lineTo(x + 2, y - 27);
    ctx.fill();

  } else {
    ctx.fillStyle = isBoss ? '#b060ff' : isElite ? '#ffa500' : '#d63030';
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  const bw = isBoss ? 60 : 40;
  const hpY = y - size - (isBoss ? 25 : isElite ? 20 : 15);
  ctx.fillStyle = '#05020a';
  ctx.fillRect(x - bw / 2, hpY, bw, 4);
  ctx.fillStyle = isBoss ? '#b060ff' : isElite ? '#ffa500' : '#d63030';
  ctx.fillRect(x - bw / 2, hpY, bw * (e.hp / e.maxHp), 4);
}

// ==================== NPC И СТАТИКА ====================
export function drawStatic(ctx, obj, x, y, shadowColor) {
  const id = obj.id;

  if (id !== 'well' && id !== 'questBoard') {
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (id) {
    case 'blacksmith': {
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 9, y - 2, 18, 16);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(x - 9, y - 8, 18, 8);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 14, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2010';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 10); ctx.lineTo(x + 5, y - 10); ctx.lineTo(x, y - 2);
      ctx.fill();
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 12, y - 8, 3, 20);
      ctx.fillStyle = '#666';
      ctx.fillRect(x + 8, y - 12, 11, 6);
      break;
    }
    case 'healer': {
      ctx.fillStyle = '#e8f0e8';
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 14); ctx.lineTo(x + 9, y + 14); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x - 7, y - 6);
      ctx.fill();
      ctx.fillStyle = '#40c040';
      ctx.fillRect(x - 1, y - 4, 2, 8);
      ctx.fillRect(x - 4, y - 1, 8, 2);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9a060';
      ctx.beginPath(); ctx.arc(x, y - 15, 6, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - 6, y - 15, 3, 10);
      ctx.fillRect(x + 3, y - 15, 3, 10);
      break;
    }
    case 'alchemist': {
      ctx.fillStyle = '#5a2090';
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 14); ctx.lineTo(x + 9, y + 14); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x - 7, y - 6);
      ctx.fill();
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a1060';
      ctx.beginPath(); ctx.arc(x, y - 14, 7, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#a0f0ff';
      ctx.shadowBlur = 8; ctx.shadowColor = '#a0f0ff';
      ctx.beginPath(); ctx.arc(x + 13, y - 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + 12, y - 10, 2, 6);
      ctx.shadowBlur = 0;
      break;
    }
    case 'merchant': {
      ctx.fillStyle = '#a02020';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      ctx.fillStyle = '#ffd060';
      ctx.fillRect(x - 9, y + 4, 18, 2);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a2a1a';
      ctx.beginPath();
      ctx.ellipse(x, y - 17, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 5, y - 22, 10, 6);
      ctx.fillStyle = '#ffd060';
      ctx.beginPath(); ctx.arc(x + 12, y, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'elder': {
      ctx.fillStyle = '#6a4a2a';
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 14); ctx.lineTo(x + 9, y + 14); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x - 6, y - 6);
      ctx.fill();
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 8); ctx.lineTo(x, y + 4);
      ctx.fill();
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x - 6, y - 16, 12, 3);
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 12, y - 8, 2, 22);
      break;
    }
    case 'guard': {
      ctx.fillStyle = '#606060';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      ctx.fillStyle = '#404040';
      ctx.beginPath(); ctx.arc(x - 10, y - 2, 4, 0, Math.PI * 2); ctx.arc(x + 10, y - 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#707070';
      ctx.beginPath(); ctx.arc(x, y - 14, 7, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2a4a8a';
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 6); ctx.lineTo(x - 16, y + 6); ctx.lineTo(x - 12, y + 10); ctx.lineTo(x - 8, y + 6); ctx.lineTo(x - 8, y - 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 12, y - 18, 2, 32);
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(x + 13, y - 24); ctx.lineTo(x + 16, y - 18); ctx.lineTo(x + 10, y - 18);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'bard': {
      ctx.fillStyle = '#c060a0';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a1a4a';
      ctx.beginPath();
      ctx.ellipse(x, y - 16, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 5, y - 22, 10, 6);
      ctx.fillStyle = '#ffd060';
      ctx.beginPath(); ctx.arc(x + 6, y - 20, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8b4513';
      ctx.beginPath(); ctx.ellipse(x + 13, y + 2, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x + 11, y - 10, 2, 12);
      break;
    }
    case 'herald': {
      ctx.fillStyle = '#c02020';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a1010';
      ctx.fillRect(x - 6, y - 20, 12, 4);
      ctx.fillRect(x - 4, y - 22, 8, 4);
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.moveTo(x + 10, y); ctx.lineTo(x + 20, y - 6); ctx.lineTo(x + 20, y + 6);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'cat': {
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.ellipse(x, y + 2, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 6, y - 4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 8); ctx.lineTo(x + 1, y - 14); ctx.lineTo(x + 6, y - 10);
      ctx.moveTo(x + 10, y - 8); ctx.lineTo(x + 11, y - 14); ctx.lineTo(x + 6, y - 10);
      ctx.fill();
      ctx.fillStyle = '#ffe000';
      ctx.beginPath(); ctx.arc(x + 4, y - 5, 1.5, 0, Math.PI * 2); ctx.arc(x + 8, y - 5, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 9, y + 2); ctx.quadraticCurveTo(x - 15, y - 2, x - 12, y - 8); ctx.stroke();
      break;
    }
    case 'kids': {
      ctx.fillStyle = '#5a8ac8';
      ctx.fillRect(x - 6, y, 12, 12);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9a060';
      ctx.beginPath(); ctx.arc(x, y - 8, 5, Math.PI, 0); ctx.fill();
      break;
    }
    case 'well': {
      ctx.fillStyle = '#2a4a8a';
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#4ac8ff';
      ctx.shadowBlur = 12; ctx.shadowColor = '#4ac8ff';
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'questBoard': {
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x - 14, y - 18, 3, 36);
      ctx.fillRect(x + 11, y - 18, 3, 36);
      ctx.fillStyle = '#8a5a2a';
      ctx.fillRect(x - 14, y - 18, 28, 22);
      ctx.fillStyle = '#f0ead0';
      ctx.fillRect(x - 11, y - 16, 8, 10);
      ctx.fillRect(x + 1, y - 14, 9, 8);
      ctx.fillRect(x - 6, y - 4, 10, 6);
      break;
    }
    default: {
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
    }
  }
}