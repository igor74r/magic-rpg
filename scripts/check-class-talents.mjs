import assert from 'node:assert/strict';
import { getClassTalents, findTalentById } from '../data/talents.js';
import { getTalentBonus, getAvailableTalents } from '../systems/talents.js';

const playableClasses = ['warrior', 'mage', 'archer'];

for (const classId of playableClasses) {
  const talents = getClassTalents(classId);
  assert.equal(talents.length, 8, `${classId}: expected eight class talents`);
  assert.equal(new Set(talents.map(t => t.id)).size, talents.length, `${classId}: duplicate talent IDs`);
  assert.deepEqual([...new Set(talents.map(t => t.tier))].sort((a, b) => a - b), [5, 10, 15, 20]);
}

assert.ok(getClassTalents('priest').length > 0, 'legacy priest talents must remain for old saves');
assert.equal(findTalentById('archer', 'a-deadeye')?.name, 'Смертельный прицел');
assert.equal(findTalentById('archer', 'a-apex')?.effects.dodgeChance, 0.10);

const archer = { class: 'archer', level: 5, talents: [], passives: ['start'] };
assert.equal(getAvailableTalents(archer).length, 2, 'archer should have two tier-5 choices');
archer.talents.push('a-deadeye', 'a-quickdraw');
const archerBonus = getTalentBonus(archer);
assert.equal(archerBonus.critChance, 0.10);
assert.equal(archerBonus.dmgMult, 1.10);
assert.equal(archerBonus.atkFlat, 2);

const cryomancer = findTalentById('mage', 'm-cryomancer');
assert.equal(cryomancer.effects.spellMult, 1.5, 'cryomancer effect must match its +50% description');

console.log('Class talent checks passed');
