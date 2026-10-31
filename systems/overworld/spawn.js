import { state } from '../state.js';
import { ENEMIES } from '../../data/enemies.js';
import { ITEMS, RARITIES } from '../../data/items.js';
import { addItem } from '../inventory.js';
import { checkAchievements } from '../achievements.js';
import { saveGame } from '../save.js';
import { updateDungeonProgress } from '../exploration.js';
import { playSound } from '../audio.js';
import { getNGPlusMult } from '../ngplus.js';
import { getRiftMult } from '../rift.js';
import { findFreeCell, TILE } from './map.js';
import { spawnParticles } from './particles.js';
import { pushLog } from './log.js';
import { updateQuestProgress } from '../dailyQuests.js';

export const ELITE_HP_MULT = 1.5;
export const ELITE_ATK_MULT = 1.3;
export const MODIFIER_CHANCE = 0.10;
const CHEST_HERB_CHANCE = 0.40;

export const MODIFIERS = {
  poisonous:    { name: 'Ядовитый', prefix: '☣️', hpMult: 1.0, atkMult: 1.15, defMult: 1.0, color: '#60a060' },
  armored:      { name: 'Бронированный', prefix: '🛡️', hpMult: 1.3, atkMult: 1.0,  defMult: 1.5, color: '#a0a0a0' },
  swift:        { name: 'Стремительный', prefix: '💨', hpMult: 0.9, atkMult: 1.2,  defMult: 1.0, color: '#60a0ff' },
  vampiric:     { name: 'Вампирский', prefix: '🧛', hpMult: 1.0, atkMult: 1.0,  defMult: 1.0, color: '#800060', vampiricPct: 0.3 },
  regenerating: { name: 'Регенерирующий', prefix: '💚', hpMult: 1.1, atkMult: 1.0, defMult: 1.0, color: '#60ff60', regenPerTurn: 5 },
  berserk:      { name: 'Берсерк',       prefix: '💢', hpMult: 0.9, atkMult: 1.25, defMult: 1.0, color: '#ff4040' }
};

export function getRespawnMs() { const d = state.settings.difficulty; return d === 'easy' ? 15000 : d === 'hard' ? 60000 : 30000; }
export function getEliteChance() { const d = state.settings.difficulty; return d === 'easy' ? 0.15 : d === 'hard' ? 0.35 : 0.20; }
export function getDropChance() { const d = state.settings.difficulty; return d === 'easy' ? 0.70 : d === 'hard' ? 0.30 : 0.50; }

export function createSpawnRoster(enemyIds, count, random = Math.random) {
  const roster = Array.isArray(enemyIds) ? enemyIds.filter(Boolean) : [];
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (!roster.length || total === 0) return [];

  // Fisher–Yates first guarantees every act enemy (including its boss) is represented.
  for (let i = roster.length - 1; i > 0; i--) {
    const raw = Math.floor(random() * (i + 1));
    const j = Math.max(0, Math.min(i, raw));
    [roster[i], roster[j]] = [roster[j], roster[i]];
  }

  const result = roster.slice(0, total);
  while (result.length < total) {
    result.push(roster[Math.floor(random() * roster.length)]);
  }
  return result;
}

export function spawnEnemies(loc, map, cols, rows, playerPos, opts = {}, locationId = null) {
  if (loc.safe) return [];
  const ng = getNGPlusMult();
  const riftM = opts.rifMode ? getRiftMult(opts.rifFloor || 1) : { hpMult: 1 };
  const enemies = [];
  const count = Math.min(Math.max(loc.enemies.length, 4), 7);
  const spawnRoster = createSpawnRoster(loc.enemies, count);
  const eliteChance = getEliteChance();

  for (let i = 0; i < count; i++) {
    const pos = findFreeCell(map, cols, rows, enemies, 220, playerPos, locationId);
    if (!pos) continue;
    const enemyId = spawnRoster[i];
    const def = ENEMIES[enemyId];
    if (!def) continue;
    const isBoss = !!def.boss;
    const isElite = !isBoss && Math.random() < eliteChance;
    let modifier = null;
    if (!isBoss && !isElite && Math.random() < MODIFIER_CHANCE) {
      const keys = Object.keys(MODIFIERS);
      modifier = keys[Math.floor(Math.random() * keys.length)];
    }
    const mod = modifier ? MODIFIERS[modifier] : null;
    const hp = Math.round(def.hp * (isElite ? ELITE_HP_MULT : 1) * (mod ? mod.hpMult : 1) * ng.hpMult * riftM.hpMult);
    enemies.push({
      id: i, enemyId, x: pos.x * TILE + TILE / 2, y: pos.y * TILE + TILE / 2,
      homeX: pos.x * TILE + TILE / 2, homeY: pos.y * TILE + TILE / 2,
      hp, maxHp: hp, elite: isElite, boss: isBoss, modifier,
      effects: [], phase: 0, state: 'idle',
      wanderTimer: 1 + Math.random() * 2, wanderDx: 0, wanderDy: 0,
      dead: false, respawnAt: 0,
    });
  }
  return enemies;
}

