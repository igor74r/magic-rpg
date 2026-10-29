import { state } from '../systems/state.js';
import { CLASSES } from '../data/classes.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { SPELLS } from '../data/spells.js';
import { LOCATIONS } from '../data/locations.js';
import { STORY } from '../data/story.js';
import { SHOP_ITEMS } from '../data/shop.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { NPCS, FORGE_BONUS } from '../data/npcs.js';
import { ENEMIES } from '../data/enemies.js';
import { EFFECTS } from '../systems/status.js';
import { useItem, equipItemByIndex, unequipItemBySlot, countItem, equipBest } from '../systems/inventory.js';
import { enterOverworld } from '../systems/overworld.js';
import { buyItem, sellItemByIndex, getSellPrice } from '../systems/shop.js';
import { upgradeEquipment, healAtHealer, craftRecipe, canUpgrade, getEquipmentForgeLevel } from '../systems/crafting.js';
import { saveGame } from '../systems/save.js';
import { toast } from './screens.js';
import { canOpenDaily, timeUntilDaily, formatRemaining } from './village.js';
import { getAvailableTalents, getTakenTalents, takeTalent, getNextTierLevel } from '../systems/talents.js';
import { getClassTalents } from '../data/talents.js';
import { emit } from '../systems/events.js';

let invFilter = 'all';
let invSort = 'default';

export function renderGame() {
  if (!state.game) return;
  renderHeader();
  renderLocation();
  renderTab(state.currentTab);
}

function totalKills() {
  const kills = state.game.player.stats?.kills || {};
  return Object.values(kills).reduce((s, v) => s + v, 0);
}

export function renderHeader() {
  const p = state.game.player;
  const points = p.statPoints || 0;
  const statBlock = points > 0 ? `
    <div class="stat-points-panel">
      <span class="stat-points-label">🎯 Очков характеристик: ${points}</span>
      <div class="stat-buttons">
        <button onclick="GameAPI.spendStat('str')">+1 СИЛ</button>
        <button onclick="GameAPI.spendStat('int')">+1 ИНТ</button>
        <button onclick="GameAPI.spendStat('wis')">+1 МДР</button>
        <button onclick="GameAPI.spendStat('con')">+1 ТЕЛ</button>
      </div>
    </div>` : '';

  const effectsHtml = renderActiveEffectsInline(p.effects);
  const endgameHtml = renderEndgameHint(p);

  document.getElementById('game-header').innerHTML = `
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
      <div><span style="color:#c9a227;font-size:18px;">${CLASSES[p.class].emoji} ${p.name}</span> <span style="color:#a89060;">— ${CLASSES[p.class].name}, Ур. ${p.level}</span></div>
      <div><span style="color:#ffd060;">💰 ${p.gold}</span></div>
    </div>
    <div class="bar"><div class="bar-fill bar-hp" style="width:${p.hp/p.maxHp*100}%"></div><div class="bar-text">HP ${p.hp}/${p.maxHp}</div></div>
    <div class="bar"><div class="bar-fill bar-mp" style="width:${p.mp/p.maxMp*100}%"></div><div class="bar-text">MP ${p.mp}/${p.maxMp}</div></div>
    <div class="bar"><div class="bar-fill bar-exp" style="width:${p.exp/p.expNext*100}%"></div><div class="bar-text">EXP ${p.exp}/${p.expNext}</div></div>
    <div style="text-align:center;font-size:11px;color:#a89060;margin-bottom:2px;">До следующего уровня: ${p.expNext - p.exp} EXP</div>
    <div style="margin-top:8px;font-size:13px;color:#a89060;text-align:center;">
      СИЛ ${p.str} · ИНТ ${p.int} · МДР ${p.wis} · ТЕЛ ${p.con} · ⚔️ ${totalKills()} убийств
    </div>
    ${effectsHtml}
    ${endgameHtml}
    ${statBlock}`;
}

function renderEndgameHint(p) {
  const shards = state.game.shards || {};
  const shardCount = Object.values(shards).filter(Boolean).length;
  const riftBest = p.riftBest || 0;

  if (riftBest > 0) {
    return `<div class="endgame-hint rift">🌀 Рекорд Разлома: <b>этаж ${riftBest}</b></div>`;
  }
  if (shardCount === 3) {
    return `<div class="endgame-hint rift">🌀 <b>Разлом открыт!</b> Зайди в деревню и войди в портал</div>`;
  }
  return `<div class="endgame-hint">💎 Осколки Кристалла: <b>${shardCount}/3</b> · собери все — откроется Разлом</div>`;
}

function renderActiveEffectsInline(effects) {
  if (!Array.isArray(effects) || !effects.length) return '';
  const badges = effects.map(e => {
    const d = EFFECTS[e.id];
    if (!d) return '';
    return `<span class="fx-badge" style="border-color:${d.color};color:${d.color};" title="${d.name}${d.desc ? ': ' + d.desc : ''} (${e.duration} ${e.duration === 1 ? 'ход' : 'хода'})">${d.icon}${e.duration}</span>`;
  }).join('');
  return `<div class="effects-inline"><span style="color:#a89060;font-size:11px;margin-right:6px;">Эффекты:</span>${badges}</div>`;
}

