import assert from 'node:assert/strict';
import { ITEMS } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { LOCATIONS } from '../data/locations.js';
import { STORY } from '../data/story.js';
import { ACT_RELIC_REWARDS, getActNumberForLocation, rollDungeonChestLoot, getDungeonChestType } from '../data/dungeon-treasures.js';
import { ITEMS as ITEM_DATA } from '../data/items.js';

const expectedRelics = [
  ['briar-hollow', 'elder-treant', 'relic-root-memory'],
  ['sunken-necropolis', 'bone-tyrant', 'relic-last-archive'],
  ['obsidian-fields', 'flame-lord', 'relic-ember-oath'],
  ['frost-citadel', 'ice-queen', 'relic-frost-crown'],
  ['dragon-lair', 'ancient-dragon', 'relic-void-star']
];
assert.equal(Object.keys(ACT_RELIC_REWARDS).length, 5);
for (let i = 0; i < expectedRelics.length; i++) {
  const [locationId, bossId, itemId] = expectedRelics[i];
  const reward = ACT_RELIC_REWARDS[locationId];
  assert.equal(reward.actId, `act-${i + 1}`);
  assert.equal(reward.bossId, bossId);
  assert.equal(reward.itemId, itemId);
  assert.equal(ENEMIES[bossId]?.boss, true);
  assert.equal(ITEMS[itemId]?.unique, true);
  assert.equal(ITEMS[itemId]?.relicAct, i + 1);
  assert.ok(ITEMS[itemId]?.bonus && Object.keys(ITEMS[itemId].bonus).length > 0);
}

const campaignLocations = new Set(STORY.acts.flatMap(act => [
  act.locationId,
  ...act.missions.map(mission => mission.locationId || act.locationId)
]));
assert.equal(campaignLocations.size, 15);
for (const locationId of campaignLocations) {
  assert.ok(LOCATIONS[locationId], `missing location: ${locationId}`);
  const actNumber = getActNumberForLocation(locationId);
  assert.ok(actNumber >= 1 && actNumber <= 5, `invalid act tier for ${locationId}`);
  const low = rollDungeonChestLoot(locationId, () => 0);
  const high = rollDungeonChestLoot(locationId, () => 0.999999);
  assert.ok(ITEMS[low.itemId], `missing low-roll chest item in ${locationId}`);
  assert.ok(ITEMS[high.itemId], `missing high-roll chest item in ${locationId}`);
  assert.equal(low.actNumber, actNumber);
  assert.equal(high.actNumber, actNumber);
  assert.equal(low.rarity, 'common');
  assert.ok(['rare', 'epic', 'legendary'].includes(high.rarity));
}
assert.equal(getActNumberForLocation('village'), 1);
assert.equal(ITEM_DATA['rusty-key']?.type, 'quest');
assert.equal(getDungeonChestType('briar-hollow', 1, 0, 3), 'wooden');
assert.equal(getDungeonChestType('briar-hollow', 1, 1, 3), 'locked');
assert.equal(getDungeonChestType('briar-hollow', 1, 1, 3), getDungeonChestType('briar-hollow', 1, 1, 3), 'chest types remain stable after re-entry');
assert.notEqual(getDungeonChestType('briar-hollow', 1, 2, 3), getDungeonChestType('briar-hollow', 10, 2, 3), 'floor identity participates in chest type generation');
const generatedTypes = new Set();
for (let floor = 1; floor <= 80; floor++) for (let index = 2; index < 8; index++) generatedTypes.add(getDungeonChestType('briar-hollow', floor, index, 8));
for (const type of ['wooden', 'cursed', 'mimic', 'ancient']) assert.ok(generatedTypes.has(type), `chest generation includes ${type}`);
console.log('Act relic and regional dungeon treasure checks passed');
