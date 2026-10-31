import assert from 'node:assert/strict';
import { LOCATIONS } from '../data/locations.js';
import { generateMap, isBlocked, isWalkable, findFreeCell } from '../systems/overworld/map.js';
import { getTileDanger } from '../systems/overworld/hazards.js';

for (const [locationId, location] of Object.entries(LOCATIONS)) {
  const cols = location.mapCols || 40;
  const rows = location.mapRows || 30;
  const mapA = generateMap(locationId, cols, rows);
  const mapB = generateMap(locationId, cols, rows);
  assert.deepEqual(mapA, mapB, `${locationId}: map generation must be deterministic`);
  assert.equal(mapA.length, rows, `${locationId}: row count`);
  assert.ok(mapA.every(row => row.length === cols), `${locationId}: column count`);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  if (locationId !== 'village') {
    assert.ok(mapA[cy].every(tile => tile === 1), `${locationId}: central horizontal road must be clear`);
    assert.ok(mapA.every(row => row[cx] === 1), `${locationId}: central vertical road must be clear`);
  }
  assert.equal(isWalkable(mapA, cols, rows, (cx + 0.5) * 48, (cy + 0.5) * 48, locationId), true,
    `${locationId}: central spawn must be walkable`);
}

assert.equal(isBlocked([[3]], 0, 0, 'volcano'), false, 'lava tile is traversable in volcano region');
assert.equal(isBlocked([[3]], 0, 0, 'briar-hollow'), false, 'poison tile is traversable in briar hollow');
assert.equal(isBlocked([[3]], 0, 0, 'sunken-necropolis'), false, 'spike tile is traversable in sunken necropolis');
assert.equal(isBlocked([[3]], 0, 0, 'forest'), true, 'ordinary stone remains blocked elsewhere');
assert.equal(isBlocked([[2]], 0, 0, 'volcano'), true, 'walls remain blocked in hazard regions');
assert.equal(isBlocked([[4]], 0, 0, 'briar-hollow'), true, 'dense props remain blocked');
assert.equal(isBlocked([[0]], -1, 0, 'forest'), true, 'out-of-bounds cells remain blocked');

for (const locationId of [
  'volcano', 'dragon', 'obsidian-fields',
  'swamp', 'briar-hollow',
  'ruins', 'sunken-necropolis'
]) {
  const location = LOCATIONS[locationId];
  const map = generateMap(locationId, location.mapCols || 40, location.mapRows || 30);
  const cx = Math.floor((location.mapCols || 40) / 2);
  const cy = Math.floor((location.mapRows || 30) / 2);
  const hazards = map.flatMap((row, y) => row
    .map((tile, x) => tile === 3 && (x !== cx && y !== cy) ? { x, y } : null)
    .filter(Boolean));
  assert.ok(hazards.length >= 8,
    `${locationId}: biome must contain guaranteed hazard pockets away from the spawn lanes`);
  assert.ok(hazards.some(cell => getTileDanger(3, locationId)),
    `${locationId}: hazard tiles must resolve to a biome danger`);
}

for (const locationId of ['volcano', 'briar-hollow', 'sunken-necropolis']) {
  const cell = findFreeCell([[3]], 1, 1, [], 0, null, locationId, () => 0);
  assert.deepEqual(cell, { x: 0, y: 0 }, `${locationId}: free-cell search must use region collision rules`);
}

const empty = findFreeCell([[2]], 1, 1, [], 0, null, 'volcano', () => 0);
assert.equal(empty, null, 'free-cell search must reject solid obstacles');

const fallback = findFreeCell([[2, 0]], 2, 1, [], 0, null, 'forest', () => 0);
assert.deepEqual(fallback, { x: 1, y: 0 },
  'free-cell search must scan the map when random attempts repeatedly hit obstacles');

const avoidsOccupied = findFreeCell(
  [[0, 0, 0]], 3, 1,
  [{ x: 24, y: 24 }], 0, null, 'forest', () => 0
);
assert.deepEqual(avoidsOccupied, { x: 2, y: 0 },
  'free-cell search must avoid existing spawn objects');

console.log('Overworld map, hazard collision and free-cell checks passed');

const expectedHazards = {
  volcano: { type: 'lava', dmg: 1, every: 90 },
  dragon: { type: 'lava', dmg: 1, every: 90 },
  'obsidian-fields': { type: 'lava', dmg: 1, every: 90 },
  swamp: { type: 'poison', dmg: 1, every: 180 },
  'briar-hollow': { type: 'poison', dmg: 1, every: 180 },
  ruins: { type: 'spike', dmg: 2, every: 0 },
  'sunken-necropolis': { type: 'spike', dmg: 2, every: 0 }
};

for (const [locationId, expected] of Object.entries(expectedHazards)) {
  const danger = getTileDanger(3, locationId);
  assert.ok(danger, `${locationId}: configured hazard must exist`);
  assert.equal(danger.type, expected.type, `${locationId}: hazard type`);
  assert.equal(danger.dmg, expected.dmg, `${locationId}: hazard damage`);
  assert.equal(danger.every, expected.every, `${locationId}: hazard cadence`);
  assert.equal(isWalkable([[3]], 1, 1, 24, 24, locationId), true,
    `${locationId}: environmental hazard must remain traversable`);
}

assert.equal(getTileDanger(3, 'forest'), null,
  'ordinary regions must not inherit biome hazard damage');
assert.equal(getTileDanger(2, 'volcano'), null,
  'solid wall tiles must not be treated as environmental hazards');
assert.equal(getTileDanger(3, null), null,
  'hazard lookup without a region must remain safe');

