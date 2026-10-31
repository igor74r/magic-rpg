import { state } from '../state.js';
import { ENEMIES } from '../../data/enemies.js';
import { ITEMS, RARITIES } from '../../data/items.js';
import { SPELLS } from '../../data/spells.js';
import { CLASSES } from '../../data/classes.js';
import { LOCATIONS } from '../../data/locations.js';
import { getEffStats, resolveCriticalChance } from '../stats.js';
import { addItem, removeItem } from '../inventory.js';
import { addExp } from '../progression.js';
import { checkAchievements } from '../achievements.js';
import {
  applyEffect,
  tickEffects,
  getAtkMult,
  getDefMult,
  getLifesteal,
  isStunned,
  clearDebuffs
} from '../status.js';
import { emit } from '../events.js';
import { saveGame } from '../save.js';
import { playSound } from '../audio.js';
import { getNGPlusMult } from '../ngplus.js';
import { getTalentBonus } from '../talents.js';
import { getRiftMult } from '../rift.js';
import { getActPriceMultiplier } from '../economy.js';
import { updateQuestProgress } from '../dailyQuests.js';
import { canCompleteMainQuest, recordCampaignKill, recordCampaignShard } from '../campaign.js';
import { pushLog } from './log.js';
import { spawnParticles } from './particles.js';
import {
  MODIFIERS,
  ELITE_ATK_MULT,
  getDropChance,
  getRespawnMs
} from './spawn.js';

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

  if (p.class === 'warrior' || p.class === 'archer') {
    p.mp = 0;
  }
}

function enemyDisplayName(e) {
  const def = ENEMIES[e.enemyId];

  if (e.boss) return `☠ ${def.name}`;
  if (e.elite) return `★ ${def.name}`;

  if (e.modifier) {
    const modifier = MODIFIERS[e.modifier];
    return `${modifier.prefix} ${modifier.name} ${def.name}`;
  }

  return def.name;
}

function enemyDefValue(e) {
  const base = ENEMIES[e.enemyId].defense;
  const mult = e.modifier
    ? MODIFIERS[e.modifier].defMult
    : 1;

  return Math.floor(base * mult);
}

function hasBuff(p, id) {
  return Array.isArray(p.buffs) &&
    p.buffs.some(buff => buff.id === id);
}

function consumeBuffRound(p, id) {
  if (!Array.isArray(p.buffs)) return;

  const buff = p.buffs.find(item => item.id === id);
  if (!buff) return;

  buff.duration -= 1;

  if (buff.duration <= 0) {
    p.buffs = p.buffs.filter(item => item.id !== id);
  }
}

export function enterCombat(enemy) {
  const ow = state.overworld;
  if (!ow) return;

  enemy.state = 'combat';

  ow.combat = {
    enemy,
    turn: 'player',
    over: false,
    turnCount: 0,
    blocking: false,
    guaranteedDodge: false,
    playerChargeNext: false,
    playerResurrectionUsed: false
  };

  pushLog(`⚔️ Бой: ${enemyDisplayName(enemy)}`, 'info');
  emit('combat:start');
}

function checkBossPhase(enemy) {
  if (!enemy.boss || !ENEMIES[enemy.enemyId].phases) return;

  const phases = ENEMIES[enemy.enemyId].phases;

  for (let i = enemy.phase || 0; i < phases.length; i++) {
    const phase = phases[i];

    if (enemy.hp / enemy.maxHp <= phase.atHp) {
      enemy.phase = i + 1;

      pushLog(`⚠️ ${phase.msg}`, 'damage');
      playSound('cast');
      triggerShake(10, 0.4);
    }
  }
}

