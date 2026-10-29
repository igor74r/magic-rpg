export const SPELLS = {
  "fireball":     { name: "Огненный шар",   icon: "🔥", cost: 15, desc: "Наносит 35 урона огнём.", damage: 35, effect: "burn" },
  "ice-bolt":     { name: "Ледяная стрела", icon: "❄️", cost: 12, desc: "Наносит 25 урона льдом.", damage: 25 },
  "heal":         { name: "Исцеление",      icon: "💚", cost: 20, desc: "Восстанавливает 60 здоровья.", heal: 60 },
  "holy-light":   { name: "Святой свет",    icon: "☀️", cost: 18, desc: "Наносит 25 урона светом.", damage: 25 },
  "lightning":    { name: "Молния",         icon: "⚡", cost: 25, desc: "Наносит 45 урона электричеством.", damage: 45 },
  "poison-cloud": { name: "Ядовитый туман", icon: "☠️", cost: 20, desc: "15 урона + отравление.", damage: 15, effect: "poison" },
  "shield":       { name: "Щит",            icon: "🛡️", cost: 15, desc: "+50% защиты на 2 хода.", selfEffect: "defBuff" },
  "sacrifice":    { name: "Жертва",         icon: "🩸", cost: 0, desc: "Тратит 20% HP, но восстанавливает 50 MP.", selfDamagePct: 0.2, restoreMp: 50 }
};