import { findTalentById, getClassTalents } from '../data/talents.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

export function getTalentBonus(player) {
  const bonus = {
    dmgMult: 1, healMult: 1, spellMult: 1, defMult: 1,
    critChance: 0, critMult: 1.5, lifesteal: 0,
    manaRegen: 0, hpRegen: 0, abilityCdDelta: 0,
    meteorMult: 1, prayerMult: 1, resurrectPct: 0.3
  };
  if (!player || !Array.isArray(player.talents)) return bonus;

  for (const id of player.talents) {
    const t = findTalentById(player.class, id);
    if (!t || !t.effects) continue;
    const e = t.effects;
    if (e.dmgMult)     bonus.dmgMult *= e.dmgMult;
    if (e.healMult)    bonus.healMult *= e.healMult;
    if (e.spellMult)   bonus.spellMult *= e.spellMult;
    if (e.defMult)     bonus.defMult *= e.defMult;
    if (e.critChance)  bonus.critChance += e.critChance;
    if (e.critMult)    bonus.critMult = Math.max(bonus.critMult, e.critMult);
    if (e.lifesteal)   bonus.lifesteal += e.lifesteal;
    if (e.manaRegen)   bonus.manaRegen += e.manaRegen;
    if (e.hpRegen)     bonus.hpRegen += e.hpRegen;
    if (e.abilityCdDelta) bonus.abilityCdDelta += e.abilityCdDelta;
    if (e.meteorMult)  bonus.meteorMult *= e.meteorMult;
    if (e.prayerMult)  bonus.prayerMult *= e.prayerMult;
    if (e.resurrectPct) bonus.resurrectPct = Math.max(bonus.resurrectPct, e.resurrectPct);
  }
  return bonus;
}

export function canTakeTalent(player, talent) {
  if (!player || !talent) return false;
  if (!Array.isArray(player.talents)) player.talents = [];
  if (player.talents.includes(talent.id)) return false;
  if ((player.level || 1) < talent.tier) return false;
  const tierTaken = player.talents.some(id => {
    const t = findTalentById(player.class, id);
    return t && t.tier === talent.tier;
  });
  if (tierTaken) return false;
  return true;
}

export function takeTalent(player, talentId) {
  const talent = findTalentById(player.class, talentId);
  if (!talent || !canTakeTalent(player, talent)) return false;

  if (!Array.isArray(player.talents)) player.talents = [];
  player.talents.push(talentId);

  const e = talent.effects || {};
  if (e.hpMult) {
    player.maxHp = Math.round(player.maxHp * e.hpMult);
    player.hp = Math.min(player.maxHp, Math.round(player.hp * e.hpMult));
  }
  if (e.mpMult) {
    player.maxMp = Math.round(player.maxMp * e.mpMult);
    player.mp = Math.min(player.maxMp, Math.round(player.mp * e.mpMult));
  }

  saveGame();
  emit('toast', `🌳 Талант: ${talent.name}`);
  emit('log', { channel: 'game', msg: `🌳 Выбран талант: «${talent.name}»`, cls: 'success' });
  return true;
}

export function getAvailableTalents(player) {
  if (!player) return [];
  const cls = getClassTalents(player.class);
  return cls.filter(t => canTakeTalent(player, t));
}

export function getTakenTalents(player) {
  if (!player || !Array.isArray(player.talents)) return [];
  return player.talents.map(id => findTalentById(player.class, id)).filter(Boolean);
}

export function getNextTierLevel(player) {
  if (!player) return null;
  const cls = getClassTalents(player.class);
  const tiers = [...new Set(cls.map(t => t.tier))].sort((a, b) => a - b);
  for (const tier of tiers) {
    const hasTaken = player.talents?.some(id => {
      const t = findTalentById(player.class, id);
      return t && t.tier === tier;
    });
    if (!hasTaken) return tier;
  }
  return null;
}