export function combatAttack() {
  const ow = state.overworld;

  if (!ow || !ow.combat || ow.combat.turn !== 'player') {
    return;
  }

  const enemy = ow.combat.enemy;
  const p = state.game.player;
  const stats = getEffStats();
  const atkMult = getAtkMult(p);
  const talent = getTalentBonus(p);

  const enemyDefense = Math.max(
    0,
    enemyDefValue(enemy) - (stats.armorPen || 0)
  );

  let damage = Math.max(
    1,
    Math.floor(
      (
        stats.atk +
        Math.floor(Math.random() * 5) -
        Math.floor(enemyDefense / 2)
      ) *
      atkMult *
      talent.dmgMult
    )
  );

  const catLuckBonus = hasBuff(p, 'catLuck') ? 0.05 : 0;

  const isCrit = Math.random() < resolveCriticalChance(stats, catLuckBonus);

  if (isCrit) {
    damage = Math.floor(damage * talent.critMult);
    triggerShake(8, 0.3);
    spawnParticles(enemy.x, enemy.y, 'spark', 10);
  }

  if (ow.combat.playerChargeNext) {
    damage = Math.floor(damage * 2);
    ow.combat.playerChargeNext = false;

    pushLog('⚡ Рывок: двойной урон!', 'damage');
    spawnParticles(enemy.x, enemy.y, 'spark', 8);
  }

  const lifesteal = Math.min(
    1,
    getLifesteal(p) + talent.lifesteal
  );

  if (lifesteal > 0 && damage > 0) {
    const heal = Math.floor(damage * lifesteal);

    p.hp = Math.min(p.maxHp, p.hp + heal);
    ow.player.hp = p.hp;

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '+' + heal,
      type: 'heal',
      life: 1.2
    });

    pushLog(`🩸 Кровожадность: +${heal} HP`, 'heal');
  }

  enemy.hp -= damage;

  ow.floatingNumbers.push({
    x: enemy.x,
    y: enemy.y - 20,
    text: (isCrit ? '!' : '-') + damage,
    type: isCrit ? 'crit' : 'damage',
    life: 1.2
  });

  pushLog(
    `Вы нанесли ${damage} урона (${enemyDisplayName(enemy)})${isCrit ? ' КРИТ!' : ''}`,
    'damage'
  );

  if (p.class === 'warrior') {
    p.mp = Math.min(p.maxMp, p.mp + 15);
    ow.player.mp = p.mp;

    pushLog(
      `🔥 Ярость: +15 (${p.mp}/${p.maxMp})`,
      'info'
    );
  } else if (p.class === 'archer') {
    p.mp = Math.min(p.maxMp, p.mp + 10);
    ow.player.mp = p.mp;

    pushLog(
      `🎯 Концентрация: +10 (${p.mp}/${p.maxMp})`,
      'info'
    );
  }

  playSound(isCrit ? 'crit' : 'hit');

  if (enemy.hp <= 0) {
    enemy.hp = 0;
    return combatVictory();
  }

  checkBossPhase(enemy);
  tickEnemyEffects();

  if (ow.combat && enemy.hp <= 0) {
    enemy.hp = 0;
    return combatVictory();
  }

  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatCastSpell(spellId) {
  const ow = state.overworld;

  if (!ow || !ow.combat || ow.combat.turn !== 'player') {
    return;
  }

  const p = state.game.player;
  const spell = SPELLS[spellId];

  if (!spell) return;

  if (p.class === 'warrior') {
    pushLog('Воин не умеет колдовать!', 'info');
    return;
  }

  if (spellId === 'sacrifice') {
    const hpCost = Math.ceil(p.maxHp * spell.selfDamagePct);

    if (p.hp <= hpCost) {
      pushLog('Недостаточно HP для Жертвы!', 'info');
      return;
    }

    p.hp -= hpCost;
    p.mp = Math.min(p.maxMp, p.mp + spell.restoreMp);

    ow.player.hp = p.hp;
    ow.player.mp = p.mp;

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '-' + hpCost,
      type: 'damage',
      life: 1.2
    });

    ow.floatingNumbers.push({
      x: ow.player.x + 15,
      y: ow.player.y - 30,
      text: '+' + spell.restoreMp + ' MP',
      type: 'heal',
      life: 1.2
    });

    pushLog(
      `🩸 Жертва: потрачено ${hpCost} HP, восстановлено ${spell.restoreMp} MP`,
      'heal'
    );

    playSound('heal');

    ow.combat.turn = 'enemy';
    setTimeout(enemyCombatTurn, 700);
    return;
  }

  const freeMana = p.effects?.some(
    effect => effect.id === 'manaShield'
  );

  if (!freeMana && p.mp < spell.cost) {
    pushLog('Мало маны', 'info');
    return;
  }

  if (!freeMana) {
    p.mp -= spell.cost;
    ow.player.mp = p.mp;
  } else {
    pushLog('💧 Эликсир маны: мана не тратится', 'success');
  }

  const stats = getEffStats();
  const talent = getTalentBonus(p);
  const enemy = ow.combat.enemy;

  if (spell.damage) {
    const damage = Math.max(
      1,
      Math.floor(
        (
          spell.damage +
          Math.floor(stats.mag / 2) -
          Math.floor(enemyDefValue(enemy) / 2)
        ) *
        talent.spellMult
      )
    );

    enemy.hp -= damage;

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '-' + damage,
      type: 'damage',
      life: 1.2
    });

    pushLog(`${spell.name}: нанесено ${damage} урона`, 'damage');

    playSound('cast');
    spawnParticles(enemy.x, enemy.y, 'spark', 5);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      return combatVictory();
    }

    checkBossPhase(enemy);
  } else if (spell.heal) {
    const heal = Math.floor(
      (spell.heal + Math.floor(stats.mag / 2)) *
      talent.healMult
    );

    p.hp = Math.min(p.maxHp, p.hp + heal);
    ow.player.hp = p.hp;

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '+' + heal,
      type: 'heal',
      life: 1.2
    });

    pushLog(`${spell.name}: восстановлено ${heal} HP`, 'heal');

    playSound('heal');
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 6);
  }

  if (spell.effect) {
    applyEffect(enemy, spell.effect);
    pushLog(`☠️ Наложен эффект: ${spell.effect}`, 'damage');
  }

  if (spell.selfEffect) {
    applyEffect(p, spell.selfEffect);
    pushLog(`🛡️ Эффект на вас: ${spell.selfEffect}`, 'success');
  }

  tickEnemyEffects();

  if (ow.combat && enemy.hp <= 0) {
    enemy.hp = 0;
    return combatVictory();
  }

  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatUseAbility(abilityId) {
  const ow = state.overworld;

  if (!ow || !ow.combat || ow.combat.turn !== 'player') {
    return;
  }

  const p = state.game.player;
  const cls = CLASSES[p.class];
  const ability = cls.abilities?.find(item => item.id === abilityId);

  if (!ability || ability.passive) return;

  const cooldown = p.cooldowns?.[abilityId] || 0;

  if (cooldown > 0) {
    pushLog(`${ability.name}: перезарядка (${cooldown})`, 'info');
    return;
  }

  const freeMana = p.effects?.some(
    effect => effect.id === 'manaShield'
  );

  if (!freeMana && p.mp < (ability.cost || 0)) {
    pushLog(
      p.class === 'warrior'
        ? 'Недостаточно Ярости!'
        : p.class === 'archer'
          ? 'Недостаточно концентрации!'
          : 'Мало маны',
      'info'
    );
    return;
  }

  if (ability.cost && !freeMana) {
    p.mp -= ability.cost;
  }

  if (freeMana && ability.cost > 0) {
    pushLog('💧 Эликсир маны: мана не тратится', 'success');
  }

  ow.player.mp = p.mp;

  if (!p.cooldowns) {
    p.cooldowns = {};
  }

  const enemy = ow.combat.enemy;
  const stats = getEffStats();
  const talent = getTalentBonus(p);

  p.cooldowns[abilityId] = Math.max(
    1,
    ability.cooldown + (talent.abilityCdDelta || 0)
  );

  if (abilityId === 'aimed-shot') {
    const damage = Math.max(
      1,
      Math.floor(
        (
          stats.atk * 1.65 +
          Math.floor(Math.random() * 6) -
          Math.floor(
            Math.max(
              0,
              enemyDefValue(enemy) - (stats.armorPen || 0)
            ) / 2
          )
        ) *
        talent.dmgMult *
        talent.critMult
      )
    );

    enemy.hp -= damage;

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '◎-' + damage,
      type: 'crit',
      life: 1.3
    });

    pushLog(
      `🎯 Прицельный выстрел: ${damage} урона — гарантированный крит!`,
      'damage'
    );

    playSound('crit');
    spawnParticles(enemy.x, enemy.y, 'spark', 9);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      return combatVictory();
    }

    checkBossPhase(enemy);
  } else if (abilityId === 'evasion') {
    ow.combat.guaranteedDodge = true;

    pushLog(
      '💨 Уклонение: следующая атака противника будет полностью отбита',
      'success'
    );

    spawnParticles(ow.player.x, ow.player.y, 'smoke', 8);
  } else if (abilityId === 'toxic-blade') {
    const damage = Math.max(
      1,
      Math.floor(stats.atk * 0.7)
    );

    enemy.hp -= damage;
    applyEffect(enemy, 'poison');

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '-' + damage,
      type: 'damage',
      life: 1.2
    });

    pushLog(
      `☠️ Отравленный наконечник: ${damage} урона и яд на 3 хода`,
      'damage'
    );

    playSound('hit');
    spawnParticles(enemy.x, enemy.y, 'poison', 8);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      return combatVictory();
    }

    checkBossPhase(enemy);
  } else if (abilityId === 'charge') {
    ow.combat.playerChargeNext = true;

    pushLog('⚡ Рывок: следующая атака ×2', 'damage');
  } else if (abilityId === 'war-cry') {
    applyEffect(p, 'atkBuff');

    pushLog(
      '📢 Боевой клич: +30% атаки (2 хода)',
      'success'
    );
  } else if (abilityId === 'bloodthirst') {
    applyEffect(p, 'lifesteal');

    pushLog(
      '🩸 Кровожадность: вампиризм 50% (2 хода)',
      'success'
    );
  } else if (abilityId === 'mana-shield') {
    applyEffect(p, 'defBuff');

    pushLog(
      '🛡️ Щит маны: +50% защиты (2 хода)',
      'success'
    );
  } else if (abilityId === 'teleport') {
    pushLog(
      '💨 Телепорт: враг пропускает ход',
      'success'
    );

    playSound('cast');
    ow.combat.turn = 'enemy';

    setTimeout(() => {
      const ow2 = state.overworld;

      if (!ow2 || !ow2.combat) return;

      pushLog(
        '💨 Враг дезориентирован и пропускает ход',
        'info'
      );

      tickEnemyEffects();

      const ow3 = state.overworld;

      if (!ow3 || !ow3.combat) return;

      if (ow3.combat.enemy.hp <= 0) {
        ow3.combat.enemy.hp = 0;
        return combatVictory();
      }

      tickPlayerEffects();

      const ow4 = state.overworld;

      if (!ow4 || !ow4.combat) return;

      decreaseCooldowns();

      ow4.combat.turn = 'player';
      ow4.combat.turnCount = (ow4.combat.turnCount || 0) + 1;
    }, 500);

    return;
  } else if (abilityId === 'meteor') {
    const damage = Math.floor(
      (60 + Math.floor(stats.mag / 2)) *
      talent.meteorMult *
      talent.spellMult
    );

    enemy.hp -= damage;
    applyEffect(enemy, 'burn');

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '-' + damage,
      type: 'crit',
      life: 1.4
    });

    pushLog(
      `☄️ Метеор: ${damage} урона + ожог`,
      'damage'
    );

    playSound('cast');
    triggerShake(10, 0.4);
    spawnParticles(enemy.x, enemy.y, 'spark', 15);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      return combatVictory();
    }

    checkBossPhase(enemy);
  } else if (abilityId === 'prayer') {
    const heal = Math.floor(
      (50 + Math.floor(stats.mag / 2)) *
      talent.prayerMult *
      talent.healMult
    );

    p.hp = Math.min(p.maxHp, p.hp + heal);
    ow.player.hp = p.hp;

    clearDebuffs(p);

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '+' + heal,
      type: 'heal',
      life: 1.4
    });

    pushLog(
      `🙏 Молитва: +${heal} HP, дебаффы сняты`,
      'heal'
    );

    playSound('heal');
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 8);
  } else if (abilityId === 'sanctify') {
    const damage = Math.floor(
      (25 + Math.floor(stats.mag / 2)) *
      talent.spellMult
    );

    enemy.hp -= damage;
    applyEffect(enemy, 'burn');

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '-' + damage,
      type: 'damage',
      life: 1.2
    });

    pushLog(
      `☀️ Освящение: ${damage} урона + ожог`,
      'damage'
    );

    playSound('cast');
    spawnParticles(enemy.x, enemy.y, 'spark', 6);

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      return combatVictory();
    }

    checkBossPhase(enemy);
  }

  tickEnemyEffects();

  if (ow.combat && enemy.hp <= 0) {
    enemy.hp = 0;
    return combatVictory();
  }

  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatUseItem(itemId) {
  const ow = state.overworld;

  if (!ow || !ow.combat || ow.combat.turn !== 'player') {
    return;
  }

  const item = ITEMS[itemId];

  if (!item || item.type !== 'consumable') {
    return;
  }

  const p = state.game.player;
  const before = {
    hp: p.hp,
    mp: p.mp
  };

  item.use(p);

  if (item.effect === 'antidote') {
    clearDebuffs(p);
    pushLog('🧪 Антидот: дебаффы сняты', 'heal');
  } else if (item.effect) {
    applyEffect(p, item.effect);
    pushLog(`✨ Эффект: ${item.name}`, 'success');
  }

  updateQuestProgress('potion-used', 'any', 1);

  const healed = p.hp - before.hp;
  const mana = p.mp - before.mp;

  ow.player.hp = p.hp;
  ow.player.mp = p.mp;

  if (healed > 0) {
    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '+' + healed,
      type: 'heal',
      life: 1.2
    });

    spawnParticles(ow.player.x, ow.player.y, 'levelup', 5);
    pushLog(`Вы восстановили ${healed} HP`, 'heal');
  } else if (mana > 0) {
    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '+' + mana,
      type: 'heal',
      life: 1.2
    });

    spawnParticles(ow.player.x, ow.player.y, 'levelup', 5);
    pushLog(`Вы восстановили ${mana} MP`, 'heal');
  }

  removeItem(itemId);
  playSound('heal');
  tickEnemyEffects();

  if (ow.combat && ow.combat.enemy.hp <= 0) {
    ow.combat.enemy.hp = 0;
    return combatVictory();
  }

  ow.combat.turn = 'enemy';
  setTimeout(enemyCombatTurn, 700);
}

