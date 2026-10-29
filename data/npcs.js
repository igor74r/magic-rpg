export const NPCS = {
  blacksmith: {
    id: 'blacksmith',
    name: 'Кузнец Борин', emoji: '⚒️',
    greeting: 'Клинок тупой? Принеси, наточу. Быстро и недёшево.',
    maxLevel: 3,
    upgrades: [
      { cost: 100, forgeBonus: 2 },
      { cost: 300, forgeBonus: 4 },
      { cost: 700, forgeBonus: 7 }
    ]
  },
  healer: {
    id: 'healer',
    name: 'Лекарь Мирра', emoji: '💚',
    greeting: 'Раны глубоки, но свет сильнее. Полное исцеление — 50 золота.',
    cost: 50
  },
  alchemist: {
    id: 'alchemist',
    name: 'Алхимик Сайрус', emoji: '⚗️',
    greeting: 'Травы собираешь? Неси, сварю зелье.',
    recipes: [
      { id: 'r-hp',  result: 'health-potion',        qty: 1, ingredients: [{ id: 'herb-life', qty: 3 }] },
      { id: 'r-mp',  result: 'mana-potion',          qty: 1, ingredients: [{ id: 'herb-moon', qty: 3 }] },
      { id: 'r-shp', result: 'strong-health-potion', qty: 1, ingredients: [{ id: 'herb-life', qty: 5 }] },
      { id: 'r-smp', result: 'strong-mana-potion',   qty: 1, ingredients: [{ id: 'herb-moon', qty: 5 }] }
    ]
  }
};

// Бонус к атрибуту за уровень ковки
export const FORGE_BONUS = [0, 2, 4, 7];