import { state } from './state.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

const RIFT_LOCATIONS = ['forest', 'ruins', 'swamp', 'graveyard', 'volcano', 'ice-peaks', 'wasteland'];

export function getRiftMult(floor) {
  const f = Math.max(1, floor || 1);
  return {
    hpMult: 1 + (f - 1) * 0.15,
    atkMult: 1 + (f - 1) * 0.10,
    goldMult: 1 + (f - 1) * 0.25,
    expMult: 1 + (f - 1) * 0.20
  };
}

export function getRandomRiftLocation(excludeId) {
  const pool = RIFT_LOCATIONS.filter(id => id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function isRiftReady() {
  const s = state.game?.shards;
  if (!s) return false;
  return !!(s.forest && s.ruins && s.shadow);
}

export function recordRiftFloor(floor) {
  const p = state.game?.player;
  if (!p) return false;
  if (typeof p.riftBest !== 'number') p.riftBest = 0;
  if (floor > p.riftBest) {
    p.riftBest = floor;
    saveGame();
    return true;
  }
  return false;
}

export function getRiftBest() {
  return state.game?.player?.riftBest || 0;
}

export function endRift() {
  const ow = state.overworld;
  if (!ow || !ow.rifMode) return;
  const floor = ow.rifFloor || 1;
  const isNewRecord = recordRiftFloor(floor);
  if (isNewRecord) {
    emit('toast', `🌀 Новый рекорд Разлома: этаж ${floor}!`);
  } else {
    emit('toast', `🌀 Разлом: этаж ${floor}. Рекорд: ${getRiftBest()}`);
  }
}