import { state } from './state.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { addItem } from './inventory.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

export function buyItem(id) {
  const item = ITEMS[id];
  const p = state.game.player;
  if (p.gold < item.price) { emit('toast', 'Недостаточно золота'); return false; }
  p.gold -= item.price;
  addItem(id, 1, { rarity: 'common' });
  saveGame();
  emit('toast', `Куплено: ${item.name}`);
  return true;
}

export function getSellPrice(inst) {
  const item = ITEMS[inst.id];
  if (!item || item.type === 'quest') return 0;
  const mult = inst.rarity ? RARITIES[inst.rarity].multiplier : 1;
  const qty = inst.qty || 1;
  const perOne = Math.max(1, Math.floor((item.price || 0) * mult * 0.5));
  return item.type === 'consumable' ? perOne * qty : perOne;
}

export function sellItemByIndex(idx) {
  const p = state.game.player;
  const inv = p.inventory;
  const inst = inv[idx];
  if (!inst) return false;
  const item = ITEMS[inst.id];
  if (!item || item.type === 'quest') return false;

  const price = getSellPrice(inst);
  inv.splice(idx, 1);
  p.gold += price;
  saveGame();
  emit('toast', `Продано: ${item.name} (+${price}💰)`);
  return true;
}