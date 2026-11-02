import { state } from './state.js';
import { LOCATIONS } from '../data/locations.js';
import { on, emit } from './events.js';
import { getRandomRiftLocation, getRiftLocation, getRiftLocations, endRift, recordRiftFloor } from './rift.js';
import { getTowerLocation, recordTowerFloor, endTower } from './tower.js';
import { TILE, generateMap } from './overworld/map.js';
import { spawnEnemies, spawnChests, spawnNPCs, spawnStatics, spawnEvents } from './overworld/spawn.js';
import { initCamera } from './overworld/ai.js';
import { combatFlee, clearPlayerEffects } from './overworld/combat.js';

export { TILE } from './overworld/map.js';
export { tryMovePlayer, updateOverworld } from './overworld/ai.js';
export { triggerShake, combatAttack, combatCastSpell, combatUseAbility, combatUseItem, combatBlock, combatFlee } from './overworld/combat.js';
export { spawnParticles } from './overworld/particles.js';

export function enterOverworld(locationId, opts = {}) {
  const loc = LOCATIONS[locationId] || getRiftLocation(locationId) || (opts.towerMode ? getTowerLocation(opts.towerFloor || 1) : null);
  if (!loc) return;
  const sourceLocationId = loc.sourceId || locationId;
  if (!loc.safe && !loc.enemies?.length) return;

  const cols = loc.mapCols || 40;
  const rows = loc.mapRows || 30;
  const map = generateMap(locationId, cols, rows);

  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);

  let spawnX = cx;
  let spawnY = cy;
  if (locationId === 'village') spawnY = cy + 4;

  const playerPos = { x: spawnX * TILE + TILE / 2, y: spawnY * TILE + TILE / 2 };

  const enemies = spawnEnemies(loc, map, cols, rows, playerPos, opts, sourceLocationId);
  const chests = spawnChests(loc, map, cols, rows, enemies, playerPos, sourceLocationId);
  const npcs = spawnNPCs(loc);
  const statics = spawnStatics(loc, locationId, cols, rows);
  const events = spawnEvents(loc, map, cols, rows, playerPos, sourceLocationId, [...enemies, ...chests]);
  const camera = initCamera(playerPos, cols, rows);

  state.overworld = {
    active: true, locationId, locationName: loc.name, sourceLocationId, theme: loc.theme || 'default',
    safe: !!loc.safe,
    rifMode: !!opts.rifMode, rifFloor: opts.rifFloor || 1,
    towerMode: !!opts.towerMode, towerFloor: opts.towerFloor || 1,
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
}

export function exitOverworld() {
  const ow = state.overworld;
  if (!ow) return;
  if (ow.combat) {
    if (!confirm('Выйти из боя? Это будет считаться побегом.')) return;
    combatFlee(true);
  }
  if (ow.rifMode) endRift();
  if (ow.towerMode) {
    const result = endTower(ow.towerFloor - 1);
    emit('toast', result.newRecord ? `🏰 Новый рекорд Башни: этаж ${result.best}!` : `🏰 Башня: этаж ${result.best}/40`);
  }
  clearPlayerEffects();
  state.overworld = null;
  emit('overworld:end');
}

export function advanceTowerFloor(clearedFloor = null) {
  const ow = state.overworld;
  if (!ow || !ow.towerMode) return;
  // Ignore delayed/duplicate completion events from a floor already left.
  if (clearedFloor !== null && clearedFloor !== ow.towerFloor) return;
  recordTowerFloor(ow.towerFloor);
  if (ow.towerFloor >= 40) {
    const result = endTower(40);
    state.overworld = null;
    clearPlayerEffects();
    emit('overworld:end');
    emit('tower:completed', result);
    emit('toast', '🏆 Башня пройдена! Все 40 этажей покорены.');
    return;
  }
  const nextFloor = ow.towerFloor + 1;
  emit('toast', `🏰 Башня · этаж ${nextFloor}/40`);
  enterOverworld(`tower-floor-${String(nextFloor).padStart(2, '0')}`, { towerMode: true, towerFloor: nextFloor });
}

export function advanceRiftFloor(clearedFloor = null) {
  const ow = state.overworld;
  if (!ow || !ow.rifMode) return;
  // Ignore delayed/duplicate completion events from a floor already left.
  if (clearedFloor !== null && clearedFloor !== ow.rifFloor) return;
  const nextFloor = ow.rifFloor + 1;
  const player = state.game?.player;
  if (player) {
    if (!Array.isArray(player.riftClearedLocations)) player.riftClearedLocations = [];
    if (!player.riftClearedLocations.includes(ow.locationId)) player.riftClearedLocations.push(ow.locationId);
  }
  const level = player?.level || 1;
  const unlocked = getRiftLocations(level).filter(location => location.unlocked);
  const allCleared = unlocked.length > 0 && unlocked.every(location => player?.riftClearedLocations?.includes(location.id));
  if (allCleared && player) player.riftClearedLocations = [];
  const locId = getRandomRiftLocation(ow.locationId, level, player?.riftClearedLocations || []);
  if (!locId) { endRift(); emit('toast', 'Нет доступных областей Разлома для вашего уровня'); return; }
  recordRiftFloor(nextFloor);
  emit('toast', `🌀 Этаж ${nextFloor}`);
  enterOverworld(locId, { rifMode: true, rifFloor: nextFloor });
}

on('rift:floor-cleared', payload => advanceRiftFloor(payload?.floor ?? null));
on('tower:floor-cleared', payload => advanceTowerFloor(payload?.floor ?? null));
on('rift:defeated', () => {
  const ow = state.overworld;
  if (ow && ow.rifMode) endRift();
});