import { LOCATIONS } from '../../data/locations.js';
import { TILE } from './map.js';

// The collision silhouette follows drawVillageBuilding() in ui/overworld/sprites.js.
// The central south opening is intentionally left clear as the front doorway.
const BUILDING_BODY = Object.freeze({
  left: -37,
  right: 37,
  top: -24,
  bottom: 21,
  doorHalfWidth: 14,
  doorTop: -5
});

// Solid square-footprint props in Aurora. Decorative lanterns/flowers are
// intentionally excluded so the plaza remains open and comfortable to walk.
const SOLID_PROP_STYLES = new Set(['fountain', 'bench', 'memorial', 'anvil', 'woodpile', 'cart', 'barrels', 'stall', 'herb-rack']);
const PROP_HALF_SIZE = Object.freeze({
  fountain: 18, bench: 17, memorial: 13, anvil: 13, woodpile: 15,
  cart: 18, barrels: 14, stall: 20, 'herb-rack': 14
});

export function getVillageBuildingColliders(statics = LOCATIONS.village.statics) {
  const buildings = statics.filter(item => item?.buildingStyle);
  return buildings.flatMap(building => {
    const x = building.x * TILE + TILE / 2;
    const y = building.y * TILE + TILE / 2;
    const b = BUILDING_BODY;
    const width = b.right - b.left;
    const height = b.bottom - b.top;
    const sideWidth = (width - b.doorHalfWidth * 2) / 2;
    const doorwayWidth = b.doorHalfWidth * 2;
    return [
      { id: building.id, part: 'left-wall', x: x + b.left, y: y + b.top, width: sideWidth, height },
      { id: building.id, part: 'right-wall', x: x + b.doorHalfWidth, y: y + b.top, width: sideWidth, height },
      { id: building.id, part: 'back-wall', x: x - b.doorHalfWidth, y: y + b.top, width: doorwayWidth, height: b.doorTop - b.top }
    ];
  });
}

function circleIntersectsRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  const dx = x - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function getVillagePropColliders(statics = LOCATIONS.village.statics) {
  return statics.filter(item => item?.propStyle && SOLID_PROP_STYLES.has(item.propStyle))
    .map(item => {
      const half = PROP_HALF_SIZE[item.propStyle] || 14;
      return {
        id: item.id,
        part: 'solid-prop',
        x: item.x * TILE + TILE / 2 - half,
        y: item.y * TILE + TILE / 2 - half,
        width: half * 2,
        height: half * 2
      };
    });
}

export function isVillagePositionBlocked(x, y, radius = 10, statics = LOCATIONS.village.statics) {
  return [...getVillageBuildingColliders(statics), ...getVillagePropColliders(statics)]
    .some(rect => circleIntersectsRect(x, y, radius, rect));
}
