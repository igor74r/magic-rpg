import assert from 'node:assert/strict';
import { migrateSettings } from '../systems/save.js';

const legacy = migrateSettings({ volume: 42 });
assert.equal(legacy.musicVolume, 42);
assert.equal(legacy.sfxVolume, 42);
assert.equal(legacy.autoSave, true);
assert.equal(legacy.autoSaveInterval, 30);
assert.equal(legacy.difficulty, 'normal');
assert.equal(legacy.settingsVersion, 4);
assert.equal('volume' in legacy, false);

const complete = migrateSettings({
  musicVolume: 25,
  sfxVolume: 90,
  difficulty: 'hard',
  autoSave: false,
  autoSaveInterval: 15,
  screenShake: false,
  damageNumbers: false,
  lowHealthEffects: false,
  reducedMotion: true,
  showFps: true,
  soundEnabled: false
});
assert.equal(complete.musicVolume, 25);
assert.equal(complete.sfxVolume, 90);
assert.equal(complete.difficulty, 'hard');
assert.equal(complete.autoSave, false);
assert.equal(complete.autoSaveInterval, 15);
assert.equal(complete.screenShake, false);
assert.equal(complete.damageNumbers, false);
assert.equal(complete.lowHealthEffects, false);
assert.equal(complete.reducedMotion, true);
assert.equal(complete.showFps, true);
assert.equal(complete.soundEnabled, false);

const invalid = migrateSettings({
  musicVolume: 140,
  sfxVolume: -20,
  difficulty: 'nightmare',
  autoSaveInterval: 10,
  screenShake: 'false',
  damageNumbers: null
});
assert.equal(invalid.musicVolume, 100);
assert.equal(invalid.sfxVolume, 0);
assert.equal(invalid.difficulty, 'normal');
assert.equal(invalid.autoSaveInterval, 30);
assert.equal(invalid.screenShake, true);
assert.equal(invalid.damageNumbers, true);

const empty = migrateSettings(null);
assert.equal(empty.musicVolume, 60);
assert.equal(empty.sfxVolume, 80);
assert.equal(empty.reducedMotion, false);

console.log('Settings migration checks passed');
