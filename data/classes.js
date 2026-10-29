export const CLASSES = {
  mage: {
    name: "Маг", emoji: "🧙",
    desc: "Повелитель стихий. Очень слаб в ближнем бою, но его заклинания сокрушительны. Полностью зависит от маны.",
    baseStats: { maxHp: 80, maxMp: 120, str: 4, int: 16, wis: 8, con: 5 },
    startingSpells: ["fireball", "ice-bolt"],
    startingItems: ["mana-potion"],
    abilities: [
      { id: 'mana-shield', name: 'Щит маны', icon: '🛡️', cooldown: 4, cost: 15, desc: '+50% защиты на 2 хода' },
      { id: 'teleport',    name: 'Телепорт', icon: '💨', cooldown: 5, cost: 20, desc: 'Пропуск хода врага' },
      { id: 'meteor',      name: 'Метеор',   icon: '☄️', cooldown: 5, cost: 30, desc: '60 урона + ожог' }
    ]
  },
  warrior: {
    name: "Воин", emoji: "⚔️",
    desc: "Мастер клинка. Не знает заклинаний, но накапливает Ярость в бою и обрушивает её на врагов.",
    baseStats: { maxHp: 160, maxMp: 100, str: 16, int: 2, wis: 4, con: 14 },
    startingSpells: [],
    startingItems: ["health-potion", "iron-sword"],
    abilities: [
      { id: 'charge',      name: 'Рывок',          icon: '⚡', cooldown: 3, cost: 20, desc: '2× урон следующей атаки' },
      { id: 'war-cry',     name: 'Боевой клич',    icon: '📢', cooldown: 4, cost: 30, desc: '+30% атаки на 2 хода' },
      { id: 'bloodthirst', name: 'Кровожадность',  icon: '🩸', cooldown: 5, cost: 40, desc: 'Лечение на 50% урона (2 хода)' }
    ]
  },
  priest: {
    name: "Жрец", emoji: "✨",
    desc: "Служитель света. Может жертвовать своим здоровьем ради маны или спасения союзников.",
    baseStats: { maxHp: 110, maxMp: 80, str: 6, int: 10, wis: 16, con: 8 },
    startingSpells: ["heal", "holy-light", "sacrifice"],
    startingItems: ["health-potion", "mana-potion"],
    abilities: [
      { id: 'prayer',       name: 'Молитва',      icon: '🙏', cooldown: 4, cost: 10, desc: 'Хил 50 + снятие дебаффов' },
      { id: 'sanctify',     name: 'Освящение',    icon: '☀️', cooldown: 3, cost: 12, desc: '25 урона + ожог' },
      { id: 'resurrection', name: 'Воскрешение',  icon: '✨', cooldown: 999, cost: 0, desc: 'Раз за бой: возрождение с 30% HP', passive: true }
    ]
  }
};