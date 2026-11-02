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

export function getVillageBuildingColliders(statics = LOCATIONS.village.statics) {
  const buildings = statics.filter(item => item?.buildingStyle);
  return buildings.flatMap(building => {
    const x = building.x * TILE + TILE / 2;
    const y = building.y * TILE + TILE / 2;
    const b = BUILDING_BODY;
    return [
      { id: building.id, x: x + b.left, y: y + b.top, width: -b.doorHalfWidth - b.left, height: b.bottom - b.top },
      { id: building.id, x: x + b.doorHalfWidth, y: y + b.top, width: b.right - b.doorHalfWidth, height: b.bottom - b.top },
      { id: building.id, x: x - b.doorHalfWidth, y: y + b.top, width: b.doorHalfWidth * 2, height: b.doorTop - b.top }
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

export function isVillagePositionBlocked(x, y, radius = 10, statics = LOCATIONS.village.statics) {
  return getVillageBuildingColliders(statics)
    .some(rect => circleIntersectsRect(x, y, radius, rect));
}
