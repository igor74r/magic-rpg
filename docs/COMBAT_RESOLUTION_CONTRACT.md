# Combat Resolution Contract (implementation guide)

This document records the intended deterministic order for combat resolution. Apply it incrementally; avoid changing combat balance in the same commit as control-flow fixes.

## Player defensive response to one enemy attack
1. Determine attack count and raw damage for each strike (including elite/boss/phase/NG+/Rift/difficulty multipliers).
2. Resolve guaranteed dodge first; otherwise roll dodge once per strike against effective dodge chance (0–65%).
3. If not dodged, resolve active defensive stance. Stance block must consume exactly one incoming strike and apply effective block power (30–90%, currently clamped by stats).
4. If stance is not active, roll automatic block (0–60%) and apply its separate minimum reduction.
5. Apply armor/defense and damage modifiers in one documented order; clamp final damage to non-negative integer.
6. Apply on-hit status/effects only according to explicit attack metadata. A fully dodged attack must not apply hit effects. A blocked attack may apply effects only if the attack is marked “block-piercing” or “on-contact”; default behavior should be no status on a fully negated hit.
7. Apply HP loss, lifesteal/drain, combat log/floating text, death check, phase change, and turn end in a consistent order.

## State invariants
- Consume `blocking` after the first applicable incoming strike, including multi-hit attacks; do not let it reduce every strike unless the ability explicitly says so.
- Consume `guaranteedDodge` once on the next attack, not once per strike.
- Multi-hit attacks should perform defense rolls per strike, not reuse one result.
- A turn-ending action must schedule exactly one enemy turn.
- Combat may finish only once; victory/defeat cleanup must be idempotent.
- UI mirror values (`ow.player.hp/mp`) must be synchronized after every HP/MP mutation.

## Manual regression matrix
| Scenario | Expected |
|---|---|
| Dodge succeeds | 0 damage; no ordinary on-hit effect; dodge feedback |
| Dodge fails, stance active | one strike reduced by stance; stance consumed |
| Auto-block succeeds | damage reduced by auto-block coefficient |
| Two-hit enemy vs stance | stance applies to first strike only |
| Guaranteed dodge vs two-hit | first attack response dodged; flag consumed as specified |
| Poison/burn attack blocked | no status by default unless metadata explicitly allows |
| Player/enemy reaches 0 HP | combat closes once; no extra enemy turn |
| Save/load during campaign | player stats, talents, equipment, and progression retained |
| Passive reset/reallocate | max HP/MP return to baseline; no stacking drift |

## Balance policy
- Keep hard caps synchronized between calculation, tooltips, and UI.
- Descriptions must name the exact statistic/effect they change.
- Passive bonuses should be derived from base stats/equipment/talents, not repeatedly baked into saved maxHP/maxMP.
- For old saves, preserve legacy talent fields and migrate additively.
