import { ENEMIES } from '../data/enemies.js';
import { LOCATIONS } from '../data/locations.js';
import {
  TOWER_BIOMES, TOWER_MOB_POSITIONS, TOWER_FLOOR_COUNT,
  TOWER_FLOORS_PER_BIOME, TOWER_MOBS_PER_FLOOR, TOWER_START_LEVEL,
  TOWER_CHEST_FLOORS, TOWER_REPEAT_EXP_RATE
} from '../data/tower.js';

export function ensureTowerProgress(player) {
  if (!player) return null;
  if (!player.tower || typeof player.tower !== 'object' || Array.isArray(player.tower)) player.tower = {};
  const tower = player.tower;
  tower.highestCleared = Number.isInteger(tower.highestCleared) ? Math.max(0, Math.min(TOWER_FLOOR_COUNT, tower.highestCleared)) : 0;
  tower.checkpointFloor = Number.isInteger(tower.checkpointFloor) ? Math.max(1, Math.min(TOWER_FLOOR_COUNT, tower.checkpointFloor)) : 1;
  tower.clearedFloors = Array.isArray(tower.clearedFloors) ? [...new Set(tower.clearedFloors.filter(n => Number.isInteger(n) && n >= 1 && n <= TOWER_FLOOR_COUNT))].sort((a, b) => a - b) : [];
  tower.claimedChests = Array.isArray(tower.claimedChests) ? [...new Set(tower.claimedChests.filter(n => TOWER_CHEST_FLOORS.includes(n)))] : [];
  tower.checkpointFloor = Math.min(tower.checkpointFloor, Math.max(1, tower.highestCleared + 1));
  return tower;
}

export function getTowerFloorDefinition(floor) {
  if (!Number.isInteger(floor) || floor < 1 || floor > TOWER_FLOOR_COUNT) return null;
  const biomeIndex = Math.floor((floor - 1) / TOWER_FLOORS_PER_BIOME);
  const biome = TOWER_BIOMES[biomeIndex];
  const location = LOCATIONS[biome.locationId];
  if (!location) return null;
  const roster = location.enemies.filter(id => ENEMIES[id] && !ENEMIES[id].boss);
  if (!roster.length) return null;
  const mobs = TOWER_MOB_POSITIONS.map((position, index) => {
    const enemyId = roster[(floor + index - 1) % roster.length];
    const enemy = ENEMIES[enemyId];
    const scale = 1 + (floor - 1) * 0.075;
    return {
      id: `tower-${floor}-mob-${index + 1}`,
      enemyId,
      x: position.x,
      y: position.y,
      hp: Math.max(1, Math.round(enemy.hp * scale)),
      attack: Math.max(1, Math.round(enemy.attack * (1 + (floor - 1) * 0.045))),
      defense: Math.max(0, Math.round(enemy.defense * scale)),
      exp: enemy.exp
    };
  });
  return {
    floor,
    biomeId: biome.id,
    biomeName: biome.name,
    locationId: biome.locationId,
    requiredLevel: TOWER_START_LEVEL + (floor - 1) * 2,
    mobs,
    chestAvailable: TOWER_CHEST_FLOORS.includes(floor)
  };
}

export function canEnterTowerFloor(player, floor) {
  if (!player || !Number.isInteger(floor) || floor < 1 || floor > TOWER_FLOOR_COUNT) return false;
  const tower = ensureTowerProgress(player);
  return (player.level || 1) >= TOWER_START_LEVEL + (floor - 1) * 2 &&
    floor <= tower.checkpointFloor;
}

export function createTowerRun(player, floor = null) {
  const tower = ensureTowerProgress(player);
  const selectedFloor = floor ?? tower.checkpointFloor;
  if (!canEnterTowerFloor(player, selectedFloor)) return null;
  const definition = getTowerFloorDefinition(selectedFloor);
  if (!definition || definition.mobs.length !== TOWER_MOBS_PER_FLOOR) return null;
  return {
    ...definition,
    mobs: definition.mobs.map((mob, index) => ({ ...mob, defeated: false, active: index === 0 })),
    nextMobIndex: 0,
    completed: false,
    firstClear: !tower.clearedFloors.includes(selectedFloor)
  };
}

export function getActiveTowerMob(run) {
  if (!run || run.completed) return null;
  return run.mobs.find(mob => !mob.defeated) || null;
}

export function defeatActiveTowerMob(run, mobId) {
  if (!run || run.completed) return false;
  const active = getActiveTowerMob(run);
  if (!active || active.id !== mobId) return false;
  active.defeated = true;
  active.active = false;
  const next = getActiveTowerMob(run);
  if (next) next.active = true;
  else run.completed = true;
  return { floorComplete: run.completed, nextMob: next };
}

export function completeTowerFloor(player, run) {
  if (!player || !run || !run.completed || run.mobs.some(mob => !mob.defeated)) return null;
  const tower = ensureTowerProgress(player);
  const firstClear = !tower.clearedFloors.includes(run.floor);
  const baseExp = run.mobs.reduce((sum, mob) => sum + mob.exp, 0);
  const exp = Math.round(baseExp * (firstClear ? 1 : TOWER_REPEAT_EXP_RATE));
  if (firstClear) tower.clearedFloors.push(run.floor);
  tower.highestCleared = Math.max(tower.highestCleared, run.floor);
  if (run.floor < TOWER_FLOOR_COUNT && run.floor === tower.checkpointFloor) {
    tower.checkpointFloor = run.floor + 1;
  }
  const chestAvailable = TOWER_CHEST_FLOORS.includes(run.floor) && !tower.claimedChests.includes(run.floor);
  return { floor: run.floor, exp, firstClear, chestAvailable, checkpointFloor: tower.checkpointFloor, towerComplete: run.floor === TOWER_FLOOR_COUNT };
}

export function claimTowerChest(player, floor) {
  if (!player || !TOWER_CHEST_FLOORS.includes(floor)) return false;
  const tower = ensureTowerProgress(player);
  if (!tower.clearedFloors.includes(floor) || tower.claimedChests.includes(floor)) return false;
  tower.claimedChests.push(floor);
  return true;
}
