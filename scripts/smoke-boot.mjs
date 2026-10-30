// scripts/smoke-boot.mjs
// Boot-smoke: поднимает main.js в Node с минимальными заглушками DOM/Canvas/Audio,
// создаёт героя, входит в overworld, двигается, переключает вкладки, открывает NPC,
// проводит бой и сохраняется. Ловит ReferenceError и разрывы контрактов, которые
// не видны при `node --check` (например, импорт несуществующего экспорта).
// Ничего в браузере и localStorage не трогает — всё замокано.

const ROOT = new URL('..', import.meta.url);

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
  check('overworld/движение', false, String(e && e.message));
}

// Вкладки дашборда
try {
  for (const tab of ['locations', 'inventory', 'spells', 'quests', 'achievements', 'statistics', 'talents', 'bestiary']) {
    api.switchTab(tab);
  }
  check('вкладки дашборда рендерятся', true);
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
  state.game.location = 'forest';
  api.enterOverworld();
  frame(2);

  const ow = state.overworld;
  const enemy = ow.enemies.find((e) => !e.dead);
  if (!enemy) throw new Error('враги не заспавнились');

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
} catch (e) {
  check('бой', false, String(e && e.message));
}

// Сохранение в слот
try {
  api.saveAndMenu();
  check('сохранение в слот 1', storage.has('magic-rpg-save-1'));
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
