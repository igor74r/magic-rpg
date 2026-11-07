import assert from 'node:assert/strict';
import {
  WORLD_CONNECTIONS,
  WORLD_REGION_IDS,
  STARTING_ROUTES,
  getWorldRouteKey,
  isWorldRoute
} from '../data/world.js';
import {
  createWorldState,
  deriveWorldSeed,
  createSeededRandom,
  deriveRegionSeed,
  createRegionRandom,
  ensureWorldState,
  unlockWorldRoute,
  discoverWorldRegion,
  getAccessibleWorldRegions,
  canTravelToRegion
} from '../systems/world-state.js';
import {
  FACTIONS,
  createFactionState,
  ensureFactionState,
  getFactionRank,
  changeFactionReputation
} from '../systems/factions.js';
import {
  getCampaignBranchForMission,
  ensureCampaignBranchState,
  setActiveCampaignMissionForBranch
} from '../systems/campaign-branches.js';
import { state } from '../systems/state.js';
import { saveGame } from '../systems/save.js';
import { startNGPlus } from '../systems/ngplus.js';
import {
  WORLD_EVENT_TEMPLATES,
  advanceWorldEvents,
  acceptWorldEvent,
  recordWorldEventKill,
  recordWorldEventDiscovery,
  claimWorldEventReward
} from '../systems/world-events.js';
import { generateMap } from '../systems/overworld/map.js';
import { spawnEnemies, spawnChests, spawnNPCs, spawnEvents } from '../systems/overworld/spawn.js';
import { LOCATIONS } from '../data/locations.js';
import { syncWorldEventMarkers, markWorldEventMarkerCompleted } from '../systems/overworld/world-event-markers.js';

assert.equal(WORLD_REGION_IDS.length, 16);
for (const [fromId, neighbors] of Object.entries(WORLD_CONNECTIONS)) {
  for (const toId of neighbors) assert.ok(isWorldRoute(fromId, toId), `route must be bidirectional: ${fromId} -> ${toId}`);
}
const reached = new Set(['village']);
const queue = ['village'];
while (queue.length) {
  for (const next of WORLD_CONNECTIONS[queue.shift()]) {
    if (!reached.has(next)) { reached.add(next); queue.push(next); }
  }
}
assert.equal(reached.size, WORLD_REGION_IDS.length, 'all regions must be reachable from Aurora');

const fresh = createWorldState({ seed: 123456 });
assert.equal(fresh.generatorVersion, 1);
assert.equal(fresh.legacyFastTravel, false);
assert.deepEqual(fresh.discoveredRegions, ['village']);
assert.equal(fresh.unlockedRoutes.length, STARTING_ROUTES.length);
assert.deepEqual(getAccessibleWorldRegions(fresh, 'village').sort(), ['briar-hollow', 'forest', 'ruins']);
assert.equal(canTravelToRegion(fresh, 'village', 'forest'), true);
assert.equal(canTravelToRegion(fresh, 'village', 'shadow'), false);
assert.equal(canTravelToRegion(fresh, 'village', 'village'), false);

assert.equal(discoverWorldRegion(fresh, 'forest', 'village'), true);
assert.deepEqual(getAccessibleWorldRegions(fresh, 'forest').sort(), ['briar-hollow', 'shadow', 'swamp', 'village']);
assert.equal(canTravelToRegion(fresh, 'forest', 'shadow'), true);
assert.equal(canTravelToRegion(fresh, 'village', 'shadow'), false);
assert.equal(discoverWorldRegion(fresh, 'shadow', 'forest'), true);
assert.equal(discoverWorldRegion(fresh, 'shadow', 'forest'), false);
assert.equal(unlockWorldRoute(fresh, 'village', 'void-crater'), false);

const rngA = createSeededRandom(424242);
const rngB = createSeededRandom(424242);
assert.deepEqual(Array.from({ length: 8 }, () => rngA()), Array.from({ length: 8 }, () => rngB()));
assert.notEqual(deriveWorldSeed('save-a'), deriveWorldSeed('save-b'));
assert.equal(deriveRegionSeed(fresh, 'forest', 2), deriveRegionSeed(fresh, 'forest', 2));
assert.notEqual(deriveRegionSeed(fresh, 'forest', 2), deriveRegionSeed(fresh, 'forest', 3));
const regionA = createRegionRandom(fresh, 'forest', 1);
const regionB = createRegionRandom(fresh, 'forest', 1);
assert.deepEqual(Array.from({ length: 5 }, () => regionA()), Array.from({ length: 5 }, () => regionB()));

