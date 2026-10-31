import { state } from '../systems/state.js';
import { on } from '../systems/events.js';
import { toast } from './screens.js';
import { renderInventory, setInvFilter as setLegacyInvFilter, setInvSort as setLegacyInvSort } from './inventory.js';
import { renderSpells } from './spells.js';
import { renderQuests, renderBestiary, renderStatistics } from './quests.js';
import { renderChronicles } from './chronicles.js';
import { CLASSES } from '../data/classes.js';
import { ITEMS, RARITIES, rollItemAffixes } from '../data/items.js';
import { NPCS } from '../data/npcs.js';
import { STORY } from '../data/story.js';
import { LOCATIONS } from '../data/locations.js';
import { RIFT_NODES } from '../data/rift-nodes.js';
import { getMissionProgress } from '../systems/campaign.js';
import { getEffStats } from '../systems/stats.js';
import { enterOverworld } from '../systems/overworld.js';
import { addItem, removeItem } from '../systems/inventory.js';
import { saveGame, saveSettings } from '../systems/save.js';
import { getItemTier, TIER_META, canDismantleItem, isQuestOrShard, canSellItem } from '../systems/item-tiers.js';
import { updateVolume } from '../systems/audio.js';

const TABS = [
  ['inventory','🎒','Инвентарь','I'],
  ['character','🧍','Персонаж','C'],
  ['craft','⚒️','Крафт','K'],
  ['bestiary','📖','Бестиарий','B'],
  ['journal','📜','Журнал','J'],
  ['world','🗺️','Карта мира','M'],
  ['rift','🌀','Карта Разлома',''],
  ['loot','◈','Лут-фильтр','L'],
  ['settings','⚙️','Настройки','']
];
let activeTab = 'inventory';
let inventoryMode = 'all';
let selectedInventoryIndex = -1;
let activeSettingsPanel = 'game';
let selectedRiftNode = RIFT_NODES[0]?.id || null;
let selectedAct = 0;
let activeCraftMode = 'dismantle';
let filterText = '';
let lootPreset = 'all';
let keyBound = false;
let pauseOpen = false;

const byId = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const totalKills = () => Object.values(state.game?.player?.stats?.kills || {}).reduce((s,n)=>s+(Number(n)||0),0);
const isRiftUnlocked = () => !!(state.game?.player?.riftUnlocked || state.game?.player?.dragonBossKills?.length >= 3);
const inventoryWeight = () => (state.game?.player?.inventory || []).reduce((s,i)=>s+(ITEMS[i.id]?.weight||1)*(i.qty||1),0);
const weightLimit = () => 40 + (state.game?.player?.str || 0) * 2;

export function openRpgWindow(tab='inventory') {
  if (!state.game) return toast('Сначала начните новую игру');
  if (tab === 'rift' && !isRiftUnlocked()) return toast('Разлом откроется после победы над тремя драконами');
  activeTab = TABS.some(t=>t[0]===tab) ? tab : 'inventory';
  filterText = '';
  closePause();
  const layer = byId('rpg-interface-overlay');
  if (layer) layer.hidden = false;
  renderRpgWindow();
}
export function closeRpgWindow() {
  const layer = byId('rpg-interface-overlay');
  if (layer) layer.hidden = true;
  filterText = '';
}
export function rpgTab(tab) {
  if (tab === 'rift' && !isRiftUnlocked()) return toast('Сначала победите трёх драконов');
  activeTab = tab;
  filterText = '';
  renderRpgWindow();
}
export function rpgInventoryMode(mode) {
  inventoryMode=['all','material','quest','shards'].includes(mode)?mode:'all';
  setLegacyInvFilter(inventoryMode==='shards'?'quest':inventoryMode);
  renderRpgWindow();
}
export function rpgInventoryClick(index) {
  selectedInventoryIndex=Number(index);
  window.GameAPI?.invSlotClick?.(selectedInventoryIndex);
  renderRpgWindow();
}
export function rpgAutoEquip() { window.GameAPI?.equipBest?.(); renderRpgWindow(); }
export function rpgSortInventory(mode) { setLegacyInvSort(mode); renderRpgWindow(); }
export function rpgLockSelected() {
  if(selectedInventoryIndex<0) return toast('Сначала выберите предмет в сумке.');
  toggleItemLock(selectedInventoryIndex);
}
export function rpgSearch(value) {
  filterText = String(value || '').toLowerCase();
  const body = byId('rpg-window-body');
  if (!body) return;
  body.querySelectorAll('.rift-craft-item,.rift-recipe,.rift-mission,.rift-node,.bestiary-entry,.campaign-mission,.achievement').forEach(item => {
    item.hidden = !!filterText && !item.textContent.toLowerCase().includes(filterText);
  });
}
function activeFilterCount() {
  const f = state.settings.lootFilter || {};
  return Object.values(f).filter(v => v !== false && v !== null && v !== '' && v !== 'all' && v !== 0).length;
}
function windowTopbar() {
  const item = TABS.find(t=>t[0]===activeTab) || TABS[0];
  return `<header class="rift-window-topbar">
    <div class="rift-window-title"><span>${item[1]}</span><div><b>${item[2]}</b><small>SHARDS OF THE RIFT · ${esc(state.game?.player?.name||'Герой')}</small></div></div>
    <label class="rift-search"><span>⌕</span><input id="rpg-window-search" type="search" value="${esc(filterText)}" placeholder="Поиск по текущей вкладке…" oninput="GameAPI.rpgSearch(this.value)"></label>
    <button class="rift-filter-indicator" onclick="GameAPI.rpgTab('loot')" title="Общий лут-фильтр">⏷ <b>${activeFilterCount()}</b></button>
    <span class="rift-esc-hint">ESC — закрыть</span>
    <button class="rift-window-x" onclick="GameAPI.closeRpgWindow()" aria-label="Закрыть">×</button>
  </header>`;
}
function windowTabs() {
  return `<nav class="rift-window-tabs">${TABS.map(([id,icon,label,key])=>`<button class="${activeTab===id?'active':''} ${id==='rift'&&!isRiftUnlocked()?'locked':''}" onclick="GameAPI.rpgTab('${id}')" ${id==='rift'&&!isRiftUnlocked()?'disabled':''}><span>${icon}</span><b>${label}</b>${key?`<kbd>${key}</kbd>`:''}</button>`).join('')}</nav>`;
}
function windowFooter() {
  return `<footer class="rift-window-footer"><span>ЛКМ — выбрать</span><span>ПКМ — действия</span><span>Alt — подробности</span><span>Shift — сравнение</span><span>ESC — закрыть окно</span></footer>`;
}
export function renderRpgWindow() {
  const root = byId('rpg-window-content');
  if (!root || !state.game) return;
  const pages = {
    inventory: renderInventoryV2,
    character: renderCharacter,
    craft: renderCraft,
    bestiary: () => renderBestiary(),
    journal: renderJournal,
    world: renderWorldMap,
    rift: renderRiftMap,
    loot: renderLootFilter,
    settings: renderSettings
  };
  root.innerHTML = windowTopbar() + windowTabs() + `<main class="rift-window-body" id="rpg-window-body">${(pages[activeTab] || renderInventoryV2)()}</main>` + windowFooter();
  if (filterText) rpgSearch(filterText);
}

