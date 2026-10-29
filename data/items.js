export const ITEMS = {
  "mana-potion": {
    name: "Зелье маны", icon: "🔵", desc: "Восстанавливает 50 маны.",
    price: 25, type: "consumable",
    use: (p) => { p.mp = Math.min(p.maxMp, p.mp + 50); }
  },
  "health-potion": {
    name: "Зелье здоровья", icon: "🔴", desc: "Восстанавливает 80 здоровья.",
    price: 30, type: "consumable",
    use: (p) => { p.hp = Math.min(p.maxHp, p.hp + 80); }
  },
  "strong-health-potion": {
    name: "Большое зелье здоровья", icon: "💗", desc: "Восстанавливает 200 здоровья.",
    price: 80, type: "consumable",
    use: (p) => { p.hp = Math.min(p.maxHp, p.hp + 200); }
  },
  "strong-mana-potion": {
    name: "Большое зелье маны", icon: "💙", desc: "Восстанавливает 120 маны.",
    price: 70, type: "consumable",
    use: (p) => { p.mp = Math.min(p.maxMp, p.mp + 120); }
  },
  "antidote": {
    name: "Антидот", icon: "🧪",
    desc: "Снимает отравление, ожог и кровотечение. Только в бою.",
    price: 40, type: "consumable", combatOnly: true, effect: "antidote",
    use: () => {}
  },
  "strength-elixir": {
    name: "Эликсир силы", icon: "💪",
    desc: "+5 к атаке на 3 хода. Только в бою.",
    price: 60, type: "consumable", combatOnly: true, effect: "strength",
    use: () => {}
  },
  "mana-elixir": {
    name: "Эликсир маны", icon: "💧",
    desc: "Мана не тратится 2 хода. Только в бою.",
    price: 70, type: "consumable", combatOnly: true, effect: "manaShield",
    use: () => {}
  },
  "iron-sword": { name: "Железный меч", icon: "🗡️", desc: "+8 к атаке.", price: 100, type: "weapon", bonus: { attack: 8 } },
  "steel-sword": { name: "Стальной меч", icon: "⚔️", desc: "+14 к атаке.", price: 250, type: "weapon", bonus: { attack: 14 } },
  "apprentice-staff": { name: "Посох ученика", icon: "🪄", desc: "+5 к магии.", price: 120, type: "weapon", bonus: { magic: 5 } },
  "leather-armor": { name: "Кожаная броня", icon: "🥋", desc: "+5 к защите.", price: 80, type: "armor", bonus: { defense: 5 } },
  "mithril-armor": { name: "Мифриловая броня", icon: "🛡️", desc: "+12 к защите.", price: 220, type: "armor", bonus: { defense: 12 } },
  "ice-staff": { name: "Ледяной посох", icon: "❄️", desc: "+10 к магии. Дыхание зимы.", price: 280, type: "weapon", bonus: { magic: 10 } },
  "frost-armor": { name: "Морозная броня", icon: "🧥", desc: "+14 к защите. Покрыта инеем.", price: 260, type: "armor", bonus: { defense: 14 } },
  "desert-blade": { name: "Клинок пустыни", icon: "🌵", desc: "+18 к атаке. Закалён в песках.", price: 320, type: "weapon", bonus: { attack: 18 } },
  "crystal-amulet": { name: "Амулет кристалла", icon: "🔮", desc: "+8 к магии и +5 к защите. Древняя реликвия.", price: 400, type: "armor", bonus: { magic: 8, defense: 5 } },
  "archmage-staff": { name: "Посох архимага", icon: "🌟", desc: "+15 к магии. Шепчет забытые истины.", price: 450, type: "weapon", bonus: { magic: 15 } },
  "dragon-scale-armor": { name: "Драконья броня", icon: "🐲", desc: "+20 к защите. Не боится пламени.", price: 600, type: "armor", bonus: { defense: 20 } },
  "dragon-blade": { name: "Драконий клинок", icon: "⚡", desc: "+25 к атаке. Легендарное оружие.", price: 800, type: "weapon", bonus: { attack: 25 } },
  "scroll-lightning": {
    name: "Свиток: Молния", icon: "📜",
    desc: "Изучить заклинание «Молния» (45 урона).",
    price: 250, type: "scroll", spellId: "lightning",
    use: (p) => { if (!p.spells.includes('lightning')) p.spells.push('lightning'); }
  },
  "scroll-poison-cloud": {
    name: "Свиток: Ядовитый туман", icon: "📜",
    desc: "Изучить заклинание «Ядовитый туман» (урон + яд).",
    price: 220, type: "scroll", spellId: "poison-cloud",
    use: (p) => { if (!p.spells.includes('poison-cloud')) p.spells.push('poison-cloud'); }
  },
  "scroll-shield": {
    name: "Свиток: Щит", icon: "📜",
    desc: "Изучить заклинание «Щит» (+50% защиты на 2 хода).",
    price: 180, type: "scroll", spellId: "shield",
    use: (p) => { if (!p.spells.includes('shield')) p.spells.push('shield'); }
  },
  "herb-life": { name: "Корень жизни", icon: "🌿", desc: "Трава для алхимии. Основа целебных зелий.", price: 10, type: "material" },
  "herb-moon": { name: "Лунная трава", icon: "🌙", desc: "Серебристая трава, светится в темноте.", price: 12, type: "material" },
  "mana-crystal": { name: "Осколок маны", icon: "💎", desc: "Кусочек древнего кристалла. Квестовый предмет.", type: "quest", price: 0 }
};

export const RARITIES = {
  common:    { name: "Обычный",     color: "#a89060", multiplier: 1.0, weight: 60 },
  rare:      { name: "Редкий",      color: "#4a9eff", multiplier: 1.5, weight: 25 },
  epic:      { name: "Эпический",   color: "#b060ff", multiplier: 2.2, weight: 12 },
  legendary: { name: "Легендарный", color: "#ffa500", multiplier: 3.5, weight: 3 }
};

export function rollRarity() {
  const total = Object.values(RARITIES).reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const [key, r] of Object.entries(RARITIES)) {
    roll -= r.weight;
    if (roll <= 0) return key;
  }
  return 'common';
}