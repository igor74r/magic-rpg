export const NPCS = {
  blacksmith: {
    id: 'blacksmith', name: 'Кузнец Борин', emoji: '⚒️',
    greetings: ['Клинок тупой? Принеси, наточу.', 'Быстро и недёшево.', 'Эх, раньше сталь была лучше...'],
    maxLevel: 3,
    upgrades: [{ cost: 30, forgeBonus: 2 }, { cost: 75, forgeBonus: 4 }, { cost: 140, forgeBonus: 7 }]
  },
  healer: {
    id: 'healer', name: 'Лекарь Мирра', emoji: '💚',
    greetings: ['Раны глубоки, но свет сильнее.', 'Полное исцеление — 50 золота.', 'Не умирай, странник.'],
    cost: 8
  },
  alchemist: {
    id: 'alchemist', name: 'Алхимик Сайрус', emoji: '⚗️',
    greetings: ['Травы собираешь? Неси, сварю.', 'Осторожно, не взболтай!', 'Лунная трава светится в темноте...'],
    recipes: [
      { id: 'r-hp',  result: 'health-potion', qty: 1, ingredients: [{ id: 'herb-life', qty: 3 }] },
      { id: 'r-mp',  result: 'mana-potion', qty: 1, ingredients: [{ id: 'herb-moon', qty: 3 }] },
      { id: 'r-shp', result: 'strong-health-potion', qty: 1, ingredients: [{ id: 'herb-life', qty: 5 }] },
      { id: 'r-smp', result: 'strong-mana-potion', qty: 1, ingredients: [{ id: 'herb-moon', qty: 5 }] }
    ]
  },
  merchant: {
    id: 'merchant', name: 'Странствующий торговец', emoji: '🛒',
    greetings: ['Товар редкий, цена честная!', 'Смотри, не проходи мимо!', 'Золотишко водится?'],
    stock: [
      "health-potion", "mana-potion", "strong-health-potion", "strong-mana-potion", "antidote",
      "strength-elixir", "mana-elixir", "scroll-lightning", "scroll-shield", "restorative-potion",
      "rootbound-hood", "cinder-visor", "duelist-grips", "gravebinder-gloves",
      "windstep-boots", "glacier-greaves", "amulet-first-light", "pendant-last-oath",
      "ring-wolf-eye", "ring-quiet-tide",
      "rune-root", "rune-ember", "rune-tide", "rune-frost", "rune-void"
    ]
  },
  elder: {
    id: 'elder', name: 'Старейшина Эдвин', emoji: '👴',
    greetings: ['Осколки ждут тебя, странник.', 'Прими моё благословение.', 'Тьма отступит перед светом.'],
    buffId: 'elderBlessing'
  },
  well: {
    id: 'well', name: 'Древний колодец', emoji: '⛲',
    greetings: ['Вода чиста и прохладна.', 'Она восстановит твои силы.']
  },
  bard: {
    id: 'bard', name: 'Бард Лютик', emoji: '🎵',
    greetings: ['Спою тебе о героях!', 'Скидка для смельчаков!', 'Монетку — и песня твоя!'],
    cost: 4
  },
  guard: {
    id: 'guard', name: 'Стражник', emoji: '🛡️',
    greetings: ['В лесу гоблины, будь осторожен.', 'В руинах нежить.', 'Пещера теней — гиблое место.'],
  },
  cat: {
    id: 'cat', name: 'Кошка', emoji: '🐈',
    greetings: ['Мяу.', 'Муррр.', '...']
  },
  kids: {
    id: 'kids', name: 'Дети', emoji: '👦',
    greetings: ['Смотрите, герой!', 'А ты правда убил дракона?', 'Дай монетку!']
  },
  herald: {
    id: 'herald', name: 'Глашатай', emoji: '📢',
    greetings: ['Внемлите новостям!', 'Элитный гоблин в лесу!', 'Слухи о сокровищах в Разломе...']
  },
  questBoard: {
    id: 'questBoard', name: 'Доска объявлений', emoji: '📋',
    greetings: ['Здесь висят задания.']
  }
};

export const FORGE_BONUS = [0, 2, 4, 7];