/* Equipment, bag, materials, quest items and shards share the existing item engine. */
function renderInventoryV2() {
  const p = state.game.player;
  const shards = [
    ['shard-forest','🌿','Осколок Корневого сердца','forest'],
    ['shard-ruins','🔷','Осколок Последней памяти','ruins'],
    ['shard-shadow','💜','Осколок Сумеречного узла','shadow']
  ];
  const found = shards.filter(([id,, , key]) => p.inventory?.some(x=>x.id===id) || state.game.shards?.[key]).length;
  return `<div class="rift-inventory-head"><span>Снаряжение и добыча</span><div><b>${p.inventory?.length||0}/30</b> ячеек · <b>${inventoryWeight()}/${weightLimit()}</b> веса · <b>${p.gold||0} золота</b></div></div>
    <div class="rift-inventory-subtabs">
      <button class="${inventoryMode==='all'?'active':''}" onclick="GameAPI.rpgInventoryMode('all')">Экипировка / сумка</button>
      <button class="${inventoryMode==='material'?'active':''}" onclick="GameAPI.rpgInventoryMode('material')">Материалы</button>
      <button class="${inventoryMode==='quest'?'active':''}" onclick="GameAPI.rpgInventoryMode('quest')">Квестовые</button>
      <button class="${inventoryMode==='shards'?'active':''}" onclick="GameAPI.rpgInventoryMode('shards')">Осколки Разлома (${found}/3)</button>
    </div>
    ${inventoryMode==='shards'?'<div class="rift-shards-large">'+shards.map(([id,icon,name,key])=>{const own=p.inventory?.some(x=>x.id===id)||!!state.game.shards?.[key];return '<article class="rift-shard-entry '+(own?'found':'')+'"><span>'+icon+'</span><div><b>'+name+'</b><small>'+(own?'Найден · заблокирован от продажи и разбора':'Не найден')+'</small></div></article>';}).join('')+'</div>':`<section class="rift-inventory-original">${(()=>{setLegacyInvFilter(inventoryMode);return renderInventory();})()}</section>`}
    <section class="rift-shards-row">${shards.map(([id,icon,name,key])=>{const own=p.inventory?.some(x=>x.id===id)||!!state.game.shards?.[key];return `<div class="rift-shard-slot ${own?'found':''}"><span>${icon}</span><b>${name}</b><small>${own?'Собран · защищён от продажи и разбора':'Не найден'}</small></div>`}).join('')}</section>
    <div class="rift-inventory-actions"><button onclick="GameAPI.rpgAutoEquip()">⚡ Экипировать лучшее</button><button onclick="GameAPI.rpgSortInventory('rarity')">Сортировать по тиру</button><button onclick="GameAPI.rpgLockSelected()">Закрепить / снять защиту</button><small>Квестовые предметы и осколки нельзя выбросить, продать или разобрать.</small></div>`;
}

