export const TALENTS = {
  warrior: [
    { id: 'w-berserker', tier: 5,  name: 'Берсерк',    icon: '💢', desc: '+15% урона, −10% макс HP', effects: { dmgMult: 1.15, hpMult: 0.9 } },
    { id: 'w-guardian',  tier: 5,  name: 'Страж',      icon: '🛡️', desc: '+20% макс HP, −5% урона', effects: { hpMult: 1.2, dmgMult: 0.95 } },
    { id: 'w-fury',      tier: 10, name: 'Ярость',     icon: '🔥', desc: '+15% шанс крита', effects: { critChance: 0.15 } },
    { id: 'w-toughness', tier: 10, name: 'Стойкость',  icon: '🗿', desc: '+30% защиты', effects: { defMult: 1.3 } },
    { id: 'w-execute',   tier: 15, name: 'Казнь',      icon: '💀', desc: 'Крит-урон ×2 (было ×1.5)', effects: { critMult: 2.0 } },
    { id: 'w-revenge',   tier: 15, name: 'Возмездие',  icon: '🩸', desc: '+20% вампиризма', effects: { lifesteal: 0.2 } },
    { id: 'w-legend',    tier: 20, name: 'Легенда',    icon: '🌟', desc: '+25% урона, +5% крита', effects: { dmgMult: 1.25, critChance: 0.05 } },
    { id: 'w-titan',     tier: 20, name: 'Титан',      icon: '⚡', desc: '+40% HP, +20% защиты', effects: { hpMult: 1.4, defMult: 1.2 } }
  ],
  mage: [
    { id: 'm-pyromancer', tier: 5,  name: 'Пиромант',      icon: '🔥', desc: '+25% урона заклинаниями', effects: { spellMult: 1.25 } },
    { id: 'm-cryomancer', tier: 5,  name: 'Криомант',      icon: '❄️', desc: '+40% макс MP, +50% урона заклинаниями (нет)', effects: { mpMult: 1.4, spellMult: 1.0 } },
    { id: 'm-arcanist',   tier: 10, name: 'Чародей',       icon: '✨', desc: '+20% урона заклинаниями, +5 MP/ход', effects: { spellMult: 1.2, manaRegen: 5 } },
    { id: 'm-scholar',    tier: 10, name: 'Учёный',        icon: '📚', desc: '+50% макс MP, +3 MP/ход', effects: { mpMult: 1.5, manaRegen: 3 } },
    { id: 'm-metmaster',  tier: 15, name: 'Метеор-мастер', icon: '☄️', desc: 'Метеор +50% урона', effects: { meteorMult: 1.5 } },
    { id: 'm-telemaster', tier: 15, name: 'Телепорт-мастер', icon: '💨', desc: 'Кулдаун способностей −2', effects: { abilityCdDelta: -2 } },
    { id: 'm-archmage',   tier: 20, name: 'Архимаг',       icon: '🌟', desc: '+30% урона заклинаниями, +30% макс MP', effects: { spellMult: 1.3, mpMult: 1.3 } },
    { id: 'm-immortal',   tier: 20, name: 'Бессмертный',   icon: '🛡️', desc: '+30% защиты, +20% HP', effects: { defMult: 1.3, hpMult: 1.2 } }
  ],
  priest: [
    { id: 'p-light',    tier: 5,  name: 'Свет',         icon: '☀️', desc: '+40% лечения', effects: { healMult: 1.4 } },
    { id: 'p-wrath',    tier: 5,  name: 'Кара',         icon: '⚡', desc: '+30% урона заклинаниями', effects: { spellMult: 1.3 } },
    { id: 'p-healer',   tier: 10, name: 'Целитель',     icon: '💚', desc: '+20% макс HP, +3 HP/ход', effects: { hpMult: 1.2, hpRegen: 3 } },
    { id: 'p-paladin',  tier: 10, name: 'Паладин',      icon: '🛡️', desc: '+30% защиты, +10% HP', effects: { defMult: 1.3, hpMult: 1.1 } },
    { id: 'p-miracle',  tier: 15, name: 'Чудотворец',   icon: '✨', desc: 'Молитва лечит +30%', effects: { prayerMult: 1.3 } },
    { id: 'p-exorcist', tier: 15, name: 'Экзорцист',    icon: '💀', desc: 'Воскрешение восстанавливает 50% HP (было 30%)', effects: { resurrectPct: 0.5 } },
    { id: 'p-avatar',   tier: 20, name: 'Аватар',       icon: '🌟', desc: '+30% лечения, +20% урона светом', effects: { healMult: 1.3, spellMult: 1.2 } },
    { id: 'p-saint',    tier: 20, name: 'Святой',       icon: '😇', desc: '+40% HP, +20% защиты', effects: { hpMult: 1.4, defMult: 1.2 } }
  ]
};

export function getClassTalents(classId) {
  return TALENTS[classId] || [];
}

export function findTalentById(classId, talentId) {
  return getClassTalents(classId).find(t => t.id === talentId) || null;
}