export function combatBlock() {
  const ow = state.overworld;

  if (!ow || !ow.combat || ow.combat.turn !== 'player') {
    return;
  }

  ow.combat.blocking = true;

  const blockPower = getEffStats().blockPower || 0.6;

  pushLog(
    `🛡️ Защитная стойка: следующий удар будет ослаблен на ${Math.round(Math.max(0.5, blockPower) * 100)}%`,
    'info'
  );

  tickEnemyEffects();

  if (ow.combat && ow.combat.enemy.hp <= 0) {
    ow.combat.enemy.hp = 0;
    return combatVictory();
  }

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

  const enemy = ow.combat.enemy;
  const result = tickEffects(enemy);

  if (result.totalDamage > 0) {
    enemy.hp -= result.totalDamage;

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '-' + result.totalDamage,
      type: 'damage',
      life: 1.2
    });

    const parts = result.messages
      .map(message => `${message.icon} ${message.name} ${message.damage}`)
      .join(', ');

    pushLog(`Эффекты на враге: ${parts}`, 'damage');
  }
}

function tickPlayerEffects() {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;

  const p = state.game.player;
  const result = tickEffects(p);

  if (result.totalDamage > 0) {
    p.hp -= result.totalDamage;
    ow.player.hp = Math.max(0, p.hp);

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '-' + result.totalDamage,
      type: 'damage',
      life: 1.2
    });

    const parts = result.messages
      .map(message => `${message.icon} ${message.name} ${message.damage}`)
      .join(', ');

    pushLog(`Эффекты на вас: ${parts}`, 'damage');
    playSound('hurt');
  }

  if (p.hp <= 0) {
    p.hp = 0;
    combatDefeat();
  }
}

