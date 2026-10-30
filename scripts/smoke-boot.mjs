// scripts/smoke-boot.mjs
// Boot-smoke: поднимает main.js в Node с минимальными заглушками DOM/Canvas/Audio,
// создаёт героя, входит в overworld, двигается, переключает вкладки, открывает NPC,
// проводит бой и сохраняется. Ловит ReferenceError и разрывы контрактов, которые
// не видны при `node --check` (например, импорт несуществующего экспорта).
// Ничего в браузере и localStorage не трогает — всё замокано.

const ROOT = new URL('..', import.meta.url);
const { LOCATIONS } = await import(new URL('data/locations.js', ROOT).href);
const { STORY } = await import(new URL('data/story.js', ROOT).href);

// ---------- заглушки Canvas ----------
const gradient = { addColorStop() {} };
const ctx = new Proxy({}, {
  get(target, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient' || prop === 'createPattern') return () => gradient;
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'getImageData') return () => ({ data: [] });
    if (prop === 'canvas') return { width: 800, height: 500 };
    if (prop in target) return target[prop];
    return () => {};
  },
  set(target, prop, value) { target[prop] = value; return true; },
});

// ---------- заглушки DOM ----------
const elements = new Map();

function makeElement(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(), id: '', className: '', innerHTML: '', textContent: '',
    value: 'Герой', checked: false, style: {}, dataset: {},
    width: 800, height: 500, scrollTop: 0, scrollHeight: 0,
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { el.children.push(child); return child; },
    removeChild() {}, remove() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    querySelectorAll() { return []; }, querySelector() { return null; },
    closest() { return null; }, focus() {}, blur() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 500, right: 800, bottom: 500 }; },
    getContext() { return ctx; }, toDataURL() { return ''; },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
  };
  return el;
}

function byId(id) {
  if (!elements.has(id)) { const el = makeElement(); el.id = id; elements.set(id, el); }
  return elements.get(id);
}

const body = makeElement('body');
const documentStub = {
  body,
  hidden: false,
  getElementById: byId,
  querySelectorAll(sel) {
    if (sel === '.screen') return [...elements.values()].filter((e) => e.id.startsWith('screen-'));
    return [];
  },
  querySelector() { return null; },
  createElement(tag) { return makeElement(tag); },
  addEventListener() {}, removeEventListener() {},
};

// ---------- заглушки хранилища/аудио/окна ----------
const storage = new Map();
const localStorageStub = {
  getItem(k) { return storage.has(k) ? storage.get(k) : null; },
  setItem(k, v) { storage.set(k, String(v)); },
  removeItem(k) { storage.delete(k); },
  clear() { storage.clear(); },
  key(i) { return [...storage.keys()][i] ?? null; },
  get length() { return storage.size; },
};

const listeners = new Map();
const rafQueue = [];
let rafSeq = 1;

const windowStub = {
  innerWidth: 1280, innerHeight: 800,
  addEventListener(type, cb) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(cb);
  },
  removeEventListener() {},
  matchMedia() { return { matches: false, addEventListener() {} }; },
  localStorage: localStorageStub,
  requestAnimationFrame(cb) { rafQueue.push(cb); return rafSeq++; },
  cancelAnimationFrame() {},
  speechSynthesis: undefined,
  AudioContext: class {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    createGain() {
      return {
        gain: {
          value: 1, setValueAtTime() {}, linearRampToValueAtTime() {},
          cancelScheduledValues() {}, setTargetAtTime() {},
        },
        connect() {}, disconnect() {},
      };
    }
    createMediaElementSource() { return { connect() {}, disconnect() {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(1) }; }
    createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {}, onended: null }; }
    createOscillator() { return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
    createBiquadFilter() { return { frequency: { value: 0 }, connect() {} }; }
    resume() { return Promise.resolve(); }
    decodeAudioData() { return Promise.resolve({}); }
  },
};

class AudioStub {
  constructor(src) { this.src = src; this.volume = 1; this.loop = false; this.paused = true; this.currentTime = 0; }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  addEventListener() {}
}

globalThis.window = windowStub;
globalThis.document = documentStub;
globalThis.localStorage = localStorageStub;
globalThis.Audio = AudioStub;
globalThis.AudioContext = windowStub.AudioContext;
globalThis.requestAnimationFrame = windowStub.requestAnimationFrame;
globalThis.cancelAnimationFrame = windowStub.cancelAnimationFrame;
globalThis.confirm = () => true;
globalThis.alert = () => {};
globalThis.matchMedia = windowStub.matchMedia;

