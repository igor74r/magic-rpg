import { state } from './systems/state.js';
import { on, emit } from './systems/events.js';
import { saveGame, loadSettings, migrateLegacySave } from './systems/save.js';
import { addItem } from './systems/inventory.js';
import { addExp } from './systems/progression.js';
import {
  updateMainMenu, openSettings, backFromSettings, saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  switchSettingsTab, applySettings, resetAllSettings, deleteAllSaves,
  openAchievementsMenu, openHelp,
  exportSave, importSave
} from './ui/menu.js';
import { selectClass, confirmClassSelection } from './ui/character.js';
import {
  renderGame, switchTab, travelTo, useItemOutside,
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
  owPauseResume, owPauseSaveVillage, owPauseExit, owDungeonNext, owDungeonPrevious
} from './ui/overworld.js';
import { openDailyChest } from './ui/village.js';
import { exitOverworld, enterOverworld } from './systems/overworld.js';
import { isRiftReady, getRandomRiftLocation } from './systems/rift.js';
import { startNGPlus } from './systems/ngplus.js';
import { showScreen, toast, logTo } from './ui/screens.js';
import {
  initAudio, playSound, playBGM, updateVolume, resumeContext
} from './systems/audio.js';
import {
  speak as speakVoice, stop as stopVoice,
  isVoiceSupported, initVoices
} from './systems/voice.js';

const ALWAYS_SHOW_PROLOGUE = false;

on('toast', toast);
on('log', ({ channel, msg, cls }) => logTo('game-log', msg, cls));

on('game:started', () => {
  stopVoice();
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
    initVoices();
  }
  resumeContext();
  const btn = e.target.closest('button');
  if (btn && !btn.closest('#combat-panel') && !btn.closest('#npc-panel') && !btn.closest('.stat-buttons')) playSound('click');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hideTooltip(); stopVoice(); }
});
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
  const locId = getRandomRiftLocation(1);
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
  stopVoice();
  localStorage.setItem('magic-rpg-prologue-seen', '1');
  showScreen('screen-main');
  updateMainMenu();
}

// ==== ОЗВУЧКА ПРОЛОГА (MP3 + TTS фолбэк) ====
let prologueAudio = null;

function getPrologueText(screen) {
  if (!screen) return '';
  const parts = [];
  screen.querySelectorAll('h1, h2, h3, p, li').forEach(el => {
    if (el.closest('button')) return;
    const t = (el.textContent || '').trim();
    if (t) parts.push(t);
  });
  return parts.join('. ');
}

function resetPrologueBtn(btn) {
  btn.textContent = '🔊 Озвучить пролог';
}

function playTtsPrologue(screen, btn) {
  if (!isVoiceSupported()) {
    btn.textContent = '🔇 Голос недоступен';
    return;
  }
  if (window.speechSynthesis.speaking) {
    stopVoice();
    resetPrologueBtn(btn);
    return;
  }
  const text = getPrologueText(screen);
  const ok = speakVoice(text, { rate: 0.9, pitch: 0.85, volume: 1 });
  if (ok) {
    btn.textContent = '⏹ Остановить';
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        clearInterval(check);
        resetPrologueBtn(btn);
      }
    }, 400);
  } else {
    btn.textContent = '🔇 Голос недоступен';
  }
}

function setupPrologueVoice() {
  const screen = document.getElementById('screen-prologue');
  if (!screen) return;

  if (document.getElementById('prologue-voice-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'prologue-voice-btn';
  btn.type = 'button';
  btn.className = 'btn secondary';
  btn.textContent = '🔊 Озвучить пролог';
  btn.style.cssText = 'display:block; margin: 14px auto 8px auto; padding: 10px 18px;';
  screen.appendChild(btn);

  prologueAudio = new Audio('audio/prologue.mp3');
  prologueAudio.preload = 'auto';
  prologueAudio.volume = 1;
  
  prologueAudio.addEventListener('ended', () => {
    resetPrologueBtn(btn);
  });
  
  prologueAudio.addEventListener('error', (e) => {
    console.warn('[prologue] Ошибка загрузки mp3:', prologueAudio.error);
  });

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (prologueAudio && !prologueAudio.paused) {
      prologueAudio.pause();
      prologueAudio.currentTime = 0;
      resetPrologueBtn(btn);
      return;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      stopVoice();
      resetPrologueBtn(btn);
      return;
    }

    if (prologueAudio) {
      try {
        prologueAudio.currentTime = 0;
        await prologueAudio.play();
        btn.textContent = '⏹ Остановить';
        return;
      } catch (err) {
        console.warn('[prologue] MP3 не удалось воспроизвести, переключаемся на TTS.');
      }
    }
    playTtsPrologue(screen, btn);
  });
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
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owPauseResume, owPauseSaveVillage, owPauseExit, owDungeonNext, owDungeonPrevious,
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
  stopVoice,
  resetPrologue: () => {
    localStorage.removeItem('magic-rpg-prologue-seen');
    location.reload();
  },
  voiceInfo: () => {
    if (!window.speechSynthesis) return 'Web Speech API не поддерживается';
    const voices = window.speechSynthesis.getVoices();
    console.table(voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
    return { count: voices.length, speaking: window.speechSynthesis.speaking };
  },
};

migrateLegacySave();
loadSettings();

const prologueSeen = localStorage.getItem('magic-rpg-prologue-seen');
const hasAnySave = !!(localStorage.getItem('magic-rpg-save-1') || localStorage.getItem('magic-rpg-save-2') || localStorage.getItem('magic-rpg-save-3'));
const prologueEl = document.getElementById('screen-prologue');

const showPrologue = ALWAYS_SHOW_PROLOGUE || (!prologueSeen && !hasAnySave);

if (showPrologue && prologueEl) {
  showScreen('screen-prologue');
  setupPrologueVoice();
} else {
  showScreen('screen-main');
  updateMainMenu();
}

window.addEventListener('beforeunload', () => {
  stopVoice();
  if (prologueAudio) { try { prologueAudio.pause(); } catch {} }
  if (state.game) saveGame();
});