state.settings = { ...state.settings, difficulty: 'normal' };
state.game = { player: { ngPlus: 0 } };
function buildRegionSnapshot(visitIndex) {
  const random = createRegionRandom(fresh, 'forest', visitIndex);
  const loc = LOCATIONS.forest;
  const cols = loc.mapCols || 40;
  const rows = loc.mapRows || 30;
  const map = generateMap('forest', cols, rows, random);
  const playerPos = { x: Math.floor(cols / 2) * 48 + 24, y: Math.floor(rows / 2) * 48 + 24 };
  const enemies = spawnEnemies(loc, map, cols, rows, playerPos, {}, 'forest', random);
  const chests = spawnChests(loc, map, cols, rows, enemies, playerPos, 'forest', random);
  const npcs = spawnNPCs(loc, random);
  const events = spawnEvents(loc, map, cols, rows, playerPos, 'forest', [...enemies, ...chests], random);
  return { map, enemies, chests, npcs, events };
}
assert.deepEqual(buildRegionSnapshot(4), buildRegionSnapshot(4));
assert.notDeepEqual(buildRegionSnapshot(4), buildRegionSnapshot(5));

const legacy = createWorldState({ seed: 7, legacy: true });
assert.equal(legacy.generatorVersion, 1);
assert.equal(legacy.legacyFastTravel, true);
assert.equal(canTravelToRegion(legacy, 'village', 'void-crater'), true);
assert.equal(legacy.discoveredRegions.length, 16);
assert.equal(getAccessibleWorldRegions(legacy, 'village').length, 15);
const clockGame = { world: createWorldState({ seed: 4444 }), factions: createFactionState() };
for (let frame = 0; frame < 60; frame++) advanceWorldEvents(clockGame, 1, 'forest');
assert.ok(Math.abs(clockGame.world.clockMinutes - 1) < 1e-9, '60 normalized 60-FPS frames advance one in-game minute');

const malformedGame = { player: {}, world: { seed: 'bad', discoveredRegions: ['invalid'], unlockedRoutes: ['bad'], events: {} } };
const normalized = ensureWorldState(malformedGame, { legacy: false });
assert.equal(normalized.seed > 0, true);
assert.deepEqual(normalized.discoveredRegions, ['village']);
assert.deepEqual(normalized.events.active, []);

const factionGame = { player: {} };
assert.deepEqual(ensureFactionState(factionGame).reputation, Object.fromEntries(Object.keys(FACTIONS).map(id => [id, 0])));
assert.equal(getFactionRank(-75), 'hostile');
assert.equal(getFactionRank(-30), 'wary');
assert.equal(getFactionRank(0), 'neutral');
assert.equal(getFactionRank(30), 'friendly');
assert.equal(getFactionRank(70), 'honored');
assert.equal(getFactionRank(90), 'allied');
assert.equal(changeFactionReputation(factionGame, 'hub-guardians', 125, 'test reward', 'test').value, 100);
assert.equal(changeFactionReputation(factionGame, 'hub-guardians', -250, 'test penalty', 'test').value, -100);
assert.equal(changeFactionReputation(factionGame, 'unknown', 10), null);
assert.equal(factionGame.factions.changeLog.length, 2);
assert.equal(getFactionDamageReduction(factionGame), 0);
assert.equal(getFactionLootBonus(factionGame), 0);
assert.equal(getFactionEventGoldBonus(factionGame, 'rift-cult'), 0);
changeFactionReputation(factionGame, 'hub-guardians', 90, 'test', 'test');
assert.equal(getFactionDamageReduction(factionGame), 0.15);
changeFactionReputation(factionGame, 'ash-nomads', 70, 'test', 'test');
assert.equal(getFactionLootBonus(factionGame), 0.10);
changeFactionReputation(factionGame, 'rift-cult', 30, 'test', 'test');
assert.equal(getFactionEventGoldBonus(factionGame, 'rift-cult'), 0.05);
assert.equal(getFactionEventGoldBonus(factionGame, 'free-traders'), 0);

