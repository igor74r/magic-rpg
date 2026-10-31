import { state } from './state.js';
import { STORY } from '../data/story.js';

const SLOT_PREFIX = 'magic-rpg-save-';
const LEGACY_KEY = 'magic-rpg-save';
const SETTINGS_KEY = 'magic-rpg-settings';

const SAVE_VERSION = 13;
const SETTINGS_VERSION = 4;
const MAX_SLOT = 3;

let lastSaveTime = null;

function slotKey(slot) {
  return SLOT_PREFIX + slot;
}

export function migrateLegacySave() {
  const legacy = localStorage.getItem(LEGACY_KEY);

  if (!legacy) return;

  if (!localStorage.getItem(slotKey(1))) {
    localStorage.setItem(slotKey(1), legacy);
  }

  localStorage.removeItem(LEGACY_KEY);
}

export function saveGame() {
  if (!state.game) return;

  const slot = state.currentSlot || 1;

  state.game.version = SAVE_VERSION;

  const player = state.game.player;

  if (player && lastSaveTime) {
    const deltaSec = (Date.now() - lastSaveTime) / 1000;

    if (deltaSec > 0 && deltaSec < 3600) {
      player.playtimeSec =
        (player.playtimeSec || 0) + Math.floor(deltaSec);
    }
  }

  lastSaveTime = Date.now();

  localStorage.setItem(
    slotKey(slot),
    JSON.stringify(state.game)
  );
}

function normalizeEquipped(player) {
  if (!player || !player.equipped) return;

  for (const slot of ['weapon', 'armor']) {
    const instance = player.equipped[slot];

    if (typeof instance === 'string') {
      player.equipped[slot] = {
        id: instance,
        qty: 1
      };
    }
  }
}

