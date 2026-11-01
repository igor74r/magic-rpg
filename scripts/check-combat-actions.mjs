// Deterministic smoke coverage for the three playable classes' combat actions.
import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { createCharacter } from '../systems/character.js';
import { ENEMIES } from '../data/enemies.js';
import { enterCombat, combatAttack, combatBlock, combatCastSpell, combatUseAbility } from '../systems/overworld/combat.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
const scheduled = [];
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, delay) => { scheduled.push({ fn, delay }); return scheduled.length; };

function fixture(classId) {
  state.currentSlot = 1;
  assert.equal(createCharacter('Combat Test', classId), true);
  const p = state.game.player;
  state.overworld = {
    locationId: 'forest',
    player: { x: 100, y: 100, hp: p.hp, mp: p.mp },
    enemies: [], log: [], floatingNumbers: [], particles: [],
    chests: [], events: [], combat: null, defeated: false
  };
  const base = ENEMIES.goblin;
  const enemy = {
    enemyId: 'goblin', x: 180, y: 100,
    hp: 1000, maxHp: 1000, defense: base.defense || 0,
    state: 'idle', boss: false, elite: false,
    effects: [], modifier: null
  };
  state.overworld.enemies.push(enemy);
  enterCombat(enemy);
  return { player: p, enemy, ow: state.overworld };
}

try {
  let f = fixture('warrior');
  const warriorBefore = f.enemy.hp;
  combatAttack();
  assert.ok(f.enemy.hp < warriorBefore, 'Warrior basic attack must damage the target');
  assert.equal(f.ow.combat.turn, 'enemy');
  console.log('PASS Warrior basic attack deals damage and advances the turn');

  f = fixture('warrior');
  combatBlock();
  assert.equal(f.ow.combat.blocking, true);
  assert.equal(f.ow.combat.turn, 'enemy');
  console.log('PASS Warrior block activates the defensive stance');

  f = fixture('mage');
  const mageHpBefore = f.enemy.hp;
  const mageMpBefore = f.player.mp;
  combatCastSpell('fireball');
  assert.ok(f.enemy.hp < mageHpBefore, 'Mage fireball must damage the target');
  assert.ok(f.player.mp < mageMpBefore, 'Mage fireball must consume mana');
  console.log('PASS Mage fireball damages the target and consumes mana');

  f = fixture('archer');
  f.player.mp = 100;
  const archerHpBefore = f.enemy.hp;
  combatUseAbility('aimed-shot');
  assert.ok(f.enemy.hp < archerHpBefore, 'Archer aimed shot must damage the target');
  assert.ok(f.player.cooldowns['aimed-shot'] > 0, 'Archer ability must enter cooldown');
  console.log('PASS Archer aimed shot damages the target and starts cooldown');

  assert.ok(scheduled.length >= 4, 'combat actions should schedule enemy responses');
  console.log(`Combat action regression: 4/4 action checks passed; ${scheduled.length} enemy turns safely queued.`);
} finally {
  globalThis.setTimeout = realSetTimeout;
  state.overworld = null;
  state.game = null;
}