function findSeedForTemplate(regionId, templateId) {
  const available = WORLD_EVENT_TEMPLATES.filter(template => template.regions.includes(regionId));
  for (let seed = 1; seed < 100000; seed++) {
    const random = createSeededRandom(deriveWorldSeed(seed, 'world-event', 0, regionId));
    if (available[Math.floor(random() * available.length)]?.id === templateId) return seed;
  }
  throw new Error(`Could not find deterministic seed for ${templateId} in ${regionId}`);
}
const bossBountySeed = findSeedForTemplate('shadow', 'regional-boss-bounty');
const bossBountyGame = { world: createWorldState({ seed: bossBountySeed }), factions: createFactionState() };
bossBountyGame.world.events.nextSpawnAt = 0;
const bossBounty = advanceWorldEvents(bossBountyGame, 1, 'shadow').started[0];
assert.equal(bossBounty.templateId, 'regional-boss-bounty');
assert.equal(bossBounty.objectiveType, 'boss-kill');
assert.equal(acceptWorldEvent(bossBountyGame, bossBounty.id), true);
assert.equal(recordWorldEventKill(bossBountyGame, 'shadow', { elite: true, boss: false }).length, 0,
  'elite enemies must not satisfy a regional boss bounty');
assert.equal(bossBountyGame.world.events.active[0].progress, 0);
const bossBountyCompleted = recordWorldEventKill(bossBountyGame, 'shadow', { elite: true, boss: true });
assert.equal(bossBountyCompleted.length, 1, 'only a boss victory completes the regional bounty');
assert.equal(bossBountyCompleted[0].status, 'completed');
assert.equal(bossBountyGame.factions.reputation['rift-cult'], -12);


const surveySeed = findSeedForTemplate('forest', 'frontier-survey');
const surveyGame = { world: createWorldState({ seed: surveySeed }), factions: createFactionState() };
surveyGame.world.events.nextSpawnAt = 0;
const survey = advanceWorldEvents(surveyGame, 1, 'forest').started[0];
assert.equal(survey.templateId, 'frontier-survey');
assert.equal(survey.objectiveType, 'region-discovery');
assert.ok(['shadow', 'swamp'].includes(survey.targetRegionId) || survey.targetRegionId === 'briar-hollow' || survey.targetRegionId === 'village',
  'survey target must be a connected undiscovered region');
assert.equal(acceptWorldEvent(surveyGame, survey.id), true);
assert.equal(recordWorldEventDiscovery(surveyGame, 'ruins').length, 0, 'unrelated discoveries do not progress a survey');
const surveyCompleted = recordWorldEventDiscovery(surveyGame, survey.targetRegionId);
assert.equal(surveyCompleted.length, 1);
assert.equal(surveyCompleted[0].status, 'completed');
assert.equal(surveyGame.factions.reputation['free-traders'], 10);
const surveyRoundTrip = JSON.parse(JSON.stringify(surveyGame));
ensureWorldState(surveyRoundTrip, { legacy: false });
assert.equal(surveyRoundTrip.world.events.history[0].targetRegionId, survey.targetRegionId,
  'the exact survey destination must survive save/load normalization');
assert.equal(surveyRoundTrip.world.events.history[0].progress, 1);
const malformedSurvey = {
  world: {
    ...createWorldState({ seed: 77 }),
    events: {
      active: [{ id: 'bad-survey', regionId: 'forest', objectiveType: 'region-discovery',
        targetRegionId: 'void-crater', targetCount: 1, progress: 99, accepted: true }],
      history: [], cooldowns: {}, sequence: 1, nextSpawnAt: 999
    }
  }
};
ensureWorldState(malformedSurvey, { legacy: false });
assert.equal(malformedSurvey.world.events.active[0].targetRegionId, null,
  'invalid non-adjacent survey destinations must be rejected during save normalization');
assert.equal(malformedSurvey.world.events.active[0].progress, 1,
  'saved event progress must be clamped to its objective count');
assert.equal(recordWorldEventDiscovery(surveyGame, survey.targetRegionId).length, 0, 'completed survey cannot be counted twice');

