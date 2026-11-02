import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, main, header, menu, css, inventory, shop, npcs] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../ui/header.js', import.meta.url), 'utf8'),
  readFile(new URL('../ui/menu.js', import.meta.url), 'utf8'),
  readFile(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8'),
  readFile(new URL('../ui/inventory.js', import.meta.url), 'utf8'),
  readFile(new URL('../ui/shop.js', import.meta.url), 'utf8'),
  readFile(new URL('../ui/npcs.js', import.meta.url), 'utf8')
]);

const tabs = [...html.matchAll(/<div class="(?:tab|settings-tab)[^"]*"[^>]*role="tab"[^>]*>/g)];
assert.equal(tabs.length, 14, 'all game and settings navigation items must expose tab semantics');
for (const [tag] of tabs) {
  assert.match(tag, /aria-selected="(?:true|false)"/);
  assert.match(tag, /aria-controls="(?:tab-content|settings-content)"/);
  assert.match(tag, /tabindex="(?:0|-1)"/);
}
assert.match(html, /id="tab-content" role="tabpanel" aria-labelledby="game-tab-locations" tabindex="0"/);
assert.match(html, /id="settings-content" role="tabpanel" aria-labelledby="settings-tab-sound" tabindex="0"/);
for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter']) {
  assert.ok(main.includes(`event.key === '${key}'`), `keyboard navigation missing ${key}`);
}
assert.match(main, /tabs\[nextIndex\]\.focus\(\)/);
assert.match(main, /tabs\[nextIndex\]\.click\(\)/);
assert.match(header, /setAttribute\('aria-selected', String\(active\)\)/);
assert.match(header, /setAttribute\('aria-labelledby', activeTab\.id\)/);
assert.match(menu, /setAttribute\('aria-selected', String\(active\)\)/);
assert.match(menu, /setAttribute\('aria-labelledby', activeTab\.id\)/);
assert.match(css, /\.settings-tab:focus-visible/);
const settingsControls = [
  'set-music-volume', 'set-sfx-volume', 'set-sound',
  'set-difficulty', 'set-autosave', 'set-autosave-interval', 'set-hotkeys', 'set-fps',
  'set-graphics-quality', 'set-weather-effects', 'set-ambient-fog', 'set-bloom-effects',
  'set-damage-numbers', 'set-screen-shake', 'set-low-health', 'set-reduced-motion'
];
for (const id of settingsControls) {
  assert.match(menu, new RegExp(`<label for="${id}">[^<]+</label>\\s*<(?:input|select)\\b[^>]*\\bid="${id}"`),
    `settings control ${id} must have an explicitly associated label`);
}
assert.match(menu, /aria-label="Удалить сохранение в слоте \${slot}"/,
  'icon-only save deletion buttons must have a descriptive accessible name');
assert.match(html, /id="npc-dialog-modal" class="npc-modal" style="display:none;" role="dialog" aria-modal="true" aria-label="Диалог с персонажем"/,
  'NPC dialogue must expose modal dialog semantics');
assert.match(npcs, /modal\.addEventListener\('keydown', event =>/,
  'NPC dialogue must handle keyboard input at the modal level');
assert.match(npcs, /if \(event\.key === 'Escape'\)/,
  'NPC dialogue must close with Escape');
assert.match(npcs, /if \(event\.key !== 'Tab'\) return;/,
  'NPC dialogue must contain keyboard Tab navigation');
assert.match(npcs, /npcDialogReturnFocus\?\.isConnected\) npcDialogReturnFocus\.focus\(\)/,
  'closing NPC dialogue must restore focus to its opener');
assert.match(npcs, /querySelector\('\.npc-modal-close'\)/,
  'NPC dialogue must move initial focus inside its modal');
assert.match(html, /id="game-log" role="log" aria-live="polite"/,
  'game log updates must be announced politely to assistive technology');
for (const [key, label] of [
  ['w', 'Двигаться вверх'], ['a', 'Двигаться влево'],
  ['d', 'Двигаться вправо'], ['s', 'Двигаться вниз']
]) {
  assert.match(html, new RegExp(`class="dpad-btn" data-key="${key}" aria-label="${label}"`),
    `mobile direction key ${key} must have a descriptive accessible name`);
}

assert.match(inventory, /data-inv-filter="\$\{key\}" aria-pressed="\$\{invFilter === key\}"/,
  'inventory filters must expose their selected state');
assert.match(inventory, /data-inv-sort="\$\{key\}" aria-pressed="\$\{invSort === key\}"/,
  'inventory sorting controls must expose their selected state');
assert.match(shop, /data-shop-preset="\$\{escapeHtml\(id\)\}" aria-pressed="\$\{shopPreset === id\}"/,
  'shop filters must expose their selected state');
assert.match(inventory, /role="dialog" aria-modal="true" aria-labelledby="inventory-sale-title"/,
  'sale overlay must expose modal dialog semantics');
assert.match(inventory, /if \(event.key === 'Escape'\) \{ event.preventDefault\(\); cancelSaleUI\(\); return; \}/,
  'sale dialog must close with Escape');
assert.match(inventory, /if \(saleReturnFocus\?\.isConnected\) saleReturnFocus\.focus\(\)/,
  'sale dialog must restore focus to its opener');
assert.match(inventory, /aria-label="Снять: \$\{escapeHtml\(label\)\}"/,
  'equipment removal controls must identify their slot');
console.log('check-accessibility: PASS (14 keyboard-operable tabs, 16 labelled settings controls, modal and live-region semantics)');
