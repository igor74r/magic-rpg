import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCATIONS } from '../data/locations.js';
import { generateMap, isBlocked } from '../systems/overworld/map.js';
import { getVillageBuildingColliders, getVillagePropColliders, isVillagePositionBlocked } from '../systems/overworld/collisions.js';

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

const buildings = village.statics.filter(item => item.decorative && item.buildingStyle);
const doorTargets = buildings.map(item => ({ id: `${item.id}-door-approach`, x: item.x, y: item.y + 1 }));
const targets = [
  ...village.npcs.map(({ id, x, y }) => ({ id, x, y })),
  ...village.statics.filter(item => !item.decorative).map(({ id, x, y }) => ({ id, x, y })),
  ...doorTargets
];
const interactionCount = village.npcs.filter(item => !item.ambient).length
  + village.statics.filter(item => !item.decorative).length;

assert.ok(village.npcs.filter(item => item.ambient).every(item => item.wanderRadius >= 40 && item.wanderRadius <= 70),
  'ambient residents must have compact bounded walking areas');

assert.equal(buildings.length, 8, 'Aurora must have six service buildings and exactly two homes');
assert.equal(buildings.filter(item => item.buildingStyle === 'home').length, 2,
  'Aurora must retain exactly two residential homes');
const roadCenterX = Math.floor(village.mapCols / 2);
const roadCenterY = Math.floor(village.mapRows / 2);
for (const building of buildings) {
  assert.ok(Math.abs(building.x - roadCenterX) > 1 && Math.abs(building.y - roadCenterY) > 1,
    `${building.id}: no building may occupy the straight road cross`);
}
// Aurora uses a connected village street plan with short branches rather than
// a full-width straight cross. The reachability checks below validate access.
assert.ok(map[roadCenterY][roadCenterX] === 1, 'central square must connect to the street network');
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
const propColliders = getVillagePropColliders();
assert.ok(propColliders.length >= 8, 'solid service props must have collision footprints');
assert.ok(propColliders.every(rect => rect.width > 0 && rect.height > 0), 'solid prop colliders must have positive dimensions');
for (const prop of village.statics.filter(item => ['fountain', 'bench', 'memorial', 'anvil', 'woodpile', 'cart', 'barrels', 'stall', 'herb-rack'].includes(item.propStyle))) {
  assert.equal(isVillagePositionBlocked(prop.x * 48 + 24, prop.y * 48 + 24, 8), true,
    `${prop.id}: solid prop center must block player`);
}
for (const prop of village.statics.filter(item => ['lantern', 'planter', 'banner', 'brazier'].includes(item.propStyle))) {
  assert.equal(isVillagePositionBlocked(prop.x * 48 + 24, prop.y * 48 + 24, 8), false,
    `${prop.id}: lightweight plaza decor must not block player`);
}
assert.equal(colliders.length, 24, 'each of eight buildings must have three wall segments');
assert.ok(colliders.every(rect => rect.width >= 40 && rect.height >= 28),
  'building wall collision must scale with the enlarged 3×3-tile houses');
assert.ok(colliders.every(rect => rect.width > 0 && rect.height > 0), 'wall rectangles must have positive dimensions');
for (const building of buildings) {
  const x = building.x * 48 + 24;
  const y = building.y * 48 + 24;
  assert.equal(isVillagePositionBlocked(x, y + 8, 10), false,
    `${building.id}: front doorway must remain passable`);
  assert.equal(isVillagePositionBlocked(x - 30, y - 5, 10), true,
    `${building.id}: left wall must block the player`);
  assert.equal(isVillagePositionBlocked(x + 30, y - 5, 10), true,
    `${building.id}: right wall must block the player`);
  assert.equal(isVillagePositionBlocked(x, y - 18, 10), true,
    `${building.id}: back wall must block the player`);
}

const mainSource = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
for (const room of ['forge', 'healer', 'alchemy', 'market', 'hall', 'tavern']) {
  assert.ok(mainSource.includes(`${room}: { title:`), `missing ${room} interior definition`);
}
assert.ok(mainSource.includes('exitVillageInterior'), 'interiors must provide an exit to the village');
assert.ok(mainSource.includes('openWorldPortalMenu'), 'world portal must open a navigation window');
assert.ok(mainSource.includes('openWorldPortalMenu'), 'world portal must open a navigation window');
assert.ok(!mainSource.includes('data-world-tower'), 'world portal menu must not duplicate the village tower entrance');
assert.ok(mainSource.includes('aria-modal="true"'), 'world portal window must expose dialog semantics');
assert.ok(mainSource.includes("event.key === 'Escape'"), 'world portal window must close with Escape');
const overworldInputSource = readFileSync(new URL('../ui/overworld.js', import.meta.url), 'utf8');
assert.ok(overworldInputSource.includes("addEventListener('pointerdown', onOverworldCanvasClick)"), 'portal sprites must respond immediately to pointer and touch input');
assert.ok(overworldInputSource.includes("addEventListener('click', onOverworldCanvasClick)"), 'portal sprites must retain mouse click support');
assert.ok(overworldInputSource.includes('window.GameAPI?.interactNpc?.(nearest.id)'), 'portal click must invoke the existing interaction contract');

const styleSource = readFileSync(new URL('../css/2d-art-direction.css', import.meta.url), 'utf8');
assert.ok(styleSource.includes('.village-room-art'), 'interior scenes must have their own visual styling');
const spriteSource = readFileSync(new URL('../ui/overworld/sprites.js', import.meta.url), 'utf8');
assert.ok(spriteSource.includes("['tower-gate', 15]"), 'tower portal must use its dedicated authored atlas frame');
assert.ok(spriteSource.includes("style === 'world-portal' ? getAuroraWorldPortalAtlas()") || (spriteSource.includes("const isWorldPortal = style === 'world-portal'") && spriteSource.includes("getAuroraWorldPortalAtlas()")), 'Aurora world portal must load its dedicated authored PNG atlas');
assert.ok(spriteSource.includes("isWorldPortal ? 0 : frame * 64"), 'Aurora world portal must draw frame zero from its dedicated atlas');

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
assert.ok(!spawnSource.includes("id: 'tower-gate'"), 'other regions must not receive a tower gate; only Aurora has the dedicated entrance');

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
const roadTiles = map.flat().filter(tile => tile === 1).length;
assert.ok(roadTiles > 140, 'village must retain enough road tiles for its connected street network');
const centerRowRoad = map[roadCenterY].map((tile, x) => tile === 1 ? x : -1).filter(x => x >= 0);
assert.ok(centerRowRoad.length < village.mapCols - 4,
  'the central street must not become a full-width rigid horizontal cross');
const centerColumnRoad = map.map((row, y) => row[roadCenterX] === 1 ? y : -1).filter(y => y >= 0);
assert.ok(centerColumnRoad.length < village.mapRows - 2,
  'the central street must not become a full-height rigid vertical cross');

console.log(`Aurora village layout passed: 38x28, ${village.npcs.length} residents, ${interactionCount} interaction points, ${buildings.length} buildings, ${colliders.length} wall segments, ${visited.size} reachable cells`);
