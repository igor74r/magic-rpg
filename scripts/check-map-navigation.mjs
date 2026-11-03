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

const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const spawn = readFileSync(new URL('../systems/overworld/spawn.js', import.meta.url), 'utf8');
assert.match(main, /enterOverworld\('village'\)/, 'new heroes must start inside Aurora');
assert.match(main, /openWorldPortalMenu,/, 'the sidebar world portal action must be exposed');
assert.match(html, /id="screen-overworld" class="dashboard-overworld"/, 'the location scene must live inside the dashboard');
assert.doesNotMatch(html, /id="game-tab-locations"/, 'the world map must not be a sidebar tab');
assert.match(html, /onclick="GameAPI\.interactNpc\('world-portal'\)"/, 'the world map must be accessed through the village portal system');
assert.doesNotMatch(main, /data-world-tower/, 'the world portal menu must not contain a tower shortcut');
assert.doesNotMatch(header, /data-header-action="tower"/, 'the HUD must not duplicate the village tower gate');
assert.doesNotMatch(map, /GameAPI\.enterTower\(\)/, 'the map panel must not duplicate the village tower gate');
assert.match(spawn, /id: 'world-waystone'/, 'other locations keep their world map portal');
assert.doesNotMatch(spawn, /id: 'tower-gate'/, 'other locations must not spawn tower gates');
assert.match(main, /classList\.add\('overworld-active'\)/, 'the village scene must retain the dashboard side panels');
assert.match(main, /classList\.remove\('overworld-active'\)/, 'leaving a location must restore dashboard content');