const hubPatrolSeed = findSeedForTemplate('forest', 'hub-patrol');
const eventGame = { world: createWorldState({ seed: hubPatrolSeed }), factions: createFactionState() };
eventGame.world.events.nextSpawnAt = 0;
const eventTick = advanceWorldEvents(eventGame, 1, 'forest');
assert.equal(eventTick.started.length, 1);
const worldEvent = eventTick.started[0];
assert.equal(worldEvent.regionId, 'forest');
assert.equal(worldEvent.factionId, 'hub-guardians');
const markerWorld = {
  map: generateMap('forest', 40, 30),
  cols: 40,
  rows: 30,
  player: { x: 20 * 48 + 24, y: 15 * 48 + 24 },
  sourceLocationId: 'forest',
  locationId: 'forest',
  enemies: [], chests: [], npcs: [], statics: [], events: []
};
syncWorldEventMarkers(markerWorld, [worldEvent]);
assert.equal(markerWorld.events.length, 1);
assert.equal(markerWorld.events[0].worldEventId, worldEvent.id);
assert.equal(acceptWorldEvent(eventGame, worldEvent.id), true);
assert.equal(acceptWorldEvent(eventGame, worldEvent.id), false);
assert.equal(recordWorldEventKill(eventGame, 'forest', { elite: false, boss: false }).length, 0);
assert.equal(eventGame.world.events.active[0].progress, 1);
const activeEventRoundTrip = JSON.parse(JSON.stringify(eventGame));
ensureWorldState(activeEventRoundTrip, { legacy: false });
assert.equal(activeEventRoundTrip.world.events.active[0].progress, 1);
assert.equal(activeEventRoundTrip.world.events.active[0].accepted, true);
assert.equal(recordWorldEventKill(eventGame, 'forest', { elite: false, boss: false }).length, 0);
const completedEvents = recordWorldEventKill(eventGame, 'forest', { elite: false, boss: false });
const completedEvent = completedEvents[0];
assert.equal(completedEvent.status, 'completed');
assert.equal(eventGame.world.events.active.length, 0);
assert.equal(eventGame.factions.reputation['hub-guardians'], 8);
assert.equal(markWorldEventMarkerCompleted(markerWorld, worldEvent.id), true);
assert.equal(markerWorld.events[0].emoji, '🎁');
syncWorldEventMarkers(markerWorld, [completedEvent]);
assert.equal(markerWorld.events.length, 1, 'unclaimed completed events remain visible after re-entry');
const completedEventRoundTrip = JSON.parse(JSON.stringify(eventGame));
ensureWorldState(completedEventRoundTrip, { legacy: false });
assert.equal(completedEventRoundTrip.world.events.history[0].status, 'completed');
const eventReward = claimWorldEventReward(completedEventRoundTrip, worldEvent.id);
assert.ok(eventReward.gold >= 30 && eventReward.gold <= 50);
assert.equal(claimWorldEventReward(completedEventRoundTrip, worldEvent.id), null);
syncWorldEventMarkers(markerWorld, []);
assert.equal(markerWorld.events.length, 0, 'claimed events disappear from the world');

const expiredGame = { world: createWorldState({ seed: hubPatrolSeed }), factions: createFactionState() };
expiredGame.world.events.nextSpawnAt = 0;
const expiring = advanceWorldEvents(expiredGame, 1, 'forest').started[0];
assert.ok(expiring);
assert.equal(acceptWorldEvent(expiredGame, expiring.id), true);
expiredGame.world.events.active[0].expiresAt = expiredGame.world.clockMinutes + 0.001;
const expiry = advanceWorldEvents(expiredGame, 1, 'forest');
assert.equal(expiry.finished[0].status, 'failed');
assert.equal(expiredGame.factions.reputation['hub-guardians'], -5);

const cappedGame = { world: createWorldState({ seed: 20261108 }), factions: createFactionState() };
cappedGame.world.events.nextSpawnAt = 0;
assert.equal(advanceWorldEvents(cappedGame, 1, 'forest').started.length, 1);
cappedGame.world.events.nextSpawnAt = 0;
assert.equal(advanceWorldEvents(cappedGame, 1, 'briar-hollow').started.length, 1);
cappedGame.world.events.nextSpawnAt = 0;
assert.equal(advanceWorldEvents(cappedGame, 1, 'swamp').started.length, 0);
assert.equal(cappedGame.world.events.active.length, 2);

