import { WORLD_REGION_IDS } from '../data/world.js';

export function ensureRegionRecord(world, regionId, generationVisit = 1) {
  if (!world || !WORLD_REGION_IDS.includes(regionId)) return null;
  if (!world.regions || typeof world.regions !== 'object' || Array.isArray(world.regions)) world.regions = {};
  let record = world.regions[regionId];
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    record = world.regions[regionId] = {
      generationVisit: Math.max(1, Math.floor(Number(generationVisit) || 1)),
      openedChests: [],
      defeatedEnemies: {}
    };
  }
  if (!Number.isSafeInteger(record.generationVisit) || record.generationVisit < 1) {
    record.generationVisit = Math.max(1, Math.floor(Number(generationVisit) || 1));
  }
  if (!Array.isArray(record.openedChests)) record.openedChests = [];
  if (!record.defeatedEnemies || typeof record.defeatedEnemies !== 'object' || Array.isArray(record.defeatedEnemies)) record.defeatedEnemies = {};
  return record;
}

export function recordRegionChestOpened(world, regionId, chestId) {
  if (typeof chestId !== 'string' || !chestId) return false;
  const record = ensureRegionRecord(world, regionId);
  if (!record || record.openedChests.includes(chestId)) return false;
  record.openedChests.push(chestId);
  return true;
}

export function recordRegionEnemyDefeat(world, regionId, enemyId, respawnAtClock) {
  if (typeof enemyId !== 'string' || !enemyId || !Number.isFinite(respawnAtClock)) return false;
  const record = ensureRegionRecord(world, regionId);
  if (!record) return false;
  record.defeatedEnemies[enemyId] = Math.max(0, respawnAtClock);
  return true;
}

export function recordRegionEnemyRespawned(world, regionId, enemyId) {
  const record = ensureRegionRecord(world, regionId);
  if (!record || !Object.prototype.hasOwnProperty.call(record.defeatedEnemies, enemyId)) return false;
  delete record.defeatedEnemies[enemyId];
  return true;
}

export function applyRegionPersistence(world, regionId, enemies, chests, now = globalThis.performance?.now?.() ?? Date.now()) {
  const record = ensureRegionRecord(world, regionId);
  if (!record) return false;
  const clock = Math.max(0, Number(world.clockMinutes) || 0);
  const opened = new Set(record.openedChests);
  for (const chest of Array.isArray(chests) ? chests : []) chest.opened = opened.has(chest.id);
  for (const enemy of Array.isArray(enemies) ? enemies : []) {
    const respawnAtClock = record.defeatedEnemies[enemy.persistentId];
    if (!Number.isFinite(respawnAtClock)) continue;
    if (respawnAtClock <= clock) {
      delete record.defeatedEnemies[enemy.persistentId];
      continue;
    }
    enemy.dead = true;
    enemy.hp = 0;
    enemy.respawnAt = now + (respawnAtClock - clock) * 60000;
    enemy.effects = [];
  }
  return true;
}
