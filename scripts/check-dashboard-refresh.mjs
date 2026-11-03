import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const css = await readFile('css/dashboard-refresh.css', 'utf8');
const link = html.indexOf('css/dashboard-refresh.css');
assert.ok(link > html.indexOf('css/2d-art-direction.css'), 'dashboard refresh must load after existing visual layers');
assert.match(html, /id="screen-game" class="screen screen-dashboard"/, 'dashboard root hook must remain stable');
for (const selector of [
  '#screen-game .dashboard-layout',
  '#screen-game .dashboard-sidebar',
  '#screen-game .dashboard-main',
  '#screen-game .dashboard-log',
  '#screen-game #overworld-canvas',
  '#dashboard-tab-modal .dashboard-tab-dialog'
]) assert.ok(css.includes(selector), `missing refreshed layout selector: ${selector}`);
assert.match(css, /grid-template-columns:\s*minmax\(194px, 218px\) minmax\(0, 1fr\) minmax\(250px, 282px\)/,
  'desktop dashboard must preserve three usable columns');
assert.match(css, /@media \(max-width: 1050px\)[\s\S]*?dashboard-log\s*\{\s*display:\s*none/s,
  'right journal must collapse cleanly on narrower screens');
assert.match(css, /@media \(max-width: 720px\)[\s\S]*?dashboard-tablist[\s\S]*?overflow-x:\s*auto/s,
  'mobile navigation must become horizontally scrollable');
assert.match(css, /:focus-visible/, 'keyboard focus indicators must remain visible');
assert.match(css, /prefers-reduced-motion/, 'reduced-motion preference must be respected');
assert.match(css, /#dashboard-tab-modal\s*\{\s*z-index:\s*100000/, 'tab dialog must remain above the game shell');
assert.match(css, /hud-overview-vitals[\\s\\S]*?grid-template-columns:\\s*repeat\\(3, minmax\\(0, 1fr\\)\\)/,
  'hero HUD must render health, class resource and experience as three cards');
assert.match(css, /hud-overview-details[\\s\\S]*?justify-content:\\s*flex-end/,
  'combat details must remain in a separate collapsible area');
assert.match(css, /hud-details-panel\\[hidden\\]\\s*\\{\\s*display:\\s*none !important/s,
  'collapsed combat details must not occupy screen space');
console.log('Dashboard refresh layout contract passed.');
