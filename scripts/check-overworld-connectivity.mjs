import assert from 'node:assert/strict';
import { LOCATIONS } from '../data/locations.js';
import { generateMap, isBlocked, findFreeCell } from '../systems/overworld/map.js';

function reachable(map, locationId, startX, startY) {
  const rows = map.length, cols = map[0]?.length || 0;
  const seen = new Set([startY * cols + startX]);
  const queue = [[startX, startY]];
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const key = ny * cols + nx;
      if (seen.has(key) || isBlocked(map, nx, ny, locationId)) continue;
      seen.add(key); queue.push([nx, ny]);
    }
  }
  return seen;
}

for (const [id, loc] of Object.entries(LOCATIONS)) {
  const cols = loc.mapCols || 40, rows = loc.mapRows || 30;
  const map = generateMap(id, cols, rows);
  const sx = Math.floor(cols / 2);
  const sy = id === 'village' ? Math.floor(rows / 2) + 4 : Math.floor(rows / 2);
  assert.ok(!isBlocked(map, sx, sy, id), id + ': player spawn must be walkable');
  const cells = reachable(map, id, sx, sy);
  assert.ok(cells.has(sx), id + ': north gate must be reachable');
  assert.ok(cells.has((rows - 1) * cols + sx), id + ': south gate must be reachable');
  assert.ok(cells.has(sy * cols), id + ': west edge must be reachable');
  assert.ok(cells.has(sy * cols + cols - 1), id + ': east edge must be reachable');
  const cell = findFreeCell(map, cols, rows, [], 0, null, id, () => 0);
  assert.ok(cell, id + ': spawn search must find a free cell');
  assert.ok(!isBlocked(map, cell.x, cell.y, id), id + ': spawn search must respect biome collision');
  assert.ok(cells.has(cell.y * cols + cell.x), id + ': spawn candidate must connect to player');
}
console.log('Overworld connectivity and dungeon traversal checks passed');
