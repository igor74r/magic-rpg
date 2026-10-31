import { ITEMS, RARITIES } from '../data/items.js';
import { STORY } from '../data/story.js';

/**
 * Economic progression: prices scale by campaign act, never by player-controlled
 * level. This prevents exploits from leveling/farming outside the campaign.
 * Act multiplier: 1.00, 1.20, 1.40, 1.60, 1.80.
 */
export const ACT_PRICE_MULTIPLIERS = Object.freeze([1, 1.2, 1.4, 1.6, 1.8]);

export function getCurrentActIndex(player) {
  if (!player) return 0;
  let completed = 0;
  for (const act of STORY.acts) {
    const actComplete = act.missions.every(m => player.campaignClaimed?.[m.id] === true);
    if (!actComplete) return Math.min(act.number - 1, ACT_PRICE_MULTIPLIERS.length - 1);
    completed++;
  }
  return Math.min(completed, ACT_PRICE_MULTIPLIERS.length - 1);
}

export function getActPriceMultiplier(player) {
  return ACT_PRICE_MULTIPLIERS[getCurrentActIndex(player)] ?? 1;
}

export function getBuyPrice(id, player) {
  const item = ITEMS[id];
  if (!item || item.type === 'quest' || !Number.isFinite(item.price) || item.price <= 0) return 0;
  return Math.max(1, Math.round(item.price * getActPriceMultiplier(player)));
}

export function getSellPrice(instance, player) {
  const item = ITEMS[instance?.id];
  if (!item || item.type === 'quest' || !Number.isFinite(item.price) || item.price <= 0) return 0;
  const rarity = instance?.rarity;
  const rarityMultiplier = rarity && RARITIES[rarity]?.multiplier
    ? RARITIES[rarity].multiplier
    : 1;
  const quantity = item.type === 'consumable' || item.type === 'material' || item.type === 'rune'
    ? Math.max(1, Math.floor(Number(instance.qty) || 1))
    : 1;
  const base = Math.floor(item.price * getActPriceMultiplier(player) * rarityMultiplier * 0.35);
  return Math.max(1, base) * quantity;
}
