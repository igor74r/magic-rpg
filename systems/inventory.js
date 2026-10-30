import { state } from './state.js';
import { ITEMS, RARITIES, rollRarity } from '../data/items.js';
import { FORGE_BONUS } from '../data/npcs.js';

export const EQUIPMENT_SLOTS = [
  'weapon',
  'head', 'shoulders', 'chest', 'back', 'wrists', 'hands', 'legs',
  'ring1', 'ring2', 'amulet', 'seal'
];

export const SLOT_TYPES = {
  weapon: ['weapon'],
  head: ['head', 'helmet'],
  shoulders: ['shoulders'],
  chest: ['chest', 'armor'],
  back: ['back', 'cloak'],
  wrists: ['wrists', 'bracers'],
  hands: ['hands', 'gloves'],
  legs: ['legs', 'boots'],
  ring1: ['ring'],
  ring2: ['ring'],
  amulet: ['amulet'],
  seal: ['seal']
};

export const EQUIPMENT_TYPES = new Set(
  Object.values(SLOT_TYPES).flat()
);

export const STACKABLE_TYPES = new Set([
  'consumable', 'scroll', 'quest', 'material', 'rune'
]);

export function normalizeEquipment(player) {
  if (!player) return;
  if (!Array.isArray(player.inventory)) player.inventory = [];
  const equipped = player.equipped && typeof player.equipped === 'object'
    ? player.equipped
    : {};
  const legacySlots = {
    armor: 'chest',
    helmet: 'head',
    gloves: 'hands',
    boots: 'legs'
  };

  for (const [oldSlot, newSlot] of Object.entries(legacySlots)) {
    if (!equipped[oldSlot]) continue;
    if (!equipped[newSlot]) equipped[newSlot] = equipped[oldSlot];
    else player.inventory.push(equipped[oldSlot]);
    delete equipped[oldSlot];
  }

  for (const slot of EQUIPMENT_SLOTS) {
    if (equipped[slot] === undefined) equipped[slot] = null;
    const value = equipped[slot];
    if (typeof value === 'string') {
      equipped[slot] = {
        id: value, qty: 1, runes: [],
        sockets: ITEMS[value]?.sockets || 0
      };
    } else if (value && typeof value === 'object') {
      if (!Array.isArray(value.runes)) value.runes = [];
      if (value.sockets === undefined) value.sockets = ITEMS[value.id]?.sockets || 0;
    }
  }
  player.equipped = equipped;
}

function getItemBySlot(item, slot) {
  if (!item || !slot) return false;
  return (SLOT_TYPES[slot] || []).includes(item.type);
}

export function addItem(id, qty = 1, opts = {}) {
  const inv = state.game.player.inventory;
  const item = ITEMS[id];
  if (!item || !Number.isFinite(qty) || qty <= 0) return [];

  if (STACKABLE_TYPES.has(item.type)) {
    const existing = inv.find(i => i.id === id && !i.rarity);
    if (existing) existing.qty += qty;
    else inv.push({ id, qty });
    return [{ id, qty }];
  }

  const created = [];
  for (let i = 0; i < Math.floor(qty); i++) {
    const rarity = opts.rarity === undefined ? rollRarity() : opts.rarity;
    const mult = RARITIES[rarity]?.multiplier || 1;
    const bonus = {};
    for (const k in (item.bonus || {})) {
      const value = item.bonus[k];
      bonus[k] = typeof value === 'number'
        ? (['dodgeChance', 'blockChance', 'blockPower', 'critChance'].includes(k)
          ? Number((value * mult).toFixed(3))
          : Math.round(value * mult))
        : value;
    }
    const inst = {
      id, qty: 1, rarity, bonus,
      runes: [], sockets: item.sockets || 0
    };
    inv.push(inst);
    created.push(inst);
  }
  return created;
}

export function countItem(id) {
  const inv = state.game.player.inventory;
  return inv.reduce((total, it) => total + (it.id === id ? (it.qty || 1) : 0), 0);
}

export function removeItem(id, qty = 1) {
  const inv = state.game.player.inventory;
  const idx = inv.findIndex(i => i.id === id);
  if (idx === -1 || qty <= 0) return false;
  const inst = inv[idx];
  inst.qty = (inst.qty || 1) - qty;
  if (inst.qty <= 0) inv.splice(idx, 1);
  return true;
}

function scoreInst(inst) {
  if (!inst) return 0;
  const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
  const item = ITEMS[obj.id];
  if (!item) return 0;
  const b = { ...(item.bonus || {}), ...(obj.bonus || {}) };
  let score = (b.attack || 0) + (b.magic || 0) + (b.defense || 0);
  score += (b.dex || 0) + (b.armorPen || 0) * 2;
  score += (b.dodgeChance || 0) * 100 + (b.critChance || 0) * 100;
  score += (b.blockChance || 0) * 80 + (b.blockPower || 0) * 60;
  for (const runeId of (obj.runes || [])) {
    const rune = ITEMS[runeId]?.runeBonus || {};
    score += (rune.attack || 0) + (rune.magic || 0) + (rune.defense || 0);
    score += (rune.dodgeChance || 0) * 100 + (rune.critChance || 0) * 100;
  }
  score += FORGE_BONUS[obj.forgeLevel || 0] || 0;
  return score;
}

function getEquipmentSlot(item, equipped) {
  if (!item || !EQUIPMENT_TYPES.has(item.type)) return null;
  if (item.type === 'ring') {
    if (!equipped.ring1) return 'ring1';
    if (!equipped.ring2) return 'ring2';
    return scoreInst(equipped.ring1) <= scoreInst(equipped.ring2)
      ? 'ring1'
      : 'ring2';
  }
  return EQUIPMENT_SLOTS.find(slot =>
    slot !== 'ring1' && slot !== 'ring2' && getItemBySlot(item, slot)
  ) || null;
}

export function equipItemByIndex(idx) {
  const p = state.game.player;
  normalizeEquipment(p);
  const inst = p.inventory[idx];
  if (!inst) return null;
  const item = ITEMS[inst.id];
  const slot = getEquipmentSlot(item, p.equipped);
  if (!slot) return null;

  if (inst.sockets === undefined) inst.sockets = item.sockets || 0;
  if (!Array.isArray(inst.runes)) inst.runes = [];

  p.inventory.splice(idx, 1);
  if (p.equipped[slot]) p.inventory.push(p.equipped[slot]);
  p.equipped[slot] = inst;
  return slot;
}

export function unequipItemBySlot(slot) {
  const p = state.game.player;
  normalizeEquipment(p);
  const inst = p.equipped?.[slot];
  if (!inst) return false;
  p.inventory.push(inst);
  p.equipped[slot] = null;
  return true;
}

export function useItem(id) {
  const item = ITEMS[id];
  if (!item || !['consumable', 'scroll'].includes(item.type)) return false;
  if (item.combatOnly) return false;
  if (item.type === 'scroll') {
    const p = state.game.player;
    if (item.spellId && p.spells.includes(item.spellId)) return false;
  }
  if (typeof item.use !== 'function') return false;
  item.use(state.game.player);
  removeItem(id);
  return true;
}

export function equipBest() {
  const p = state.game.player;
  normalizeEquipment(p);
  const inv = p.inventory;
  let anyChange = false;

  for (const slot of EQUIPMENT_SLOTS) {
    let bestIdx = -1;
    let bestScore = scoreInst(p.equipped?.[slot]);

    for (let i = 0; i < inv.length; i++) {
      const item = ITEMS[inv[i].id];
      if (!getItemBySlot(item, slot)) continue;
      const score = scoreInst(inv[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      const inst = inv[bestIdx];
      inv.splice(bestIdx, 1);
      if (p.equipped?.[slot]) inv.push(p.equipped[slot]);
      p.equipped[slot] = inst;
      anyChange = true;
    }
  }
  return anyChange;
}

export function socketRune(inventoryIndex, equipmentSlot) {
  const p = state.game.player;
  normalizeEquipment(p);
  const runeInst = p.inventory?.[inventoryIndex];
  const rune = ITEMS[runeInst?.id];
  const gear = p.equipped?.[equipmentSlot];
  if (!runeInst || rune?.type !== 'rune' || !gear) return false;

  const gearObj = typeof gear === 'string'
    ? { id: gear, qty: 1, runes: [], sockets: ITEMS[gear]?.sockets || 0 }
    : gear;
  const gearDef = ITEMS[gearObj.id];
  if (!gearDef || (gearObj.sockets || gearDef.sockets || 0) <= (gearObj.runes || []).length) return false;

  if (!Array.isArray(gearObj.runes)) gearObj.runes = [];
  gearObj.runes.push(runeInst.id);
  p.equipped[equipmentSlot] = gearObj;
  removeItem(runeInst.id, 1);
  return true;
}
