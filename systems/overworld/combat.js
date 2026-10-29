import { state } from '../state.js';
import { ENEMIES } from '../../data/enemies.js';
import { ITEMS, RARITIES } from '../../data/items.js';
import { SPELLS } from '../../data/spells.js';
import { CLASSES } from '../../data/classes.js';
import { LOCATIONS } from '../../data/locations.js';
import { getEffStats } from '../stats.js';
import { addItem, removeItem } from '../inventory.js';
import { addExp } from '../progression.js';
import { checkAchievements } from '../achievements.js';
import { applyEffect, tickEffects, getAtkMult, getDefMult, getLifesteal, isStunned, clearDebuffs } from '../status.js';
import { emit } from '../events.js';
import { saveGame } from '../save.js';
import { playSound } from '../audio.js';
import { getNGPlusMult } from '../ngplus.js';
import { getTalentBonus } from '../talents.js';
import { getRiftMult } from '../rift.js';
import { updateQuestProgress } from '../dailyQuests.js';
import { pushLog } from './log.js';
import { spawnParticles } from './particles.js';
import { MODIFIERS, ELITE_ATK_MULT, getDropChance, getRespawnMs } from './spawn.js';

const HERB_DROP_CHANCE = 0.30;
const HERB_DROP_CHANCE_ELITE = 0.70;
const LEGENDARY_DROP_CHANCE = 0.01;

export function triggerShake(mag, dur = 0.25) {
  const ow = state.overworld;
  if (!ow) return;
  ow.shake = { t: dur, mag };
}

export function clearPlayerEffects() {
  const p = state.game?.player;
  if (!p) return;
  p.effects = [];
  p.cooldowns = {};
}

function enemyDisplayName(e) {
  const def = ENEMIES[e.enemyId];
  if (e.boss) return `☠ ${def.name}`;
  if (e.elite) return `★ ${def.name}`;
  if (e.modifier) {
    const m = MODIFIERS[e.modifier];
    return `${m.prefix} ${m.name} ${def.name}`;
  }
  return def.name;
}

function enemyDefValue(e) {
  const base = ENEMIES[e.enemyId].defense;
  const mult = e.modifier ? MODIFIERS[e.modifier].defMult : 1;
  return Math.floor(base * mult);
}

export function enterCombat(enemy) {
  const ow = state.overworld;
  enemy.state = 'combat';
  ow.combat = { enemy, turn: 'player', over: false, turnCount: 0, blocking: false, playerChargeNext: false, playerResurrectionUsed: false };
  pushLog(`⚔️ Бой: ${enemyDisplayName(enemy)}`, 'info');
  emit('combat:start');
}

function checkBossPhase(e) {
  if (!e.boss || !ENEMIES[e.enemyId].phases) return;
  const phases = ENEMIES[e.enemyId].phases;
  for (let i = e.phase || 0; i < phases.length; i++) {
    const ph = phases[i];
    if (e.hp / e.maxHp <= ph.atHp) {
      e.phase = i + 1;
      pushLog(`⚠️ ${ph.msg}`, 'damage');
      playSound('cast');
      triggerShake(10, 0.4);
    }
  }
}

