import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const marker = 'data-world-surface-v2';
function inject(path, payload) {
  let svg = readFileSync(path, 'utf8');
  if (svg.includes(marker)) throw new Error('Atlas already enriched: ' + path.pathname);
  assert.ok(svg.includes('<svg') && svg.trimEnd().endsWith('</svg>'));
  svg = svg.trimEnd().slice(0, -6) + payload + '\n</svg>\n';
  writeFileSync(path, svg, 'utf8');
  return svg;
}
const terrainPath = new URL('../assets/tiles/terrain/atlas.svg', import.meta.url);
const propsPath = new URL('../assets/tiles/props/atlas.svg', import.meta.url);
const terrainDefs = `
<!-- ${marker}: subtle biome-specific surface grain; source tile geometry is unchanged. -->
<defs>
<pattern id="rift-grain-village" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r="1" fill="#d8bd83" opacity=".32"/><path d="M13 4l3 2m-8 13l4 -2m7 4l2 -3" stroke="#f0d9a8" stroke-width=".7" opacity=".18"/></pattern>
<pattern id="rift-grain-forest" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M4 5q-3 4 1 7q4 -3 -1 -7m17 10q-3 4 1 7q4 -3 -1 -7" fill="#9fcb76" opacity=".18"/><circle cx="10" cy="22" r="1.1" fill="#c2d68b" opacity=".22"/></pattern>
<pattern id="rift-grain-ruins" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M3 8l5 -2m13 4l4 -3m-17 17l4 -4m13 8l4 -3" stroke="#d5c7ae" stroke-width=".9" opacity=".22"/><circle cx="27" cy="5" r="1" fill="#e3d6c0" opacity=".25"/></pattern>
<pattern id="rift-grain-shadow" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M2 10q8 -7 15 0t17 0M-4 29q8 -7 15 0t17 0" fill="none" stroke="#9d83bd" stroke-width="1.2" opacity=".17"/></pattern>
<pattern id="rift-grain-swamp" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="7" cy="9" r="2" fill="#b2c77a" opacity=".18"/><circle cx="23" cy="22" r="1.4" fill="#d5d98a" opacity=".2"/><path d="M14 4q4 3 0 6" fill="none" stroke="#b4d1a0" opacity=".2"/></pattern>
<pattern id="rift-grain-volcano" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M2 5l5 4l-2 5m18 -9l-3 6l4 4m-17 9l4 -2" fill="none" stroke="#ff9a54" stroke-width="1.1" opacity=".22"/><circle cx="27" cy="26" r="1.3" fill="#ffb06b" opacity=".2"/></pattern>
<pattern id="rift-grain-ice" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M5 4l3 5l-3 5m19 -8l-3 5l3 5M12 23l4 -4l4 4" fill="none" stroke="#d9f5ff" stroke-width="1" opacity=".24"/><circle cx="27" cy="27" r="1" fill="#fff" opacity=".28"/></pattern>
<pattern id="rift-grain-desert" width="36" height="24" patternUnits="userSpaceOnUse"><path d="M0 7q9 -4 18 0t18 0M-5 18q9 -4 18 0t18 0" fill="none" stroke="#f1d19a" stroke-width=".9" opacity=".2"/></pattern>
</defs>
<g pointer-events="none">
<rect x="0" y="0" width="480" height="96" fill="url(#rift-grain-village)" opacity=".48"/>
<rect x="0" y="96" width="480" height="96" fill="url(#rift-grain-forest)" opacity=".58"/>
<rect x="0" y="192" width="480" height="96" fill="url(#rift-grain-ruins)" opacity=".62"/>
<rect x="0" y="288" width="480" height="96" fill="url(#rift-grain-shadow)" opacity=".72"/>
<rect x="0" y="384" width="480" height="96" fill="url(#rift-grain-swamp)" opacity=".62"/>
<rect x="0" y="480" width="480" height="96" fill="url(#rift-grain-volcano)" opacity=".72"/>
<rect x="0" y="576" width="480" height="96" fill="url(#rift-grain-ice)" opacity=".68"/>
<rect x="0" y="672" width="480" height="96" fill="url(#rift-grain-desert)" opacity=".58"/>
</g>`;
const propsOverlay = `
<!-- ${marker}: fine wear grain and inset edge finish across the existing 8x4 prop atlas. -->
<defs><pattern id="rift-prop-wear" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r=".9" fill="#f1dfbd" opacity=".3"/><circle cx="18" cy="16" r=".7" fill="#0b0d12" opacity=".28"/><path d="M9 3l2 2m7 12l-2 3M2 19l3 -1" stroke="#e8d8b9" stroke-width=".7" opacity=".2"/></pattern></defs>
<g pointer-events="none">
${Array.from({length:32},(_,i)=>{const x=(i%8)*96,y=Math.floor(i/8)*96;return `<g><rect x="${x}" y="${y}" width="96" height="96" fill="url(#rift-prop-wear)" opacity=".34"/><rect x="${x+2}" y="${y+2}" width="92" height="92" rx="3" fill="none" stroke="#f4e5c8" stroke-opacity=".09" stroke-width="1"/></g>`;}).join('\n')}
</g>`;
const terrain = inject(terrainPath, terrainDefs);
const props = inject(propsPath, propsOverlay);
assert.ok(terrain.includes('rift-grain-volcano') && terrain.includes('rift-grain-ice'));
assert.equal(props.split('fill="url(#rift-prop-wear)"').length - 1, 32);
console.log('World atlas enrichment applied: 8 biome grain layers and 32 prop surface finishes.');
