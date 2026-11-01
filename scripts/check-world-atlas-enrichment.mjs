import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const terrain = readFileSync(new URL('../assets/tiles/terrain/atlas.svg', import.meta.url), 'utf8');
const props = readFileSync(new URL('../assets/tiles/props/atlas.svg', import.meta.url), 'utf8');
const dungeon = readFileSync(new URL('../assets/tiles/dungeons/atlas.svg', import.meta.url), 'utf8');

for (const biome of ['village', 'forest', 'ruins', 'shadow', 'swamp', 'volcano', 'ice', 'desert']) {
  assert.ok(terrain.includes(`rift-grain-${biome}`), `missing surface treatment for ${biome}`);
}
assert.equal((terrain.match(/fill="url\(#rift-grain-/g) || []).length, 8);
assert.equal(props.split('fill="url(#rift-prop-wear)"').length - 1, 32);
assert.ok(props.includes('data-world-surface-v2'));
assert.ok(dungeon.includes('dungeon-grain'), 'existing dungeon grain must remain');
for (const [name, svg, width, height] of [
  ['terrain', terrain, 480, 768],
  ['props', props, 768, 384],
  ['dungeons', dungeon, 480, 192]
]) {
  assert.ok(svg.includes(`width="${width}"`), `${name} width changed`);
  assert.ok(svg.includes(`height="${height}"`), `${name} height changed`);
  assert.ok(svg.trimEnd().endsWith('</svg>'), `${name} SVG closing tag missing`);
}
console.log('World atlas enrichment checks passed: biome surfaces, 32 prop cells, atlas dimensions preserved.');
