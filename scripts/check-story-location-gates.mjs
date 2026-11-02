import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canEnterStoryLocation, getStoryLocationProgression, getStoryLocationRequirement } from '../systems/campaign.js';

const route = getStoryLocationProgression();
assert.equal(route.length, 15, 'all campaign regions must appear once in the ordered route');
assert.deepEqual(route.map(item => item.sequence), route.map((_, index) => index + 1),
  'story route sequence numbers must be continuous');
assert.deepEqual(
  [...new Set(route.map(item => item.actNumber))],
  [1, 2, 3, 4, 5],
  'the route must cover all five campaign acts'
);

const expected = [
  ['briar-hollow', 1],
  ['sunken-necropolis', 11],
  ['obsidian-fields', 21],
  ['frost-citadel', 31],
  ['void-crater', 41],
  ['dragon-lair', 41]
];
for (const [locationId, requiredLevel] of expected) {
  assert.equal(getStoryLocationRequirement(locationId)?.requiredLevel, requiredLevel,
    `${locationId} must use its act's recommended level floor`);
  assert.equal(canEnterStoryLocation({ level: requiredLevel - 1 }, locationId).allowed, false,
    `${locationId} must reject a character below its level gate`);
  assert.equal(canEnterStoryLocation({ level: requiredLevel }, locationId).allowed, true,
    `${locationId} must unlock at its required level`);
}
assert.equal(canEnterStoryLocation({ level: 1 }, 'village').allowed, true,
  'the village must never be level-gated');
assert.equal(canEnterStoryLocation({ level: 1 }, 'forest').allowed, true,
  'the first act side regions must be accessible from level one');
assert.equal(canEnterStoryLocation({ level: 1 }, 'rift').allowed, true,
  'rift access continues to use its own progression gate');

const campaignSource = readFileSync(new URL('../systems/campaign.js', import.meta.url), 'utf8');
const overworldSource = readFileSync(new URL('../systems/overworld.js', import.meta.url), 'utf8');
const portalSource = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const mapSource = readFileSync(new URL('../ui/locations.js', import.meta.url), 'utf8');
assert.match(campaignSource, /getStoryLocationProgression/,
  'campaign must expose a single source of truth for story route order');
assert.match(overworldSource, /canEnterStoryLocation\(state\.game\.player, locationId\)/,
  'direct overworld entry must enforce level gates');
assert.match(portalSource, /ЗАКРЫТО · НУЖЕН УРОВЕНЬ/,
  'Aurora world portal must visibly mark locked destinations');
assert.match(portalSource, /storyOrder\.get\(a\)[\s\S]*storyOrder\.get\(b\)/,
  'Aurora portal must sort campaign destinations by story sequence');
assert.match(mapSource, /map-story-link/,
  'world map must connect story locations in campaign sequence');
assert.match(mapSource, /canEnterStoryLocation\(state\.game\?\.player, id\)/,
  'world map must prevent selecting locked story destinations');

console.log('check-story-location-gates: OK — 15 ordered regions, five level bands, direct-entry protection');