function decreaseCooldowns() {
  const p = state.game.player;
  if (!p.cooldowns) return;

  for (const key in p.cooldowns) {
    if (p.cooldowns[key] > 0) {
      p.cooldowns[key] -= 1;
    }
  }
}

function enemyCombatTurn() {
  const ow = state.overworld;

  if (!ow || !ow.combat || ow.combat.turn !== 'enemy') {
    return;
  }

  const enemy = ow.combat.enemy;
  const def = ENEMIES[enemy.enemyId];
  const stats = getEffStats();
  const p = state.game.player;
  const name = enemyDisplayName(enemy);

  if (enemy.modifier === 'regenerating' && enemy.hp < enemy.maxHp) {
    const regen = MODIFIERS.regenerating.regenPerTurn || 5;

    enemy.hp = Math.min(enemy.maxHp, enemy.hp + regen);

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '+' + regen,
      type: 'heal',
      life: 1
    });
  }

  if (isStunned(enemy)) {
    pushLog(`💫 ${name} оглушён, пропускает ход`, 'info');

    tickEnemyEffects();

    if (ow.combat && enemy.hp <= 0) {
      enemy.hp = 0;
      return combatVictory();
    }

    tickPlayerEffects();

    if (!ow.combat) return;

    decreaseCooldowns();

    ow.combat.turn = 'player';
    ow.combat.turnCount = (ow.combat.turnCount || 0) + 1;
    ow.combat.blocking = false;

    return;
  }

  const difficulty =
    state.settings.difficulty === 'easy'
      ? 0.7
      : state.settings.difficulty === 'hard'
        ? 1.4
        : 1;

  const modifierAttack = enemy.modifier
    ? MODIFIERS[enemy.modifier].atkMult
    : 1;

  const phaseAttack =
    enemy.phase > 0 && def.phases
      ? (def.phases[enemy.phase - 1]?.atkMult || 1)
      : 1;

  const ng = getNGPlusMult();

  const rift = ow.rifMode
    ? getRiftMult(ow.rifFloor)
    : { atkMult: 1 };

  const attack =
    def.attack *
    (enemy.elite ? ELITE_ATK_MULT : 1) *
    modifierAttack *
    phaseAttack *
    ng.atkMult *
    rift.atkMult;

  let baseDamage = Math.max(
    1,
    Math.floor(
      (attack + Math.floor(Math.random() * 5) - stats.def) *
      difficulty
    )
  );

  ow.combat.turnCount = (ow.combat.turnCount || 0) + 1;

  // Уклонение: полностью отменяет одну атаку, включая специальную атаку босса.
  const dodgeChance = Math.max(
    0,
    Math.min(0.65, stats.dodgeChance || 0)
  );

  const dodged =
    ow.combat.guaranteedDodge ||
    Math.random() < dodgeChance;

  ow.combat.guaranteedDodge = false;

  if (dodged) {
    pushLog(
      '💨 Вы уклонились от атаки — урон полностью предотвращён!',
      'success'
    );

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 22,
      text: 'DODGE',
      type: 'heal',
      life: 1
    });

    spawnParticles(ow.player.x, ow.player.y, 'smoke', 10);

    ow.combat.blocking = false;

    tickPlayerEffects();

    if (!ow.combat) return;

    const talent = getTalentBonus(p);

    if (talent.hpRegen > 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + talent.hpRegen);
      ow.player.hp = p.hp;
    }

    if (talent.manaRegen > 0 && p.mp < p.maxMp) {
      p.mp = Math.min(p.maxMp, p.mp + talent.manaRegen);
      ow.player.mp = p.mp;
    }

    decreaseCooldowns();
    ow.combat.turn = 'player';

    return;
  }

  // Автоматический блок от экипировки и пассивных характеристик.
  const automaticBlock =
    !ow.combat.blocking &&
    Math.random() < Math.max(
      0,
      Math.min(0.6, stats.blockChance || 0)
    );

  if (ow.combat.blocking || automaticBlock) {
    const reduction = ow.combat.blocking
      ? Math.max(0.5, stats.blockPower || 0.6)
      : Math.max(0.35, stats.blockPower || 0.45);

    baseDamage = Math.max(
      1,
      Math.floor(
        baseDamage * (1 - Math.min(0.9, reduction))
      )
    );

    pushLog(
      ow.combat.blocking
        ? '🛡️ Вы приняли удар в защитную стойку'
        : '🛡️ Сработал автоматический блок',
      'success'
    );
  }

  const defenseMult = getDefMult(p);

  if (defenseMult > 1) {
    baseDamage = Math.max(
      1,
      Math.floor(baseDamage / defenseMult)
    );
  }

  const special = def.special;

  const specialEvery =
    enemy.phase > 0 && def.phases
      ? (def.phases[enemy.phase - 1]?.specialEvery || special?.every)
      : special?.every;

  const useSpecial =
    special &&
    specialEvery &&
    ow.combat.turnCount % specialEvery === 0;

  if (useSpecial && special.type === 'double') {
    const damage1 = Math.max(
      1,
      Math.floor(baseDamage * 0.6)
    );

    const damage2 = Math.max(
      1,
      Math.floor(baseDamage * 0.6)
    );

    p.hp -= damage1 + damage2;
    ow.player.hp = Math.max(0, p.hp);

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '-' + damage1,
      type: 'damage',
      life: 1.2
    });

    ow.floatingNumbers.push({
      x: ow.player.x + 12,
      y: ow.player.y - 30,
      text: '-' + damage2,
      type: 'damage',
      life: 1.2
    });

    pushLog(
      `${name} использовал ${special.name} и нанёс вам ${damage1}+${damage2} урона`,
      'damage'
    );

    if (special.effect) {
      applyEffect(p, special.effect);
      pushLog(`☠️ Наложен эффект: ${special.effect}`, 'damage');
    }
  } else if (useSpecial && special.type === 'snipe') {
    const mult = special.mult || 2;
    const damage = Math.max(
      1,
      Math.floor(baseDamage * mult)
    );

    p.hp -= damage;
    ow.player.hp = Math.max(0, p.hp);

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '-' + damage,
      type: 'crit',
      life: 1.4
    });

    pushLog(
      `${name} использовал ${special.name} и нанёс вам ${damage} урона`,
      'damage'
    );

    if (special.effect) {
      applyEffect(p, special.effect);
      pushLog(`☠️ Наложен эффект: ${special.effect}`, 'damage');
    }
  } else if (useSpecial && special.type === 'drain') {
    const damage = baseDamage;

    p.hp -= damage;
    ow.player.hp = Math.max(0, p.hp);

    enemy.hp = Math.min(enemy.maxHp, enemy.hp + damage);

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '-' + damage,
      type: 'damage',
      life: 1.2
    });

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '+' + damage,
      type: 'heal',
      life: 1.2
    });

    pushLog(
      `${name} использовал ${special.name} (${damage} урона) и восстановил ${damage} HP`,
      'damage'
    );

    if (special.effect) {
      applyEffect(p, special.effect);
      pushLog(`☠️ Наложен эффект: ${special.effect}`, 'damage');
    }
  } else {
    p.hp -= baseDamage;
    ow.player.hp = Math.max(0, p.hp);

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '-' + baseDamage,
      type: 'damage',
      life: 1.2
    });

    pushLog(
      `${name} нанёс вам ${baseDamage} урона`,
      'damage'
    );
  }

  if (enemy.modifier === 'vampiric' && baseDamage > 0) {
    const heal = Math.floor(
      baseDamage * (MODIFIERS.vampiric.vampiricPct || 0.3)
    );

    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);

    ow.floatingNumbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: '+' + heal,
      type: 'heal',
      life: 1
    });
  }

  triggerShake(5, 0.2);
  spawnParticles(ow.player.x, ow.player.y, 'hurt', 6);

  ow.combat.blocking = false;
  playSound('hurt');

  if (p.hp > 0 && p.class === 'warrior') {
    p.mp = Math.min(p.maxMp, p.mp + 10);
    ow.player.mp = p.mp;

    pushLog(
      `🔥 Ярость: +10 (${p.mp}/${p.maxMp})`,
      'info'
    );
  }

  if (p.hp <= 0) {
    p.hp = 0;
    return combatDefeat();
  }

  tickPlayerEffects();

  if (!ow.combat) return;

  const talent = getTalentBonus(p);

  if (talent.hpRegen > 0 && p.hp < p.maxHp) {
    p.hp = Math.min(p.maxHp, p.hp + talent.hpRegen);
    ow.player.hp = p.hp;

    ow.floatingNumbers.push({
      x: ow.player.x,
      y: ow.player.y - 20,
      text: '+' + talent.hpRegen,
      type: 'heal',
      life: 1
    });
  }

  if (talent.manaRegen > 0 && p.mp < p.maxMp) {
    p.mp = Math.min(p.maxMp, p.mp + talent.manaRegen);
    ow.player.mp = p.mp;
  }

  decreaseCooldowns();
  ow.combat.turn = 'player';
}

