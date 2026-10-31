export const EFFECTS = {
  poison:     { name: 'Отравление',    icon: '☠️', type: 'debuff', damage: 5, duration: 3, color: '#60a060', desc: '−5 HP каждый ход' },
  burn:       { name: 'Ожог',          icon: '🔥', type: 'debuff', damage: 8, duration: 2, color: '#ff6020', desc: '−8 HP каждый ход' },
  bleed:      { name: 'Кровотечение',  icon: '🩸', type: 'debuff', damage: 6, duration: 3, color: '#d63030', desc: '−6 HP каждый ход' },
  stun:       { name: 'Оглушение',     icon: '💫', type: 'debuff', skipTurn: true, duration: 1, color: '#d6c030', desc: 'Пропуск хода' },
  atkBuff:    { name: 'Боевой клич',   icon: '📢', type: 'buff', atkMult: 1.3, duration: 2, color: '#ffd060', desc: '+30% к атаке' },
  defBuff:    { name: 'Щит маны',      icon: '🛡️', type: 'buff', defMult: 1.5, duration: 2, color: '#60a0ff', desc: '+50% к защите' },
  lifesteal:  { name: 'Кровожадность', icon: '🩸', type: 'buff', lifestealPct: 0.5, duration: 2, color: '#d63030', desc: '50% урона в HP' },
  strength:   { name: 'Эликсир силы',  icon: '💪', type: 'buff', atkFlat: 5, duration: 3, color: '#ff9060', desc: '+5 к атаке' },
  manaShield: { name: 'Эликсир маны',  icon: '💧', type: 'buff', duration: 2, color: '#60d0ff', desc: 'Мана не тратится' }
};

export function applyEffect(target, effectId) {
  if (!target) return;
  if (!Array.isArray(target.effects)) target.effects = [];
  const def = EFFECTS[effectId];
  if (!def) return;
  const existing = target.effects.find(e => e.id === effectId);
  if (existing) existing.duration = Math.max(existing.duration, def.duration);
  else target.effects.push({ id: effectId, duration: def.duration });
}

export function tickEffects(target) {
  if (!target || !Array.isArray(target.effects)) return { totalDamage: 0, messages: [] };
  const messages = [];
  let totalDamage = 0;
  for (const e of target.effects) {
    const def = EFFECTS[e.id];
    if (!def) continue;
    if (def.damage) {
      totalDamage += def.damage;
      messages.push({ icon: def.icon, name: def.name, damage: def.damage });
    }
    e.duration -= 1;
  }
  target.effects = target.effects.filter(e => e.duration > 0);
  return { totalDamage, messages };
}

export function hasEffect(target, effectId) {
  if (!target || !Array.isArray(target.effects)) return false;
  return target.effects.some(e => e.id === effectId);
}

export function getAtkMult(target) {
  if (!target || !Array.isArray(target.effects)) return 1;
  let mult = 1;
  for (const e of target.effects) {
    const def = EFFECTS[e.id];
    if (def?.atkMult) mult *= def.atkMult;
  }
  return mult;
}

export function getDefMult(target) {
  if (!target || !Array.isArray(target.effects)) return 1;
  let mult = 1;
  for (const e of target.effects) {
    const def = EFFECTS[e.id];
    if (def?.defMult) mult *= def.defMult;
  }
  return mult;
}

export function getLifesteal(target) {
  if (!target || !Array.isArray(target.effects)) return 0;
  let pct = 0;
  for (const e of target.effects) {
    const def = EFFECTS[e.id];
    if (def?.lifestealPct) pct = Math.max(pct, def.lifestealPct);
  }
  return pct;
}

export function isStunned(target) {
  return hasEffect(target, 'stun');
}

export function clearDebuffs(target) {
  if (!target || !Array.isArray(target.effects)) return;
  target.effects = target.effects.filter(e => EFFECTS[e.id]?.type !== 'debuff');
}