function renderCharacter() {
  const p = state.game.player, stats = getEffStats(), cls = CLASSES[p.class];
  const slots = Object.entries({head:'Шлем',chest:'Нагрудник',hands:'Перчатки',legs:'Поножи',weapon:'Оружие',back:'Плащ',ring1:'Кольцо I',ring2:'Кольцо II',amulet:'Амулет',seal:'Печать',shoulders:'Наплечники'}).map(([slot,label])=>{
    const raw=p.equipped?.[slot], item=raw?ITEMS[typeof raw==='string'?raw:raw.id]:null;
    const tier=raw?getItemTier(raw):0;
    return `<div class="rift-paper-slot ${raw?'filled':''}" style="--tier-color:${TIER_META[tier]?.color||'#716957'}"><small>${label}</small><b>${item?.icon||'◇'} ${esc(item?.name||'Пусто')}</b></div>`;
  }).join('');
  const values=[['Сила','str'],['Ловкость','dex'],['Интеллект','int'],['Живучесть','con'],['Удача','luck'],['Мудрость','wis']];
  return `<div class="rift-character-layout">
    <section class="rift-paperdoll"><div class="rift-paperdoll-hero"><span>${cls?.emoji||'✦'}</span><b>${esc(p.name)}</b><small>${cls?.name||''} · Уровень ${p.level}/100</small></div><div class="rift-paper-slots">${slots}</div><div class="rift-shard-status"><b>Осколки</b><span>${Object.values(state.game.shards||{}).filter(Boolean).length}/3</span><small>${isRiftUnlocked()?'Разлом открыт':'Разлом запечатан'}</small></div></section>
    <section class="rift-character-stats"><h3>Шесть характеристик</h3><div class="rift-stat-grid">${values.map(([name,key])=>`<button onclick="GameAPI.showStatFormula('${key}')"><span>${name}</span><b>${p[key]||0}</b></button>`).join('')}</div><h3>Производные параметры</h3><div class="rift-stat-grid">
      <button onclick="GameAPI.showStatFormula('hp')"><span>Здоровье</span><b>${p.hp}/${p.maxHp}</b></button><button onclick="GameAPI.showStatFormula('mana')"><span>Ресурс</span><b>${p.mp}/${p.maxMp}</b></button>
      <button onclick="GameAPI.showStatFormula('atk')"><span>Атака</span><b>${stats.atk}</b></button><button onclick="GameAPI.showStatFormula('mag')"><span>Магия</span><b>${stats.mag}</b></button>
      <button onclick="GameAPI.showStatFormula('def')"><span>Защита</span><b>${stats.def}</b></button><button onclick="GameAPI.showStatFormula('crit')"><span>Крит</span><b>${Math.round(stats.critChance*100)}%</b></button>
      <button onclick="GameAPI.showStatFormula('dodge')"><span>Уклонение</span><b>${Math.round(stats.dodgeChance*100)}%</b></button><button onclick="GameAPI.showStatFormula('weight')"><span>Вес / лимит</span><b>${inventoryWeight()}/${weightLimit()}</b></button>
    </div><div id="rift-stat-formula" class="rift-formula-hint">Нажмите на любой показатель, чтобы увидеть формулу.</div></section>
    <aside class="rift-character-side"><h3>Репутации</h3><p>Серые Плащи <b>${p.reputation?.greyCloaks||0}</b></p><p>Культ Дракона <b>${p.reputation?.dragonCult||0}</b></p><h3>Эффекты</h3>${(p.effects||[]).length?(p.effects||[]).map(f=>`<p>${esc(f.id)} · ${f.duration}</p>`).join(''):'<small>Нет активных эффектов</small>'}</aside>
  </div>`;
}

function renderCraft() {
  const p=state.game.player;
  const modes=[['dismantle','Разбор'],['create','Создание'],['upgrade','Улучшение'],['reforge','Перековка']];
  let body='';
  if(activeCraftMode==='dismantle') {
    const list=(p.inventory||[]).map((inst,index)=>({inst,index,item:ITEMS[inst.id]})).filter(x=>x.item&&canDismantleItem(x.inst));
    body=`<div class="rift-craft-columns"><section><h3>Предметы для разбора</h3>${list.map(({inst,index,item})=>`<button class="rift-craft-item" style="--tier-color:${TIER_META[getItemTier(inst)].color}" onclick="GameAPI.dismantleItem(${index})"><span>${item.icon}</span><b>${esc(item.name)}</b><small>${TIER_META[getItemTier(inst)].id} · ${RARITIES[inst.rarity]?.name||'Обычный'}</small><em>Разобрать</em></button>`).join('')||'<p>Нет доступных предметов для разбора.</p>'}</section><aside><h3>Материалы за разбор</h3><p>T1–T2 → обычные материалы</p><p>T3–T4 → редкие эссенции</p><p>T5 → призма Разлома</p><p class="rift-warning">Закреплённые предметы, квестовые вещи, T6 и осколки защищены.</p><button onclick="GameAPI.dismantleLowTiers()">Разобрать всё T1–T2</button></aside></div>`;
  } else if(activeCraftMode==='create') {
    const recipes=NPCS.alchemist.recipes||[];
    body=`<div class="rift-craft-columns"><section><h3>Рецепты</h3>${recipes.map(r=>`<article class="rift-recipe"><b>${ITEMS[r.result]?.icon||'✦'} ${esc(ITEMS[r.result]?.name||r.result)}</b><small>${r.ingredients.map(i=>(ITEMS[i.id]?.name||i.id)+' ×'+i.qty).join(' · ')}</small><button onclick="GameAPI.craftRecipe('${r.id}')">Создать ×${r.qty}</button></article>`).join('')}</section><aside><h3>Создание снаряжения</h3><p>Результат зависит от тира рецепта и Удачи.</p><p>Ограничение: не более одного предмета T4+ за акт.</p><p class="rift-warning">Недостаток ингредиентов не списывает остальные ресурсы.</p></aside></div>`;
  } else if(activeCraftMode==='upgrade') {
    body=`<div class="rift-craft-columns"><section><h3>Улучшение экипировки</h3>${Object.entries(p.equipped||{}).filter(([,v])=>v).map(([slot,v])=>{const inst=typeof v==='string'?{id:v}:v,item=ITEMS[inst.id];return `<article class="rift-recipe"><b>${item?.icon||'◇'} ${esc(item?.name||inst.id)} +${inst.forgeLevel||0}</b><small>Базовые характеристики +5% за улучшение</small><button onclick="GameAPI.upgradeEquipment('${slot}')">Улучшить</button></article>`}).join('')}</section><aside><h3>Условия</h3><p>Сохраняются существующие модификаторы.</p><p>T5 → T6 запрещено.</p><p>Требуются материалы текущего и следующего тира, золото и один игровой день.</p></aside></div>`;
  } else {
    const list=p.inventory.map((inst,index)=>({inst,index,item:ITEMS[inst.id]})).filter(x=>x.item&&!isQuestOrShard(x.inst)&&!x.inst.locked&&getItemTier(x.inst)<6);
    body=`<div class="rift-craft-columns"><section><h3>Перековка модификаторов</h3>${list.map(({inst,index,item})=>`<article class="rift-recipe"><b>${item.icon} ${esc(item.name)}</b><small>${(inst.affixes||[]).map(a=>esc(a.name)).join(' · ')||'Без модификаторов'} · ${TIER_META[getItemTier(inst)].id}</small><button onclick="GameAPI.reforgeItem(${index})">Перековать</button></article>`).join('')}</section><aside><h3>Правила перековки</h3><p>Требуются 1–2 призмы Разлома и золото.</p><p>Удача повышает вероятность получить сильный модификатор.</p><p class="rift-warning">T6, осколки и закреплённые вещи перековать нельзя.</p></aside></div>`;
  }
  return `<div class="rift-craft-head"><b>Ремесло Разлома</b><span>Кузница и алхимическая лавка физически находятся в Акте 1.</span></div><div class="rift-craft-modes">${modes.map(([id,label])=>`<button class="${activeCraftMode===id?'active':''}" onclick="GameAPI.craftMode('${id}')">${label}</button>`).join('')}</div>${body}`;
}

