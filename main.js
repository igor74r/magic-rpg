import { state } from './systems/state.js';
import { LOCATIONS } from './data/locations.js?v=20261102-fix1';
import { on, emit } from './systems/events.js';
import { saveGame, loadSettings, migrateLegacySave } from './systems/save.js';
import { addItemOrStore } from './systems/inventory.js';
import { ITEMS } from './data/items.js?v=20261102-fix4';
import { addExp } from './systems/progression.js';
import {
  updateMainMenu, startNewGame, openSettings, backFromSettings, saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  switchSettingsTab, handleSettingsTabKey, applySettings, applyFontScale, resetAllSettings, deleteAllSaves,
  openAchievementsMenu, openHelp,
  exportSave, importSave
} from './ui/menu.js';
import { selectClass, reviewClassSelection, cancelClassReview, confirmClassSelection } from './ui/character.js';
import {
  renderGame, switchTab, useItemOutside,
  equipItemByIndexUI, unequipItemUI, openShop, buyItemUI,
  showInvTooltip, showEqTooltip, hideTooltip,
  spendStat, sellItemByIndexUI,
  setInvFilter, setInvSort, invSlotClick, claimPendingLootUI, openSaleUI, toggleSaleItem, selectSaleTiersUI, selectSaleFilterUI, confirmSaleUI, cancelSaleUI,
  openBlacksmith, openHealer, openAlchemist, backToVillage,
  openMerchant, openElder, openWell, closeNpcAndResumeUI,
  takeElderBlessingUI, useWellUI, acceptElderQuestUI, turnInElderQuestUI,
  openBard, openGuard, openCat, openKids, openHerald, openQuestBoard,
  payBardUI, petCatUI, claimQuestUI,
  upgradeEquipmentUI, healAtHealerUI, craftRecipeUI, reforgeItemUI, setShopPreset, buybackItemUI,
  showShopTooltip, equipBestUI, sellJunkUI, socketRuneUI,
  allocatePassiveUI, resetPassivesUI, passiveTreePointerDown, passiveTreePointerMove, passiveTreePointerUp,
  passiveTreeZoom, passiveTreeResetView, passiveTreeKeyDown
} from './ui/game.js';
import {
  initOverworld, resumeOverworld, owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owPauseResume, owPauseSaveVillage, owPauseExit
} from './ui/overworld.js';
import { openDailyChest } from './ui/village.js';
import { exitOverworld, enterOverworld } from './systems/overworld.js';
import { isRiftReady, getRiftLocations } from './systems/rift.js';
import { getStoryLocationProgression, canEnterStoryLocation } from './systems/campaign.js';
import { getTowerBest, getTowerStartFloor, TOWER_MAX_FLOOR } from './systems/tower.js';
import { startNGPlus } from './systems/ngplus.js';
import { showScreen, toast, logTo, escapeHtml } from './ui/screens.js';
import {
  initAudio, playSound, playBGM, updateVolume, resumeContext
} from './systems/audio.js';
import {
  speak as speakVoice, stop as stopVoice,
  isVoiceSupported, initVoices
} from './systems/voice.js';

const ALWAYS_SHOW_PROLOGUE = false;

// Lightweight runtime diagnostics: capture uncaught errors, rejected promises,
// and failed resource loads without interrupting the game.
const RUNTIME_DIAGNOSTICS_LIMIT = 50;
const runtimeDiagnostics = [];
function recordRuntimeDiagnostic(type, message, details = {}) {
  const entry = {
    type,
    message: String(message || 'Unknown runtime error').slice(0, 500),
    timestamp: new Date().toISOString(),
    ...details
  };
  runtimeDiagnostics.push(entry);
  if (runtimeDiagnostics.length > RUNTIME_DIAGNOSTICS_LIMIT) {
    runtimeDiagnostics.splice(0, runtimeDiagnostics.length - RUNTIME_DIAGNOSTICS_LIMIT);
  }
  try {
    console.warn('[Game diagnostics]', entry);
  } catch {}
  return entry;
}

// Transfer errors that occurred while HTML was parsing and modules were loading.
const earlyDiagnostics = Array.isArray(window.__GAME_DIAGNOSTICS_EARLY__)
  ? window.__GAME_DIAGNOSTICS_EARLY__.splice(0)
  : [];
earlyDiagnostics.forEach(entry => recordRuntimeDiagnostic(entry.type, entry.message, {
  source: entry.source || '',
  line: entry.line || 0,
  column: entry.column || 0,
  resource: entry.resource || ''
}));

window.addEventListener('error', (event) => {
  const target = event.target;
  // Resource errors do not bubble; capture-phase listener receives them.
  if (target && target !== window) {
    const tag = target.tagName ? target.tagName.toLowerCase() : 'resource';
    const url = target.src || target.href || '';
    recordRuntimeDiagnostic('resource-load', `Не удалось загрузить ресурс <${tag}>`, {
      resource: String(url).slice(0, 1000)
    });
    showErrorToast(`Не удалось загрузить ресурс: ${tag}`);
    return;
  }
  recordRuntimeDiagnostic('uncaught-error', event.message || 'Uncaught error', {
    source: event.filename || '',
    line: event.lineno || 0,
    column: event.colno || 0
  });
}, true);

window.__GAME_DIAGNOSTICS_READY__ = true;

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason && reason.stack
    ? reason.stack
    : (reason && reason.message) || String(reason);
  recordRuntimeDiagnostic('unhandled-rejection', message);
});


on('toast', toast);
on('log', ({ channel, msg, cls }) => logTo('game-log', msg, cls));

function showHeroArrivalTransition() {
  const body = document.body;
  if (!body || typeof document.createElement !== 'function') return;
  document.getElementById('hero-arrival-transition')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'hero-arrival-transition';
  overlay.className = 'hero-arrival-transition';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-label', 'Герой создан. Приключение начинается.');
  overlay.innerHTML = `
    <div class="hero-arrival-content">
      <span class="hero-arrival-rune" aria-hidden="true">✦</span>
      <span class="hero-arrival-kicker">ЛЕТОПИСЬ РАЗЛОМА · ГЛАВА ПЕРВАЯ</span>
      <h1>Путь начинается</h1>
      <p>Мир ждёт твоего решения</p>
      <span class="hero-arrival-line" aria-hidden="true"></span>
    </div>
  `;

  const duration = state.settings?.reducedMotion ? 520 : 1450;
  if (typeof overlay.style?.setProperty === 'function') {
    overlay.style.setProperty('--arrival-duration', `${duration}ms`);
  } else if (overlay.style) {
    overlay.style['--arrival-duration'] = `${duration}ms`;
  }
  body.appendChild(overlay);
  (window.setTimeout || globalThis.setTimeout)(() => overlay.remove(), duration + 100);
}

