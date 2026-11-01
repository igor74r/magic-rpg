import { state } from './state.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { addItem, canAddItem, STACKABLE_TYPES } from './inventory.js';
import { saveGame } from './save.js';
import { emit } from './events.js';
import { getBuyPrice, getSellPrice } from './economy.js';

export function buyItem(id) {
  const item = ITEMS[id];
  const p = state.game.player;
  if (!item || item.type === 'quest' || item.storyShard || item.bossOnly || RARITIES[item.rarity]?.bossOnly) return false;
  const price = getBuyPrice(id, p);
  if (p.gold < price) { emit('toast', 'Недостаточно золота'); return false; }
  const capacity = canAddItem(id, 1, p);
  if (!capacity.ok) { emit('toast', capacity.reason === 'slots' ? 'Сумка заполнена' : 'Превышен лимит переносимого веса'); return false; }
  const created = addItem(id, 1, { rarity: 'common' });
  if (!created.length) return false;
  p.gold -= price;
  saveGame();
  emit('toast', `Куплено: ${item.name} (${price}💰)`);
  return true;
}

export { getSellPrice };

export function sellItemsByIndices(indices, options = {}) {
  const p = state.game?.player;
  if (!p || !Array.isArray(p.inventory) || !Array.isArray(indices)) {
    return { ok: false, count: 0, total: 0 };
  }
  const selected = [...new Set(indices)]
    .filter(index => Number.isInteger(index) && index >= 0 && index < p.inventory.length)
    .sort((a, b) => b - a);
  const candidates = selected.map(index => ({ index, inst: p.inventory[index] }))
    .filter(({ inst }) => {
      const item = ITEMS[inst?.id];
      return item && item.type !== 'quest' && !item.storyShard && !RARITIES[inst.rarity]?.bossOnly;
    });
  const total = candidates.reduce((sum, entry) => sum + getSellPrice(entry.inst, p), 0);
  const hasHighTier = candidates.some(({ inst }) => (RARITIES[inst.rarity]?.tier || 1) >= 4);
  if (hasHighTier || total > 500) {
    if (!options.confirmed) {
      return { ok: false, requiresConfirmation: true, count: candidates.length, total, hasHighTier };
    }
  }
  if (!candidates.length || total <= 0) return { ok: false, count: 0, total: 0 };

  if (!Array.isArray(p.buyback)) p.buyback = [];
  const soldAt = new Date().toDateString();
  p.buyback = p.buyback.filter(record => record.soldAt === soldAt);
  for (const entry of candidates) {
    const snapshot = JSON.parse(JSON.stringify(entry.inst));
    const price = getSellPrice(entry.inst, p);
    p.buyback.push({ id: 'buyback-' + Date.now() + '-' + entry.index, item: snapshot, soldAt, price: Math.ceil(price * 1.2) });
  }
  for (const { index } of candidates) p.inventory.splice(index, 1);
  p.gold = (p.gold || 0) + total;
  if (!p.stats) p.stats = {};
  p.stats.goldEarned = (p.stats.goldEarned || 0) + total;
  saveGame();
  emit('toast', `Продано предметов: ${candidates.length} (+${total}💰)`);
  emit('game:update');
  return { ok: true, count: candidates.length, total };
}

export function sellItemByIndex(idx) {
  return sellItemsByIndices([idx]).ok;
}

export function getBuybackItems() {
  const records = state.game?.player?.buyback || [];
  const today = new Date().toDateString();
  return records.filter(record => record.soldAt === today);
}

export function buybackItem(index) {
  const p = state.game?.player;
  const records = p?.buyback || [];
  const today = new Date().toDateString();
  const record = records.filter(entry => entry.soldAt === today)[index];
  if (!p || !record || !record.item || !ITEMS[record.item.id]) return { ok: false, msg: 'Предмет больше нельзя выкупить' };
  if (p.gold < record.price) return { ok: false, msg: 'Не хватает золота для обратного выкупа' };
  const qty = record.item.qty || 1;
  const capacity = canAddItem(record.item.id, qty, p);
  if (!capacity.ok) return { ok: false, msg: capacity.reason === 'slots' ? 'Сумка заполнена' : 'Превышен лимит переносимого веса' };
  if (STACKABLE_TYPES.has(ITEMS[record.item.id].type)) {
    if (!addItem(record.item.id, qty).length) return { ok: false, msg: 'Не удалось вернуть предмет в сумку' };
  } else {
    p.inventory.push(record.item);
  }
  p.gold -= record.price;
  p.buyback = records.filter(entry => entry.id !== record.id);
  saveGame();
  emit('toast', 'Предмет выкуплен обратно за ' + record.price + '💰');
  emit('game:update');
  return { ok: true, price: record.price };
}