export function combatAttack() {
  const ow = state.overworld;
  if (!ow || !ow.combat || ow.combat.turn !== 'player') return;
  const e = ow.combat.enemy;
  const p = state.game.player;
  const st = getEffStats();
  const atkMult = getAtkMult(p);
  let dmg = Math.max(1, Math.floor((st.atk + Math.floor(Math.random() * 5) - Math.floor(enemyDefValue(e) / 2)) * atkMult));
  const isCrit = Math.random() < 0.1;
  if (isCrit) {
    dmg = Math.floor(dmg * 1.5);
    triggerShake(8, 0.3);
    spawnParticles(e.x, e.y, 'spark', 10);
  }
  if (ow.combat.playerChargeNext) {
    dmg = Math.floor(dmg * 2);
    ow.combat.playerChargeNext = false;
    pushLog('⚡ Рывок: двойной урон!', 'damage');
    spawnParticles(e.x, e.y, 'spark', 8);
  }
  const ls = getLifesteal(p);
  if (ls > 0 && dmg > 0) {
    const heal = Math.floor(dmg * ls);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    ow.player.hp = p.hp;
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '+' + heal, type: 'heal', life: 1.2 });
    pushLog(`🩸 Кровожадность: +${heal} HP`, 'heal');
  }
  e.hp -= dmg;
  ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: (isCrit ? '!' : '-') + dmg, type: isCrit ? 'crit' : 'damage', life: 1.2 });
  pushLog(`Вы нанесли ${dmg} урона (${enemyDisplayName(e)})${isCrit ? ' КРИТ!' : ''}`, 'damage');
  
  // ⚔️ ВОИН: Генерация Ярости от удара
  if (p.class === 'warrior') {
    p.mp = Math.min(p.maxMp, p.mp + 15);
    ow.player.mp = p.mp;
    pushLog(`🔥 Ярость: +15 (${p.mp}/${p.maxMp})`, 'info');
  }

  playSound(isCrit ? 'crit' : 'hit');
  if (e.hp <= 0) { e.hp = 0; return combatVictory(); }
  checkBossPhase(e);
  tickEnemyEffects();
  if (ow.combat && e.hp <= 0) { e.hp = 0; return combatVictory(); }
  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatCastSpell(spellId) {
  const ow = state.overworld;
  if (!ow || !ow.combat || ow.combat.turn !== 'player') return;
  
  const p = state.game.player;
  const sp = SPELLS[spellId];
  if (!sp) return;

  // Воины не умеют колдовать!
  if (p.class === 'warrior') { pushLog('Воин не умеет колдовать!', 'info'); return; }

  // ✨ ЖРЕЦ: Спец-заклинание «Жертва»
  if (spellId === 'sacrifice') {
    const hpCost = Math.ceil(p.maxHp * sp.selfDamagePct);
    if (p.hp <= hpCost) { pushLog('Недостаточно HP для Жертвы!', 'info'); return; }
    p.hp -= hpCost;
    p.mp = Math.min(p.maxMp, p.mp + sp.restoreMp);
    ow.player.hp = p.hp;
    ow.player.mp = p.mp;
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '-' + hpCost, type: 'damage', life: 1.2 });
    ow.floatingNumbers.push({ x: ow.player.x + 15, y: ow.player.y - 30, text: '+' + sp.restoreMp + ' MP', type: 'heal', life: 1.2 });
    pushLog(`🩸 Жертва: потрачено ${hpCost} HP, восстановлено ${sp.restoreMp} MP`, 'heal');
    playSound('heal');
    ow.combat.turn = 'enemy';
    setTimeout(enemyCombatTurn, 700);
    return;
  }

  const freeMana = p.effects?.some(ef => ef.id === 'manaShield');
  if (!freeMana && p.mp < sp.cost) { pushLog('Мало маны', 'info'); return; }
  if (!freeMana) { p.mp -= sp.cost; ow.player.mp = p.mp; }
  else { pushLog('💧 Эликсир маны: мана не тратится', 'success'); }
  
  const st = getEffStats();
  const e = ow.combat.enemy;
  if (sp.damage) {
    const dmg = Math.max(1, sp.damage + Math.floor(st.mag / 2) - Math.floor(enemyDefValue(e) / 2));
    e.hp -= dmg;
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '-' + dmg, type: 'damage', life: 1.2 });
    pushLog(`${sp.name}: нанесено ${dmg} урона`, 'damage');
    playSound('cast');
    spawnParticles(e.x, e.y, 'spark', 5);
    if (e.hp <= 0) { e.hp = 0; return combatVictory(); }
    checkBossPhase(e);
  } else if (sp.heal) {
    const h = sp.heal + Math.floor(st.mag / 2);
    p.hp = Math.min(p.maxHp, p.hp + h);
    ow.player.hp = p.hp;
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '+' + h, type: 'heal', life: 1.2 });
    pushLog(`${sp.name}: восстановлено ${h} HP`, 'heal');
    playSound('heal');
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 6);
  }
  if (sp.effect) { applyEffect(e, sp.effect); pushLog(`☠️ Наложен эффект: ${sp.effect}`, 'damage'); }
  if (sp.selfEffect) { applyEffect(p, sp.selfEffect); pushLog(`🛡️ Эффект на вас: ${sp.selfEffect}`, 'success'); }

  tickEnemyEffects();
  if (ow.combat && e.hp <= 0) { e.hp = 0; return combatVictory(); }
  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatUseAbility(abilityId) {
  const ow = state.overworld;
  if (!ow || !ow.combat || ow.combat.turn !== 'player') return;
  const p = state.game.player;
  const cls = CLASSES[p.class];
  const ability = cls.abilities?.find(a => a.id === abilityId);
  if (!ability || ability.passive) return;
  const cd = p.cooldowns?.[abilityId] || 0;
  if (cd > 0) { pushLog(`${ability.name}: перезарядка (${cd})`, 'info'); return; }
  
  if (p.mp < (ability.cost || 0)) { 
    pushLog(p.class === 'warrior' ? 'Недостаточно Ярости!' : 'Мало маны', 'info'); 
    return; 
  }

  if (ability.cost) p.mp -= ability.cost;
  ow.player.mp = p.mp;
  if (!p.cooldowns) p.cooldowns = {};
  p.cooldowns[abilityId] = ability.cooldown;

  const e = ow.combat.enemy;
  const st = getEffStats();

  if (abilityId === 'charge') {
    ow.combat.playerChargeNext = true;
    pushLog('⚡ Рывок: следующая атака ×2', 'damage');
  } else if (abilityId === 'war-cry') {
    applyEffect(p, 'atkBuff');
    pushLog('📢 Боевой клич: +30% атаки (2 хода)', 'success');
  } else if (abilityId === 'bloodthirst') {
    applyEffect(p, 'lifesteal');
    pushLog('🩸 Кровожадность: вампиризм 50% (2 хода)', 'success');
  } else if (abilityId === 'mana-shield') {
    applyEffect(p, 'defBuff');
    pushLog('🛡️ Щит маны: +50% защиты (2 хода)', 'success');
  } else if (abilityId === 'teleport') {
    pushLog('💨 Телепорт: враг пропускает ход', 'success');
    playSound('cast');
    ow.combat.turn = 'enemy';
    setTimeout(() => {
      const ow2 = state.overworld;
      if (!ow2 || !ow2.combat) return;
      pushLog('💨 Враг дезориентирован и пропускает ход', 'info');
      tickEnemyEffects();
      const ow3 = state.overworld;
      if (!ow3 || !ow3.combat) return;
      if (ow3.combat.enemy.hp <= 0) { ow3.combat.enemy.hp = 0; return combatVictory(); }
      tickPlayerEffects();
      const ow4 = state.overworld;
      if (!ow4 || !ow4.combat) return;
      decreaseCooldowns();
      ow4.combat.turn = 'player';
      ow4.combat.turnCount = (ow4.combat.turnCount || 0) + 1;
    }, 500);
    return;
  } else if (abilityId === 'meteor') {
    const dmg = 60 + Math.floor(st.mag / 2);
    e.hp -= dmg;
    applyEffect(e, 'burn');
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '-' + dmg, type: 'crit', life: 1.4 });
    pushLog(`☄️ Метеор: ${dmg} урона + ожог`, 'damage');
    playSound('cast');
    triggerShake(10, 0.4);
    spawnParticles(e.x, e.y, 'spark', 15);
    if (e.hp <= 0) { e.hp = 0; return combatVictory(); }
    checkBossPhase(e);
  } else if (abilityId === 'prayer') {
    const h = 50 + Math.floor(st.mag / 2);
    p.hp = Math.min(p.maxHp, p.hp + h);
    ow.player.hp = p.hp;
    clearDebuffs(p);
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '+' + h, type: 'heal', life: 1.4 });
    pushLog(`🙏 Молитва: +${h} HP, дебаффы сняты`, 'heal');
    playSound('heal');
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 8);
  } else if (abilityId === 'sanctify') {
    const dmg = 25 + Math.floor(st.mag / 2);
    e.hp -= dmg;
    applyEffect(e, 'burn');
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '-' + dmg, type: 'damage', life: 1.2 });
    pushLog(`☀️ Освящение: ${dmg} урона + ожог`, 'damage');
    playSound('cast');
    spawnParticles(e.x, e.y, 'spark', 6);
    if (e.hp <= 0) { e.hp = 0; return combatVictory(); }
    checkBossPhase(e);
  }

  tickEnemyEffects();
  if (ow.combat && e.hp <= 0) { e.hp = 0; return combatVictory(); }
  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatUseItem(itemId) {
  const ow = state.overworld;
  if (!ow || !ow.combat || ow.combat.turn !== 'player') return;
  const item = ITEMS[itemId];
  if (!item || item.type !== 'consumable') return;
  const before = { hp: state.game.player.hp, mp: state.game.player.mp };
  item.use(state.game.player);
  
  if (item.effect === 'antidote') {
    clearDebuffs(state.game.player);
    pushLog('🧪 Антидот: дебаффы сняты', 'heal');
  } else if (item.effect) {
    applyEffect(state.game.player, item.effect);
    pushLog(`✨ Эффект: ${item.name}`, 'success');
  }

  const healed = state.game.player.hp - before.hp;
  const mana = state.game.player.mp - before.mp;
  ow.player.hp = state.game.player.hp;
  ow.player.mp = state.game.player.mp;
  if (healed > 0) {
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '+' + healed, type: 'heal', life: 1.2 });
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 5);
    pushLog(`Вы восстановили ${healed} HP`, 'heal');
  } else if (mana > 0) {
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '+' + mana, type: 'heal', life: 1.2 });
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 5);
    pushLog(`Вы восстановили ${mana} MP`, 'heal');
  }
  
  removeItem(itemId);
  playSound('heal');
  tickEnemyEffects();
  if (ow.combat && ow.combat.enemy.hp <= 0) { ow.combat.enemy.hp = 0; return combatVictory(); }
  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatBlock() {
  const ow = state.overworld;
  if (!ow || !ow.combat || ow.combat.turn !== 'player') return;
  ow.combat.blocking = true;
  pushLog('🛡️ Вы встали в блок (урон ×0.5)', 'info');
  tickEnemyEffects();
  if (ow.combat && ow.combat.enemy.hp <= 0) { ow.combat.enemy.hp = 0; return combatVictory(); }
  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 500);
}

