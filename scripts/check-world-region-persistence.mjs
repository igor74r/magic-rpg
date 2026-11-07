import assert from 'node:assert/strict';
import { createWorldState, ensureWorldState } from '../systems/world-state.js';
import {
  ensureRegionRecord,
  recordRegionChestOpened,
  recordRegionEnemyDefeat,
  recordRegionEnemyRespawned,
  applyRegionPersistence
} from '../systems/region-state.js';

const game = { world: createWorldState({ seed: 998877 }) };
const world = ensureWorldState(game);
const first = ensureRegionRecord(world, 'forest', 2);
assert.equal(first.generationVisit, 2);
assert.equal(ensureRegionRecord(world, 'forest', 9).generationVisit, 2,
  'region generation seed index must remain stable across revisits');
assert.equal(recordRegionChestOpened(world, 'forest', 'chest-1'), true);
assert.equal(recordRegionChestOpened(world, 'forest', 'chest-1'), false);
assert.equal(recordRegionEnemyDefeat(world, 'forest', 'enemy-2', 35), true);
world.clockMinutes = 20;
const enemies = [{ persistentId: 'enemy-2', hp: 40, dead: false, effects: [] }, { persistentId: 'enemy-1', hp: 30, dead: false }];
const chests = [{ id: 'chest-0', opened: false }, { id: 'chest-1', opened: false }];
applyRegionPersistence(world, 'forest', enemies, chests, 1000);
assert.equal(chests[0].opened, false);
assert.equal(chests[1].opened, true);
assert.equal(enemies[0].dead, true);
assert.equal(enemies[0].hp, 0);
assert.equal(enemies[0].respawnAt, 901000);
assert.equal(enemies[1].dead, false);
world.clockMinutes = 36;
applyRegionPersistence(world, 'forest', enemies, chests, 2000);
assert.equal(enemies[0].dead, false, 'expired defeat cooldown must not keep an enemy dead');
assert.equal(recordRegionEnemyRespawned(world, 'forest', 'enemy-2'), false);
assert.equal(ensureRegionRecord(world, 'ruins', 1).openedChests.length, 0, 'region state must be isolated');
console.log('Persistent region state: stable generation, opened chests, defeated enemies and respawn cooldown passed.');
