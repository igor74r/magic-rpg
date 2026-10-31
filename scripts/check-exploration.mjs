import assert from 'node:assert/strict';
import { normalizeExploration, recordLocationVisit, markLocationCleared } from '../systems/exploration.js';

const player = {};
assert.equal(recordLocationVisit(player, 'forest', 1000), true);
assert.deepEqual(player.exploration.visited.forest, {
  visits: 1, firstVisitedAt: 1000, lastVisitedAt: 1000, cleared: false
});
recordLocationVisit(player, 'forest', 2000);
assert.equal(player.exploration.visited.forest.visits, 2);
assert.equal(player.exploration.visited.forest.firstVisitedAt, 1000);
assert.equal(player.exploration.visited.forest.lastVisitedAt, 2000);
assert.equal(markLocationCleared(player, 'forest'), true);
assert.equal(player.exploration.visited.forest.cleared, true);
assert.equal(markLocationCleared(player, 'ruins'), false);
assert.equal(recordLocationVisit(player, '../bad', 3000), false);

const legacy = normalizeExploration({
  visited: { forest: { visits: -10, firstVisitedAt: -1, lastVisitedAt: 'bad', cleared: true }, '../bad': {} },
  lastLocationId: 'forest'
});
assert.deepEqual(legacy.visited.forest, { visits: 1, firstVisitedAt: 0, lastVisitedAt: 0, cleared: true });
assert.equal(Object.hasOwn(legacy.visited, '../bad'), false);
assert.equal(legacy.lastLocationId, 'forest');

for (let i = 0; i < 80; i++) recordLocationVisit(player, 'region-' + i, 4000 + i);
assert.ok(Object.keys(player.exploration.visited).length <= 64);
assert.equal(player.exploration.lastLocationId, 'region-79');
console.log('Exploration progress and save normalization checks passed');
