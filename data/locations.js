export const LOCATIONS = {
  "village": {
    name: "Деревня Аврора", emoji: "🏘️",
    desc: "Тихая деревня. Здесь можно отдохнуть, поторговать и получить благословение.",
    enemies: [], safe: true, shop: true,
    theme: 'village',
    mapCols: 30, mapRows: 25,
    npcs: [
      // ГУЛЯЮТ ТОЛЬКО КОШКА И ДЕТИ
      { id: 'cat', emoji: '🐈', name: 'Кошка', x: 13, y: 14 },
      { id: 'kids', emoji: '👦', name: 'Дети', x: 17, y: 14 }
    ],
    statics: [
      // ФОНТАН: В центре
      { id: 'well', emoji: '⛲', name: 'Фонтан', x: 15, y: 12 },
      
      // ДОСКА: Левый верхний зелёный угол
      { id: 'questBoard', emoji: '📋', name: 'Доска объявлений', x: 13, y: 10 }, 
      // ГЛАШАТАЙ: Слева от доски на траве
      { id: 'herald', emoji: '📢', name: 'Глашатай', x: 11, y: 10 },
      // БАРД: Правый верхний зелёный угол
      { id: 'bard', emoji: '🎵', name: 'Бард', x: 17, y: 10 },

      // ОСТАЛЬНЫЕ NPC ФИКСИРОВАНЫ ВОЗЛЕ ДОМОВ
      { id: 'blacksmith', emoji: '⚒️', name: 'Кузнец', x: 12, y: 8 },
      { id: 'healer', emoji: '💚', name: 'Лекарь', x: 18, y: 8 },
      { id: 'alchemist', emoji: '⚗️', name: 'Алхимик', x: 12, y: 16 },
      { id: 'merchant', emoji: '🛒', name: 'Торговец', x: 18, y: 16 },
      { id: 'elder', emoji: '👴', name: 'Старейшина', x: 17, y: 6 },
      { id: 'guard', emoji: '🛡️', name: 'Стражник', x: 17, y: 19 }
    ]
  },
  "forest": { name: "Тёмный лес", emoji: "🌲", desc: "Древний лес, кишащий гоблинами. Здесь спрятан первый осколок.", enemies: ["goblin", "goblin", "skeleton"], shard: "forest", shardFrom: "skeleton" },
  "ruins": { name: "Руины павшего храма", emoji: "🏛️", desc: "Древние руины, где обитает нежить. Второй осколок здесь.", enemies: ["skeleton", "skeleton", "dark-knight"], shard: "ruins", shardFrom: "dark-knight" },
  "shadow": { name: "Пещера теней", emoji: "🕳️", desc: "Здесь царит вечная тьма. Обиталище теневого мага.", enemies: ["dark-knight", "shadow-mage"], shard: "shadow", shardFrom: "shadow-mage" },
  "swamp": { name: "Кровавая топь", emoji: "🩸", desc: "Гиблые топи на краю мира.", enemies: ["wolf", "skeleton-archer", "ghost"], theme: "swamp", chestsCount: 5, mapCols: 44, mapRows: 34 },
  "graveyard": { name: "Проклятое кладбище", emoji: "🪦", desc: "Забытые могилы, над которыми висит туман.", enemies: ["skeleton", "skeleton-archer", "ghost", "wraith", "grave-king"], theme: "graveyard", chestsCount: 4, mapCols: 42, mapRows: 32 },
  "volcano": { name: "Огненный разлом", emoji: "🌋", desc: "Раскалённые скалы и реки лавы.", enemies: ["fire-elemental", "magma-golem", "fire-elemental", "flame-lord"], theme: "volcano", chestsCount: 4, mapCols: 42, mapRows: 32 },
  "ice-peaks": { name: "Ледяные пики", emoji: "❄️", desc: "Вечная мерзлота и метель.", enemies: ["frost-wolf", "ice-elemental", "frost-wolf", "ice-queen"], theme: "ice", chestsCount: 4, mapCols: 42, mapRows: 32 },
  "wasteland": { name: "Пустошь", emoji: "🏜️", desc: "Выжженная земля под палящим солнцем.", enemies: ["sand-worm", "dust-wraith", "sand-worm", "sand-king"], theme: "desert", chestsCount: 4, mapCols: 42, mapRows: 32 },
  "library": { name: "Забытая библиотека", emoji: "📚", desc: "Древние фолианты хранят забытые знания.", enemies: ["flying-tome", "book-guardian", "archmage"], theme: "library", chestsCount: 5, mapCols: 42, mapRows: 32 },
  "dragon-lair": { name: "Логово дракона", emoji: "🐉", desc: "Финальное испытание. Древний дракон охраняет сокровища.", enemies: ["dragonling", "fire-drake", "dragon-guardian", "ancient-dragon"], theme: "dragon", chestsCount: 5, mapCols: 44, mapRows: 34 }
};