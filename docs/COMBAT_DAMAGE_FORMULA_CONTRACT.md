# Combat damage formula contract (audit draft)

This document records intended consistency rules for future implementation. It is not a claim that every rule is already implemented or tested.

## Weapon attacks
- Attack starts from effective `atk`, a random roll, and enemy defense.
- Armor penetration reduces enemy defense before the defense contribution is halved.
- Attack, status, and passive multipliers are applied after the base expression.
- Critical chance is resolved through the shared capped helper.

## Damage abilities and spells
The current code has several distinct paths: ordinary spell damage, `meteor`, `aimed-shot`, `toxic-blade`, `sanctify`, and legacy priest skills. They do not all currently share one damage resolver.

Before unifying them, explicitly mark each skill as one of:
- **Physical** — uses attack and armor penetration.
- **Magical** — uses magic and spell multiplier; specify whether defense and armor penetration apply.
- **Pure** — bypasses defense by design.
- **Hybrid** — separate physical/magical components with explicit rules.

Do not silently apply armor penetration to a spell described as “pure” (e.g. `arcane-surge`) or alter established balance without updating its description.

## Defense / turn order
- Dodge cancels the complete enemy action, including special attacks.
- Automatic block is a separate roll and is capped in effective stats.
- Player block stance currently reduces the enemy's resolved action, including both strikes of a `double` special. This differs from a literal “next strike” rule; define whether stance protects one strike or the full action before changing it.
- Defensive multiplier from effects is applied after block mitigation in the current enemy turn path.

## Follow-up implementation sequence
1. Build a central damage resolver with explicit damage type and flags.
2. Route each attack/spell/ability through it in small batches.
3. Preserve existing IDs, save format, and prologue/audio.
4. Add deterministic tests with injected random values for minimum damage, armor penetration, crit caps, dodge, block, special attacks, lifesteal, and victory/death transitions.
5. Verify with project tests/build when a runnable environment is available.

## Known design decisions still open
- Does armor penetration affect magical damage?
- Is block stance “one hit” or “one enemy action”?
- Should lifesteal be based on raw damage or HP actually removed? Current player weapon lifesteal uses HP actually removed.
- Are overkill damage and damage-over-time included in lifesteal?