export function combatFlee(forced = false) {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;
  if (!forced && Math.random() >= 0.6) {
    pushLog('Побег не удался!', 'info');
    ow.combat.turn = 'enemy';
    setTimeout(enemyCombatTurn, 700);
    return;
  }
  pushLog('Вы сбежали', 'info');
  clearPlayerEffects();
  endCombat();
}

function tickEnemyEffects() {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;
  const e = ow.combat.enemy;
  const res = tickEffects(e);
  if (res.totalDamage > 0) {
    e.hp -= res.totalDamage;
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '-' + res.totalDamage, type: 'damage', life: 1.2 });
    const parts = res.messages.map(m => `${m.icon} ${m.name} ${m.damage}`).join(', ');
    pushLog(`Эффекты на враге: ${parts}`, 'damage');
  }
}

function tickPlayerEffects() {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;
  const p = state.game.player;
  const res = tickEffects(p);
  if (res.totalDamage > 0) {
    p.hp -= res.totalDamage;
    ow.player.hp = Math.max(0, p.hp);
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '-' + res.totalDamage, type: 'damage', life: 1.2 });
    const parts = res.messages.map(m => `${m.icon} ${m.name} ${m.damage}`).join(', ');
    pushLog(`Эффекты на вас: ${parts}`, 'damage');
    playSound('hurt');
  }
  if (p.hp <= 0) { p.hp = 0; combatDefeat(); }
}