const player = { activeCampaignMission: 'a4-m2' };
assert.equal(getCampaignBranchForMission('a1-m1'), 'intro');
assert.equal(getCampaignBranchForMission('a3-m5'), 'ash');
assert.equal(getCampaignBranchForMission('a4-m5'), 'ice');
assert.equal(getCampaignBranchForMission('a5-m5'), 'blood');
assert.equal(ensureCampaignBranchState(player).ice, 'a4-m2');
assert.equal(setActiveCampaignMissionForBranch(player, 'ash', 'a3-m1'), true);
assert.equal(player.activeCampaignByBranch.ash, 'a3-m1');
assert.equal(setActiveCampaignMissionForBranch(player, 'ice', 'a3-m2'), false);

// A brand-new character gets a fresh world; no browser UI is required for this persistence test.
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
state.currentSlot = 1;
state.game = {
  version: 15,
  player: { name: 'New World', class: 'warrior', level: 1, createdAt: 123, playtimeSec: 0, activeCampaignMission: null },
  location: 'village'
};
saveGame();
const saved = JSON.parse(storage.get('magic-rpg-save-1'));
assert.equal(saved.version, 18);
assert.equal(saved.world.generatorVersion, 1);
assert.equal(saved.world.legacyFastTravel, false);
assert.deepEqual(saved.world.discoveredRegions, ['village']);
assert.equal(saved.factions.reputation['hub-guardians'], 0);
assert.deepEqual(saved.player.activeCampaignByBranch, { intro: null, ash: null, ice: null, blood: null });

// NG+ resets world/faction/branch progress while preserving the world seed and carried gear.
state.currentSlot = 2;
state.game = {
  version: 18,
  location: 'obsidian-fields',
  world: {
    ...createWorldState({ seed: 987654 }),
    discoveredRegions: [...WORLD_REGION_IDS],
    regionVisits: { forest: 4, 'obsidian-fields': 2 },
    clockMinutes: 900
  },
  factions: { schemaVersion: 1, reputation: { 'hub-guardians': 80, 'rift-cult': -50, 'free-traders': 30, 'ash-nomads': 70 }, changeLog: [] },
  player: {
    name: 'NG+ Fixture', class: 'warrior', level: 25, exp: 123, expNext: 1000,
    hp: 100, maxHp: 100, mp: 0, maxMp: 50, str: 10, int: 4, wis: 5, con: 10, dex: 6,
    inventory: [{ id: 'iron-sword', qty: 1 }], equipped: { weapon: { id: 'iron-sword' } },
    gold: 321, achievements: ['fixture-achievement'], stats: { kills: { wolf: 10 } },
    weaponLevel: 2, armorLevel: 3, herbs: {}, talents: [], playtimeSec: 120,
    ngPlus: 0, victoryAchieved: true, campaignKills: { 'a3-m1': 2 }, campaignClaimed: Object.fromEntries(Array.from({ length: 25 }, (_, i) => ['a' + (Math.floor(i / 5) + 1) + '-m' + ((i % 5) + 1), true])),
    activeCampaignMission: 'a3-m1', activeCampaignByBranch: { intro: null, ash: 'a3-m1', ice: null, blood: null }
  },
  storyDragons: { 'ash-herald': true, 'ice-grasp': true, 'blood-crown': true },
  storyShards: { flame: true, ice: true, blood: true },
  quests: {}
};
startNGPlus();
const ngPlusSaved = JSON.parse(storage.get('magic-rpg-save-2'));
assert.equal(ngPlusSaved.player.ngPlus, 1);
assert.equal(ngPlusSaved.player.inventory[0].id, 'iron-sword');
assert.equal(ngPlusSaved.world.seed, 987654);
assert.deepEqual(ngPlusSaved.world.discoveredRegions, ['village']);
assert.equal(ngPlusSaved.world.currentRegionId, 'village');
assert.deepEqual(ngPlusSaved.world.regionVisits, { village: 1 });
assert.equal(ngPlusSaved.world.clockMinutes, 0);
assert.deepEqual(ngPlusSaved.factions.reputation, { 'hub-guardians': 0, 'rift-cult': 0, 'free-traders': 0, 'ash-nomads': 0 });
assert.deepEqual(ngPlusSaved.player.activeCampaignByBranch, { intro: null, ash: null, ice: null, blood: null });
assert.deepEqual(ngPlusSaved.player.campaignClaimed, {});

console.log('World foundation: graph, deterministic map/spawn, legacy compatibility, factions, event lifecycle, campaign branches, new saves and NG+ reset passed.');
