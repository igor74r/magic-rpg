// Canonical story dragons for Shards of the Rift.
// This module is intentionally independent of story prose so combat and Rift gating
// can share stable IDs without depending on location-based legacy shard metadata.
export const STORY_DRAGONS = Object.freeze({
  ashHerald: Object.freeze({
    id: 'ash-herald',
    enemyId: 'flame-lord',
    act: 3,
    missionId: 'a3-m5',
    shardId: 'flame',
    shardItemId: 'shard-flame'
  }),
  iceGrasp: Object.freeze({
    id: 'ice-grasp',
    enemyId: 'ice-queen',
    act: 4,
    missionId: 'a4-m5',
    shardId: 'ice',
    shardItemId: 'shard-ice'
  }),
  bloodCrown: Object.freeze({
    id: 'blood-crown',
    enemyId: 'ancient-dragon',
    act: 5,
    missionId: 'a5-m5',
    shardId: 'blood',
    shardItemId: 'shard-blood'
  })
});

export const STORY_DRAGON_BY_ENEMY = Object.freeze(
  Object.fromEntries(
    Object.values(STORY_DRAGONS).map(dragon => [dragon.enemyId, dragon])
  )
);

export function ensureStoryDragonState(game) {
  if (!game || typeof game !== 'object') return null;
  if (!game.storyDragons || typeof game.storyDragons !== 'object' || Array.isArray(game.storyDragons)) {
    game.storyDragons = {};
  }
  for (const dragon of Object.values(STORY_DRAGONS)) {
    if (game.storyDragons[dragon.id] !== true) game.storyDragons[dragon.id] = false;
  }
  return game.storyDragons;
}

export function isStoryDragonDefeated(game, dragonId) {
  return ensureStoryDragonState(game)?.[dragonId] === true;
}

export function recordStoryDragonDefeat(game, enemyId) {
  const dragon = STORY_DRAGON_BY_ENEMY[enemyId];
  if (!dragon || !game) return null;
  // Story flags and guaranteed shards are awarded only for the accepted finale mission.
  if (game.player?.activeCampaignMission !== dragon.missionId) return null;
  const flags = ensureStoryDragonState(game);
  if (flags[dragon.id]) return { dragon, newlyDefeated: false };
  flags[dragon.id] = true;
  return { dragon, newlyDefeated: true };
}

export function claimStoryDragonReward(game, enemyId) {
  const defeat = recordStoryDragonDefeat(game, enemyId);
  if (!defeat?.newlyDefeated) return defeat;
  const { shardId, shardItemId } = defeat.dragon;
  if (!game.storyShards || typeof game.storyShards !== 'object' || Array.isArray(game.storyShards)) {
    game.storyShards = {};
  }
  game.storyShards[shardId] = true;
  return { ...defeat, shardItemId };
}

export function isRiftUnlockedByStory(game) {
  return isStoryDragonDefeated(game, STORY_DRAGONS.bloodCrown.id);
}