function decreaseCooldowns() {
  const p = state.game.player;
  if (!p.cooldowns) return;
  for (const k in p.cooldowns) {
    if (p.cooldowns[k] > 0) p.cooldowns[k] -= 1;
  }
}

function enemyCombatTurn() {
  const ow = state.overworld;
  if (!ow || !ow.combat || ow.combat.turn !== 'enemy') return;
  const e = ow.combat.enemy;
  const def = ENEMIES[e.enemyId];
  const st = getEffStats();
  const p = state.game.player;
  const name = enemyDisplayName(e);

  if (e.modifier === 'regenerating' && e.hp < e.maxHp) {
    e.hp = Math.min(e.maxHp, e.hp + (MODIFIERS.regenerating.regenPerTurn || 5));
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '+' + MODIFIERS.regenerating.regenPerTurn, type: 'heal', life: 1.0 });
  }

  if (isStunned(e)) {
    pushLog(`💫 ${name} оглушён, пропускает ход`, 'info');
    tickEnemyEffects();
    if (ow.combat && e.hp <= 0) { e.hp = 0; return combatVictory(); }
    tickPlayerEffects();
    if (!ow.combat) return;
    decreaseCooldowns();
    ow.combat.turn = 'player';
    ow.combat.turnCount = (ow.combat.turnCount || 0) + 1;
    ow.combat.blocking = false;
    return;
  }

  const diff = state.settings.difficulty === 'easy' ? 0.7 : state.settings.difficulty === 'hard' ? 1.4 : 1.0;
  const modAtk = e.modifier ? MODIFIERS[e.modifier].atkMult : 1;
  const phaseAtk = (e.phase > 0 && def.phases) ? (def.phases[e.phase - 1]?.atkMult || 1) : 1;
  const ng = getNGPlusMult();
  const riftM = ow.rifMode ? getRiftMult(ow.rifFloor) : { atkMult: 1 };
  const atk = def.attack * (e.elite ? ELITE_ATK_MULT : 1) * modAtk * phaseAtk * ng.atkMult * riftM.atkMult;
  let baseDmg = Math.max(1, Math.floor((atk + Math.floor(Math.random() * 5) - st.def) * diff));

  if (ow.combat.blocking) baseDmg = Math.max(1, Math.floor(baseDmg * 0.5));

  const defMult = getDefMult(p);
  if (defMult > 1) baseDmg = Math.max(1, Math.floor(baseDmg / defMult));

  ow.combat.turnCount = (ow.combat.turnCount || 0) + 1;
  const sp = def.special;
  const specialEvery = (e.phase > 0 && def.phases) ? (def.phases[e.phase - 1]?.specialEvery || sp?.every) : sp?.every;
  const useSpecial = sp && specialEvery && ow.combat.turnCount % specialEvery === 0;

  if (useSpecial && sp.type === 'double') {
    const d1 = Math.max(1, Math.floor(baseDmg * 0.6));
    const d2 = Math.max(1, Math.floor(baseDmg * 0.6));
    p.hp -= d1 + d2;
    ow.player.hp = Math.max(0, p.hp);
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '-' + d1, type: 'damage', life: 1.2 });
    ow.floatingNumbers.push({ x: ow.player.x + 12, y: ow.player.y - 30, text: '-' + d2, type: 'damage', life: 1.2 });
    pushLog(`${name} использовал ${sp.name} и нанёс вам ${d1}+${d2} урона`, 'damage');
    if (sp.effect) {
      applyEffect(p, sp.effect);
      pushLog(`☠️ Наложен эффект: ${sp.effect}`, 'damage');
    }
  } else if (useSpecial && sp.type === 'snipe') {
    const mult = sp.mult || 2;
    const dmg = Math.max(1, Math.floor(baseDmg * mult));
    p.hp -= dmg;
    ow.player.hp = Math.max(0, p.hp);
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '-' + dmg, type: 'crit', life: 1.4 });
    pushLog(`${name} использовал ${sp.name} и нанёс вам ${dmg} урона`, 'damage');
    if (sp.effect) {
      applyEffect(p, sp.effect);
      pushLog(`☠️ Наложен эффект: ${sp.effect}`, 'damage');
    }
  } else if (useSpecial && sp.type === 'drain') {
    const dmg = baseDmg;
    p.hp -= dmg;
    ow.player.hp = Math.max(0, p.hp);
    e.hp = Math.min(e.maxHp, e.hp + dmg);
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '-' + dmg, type: 'damage', life: 1.2 });
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '+' + dmg, type: 'heal', life: 1.2 });
    pushLog(`${name} использовал ${sp.name} (${dmg} урона) и восстановил ${dmg} HP`, 'damage');
    if (sp.effect) {
      applyEffect(p, sp.effect);
      pushLog(`☠️ Наложен эффект: ${sp.effect}`, 'damage');
    }
  } else {
    p.hp -= baseDmg;
    ow.player.hp = Math.max(0, p.hp);
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '-' + baseDmg, type: 'damage', life: 1.2 });
    pushLog(`${name} нанёс вам ${baseDmg} урона`, 'damage');
  }

  if (e.modifier === 'vampiric' && baseDmg > 0) {
    const heal = Math.floor(baseDmg * (MODIFIERS.vampiric.vampiricPct || 0.3));
    e.hp = Math.min(e.maxHp, e.hp + heal);
    ow.floatingNumbers.push({ x: e.x, y: e.y - 20, text: '+' + heal, type: 'heal', life: 1.0 });
  }

  triggerShake(5, 0.2);
  spawnParticles(ow.player.x, ow.player.y, 'hurt', 6);
  ow.combat.blocking = false;
  playSound('hurt');

  // ⚔️ ВОИН: Генерация Ярости от получения урона
  if (p.hp > 0 && p.class === 'warrior') {
    p.mp = Math.min(p.maxMp, p.mp + 10);
    ow.player.mp = p.mp;
    pushLog(`🔥 Ярость: +10 (${p.mp}/${p.maxMp})`, 'info');
  }

  if (p.hp <= 0) { p.hp = 0; return combatDefeat(); }

  tickPlayerEffects();
  if (!ow.combat) return;

  const tb = getTalentBonus(p);
  if (tb.hpRegen > 0 && p.hp < p.maxHp) {
    p.hp = Math.min(p.maxHp, p.hp + tb.hpRegen);
    ow.player.hp = p.hp;
    ow.floatingNumbers.push({ x: ow.player.x, y: ow.player.y - 20, text: '+' + tb.hpRegen, type: 'heal', life: 1.0 });
  }
  if (tb.manaRegen > 0 && p.mp < p.maxMp) {
    p.mp = Math.min(p.maxMp, p.mp + tb.manaRegen);
    ow.player.mp = p.mp;
  }

  decreaseCooldowns();
  ow.combat.turn = 'player';
}

