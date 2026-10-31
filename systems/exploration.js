const MAX_VISITED = 64;
const ID_RE = /^[a-z0-9-]{1,48}$/i;

function cleanIdList(value, limit = 128) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && ID_RE.test(id)))].slice(0, limit);
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const dungeon = record.dungeon && typeof record.dungeon === 'object' ? record.dungeon : {};
  return {
    visits: Math.max(1, Math.min(999999, Math.floor(Number(record.visits) || 1))),
    firstVisitedAt: Math.max(0, Number(record.firstVisitedAt) || 0),
    lastVisitedAt: Math.max(0, Number(record.lastVisitedAt) || 0),
    cleared: record.cleared === true,
    dungeon: {
      floor: Math.max(1, Math.min(999, Math.floor(Number(dungeon.floor) || 1))),
      checkpoint: typeof dungeon.checkpoint === 'string' && ID_RE.test(dungeon.checkpoint) ? dungeon.checkpoint : null,
      openedChests: cleanIdList(dungeon.openedChests),
      secretsFound: cleanIdList(dungeon.secretsFound),
      bossDefeated: dungeon.bossDefeated === true
    }
  };
}

export function normalizeExploration(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const visited = source.visited && typeof source.visited === 'object' && !Array.isArray(source.visited)
    ? source.visited : {};
  const clean = {};
  for (const [id, raw] of Object.entries(visited).slice(-MAX_VISITED)) {
    if (!ID_RE.test(id)) continue;
    const record = normalizeRecord(raw);
    if (record) clean[id] = record;
  }
  return { visited: clean, lastLocationId: typeof source.lastLocationId === 'string' && ID_RE.test(source.lastLocationId) ? source.lastLocationId : null };
}

export function recordLocationVisit(player, locationId, now = Date.now()) {
  if (!player || typeof locationId !== 'string' || !ID_RE.test(locationId)) return false;
  const exploration = normalizeExploration(player.exploration);
  const previous = exploration.visited[locationId];
  exploration.visited[locationId] = {
    visits: Math.min(999999, (previous?.visits || 0) + 1),
    firstVisitedAt: previous?.firstVisitedAt || now,
    lastVisitedAt: now,
    cleared: previous?.cleared === true,
    dungeon: previous?.dungeon || { floor: 1, checkpoint: null, openedChests: [], secretsFound: [], bossDefeated: false }
  };
  exploration.lastLocationId = locationId;
  const entries = Object.entries(exploration.visited);
  if (entries.length > MAX_VISITED) {
    entries.sort((a, b) => a[1].lastVisitedAt - b[1].lastVisitedAt);
    for (const [id] of entries.slice(0, entries.length - MAX_VISITED)) delete exploration.visited[id];
  }
  player.exploration = exploration;
  return true;
}

export function markLocationCleared(player, locationId) {
  const record = player?.exploration?.visited?.[locationId];
  if (!record) return false;
  record.cleared = true;
  return true;
}

export function getDungeonProgress(player, locationId) {
  const record = player?.exploration?.visited?.[locationId];
  return record ? normalizeRecord(record)?.dungeon : null;
}

export function updateDungeonProgress(player, locationId, patch = {}) {
  if (!player || !player.exploration?.visited?.[locationId] || !ID_RE.test(locationId)) return false;
  const current = getDungeonProgress(player, locationId);
  if (!current) return false;
  const next = { ...current };
  if (Number.isFinite(patch.floor)) next.floor = Math.max(1, Math.min(999, Math.floor(patch.floor)));
  if (patch.checkpoint === null || (typeof patch.checkpoint === 'string' && ID_RE.test(patch.checkpoint))) next.checkpoint = patch.checkpoint;
  if (typeof patch.bossDefeated === 'boolean') next.bossDefeated = patch.bossDefeated;
  if (typeof patch.chestId === 'string' && ID_RE.test(patch.chestId)) next.openedChests = cleanIdList([...next.openedChests, patch.chestId]);
  if (typeof patch.secretId === 'string' && ID_RE.test(patch.secretId)) next.secretsFound = cleanIdList([...next.secretsFound, patch.secretId]);
  player.exploration.visited[locationId].dungeon = next;
  return true;
}
