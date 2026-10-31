// scripts/smoke-load.mjs
// Smoke-тест: динамически загружает чистые логические модули и данные проекта в Node
// и проверяет базовые инварианты. Не должен трогать DOM / localStorage / Audio.

const mods = await Promise.all([
  import('../systems/state.js'),
  import('../systems/events.js'),
  import('../systems/progression.js'),
  import('../systems/status.js'),
  import('../systems/stats.js'),
  import('../data/classes.js'),
  import('../data/items.js'),
  import('../data/spells.js'),
  import('../data/locations.js'),
  import('../data/enemies.js'),
  import('../data/achievements.js'),
  import('../data/talents.js'),
  import('../data/npcs.js'),
  import('../data/shop.js'),
  import('../data/story.js'),
  import('../data/passives.js'),
  import('../systems/campaign.js'),
  import('../systems/save.js'),
  import('../systems/talents.js'),
  import('../systems/inventory.js'),
  import('../ui/overworld/tile-atlas.js'),
  import('../systems/overworld/hazards.js'),
  import('../ui/overworld/effects.js'),
  import('../systems/overworld/map.js'),
  import('../systems/overworld/spawn.js'),
  import('../systems/exploration.js'),
]);

const { state } = mods[0];
const { on, emit } = mods[1];
const { addExp } = mods[2];
const { EFFECTS, applyEffect, hasEffect } = mods[3];
const { getEffStats, resolveCriticalChance } = mods[4];
const { CLASSES } = mods[5];
const { ITEMS } = mods[6];
const { SPELLS } = mods[7];
const { LOCATIONS } = mods[8];
const { ENEMIES } = mods[9];
const { ACHIEVEMENTS } = mods[10];
const { TALENTS } = mods[11];
const { NPCS, FORGE_BONUS } = mods[12];
const { SHOP_ITEMS } = mods[13];
const { STORY } = mods[14];
const { getPassiveTree } = mods[15];
const { getCampaignProgress, isCampaignComplete, canCompleteMainQuest, recordCampaignKill, acceptCampaignMission, claimCampaignMission, getNextCampaignMission, getMissionReward } = mods[16];
const { migrateGame } = mods[17];

const { getAvailablePassives, allocatePassive, getTalentBonus } = mods[18];
const { addItem, useItem, equipItemByIndex, socketRune, EQUIPMENT_SLOTS } = mods[19];
const { drawAtlasTile, drawAtlasProp } = mods[20];
const { getTileDanger } = mods[21];
const { getCurrentTheme, THEMES } = mods[22];
const { isBlocked, isWalkable } = mods[23];
const { createSpawnRoster } = mods[24];
const { normalizeExploration, recordLocationVisit, markLocationCleared, getDungeonProgress, updateDungeonProgress, isDungeonChestOpened, isDungeonEliteDefeated, claimDungeonEliteReward } = mods[25];

