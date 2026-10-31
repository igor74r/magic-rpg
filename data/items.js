export const ITEMS = {
  'mana-potion': {
    name: 'Зелье маны', icon: '🔵',
    desc: 'Восстанавливает 50 маны.',
    price: 8, type: 'consumable',
    use: p => { p.mp = Math.min(p.maxMp, p.mp + 50); }
  },

  'health-potion': {
    name: 'Зелье здоровья', icon: '🔴',
    desc: 'Восстанавливает 80 здоровья.',
    price: 10, type: 'consumable',
    use: p => { p.hp = Math.min(p.maxHp, p.hp + 80); }
  },

  'strong-health-potion': {
    name: 'Большое зелье здоровья', icon: '💗',
    desc: 'Восстанавливает 200 здоровья.',
    price: 22, type: 'consumable',
    use: p => { p.hp = Math.min(p.maxHp, p.hp + 200); }
  },

  'strong-mana-potion': {
    name: 'Большое зелье маны', icon: '💙',
    desc: 'Восстанавливает 120 маны.',
    price: 20, type: 'consumable',
    use: p => { p.mp = Math.min(p.maxMp, p.mp + 120); }
  },

  antidote: {
    name: 'Антидот', icon: '🧪',
    desc: 'Снимает отравление, ожог и кровотечение. Только в бою.',
    price: 12, type: 'consumable', combatOnly: true, effect: 'antidote',
    use: () => {}
  },

  'strength-elixir': {
    name: 'Эликсир силы', icon: '💪',
    desc: '+5 к атаке на 3 хода. Только в бою.',
    price: 22, type: 'consumable', combatOnly: true, effect: 'strength',
    use: () => {}
  },

  'mana-elixir': {
    name: 'Эликсир маны', icon: '💧',
    desc: 'Мана не тратится 2 хода. Только в бою.',
    price: 24, type: 'consumable', combatOnly: true, effect: 'manaShield',
    use: () => {}
  },

  'iron-sword': {
    name: 'Железный меч', icon: '🗡️',
    desc: '+8 к атаке.',
    price: 45, type: 'weapon',
    bonus: { attack: 8 }
  },

  'steel-sword': {
    name: 'Стальной меч', icon: '⚔️',
    desc: '+14 к атаке.',
    price: 95, type: 'weapon',
    bonus: { attack: 14 }
  },

  'apprentice-staff': {
    name: 'Посох ученика', icon: '🪄',
    desc: '+5 к магии.',
    price: 48, type: 'weapon',
    bonus: { magic: 5 }
  },

  'hunter-bow': {
    name: 'Лук следопыта', icon: '🏹',
    desc: '+9 к атаке, +2 к ловкости и +3% к критическому шансу.',
    price: 58, type: 'weapon',
    bonus: { attack: 9, dex: 2, critChance: 0.03, armorPen: 1 }
  },

  'leather-armor': {
    name: 'Кожаная броня', icon: '🥋',
    desc: '+5 к защите.',
    price: 40, type: 'chest',
    bonus: { defense: 5, dodgeChance: 0.02 }
  },

  'mithril-armor': {
    name: 'Мифриловая броня', icon: '🛡️',
    desc: '+12 к защите.',
    price: 105, type: 'chest',
    bonus: { defense: 12, blockChance: 0.04, blockPower: 0.05 }
  },

  'tower-shield': {
    name: 'Башенный щит', icon: '🛡️',
    desc: '+8 к защите, +12% к шансу блока и +15% к силе блока.',
    price: 85, type: 'hands',
    bonus: { defense: 8, blockChance: 0.12, blockPower: 0.15 }
  },

  'ranger-cloak': {
    name: 'Плащ следопыта', icon: '🧥',
    desc: '+4 к защите, +4 к ловкости и +6% к уклонению.',
    price: 75, type: 'back',
    bonus: { defense: 4, dex: 4, dodgeChance: 0.06 }
  },

  'ice-staff': {
    name: 'Ледяной посох', icon: '❄️',
    desc: '+10 к магии. Дыхание зимы.',
    price: 130, type: 'weapon',
    bonus: { magic: 10 }
  },

  'frost-armor': {
    name: 'Морозная броня', icon: '🧥',
    desc: '+14 к защите. Покрыта инеем.',
    price: 120, type: 'chest',
    bonus: { defense: 14, blockPower: 0.04 }
  },

  'desert-blade': {
    name: 'Клинок пустыни', icon: '🌵',
    desc: '+18 к атаке. Закалён в песках.',
    price: 160, type: 'weapon',
    bonus: { attack: 18, armorPen: 2 }
  },

  'crystal-amulet': {
    name: 'Амулет кристалла', icon: '🔮',
    desc: '+8 к магии и +5 к защите. Древняя реликвия.',
    price: 150, type: 'amulet',
    bonus: { magic: 8, defense: 5 }
  },

  'archmage-staff': {
    name: 'Посох архимага', icon: '🌟',
    desc: '+15 к магии. Шепчет забытые истины.',
    price: 190, type: 'weapon',
    bonus: { magic: 15, critChance: 0.04 }
  },

  'dragon-scale-armor': {
    name: 'Драконья броня', icon: '🐲',
    desc: '+20 к защите. Не боится пламени.',
    price: 220, type: 'chest',
    bonus: { defense: 20, blockPower: 0.08 }
  },

  'dragon-blade': {
    name: 'Драконий клинок', icon: '⚡',
    desc: '+25 к атаке. Легендарное оружие.',
    price: 260, type: 'weapon',
    bonus: { attack: 25, armorPen: 4 }
  },

  'scroll-lightning': {
    name: 'Свиток: Молния', icon: '📜',
    desc: 'Изучить заклинание «Молния» (45 урона).',
    price: 75, type: 'scroll', spellId: 'lightning',
    use: p => {
      if (!p.spells.includes('lightning')) p.spells.push('lightning');
    }
  },

  'scroll-poison-cloud': {
    name: 'Свиток: Ядовитый туман', icon: '📜',
    desc: 'Изучить заклинание «Ядовитый туман» (урон + яд).',
    price: 70, type: 'scroll', spellId: 'poison-cloud',
    use: p => {
      if (!p.spells.includes('poison-cloud')) p.spells.push('poison-cloud');
    }
  },

  'scroll-shield': {
    name: 'Свиток: Щит', icon: '📜',
    desc: 'Изучить заклинание «Щит» (+50% защиты на 2 хода).',
    price: 55, type: 'scroll', spellId: 'shield',
    use: p => {
      if (!p.spells.includes('shield')) p.spells.push('shield');
    }
  },

  'herb-life': {
    name: 'Корень жизни', icon: '🌿',
    desc: 'Трава для алхимии. Основа целебных зелий.',
    price: 2, type: 'material'
  },

  'herb-moon': {
    name: 'Лунная трава', icon: '🌙',
    desc: 'Серебристая трава, светится в темноте.',
    price: 3, type: 'material'
  },

  'mana-crystal': {
    name: 'Осколок маны', icon: '💎',
    desc: 'Кусочек древнего кристалла. Квестовый предмет.',
    type: 'quest', price: 0
  },

'greater-health-potion': {
    name: 'Эликсир возрождения', icon: '🧪',
    desc: 'Восстанавливает 360 здоровья.',
    price: 35, type: 'consumable',
    use: p => { p.hp = Math.min(p.maxHp, p.hp + 360); }
  },

  'greater-mana-potion': {
    name: 'Сгусток маны', icon: '🔷',
    desc: 'Восстанавливает 220 маны.',
    price: 30, type: 'consumable',
    use: p => { p.mp = Math.min(p.maxMp, p.mp + 220); }
  },

  'moonsteel-spear': {
    name: 'Лунно-стальное копьё', icon: '🔱',
    desc: '+21 к атаке. Лёгкое оружие дозорных ледяных перевалов.',
    price: 170, type: 'weapon', bonus: { attack: 21 }
  },
  'rune-sword': {
    name: 'Меч семи печатей', icon: '🗡️',
    desc: '+27 к атаке. Руны удерживают в клинке эхо древней клятвы.',
    price: 230, type: 'weapon', bonus: { attack: 27 }
  },
  'astral-staff': {
    name: 'Астральный посох', icon: '🌌',
    desc: '+25 к магии. Сердцевина собрана из осколков звёздного стекла.',
    price: 220, type: 'weapon', bonus: { magic: 25 }
  },
  'warden-plate': {
    name: 'Латы Стеклянного Щита', icon: '🛡️',
    desc: '+24 к защите. Тяжёлая броня древнего ордена.',
    price: 210, type: 'chest', bonus: { defense: 24 }
  },
  'void-robe': {
    name: 'Мантия тихой пустоты', icon: '🥋',
    desc: '+16 к защите и +7 к магии. Ткань не отражает свет.',
    price: 195, type: 'chest', bonus: { defense: 16, magic: 7 }
  },

  'scroll-frost-nova': {
    name: 'Свиток: Ледяная nova', icon: '📜',
    desc: 'Изучить заклинание «Ледяная nova».',
    price: 90, type: 'scroll', spellId: 'frost-nova',
    use: p => { if (!p.spells.includes('frost-nova')) p.spells.push('frost-nova'); }
  },
  'scroll-shadow-lance': {
    name: 'Свиток: Копьё тени', icon: '📜',
    desc: 'Изучить заклинание «Копьё тени».',
    price: 110, type: 'scroll', spellId: 'shadow-lance',
    use: p => { if (!p.spells.includes('shadow-lance')) p.spells.push('shadow-lance'); }
  },
  'scroll-arcane-surge': {
    name: 'Свиток: Арканный импульс', icon: '📜',
    desc: 'Изучить заклинание «Арканный импульс».',
    price: 100, type: 'scroll', spellId: 'arcane-surge',
    use: p => { if (!p.spells.includes('arcane-surge')) p.spells.push('arcane-surge'); }
  },
  'scroll-radiant-aegis': {
    name: 'Свиток: Эгида рассвета', icon: '📜',
    desc: 'Изучить заклинание «Эгида рассвета».',
    price: 85, type: 'scroll', spellId: 'radiant-aegis',
    use: p => { if (!p.spells.includes('radiant-aegis')) p.spells.push('radiant-aegis'); }
  },
  'scroll-renewal': {
    name: 'Свиток: Возобновление', icon: '📜',
    desc: 'Изучить заклинание «Возобновление».',
    price: 95, type: 'scroll', spellId: 'renewal',
    use: p => { if (!p.spells.includes('renewal')) p.spells.push('renewal'); }
  },

'rootbound-hood': {
    name: 'Капюшон живого корня', icon: '🌿',
    desc: '+4 к защите, +1 к ловкости и +2% к уклонению. В гнезде можно закрепить руну.',
    price: 48, type: 'head', sockets: 1,
    bonus: { defense: 4, dex: 1, dodgeChance: 0.02 }
  },
  'cinder-visor': {
    name: 'Визор пепельного дозора', icon: '🔥',
    desc: '+6 к защите и +2% к критическому шансу.',
    price: 70, type: 'head', sockets: 1,
    bonus: { defense: 6, critChance: 0.02 }
  },
  'duelist-grips': {
    name: 'Перчатки точного удара', icon: '🥊',
    desc: '+3 к атаке и +3% к критическому шансу.',
    price: 55, type: 'hands', sockets: 1,
    bonus: { attack: 3, critChance: 0.03 }
  },
  'gravebinder-gloves': {
    name: 'Перчатки хранителя праха', icon: '🧤',
    desc: '+4 к магии и +2% к силе блока.',
    price: 58, type: 'hands', sockets: 1,
    bonus: { magic: 4, blockPower: 0.02 }
  },
  'windstep-boots': {
    name: 'Сапоги быстрого следа', icon: '👢',
    desc: '+3 к защите, +3 к ловкости и +5% к уклонению.',
    price: 65, type: 'legs', sockets: 1,
    bonus: { defense: 3, dex: 3, dodgeChance: 0.05 }
  },
  'glacier-greaves': {
    name: 'Поножи ледяной стражи', icon: '🥾',
    desc: '+7 к защите и +3% к шансу блока.',
    price: 72, type: 'legs', sockets: 1,
    bonus: { defense: 7, blockChance: 0.03 }
  },
  'amulet-first-light': {
    name: 'Амулет первого света', icon: '☀️',
    desc: '+4 к магии и +2% к критическому шансу.',
    price: 80, type: 'amulet', sockets: 1,
    bonus: { magic: 4, critChance: 0.02 }
  },
  'pendant-last-oath': {
    name: 'Подвеска последней клятвы', icon: '🔶',
    desc: '+5 к защите и +4% к шансу блока.',
    price: 85, type: 'amulet', sockets: 1,
    bonus: { defense: 5, blockChance: 0.04 }
  },
  'ring-wolf-eye': {
    name: 'Кольцо волчьего глаза', icon: '💍',
    desc: '+2 к атаке и +4% к критическому шансу.',
    price: 60, type: 'ring', sockets: 1,
    bonus: { attack: 2, critChance: 0.04 }
  },
  'ring-quiet-tide': {
    name: 'Кольцо тихого прилива', icon: '🌊',
    desc: '+3 к магии и +2% к уклонению.',
    price: 65, type: 'ring', sockets: 1,
    bonus: { magic: 3, dodgeChance: 0.02 }
  },

  'rune-root': {
    name: 'Руна корня', icon: 'ᛉ',
    desc: 'Руна для свободного гнезда: +2 к защите и +1% к уклонению.',
    price: 20, type: 'rune', runeBonus: { defense: 2, dodgeChance: 0.01 }
  },
  'rune-ember': {
    name: 'Руна угля', icon: 'ᚱ',
    desc: 'Руна для свободного гнезда: +3 к атаке и +1% к критическому шансу.',
    price: 25, type: 'rune', runeBonus: { attack: 3, critChance: 0.01 }
  },
  'rune-tide': {
    name: 'Руна прилива', icon: 'ᛟ',
    desc: 'Руна для свободного гнезда: +3 к магии и +2% к силе блока.',
    price: 25, type: 'rune', runeBonus: { magic: 3, blockPower: 0.02 }
  },
  'rune-frost': {
    name: 'Руна инея', icon: 'ᚠ',
    desc: 'Руна для свободного гнезда: +3 к защите и +2% к шансу блока.',
    price: 28, type: 'rune', runeBonus: { defense: 3, blockChance: 0.02 }
  },
  'rune-void': {
    name: 'Руна безмолвия', icon: 'ᛞ',
    desc: 'Руна для свободного гнезда: +3 к магии, +1 к пробитию брони и +1% к криту.',
    price: 35, type: 'rune', runeBonus: { magic: 3, armorPen: 1, critChance: 0.01 }
  },

  'rusty-key': {
    name: 'Ржавая ключ-кость', icon: '🗝️',
    desc: 'Старый ключ от запертых сундуков подземелий. Одноразовый.',
    price: 0, type: 'quest'
  },
  'root-fiber': {
    name: 'Волокно живого корня', icon: '🌱',
    desc: 'Плотное волокно из Глухой чащи. Используется в ремесле.',
    price: 3, type: 'material'
  },
  'grave-salt': {
    name: 'Соль последней памяти', icon: '🧂',
    desc: 'Кристаллизованная соль из затонувшего архива.',
    price: 4, type: 'material'
  },
  'ember-core': {
    name: 'Сердечник магмы', icon: '🔸',
    desc: 'Остывшее ядро обсидианового голема.',
    price: 5, type: 'material'
  },
  'frost-essence': {
    name: 'Эссенция вечного инея', icon: '❄️',
    desc: 'Ледяная эссенция, не тающая даже в кузнице.',
    price: 6, type: 'material'
  },
  'void-dust': {
    name: 'Пыль разлома', icon: '🌀',
    desc: 'След Бездны, оставшийся после закрытия малой трещины.',
    price: 8, type: 'material'
  },
  'restorative-potion': {
    name: 'Восстанавливающее зелье', icon: '🧴',
    desc: 'Восстанавливает 140 здоровья и 60 маны.',
    price: 28, type: 'consumable',
    use: p => {
      p.hp = Math.min(p.maxHp, p.hp + 140);
      p.mp = Math.min(p.maxMp, p.mp + 60);
    }
  },

'briar-shoulders': {
    name: 'Наплечье живой чащи', icon: '🌳',
    desc: '+5 к защите и +2% к уклонению. Лёгкие пластины из корневого дерева.',
    price: 50, type: 'shoulders', sockets: 1,
    bonus: { defense: 5, dodgeChance: 0.02 }
  },
  'obsidian-mantle': {
    name: 'Мантия чёрного стекла', icon: '🧥',
    desc: '+7 к защите и +3 к магии. На ткани проступают знаки пяти орденов.',
    price: 95, type: 'back', sockets: 1,
    bonus: { defense: 7, magic: 3 }
  },
  'oath-bracers': {
    name: 'Наручи последней клятвы', icon: '🔗',
    desc: '+4 к защите, +2 к атаке и +2% к силе блока.',
    price: 75, type: 'wrists', sockets: 1,
    bonus: { defense: 4, attack: 2, blockPower: 0.02 }
  },
  'seal-five-orders': {
    name: 'Печать пяти орденов', icon: '🔰',
    desc: 'Реликвия пяти хранителей. +5 к магии, +4 к защите и +2% к критическому шансу.',
    price: 140, type: 'seal', sockets: 1,
    bonus: { magic: 5, defense: 4, critChance: 0.02 }
  },
  'relic-root-memory': {
    name: 'Семя памяти корней', icon: '🌱',
    desc: 'Уникальная реликвия первого акта. +6 к защите, +3% к уклонению.',
    price: 0, type: 'shoulders', sockets: 1, unique: true, relicAct: 1,
    bonus: { defense: 6, dodgeChance: 0.03 }
  },
  'relic-last-archive': {
    name: 'Кольцо последнего архива', icon: '📜',
    desc: 'Уникальная реликвия второго акта. +5 к магии, +3% к критическому шансу.',
    price: 0, type: 'ring', sockets: 1, unique: true, relicAct: 2,
    bonus: { magic: 5, critChance: 0.03 }
  },
  'relic-ember-oath': {
    name: 'Наручи огненной клятвы', icon: '🔥',
    desc: 'Уникальная реликвия третьего акта. +5 к атаке, +4% к силе блока.',
    price: 0, type: 'wrists', sockets: 1, unique: true, relicAct: 3,
    bonus: { attack: 5, blockPower: 0.04 }
  },
  'relic-frost-crown': {
    name: 'Корона безмолвного инея', icon: '❄️',
    desc: 'Уникальная реликвия четвёртого акта. +7 к защите, +3 к магии, +3% к шансу блока.',
    price: 0, type: 'head', sockets: 1, unique: true, relicAct: 4,
    bonus: { defense: 7, magic: 3, blockChance: 0.03 }
  },
  'relic-void-star': {
    name: 'Звезда последнего хранителя', icon: '🌌',
    desc: 'Уникальная реликвия пятого акта. +5 к атаке, +6 к магии, +3% к критическому шансу.',
    price: 0, type: 'amulet', sockets: 1, unique: true, relicAct: 5,
    bonus: { attack: 5, magic: 6, critChance: 0.03 }
  },

  'shard-forest': {
    name: 'Осколок Корневого сердца', icon: '💚',
    desc: 'Первый осколок Кристалла Маны. Внутри него движется свет, похожий на дыхание древнего леса.',
    price: 0, type: 'quest'
  },
  'shard-ruins': {
    name: 'Осколок Последней памяти', icon: '🔷',
    desc: 'Второй осколок. В его гранях звучат имена первых хранителей.',
    price: 0, type: 'quest'
  },
  'shard-shadow': {
    name: 'Осколок Сумеречного узла', icon: '💜',
    desc: 'Третий осколок. Он удерживает тонкую нить между миром и Тишиной.',
    price: 0, type: 'quest'
  }
};

