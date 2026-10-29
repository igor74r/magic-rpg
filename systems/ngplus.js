import { state } from './state.js';
import { CLASSES } from '../data/classes.js';
import { STORY } from '../data/story.js';
import { findTalentById } from '../data/talents.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

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
  if (!g) return;
  const p = g.player;
  const cls = CLASSES[p.class];
  const s = cls.baseStats;
  const newCycle = (p.ngPlus || 0) + 1;

  const carry = {
    inventory: p.inventory || [],
    equipped: p.equipped || { weapon: null, armor: null },
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
    mp: newMaxMp, maxMp: newMaxMp,
    str: s.str, int: s.int, wis: s.wis, con: s.con,
    statPoints: 0,
    spells: [...cls.startingSpells],
    cooldowns: {},
    effects: [],
    ngPlus: newCycle,
    ...carry
  });

  g.location = 'village';
  g.shards = { forest: false, ruins: false, shadow: false };
  g.quests = {};
  STORY.quests.forEach(q => g.quests[q.id] = false);

  saveGame();
  emit('toast', `🔄 NG+${newCycle}! Враги сильнее, награды больше.`);
  emit('log', { channel: 'game', msg: `🔄 NG+${newCycle}: сложность растёт, прогресс сохранён!`, cls: 'success' });
  emit('game:started', {});
}

export function getNGPlusMult() {
  const n = state.game?.player?.ngPlus || 0;
  return {
    hpMult: 1 + 0.5 * n,
    atkMult: 1 + 0.3 * n,
    goldMult: 1 + 0.3 * n,
    expMult: 1 + 0.3 * n
  };
}