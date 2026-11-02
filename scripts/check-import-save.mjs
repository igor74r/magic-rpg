import assert from 'node:assert/strict';
import { state } from '../systems/state.js';

const originalDocument = globalThis.document;
const originalStorage = globalThis.localStorage;
const originalFileReader = globalThis.FileReader;
const originalConfirm = globalThis.confirm;
const originalSetTimeout = globalThis.setTimeout;

const nodes = new Map();
globalThis.document = {
  createElement: () => ({ className: '', textContent: '', setAttribute() {}, remove() {} }),
  body: { appendChild() {} }
};
const storage = new Map([['magic-rpg-save-1', 'KEEP-EXISTING-SAVE']]);
let failImportWrite = false;
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => {
    storage.set(key, String(value));
    if (failImportWrite && key === 'magic-rpg-save-1') {
      failImportWrite = false;
      throw new Error('simulated storage quota failure after partial write');
    }
  },
  removeItem: key => storage.delete(key)
};
globalThis.confirm = () => true;
globalThis.setTimeout = () => 1;

let fileContent = '';
globalThis.FileReader = class {
  readAsText() { this.onload({ target: { result: fileContent } }); }
};

try {
  const { importSave } = await import('../ui/menu.js');
  state.currentSlot = 1;
  let readCalls = 0;
  globalThis.FileReader.prototype.readAsText = function () {
    readCalls++;
    this.onload({ target: { result: fileContent } });
  };
  const runImport = content => {
    fileContent = JSON.stringify(content);
    const event = { target: { files: [{ size: fileContent.length }], value: 'selected.json' } };
    importSave(event);
    return event;
  };

  const oversizedEvent = { target: { files: [{ size: 6 * 1024 * 1024 }], value: 'oversized.json' } };
  importSave(oversizedEvent);
  assert.equal(readCalls, 0, 'oversized save must be rejected before reading');
  assert.equal(storage.get('magic-rpg-save-1'), 'KEEP-EXISTING-SAVE');

  runImport({ version: 999, player: { name: 'Future save', level: 10 } });
  assert.equal(storage.get('magic-rpg-save-1'), 'KEEP-EXISTING-SAVE', 'unsupported future save must not overwrite the slot');

  runImport({ version: 17, player: { name: 'Broken save', level: 10 } });
  assert.equal(storage.get('magic-rpg-save-1'), 'KEEP-EXISTING-SAVE', 'incomplete current save must not overwrite the slot');

  const legacy = {
    version: 16,
    location: 'village',
    player: {
      name: 'Legacy hero', class: 'mage', level: 5, exp: 0, expNext: 100,
      gold: 50, hp: 80, maxHp: 100, mp: 30, maxMp: 50,
      str: 5, int: 8, wis: 5, con: 5, dex: 5, luck: 5,
      inventory: [{ id: 'mana-crystal', qty: 1 }],
      spells: [], equipped: {}, stats: {}, campaignKills: {}, campaignClaimed: {},
      activeCampaignMission: null, effects: [], buffs: []
    },
    storyShards: { flame: false, ice: false, blood: false },
    storyDragons: { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false }
  };
  failImportWrite = true;
  runImport(legacy);
  assert.equal(storage.get('magic-rpg-save-1'), 'KEEP-EXISTING-SAVE', 'failed import write must restore the previous slot');

  runImport(legacy);
  const imported = JSON.parse(storage.get('magic-rpg-save-1'));
  assert.equal(imported.version, 17, 'legacy save should be migrated before storage');
  assert.equal(imported.player.inventory[0].id, 'old-archive-seal', 'legacy quest item migration should be retained');
  assert.equal(imported.player.name, 'Legacy hero');
  console.log('check-import-save: PASS (invalid files and failed writes preserve existing saves; legacy saves migrate before import)');
} finally {
  state.game = null;
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
  if (originalFileReader === undefined) delete globalThis.FileReader;
  else globalThis.FileReader = originalFileReader;
  if (originalConfirm === undefined) delete globalThis.confirm;
  else globalThis.confirm = originalConfirm;
  if (originalSetTimeout === undefined) delete globalThis.setTimeout;
  else globalThis.setTimeout = originalSetTimeout;
}
