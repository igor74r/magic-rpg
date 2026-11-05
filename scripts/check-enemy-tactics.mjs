import assert from 'node:assert/strict';
import { getEnemyCombatRole, getEnemyCombatDecision, getEnemyEngagementRange } from '../systems/overworld/enemy-ai.js';

assert.equal(getEnemyCombatRole('snipe'), 'marksman', 'snipe enemies should use the marksman role');
assert.equal(getEnemyCombatRole('double'), 'bruiser', 'double-strike enemies should use the bruiser role');
assert.equal(getEnemyCombatRole('drain'), 'leech', 'drain enemies should use the leech role');
assert.equal(getEnemyCombatRole(null), 'skirmisher', 'ordinary enemies should use the skirmisher role');

assert.equal(getEnemyEngagementRange('snipe'), 118, 'marksmen should engage from ranged distance');
assert.equal(getEnemyEngagementRange('drain'), 76, 'leech enemies should engage at medium distance');
assert.equal(getEnemyEngagementRange('double'), 48, 'bruisers should close in before engaging');
assert.equal(getEnemyEngagementRange(null), 44, 'ordinary enemies should retain contact engagement');


let decision = getEnemyCombatDecision({
  specialType: 'snipe', specialEvery: 3, turnCount: 1, playerHpRatio: 0.3
});
assert.deepEqual(decision, { role: 'marksman', action: 'telegraph', reason: 'opening' },
  'marksman should warn before exploiting a low-health opening');
decision = getEnemyCombatDecision({
  specialType: 'snipe', specialEvery: 3, turnCount: 2, pendingSpecial: true
});
assert.equal(decision.action, 'special', 'a telegraphed attack must resolve on the next enemy turn');

decision = getEnemyCombatDecision({
  specialType: 'double', specialEvery: 3, turnCount: 1, blocking: true
});
assert.equal(decision.role, 'bruiser');
assert.equal(decision.reason, 'opening', 'bruisers should recognize a defensive stance as an opening');

decision = getEnemyCombatDecision({
  specialType: 'snipe', specialEvery: 3, turnCount: 1,
  blocking: true, isBoss: true
});
assert.equal(decision.action, 'telegraph', 'bosses should prepare a counter when the player blocks');
assert.equal(decision.reason, 'punish-block');

decision = getEnemyCombatDecision({
  specialType: 'drain', specialEvery: 3, turnCount: 1,
  enemyHpRatio: 0.2, isBoss: true
});
assert.equal(decision.action, 'telegraph', 'bosses should enter an enrage sequence below 25% health');
assert.equal(decision.reason, 'enrage');


decision = getEnemyCombatDecision({
  specialType: 'drain', specialEvery: 3, turnCount: 1, enemyHpRatio: 0.4
});
assert.equal(decision.action, 'telegraph', 'leech enemies should prepare drain when critically injured');

decision = getEnemyCombatDecision({
  specialType: 'snipe', specialEvery: 3, turnCount: 3
});
assert.equal(decision.reason, 'cadence', 'scheduled specials should still occur on their configured cadence');
assert.equal(getEnemyCombatDecision({
  specialType: 'snipe', specialEvery: 3, turnCount: 3, pendingSpecial: true
}).action, 'special', 'pending specials should take priority over another telegraph');

decision = getEnemyCombatDecision({
  specialType: 'double', specialEvery: 0, turnCount: 3, blocking: true
});
assert.equal(decision.action, 'attack', 'invalid special cadence must safely fall back to a basic attack');


decision = getEnemyCombatDecision({
  specialType: 'snipe', specialEvery: 4, turnCount: 1, playerHpRatio: 0.42
});
assert.equal(decision.reason, 'opening', 'marksmen should telegraph when the player is vulnerable, not nearly defeated');

decision = getEnemyCombatDecision({
  specialType: 'double', specialEvery: 4, turnCount: 1, enemyHpRatio: 0.25
});
assert.equal(decision.reason, 'survival', 'non-leech enemies should telegraph a survival move at critical health');

console.log('Enemy tactical checks passed: archetype roles, telegraphs, counterplay, openings and special cadence');
