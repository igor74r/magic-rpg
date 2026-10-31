# Passive-tree audit and compatibility notes

## Current implementation

- Three class trees are generated from `data/passives.js`.
- Each class has five branches, four nodes per branch (20 nodes), plus a shared start node.
- Connections are mostly linear; each branch's notable node connects to the next branch's notable, creating a ring.
- Passive allocation requires an adjacent allocated node, a passive point, and the node's level requirement.
- `getTalentBonus()` combines legacy class talents and the new passive tree.
- Save data stores allocated node IDs in `player.passives`; node IDs must remain stable.

## Verified issues / constraints

### Effect descriptions need a data audit
Some descriptions and effects do not match precisely. Example: Warrior branch `endurance` node `warrior-endurance-1` says “+3 к телосложению”, while its effect is `defFlat: 2, hpRegen: 1`. It should either use a real constitution effect or be renamed to describe defense and regeneration.

### Critical multiplier is “maximum”, not additive
`addEffects()` combines `critMult` using `Math.max`. This means nodes with +0.2 / +0.25 descriptions currently set fixed multipliers (e.g. 1.7 / 1.75) rather than adding to the default 1.5. Before redesigning the tree, decide whether critical multiplier bonuses are additive, maximum override, or explicitly represented as `critMultFlat`.

### Cooldown reduction can become zero or negative
`abilityCdDelta` is summed. The UI/action code later clamps some cooldowns to 1, but a negative cumulative delta may still create inconsistent behavior across abilities. Establish one centralized minimum cooldown rule and test all ability IDs.

### Legacy talent reset is separate from passive allocation
`resetTalents()` only resets `player.talents`, not `player.passives`. This is likely deliberate (separate systems), but the interface must clearly distinguish “reset legacy class talents” from “reset passive tree” to avoid player confusion.

### Save compatibility
Do not rename existing passive IDs without migration. Adding nodes is compatible if new IDs are unique and existing connections/allocated nodes remain valid. Tree expansion should not mutate or delete saved `player.passives`.

## Safe redesign plan

1. Audit all node descriptions against their actual effect keys and values.
2. Define consistent semantics for additive vs multiplicative effects, especially `critMult`, `blockPower`, and cooldown reductions.
3. Expand each branch with stable IDs and explicit connection topology rather than just adding nodes blindly.
4. Add a passive reset operation that refunds only tree points and removes only passive allocations; do not touch legacy class talents.
5. Add unit tests for allocation connectivity, level gates, duplicate allocation, no points, reset/refund, save/load persistence, and effect aggregation.
6. Only then adjust balance values and add keystone trade-offs.

## Guardrails

- Keep existing class, ability, passive, and save identifiers.
- Do not touch prologue, voice/audio, online features, or main branch.
- Current combat remains turn-based.
