import { state } from './state.js';

const SLOT_PREFIX = 'magic-rpg-save-';
const LEGACY_KEY = 'magic-rpg-save';
const SETTINGS_KEY = 'magic-rpg-settings';
const SAVE_VERSION = 9;
const SETTINGS_VERSION = 2;
const MAX_SLOT = 3;

let lastSaveTime = null;

function slotKey(slot) { return SLOT_PREFIX + slot; }

export function migrateLegacySave() {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  if (!localStorage.getItem(slotKey(1))) localStorage.setItem(slotKey(1), legacy);
  localStorage.removeItem(LEGACY_KEY);
}

export function saveGame() {
  if (!state.game) return;
  const slot = state.currentSlot || 1;
  if (!state.game.version) state.game.version = SAVE_VERSION;

  const p = state.game.player;
  if (p && lastSaveTime) {
    const deltaSec = (Date.now() - lastSaveTime) / 1000;
    if (deltaSec > 0 && deltaSec < 3600) p.playtimeSec = (p.playtimeSec || 0) + Math.floor(deltaSec);
  }
  lastSaveTime = Date.now();

  localStorage.setItem(slotKey(slot), JSON.stringify(state.game));
}

function normalizeEquipped(p) {
  if (!p || !p.equipped) return;
  for (const slot of ['weapon', 'armor']) {
    const inst = p.equipped[slot];
    if (typeof inst === 'string') p.equipped[slot] = { id: inst, qty: 1 };
  }
}

export function migrateGame(game) {
  if (!game || !game.player) return game;
  normalizeEquipped(game.player);

  if (!game.version || game.version < 2) {
    if (!Array.isArray(game.player.spells)) game.player.spells = [];
    if (!game.player.inventory) game.player.inventory = [];
    if (!game.player.equipped) game.player.equipped = { weapon: null, armor: null };
    game.version = 2;
  }
  if (game.version < 3) {
    if (typeof game.player.statPoints !== 'number') game.player.statPoints = 0;
    if (!game.shards) game.shards = { forest: false, ruins: false, shadow: false };
    if (!game.quests) game.quests = {};
    game.version = 3;
  }
  if (game.version < 4) {
    const p = game.player;
    if (!p.stats) p.stats = { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 };
    if (!Array.isArray(p.achievements)) p.achievements = [];
    if (typeof p.weaponLevel !== 'number') p.weaponLevel = 0;
    if (typeof p.armorLevel !== 'number') p.armorLevel = 0;
    if (!p.herbs) p.herbs = {};
    if (!p.cooldowns) p.cooldowns = {};
    if (!Array.isArray(p.effects)) p.effects = [];
    game.version = 4;
  }
  if (game.version < 5) {
    if (typeof game.player.ngPlus !== 'number') game.player.ngPlus = 0;
    game.version = 5;
  }
  if (game.version < 6) {
    if (typeof game.player.riftBest !== 'number') game.player.riftBest = 0;
    game.version = 6;
  }
  if (game.version < 7) {
    if (typeof game.player.playtimeSec !== 'number') game.player.playtimeSec = 0;
    if (typeof game.player.createdAt !== 'number') game.player.createdAt = Date.now();
    game.version = 7;
  }
  if (game.version < 8) {
    if (!Array.isArray(game.player.talents)) game.player.talents = [];
    game.version = 8;
  }
  if (game.version < 9) {
    if (!game.player.dailyQuests) game.player.dailyQuests = { date: 0, list: [] };
    if (!Array.isArray(game.player.buffs)) game.player.buffs = [];
    game.version = 9;
  }
  return game;
}

export function loadGameData(slot) {
  const s = slot || state.currentSlot || 1;
  const data = localStorage.getItem(slotKey(s));
  if (!data) return false;
  try {
    const g = JSON.parse(data);
    migrateGame(g);
    state.game = g;
    state.currentSlot = s;
    lastSaveTime = Date.now();
    saveGame();
    return true;
  } catch (e) { return false; }
}

export function hasSave(slot) { if (slot === undefined) slot = state.currentSlot || 1; return !!localStorage.getItem(slotKey(slot)); }
export function hasAnySave() { for (let i = 1; i <= MAX_SLOT; i++) if (hasSave(i)) return true; return false; }
export function deleteSave(slot) { const s = slot || state.currentSlot || 1; localStorage.removeItem(slotKey(s)); if (state.currentSlot === s) state.game = null; }

export function getSlotInfo(slot) {
  const data = localStorage.getItem(slotKey(slot));
  if (!data) return null;
  try {
    const g = JSON.parse(data);
    const p = g.player || {};
    return { name: p.name || '???', class: p.class || 'mage', level: p.level || 1, location: g.location || 'village', ngPlus: p.ngPlus || 0 };
  } catch (e) { return null; }
}

export function getMaxSlot() { return MAX_SLOT; }

export function loadSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (data) { try { state.settings = { ...state.settings, ...JSON.parse(data) }; } catch (e) {} }
  if (state.settings.settingsVersion === undefined) state.settings.settingsVersion = SETTINGS_VERSION;
}

export function saveSettings() { state.settings.settingsVersion = SETTINGS_VERSION; localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }