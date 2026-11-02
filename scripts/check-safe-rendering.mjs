import assert from 'node:assert/strict';
import { escapeHtml } from '../ui/screens.js';
import { state } from '../systems/state.js';
import { renderInventory, buildTooltipHTML } from '../ui/inventory.js';

assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
assert.equal(escapeHtml("O'Neil & Sons"), 'O&#39;Neil &amp; Sons');
assert.equal(escapeHtml(null), '');
assert.equal(escapeHtml(42), '42');
const importedJobResult = '<svg onload=alert(1)>';
assert.equal(escapeHtml(importedJobResult), '&lt;svg onload=alert(1)&gt;');
const previousGame = state.game;
state.game = {
  player: {
    name: 'Safe render test', class: 'warrior', level: 1, gold: 0, str: 10,
    inventory: [{
      id: 'iron-sword', qty: 1, rarity: '" onmouseover="alert(1)',
      forgeLevel: '<svg onload=alert(1)>',
      affixes: [{ name: '<img src=x onerror=alert(1)>' }],
      runes: [], sockets: 1
    }],
    equipped: {
      weapon: {
        id: 'iron-sword', qty: 1, rarity: 'common',
        forgeLevel: '<svg onload=alert(2)>',
        affixes: [{ name: '<script>alert(2)</script>' }],
        runes: [], sockets: 1
      }
    },
    pendingLoot: [{ id: 'health-potion', qty: '<img src=x onerror=alert(3)>' }]
  }
};
try {
  const inventoryHtml = renderInventory();
  const importedTooltip = buildTooltipHTML(state.game.player.inventory[0]);
  assert.ok(importedTooltip.includes('&lt;img src=x onerror=alert(1)&gt;'), 'imported affix name must be escaped in tooltip');
  assert.ok(inventoryHtml.includes('&lt;script&gt;alert(2)&lt;/script&gt;'), 'equipped affix name must be escaped');
  assert.ok(!importedTooltip.includes('<img src=x onerror=alert(1)>'), 'raw imported affix HTML must not enter tooltip markup');
  assert.ok(!inventoryHtml.includes('<img src=x onerror=alert(1)>'), 'raw affix HTML must not enter inventory markup');
  assert.ok(!inventoryHtml.includes('<svg onload=alert(1)>'), 'invalid forge levels must not enter inventory markup');
  assert.ok(!inventoryHtml.includes('onmouseover="alert(1)'), 'invalid rarity must not enter class attributes');
  assert.ok(!inventoryHtml.includes('<img src=x onerror=alert(3)>'), 'invalid pending-loot quantities must not enter markup');
} finally {
  state.game = previousGame;
}
console.log('check-safe-rendering: PASS (text, quotes and markup are escaped)');