export function spawnNPCs(loc) {
  if (!loc.npcs) return [];
  return loc.npcs.map(npc => ({
    ...npc,
    x: npc.x * TILE + TILE / 2,
    y: npc.y * TILE + TILE / 2,
    homeX: npc.x * TILE + TILE / 2,
    homeY: npc.y * TILE + TILE / 2,
    interactionRadius: 65,
    wanderTimer: Math.random() * 3,
    wanderDx: 0, wanderDy: 0,
    facing: 'down'
  }));
}

export function spawnStatics(loc) {
  if (!loc.statics) return [];
  return loc.statics.map(obj => ({
    ...obj,
    x: obj.x * TILE + TILE / 2,
    y: obj.y * TILE + TILE / 2,
    interactionRadius: 65
  }));
}

export function spawnChests(loc, map, cols, rows, enemies, playerPos, locationId = null) {
  if (loc.safe) return [];
  const chests = [];
  const chestsCount = loc.chestsCount || 3;
  for (let i = 0; i < chestsCount; i++) {
    const pos = findFreeCell(map, cols, rows, [...enemies, ...chests], 150, playerPos, locationId);
    if (pos) chests.push({ x: pos.x * TILE + TILE / 2, y: pos.y * TILE + TILE / 2, opened: false });
  }
  return chests;
}

// ⬇️ НОВОЕ: спавн случайных событий на карте
export function spawnEvents(loc, map, cols, rows, playerPos, locationId = null, avoidList = []) {
  if (loc.safe) return [];
  const events = [];
  const count = 1 + Math.floor(Math.random() * 2);
  const types = ['altar', 'mimic', 'crystal', 'traveler'];
  const NAMES = { altar: 'Древний алтарь', mimic: 'Подозрительный сундук', crystal: 'Кристалл маны', traveler: 'Странник' };
  const EMOJIS = { altar: '⛩️', mimic: '🎁', crystal: '💎', traveler: '🧙' };

  for (let i = 0; i < count; i++) {
    const pos = findFreeCell(map, cols, rows, avoidList.concat(events), 200, playerPos, locationId);
    if (!pos) continue;
    const type = types[Math.floor(Math.random() * types.length)];
    events.push({
      id: `event-${type}-${i}`,
      eventType: type,
      name: NAMES[type],
      emoji: EMOJIS[type],
      x: pos.x * TILE + TILE / 2,
      y: pos.y * TILE + TILE / 2,
      interactionRadius: 65,
      isEvent: true,
    });
  }
  return events;
}

export function openChest(chest) {
  chest.opened = true;
  const ow = state.overworld;
  if (chest.id && ow?.locationId) updateDungeonProgress(state.game?.player, ow.locationId, { chestId: chest.id });
  const p = state.game.player;
  const pool = ['health-potion', 'mana-potion', 'iron-sword', 'apprentice-staff', 'leather-armor'];
  const id = pool[Math.floor(Math.random() * pool.length)];
  const created = addItem(id);
  const inst = created[0];
  let msg = `📦 Сундук: ${ITEMS[id].name}`;
  if (inst && inst.rarity && inst.rarity !== 'common') msg = `📦 Сундук: ${RARITIES[inst.rarity].name} ${ITEMS[id].name}`;
  pushLog(msg, 'success');
  ow.floatingNumbers.push({ x: chest.x, y: chest.y - 20, text: '📦', type: 'heal', life: 1.5 });
  spawnParticles(chest.x, chest.y, 'spark', 8);
  playSound('chest');

  if (Math.random() < CHEST_HERB_CHANCE) {
    const herbId = Math.random() < 0.5 ? 'herb-life' : 'herb-moon';
    addItem(herbId, 1);
    pushLog(`🌿 Сундук: ${ITEMS[herbId].name}`, 'success');
  }

  updateQuestProgress('chest', 'chest', 1);

  if (!p.stats) p.stats = { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 };
  p.stats.chestsOpened = (p.stats.chestsOpened || 0) + 1;
  saveGame();
  checkAchievements();
}