function combatVictory() {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;
  const e = ow.combat.enemy;
  const def = ENEMIES[e.enemyId];
  const p = state.game.player;
  const ng = getNGPlusMult();
  const riftM = ow.rifMode ? getRiftMult(ow.rifFloor) : { goldMult: 1, expMult: 1 };
  const gold = Math.round(def.gold * (e.elite ? 2 : 1) * ng.goldMult * riftM.goldMult);
  
  const hasElderBlessing = p.effects?.some(ef => ef.id === 'elderBlessing');
  let exp = Math.round(def.exp * (e.elite ? 1.5 : 1) * ng.expMult * riftM.expMult);
  if (hasElderBlessing) {
    exp = Math.round(exp * 1.2);
    const b = p.effects.find(ef => ef.id === 'elderBlessing');
    b.duration -= 1;
    if (b.duration <= 0) {
      p.effects = p.effects.filter(ef => ef.id !== 'elderBlessing');
      pushLog(`✨ Благословение старейшины закончилось.`, 'info');
    }
  }

  pushLog(`🏆 Победа! +${exp} опыта, +${gold} золота`, 'success');
  updateQuestProgress('kill', e.enemyId, 1);

  spawnParticles(e.x, e.y, 'smoke', 15);
  spawnParticles(e.x, e.y, 'spark', 6);

  if (!p.stats) p.stats = { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 };
  p.stats.kills[e.enemyId] = (p.stats.kills[e.enemyId] || 0) + 1;
  p.stats.goldEarned = (p.stats.goldEarned || 0) + gold;
  if (e.elite) p.stats.eliteKills = (p.stats.eliteKills || 0) + 1;
  if (e.boss) p.stats.bossKills = (p.stats.bossKills || 0) + 1;

  const dropChance = (e.elite || e.boss) ? 1.0 : getDropChance();
  def.drops.forEach(id => {
    if (Math.random() < dropChance) {
      const created = addItem(id);
      const inst = created[0];
      const r = inst && inst.rarity && inst.rarity !== 'common' ? `${RARITIES[inst.rarity].name} ` : '';
      pushLog(`Дроп: ${r}${ITEMS[id].name}`, 'success');
    }
  });

  if (!e.elite && !e.boss && Math.random() < LEGENDARY_DROP_CHANCE) {
    const pool = ['iron-sword', 'apprentice-staff', 'leather-armor', 'steel-sword', 'mithril-armor'];
    const id = pool[Math.floor(Math.random() * pool.length)];
    addItem(id, 1, { rarity: 'legendary' });
    pushLog(`✨ Легендарный дроп: ${ITEMS[id].name}!`, 'success');
    playSound('chest');
  }

  const herbChance = (e.elite || e.boss) ? HERB_DROP_CHANCE_ELITE : HERB_DROP_CHANCE;
  if (Math.random() < herbChance) {
    const herbQty = (e.elite || e.boss) ? 2 : 1;
    const herbId = Math.random() < 0.5 ? 'herb-life' : 'herb-moon';
    addItem(herbId, herbQty);
    pushLog(`🌿 Дроп: ${ITEMS[herbId].name} ×${herbQty}`, 'success');
  }

  const loc = LOCATIONS[ow.locationId];
  if (loc?.shard && loc.shardFrom === e.enemyId && !state.game.shards[loc.shard]) {
    state.game.shards[loc.shard] = true;
    addItem('mana-crystal');
    state.game.quests[`shard-${loc.shard}`] = true;
    pushLog('💎 Осколок Кристалла Маны!', 'success');
  }
  p.gold += gold;
  const prevLevel = p.level;
  addExp(exp);
  if (p.level > prevLevel) {
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 25);
    triggerShake(6, 0.3);
  }

  saveGame();
  e.dead = true;
  e.respawnAt = performance.now() + getRespawnMs();
  e.effects = [];
  clearPlayerEffects();
  if (hasElderBlessing && p.effects.length === 0) {
      p.effects.push({ id: 'elderBlessing', duration: b ? b.duration : 1 });
  }

  endCombat();
  checkAchievements();

  if (ow.rifMode) {
    const alive = ow.enemies.filter(en => !en.dead).length;
    if (alive === 0) {
      setTimeout(() => emit('rift:floor-cleared'), 900);
    }
  }

  if (Object.values(state.game.shards).every(Boolean) && !p.victoryAchieved) {
    setTimeout(() => emit('victory'), 1500);
  }
}

