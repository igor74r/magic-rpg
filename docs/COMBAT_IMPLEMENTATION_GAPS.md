# Combat implementation gaps — branch audit

This document records concrete mismatches between the combat contract and the current implementation. It is an audit, not a claim that the fixes below have already been implemented.

## Current enemy turn sequence

In `systems/overworld/combat.js`, `enemyCombatTurn()` currently:

1. Resolves enemy regeneration and stun.
2. Calculates attack with difficulty, elite modifier, enemy modifier, boss phase, NG+, and Rift scaling.
3. Rolls a single dodge for the entire incoming enemy action. `guaranteedDodge` also cancels the entire action.
4. Rolls automatic block only when the player is not in block stance.
5. Applies stance/automatic block reduction to `baseDamage`.
6. Applies `getDefMult(player)`.
7. Resolves the enemy special: `double`, `snipe`, `drain`, or normal attack.
8. Applies enemy vampirism, hit reactions, class resource gain, player effects, regeneration, cooldowns, and returns control.

## Risks verified in source

### 1. Block stance is calculated before special-attack branching

The stance reduction is baked into `baseDamage`. The `double` special then derives both hits from this reduced base. That means one defensive stance reduces both strikes. This may be intended, but it contradicts the contract's default rule that a stance is consumed by one strike unless a skill explicitly says otherwise.

### 2. Dodge currently cancels the full special action

The dodge branch returns before the special type is resolved. Thus a `double` attack is evaded as a whole rather than rolling separately per strike. The contract should explicitly choose between:
- **Action dodge:** one roll evades the entire enemy action (current behavior).
- **Strike dodge:** multi-hit attacks roll each strike separately (more granular, but changes balance).

### 3. Special effects are not gated by block outcome

For `double`, `snipe`, and `drain`, `special.effect` is applied after damage even if the damage was reduced by block stance or automatic block. If block is meant to prevent on-hit conditions, the effect should be conditional; if it is meant to be a guard that reduces damage only, the current behavior should be documented as such.

### 4. Enemy vampirism uses `baseDamage`, not final dealt damage

After special branches, vampiric enemies heal using `baseDamage`, regardless of the final branch damage. For `double`, the actual total is two strikes of 60% each; for `snipe`, it is multiplied by `special.mult`; for `drain`, the special itself already heals. This can cause lifesteal to be inconsistent with actual damage. A future fix should base healing on actual damage dealt and avoid double-healing drain attacks.

## Suggested safe implementation sequence

1. Introduce a small, local damage resolver for an incoming strike: dodge → block → defense multiplier → HP update → hit result.
2. Keep the current **action-wide dodge** initially to avoid unrequested balance changes.
3. Define block stance as either one strike or one full action. Add explicit metadata for specials if the full action is intended.
4. Return `actualDamage` from each special branch; use it for vampirism and combat telemetry.
5. Make status application policy explicit per special: on-hit, block-piercing, or action effect.
6. Add tests for normal, elite, boss phase, double, snipe, drain, stance, automatic block, guaranteed dodge, player death, and combat finish.
7. Run the existing project test/build commands before merging to `main`.

## Compatibility requirements

- Preserve ability IDs, enemy IDs, passive IDs, quest IDs, and save fields unless a migration is added.
- Do not change the prologue or voice assets.
- Do not introduce networking, matchmaking, or online-like services.
- Keep combat turn-based unless a separate design decision explicitly approves a combat-mode change.