// ---------- проверки ----------
const results = [];
const runtimeErrors = [];

function check(name, ok, extra = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  return ok;
}

process.on('uncaughtException', (e) => runtimeErrors.push('uncaught: ' + (e && e.message)));
process.on('unhandledRejection', (e) => runtimeErrors.push('rejection: ' + (e && e.message)));

let ts = 0;
function frame(count = 1) {
  for (let i = 0; i < count; i++) {
    const callbacks = rafQueue.splice(0);
    ts += 16;
    for (const cb of callbacks) cb(ts);
  }
}

function key(type, code) {
  for (const cb of listeners.get(type) || []) cb({ code, key: code, preventDefault() {} });
}

storage.set('magic-rpg-prologue-seen', '1');

let api;
try {
  await import(new URL('main.js', ROOT).href);
  api = windowStub.GameAPI;
  check('main.js загружается', true);
} catch (e) {
  check('main.js загружается', false, String(e && e.message));
}

if (!api) {
  console.log(results.join('\n'));
  console.log('\nsmoke-boot: FAILED (boot)');
  process.exit(1);
}

check('window.GameAPI доступен', Object.keys(api).length > 0, `${Object.keys(api).length} методов`);

const { state } = await import(new URL('systems/state.js', ROOT).href);

// Новая игра
try {
  api.selectClass('mage');
  api.confirmClassSelection();
  check('герой создан', state.game?.player?.class === 'mage');
} catch (e) {
  check('герой создан', false, String(e && e.message));
}

// Деревня + движение
try {
  api.enterOverworld();
  check('вход в overworld (village)', state.overworld?.locationId === 'village', state.overworld?.locationId);
  frame(3);

  const before = { x: state.overworld.player.x, y: state.overworld.player.y };
  key('keydown', 'KeyD');
  frame(30);
  key('keyup', 'KeyD');
  const moved = state.overworld.player.x !== before.x || state.overworld.player.y !== before.y;
  check('движение WASD', moved);
} catch (e) {
  check('overworld/движение', false, String(e && (e.stack || e.message)));
}

