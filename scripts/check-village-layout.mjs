import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCATIONS } from '../data/locations.js';
import { generateMap, isBlocked } from '../systems/overworld/map.js';
import { getVillageBuildingColliders, isVillagePositionBlocked } from '../systems/overworld/collisions.js';

const village = LOCATIONS.village;
assert.equal(village.mapCols, 38, 'Aurora width must be compact');
assert.equal(village.mapRows, 28, 'Aurora height must be compact');
assert.equal(village.safe, true, 'Aurora remains a safe location');
assert.deepEqual(village.enemies, [], 'Aurora must not spawn enemies');

const map = generateMap('village', village.mapCols, village.mapRows);
assert.equal(map.length, 28);
assert.ok(map.every(row => row.length === 38));

const start = { x: 19, y: 15 };
assert.equal(isBlocked(map, start.x, start.y, 'village'), false, 'player must arrive beside the central portal');

const targets = [
  ...village.npcs.map(({ id, x, y }) => ({ id, x, y })),
  ...village.statics.filter(item => !item.decorative).map(({ id, x, y }) => ({ id, x, y }))
];
const interactionCount = village.npcs.filter(item => !item.ambient).length
  + village.statics.filter(item => !item.decorative).length;

assert.ok(village.npcs.filter(item => item.ambient).every(item => item.wanderRadius >= 40 && item.wanderRadius <= 70),
  'ambient residents must have compact bounded walking areas');

const buildings = village.statics.filter(item => item.decorative && item.buildingStyle);
assert.equal(buildings.length, 10, 'Aurora must have six service buildings and four homes');
for (const style of ['forge', 'healer', 'alchemy', 'market', 'hall', 'tavern', 'home']) {
  assert.ok(buildings.some(item => item.buildingStyle === style), `missing ${style} building`);
}

assert.ok(village.statics.some(item => item.id === 'world-portal' && item.propStyle === 'world-portal'),
  'central world portal must be present');
assert.ok(village.statics.some(item => item.id === 'tower-portal' && item.propStyle === 'tower-gate'),
  'dedicated tower portal must be present');

const plazaProps = village.statics.filter(item => item.propStyle);
assert.ok(plazaProps.some(item => item.propStyle === 'fountain'), 'central square must have its fountain');
assert.ok(plazaProps.some(item => item.propStyle === 'lantern'), 'central square must have lanterns');
assert.ok(plazaProps.some(item => item.propStyle === 'planter'), 'central square must have flower planters');
assert.ok(plazaProps.every(item => item.decorative || ['world-portal', 'tower-portal'].includes(item.id)),
  'only portals may intercept interactions among plaza props');

const colliders = getVillageBuildingColliders();
assert.equal(colliders.length, 30, 'each of ten buildings must have three wall segments');
for (const building of buildings) {
  const x = building.x * 48 + 24;
  const y = building.y * 48 + 24;
  assert.equal(isVillagePositionBlocked(x, y + 8, 10), false,
    `${building.id}: front doorway must remain passable`);
  assert.equal(isVillagePositionBlocked(x - 27, y + 8, 10), true,
    `${building.id}: side wall must block the player`);
}

const mainSource = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
for (const room of ['forge', 'healer', 'alchemy', 'market', 'hall', 'tavern']) {
  assert.ok(mainSource.includes(`${room}: { title:`), `missing ${room} interior definition`);
}
assert.ok(mainSource.includes('exitVillageInterior'), 'interiors must provide an exit to the village');
assert.ok(mainSource.includes('openWorldPortalMenu'), 'world portal must open a navigation window');
assert.ok(mainSource.includes('data-world-tower'), 'world navigation must expose the tower action');

const styleSource = readFileSync(new URL('../css/2d-art-direction.css', import.meta.url), 'utf8');
assert.ok(styleSource.includes('.village-room-art'), 'interior scenes must have their own visual styling');
const spriteSource = readFileSync(new URL('../ui/overworld/sprites.js', import.meta.url), 'utf8');
assert.ok(spriteSource.includes("style === 'tower-gate'"), 'tower portal needs its own model');
assert.ok(spriteSource.includes("style === 'world-portal'"), 'Aurora world portal needs its own model');

const effectsSource = readFileSync(new URL('../ui/overworld/effects.js', import.meta.url), 'utf8');
assert.ok(effectsSource.includes("weather: 'ash'"), 'Aurora must have a restrained ash atmosphere');
assert.ok(effectsSource.includes("getCurrentBiome() === 'village' ? '#f3c879'"), 'Aurora night fireflies must use warm light');
const renderSource = readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8');
assert.ok(renderSource.includes('villageNightAlpha'), 'Aurora must have a softer day/night tint');

const spawnSource = readFileSync(new URL('../systems/overworld/spawn.js', import.meta.url), 'utf8');
for (const dragonFlag of ["dragons['ash-herald']", "dragons['ice-grasp']", "dragons['blood-crown']"]) {
  assert.ok(spawnSource.includes(dragonFlag), `Aurora must react to ${dragonFlag}`);
}
assert.ok(spawnSource.includes('aurora-rift-ward'), 'final dragon victory must add the Rift memorial');
assert.ok(spawnSource.includes('world-waystone-'), 'other regions must receive themed world waystones');
assert.ok(spawnSource.includes("id: 'tower-gate'"), 'other regions must receive a dedicated tower gate');

const boardSource = readFileSync(new URL('../ui/quests.js', import.meta.url), 'utf8');
assert.ok(boardSource.includes('Новости Авроры'), 'notice board must show village news');
assert.ok(boardSource.includes("dragons['blood-crown']"), 'village news must react to the final dragon');
assert.ok(boardSource.includes("dragons['ice-grasp']"), 'village news must react to the second dragon');
assert.ok(boardSource.includes("dragons['ash-herald']"), 'village news must react to the first dragon');

for (const target of targets) {
  assert.equal(isBlocked(map, target.x, target.y, 'village'), false,
    `${target.id}: interaction cell must be walkable`);
}

const queue = [start];
const visited = new Set([`${start.x},${start.y}`]);
for (let i = 0; i < queue.length; i++) {
  const { x, y } = queue[i];
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
    if (nx < 0 || nx >= village.mapCols || ny < 0 || ny >= village.mapRows || visited.has(key)) continue;
    if (isBlocked(map, nx, ny, 'village')) continue;
    visited.add(key);
    queue.push({ x: nx, y: ny });
  }
}
for (const target of targets) {
  assert.ok(visited.has(`${target.x},${target.y}`),
    `${target.id}: must be reachable from the village entrance`);
}
assert.ok(map.flat().includes(4), 'village must retain small garden/hedge areas');
assert.ok(map.flat().filter(tile => tile === 1).length > 150,
  'village must have a connected road network');

console.log(`Aurora village layout passed: 38x28, ${village.npcs.length} residents, ${interactionCount} interaction points, ${buildings.length} buildings, ${colliders.length} wall segments, ${visited.size} reachable cells`);
