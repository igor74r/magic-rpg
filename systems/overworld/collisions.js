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

export function isVillagePositionBlocked(x, y, radius = 10, statics = LOCATIONS.village.statics) {
  return getVillageBuildingColliders(statics)
    .some(rect => circleIntersectsRect(x, y, radius, rect));
}
