// Regression coverage for skip-turn effects in both combat directions.
import assert from 'node:assert/strict';
import { applyEffect, tickEffects, isStunned, consumeStun } from '../systems/status.js';

for (const targetName of ['player', 'enemy']) {
  const target = { effects: [] };
  applyEffect(target, 'stun');
  tickEffects(target);
  assert.equal(isStunned(target), true, `${targetName} stun must survive the same-turn status tick`);
  assert.equal(consumeStun(target), true, `${targetName} stun must be consumed by the turn resolver`);
  assert.equal(isStunned(target), false, `${targetName} stun must not persist after skipping one turn`);
}

const poisoned = { effects: [] };
applyEffect(poisoned, 'poison');
const poisonTick = tickEffects(poisoned);
assert.equal(poisonTick.totalDamage, 5, 'damage-over-time effects must still tick immediately');
assert.equal(poisoned.effects[0].duration, 2, 'damage-over-time duration must still decrease');

console.log('Combat status regression: 5/5 checks passed (player/enemy stun persistence, one-turn consumption, poison tick and duration).');
