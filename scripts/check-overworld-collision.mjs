import assert from 'node:assert/strict';
import { canOccupyPlayerPosition, isVillagePositionBlocked } from '../systems/overworld/collisions.js';
import { resolveSweptMovement } from '../systems/overworld/movement.js';

const open = Array.from({ length: 8 }, () => Array(8).fill(0));
const wall = open.map(row => [...row]);
wall[3][3] = 2;

assert.equal(canOccupyPlayerPosition(open, 8, 8, 3 * 48 + 24, 3 * 48 + 24, 12, 'forest'), true,
  'player must move freely on clear ground');
assert.equal(canOccupyPlayerPosition(wall, 8, 8, 3 * 48 + 24, 3 * 48 + 24, 12, 'forest'), false,
  'player center inside a blocked tile must be rejected');
assert.equal(canOccupyPlayerPosition(wall, 8, 8, 3 * 48 - 8, 3 * 48 - 8, 12, 'forest'), false,
  'player circle must not clip a diagonal obstacle corner');
assert.equal(canOccupyPlayerPosition(wall, 8, 8, 3 * 48 - 20, 3 * 48 + 24, 12, 'forest'), true,
  'player must remain able to pass beside a wall with sufficient clearance');
assert.equal(canOccupyPlayerPosition(wall, 8, 8, 3 * 48 - 4, 3 * 48 + 24, 12, 'forest'), false,
  'player footprint must not overlap a wall from the side');
assert.equal(canOccupyPlayerPosition(open, 8, 8, 24, 24, 12, 'forest'), true,
  'walkable map interior must remain traversable');
assert.equal(canOccupyPlayerPosition(open, 8, 8, 2, 24, 12, 'forest'), false,
  'player footprint must remain inside map bounds');

const building = { id: 'test-house', buildingStyle: 'home', x: 5, y: 5 };
const customVillage = [building];
assert.equal(isVillagePositionBlocked(5 * 48 + 24 - 66, 5 * 48 + 24, 12, customVillage), true,
  'custom village building wall must block the player');
assert.equal(isVillagePositionBlocked(5 * 48 + 24, 5 * 48 + 24 + 8, 10, customVillage), false,
  'custom village front doorway must stay open');

console.log('Overworld collision checks passed: full player footprint, diagonal corners, clearance, bounds and village doorways');

// A diagonal approach to a blocked corner should route around its edge,
// rather than always attempting the horizontal axis first.
const corner = (x, y) => !(x > 10 && x < 20 && y > 10 && y < 20);
const aroundCorner = resolveSweptMovement(0, 0, 28, 28, corner, 2);
assert.ok(aroundCorner.moved, 'corner navigation must make progress');
assert.ok(aroundCorner.x > 20 && aroundCorner.y > 20,
  'balanced sliding must get around the obstacle corner in both axes');
assert.equal(corner(aroundCorner.x, aroundCorner.y), true,
  'corner navigation must never finish inside the obstacle');

const horizontalWall = (x, y) => !(x > 8 && x < 24 && y > 8 && y < 16);
const slide = resolveSweptMovement(0, 12, 32, 0, horizontalWall, 2);
assert.ok(slide.x <= 8, 'movement must stop at the wall when no sliding axis is requested');

console.log('Corner navigation checks passed: balanced diagonal sliding and obstacle clearance');