on('game:started', () => {
  stopVoice();
  // A new hero always enters the village scene, never the legacy full-screen world map.
  state.currentTab = 'quests';
  const log = document.getElementById('game-log');
  if (log) log.innerHTML = '';
  showScreen('screen-game');
  renderGame();
  showHeroArrivalTransition();
  initAudio();
  updateVolume();
  playBGM('village');
  enterOverworld('village');
});
on('game:update', renderGame);

on('overworld:start', () => {
  showScreen('screen-game');
  document.getElementById('screen-game')?.classList.remove('map-focused');
  document.getElementById('screen-game')?.classList.add('overworld-active');
  initOverworld();
  if (state.overworld.locationId === 'village') playBGM('village');
  else playBGM('explore');
});
on('overworld:end', () => {
  document.getElementById('screen-game')?.classList.remove('overworld-active');
  showScreen('screen-game');
  renderGame();
  playBGM('village');
});
on('overworld:defeat', () => {
  showScreen('screen-death');
});

on('combat:start', () => playBGM('combat'));
on('combat:end', () => playBGM('explore'));

on('rift:opened', showRiftOpeningCutscene);

on('victory', () => {
  if (state.game && state.game.player) {
    state.game.player.victoryAchieved = true;
    saveGame();
  }
  playSound('victory');
  showScreen('screen-victory');
  updateEndingChoiceUI();
});

function updateEndingChoiceUI() {
  const status = document.getElementById('ending-choice-status');
  if (!status || !state.game) return;
  status.textContent = state.game.riftEnding === 'closed'
    ? 'Разлом закрыт навсегда. Мир больше не соприкоснётся с тем, что лежит за гранью.'
    : state.game.riftEnding === 'open'
      ? 'Разлом оставлен открытым. Его края стабилизированы тремя осколками.'
      : 'Выберите судьбу Разлома.';
}

function chooseRiftEnding(choice) {
  if (!state.game?.player?.victoryAchieved || !['closed', 'open'].includes(choice)) return;
  state.game.riftEnding = choice;
  saveGame();
  updateEndingChoiceUI();
  toast(choice === 'closed' ? '🔒 Разлом запечатан навсегда.' : '🌀 Разлом оставлен открытым и стабилизирован.');
}

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
let dashboardLogFilter = 'all';
let dashboardLogQuery = '';

function applyDashboardNavigationSearch(value) {
  const query = String(value || '').trim().toLocaleLowerCase('ru');
  const list = document.querySelector('.dashboard-tablist');
  if (!list) return;
  list.querySelectorAll('.tab[role="tab"]').forEach(tab => {
    const matches = !query || (tab.textContent || '').toLocaleLowerCase('ru').includes(query);
    tab.hidden = !matches;
  });
  list.querySelectorAll('.dashboard-nav-caption').forEach(caption => {
    let next = caption.nextElementSibling;
    let hasVisibleTab = false;
    while (next && !next.classList.contains('dashboard-nav-caption')) {
      if (next.matches('.tab[role="tab"]:not([hidden])')) hasVisibleTab = true;
      next = next.nextElementSibling;
    }
    caption.hidden = Boolean(query) && !hasVisibleTab;
  });
}

function applyDashboardLogFilters() {
  const log = document.getElementById('game-log');
  if (!log) return;
  const query = dashboardLogQuery.trim().toLocaleLowerCase('ru');
  log.querySelectorAll(':scope > div').forEach(line => {
    const text = (line.textContent || '').toLocaleLowerCase('ru');
    const matchesQuery = !query || text.includes(query);
    const matchesCategory = dashboardLogFilter === 'all'
      || (dashboardLogFilter === 'combat' && /(урон|атак|удар|блок|крит|побед|враг|бой|здоров)/i.test(text))
      || (dashboardLogFilter === 'loot' && /(получ|добыч|предмет|золото|ресурс|осколок|экипировк|сундук)/i.test(text))
      || (dashboardLogFilter === 'story' && /(задан|акт|сюжет|дракон|разлом|мисси|старейшин|локац)/i.test(text));
    line.hidden = !(matchesQuery && matchesCategory);
  });
}

document.addEventListener('input', event => {
  if (event.target?.id === 'dashboard-nav-search') {
    applyDashboardNavigationSearch(event.target.value);
    return;
  }
  if (event.target?.id !== 'game-log-search') return;
  dashboardLogQuery = event.target.value || '';
  applyDashboardLogFilters();
});

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

  const logFilter = e.target.closest('[data-log-filter]');
  if (logFilter) {
    dashboardLogFilter = logFilter.dataset.logFilter || 'all';
    document.querySelectorAll('[data-log-filter]').forEach(button => {
      const active = button === logFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    applyDashboardLogFilters();
    return;
  }

  const action = e.target.closest('[data-game-action]');
  if (!action) return;
  if (action.dataset.gameAction === 'claim-quest') {
    const questId = action.dataset.questId;
    if (questId) window.GameAPI?.claimQuest?.(questId);
  } else if (action.dataset.gameAction === 'close-npc') {
    window.GameAPI?.closeNpcAndResume?.();
  }
});