function renderJournal() {
  const acts=STORY.acts.map((act,index)=>`<button class="${selectedAct===index?'active':''}" onclick="GameAPI.selectAct(${index})">Акт ${index+1}</button>`).join('');
  const act=STORY.acts[selectedAct]||STORY.acts[0];
  let completed=0;
  for(const item of STORY.acts) for(const mission of item.missions) if(state.game.player.campaignClaimed?.[mission.id]) completed++;
  return `<div class="rift-journal-head"><h2>Хроника Пяти Актов</h2><b>${completed}/25</b></div><div class="rift-act-tabs">${acts}</div><section class="rift-journal-act"><h3>${act.title}</h3><p>${act.intro}</p>${act.missions.map((mission,index)=>{const progress=getMissionProgress(state.game.player,mission);const status=progress.claimed?'Выполнено':progress.active?'Активно':progress.kills>0?'Повторно — 25% опыта':'Не выполнено';return `<article class="rift-mission ${progress.claimed?'done':progress.active?'active':''}"><span>${index+1}</span><div><b>${esc(mission.title)}</b><small>${esc(mission.desc)}</small><p>${status} · ${progress.current}/${progress.required} · награда ${mission.exp||'опыт'}</p></div></article>`}).join('')}</section><section class="rift-milestones"><h3>Сюжетные вехи</h3><p>Пробуждение у края Разлома</p><p>Убийства трёх драконов: ${(state.game.player.dragonBossKills||[]).length}/3</p><p>Открытие Разлома: ${isRiftUnlocked()?'Да':'Нет'}</p></section>`;
}

function renderWorldMap() {
  return `<div class="rift-world-map"><header><h2>Карта Пяти Актов</h2><p>Текущий путь отмечен золотом. Закрытые земли откроются по мере прохождения кампании.</p></header><div class="rift-act-map-grid">${STORY.acts.map((act,index)=>{const unlocked=index===0||STORY.acts.slice(0,index).every(a=>a.missions.every(m=>state.game.player.campaignClaimed?.[m.id]));const count=act.missions.filter(m=>state.game.player.campaignClaimed?.[m.id]).length;return `<article class="rift-act-map-card ${unlocked?'':'locked'}"><div class="rift-act-map-number">0${index+1}</div><h3>${esc(act.title)}</h3><p>${esc(act.subtitle||act.intro)}</p><b>${count}/5 заданий</b><button ${unlocked?'':'disabled'} onclick="GameAPI.selectAct(${index});GameAPI.rpgTab('journal')">${unlocked?'Открыть акт':'🔒 Требуется предыдущий акт'}</button><div class="rift-act-location-list">${act.missions.map(m=>`<span>${LOCATIONS[m.locationId||act.locationId]?.emoji||'✦'} ${esc(LOCATIONS[m.locationId||act.locationId]?.name||act.locationId)}</span>`).join('')}</div></article>`}).join('')}</div>${isRiftUnlocked()?`<button class="rift-open-map" onclick="GameAPI.rpgTab('rift')">🌀 Открыть карту Разлома</button>`:''}</div>`;
}