const STAT_NAMES = { str: 'Силе', int: 'Интеллекту', wis: 'Мудрости', con: 'Телосложению' };

export function spendStat(stat) {
  const p = state.game.player;
  if (!p.statPoints || p.statPoints <= 0) return;
  if (!(stat in STAT_NAMES)) return;
  p[stat] += 1;
  p.statPoints -= 1;
  if (stat === 'con') p.maxHp += 10;
  if (stat === 'int') p.maxMp += 5;
  saveGame();
  renderHeader();
  toast(`+1 к ${STAT_NAMES[stat]}`);
}

function renderLocation() {
  const loc = LOCATIONS[state.game.location];
  document.getElementById('location-info').innerHTML = `
    <h2>${loc.emoji} ${loc.name}</h2>
    <p style="color:#a89060;margin-top:5px;font-size:14px;">${loc.desc}</p>`;
}

export function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderTab(tab);
}

function renderTab(tab) {
  const el = document.getElementById('tab-content');
  if (tab === 'locations') el.innerHTML = renderLocationsHTML();
  else if (tab === 'inventory') el.innerHTML = renderInventoryHTML();
  else if (tab === 'spells') el.innerHTML = renderSpellsHTML();
  else if (tab === 'quests') el.innerHTML = renderQuestsHTML();
  else if (tab === 'achievements') el.innerHTML = renderAchievementsHTML();
  else if (tab === 'statistics') el.innerHTML = renderStatisticsHTML();
  else if (tab === 'talents') el.innerHTML = renderTalentsHTML();
}

function renderLocationsHTML() {
  const loc = LOCATIONS[state.game.location];
  const actions = [];
  if (loc.enemies?.length) actions.push(`<button onclick="GameAPI.enterOverworld()">🗺️ Войти в локацию</button>`);
  if (loc.shop) actions.push(`<button onclick="GameAPI.openShop()">🛒 Магазин</button>`);

  if (state.game.location === 'village') {
    const canOpen = canOpenDaily();
    const label = canOpen
      ? '🎁 Открыть ежедневный сундук'
      : `🎁 Через ${formatRemaining(timeUntilDaily())}`;
    actions.push(`<button onclick="GameAPI.openDailyChest()" ${canOpen ? '' : 'disabled'}>${label}</button>`);

    actions.push(`<button onclick="GameAPI.openBlacksmith()">${NPCS.blacksmith.emoji} Кузнец</button>`);
    actions.push(`<button onclick="GameAPI.openHealer()">${NPCS.healer.emoji} Лекарь</button>`);
    actions.push(`<button onclick="GameAPI.openAlchemist()">${NPCS.alchemist.emoji} Алхимик</button>`);

    const riftReady = !!(state.game.shards.forest && state.game.shards.ruins && state.game.shards.shadow);
    const best = state.game.player.riftBest || 0;
    const riftLabel = riftReady
      ? `🌀 Бесконечный разлом${best > 0 ? ` (рекорд: ${best})` : ''}`
      : `🌀 Разлом (нужны 3 осколка)`;
    actions.push(`<button onclick="GameAPI.enterRift()" ${riftReady ? '' : 'disabled'} class="rift-btn">${riftLabel}</button>`);
  }

  if (!actions.length) actions.push(`<p style="color:#a89060;text-align:center;grid-column:1/-1;">Здесь тихо и безопасно.</p>`);

  const travelBtns = Object.entries(LOCATIONS)
    .filter(([id]) => id !== state.game.location)
    .map(([id, l]) => `<button onclick="GameAPI.travelTo('${id}')" style="font-size:14px;">${l.emoji} ${l.name}</button>`)
    .join('');

  return `
    <h3>Действия</h3>
    <div class="actions" style="margin-bottom:15px;">${actions.join('')}</div>
    <div class="divider"></div>
    <h3>Путешествие</h3>
    <div class="location-list">${travelBtns}</div>`;
}

export function openBlacksmith() {
  document.getElementById('tab-content').innerHTML = renderBlacksmithHTML();
}

