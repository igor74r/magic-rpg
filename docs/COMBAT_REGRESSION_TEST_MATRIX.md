# Combat regression test matrix

Status: manual QA checklist for the turn-based combat implementation. These cases should be automated where the project test setup permits.

## Defense and attack resolution

| Case | Setup | Expected result |
|---|---|---|
| Normal hit | Enemy has no special | Player loses resolved base damage; one hit number |
| Dodge | Set dodge chance to 100% in test fixture | HP unchanged; dodge message; blocking stance consumed |
| Guaranteed dodge | Use Archer `evasion` | Next enemy action is fully avoided; flag resets |
| Automatic block | Block chance forced to 100% | Damage reduced by block power; stance remains false |
| Block stance | Player calls `combatBlock()` | Next enemy action receives stance reduction; stance resets afterward |
| Defense buff | Player has `defBuff` | Damage reduced by `getDefMult()` after block |
| Double attack | Enemy special `double` | Two hit values; total HP loss equals both strikes |
| Snipe | Enemy special `snipe` with multiplier 2 | One hit; damage equals resolved base × multiplier |
| Drain | Enemy special `drain` | Player loses damage; enemy heals by the same resolved amount |
| Vampiric normal | Enemy modifier `vampiric` | Enemy healing equals actual damage dealt × vampiricPct |
| Vampiric double | Vampiric enemy with `double` special | Healing uses sum of both strikes, not pre-special base |
| Vampiric snipe | Vampiric enemy with `snipe` special | Healing uses multiplied damage actually dealt |
| Vampiric drain | Vampiric modifier + `drain` special | No extra modifier-based healing on top of drain's own healing |
| Lethal hit | Player HP reaches zero | Defeat handler runs once; combat is cleared |
| Resurrection | Class with resurrection, first lethal hit | Restores configured HP once and returns player turn |
| Second lethal hit | Resurrection already consumed | Defeat handler runs; no repeated resurrection |
| Stun | Enemy stunned at turn start | Enemy action skipped; effects/cooldowns progress once |
| Enemy killed by DoT | Enemy reaches 0 in `tickEnemyEffects()` | Victory runs; no enemy attack after death |

## State invariants

- Combat turn changes only between `player` and `enemy` while combat exists.
- A defensive stance is not carried into a later player turn.
- `guaranteedDodge` is consumed once.
- A defeated enemy cannot attack, regenerate, or apply another special.
- Victory and defeat each end combat exactly once.
- Displayed HP/MP mirrors player state after every resolved action.
- A special effect's application policy is explicit: on-hit, on-action, or block-piercing.

## Execution note

The repository's test runner/configuration still needs to be confirmed. Until then, this matrix is a specification for manual verification, not evidence that tests passed.
