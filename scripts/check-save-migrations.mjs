// Migration regression: exercise every supported save version v1-v16 without touching real browser storage.
import assert from 'node:assert/strict';
import { migrateGame, loadGameData, migrateLegacySave, hasSave, deleteSave, getSlotInfo } from '../systems/save.js';
import { state } from '../systems/state.js';
import { EQUIPMENT_SLOTS } from '../systems/inventory.js';

const expectedSlots = ['weapon','head','shoulders','chest','gloves','legs','boots','shield','ring1','ring2','amulet','cloak'];
const failures = [];
for (let version = 1; version <= 16; version++) {
  const equipped = version <= 12
    ? {
        weapon: 'iron-sword', armor: 'leather-armor',
        helmet: { id: 'cinder-visor', qty: 1 },
        hands: { id: 'tower-shield', qty: 1 },
        legs: { id: 'windstep-boots', qty: 1 },
        back: { id: 'ranger-cloak', qty: 1 },
        wrists: { id: 'oath-bracers', qty: 1 },
        seal: { id: 'seal-five-orders', qty: 1 }
      }
    : version <= 15
      ? {
          weapon: 'iron-sword', head: { id: 'cinder-visor', qty: 1 },
          chest: { id: 'leather-armor', qty: 1 },
          hands: { id: 'tower-shield', qty: 1 },
          legs: { id: 'windstep-boots', qty: 1 },
          back: { id: 'ranger-cloak', qty: 1 },
          wrists: { id: 'oath-bracers', qty: 1 },
          seal: { id: 'seal-five-orders', qty: 1 },
          shoulders: null, ring1: null, ring2: null
        }
      : {
          weapon: { id: 'iron-sword', qty: 1 },
          head: { id: 'cinder-visor', qty: 1 },
          chest: { id: 'leather-armor', qty: 1 },
          shield: { id: 'tower-shield', qty: 1 },
          boots: { id: 'windstep-boots', qty: 1 },
          cloak: { id: 'ranger-cloak', qty: 1 },
          gloves: { id: 'oath-bracers', qty: 1 },
          amulet: { id: 'seal-five-orders', qty: 1 },
          shoulders: null, legs: null, ring1: null, ring2: null
        };
  const player = {
    name: 'Migration Fixture', class: 'warrior', level: 12, exp: 345, gold: 678,
    inventory: [{ id: 'mana-crystal', qty: 2 }, { id: 'health-potion', qty: 3 }],
    spells: ['fireball'],
    stats: { kills: { wolf: 17 }, deaths: 4, goldEarned: 900, chestsOpened: 2 },
    equipped,
    campaignKills: { 'a1-m1': 3 }
  };
  if (version >= 12) player.campaignClaimed = { 'a1-m1': true };
  if (version >= 15) player.luck = 10.5;
  const fixture = { version, player, location: 'village', shards: { forest: true } };
  if (version >= 14) {
    fixture.storyShards = { flame: false, ice: false, blood: false };
    fixture.storyDragons = { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false };
  }
  const migrated = migrateGame(fixture);
  try {
    assert.equal(migrated.version, 17);
    assert.equal(migrated.player.name, 'Migration Fixture');
    assert.equal(migrated.player.level, 12);
    assert.equal(migrated.player.exp, 345);
    assert.equal(migrated.player.gold, 678);
    assert.deepEqual(migrated.player.stats.kills, { wolf: 17 });
    assert.equal(migrated.player.stats.deaths, 4);
    assert.ok(migrated.player.spells.includes('fireball'));
    assert.equal(migrated.player.inventory.find(item => item.id === 'old-archive-seal')?.qty, 2);
    assert.equal(migrated.player.inventory.find(item => item.id === 'health-potion')?.qty, 3);
    assert.equal(migrated.player.equipped.weapon?.id, 'iron-sword');
    assert.equal(migrated.player.equipped.chest?.id, 'leather-armor');
    assert.equal(migrated.player.equipped.head?.id, 'cinder-visor');
    assert.equal(migrated.player.equipped.shield?.id, 'tower-shield');
    assert.equal(migrated.player.equipped.boots?.id, 'windstep-boots');
    assert.equal(migrated.player.equipped.cloak?.id, 'ranger-cloak');
    assert.equal(migrated.player.equipped.gloves?.id, 'oath-bracers');
    assert.equal(migrated.player.equipped.amulet?.id, 'seal-five-orders');
    assert.deepEqual(Object.keys(migrated.player.equipped).sort(), [...expectedSlots].sort());
    assert.equal(migrated.player.luck, 10.5);
    assert.equal(migrated.player.campaignClaimed['a1-m1'], true);
    assert.equal(migrated.storyShards.flame, false);
    assert.equal(migrated.storyShards.ice, false);
    assert.equal(migrated.storyShards.blood, false);
    assert.equal(migrated.storyDragons['blood-crown'], false);
    const snapshot = JSON.stringify(migrated);
    migrateGame(migrated);
    assert.equal(JSON.stringify(migrated), snapshot, 'migration must be idempotent');
    console.log(`PASS save v${version} -> v17 (data, slots, shards, Luck, idempotence)`);
  } catch (error) {
    failures.push({ version, error: error.message });
    console.log(`FAIL save v${version} -> v17: ${error.message}`);
  }
}
assert.deepEqual(EQUIPMENT_SLOTS, expectedSlots);

