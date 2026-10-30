export const CLASSES = {
  warrior: {
    name: "Воин", emoji: "⚔️",
    desc: "Крепкий боец ближнего боя. Не знает заклинаний, но использует Ярость для мощных атак.",
    baseStats: { maxHp: 150, maxMp: 100, str: 16, int: 4, wis: 6, con: 14 },
    startingSpells: [],
    startingItems: ["iron-sword", "health-potion"],
    abilities: [
      { id: 'charge', name: 'Рывок', icon: '⚡', cooldown: 3, cost: 20, desc: '2× урон следующей атаки' },
      { id: 'war-cry', name: 'Боевой клич', icon: '📢', cooldown: 4, cost: 30, desc: '+30% атаки на 2 хода' },
      { id: 'bloodthirst', name: 'Кровожадность', icon: '🩸', cooldown: 5, cost: 40, desc: 'Лечение на 50% урона (2 хода)' }
    ]
  },
  mage: {
    name: "Маг", emoji: "🧙",
    desc: "Повелитель стихий. Слаб в ближнем бою, но наносит огромный магический урон.",
    baseStats: { maxHp: 90, maxMp: 160, str: 4, int: 18, wis: 10, con: 6 },
    startingSpells: ["fireball", "ice-bolt"],
    startingItems: ["apprentice-staff", "mana-potion"],
    abilities: [
      { id: 'mana-shield', name: 'Щит маны', icon: '🛡️', cooldown: 4, cost: 15, desc: '+50% защиты на 2 хода' },
      { id: 'teleport', name: 'Телепорт', icon: '💨', cooldown: 5, cost: 20, desc: 'Пропуск хода врага' },
      { id: 'meteor', name: 'Метеор', icon: '☄️', cooldown: 5, cost: 30, desc: '60 урона + ожог' }
    ]
  },
  archer: {
    name: "Лучник", emoji: "🏹",
    desc: "Меткий стрелок. Полагается на ловкость, точность и смертоносные яды.",
    baseStats: { maxHp: 110, maxMp: 100, str: 12, int: 10, wis: 8, con: 10 },
    startingSpells: ["poison-arrow"],
    startingItems: ["iron-sword", "health-potion"],
    abilities: [
      { id: 'aimed-shot', name: 'Прицельный выстрел', icon: '🎯', cooldown: 3, cost: 15, desc: 'Гарантированный крит' },
      { id: 'evasion', name: 'Уклонение', icon: '💨', cooldown: 4, cost: 20, desc: 'Уклонение от атаки' },
      { id: 'toxic-blade', name: 'Ядовитый клинок', icon: '☠️', cooldown: 3, cost: 20, desc: 'Накладывает сильный яд' }
    ]
  }
};