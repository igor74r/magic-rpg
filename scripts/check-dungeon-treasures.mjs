import assert from 'node:assert/strict';
import { ITEMS } from '../data/items.js';
import { ENEMIES } from '../data/enemies.js';
import { LOCATIONS } from '../data/locations.js';
import { STORY } from '../data/story.js';
import { ACT_RELIC_REWARDS, getActNumberForLocation, rollDungeonChestLoot } from '../data/dungeon-treasures.js';

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
console.log('Act relic and regional dungeon treasure checks passed');
