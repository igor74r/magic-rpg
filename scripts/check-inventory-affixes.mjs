import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { ITEMS, RARITIES, rollRarity, rollItemAffixes } from '../data/items.js';
import { addItem, countItem, removeItem } from '../systems/inventory.js';
import { craftRecipe } from '../systems/crafting.js';
import { NPCS } from '../data/npcs.js';

assert.deepEqual(Object.keys(RARITIES), ['common', 'rare', 'epic', 'legendary']);
assert.equal(rollRarity(() => 0), 'common');
assert.equal(rollRarity(() => 0.61), 'rare');
assert.equal(rollRarity(() => 0.86), 'epic');
assert.equal(rollRarity(() => 0.98), 'legendary');

const sword = ITEMS['iron-sword'];
assert.equal(rollItemAffixes(sword, 'common', () => 0).length, 0);
assert.equal(rollItemAffixes(sword, 'rare', () => 0).length, 1);
assert.equal(rollItemAffixes(sword, 'epic', () => 0).length, 2);
assert.equal(rollItemAffixes(sword, 'legendary', () => 0).length, 3);
assert.equal(new Set(rollItemAffixes(sword, 'legendary', () => 0).map(x => x.id)).size, 3);

state.game = { player: { inventory: [], gold: 0, equipped: {} } };
const legendary = addItem('iron-sword', 1, { rarity: 'legendary', random: () => 0 })[0];
assert.equal(legendary.rarity, 'legendary');
assert.equal(legendary.affixes.length, 3);
assert.ok(legendary.bonus.attack >= Math.round(sword.bonus.attack * RARITIES.legendary.multiplier));

state.game.player.inventory = [
  { id: 'herb-life', qty: 2 },
  { id: 'herb-life', qty: 3 }
];
assert.equal(countItem('herb-life'), 5);
assert.equal(removeItem('herb-life', 4), true);
assert.equal(countItem('herb-life'), 1);
assert.equal(removeItem('herb-life', 2), false);
assert.equal(countItem('herb-life'), 1);
assert.equal(removeItem('herb-life', 0), false);
assert.equal(removeItem('herb-life', 1.5), false);

for (const recipe of NPCS.alchemist.recipes) {
  assert.ok(ITEMS[recipe.result], `missing recipe result: ${recipe.id}`);
  for (const ingredient of recipe.ingredients) {
    assert.ok(ITEMS[ingredient.id], `missing ingredient: ${recipe.id}/${ingredient.id}`);
  }
}

globalThis.localStorage = {
  setItem() {},
  getItem() { return null; },
  removeItem() {}
};
state.game.player.inventory = [
  { id: 'root-fiber', qty: 3 },
  { id: 'herb-life', qty: 1 }
];
const crafted = craftRecipe('r-rune-root');
assert.equal(crafted.ok, true);
assert.equal(countItem('root-fiber'), 0);
assert.equal(countItem('herb-life'), 0);
assert.equal(countItem('rune-root'), 1);

state.game = null;
console.log('Inventory, affix and crafting checks passed');