function renderBlacksmithHTML() {
  const npc = NPCS.blacksmith;
  const p = state.game.player;

  const renderSlot = (slot, label) => {
    const inst = p.equipped[slot];
    if (!inst) {
      return `<div class="npc-slot">
        <div class="npc-slot-title">${label}</div>
        <div class="npc-slot-empty">Слот пуст — экипируйте предмет</div>
      </div>`;
    }
    const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
    const item = ITEMS[obj.id];
    if (!item) return '';
    const rar = obj.rarity ? RARITIES[obj.rarity] : null;
    const color = rar ? rar.color : '#c9a227';
    const lvl = obj.forgeLevel || 0;
    const maxLvl = npc.maxLevel;
    const forgeBonus = FORGE_BONUS[lvl] || 0;

    let upgradeBlock = '';
    if (lvl >= maxLvl) {
      upgradeBlock = `<div style="color:#60ff60;">Максимальный уровень: +${maxLvl} (${FORGE_BONUS[maxLvl]} бонуса)</div>`;
    } else {
      const next = npc.upgrades[lvl];
      const can = p.gold >= next.cost;
      upgradeBlock = `
        <div style="color:#a89060;font-size:12px;margin-bottom:6px;">
          Следующий уровень: <b style="color:#c9a227;">+${lvl + 1}</b> — 
          <b style="color:#60ff60;">+${next.forgeBonus}</b> к ${slot === 'weapon' ? 'атаке/магии' : 'защите'}
        </div>
        <button onclick="GameAPI.upgradeEquipment('${slot}')" ${can ? '' : 'disabled'} class="sell-btn">
          ⚒️ Улучшить за ${next.cost}💰
        </button>`;
    }

    return `<div class="npc-slot">
      <div class="npc-slot-title">${label}</div>
      <div class="npc-slot-item" style="border-color:${color};">
        <div style="color:${color};font-weight:bold;">${item.icon} ${item.name}${lvl > 0 ? ` <span style="color:#ffd060;">+${lvl}</span>` : ''}</div>
        <div style="color:#a89060;font-size:12px;margin-top:2px;">Бонус ковки: +${forgeBonus}</div>
      </div>
      ${upgradeBlock}
    </div>`;
  };

  return `
    <div class="npc-header">
      <div class="npc-emoji">${npc.emoji}</div>
      <div>
        <h3 style="margin:0;">${npc.name}</h3>
        <p style="color:#a89060;font-style:italic;margin-top:4px;">«${npc.greeting}»</p>
      </div>
    </div>
    <div class="npc-gold">💰 Ваше золото: <b style="color:#ffd060;">${p.gold}</b></div>
    ${renderSlot('weapon', '⚔️ Оружие')}
    ${renderSlot('armor', '🥋 Броня')}
    <button onclick="GameAPI.backToVillage()" style="width:100%;margin-top:15px;">← В деревню</button>
  `;
}

export function openHealer() {
  document.getElementById('tab-content').innerHTML = renderHealerHTML();
}

function renderHealerHTML() {
  const npc = NPCS.healer;
  const p = state.game.player;
  const cost = npc.cost;
  const healthy = p.hp >= p.maxHp && p.mp >= p.maxMp;
  const canPay = p.gold >= cost;

  return `
    <div class="npc-header">
      <div class="npc-emoji">${npc.emoji}</div>
      <div>
        <h3 style="margin:0;">${npc.name}</h3>
        <p style="color:#a89060;font-style:italic;margin-top:4px;">«${npc.greeting}»</p>
      </div>
    </div>
    <div class="npc-gold">💰 Ваше золото: <b style="color:#ffd060;">${p.gold}</b></div>
    <div class="npc-stats">
      <div>HP: <b style="color:${p.hp < p.maxHp ? '#ff6060' : '#60ff60'};">${p.hp}/${p.maxHp}</b></div>
      <div>MP: <b style="color:${p.mp < p.maxMp ? '#60a0ff' : '#60ff60'};">${p.mp}/${p.maxMp}</b></div>
    </div>
    ${healthy
      ? `<div style="color:#60ff60;text-align:center;padding:15px;">✨ Вы полностью здоровы</div>`
      : `<button onclick="GameAPI.healAtHealer()" ${canPay ? '' : 'disabled'} class="sell-btn" style="width:100%;padding:14px;">
           💚 Полное исцеление за ${cost}💰
         </button>`}
    <button onclick="GameAPI.backToVillage()" style="width:100%;margin-top:15px;">← В деревню</button>
  `;
}

export function openAlchemist() {
  document.getElementById('tab-content').innerHTML = renderAlchemistHTML();
}

function renderAlchemistHTML() {
  const npc = NPCS.alchemist;
  const p = state.game.player;

  const herbsList = ['herb-life', 'herb-moon'].map(id => {
    const count = countItem(id);
    const it = ITEMS[id];
    return `<div class="herb-item ${count > 0 ? '' : 'empty'}">
      <span class="herb-icon">${it.icon}</span>
      <span class="herb-name">${it.name}</span>
      <span class="herb-count">×${count}</span>
    </div>`;
  }).join('');

  const recipesHTML = npc.recipes.map(r => {
    const result = ITEMS[r.result];
    const canCraft = r.ingredients.every(ing => countItem(ing.id) >= ing.qty);
    const ingList = r.ingredients.map(ing => {
      const have = countItem(ing.id);
      const enough = have >= ing.qty;
      return `<span style="color:${enough ? '#60ff60' : '#ff6060'};">${ITEMS[ing.id].icon} ${ITEMS[ing.id].name} (${have}/${ing.qty})</span>`;
    }).join(' + ');

    return `<div class="recipe">
      <div class="recipe-result">${result.icon} ${result.name}</div>
      <div class="recipe-ingredients">${ingList}</div>
      <button onclick="GameAPI.craftRecipe('${r.id}')" ${canCraft ? '' : 'disabled'} class="sell-btn">
        ⚗️ Скрафтить
      </button>
    </div>`;
  }).join('');

  return `
    <div class="npc-header">
      <div class="npc-emoji">${npc.emoji}</div>
      <div>
        <h3 style="margin:0;">${npc.name}</h3>
        <p style="color:#a89060;font-style:italic;margin-top:4px;">«${npc.greeting}»</p>
      </div>
    </div>
    <h3 style="margin-top:15px;">🌿 Ваши травы</h3>
    <div class="herbs-list">${herbsList}</div>
    <h3 style="margin-top:15px;">⚗️ Рецепты</h3>
    <div class="recipes-list">${recipesHTML}</div>
    <button onclick="GameAPI.backToVillage()" style="width:100%;margin-top:15px;">← В деревню</button>
  `;
}

