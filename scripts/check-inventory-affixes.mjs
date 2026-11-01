import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { ITEMS, RARITIES, rollRarity, rollItemAffixes } from '../data/items.js';
import { addItem, countItem, removeItem } from '../systems/inventory.js';
import { craftRecipe } from '../systems/crafting.js';
import { NPCS } from '../data/npcs.js';

assert.deepEqual(Object.keys(RARITIES), ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']);
assert.deepEqual(Object.values(RARITIES).map(rarity => rarity.weight), [60, 25, 10, 4, 0.9, 0.1]);
assert.equal(rollRarity(() => 0), 'common');
assert.equal(rollRarity(() => 0.61), 'uncommon');
assert.equal(rollRarity(() => 0.86), 'rare');
assert.equal(rollRarity(() => 0.96), 'epic');
assert.equal(rollRarity(() => 0.995), 'legendary');
assert.equal(rollRarity(() => 0.9999, { allowMythic: true }), 'mythic');

const sword = ITEMS['iron-sword'];
assert.deepEqual(Object.values(RARITIES).map(rarity => rollItemAffixes(sword, Object.keys(RARITIES)[rarity.tier - 1], () => 0).length), [0, 1, 2, 3, 4, 5]);
assert.equal(new Set(rollItemAffixes(sword, 'mythic', () => 0).map(x => x.id)).size, 5);
for (const type of ['weapon','head','shoulders','chest','gloves','legs','boots','shield','ring','amulet','cloak']) {
  assert.equal(rollItemAffixes({ type }, 'mythic', () => 0).length, 5, `T6 affix pool missing for ${type}`);
}

state.game = { player: { inventory: [], gold: 0, equipped: {} } };
const legendary = addItem('iron-sword', 1, { rarity: 'legendary', random: () => 0 })[0];
assert.equal(legendary.rarity, 'legendary');
assert.equal(legendary.affixes.length, 4);
assert.ok(legendary.bonus.attack >= sword.bonus.attack);

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
