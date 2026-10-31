import { state } from '../systems/state.js';
import { NPCS, FORGE_BONUS } from '../data/npcs.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { countItem } from '../systems/inventory.js';
import { saveGame } from '../systems/save.js';
import { showScreen, toast } from './screens.js';
import { STORY } from '../data/story.js';
import { LOCATIONS } from '../data/locations.js';
import { addItem } from '../systems/inventory.js';
import { addExp } from '../systems/progression.js';
import { DRAGON_SHARDS } from '../data/rift-canon.js';
import { canOpenRift, ensureRiftProgress } from '../systems/rift-progression.js';
import {
  getActiveCampaignMission, getNextCampaignMission, getMissionProgress,
  getMissionReward, acceptCampaignMission, claimCampaignMission
} from '../systems/campaign.js';

function showNpcUI(html) {
  if (state.overworld && state.overworld.active) {
    document.getElementById('npc-dialog-content').innerHTML = html;
    document.getElementById('npc-dialog-modal').style.display = 'flex';
  } else {
    document.getElementById('tab-content').innerHTML = html;
    showScreen('screen-game');
  }
}

function getGreeting(npcId) { const npc = NPCS[npcId]; if (!npc || !npc.greetings) return '...'; return npc.greetings[Math.floor(Math.random() * npc.greetings.length)]; }

export function openBlacksmith() {
  const npc = NPCS.blacksmith; const p = state.game.player;
  const renderSlot = (slot, label) => {
    const inst = p.equipped[slot]; if (!inst) return `<div class="npc-slot"><div class="npc-slot-title">${label}</div><div class="npc-slot-empty">Слот пуст</div></div>`;
    const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst; const item = ITEMS[obj.id]; if (!item) return '';
    const rar = obj.rarity ? RARITIES[obj.rarity] : null; const color = rar ? rar.color : '#c9a227'; const lvl = obj.forgeLevel || 0; const maxLvl = npc.maxLevel; const forgeBonus = FORGE_BONUS[lvl] || 0;
    let upgradeBlock = '';
    if (lvl >= maxLvl) upgradeBlock = `<div style="color:#60ff60;">Максимальный уровень: +${maxLvl}</div>`;
    else { const next = npc.upgrades[lvl]; const can = p.gold >= next.cost; upgradeBlock = `<div style="color:#a89060;font-size:12px;margin-bottom:6px;">Следующий уровень: <b style="color:#c9a227;">+${lvl + 1}</b> — <b style="color:#60ff60;">+${next.forgeBonus}</b> к ${slot === 'weapon' ? 'атаке/магии' : 'защите'}</div><button onclick="GameAPI.upgradeEquipment('${slot}')" ${can ? '' : 'disabled'} class="sell-btn">⚒️ Улучшить за ${next.cost}💰</button>`; }
    return `<div class="npc-slot"><div class="npc-slot-title">${label}</div><div class="npc-slot-item" style="border-color:${color};"><div style="color:${color};font-weight:bold;">${item.icon} ${item.name}${lvl > 0 ? ` <span style="color:#ffd060;">+${lvl}</span>` : ''}</div><div style="color:#a89060;font-size:12px;margin-top:2px;">Бонус ковки: +${forgeBonus}</div></div>${upgradeBlock}</div>`;
  };
  showNpcUI(`<div class="npc-header"><div class="npc-emoji">${npc.emoji}</div><div><h3 style="margin:0;">${npc.name}</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('blacksmith')}»</p></div></div><div class="npc-gold">💰 Ваше золото: <b style="color:#ffd060;">${p.gold}</b></div>${renderSlot('weapon', '⚔️ Оружие')}${renderSlot('armor', '🥋 Броня')}<button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`);
}

export function openHealer() {
  const npc = NPCS.healer; const p = state.game.player; const cost = npc.cost; const healthy = p.hp >= p.maxHp && p.mp >= p.maxMp; const canPay = p.gold >= cost;
  showNpcUI(`<div class="npc-header"><div class="npc-emoji">${npc.emoji}</div><div><h3 style="margin:0;">${npc.name}</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('healer')}»</p></div></div><div class="npc-gold">💰 Ваше золото: <b style="color:#ffd060;">${p.gold}</b></div><div class="npc-stats"><div>HP: <b style="color:${p.hp < p.maxHp ? '#ff6060' : '#60ff60'};">${p.hp}/${p.maxHp}</b></div><div>${p.class === 'warrior' ? '🔥 Ярость' : 'MP'}: <b style="color:${p.mp < p.maxMp ? '#60a0ff' : '#60ff60'};">${p.mp}/${p.maxMp}</b></div></div>${healthy ? `<div style="color:#60ff60;text-align:center;padding:15px;">✨ Вы полностью здоровы</div>` : `<button onclick="GameAPI.healAtHealer()" ${canPay ? '' : 'disabled'} class="sell-btn" style="width:100%;padding:14px;">💚 Полное исцеление за ${cost}💰</button>`}<button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`);
}

