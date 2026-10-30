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

// Анимация покачивания
const getBob = () => Math.sin(performance.now() / 200) * 1.5;

// ==================== ИГРОК ====================
export function drawPlayerByClass(ctx, x, y, playerClass, shadowColor) {
  const bob = getBob();
  const py = y + bob;

  // Тень
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Обводка для контраста (спрайтовый эффект)
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#000';

  if (playerClass === 'warrior') {
    // Ноги
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 6, py + 6, 5, 8); ctx.fillRect(x + 1, py + 6, 5, 8);
    // Плащ
    ctx.fillStyle = '#600'; ctx.beginPath();
    ctx.moveTo(x - 12, py - 4); ctx.lineTo(x + 12, py - 4); ctx.lineTo(x + 16, py + 14); ctx.lineTo(x - 16, py + 14); ctx.fill();
    // Броня
    ctx.fillStyle = '#808080'; ctx.fillRect(x - 9, py - 6, 18, 14);
    ctx.fillStyle = '#a0a0a0'; ctx.fillRect(x - 7, py - 6, 14, 8);
    // Голова и шлем
    ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#606060'; ctx.beginPath(); ctx.arc(x, py - 14, 7, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(x - 5, py - 12, 10, 2); // Прорезь шлема
    // Меч
    ctx.fillStyle = '#d0d0d0'; ctx.fillRect(x + 10, py - 10, 3, 20);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(x + 8, py + 10, 7, 3);
    ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(x + 11.5, py - 12, 2, 0, Math.PI * 2); ctx.fill();

  } else if (playerClass === 'mage') {
    // Мантия
    ctx.fillStyle = '#2a0a4a'; 
    ctx.beginPath(); ctx.moveTo(x - 10, py + 14); ctx.lineTo(x + 10, py + 14); ctx.lineTo(x + 6, py - 6); ctx.lineTo(x - 6, py - 6); ctx.fill();
    // Рукава
    ctx.fillStyle = '#3a1560'; ctx.fillRect(x - 12, py - 2, 6, 8); ctx.fillRect(x + 6, py - 2, 6, 8);
    // Звезды на мантии
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 4, py + 2, 2, 2); ctx.fillRect(x + 3, py + 6, 2, 2);
    // Голова
    ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 6, 0, Math.PI * 2); ctx.fill();
    // Борода
    ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.moveTo(x - 5, py - 8); ctx.lineTo(x + 5, py - 8); ctx.lineTo(x, py + 2); ctx.fill();
    // Шляпа
    ctx.fillStyle = '#1a0530'; ctx.beginPath(); ctx.moveTo(x - 12, py - 14); ctx.lineTo(x + 12, py - 14); ctx.lineTo(x, py - 32); ctx.fill();
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 12, py - 15, 24, 2);
    // Посох
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(x + 13, py - 10, 2, 24);
    ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#a0f0ff'; ctx.beginPath(); ctx.arc(x + 14, py - 12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (playerClass === 'priest') {
    // Роба
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.moveTo(x - 10, py + 14); ctx.lineTo(x + 10, py + 14); ctx.lineTo(x + 7, py - 6); ctx.lineTo(x - 7, py - 6); ctx.fill();
    // Золотая отделка
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 8, py + 4, 16, 2); ctx.fillRect(x - 1, py - 4, 2, 6); ctx.fillRect(x - 3, py - 2, 6, 2);
    // Голова
    ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 6, 0, Math.PI * 2); ctx.fill();
    // Капюшон
    ctx.fillStyle = '#d0c8a0'; ctx.beginPath(); ctx.arc(x, py - 14, 7, Math.PI, 0); ctx.fill();
    // Святой символ над головой
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffd060';
    ctx.strokeStyle = '#ffd060'; ctx.beginPath(); ctx.arc(x, py - 24, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    // Посох с крестом
    ctx.fillStyle = '#8b4513'; ctx.fillRect(x + 12, py - 8, 2, 22);
    ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 10, py - 10, 6, 2); ctx.fillRect(x + 12, py - 13, 2, 8);
  }
}

