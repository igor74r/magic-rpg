# Class Combat Expansion — Design Specification

This specification expands the existing Warrior / Mage / Archer without changing the turn-based combat model or removing legacy abilities. It is intentionally data-driven so implementation can be introduced in small commits.

## Shared combat actions
- **Guard** (existing): reduce the next incoming normal strike; stance consumed on that strike.
- **Dodge** (existing class ability/passives): guaranteed evade one attack event.
- **Interrupt**: selected abilities can interrupt a charging enemy; bosses convert interrupt to stagger.
- **Recovery**: defensive actions may restore a small class resource, but never grant free extra turns.
- **Status resistance**: derived from gear and passives; soft cap 60%, hard cap 80%.

## Warrior — three build identities
### Vanguard (shield / control)
- Shield Mastery: increased stance mitigation and block reliability.
- Riposte: after a successful stance block, next basic strike gains a counter bonus (once per round).
- Bulwark: reduced damage while above 70% HP; cannot stack with identical buff.
- Keystone: **Unbreakable** — block can stop a critical strike, but reduces movement/initiative resource.

### Berserker (two-handed / risk-reward)
- Blood Momentum: consecutive attacks build Fury; taking a turn to guard preserves part of it.
- Execution: bonus damage against enemies below 25% HP.
- Blood Price: ability cost may be paid in HP when Fury is insufficient, never lethal.
- Keystone: **Last Stand** — once per combat, survive a lethal hit at 1 HP, then gain exhaustion.

### Warlord (teamless solo tactics)
- Challenge: mark enemy; marked target deals reduced damage to player.
- Tactical Opening: bonus damage after enemy special.
- Battle Rhythm: cooldown reduction on elite/boss defeat, capped once per turn.
- Keystone: **Perfect Tempo** — alternating ability/basic action grants a short buff; repeating same action breaks it.

## Mage — three build identities
### Pyromancer
- Ignite application and burn duration.
- Flame Echo: burning target increases fire damage, capped.
- Cinder Ward: fire damage taken converts a fraction to mana.
- Keystone: **Combustion** — consume burn stacks for burst; requires cooldown and boss cap.

### Frostbinder
- Chill reduces enemy attack/initiative; boss slow is reduced.
- Shatter: bonus damage to frozen/chilled targets.
- Ice Armor: once per encounter absorb a portion of one hit.
- Keystone: **Absolute Zero** — freeze non-boss enemies; bosses receive stagger + resistance.

### Arcanist
- Arcane charge from casting distinct spells.
- Spellweave: alternate spell schools to reduce next cost.
- Mana Well: mana regen while not repeating same spell.
- Keystone: **Rift Channel** — high output while stationary/guarded, interrupted by damage.

## Archer — three build identities
### Sniper
- Aim: spend a turn to improve next shot (existing aimed shot can be retained).
- Mark: target takes increased critical damage.
- Piercing: armor penetration with a hard cap.
- Keystone: **Deadeye** — guaranteed critical after setup, but misses/interrupts reset stacks.

### Ranger (mobility)
- Evasion: dodge and reposition synergies.
- Quickstep: after dodge, next ability cost reduced.
- Escape Artist: reduced damage from elites while cooldown active.
- Keystone: **Ghost Trail** — two consecutive evades grant one free reposition, not free attack.

### Trapper / Venom
- Trap charges placed as a turn action; trigger on enemy action.
- Poison potency scales with Agility and weapon, capped.
- Toxic Exploit: bonus damage against poisoned targets.
- Keystone: **Predator's Mark** — poison spreads once on kill; bosses immune to spread.

## Implementation constraints
- Keep all current ability IDs stable; new IDs must be unique and namespaced.
- Do not alter voice files, prologue data, or online-related code.
- Passive descriptions and actual effect keys must be cross-checked.
- Add a save migration only if persistent build selections/state are introduced.
- Test each keystone with normal, elite, and boss enemy; avoid permanent stun/freeze loops.
