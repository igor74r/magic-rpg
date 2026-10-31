import { state } from './systems/state.js';
import { LOCATIONS } from './data/locations.js';
import { STORY } from './data/story.js';
import { on, emit } from './systems/events.js';
import { saveGame, loadSettings, migrateLegacySave } from './systems/save.js';
import { addItem } from './systems/inventory.js';
import { addExp } from './systems/progression.js';
import {
  updateMainMenu, openSettings, backFromSettings, saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  continueGame, startNewGame, enterRiftFromMenu, exitApplication,
  switchSettingsTab, applySettings, resetAllSettings, deleteAllSaves,
  openAchievementsMenu, openHelp,
  exportSave, importSave
} from './ui/menu.js';
import { selectClass, confirmClassSelection } from './ui/character.js';
import {
  renderGame, switchTab, travelTo, useItemOutside, renderSidebarVitals,
  equipItemByIndexUI, unequipItemUI, openShop, buyItemUI,
  enterOverworldFromUI,
  mapSelect, mapTravel, mapEnter,
  showInvTooltip, showEqTooltip, hideTooltip,
  spendStat, sellItemByIndexUI,
  setInvFilter, setInvSort, invSlotClick,
  openBlacksmith, openHealer, openAlchemist, backToVillage,
  openMerchant, openElder, openWell, closeNpcAndResumeUI,
  takeElderBlessingUI, useWellUI, acceptElderQuestUI, turnInElderQuestUI,
  openBard, openGuard, openCat, openKids, openHerald, openQuestBoard,
  payBardUI, petCatUI, claimQuestUI,
  upgradeEquipmentUI, healAtHealerUI, craftRecipeUI,
  showShopTooltip, equipBestUI, sellJunkUI, socketRuneUI,
  allocatePassiveUI, resetPassivesUI, passiveTreePointerDown, passiveTreePointerMove, passiveTreePointerUp
} from './ui/game.js';
import {
  initOverworld, owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owPauseResume, owPauseSaveVillage, owPauseExit, setOverworldPaused
} from './ui/overworld.js';
import { openDailyChest } from './ui/village.js';
import { exitOverworld, enterOverworld } from './systems/overworld.js';
import { isRiftReady } from './systems/rift.js';
import { getNextCampaignMission } from './systems/campaign.js';
import { startNGPlus } from './systems/ngplus.js';
import { showScreen, toast, logTo } from './ui/screens.js';
import { initAudio, playSound, playBGM, updateVolume, resumeContext } from './systems/audio.js';
import * as InterfaceV2 from './ui/interface-v2.js';

const ALWAYS_SHOW_PROLOGUE = false;

on('toast', toast);
on('log', ({ channel, msg, cls }) => logTo('game-log', msg, cls));

on('game:started', () => {
  const log=document.getElementById('game-log'); if(log) log.innerHTML='';
  state.currentTab='locations';
  document.getElementById('rpg-interface-overlay')?.setAttribute('hidden','');
  document.getElementById('rpg-pause-overlay')?.setAttribute('hidden','');
  showScreen('screen-game'); renderGame(); initAudio(); updateVolume(); playBGM('explore');
  const first=getNextCampaignMission(state.game.player);
  // Старт без промежуточного хаба: персонаж появляется у ворот Авроры.
  // Первое поручение выдаётся только после личного разговора со Старейшиной Эдвином.
  const startLocation='village';
  state.game.location=startLocation; saveGame(); enterOverworld(startLocation);
  setTimeout(()=>toast('АКТ I · '+(first?.act?.title||'Корни, помнящие звёзды')+' — поговорите со Старейшиной Эдвином'),450);
});
on('game:loaded', (payload={}) => {
  if(!state.game) return;
  const log=document.getElementById('game-log'); if(log) log.innerHTML='';
  state.currentTab='locations';
  showScreen('screen-game'); renderGame(); initAudio(); updateVolume();
  const destination=LOCATIONS[state.game.location] ? state.game.location : 'village';
  enterOverworld(destination);
  playBGM(destination==='village'?'village':'explore');
  if(payload.openRift) setTimeout(()=>InterfaceV2.openRpgWindow('rift'),180);
});
on('game:update', renderGame);
on('overworld:hud-refresh', renderSidebarVitals);

