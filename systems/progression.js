import { state } from './state.js';
import { emit } from './events.js';
import { playSound } from './audio.js';

export function addExp(amount) {
  const p = state.game.player;
  p.exp += amount;
  while (p.exp >= p.expNext) {
    p.exp -= p.expNext;
    p.level++;
    p.expNext = Math.floor(p.expNext * 1.5);
    p.maxHp += 25; p.maxMp += 15;
    p.str += 2; p.int += 2; p.wis += 2; p.con += 2;
    p.statPoints = (p.statPoints || 0) + 2;
    
    p.hp = p.maxHp; 
    if (p.class !== 'warrior') p.mp = p.maxMp;

    emit('log', { channel: 'game', msg: `⬆️ Уровень ${p.level}! +2 очка характеристик.`, cls: 'success' });
    emit('toast', `Уровень ${p.level}! +2 очка характеристик`);
    playSound('levelup');
  }
}