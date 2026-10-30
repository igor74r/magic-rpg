import { state } from './state.js';
import { emit } from './events.js';
import { playSound } from './audio.js';

export const MAX_LEVEL = 100;

export function getExpNext(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(100 * Math.pow(level, 1.6));
}

export function addExp(amount) {
  const p = state.game.player;
  if (p.level >= MAX_LEVEL) return;
  
  p.exp += amount;
  while (p.level < MAX_LEVEL && p.exp >= p.expNext) {
    p.exp -= p.expNext;
    p.level++;
    p.expNext = getExpNext(p.level);
    
    // Базовый прирост статов за уровень
    p.maxHp += 10; p.maxMp += 5;
    p.str += 1; p.int += 1; p.wis += 1; p.con += 1;
    
    p.statPoints = (p.statPoints || 0) + 1;
    p.passivePoints = (p.passivePoints || 0) + 1; // Очко для Древа
    
    p.hp = p.maxHp; 
    if (p.class !== 'warrior' && p.class !== 'assassin') p.mp = p.maxMp;

    emit('log', { channel: 'game', msg: `⬆️ Уровень ${p.level}! +1 очко характеристик, +1 очко навыков.`, cls: 'success' });
    emit('toast', `Уровень ${p.level}! Доступны новые очки.`);
    playSound('levelup');
  }
}