function itemHeader(inst, item) {
  const rar = inst.rarity ? RARITIES[inst.rarity] : null;
  const color = rar ? rar.color : '#c9a227';
  const label = rar && inst.rarity !== 'common' ? ` [${rar.name}]` : '';
  const forge = inst.forgeLevel ? ` <span style="color:#ffd060;">+${inst.forgeLevel}</span>` : '';
  return `<div class="item-name" style="color:${color};">${item.icon} ${item.name}${label}${forge}</div>`;
}

function itemBonus(inst, item) {
  const b = inst.bonus || item.bonus;
  if (!b) return '';
  const parts = [];
  if (b.attack) parts.push(`+${b.attack} атака`);
  if (b.magic) parts.push(`+${b.magic} магия`);
  if (b.defense) parts.push(`+${b.defense} защита`);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };

function getItemValue(inst) {
  const item = ITEMS[inst.id];
  if (!item) return 0;
  const mult = inst.rarity ? RARITIES[inst.rarity].multiplier : 1;
  return (item.price || 0) * mult * (inst.qty || 1);
}

function filterAndSort(entries) {
  let list = entries;
  if (invFilter !== 'all') {
    list = list.filter(({ inst }) => ITEMS[inst.id]?.type === invFilter);
  }
  if (invSort === 'rarity') {
    list = list.slice().sort((a, b) => {
      const ra = RARITY_ORDER[a.inst.rarity || 'common'] ?? 0;
      const rb = RARITY_ORDER[b.inst.rarity || 'common'] ?? 0;
      return rb - ra;
    });
  } else if (invSort === 'price') {
    list = list.slice().sort((a, b) => getItemValue(b.inst) - getItemValue(a.inst));
  }
  return list;
}

export function setInvFilter(f) {
  invFilter = f;
  if (state.currentTab === 'inventory') {
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = renderInventoryHTML();
  }
}

export function setInvSort(s) {
  invSort = s;
  if (state.currentTab === 'inventory') {
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = renderInventoryHTML();
  }
}

function filterBarHTML() {
  const f = (key, label) =>
    `<button class="inv-filter-btn ${invFilter === key ? 'active' : ''}" onclick="GameAPI.setInvFilter('${key}')">${label}</button>`;
  const s = (key, label) =>
    `<button class="inv-filter-btn ${invSort === key ? 'active' : ''}" onclick="GameAPI.setInvSort('${key}')">${label}</button>`;

  return `
    <div class="inv-controls">
      <div class="inv-filter-row">
        ${f('all', 'Все')}
        ${f('weapon', '⚔️ Оружие')}
        ${f('armor', '🥋 Броня')}
        ${f('consumable', '🧪 Расходники')}
        ${f('material', '🌿 Материалы')}
        ${f('scroll', '📜 Свитки')}
        ${f('quest', '💎 Квесты')}
      </div>
      <div class="inv-filter-row">
        <span style="color:#a89060;font-size:12px;align-self:center;">Сортировка:</span>
        ${s('default', 'По умолчанию')}
        ${s('rarity', 'По редкости ↓')}
        ${s('price', 'По цене ↓')}
      </div>
    </div>`;
}

function itemScore(inst) {
  if (!inst) return 0;
  const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
  const item = ITEMS[obj.id];
  if (!item) return 0;
  const b = obj.bonus || item.bonus || {};
  let score = (b.attack || 0) + (b.magic || 0) + (b.defense || 0);
  const forge = obj.forgeLevel || 0;
  score += FORGE_BONUS[forge] || 0;
  return score;
}

function hasBetterFor(slot, inv, eq) {
  const eqInst = eq[slot];
  const eqScore = itemScore(eqInst);
  for (const it of inv) {
    const item = ITEMS[it.id];
    if (!item || item.type !== slot) continue;
    if (itemScore(it) > eqScore) return true;
  }
  return false;
}

