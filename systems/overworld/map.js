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
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function generateMap(locationId, cols, rows) {
  const rng = seededRandom(hashString(locationId));
  const grid = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) grid[y][x] = 0;
  }
  for (let i = 0; i < 3; i++) {
    const cx = Math.floor(rng() * cols), cy = Math.floor(rng() * rows);
    const r = 2 + Math.floor(rng() * 3);
    for (let y = Math.max(0, cy - r); y < Math.min(rows, cy + r); y++)
      for (let x = Math.max(0, cx - r); x < Math.min(cols, cx + r); x++)
        if (Math.hypot(x - cx, y - cy) <= r && rng() > 0.2) grid[y][x] = 3;
  }
  for (let i = 0; i < 8; i++) {
    const cx = Math.floor(rng() * cols), cy = Math.floor(rng() * rows);
    const r = 1 + Math.floor(rng() * 2);
    for (let y = Math.max(0, cy - r); y < Math.min(rows, cy + r); y++)
      for (let x = Math.max(0, cx - r); x < Math.min(cols, cx + r); x++)
        if (Math.hypot(x - cx, y - cy) <= r && rng() > 0.3) grid[y][x] = 2;
  }
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(rng() * cols), y = Math.floor(rng() * rows);
    if (grid[y][x] === 0) grid[y][x] = 4;
  }
  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
  for (let x = 0; x < cols; x++) if (grid[cy][x] === 0 || grid[cy][x] === 4) grid[cy][x] = 1;
  for (let y = 0; y < rows; y++) if (grid[y][cx] === 0 || grid[y][cx] === 4) grid[y][cx] = 1;
  for (let y = cy - 2; y <= cy + 2; y++)
    for (let x = cx - 2; x <= cx + 2; x++)
      if (y >= 0 && y < rows && x >= 0 && x < cols) grid[y][x] = 1;
  return grid;
}

export function isBlocked(map, x, y) {
  if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) return true;
  const t = map[y][x];
  return t === 2 || t === 3 || t === 4;
}

export function isWalkable(map, cols, rows, px, py) {
  const x = Math.floor(px / TILE), y = Math.floor(py / TILE);
  if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
  return !isBlocked(map, x, y);
}

export function findFreeCell(map, cols, rows, avoidList, minDistFromPlayer, playerPos) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (isBlocked(map, x, y)) continue;
    const px = x * TILE + TILE / 2, py = y * TILE + TILE / 2;
    if (playerPos && Math.hypot(px - playerPos.x, py - playerPos.y) < minDistFromPlayer) continue;
    let overlap = false;
    for (const o of avoidList) {
      if (o.dead) continue;
      if (Math.hypot(px - o.x, py - o.y) < 80) { overlap = true; break; }
    }
    if (overlap) continue;
    return { x, y };
  }
  return null;
}