export const RARITIES = {
  common: { name: 'Обычный', color: '#a89060', multiplier: 1, weight: 60 },
  rare: { name: 'Редкий', color: '#4a9eff', multiplier: 1.5, weight: 25 },
  epic: { name: 'Эпический', color: '#b060ff', multiplier: 2.2, weight: 12 },
  legendary: { name: 'Легендарный', color: '#ffa500', multiplier: 3.5, weight: 3 }
};

export const ITEM_AFFIXES = [
  { id: 'keen', name: 'Острокованный', types: ['weapon'], bonus: { attack: 2, armorPen: 1 } },
  { id: 'arcane', name: 'Чародейский', types: ['weapon'], bonus: { magic: 2, critChance: 0.01 } },
  { id: 'piercing', name: 'Пробивающий', types: ['weapon'], bonus: { armorPen: 2 } },
  { id: 'precise', name: 'Меткий', types: ['weapon', 'ring', 'amulet'], bonus: { critChance: 0.02, dex: 1 } },
  { id: 'balanced', name: 'Сбалансированный', types: ['weapon'], bonus: { attack: 1, dex: 2 } },
  { id: 'warded', name: 'Защищённый', types: ['head', 'shoulders', 'chest', 'back', 'wrists', 'hands', 'legs', 'seal'], bonus: { defense: 2, blockPower: 0.02 } },
  { id: 'swift', name: 'Стремительный', types: ['head', 'back', 'wrists', 'hands', 'legs', 'ring', 'amulet'], bonus: { dex: 2, dodgeChance: 0.02 } },
  { id: 'fortified', name: 'Укреплённый', types: ['shoulders', 'chest', 'wrists', 'hands', 'legs', 'seal'], bonus: { defense: 3, blockChance: 0.01 } },
  { id: 'vigilant', name: 'Бдительный', types: ['head', 'shoulders', 'chest', 'back', 'wrists', 'hands', 'legs', 'ring', 'amulet', 'seal'], bonus: { critChance: 0.01, blockChance: 0.01 } },
  { id: 'resolute', name: 'Непоколебимый', types: ['head', 'shoulders', 'chest', 'back', 'wrists', 'hands', 'legs', 'ring', 'amulet', 'seal'], bonus: { defense: 1, blockPower: 0.04 } },
  { id: 'focused', name: 'Сосредоточенный', types: ['weapon', 'ring', 'amulet', 'seal'], bonus: { magic: 1, critChance: 0.01 } }
];