function combatDefeat() {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;
  const p = state.game.player;

  const cls = CLASSES[p.class];
  const hasRes = cls.abilities?.some(a => a.id === 'resurrection');
  if (hasRes && !ow.combat.playerResurrectionUsed) {
    ow.combat.playerResurrectionUsed = true;
    const restore = Math.ceil(p.maxHp * 0.3);
    p.hp = restore;
    ow.player.hp = restore;
    pushLog(`✨ Воскрешение! Возрождение с ${restore} HP`, 'success');
    playSound('heal');
    triggerShake(12, 0.5);
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 20);
    ow.combat.turn = 'player';
    return;
  }

  const e = ow.combat.enemy;
  pushLog('💀 Поражение...', 'damage');
  playSound('defeat');
  spawnParticles(ow.player.x, ow.player.y, 'hurt', 25);
  if (!p.stats) p.stats = { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 };
  p.stats.deaths = (p.stats.deaths || 0) + 1;
  p.hp = 0;
  ow.player.hp = 0;
  e.state = 'idle';
  ow.defeated = true;
  ow.combat = null;
  clearPlayerEffects();
  emit('rift:defeated');
  emit('overworld:defeat');
}

function endCombat() {
  const ow = state.overworld;
  if (!ow) return;
  if (ow.combat) ow.combat.enemy.state = 'idle';
  ow.combat = null;
  emit('combat:end');
}