function mountOverworldInDashboard() {
  const host=document.getElementById('dashboard-overworld-host');
  const source=document.querySelector('#screen-overworld > .game-container');
  if(!host||!source)return;
  if(source.parentElement!==host)host.appendChild(source);
  host.hidden=false; showScreen('screen-game');
}
function toggleGameMenu() {
  const layer=document.getElementById('rpg-interface-overlay');
  if(layer&&!layer.hidden) InterfaceV2.closeRpgWindow();
  else InterfaceV2.openRpgWindow('inventory');
}
function openGameMenuTab(tab) {
  const aliases={quests:'journal',statistics:'character',chronicles:'journal',talents:'character',spells:'character'};
  InterfaceV2.openRpgWindow(aliases[tab]||tab);
}
function closeGamePanel(){InterfaceV2.closeRpgWindow();}
function enterRift(){
  if(!isRiftReady()){toast('Разлом откроется после победы над тремя драконами.');return;}
  if(state.game?.player) InterfaceV2.openRpgWindow('rift');
  else enterRiftFromMenu();
}
on('overworld:start', () => {
  mountOverworldInDashboard();
  const title = document.getElementById('overworld-title');
  if (title) title.textContent = LOCATIONS[state.overworld?.locationId]?.name || 'Локация';
  renderGame();
  initOverworld();
  if (state.overworld.locationId === 'village') playBGM('village');
  else playBGM('explore');
  InterfaceV2.renderHotbar();
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

let levelUpBanner = null;
let levelUpBannerTimer = null;

on('progression:level-up', ({ level } = {}) => {
  if (!levelUpBanner) {
    levelUpBanner = document.createElement('div');
    levelUpBanner.className = 'level-up-banner';
    levelUpBanner.setAttribute('role', 'status');
    levelUpBanner.setAttribute('aria-live', 'polite');

    const kicker = document.createElement('span');
    kicker.className = 'level-up-kicker';
    kicker.textContent = '✦ НОВЫЙ УРОВЕНЬ ✦';

    const value = document.createElement('strong');
    value.className = 'level-up-value';

    const reward = document.createElement('span');
    reward.className = 'level-up-reward';
    reward.textContent = '+1 характеристика · +1 очко талантов';

    levelUpBanner.appendChild(kicker);
    levelUpBanner.appendChild(value);
    levelUpBanner.appendChild(reward);
    document.body.appendChild(levelUpBanner);
  }

  const value = levelUpBanner.querySelector('.level-up-value');
  if (value) value.textContent = `Уровень ${Number(level) || ''}`;

  levelUpBanner.classList.remove('is-visible');
  void levelUpBanner.offsetWidth;
  levelUpBanner.classList.add('is-visible');

  clearTimeout(levelUpBannerTimer);
  levelUpBannerTimer = setTimeout(() => {
    levelUpBanner?.classList.remove('is-visible');
  }, 2400);
});

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
    initVoices();
  }
  resumeContext();
  const btn = e.target.closest('button');
  if (btn && !btn.closest('#combat-panel') && !btn.closest('#npc-panel') && !btn.closest('.stat-buttons')) playSound('click');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hideTooltip(); }
});
window.addEventListener('scroll', () => hideTooltip(), true);

function respawnInVillage() {
  if (!state.game) return;
  const p = state.game.player;
  p.hp = Math.ceil(p.maxHp / 2);
  p.mp = p.class === 'warrior' ? 0 : Math.ceil(p.maxMp / 2);
  p.effects = [];
  p.cooldowns = {};
  const firstMission=STORY.acts[0]?.missions?.[0];
  const checkpoint=p.checkpointLocation||firstMission?.locationId||'briar-hollow';
  state.game.location=LOCATIONS[checkpoint]?checkpoint:'briar-hollow';
  state.overworld=null;
  saveGame();
  enterOverworld(state.game.location);
  playBGM('explore');
  toast('Вы вернулись к последнему рубежу. Путь продолжается.');
}

function deathToMenu() {
  if (!state.game) return;
  const p = state.game.player;
  p.hp = Math.ceil(p.maxHp / 2);
  p.mp = p.class === 'warrior' ? 0 : Math.ceil(p.maxMp / 2);
  p.effects = [];
  p.cooldowns = {};
  const firstMission=STORY.acts[0]?.missions?.[0];
  state.game.location=p.checkpointLocation||firstMission?.locationId||'briar-hollow';
  state.overworld = null;
  saveGame();
  showScreen('screen-main');
  updateMainMenu();
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
      p.gold = (p.gold || 0) + 12;
      logMsg = `🎁 Сундук: +12💰`;
      toastMsg = `🎁 +12💰!`;
    } else {
      p.hp = Math.max(1, p.hp - 20);
      ow.player.hp = p.hp;
      logMsg = `🎁 Мимик! −20 HP`;
      toastMsg = `🎁 Мимик! −20 HP`;
    }
  } else if (ev.eventType === 'crystal') {
    p.gold = (p.gold || 0) + 8;
    addExp(30);
    logMsg = `💎 Кристалл маны: +8💰, +30 EXP`;
    toastMsg = `💎 +8💰, +30 EXP`;
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

function skipPrologue() {
  localStorage.setItem('magic-rpg-prologue-seen','1');
  showScreen('screen-main');
  updateMainMenu();
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
  mapSelect, mapTravel, mapEnter,
  exitOverworld,

  toggleGameMenu, openGameMenuTab, closeGamePanel,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owPauseResume, owPauseSaveVillage, owPauseExit,
  showInvTooltip, showEqTooltip, hideTooltip,
  spendStat,
  setInvFilter, setInvSort,
  invSlotClick,
  respawnInVillage, deathToMenu,
  openDailyChest,
  openBlacksmith, openHealer, openAlchemist, backToVillage,
  openMerchant, openElder, openWell,
  closeNpcAndResume: closeNpcAndResumeUI,
  takeElderBlessing: takeElderBlessingUI,
  acceptElderQuest: acceptElderQuestUI,
  turnInElderQuest: turnInElderQuestUI,
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
  socketRune: socketRuneUI,
  allocatePassive: allocatePassiveUI,
  resetPassives: resetPassivesUI,
  passiveTreePointerDown, passiveTreePointerMove, passiveTreePointerUp,
  startNGPlus,
  enterRift,
  showScreen,
  skipPrologue,
  exportSave,
  importSave,
  continueGame, startNewGame, enterRiftFromMenu, exitApplication,
  ...InterfaceV2,
  setOverworldPaused,
  openGameMenuTab, closeGamePanel, toggleGameMenu
};

InterfaceV2.initInterfaceV2();

migrateLegacySave();
loadSettings();

const prologueSeen = localStorage.getItem('magic-rpg-prologue-seen');
const hasAnySave = !!(localStorage.getItem('magic-rpg-save-1') || localStorage.getItem('magic-rpg-save-2') || localStorage.getItem('magic-rpg-save-3'));
const prologueEl = document.getElementById('screen-prologue');

const showPrologue = false; // V2: первый запуск — сразу в главное меню и выбор архетипа.

if (showPrologue && prologueEl) {
  showScreen('screen-prologue');
} else {
  showScreen('screen-main');
  updateMainMenu();
}

window.addEventListener('beforeunload', () => {
if (state.game) saveGame();
});