function renderInventoryHTML() {
  const rawInv = state.game.player.inventory;
  const eq = state.game.player.equipped;
  let html = '';

  const canUpgradeWeapon = hasBetterFor('weapon', rawInv, eq);
  const canUpgradeArmor = hasBetterFor('armor', rawInv, eq);
  if (canUpgradeWeapon || canUpgradeArmor) {
    html += `<div style="text-align:right;margin-bottom:8px;"><button onclick="GameAPI.equipBest()" class="equip-best-btn">⚡ Экипировать лучшее</button></div>`;
  }

  if (eq.weapon || eq.armor) {
    html += `<h3>Экипировано</h3><div class="item-list" style="margin-bottom:12px;">`;
    for (const slot of ['weapon', 'armor']) {
      const inst = eq[slot];
      if (!inst) continue;
      const instObj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
      const item = ITEMS[instObj.id];
      if (!item) continue;
      const rar = instObj.rarity ? RARITIES[instObj.rarity] : null;
      const borderStyle = `border-color:${rar ? rar.color : '#c9a227'};`;
      const better = hasBetterFor(slot, rawInv, eq);
      const extraClass = better ? ' slot-upgrade' : '';
      const betterBadge = better
        ? `<div class="item-desc" style="color:#60ff60;font-weight:bold;">↑ Есть предмет лучше в инвентаре</div>`
        : '';
      html += `<div class="item${extraClass}" style="${borderStyle}"
        onmouseover="GameAPI.showEqTooltip(event, '${slot}')"
        onmouseout="GameAPI.hideTooltip()">
        <div class="item-info">
          ${itemHeader(instObj, item)}
          <div class="item-desc">${item.desc}${itemBonus(instObj, item)}</div>
          ${betterBadge}
        </div>
        <button onclick="GameAPI.unequip('${slot}')" style="font-size:12px;padding:6px 12px;">Снять</button>
      </div>`;
    }
    html += `</div>`;
  }

  if (!rawInv.length) {
    html += `<p style="color:#a89060;text-align:center;padding:15px;">Инвентарь пуст</p>`;
    return html;
  }

  html += `<h3>Предметы</h3>`;
  html += filterBarHTML();

  const entries = rawInv.map((inst, idx) => ({ inst, idx }));
  const visible = filterAndSort(entries);

  if (!visible.length) {
    html += `<p style="color:#a89060;text-align:center;padding:15px;">Нет предметов в этой категории</p>`;
    return html;
  }

  html += `<div class="item-list">`;
  for (const { inst: it, idx } of visible) {
    const item = ITEMS[it.id];
    if (!item) continue;
    const rar = it.rarity ? RARITIES[it.rarity] : null;
    const borderStyle = rar && it.rarity !== 'common' ? `border-color:${rar.color};` : '';
    const qtyText = it.qty > 1 ? ' ×' + it.qty : '';
    const buttons = [];

    if (item.type === 'consumable') {
      buttons.push(`<button onclick="GameAPI.useItemOutside('${it.id}')" style="font-size:12px;padding:6px 12px;">Использовать</button>`);
    } else if (item.type === 'scroll') {
      const learned = state.game.player.spells.includes(item.spellId);
      if (learned) {
        buttons.push(`<span style="color:#60ff60;font-size:12px;padding:6px 12px;">✅ Изучено</span>`);
      } else {
        buttons.push(`<button onclick="GameAPI.useItemOutside('${it.id}')" style="font-size:12px;padding:6px 12px;">📖 Изучить</button>`);
      }
    } else if (item.type === 'weapon' || item.type === 'armor') {
      buttons.push(`<button onclick="GameAPI.equipByIndex(${idx})" style="font-size:12px;padding:6px 12px;">Экипировать</button>`);
    }

    if (item.type !== 'quest' && item.type !== 'scroll') {
      const price = getSellPrice(it);
      if (price > 0) {
        buttons.push(`<button onclick="GameAPI.sellByIndex(${idx})" class="sell-btn" style="font-size:12px;padding:6px 12px;">💰 ${price}</button>`);
      }
    }

    html += `<div class="item" style="${borderStyle}"
      onmouseover="GameAPI.showInvTooltip(event, ${idx})"
      onmouseout="GameAPI.hideTooltip()">
      <div class="item-info">
        ${itemHeader(it, item).replace('</div>', qtyText + '</div>')}
        <div class="item-desc">${item.desc}${itemBonus(it, item)}</div>
      </div>
      <div class="item-actions">${buttons.join('')}</div>
    </div>`;
  }
  html += `</div>`;
  return html;
}

function renderSpellsHTML() {
  const p = state.game.player;
  const cls = CLASSES[p.class];
  const abilities = cls.abilities || [];
  const cooldowns = p.cooldowns || {};

  let html = '';
  if (p.spells.length) {
    html += `<h3>✨ Заклинания</h3><div class="item-list">` + p.spells.map(id => {
      const sp = SPELLS[id];
      if (!sp) return '';
      const noMp = p.mp < sp.cost;
      return `<div class="item"><div class="item-info">
        <div class="item-name">${sp.icon} ${sp.name}</div>
        <div class="item-desc">${sp.desc} · ${sp.cost} MP${noMp ? ' <span style="color:#ff6060;">(мало MP)</span>' : ''}</div>
      </div></div>`;
    }).join('') + `</div>`;
  } else {
    html += `<p style="color:#a89060;text-align:center;padding:15px;">Вы не знаете заклинаний</p>`;
  }

  if (abilities.length) {
    html += `<h3 style="margin-top:15px;">🌟 Способности класса <span style="color:#a89060;font-size:13px;font-weight:normal;">(в бою — [6])</span></h3>`;
    html += `<div class="item-list">`;
    html += abilities.map(a => {
      const passive = !!a.passive;
      const cd = cooldowns[a.id] || 0;
      const noMp = !passive && p.mp < (a.cost || 0);
      let statusHtml = '';
      if (passive) {
        statusHtml = `<span class="ability-status passive">🔒 пассив</span>`;
      } else if (cd > 0) {
        statusHtml = `<span class="ability-status cooldown">⌛ ${cd} ${cd === 1 ? 'ход' : 'хода'}</span>`;
      } else if (noMp) {
        statusHtml = `<span class="ability-status nomana">⚠️ мало MP</span>`;
      } else {
        statusHtml = `<span class="ability-status ready">✅ Готова</span>`;
      }

      const meta = passive ? 'пассивная' : `${a.cost || 0} MP · кулдаун ${a.cooldown} х.`;

      return `<div class="item ability-item">
        <div class="item-info">
          <div class="item-name">${a.icon} ${a.name}</div>
          <div class="item-desc">${a.desc} · ${meta}</div>
        </div>
        ${statusHtml}
      </div>`;
    }).join('');
    html += `</div>`;
  }

  return html;
}

