const MAX_VISITED = 64;

export function normalizeExploration(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const visited = source.visited && typeof source.visited === 'object' && !Array.isArray(source.visited)
    ? source.visited : {};
  const clean = {};
  for (const [id, record] of Object.entries(visited).slice(-MAX_VISITED)) {
    if (!/^[a-z0-9-]{1,48}$/i.test(id) || !record || typeof record !== 'object') continue;
    clean[id] = {
      visits: Math.max(1, Math.min(999999, Math.floor(Number(record.visits) || 1))),
      firstVisitedAt: Math.max(0, Number(record.firstVisitedAt) || 0),
      lastVisitedAt: Math.max(0, Number(record.lastVisitedAt) || 0),
      cleared: record.cleared === true
    };
  }
  return { visited: clean, lastLocationId: typeof source.lastLocationId === 'string' ? source.lastLocationId : null };
}

export function recordLocationVisit(player, locationId, now = Date.now()) {
  if (!player || typeof locationId !== 'string' || !/^[a-z0-9-]{1,48}$/i.test(locationId)) return false;
  const exploration = normalizeExploration(player.exploration);
  const previous = exploration.visited[locationId];
  exploration.visited[locationId] = {
    visits: Math.min(999999, (previous?.visits || 0) + 1),
    firstVisitedAt: previous?.firstVisitedAt || now,
    lastVisitedAt: now,
    cleared: previous?.cleared === true
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
  if (!player || !player.exploration?.visited?.[locationId]) return false;
  player.exploration.visited[locationId].cleared = true;
  return true;
}
