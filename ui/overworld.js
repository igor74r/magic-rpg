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

const EFFECTS_DATA = { poison: { name: 'Отравление', icon: '☠️', color: '#60a060' }, burn: { name: 'Ожог', icon: '🔥', color: '#ff6020' }, bleed: { name: 'Кровотечение', icon: '🩸', color: '#d63030' }, stun: { name: 'Оглушение', icon: '💫', color: '#d6c030' }, atkBuff: { name: 'Боевой клич', icon: '📢', color: '#ffd060' }, defBuff: { name: 'Щит маны', icon: '🛡️', color: '#60a0ff' }, lifesteal: { name: 'Кровожадность', icon: '🩸', color: '#d63030' }, strength: { name: 'Эликсир силы', icon: '💪', color: '#ff9060' }, manaShield: { name: 'Эликсир маны', icon: '💧', color: '#60d0ff' }, elderBlessing: { name: 'Благословение', icon: '✨', color: '#ffd060' } };
const MODIFIERS_LABEL = { poisonous: { name: 'Ядовитый', prefix: '☣️', color: '#60a060' }, armored: { name: 'Бронированный', prefix: '🛡️', color: '#a0a0a0' }, swift: { name: 'Стремительный', prefix: '💨', color: '#60a0ff' }, vampiric: { name: 'Вампирский', prefix: '🧛', color: '#800060' }, regenerating: { name: 'Регенерирующий', prefix: '💚', color: '#60ff60' }, berserk: { name: 'Берсерк', prefix: '💢', color: '#ff4040' } };
const MOD_LABEL = { poisonous: '☣️ ядовитый', armored: '🛡️ бронированный', swift: '💨 стремительный', vampiric: '🧛 вампирский', regenerating: '💚 регенерирующий', berserk: '💢 берсерк' };

function getTheme(name) { return THEMES[name] || THEMES.default; }

// ==================== МОДЕЛИ ПЕРСОНАЖЕЙ ====================

function drawPlayerByClass(ctx, x, y, playerClass, shadowColor) {
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (playerClass === 'warrior') {
    // Ноги
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x - 7, y + 8, 5, 8);
    ctx.fillRect(x + 2, y + 8, 5, 8);
    // Тело (широкое)
    ctx.fillStyle = '#b03030';
    ctx.fillRect(x - 11, y - 6, 22, 16);
    ctx.fillStyle = '#8a2020';
    ctx.fillRect(x - 11, y - 6, 22, 4); // ремень
    // Наплечники
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(x - 12, y - 4, 5, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    // Голова
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - 14, 7, 0, Math.PI * 2);
    ctx.fill();
    // Шлем
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(x, y - 16, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 8, y - 16, 16, 4);
    // Прорезь
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 6, y - 15, 4, 2);
    ctx.fillRect(x + 2, y - 15, 4, 2);
    // Меч
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
    // Ноги (мантия)
    ctx.fillStyle = '#3a1560';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 16);
    ctx.lineTo(x + 10, y + 16);
    ctx.lineTo(x + 8, y + 2);
    ctx.lineTo(x - 8, y + 2);
    ctx.closePath();
    ctx.fill();
    // Тело (мантия)
    ctx.fillStyle = '#5a2090';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2);
    ctx.lineTo(x + 10, y + 2);
    ctx.lineTo(x + 7, y - 8);
    ctx.lineTo(x - 7, y - 8);
    ctx.closePath();
    ctx.fill();
    // Звёзды на мантии
    ctx.fillStyle = '#ffe060';
    ctx.fillRect(x - 5, y + 5, 2, 2);
    ctx.fillRect(x + 3, y + 10, 2, 2);
    // Голова
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    // Борода
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 10);
    ctx.lineTo(x + 5, y - 10);
    ctx.lineTo(x, y - 4);
    ctx.closePath();
    ctx.fill();
    // Шляпа-колпак
    ctx.fillStyle = '#3a1060';
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 18);
    ctx.lineTo(x + 11, y - 18);
    ctx.lineTo(x + 4, y - 40);
    ctx.lineTo(x - 4, y - 40);
    ctx.closePath();
    ctx.fill();
    // Поля шляпы
    ctx.fillStyle = '#2a0540';
    ctx.fillRect(x - 13, y - 19, 26, 3);
    // Звезда на шляпе
    ctx.fillStyle = '#ffe060';
    ctx.beginPath();
    ctx.arc(x, y - 24, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Посох
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x + 13, y - 12, 3, 30);
    // Сфера
    ctx.shadowBlur = 12; ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#a0f0ff';
    ctx.beginPath();
    ctx.arc(x + 14.5, y - 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

  } else if (playerClass === 'priest') {
    // Мантия (белая)
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 16);
    ctx.lineTo(x + 10, y + 16);
    ctx.lineTo(x + 8, y - 8);
    ctx.lineTo(x - 8, y - 8);
    ctx.closePath();
    ctx.fill();
    // Золотая кайма
    ctx.strokeStyle = '#ffd060';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Пояс
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x - 8, y + 3, 16, 2);
    // Крест на груди
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x - 1, y - 6, 2, 6);
    ctx.fillRect(x - 3, y - 4, 6, 2);
    // Голова
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(x, y - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    // Короткие волосы
    ctx.fillStyle = '#c9a060';
    ctx.beginPath();
    ctx.arc(x, y - 16, 6, Math.PI, 0);
    ctx.fill();
    // Нимб
    ctx.shadowBlur = 10; ctx.shadowColor = '#ffd060';
    ctx.strokeStyle = '#ffd060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 24, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Посох-крест
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 13, y - 10, 2, 28);
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x + 11, y - 12, 6, 2);
    ctx.fillRect(x + 13.5, y - 15, 1, 6);
  }
}