function renderQuestsHTML() {
  const done = Object.values(state.game.shards).filter(Boolean).length;
  const items = STORY.quests.map(q => {
    const c = state.game.quests[q.id];
    return `<div class="item" style="${c ? 'border-color:#60ff60;' : ''}">
      <div class="item-info">
        <div class="item-name">${c ? '✅' : '⏳'} ${q.name}</div>
        <div class="item-desc">${q.desc}</div>
      </div></div>`;
  }).join('');
  return `<h3>Осколки Кристалла: ${done}/3</h3><div class="item-list">${items}</div>`;
}

function renderAchievementsHTML() {
  const unlocked = state.game.player.achievements || [];
  const total = ACHIEVEMENTS.length;
  const got = unlocked.length;

  const items = ACHIEVEMENTS.map(a => {
    const done = unlocked.includes(a.id);
    let progressText = '';
    if (!done && a.progress && a.target !== undefined) {
      let cur = 0;
      try { cur = a.progress(state.game); } catch (e) { cur = 0; }
      cur = Math.min(cur, a.target);
      progressText = ` <span style="color:#60ff60;">(${cur}/${a.target})</span>`;
    }
    return `<div class="achievement ${done ? 'done' : ''}">
      <div class="achievement-icon">${done ? a.icon : '🔒'}</div>
      <div class="achievement-body">
        <div class="achievement-name">${done ? a.name : '???'}</div>
        <div class="achievement-desc">${a.desc}${progressText}</div>
        <div class="achievement-reward">${done ? `✅ Получено (+${a.reward}💰)` : `🎁 ${a.reward}💰`}</div>
      </div>
    </div>`;
  }).join('');

  const pct = total > 0 ? Math.round((got / total) * 100) : 0;

  return `
    <h3>🏆 Достижения: ${got}/${total} <span style="color:#a89060;font-size:14px;">(${pct}%)</span></h3>
    <div class="achievement-list">${items}</div>`;
}

function renderTalentsHTML() {
  const p = state.game.player;
  const allTalents = getClassTalents(p.class);
  const taken = getTakenTalents(p);
  const available = getAvailableTalents(p);
  const nextTier = getNextTierLevel(p);

  let html = '';

  if (available.length) {
    html += `<h3>🌳 Доступные таланты <span style="color:#60ff60;font-size:14px;">(${available.length})</span></h3>`;
    html += `<p style="color:#a89060;font-size:12px;margin-bottom:10px;">Выбери один из двух. Изменить выбор нельзя.</p>`;
    html += `<div class="talents-grid">`;
    html += available.map(t => `
      <div class="talent-card">
        <div class="talent-icon">${t.icon}</div>
        <div class="talent-name">${t.name}</div>
        <div class="talent-tier">Уровень ${t.tier}</div>
        <div class="talent-desc">${t.desc}</div>
        <button onclick="GameAPI.takeTalent('${t.id}')" class="talent-btn">Выбрать</button>
      </div>
    `).join('');
    html += `</div>`;
  } else if (nextTier) {
    html += `<div class="talent-next-hint">
      🌳 Следующий выбор таланта откроется на <b>${nextTier} уровне</b><br>
      <small style="color:#a89060;">Сейчас у тебя ${p.level} уровень</small>
    </div>`;
  } else {
    html += `<div class="talent-next-hint">🌟 Все таланты взяты! Ты — легенда.</div>`;
  }

  if (taken.length) {
    html += `<h3 style="margin-top:20px;">Взятые таланты (${taken.length}/${allTalents.length / 2})</h3>`;
    html += `<div class="talents-grid">`;
    html += taken.map(t => `
      <div class="talent-card taken">
        <div class="talent-icon">${t.icon}</div>
        <div class="talent-name">${t.name}</div>
        <div class="talent-tier">Уровень ${t.tier}</div>
        <div class="talent-desc">${t.desc}</div>
        <div class="talent-badge">✅ Взят</div>
      </div>
    `).join('');
    html += `</div>`;
  }

  return html;
}

