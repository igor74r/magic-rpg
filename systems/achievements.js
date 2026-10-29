import { state } from './state.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { emit } from './events.js';
import { saveGame } from './save.js';
import { playSound } from './audio.js';

export function checkAchievements() {
  const g = state.game;
  if (!g || !g.player) return;
  const p = g.player;
  if (!Array.isArray(p.achievements)) p.achievements = [];

  let any = false;
  for (const a of ACHIEVEMENTS) {
    if (p.achievements.includes(a.id)) continue;
    let ok = false;
    try { ok = !!a.check(g); } catch (e) { console.warn('[achievements]', a.id, e); }
    if (!ok) continue;
    p.achievements.push(a.id);
    if (a.reward) p.gold = (p.gold || 0) + a.reward;
    emit('log', { channel: 'game', msg: `🏆 Достижение: «${a.name}»${a.reward ? ` (+${a.reward}💰)` : ''}`, cls: 'success' });
    emit('toast', `🏆 ${a.name}! +${a.reward}💰`);
    playSound('levelup');
    any = true;
  }

  if (any) {
    saveGame();
    emit('game:update');
  }
}

export function unlockedCount() {
  return state.game?.player?.achievements?.length || 0;
}