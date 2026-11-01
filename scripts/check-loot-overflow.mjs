import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { ITEMS } from '../data/items.js';
import { addItemOrStore, claimPendingLoot } from '../systems/inventory.js';

const player = {
  str: 1000,
  inventory: Array.from({ length: 30 }, () => ({
    id: 'iron-sword', qty: 1, rarity: 'common', bonus: {}, affixes: [], runes: []
  })),
  pendingLoot: []
};
state.game = { player };

const overflow = addItemOrStore('leather-armor', 1, { allowMythic: true });
assert.deepEqual(overflow.created, []);
assert.equal(overflow.stored, true);
assert.equal(player.pendingLoot.length, 1);
assert.deepEqual(
  player.pendingLoot[0],
  { id: 'leather-armor', qty: 1, allowMythic: true }
);

// Pending rewards survive the same JSON round-trip used by game saves.
state.game = JSON.parse(JSON.stringify(state.game));
assert.equal(state.game.player.pendingLoot[0].id, 'leather-armor');

const stillFull = claimPendingLoot(0);
assert.equal(stillFull.ok, false);
assert.equal(stillFull.reason, 'capacity');
assert.equal(state.game.player.pendingLoot.length, 1);

state.game.player.inventory.pop();
const claimed = claimPendingLoot(0);
assert.equal(claimed.ok, true);
assert.equal(claimed.entry.id, 'leather-armor');
assert.equal(claimed.created.length, 1);
assert.equal(state.game.player.inventory.at(-1).id, 'leather-armor');
assert.equal(state.game.player.pendingLoot.length, 0);

// Stackable rewards are also preserved if the bag has no free slot.
state.game.player.inventory = Array.from({ length: 30 }, () => ({
  id: 'iron-sword', qty: 1, rarity: 'common', bonus: {}, affixes: [], runes: []
}));
const herbs = addItemOrStore('herb-life', 2);
assert.equal(herbs.stored, true);
assert.equal(state.game.player.pendingLoot.length, 1);
state.game.player.inventory.pop();
const claimedHerbs = claimPendingLoot(0);
assert.equal(claimedHerbs.ok, true);
assert.equal(state.game.player.inventory.at(-1).id, 'herb-life');
assert.equal(state.game.player.inventory.at(-1).qty, 2);
assert.equal(state.game.player.pendingLoot.length, 0);

const invalid = addItemOrStore('missing-item', 1);
assert.equal(invalid.stored, false);
assert.equal(state.game.player.pendingLoot.length, 0);

for (const entry of state.game.player.inventory) {
  assert.ok(ITEMS[entry.id], 'claimed item must exist in item catalog');
}
state.game = null;
console.log('PASS overflow equipment rewards persist and can be claimed after freeing capacity');
console.log('PASS overflow stackable rewards persist and preserve quantity');
console.log('PASS pending rewards survive save serialization and invalid IDs are rejected');
console.log('check-loot-overflow: OK');