export function openAlchemist() {
  const npc = NPCS.alchemist;
  const herbsList = ['herb-life', 'herb-moon'].map(id => { const count = countItem(id); const it = ITEMS[id]; return `<div class="herb-item ${count > 0 ? '' : 'empty'}"><span class="herb-icon">${it.icon}</span><span class="herb-name">${it.name}</span><span class="herb-count">×${count}</span></div>`; }).join('');
  const recipesHTML = npc.recipes.map(r => { const result = ITEMS[r.result]; const canCraft = r.ingredients.every(ing => countItem(ing.id) >= ing.qty); const ingList = r.ingredients.map(ing => `<span style="color:${countItem(ing.id) >= ing.qty ? '#60ff60' : '#ff6060'};">${ITEMS[ing.id].icon} ${ITEMS[ing.id].name} (${countItem(ing.id)}/${ing.qty})</span>`).join(' + '); return `<div class="recipe"><div class="recipe-result">${result.icon} ${result.name}</div><div class="recipe-ingredients">${ingList}</div><button onclick="GameAPI.craftRecipe('${r.id}')" ${canCraft ? '' : 'disabled'} class="sell-btn">⚗️ Скрафтить</button></div>`; }).join('');
  showNpcUI(`<div class="npc-header"><div class="npc-emoji">${npc.emoji}</div><div><h3 style="margin:0;">${npc.name}</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('alchemist')}»</p></div></div><h3 style="margin-top:15px;">🌿 Ваши травы</h3><div class="herbs-list">${herbsList}</div><h3 style="margin-top:15px;">⚗️ Рецепты</h3><div class="recipes-list">${recipesHTML}</div><button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`);
}

export function openMerchant() {
  const p = state.game.player;
  const stock = [...NPCS.merchant.stock].sort(() => 0.5 - Math.random()).slice(0, 5);
  const html = stock.map(id => { const item = ITEMS[id]; return `<div class="item" onmouseover="GameAPI.showShopTooltip(event, '${id}')" onmouseout="GameAPI.hideTooltip()"><div class="item-info"><div class="item-name">${item.icon} ${item.name}</div><div class="item-desc">${item.desc} · 💰 ${item.price}</div></div><button onclick="GameAPI.buy('${id}')" ${p.gold < item.price ? 'disabled' : ''} style="font-size:12px;padding:6px 12px;">Купить</button></div>`; }).join('');
  showNpcUI(`<div class="npc-header"><div class="npc-emoji">🛒</div><div><h3 style="margin:0;">Странствующий торговец</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('merchant')}»</p></div></div><div class="npc-gold">💰 Ваше золото: <b style="color:#ffd060;">${p.gold}</b></div><h3>Товары дня</h3><div class="item-list">${html}</div><button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`);
}

