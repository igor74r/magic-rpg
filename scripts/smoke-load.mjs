// scripts/smoke-load.mjs
// Smoke-тест: динамически загружает чистые логические модули и данные проекта в Node
// и проверяет базовые инварианты. Не должен трогать DOM / localStorage / Audio.

const mods = await Promise.all([
  import('../systems/state.js'),
  import('../systems/events.js'),
  import('../systems/progression.js'),
  import('../systems/status.js'),
  import('../systems/stats.js'),
  import('../data/classes.js'),
  import('../data/items.js'),
  import('../data/spells.js'),
  import('../data/locations.js'),
  import('../data/enemies.js'),
  import('../data/achievements.js'),
  import('../data/talents.js'),
  import('../data/npcs.js'),
  import('../data/shop.js'),
  import('../data/story.js'),
]);

const { state } = mods[0];
const { on, emit } = mods[1];
const { addExp } = mods[2];
const { EFFECTS, applyEffect, hasEffect } = mods[3];
const { getEffStats } = mods[4];
const { CLASSES } = mods[5];
const { ITEMS } = mods[6];
const { SPELLS } = mods[7];
const { LOCATIONS } = mods[8];
const { ENEMIES } = mods[9];
const { ACHIEVEMENTS } = mods[10];
const { TALENTS } = mods[11];
const { NPCS, FORGE_BONUS } = mods[12];
const { SHOP_ITEMS } = mods[13];
const { STORY } = mods[14];

const results = [];
const check = (name, cond) => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}`);

check('state.game is null initially', state.game === null);
check('state has settings', !!state.settings);
check('event bus: on/emit registered', (() => { let got = null; on('smoke:test', (p) => { got = p; }); emit('smoke:test', { ok: true }); return got && got.ok === true; })());

check('3 classes loaded', Object.keys(CLASSES).length === 3);
check('spells loaded', Object.keys(SPELLS).length >= 8);
check('locations loaded', Object.keys(LOCATIONS).length >= 10);
check('enemies loaded', Object.keys(ENEMIES).length >= 20);
check('achievements loaded', ACHIEVEMENTS.length >= 15);
check('effects loaded', Object.keys(EFFECTS).length >= 5);

state.game = { player: { exp: 0, level: 1 } };
addExp(30);
check('addExp increases exp', state.game.player.exp === 30);

state.game = { player: { hp: 80, maxHp: 80, mp: 10, maxMp: 10, str: 4, int: 12, wis: 8, con: 5, equipped: { weapon: null, armor: null }, effects: [], talents: [] } };
const eff = getEffStats();
check('getEffStats computes stats', eff.atk > 0 && eff.mag > 0);

state.game = { player: { hp: 80, maxHp: 80, mp: 10, maxMp: 10, str: 4, int: 12, wis: 8, con: 5, equipped: { weapon: null, armor: null }, effects: [], talents: [] } };
const st = state.game.player;
applyEffect(st, 'burn');
check('status: applyEffect/tick/hasEffect', hasEffect(st, 'burn'));

state.game = null;

if (results.some((r) => r.startsWith('FAIL'))) {
  console.error(results.join('\n'));
  process.exit(1);
}
console.log(results.join('\n'));
console.log('smoke-load: OK');
