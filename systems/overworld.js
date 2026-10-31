import { state } from './state.js';
import { LOCATIONS } from '../data/locations.js';
import { on, emit } from './events.js';
import { getRandomRiftLocation, endRift, recordRiftFloor } from './rift.js';
import { TILE, generateMap, getDungeonStairCells } from './overworld/map.js';
import { spawnEnemies, spawnChests, spawnNPCs, spawnStatics, spawnEvents } from './overworld/spawn.js';
import { initCamera } from './overworld/ai.js';
import { combatFlee, clearPlayerEffects } from './overworld/combat.js';
import { recordLocationVisit, getDungeonProgress, updateDungeonProgress } from './exploration.js';
import { saveGame } from './save.js';

export { TILE } from './overworld/map.js';
export { tryMovePlayer, updateOverworld } from './overworld/ai.js';
export { triggerShake, combatAttack, combatCastSpell, combatUseAbility, combatUseItem, combatBlock, combatFlee } from './overworld/combat.js';
export { spawnParticles } from './overworld/particles.js';

export function enterOverworld(locationId, opts = {}) {
  const loc = LOCATIONS[locationId];
  if (!loc) return;
  if (!loc.safe && !loc.enemies?.length) return;

  recordLocationVisit(state.game?.player, locationId);
  const savedDungeon = getDungeonProgress(state.game?.player, locationId);
  const dungeonFloor = loc.safe ? 1 : Math.max(1, Math.min(999, Math.floor(Number(opts.dungeonFloor ?? savedDungeon?.floor) || 1)));
  if (!loc.safe) updateDungeonProgress(state.game?.player, locationId, { floor: dungeonFloor });
  const cols = loc.mapCols || 40;
  const rows = loc.mapRows || 30;
  const map = generateMap(locationId, cols, rows);
  const dungeonStairs = loc.safe ? [] : getDungeonStairCells(cols, rows, dungeonFloor);
  for (const stair of dungeonStairs) {
    // Carve a guaranteed L-shaped corridor from the central road to each stair.
    for (let x = Math.min(Math.floor(cols / 2), stair.x); x <= Math.max(Math.floor(cols / 2), stair.x); x++) {
      if (map[Math.floor(rows / 2)] && map[Math.floor(rows / 2)][x] !== undefined) map[Math.floor(rows / 2)][x] = 1;
    }
    for (let y = Math.min(Math.floor(rows / 2), stair.y); y <= Math.max(Math.floor(rows / 2), stair.y); y++) {
      if (map[y] && map[y][stair.x] !== undefined) map[y][stair.x] = 1;
    }
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const x = stair.x + ox, y = stair.y + oy;
      if (map[y] && map[y][x] !== undefined) map[y][x] = 1;
    }
  }

  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);

  let spawnX = cx;
  let spawnY = cy;
  if (locationId === 'village') spawnY = cy + 4;

  const playerPos = { x: spawnX * TILE + TILE / 2, y: spawnY * TILE + TILE / 2 };

  const enemies = spawnEnemies(loc, map, cols, rows, playerPos, opts, locationId);
  const chests = spawnChests(loc, map, cols, rows, enemies, playerPos, locationId);
  const npcs = spawnNPCs(loc);
  const statics = spawnStatics(loc);
  const events = spawnEvents(loc, map, cols, rows, playerPos, locationId, [...enemies, ...chests]);
  const camera = initCamera(playerPos, cols, rows);

  state.overworld = {
    active: true, locationId, theme: loc.theme || 'default',
    safe: !!loc.safe,
    rifMode: !!opts.rifMode, rifFloor: opts.rifFloor || 1,
    dungeonFloor, dungeonStairs,
    cols, rows, tile: TILE, map,
    player: {
      x: playerPos.x, y: playerPos.y,
      hp: state.game.player.hp, maxHp: state.game.player.maxHp,
      mp: state.game.player.mp, maxMp: state.game.player.maxMp
    },
    keys: {}, enemies, chests, npcs, statics, events,
    camera, shake: { t: 0, mag: 0 },
    combat: null, defeated: false,
    floatingNumbers: [], particles: [], log: [],
  };

  emit('overworld:start');
  // Persist the checkpoint as soon as a region is entered.
  saveGame();
}

export function exitOverworld() {
  const ow = state.overworld;
  if (!ow) return;
  if (ow.combat) {
    if (!confirm('Выйти из боя? Это будет считаться побегом.')) return;
    combatFlee(true);
  }
  if (ow.rifMode) endRift();
  clearPlayerEffects();
  state.overworld = null;
  emit('overworld:end');
}

// Обычные подземелья используют отдельную систему этажей; Разлом остаётся независимым.
export function transitionDungeonFloor(direction = 1) {
  const ow = state.overworld;
  if (!ow?.active || ow.safe || ow.rifMode || ow.combat || ow.defeated) return false;
  const delta = Math.trunc(Number(direction));
  if (!Number.isFinite(delta) || Math.abs(delta) !== 1) return false;
  const currentFloor = Math.max(1, Math.floor(Number(ow.dungeonFloor) || 1));
  const nextFloor = Math.max(1, Math.min(999, currentFloor + delta));
  if (nextFloor === currentFloor) return false;
  updateDungeonProgress(state.game?.player, ow.locationId, { floor: nextFloor });
  saveGame();
  emit('dungeon:floor-changing', { locationId: ow.locationId, from: currentFloor, to: nextFloor });
  enterOverworld(ow.locationId, { dungeonFloor: nextFloor });
  emit('toast', `🏰 Этаж подземелья: ${nextFloor}`);
  return true;
}

export function returnToDungeonEntrance() {
  const ow = state.overworld;
  if (!ow?.active || ow.safe || ow.rifMode || ow.combat || ow.defeated || (ow.dungeonFloor || 1) <= 1) return false;
  return transitionDungeonFloor(-1);
}

export function advanceRiftFloor() {
  const ow = state.overworld;
  if (!ow || !ow.rifMode) return;
  const nextFloor = ow.rifFloor + 1;
  const locId = getRandomRiftLocation(ow.locationId, nextFloor);
  recordRiftFloor(nextFloor);
  emit('toast', `🌀 Этаж ${nextFloor}`);
  enterOverworld(locId, { rifMode: true, rifFloor: nextFloor });
}

on('rift:floor-cleared', () => advanceRiftFloor());
on('rift:defeated', () => {
  const ow = state.overworld;
  if (ow && ow.rifMode) endRift();
});