function combatVictory() {
  const ow = state.overworld;
  if (!ow || !ow.combat) return;

  const enemy = ow.combat.enemy;
  const def = ENEMIES[enemy.enemyId];
  const p = state.game.player;

  const ng = getNGPlusMult();

  const rift = ow.rifMode
    ? getRiftMult(ow.rifFloor)
    : { goldMult: 1, expMult: 1 };

  const gold = Math.round(
    def.gold * 0.15 *
    getActPriceMultiplier(p) *
    (enemy.elite ? 2 : 1) *
    ng.goldMult *
    rift.goldMult
  );

  const hasElderBlessing = p.effects?.some(
    effect => effect.id === 'elderBlessing'
  );

  let savedBlessingDuration = 0;

  let exp = Math.round(
    def.exp *
    (enemy.elite ? 1.5 : 1) *
    ng.expMult *
    rift.expMult
  );

  if (hasElderBlessing) {
    exp = Math.round(exp * 1.2);

    const blessing = p.effects.find(
      effect => effect.id === 'elderBlessing'
    );

    blessing.duration -= 1;
    savedBlessingDuration = blessing.duration;

    if (blessing.duration <= 0) {
      p.effects = p.effects.filter(
        effect => effect.id !== 'elderBlessing'
      );

      pushLog(
        '✨ Благословение старейшины закончилось.',
        'info'
      );
    }
  }

  if (hasBuff(p, 'bardBuff')) {
    exp = Math.round(exp * 1.1);
    pushLog('🎵 Вдохновение барда: +10% опыта', 'info');
  }

  pushLog(
    `🏆 Победа! +${exp} опыта, +${gold} золота`,
    'success'
  );

  updateQuestProgress('kill', enemy.enemyId, 1);

  if (enemy.boss) {
    updateQuestProgress('boss-kill', 'any', 1);
  }

  if (!p.stats) {
    p.stats = {
      kills: {},
      deaths: 0,
      goldEarned: 0,
      chestsOpened: 0,
      dailyChestAt: 0,
      dailyChestsOpened: 0,
      flawlessStreak: 0
    };
  }

  p.stats.flawlessStreak =
    (p.stats.flawlessStreak || 0) + 1;

  updateQuestProgress(
    'flawless',
    'any',
    p.stats.flawlessStreak,
    'max'
  );

  spawnParticles(enemy.x, enemy.y, 'smoke', 15);
  spawnParticles(enemy.x, enemy.y, 'spark', 6);

  p.stats.kills[enemy.enemyId] =
    (p.stats.kills[enemy.enemyId] || 0) + 1;

  recordCampaignKill(p, ow.locationId, enemy.enemyId);

  p.stats.goldEarned =
    (p.stats.goldEarned || 0) + gold;

  if (enemy.elite) {
    p.stats.eliteKills = (p.stats.eliteKills || 0) + 1;
  }

  if (enemy.boss) {
    p.stats.bossKills = (p.stats.bossKills || 0) + 1;
  }

  const dropChance =
    (enemy.elite || enemy.boss)
      ? 1
      : getDropChance();

  def.drops.forEach(id => {
    if (Math.random() < dropChance) {
      const created = addItem(id);
      const instance = created[0];

      const rarity =
        instance &&
        instance.rarity &&
        instance.rarity !== 'common'
          ? `${RARITIES[instance.rarity].name} `
          : '';

      pushLog(
        `Дроп: ${rarity}${ITEMS[id].name}`,
        'success'
      );
    }
  });

  if (
    !enemy.elite &&
    !enemy.boss &&
    Math.random() < LEGENDARY_DROP_CHANCE
  ) {
    const pool = [
      'iron-sword',
      'apprentice-staff',
      'leather-armor',
      'steel-sword',
      'mithril-armor'
    ];

    const id = pool[
      Math.floor(Math.random() * pool.length)
    ];

    addItem(id, 1, { rarity: 'legendary' });

    pushLog(
      `✨ Легендарный дроп: ${ITEMS[id].name}!`,
      'success'
    );

    playSound('chest');
  }

  const herbChance =
    (enemy.elite || enemy.boss)
      ? HERB_DROP_CHANCE_ELITE
      : HERB_DROP_CHANCE;

  if (Math.random() < herbChance) {
    const herbQty = (enemy.elite || enemy.boss) ? 2 : 1;

    const herbId =
      Math.random() < 0.5
        ? 'herb-life'
        : 'herb-moon';

    addItem(herbId, herbQty);

    pushLog(
      `🌿 Дроп: ${ITEMS[herbId].name} ×${herbQty}`,
      'success'
    );
  }

  const loc = LOCATIONS[ow.locationId];

  if (
    loc?.shard &&
    loc.shardFrom === enemy.enemyId &&
    !state.game.shards[loc.shard]
  ) {
    state.game.shards[loc.shard] = true;
    recordCampaignShard(p, loc.shard);

    const shardItems = {
      forest: 'shard-forest',
      ruins: 'shard-ruins',
      shadow: 'shard-shadow'
    };
    addItem(shardItems[loc.shard] || 'mana-crystal');

    state.game.quests[`shard-${loc.shard}`] = true;

    pushLog(
      '💎 Осколок Кристалла Маны!',
      'success'
    );
  }

  p.gold += gold;

  const previousLevel = p.level;

  addExp(exp);

  if (p.level > previousLevel) {
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 25);
    triggerShake(6, 0.3);
  }

  saveGame();

  enemy.dead = true;
  enemy.respawnAt = performance.now() + getRespawnMs();
  enemy.effects = [];

  clearPlayerEffects();

  if (hasElderBlessing && savedBlessingDuration > 0) {
    p.effects.push({
      id: 'elderBlessing',
      duration: savedBlessingDuration
    });
  }

  if (hasBuff(p, 'catLuck')) {
    consumeBuffRound(p, 'catLuck');
  }

  if (hasBuff(p, 'bardBuff')) {
    consumeBuffRound(p, 'bardBuff');
  }

  endCombat();
  checkAchievements();

  if (ow.rifMode) {
    const alive = ow.enemies.filter(
      currentEnemy => !currentEnemy.dead
    ).length;

    if (alive === 0) {
      setTimeout(
        () => emit('rift:floor-cleared'),
        900
      );
    }
  }

  if (canCompleteMainQuest(state.game) && !p.victoryAchieved) {
    setTimeout(
      () => emit('victory'),
      1500
    );
  }
}

