import { state } from './state.js';
import { LOCATIONS } from '../data/locations.js';
import { on, emit } from './events.js';
import { getRandomRiftLocation, endRift } from './rift.js';
import { TILE, generateMap } from './overworld/map.js';
import { spawnEnemies, spawnChests } from './overworld/spawn.js';
import { initCamera } from './overworld/ai.js';
import { combatFlee, clearPlayerEffects } from './overworld/combat.js';

// ---------- Реэкспорт публичного API ----------

export { TILE } from './overworld/map.js';

export { tryMovePlayer, updateOverworld } from './overworld/ai.js';

export {
  triggerShake,
  combatAttack,
  combatCastSpell,
  combatUseAbility,
  combatUseItem,
  combatBlock,
  combatFlee
} from './overworld/combat.js';

export { spawnParticles } from './overworld/particles.js';

// ---------- Оркестрация переходов ----------

export function enterOverworld(locationId, opts = {}) {
  const loc = LOCATIONS[locationId];
  if (!loc || !loc.enemies?.length) return;

  const cols = loc.mapCols || 40;
  const rows = loc.mapRows || 30;
  const map = generateMap(locationId, cols, rows);
  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2);
  const playerPos = { x: cx * TILE + TILE / 2, y: cy * TILE + TILE / 2 };

  const enemies = spawnEnemies(loc, map, cols, rows, playerPos, opts);
  const chests = spawnChests(loc, map, cols, rows, enemies, playerPos);
  const camera = initCamera(playerPos, cols, rows);

  state.overworld = {
    active: true,
    locationId,
    theme: loc.theme || 'default',
    rifMode: !!opts.rifMode,
    rifFloor: opts.rifFloor || 1,
    cols, rows, tile: TILE, map,
    player: {
      x: playerPos.x, y: playerPos.y,
      hp: state.game.player.hp, maxHp: state.game.player.maxHp,
      mp: state.game.player.mp, maxMp: state.game.player.maxMp
    },
    keys: {}, enemies, chests,
    camera,
    shake: { t: 0, mag: 0 },
    combat: null,
    defeated: false,
    floatingNumbers: [],
    particles: [],
    log: [],
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
  clearPlayerEffects();
  state.overworld = null;
  emit('overworld:end');
}

export function advanceRiftFloor() {
  const ow = state.overworld;
  if (!ow || !ow.rifMode) return;
  const nextFloor = ow.rifFloor + 1;
  const locId = getRandomRiftLocation(ow.locationId);
  emit('toast', `🌀 Этаж ${nextFloor}`);
  enterOverworld(locId, { rifMode: true, rifFloor: nextFloor });
}

// ---------- Подписки на события боя ----------

on('rift:floor-cleared', () => {
  advanceRiftFloor();
});

on('rift:defeated', () => {
  const ow = state.overworld;
  if (ow && ow.rifMode) endRift();
});