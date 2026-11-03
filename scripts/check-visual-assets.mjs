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
  'assets/aurora/village-props-atlas.png','assets/aurora/world-portal.png',
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
const propsPng = readFileSync(new URL('../assets/aurora/village-props-atlas.png', import.meta.url));
assert.equal(propsPng.readUInt32BE(16), 1024, 'Aurora village prop atlas must contain sixteen 64px frames');
assert.equal(propsPng.readUInt32BE(20), 64, 'Aurora village prop atlas must be 64px high');
const portalPng = readFileSync(new URL('../assets/aurora/world-portal.png', import.meta.url));
assert.equal(portalPng.readUInt32BE(16), 64, 'Aurora world portal sprite must be 64px wide');
assert.equal(portalPng.readUInt32BE(20), 64, 'Aurora world portal sprite must be 64px high');
assert.equal(manifest.auroraWorldPortal?.columns, 1, 'Aurora world portal must use its dedicated authored sprite');
const pngAssets = ['assets/aurora/ground-atlas.png','assets/aurora/village-props-atlas.png','assets/tiles/terrain/atlas.png','assets/tiles/dungeons/atlas.png','assets/tiles/props/atlas.png','assets/branding/mana-crystal.png'];
const villageArt = readFileSync(new URL('../ui/overworld/aurora-art.js', import.meta.url), 'utf8');
assert.ok(villageArt.includes('drawAuroraBuilding(ctx,x,y,style'), 'Aurora buildings must use the rebuilt pixel-art renderer');
assert.ok(villageArt.includes('imageSmoothingEnabled=false'), 'Aurora pixel art must use nearest-neighbour scaling');
assert.ok(villageArt.includes('  } finally {\n    ctx.restore();'), 'Aurora building draws must restore Canvas state after failures');
assert.ok(!/create(?:Linear|Radial)Gradient|\.svg/i.test(villageArt), 'Aurora pixel art must not use gradients or vector assets');
assert.ok(villageArt.includes('drawHall') && villageArt.includes('drawForge') && villageArt.includes('drawHealer') && villageArt.includes('drawAlchemy') && villageArt.includes('drawMarket') && villageArt.includes('drawTavern'), 'each village service building must have a distinct authored design');
const locationsSource = readFileSync(new URL('../data/locations.js', import.meta.url), 'utf8');
const locationPropStyles = [...locationsSource.matchAll(/propStyle:\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
const villageSprites = readFileSync(new URL('../ui/overworld/sprites.js', import.meta.url), 'utf8');
assert.ok(villageSprites.includes('const VILLAGE_PROP_FRAMES = new Map(['), 'village props must use the authored PNG atlas');
assert.ok(villageSprites.includes('frame * 64, 0, 64, 64'), 'village props must sample the 64px atlas frames');
assert.ok(villageSprites.includes('ctx.imageSmoothingEnabled = false'), 'village prop atlas must render with crisp nearest-neighbour pixels');
assert.ok(villageSprites.includes('  } finally {\n    ctx.restore();'), 'village prop draws must restore Canvas state after failures');
assert.ok(!villageSprites.includes('function drawVillagePropRaw'), 'legacy procedural village prop rasterizer must be removed');
assert.ok(villageSprites.includes("['planter', 5]"), 'Aurora planters must resolve to their authored pixel atlas frame');
assert.ok(villageSprites.includes('getAuroraWorldPortalAtlas'), 'Aurora world portal must load its dedicated authored sprite');
assert.ok(villageSprites.includes("style === 'world-portal'"), 'world portal must not reuse the rift ward frame');
const mappedPropStyles = [...villageSprites.matchAll(/\['([^']+)',\s*\d+\]/g)].map(match => match[1]);
for (const style of new Set(locationPropStyles)) {
  if (style === 'world-portal') {
    assert.ok(villageSprites.includes("style === 'world-portal'"), 'Aurora world portal must resolve through its dedicated sprite');
    assert.ok(!mappedPropStyles.includes(style), 'world portal must not alias a village prop atlas frame');
  } else {
    assert.ok(mappedPropStyles.includes(style), 'Aurora propStyle ' + style + ' must resolve to an authored sprite');
  }
}
assert.ok(!readFileSync(new URL('../ui/overworld/sprites.js', import.meta.url), 'utf8').includes('SVG architecture'), 'Aurora sprite renderer must not depend on vector architecture');
for (const asset of pngAssets) assert.ok(existsSync(new URL(`../${asset}`, import.meta.url)), `missing PNG: ${asset}`);

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('Три дракона удерживают его закрытым'));
assert.ok(html.includes('Первые кровавые маги создали Кристалл Разлома'));
assert.ok(html.includes('css/2d-art-direction.css'));

const renderer = readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8');
const depth = readFileSync(new URL('../ui/overworld/depth-order.js', import.meta.url), 'utf8');
assert.ok(renderer.includes('getEventPropIndex'));
assert.ok(renderer.includes('drawAtlasProp(ctx, eventPropIndex'));
const atlasRenderer = readFileSync(new URL('../ui/overworld/tile-atlas.js', import.meta.url), 'utf8');
assert.ok(atlasRenderer.includes('const TILE_SIZE = 96'));
assert.ok(atlasRenderer.includes('ctx.imageSmoothingEnabled = false'));
assert.ok(atlasRenderer.includes('drawAuroraGroundTile'));
assert.ok(atlasRenderer.includes('drawAuroraGroundTransitions'), 'Aurora cobblestone edges must blend into adjacent grass with pixel-stepped overlays');
assert.ok(atlasRenderer.includes("ctx.fillStyle = '#526b3f';\n    ctx.fillRect(x, y, size, size);"), 'Aurora ground tiles must paint an opaque grass base beneath transparent atlas pixels');
assert.ok(atlasRenderer.includes('const corners = ['), 'diagonal grass neighbours must soften isolated Aurora path corners');
assert.ok(atlasRenderer.includes('corner.sides.some'), 'diagonal overlays must not duplicate cardinal grass transitions');
assert.ok(atlasRenderer.includes('const paintPatch = (points)'), 'each pixel transition patch must restore canvas state safely');
assert.ok(renderer.includes('drawAuroraGroundTransitions(ctx, type'), 'village renderer must pass logical neighbours into the visual ground transition pass');
assert.ok(atlasRenderer.includes('sourceColumn = type * 4 + variant'), 'Aurora ground must select deterministic authored terrain variants');
assert.ok(renderer.includes('drawAuroraGroundTile(ctx, type'), 'Aurora village must use its dedicated authored ground atlas');
assert.ok(renderer.indexOf('const questEnemyId') < renderer.indexOf('const depthItems'), 'quest target must be resolved before the depth loop reads it');
assert.ok(depth.includes("kind: 'chest'"), 'treasure chests must participate in common depth sorting');
assert.ok(renderer.includes("entry.kind === 'chest'"), 'treasure chests must render in the common depth pass');
const styles = readFileSync(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8');
assert.ok(styles.includes('#mobile-dpad .dpad-btn'));
assert.ok(styles.includes('prefers-reduced-motion'));

console.log('16-bit Aurora pixel-art architecture, terrain atlas and responsive UI checks passed');
