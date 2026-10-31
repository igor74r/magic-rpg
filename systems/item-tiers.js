import { ITEMS, RARITIES } from '../data/items.js';

export const TIER_META = {
  1: { id: 'T1', name: 'Обычный', color: '#a7a7a7' },
  2: { id: 'T2', name: 'Улучшенный', color: '#59bd75' },
  3: { id: 'T3', name: 'Редкий', color: '#58a8ff' },
  4: { id: 'T4', name: 'Эпический', color: '#b57bff' },
  5: { id: 'T5', name: 'Реликтовый', color: '#ed9a43' },
  6: { id: 'T6', name: 'Разломный', color: '#eb514c' }
};

const RARITY_TIER = { common: 1, rare: 2, epic: 3, legendary: 4 };

export function getItemTier(instance) {
  const id = typeof instance === 'string' ? instance : instance?.id;
  const item = ITEMS[id];
  const explicit = Number(typeof instance === 'object' ? instance?.tier : 0) || Number(item?.tier) || 0;
  if (explicit >= 1 && explicit <= 6) return explicit;
  const rarity = typeof instance === 'object' ? instance?.rarity : null;
  if (rarity && RARITIES[rarity]) return RARITY_TIER[rarity] || 1;
  const price = Number(item?.price || 0);
  if (price >= 450) return 6;
  if (price >= 280) return 5;
  if (price >= 160) return 4;
  if (price >= 90) return 3;
  if (price >= 35) return 2;
  return 1;
}

export function isQuestOrShard(instance) {
  const id = typeof instance === 'string' ? instance : instance?.id;
  return ITEMS[id]?.type === 'quest' || String(id || '').startsWith('shard-') || id === 'mana-crystal';
}

export function isLockedItem(instance) {
  return typeof instance === 'object' && !!instance?.locked;
}

export function canSellItem(instance, { collector = false } = {}) {
  if (!instance || isQuestOrShard(instance) || isLockedItem(instance)) return false;
  const tier = getItemTier(instance);
  if (tier === 6 && !collector) return false;
  return true;
}

export function canDismantleItem(instance) {
  if (!instance || isQuestOrShard(instance) || isLockedItem(instance)) return false;
  return getItemTier(instance) < 6;
}

export function tierColor(instance) {
  return TIER_META[getItemTier(instance)]?.color || TIER_META[1].color;
}
