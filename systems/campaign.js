import { STORY } from '../data/story.js';

function ensureCampaignState(player) {
  if (!player) return;
  if (!player.campaignKills || typeof player.campaignKills !== 'object' || Array.isArray(player.campaignKills)) player.campaignKills = {};
  if (!player.campaignClaimed || typeof player.campaignClaimed !== 'object' || Array.isArray(player.campaignClaimed)) player.campaignClaimed = {};
  if (typeof player.activeCampaignMission !== 'string') player.activeCampaignMission = null;
}

export function getCampaignMission(missionId) {
  for (let actIndex = 0; actIndex < STORY.acts.length; actIndex++) {
    const act = STORY.acts[actIndex];
    for (let missionIndex = 0; missionIndex < act.missions.length; missionIndex++) {
      const mission = act.missions[missionIndex];
      if (mission.id === missionId) return { act, mission, actIndex, missionIndex };
    }
  }
  return null;
}

export function getMissionProgress(player, mission) {
  ensureCampaignState(player);
  const rawKills = Number(player?.campaignKills?.[mission.id] || 0);
  const kills = Number.isFinite(rawKills) ? Math.max(0, Math.floor(rawKills)) : 0;
  const required = Math.max(1, Math.floor(Number(mission.count) || 1));
  const claimed = player?.campaignClaimed?.[mission.id] === true;
  return {
    kills,
    current: Math.min(kills, required),
    required,
    shardRequired: mission.shardId || null,
    shardFound: mission.shardId ? player?.campaignShards?.[mission.shardId] === true : true,
    complete: kills >= required && (!mission.shardId || player?.campaignShards?.[mission.shardId] === true),
    claimed,
    active: player?.activeCampaignMission === mission.id
  };
}

export function getActiveCampaignMission(player) {
  ensureCampaignState(player);
  if (!player?.activeCampaignMission) return null;
  const found = getCampaignMission(player.activeCampaignMission);
  if (!found || player.campaignClaimed[found.mission.id]) {
    player.activeCampaignMission = null;
    return null;
  }
  return found;
}

export function getNextCampaignMission(player) {
  ensureCampaignState(player);
  const active = getActiveCampaignMission(player);
  if (active) return active;

  for (let actIndex = 0; actIndex < STORY.acts.length; actIndex++) {
    const act = STORY.acts[actIndex];
    for (let missionIndex = 0; missionIndex < act.missions.length; missionIndex++) {
      const mission = act.missions[missionIndex];
      if (!player.campaignClaimed[mission.id]) return { act, mission, actIndex, missionIndex };
    }
  }
  return null;
}

export function acceptCampaignMission(player, missionId = null) {
  if (!player) return false;
  ensureCampaignState(player);
  const active = getActiveCampaignMission(player);
  if (active) return !missionId || active.mission.id === missionId;

  const next = getNextCampaignMission(player);
  if (!next || (missionId && next.mission.id !== missionId)) return false;
  player.activeCampaignMission = next.mission.id;
  return true;
}

export function recordCampaignShard(player, shardId) {
  if (!player || !['forest', 'ruins', 'shadow'].includes(shardId)) return false;
  ensureCampaignState(player);
  if (!player.campaignShards || typeof player.campaignShards !== 'object') player.campaignShards = {};
  player.campaignShards[shardId] = true;
  return true;
}

export function recordCampaignKill(player, locationId, enemyId) {
  if (!player || !locationId || !enemyId) return [];
  ensureCampaignState(player);
  const active = getActiveCampaignMission(player);
  if (!active || (active.mission.locationId || active.act.locationId) !== locationId || active.mission.enemyId !== enemyId) return [];

  const mission = active.mission;
  const progress = getMissionProgress(player, mission);
  if (progress.complete) return [];

  player.campaignKills[mission.id] = Math.min(
    progress.required,
    progress.kills + 1
  );
  return [mission.id];
}

export function claimCampaignMission(player) {
  const active = getActiveCampaignMission(player);
  if (!active) return null;
  if (!getMissionProgress(player, active.mission).complete) return null;

  player.campaignClaimed[active.mission.id] = true;
  player.activeCampaignMission = null;
  return active;
}

export function getMissionReward(mission) {
  const match = /^a(\d+)-m(\d+)$/.exec(mission?.id || '');
  const act = match ? Number(match[1]) : 1;
  const stage = match ? Number(match[2]) : 1;
  const materials = ['root-fiber', 'grave-salt', 'ember-core', 'frost-essence', 'void-dust'];
  // Campaign-based rewards discourage low-act farming and keep progression predictable.
  const actIndex = Math.max(0, Math.min(4, act - 1));
  const actGold = [18, 32, 50, 72, 100][actIndex];
  const actExp = [70, 145, 250, 390, 570][actIndex];
  const missionBonus = stage >= 4 ? 1.2 : 1;
  return {
    gold: Math.round((actGold + (stage - 1) * 5) * missionBonus),
    exp: actExp + (stage - 1) * Math.round(actExp * 0.12),
    itemId: materials[actIndex]
  };
}

export function isMissionComplete(player, mission) {
  ensureCampaignState(player);
  return player?.campaignClaimed?.[mission.id] === true;
}

export function getCampaignProgress(player) {
  ensureCampaignState(player);
  let total = 0;
  let completed = 0;
  for (const act of STORY.acts) {
    for (const mission of act.missions) {
      total++;
      if (isMissionComplete(player, mission)) completed++;
    }
  }
  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    complete: total > 0 && completed === total
  };
}

export function isCampaignComplete(player) {
  return getCampaignProgress(player).complete;
}

export function canCompleteMainQuest(game) {
  const shards = game?.shards;
  const allShardsFound =
    shards?.forest === true &&
    shards?.ruins === true &&
    shards?.shadow === true;
  return Boolean(allShardsFound && isCampaignComplete(game?.player));
}
