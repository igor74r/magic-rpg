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
assert.match(html, /id="tab-content" role="tabpanel" tabindex="0"/);
assert.match(html, /id="settings-content" role="tabpanel" tabindex="0"/);
for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter']) {
  assert.ok(main.includes(`event.key === '${key}'`), `keyboard navigation missing ${key}`);
}
assert.match(main, /tabs\[nextIndex\]\.focus\(\)/);
assert.match(main, /tabs\[nextIndex\]\.click\(\)/);
assert.match(header, /setAttribute\('aria-selected', String\(active\)\)/);
assert.match(menu, /setAttribute\('aria-selected', String\(active\)\)/);
assert.match(css, /\.settings-tab:focus-visible/);

console.log('check-accessibility: PASS (14 keyboard-operable tabs, selected state and tab panels)');
