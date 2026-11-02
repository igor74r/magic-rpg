import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { addExp, getExpNext, MAX_LEVEL } from '../systems/progression.js';

const player = {
  class: 'warrior', level: 1, exp: 25, expNext: getExpNext(1),
  maxHp: 100, hp: 80, maxMp: 50, mp: 10,
  str: 10, con: 10, dex: 5, int: 5, wis: 5,
  luck: 5, statPoints: 0, passivePoints: 0
};
state.game = { player };
const snapshot = JSON.stringify(player);
for (const invalid of [0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '50']) {
  addExp(invalid);
  assert.equal(JSON.stringify(player), snapshot, `invalid XP gain ${String(invalid)} must not mutate progression`);
}
player.exp = Number.MAX_SAFE_INTEGER - 10;
const overflowSnapshot = JSON.stringify(player);
addExp(100);
assert.equal(JSON.stringify(player), overflowSnapshot, 'XP total overflow must be rejected');
player.exp = 25;
addExp(75);
assert.equal(player.level, 2);
assert.equal(player.exp, 0);
assert.equal(player.expNext, getExpNext(2));
assert.equal(player.statPoints, 1);
assert.equal(player.passivePoints, 1);
assert.equal(player.hp, player.maxHp);

// A malformed threshold must be repaired before adding a valid reward.
player.expNext = 0;
addExp(1);
assert.equal(player.expNext, getExpNext(player.level));
assert.ok(Number.isFinite(player.exp));
assert.ok(player.level < MAX_LEVEL);

state.game = null;
console.log('check-progression: PASS (invalid XP guards, level-up and threshold recovery)');