export function openElder() {
  const p = state.game.player;
  const hasBlessing = p.effects?.some(e => e.id === 'elderBlessing');
  const isFirstMeet = !p.stats?.metElder;
  const shardsCount = Object.values(state.game.shards || {}).filter(Boolean).length;
  ensureRiftProgress(p);
  const dragonCount = DRAGON_SHARDS.filter(dragon => p.dragonDefeated[dragon.shardId]).length;
  const riftOpen = canOpenRift(p);
  const active = getActiveCampaignMission(p);
  const next = active || getNextCampaignMission(p);

  let dialogue = '';
  if (isFirstMeet) {
    dialogue = `<div class="elder-lore"><p>«Я думал, что осколки — единственная беда. Но трещина Кристалла разбудила пять древних печатей. Их следы ведут в земли, которых нет на старых картах.</p><p>В чаще корни помнят звёзды. Под водой лежит город свидетелей. В обсидиане спит кузница клятв. Лёд хранит признание королевы. А за гранью мира ждёт тот, кого называют Немым.</p><p>Я буду поручать тебе дела по одному. Выполни их и возвращайся ко мне: за каждым ответом откроется следующая часть правды».</p></div>`;
  } else if (shardsCount === 3) {
    dialogue = `<p class="elder-notice">💎 Все три осколка найдены. Но печати ещё требуют внимания — заверши поручения, чтобы узнать истинную причину Раскола.</p>`;
  } else if (shardsCount > 0) {
    dialogue = `<p class="elder-notice">Осколков Кристалла собрано: <b>${shardsCount}/3</b>. Их история переплетена с пятью печатями.</p>`;
  }

  const dragonProgressBlock = `
    <section class="elder-quest-card">
      <small>Эндгейм · три драконьи печати</small>
      <h3>${riftOpen ? 'Разлом открыт' : `Печати драконов: ${dragonCount}/3`}</h3>
      <p>${riftOpen
        ? 'Все три дракона побеждены, а их осколки закреплены в печати. Теперь доступен Разлом.'
        : DRAGON_SHARDS.filter(dragon => !p.dragonDefeated[dragon.shardId]).map(dragon => `${dragon.name} — уровень ${dragon.requiredLevel}`).join('<br>')}</p>
    </section>`;

  let missionBlock = '';
  if (next) {
    const { act, mission } = next;
    const progress = getMissionProgress(p, mission);
    const missionLocationId = mission.locationId || act.locationId;
    const location = LOCATIONS[missionLocationId]?.name || missionLocationId;
    const reward = getMissionReward(mission);
    const status = active
      ? progress.complete
        ? '<b class="elder-quest-ready">Поручение завершено. Эдвин ждёт твоего возвращения.</b>'
        : '<b class="elder-quest-active">Поручение принято. Продолжай путь.</b>'
      : '<b class="elder-quest-new">Новое поручение доступно.</b>';

    const action = active
      ? progress.complete
        ? '<button onclick="GameAPI.turnInElderQuest()" class="sell-btn elder-quest-action">Сдать поручение и получить награду</button>'
        : ''
      : '<button onclick="GameAPI.acceptElderQuest()" class="sell-btn elder-quest-action">Принять поручение</button>';

    missionBlock = `
      <section class="elder-quest-card">
        <small>${act.subtitle} · ${act.number} акт</small>
        <h3>${mission.title}</h3>
        <p>${mission.desc}</p>
        <div class="elder-quest-meta">📍 Регион: <b>${location}</b></div>
        <div class="elder-quest-objective">${status}<span>${mission.objective}</span></div>
        <div class="campaign-progress"><i style="width:${Math.min(100, progress.current / progress.required * 100)}%"></i></div>
        <div class="elder-quest-count">${progress.current} / ${progress.required}</div>
        <div class="elder-quest-reward">Награда: 💰 ${reward.gold} · ✨ ${reward.exp} EXP · ${ITEMS[reward.itemId]?.icon || '📦'} ${ITEMS[reward.itemId]?.name || reward.itemId}</div>
        ${action}
      </section>`;
  } else {
    missionBlock = `<section class="elder-quest-card elder-campaign-finished"><h3>Пять печатей восстановлены</h3><p>«Ты узнал, почему Кристалл раскололся. Теперь Аврора должна решить, как жить без страха перед общей силой. Я больше не стану хранить эту правду в одиночку».</p></section>`;
  }

  showNpcUI(`
    <div class="npc-header"><div class="npc-emoji">👴</div><div><h3 style="margin:0;">Старейшина Эдвин</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('elder')}»</p></div></div>
    ${dialogue}
    ${missionBlock}
    ${dragonProgressBlock}
    ${hasBlessing ? '<p class="elder-notice">✨ Благословение старейшины уже действует.</p>' : '<div class="elder-blessing"><p>Благословение даёт +20% к получаемому опыту на 10 боёв.</p><button onclick="GameAPI.takeElderBlessing()" class="sell-btn">Принять благословение</button></div>'}
    <button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>
  `);

  if (isFirstMeet) {
    if (!p.stats) p.stats = {};
    p.stats.metElder = true;
    saveGame();
  }
}

export function acceptElderQuestUI() {
  const p = state.game?.player;
  if (!p) return;
  const next = getNextCampaignMission(p);
  if (!next || !acceptCampaignMission(p, next.mission.id)) {
    toast('Сейчас нет доступного нового поручения.');
    return;
  }
  saveGame();
  openElder();
  toast(`📜 Принято поручение: ${next.mission.title}`);
}

export function turnInElderQuestUI() {
  const p = state.game?.player;
  if (!p) return;
  const completed = claimCampaignMission(p);
  if (!completed) {
    toast('Поручение ещё не выполнено.');
    return;
  }

  const reward = getMissionReward(completed.mission);
  p.gold = (p.gold || 0) + reward.gold;
  addExp(reward.exp);
  if (reward.itemId) addItem(reward.itemId, 1);
  if (!p.stats) p.stats = {};
  p.stats.goldEarned = (p.stats.goldEarned || 0) + reward.gold;
  saveGame();
  openElder();
  toast(`Награда получена: +${reward.gold} золота, +${reward.exp} опыта.`);
}

