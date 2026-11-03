import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const map = readFileSync(new URL('../ui/locations.js', import.meta.url), 'utf8');
const theme = readFileSync(new URL('../css/theme.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8');
const header = readFileSync(new URL('../ui/header.js', import.meta.url), 'utf8');
assert.match(map, /map-route-summary/);
assert.match(map, /Следующая точка/);
assert.ok(map.includes('map-story-link ${routeState}'));
assert.match(map, /lockDetail/);
assert.match(map, /map-route-count/);
assert.match(theme, /\.map-route-summary/);
assert.match(theme, /\.map-links line\.map-story-link\.open/);
assert.match(theme, /\.map-links line\.map-story-link\.locked/);
assert.match(theme, /prefers-reduced-motion:reduce/);
console.log('World map route guidance checks passed.');

assert.match(header, /syncMapFocusedLayout\(state\.currentTab\)/,
  'initial game render must restore the map-focused layout');
assert.match(header, /classList\.toggle\('map-focused', tab === 'locations'\)/,
  'switching tabs must enable the wide layout only for the world map');
assert.match(layout, /#screen-game\.map-focused \.dashboard-sidebar[\s\S]*?flex-direction: row/,
  'map navigation must move into a horizontal top bar');
assert.match(layout, /#screen-game\.map-focused \.dashboard-log\s*\{\s*display: none !important;/,
  'the side journal must not steal map width');
assert.match(layout, /#screen-game\.map-focused \.world-map\s*\{[\s\S]*?height: clamp\(500px/,
  'the world map must use a wider, taller viewport');
assert.match(layout, /@media \(max-width: 700px\)[\s\S]*?#screen-game\.map-focused \.world-map/,
  'the enlarged map layout must remain responsive on mobile');
