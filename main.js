import { state } from './systems/state.js';
import { on, emit } from './systems/events.js';
import { saveGame, loadSettings, migrateLegacySave } from './systems/save.js';
import { addItem } from './systems/inventory.js';
import { addExp } from './systems/progression.js';
import {
  updateMainMenu, openSettings, backFromSettings, saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  switchSettingsTab, applySettings, resetAllSettings, deleteAllSaves,
  openAchievementsMenu, openHelp
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
  openMerchant, openElder, openWell, closeNpcAndResumeUI,
  takeElderBlessingUI, useWellUI,
  openBard, openGuard, openCat, openKids, openHerald, openQuestBoard,
  payBardUI, petCatUI, claimQuestUI,
  upgradeEquipmentUI, healAtHealerUI, craftRecipeUI,
  showShopTooltip, equipBestUI, takeTalentUI, resetTalentsUI, sellJunkUI
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
  initAudio, playSound, playBGM, updateVolume, resumeContext
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
  playBGM('village');
});
on('game:update', renderGame);

on('overworld:start', () => {
  showScreen('screen-overworld');
  initOverworld();
  if (state.overworld.locationId === 'village') playBGM('village');
  else playBGM('explore');
});
on('overworld:end', () => {
  showScreen('screen-game');
  renderGame();
  playBGM('village');
});
on('overworld:defeat', () => {
  showScreen('screen-death');
});

on('combat:start', () => playBGM('combat'));
on('combat:end', () => playBGM('explore'));

on('victory', () => {
  if (state.game && state.game.player) {
    state.game.player.victoryAchieved = true;
    saveGame();
  }
  playSound('victory');
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
    resumeContext();
  }
  resumeContext();
  const btn = e.target.closest('button');
  if (btn && !btn.closest('#combat-panel') && !btn.closest('#npc-panel') && !btn.closest('.stat-buttons')) playSound('click');
});

document.addEventListener('visibilitychange', () => { if (document.hidden) hideTooltip(); });
window.addEventListener('scroll', () => hideTooltip(), true);

function respawnInVillage() {
  if (!state.game) return;
  const p = state.game.player;
  p.hp = Math.ceil(p.maxHp / 2);
  p.mp = p.class === 'warrior' ? 0 : Math.ceil(p.maxMp / 2);
  p.effects = [];
  p.cooldowns = {};
  state.game.location = 'village';
  state.overworld = null;
  saveGame();
  showScreen('screen-game');
  renderGame();
  playBGM('village');
  toast('Вы возродились в деревне');
}

function deathToMenu() {
  if (!state.game) return;
  const p = state.game.player;
  p.hp = Math.ceil(p.maxHp / 2);
  p.mp = p.class === 'warrior' ? 0 : Math.ceil(p.maxMp / 2);
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
  const locId = getRandomRiftLocation(null, 1);
  enterOverworld(locId, { rifMode: true, rifFloor: 1 });
}

function interactNpc(npcId) {
  if (!state.overworld) return;
  state.overworld.paused = true;

  if (npcId.startsWith('event-')) { handleWorldEvent(npcId); return; }

  if (npcId === 'blacksmith') openBlacksmith();
  else if (npcId === 'healer') openHealer();
  else if (npcId === 'alchemist') openAlchemist();
  else if (npcId === 'merchant') openMerchant();
  else if (npcId === 'elder') openElder();
  else if (npcId === 'well') openWell();
  else if (npcId === 'bard') openBard();
  else if (npcId === 'guard') openGuard();
  else if (npcId === 'cat') openCat();
  else if (npcId === 'kids') openKids();
  else if (npcId === 'herald') openHerald();
  else if (npcId === 'questBoard') openQuestBoard();
}

// ⬇️ НОВОЕ: обработчик случайных событий
function handleWorldEvent(eventId) {
  const ow = state.overworld;
  if (!ow) return;
  const ev = (ow.events || []).find(e => e.id === eventId);
  if (!ev) return;

  const p = state.game.player;
  if (!Array.isArray(p.effects)) p.effects = [];

  let logMsg = '';
  let toastMsg = '';

  if (ev.eventType === 'altar') {
    const buffs = ['atkBuff', 'defBuff', 'lifesteal'];
    const buff = buffs[Math.floor(Math.random() * buffs.length)];
    const buffNames = { atkBuff: 'Боевой клич (+30% атаки)', defBuff: 'Щит (+50% защиты)', lifesteal: 'Кровожадность (50% вампиризм)' };
    p.effects.push({ id: buff, duration: 3 });
    logMsg = `⛩️ Алтарь дарует ${buffNames[buff]} на 3 боя`;
    toastMsg = `⛩️ ${buffNames[buff]}!`;
  } else if (ev.eventType === 'mimic') {
    if (Math.random() < 0.5) {
      p.gold = (p.gold || 0) + 100;
      logMsg = `🎁 Сундук: +100💰`;
      toastMsg = `🎁 +100💰!`;
    } else {
      p.hp = Math.max(1, p.hp - 20);
      ow.player.hp = p.hp;
      logMsg = `🎁 Мимик! −20 HP`;
      toastMsg = `🎁 Мимик! −20 HP`;
    }
  } else if (ev.eventType === 'crystal') {
    p.gold = (p.gold || 0) + 50;
    addExp(30);
    logMsg = `💎 Кристалл маны: +50💰, +30 EXP`;
    toastMsg = `💎 +50💰, +30 EXP`;
  } else if (ev.eventType === 'traveler') {
    const items = ['health-potion', 'mana-potion', 'herb-life', 'herb-moon'];
    const itemId = items[Math.floor(Math.random() * items.length)];
    addItem(itemId, 1);
    logMsg = `🧙 Странник дарит: ${itemId}`;
    toastMsg = `🧙 Подарок странника!`;
  }

  saveGame();
  emit('log', { channel: 'game', msg: logMsg, cls: 'success' });
  toast(toastMsg);

  ow.events = ow.events.filter(e => e.id !== eventId);
  ow.paused = false;

  import('./ui/overworld.js').then(m => m.closeDialogAndResume());
}

window.GameAPI = {
  updateMainMenu,
  openSettings, switchSettingsTab, applySettings, backFromSettings,
  resetAllSettings, deleteAllSaves,
  openAchievementsMenu, openHelp,
  saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  selectClass, confirmClassSelection,
  switchTab, travelTo, useItemOutside,
  equipByIndex: equipItemByIndexUI, unequip: unequipItemUI,
  sellByIndex: sellItemByIndexUI,
  sellJunk: sellJunkUI,
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
  openMerchant, openElder, openWell,
  closeNpcAndResume: closeNpcAndResumeUI,
  takeElderBlessing: takeElderBlessingUI,
  useWell: useWellUI,
  payBard: payBardUI,
  petCat: petCatUI,
  claimQuest: claimQuestUI,
  interactNpc,
  upgradeEquipment: upgradeEquipmentUI,
  healAtHealer: healAtHealerUI,
  craftRecipe: craftRecipeUI,
  showShopTooltip,
  equipBest: equipBestUI,
  takeTalent: takeTalentUI,
  resetTalents: resetTalentsUI,
  startNGPlus,
  enterRift,
  showScreen,
};

migrateLegacySave();
loadSettings();
updateMainMenu();
window.addEventListener('beforeunload', () => { if (state.game) saveGame(); });