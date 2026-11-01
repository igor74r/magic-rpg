import { state } from './state.js';
import { CLASSES } from '../data/classes.js';
import { STORY } from '../data/story.js';
import { findTalentById } from '../data/talents.js';
import { saveGame } from './save.js';
import { emit } from './events.js';
import { canCompleteMainQuest } from './campaign.js';

function computeMaxHpFromTalents(baseHp, talents, classId) {
  let mult = 1;
  for (const id of talents || []) {
    const t = findTalentById(classId, id);
    if (t?.effects?.hpMult) mult *= t.effects.hpMult;
  }
  return Math.round(baseHp * mult);
}

function computeMaxMpFromTalents(baseMp, talents, classId) {
  let mult = 1;
  for (const id of talents || []) {
    const t = findTalentById(classId, id);
    if (t?.effects?.mpMult) mult *= t.effects.mpMult;
  }
  return Math.round(baseMp * mult);
}

export function startNGPlus() {
  const g = state.game;
  if (!g?.player) return false;
  const p = g.player;
  if (p.victoryAchieved !== true || !canCompleteMainQuest(g)) {
    emit('toast', 'Новая игра+ доступна после полного завершения основной кампании.');
    return false;
  }
  const cls = CLASSES[p.class];
  if (!cls?.baseStats) return false;
  const s = cls.baseStats;
  const newCycle = (p.ngPlus || 0) + 1;

  const carry = {
    inventory: p.inventory || [],
    equipped: p.equipped || { weapon: null, armor: null },
    craftingJobs: Array.isArray(p.craftingJobs) ? p.craftingJobs : [],
    gold: p.gold || 0,
    achievements: p.achievements || [],
    stats: p.stats || { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 },
    weaponLevel: p.weaponLevel || 0,
    armorLevel: p.armorLevel || 0,
    herbs: p.herbs || {},
    talents: p.talents || [],
    playtimeSec: p.playtimeSec || 0
  };

  const newMaxHp = computeMaxHpFromTalents(s.maxHp, carry.talents, p.class);
  const newMaxMp = computeMaxMpFromTalents(s.maxMp, carry.talents, p.class);

  Object.assign(p, {
    level: 1, exp: 0, expNext: 100,
    hp: newMaxHp, maxHp: newMaxHp,
    mp: p.class === 'warrior' ? 0 : newMaxMp, maxMp: newMaxMp,   // ⬅️ Воин — с 0 Ярости
    str: s.str, int: s.int, wis: s.wis, con: s.con, dex: s.dex || 10, luck: 5,
    statPoints: 0,
    craftedHighTierByAct: {},
    craftingJobs: [],
    buyback: [],
    campaignKills: {},
    campaignClaimed: {},
    campaignShards: {},
    storyShards: { flame: false, ice: false, blood: false },
    storyDragons: { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false },
    activeCampaignMission: null,
    spells: [...cls.startingSpells],
    cooldowns: {},
    effects: [],
    buffs: [],
    ngPlus: newCycle,
    victoryAchieved: false,
    ...carry
  });

  g.location = 'village';
  g.storyDragons = { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false };
  g.storyShards = { flame: false, ice: false, blood: false };
  g.riftEnding = null;
  g.riftOpeningSeen = false;
  g.riftOpenedAt = null;
  g.player.riftClearedLocations = [];
  g.player.craftedHighTierByAct = {};
  g.player.craftingJobs = [];
  g.shards = { forest: false, ruins: false, shadow: false };
  g.quests = {};
  STORY.quests.forEach(q => g.quests[q.id] = false);

  saveGame();
  emit('toast', `🔄 NG+${newCycle}! Враги сильнее, награды больше.`);
  emit('log', { channel: 'game', msg: `🔄 NG+${newCycle}: сложность растёт, прогресс сохранён!`, cls: 'success' });
  emit('game:started', {});
  return true;
}

// ⬇️ ВОЗВРАЩЁН: используется в spawn.js и combat.js
export function getNGPlusMult() {
  const n = state.game?.player?.ngPlus || 0;
  return {
    hpMult: 1 + 0.5 * n,
    atkMult: 1 + 0.3 * n,
    goldMult: 1 + 0.3 * n,
    expMult: 1 + 0.3 * n
  };
}