import assert from 'node:assert/strict';
import { ITEMS } from '../data/items.js';
import { STORY } from '../data/story.js';
import { getCurrentActIndex, getActPriceMultiplier, getBuyPrice, getSellPrice } from '../systems/economy.js';
import { getMissionReward } from '../systems/campaign.js';
import { state } from '../systems/state.js';
import { buyItem, buybackItem } from '../systems/shop.js';
import { NPCS } from '../data/npcs.js';

const player = { campaignClaimed: {} };
assert.equal(getCurrentActIndex(player), 0);
assert.equal(getActPriceMultiplier(player), 1);
assert.equal(getBuyPrice('health-potion', player), ITEMS['health-potion'].price);
assert.equal(getBuyPrice('old-archive-seal', player), 0);
assert.equal(getBuyPrice('missing-item', player), 0);
assert.equal(getSellPrice({ id: 'old-archive-seal', qty: 1 }, player), 0);
assert.equal(getBuyPrice('shard-flame', player), 0);
assert.equal(getSellPrice({ id: 'shard-flame', qty: 1 }, player), 0);
assert.equal(getSellPrice({ id: 'iron-sword', rarity: 'mythic' }, player), 0);
assert.equal(getSellPrice({ id: 'iron-sword', rarity: 'epic' }, player), Math.floor(150 * 0.35));
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
assert.equal(getSellPrice({ id: 'health-potion', qty: 1 }, player), Math.floor(ITEMS['health-potion'].price * 1.8 * 0.35));


// Direct purchase calls must respect the merchant's actual stock, not just item prices.
const originalStorage = globalThis.localStorage;
const saved = new Map();
globalThis.localStorage = { setItem: (key, value) => saved.set(key, String(value)) };
state.currentSlot = 1;
state.game = { version: 17, player: { gold: 1000, str: 10, inventory: [], stats: { kills: {} } } };
const buyer = state.game.player;
assert.ok(getBuyPrice('steel-sword', buyer) > 0);
assert.equal(NPCS.merchant.stock.includes('steel-sword'), false);
assert.equal(buyItem('steel-sword'), false, 'unlisted gear must not be purchasable through the public API');
assert.equal(buyer.gold, 1000);
assert.equal(buyer.inventory.length, 0);
assert.equal(buyItem('iron-sword'), true, 'listed stock must remain purchasable');
assert.equal(buyer.gold, 1000 - getBuyPrice('iron-sword', buyer));
assert.equal(buyer.inventory[0]?.id, 'iron-sword');
buyer.buyback = [{ id: 'bad-price', soldAt: new Date().toDateString(), price: -500, item: { id: 'iron-sword', qty: 1 } }];
assert.equal(buybackItem(0).ok, false, 'negative buyback price must be rejected');
assert.equal(buyer.gold, 1000 - getBuyPrice('iron-sword', buyer), 'invalid buyback must not create gold');
buyer.buyback = [{ id: 'bad-qty', soldAt: new Date().toDateString(), price: 1, item: { id: 'iron-sword', qty: 0 } }];
assert.equal(buybackItem(0).ok, false, 'zero buyback quantity must be rejected');
assert.equal(buyer.inventory.length, 1, 'invalid buyback must not add an item');
state.game = null;
if (originalStorage === undefined) delete globalThis.localStorage;
else globalThis.localStorage = originalStorage;

const rewards = [1, 2, 3, 4, 5].map(act => getMissionReward({ id: `a${act}-m1` }));
assert.deepEqual(rewards.map(r => r.gold), [18, 32, 50, 72, 100]);
assert.deepEqual(rewards.map(r => r.exp), [70, 145, 250, 390, 570]);
console.log('Economy checks passed');