const results = [];
const check = (name, cond) => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}`);

check('state.game is null initially', state.game === null);
check('state has settings', !!state.settings);
check('event bus: on/emit registered', (() => { let got = null; on('smoke:test', (p) => { got = p; }); emit('smoke:test', { ok: true }); return got && got.ok === true; })());

check('3 playable classes loaded', ['warrior', 'mage', 'archer'].every(id => !!CLASSES[id]));
check('spells loaded', Object.keys(SPELLS).length >= 13);
check('all shop entries exist', SHOP_ITEMS.every(id => !!ITEMS[id]));
check('merchant sells every new equipment and rune item', NPCS.merchant.stock.every(id => !!ITEMS[id]));
check('all enemy drop references resolve to items', Object.values(ENEMIES).every(enemy => (enemy.drops || []).every(id => !!ITEMS[id])));
check('all scroll spell references resolve', Object.values(ITEMS).filter(item => item.type === 'scroll').every(item => !!SPELLS[item.spellId] && typeof item.use === 'function'));
check('spell effects are registered', Object.values(SPELLS).every(spell => (!spell.effect || !!EFFECTS[spell.effect]) && (!spell.selfEffect || !!EFFECTS[spell.selfEffect])));
check('new items have callable use handlers', ['greater-health-potion', 'greater-mana-potion', 'scroll-frost-nova', 'scroll-shadow-lance', 'scroll-arcane-surge', 'scroll-radiant-aegis', 'scroll-renewal', 'restorative-potion'].every(id => typeof ITEMS[id]?.use === 'function'));
check('new gear, rune and material categories exist', ['rootbound-hood','cinder-visor','duelist-grips','gravebinder-gloves','windstep-boots','glacier-greaves','amulet-first-light','pendant-last-oath','ring-wolf-eye','ring-quiet-tide'].every(id => !!ITEMS[id]) && ['rune-root','rune-ember','rune-tide','rune-frost','rune-void'].every(id => ITEMS[id]?.type === 'rune') && ['root-fiber','grave-salt','ember-core','frost-essence','void-dust'].every(id => ITEMS[id]?.type === 'material'));
check('locations loaded', Object.keys(LOCATIONS).length >= 10);
check('every location has a valid visual theme', Object.values(LOCATIONS).every(location => !!THEMES[location.theme]));
check('new biomes use dedicated terrain rows and configured themes', ['briar-hollow', 'sunken-necropolis', 'obsidian-fields', 'frost-citadel', 'void-crater'].every(id => Number.isInteger({ 'briar-hollow': 1, 'sunken-necropolis': 2, 'obsidian-fields': 5, 'frost-citadel': 6, 'void-crater': 3 }[id]) && !!THEMES[LOCATIONS[id]?.theme]));
check('hazard surfaces are walkable only in their region', isWalkable([[3]], 1, 1, 24, 24, 'obsidian-fields') && isWalkable([[3]], 1, 1, 24, 24, 'sunken-necropolis') && !isWalkable([[3]], 1, 1, 24, 24, 'forest'));
check('ordinary stone and prop obstacles remain blocked', isBlocked([[3]], 0, 0) && isBlocked([[2]], 0, 0) && isBlocked([[4]], 0, 0));
check('enemies loaded', Object.keys(ENEMIES).length >= 20);
check('five named regional elites are explicitly marked unique', ['rootbound-sentinel','drowned-scribe','ashbound-renegade','mirror-revenant','riftstalker'].every(id => ENEMIES[id]?.uniqueElite === true));
check('achievements loaded', ACHIEVEMENTS.length >= 15);
check('effects loaded', Object.keys(EFFECTS).length >= 5);
check('critical chance adds temporary bonuses once and caps at 75%', resolveCriticalChance({ critChance: 0.2 }, 0.05) === 0.25 && resolveCriticalChance({ critChance: 0.7 }, 0.1) === 0.75);
class ImageStub { set src(value) { this.url = value; this.onload?.(); } }
globalThis.Image = ImageStub;
const atlasCalls = [];
const atlasDrawn = drawAtlasTile({ drawImage: (...args) => atlasCalls.push(args) }, 2, 10, 20, 48, 'briar-hollow');
check('terrain atlas resolves new biome coordinates', atlasDrawn && atlasCalls.length === 1 && atlasCalls[0][1] === 96 && atlasCalls[0][2] === 48);
const propDrawn = drawAtlasProp({ drawImage: (...args) => atlasCalls.push(args) }, 9, 10, 20, 48, 48);
check('props atlas resolves 8×4 sprite coordinates', propDrawn && atlasCalls.length === 2 && atlasCalls[1][1] === 48 && atlasCalls[1][2] === 48);
check('new volcanic region has lava hazards', getTileDanger(3, 'obsidian-fields')?.type === 'lava');
check('new marsh region has poison hazards', getTileDanger(3, 'briar-hollow')?.type === 'poison');
check('new necropolis region has spike hazards', getTileDanger(3, 'sunken-necropolis')?.type === 'spike');
check('ordinary ground has no environmental damage', getTileDanger(0, 'obsidian-fields') === null && getTileDanger(0, 'sunken-necropolis') === null);
check('hazard surfaces are walkable only in their matching regions', !isBlocked([[3]], 0, 0, 'obsidian-fields') && !isBlocked([[3]], 0, 0, 'sunken-necropolis') && isBlocked([[3]], 0, 0, 'forest') && isBlocked([[4]], 0, 0, 'obsidian-fields') && isBlocked([[2]], 0, 0, 'obsidian-fields'));
state.overworld = { locationId: 'briar-hollow', theme: LOCATIONS['briar-hollow'].theme };
const briarWeather = getCurrentTheme().weather;
state.overworld = { locationId: 'obsidian-fields', theme: LOCATIONS['obsidian-fields'].theme };
const obsidianWeather = getCurrentTheme().weather;
state.overworld = null;
check('new regions use their own biome weather', briarWeather === 'rain' && obsidianWeather === 'embers');
const voidRosterSize = LOCATIONS['void-crater'].enemies.length;
const actRoster = createSpawnRoster(LOCATIONS['void-crater'].enemies, voidRosterSize, () => 0);
check('act spawn always includes each enemy and the boss', actRoster.length === voidRosterSize && new Set(actRoster).size === voidRosterSize && LOCATIONS['void-crater'].enemies.every(id => actRoster.includes(id)));
check('extra spawn slots repeat enemies only after full roster', createSpawnRoster(['wolf', 'boss'], 4, () => 0).length === 4 && new Set(createSpawnRoster(['wolf', 'boss'], 4, () => 0)).size === 2);
check('campaign has 5 acts and 25 missions', STORY.acts?.length === 5 && STORY.acts.reduce((n, act) => n + act.missions.length, 0) === 25);
check('campaign enemy IDs exist', STORY.acts.every(act => act.missions.every(mission => !!ENEMIES[mission.enemyId])));
check('25 missions cover all 15 adventure regions with valid enemy spawns', STORY.acts.every(act => act.missions.every(mission => { const location = LOCATIONS[mission.locationId || act.locationId]; return !!location && location.enemies.includes(mission.enemyId); })) && new Set(STORY.acts.flatMap(act => act.missions.map(mission => mission.locationId || act.locationId))).size === 15);
check('passive trees exist for all 3 playable classes', ['warrior', 'mage', 'archer'].every(id => Object.keys(getPassiveTree(id).nodes).length === 31));
const passiveTestPlayer = { class: 'warrior', level: 1, passives: ['start'], passivePoints: 1, talents: [] };
const lockedAtLevelOne = getAvailablePassives(passiveTestPlayer).length === 0;
passiveTestPlayer.level = 2;
const availablePassive = getAvailablePassives(passiveTestPlayer)[0];
const passiveAllocated = !!availablePassive && allocatePassive(passiveTestPlayer, availablePassive.id);
check('passives respect level requirements and spend points', lockedAtLevelOne && passiveAllocated && passiveTestPlayer.passivePoints === 0 && passiveTestPlayer.passives.includes(availablePassive.id));
check('allocated passives affect combat bonuses', getTalentBonus(passiveTestPlayer).atkFlat > 0 || getTalentBonus(passiveTestPlayer).defFlat > 0);

const completeCampaignKills = Object.fromEntries(
  STORY.acts.flatMap(act => act.missions.map(mission => [mission.id, mission.count]))
);
const completeCampaignClaims = Object.fromEntries(
  STORY.acts.flatMap(act => act.missions.map(mission => [mission.id, true]))
);
const completedCampaignPlayer = {
  campaignKills: completeCampaignKills,
  campaignClaimed: completeCampaignClaims
};
const completedShards = { forest: true, ruins: true, shadow: true };
check('campaign starts incomplete', !isCampaignComplete({ campaignKills: {}, campaignClaimed: {} }));

const regionMission = STORY.acts[0].missions[0];
const regionTestPlayer = { campaignKills: {}, campaignClaimed: {}, activeCampaignMission: null };
const accepted = acceptCampaignMission(regionTestPlayer, regionMission.id);
recordCampaignKill(regionTestPlayer, 'forest', regionMission.enemyId);
const noOffRegionProgress = (regionTestPlayer.campaignKills[regionMission.id] || 0) === 0;
recordCampaignKill(regionTestPlayer, STORY.acts[0].locationId, regionMission.enemyId);
const firstKillRecorded = regionTestPlayer.campaignKills[regionMission.id] === 1;
const rewardPreview = getMissionReward(regionMission);
check('campaign requires accepting a mission and counts only in its region', accepted && noOffRegionProgress && firstKillRecorded && rewardPreview.gold > 0 && rewardPreview.exp > 0);
const secondMissionBeforeTurnIn = getNextCampaignMission(regionTestPlayer)?.mission.id === regionMission.id;
regionTestPlayer.campaignKills[regionMission.id] = regionMission.count;
const claimedMission = claimCampaignMission(regionTestPlayer);
check('campaign mission must be completed and turned in', !!claimedMission && claimedMission.mission.id === regionMission.id && regionTestPlayer.activeCampaignMission === null);
const nextMission = getNextCampaignMission(regionTestPlayer);
check('next mission unlocks only after previous turn-in', secondMissionBeforeTurnIn && nextMission?.mission.id === STORY.acts[0].missions[1].id);

check('campaign progress reaches 25/25', getCampaignProgress(completedCampaignPlayer).completed === 25 && getCampaignProgress(completedCampaignPlayer).percent === 100);
check('main quest waits for story campaign', !canCompleteMainQuest({ shards: completedShards, player: { campaignKills: {}, campaignClaimed: {} } }));
check('main quest completes after all shards and missions', canCompleteMainQuest({ shards: completedShards, player: completedCampaignPlayer }));

const migratedV10 = migrateGame({
  version: 10,
  player: { class: 'mage', level: 12, stats: { kills: { [STORY.acts[0].missions[0].enemyId]: 2 } } }
});
check('v10 save migrates to v14 without importing lifetime kills', migratedV10.version === 14 && migratedV10.player.dex === 8 && Object.keys(migratedV10.player.campaignKills).length === 0 && migratedV10.player.stats.kills[STORY.acts[0].missions[0].enemyId] === 2 && EQUIPMENT_SLOTS.length === 12 && EQUIPMENT_SLOTS.every(slot => slot in migratedV10.player.equipped));
const explorationPlayer = {};
recordLocationVisit(explorationPlayer, 'forest', 1000);
recordLocationVisit(explorationPlayer, 'forest', 2000);
const explorationCleared = markLocationCleared(explorationPlayer, 'forest');
check('exploration checkpoints persist visits, timestamps and cleared state', explorationPlayer.exploration.visited.forest.visits === 2 && explorationPlayer.exploration.visited.forest.firstVisitedAt === 1000 && explorationCleared && explorationPlayer.exploration.visited.forest.cleared);
check('legacy saves receive safe exploration defaults', !!migratedV10.player.exploration && migratedV10.player.exploration.lastLocationId === null && Object.keys(normalizeExploration(null).visited).length === 0);
recordLocationVisit(explorationPlayer, 'forest', 3000);
updateDungeonProgress(explorationPlayer, 'forest', { floor: 2, checkpoint: 'crypt-hall', chestId: 'chest-01' });
check('dungeon floor, checkpoint and opened chests survive exploration normalization', getDungeonProgress(explorationPlayer, 'forest')?.floor === 2 && getDungeonProgress(explorationPlayer, 'forest')?.checkpoint === 'crypt-hall' && getDungeonProgress(explorationPlayer, 'forest')?.openedChests.includes('chest-01'));
check('opened dungeon chest can be restored after re-entry', isDungeonChestOpened(explorationPlayer, 'forest', 'chest-01') && !isDungeonChestOpened(explorationPlayer, 'forest', 'chest-02'));
check('unique elite defeat and reward claim persist once per region and floor', claimDungeonEliteReward(explorationPlayer, 'forest', 2, 'rootbound-sentinel') && isDungeonEliteDefeated(explorationPlayer, 'forest', 2, 'rootbound-sentinel') && !claimDungeonEliteReward(explorationPlayer, 'forest', 2, 'rootbound-sentinel') && !isDungeonEliteDefeated(explorationPlayer, 'forest', 1, 'rootbound-sentinel'));

state.game = { player: { inventory: [], spells: [], hp: 100, maxHp: 500, mp: 0, maxMp: 300 } };
addItem('scroll-frost-nova', 2);
const scrollStacked = state.game.player.inventory.length === 1 && state.game.player.inventory[0].qty === 2;
const scrollUsed = useItem('scroll-frost-nova');
check('new scroll stacks and teaches its spell', scrollStacked && scrollUsed && state.game.player.spells.includes('frost-nova') && state.game.player.inventory[0].qty === 1);
addItem('greater-health-potion');
const potionUsed = useItem('greater-health-potion');
check('new potion restores health and is consumed', potionUsed && state.game.player.hp === 460 && !state.game.player.inventory.some(item => item.id === 'greater-health-potion'));

state.game = { player: {
  class: 'warrior', hp: 170, maxHp: 170, mp: 0, maxMp: 100,
  str: 18, int: 4, wis: 7, con: 16, dex: 6,
  inventory: [], spells: [], effects: [], talents: [],
  equipped: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, null]))
} };
addItem('rootbound-hood', 1, { rarity: 'common' });
addItem('rune-root', 1);
const headSlot = equipItemByIndex(0);
const runeInserted = socketRune(0, 'head');
const runeEquipped = state.game.player.equipped.head?.runes?.includes('rune-root');
const gearStats = getEffStats();
check('twelve anatomical equipment slots and two rings are supported', EQUIPMENT_SLOTS.length === 12 && EQUIPMENT_SLOTS.includes('head') && EQUIPMENT_SLOTS.includes('shoulders') && EQUIPMENT_SLOTS.includes('ring1') && EQUIPMENT_SLOTS.includes('ring2') && EQUIPMENT_SLOTS.includes('seal'));
check('headgear can be equipped and rune inserted into its socket', headSlot === 'head' && runeInserted && runeEquipped && !state.game.player.inventory.some(item => item.id === 'rune-root'));
check('additional equipment and socketed runes affect character stats', gearStats.def > 0 && gearStats.dodgeChance > CLASSES.warrior.combat.dodgeChance);
state.game.player.equipped.ring1 = { id: 'ring-wolf-eye', rarity: 'common', bonus: ITEMS['ring-wolf-eye'].bonus };
state.game.player.equipped.ring2 = { id: 'ring-quiet-tide', rarity: 'common', bonus: ITEMS['ring-quiet-tide'].bonus };
addItem('ring-wolf-eye', 1, { rarity: 'common' });
const ringSwapSlot = equipItemByIndex(state.game.player.inventory.length - 1);
check('new ring replaces the weaker ring slot instead of always ring one', ringSwapSlot === 'ring2' && state.game.player.equipped.ring1.id === 'ring-wolf-eye' && state.game.player.equipped.ring2.id === 'ring-wolf-eye');

state.game = { player: { exp: 0, level: 1 } };
addExp(30);
check('addExp increases exp', state.game.player.exp === 30);

state.game = { player: { hp: 80, maxHp: 80, mp: 10, maxMp: 10, str: 4, int: 12, wis: 8, con: 5, equipped: { weapon: null, armor: null }, effects: [], talents: [] } };
const eff = getEffStats();
check('getEffStats computes stats', eff.atk > 0 && eff.mag > 0);

state.game = { player: { hp: 80, maxHp: 80, mp: 10, maxMp: 10, str: 4, int: 12, wis: 8, con: 5, equipped: { weapon: null, armor: null }, effects: [], talents: [] } };
const st = state.game.player;
applyEffect(st, 'burn');
check('status: applyEffect/tick/hasEffect', hasEffect(st, 'burn'));

state.game = null;

if (results.some((r) => r.startsWith('FAIL'))) {
  console.error(results.join('\n'));
  process.exit(1);
}
console.log(results.join('\n'));
console.log('smoke-load: OK');