function renderStatisticsHTML() {
  const p = state.game.player;
  const s = p.stats || {};
  const kills = s.kills || {};

  const totalKillsVal = Object.values(kills).reduce((a, b) => a + b, 0);
  const deaths = s.deaths || 0;
  const goldEarned = s.goldEarned || 0;
  const chestsOpened = s.chestsOpened || 0;
  const playtimeSec = p.playtimeSec || 0;
  const eliteKills = s.eliteKills || 0;
  const bossKills = s.bossKills || 0;
  const riftBest = p.riftBest || 0;
  const ngPlus = p.ngPlus || 0;
  const achievementsCount = (p.achievements || []).length;

  const hours = Math.floor(playtimeSec / 3600);
  const minutes = Math.floor((playtimeSec % 3600) / 60);
  const playtimeStr = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;

  const killRows = Object.entries(kills)
    .filter(([id, n]) => n > 0 && ENEMIES[id])
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => {
      const def = ENEMIES[id];
      return `<div class="stat-row"><span>${def.emoji} ${def.name}</span><span class="stat-val">${n}</span></div>`;
    }).join('');

  return `
    <h3>📊 Статистика</h3>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">⚔️ Убийств</div><div class="stat-value">${totalKillsVal}</div></div>
      <div class="stat-card"><div class="stat-label">💀 Смертей</div><div class="stat-value">${deaths}</div></div>
      <div class="stat-card"><div class="stat-label">💰 Золота заработано</div><div class="stat-value">${goldEarned}</div></div>
      <div class="stat-card"><div class="stat-label">📦 Сундуков</div><div class="stat-value">${chestsOpened}</div></div>
      <div class="stat-card"><div class="stat-label">★ Элитных убито</div><div class="stat-value">${eliteKills}</div></div>
      <div class="stat-card"><div class="stat-label">☠️ Боссов убито</div><div class="stat-value">${bossKills}</div></div>
      <div class="stat-card"><div class="stat-label">🏆 Достижений</div><div class="stat-value">${achievementsCount}/${ACHIEVEMENTS.length}</div></div>
      <div class="stat-card"><div class="stat-label">🌀 Рекорд Разлома</div><div class="stat-value">${riftBest}</div></div>
      <div class="stat-card"><div class="stat-label">🔄 NG+</div><div class="stat-value">${ngPlus}</div></div>
      <div class="stat-card"><div class="stat-label">⏱️ Время в игре</div><div class="stat-value">${playtimeStr}</div></div>
    </div>
    ${killRows ? `<h3 style="margin-top:15px;">Детали по врагам</h3><div class="kill-list">${killRows}</div>` : '<p style="color:#a89060;text-align:center;padding:15px;">Ещё никого не убил — начни с гоблинов в Тёмном лесу</p>'}
  `;
}

export function travelTo(locId) {
  state.game.location = locId;
  emit('log', { channel: 'game', msg: `Вы прибыли в ${LOCATIONS[locId].name}.`, cls: 'info' });
  saveGame();
  renderGame();
}

export function enterOverworldFromUI() {
  enterOverworld(state.game.location);
}

export function useItemOutside(id) {
  const item = ITEMS[id];
  if (item && item.combatOnly) {
    toast('Можно использовать только в бою');
    return;
  }
  if (item && item.type === 'scroll') {
    if (state.game.player.spells.includes(item.spellId)) {
      toast('Уже изучено');
      return;
    }
  }
  const ok = useItem(id);
  if (!ok) return;
  if (item.type === 'scroll') {
    toast(`📖 Изучено: ${SPELLS[item.spellId].name}`);
  } else {
    toast(`Использовано: ${ITEMS[id].name}`);
  }
  saveGame();
  renderGame();
}

export function equipItemByIndexUI(idx) {
  equipItemByIndex(idx);
  toast(`Экипировано`);
  saveGame();
  renderGame();
}

export function equipBestUI() {
  const changed = equipBest();
  if (changed) {
    toast('⚡ Экипировано лучшее');
    saveGame();
    renderGame();
  } else {
    toast('Всё уже оптимально');
  }
}

export function unequipItemUI(slot) {
  unequipItemBySlot(slot);
  saveGame();
  renderGame();
}

export function sellItemByIndexUI(idx) {
  const ok = sellItemByIndex(idx);
  if (ok) renderGame();
}

export function openShop() {
  const p = state.game.player;
  const html = SHOP_ITEMS.map(id => {
    const item = ITEMS[id];
    return `<div class="item"
      onmouseover="GameAPI.showShopTooltip(event, '${id}')"
      onmouseout="GameAPI.hideTooltip()">
      <div class="item-info">
        <div class="item-name">${item.icon} ${item.name}</div>
        <div class="item-desc">${item.desc} · 💰 ${item.price}</div>
      </div>
      <button onclick="GameAPI.buy('${id}')" ${p.gold < item.price ? 'disabled' : ''} style="font-size:12px;padding:6px 12px;">Купить</button>
    </div>`;
  }).join('');
  document.getElementById('tab-content').innerHTML = `<h3>🛒 Магазин</h3><div class="item-list">${html}</div>
    <button onclick="GameAPI.backToVillage()" style="width:100%;margin-top:15px;">← Назад</button>`;
}

export function showShopTooltip(e, id) {
  const inst = { id, qty: 1, rarity: 'common' };
  renderTooltip(e, inst);
}

export function buyItemUI(id) {
  if (buyItem(id)) {
    renderHeader();
    openShop();
  }
}

export function backToVillage() {
  switchTab('locations');
}

export function upgradeEquipmentUI(slot) {
  const res = upgradeEquipment(slot);
  if (!res.ok && res.msg) toast(res.msg);
  renderHeader();
  openBlacksmith();
}

export function healAtHealerUI() {
  const res = healAtHealer();
  if (!res.ok && res.msg) toast(res.msg);
  renderHeader();
  openHealer();
}

export function craftRecipeUI(recipeId) {
  const res = craftRecipe(recipeId);
  if (!res.ok && res.msg) toast(res.msg);
  renderHeader();
  openAlchemist();
}

export function takeTalentUI(id) {
  const p = state.game.player;
  const ok = takeTalent(p, id);
  if (ok) {
    saveGame();
    renderGame();
  }
}

