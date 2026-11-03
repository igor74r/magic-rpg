import { getTileDanger } from './hazards.js';

export const TILE = 48;

export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function hashString(str) {
  let h = 0;

  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }

  return Math.abs(h);
}

export function generateVillageMap(cols, rows) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const putRect = (x, y, width, height, tile) => {
    for (let yy = y; yy < y + height; yy++) {
      for (let xx = x; xx < x + width; xx++) {
        if (grid[yy]?.[xx] !== undefined) grid[yy][xx] = tile;
      }
    }
  };
  const road = (x1, y1, x2, y2, width = 2) => {
    let x = x1, y = y1;
    const radius = Math.floor(width / 2);
    const stamp = () => {
      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          if (grid[y + oy]?.[x + ox] !== undefined) grid[y + oy][x + ox] = 1;
        }
      };
    };
    for (let step = 0; step < cols + rows + 5; step++) {
      stamp();
      if (x === x2 && y === y2) break;
      if (x !== x2) x += Math.sign(x2 - x);
      else y += Math.sign(y2 - y);
    }
  };

  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);

  // Aurora's new layout: a compact village square, a main north–south lane,
  // and short connected branches to the craft quarter, market, tavern and gates.
  // Every route remains continuous so the player can reach all quest services.
  road(cx, rows - 1, cx, cy + 4, 2);
  road(cx, cy + 4, cx - 2, cy + 2, 2);
  road(cx - 2, cy + 2, cx, cy, 3);
  road(cx, cy, cx, 4, 2);

  road(cx, cy, 7, cy, 2);
  road(7, cy, 7, 9, 2);
  road(7, 9, 5, 11, 2);
  road(cx, cy, cols - 7, cy, 2);
  road(cols - 7, cy, cols - 7, 9, 2);
  road(cols - 7, 9, cols - 7, 20, 2);

  road(cx, cy + 2, 13, cy + 2, 2);
  road(13, cy + 2, 13, rows - 4, 2);
  road(cx, cy + 2, 25, cy + 2, 2);
  road(25, cy + 2, 25, rows - 4, 2);

  // A few soft grass gardens frame the houses without blocking any street,
  // important interaction point or the southern spawn.
  putRect(1, 1, 3, 4, 4);
  putRect(cols - 4, 1, 3, 4, 4);
  putRect(1, rows - 5, 3, 4, 4);
  putRect(cols - 4, rows - 5, 3, 4, 4);
  putRect(10, 1, 2, 2, 4);
  putRect(cols - 12, 1, 2, 2, 4);
  putRect(10, rows - 3, 2, 2, 4);
  putRect(cols - 12, rows - 3, 2, 2, 4);

  return grid;
}

export function generateMap(locationId, cols, rows) {
  if (locationId === 'village') {
    return generateVillageMap(cols, rows);
  }

  const rng = seededRandom(hashString(locationId));
  const grid = [];

  for (let y = 0; y < rows; y++) {
    grid[y] = [];

    for (let x = 0; x < cols; x++) {
      grid[y][x] = 0;
    }
  }

  // Каменные образования и препятствия.
  for (let i = 0; i < 3; i++) {
    const cx = Math.floor(rng() * cols);
    const cy = Math.floor(rng() * rows);
    const radius = 2 + Math.floor(rng() * 3);

    for (
      let y = Math.max(0, cy - radius);
      y < Math.min(rows, cy + radius);
      y++
    ) {
      for (
        let x = Math.max(0, cx - radius);
        x < Math.min(cols, cx + radius);
        x++
      ) {
        if (Math.hypot(x - cx, y - cy) <= radius && rng() > 0.2) {
          grid[y][x] = 3;
        }
      }
    }
  }

  // Камни, руины и плотные участки.
  for (let i = 0; i < 8; i++) {
    const cx = Math.floor(rng() * cols);
    const cy = Math.floor(rng() * rows);
    const radius = 1 + Math.floor(rng() * 2);

    for (
      let y = Math.max(0, cy - radius);
      y < Math.min(rows, cy + radius);
      y++
    ) {
      for (
        let x = Math.max(0, cx - radius);
        x < Math.min(cols, cx + radius);
        x++
      ) {
        if (Math.hypot(x - cx, y - cy) <= radius && rng() > 0.3) {
          grid[y][x] = 2;
        }
      }
    }
  }

  // Декоративные препятствия.
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(rng() * cols);
    const y = Math.floor(rng() * rows);

    if (grid[y][x] === 0) {
      grid[y][x] = 4;
    }
  }

  // Центральные дороги и безопасная зона появления героя.
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);

  for (let x = 0; x < cols; x++) {
    // The main horizontal road must never be cut by a random obstacle.
    grid[cy][x] = 1;
  }

  for (let y = 0; y < rows; y++) {
    // The main vertical road connects the spawn area to both map edges.
    grid[y][cx] = 1;
  }

  for (let y = cy - 2; y <= cy + 2; y++) {
    for (let x = cx - 2; x <= cx + 2; x++) {
      if (y >= 0 && y < rows && x >= 0 && x < cols) {
        grid[y][x] = 1;
      }
    }
  }

  return grid;
}

export function isBlocked(map, x, y, locationId = null) {
  if (!Array.isArray(map) || !map.length || !Array.isArray(map[0]) || x < 0 || x >= map[0].length || y < 0 || y >= map.length) {
    return true;
  }

  const tile = map[y][x];
  if (tile === 2 || tile === 4) return true;

  // Tile 3 is normally a stone formation. It becomes walkable only in regions
  // where the same surface is defined as a liquid or environmental hazard.
  return tile === 3 && !getTileDanger(tile, locationId);
}

export function isWalkable(map, cols, rows, px, py, locationId = null) {
  const x = Math.floor(px / TILE);
  const y = Math.floor(py / TILE);

  if (x < 0 || x >= cols || y < 0 || y >= rows) {
    return false;
  }

  return !isBlocked(map, x, y, locationId);
}

export function findFreeCell(
  map,
  cols,
  rows,
  avoidList = [],
  minDistFromPlayer = 0,
  playerPos = null,
  locationId = null,
  random = Math.random
) {
  const isCandidate = (x, y) => {
    if (isBlocked(map, x, y, locationId)) return false;

    const px = x * TILE + TILE / 2;
    const py = y * TILE + TILE / 2;

    if (
      playerPos &&
      Math.hypot(px - playerPos.x, py - playerPos.y) < minDistFromPlayer
    ) {
      return false;
    }

    for (const obj of avoidList) {
      if (!obj || obj.dead || obj.opened) continue;
      if (Math.hypot(px - obj.x, py - obj.y) < 80) return false;
    }

    return true;
  };

  // Fast random placement keeps the map feeling varied.
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = Math.floor(random() * cols);
    const y = Math.floor(random() * rows);
    if (isCandidate(x, y)) return { x, y };
  }

  // A bounded full scan prevents random clustering from hiding valid cells.
  // It also makes spawn placement reliable on small or obstacle-heavy maps.
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isCandidate(x, y)) return { x, y };
    }
  }

  return null;
}
