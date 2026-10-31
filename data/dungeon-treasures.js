import { STORY } from './story.js';
import { LOCATIONS } from './locations.js';
import { ENEMIES } from './enemies.js';
import { ITEMS } from './items.js';

export const ACT_RELIC_REWARDS = {
  'briar-hollow': { actId: 'act-1', bossId: 'elder-treant', itemId: 'relic-root-memory' },
  'sunken-necropolis': { actId: 'act-2', bossId: 'bone-tyrant', itemId: 'relic-last-archive' },
  'obsidian-fields': { actId: 'act-3', bossId: 'flame-lord', itemId: 'relic-ember-oath' },
  'frost-citadel': { actId: 'act-4', bossId: 'ice-queen', itemId: 'relic-frost-crown' },
  'dragon-lair': { actId: 'act-5', bossId: 'ancient-dragon', itemId: 'relic-void-star' }
};

const CHEST_RARITY_WEIGHTS = {
  1: [['common', 65], ['rare', 29], ['epic', 6]],
  2: [['common', 48], ['rare', 38], ['epic', 12], ['legendary', 2]],
  3: [['common', 32], ['rare', 42], ['epic', 21], ['legendary', 5]],
  4: [['common', 22], ['rare', 38], ['epic', 30], ['legendary', 10]],
  5: [['common', 12], ['rare', 30], ['epic', 38], ['legendary', 20]]
};

function sampleValue(random) {
  const value = typeof random === 'function' ? random() : Math.random();
  return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : Math.random();
}

export function getActNumberForLocation(locationId) {
  const act = STORY.acts.find(entry =>
    entry.locationId === locationId ||
    entry.missions.some(mission => (mission.locationId || entry.locationId) === locationId)
  );
  return act ? Math.max(1, Math.min(5, Number(act.number) || 1)) : 1;
}

export function getDungeonChestType(locationId, floor = 1, index = 0, total = 1) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const safeTotal = Math.max(0, Math.floor(Number(total) || 0));
  if (safeIndex === 0 || safeTotal < 2) return 'wooden';
  if (safeIndex === 1) return 'locked';
  const source = `${locationId || 'unknown'}:f${Math.max(1, Math.floor(Number(floor) || 1))}:c${safeIndex}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619) >>> 0;
  const roll = hash % 100;
  if (roll < 16) return 'cursed';
  if (roll < 29) return 'mimic';
  if (roll < 48) return 'ancient';
  return 'wooden';
}

export function prepareChestKeyAccess(chests, hasKey = false) {
  if (!Array.isArray(chests)) return -1;
  // Rebuild access flags from current inventory and unopened chests. This
  // prevents stale key caches/free-picks from duplicating after re-entry.
  for (const chest of chests) {
    if (!chest) continue;
    delete chest.keyCache;
    delete chest.freePick;
  }
  const locked = chests.filter(chest => chest && chest.type === 'locked' && !chest.opened);
  if (!locked.length || hasKey) return -1;
  const cacheIndex = chests.findIndex(chest => chest && !chest.opened && chest.type !== 'locked');
  if (cacheIndex >= 0) {
    chests[cacheIndex].keyCache = true;
    return cacheIndex;
  }
  locked[0].freePick = true;
  return chests.indexOf(locked[0]);
}

export function rollDungeonChestLoot(locationId, random = Math.random) {
  const location = LOCATIONS[locationId];
  const actNumber = getActNumberForLocation(locationId);
  const regionalDrops = [...new Set((location?.enemies || [])
    .flatMap(enemyId => ENEMIES[enemyId]?.drops || [])
    .filter(itemId => !!ITEMS[itemId]))];
  const pool = regionalDrops.length ? regionalDrops : ['health-potion', 'mana-potion'];
  const itemId = pool[Math.floor(sampleValue(random) * pool.length)];
  const rarityRoll = sampleValue(random) * 100;
  let rarity = 'common';
  let cumulative = 0;
  for (const [name, weight] of CHEST_RARITY_WEIGHTS[actNumber]) {
    cumulative += weight;
    if (rarityRoll < cumulative) {
      rarity = name;
      break;
    }
  }
  return { itemId, rarity, actNumber };
}