// Вкладки дашборда
try {
  for (const tab of ['locations', 'inventory', 'spells', 'quests', 'achievements', 'statistics', 'talents', 'bestiary', 'chronicles']) {
    api.switchTab(tab);
  }
  check('вкладки дашборда рендерятся', true);
  check('хроники мира рендерятся', byId('tab-content').innerHTML.includes('chronicles-page'));
  api.switchTab('talents');
  const talentHtml = byId('tab-content').innerHTML;
  check('дерево талантов можно перемещать мышью и касанием', talentHtml.includes('passive-tree-viewport') && talentHtml.includes('passiveTreePointerDown'));
  api.switchTab('inventory');
  const inventoryHtml = byId('tab-content').innerHTML;
  check('инвентарь рендерит 12 слотов экипировки и категории', inventoryHtml.includes('rpg-inventory-layout') && inventoryHtml.includes('Голова') && inventoryHtml.includes('Палец 2') && inventoryHtml.includes('Руны') && (inventoryHtml.match(/class="gear-slot /g) || []).length === 12);
} catch (e) {
  check('вкладки дашборда рендерятся', false, String(e && e.message));
}

// Контракт инвентаря (регрессия: метод был потерян при распиле)
try {
  api.invSlotClick(0);
  check('GameAPI.invSlotClick вызывается', true);
} catch (e) {
  check('GameAPI.invSlotClick вызывается', false, String(e && e.message));
}

// Карта локаций: все доступные узлы должны отображаться, выбор работает
try {
  api.switchTab('locations');
  const html = byId('tab-content').innerHTML;
  const nodes = (html.match(/class="wnode(?=[\s"])/g) || []).length;
  check('карта: все локации отображаются', nodes === Object.keys(LOCATIONS).length, `${nodes}/${Object.keys(LOCATIONS).length} узлов`);
  api.mapSelect('forest');
  check('карта: выбор узла', true);
} catch (e) {
  check('карта локаций', false, String(e && e.message));
}

// NPC-диалоги
try {
  const npcActions = [
    'openBlacksmith', 'openHealer', 'openAlchemist', 'openMerchant', 'openElder',
    'openWell', 'openBard', 'openGuard', 'openCat', 'openKids', 'openHerald', 'openDailyChest',
  ];
  for (const fn of npcActions) if (typeof api[fn] === 'function') api[fn]();
  if (typeof api.closeNpcAndResume === 'function') api.closeNpcAndResume();
  check('NPC-диалоги открываются/закрываются', true);
} catch (e) {
  check('NPC-диалоги открываются/закрываются', false, String(e && e.message));
}

// Бой: деревня безопасна, поэтому переходим в лес
try {
  api.exitOverworld?.();
  state.game.location = 'briar-hollow';
  api.enterOverworld();
  frame(2);

  const ow = state.overworld;
  const firstMission = STORY.acts[0].missions[0];
  api.openElder();
  api.acceptElderQuest();
  check('Старейшина выдаёт принятое сюжетное поручение', state.game.player.activeCampaignMission === firstMission.id);
  const enemy = ow.enemies.find((e) => !e.dead && e.enemyId === firstMission.enemyId);
  if (!enemy) throw new Error('враг первого поручения не заспавнился');
  const actEnemyIds = LOCATIONS['briar-hollow'].enemies;
  const spawnedIds = new Set(ow.enemies.map(e => e.enemyId));
  check('все враги акта, включая босса, появляются на карте', actEnemyIds.every(id => spawnedIds.has(id)));

  enemy.x = ow.player.x;
  enemy.y = ow.player.y;
  frame(1);
  check('бой начинается при столкновении', !!state.overworld.combat, enemy.enemyId);

  for (const action of ['owCast', 'owUseItem', 'owBlock', 'owUseAbility']) {
    if (!state.overworld.combat) break;
    api[action](action === 'owCast' ? state.game.player.spells[0] : 'mana-potion');
    frame(8);
  }
  check('боевые действия выполняются', true);

  // Добиваем врага и проверяем, что цикл боя закрывается
  if (state.overworld.combat) {
    state.overworld.combat.enemy.hp = 1;
    state.overworld.combat.enemy.maxHp = 1;
    state.overworld.combat.turn = 'player';
    api.owAttack();
    frame(12);
    if (state.overworld.combat) {
      state.overworld.combat.turn = 'player';
      api.owAttack();
      frame(12);
    }
  }
  check('бой завершается победой', !state.overworld.combat, state.overworld.combat ? 'бой не закрылся' : '');
  const campaignMission = STORY.acts.flatMap(act => act.missions).find(mission => mission.id === firstMission.id);
  check('убийство учитывается в принятом поручении правильного региона', !!campaignMission && state.game.player.campaignKills?.[campaignMission.id] === 1);
  state.game.player.campaignKills[firstMission.id] = firstMission.count;
  const goldBeforeTurnIn = state.game.player.gold;
  api.openElder();
  api.turnInElderQuest();
  check('Эдвин принимает выполненное поручение и выдаёт награду', state.game.player.campaignClaimed?.[firstMission.id] === true && state.game.player.gold > goldBeforeTurnIn && state.game.player.activeCampaignMission === null);
  api.openElder();
  check('после сдачи Эдвин предлагает следующее поручение', byId('npc-dialog-content').innerHTML.includes(STORY.acts[0].missions[1].title));
} catch (e) {
  check('бой', false, String(e && e.message));
}

// Сохранение в слот
try {
  api.saveAndMenu();
  check('сохранение в слот 1', storage.has('magic-rpg-save-1'));
  api.startNGPlus();
  check('NG+ начинает кампанию заново', Object.keys(state.game.player.campaignKills || {}).length === 0 && Object.keys(state.game.player.campaignClaimed || {}).length === 0 && state.game.player.activeCampaignMission === null && state.game.player.dex === (state.game.player.class === 'mage' ? 8 : state.game.player.class === 'archer' ? 18 : 6));
} catch (e) {
  check('сохранение в слот 1', false, String(e && e.message));
}

if (runtimeErrors.length > 0) results.push('RUNTIME ERRORS:\n' + runtimeErrors.join('\n'));

const failed = results.filter((r) => r.startsWith('FAIL'));
console.log(results.join('\n'));

if (failed.length > 0 || runtimeErrors.length > 0) {
  console.log(`\nsmoke-boot: FAILED (${failed.length} проверок, ${runtimeErrors.length} ошибок)`);
  process.exit(1);
}

console.log(`\nsmoke-boot: OK (${results.length} проверок)`);
process.exit(0);
