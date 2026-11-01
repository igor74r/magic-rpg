import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { NPCS } from '../data/npcs.js';

const nodes = new Map();
const node = id => {
  if (!nodes.has(id)) nodes.set(id, { innerHTML: '', style: {}, className: '', textContent: '', remove() {} });
  return nodes.get(id);
};
const originalDocument = globalThis.document;
const originalStorage = globalThis.localStorage;
const originalSetTimeout = globalThis.setTimeout;
globalThis.document = {
  getElementById: node,
  createElement: () => ({ className: '', textContent: '', remove() {} }),
  body: { appendChild() {} }
};
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
globalThis.setTimeout = () => 1;

try {
  const { payBardUI, petCatUI, takeElderBlessingUI, useWellUI, turnInElderQuestUI } = await import('../ui/npcs.js');
  state.currentSlot = 1;
  state.overworld = { active: true };
  state.game = {
    player: {
      name: 'NPC test', class: 'mage', level: 1, gold: 30,
      hp: 20, maxHp: 100, mp: 0, maxMp: 50,
      inventory: [], spells: [], equipped: {}, stats: {},
      buffs: [], effects: [], campaignKills: {}, campaignClaimed: {},
      activeCampaignMission: null
    },
    storyShards: { flame: false, ice: false, blood: false },
    storyDragons: { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false }
  };
  const p = state.game.player;

  assert.equal(NPCS.bard.cost, 15, 'bard cost must match the visible service price');
  assert.equal(payBardUI(), true);
  assert.equal(p.gold, 15);
  assert.equal(p.buffs.filter(b => b.id === 'bardBuff').length, 1);
  assert.equal(payBardUI(), false, 'bard service must not charge twice while its buff is active');
  assert.equal(p.gold, 15, 'duplicate bard call must not spend gold');

  assert.equal(petCatUI(), true);
  assert.equal(p.buffs.filter(b => b.id === 'catLuck').length, 1);
  assert.equal(petCatUI(), false, 'cat luck must not stack through repeated calls');
  assert.equal(p.buffs.filter(b => b.id === 'catLuck').length, 1);

  assert.equal(takeElderBlessingUI(), true);
  assert.equal(p.effects.filter(e => e.id === 'elderBlessing').length, 1);
  assert.equal(takeElderBlessingUI(), false, 'elder blessing must not stack through repeated calls');
  assert.equal(p.effects.filter(e => e.id === 'elderBlessing').length, 1);

  p.stats.lastWellUse = Date.now();
  p.hp = 10;
  assert.equal(useWellUI(), false, 'well cooldown must be enforced inside the service');
  assert.equal(p.hp, 10, 'blocked well use must not heal');
  p.stats.lastWellUse = 0;
  assert.equal(useWellUI(), true);
  assert.equal(p.hp, p.maxHp);
  assert.equal(p.mp, p.maxMp);
  const usedAt = p.stats.lastWellUse;
  p.hp = 10;
  assert.equal(useWellUI(), false, 'well cannot be reused within 24 hours');
  assert.equal(p.hp, 10);
  assert.equal(p.stats.lastWellUse, usedAt);
  state.game = {
    location: 'village',
    storyShards: { flame: false, ice: false, blood: false },
    storyDragons: { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false },
    player: {
      name: 'Reward test', class: 'mage', level: 1, exp: 0, expNext: 100,
      gold: 0, hp: 100, maxHp: 100, mp: 50, maxMp: 50, str: 1,
      inventory: Array.from({ length: 30 }, (_, index) => ({ id: 'iron-sword', qty: 1, testIndex: index })),
      spells: [], equipped: {}, stats: { kills: {} }, effects: [], buffs: [],
      campaignKills: { 'a1-m1': 3 }, campaignClaimed: {}, activeCampaignMission: 'a1-m1'
    }
  };
  const rewardPlayer = state.game.player;
  turnInElderQuestUI();
  assert.equal(rewardPlayer.campaignClaimed['a1-m1'], true, 'completed campaign mission should be claimed');
  assert.equal(rewardPlayer.inventory.length, 30, 'full inventory should remain unchanged');
  assert.ok(rewardPlayer.pendingLoot?.some(entry => entry.id === 'root-fiber' && entry.qty === 1), 'campaign material reward must be preserved in pending loot');
  console.log('check-npc-services: PASS (NPC service guards and campaign reward overflow storage)');
} finally {
  state.game = null;
  state.overworld = null;
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
  if (originalSetTimeout === undefined) delete globalThis.setTimeout;
  else globalThis.setTimeout = originalSetTimeout;
}
