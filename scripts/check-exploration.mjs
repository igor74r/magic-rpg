import assert from 'node:assert/strict';
import { normalizeExploration, recordLocationVisit, markLocationCleared, getDungeonProgress, updateDungeonProgress, isDungeonChestOpened, getDungeonSecrets, saveDungeonSecrets, hasDungeonSecretsGenerated, isDungeonBossDefeated } from '../systems/exploration.js';

const player = {};
assert.equal(recordLocationVisit(player, 'forest', 1000), true);
assert.deepEqual(player.exploration.visited.forest, {
  visits: 1, firstVisitedAt: 1000, lastVisitedAt: 1000, cleared: false,
  dungeon: { floor: 1, checkpoint: null, openedChests: [], secretsFound: [], secrets: [], secretFloors: [], bossDefeated: false, defeatedBosses: [] }
});
recordLocationVisit(player, 'forest', 2000);
assert.equal(player.exploration.visited.forest.visits, 2);
assert.equal(player.exploration.visited.forest.firstVisitedAt, 1000);
assert.equal(player.exploration.visited.forest.lastVisitedAt, 2000);
assert.equal(markLocationCleared(player, 'forest'), true);
assert.equal(player.exploration.visited.forest.cleared, true);
assert.equal(markLocationCleared(player, 'ruins'), false);
assert.equal(updateDungeonProgress(player, 'forest', { floor: 2, checkpoint: 'crypt-hall', chestId: 'chest-01', secretId: 'hidden-room', bossDefeated: true }), true);
assert.deepEqual(getDungeonProgress(player, 'forest'), {
  floor: 2, checkpoint: 'crypt-hall', openedChests: ['chest-01'],
  secretsFound: ['hidden-room'], secrets: [], secretFloors: [], bossDefeated: true, defeatedBosses: ['f2-shadow-mage']
});
assert.equal(isDungeonChestOpened(player, 'forest', 'chest-01'), true);
assert.equal(isDungeonChestOpened(player, 'forest', 'chest-02'), false);
assert.equal(isDungeonChestOpened(player, 'forest', '../invalid'), false);

assert.equal(isDungeonBossDefeated(player, 'forest', 2, 'shadow-mage'), true);
assert.equal(isDungeonBossDefeated(player, 'forest', 1, 'shadow-mage'), false);
assert.equal(isDungeonBossDefeated(player, 'forest', 2, '../invalid'), false);
assert.equal(updateDungeonProgress(player, 'forest', { bossId: 'f1-grave-king' }), true);
assert.equal(isDungeonBossDefeated(player, 'forest', 1, 'grave-king'), true);

assert.equal(hasDungeonSecretsGenerated(player, 'forest', 2), false);
assert.equal(saveDungeonSecrets(player, 'forest', 2, [
  { id: 'f2-s1', tx: 8, ty: 9, ax: 7, ay: 9, rewardType: 'chest' }
]), true);
assert.equal(hasDungeonSecretsGenerated(player, 'forest', 2), true);
assert.deepEqual(getDungeonSecrets(player, 'forest', 2), [
  { id: 'f2-s1', tx: 8, ty: 9, ax: 7, ay: 9, rewardType: 'chest' }
]);
assert.deepEqual(getDungeonSecrets(player, 'forest', 1), []);
assert.equal(saveDungeonSecrets(player, 'forest', 1, [{ id: 'f1-s1', tx: 4, ty: 5, ax: 4, ay: 6, rewardType: 'loot' }]), true);
assert.equal(getDungeonSecrets(player, 'forest', 1)[0].id, 'f1-s1');
assert.equal(getDungeonSecrets(player, 'forest', 2)[0].id, 'f2-s1');

assert.equal(updateDungeonProgress(player, 'forest', { floor: -20, checkpoint: '../invalid', chestId: '../bad' }), true);
assert.equal(getDungeonProgress(player, 'forest').floor, 1);
assert.equal(getDungeonProgress(player, 'forest').checkpoint, 'crypt-hall');
assert.deepEqual(getDungeonProgress(player, 'forest').openedChests, ['chest-01']);
assert.equal(recordLocationVisit(player, '../bad', 3000), false);

const legacy = normalizeExploration({
  visited: { forest: { visits: -10, firstVisitedAt: -1, lastVisitedAt: 'bad', cleared: true, dungeon: { floor: 0, openedChests: ['chest-a', '../bad'], secretsFound: ['secret-a'] } }, '../bad': {} },
  lastLocationId: 'forest'
});
assert.equal(legacy.visited.forest.visits, 1);
assert.equal(legacy.visited.forest.firstVisitedAt, 0);
assert.equal(legacy.visited.forest.lastVisitedAt, 0);
assert.deepEqual(legacy.visited.forest.dungeon, {
  floor: 1, checkpoint: null, openedChests: ['chest-a'],
  secretsFound: ['secret-a'], secrets: [], secretFloors: [], bossDefeated: false, defeatedBosses: []
});
assert.equal(Object.hasOwn(legacy.visited, '../bad'), false);
assert.equal(legacy.lastLocationId, 'forest');

for (let i = 0; i < 80; i++) recordLocationVisit(player, 'region-' + i, 4000 + i);
assert.ok(Object.keys(player.exploration.visited).length <= 64);
assert.equal(player.exploration.lastLocationId, 'region-79');
console.log('Exploration and dungeon persistence checks passed');
