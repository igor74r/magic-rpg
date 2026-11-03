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
  'assets/aurora/ground-atlas.png',
  'assets/tiles/dungeons/atlas.png',
  'assets/tiles/props/atlas.png',
  'assets/branding/mana-crystal.png',
  'audio/prologue.mp3',
  'css/2d-art-direction.css'
]) assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `missing asset: ${asset}`);

const groundPng = readFileSync(new URL('../assets/aurora/ground-atlas.png', import.meta.url));
assert.equal(groundPng.readUInt32BE(16), 768, 'Aurora ground atlas must contain four variants for each of two terrain types');
assert.equal(groundPng.readUInt32BE(20), 96, 'Aurora ground atlas must be 96px high');
assert.equal(manifest.auroraGround?.columns, 8, 'Aurora ground atlas must define eight variants');
assert.deepEqual(manifest.auroraGround?.types, ['grass', 'path']);
const pngAssets = ['assets/aurora/ground-atlas.png','assets/tiles/terrain/atlas.png','assets/tiles/dungeons/atlas.png','assets/tiles/props/atlas.png','assets/branding/mana-crystal.png'];
const villageArt = readFileSync(new URL('../ui/overworld/aurora-art.js', import.meta.url), 'utf8');
assert.ok(villageArt.includes('drawAuroraBuilding(ctx,x,y,style'), 'Aurora buildings must use the rebuilt pixel-art renderer');
assert.ok(villageArt.includes('imageSmoothingEnabled=false'), 'Aurora pixel art must use nearest-neighbour scaling');
assert.ok(!/create(?:Linear|Radial)Gradient|\.svg/i.test(villageArt), 'Aurora pixel art must not use gradients or vector assets');
assert.ok(villageArt.includes('drawHall') && villageArt.includes('drawForge') && villageArt.includes('drawHealer') && villageArt.includes('drawAlchemy') && villageArt.includes('drawMarket') && villageArt.includes('drawTavern'), 'each village service building must have a distinct authored design');
assert.ok(!readFileSync(new URL('../ui/overworld/sprites.js', import.meta.url), 'utf8').includes('SVG architecture'), 'Aurora sprite renderer must not depend on vector architecture');
for (const asset of pngAssets) assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `missing PNG: ${asset}`);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('Три дракона удерживают его закрытым'));
assert.ok(html.includes('Первые кровавые маги создали Кристалл Разлома'));
assert.ok(html.includes('css/2d-art-direction.css'));

const renderer = readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8');
assert.ok(renderer.includes('getEventPropIndex'));
assert.ok(renderer.includes('drawAtlasProp(ctx, eventPropIndex'));
const atlasRenderer = readFileSync(new URL('../ui/overworld/tile-atlas.js', import.meta.url), 'utf8');
assert.ok(atlasRenderer.includes('const TILE_SIZE = 96'));
assert.ok(atlasRenderer.includes('ctx.imageSmoothingEnabled = false'));
assert.ok(atlasRenderer.includes('drawAuroraGroundTile'));
assert.ok(atlasRenderer.includes('drawAuroraGroundTransitions'), 'Aurora cobblestone edges must blend into adjacent grass with pixel-stepped overlays');
assert.ok(renderer.includes('drawAuroraGroundTransitions(ctx, type'), 'village renderer must pass logical neighbours into the visual ground transition pass');
assert.ok(atlasRenderer.includes('sourceColumn = type * 4 + variant'), 'Aurora ground must select deterministic authored terrain variants');
assert.ok(renderer.includes('drawAuroraGroundTile(ctx, type'), 'Aurora village must use its dedicated authored ground atlas');
const styles = readFileSync(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8');
assert.ok(styles.includes('#mobile-dpad .dpad-btn'));
assert.ok(styles.includes('prefers-reduced-motion'));

console.log('16-bit Aurora pixel-art architecture, terrain atlas and responsive UI checks passed');
