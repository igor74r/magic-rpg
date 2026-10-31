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
        if (grid[yy] && grid[yy][xx] !== undefined) {
          grid[yy][xx] = tile;
        }
      }
    }
  };

  const road = (x1, y1, x2, y2, width = 1) => {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1;
    let y = y1;

    for (let step = 0; step < cols + rows + 5; step++) {
      for (
        let ox = -Math.floor(width / 2);
        ox <= Math.floor(width / 2);
        ox++
      ) {
        for (
          let oy = -Math.floor(width / 2);
          oy <= Math.floor(width / 2);
          oy++
        ) {
          if (grid[y + oy] && grid[y + oy][x + ox] !== undefined) {
            grid[y + oy][x + ox] = 1;
          }
        }
      }

      if (x === x2 && y === y2) break;

      if (x !== x2) x += dx;
      else if (y !== y2) y += dy;
    }
  };

  // Центральная площадь и главные улицы.
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);

  putRect(cx - 1, 0, 3, rows, 1);
  putRect(0, cy - 1, cols, 3, 1);
  putRect(cx - 4, cy - 3, 9, 7, 1);

  // Улицы к ремесленным кварталам и жилым домам.
  road(11, 8, 29, 8, 2);
  road(11, 23, 29, 23, 2);
  road(11, 8, 11, 23, 2);
  road(29, 8, 29, 23, 2);
  road(cx, 5, cx, cy - 3, 2);
  road(cx, cy + 4, cx, 27, 2);
  road(5, cy, 11, cy, 2);
  road(29, cy, 35, cy, 2);

  // Главные здания: кузница, лечебный дом, ратуша,
  // караулка, алхимическая лавка и торговые ряды.
  // 2 — непроходимые стены и здания.
  // 4 — деревья и плотные клумбы.
  putRect(7, 5, 4, 3, 2);
  putRect(28, 5, 4, 3, 2);
  putRect(18, 2, 5, 3, 2);
  putRect(18, 28, 5, 3, 2);
  putRect(7, 24, 4, 3, 2);
  putRect(28, 24, 4, 3, 2);
  putRect(3, 13, 4, 5, 2);
  putRect(33, 13, 4, 5, 2);

  // Небольшие постройки на окраинах.
  putRect(3, 3, 3, 2, 2);
  putRect(34, 3, 3, 2, 2);
  putRect(3, 27, 3, 2, 2);
  putRect(34, 27, 3, 2, 2);

  // Проходы к входам домов.
  road(11, 8, 12, 8, 1);
  road(27, 8, 29, 8, 1);
  road(11, 23, 12, 23, 1);
  road(27, 23, 29, 23, 1);
  road(cx, 5, cx, 6, 1);
  road(cx, 27, cx, 28, 1);

  // Сады, изгороди и зелёные зоны по краям.
  const gardens = [
    [1, 1, 2, 5],
    [1, 8, 2, 3],
    [1, 22, 2, 5],
    [37, 1, 2, 5],
    [37, 8, 2, 3],
    [37, 22, 2, 5],
    [13, 2, 3, 2],
    [24, 2, 3, 2],
    [13, 28, 3, 2],
    [24, 28, 3, 2]
  ];

  for (const [x, y, width, height] of gardens) {
    putRect(x, y, width, height, 4);
  }

  // NPC и точки взаимодействия должны стоять на проходимых клетках.
  const clearCells = [
    [20, 16],
    [18, 13],
    [16, 13],
    [24, 13],
    [11, 8],
    [29, 8],
    [11, 23],
    [29, 23],
    [20, 5],
    [20, 27],
    [18, 18],
    [23, 18],
    [20, 20]
  ];

  for (const [x, y] of clearCells) {
    if (grid[y] && grid[y][x] !== undefined) {
      grid[y][x] = 1;
    }
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

  // Guaranteed biome hazard pockets. They are placed away from the central
  // travel lanes so every region has readable environmental danger without
  // trapping the player at the spawn point.
  const hazardRegions = new Set([
    'volcano', 'dragon', 'obsidian-fields',
    'swamp', 'briar-hollow',
    'ruins', 'sunken-necropolis'
  ]);
  if (hazardRegions.has(locationId)) {
    const pockets = [
      [Math.max(2, Math.floor(cols * 0.22)), Math.max(2, Math.floor(rows * 0.24))],
      [Math.min(cols - 3, Math.floor(cols * 0.78)), Math.min(rows - 3, Math.floor(rows * 0.76))]
    ];
    for (const [hx, hy] of pockets) {
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (Math.abs(ox) + Math.abs(oy) > 2) continue;
          const x = hx + ox;
          const y = hy + oy;
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[y][x] = 3;
          }
        }
      }
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