// Tab-like navigation remains fully usable without a pointer.
document.addEventListener('keydown', (event) => {
  // The How-to overlay can always be dismissed with Escape, even when focus is inside it.
  if (event.key === 'Escape' && document.getElementById('screen-help')?.classList.contains('active')) {
    event.preventDefault();
    event.stopPropagation();
    showScreen('screen-main');
    updateMainMenu();
    return;
  }
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey
      && !/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || '')
      && document.getElementById('screen-game')?.classList.contains('active')) {
    event.preventDefault();
    document.getElementById('dashboard-nav-search')?.focus();
    return;
  }
  if (event.key === 'Escape' && event.target?.id === 'dashboard-nav-search') {
    event.target.value = '';
    applyDashboardNavigationSearch('');
    event.target.blur();
    return;
  }
  const tab = event.target.closest?.('[role="tab"]');
  if (!tab) return;
  const tabs = Array.from(tab.parentElement?.querySelectorAll('[role="tab"]:not([hidden]):not([disabled])') || []);
  if (!tabs.length) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    tab.click();
    return;
  }

  let nextIndex = tabs.indexOf(tab);
  if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = tabs.length - 1;
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (nextIndex + 1) % tabs.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (nextIndex - 1 + tabs.length) % tabs.length;
  else return;

  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
});

function persistBeforeLeaving() {
  stopVoice();
  if (state.game) saveGame();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hideTooltip();
    persistBeforeLeaving();
  }
});
window.addEventListener('pagehide', persistBeforeLeaving);
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
    const message = state.game.riftEnding === 'closed'
      ? 'Разлом запечатан навсегда вашим решением.'
      : 'Разлом закрыт. Печать держится, пока живы три дракона';
    toast(message);
    return;
  }
  openRiftMap();
}

function openRiftMap() {
  if (!state.game || !isRiftReady()) return;
  document.getElementById('rift-map-overlay')?.remove();
  const player = state.game.player;
  const level = player.level || 1;
  const locations = getRiftLocations(level);
  const kills = Object.values(player.stats?.kills || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const deaths = player.stats?.deaths || 0;
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
  const cleared = new Set(player.riftClearedLocations || []).size;
  const shards = Object.values(state.game.storyShards || {}).filter(Boolean).length;
  const crystalStatus = shards === 3 && state.game.storyDragons?.['blood-crown'] ? 'Стабилизирован' : 'Нестабилен';
  const overlay = document.createElement('div');
  overlay.id = 'rift-map-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(7,5,13,.96);color:#f4e9e9;padding:24px;overflow:auto;font-family:inherit;';
  overlay.innerHTML = `
    <div style="max-width:1100px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div><div style="color:#c66b79;letter-spacing:.18em;font-size:12px">ПОСЛЕСЮЖЕТНОЕ ИСПЫТАНИЕ</div><h1 style="margin:6px 0">Карта Разлома</h1><p style="color:#c7b8c0">30 областей · 10 областей требуют 50 уровень · Ваш уровень: ${level}</p></div>
        <button type="button" data-rift-close style="padding:10px 18px">Закрыть</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:18px 0">
        <div style="background:#1c1721;border:1px solid #45303e;border-radius:8px;padding:10px"><small style="color:#bd9aa8">Убийства</small><div style="font-size:22px">${kills}</div></div>
        <div style="background:#1c1721;border:1px solid #45303e;border-radius:8px;padding:10px"><small style="color:#bd9aa8">Смерти</small><div style="font-size:22px">${deaths}</div></div>
        <div style="background:#1c1721;border:1px solid #45303e;border-radius:8px;padding:10px"><small style="color:#bd9aa8">K/D</small><div style="font-size:22px">${kd}</div></div>
        <div style="background:#1c1721;border:1px solid #45303e;border-radius:8px;padding:10px"><small style="color:#bd9aa8">Очищено</small><div style="font-size:22px">${cleared}/30</div></div>
        <div style="background:#1c1721;border:1px solid #45303e;border-radius:8px;padding:10px"><small style="color:#bd9aa8">Осколки</small><div style="font-size:22px">${shards}/3</div></div>
        <div style="background:#1c1721;border:1px solid #45303e;border-radius:8px;padding:10px"><small style="color:#bd9aa8">Кристалл</small><div style="font-size:16px;margin-top:5px">${crystalStatus}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:22px">
        ${locations.map((loc,index)=>`<button type="button" data-rift-id="${loc.id}" ${loc.unlocked?'':'disabled'} style="text-align:left;padding:14px;border:1px solid ${loc.unlocked?'#75434f':'#39323c'};background:${loc.unlocked?'linear-gradient(135deg,#261923,#121019)':'#17151b'};color:${loc.unlocked?'#f3e5e7':'#77717b'};border-radius:10px;min-height:82px;opacity:${loc.unlocked?1:.7}"><strong>${String(index+1).padStart(2,'0')}. ${loc.name}</strong><div style="font-size:12px;margin-top:8px">${loc.unlocked?'Доступна · Войти в область':`Требуется уровень ${loc.minLevel}`}</div></button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-rift-close]')?.addEventListener('click',()=>overlay.remove());
  overlay.querySelectorAll('[data-rift-id]:not(:disabled)').forEach(button=>button.addEventListener('click',()=>{
    const id=button.getAttribute('data-rift-id');
    overlay.remove();
    enterOverworld(id,{rifMode:true,rifFloor:1});
  }));
}

