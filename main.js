import { state } from './systems/state.js';
import { on } from './systems/events.js';
import { saveGame, loadSettings, migrateLegacySave } from './systems/save.js';
import {
  updateMainMenu, openSettings, backFromSettings, saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots
} from './ui/menu.js';
import { selectClass, confirmClassSelection } from './ui/character.js';
import {
  renderGame, switchTab, travelTo, useItemOutside,
  equipItemByIndexUI, unequipItemUI, openShop, buyItemUI,
  enterOverworldFromUI,
  showInvTooltip, showEqTooltip, hideTooltip,
  spendStat, sellItemByIndexUI,
  setInvFilter, setInvSort,
  openBlacksmith, openHealer, openAlchemist, backToVillage,
  upgradeEquipmentUI, healAtHealerUI, craftRecipeUI,
  showShopTooltip, equipBestUI, takeTalentUI
} from './ui/game.js';
import {
  initOverworld, owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owPauseResume, owPauseSaveVillage, owPauseExit
} from './ui/overworld.js';
import { openDailyChest } from './ui/village.js';
import { exitOverworld, enterOverworld } from './systems/overworld.js';
import { isRiftReady, getRandomRiftLocation } from './systems/rift.js';
import { startNGPlus } from './systems/ngplus.js';
import { showScreen, toast, logTo } from './ui/screens.js';
import {
  initAudio, playSound, startAmbient, stopAmbient,
  updateVolume, resumeContext
} from './systems/audio.js';

on('toast', toast);
on('log', ({ channel, msg, cls }) => logTo('game-log', msg, cls));

on('game:started', () => {
  const log = document.getElementById('game-log');
  if (log) log.innerHTML = '';
  showScreen('screen-game');
  renderGame();
  initAudio();
  updateVolume();
  startAmbient();
});
on('game:update', renderGame);

on('overworld:start', () => {
  showScreen('screen-overworld');
  initOverworld();
});
on('overworld:end', () => {
  showScreen('screen-game');
  renderGame();
});
on('overworld:defeat', () => {
  stopAmbient();
  showScreen('screen-death');
});

on('victory', () => {
  playSound('victory');
  stopAmbient();
  showScreen('screen-victory');
});

function showErrorToast(msg) {
  const el = document.createElement('div');
  el.className = 'error-toast';
  el.textContent = '⚠️ Ошибка: ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

window.addEventListener('error', (e) => {
  console.error('[global error]', e.error || e.message);
  showErrorToast(e.message || 'Неизвестная ошибка');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandled rejection]', e.reason);
  const msg = (e.reason && e.reason.message) ? e.reason.message : String(e.reason || 'Promise');
  showErrorToast(msg);
});

let audioBooted = false;
document.addEventListener('click', (e) => {
  if (!audioBooted) {
    audioBooted = true;
    initAudio();
    if (state.game) startAmbient();
  }
  resumeContext();
  const btn = e.target.closest('button');
  if (btn && !btn.closest('#combat-panel') && !btn.closest('.stat-buttons')) playSound('click');
});

document.addEventListener('visibilitychange', () => { if (document.hidden) hideTooltip(); });
window.addEventListener('scroll', () => hideTooltip(), true);

function respawnInVillage() {
  if (!state.game) return;
  const p = state.game.player;
  p.hp = Math.ceil(p.maxHp / 2);
  p.mp = Math.ceil(p.maxMp / 2);
  p.effects = [];
  p.cooldowns = {};
  state.game.location = 'village';
  state.overworld = null;
  saveGame();
  showScreen('screen-game');
  renderGame();
  startAmbient();
  toast('Вы возродились в деревне');
}

function deathToMenu() {
  if (!state.game) return;
  const p = state.game.player;
  p.hp = Math.ceil(p.maxHp / 2);
  p.mp = Math.ceil(p.maxMp / 2);
  p.effects = [];
  p.cooldowns = {};
  state.overworld = null;
  saveGame();
  showScreen('screen-main');
  updateMainMenu();
}

function enterRift() {
  if (!state.game) return;
  if (!isRiftReady()) {
    toast('Сначала соберите все 3 осколка');
    return;
  }
  const locId = getRandomRiftLocation();
  enterOverworld(locId, { rifMode: true, rifFloor: 1 });
}

window.GameAPI = {
  openSettings, backFromSettings, saveAndMenu, updateMainMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  selectClass, confirmClassSelection,
  switchTab, travelTo, useItemOutside,
  equipByIndex: equipItemByIndexUI, unequip: unequipItemUI,
  sellByIndex: sellItemByIndexUI,
  openShop, buy: buyItemUI,
  enterOverworld: enterOverworldFromUI,
  exitOverworld,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owPauseResume, owPauseSaveVillage, owPauseExit,
  showInvTooltip, showEqTooltip, hideTooltip,
  spendStat,
  setInvFilter, setInvSort,
  respawnInVillage, deathToMenu,
  openDailyChest,
  openBlacksmith, openHealer, openAlchemist, backToVillage,
  upgradeEquipment: upgradeEquipmentUI,
  healAtHealer: healAtHealerUI,
  craftRecipe: craftRecipeUI,
  showShopTooltip,
  equipBest: equipBestUI,
  takeTalent: takeTalentUI,
  startNGPlus,
  enterRift,
  showScreen,
};

migrateLegacySave();
loadSettings();
updateMainMenu();
window.addEventListener('beforeunload', () => { if (state.game) saveGame(); });