function combatDefeat() {
  const ow = state.overworld;

  if (!ow || !ow.combat) return;

  const p = state.game.player;
  const cls = CLASSES[p.class];

  const hasResurrection = cls.abilities?.some(
    ability => ability.id === 'resurrection'
  );

  if (
    hasResurrection &&
    !ow.combat.playerResurrectionUsed
  ) {
    ow.combat.playerResurrectionUsed = true;

    const talent = getTalentBonus(p);

    const restore = Math.ceil(
      p.maxHp * (talent.resurrectPct || 0.3)
    );

    p.hp = restore;
    ow.player.hp = restore;

    pushLog(
      `✨ Воскрешение! Возрождение с ${restore} HP`,
      'success'
    );

    playSound('heal');
    triggerShake(12, 0.5);
    spawnParticles(ow.player.x, ow.player.y, 'levelup', 20);

    ow.combat.turn = 'player';
    return;
  }

  const enemy = ow.combat.enemy;

  pushLog('💀 Поражение...', 'damage');
  playSound('defeat');
  spawnParticles(ow.player.x, ow.player.y, 'hurt', 25);

  if (!p.stats) {
    p.stats = {
      kills: {},
      deaths: 0,
      goldEarned: 0,
      chestsOpened: 0,
      dailyChestAt: 0,
      dailyChestsOpened: 0,
      flawlessStreak: 0
    };
  }

  p.stats.deaths = (p.stats.deaths || 0) + 1;
  p.stats.flawlessStreak = 0;

  if (p.dailyQuests?.list) {
    const quest = p.dailyQuests.list.find(item =>
      item.type === 'flawless' &&
      !item.completed &&
      !item.claimed
    );

    if (quest) {
      quest.current = 0;
    }
  }

  p.hp = 0;
  ow.player.hp = 0;

  enemy.state = 'idle';
  ow.defeated = true;
  ow.combat = null;

  clearPlayerEffects();

  emit('rift:defeated');
  emit('overworld:defeat');
}

function endCombat() {
  const ow = state.overworld;
  if (!ow) return;

  if (ow.combat) {
    ow.combat.enemy.state = 'idle';
  }

  ow.combat = null;

  emit('combat:end');
}