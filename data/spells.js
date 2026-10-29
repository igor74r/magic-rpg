export const SPELLS = {
  "fireball":     { name: "Огненный шар",   icon: "🔥", cost: 15, desc: "Наносит 30 урона огнём.", damage: 30, effect: "burn" },
  "ice-bolt":     { name: "Ледяная стрела", icon: "❄️", cost: 12, desc: "Наносит 22 урона льдом.", damage: 22 },
  "heal":         { name: "Исцеление",      icon: "💚", cost: 20, desc: "Восстанавливает 60 здоровья.", heal: 60 },
  "holy-light":   { name: "Святой свет",    icon: "☀️", cost: 18, desc: "Наносит 25 урона светом.", damage: 25 },
  "lightning":    { name: "Молния",         icon: "⚡", cost: 25, desc: "Наносит 45 урона электричеством.", damage: 45 },
  "poison-cloud": { name: "Ядовитый туман", icon: "☠️", cost: 20, desc: "15 урона + отравление.", damage: 15, effect: "poison" },
  "shield":       { name: "Щит",            icon: "🛡️", cost: 15, desc: "+50% защиты на 2 хода.", selfEffect: "defBuff" }
};