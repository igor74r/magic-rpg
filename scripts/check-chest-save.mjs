import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { createCharacter } from '../systems/character.js';
import { openChest } from '../systems/overworld/spawn.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};

assert.equal(createCharacter('Chest Save Regression', 'warrior'), true);
state.currentSlot = 1;
state.overworld = {
  active: true, locationId: 'forest', sourceLocationId: 'forest',
  floatingNumbers: [], particles: [], log: [], enemies: [], chests: [], events: [],
  combat: null, defeated: false
};
const chest = { x: 100, y: 100, opened: false };
state.overworld.chests.push(chest);
const before = JSON.stringify(state.game);
const originalSetItem = globalThis.localStorage.setItem;
globalThis.localStorage.setItem = () => { throw new Error('simulated storage quota'); };

const result = openChest(chest);
globalThis.localStorage.setItem = originalSetItem;

assert.equal(result, false, 'chest opening must fail when persistence fails');
assert.equal(chest.opened, false, 'chest must remain available to retry');
assert.equal(JSON.stringify(state.game), before, 'item, quest and chest statistics must roll back');
assert.equal(state.overworld.log.length, 1, 'failed chest transactions must not publish reward log entries');
assert.match(state.overworld.log[0].msg, /Не удалось сохранить сундук/, 'failed chest transaction must publish only its rollback warning');
assert.equal(state.overworld.floatingNumbers.length, 0, 'failed chest transactions must not show reward floating numbers');
assert.equal(state.overworld.particles.length, 0, 'failed chest transactions must not spawn reward particles');
state.overworld = null;
state.game = null;
console.log('check-chest-save: OK — chest rewards rollback on persistence failure');
