import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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


const menu = readFileSync(new URL('../ui/menu.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

for (const controlId of [
  'set-music-volume', 'set-sfx-volume', 'set-sound',
  'set-difficulty', 'set-autosave', 'set-autosave-interval',
  'set-hotkeys', 'set-fps', 'set-damage-numbers',
  'set-screen-shake', 'set-low-health', 'set-reduced-motion'
]) {
  assert.ok(menu.includes(`id="${controlId}"`), `missing settings control: ${controlId}`);
  assert.ok(menu.includes(`value('${controlId}')`) || menu.includes(`setBool('${controlId}'`) || controlId.includes('volume'), `settings control is not read: ${controlId}`);
}
assert.ok(html.includes("switchSettingsTab('accessibility')"), 'accessibility tab is not reachable');
assert.ok(menu.includes("tab === 'accessibility'"), 'accessibility settings are not rendered');
assert.match(css, /@media\s*\(max-width:\s*600px\)/, 'mobile settings layout breakpoint missing');
assert.ok(css.includes('#settings-content .settings-row'), 'settings row styles missing');
assert.ok(menu.includes('saveSettings();'), 'settings are not persisted after applying');

console.log('Settings migration and settings UI checks passed');
