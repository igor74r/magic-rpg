import {
  DRAGON_SHARDS, RIFT_SHARD_SLOTS, RIFT_FACET_LEVEL_GATE,
  RIFT_INITIAL_FACET_COUNT, RIFT_LEVEL_GATED_FACET_COUNT,
  RIFT_FACET_COUNT, RIFT_MAX_LEVEL
} from '../data/rift-canon.js';

export function ensureRiftProgress(player) {
  if (!player) return null;
  if (!player.dragonDefeated || typeof player.dragonDefeated !== 'object' || Array.isArray(player.dragonDefeated)) player.dragonDefeated = {};
  if (!player.dragonShards || typeof player.dragonShards !== 'object' || Array.isArray(player.dragonShards)) player.dragonShards = {};
  for (const id of RIFT_SHARD_SLOTS) {
    player.dragonDefeated[id] = player.dragonDefeated[id] === true;
    player.dragonShards[id] = player.dragonShards[id] === true;
  }
  return player;
}

export function recordDragonVictory(player, dragonId) {
  if (!player) return false;
  const dragon = DRAGON_SHARDS.find(entry => entry.id === dragonId);
  if (!dragon || (player.level || 1) < dragon.requiredLevel) return false;
  ensureRiftProgress(player);
  player.dragonDefeated[dragon.shardId] = true;
  player.dragonShards[dragon.shardId] = true;
  return true;
}

export function hasAllDragonShards(player) {
  if (!player) return false;
  ensureRiftProgress(player);
  return RIFT_SHARD_SLOTS.every(id => player.dragonDefeated[id] && player.dragonShards[id]);
}

export function canOpenRift(player) {
  return hasAllDragonShards(player) && player.level <= RIFT_MAX_LEVEL;
}

export function getRiftFacetAccess(player, facetIndex) {
  if (!Number.isInteger(facetIndex) || facetIndex < 0 || facetIndex >= RIFT_FACET_COUNT) return false;
  if (facetIndex < RIFT_INITIAL_FACET_COUNT) return true;
  return (player?.level || 1) >= RIFT_FACET_LEVEL_GATE &&
    facetIndex < RIFT_INITIAL_FACET_COUNT + RIFT_LEVEL_GATED_FACET_COUNT;
}

export function getRiftFacetAccessCounts() {
  return { total: RIFT_FACET_COUNT, initiallyAvailable: RIFT_INITIAL_FACET_COUNT, levelGated: RIFT_LEVEL_GATED_FACET_COUNT };
}