function riftStats() {
  const p=state.game.player,completed=Object.values(p.riftNodesCompleted||{}).filter(Boolean).length,cleared=Object.values(p.riftNodesCleared||{}).filter(Boolean).length,deaths=p.riftDeaths||0,kills=p.riftKills||0;
  return {completed,cleared,kills,deaths,kd:deaths?(kills/deaths).toFixed(2):kills.toFixed(2)};
}
function renderRiftMap() {
  const p=state.game.player,s=riftStats(),node=RIFT_NODES.find(n=>n.id===selectedRiftNode)||RIFT_NODES[0];
  return `<div class="rift-map-head"><div><span class="rift-map-kicker">ПОСТФИНАЛЬНЫЙ КОНТЕНТ</span><h2>Грани Разлома</h2><p>30 самостоятельных миров с разными биомами, архитектурой, погодой и противниками.</p></div><div class="rift-map-stats"><span>Всего убийств <b>${totalKills()}</b></span><span>Убийства Разлома <b>${s.kills}</b></span><span>Смерти <b>${p.stats?.deaths||0} / ${s.deaths}</b></span><span>K/D <b>${s.kd}</b></span><span>Пройдены <b>${s.completed}/30</b></span><span>Зачищены <b>${s.cleared}/30</b></span><span>Осколки <b>${Object.values(state.game.shards||{}).filter(Boolean).length}/3</b></span><span>Кристалл <b>${Object.values(state.game.shards||{}).every(Boolean)?'Собран':'Не собран'}</b></span></div></div>
    <div class="rift-node-map"><div class="rift-node-grid">${RIFT_NODES.map(n=>{const locked=p.level<(n.minLevel||1),done=!!p.riftNodesCompleted?.[n.id],clear=!!p.riftNodesCleared?.[n.id];return `<button class="rift-node ${selectedRiftNode===n.id?'selected':''} ${locked?'locked':''} ${clear?'cleared':done?'done':''}" style="--node-accent:${n.accent}" ${locked?'disabled':''} onclick="GameAPI.selectRiftNode('${n.id}')"><i>${String(n.number).padStart(2,'0')}</i><b>${esc(n.name)}</b><small>${locked?'Уровень '+n.minLevel:clear?'Зачищена':done?'Пройдена':'Не пройдена'}</small></button>`}).join('')}</div><aside class="rift-node-preview" style="--node-accent:${node.accent}"><span class="rift-map-kicker">ГРАНЬ ${node.number}/30</span><h3>${esc(node.name)}</h3><p>${esc(node.description)}</p><p>Биом: ${esc(node.baseTheme)} · Погода: ${esc(node.weather)}</p><p>Противники: ${node.enemies.map(esc).join(', ')}</p><p>Награда: ${node.rewardTier}</p><p>Требуемый уровень: ${node.minLevel}</p><button ${(p.level<node.minLevel)?'disabled':''} onclick="GameAPI.enterRiftNode('${node.id}')">Войти в грань</button></aside></div>`;
}