export function openWell() {
  const p = state.game.player; const now = Date.now(); const lastWell = p.stats?.lastWellUse || 0; const canUse = (now - lastWell) > 24 * 60 * 60 * 1000;
  showNpcUI(`<div class="npc-header"><div class="npc-emoji">⛲</div><div><h3 style="margin:0;">Древний колодец</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('well')}»</p></div></div>${p.hp >= p.maxHp && p.mp >= p.maxMp ? `<p style="text-align:center; padding: 20px; color: #60ff60;">✨ Вы полностью здоровы.</p>` : canUse ? `<div style="text-align:center; margin: 20px 0;"><button onclick="GameAPI.useWell()" class="sell-btn" style="padding: 15px 30px;">💧 Испить воды (Полный хил)</button></div>` : `<p style="text-align:center; padding: 20px; color: #ff6060;">Колодец исцелит вас снова через 24 часа.</p>`}<button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`);
}

export function openBard() {
  const p = state.game.player; const hasBuff = p.buffs?.some(b => b.id === 'bardBuff');
  showNpcUI(`<div class="npc-header"><div class="npc-emoji">🎵</div><div><h3 style="margin:0;">Бард Лютик</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('bard')}»</p></div></div><div class="npc-gold">💰 Ваше золото: <b style="color:#ffd060;">${p.gold}</b></div>${hasBuff ? `<p style="text-align:center; padding: 20px; color: #ffd060;">🎵 Музыка барда вдохновляет вас (+10% опыта).</p>` : `<div style="text-align:center; margin: 20px 0;"><p style="margin-bottom: 15px;">Песня барда дает +10% к опыту на 3 боя.</p><button onclick="GameAPI.payBard()" ${p.gold < 15 ? 'disabled' : ''} class="sell-btn" style="padding: 15px 30px;">Заплатить 15💰</button></div>`}<button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`);
}

export function openGuard() { showNpcUI(`<div class="npc-header"><div class="npc-emoji">🛡️</div><div><h3 style="margin:0;">Стражник</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('guard')}»</p></div></div><div class="item-desc" style="padding:15px; line-height:1.7;"><b>Справка по локациям:</b><br>🌲 Тёмный лес — гоблины и скелеты (легко)<br>🏛️ Руины — нежить (средне)<br>🕳️ Пещера теней — тёмный рыцарь и маг (сложно)<br>🩸 Болото — волки и лучники<br>🪦 Кладбище — призраки и босс<br>🌋 Вулкан — элементали и босс</div><button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`); }
export function openCat() { const p = state.game.player; const hasBuff = p.buffs?.some(b => b.id === 'catLuck'); showNpcUI(`<div class="npc-header"><div class="npc-emoji">🐈</div><div><h3 style="margin:0;">Кошка</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('cat')}»</p></div></div>${hasBuff ? `<p style="text-align:center; padding: 20px; color: #ffd060;">🐈 Кошка мурчит рядом (+5% крита).</p>` : `<div style="text-align:center; margin: 20px 0;"><p style="margin-bottom: 15px;">Если погладить кошку, она принесет удачу (+5% крита на 1 бой).</p><button onclick="GameAPI.petCat()" class="sell-btn" style="padding: 15px 30px;">Погладить</button></div>`}<button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`); }
export function openKids() { showNpcUI(`<div class="npc-header"><div class="npc-emoji">👦</div><div><h3 style="margin:0;">Дети</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('kids')}»</p></div></div><div style="text-align:center; padding: 20px; color: #60ff60;">👦 Дети радостно бегают вокруг вас.</div><button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`); }
export function openHerald() { showNpcUI(`<div class="npc-header"><div class="npc-emoji">📢</div><div><h3 style="margin:0;">Глашатай</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«${getGreeting('herald')}»</p></div></div><div style="text-align:center; padding: 20px; color: #ffd060;">📢 «Слушайте! В лесу замечен элитный гоблин, а в Разломе — сокровища!»</div><button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`); }

export function payBardUI() { const p = state.game.player; if (p.gold < 15) return; p.gold -= 15; if (!p.buffs) p.buffs = []; p.buffs.push({ id: 'bardBuff', duration: 3 }); saveGame(); openBard(); toast('🎵 Бард вдохновил вас! (+10% опыта)'); }
export function petCatUI() { const p = state.game.player; if (!p.buffs) p.buffs = []; p.buffs.push({ id: 'catLuck', duration: 1 }); saveGame(); openCat(); toast('🐈 Кошка мурчит. Удача с вами! (+5% крита)'); }
export function closeNpcAndResumeUI() { import('./overworld.js').then(m => { m.closeDialogAndResume(); showScreen('screen-overworld'); }); }
export function takeElderBlessingUI() { const p = state.game.player; if (!p.effects) p.effects = []; p.effects.push({ id: 'elderBlessing', duration: 10 }); saveGame(); openElder(); toast('✨ Вы получили благословение (+20% опыта)'); }
export function useWellUI() { const p = state.game.player; p.hp = p.maxHp; if (p.class !== 'warrior') p.mp = p.maxMp; if (!p.stats) p.stats = {}; p.stats.lastWellUse = Date.now(); saveGame(); openWell(); toast('💧 Вы полностью исцелены!'); }