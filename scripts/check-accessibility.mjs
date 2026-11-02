import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, main, header, menu, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../main.js', import.meta.url), 'utf8'),
  readFile(new URL('../ui/header.js', import.meta.url), 'utf8'),
  readFile(new URL('../ui/menu.js', import.meta.url), 'utf8'),
  readFile(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8')
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
  assert.match(menu, new RegExp(`<label for="${id}">[^<]+</label>\\s*<(?:input|select) id="${id}"`),
    `settings control ${id} must have an explicitly associated label`);
}
assert.match(menu, /aria-label="Удалить сохранение в слоте \${slot}"/,
  'icon-only save deletion buttons must have a descriptive accessible name');
assert.match(html, /id="npc-dialog-modal" class="npc-modal" style="display:none;" role="dialog" aria-modal="true" aria-label="Диалог с персонажем"/,
  'NPC dialogue must expose modal dialog semantics');
assert.match(html, /id="game-log" role="log" aria-live="polite"/,
  'game log updates must be announced politely to assistive technology');

console.log('check-accessibility: PASS (14 keyboard-operable tabs, selected state and tab panels)');