function renderLootFilter() {
  const f=state.settings.lootFilter||{},presets=[['all','Всё'],['cheap','Дешёвое'],['build','Под билд'],['craft','Материалы'],['rare','Редкое']];
  return `<div class="rift-loot-filter"><header><h2>Общий лут-фильтр</h2><span>${Object.values(f).filter(v=>v!==false&&v!==null&&v!==''&&v!=='all').length} активных условий</span></header>
    <div class="rift-filter-presets">${presets.map(([id,label])=>`<button class="${lootPreset===id?'active':''}" onclick="GameAPI.lootPreset('${id}')">${label}</button>`).join('')}</div>
    <div class="rift-filter-grid"><label>Минимальный тир<select onchange="GameAPI.setLootFilter('minTier',Number(this.value))">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${Number(f.minTier||1)===n?'selected':''}>T${n}</option>`).join('')}</select></label>
    <label>Категория<select onchange="GameAPI.setLootFilter('category',this.value)">${[['all','Все'],['weapon','Оружие'],['armor','Броня'],['accessory','Аксессуары'],['consumable','Расходники'],['material','Материалы'],['quest','Квестовые']].map(([v,l])=>`<option value="${v}" ${(f.category||'all')===v?'selected':''}>${l}</option>`).join('')}</select></label>
    <label>Цена от<input type="number" min="0" value="${f.priceMin||0}" onchange="GameAPI.setLootFilter('priceMin',Number(this.value))"></label><label>Цена до<input type="number" min="0" value="${f.priceMax||0}" onchange="GameAPI.setLootFilter('priceMax',Number(this.value))"></label></div>
    <div class="rift-filter-checks"><label><input type="checkbox" ${f.modifiers?'checked':''} onchange="GameAPI.setLootFilter('modifiers',this.checked)"> С модификаторами</label><label><input type="checkbox" ${f.upgradable?'checked':''} onchange="GameAPI.setLootFilter('upgradable',this.checked)"> Улучшаемые</label><label><input type="checkbox" ${f.locked?'checked':''} onchange="GameAPI.setLootFilter('locked',this.checked)"> Закреплённые</label><label><input type="checkbox" ${f.dismantle?'checked':''} onchange="GameAPI.setLootFilter('dismantle',this.checked)"> Разбираемые</label></div>
    <p class="rift-warning">Квестовые предметы и осколки никогда не скрываются полностью — только приглушаются.</p><button onclick="GameAPI.resetLootFilter()">Сбросить фильтр</button></div>`;
}
function renderSettings() {
  const s=state.settings;
  const groups={
    game:[['Сложность','difficulty',[['easy','Лёгкая'],['normal','Обычная'],['hard','Сложная']]],['Автопродажа T1–T2','autoSellLowTier',[[false,'Выключена'],[true,'Включена']]],['Подтверждение опасных действий','confirmDangerous',[[true,'Включено'],[false,'Выключено']]]],
    video:[['Яркость','brightness',60,140],['Лимит FPS','fpsLimit',30,144],['Уменьшить эффекты','reducedMotion',[[false,'Полные'],[true,'Уменьшенные']]]],
    sound:[['Музыка','musicVolume',0,100],['Звуковые эффекты','sfxVolume',0,100]],
    controls:[['Подсказки клавиш','showHotkeys',[[true,'Включены'],[false,'Выключены']]],['Подтверждение опасных действий','confirmDangerous',[[true,'Включено'],[false,'Выключено']]]],
    ui:[['Масштаб HUD','hudScale',75,130],['Позиция HUD','hudPin',[['auto','Авто'],['top','Сверху'],['bottom','Снизу']]],['Размер текста','fontScale',[[1,'Обычный'],[1.1,'Крупнее'],[1.2,'Крупный']]]],
    accessibility:[['Высокий контраст','highContrast',[[false,'Обычный'],[true,'Высокий']]],['Уменьшение анимации','reducedMotion',[[false,'Полные'],[true,'Уменьшенные']]],['Размер текста','fontScale',[[1,'Обычный'],[1.1,'Крупнее'],[1.2,'Крупный']]]]
  };
  const range=(label,key,min,max)=>`<label class="rift-setting-row"><span>${label}</span><input type="range" min="${min}" max="${max}" value="${s[key]??50}" oninput="GameAPI.updateRiftSetting('${key}',Number(this.value))"><b>${s[key]??50}</b></label>`;
  const select=(label,key,options)=>`<label class="rift-setting-row"><span>${label}</span><select onchange="GameAPI.updateRiftSetting('${key}',this.value==='true'?true:this.value==='false'?false:(this.value!==''&&Number.isFinite(Number(this.value))?Number(this.value):this.value))">${options.map(([v,n])=>`<option value="${v}" ${String(s[key]??options[0][0])===String(v)?'selected':''}>${n}</option>`).join('')}</select></label>`;
  const tabs=[['game','Игра'],['video','Видео'],['sound','Звук'],['controls','Управление'],['ui','UI / HUD'],['accessibility','Доступность']];
  const controls=(groups[activeSettingsPanel]||groups.game).map(([label,key,min,max])=>Array.isArray(min)?select(label,key,min):range(label,key,min,max)).join('');
  return `<div class="rift-settings"><h2>Настройки</h2><div class="rift-settings-tabs">${tabs.map(([id,label])=>`<button class="${activeSettingsPanel===id?'active':''}" onclick="GameAPI.setRiftSettingsPanel('${id}')">${label}</button>`).join('')}</div><div class="rift-settings-grid">${controls}</div><p class="rift-warning">Изменения сохраняются автоматически. Голосовая озвучка персонажей удалена; музыка и боевые эффекты сохранены.</p></div>`;
}

export function setRiftSettingsPanel(panel) { activeSettingsPanel=['game','video','sound','controls','ui','accessibility'].includes(panel)?panel:'game';renderRpgWindow(); }
export function selectAct(index) { selectedAct=Math.max(0,Math.min(STORY.acts.length-1,index));renderRpgWindow(); }
export function craftMode(mode) { activeCraftMode=mode;renderRpgWindow(); }
export function selectRiftNode(id) { selectedRiftNode=id;renderRpgWindow(); }

export function enterRiftNode(id) {
  const node=RIFT_NODES.find(n=>n.id===id);
  if(!node)return;
  if(!isRiftUnlocked())return toast('Разлом ещё запечатан');
  if(state.game.player.level<(node.minLevel||1))return toast('Нужен '+node.minLevel+' уровень');
  state.game.location=id;
  closeRpgWindow();saveGame();
  enterOverworld(id,{riftNodeId:id,rifMode:true,rifFloor:1});
}
export function showStatFormula(key) {
  const p=state.game.player,s=getEffStats();
  const formulas={
    weight:'Переносимый вес = 40 + Сила × 2 ('+inventoryWeight()+'/'+weightLimit()+').',
    str:'Сила '+p.str+': усиливает физическую атаку и переносимый вес.',
    dex:'Ловкость '+p.dex+': влияет на уклонение и критический шанс.',
    int:'Интеллект '+p.int+': усиливает магический урон.',
    wis:'Мудрость '+p.wis+': поддерживает ресурс и эффективность магии.',
    con:'Живучесть '+p.con+': даёт здоровье и базовую защиту.',
    luck:'Удача '+p.luck+': влияет на качество добычи, цены и перековку.',
    weight:'Переносимый вес: '+inventoryWeight()+' / '+weightLimit()+'. Сила увеличивает лимит.',
    hp:'Здоровье = базовый запас класса + бонус Живучести + экипировка.',
    mana:'Ресурс зависит от архетипа, Мудрости и экипировки.',
    atk:'Атака = Сила + бонус оружия + временные эффекты ('+s.atk+').',
    mag:'Магия = Интеллект + бонусы экипировки ('+s.mag+').',
    def:'Защита = floor(Живучесть / 2) + бонусы брони ('+s.def+').',
    crit:'Критический шанс = класс + Ловкость × 0.1% + бонусы ('+Math.round(s.critChance*100)+'%).',
    dodge:'Уклонение = класс + Ловкость × 0.2% + бонусы ('+Math.round(s.dodgeChance*100)+'%).',
    weight:'Переносимый вес = 40 + Сила × 2 ('+inventoryWeight()+'/'+weightLimit()+').'
  };
  const box=byId('rift-stat-formula');if(box)box.textContent=formulas[key]||'Параметр рассчитывается системой персонажа.';
}
export function hotbarAction(index) {
  const p=state.game?.player;if(!p)return;
  const spells=p.spells||[],abilities=(CLASSES[p.class]?.abilities||[]).filter(a=>!a.passive);
  const slots=[{type:'attack'},{type:'spell',id:spells[0]},{type:'spell',id:spells[1]},{type:'ability',id:abilities[0]?.id},{type:'ability',id:abilities[1]?.id},{type:'ability',id:abilities[2]?.id},{type:'potion',id:'health-potion'},{type:'potion',id:'mana-potion'}];
  const slot=slots[index];if(!slot)return;
  if(slot.type==='attack')window.GameAPI?.owAttack?.();
  else if(slot.type==='spell'&&slot.id)window.GameAPI?.owCast?.(slot.id);
  else if(slot.type==='ability'&&slot.id)window.GameAPI?.owUseAbility?.(slot.id);
  else if(slot.type==='potion')window.GameAPI?.owUseItem?.(slot.id);
}
export function renderHotbar() {
  const root=byId('rpg-hotbar');if(!root||!state.game?.player)return;
  const p=state.game.player,spells=p.spells||[],abilities=(CLASSES[p.class]?.abilities||[]).filter(a=>!a.passive);
  const slots=[
    {type:'attack',icon:'⚔️',name:'Атака'},
    {type:'spell',id:spells[0],icon:'✨',name:ITEMS[spells[0]]?.name||'Заклинание'},
    {type:'spell',id:spells[1],icon:'❄️',name:ITEMS[spells[1]]?.name||'Заклинание'},
    {type:'ability',id:abilities[0]?.id,icon:abilities[0]?.icon||'✦',name:abilities[0]?.name||'Умение'},
    {type:'ability',id:abilities[1]?.id,icon:abilities[1]?.icon||'✦',name:abilities[1]?.name||'Умение'},
    {type:'ability',id:abilities[2]?.id,icon:abilities[2]?.icon||'✦',name:abilities[2]?.name||'Умение'},
    {type:'potion',id:'health-potion',icon:'🧪',name:'Здоровье'},
    {type:'potion',id:'mana-potion',icon:'🔷',name:'Ресурс'}
  ];
  root.innerHTML=slots.map((s,i)=>`<button ${s.type!=='attack'&&!s.id?'disabled':''} onclick="GameAPI.hotbarAction(${i})" title="${esc(s.name)}"><kbd>${i+1}</kbd><span>${s.icon}</span><small>${esc(s.name)}</small></button>`).join('');
}
export function dismantleItem(index) {
  const p=state.game.player,inst=p.inventory[index];
  if(!inst||!canDismantleItem(inst))return toast('Этот предмет нельзя разобрать.');
  const tier=getItemTier(inst);
  if(tier>=4&&state.settings.confirmDangerous!==false&&!confirm('Разобрать '+(ITEMS[inst.id]?.name||inst.id)+' T'+tier+'?'))return;
  const materials=['root-fiber','grave-salt','ember-core','frost-essence','void-dust'];
  const material=materials[Math.min(4,Math.max(0,tier-1))],qty=tier>=5?3:tier>=3?2:1,id=inst.id;
  if((inst.qty||1)>1)removeItem(id,1);else p.inventory.splice(index,1);
  addItem(material,qty);saveGame();toast('Разобрано: '+(ITEMS[id]?.name||id)+' → '+ITEMS[material].name+' ×'+qty);renderRpgWindow();
}
export function dismantleLowTiers() {
  const p=state.game.player,targets=p.inventory.filter(x=>getItemTier(x)<=2&&canDismantleItem(x));
  if(!targets.length)return toast('Нет предметов T1–T2 для разбора.');
  if(!confirm('Разобрать '+targets.length+' предметов T1–T2? Операцию нельзя отменить.'))return;
  for(let i=p.inventory.length-1;i>=0;i--)if(getItemTier(p.inventory[i])<=2&&canDismantleItem(p.inventory[i]))dismantleItem(i);
}
export function toggleItemLock(index) {
  const item=state.game.player.inventory[index];if(!item)return;
  item.locked=!item.locked;saveGame();renderRpgWindow();
}
export function reforgeItem(index) {
  const p=state.game.player,inst=p.inventory[index],item=ITEMS[inst?.id],tier=inst?getItemTier(inst):0;
  if(!inst||!item||isQuestOrShard(inst)||inst.locked||tier>=6)return toast('Этот предмет нельзя перековать.');
  const cost=tier>=5?240:tier>=4?160:tier>=3?100:55,essence=tier>=5?2:1;
  if(state.settings.confirmDangerous!==false&&tier>=4&&!confirm('Перековать '+item.name+' T'+tier+'? Старые модификаторы будут заменены.'))return;
  const { countItem }=window.__riftInventoryHelpers||{};
  const amount=(p.inventory||[]).filter(x=>x.id==='rift-prism').reduce((s,x)=>s+(x.qty||1),0);
  if(amount<essence)return toast('Не хватает Призм Разлома: '+amount+'/'+essence);
  if(p.gold<cost)return toast('Не хватает золота: нужно '+cost);
  removeItem('rift-prism',essence);p.gold-=cost;
  const rarity=inst.rarity||(['T1','T2'].includes(TIER_META[tier]?.id)?'common':tier===3?'rare':tier===4?'epic':'legendary');
  const luckBonus=Math.min(0.25,(p.luck||0)*0.003);
  const nextRarity=Math.random()<luckBonus?({common:'rare',rare:'epic',epic:'legendary',legendary:'legendary'}[rarity]):rarity;
  const affixes=rollItemAffixes(item,nextRarity);
  const bonus={...(item.bonus||{})};
  for(const affix of affixes)for(const [key,value] of Object.entries(affix.bonus||{}))bonus[key]=(bonus[key]||0)+value;
  inst.rarity=nextRarity;inst.affixes=affixes;inst.bonus=bonus;inst.tier=tier;
  saveGame();toast('Модификаторы перекованы. Удача повлияла на шанс усиления.');renderRpgWindow();
}
export function setLootPreset(id) {
  const presets={all:{},cheap:{minTier:1,maxTier:2,priceMax:100},build:{category:'weapon'},craft:{category:'material'},rare:{minTier:4}};
  lootPreset=id;state.settings.lootFilter={...(presets[id]||{})};saveSettings();renderRpgWindow();
}
export function setLootFilter(key,value) {
  state.settings.lootFilter ||= {};
  state.settings.lootFilter[key]=value;saveSettings();renderRpgWindow();
}
export function resetLootFilter() { state.settings.lootFilter={};lootPreset='all';saveSettings();renderRpgWindow(); }
export function updateRiftSetting(key,value) {
  state.settings[key]=value;saveSettings();updateVolume();
  document.documentElement.style.setProperty('--rift-hud-scale',(Number(state.settings.hudScale)||100)/100);
  document.documentElement.style.setProperty('--rift-font-scale',String(Number(state.settings.fontScale)||1));
  document.body.classList.toggle('rift-high-contrast',!!state.settings.highContrast);
  document.body.classList.toggle('rift-reduced-motion',!!state.settings.reducedMotion);
  document.body.classList.toggle('rift-hotkeys-hidden',state.settings.showHotkeys===false);
  const hud=byId('sidebar-player-vitals');if(hud)hud.classList.toggle('hud-lowered',!!state.game?.player?.hudLowered&&state.settings.hudPin!=='top');
  renderRpgWindow();
}
export function renderLootFeed(itemId,qty=1) {
  const item=ITEMS[itemId];if(!item)return;
  const tier=getItemTier({id:itemId}),feed=byId('rpg-loot-feed');if(!feed)return;
  const row=document.createElement('div');row.className='rift-loot-toast';row.style.setProperty('--tier-color',TIER_META[tier].color);row.textContent=item.icon+' '+item.name+' ×'+qty+' · T'+tier;feed.prepend(row);
  while(feed.children.length>6)feed.lastElementChild.remove();
  setTimeout(()=>row.remove(),6500);
}
export function openPauseMenu() {
  if(!state.overworld?.active)return;
  pauseOpen=true;state.overworld.paused=true;window.GameAPI?.setOverworldPaused?.(true);
  const layer=byId('rpg-pause-overlay');if(layer)layer.hidden=false;
}
export function closePause() {
  pauseOpen=false;const layer=byId('rpg-pause-overlay');if(layer)layer.hidden=true;
  if(state.overworld)state.overworld.paused=false;window.GameAPI?.setOverworldPaused?.(false);
}
export function pauseSettings() { closePause();openRpgWindow('settings'); }
export function pauseExit() {
  if(!confirm('Выйти в главное меню? Текущий прогресс будет сохранён.'))return;
  saveGame();closePause();closeRpgWindow();state.overworld=null;state.game=null;window.GameAPI?.showScreen?.('screen-main');window.GameAPI?.updateMainMenu?.();
}

export function initInterfaceV2() {
  if(keyBound)return;keyBound=true;
  document.addEventListener('keydown',event=>{
    if(event.repeat||event.ctrlKey||event.altKey||event.metaKey)return;
    const tag=(event.target?.tagName||'').toUpperCase();
    const typing=['INPUT','TEXTAREA','SELECT'].includes(tag)||event.target?.isContentEditable;
    const interfaceLayer=byId('rpg-interface-overlay'),pauseLayer=byId('rpg-pause-overlay');
    if(event.key==='Escape'){
      if(interfaceLayer&&!interfaceLayer.hidden){event.preventDefault();event.stopImmediatePropagation();closeRpgWindow();return;}
      if(pauseLayer&&!pauseLayer.hidden){event.preventDefault();event.stopImmediatePropagation();closePause();return;}
      const npc=byId('npc-dialog-modal');
      if(npc&&getComputedStyle(npc).display!=='none'){event.preventDefault();event.stopImmediatePropagation();window.GameAPI?.closeNpcAndResume?.();return;}
      if(!typing&&state.overworld?.active){event.preventDefault();event.stopImmediatePropagation();openPauseMenu();}
      return;
    }
    if(typing||!state.overworld?.active)return;
    const hotkeys={i:'inventory',c:'character',k:'craft',b:'bestiary',j:'journal',m:isRiftUnlocked()?'rift':'world',l:'loot'};
    const tab=hotkeys[event.key.toLowerCase()];
    if(tab){event.preventDefault();event.stopImmediatePropagation();openRpgWindow(tab);}
  },true);
  on('game:started',()=>{renderHotbar();const act=STORY.acts[0],mission=act?.missions?.[0];if(mission)setTimeout(()=>toast('АКТ 1 · '+act.title+' — '+mission.title),500);});
  on('overworld:start',renderHotbar);
  on('loot:drop',({itemId,qty})=>renderLootFeed(itemId,qty));
  on('progression:level-up',()=>{
    const p=state.game?.player;
    if(p&&!p.hudLowered){p.hudLowered=true;saveGame();}
    const hud=byId('sidebar-player-vitals');if(hud)hud.classList.add('hud-lowered');
    renderHotbar();
  });
}
