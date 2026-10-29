export const LOCATIONS = {
  "village": {
    name: "Деревня Аврора", emoji: "🏘️",
    desc: "Тихая деревня на краю мира. Здесь вы начинаете свой путь.",
    enemies: [], shop: true
  },
  "forest": {
    name: "Тёмный лес", emoji: "🌲",
    desc: "Древний лес, кишащий гоблинами. Здесь спрятан первый осколок.",
    enemies: ["goblin", "goblin", "skeleton"],
    shard: "forest", shardFrom: "skeleton"
  },
  "ruins": {
    name: "Руины павшего храма", emoji: "🏛️",
    desc: "Древние руины, где обитает нежить. Второй осколок здесь.",
    enemies: ["skeleton", "skeleton", "dark-knight"],
    shard: "ruins", shardFrom: "dark-knight"
  },
  "shadow": {
    name: "Пещера теней", emoji: "🕳️",
    desc: "Здесь царит вечная тьма. Обиталище теневого мага.",
    enemies: ["dark-knight", "shadow-mage"],
    shard: "shadow", shardFrom: "shadow-mage"
  },
  "swamp": {
    name: "Кровавая топь", emoji: "🩸",
    desc: "Гиблые топи на краю мира. Волки, скелеты-лучник и призраки стерегут богатства.",
    enemies: ["wolf", "skeleton-archer", "ghost"],
    theme: "swamp",
    chestsCount: 5,
    mapCols: 44, mapRows: 34
  },
  "graveyard": {
    name: "Проклятое кладбище", emoji: "🪦",
    desc: "Забытые могилы, над которыми висит туман. Здесь неупокоенные души охраняют древние сокровища.",
    enemies: ["skeleton", "skeleton-archer", "ghost", "wraith", "grave-king"],
    theme: "graveyard",
    chestsCount: 4,
    mapCols: 42, mapRows: 32
  },
  "volcano": {
    name: "Огненный разлом", emoji: "🌋",
    desc: "Раскалённые скалы и реки лавы. Обиталище огненных элементалей и Владыки пламени.",
    enemies: ["fire-elemental", "magma-golem", "fire-elemental", "flame-lord"],
    theme: "volcano",
    chestsCount: 4,
    mapCols: 42, mapRows: 32
  },
  "ice-peaks": {
    name: "Ледяные пики", emoji: "❄️",
    desc: "Вечная мерзлота и метель. Здесь обитают ледяные твари и Королева стужи.",
    enemies: ["frost-wolf", "ice-elemental", "frost-wolf", "ice-queen"],
    theme: "ice",
    chestsCount: 4,
    mapCols: 42, mapRows: 32
  },
  "wasteland": {
    name: "Пустошь", emoji: "🏜️",
    desc: "Выжженная земля под палящим солнцем. Песчаные черви и призраки пустыни стерегут сокровища.",
    enemies: ["sand-worm", "dust-wraith", "sand-worm", "sand-king"],
    theme: "desert",
    chestsCount: 4,
    mapCols: 42, mapRows: 32
  },
  "library": {
    name: "Забытая библиотека", emoji: "📚",
    desc: "Древние фолианты хранят забытые знания. Летающие книги, книжные стражи и архимаги не пускают чужаков.",
    enemies: ["flying-tome", "book-guardian", "archmage"],
    theme: "library",
    chestsCount: 5,
    mapCols: 42, mapRows: 32
  },
  "dragon-lair": {
    name: "Логово дракона", emoji: "🐉",
    desc: "Финальное испытание. Древний дракон охраняет сокровища, о которых слагают легенды. Готов ли ты?",
    enemies: ["dragonling", "fire-drake", "dragon-guardian", "ancient-dragon"],
    theme: "dragon",
    chestsCount: 5,
    mapCols: 44, mapRows: 34
  }
};