export function rollItemAffixes(item, rarity, random = Math.random) {
  const countByRarity = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const count = countByRarity[rarity] || 0;
  if (!item || count === 0) return [];

  const pool = ITEM_AFFIXES.filter(affix => affix.types.includes(item.type));
  const selected = [];
  while (selected.length < count && selected.length < pool.length) {
    const sample = typeof random === 'function' ? random() : Math.random();
    const normalized = Number.isFinite(sample)
      ? Math.max(0, Math.min(1 - Number.EPSILON, sample))
      : Math.random();
    const index = Math.floor(normalized * pool.length);
    const candidate = pool[index];
    const affix = selected.some(entry => entry.id === candidate.id)
      ? pool.find(entry => !selected.some(chosen => chosen.id === entry.id))
      : candidate;
    if (affix) selected.push(affix);
  }

  const rarityScale = { common: 1, rare: 1, epic: 1.25, legendary: 1.5 }[rarity] || 1;
  return selected.map(affix => ({
    id: affix.id,
    name: affix.name,
    bonus: Object.fromEntries(Object.entries(affix.bonus).map(([key, value]) => [
      key,
      typeof value === 'number' && ['dodgeChance', 'blockChance', 'blockPower', 'critChance'].includes(key)
        ? Number((value * rarityScale).toFixed(3))
        : Math.round(value * rarityScale)
    ]))
  }));
}

export function rollRarity(random = Math.random) {
  const total = Object.values(RARITIES).reduce((sum, rarity) => sum + rarity.weight, 0);
  const sample = typeof random === 'function' ? random() : Math.random();
  const normalized = Number.isFinite(sample)
    ? Math.max(0, Math.min(1 - Number.EPSILON, sample))
    : Math.random();
  let roll = normalized * total;

  for (const [key, rarity] of Object.entries(RARITIES)) {
    roll -= rarity.weight;
    if (roll < 0) return key;
  }

  return 'common';
}