export function migrateGame(game) {
  if (!game || !game.player) return game;

  normalizeEquipped(game.player);

  if (!game.version || game.version < 2) {
    if (!Array.isArray(game.player.spells)) {
      game.player.spells = [];
    }

    if (!game.player.inventory) {
      game.player.inventory = [];
    }

    if (!game.player.equipped) {
      game.player.equipped = {
        weapon: null,
        armor: null
      };
    }

    game.version = 2;
  }

  if (game.version < 3) {
    if (typeof game.player.statPoints !== 'number') {
      game.player.statPoints = 0;
    }

    if (!game.shards) {
      game.shards = {
        forest: false,
        ruins: false,
        shadow: false
      };
    }

    if (!game.quests) {
      game.quests = {};
    }

    game.version = 3;
  }

  if (game.version < 4) {
    const player = game.player;

    if (!player.stats) {
      player.stats = {
        kills: {},
        deaths: 0,
        goldEarned: 0,
        chestsOpened: 0,
        dailyChestAt: 0,
        dailyChestsOpened: 0
      };
    }

    if (!Array.isArray(player.achievements)) {
      player.achievements = [];
    }

    if (typeof player.weaponLevel !== 'number') {
      player.weaponLevel = 0;
    }

    if (typeof player.armorLevel !== 'number') {
      player.armorLevel = 0;
    }

    if (!player.herbs) {
      player.herbs = {};
    }

    if (!player.cooldowns) {
      player.cooldowns = {};
    }

    if (!Array.isArray(player.effects)) {
      player.effects = [];
    }

    game.version = 4;
  }

  if (game.version < 5) {
    if (typeof game.player.ngPlus !== 'number') {
      game.player.ngPlus = 0;
    }

    game.version = 5;
  }

  if (game.version < 6) {
    if (typeof game.player.riftBest !== 'number') {
      game.player.riftBest = 0;
    }

    game.version = 6;
  }

  if (game.version < 7) {
    if (typeof game.player.playtimeSec !== 'number') {
      game.player.playtimeSec = 0;
    }

    if (typeof game.player.createdAt !== 'number') {
      game.player.createdAt = Date.now();
    }

    game.version = 7;
  }

  if (game.version < 8) {
    if (!Array.isArray(game.player.talents)) {
      game.player.talents = [];
    }

    game.version = 8;
  }

  if (game.version < 9) {
    if (!game.player.dailyQuests) {
      game.player.dailyQuests = {
        date: 0,
        list: []
      };
    }

    if (!Array.isArray(game.player.buffs)) {
      game.player.buffs = [];
    }

    game.version = 9;
  }

  // Версия 10: ловкость и новое дерево пассивных навыков.
  if (game.version < 10) {
    const player = game.player;

    if (typeof player.dex !== 'number') {
      player.dex = 0;
    }

    if (!Array.isArray(player.passives)) {
      player.passives = ['start'];
    } else if (!player.passives.includes('start')) {
      player.passives.unshift('start');
    }

    // Компенсация за уровни, уже полученные до внедрения нового древа.
    // Один достигнутый уровень после первого даёт одно очко пассивки.
    if (typeof player.passivePoints !== 'number') {
      player.passivePoints = Math.max(
        0,
        (player.level || 1) - 1
      );
    }

    if (typeof player.statPoints !== 'number') {
      player.statPoints = 0;
    }

    if (!player.stats) {
      player.stats = {
        kills: {},
        deaths: 0,
        goldEarned: 0,
        chestsOpened: 0
      };
    }

    if (!player.stats.kills) {
      player.stats.kills = {};
    }

    game.version = 10;
  }

  // Версия 11: отдельный прогресс сюжетной кампании.
  // Старые убийства остаются в бестиарии, но не завершают новую сюжетную кампанию автоматически.
  if (game.version < 11) {
    const player = game.player;
    const defaultDex = { warrior: 6, mage: 8, archer: 18, priest: 7 };

    if (!Number.isFinite(player.dex) || player.dex <= 0) {
      player.dex = defaultDex[player.class] || 10;
    }

    if (!player.campaignKills || typeof player.campaignKills !== 'object' || Array.isArray(player.campaignKills)) {
      player.campaignKills = {};
    }

    for (const [enemyId, value] of Object.entries(player.campaignKills)) {
      const kills = Number(value);
      player.campaignKills[enemyId] = Number.isFinite(kills)
        ? Math.max(0, Math.floor(kills))
        : 0;
    }

    game.version = 11;
  }

  // Version 12: equipment slots, runes and accepted/claimed campaign missions.
  if (game.version < 12) {
    const player = game.player;
    const slots = ['weapon', 'armor', 'helmet', 'gloves', 'boots', 'amulet', 'ring1', 'ring2'];
    if (!player.equipped || typeof player.equipped !== 'object') player.equipped = {};
    for (const slot of slots) {
      if (player.equipped[slot] === undefined) player.equipped[slot] = null;
    }
    for (const [slot, instance] of Object.entries(player.equipped)) {
      if (!instance || typeof instance !== 'object') continue;
      if (!Array.isArray(instance.runes)) instance.runes = [];
    }

    if (!player.campaignClaimed || typeof player.campaignClaimed !== 'object') {
      player.campaignClaimed = {};
    }
    for (const act of STORY.acts) {
      for (const mission of act.missions) {
        const kills = Number(player.campaignKills?.[mission.id] || 0);
        if (kills >= mission.count) player.campaignClaimed[mission.id] = true;
      }
    }
    if (typeof player.activeCampaignMission !== 'string') {
      player.activeCampaignMission = null;
      for (const act of STORY.acts) {
        if (player.activeCampaignMission) break;
        for (const mission of act.missions) {
          const kills = Number(player.campaignKills?.[mission.id] || 0);
          if (!player.campaignClaimed[mission.id] && kills > 0) {
            player.activeCampaignMission = mission.id;
            break;
          }
        }
      }
    }
    game.version = 12;
  }

  // Version 13: anatomical armor slots and the separate signet slot.
  if (game.version < 13) {
    const player = game.player;
    if (!Array.isArray(player.inventory)) player.inventory = [];
    if (!player.equipped || typeof player.equipped !== 'object') player.equipped = {};

    const legacy = [
      ['helmet', 'head'],
      ['armor', 'chest'],
      ['gloves', 'hands'],
      ['boots', 'legs']
    ];
    for (const [oldSlot, defaultSlot] of legacy) {
      const instance = player.equipped[oldSlot];
      if (!instance) {
        delete player.equipped[oldSlot];
        continue;
      }
      const id = typeof instance === 'string' ? instance : instance.id;
      const destination = id === 'crystal-amulet' ? 'amulet'
        : id === 'ranger-cloak' ? 'back'
        : defaultSlot;
      if (!player.equipped[destination]) player.equipped[destination] = instance;
      else player.inventory.push(instance);
      delete player.equipped[oldSlot];
    }

    const slots = [
      'weapon', 'head', 'shoulders', 'chest', 'back', 'wrists',
      'hands', 'legs', 'ring1', 'ring2', 'amulet', 'seal'
    ];
    for (const slot of slots) {
      if (player.equipped[slot] === undefined) player.equipped[slot] = null;
      const instance = player.equipped[slot];
      if (typeof instance === 'string') {
        player.equipped[slot] = { id: instance, qty: 1, runes: [] };
      } else if (instance && typeof instance === 'object') {
        if (!Array.isArray(instance.runes)) instance.runes = [];
      }
    }

    for (const instance of player.inventory) {
      if (instance && typeof instance === 'object' && instance.id && instance.qty === undefined) instance.qty = 1;
    }
    if (!player.campaignShards || typeof player.campaignShards !== 'object') {
      player.campaignShards = {};
    }
    for (const shard of ['forest', 'ruins', 'shadow']) {
      if (game.shards?.[shard]) player.campaignShards[shard] = true;
    }
    game.version = 13;
  }

  return game;
}

