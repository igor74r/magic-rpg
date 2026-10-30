import { state } from './state.js';
import { ITEMS } from '../data/items.js';
import { FORGE_BONUS } from '../data/npcs.js';
import { EFFECTS } from './status.js';
import { getTalentBonus } from './talents.js';

export function getEffStats() {
  const p = state.game.player;
  let atk = p.str, mag = p.int, def = Math.floor(p.con / 2);

  for (const slot of ['weapon', 'armor']) {
    let inst = p.equipped[slot];
    if (!inst) continue;
    if (typeof inst === 'string') inst = { id: inst, qty: 1 };
    const item = ITEMS[inst.id];
    if (!item) continue;
    const b = inst.bonus || item.bonus || {};
    atk += b.attack || 0;
    mag += b.magic || 0;
    def += b.defense || 0;

    const forge = inst.forgeLevel || 0;
    const forgeBonus = FORGE_BONUS[forge] || 0;
    if (forgeBonus > 0) {
      if (slot === 'weapon') {
        if (item.bonus && item.bonus.magic !== undefined) mag += forgeBonus;
        else atk += forgeBonus;
      } else {
        def += forgeBonus;
      }
    }
  }

  if (Array.isArray(p.effects)) {
    for (const e of p.effects) {
      const ef = EFFECTS[e.id];
      if (!ef) continue;
      if (ef.atkFlat) atk += ef.atkFlat;
      if (ef.magFlat) mag += ef.magFlat;
      if (ef.defFlat) def += ef.defFlat;
    }
  }

  const talentBonus = getTalentBonus(p);
  def = Math.floor(def * talentBonus.defMult);

  return { atk, mag, def };
}