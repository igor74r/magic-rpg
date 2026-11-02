import { state } from './systems/state.js';
import { on, emit } from './systems/events.js';
import { saveGame, loadSettings, migrateLegacySave } from './systems/save.js';
import { addItemOrStore } from './systems/inventory.js';
import { ITEMS } from './data/items.js';
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
  setInvFilter, setInvSort, invSlotClick, claimPendingLootUI, openSaleUI, toggleSaleItem, selectSaleTiersUI, selectSaleFilterUI, confirmSaleUI, cancelSaleUI,
  openBlacksmith, openHealer, openAlchemist, backToVillage,
  openMerchant, openElder, openWell, closeNpcAndResumeUI,
  takeElderBlessingUI, useWellUI, acceptElderQuestUI, turnInElderQuestUI,
  openBard, openGuard, openCat, openKids, openHerald, openQuestBoard,
  payBardUI, petCatUI, claimQuestUI,
  upgradeEquipmentUI, healAtHealerUI, craftRecipeUI, reforgeItemUI, setShopPreset, buybackItemUI,
  showShopTooltip, equipBestUI, sellJunkUI, socketRuneUI,
  allocatePassiveUI, resetPassivesUI, passiveTreePointerDown, passiveTreePointerMove, passiveTreePointerUp
} from './ui/game.js';
import {
  initOverworld, owOpenSpells, owOpenItems, owOpenAbilities, owCloseSub,
  owAttack, owCast, owUseItem, owBlock, owUseAbility, owFlee,
  owPauseResume, owPauseSaveVillage, owPauseExit
} from './ui/overworld.js';
import { openDailyChest } from './ui/village.js';
import { exitOverworld, enterOverworld } from './systems/overworld.js';
import { isRiftReady, getRiftLocations } from './systems/rift.js';
import { getTowerBest, getTowerStartFloor, TOWER_MAX_FLOOR } from './systems/tower.js';
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
  const tab = event.target.closest?.('[role="tab"]');
  if (!tab) return;
  const tabs = Array.from(tab.parentElement?.querySelectorAll('[role="tab"]') || []);
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

function interactNpc(npcId) {
  if (!state.overworld) return;
  state.overworld.paused = true;

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

  saveGame();
  emit('log', { channel: 'game', msg: logMsg, cls: logClass });
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
  openShop, buy: buyItemUI, setShopPreset, buybackItem: buybackItemUI,
  enterOverworld: enterOverworldFromUI,
  mapSelect, mapTravel, mapEnter,
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