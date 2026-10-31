import assert from 'node:assert/strict';
import { RARITIES, rollRarity } from '../data/items.js';

assert.deepEqual(
  Object.fromEntries(Object.entries(RARITIES).map(([key, value]) => [key, value.weight])),
  { common: 60, rare: 25, epic: 12, legendary: 3 }
);
assert.equal(rollRarity(() => 0), 'common');
assert.equal(rollRarity(() => 0.60), 'rare');
assert.equal(rollRarity(() => 0.85), 'epic');
assert.equal(rollRarity(() => 0.98), 'legendary');
assert.equal(rollRarity(() => 1), 'legendary');
console.log('Rarity distribution checks passed.');
