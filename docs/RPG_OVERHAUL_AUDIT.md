# RPG Overhaul — Engineering Audit & Implementation Plan

Branch: `dev/rpg-overhaul-audit`
Base: `main`

## Non-negotiable constraints
- Preserve the existing prologue exactly.
- Preserve all existing voice acting assets and playback.
- Do not add online, multiplayer, matchmaking, or online-like systems.
- Prefer incremental changes and backward-compatible saves; do not replace the project wholesale.
- Keep the current combat presentation unless a migration is explicitly approved. The repository currently uses turn-based combat; do not silently convert it to real-time action combat.

## Current systems observed
- Three playable classes: Warrior, Mage, Archer.
- Turn-based overworld combat, abilities, cooldowns/resources, defensive stance, dodge, automatic block, critical hits, status effects, and enemy special attacks.
- Stats are composed from base attributes, equipment, runes, forge/enchantments, effects, and talents.
- Save data has versioned migrations (current observed version: 13); existing saves must remain loadable.
- Passive tree is already separate from legacy class talents; compatibility paths must be retained.
- Campaign already has act/mission structure; expand content without touching prologue or voice assets.

## Audit findings / risks to verify before implementation
1. **Defense resolution consistency:** dodge, stance block, automatic block, armor mitigation, and enemy special effects need a single documented resolution order. Verify whether status effects still apply on a blocked hit.
2. **Combat caps:** dodge is capped at 65%, block chance at 60%, block power at 90%, critical chance at 75%. UI and descriptions must reflect actual caps.
3. **Stat/talent naming mismatch:** audit passive descriptions against actual fields/effects (e.g. constitution/defense labels versus `defFlat` values).
4. **Legacy talent mutation:** old talents can alter max HP/MP directly; verify reset/reallocation and loading do not compound or invert bonuses.
5. **Passive-tree scaling:** increase meaningful build choices (branch identity, notable nodes, keystones, prerequisites) while avoiding runaway additive/multiplicative stacking.
6. **Save migration safety:** every new field needs defaults and a migration; never discard unknown/legacy fields casually.
7. **Progression/balance:** validate XP curve, resource growth, enemy scaling, item tiers, Luck, crafting, and enchantment +1…+20 against level and campaign boundaries.
8. **Combat mode consistency:** keep Tower and overworld combat aligned with the existing turn-based core unless design decisions explicitly say otherwise.

## Proposed staged delivery
### Stage 1 — Baseline and safety
- Map modules, data dependencies, startup flow, and existing test/build scripts.
- Add reproducible smoke checks for saves, stats, passive allocation, and combat resolution.
- Capture baseline behavior before touching balance.

### Stage 2 — Combat foundations
- Extract/document one deterministic hit-resolution pipeline:
  hit → dodge → block → mitigation → damage → on-hit effects → death/loot.
- Ensure stance block and automatic block are distinct, readable, and tested.
- Add class-specific defensive/utility choices without removing existing abilities.

### Stage 3 — Class identity and talents
- Warrior: threat/frontline, block/counter, rage and heavy weapon paths.
- Mage: elemental specialization, mana economy, wards/control.
- Archer: precision, mobility, traps/poison, resource-efficient ranged combat.
- Expand passive tree with connected clusters, notables, keystones, and clear trade-offs.
- Keep legacy talents and old saves compatible.

### Stage 4 — Content and presentation
- Expand the existing five-act campaign toward 25 missions, locations, enemy families, elites, and bosses.
- Add organized 2D tile/asset directories; document source, license, dimensions, and atlas conventions.
- Polish UI feedback for damage, dodge, block, criticals, status effects, loot, and build progression.
- Do not alter prologue text/audio or voice assets.

### Stage 5 — Verification and release
- Run available tests/build checks; manually verify fresh and migrated saves.
- Check all three classes, key defensive interactions, passive allocation/reset, campaign transitions, and Tower.
- Fix regressions before opening a review PR. Do not merge to `main` without review.

## Definition of done
- No prologue or voice-acting changes.
- No online features.
- Existing save versions migrate safely.
- Combat and talent math have tests or repeatable checks.
- No new console/runtime errors in smoke checks.
- Changes are isolated on the development branch and reviewed before merge.