export function loadGameData(slot) {
  const selectedSlot = slot || state.currentSlot || 1;
  const data = localStorage.getItem(slotKey(selectedSlot));

  if (!data) return false;

  try {
    const game = JSON.parse(data);

    migrateGame(game);

    state.game = game;
    state.currentSlot = selectedSlot;
    lastSaveTime = Date.now();

    // После миграции сразу записываем обновлённую структуру.
    saveGame();

    return true;
  } catch (error) {
    console.error('[save] Не удалось загрузить сохранение:', error);
    return false;
  }
}

export function hasSave(slot) {
  if (slot === undefined) {
    slot = state.currentSlot || 1;
  }

  return !!localStorage.getItem(slotKey(slot));
}

export function hasAnySave() {
  for (let i = 1; i <= MAX_SLOT; i++) {
    if (hasSave(i)) return true;
  }

  return false;
}

export function deleteSave(slot) {
  const selectedSlot = slot || state.currentSlot || 1;

  localStorage.removeItem(slotKey(selectedSlot));

  if (state.currentSlot === selectedSlot) {
    state.game = null;
  }
}

export function getSlotInfo(slot) {
  const data = localStorage.getItem(slotKey(slot));

  if (!data) return null;

  try {
    const game = JSON.parse(data);
    const player = game.player || {};

    return {
      name: player.name || '???',
      class: player.class || 'mage',
      level: player.level || 1,
      location: game.location || 'village',
      ngPlus: player.ngPlus || 0
    };
  } catch {
    return null;
  }
}

export function getMaxSlot() {
  return MAX_SLOT;
}

// ---------- НАСТРОЙКИ ----------

export function migrateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    settings = {};
  }

  if (typeof settings.musicVolume !== 'number') {
    settings.musicVolume =
      typeof settings.volume === 'number'
        ? settings.volume
        : 60;
  }

  if (typeof settings.sfxVolume !== 'number') {
    settings.sfxVolume =
      typeof settings.volume === 'number'
        ? settings.volume
        : 80;
  }

  if (typeof settings.autoSave !== 'boolean') {
    settings.autoSave = true;
  }

  if (typeof settings.showHotkeys !== 'boolean') {
    settings.showHotkeys = true;
  }

  if (typeof settings.showFps !== 'boolean') {
    settings.showFps = false;
  }

  if (![15, 30, 60].includes(settings.autoSaveInterval)) {
    settings.autoSaveInterval = 30;
  }

  if (typeof settings.screenShake !== 'boolean') settings.screenShake = true;
  if (typeof settings.damageNumbers !== 'boolean') settings.damageNumbers = true;
  if (typeof settings.lowHealthEffects !== 'boolean') settings.lowHealthEffects = true;
  if (typeof settings.reducedMotion !== 'boolean') settings.reducedMotion = false;

  if (typeof settings.difficulty !== 'string') {
    settings.difficulty = 'normal';
  }

  if (typeof settings.soundEnabled !== 'boolean') {
    settings.soundEnabled = true;
  }

  delete settings.volume;

  settings.settingsVersion = SETTINGS_VERSION;

  return settings;
}

export function loadSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);

  if (data) {
    try {
      const parsed = JSON.parse(data);

      state.settings = migrateSettings({
        ...state.settings,
        ...parsed
      });
    } catch {
      state.settings = migrateSettings(state.settings);
    }
  } else {
    state.settings = migrateSettings(state.settings);
  }

  saveSettings();
}

export function saveSettings() {
  state.settings.settingsVersion = SETTINGS_VERSION;

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(state.settings)
  );
}