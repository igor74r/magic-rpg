import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../assets/tiles/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.tileSize, 96);
assert.equal(manifest.terrain.displaySize, 48);
assert.deepEqual(manifest.terrain.columns, ['grass', 'path', 'biome-object', 'liquid', 'rock']);
assert.equal(manifest.terrain.rows.length, 8);
for (const [biome, row] of Object.entries(manifest.biomeRows)) {
  assert.ok(Number.isInteger(row) && row >= 0 && row < manifest.terrain.rows.length, `invalid tile row for ${biome}`);
}

for (const asset of [
  'assets/tiles/terrain/atlas.png',
  'assets/tiles/dungeons/atlas.png',
  'assets/tiles/props/atlas.png',
  'assets/branding/mana-crystal.png',
  'audio/prologue.mp3',
  'css/2d-art-direction.css'
]) assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `missing asset: ${asset}`);

const pngAssets = ['assets/tiles/terrain/atlas.png','assets/tiles/dungeons/atlas.png','assets/tiles/props/atlas.png','assets/branding/mana-crystal.png'];
for (const asset of pngAssets) assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `missing PNG: ${asset}`);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('Три дракона удерживают его закрытым.'));
assert.ok(html.includes('Первые кровавые маги создали Кристалл Разлома'));
assert.ok(html.includes('css/2d-art-direction.css'));

const renderer = readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8');
assert.ok(renderer.includes('getEventPropIndex'));
assert.ok(renderer.includes('drawAtlasProp(ctx, eventPropIndex'));
const atlasRenderer = readFileSync(new URL('../ui/overworld/tile-atlas.js', import.meta.url), 'utf8');
assert.ok(atlasRenderer.includes('const TILE_SIZE = 96'));
assert.ok(atlasRenderer.includes("ctx.imageSmoothingEnabled = false"));
const styles = readFileSync(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8');
assert.ok(styles.includes('#mobile-dpad .dpad-btn'));
assert.ok(styles.includes('prefers-reduced-motion'));

console.log('2D art assets, high-resolution terrain atlas, tile manifest and responsive UI checks passed');



