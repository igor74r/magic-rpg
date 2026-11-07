import assert from 'node:assert/strict';
import { createWorldState, ensureWorldState } from '../systems/world-state.js';
import {
  ensureRegionRecord,
  recordRegionChestOpened,
  recordRegionEnemyDefeat,
  recordRegionEnemyRespawned,
  recordRegionEventResolved,
  recordRegionSecretDiscovered,
  recordRegionSecretLayout,
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
assert.equal(recordRegionEventResolved(world, 'forest', 'event-altar-0'), true);
assert.equal(recordRegionEventResolved(world, 'forest', 'event-altar-0'), false);
assert.equal(recordRegionSecretDiscovered(world, 'forest', 'secret-12-8', { id: 'secret-12-8-chest', x: 320, y: 240 }), true);
assert.equal(recordRegionSecretDiscovered(world, 'forest', 'secret-12-8'), false);
const secretLayout = [{ id: 'secret-12-8', tx: 12, ty: 8, wx: 600, wy: 408, ax: 13, ay: 8, rewardType: 'chest' }];
assert.equal(recordRegionSecretLayout(world, 'forest', secretLayout), true);
assert.equal(recordRegionSecretLayout(world, 'forest', []), false, 'generated secret layout must not be rerolled on revisits');
world.clockMinutes = 20;
const enemies = [{ persistentId: 'enemy-2', hp: 40, dead: false, effects: [] }, { persistentId: 'enemy-1', hp: 30, dead: false }];
const chests = [{ id: 'chest-0', opened: false }, { id: 'chest-1', opened: false }];
const events = [{ id: 'event-altar-0', resolved: false }, { id: 'event-crystal-0', resolved: false }];
applyRegionPersistence(world, 'forest', enemies, chests, events, 1000);
assert.equal(chests[0].opened, false);
assert.equal(chests[1].opened, true);
assert.deepEqual(events.map(event => event.id), ['event-crystal-0'], 'resolved exploration events must not respawn on revisiting');
assert.equal(enemies[0].dead, true);
assert.equal(enemies[0].hp, 0);
assert.equal(enemies[0].respawnAt, 901000);
assert.equal(enemies[1].dead, false);
world.clockMinutes = 36;
applyRegionPersistence(world, 'forest', enemies, chests, events, 2000);
assert.equal(enemies[0].dead, false, 'expired defeat cooldown must not keep an enemy dead');
assert.equal(recordRegionEnemyRespawned(world, 'forest', 'enemy-2'), false);
const roundTrip = JSON.parse(JSON.stringify(game));
ensureWorldState(roundTrip);
assert.deepEqual(roundTrip.world.regions.forest.discoveredSecrets, ['secret-12-8'],
  'discovered secret IDs must survive save serialization and world-state sanitization');
assert.deepEqual(roundTrip.world.regions.forest.secretChests, [{ id: 'secret-12-8-chest', x: 320, y: 240 }],
  'revealed secret treasure chests must survive save serialization until opened');
assert.equal(roundTrip.world.regions.forest.secretLayoutGenerated, true);
assert.deepEqual(roundTrip.world.regions.forest.secretWalls, secretLayout,
  'the exact secret wall layout and reward type must survive save serialization');
assert.equal(ensureRegionRecord(world, 'ruins', 1).discoveredSecrets.length, 0,
  'secret discovery must be isolated per region');
assert.equal(ensureRegionRecord(world, 'ruins', 1).openedChests.length, 0, 'region state must be isolated');
console.log('Persistent region state: stable generation, opened chests, defeated enemies and respawn cooldown passed.');