// ==================== ВРАГИ ====================
export function drawEnemyByType(ctx, e, x, y, shadowColor) {
  const size = e.boss ? 22 : e.elite ? 16 : 12;
  const isBoss = e.boss;
  const isElite = e.elite;
  const bob = getBob();
  const ey = y + bob;

  // Тень
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x, y + size - 2, size, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBoss) { ctx.shadowBlur = 20; ctx.shadowColor = '#b060ff'; }
  else if (isElite) { ctx.shadowBlur = 10; ctx.shadowColor = '#ffa500'; }

  const id = e.enemyId;
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#000';

  if (id === 'goblin') {
    // Тело
    ctx.fillStyle = '#3a7030'; ctx.beginPath(); ctx.ellipse(x, ey, size, size*0.8, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Уши
    ctx.beginPath(); ctx.moveTo(x - size + 2, ey - 4); ctx.lineTo(x - size - 8, ey - 10); ctx.lineTo(x - size + 2, ey - 8); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + size - 2, ey - 4); ctx.lineTo(x + size + 8, ey - 10); ctx.lineTo(x + size - 2, ey - 8); ctx.fill(); ctx.stroke();
    // Глаза
    ctx.fillStyle = '#ffe000'; ctx.beginPath(); ctx.arc(x - 4, ey - 2, 2.5, 0, Math.PI * 2); ctx.arc(x + 4, ey - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - 4, ey - 2, 1, 0, Math.PI * 2); ctx.arc(x + 4, ey - 2, 1, 0, Math.PI * 2); ctx.fill();
    // Кинжал
    ctx.fillStyle = '#a0a0a0'; ctx.fillRect(x + size, ey, 2, 10);

  } else if (id === 'skeleton' || id === 'skeleton-archer') {
    // Кости
    ctx.fillStyle = '#e0dcd0'; 
    ctx.beginPath(); ctx.arc(x, ey - 4, size * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Глазницы
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - 4, ey - 5, 2, 0, Math.PI * 2); ctx.arc(x + 4, ey - 5, 2, 0, Math.PI * 2); ctx.fill();
    // Ребра
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.ellipse(x, ey + 4 + i * 3, size * 0.6, 1.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (id === 'skeleton-archer') {
      // Лук
      ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + size + 4, ey, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + size + 4, ey - 8); ctx.lineTo(x + size + 4, ey + 8); ctx.stroke();
    } else {
      // Ржавый меч
      ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x + size, ey - 8, 3, 16);
    }

  } else if (id === 'wolf' || id === 'frost-wolf') {
    const c = id === 'frost-wolf' ? '#8cc8e8' : '#404040';
    ctx.fillStyle = c;
    // Туловище
    ctx.beginPath(); ctx.ellipse(x - 2, ey, size * 1.3, size * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Голова
    ctx.beginPath(); ctx.arc(x + size * 0.8, ey - 4, size * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Уши
    ctx.beginPath(); ctx.moveTo(x + size*0.5, ey - size*0.6); ctx.lineTo(x + size*0.45, ey - size*1.0); ctx.lineTo(x + size*0.8, ey - size*0.5); ctx.fill(); ctx.stroke();
    // Глаз
    ctx.fillStyle = id === 'frost-wolf' ? '#00ffff' : '#ff2020'; ctx.beginPath(); ctx.arc(x + size * 0.9, ey - 5, 1.5, 0, Math.PI * 2); ctx.fill();
    // Хвост
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - size * 1.2, ey); ctx.quadraticCurveTo(x - size * 1.8, ey - 8, x - size * 1.5, ey - 14); ctx.stroke();

  } else if (id === 'ghost' || id === 'wraith' || id === 'dust-wraith') {
    const c = id === 'dust-wraith' ? '#a08050' : id === 'wraith' ? '#4a4a6a' : '#a0d0ff';
    ctx.globalAlpha = 0.8; ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, ey - 6, size, Math.PI, 0);
    ctx.lineTo(x + size, ey + 4);
    ctx.quadraticCurveTo(x + size * 0.66, ey + 10, x + size * 0.33, ey + 6);
    ctx.quadraticCurveTo(x, ey + 12, x - size * 0.33, ey + 6);
    ctx.quadraticCurveTo(x - size * 0.66, ey + 10, x - size, ey + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = '#000';
    // Глаза-дыры
    ctx.beginPath(); ctx.arc(x - 4, ey - 8, 2, 0, Math.PI * 2); ctx.arc(x + 4, ey - 8, 2, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'fire-elemental') {
    const grd = ctx.createLinearGradient(x, ey - size * 1.5, x, ey + size);
    grd.addColorStop(0, '#fff'); grd.addColorStop(0.4, '#ff8000'); grd.addColorStop(1, '#a00000');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(x, ey - size * 1.3); ctx.quadraticCurveTo(x + size * 1.2, ey - size * 0.3, x + size, ey + size * 0.5);
    ctx.quadraticCurveTo(x + size * 0.5, ey + size, x, ey + size * 0.7); ctx.quadraticCurveTo(x - size * 0.5, ey + size, x - size, ey + size * 0.5);
    ctx.quadraticCurveTo(x - size * 1.2, ey - size * 0.3, x, ey - size * 1.3); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - 3, ey, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, ey, 1.5, 0, Math.PI * 2); ctx.fill();

  } else if (id === 'dragonling' || id === 'fire-drake' || id === 'ancient-dragon') {
    const isAncient = id === 'ancient-dragon';
    const isDrake = id === 'fire-drake';
    const scale = isAncient ? 1.6 : isDrake ? 1.3 : 1;
    const cBody = isAncient ? '#500' : '#c04020';
    const cWing = isAncient ? '#300' : '#8a2010';
    
    // Крылья (сзади)
    ctx.fillStyle = cWing;
    ctx.beginPath();
    ctx.moveTo(x - size*0.5, ey); ctx.lineTo(x - size*2*scale, ey - size*1.2*scale); ctx.lineTo(x - size*0.8, ey + size*0.5);
    ctx.moveTo(x + size*0.5, ey); ctx.lineTo(x + size*2*scale, ey - size*1.2*scale); ctx.lineTo(x + size*0.8, ey + size*0.5);
    ctx.fill(); ctx.stroke();
    // Тело
    ctx.fillStyle = cBody; ctx.beginPath(); ctx.ellipse(x, ey + size*0.2, size*1.2*scale, size*0.8*scale, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Голова
    ctx.beginPath(); ctx.arc(x, ey - size*0.8*scale, size*0.7*scale, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Рога
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.moveTo(x - 4, ey - size*1.4*scale); ctx.lineTo(x - 8, ey - size*2*scale); ctx.lineTo(x - 2, ey - size*1.4*scale); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 4, ey - size*1.4*scale); ctx.lineTo(x + 8, ey - size*2*scale); ctx.lineTo(x + 2, ey - size*1.4*scale); ctx.fill();
    // Глаза
    ctx.fillStyle = '#ff0'; ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
    ctx.beginPath(); ctx.arc(x - 4, ey - size*0.9*scale, 2, 0, Math.PI*2); ctx.arc(x + 4, ey - size*0.9*scale, 2, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

  // ⬇️ НОВЫЕ ВРАГИ ⬇️
  
  } else if (id === 'dark-knight') {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x - size*0.8, ey - size*0.5, size*1.6, size*1.2); ctx.stroke();
    // Шлем
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x, ey - size*0.8, size*0.6, Math.PI, 0); ctx.fill(); ctx.stroke();
    // Рога
    ctx.beginPath(); ctx.moveTo(x - size*0.6, ey - size*0.9); ctx.lineTo(x - size*1, ey - size*1.5); ctx.lineTo(x - size*0.4, ey - size*1.1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + size*0.6, ey - size*0.9); ctx.lineTo(x + size*1, ey - size*1.5); ctx.lineTo(x + size*0.4, ey - size*1.1); ctx.fill();
    // Глаза
    ctx.fillStyle = '#ff2020'; ctx.fillRect(x - 4, ey - size*0.8, 3, 2); ctx.fillRect(x + 1, ey - size*0.8, 3, 2);
    // Меч
    ctx.fillStyle = '#888'; ctx.fillRect(x + size, ey - size*0.5, 3, size*1.5);
    ctx.fillStyle = '#500'; ctx.fillRect(x + size - 2, ey + size, 7, 3);

  } else if (id === 'shadow-mage') {
    ctx.fillStyle = '#2a0a3a'; ctx.beginPath(); ctx.moveTo(x - size, ey + size); ctx.lineTo(x + size, ey + size); ctx.lineTo(x + size*0.5, ey - size*0.5); ctx.lineTo(x - size*0.5, ey - size*0.5); ctx.fill(); ctx.stroke();
    // Капюшон
    ctx.fillStyle = '#0a0010'; ctx.beginPath(); ctx.arc(x, ey - size*0.6, size*0.6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Глаза
    ctx.fillStyle = '#b060ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#b060ff';
    ctx.beginPath(); ctx.arc(x - 3, ey - size*0.6, 1.5, 0, Math.PI*2); ctx.arc(x + 3, ey - size*0.6, 1.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    // Посох
    ctx.fillStyle = '#1a0a2a'; ctx.fillRect(x + size*0.8, ey - size, 2, size*1.5);
    ctx.fillStyle = '#b060ff'; ctx.beginPath(); ctx.arc(x + size*0.8 + 1, ey - size, 3, 0, Math.PI*2); ctx.fill();

  } else if (id === 'grave-king' || id === 'sand-king' || id === 'ice-queen') {
    const isGrave = id === 'grave-king';
    const isSand = id === 'sand-king';
    const isIce = id === 'ice-queen';
    const bodyColor = isGrave ? '#2a2a2a' : isSand ? '#c0a060' : '#a0d0ff';
    ctx.fillStyle = bodyColor;
    // Плащ
    ctx.beginPath(); ctx.moveTo(x - size*1.2, ey + size*1.2); ctx.lineTo(x + size*1.2, ey + size*1.2); ctx.lineTo(x + size*0.8, ey - size*0.5); ctx.lineTo(x - size*0.8, ey - size*0.5); ctx.fill(); ctx.stroke();
    // Голова
    ctx.fillStyle = isGrave ? '#e0dcd0' : '#ffcc99'; ctx.beginPath(); ctx.arc(x, ey - size*0.8, size*0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    if (isGrave) { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - 3, ey - size*0.9, 2, 0, Math.PI*2); ctx.arc(x + 3, ey - size*0.9, 2, 0, Math.PI*2); ctx.fill(); }
    // Корона
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.moveTo(x - size*0.5, ey - size*1.2); ctx.lineTo(x - size*0.3, ey - size*1.6); ctx.lineTo(x, ey - size*1.3); ctx.lineTo(x + size*0.3, ey - size*1.6); ctx.lineTo(x + size*0.5, ey - size*1.2); ctx.fill(); ctx.stroke();
    if (isIce) { ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(x, ey - size*1.5, 2, 0, Math.PI*2); ctx.fill(); }
    // Скипетр/Оружие
    ctx.fillStyle = isGrave ? '#500' : isSand ? '#d4af37' : '#00ffff';
    ctx.fillRect(x + size*0.9, ey - size, 3, size*1.5);

  } else if (id === 'magma-golem' || id === 'ice-elemental') {
    const isMagma = id === 'magma-golem';
    ctx.fillStyle = isMagma ? '#2a1a1a' : '#4a6a8a';
    ctx.beginPath(); ctx.arc(x, ey, size, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Кристаллы/Лава
    ctx.fillStyle = isMagma ? '#ff4000' : '#a0f0ff';
    ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
    if (isMagma) {
      ctx.beginPath(); ctx.moveTo(x - 5, ey + 5); ctx.lineTo(x, ey - 15); ctx.lineTo(x + 5, ey + 5); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(x - 8, ey); ctx.lineTo(x - 4, ey - 12); ctx.lineTo(x, ey); ctx.lineTo(x + 4, ey - 12); ctx.lineTo(x + 8, ey); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // Глаза
    ctx.fillStyle = isMagma ? '#ffd060' : '#fff';
    ctx.beginPath(); ctx.arc(x - 4, ey - 2, 2, 0, Math.PI*2); ctx.arc(x + 4, ey - 2, 2, 0, Math.PI*2); ctx.fill();

  } else if (id === 'flame-lord') {
    ctx.fillStyle = '#8a1a00'; ctx.beginPath(); ctx.arc(x, ey, size*1.2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Огненная аура
    ctx.fillStyle = '#ff4000'; ctx.shadowBlur = 15; ctx.shadowColor = '#ff8000';
    ctx.beginPath(); ctx.arc(x, ey, size*1.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    // Рога
    ctx.fillStyle = '#1a0000';
    ctx.beginPath(); ctx.moveTo(x - 6, ey - size); ctx.lineTo(x - 12, ey - size*2); ctx.lineTo(x - 2, ey - size*1.2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 6, ey - size); ctx.lineTo(x + 12, ey - size*2); ctx.lineTo(x + 2, ey - size*1.2); ctx.fill();
    // Глаза
    ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(x - 5, ey - 2, 3, 0, Math.PI*2); ctx.arc(x + 5, ey - 2, 3, 0, Math.PI*2); ctx.fill();

  } else if (id === 'sand-worm') {
    ctx.fillStyle = '#b09050';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.arc(x + i*8, ey + Math.sin(performance.now()/200 + i)*4, size*0.6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
    // Пасть
    ctx.fillStyle = '#500'; ctx.beginPath(); ctx.arc(x + size*1.5, ey, size*0.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + size*1.2, ey - 4); ctx.lineTo(x + size*1.6, ey - 2); ctx.lineTo(x + size*1.2, ey); ctx.fill();

  } else if (id === 'flying-tome' || id === 'book-guardian') {
    const isTome = id === 'flying-tome';
    ctx.fillStyle = isTome ? '#400' : '#2a4a2a';
    ctx.fillRect(x - size, ey - size*0.5, size*2, size*1.5); ctx.stroke();
    // Страницы
    ctx.fillStyle = '#e0d0a0';
    ctx.fillRect(x - size*0.8, ey - size*0.3, size*1.6, size*1.1);
    // Крылья/Руки
    if (isTome) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - size, ey - size*0.5); ctx.lineTo(x - size*2, ey - size); ctx.lineTo(x - size*1.2, ey); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + size, ey - size*0.5); ctx.lineTo(x + size*2, ey - size); ctx.lineTo(x + size*1.2, ey); ctx.fill();
    } else {
      ctx.fillStyle = '#2a4a2a'; ctx.fillRect(x - size*1.5, ey, 4, size*0.8); ctx.fillRect(x + size*1.5 - 4, ey, 4, size*0.8);
    }
    // Глаза
    ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(x - 4, ey, 2, 0, Math.PI*2); ctx.arc(x + 4, ey, 2, 0, Math.PI*2); ctx.fill();

  } else if (id === 'archmage') {
    // Мантия
    ctx.fillStyle = '#1a2a5a'; ctx.beginPath(); ctx.moveTo(x - size, ey + size); ctx.lineTo(x + size, ey + size); ctx.lineTo(x + size*0.6, ey - size*0.5); ctx.lineTo(x - size*0.6, ey - size*0.5); ctx.fill(); ctx.stroke();
    // Шляпа
    ctx.fillStyle = '#0a1a3a'; ctx.beginPath(); ctx.moveTo(x - size, ey - size*0.6); ctx.lineTo(x + size, ey - size*0.6); ctx.lineTo(x, ey - size*2); ctx.fill();
    // Борода
    ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.moveTo(x - 5, ey - size*0.6); ctx.lineTo(x + 5, ey - size*0.6); ctx.lineTo(x, ey + 5); ctx.fill();
    // Посох
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(x + size, ey - size, 2, size*1.5);
    ctx.fillStyle = '#60a0ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#60a0ff';
    ctx.beginPath(); ctx.arc(x + size + 1, ey - size, 4, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

  } else if (id === 'dragon-guardian') {
    // Тело дракона в доспехах
    ctx.fillStyle = '#2a3a4a'; ctx.beginPath(); ctx.ellipse(x, ey + size*0.2, size, size*0.8, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Щит
    ctx.fillStyle = '#606060'; ctx.beginPath(); ctx.arc(x - size, ey, size*0.8, -Math.PI/2, Math.PI/2); ctx.fill(); ctx.stroke();
    // Голова
    ctx.fillStyle = '#4a5a6a'; ctx.beginPath(); ctx.arc(x + size*0.5, ey - size*0.6, size*0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Гребень
    ctx.fillStyle = '#ff4000'; ctx.beginPath(); ctx.moveTo(x + size*0.5, ey - size*0.9); ctx.lineTo(x + size*0.8, ey - size*1.4); ctx.lineTo(x + size*0.2, ey - size*0.9); ctx.fill();
    // Глаз
    ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(x + size*0.7, ey - size*0.6, 2, 0, Math.PI*2); ctx.fill();

  } else {
    // Стандартный враг (если не найден ID)
    ctx.fillStyle = isBoss ? '#b060ff' : isElite ? '#ffa500' : '#d63030';
    ctx.beginPath(); ctx.arc(x, ey, size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Злые глаза
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - 4, ey, 2, 0, Math.PI * 2); ctx.arc(x + 4, ey, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; 
    ctx.beginPath(); ctx.moveTo(x - 7, ey - 4); ctx.lineTo(x - 2, ey - 2); 
    ctx.moveTo(x + 7, ey - 4); ctx.lineTo(x + 2, ey - 2); ctx.stroke();
  }

  ctx.shadowBlur = 0; // Сброс свечения

  // Полоска HP
  const bw = isBoss ? 60 : 40;
  const hpY = ey - size - (isBoss ? 25 : isElite ? 20 : 15);
  ctx.fillStyle = '#05020a'; ctx.fillRect(x - bw / 2, hpY, bw, 4);
  ctx.fillStyle = isBoss ? '#b060ff' : isElite ? '#ffa500' : '#d63030';
  ctx.fillRect(x - bw / 2, hpY, bw * (e.hp / e.maxHp), 4);
}

// ==================== NPC И СТАТИКА ====================
export function drawStatic(ctx, obj, x, y, shadowColor) {
  const id = obj.id;
  const bob = getBob();
  const py = y + bob;

  if (id !== 'well' && id !== 'questBoard') {
    ctx.fillStyle = shadowColor;
    ctx.beginPath(); ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  }

  ctx.lineWidth = 1.5; ctx.strokeStyle = '#000';

  switch (id) {
    case 'blacksmith': {
      // Наковальня
      ctx.fillStyle = '#444'; ctx.fillRect(x - 12, py + 4, 24, 8); ctx.strokeRect(x - 12, py + 4, 24, 8);
      ctx.fillStyle = '#555'; ctx.fillRect(x - 8, py + 12, 16, 4);
      // Кузнец
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(x - 6, py - 4, 12, 14);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 10, 5, 0, Math.PI*2); ctx.fill();
      // Молот
      ctx.fillStyle = '#8b4513'; ctx.fillRect(x + 6, py - 8, 2, 12);
      ctx.fillStyle = '#888'; ctx.fillRect(x + 4, py - 10, 6, 4);
      break;
    }
    
    case 'healer': {
      // Роба лекаря (светло-зеленая)
      ctx.fillStyle = '#e8f0e8';
      ctx.beginPath();
      ctx.moveTo(x - 10, py + 14);
      ctx.lineTo(x + 10, py + 14);
      ctx.lineTo(x + 7, py - 6);
      ctx.lineTo(x - 7, py - 6);
      ctx.fill(); ctx.stroke();
      
      // Зеленая отделка пояса
      ctx.fillStyle = '#40c040';
      ctx.fillRect(x - 8, py + 4, 16, 2);

      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, py - 12, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      
      // Капюшон (светло-зеленый)
      ctx.fillStyle = '#a0d0a0';
      ctx.beginPath(); ctx.arc(x, py - 14, 7, Math.PI, 0); ctx.fill(); ctx.stroke();

      // Крест на груди
      ctx.fillStyle = '#40c040';
      ctx.fillRect(x - 2, py - 4, 4, 8);
      ctx.fillRect(x - 4, py - 2, 8, 4);

      // Посох
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 10, py - 8, 2, 22);

      // Светящийся шар исцеления на посохе
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60ff60';
      ctx.fillStyle = '#a0ffa0';
      ctx.beginPath(); ctx.arc(x + 11, py - 10, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }

    case 'merchant': {
      // Ящик
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 10, py + 2, 20, 10); ctx.strokeRect(x - 10, py + 2, 20, 10);
      // Торговец
      ctx.fillStyle = '#a02020'; ctx.fillRect(x - 6, py - 8, 12, 12);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 5, 0, Math.PI*2); ctx.fill();
      // Шляпа
      ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x - 8, py - 18, 16, 4);
      // Монетка
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(x + 12, py - 6, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      break;
    }
    case 'guard': {
      // Тело
      ctx.fillStyle = '#606060'; ctx.fillRect(x - 8, py - 6, 16, 18); ctx.strokeRect(x - 8, py - 6, 16, 18);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 5, 0, Math.PI*2); ctx.fill();
      // Шлем
      ctx.fillStyle = '#808080'; ctx.beginPath(); ctx.arc(x, py - 14, 6, Math.PI, 0); ctx.fill();
      // Копье
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(x + 10, py - 16, 2, 30);
      ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.moveTo(x + 11, py - 24); ctx.lineTo(x + 13, py - 16); ctx.lineTo(x + 9, py - 16); ctx.fill();
      break;
    }
    case 'well': {
      // Каменный колодец
      ctx.fillStyle = '#4a4a4a'; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
      // Вода
      ctx.fillStyle = '#2a8ac8'; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      // Крыша
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(x - 16, y - 20, 2, 20); ctx.fillRect(x + 14, y - 20, 2, 20);
      ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(x - 20, y - 20); ctx.lineTo(x + 20, y - 20); ctx.lineTo(x, y - 34); ctx.fill(); ctx.stroke();
      break;
    }
    case 'cat': {
      // Тело
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(x, py + 2, 8, 6, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Голова
      ctx.beginPath(); ctx.arc(x + 6, py - 4, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Уши
      ctx.beginPath(); ctx.moveTo(x + 3, py - 8); ctx.lineTo(x + 2, py - 12); ctx.lineTo(x + 6, py - 9); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 9, py - 8); ctx.lineTo(x + 10, py - 12); ctx.lineTo(x + 6, py - 9); ctx.fill();
      // Глаза
      ctx.fillStyle = '#e0ff00'; ctx.beginPath(); ctx.arc(x + 5, py - 4, 1.5, 0, Math.PI*2); ctx.arc(x + 8, py - 4, 1.5, 0, Math.PI*2); ctx.fill();
      // Хвост
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 7, py + 2); ctx.quadraticCurveTo(x - 14, py - 2, x - 10, py - 10); ctx.stroke();
      break;
    }
    case 'questBoard': {
      // Столбы
      ctx.fillStyle = '#3a2010'; ctx.fillRect(x - 14, py - 20, 4, 40); ctx.fillRect(x + 10, py - 20, 4, 40);
      // Доска
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 16, py - 24, 32, 20); ctx.strokeRect(x - 16, py - 24, 32, 20);
      // Бумажки
      ctx.fillStyle = '#f0eadd'; ctx.fillRect(x - 12, py - 22, 8, 10); ctx.fillRect(x + 4, py - 20, 10, 12);
      break;
    }
    
    // ⬇️ НОВЫЕ NPC ⬇️

    case 'elder': {
      // Мантия
      ctx.fillStyle = '#4a3a6a'; ctx.beginPath(); ctx.moveTo(x - 12, py + 14); ctx.lineTo(x + 12, py + 14); ctx.lineTo(x + 8, py - 8); ctx.lineTo(x - 8, py - 8); ctx.fill(); ctx.stroke();
      // Борода
      ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.moveTo(x - 6, py - 10); ctx.lineTo(x + 6, py - 10); ctx.lineTo(x, py + 8); ctx.fill();
      // Голова
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Посох
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(x + 14, py - 16, 2, 30);
      ctx.fillStyle = '#60a0ff'; ctx.shadowBlur = 8; ctx.shadowColor = '#60a0ff'; ctx.beginPath(); ctx.arc(x + 15, py - 16, 3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      break;
    }
    case 'alchemist': {
      // Котёл
      ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(x - 8, py + 8, 10, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#60ff60'; ctx.beginPath(); ctx.arc(x - 8, py + 8, 7, 0, Math.PI); ctx.fill();
      // Алхимик
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x + 4, py - 4, 10, 14);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x + 9, py - 10, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Колпак
      ctx.fillStyle = '#6a0a0a'; ctx.beginPath(); ctx.moveTo(x + 4, py - 12); ctx.lineTo(x + 14, py - 12); ctx.lineTo(x + 9, py - 24); ctx.fill();
      // Колба
      ctx.fillStyle = '#a0f0ff'; ctx.beginPath(); ctx.arc(x - 2, py - 6, 3, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      break;
    }
    case 'bard': {
      // Яркая одежда
      ctx.fillStyle = '#a020a0'; ctx.fillRect(x - 6, py - 6, 12, 16); ctx.strokeRect(x - 6, py - 6, 12, 16);
      ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 6, py + 2, 12, 2);
      // Голова
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Шляпа с пером
      ctx.fillStyle = '#2a1a0a'; ctx.fillRect(x - 8, py - 18, 16, 3);
      ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.moveTo(x + 4, py - 18); ctx.lineTo(x + 10, py - 24); ctx.lineTo(x + 6, py - 18); ctx.fill();
      // Лютня
      ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.ellipse(x - 12, py + 2, 6, 8, -0.4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d0d0d0'; ctx.fillRect(x - 10, py - 6, 1, 10);
      break;
    }
    case 'herald': {
      // Одежда
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 6, py - 6, 12, 16); ctx.strokeRect(x - 6, py - 6, 12, 16);
      // Голова
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Шляпа
      ctx.fillStyle = '#4a1a1a'; ctx.beginPath(); ctx.arc(x, py - 14, 6, Math.PI, 0); ctx.fill();
      // Рупор
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.moveTo(x + 10, py - 8); ctx.lineTo(x + 18, py - 14); ctx.lineTo(x + 18, py - 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.moveTo(x + 18, py - 14); ctx.lineTo(x + 26, py - 18); ctx.lineTo(x + 26, py + 2); ctx.lineTo(x + 18, py - 2); ctx.fill();
      // Свиток
      ctx.fillStyle = '#f0eadd'; ctx.fillRect(x - 14, py + 2, 6, 8);
      break;
    }
    case 'kids': {
      // Ребёнок 1
      ctx.fillStyle = '#3060a0'; ctx.fillRect(x - 10, py + 2, 8, 10); ctx.strokeRect(x - 10, py + 2, 8, 10);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x - 6, py - 2, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Ребёнок 2
      ctx.fillStyle = '#a03030'; ctx.fillRect(x + 4, py + 4, 7, 8); ctx.strokeRect(x + 4, py + 4, 7, 8);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x + 7, py, 3.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      break;
    }

    default: {
      // Универсальный NPC
      ctx.fillStyle = '#c9a227'; ctx.fillRect(x - 8, py - 6, 16, 18); ctx.strokeRect(x - 8, py - 6, 16, 18);
      ctx.fillStyle = '#ffcc99'; ctx.beginPath(); ctx.arc(x, py - 12, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
}