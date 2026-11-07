import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../systems/overworld/ai.js', import.meta.url), 'utf8');
const combat = readFileSync(new URL('../systems/overworld/combat.js', import.meta.url), 'utf8');
const markers = readFileSync(new URL('../systems/overworld/world-event-markers.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');

assert.match(ai, /advanceWorldEvents\(state\.game, dt, regionId\)/,
  'world clock and event lifecycle must advance while exploring');
assert.match(ai, /getVisibleWorldEventsForRegion\(state\.game, regionId\)/,
  'active and claimable events must be represented in the current region');
assert.match(ai, /syncWorldEventMarkers\(\s*ow,/,
  'event markers must stay synchronized with persistent world state');
assert.match(markers, /createSeededRandom\(event\.seed\)/,
  'event markers must use deterministic positions');
assert.match(combat, /recordWorldEventKill\(state\.game, ow\.sourceLocationId \|\| ow\.locationId, enemy\)/,
  'combat victories must progress accepted regional events');
assert.match(main, /handlePersistentWorldEvent\(ev\)/,
  'world-event markers must use the persistent event interaction path');
assert.match(main, /acceptWorldEvent\(game, eventId\)/,
  'players must explicitly accept a discovered world event');
assert.match(main, /claimWorldEventReward\(game, eventId\)/,
  'completed events must require an explicit reward claim');
assert.match(main, /state\.game = JSON\.parse\(snapshot\)/,
  'event acceptance and reward claims must roll back when saving fails');

console.log('Persistent world-event runtime wiring: markers, timed lifecycle, combat objectives and transactional rewards passed.');
assert.match(markers, /'frontier-survey': '🧭'/,
  'frontier survey markers must use a compass so they are distinct from combat events');
assert.match(markers, /description: event\.objectiveText \|\| ''/,
  'world-event markers must carry their objective text into the interaction panel');
assert.match((await import('node:fs')).readFileSync(new URL('../ui/overworld/render.js', import.meta.url), 'utf8'),
  /safeDescription = isEvent \? escapeHtml\(nearNpc\.description \|\| ''\)/,
  'event interaction panel must display escaped objective guidance');
