# Open-world foundation — v18

## Save contract

game.world stores:

- schemaVersion: world-state schema.
- seed: persistent per-save seed.
- generatorVersion: deterministic generation contract.
- worldSeed and worldGeneratorVersion: synchronized compatibility fields for older v18 clients.
- clockMinutes: in-game world clock.
- legacyFastTravel: compatibility flag for migrated saves.
- discoveredRegions: regions the player has reached.
- unlockedRoutes: graph edges revealed by exploration.
- regionVisits: per-region visit counters.
- currentRegionId: last entered region, so loading a save does not consume another visit seed.
- events: active events, cooldowns, history, sequence and next spawn time.

game.factions stores standing and reputation change history. player.activeCampaignByBranch stores the active mission per independent story branch.

## Exploration rules

1. A new character starts in Aurora (village).
2. The starting routes lead to Forest, Briar Hollow and the Ruins.
3. A player may travel only along a route unlocked from the current region.
4. Entering a region discovers it and reveals its outgoing routes.
5. Returning through an already opened edge is allowed.
6. Recommended story level is displayed as guidance, not as a hard world-travel lock.
7. Rift and Tower access continue to use their own progression requirements.

## Deterministic generation

The region seed is derived from the save seed, region ID and visit index. The map generator and enemy, chest, NPC and ambient-event spawners accept the same injected random source. Legacy saves receive a stable per-save seed and generator version 1, while legacyFastTravel keeps all regions and routes accessible.

## Persistent events

World events advance with the world clock. Visible events receive deterministic map markers. The player must accept an event before its objective progresses. Combat victories update accepted objectives. Completed events apply their faction outcome and remain available for an explicit reward claim. Event acceptance and reward claims are rolled back if persistence fails.

## Migration and NG+

- Every supported legacy schema v1–v17 migrates to v18.
- Migrated saves retain legacy fast travel and all regions/routes to preserve prior access.
- New characters are created directly with the canonical v18 equipment, world, faction and branch structures.
- NG+ preserves the world seed but resets regional discoveries, event state and faction standing.

## Verification

- scripts/check-save-migrations.mjs
- scripts/check-world-foundation.mjs
- scripts/check-world-map-navigation.mjs
- scripts/check-world-events-runtime.mjs
- scripts/check-world-exploration.mjs
- scripts/check-portal-world-map.mjs
- scripts/check-story-location-gates.mjs
- scripts/browser-smoke.mjs
- scripts/browser-visual-regression.mjs