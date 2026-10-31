export const LOCATIONS = {
  village: {
    name: 'Деревня Аврора',
    emoji: '🏘️',
    desc: 'Укреплённый торговый посёлок у подножия старого тракта. Центральная площадь, мастерские, лечебный дом, рынок и квартал жителей.',
    enemies: [],
    safe: true,
    shop: true,
    theme: 'village',
    mapCols: 40,
    mapRows: 32,
    npcs: [
      { id: 'cat', emoji: '🐈', name: 'Кошка', x: 18, y: 18 },
      { id: 'kids', emoji: '👦', name: 'Дети', x: 23, y: 18 }
    ],
    statics: [
      { id: 'well', emoji: '⛲', name: 'Фонтан площади', x: 20, y: 16 },
      { id: 'questBoard', emoji: '📋', name: 'Доска объявлений', x: 18, y: 13 },
      { id: 'herald', emoji: '📢', name: 'Глашатай', x: 16, y: 13 },
      { id: 'bard', emoji: '🎵', name: 'Бард', x: 24, y: 13 },
      { id: 'blacksmith', emoji: '⚒️', name: 'Кузнец', x: 11, y: 8 },
      { id: 'healer', emoji: '💚', name: 'Лекарь', x: 29, y: 8 },
      { id: 'alchemist', emoji: '⚗️', name: 'Алхимик', x: 11, y: 23 },
      { id: 'merchant', emoji: '🛒', name: 'Торговец', x: 29, y: 23 },
      { id: 'elder', emoji: '👴', name: 'Старейшина', x: 20, y: 5 },
      { id: 'guard', emoji: '🛡️', name: 'Стражник', x: 20, y: 27 }
    ]
  },

  forest: {
    name: 'Тёмный лес',
    emoji: '🌲',
    desc: 'Древний лес, кишащий гоблинами. Здесь спрятан первый осколок.',
    theme: 'forest',
    enemies: ['goblin', 'goblin', 'skeleton', 'thorn-stalker'],
    shard: 'forest',
    shardFrom: 'skeleton'
  },

  ruins: {
    name: 'Руины павшего храма',
    emoji: '🏛️',
    desc: 'Древние руины, где обитает нежить. Второй осколок здесь.',
    theme: 'ruins',
    enemies: ['skeleton', 'skeleton', 'dark-knight', 'grave-scout'],
    shard: 'ruins',
    shardFrom: 'dark-knight'
  },

  shadow: {
    name: 'Пещера теней',
    emoji: '🕳️',
    desc: 'Здесь царит вечная тьма. Обиталище теневого мага.',
    theme: 'shadow',
    enemies: ['dark-knight', 'shadow-mage'],
    shard: 'shadow',
    shardFrom: 'shadow-mage'
  },

  swamp: {
    name: 'Кровавая топь',
    emoji: '🩸',
    desc: 'Гиблые топи на краю мира.',
    enemies: ['wolf', 'skeleton-archer', 'ghost', 'spore-shaman'],
    theme: 'swamp',
    chestsCount: 5,
    mapCols: 44,
    mapRows: 34
  },

  graveyard: {
    name: 'Проклятое кладбище',
    emoji: '🪦',
    desc: 'Забытые могилы, над которыми висит туман.',
    enemies: ['skeleton', 'skeleton-archer', 'ghost', 'wraith', 'grave-scout', 'crypt-hound', 'grave-king'],
    theme: 'graveyard',
    chestsCount: 4,
    mapCols: 42,
    mapRows: 32
  },

  volcano: {
    name: 'Огненный разлом',
    emoji: '🌋',
    desc: 'Раскалённые скалы и реки лавы.',
    enemies: ['fire-elemental', 'magma-golem', 'ash-harpy', 'obsidian-guard', 'flame-lord'],
    theme: 'volcano',
    chestsCount: 4,
    mapCols: 42,
    mapRows: 32
  },

  'ice-peaks': {
    name: 'Ледяные пики',
    emoji: '❄️',
    desc: 'Вечная мерзлота и метель.',
    enemies: ['frost-wolf', 'ice-elemental', 'rime-witch', 'frost-giant', 'ice-queen'],
    theme: 'ice',
    chestsCount: 4,
    mapCols: 42,
    mapRows: 32
  },

  wasteland: {
    name: 'Пустошь',
    emoji: '🏜️',
    desc: 'Выжженная земля под палящим солнцем.',
    enemies: ['sand-worm', 'dust-wraith', 'sand-worm', 'sand-king'],
    theme: 'desert',
    chestsCount: 4,
    mapCols: 42,
    mapRows: 32
  },

  library: {
    name: 'Забытая библиотека',
    emoji: '📚',
    desc: 'Древние фолианты хранят забытые знания.',
    enemies: ['flying-tome', 'book-guardian', 'archmage'],
    theme: 'library',
    chestsCount: 5,
    mapCols: 42,
    mapRows: 32
  },

  'dragon-lair': {
    name: 'Логово дракона',
    emoji: '🐉',
    desc: 'Финальное испытание. Древний дракон охраняет сокровища.',
    enemies: ['dragonling', 'fire-drake', 'dragon-guardian', 'ancient-dragon'],
    theme: 'dragon',
    chestsCount: 5,
    mapCols: 44,
    mapRows: 34
  },

  // ---------- ПЯТЬ НОВЫХ РЕГИОНОВ КАМПАНИИ ----------
  'briar-hollow': {
    name: 'Глухая чаща',
    emoji: '🌳',
    desc: 'Запутанные корни, грибные круги и святилище, в котором проснулся Древний энт.',
    theme: 'briar-hollow',
    enemies: ['thorn-stalker', 'spore-shaman', 'moss-troll', 'rootbound-sentinel', 'goblin', 'elder-treant'],
    chestsCount: 5,
    mapCols: 44,
    mapRows: 34
  },

  'sunken-necropolis': {
    name: 'Затонувший некрополь',
    emoji: '⚰️',
    desc: 'Подземный город мёртвых. Затопленные крипты ведут к трону Костяного тирана.',
    theme: 'sunken-necropolis',
    enemies: ['grave-scout', 'crypt-hound', 'drowned-scribe', 'bone-colossus', 'grave-king', 'bone-tyrant'],
    chestsCount: 5,
    mapCols: 44,
    mapRows: 34
  },

  'obsidian-fields': {
    name: 'Обсидиановые поля',
    emoji: '🌋',
    desc: 'Застывшие лавовые реки, чёрные башни и гарпии, кружащие над жерлом.',
    theme: 'obsidian-fields',
    enemies: ['fire-elemental', 'ash-harpy', 'ashbound-renegade', 'obsidian-guard', 'magma-golem', 'flame-lord'],
    chestsCount: 5,
    mapCols: 44,
    mapRows: 34
  },

  'frost-citadel': {
    name: 'Крепость вечного льда',
    emoji: '🏔️',
    desc: 'Старая цитадель погребена в леднике. В её залах не тает даже пламя.',
    theme: 'frost-citadel',
    enemies: ['frost-wolf', 'rime-witch', 'mirror-revenant', 'ice-elemental', 'frost-giant', 'ice-queen'],
    chestsCount: 5,
    mapCols: 44,
    mapRows: 34
  },

  'void-crater': {
    name: 'Кратер Бездны',
    emoji: '🌀',
    desc: 'Разлом между мирами. Пространство искажено, а древние драконы стерегут сердце тьмы.',
    theme: 'void-crater',
    enemies: ['dragonling', 'fire-drake', 'dragon-guardian', 'riftstalker', 'void-harbinger', 'ancient-dragon'],
    chestsCount: 6,
    mapCols: 46,
    mapRows: 36
  }
};