const TYPE_LABELS = {
  weapon: 'Оружие',
  armor: 'Броня',
  consumable: 'Расходник',
  material: 'Материал',
  scroll: 'Свиток',
  quest: 'Квестовый предмет'
};

function buildCompareHTML(inst, item) {
  if (item.type !== 'weapon' && item.type !== 'armor') return '';
  const p = state.game.player;
  const eqInst = p.equipped[item.type];
  if (!eqInst) {
    return `<div class="tooltip-compare"><div style="color:#60ff60;">Слот пуст — можно экипировать</div></div>`;
  }
  const eqObj = typeof eqInst === 'string' ? { id: eqInst, qty: 1 } : eqInst;
  const oldB = eqObj.bonus || ITEMS[eqObj.id]?.bonus || {};
  const newB = inst.bonus || item.bonus || {};

  const lines = [];
  for (const key of ['attack', 'magic', 'defense']) {
    const newV = newB[key] || 0;
    const oldV = oldB[key] || 0;
    if (newV === 0 && oldV === 0) continue;
    const diff = newV - oldV;
    const label = key === 'attack' ? 'Атака' : key === 'magic' ? 'Магия' : 'Защита';
    if (diff === 0) {
      lines.push(`<div style="color:#a89060;">${label}: ${newV} (как сейчас)</div>`);
    } else if (diff > 0) {
      lines.push(`<div style="color:#60ff60;">${label}: ${newV} (+${diff})</div>`);
    } else {
      lines.push(`<div style="color:#ff6060;">${label}: ${newV} (${diff})</div>`);
    }
  }

  const newForge = inst.forgeLevel || 0;
  const oldForge = eqObj.forgeLevel || 0;
  const newForgeBonus = FORGE_BONUS[newForge] || 0;
  const oldForgeBonus = FORGE_BONUS[oldForge] || 0;
  if (newForgeBonus > 0 || oldForgeBonus > 0) {
    const label = item.type === 'armor' ? 'Защита (ковка)' : (item.bonus && item.bonus.magic !== undefined) ? 'Магия (ковка)' : 'Атака (ковка)';
    const diff = newForgeBonus - oldForgeBonus;
    const color = diff > 0 ? '#60ff60' : diff < 0 ? '#ff6060' : '#a89060';
    lines.push(`<div style="color:${color};">⚒️ ${label}: +${newForgeBonus}${diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''}</div>`);
  }

  return lines.length ? `<div class="tooltip-compare">${lines.join('')}</div>` : '';
}

function buildTooltipHTML(inst) {
  const item = ITEMS[inst.id];
  if (!item) return '';
  const rar = inst.rarity ? RARITIES[inst.rarity] : null;
  const color = rar ? rar.color : '#c9a227';
  const label = rar && inst.rarity !== 'common' ? ` [${rar.name}]` : '';
  const forgeLabel = inst.forgeLevel ? ` +${inst.forgeLevel}` : '';
  const typeName = TYPE_LABELS[item.type] || '';

  const b = inst.bonus || item.bonus;
  const statLines = [];
  if (b) {
    if (b.attack) statLines.push(`+${b.attack} к атаке`);
    if (b.magic) statLines.push(`+${b.magic} к магии`);
    if (b.defense) statLines.push(`+${b.defense} к защите`);
  }
  const forge = inst.forgeLevel || 0;
  if (forge > 0) {
    const fb = FORGE_BONUS[forge] || 0;
    const target = item.type === 'armor' ? 'защите' : (item.bonus && item.bonus.magic !== undefined) ? 'магии' : 'атаке';
    statLines.push(`<span style="color:#ffd060;">⚒️ +${fb} к ${target} (уровень +${forge})</span>`);
  }

  return `
    <div class="tooltip-title" style="color:${color};">${item.icon} ${item.name}${label}${forgeLabel}</div>
    <div class="tooltip-type">${typeName}</div>
    <div class="tooltip-desc">${item.desc}</div>
    ${statLines.length ? `<div class="tooltip-stats">${statLines.join('<br>')}</div>` : ''}
    ${buildCompareHTML(inst, item)}
    ${item.price ? `<div class="tooltip-price">💰 ${item.price}</div>` : ''}
  `;
}

function positionTooltip(e, div) {
  const rect = div.getBoundingClientRect();
  const pad = 16;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - pad;
  if (x < 10) x = 10;
  if (y < 10) y = 10;
  div.style.left = x + 'px';
  div.style.top = y + 'px';
}

function renderTooltip(e, inst) {
  hideTooltip();
  if (!inst) return;
  const div = document.createElement('div');
  div.id = 'item-tooltip';
  div.className = 'item-tooltip';
  div.innerHTML = buildTooltipHTML(inst);
  document.body.appendChild(div);
  positionTooltip(e, div);
}

export function showInvTooltip(e, idx) {
  const inst = state.game.player.inventory[idx];
  renderTooltip(e, inst);
}

export function showEqTooltip(e, slot) {
  let inst = state.game.player.equipped[slot];
  if (!inst) return;
  if (typeof inst === 'string') inst = { id: inst, qty: 1 };
  renderTooltip(e, inst);
}

export function hideTooltip() {
  const el = document.getElementById('item-tooltip');
  if (el) el.remove();
}