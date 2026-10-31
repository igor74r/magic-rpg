// 40-floor Tower: eight existing world biomes, five floors per biome.
export const TOWER_BIOMES = [
  { id: 'briar-hollow', name: 'Глухая чаща', locationId: 'briar-hollow' },
  { id: 'sunken-necropolis', name: 'Затонувший некрополь', locationId: 'sunken-necropolis' },
  { id: 'obsidian-fields', name: 'Обсидиановые поля', locationId: 'obsidian-fields' },
  { id: 'frost-citadel', name: 'Крепость вечного льда', locationId: 'frost-citadel' },
  { id: 'wasteland', name: 'Выжженная пустошь', locationId: 'wasteland' },
  { id: 'library', name: 'Забытая библиотека', locationId: 'library' },
  { id: 'dragon-lair', name: 'Логово дракона', locationId: 'dragon-lair' },
  { id: 'void-crater', name: 'Кратер Бездны', locationId: 'void-crater' }
];

export const TOWER_MOB_POSITIONS = [
  { x: 3, y: 3 }, { x: 7, y: 3 }, { x: 11, y: 3 }, { x: 15, y: 3 }, { x: 19, y: 3 },
  { x: 3, y: 8 }, { x: 7, y: 8 }, { x: 11, y: 8 }, { x: 15, y: 8 }, { x: 19, y: 8 }
];

export const TOWER_FLOOR_COUNT = 40;
export const TOWER_FLOORS_PER_BIOME = 5;
export const TOWER_MOBS_PER_FLOOR = 10;
export const TOWER_START_LEVEL = 10;
export const TOWER_CHEST_FLOORS = [10, 20, 30, 40];
export const TOWER_REPEAT_EXP_RATE = 0.25;
