import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../assets/tiles/manifest.json', import.meta.url), 'utf8'));

function readAtlas(relativePath, expectedWidth, expectedHeight, label) {
  const data = readFileSync(new URL('../assets/tiles/' + relativePath, import.meta.url));
  assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10],
    `${label} must be a valid PNG atlas`);
  assert.equal(data.readUInt32BE(16), expectedWidth, `${label} width changed`);
  assert.equal(data.readUInt32BE(20), expectedHeight, `${label} height changed`);
  return data;
}

assert.equal(manifest.tileSize, 96);
assert.deepEqual(manifest.terrain.rows,
  ['village', 'forest', 'ruins', 'shadow', 'swamp', 'volcano', 'ice', 'desert']);
assert.deepEqual(manifest.terrain.columns, ['grass', 'path', 'biome-object', 'liquid', 'rock']);
assert.equal(manifest.terrain.file, 'terrain/atlas.png');
assert.equal(manifest.props.file, 'props/atlas.png');
assert.equal(manifest.dungeons.file, 'dungeons/atlas.png');

readAtlas(manifest.terrain.file, 480, 768, 'terrain atlas');
readAtlas(manifest.props.file, 768, 384, 'props atlas');
readAtlas(manifest.dungeons.file, 480, 192, 'dungeon atlas');

// Aurora has dedicated local PNG atlases. Validate the manifest contract and
// physical dimensions before these resources are used by the Canvas renderer.
assert.equal(manifest.auroraGround.file, '../aurora/ground-atlas.png');
assert.equal(manifest.auroraGround.tileSize, 96);
assert.equal(manifest.auroraGround.columns, 8);
assert.equal(manifest.auroraGround.rows, 1);
assert.deepEqual(manifest.auroraGround.types, ['grass', 'path']);
assert.equal(manifest.auroraGround.displaySize, 48);
readAtlas(manifest.auroraGround.file, 768, 96, 'Aurora ground atlas');

assert.equal(manifest.villageProps.file, '../aurora/village-props-atlas.png');
assert.equal(manifest.villageProps.tileSize, 64);
assert.equal(manifest.villageProps.columns, 16);
assert.equal(manifest.villageProps.rows, 1);
assert.equal(manifest.villageProps.displaySize, 96);
assert.equal(manifest.villageProps.styles.length, 16);
readAtlas(manifest.villageProps.file, 1024, 64, 'Aurora village props atlas');

assert.equal(manifest.auroraWorldPortal.file, '../aurora/world-portal.png');
assert.equal(manifest.auroraWorldPortal.tileSize, 64);
readAtlas(manifest.auroraWorldPortal.file, 64, 64, 'Aurora world portal atlas');

for (const [biome, row] of Object.entries(manifest.biomeRows)) {
  assert.ok(Number.isInteger(row) && row >= 0 && row < manifest.terrain.rows.length,
    `${biome} must map to an existing terrain row`);
}
console.log('World atlas checks passed: local PNG atlases, manifest rows, tile columns and dimensions.');
