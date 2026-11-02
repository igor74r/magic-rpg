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
  const p = state.game?.player;
  if (!p) return [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const saved = p.dailyQuests && typeof p.dailyQuests === 'object' && !Array.isArray(p.dailyQuests)
    ? p.dailyQuests
    : { date: 0, list: [] };
  const lastDate = Number.isFinite(saved.date) && saved.date >= 0 ? saved.date : 0;
  const savedList = Array.isArray(saved.list) ? saved.list : [];
  const seen = new Set();
  const normalized = savedList.map(entry => {
    const definition = POOL.find(quest => quest.id === entry?.id);
    if (!definition || seen.has(definition.id)) return null;
    seen.add(definition.id);
    const rawCurrent = Number(entry.current);
    const current = Number.isSafeInteger(rawCurrent) ? Math.max(0, Math.min(definition.max, rawCurrent)) : 0;
    const completed = entry.completed === true || current >= definition.max;
    return { ...definition, current, completed, claimed: completed && entry.claimed === true };
  }).filter(Boolean);
  const expired = now - lastDate > dayMs;

  if (expired || normalized.length !== 3) {
    const shuffled = [...POOL].sort(() => 0.5 - Math.random());
    p.dailyQuests = {
      date: now,
      list: shuffled.slice(0, 3).map(quest => ({ ...quest, current: 0, completed: false, claimed: false }))
    };
    saveGame();
  } else if (p.dailyQuests !== saved || JSON.stringify(saved.list) !== JSON.stringify(normalized)) {
    p.dailyQuests = { date: lastDate, list: normalized };
    saveGame();
  }
  return p.dailyQuests.list;
}

export function updateQuestProgress(type, target, amount = 1) {
  const p = state.game?.player;
  const increment = Number(amount);
  if (!p || !Number.isSafeInteger(increment) || increment <= 0) return;
  const quests = getDailyQuests();

  let changed = false;
  for (const q of quests) {
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
  const p = state.game?.player;
  if (!p) return false;
  const q = getDailyQuests().find(entry => entry.id === questId);
  const definition = POOL.find(entry => entry.id === questId);
  if (!q || !definition || q.completed !== true || q.claimed === true) return false;

  q.claimed = true;
  p.gold = (Number.isFinite(p.gold) ? p.gold : 0) + definition.gold;
  if (definition.exp) addExp(definition.exp);

  const parts = [`+${definition.gold}💰`];
  if (definition.exp) parts.push(`+${definition.exp} EXP`);
  emit('toast', `📜 Награда: ${parts.join(', ')}`);
  emit('log', {
    channel: 'game',
    msg: `📜 Квест «${q.text}» — ${parts.join(', ')}`,
    cls: 'success'
  });
  saveGame();
  return true;
}
