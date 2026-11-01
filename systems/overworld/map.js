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

  // District layout scales from the requested 64x48 map.
  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
  const left = Math.max(3, Math.floor(cols * 0.12));
  const right = Math.min(cols - 10, Math.floor(cols * 0.72));
  const north = Math.max(3, Math.floor(rows * 0.10));
  const south = Math.min(rows - 9, Math.floor(rows * 0.72));

  // Organic main roads: a gently winding north-south route and a curved
  // east-west lane replace the old rigid cross. Coordinates are clamped by road().
  const path = (points, width = 2) => {
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, ay] = points[i], [bx, by] = points[i + 1];
      road(ax, ay, bx, by, width);
    }
  };
  path([[cx - 2, 0], [cx - 2, Math.floor(rows * .22)], [cx + 1, Math.floor(rows * .34)],
    [cx + 2, Math.floor(rows * .47)], [cx - 1, Math.floor(rows * .61)],
    [cx - 2, Math.floor(rows * .78)], [cx + 1, rows - 1]], 2);
  path([[0, cy + 2], [Math.floor(cols * .18), cy + 1], [Math.floor(cols * .32), cy - 2],
    [Math.floor(cols * .48), cy - 1], [Math.floor(cols * .64), cy + 2],
    [Math.floor(cols * .82), cy + 1], [cols - 1, cy - 2]], 2);
  // The central plaza is a compact walkable space, not a giant rectangular road slab.
  putRect(cx - 4, cy - 4, 9, 9, 1);

  // All small residential buildings removed from Aurora.

  // Curved side lanes branch toward homes, workshops and garden gates.
  path([[left + 8, north + 7], [left + 7, north + 10], [left + 8, cy - 2], [left + 9, cy + 2]], 2);
  path([[right, north + 7], [right - 1, north + 10], [right + 1, cy - 2], [right, cy + 2]], 2);
  path([[left + 8, south], [left + 7, south + 3], [left + 8, rows - 1]], 2);
  path([[right + 4, south], [right + 5, south + 3], [right + 4, rows - 1]], 2);
  path([[cx - 5, north + 7], [cx - 4, north + 9], [cx - 5, cy - 5]], 1);
  path([[cx + 5, north + 7], [cx + 4, north + 9], [cx + 5, cy - 5]], 1);

  // Garden plots, orchard strips and dark overgrown boundary corners.
  const gardens = [
    [1, 2, 3, 8], [1, rows - 12, 3, 8],
    [cols - 4, 2, 3, 8], [cols - 4, rows - 12, 3, 8],
    [left + 10, 2, 4, 3], [right - 2, 2, 4, 3],
    [left + 10, rows - 5, 4, 3], [right - 2, rows - 5, 4, 3],
    [cx - 12, cy - 9, 3, 2], [cx + 9, cy + 7, 3, 2]
  ];
  for (const [x, y, w, h] of gardens) putRect(x, y, w, h, 4);

  // Irregular greenery breaks the rigid rectangular silhouette at Aurora's edge.
  // These patches are deterministic and only occupy empty ground, never roads or buildings.
  const edgePatches = [
    { x: 5, y: 4, rx: 3, ry: 2 }, { x: 9, y: 13, rx: 2, ry: 3 },
    { x: 5, y: 25, rx: 3, ry: 2 }, { x: 8, y: 40, rx: 2, ry: 3 },
    { x: 57, y: 5, rx: 3, ry: 2 }, { x: 55, y: 16, rx: 2, ry: 3 },
    { x: 58, y: 29, rx: 3, ry: 2 }, { x: 55, y: 41, rx: 2, ry: 3 },
    { x: 22, y: 5, rx: 3, ry: 2 }, { x: 42, y: 5, rx: 3, ry: 2 },
    { x: 21, y: 43, rx: 3, ry: 2 }, { x: 43, y: 43, rx: 3, ry: 2 }
  ];
  for (const patch of edgePatches) {
    for (let yy = patch.y - patch.ry; yy <= patch.y + patch.ry; yy++) {
      for (let xx = patch.x - patch.rx; xx <= patch.x + patch.rx; xx++) {
        const dx = (xx - patch.x) / patch.rx, dy = (yy - patch.y) / patch.ry;
        if (dx * dx + dy * dy > 1.15) continue;
        if (grid[yy]?.[xx] === 0) grid[yy][xx] = 4;
      }
    }
  }

  // Interaction spots and the player arrival point must stay walkable.
  const clearCells = [
    [cx, cy + 4], [cx, cy - 7], [cx - 3, cy - 2], [cx + 3, cy - 2],
    [left + 8, north + 8], [right, north + 8],
    [left + 8, south - 1], [right + 4, south - 1],
    [cx - 1, rows - 9], [cx + 1, rows - 9],
    [cx - 3, cy + 1], [cx + 3, cy + 1],
    [cx - 2, cy + 4], [cx + 2, cy + 4],
    [cx - 5, cy], [cx + 5, cy], [left + 8, cy], [right + 4, cy],
    [27, 21], [29, 21], [35, 21], [15, 15], [46, 15],
    [15, 37], [50, 37], [32, 11], [32, 38], [27, 27],
    [25, 24], [39, 24], [32, 18], [43, 34],
    [34, 27], [36, 26], [23, 18], [19, 35], [43, 27],
    [32, 30], [28, 19], [36, 19], [28, 29], [36, 29],
    [25, 18], [39, 18], [25, 30], [39, 30],
    [23, 17], [18, 15], [18, 18], [20, 18], [47, 33], [18, 37]
  ];
  for (const [x, y] of clearCells) {
    if (grid[y]?.[x] !== undefined) grid[y][x] = 1;
  }
  // Remove any legacy house tile IDs from this location.
  for (let yy = 0; yy < rows; yy++) for (let xx = 0; xx < cols; xx++) if (grid[yy][xx] === 2) grid[yy][xx] = 0;
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