// Exercise the real load-and-rewrite path against disposable in-memory storage.
const storage = new Map([
  ['magic-rpg-save-1', JSON.stringify({
    version: 16,
    player: { name: 'Storage Fixture', level: 8, luck: 8.5, inventory: [{ id: 'mana-crystal', qty: 4 }],
      equipped: Object.fromEntries(expectedSlots.map(slot => [slot, null])) },
    storyShards: { flame: false, ice: false, blood: false },
    storyDragons: { 'ash-herald': false, 'ice-grasp': false, 'blood-crown': false }
  })],
  ['magic-rpg-settings', '{"sentinel":"keep"}']
]);
globalThis.localStorage = {
  getItem: key => storage.has(key) ? storage.get(key) : null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
state.game = null;
state.currentSlot = 1;
const loaded = loadGameData(1);
const rewritten = JSON.parse(storage.get('magic-rpg-save-1'));
const storagePathOk = loaded && state.game?.version === 17 && rewritten.version === 17 &&
  rewritten.player.inventory[0]?.id === 'old-archive-seal' && rewritten.player.inventory[0]?.qty === 4 &&
  storage.get('magic-rpg-settings') === '{"sentinel":"keep"}';
console.log(`${storagePathOk ? 'PASS' : 'FAIL'} loadGameData migrates and rewrites v16 slot without changing settings`);
assert.ok(storagePathOk);


// Save-slot API must reject invalid indices rather than read, write or delete
// arbitrary localStorage keys.
for (const invalidSlot of [0, -1, 4, 1.5, '1', null]) {
  assert.equal(loadGameData(invalidSlot), false, `invalid slot ${String(invalidSlot)} must not load`);
  assert.equal(hasSave(invalidSlot), false, `invalid slot ${String(invalidSlot)} must not be reported as saved`);
  assert.equal(getSlotInfo(invalidSlot), null, `invalid slot ${String(invalidSlot)} must not expose slot info`);
}
storage.set('magic-rpg-save-4', '{"marker":"must-not-delete"}');
deleteSave(4);
assert.equal(storage.get('magic-rpg-save-4'), '{"marker":"must-not-delete"}',
  'invalid slot must not delete storage outside the three supported slots');
console.log('PASS save-slot APIs reject invalid slot indices');

// Legacy single-slot saves must not be deleted if slot 1 is already occupied.
storage.set('magic-rpg-save', JSON.stringify({ marker: 'legacy-character' }));
storage.set('magic-rpg-save-1', JSON.stringify({ marker: 'slot-one-character' }));
migrateLegacySave();
assert.equal(storage.get('magic-rpg-save'), JSON.stringify({ marker: 'legacy-character' }),
  'legacy save must remain untouched when slot 1 is occupied');
assert.equal(storage.get('magic-rpg-save-1'), JSON.stringify({ marker: 'slot-one-character' }),
  'existing slot 1 must not be overwritten');
console.log('PASS legacy save is preserved when slot 1 is occupied');

// When slot 1 is empty, migration copies the legacy save and then removes the old key.
storage.delete('magic-rpg-save-1');
migrateLegacySave();
assert.equal(storage.get('magic-rpg-save-1'), JSON.stringify({ marker: 'legacy-character' }),
  'legacy save must migrate into empty slot 1');
assert.equal(storage.has('magic-rpg-save'), false, 'legacy key is removed only after successful copy');
console.log('PASS legacy save migrates when slot 1 is empty');

// Newer and malformed schema versions must be rejected without rewriting the slot.
for (const unsupportedVersion of [18, 'future', 17.5, -1, true]) {
  const original = JSON.stringify({
    version: unsupportedVersion,
    player: { name: 'Future Save', level: 20, inventory: [{ id: 'future-item', qty: 1 }] },
    futureSchemaMarker: { preserve: true }
  });
  storage.set('magic-rpg-save-1', original);
  state.game = null;
  const realConsoleError = console.error;
  console.error = () => {};
  let rejected = false;
  try {
    rejected = loadGameData(1) === false;
  } finally {
    console.error = realConsoleError;
  }
  assert.equal(rejected, true, `unsupported schema ${unsupportedVersion} must be rejected`);
  assert.equal(storage.get('magic-rpg-save-1'), original, `unsupported schema ${unsupportedVersion} must not be rewritten`);
  assert.equal(state.game, null, `unsupported schema ${unsupportedVersion} must not replace active game state`);
  console.log(`PASS future/malformed save version ${String(unsupportedVersion)} is rejected without mutation`);
}

const malformedSave = JSON.stringify({ version: 17, inventory: [{ id: 'health-potion', qty: 1 }] });
storage.set('magic-rpg-save-1', malformedSave);
state.game = null;
const realConsoleError = console.error;
console.error = () => {};
let malformedRejected = false;
try {
  malformedRejected = loadGameData(1) === false;
} finally {
  console.error = realConsoleError;
}
assert.equal(malformedRejected, true, 'save without player object must be rejected');
assert.equal(storage.get('magic-rpg-save-1'), malformedSave, 'malformed save must not be rewritten');
assert.equal(state.game, null, 'malformed save must not replace active game state');
console.log('PASS malformed save structure is rejected without mutation');

const incompleteCurrentSave = JSON.stringify({ version: 17, player: { name: 'Incomplete Current Save', level: 10 } });
storage.set('magic-rpg-save-1', incompleteCurrentSave);
state.game = null;
console.error = () => {};
let incompleteCurrentRejected = false;
try {
  incompleteCurrentRejected = loadGameData(1) === false;
} finally {
  console.error = realConsoleError;
}
assert.equal(incompleteCurrentRejected, true, 'incomplete v17 save must be rejected');
assert.equal(storage.get('magic-rpg-save-1'), incompleteCurrentSave, 'incomplete v17 save must not be rewritten');
assert.equal(state.game, null, 'incomplete v17 save must not replace active game state');
console.log('PASS incomplete current-version save is rejected without mutation');

console.log(`Save migration regression: ${16 - failures.length}/16 legacy versions + load path + future-version and malformed-save guards passed; 12 equipment slots verified.`);
if (failures.length) process.exitCode = 1;
