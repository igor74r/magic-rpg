import { state } from './state.js';
import { saveGame } from './save.js';
import { emit } from './events.js';
import { addExp } from './progression.js';

const POOL = [
  { id: 'q-kill-any', type: 'kill', text: 'Убей 10 врагов', target: 'any', max: 10, gold: 8, exp: 50 },
  { id: 'q-kill-goblin', type: 'kill', text: 'Убей 5 гоблинов', target: 'goblin', max: 5, gold: 6, exp: 30 },
  { id: 'q-kill-skeleton', type: 'kill', text: 'Убей 5 скелетов', target: 'skeleton', max: 5, gold: 6, exp: 30 },
  { id: 'q-kill-wolf', type: 'kill', text: 'Убей 3 волков', target: 'wolf', max: 3, gold: 5, exp: 20 },
  { id: 'q-rift-floor', type: 'rift', text: 'Достигни 3 этажа Разлома', target: 'floor', max: 3, gold: 16, exp: 100 },
  { id: 'q-chest', type: 'chest', text: 'Открой 3 сундука', target: 'chest', max: 3, gold: 6, exp: 25 },
];

export function getDailyQuests() {
  const p = state.game.player;
  if (!p.dailyQuests) p.dailyQuests = { date: 0, list: [] };

  const now = Date.now();
  const lastDate = p.dailyQuests.date || 0;
  const dayMs = 24 * 60 * 60 * 1000;

  if (now - lastDate > dayMs || p.dailyQuests.list.length === 0) {
    const shuffled = [...POOL].sort(() => 0.5 - Math.random());
    p.dailyQuests.list = shuffled.slice(0, 3).map(q => ({
      ...q, current: 0, completed: false, claimed: false
    }));
    p.dailyQuests.date = now;
    saveGame();
  }
  return p.dailyQuests.list;
}

export function updateQuestProgress(type, target, amount = 1) {
  const p = state.game.player;
  if (!p.dailyQuests || !p.dailyQuests.list) return;

  let changed = false;
  for (const q of p.dailyQuests.list) {
    if (q.completed || q.claimed || q.type !== type) continue;
    if (q.target !== 'any' && q.target !== target) continue;

    q.current += amount;
    if (q.current >= q.max) {
      q.current = q.max;
      q.completed = true;
      emit('toast', `📜 Квест выполнен: ${q.text}!`);
    }
    changed = true;
  }
  if (changed) saveGame();
}

export function claimQuestReward(questId) {
  const p = state.game.player;
  if (!p.dailyQuests || !p.dailyQuests.list) return false;
  const q = p.dailyQuests.list.find(x => x.id === questId);
  if (!q || !q.completed || q.claimed) return false;

  q.claimed = true;
  p.gold += q.gold;
  if (q.exp) addExp(q.exp);

  const parts = [`+${q.gold}💰`];
  if (q.exp) parts.push(`+${q.exp} EXP`);
  emit('toast', `📜 Награда: ${parts.join(', ')}`);
  emit('log', {
    channel: 'game',
    msg: `📜 Квест «${q.text}» — ${parts.join(', ')}`,
    cls: 'success'
  });
  saveGame();
  return true;
}
