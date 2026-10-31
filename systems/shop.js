import { state } from './state.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { addItem } from './inventory.js';
import { saveGame } from './save.js';
import { emit } from './events.js';
import { getBuyPrice, getSellPrice } from './economy.js';

export function buyItem(id) {
  const item = ITEMS[id];
  const p = state.game.player;
  if (!item || item.type === 'quest') return false;
  const price = getBuyPrice(id, p);
  if (p.gold < price) { emit('toast', 'Недостаточно золота'); return false; }
  p.gold -= price;
  addItem(id, 1, { rarity: 'common' });
  saveGame();
  emit('toast', `Куплено: ${item.name} (${price}💰)`);
  return true;
}

export { getSellPrice };

export function sellItemByIndex(idx) {
  const p = state.game.player;
  const inv = p.inventory;
  const inst = inv[idx];
  if (!inst) return false;
  const item = ITEMS[inst.id];
  if (!item || item.type === 'quest') return false;

  const price = getSellPrice(inst, p);
  if (price <= 0) return false;
  inv.splice(idx, 1);
  p.gold += price;
  p.stats.goldEarned = (p.stats.goldEarned || 0) + price;
  saveGame();
  emit('toast', `Продано: ${item.name} (+${price}💰)`);
  return true;
}
