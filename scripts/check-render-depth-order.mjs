import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDepthItems } from '../ui/overworld/depth-order.js';

const stat = { id: 'house', x: 10, y: 80, depthOffset: 4 };
const npc = { id: 'villager', x: 20, y: 60 };
const event = { id: 'altar', x: 30, y: 95 };
const liveEnemy = { id: 'ghoul', x: 40, y: 72 };
const deadEnemy = { id: 'fallen-ghoul', x: 50, y: 20, dead: true };
const player = { id: 'hero', x: 60, y: 84 };
const ordered = buildDepthItems({
  statics: [stat],
  npcs: [npc],
  events: [event],
  enemies: [deadEnemy, liveEnemy],
  player
});

assert.deepEqual(ordered.map(entry => entry.kind), ['npc', 'enemy', 'static', 'event', 'player']);
assert.deepEqual(ordered.map(entry => entry.footY), [60, 72, 84, 96, 95].sort((a, b) => a - b));
assert.equal(ordered.some(entry => entry.item === deadEnemy), false, 'dead enemies must not enter the draw order');
assert.equal(ordered.find(entry => entry.kind === 'player').item, player, 'player must participate in depth sorting');
assert.equal(buildDepthItems(null).length, 0, 'missing world state must produce an empty draw list');

const renderSource = readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8');
assert.ok(renderSource.includes('const depthItems = buildDepthItems(ow);'), 'renderer must use the shared depth-order helper');
assert.ok(renderSource.includes('drawPlayerByClass(ctx, item, sx + pLungeX, sy + pLungeY'), 'player must be drawn inside its sorted depth entry');
assert.equal((renderSource.match(/drawPlayerByClass\s*\(/g) || []).length, 1,
  'player must be drawn exactly once; a later unconditional draw would cover every foreground building');

console.log('Render depth order passed: player, buildings, NPCs, events and living enemies share one sorted layer');
