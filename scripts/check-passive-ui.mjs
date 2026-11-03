import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../ui/passives.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/rpg-overhaul.css', import.meta.url), 'utf8');

for (const contract of [
  'export function passiveTreeZoom(delta)',
  'export function passiveTreeResetView()',
  'export function passiveTreeKeyDown(e)',
  'aria-label="Управление масштабом древа"',
  'aria-live="polite"',
  'tabindex="0" role="group"',
  'data-x="${node.x}" data-y="${node.y}"',
  "e.key === 'Home'",
  "e.key === 'End'",
  "'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'",
  "e.key === '0'"
]) {
  assert.ok(ui.includes(contract), `passive tree UI is missing: ${contract}`);
}

assert.match(ui, /treeZoom = Math\.max\(0\.65, Math\.min\(1\.6/);
assert.match(ui, /best\?\.focus\(\)/);
assert.match(ui, /aria-disabled="\$\{!available\}"/);
assert.doesNotMatch(ui, /\? 'disabled'/, 'locked nodes must remain keyboard-focusable');
assert.match(css, /\.passive-tree-viewport:focus-visible/);
assert.match(css, /\.passive-tree-viewport \.passive-node:focus-visible/);
assert.match(css, /@media \(max-width:600px\)/);
assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);

console.log('Passive tree UI accessibility checks passed');