function openTowerMenu() {
  if (!state.game) return;
  document.getElementById('tower-map-overlay')?.remove();
  const best = getTowerBest();
  const startFloor = getTowerStartFloor();
  const overlay = document.createElement('div');
  overlay.id = 'tower-map-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10040;background:rgba(8,7,12,.97);color:#f4e9e9;padding:24px;overflow:auto;';
  overlay.innerHTML = `<div style="max-width:1000px;margin:0 auto"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><small style="color:#d2a66c;letter-spacing:.18em">ОДИНОЧНОЕ ИСПЫТАНИЕ</small><h1 style="margin:6px 0">Башня · 40 этажей</h1><p style="color:#c7b8c0">Лучший результат: ${best}/40 · Следующий старт: ${startFloor} этаж</p></div><button type="button" data-tower-close>Закрыть</button></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;margin:22px 0">${Array.from({length:TOWER_MAX_FLOOR},(_,i)=>{const floor=i+1;const reached=floor<=best;const guardian=floor%5===0;return `<div style="padding:12px 8px;text-align:center;border:1px solid ${reached?'#94714b':'#39323c'};border-radius:8px;background:${reached?'#2a2119':'#17151b'}"><strong>${String(floor).padStart(2,'0')}</strong><div style="font-size:11px;margin-top:5px;color:${guardian?'#d99a78':'#9b929d'}">${guardian?'СТРАЖ':'ЭТАЖ'}</div><div style="font-size:11px;margin-top:4px">${reached?'Пройден':'Впереди'}</div></div>`}).join('')}</div><button type="button" data-tower-start style="display:block;width:100%;padding:15px;border:1px solid #bd8d58;background:linear-gradient(135deg,#3b2a1b,#211810);color:#fff;border-radius:9px;font-size:16px">${best>=40?'Начать заново с 1 этажа':`Продолжить с ${startFloor} этажа`}</button></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-tower-close]')?.addEventListener('click',()=>overlay.remove());
  overlay.querySelector('[data-tower-start]')?.addEventListener('click',()=>{
    overlay.remove();
    enterOverworld(`tower-floor-${String(startFloor).padStart(2,'0')}`,{towerMode:true,towerFloor:startFloor});
  });
}

function showRiftOpeningCutscene() {
  if (!state.game || state.game.riftOpeningSeen) return;
  state.game.riftOpeningSeen = true;
  saveGame();
  if (state.overworld) {
    state.overworld.riftCutsceneWasActive = state.overworld.active;
    state.overworld.active = false;
  }
  const overlay = document.createElement('div');
  overlay.id = 'rift-opening-cutscene';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;text-align:center;padding:28px;background:radial-gradient(circle at center,#51202c 0%,#160d19 45%,#030207 100%);color:#f8e9ec;overflow:hidden;';
  overlay.innerHTML = `<div style="max-width:760px;animation:riftAwaken 12s ease both"><div style="font-size:64px;filter:drop-shadow(0 0 22px #d43c61)">🌀</div><div style="letter-spacing:.28em;color:#e58b9a;font-size:12px;margin:18px 0">ПОСЛЕДНЯЯ ПЕЧАТЬ РАЗРУШЕНА</div><h1 style="font-size:clamp(32px,6vw,64px);margin:0 0 20px">Разлом открыт</h1><p style="font-size:18px;line-height:1.8;color:#e5d3d9">Кровавая Корона пал. Три осколка отозвались друг другу — и граница между мирами вспыхнула алым светом. То, что было заперто за гранью, теперь может быть услышано.</p><p style="color:#c77c8b;letter-spacing:.12em">МИР УЖЕ НЕ БУДЕТ ПРЕЖНИМ</p><button type="button" data-rift-continue style="margin-top:24px;padding:12px 28px;border:1px solid #c66b79;background:#301722;color:#fff;border-radius:8px">Продолжить</button></div><style>@keyframes riftAwaken{0%{opacity:0;transform:scale(.88);filter:blur(12px)}18%{opacity:1;transform:scale(1);filter:blur(0)}82%{opacity:1}100%{opacity:1}}</style>`;
  document.body.appendChild(overlay);
  let closed = false;
  const finish = () => {
    if (closed) return;
    closed = true;
    overlay.remove();
    if (state.overworld) {
      state.overworld.active = state.overworld.riftCutsceneWasActive !== false;
      delete state.overworld.riftCutsceneWasActive;
    }
    toast('🌀 Разлом открыт. На карте доступно 30 областей.');
  };
  overlay.querySelector('[data-rift-continue]')?.addEventListener('click',finish);
  setTimeout(finish,12000);
}

function openWorldPortalMenu() {
  let ow = state.overworld;
  if (!ow && state.game) {
    enterOverworld(state.game.location || 'village');
    ow = state.overworld;
  }
  if (!ow || ow.combat || ow.defeated) return;
  ow.active = false;
  const currentId = ow.sourceLocationId || ow.locationId;
  const destinations = Object.entries(LOCATIONS).filter(([id, loc]) =>
    id !== 'village' && id !== 'rift' && (loc.safe || (Array.isArray(loc.enemies) && loc.enemies.length))
  );
  const storyOrder = new Map(getStoryLocationProgression().map(item => [item.id, item]));
  destinations.sort(([a], [b]) =>
    (storyOrder.get(a)?.sequence ?? Number.MAX_SAFE_INTEGER) -
    (storyOrder.get(b)?.sequence ?? Number.MAX_SAFE_INTEGER)
  );
  if (isRiftReady() && LOCATIONS.rift) destinations.push(['rift', LOCATIONS.rift]);
  document.getElementById('aurora-world-portal')?.remove();

  const points = [['village', LOCATIONS.village], ...destinations].map(([id, loc], index) => {
    const story = storyOrder.get(id);
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    // Distribute all destination points around a fixed perimeter. Random
    // radial rings caused overlapping buttons, making some map points
    // impossible to click with a pointer on desktop and mobile.
    const angle = -Math.PI / 2 + (index - 1) * (Math.PI * 2 / Math.max(1, destinations.length));
    const x = id === 'village' ? 500 : 500 + Math.cos(angle) * 360;
    const y = id === 'village' ? 310 : 310 + Math.sin(angle) * 220;
    return { id, loc, story, x, y, index };
  });
  const storyPoints = points.filter(point => point.story)
    .sort((a, b) => a.story.sequence - b.story.sequence);
  const routePoints = [{ x: 500, y: 310 }, ...storyPoints];
  const route = routePoints.map(point => point.x.toFixed(1) + ',' + point.y.toFixed(1)).join(' ');
  const nodeMarkup = points.map(point => {
    const label = point.story ? '#' + point.story.sequence + ' · ' + point.loc.name : point.loc.name;
    return '<button type="button" class="portal-map-node' + (point.id === 'village' ? ' portal-map-village-node' : '') + '" data-portal-node="' + escapeHtml(point.id) +
      '" data-x="' + point.x.toFixed(1) + '" data-y="' + point.y.toFixed(1) +
      '" style="left:' + (point.x / 10) + '%;top:' + (point.y / 6.2) + '%" aria-pressed="false" aria-label="' +
      escapeHtml(label) + '"><span class="portal-map-node-icon">' + (point.loc.emoji || '✦') +
      '</span><span class="portal-map-node-label">' + escapeHtml(label) + '</span></button>';
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'aurora-world-portal';
  overlay.className = 'portal-atlas-overlay';
  overlay.innerHTML =
    '<style>' +
    '#aurora-world-portal{position:fixed;inset:0;z-index:10070;display:flex;align-items:center;justify-content:center;padding:clamp(8px,2vw,24px);background:radial-gradient(ellipse at 50% 18%,rgba(38,91,94,.48),rgba(3,7,14,.97) 76%);color:#f2eadb;font-family:inherit;}' +
    '#aurora-world-portal *{box-sizing:border-box}#aurora-world-portal .portal-atlas{width:min(1500px,100%);height:min(920px,96vh);min-height:540px;display:flex;flex-direction:column;overflow:hidden;border:1px solid #72b9b2;border-radius:18px;background:linear-gradient(145deg,#172a31,#0a111b 75%);box-shadow:0 0 65px rgba(69,190,182,.2)}' +
    '#aurora-world-portal .portal-atlas-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 22px;border-bottom:1px solid rgba(114,185,178,.22)}' +
    '#aurora-world-portal .portal-atlas-head small{color:#8bd7ce;letter-spacing:.2em;font-size:10px;font-weight:800}#aurora-world-portal h1{margin:5px 0 0;font-size:clamp(22px,3vw,34px)}' +
    '#aurora-world-portal .portal-close{border:1px solid #719b9b;border-radius:9px;background:#182a32;color:#e9ffff;padding:9px 13px;font:inherit;cursor:pointer}' +
    '#aurora-world-portal .portal-atlas-body{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:14px;min-height:0;flex:1;padding:14px}' +
    '#aurora-world-portal .portal-map-stage{position:relative;min-width:0;min-height:0;overflow:hidden;border:1px solid rgba(119,177,159,.35);border-radius:15px;background:radial-gradient(ellipse at 48% 48%,rgba(51,104,91,.5),transparent 52%),radial-gradient(ellipse at 18% 75%,rgba(31,76,85,.7),transparent 45%),linear-gradient(145deg,#142d36,#0b1722 68%,#182b30)}' +
    '#aurora-world-portal .portal-map-stage:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(176,207,181,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(176,207,181,.045) 1px,transparent 1px);background-size:42px 42px;pointer-events:none}' +
    '#aurora-world-portal .portal-map-art{position:absolute;inset:0;width:100%;height:100%;opacity:.9}#aurora-world-portal .portal-route{fill:none;stroke:#8ec9ae;stroke-width:3;stroke-dasharray:8 8;stroke-linecap:round;opacity:.52;vector-effect:non-scaling-stroke}' +
    '#aurora-world-portal .portal-map-island{fill:rgba(83,128,104,.17);stroke:rgba(147,190,151,.24);stroke-width:2;vector-effect:non-scaling-stroke}' +
    '#aurora-world-portal .portal-map-node{position:absolute;z-index:2;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;min-width:58px;max-width:130px;padding:5px 7px;border:1px solid rgba(125,191,177,.5);border-radius:12px;background:rgba(10,22,30,.9);color:#edf4e8;cursor:pointer;font:inherit;box-shadow:0 4px 14px rgba(0,0,0,.35);transition:transform .16s,border-color .16s,background .16s}' +
    '#aurora-world-portal .portal-map-node:hover,#aurora-world-portal .portal-map-node:focus-visible{z-index:4;transform:translate(-50%,-50%) scale(1.1);outline:2px solid #a8ded0;outline-offset:2px}' +
    '#aurora-world-portal .portal-map-node[aria-pressed="true"]{border:2px solid #e6c783;background:rgba(66,53,31,.96);box-shadow:0 0 0 4px rgba(230,199,131,.15),0 0 24px rgba(230,199,131,.28)}' +
    '#aurora-world-portal .portal-map-node.is-locked{filter:grayscale(.75);border-color:#815c66;background:rgba(36,24,34,.92)}#aurora-world-portal .portal-map-node.is-current{border-color:#e6c783}' +
    '#aurora-world-portal .portal-map-node-icon{font-size:clamp(17px,2vw,25px);line-height:1.2}#aurora-world-portal .portal-map-node-label{max-width:118px;font-size:9px;line-height:1.2;text-align:center;color:#d6e4dc;text-shadow:0 1px 3px #000;pointer-events:none;user-select:none}' +
    '#aurora-world-portal .portal-map-village-node{width:82px;min-width:82px;max-width:none;height:82px;border:2px solid #e6c783;border-radius:50%;background:radial-gradient(circle,#66512c,#201d1b 72%);box-shadow:0 0 0 8px rgba(230,199,131,.1),0 0 35px rgba(230,199,131,.35)}#aurora-world-portal .portal-map-village-node .portal-map-node-icon{font-size:31px}#aurora-world-portal .portal-map-village-node .portal-map-node-label{position:absolute;top:84px;max-width:150px;white-space:nowrap;color:#f3dba5;font-size:11px;font-weight:800}' +
    '#aurora-world-portal .portal-map-legend{position:absolute;left:12px;bottom:10px;display:flex;gap:12px;flex-wrap:wrap;color:#b7c9c1;font-size:10px;background:rgba(5,12,18,.72);padding:7px 10px;border-radius:8px}' +
    '#aurora-world-portal .portal-map-legend span{display:flex;align-items:center;gap:5px}#aurora-world-portal .portal-map-legend i{width:8px;height:8px;border-radius:50%;background:#8ec9ae}#aurora-world-portal .portal-map-legend .locked{background:#a87580}#aurora-world-portal .portal-map-legend .here{background:#e6c783}' +
    '#aurora-world-portal .portal-destination{min-width:0;overflow:auto;border:1px solid rgba(114,185,178,.25);border-radius:14px;background:rgba(5,13,20,.55);padding:18px;display:flex;flex-direction:column;gap:12px}' +
    '#aurora-world-portal .portal-destination-kicker{color:#8bd7ce;font-size:10px;font-weight:800;letter-spacing:.15em}#aurora-world-portal .portal-destination h2{font-size:22px;line-height:1.2;margin:0}#aurora-world-portal .portal-destination p{color:#b5c6c5;font-size:13px;line-height:1.6;margin:0}' +
    '#aurora-world-portal .portal-destination-meta{display:grid;gap:8px;padding:11px;border-radius:10px;background:rgba(111,164,149,.09);color:#c7d9cf;font-size:12px}#aurora-world-portal .portal-destination-status{font-size:12px;font-weight:800;line-height:1.5;color:#8bd7ce}#aurora-world-portal .portal-destination-status.locked{color:#e0a0a9}' +
    '#aurora-world-portal .portal-travel{margin-top:auto;padding:13px 16px;border:1px solid #b99b61;border-radius:10px;background:linear-gradient(135deg,#8d6b36,#584322);color:#fff5dd;font:inherit;font-weight:800;cursor:pointer}#aurora-world-portal .portal-travel:disabled{border-color:#596269;background:#29333a;color:#89969a;cursor:not-allowed}' +
    '#aurora-world-portal .portal-atlas-foot{padding:10px 18px;border-top:1px solid rgba(114,185,178,.18);color:#91aaa9;font-size:11px;text-align:center}' +
    '@media(max-width:850px){#aurora-world-portal .portal-atlas{height:96vh}#aurora-world-portal .portal-atlas-body{grid-template-columns:minmax(0,1fr) 260px}}' +
    '@media(max-width:650px){#aurora-world-portal .portal-atlas{height:96vh;min-height:0}#aurora-world-portal .portal-atlas-head{padding:12px 14px}#aurora-world-portal .portal-atlas-body{grid-template-columns:1fr;grid-template-rows:minmax(260px,1fr) auto;gap:9px;padding:9px}#aurora-world-portal .portal-map-stage{min-height:260px}#aurora-world-portal .portal-destination{max-height:205px;padding:12px;gap:7px}#aurora-world-portal .portal-destination h2{font-size:18px}#aurora-world-portal .portal-destination p{font-size:11px}#aurora-world-portal .portal-travel{padding:10px}#aurora-world-portal .portal-map-node{min-width:42px;padding:4px}#aurora-world-portal .portal-map-node-label{font-size:8px;max-width:82px}#aurora-world-portal .portal-map-village-node{width:58px;min-width:58px;height:58px}#aurora-world-portal .portal-map-village-node .portal-map-node-icon{font-size:24px}#aurora-world-portal .portal-map-village-node .portal-map-node-label{top:59px;font-size:9px}}' +
    '</style>' +
    '<section class="portal-atlas" role="dialog" aria-modal="true" aria-labelledby="aurora-world-portal-title">' +
      '<header class="portal-atlas-head"><div><small>АТЛАС МИРА · СЕТЬ ПЕРЕХОДОВ</small><h1 id="aurora-world-portal-title">Карта земель Авроры</h1></div><button type="button" class="portal-close" data-world-close aria-label="Закрыть карту">✕</button></header>' +
      '<div class="portal-atlas-body">' +
        '<div class="portal-map-stage" role="group" aria-label="Интерактивная карта мира">' +
          '<svg class="portal-map-art" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">' +
            '<path class="portal-map-island" d="M95 170 Q170 55 340 105 T610 90 Q810 55 915 210 T850 480 Q680 585 480 520 T150 505 Q45 390 95 170Z"/>' +
            '<path class="portal-map-island" d="M245 195 Q350 130 455 185 T650 190 Q760 250 680 390 T405 450 Q240 400 245 195Z" style="fill:rgba(25,55,65,.45)"/>' +
            '<polyline class="portal-route" points="' + route + '"/>' +
            '<circle cx="500" cy="310" r="104" fill="none" stroke="rgba(230,199,131,.16)" stroke-width="2" stroke-dasharray="5 12"/>' +
          '</svg>' +
          nodeMarkup +
          '<div class="portal-map-legend"><span><i></i>Доступно</span><span><i class="locked"></i>Закрыто</span><span><i class="here"></i>Вы здесь</span></div>' +
        '</div>' +
        '<aside class="portal-destination" id="portal-destination" aria-live="polite"></aside>' +
      '</div>' +
      '<footer class="portal-atlas-foot">Выберите точку на карте, чтобы изучить область и условия путешествия. Сюжетный маршрут отмечен пунктиром.</footer>' +
    '</section>';
  document.body.appendChild(overlay);

  const nodeButtons = [...overlay.querySelectorAll('[data-portal-node]')];
  const detail = overlay.querySelector('#portal-destination');
  let selectedId = currentId;
  const resume = () => {
    overlay.remove();
    if (state.overworld) {
      resumeOverworld();
      document.getElementById('screen-game')?.classList.add('overworld-active');
    }
  };
  const selectDestination = id => {
    const point = points.find(item => item.id === id);
    if (!point) return;
    selectedId = id;
    const access = canEnterStoryLocation(state.game?.player, id);
    const locked = !access.allowed;
    const here = id === currentId;
    nodeButtons.forEach(button => {
      const active = button.dataset.portalNode === id;
      const item = points.find(pointItem => pointItem.id === button.dataset.portalNode);
      const itemAccess = canEnterStoryLocation(state.game?.player, button.dataset.portalNode);
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-locked', !itemAccess.allowed);
      button.classList.toggle('is-current', button.dataset.portalNode === currentId);
      if (active) button.focus({ preventScroll: true });
    });
    const story = point.story;
    const status = here ? '● ВЫ ЗДЕСЬ' : locked
      ? access.reason === 'campaign'
        ? '🔒 Сначала завершите сюжетное задание ' + access.requiredMissionId
        : '🔒 Требуется уровень ' + (access.requirement?.requiredLevel || access.requirement?.recommendedLevel || 'выше')
      : '● МАРШРУТ ОТКРЫТ · МОЖНО ПУТЕШЕСТВОВАТЬ';
    const level = story
      ? '<div><b>Уровень доступа:</b> ' + story.requiredLevel + ' · <b>Рекомендуемый:</b> ' + story.recommendedLevel + '</div>'
      : '<div><b>Тип области:</b> свободное исследование</div>';
    const chapter = story
      ? '<div><b>Акт:</b> ' + story.actNumber + ' · <b>Позиция маршрута:</b> ' + story.sequence + '</div>'
      : '';
    detail.innerHTML =
      '<div class="portal-destination-kicker">' + (story ? 'ГЛАВА ' + story.actNumber + ' · ТОЧКА ' + story.sequence : 'ОБЛАСТЬ МИРА') + '</div>' +
      '<h2>' + escapeHtml(point.loc.emoji || '✦') + ' ' + escapeHtml(point.loc.name) + '</h2>' +
      '<p>' + escapeHtml(point.loc.desc || 'Неизведанная область') + '</p>' +
      '<div class="portal-destination-meta">' + level + chapter + '<div><b>Опасность:</b> ' +
        (point.loc.safe ? 'безопасная зона' : 'враждебная территория') + '</div></div>' +
      '<div class="portal-destination-status' + (locked ? ' locked' : '') + '" role="status">' + status + '</div>' +
      '<button type="button" class="portal-travel" data-portal-travel ' + (here || locked ? 'disabled' : '') + '>' +
        (here ? 'Вы уже здесь' : locked ? 'Путешествие закрыто' : 'Путешествовать →') + '</button>';
    const travelButton = detail.querySelector('[data-portal-travel]');
    travelButton?.addEventListener('click', () => {
      const latestAccess = canEnterStoryLocation(state.game?.player, id);
      if (!latestAccess.allowed) {
        selectDestination(id);
        toast(latestAccess.reason === 'campaign'
          ? '🔒 Сначала завершите сюжетное задание ' + latestAccess.requiredMissionId + '.'
          : '🔒 Для перехода требуется ' + latestAccess.requirement.requiredLevel + ' уровень.');
        return;
      }
      overlay.remove();
      exitOverworld();
      if (id === 'rift') { enterRift(); return; }
      state.game.location = id;
      saveGame();
      enterOverworld(id);
    });
  };
  nodeButtons.forEach(button => {
    const id = button.dataset.portalNode;
    const access = canEnterStoryLocation(state.game?.player, id);
    button.classList.toggle('is-locked', !access.allowed);
    button.classList.toggle('is-current', id === currentId);
    button.addEventListener('click', () => selectDestination(id));
  });
  overlay.querySelector('[data-world-close]')?.addEventListener('click', resume);
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); resume(); }
  });
  overlay.addEventListener('click', event => { if (event.target === overlay) resume(); });
  const initial = points.some(point => point.id === currentId) ? currentId : (points[0]?.id || 'village');
  selectDestination(initial);
}
function interactNpc(npcId) {
  if (!state.overworld) return;
  state.overworld.paused = true;

  if (npcId === 'world-portal' || npcId === 'world-waystone') { openWorldPortalMenu(); return; }
  if (npcId === 'tower-portal' || npcId === 'tower-gate') { exitOverworld(); openTowerMenu(); return; }
  if (npcId.startsWith('event-')) { handleWorldEvent(npcId); return; }

  if (npcId === 'blacksmith') { openBlacksmith(); addVillageInteriorButton('forge'); }
  else if (npcId === 'healer') { openHealer(); addVillageInteriorButton('healer'); }
  else if (npcId === 'alchemist') { openAlchemist(); addVillageInteriorButton('alchemy'); }
  else if (npcId === 'merchant') { openMerchant(); addVillageInteriorButton('market'); }
  else if (npcId === 'elder') { openElder(); addVillageInteriorButton('hall'); }
  else if (npcId === 'well') openWell();
  else if (npcId === 'bard') { openBard(); addVillageInteriorButton('tavern'); }
  else if (npcId === 'guard') openGuard();
  else if (npcId === 'cat') openCat();
  else if (npcId === 'kids') openKids();
  else if (npcId === 'herald') openHerald();
  else if (npcId === 'questBoard') openQuestBoard();
}

const VILLAGE_INTERIORS = {
  forge: { title: 'Кузница Борина', subtitle: 'Жар горна, запах угля и звон молота', room: 'Кузнечный горн', details: ['Наковальня у раскалённого очага', 'Стойка с клинками и щитами', 'Полки с инструментами'] },
  healer: { title: 'Лечебный дом Мирры', subtitle: 'Травяные настои и мягкий свет свечей', room: 'Лечебная комната', details: ['Кровать для раненых путников', 'Шкаф с лекарствами', 'Сушёные травы под потолком'] },
  alchemy: { title: 'Алхимическая мастерская', subtitle: 'Колбы тихо светятся в полумраке', room: 'Стол алхимика', details: ['Рабочий стол с колбами', 'Печь для настоев', 'Стеллажи с эссенциями'] },
  market: { title: 'Торговый дом', subtitle: 'Тёплый свет, тканевые тюки и редкие товары', room: 'Торговый зал', details: ['Прилавок с товарами', 'Весы и сундуки', 'Полки с припасами'] },
  hall: { title: 'Дом старейшины', subtitle: 'Карты старых земель и хроники трёх драконов', room: 'Зал совета', details: ['Большой стол с картой мира', 'Камин и кресла', 'Книжные полки'] },
  tavern: { title: 'Таверна «Тихий угол»', subtitle: 'Музыка, горячая похлёбка и разговоры путников', room: 'Общий зал', details: ['Столики у камина', 'Стойка хозяина', 'Уголок барда'] }
};

function addVillageInteriorButton(interiorId) {
  if (state.overworld?.locationId !== 'village') return;
  const content = document.getElementById('npc-dialog-content');
  if (!content || content.innerHTML.includes('data-village-interior')) return;
  content.innerHTML +=
    `<button data-village-interior onclick="GameAPI.enterVillageInterior('${interiorId}')" class="village-interior-enter">🚪 Войти внутрь</button>`;
}

function enterVillageInterior(interiorId) {
  const ow = state.overworld;
  const room = VILLAGE_INTERIORS[interiorId];
  if (!ow || ow.locationId !== 'village' || !room) return;
  ow.interior = interiorId;
  const content = document.getElementById('npc-dialog-content');
  const modal = document.getElementById('npc-dialog-modal');
  const decor = room.details.map((item, index) => `<div class="village-room-prop prop-${index + 1}"><span>${['⚒️','🛏️','⚗️','📦'][index] || '🪑'}</span><small>${item}</small></div>`).join('');
  content.innerHTML = `
    <div class="village-interior-view">
      <div class="village-interior-heading"><div><h3>${room.title}</h3><p>${room.subtitle}</p></div><span>🏠 АВРОРА</span></div>
      <div class="village-room-art room-${interiorId}">
        <div class="village-room-window"></div><div class="village-room-hearth"></div>
        <div class="village-room-furniture">${decor}</div>
        <div class="village-room-floor-mark">✦</div>
      </div>
      <p class="village-room-caption">${room.room} · Можно осмотреться, затем вернуться во двор.</p>
      <button onclick="GameAPI.exitVillageInterior()" class="village-interior-exit">← Выйти во двор</button>
    </div>`;
  if (modal) modal.style.display = 'flex';
}

function exitVillageInterior() {
  if (state.overworld) state.overworld.interior = null;
  const modal = document.getElementById('npc-dialog-modal');
  if (modal) modal.style.display = 'none';
}

function handleWorldEvent(eventId) {
  const ow = state.overworld;
  if (!ow) return;
  const ev = (ow.events || []).find(e => e.id === eventId);
  if (!ev) return;

  if (ev.resolved) return;
  let previousGame;
  try {
    previousGame = JSON.parse(JSON.stringify(state.game));
  } catch {
    toast('⚠️ Не удалось подготовить событие. Попробуйте ещё раз.');
    return;
  }
  ev.resolved = true;
  const p = state.game.player;
  if (!Array.isArray(p.effects)) p.effects = [];

  let logMsg = '';
  let toastMsg = '';
  let logClass = 'success';

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
    logMsg = `💎 Кристалл сырой магии: +8💰, +30 EXP`;
    toastMsg = `💎 +8💰, +30 EXP`;
  } else if (ev.eventType === 'traveler') {
    const items = ['health-potion', 'mana-potion', 'herb-life', 'herb-moon'];
    const itemId = items[Math.floor(Math.random() * items.length)];
    const reward = addItemOrStore(itemId, 1);
    logMsg = reward.stored
      ? `🧙 ${ITEMS[itemId].name} отправлено в хранилище добычи — в сумке нет места.`
      : `🧙 Странник дарит: ${ITEMS[itemId].name}`;
    toastMsg = reward.stored
      ? '🧙 Подарок сохранён в хранилище добычи.'
      : '🧙 Подарок странника!';
    if (reward.stored) logClass = 'warning';
  }

  ow.events = ow.events.filter(e => e.id !== eventId);
  if (!saveGame()) {
    state.game = previousGame;
    ow.player.hp = state.game.player.hp;
    const restoredEvent = ow.events.find(e => e.id === eventId);
    if (restoredEvent) restoredEvent.resolved = false;
    else ow.events.push({ ...ev, resolved: false });
    ow.paused = false;
    toast('⚠️ Награда не сохранена. Событие восстановлено — попробуйте снова.');
    import('./ui/overworld.js').then(m => m.closeDialogAndResume());
    return;
  }
  emit('log', { channel: 'game', msg: logMsg, cls: logClass });
  toast(toastMsg);
  ow.paused = false;

  import('./ui/overworld.js').then(m => m.closeDialogAndResume());
}

function skipPrologue() {
  stopVoice();
  localStorage.setItem('magic-rpg-prologue-seen', '1');
  showScreen('screen-main');
  updateMainMenu();
}

// ==== ОЗВУЧКА ПРОЛОГА: русская TTS-легенда ====
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
  const ok = speakVoice(text, { rate: 0.82, pitch: 0.78, volume: 1 });
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
  if (!screen || document.getElementById('prologue-voice-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'prologue-voice-btn';
  btn.type = 'button';
  btn.className = 'btn secondary';
  btn.textContent = '🔊 Прослушать легенду';
  btn.style.cssText = 'display:block; margin:14px auto 8px; padding:10px 18px;';
  const startButton = screen.querySelector('.center-flex > button');
  if (startButton) startButton.before(btn);
  else screen.appendChild(btn);

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    playTtsPrologue(screen, btn);
  });
}

window.GameAPI = {
  getRuntimeDiagnostics: () => runtimeDiagnostics.map(entry => ({ ...entry })),
  clearRuntimeDiagnostics: () => { runtimeDiagnostics.length = 0; },
  updateMainMenu,
  startNewGame,
  openSettings, switchSettingsTab, handleSettingsTabKey, applySettings, backFromSettings,
  resetAllSettings, deleteAllSaves,
  openAchievementsMenu, openHelp,
  saveAndMenu,
  loadSlot, newGameSlot, deleteSlot, renderSlots,
  selectClass, reviewClassSelection, cancelClassReview, confirmClassSelection,
  switchTab, useItemOutside,
  equipByIndex: equipItemByIndexUI, unequip: unequipItemUI,
  sellByIndex: sellItemByIndexUI,
  sellJunk: sellJunkUI,
  openShop, buy: buyItemUI, setShopPreset, buybackItem: buybackItemUI,
  openWorldPortalMenu,
  enterOverworld: () => enterOverworld(state.game?.location || 'village'),
  resumeOverworld,
  exitOverworld,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owPauseResume, owPauseSaveVillage, owPauseExit,
  showInvTooltip, showEqTooltip, hideTooltip,
  spendStat,
  setInvFilter, setInvSort,
  invSlotClick,
  claimPendingLoot: claimPendingLootUI,
  openSaleUI,
  toggleSaleItem,
  selectSaleTiers: selectSaleTiersUI,
  selectSaleFilter: selectSaleFilterUI,
  confirmSale: confirmSaleUI,
  cancelSale: cancelSaleUI,
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
  enterVillageInterior,
  exitVillageInterior,
  upgradeEquipment: upgradeEquipmentUI,
  healAtHealer: healAtHealerUI,
  craftRecipe: craftRecipeUI,
  reforgeItem: reforgeItemUI,
  showShopTooltip,
  equipBest: equipBestUI,
  socketRune: socketRuneUI,
  allocatePassive: allocatePassiveUI,
  resetPassives: resetPassivesUI,
  passiveTreePointerDown, passiveTreePointerMove, passiveTreePointerUp,
  passiveTreeZoom, passiveTreeResetView, passiveTreeKeyDown,
  startNGPlus,
  enterRift,
  openRiftMap,
  enterTower: openTowerMenu,
  chooseRiftEnding,
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
applyFontScale();

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

window.addEventListener('beforeunload', persistBeforeLeaving);