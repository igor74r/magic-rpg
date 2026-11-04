import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const menu = await readFile(new URL('../ui/menu.js', import.meta.url), 'utf8');

const cleanupStart = menu.indexOf('function clearOverworldRuntime()');
assert.notEqual(cleanupStart, -1, 'menu must expose a shared overworld runtime cleanup');
const cleanupEnd = menu.indexOf('\n}\n', cleanupStart);
const cleanup = menu.slice(cleanupStart, cleanupEnd);
assert.match(cleanup, /overworld\.active\s*=\s*false/,
  'cleanup must stop the animation frame loop before hiding the screen');
assert.match(cleanup, /overworld\.paused\s*=\s*true/,
  'cleanup must mark the runtime paused');
assert.match(cleanup, /state\.overworld\s*=\s*null/,
  'cleanup must discard stale runtime state before loading another slot');
assert.match(cleanup, /emit\(['"]overworld:end['"]\)/,
  'cleanup must notify lifecycle listeners');

const loadSlotStart = menu.indexOf('export function loadSlot(slot)');
const loadSlotEnd = menu.indexOf('\n}\n', loadSlotStart);
const loadSlot = menu.slice(loadSlotStart, loadSlotEnd);
assert.ok(loadSlot.indexOf('clearOverworldRuntime()') < loadSlot.indexOf('loadGameData(slot)'),
  'slot load must clean up an old overworld before replacing game state');

const saveAndMenuStart = menu.indexOf('export function saveAndMenu()');
const saveAndMenuEnd = menu.indexOf('\n}\n', saveAndMenuStart);
const saveAndMenu = menu.slice(saveAndMenuStart, saveAndMenuEnd);
assert.ok(saveAndMenu.indexOf('if (!saveGame())') < saveAndMenu.indexOf('clearOverworldRuntime()'),
  'failed saves must leave gameplay/runtime intact');
assert.ok(saveAndMenu.indexOf('clearOverworldRuntime()') < saveAndMenu.indexOf("showScreen('screen-main')"),
  'successful save must stop hidden gameplay loops before switching to the menu');

const deleteSlotStart = menu.indexOf('export function deleteSlot(slot)');
const deleteSlotEnd = menu.indexOf('\n}\n', deleteSlotStart);
const deleteSlot = menu.slice(deleteSlotStart, deleteSlotEnd);
assert.match(deleteSlot, /if \(!deleteSave\(slot\)\)/,
  'a failed slot deletion must not be reported as successful');

const deleteAllStart = menu.indexOf('export function deleteAllSaves()');
const deleteAllEnd = menu.indexOf('\n}\n', deleteAllStart);
const deleteAll = menu.slice(deleteAllStart, deleteAllEnd);
assert.match(deleteAll, /failedSlots/,
  'bulk deletion must track slots that could not be removed');
assert.ok(deleteAll.indexOf('if (failedSlots.length)') < deleteAll.indexOf('state.game = null'),
  'bulk deletion must not clear the active game before confirming every slot was removed');
assert.match(deleteAll, /Не удалось удалить слоты/,
  'bulk deletion must explain partial storage failures');

console.log('check-save-menu-lifecycle: PASS (save-to-menu and slot-load stop stale overworld runtime)');
