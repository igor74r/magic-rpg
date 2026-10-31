import assert from 'node:assert/strict';
import { getPassiveTree } from '../data/passives.js';
import {
  allocatePassive,
  canAllocatePassive,
  getTalentBonus,
  resetPassives
} from '../systems/talents.js';

const classes = ['warrior', 'mage', 'archer'];

for (const classId of classes) {
  const tree = getPassiveTree(classId);
  assert.equal(tree.classId, classId);
  assert.equal(Object.keys(tree.nodes).length, 31, `${classId}: expected 20 nodes plus start`);
  assert.ok(tree.nodes.start);
  for (const node of Object.values(tree.nodes)) {
    if (node.id !== 'start') assert.ok(node.levelReq >= 2 && node.levelReq <= 35);
    for (const parentId of node.conn) {
      assert.ok(tree.nodes[parentId], `${classId}/${node.id}: missing connection ${parentId}`);
    }
  }
}

const player = {
  class: 'warrior',
  level: 20,
  passivePoints: 4,
  passives: ['start'],
  gold: 500
};

assert.equal(canAllocatePassive(player, 'warrior-might-1'), true);
assert.equal(allocatePassive(player, 'warrior-might-1'), true);
assert.equal(allocatePassive(player, 'warrior-might-2'), true);
assert.equal(allocatePassive(player, 'warrior-might-3'), true);
assert.equal(allocatePassive(player, 'warrior-might-4'), true);
assert.equal(player.passivePoints, 0);
assert.equal(player.passives.length, 5);
assert.ok(getTalentBonus(player).dmgMult > 1);

const result = resetPassives(player);
assert.deepEqual(result, { ok: true, refunded: 4, cost: 500 });
assert.deepEqual(player.passives, ['start']);
assert.equal(player.passivePoints, 4);
assert.equal(player.gold, 0);

const brokePlayer = {
  class: 'mage',
  level: 20,
  passivePoints: 0,
  passives: ['start', 'mage-fire-1'],
  gold: 499
};
const failed = resetPassives(brokePlayer);
assert.equal(failed.ok, false);
assert.equal(brokePlayer.passives.length, 2);
assert.equal(brokePlayer.passivePoints, 0);
assert.equal(brokePlayer.gold, 499);

console.log('Passive tree checks passed');
