import { state } from './state.js';
import { ITEMS, RARITIES, rollRarity } from '../data/items.js';
import { FORGE_BONUS } from '../data/npcs.js';

export function addItem(id, qty = 1, opts = {}) {
  const inv = state.game.player.inventory;
  const item = ITEMS[id];
  if (!item) return [];

  if (item.type === 'consumable' || item.type === 'quest' || item.type === 'material') {
    const existing = inv.find(i => i.id === id && !i.rarity);
    if (existing) existing.qty += qty;
    else inv.push({ id, qty });
    return [{ id, qty }];
  }

  const created = [];
  for (let i = 0; i < qty; i++) {
    const rarity = opts.rarity === undefined ? rollRarity() : opts.rarity;
    const mult = RARITIES[rarity].multiplier;
    const bonus = {};
    for (const k in item.bonus) bonus[k] = Math.round(item.bonus[k] * mult);
    const inst = { id, qty: 1, rarity, bonus };
    inv.push(inst);
    created.push(inst);
  }
  return created;
}

export function countItem(id) {
  const inv = state.game.player.inventory;
  let total = 0;
  for (const it of inv) if (it.id === id) total += it.qty || 1;
  return total;
}

export function removeItem(id, qty = 1) {
  const inv = state.game.player.inventory;
  const idx = inv.findIndex(i => i.id === id);
  if (idx === -1) return false;
  const inst = inv[idx];
  inst.qty = (inst.qty || 1) - qty;
  if (inst.qty <= 0) inv.splice(idx, 1);
  return true;
}

export function equipItemByIndex(idx) {
  const p = state.game.player;
  const inst = p.inventory[idx];
  if (!inst) return;
  const item = ITEMS[inst.id];
  if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return;
  p.inventory.splice(idx, 1);
  if (p.equipped[item.type]) p.inventory.push(p.equipped[item.type]);
  p.equipped[item.type] = inst;
}

export function unequipItemBySlot(slot) {
  const p = state.game.player;
  const inst = p.equipped[slot];
  if (!inst) return;
  p.inventory.push(inst);
  p.equipped[slot] = null;
}

export function useItem(id) {
  const item = ITEMS[id];
  if (!item) return false;
  if (item.type !== 'consumable' && item.type !== 'scroll') return false;
  if (item.combatOnly) return false;
  if (item.type === 'scroll') {
    const p = state.game.player;
    if (item.spellId && p.spells.includes(item.spellId)) return false;
  }
  item.use(state.game.player);
  removeItem(id);
  return true;
}

function scoreInst(inst) {
  if (!inst) return 0;
  const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
  const item = ITEMS[obj.id];
  if (!item) return 0;
  const b = obj.bonus || item.bonus || {};
  let score = (b.attack || 0) + (b.magic || 0) + (b.defense || 0);
  const forge = obj.forgeLevel || 0;
  score += FORGE_BONUS[forge] || 0;
  return score;
}

export function equipBest() {
  const p = state.game.player;
  const inv = p.inventory;
  let anyChange = false;

  for (const slot of ['weapon', 'armor']) {
    let bestIdx = -1;
    let bestScore = scoreInst(p.equipped[slot]);
    for (let i = 0; i < inv.length; i++) {
      const item = ITEMS[inv[i].id];
      if (!item || item.type !== slot) continue;
      const score = scoreInst(inv[i]);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    if (bestIdx >= 0) {
      const inst = inv[bestIdx];
      inv.splice(bestIdx, 1);
      if (p.equipped[slot]) inv.push(p.equipped[slot]);
      p.equipped[slot] = inst;
      anyChange = true;
    }
  }
  return anyChange;
}