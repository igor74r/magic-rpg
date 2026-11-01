import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { STORY } from '../data/story.js';
import { startNGPlus } from '../systems/ngplus.js';

const originalStorage = globalThis.localStorage;
const saved = new Map();
globalThis.localStorage = { setItem: (key, value) => saved.set(key, String(value)) };
state.currentSlot = 1;

try {
  const incomplete = {
    storyShards: { flame: false, ice: false, blood: false },
    storyDragons: { 'blood-crown': false },
    player: { class: 'mage', level: 12, ngPlus: 0, victoryAchieved: true }
  };
  state.game = incomplete;
  assert.equal(startNGPlus(), false, 'NG+ must not start before campaign completion');
  assert.equal(incomplete.player.level, 12);
  assert.equal(incomplete.player.ngPlus, 0);

  const claimed = Object.fromEntries(STORY.acts.flatMap(act => act.missions.map(mission => [mission.id, true])));
  const ready = {
    storyShards: { flame: true, ice: true, blood: true },
    storyDragons: { 'ash-herald': true, 'ice-grasp': true, 'blood-crown': true },
    riftEnding: 'open',
    player: {
      class: 'mage', name: 'NG+ test', level: 50, exp: 999, expNext: 1000,
      gold: 777, hp: 1, maxHp: 100, mp: 1, maxMp: 100,
      str: 20, int: 20, wis: 20, con: 20, dex: 20, luck: 20,
      statPoints: 0, passivePoints: 3, ngPlus: 2, victoryAchieved: true,
      inventory: [{ id: 'iron-sword', qty: 1 }], equipped: { weapon: { id: 'iron-sword', qty: 1 } },
      achievements: ['first-kill'], stats: { kills: { wolf: 20 }, deaths: 2 },
      weaponLevel: 2, armorLevel: 1, herbs: { 'herb-life': 3 }, talents: [],
      playtimeSec: 3600, campaignKills: {}, campaignClaimed: claimed,
      activeCampaignMission: null, craftingJobs: [{ id: 'pending-forge', result: 'steel-sword', qty: 1, readyAt: Date.now() + 3600000 }],
      craftedHighTierByAct: { 5: true }, pendingLoot: [{ id: 'health-potion', qty: 1 }],
      buffs: [{ id: 'bardBuff', duration: 2 }], effects: [{ id: 'poison', duration: 2 }]
    }
  };
  state.game = ready;
  const inventoryBefore = JSON.stringify(ready.player.inventory);
  const jobsBefore = JSON.stringify(ready.player.craftingJobs);
  const pendingBefore = JSON.stringify(ready.player.pendingLoot);
  assert.equal(startNGPlus(), true, 'NG+ should start after the final victory gate');
  assert.equal(ready.player.ngPlus, 3);
  assert.equal(ready.player.level, 1);
  assert.equal(ready.player.gold, 777);
  assert.equal(JSON.stringify(ready.player.inventory), inventoryBefore, 'inventory must carry into NG+');
  assert.equal(JSON.stringify(ready.player.craftingJobs), jobsBefore, 'queued crafting jobs must not be lost');
  assert.equal(JSON.stringify(ready.player.pendingLoot), pendingBefore, 'pending loot must not be lost');
  assert.deepEqual(ready.player.buffs, [], 'temporary buffs must not leak into the new cycle');
  assert.deepEqual(ready.player.effects, []);
  assert.deepEqual(ready.player.craftedHighTierByAct, {});
  assert.deepEqual(ready.player.campaignClaimed, {});
  assert.deepEqual(ready.storyShards, { flame: false, ice: false, blood: false });
  assert.equal(ready.player.victoryAchieved, false);
  assert.ok(saved.has('magic-rpg-save-1'), 'new cycle should be saved');
  console.log('check-ngplus: PASS (completion gate, preserved inventory/jobs/loot, reset temporary state)');
} finally {
  state.game = null;
  if (originalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalStorage;
}
