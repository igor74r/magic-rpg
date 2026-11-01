import assert from 'node:assert/strict';
import { state } from '../systems/state.js';

const originalRaf = globalThis.requestAnimationFrame;
const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

const frames = [];
let nextFrameId = 1;
globalThis.requestAnimationFrame = callback => {
  frames.push(callback);
  return nextFrameId++;
};

const intervals = [];
const cleared = [];
let nextIntervalId = 1;
globalThis.setInterval = callback => {
  const id = nextIntervalId++;
  intervals.push({ id, callback });
  return id;
};
globalThis.clearInterval = id => cleared.push(id);

try {
  const { start, startAutosave } = await import('../ui/overworld/render.js');
  state.overworld = null;

  start();
  assert.equal(frames.length, 1, 'render loop should schedule its first frame');
  frames.shift()(16.67);
  assert.equal(frames.length, 0, 'render loop must stop after leaving the overworld');

  start();
  assert.equal(frames.length, 1, 'render loop should be restartable on re-entry');

  state.overworld = null;
  startAutosave();
  assert.equal(intervals.length, 1, 'autosave timer should start with the overworld');
  intervals[0].callback();
  assert.deepEqual(cleared, [intervals[0].id], 'autosave timer must clear after leaving the overworld');

  startAutosave();
  assert.equal(intervals.length, 2, 'autosave timer should restart on the next entry');
  intervals[1].callback();
  assert.deepEqual(cleared, [intervals[0].id, intervals[1].id]);
  console.log('check-render-lifecycle: PASS (RAF and autosave stop on exit and restart on re-entry)');
} finally {
  state.overworld = null;
  if (originalRaf === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = originalRaf;
  if (originalSetInterval === undefined) delete globalThis.setInterval;
  else globalThis.setInterval = originalSetInterval;
  if (originalClearInterval === undefined) delete globalThis.clearInterval;
  else globalThis.clearInterval = originalClearInterval;
}
