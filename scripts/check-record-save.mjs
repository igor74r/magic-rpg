import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { createCharacter } from '../systems/character.js';
import { recordRiftFloor } from '../systems/rift.js';
import { recordTowerFloor } from '../systems/tower.js';

const originalStorage = globalThis.localStorage;
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};

try {
  assert.equal(createCharacter('Record Save Regression', 'warrior'), true);
  state.currentSlot = 1;
  const player = state.game.player;
  player.riftBest = 2;
  player.towerBest = 3;

  const originalSetItem = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => { throw new Error('simulated storage quota'); };

  assert.equal(recordRiftFloor(5), false, 'rift record must not confirm a failed save');
  assert.equal(player.riftBest, 2, 'rift record must roll back on save failure');
  assert.equal(recordTowerFloor(7), false, 'tower record must not confirm a failed save');
  assert.equal(player.towerBest, 3, 'tower record must roll back on save failure');

  globalThis.localStorage.setItem = originalSetItem;
  assert.equal(recordRiftFloor(5), true, 'rift record should persist successfully');
  assert.equal(player.riftBest, 5);
  assert.equal(recordTowerFloor(7), true, 'tower record should persist successfully');
  assert.equal(player.towerBest, 7);

  console.log('check-record-save: PASS (rift/tower records roll back on persistence failure)');
} finally {
  state.game = null;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
}
