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
    const stamp = () => {
      const radius = Math.floor(width / 2);
      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          if (grid[y + oy]?.[x + ox] !== undefined) grid[y + oy][x + ox] = 1;
        }
      }
    };
    for (let step = 0; step < cols + rows + 5; step++) {
      stamp();
      if (x === x2 && y === y2) break;
      if (x !== x2) x += Math.sign(x2 - x);
      else y += Math.sign(y2 - y);
    }
  };

  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
  // Compact, connected village: a generous central square with short lanes
  // leading directly to each house and workshop entrance.
  road(cx, 0, cx, rows - 1, 2);
  road(0, cy, cols - 1, cy, 2);
  putRect(cx - 7, cy - 5, 15, 11, 1);
  road(cx, cy - 5, cx, 4, 2);
  road(cx, cy + 5, cx, rows - 1, 2);
  road(cx - 7, cy - 2, 7, cy - 2, 2);
  road(cx + 7, cy - 2, cols - 7, cy - 2, 2);
  road(cx - 7, cy + 5, 7, cy + 5, 2);
  road(cx + 7, cy + 5, cols - 7, cy + 5, 2);
  road(13, cy - 5, 13, 4, 1);
  road(25, cy - 5, 25, 4, 1);
  road(13, cy + 5, 13, rows - 4, 1);
  road(25, cy + 5, 25, rows - 4, 1);

  // Small orchard and flower beds frame the village without narrowing lanes.
  putRect(1, 1, 3, 4, 4);
  putRect(cols - 4, 1, 3, 4, 4);
  putRect(1, rows - 5, 3, 4, 4);
  putRect(cols - 4, rows - 5, 3, 4, 4);
  putRect(9, 1, 2, 2, 4);
  putRect(cols - 11, 1, 2, 2, 4);
  putRect(9, rows - 3, 2, 2, 4);
  putRect(cols - 11, rows - 3, 2, 2, 4);

  // Keep every interaction point, resident and front door on connected ground.
  const clearCells = [
    [cx, cy + 4], [cx, cy - 7], [cx - 3, cy - 2], [cx + 3, cy - 2],
    [15, 14], [19, 14], [24, 14], [16, 11], [18, 11], [21, 11],
    [7, 11], [31, 11], [7, 22], [31, 22], [19, 7], [19, 25],
    [13, 16], [12, 13], [27, 13], [15, 10], [15, 18],
    [12, 10], [27, 10], [12, 18], [27, 18], [10, 14], [29, 14],
    [10, 19], [29, 19], [27, 22], [9, 10], [9, 12], [10, 12], [29, 21], [9, 22],
    [19, 17], [17, 17], [19, 7], [7, 11], [31, 11], [7, 22], [31, 22],
    [13, 7], [25, 7], [13, 25], [25, 25],
    [19, 6], [7, 10], [31, 10], [7, 22], [31, 22]
  ];
  for (const [x, y] of clearCells) {
    if (grid[y]?.[x] !== undefined) grid[y][x] = 1;
  }
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