function drawEnemyByType(ctx, e, x, y, shadowColor) {
  const size = e.boss ? 22 : e.elite ? 16 : 12;
  const isBoss = e.boss;
  const isElite = e.elite;
  let glowColor = null;
  if (isBoss) glowColor = '#b060ff';
  else if (isElite) glowColor = '#ffa500';

  // Тень
  ctx.fillStyle = shadowColor;
  ctx.beginPath();
  ctx.ellipse(x, y + size - 2, size, size / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Свечение для боссов/элиток
  if (glowColor) { ctx.shadowBlur = isBoss ? 20 : 10; ctx.shadowColor = glowColor; }

  // Кольцо модификатора
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

  // ============ ГОБЛИН ============
  if (id === 'goblin') {
    // Уши
    ctx.fillStyle = '#3a7030';
    ctx.beginPath();
    ctx.moveTo(x - size + 2, y - 4); ctx.lineTo(x - size - 8, y - 10); ctx.lineTo(x - size + 2, y - 8);
    ctx.moveTo(x + size - 2, y - 4); ctx.lineTo(x + size + 8, y - 10); ctx.lineTo(x + size - 2, y - 8);
    ctx.fill();
    // Тело
    ctx.fillStyle = '#4a8040';
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    // Глаза
    ctx.fillStyle = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 4, y - 2, 2.5, 0, Math.PI * 2); ctx.arc(x + 4, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 2, 1, 0, Math.PI * 2); ctx.arc(x + 4, y - 2, 1, 0, Math.PI * 2); ctx.fill();
    // Клыки
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 3, y + 5, 2, 3);
    ctx.fillRect(x + 1, y + 5, 2, 3);
  }
  // ============ СКЕЛЕТ / СКЕЛЕТ-ЛУЧНИК ============
  else if (id === 'skeleton' || id === 'skeleton-archer') {
    // Череп
    ctx.fillStyle = '#f0ead0';
    ctx.beginPath(); ctx.arc(x, y - 4, size * 0.75, 0, Math.PI * 2); ctx.fill();
    // Челюсть
    ctx.fillRect(x - size * 0.5, y + 2, size, 4);
    // Глазницы
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 5, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 5, 2, 0, Math.PI * 2); ctx.fill();
    // Рёбра
    ctx.fillStyle = '#f0ead0';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - size * 0.7, y + 8 + i * 3, size * 1.4, 2);
    // Лук для лучника
    if (id === 'skeleton-archer') {
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + size + 4, y, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + size + 4, y - 8); ctx.lineTo(x + size + 4, y + 8); ctx.stroke();
    }
  }
  // ============ ВОЛК / МОРОЗНЫЙ ВОЛК ============
  else if (id === 'wolf' || id === 'frost-wolf') {
    const c = id === 'frost-wolf' ? '#8cc8e8' : '#505050';
    // Тело (вытянутое)
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(x - 2, y, size * 1.3, size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    // Голова
    ctx.beginPath(); ctx.arc(x + size * 0.7, y - 3, size * 0.6, 0, Math.PI * 2); ctx.fill();
    // Уши
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y - size * 0.6); ctx.lineTo(x + size * 0.45, y - size * 1.0); ctx.lineTo(x + size * 0.75, y - size * 0.55);
    ctx.fill();
    // Глаз
    ctx.fillStyle = id === 'frost-wolf' ? '#00c8ff' : '#ff4040';
    ctx.beginPath(); ctx.arc(x + size * 0.9, y - 4, 2, 0, Math.PI * 2); ctx.fill();
    // Хвост
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - size * 1.2, y); ctx.quadraticCurveTo(x - size * 1.6, y - 6, x - size * 1.5, y - 10); ctx.stroke();
  }
  // ============ ПРИЗРАК / ТЕНЬ / ПЕСЧАНЫЙ ПРИЗРАК ============
  else if (id === 'ghost' || id === 'wraith' || id === 'dust-wraith') {
    const c = id === 'dust-wraith' ? '#a08050' : id === 'wraith' ? '#4a4a6a' : '#a0d0ff';
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = c;
    // Верх-купол
    ctx.beginPath();
    ctx.arc(x, y - 4, size, Math.PI, 0);
    // Волнистый низ
    ctx.lineTo(x + size, y + 6);
    ctx.quadraticCurveTo(x + size * 0.66, y + 12, x + size * 0.33, y + 8);
    ctx.quadraticCurveTo(x, y + 14, x - size * 0.33, y + 8);
    ctx.quadraticCurveTo(x - size * 0.66, y + 12, x - size, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 6, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 6, 2, 0, Math.PI * 2); ctx.fill();
  }
  // ============ ТЁМНЫЙ РЫЦАРЬ ============
  else if (id === 'dark-knight') {
    // Тело
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(x - 10, y - 6, 20, 20);
    // Наплечники с шипами
    ctx.fillStyle = '#1a1a2a';
    ctx.beginPath(); ctx.arc(x - 11, y - 4, 5, 0, Math.PI * 2); ctx.arc(x + 11, y - 4, 5, 0, Math.PI * 2); ctx.fill();
    // Голова в шлеме
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath(); ctx.arc(x, y - 14, 7, 0, Math.PI * 2); ctx.fill();
    // Прорезь-визор
    ctx.fillStyle = '#ff2020';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff2020';
    ctx.fillRect(x - 6, y - 15, 12, 3);
    ctx.shadowBlur = 0;
    // Меч
    ctx.fillStyle = '#8a1010';
    ctx.fillRect(x + 13, y - 10, 3, 24);
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(x + 11, y - 10, 7, 4);
  }
  // ============ ТЕНЕВОЙ МАГ (босс) ============
  else if (id === 'shadow-mage') {
    // Мантия
    ctx.fillStyle = '#1a0a2a';
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 20); ctx.lineTo(x + 14, y + 20); ctx.lineTo(x + 10, y - 8); ctx.lineTo(x - 10, y - 8);
    ctx.closePath(); ctx.fill();
    // Капюшон
    ctx.fillStyle = '#0a0010';
    ctx.beginPath(); ctx.arc(x, y - 10, 10, 0, Math.PI * 2); ctx.fill();
    // Глаза
    ctx.fillStyle = '#b060ff';
    ctx.shadowBlur = 12; ctx.shadowColor = '#b060ff';
    ctx.beginPath(); ctx.arc(x - 4, y - 10, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Посох
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(x + 16, y - 16, 3, 36);
    ctx.fillStyle = '#b060ff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#b060ff';
    ctx.beginPath(); ctx.arc(x + 17.5, y - 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // ============ КОРОЛЬ КУРГАНОВ (босс) ============
  else if (id === 'grave-king') {
    // Череп
    ctx.fillStyle = '#d0c8a8';
    ctx.beginPath(); ctx.arc(x, y - 6, 16, 0, Math.PI * 2); ctx.fill();
    // Челюсть
    ctx.fillRect(x - 10, y + 4, 20, 6);
    // Глазницы
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 6, y - 8, 3, 0, Math.PI * 2); ctx.arc(x + 6, y - 8, 3, 0, Math.PI * 2); ctx.fill();
    // Красные глаза
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.arc(x - 6, y - 8, 1.5, 0, Math.PI * 2); ctx.arc(x + 6, y - 8, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Корона
    ctx.fillStyle = '#ffd060';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 20);
    ctx.lineTo(x - 12, y - 28);
    ctx.lineTo(x - 8, y - 24);
    ctx.lineTo(x - 4, y - 32);
    ctx.lineTo(x, y - 24);
    ctx.lineTo(x + 4, y - 32);
    ctx.lineTo(x + 8, y - 24);
    ctx.lineTo(x + 12, y - 28);
    ctx.lineTo(x + 12, y - 20);
    ctx.closePath();
    ctx.fill();
  }
  // ============ ОГНЕННЫЙ ЭЛЕМЕНТАЛЬ ============
  else if (id === 'fire-elemental') {
    // Пламя (треугольник с изгибом)
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
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 3, y, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  // ============ МАГМОВЫЙ ГОЛЕМ ============
  else if (id === 'magma-golem') {
    // Крупное тело из блоков
    ctx.fillStyle = '#5a2a0a';
    ctx.fillRect(x - 14, y - 10, 28, 26);
    // Голова-камень
    ctx.fillStyle = '#4a1a0a';
    ctx.fillRect(x - 10, y - 22, 20, 14);
    // Трещины с лавой
    ctx.strokeStyle = '#ff6000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 18); ctx.lineTo(x - 2, y - 10); ctx.lineTo(x + 6, y - 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 2); ctx.lineTo(x + 4, y + 8);
    ctx.stroke();
    // Глаза
    ctx.fillStyle = '#ff8000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff8000';
    ctx.fillRect(x - 6, y - 18, 4, 3);
    ctx.fillRect(x + 2, y - 18, 4, 3);
    ctx.shadowBlur = 0;
  }
  // ============ ВЛАДЫКА ПЛАМЕНИ (босс) ============
  else if (id === 'flame-lord') {
    // Огромное пламя
    ctx.fillStyle = '#ff4000';
    ctx.shadowBlur = 25; ctx.shadowColor = '#ff4000';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Языки пламени
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const px = x + Math.cos(a) * 16;
      const py = y + Math.sin(a) * 16;
      ctx.fillStyle = i % 2 ? '#ff8020' : '#ffff00';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 5, y - 2, 3, 0, Math.PI * 2); ctx.arc(x + 5, y - 2, 3, 0, Math.PI * 2); ctx.fill();
  }
  // ============ ЛЕДЯНОЙ ЭЛЕМЕНТАЛЬ ============
  else if (id === 'ice-elemental') {
    // Кристалл (ромб)
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
    // Глаза
    ctx.fillStyle = '#004080';
    ctx.beginPath(); ctx.arc(x - 3, y - 2, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 2, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  // ============ КОРОЛЕВА СТУЖИ (босс) ============
  else if (id === 'ice-queen') {
    // Платье изо льда
    ctx.fillStyle = '#80c8e8';
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 22); ctx.lineTo(x + 18, y + 22); ctx.lineTo(x + 10, y - 4); ctx.lineTo(x - 10, y - 4);
    ctx.closePath(); ctx.fill();
    // Тело
    ctx.fillStyle = '#a0e0ff';
    ctx.beginPath(); ctx.arc(x, y - 8, 10, 0, Math.PI * 2); ctx.fill();
    // Корона изо льда
    ctx.fillStyle = '#e0f8ff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#a0e0ff';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 16);
    ctx.lineTo(x - 12, y - 26); ctx.lineTo(x - 6, y - 22); ctx.lineTo(x - 2, y - 30);
    ctx.lineTo(x + 2, y - 22); ctx.lineTo(x + 8, y - 26); ctx.lineTo(x + 12, y - 22); ctx.lineTo(x + 12, y - 16);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    // Глаза
    ctx.fillStyle = '#0080c0';
    ctx.beginPath(); ctx.arc(x - 3, y - 10, 1.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 10, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  // ============ ПЕСЧАНЫЙ ЧЕРВЬ ============
  else if (id === 'sand-worm') {
    ctx.fillStyle = '#c8a060';
    // Тело (сегментированное)
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x - 10 + i * 7, y + Math.sin(i) * 3, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Голова
    ctx.beginPath(); ctx.arc(x + 10, y - 3, 10, 0, Math.PI * 2); ctx.fill();
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x + 12, y - 6, 2, 0, Math.PI * 2); ctx.fill();
    // Зубы
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + 8, y + 8); ctx.lineTo(x + 10, y + 4);
    ctx.fill();
  }
  // ============ КОРОЛЬ ПУСТЫНИ (босс) ============
  else if (id === 'sand-king') {
    // Тело в тюрбане
    ctx.fillStyle = '#c89860';
    ctx.fillRect(x - 12, y - 6, 24, 22);
    // Голова
    ctx.fillStyle = '#e0c090';
    ctx.beginPath(); ctx.arc(x, y - 12, 10, 0, Math.PI * 2); ctx.fill();
    // Тюрбан
    ctx.fillStyle = '#a07040';
    ctx.beginPath();
    ctx.arc(x, y - 18, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 12, y - 18, 24, 6);
    // Драгоценность
    ctx.fillStyle = '#ff2040';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff2040';
    ctx.beginPath(); ctx.arc(x, y - 16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Борода
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x, y + 2);
    ctx.closePath(); ctx.fill();
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y - 12, 1.5, 0, Math.PI * 2); ctx.arc(x + 4, y - 12, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  // ============ ЛЕТАЮЩАЯ КНИГА ============
  else if (id === 'flying-tome') {
    ctx.fillStyle = '#8a4a2a';
    ctx.fillRect(x - 12, y - 8, 24, 16);
    ctx.strokeStyle = '#5a2a1a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 12, y - 8, 24, 16);
    // Страницы
    ctx.fillStyle = '#f0ead0';
    ctx.fillRect(x - 10, y - 6, 20, 12);
    // Глаза
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x - 4, y, 2, 0, Math.PI * 2); ctx.arc(x + 4, y, 2, 0, Math.PI * 2); ctx.fill();
  }
  // ============ КНИЖНЫЙ СТРАЖ ============
  else if (id === 'book-guardian') {
    ctx.fillStyle = '#6a2a1a';
    ctx.fillRect(x - 16, y - 12, 32, 22);
    ctx.strokeStyle = '#3a1a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 16, y - 12, 32, 22);
    // Замок
    ctx.fillStyle = '#ffd060';
    ctx.fillRect(x - 3, y - 12, 6, 22);
    // Глаза
    ctx.fillStyle = '#ffe000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 8, y - 2, 2, 0, Math.PI * 2); ctx.arc(x + 8, y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // ============ АРХИМАГ (босс) ============
  else if (id === 'archmage') {
    // Мантия
    ctx.fillStyle = '#4a1a80';
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 20); ctx.lineTo(x + 14, y + 20); ctx.lineTo(x + 8, y - 8); ctx.lineTo(x - 8, y - 8);
    ctx.closePath(); ctx.fill();
    // Голова
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath(); ctx.arc(x, y - 12, 7, 0, Math.PI * 2); ctx.fill();
    // Шляпа
    ctx.fillStyle = '#2a0a4a';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 16); ctx.lineTo(x + 12, y - 16); ctx.lineTo(x, y - 38);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe060';
    ctx.fillRect(x - 12, y - 17, 24, 3);
    // Борода
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x, y + 6);
    ctx.fill();
    // Посох
    ctx.fillStyle = '#3a1a0a';
    ctx.fillRect(x + 16, y - 16, 3, 36);
    ctx.shadowBlur = 15; ctx.shadowColor = '#ffd060';
    ctx.fillStyle = '#ffe060';
    ctx.beginPath(); ctx.arc(x + 17.5, y - 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // ============ ДРАКОНЧИК ============
  else if (id === 'dragonling') {
    ctx.fillStyle = '#c04020';
    // Тело
    ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    // Крылья
    ctx.fillStyle = '#8a2010';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 4); ctx.lineTo(x - 20, y - 12); ctx.lineTo(x - 8, y + 2);
    ctx.moveTo(x + 8, y - 4); ctx.lineTo(x + 20, y - 12); ctx.lineTo(x + 8, y + 2);
    ctx.fill();
    // Голова
    ctx.fillStyle = '#c04020';
    ctx.beginPath(); ctx.arc(x, y - 8, 7, 0, Math.PI * 2); ctx.fill();
    // Глаз
    ctx.fillStyle = '#ffe000';
    ctx.beginPath(); ctx.arc(x + 2, y - 9, 2, 0, Math.PI * 2); ctx.fill();
    // Рога
    ctx.fillStyle = '#3a1a0a';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 14); ctx.lineTo(x - 6, y - 20); ctx.lineTo(x - 2, y - 15);
    ctx.moveTo(x + 4, y - 14); ctx.lineTo(x + 6, y - 20); ctx.lineTo(x + 2, y - 15);
    ctx.fill();
  }
  // ============ ОГНЕДЫШАЩИЙ ДРАКОН (босс) ============
  else if (id === 'fire-drake') {
    // Тело
    ctx.fillStyle = '#8a2010';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
    // Крылья
    ctx.fillStyle = '#5a1008';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 4); ctx.lineTo(x - 30, y - 16); ctx.lineTo(x - 12, y + 6);
    ctx.moveTo(x + 12, y - 4); ctx.lineTo(x + 30, y - 16); ctx.lineTo(x + 12, y + 6);
    ctx.fill();
    // Голова
    ctx.fillStyle = '#8a2010';
    ctx.beginPath(); ctx.arc(x, y - 12, 10, 0, Math.PI * 2); ctx.fill();
    // Глаза
    ctx.fillStyle = '#ffe000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 3, y - 13, 2.5, 0, Math.PI * 2); ctx.arc(x + 3, y - 13, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Рога
    ctx.fillStyle = '#3a0a04';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 20); ctx.lineTo(x - 10, y - 28); ctx.lineTo(x - 2, y - 21);
    ctx.moveTo(x + 6, y - 20); ctx.lineTo(x + 10, y - 28); ctx.lineTo(x + 2, y - 21);
    ctx.fill();
    // Огонь из пасти
    ctx.fillStyle = '#ff8000';
    ctx.shadowBlur = 12; ctx.shadowColor = '#ff8000';
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 4); ctx.lineTo(x, y + 4); ctx.lineTo(x + 4, y - 4);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // ============ ДРАКОН-СТРАЖ ============
  else if (id === 'dragon-guardian') {
    ctx.fillStyle = '#2a3a2a';
    // Крупное тело
    ctx.fillRect(x - 14, y - 8, 28, 22);
    // Голова
    ctx.fillStyle = '#3a4a3a';
    ctx.beginPath(); ctx.arc(x, y - 14, 11, 0, Math.PI * 2); ctx.fill();
    // Чешуя-шипы
    ctx.fillStyle = '#1a2a1a';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 8 + i * 8, y - 24); ctx.lineTo(x - 6 + i * 8, y - 30); ctx.lineTo(x - 4 + i * 8, y - 24);
      ctx.fill();
    }
    // Глаза
    ctx.fillStyle = '#00ff80';
    ctx.shadowBlur = 8; ctx.shadowColor = '#00ff80';
    ctx.beginPath(); ctx.arc(x - 4, y - 14, 2, 0, Math.PI * 2); ctx.arc(x + 4, y - 14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // ============ ДРЕВНИЙ ДРАКОН (босс) ============
  else if (id === 'ancient-dragon') {
    // Тело
    ctx.fillStyle = '#8a1010';
    ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
    ctx.beginPath(); ctx.ellipse(x, y + 6, 24, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Крылья
    ctx.fillStyle = '#5a0808';
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 4); ctx.lineTo(x - 38, y - 20); ctx.lineTo(x - 14, y + 8);
    ctx.moveTo(x + 14, y - 4); ctx.lineTo(x + 38, y - 20); ctx.lineTo(x + 14, y + 8);
    ctx.fill();
    // Голова
    ctx.fillStyle = '#8a1010';
    ctx.beginPath(); ctx.arc(x, y - 16, 12, 0, Math.PI * 2); ctx.fill();
    // Глаза
    ctx.fillStyle = '#ffe000';
    ctx.shadowBlur = 15; ctx.shadowColor = '#ffe000';
    ctx.beginPath(); ctx.arc(x - 4, y - 17, 3, 0, Math.PI * 2); ctx.arc(x + 4, y - 17, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Рога
    ctx.fillStyle = '#2a0404';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 26); ctx.lineTo(x - 14, y - 38); ctx.lineTo(x - 2, y - 27);
    ctx.moveTo(x + 8, y - 26); ctx.lineTo(x + 14, y - 38); ctx.lineTo(x + 2, y - 27);
    ctx.fill();
  }
  // ============ ПО УМОЛЧАНИЮ ============
  else {
    ctx.fillStyle = isBoss ? '#b060ff' : isElite ? '#ffa500' : '#d63030';
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // HP bar
  const bw = isBoss ? 60 : 40;
  const hpY = y - size - (isBoss ? 25 : isElite ? 20 : 15);
  ctx.fillStyle = '#05020a';
  ctx.fillRect(x - bw / 2, hpY, bw, 4);
  ctx.fillStyle = isBoss ? '#b060ff' : isElite ? '#ffa500' : '#d63030';
  ctx.fillRect(x - bw / 2, hpY, bw * (e.hp / e.maxHp), 4);
}

function drawStatic(ctx, obj, x, y, shadowColor) {
  const id = obj.id;

  // Тень
  if (id !== 'well' && id !== 'questBoard') {
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (id) {
    case 'blacksmith': {
      // Тело (фартук)
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - 9, y - 2, 18, 16);
      // Рубаха
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(x - 9, y - 8, 18, 8);
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 14, 6, 0, Math.PI * 2); ctx.fill();
      // Борода
      ctx.fillStyle = '#3a2010';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 10); ctx.lineTo(x + 5, y - 10); ctx.lineTo(x, y - 2);
      ctx.fill();
      // Молот
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 12, y - 8, 3, 20);
      ctx.fillStyle = '#666';
      ctx.fillRect(x + 8, y - 12, 11, 6);
      break;
    }
    case 'healer': {
      // Белая мантия
      ctx.fillStyle = '#e8f0e8';
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 14); ctx.lineTo(x + 9, y + 14); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x - 7, y - 6);
      ctx.fill();
      // Зелёный крест
      ctx.fillStyle = '#40c040';
      ctx.fillRect(x - 1, y - 4, 2, 8);
      ctx.fillRect(x - 4, y - 1, 8, 2);
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Волосы (длинные)
      ctx.fillStyle = '#c9a060';
      ctx.beginPath(); ctx.arc(x, y - 15, 6, Math.PI, 0); ctx.fill();
      ctx.fillRect(x - 6, y - 15, 3, 10);
      ctx.fillRect(x + 3, y - 15, 3, 10);
      break;
    }
    case 'alchemist': {
      // Фиолетовая мантия
      ctx.fillStyle = '#5a2090';
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 14); ctx.lineTo(x + 9, y + 14); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x - 7, y - 6);
      ctx.fill();
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Капюшон
      ctx.fillStyle = '#3a1060';
      ctx.beginPath(); ctx.arc(x, y - 14, 7, Math.PI, 0); ctx.fill();
      // Колба
      ctx.fillStyle = '#a0f0ff';
      ctx.shadowBlur = 8; ctx.shadowColor = '#a0f0ff';
      ctx.beginPath(); ctx.arc(x + 13, y - 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + 12, y - 10, 2, 6);
      ctx.shadowBlur = 0;
      break;
    }
    case 'merchant': {
      // Красная рубаха
      ctx.fillStyle = '#a02020';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      // Пояс
      ctx.fillStyle = '#ffd060';
      ctx.fillRect(x - 9, y + 4, 18, 2);
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Шляпа
      ctx.fillStyle = '#5a2a1a';
      ctx.beginPath();
      ctx.ellipse(x, y - 17, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 5, y - 22, 10, 6);
      // Монета в руке
      ctx.fillStyle = '#ffd060';
      ctx.beginPath(); ctx.arc(x + 12, y, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'elder': {
      // Коричневая мантия
      ctx.fillStyle = '#6a4a2a';
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 14); ctx.lineTo(x + 9, y + 14); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x - 6, y - 6);
      ctx.fill();
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Седая борода
      ctx.fillStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 8); ctx.lineTo(x + 5, y - 8); ctx.lineTo(x, y + 4);
      ctx.fill();
      // Лысина + редкие волосы
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(x - 6, y - 16, 12, 3);
      // Трость
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 12, y - 8, 2, 22);
      break;
    }
    case 'guard': {
      // Кольчуга
      ctx.fillStyle = '#606060';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      // Наплечники
      ctx.fillStyle = '#404040';
      ctx.beginPath(); ctx.arc(x - 10, y - 2, 4, 0, Math.PI * 2); ctx.arc(x + 10, y - 2, 4, 0, Math.PI * 2); ctx.fill();
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Шлем
      ctx.fillStyle = '#707070';
      ctx.beginPath(); ctx.arc(x, y - 14, 7, Math.PI, 0); ctx.fill();
      // Щит слева
      ctx.fillStyle = '#2a4a8a';
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 6); ctx.lineTo(x - 16, y + 6); ctx.lineTo(x - 12, y + 10); ctx.lineTo(x - 8, y + 6); ctx.lineTo(x - 8, y - 6);
      ctx.closePath(); ctx.fill();
      // Копьё справа
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x + 12, y - 18, 2, 32);
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(x + 13, y - 24); ctx.lineTo(x + 16, y - 18); ctx.lineTo(x + 10, y - 18);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'bard': {
      // Розово-фиолетовая одежда
      ctx.fillStyle = '#c060a0';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Шляпа с пером
      ctx.fillStyle = '#5a1a4a';
      ctx.beginPath();
      ctx.ellipse(x, y - 16, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 5, y - 22, 10, 6);
      ctx.fillStyle = '#ffd060';
      ctx.beginPath(); ctx.arc(x + 6, y - 20, 2, 0, Math.PI * 2); ctx.fill();
      // Лютня
      ctx.fillStyle = '#8b4513';
      ctx.beginPath(); ctx.ellipse(x + 13, y + 2, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x + 11, y - 10, 2, 12);
      break;
    }
    case 'herald': {
      // Красная одежда
      ctx.fillStyle = '#c02020';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      // Голова
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
      // Шляпа
      ctx.fillStyle = '#8a1010';
      ctx.fillRect(x - 6, y - 20, 12, 4);
      ctx.fillRect(x - 4, y - 22, 8, 4);
      // Громкоговоритель
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.moveTo(x + 10, y); ctx.lineTo(x + 20, y - 6); ctx.lineTo(x + 20, y + 6);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'cat': {
      // Тело (чёрная кошка)
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.ellipse(x, y + 2, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      // Голова
      ctx.beginPath(); ctx.arc(x + 6, y - 4, 6, 0, Math.PI * 2); ctx.fill();
      // Уши
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 8); ctx.lineTo(x + 1, y - 14); ctx.lineTo(x + 6, y - 10);
      ctx.moveTo(x + 10, y - 8); ctx.lineTo(x + 11, y - 14); ctx.lineTo(x + 6, y - 10);
      ctx.fill();
      // Глаза
      ctx.fillStyle = '#ffe000';
      ctx.beginPath(); ctx.arc(x + 4, y - 5, 1.5, 0, Math.PI * 2); ctx.arc(x + 8, y - 5, 1.5, 0, Math.PI * 2); ctx.fill();
      // Хвост
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 9, y + 2); ctx.quadraticCurveTo(x - 15, y - 2, x - 12, y - 8); ctx.stroke();
      break;
    }
    case 'kids': {
      // Ребёнок
      ctx.fillStyle = '#5a8ac8';
      ctx.fillRect(x - 6, y, 12, 12);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 6, 5, 0, Math.PI * 2); ctx.fill();
      // Волосы
      ctx.fillStyle = '#c9a060';
      ctx.beginPath(); ctx.arc(x, y - 8, 5, Math.PI, 0); ctx.fill();
      break;
    }
    case 'well': {
      // Вода
      ctx.fillStyle = '#2a4a8a';
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
      // Каменный бортик
      ctx.strokeStyle = '#7a7a7a';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
      // Свечение воды
      ctx.fillStyle = '#4ac8ff';
      ctx.shadowBlur = 12; ctx.shadowColor = '#4ac8ff';
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case 'questBoard': {
      // Стойки
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(x - 14, y - 18, 3, 36);
      ctx.fillRect(x + 11, y - 18, 3, 36);
      // Доска
      ctx.fillStyle = '#8a5a2a';
      ctx.fillRect(x - 14, y - 18, 28, 22);
      // Бумаги
      ctx.fillStyle = '#f0ead0';
      ctx.fillRect(x - 11, y - 16, 8, 10);
      ctx.fillRect(x + 1, y - 14, 9, 8);
      ctx.fillRect(x - 6, y - 4, 10, 6);
      break;
    }
    default: {
      // Универсальный NPC
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(x - 9, y - 4, 18, 18);
      ctx.fillStyle = '#ffcc99';
      ctx.beginPath(); ctx.arc(x, y - 12, 6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// ==================== ОСНОВНОЙ ЦИКЛ И РЕНДЕР ====================

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
    if (ow && ow.active && !ow.combat && !ow.defeated && !paused && state.settings?.autoSave !== false) { saveGame(); autosaveAt = performance.now(); }
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

  // Полоски HP/MP над игроком
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

  if (state.settings?.showFps) {
    if (!window._fpsState) window._fpsState = { frames: 0, lastTime: performance.now(), value: 0 };
    window._fpsState.frames++;
    const nowT = performance.now();
    if (nowT - window._fpsState.lastTime >= 1000) {
      window._fpsState.value = window._fpsState.frames;
      window._fpsState.frames = 0;
      window._fpsState.lastTime = nowT;
    }
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`FPS: ${window._fpsState.value}`, VIEW_W - 160, VIEW_H - 12);
  }

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
  const showHK = state.settings?.showHotkeys !== false;
  const hotkeyHint = !showHK ? '' : (subPanel ? `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1]–[9] — выбрать · [Esc] — отмена</div>` : `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1] Атака · [2] Магия · [3] Предмет · [4] Побег · [5] Блок · [6] Способность · [Пробел] — быстрая атака · [Esc] — выйти</div>`);
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