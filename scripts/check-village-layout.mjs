import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCATIONS } from '../data/locations.js';
import { generateMap, isBlocked } from '../systems/overworld/map.js';

const village = LOCATIONS.village;
assert.equal(village.mapCols, 64, 'Aurora width must be 64 cells');
assert.equal(village.mapRows, 48, 'Aurora height must be 48 cells');
assert.equal(village.safe, true, 'Aurora remains a safe location');
assert.deepEqual(village.enemies, [], 'Aurora must not spawn enemies');

const map = generateMap('village', village.mapCols, village.mapRows);
assert.equal(map.length, 48);
assert.ok(map.every(row => row.length === 64));

const start = { x: 32, y: 28 };
assert.equal(isBlocked(map, start.x, start.y, 'village'), false, 'player arrival cell is walkable');

const targets = [
  ...village.npcs.map(({ id, x, y }) => ({ id, x, y })),
  ...village.statics.filter(item => !item.decorative).map(({ id, x, y }) => ({ id, x, y }))
];
const interactionCount = village.npcs.filter(item => !item.ambient).length
  + village.statics.filter(item => !item.decorative).length;
assert.ok(village.npcs.filter(item => item.ambient).every(item => item.wanderRadius >= 70),
  'ambient residents must have bounded individual walking areas');
const buildings = village.statics.filter(item => item.decorative && item.buildingStyle);
assert.ok(buildings.length >= 10, 'village must render key buildings and residential homes');
assert.ok(buildings.some(item => item.buildingStyle === 'forge'));
assert.ok(buildings.some(item => item.buildingStyle === 'tavern'));
const plazaProps = village.statics.filter(item => item.propStyle);
assert.ok(plazaProps.some(item => item.propStyle === 'fountain'), 'central square must have its fountain');
assert.ok(plazaProps.some(item => item.propStyle === 'lantern'), 'central square must have lanterns');
assert.ok(plazaProps.some(item => item.propStyle === 'planter'), 'central square must have flower planters');
assert.ok(plazaProps.every(item => item.decorative), 'plaza props must not intercept NPC interactions');
const mainSource = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
for (const room of ['forge', 'healer', 'alchemy', 'market', 'hall', 'tavern']) {
  assert.ok(mainSource.includes(`${room}: { title:`), `missing ${room} interior definition`);
}
assert.ok(mainSource.includes('exitVillageInterior'), 'interiors must provide an exit to the village');
const styleSource = readFileSync(new URL('../css/2d-art-direction.css', import.meta.url), 'utf8');
assert.ok(styleSource.includes('.village-room-art'), 'interior scenes must have their own visual styling');
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
const boardSource = readFileSync(new URL('../ui/quests.js', import.meta.url), 'utf8');
assert.ok(boardSource.includes('Новости Авроры'), 'notice board must show village news');
assert.ok(boardSource.includes("dragons['blood-crown']"), 'village news must react to the final dragon');
assert.ok(boardSource.includes("dragons['ice-grasp']"), 'village news must react to the second dragon');
assert.ok(boardSource.includes("dragons['ash-herald']"), 'village news must react to the first dragon');
for (const target of targets) {
  assert.equal(isBlocked(map, target.x, target.y, 'village'), false,
    `${target.id}: interaction cell must be walkable`);
}

// Flood-fill the road network from the spawn point and ensure every service,
// landmark and resident can be reached without crossing a building or hedge.
const queue = [start];
const visited = new Set([`${start.x},${start.y}`]);
for (let i = 0; i < queue.length; i++) {
  const { x, y } = queue[i];
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
    if (nx < 0 || nx >= 64 || ny < 0 || ny >= 48 || visited.has(key)) continue;
    if (isBlocked(map, nx, ny, 'village')) continue;
    visited.add(key);
    queue.push({ x: nx, y: ny });
  }
}
for (const target of targets) {
  assert.ok(visited.has(`${target.x},${target.y}`),
    `${target.id}: must be reachable from the village entrance`);
}

assert.ok(map.flat().includes(2), 'village must contain solid building footprints');
assert.ok(map.flat().includes(4), 'village must contain garden/hedge areas');
assert.ok(map.flat().filter(tile => tile === 1).length > 250,
  'village must have a connected, substantial road network');

console.log(`Aurora village layout passed: 64x48, ${village.npcs.length} residents, ${interactionCount} interaction points, ${buildings.length} buildings, ${visited.size} reachable cells`);
