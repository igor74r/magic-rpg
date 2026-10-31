import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../assets/tiles/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.tileSize, 48);
assert.deepEqual(manifest.terrain.columns, ['grass', 'path', 'biome-object', 'liquid', 'rock']);
assert.equal(manifest.terrain.rows.length, 8);
for (const [biome, row] of Object.entries(manifest.biomeRows)) {
  assert.ok(Number.isInteger(row) && row >= 0 && row < manifest.terrain.rows.length, `invalid tile row for ${biome}`);
}

for (const asset of [
  'assets/tiles/terrain/atlas.svg',
  'assets/tiles/dungeons/atlas.svg',
  'assets/tiles/props/atlas.svg',
  'assets/branding/mana-crystal.svg',
  'audio/prologue.mp3'
]) {
  assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `missing asset: ${asset}`);
}

const dimensions = [
  ['assets/tiles/terrain/atlas.svg', 240, 384],
  ['assets/tiles/dungeons/atlas.svg', 480, 192],
  ['assets/tiles/props/atlas.svg', 384, 192]
];
for (const [path, width, height] of dimensions) {
  const svg = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  assert.match(svg, new RegExp(`width=["']${width}["']`), `${path} width mismatch`);
  assert.match(svg, new RegExp(`height=["']${height}["']`), `${path} height mismatch`);
}

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('assets/branding/mana-crystal.svg'));
assert.ok(html.includes('Тысячу лет Кристалл Маны хранил равновесие мира.'));
assert.ok(html.includes('assets/branding/mana-crystal.svg" alt="Кристалл Маны"'));

const renderer = readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8');
assert.ok(renderer.includes('getEventPropIndex'));
assert.ok(renderer.includes('drawAtlasProp(ctx, eventPropIndex'));
const styles = readFileSync(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8');
assert.ok(styles.includes('#mobile-dpad .dpad-btn'));
assert.ok(styles.includes('prefers-reduced-motion'));

console.log('Visual assets, tile manifests, branding and responsive UI checks passed');
