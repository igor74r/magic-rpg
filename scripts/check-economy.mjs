import assert from 'node:assert/strict';
import { ITEMS } from '../data/items.js';
import { STORY } from '../data/story.js';
import { getCurrentActIndex, getActPriceMultiplier, getBuyPrice, getSellPrice } from '../systems/economy.js';
import { getMissionReward } from '../systems/campaign.js';

const player = { campaignClaimed: {} };
assert.equal(getCurrentActIndex(player), 0);
assert.equal(getActPriceMultiplier(player), 1);
assert.equal(getBuyPrice('health-potion', player), ITEMS['health-potion'].price);
assert.equal(getBuyPrice('mana-crystal', player), 0);
assert.equal(getBuyPrice('missing-item', player), 0);
assert.equal(getSellPrice({ id: 'mana-crystal', qty: 1 }, player), 0);
assert.ok(getSellPrice({ id: 'health-potion', qty: 3 }, player) >= 3);

for (let act = 0; act < STORY.acts.length; act++) {
  const missions = STORY.acts[act].missions;
  for (const mission of missions) {
    player.campaignClaimed[mission.id] = true;
  }
  if (act < 4) {
    assert.equal(getCurrentActIndex(player), act + 1);
    assert.equal(getActPriceMultiplier(player), [1, 1.2, 1.4, 1.6, 1.8][act + 1]);
  }
}
assert.equal(getCurrentActIndex(player), 4);
assert.equal(getBuyPrice('health-potion', player), Math.round(ITEMS['health-potion'].price * 1.8));

const rewards = [1, 2, 3, 4, 5].map(act => getMissionReward({ id: `a${act}-m1` }));
assert.deepEqual(rewards.map(r => r.gold), [18, 32, 50, 72, 100]);
assert.deepEqual(rewards.map(r => r.exp), [70, 145, 250, 390, 570]);
console.log('Economy checks passed');
