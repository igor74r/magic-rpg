import { state } from '../systems/state.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { SPELLS } from '../data/spells.js';
import { FORGE_BONUS } from '../data/npcs.js';
import {
  useItem, equipItemByIndex, unequipItemBySlot, equipBest,
  EQUIPMENT_SLOTS, EQUIPMENT_TYPES, SLOT_TYPES, socketRune
} from '../systems/inventory.js';
import { sellItemByIndex, getSellPrice } from '../systems/shop.js';
import { saveGame } from '../systems/save.js';
import { toast } from './screens.js';
import { renderGame } from './header.js';

let invFilter = 'all';
let invSort = 'default';

const FILTER_TYPES = {
  weapon: ['weapon'],
  armor: ['armor', 'chest', 'head', 'helmet', 'shoulders', 'back', 'wrists', 'bracers', 'hands', 'gloves', 'legs', 'boots'],
  accessory: ['amulet', 'ring', 'seal'],
  consumable: ['consumable'],
  material: ['material'],
  rune: ['rune'],
  scroll: ['scroll'],
  quest: ['quest']
};
const SLOT_INFO = [
  ['head', 'Голова', '⛑️'],
  ['shoulders', 'Плечи', '🛡️'],
  ['chest', 'Грудь', '🥋'],
  ['back', 'Спина', '🧥'],
  ['wrists', 'Запястья', '🔗'],
  ['hands', 'Кисти рук', '🧤'],
  ['legs', 'Ноги', '🥾'],
  ['weapon', 'Оружие', '⚔️'],
  ['ring1', 'Палец 1', '💍'],
  ['ring2', 'Палец 2', '💍'],
  ['amulet', 'Амулет', '🔮'],
  ['seal', 'Печать', '🔰']
];
const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };

function getItemValue(inst) {
  const item = ITEMS[inst.id];
  const mult = inst.rarity ? (RARITIES[inst.rarity]?.multiplier || 1) : 1;
  return (item?.price || 0) * mult * (inst.qty || 1);
}

function itemScore(inst) {
  if (!inst) return 0;
  const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
  const item = ITEMS[obj.id];
  if (!item) return 0;
  const b = { ...(item.bonus || {}), ...(obj.bonus || {}) };
  let score = (b.attack || 0) + (b.magic || 0) + (b.defense || 0);
  score += (b.dex || 0) + (b.armorPen || 0) * 2;
  score += (b.dodgeChance || 0) * 100 + (b.critChance || 0) * 100;
  score += (b.blockChance || 0) * 80 + (b.blockPower || 0) * 60;
  for (const id of (obj.runes || [])) {
    const rune = ITEMS[id]?.runeBonus || {};
    score += (rune.attack || 0) + (rune.magic || 0) + (rune.defense || 0);
    score += (rune.critChance || 0) * 100 + (rune.dodgeChance || 0) * 100;
  }
  score += FORGE_BONUS[obj.forgeLevel || 0] || 0;
  return score;
}

function hasBetterEquipment(p) {
  const inv = p.inventory || [];
  return EQUIPMENT_SLOTS.some(slot => {
    const types = SLOT_TYPES[slot] || [];
    const current = itemScore(p.equipped?.[slot]);
    return inv.some(inst => types.includes(ITEMS[inst.id]?.type) && itemScore(inst) > current);
  });
}

function getJunkCount() {
  const p = state.game.player;
  let count = 0;
  for (const inst of p.inventory || []) {
    const item = ITEMS[inst.id];
    if (!item || !EQUIPMENT_TYPES.has(item.type)) continue;
    if (inst.rarity && inst.rarity !== 'common') continue;

    const slots = EQUIPMENT_SLOTS.filter(slot => (SLOT_TYPES[slot] || []).includes(item.type));
    const weakest = Math.min(...slots.map(slot => itemScore(p.equipped?.[slot])));
    if (itemScore(inst) > weakest) continue;
    count++;
  }
  return count;
}

function filterAndSort(entries) {
  let list = entries;
  if (invFilter !== 'all') {
    const types = FILTER_TYPES[invFilter] || [invFilter];
    list = list.filter(({ inst }) => types.includes(ITEMS[inst.id]?.type));
  }
  if (invSort === 'rarity') {
    list = list.slice().sort((a, b) =>
      (RARITY_ORDER[b.inst.rarity || 'common'] || 0) -
      (RARITY_ORDER[a.inst.rarity || 'common'] || 0)
    );
  } else if (invSort === 'price') {
    list = list.slice().sort((a, b) => getItemValue(b.inst) - getItemValue(a.inst));
  } else if (invSort === 'type') {
    list = list.slice().sort((a, b) =>
      (ITEMS[a.inst.id]?.type || '').localeCompare(ITEMS[b.inst.id]?.type || '')
    );
  }
  return list;
}

export function setInvFilter(filter) {
  invFilter = filter;
  if (state.currentTab === 'inventory') {
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = renderInventory();
  }
}

export function setInvSort(sort) {
  invSort = sort;
  if (state.currentTab === 'inventory') {
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = renderInventory();
  }
}

function filterBarHTML() {
  const filters = [
    ['all', 'Все'], ['weapon', '⚔️ Оружие'], ['armor', '🛡️ Броня'],
    ['accessory', '💍 Украшения'], ['consumable', '🧪 Расходники'],
    ['material', '🌿 Материалы'], ['rune', 'ᛉ Руны'],
    ['scroll', '📜 Свитки'], ['quest', '💎 Квесты']
  ];
  const f = ([key, label]) =>
    `<button class="inv-filter-btn ${invFilter === key ? 'active' : ''}" onclick="GameAPI.setInvFilter('${key}')">${label}</button>`;
  const s = (key, label) =>
    `<button class="inv-filter-btn ${invSort === key ? 'active' : ''}" onclick="GameAPI.setInvSort('${key}')">${label}</button>`;
  return `
    <div class="inv-controls">
      <div class="inv-filter-row">${filters.map(f).join('')}</div>
      <div class="inv-filter-row">
        <span class="inv-sort-label">Сортировка:</span>
        ${s('default', 'Порядок получения')}
        ${s('rarity', 'Редкость ↓')}
        ${s('price', 'Цена ↓')}
        ${s('type', 'Тип')}
      </div>
    </div>
  `;
}

function formatBonus(inst, item) {
  const bonus = { ...(item.bonus || {}), ...(inst.bonus || {}) };
  for (const runeId of (inst.runes || [])) {
    for (const [key, value] of Object.entries(ITEMS[runeId]?.runeBonus || {})) {
      bonus[key] = (bonus[key] || 0) + value;
    }
  }
  const labels = {
    attack: 'атака', magic: 'магия', defense: 'защита',
    dex: 'ловкость', armorPen: 'пробитие брони'
  };
  const percent = {
    dodgeChance: 'уклонение', blockChance: 'шанс блока',
    blockPower: 'сила блока', critChance: 'крит'
  };
  const parts = [];
  for (const [key, label] of Object.entries(labels)) {
    if (bonus[key]) parts.push(`+${bonus[key]} ${label}`);
  }
  for (const [key, label] of Object.entries(percent)) {
    if (bonus[key]) parts.push(`+${Math.round(bonus[key] * 100)}% ${label}`);
  }
  return parts.join(' · ');
}

function renderPaperdoll(p) {
  const eq = p.equipped || {};
  const slots = SLOT_INFO.map(([slot, label, icon]) => {
    const inst = eq[slot];
    if (!inst) {
      return `
        <div class="gear-slot empty">
          <span class="gear-slot-icon">${icon}</span>
          <span class="gear-slot-label">${label}</span>
          <span class="gear-slot-name">Пусто</span>
        </div>`;
    }
    const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
    const item = ITEMS[obj.id];
    if (!item) return '';
    const color = RARITIES[obj.rarity]?.color || '#c9a227';
    const runes = (obj.runes || []).length;
    const sockets = obj.sockets ?? item.sockets ?? 0;
    return `
      <div class="gear-slot filled" style="--gear-color:${color}"
        onmouseover="GameAPI.showEqTooltip(event, '${slot}')"
        onmouseout="GameAPI.hideTooltip()">
        <span class="gear-slot-icon">${item.icon}</span>
        <span class="gear-slot-label">${label}</span>
        <span class="gear-slot-name">${item.name}${obj.forgeLevel ? ` +${obj.forgeLevel}` : ''}</span>
        <span class="gear-slot-sockets">${sockets ? `◈ ${runes}/${sockets}` : ''}</span>
        <button class="gear-slot-remove" onclick="GameAPI.unequip('${slot}')" title="Снять">×</button>
      </div>`;
  }).join('');

  return `
    <section class="paperdoll-panel rpg-paperdoll">
      <div class="paperdoll-hero">
        <div class="paperdoll-silhouette">${CLASSES[p.class]?.emoji || '🧙'}</div>
        <b>${p.name || 'Герой'}</b>
        <small>Уровень ${p.level || 1}</small>
      </div>
      <div class="equipment-slots">${slots}</div>
      <div class="paperdoll-set-bonus">Экипировка усиливает характеристики и боевые параметры.</div>
    </section>
  `;
}

export function renderInventory() {
  const p = state.game.player;
  if (!Array.isArray(p.inventory)) p.inventory = [];
  const hasBetter = hasBetterEquipment(p);
  const junkCount = getJunkCount();
  const entries = p.inventory.map((inst, idx) => ({ inst, idx }));
  const visible = filterAndSort(entries);
  const counts = {
    all: entries.length,
    equipment: entries.filter(({ inst }) => EQUIPMENT_TYPES.has(ITEMS[inst.id]?.type)).length,
    consumable: entries.filter(({ inst }) => ITEMS[inst.id]?.type === 'consumable').length
  };

  let actions = '';
  if (hasBetter || junkCount) {
    actions = `
      <div class="inv-top-actions">
        ${hasBetter ? '<button onclick="GameAPI.equipBest()" class="equip-best-btn">⚡ Экипировать лучшее</button>' : ''}
        ${junkCount ? `<button onclick="GameAPI.sellJunk()" class="inv-sell-junk">💰 Продать слабое (${junkCount})</button>` : ''}
      </div>`;
  }

  let grid = '';
  const minSlots = Math.max(32, Math.ceil(visible.length / 8) * 8);
  for (let i = 0; i < minSlots; i++) {
    if (i < visible.length) {
      const { inst, idx } = visible[i];
      const item = ITEMS[inst.id];
      if (!item) {
        grid += '<div class="inv-slot empty"></div>';
        continue;
      }
      const rarity = inst.rarity || 'common';
      const qty = (inst.qty || 1) > 1 ? `<span class="slot-qty">${inst.qty}</span>` : '';
      const socket = EQUIPMENT_TYPES.has(item.type) && (inst.sockets ?? item.sockets)
        ? '<span class="slot-socket">◈</span>' : '';
      grid += `
        <button type="button" class="inv-slot has-item ${rarity}"
          onmouseover="GameAPI.showInvTooltip(event, ${idx})"
          onmouseout="GameAPI.hideTooltip()"
          onclick="GameAPI.invSlotClick(${idx})"
          aria-label="${item.name}">
          <span class="slot-icon">${item.icon}</span>${qty}${socket}
        </button>`;
    } else {
      grid += '<div class="inv-slot empty"></div>';
    }
  }

  return `
    <div class="inv-layout rpg-inventory-layout">
      ${renderPaperdoll(p)}
      <section class="backpack-panel rpg-backpack">
        ${actions}
        <div class="inv-title-row">
          <div><h3>🎒 Сумка героя</h3><small>${counts.all} предметов · ${counts.equipment} экипировки · ${counts.consumable} расходников</small></div>
          <div class="inv-wallet">💰 ${p.gold || 0}</div>
        </div>
        ${filterBarHTML()}
        <div class="inv-grid rpg-inv-grid">${grid}</div>
        <p class="inv-hint">Нажми на предмет, чтобы надеть или использовать. Руна устанавливается в свободное гнездо. Наведи курсор для сравнения характеристик.</p>
      </section>
    </div>
  `;
}

export function invSlotClick(idx) {
  const p = state.game.player;
  const inst = p.inventory[idx];
  if (!inst) return;
  const item = ITEMS[inst.id];
  if (!item) return;

  if (EQUIPMENT_TYPES.has(item.type)) {
    const slot = equipItemByIndex(idx);
    if (!slot) return;
    toast(`Надето: ${item.name}`);
    saveGame();
    renderGame();
  } else if (item.type === 'consumable') {
    useItemOutside(inst.id);
  } else if (item.type === 'scroll') {
    useItemOutside(inst.id);
  } else if (item.type === 'rune') {
    openRuneSocketMenu(idx);
  } else if (item.type === 'quest') {
    toast('Квестовый предмет хранится в сумке и не продаётся.');
  } else {
    toast('Материал можно использовать у ремесленников.');
  }
}

function openRuneSocketMenu(inventoryIndex) {
  const p = state.game.player;
  const runeItem = ITEMS[p.inventory[inventoryIndex]?.id];
  const candidates = SLOT_INFO.map(([slot, label]) => {
    const raw = p.equipped?.[slot];
    if (!raw) return null;
    const inst = typeof raw === 'string' ? { id: raw, sockets: ITEMS[raw]?.sockets || 0, runes: [] } : raw;
    const item = ITEMS[inst.id];
    const sockets = inst.sockets ?? item?.sockets ?? 0;
    const runes = inst.runes || [];
    if (sockets <= runes.length) return null;
    return { slot, label, inst, item, sockets, used: runes.length };
  }).filter(Boolean);

  if (!candidates.length) {
    toast('Нет экипировки со свободным гнездом.');
    return;
  }
  document.getElementById('rune-socket-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'rune-socket-overlay';
  overlay.className = 'rune-socket-overlay';
  overlay.innerHTML = `
    <div class="rune-socket-dialog">
      <h3>${runeItem.icon} ${runeItem.name}</h3>
      <p>${runeItem.desc}</p>
      <b>Выберите предмет для установки:</b>
      <div class="rune-socket-options">
        ${candidates.map(c => `
          <button onclick="GameAPI.socketRune(${inventoryIndex}, '${c.slot}')">
            <span>${c.item.icon} ${c.label}: ${c.item.name}</span>
            <small>Свободно гнёзд: ${c.sockets - c.used}</small>
          </button>`).join('')}
      </div>
      <button class="rune-socket-cancel" onclick="document.getElementById('rune-socket-overlay')?.remove()">Отмена</button>
    </div>`;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

export function socketRuneUI(inventoryIndex, equipmentSlot) {
  if (!socketRune(inventoryIndex, equipmentSlot)) {
    toast('Не удалось установить руну: проверьте свободное гнездо.');
    return;
  }
  document.getElementById('rune-socket-overlay')?.remove();
  saveGame();
  toast('ᛉ Руна установлена. Характеристики обновлены.');
  renderGame();
}

export function useItemOutside(id) {
  const item = ITEMS[id];
  if (item?.combatOnly) {
    toast('Этот предмет можно использовать только в бою.');
    return;
  }
  if (item?.type === 'scroll' && state.game.player.spells.includes(item.spellId)) {
    toast('Это заклинание уже изучено.');
    return;
  }
  if (!useItem(id)) return;
  if (item.type === 'scroll') toast(`📖 Изучено: ${SPELLS[item.spellId]?.name || item.spellId}`);
  else toast(`Использовано: ${item.name}`);
  saveGame();
  renderGame();
}

export function equipItemByIndexUI(idx) {
  const slot = equipItemByIndex(idx);
  if (!slot) return;
  toast('Экипировка обновлена.');
  saveGame();
  renderGame();
}

export function equipBestUI() {
  const changed = equipBest();
  if (changed) {
    toast('⚡ Лучшие предметы надеты.');
    saveGame();
    renderGame();
  } else {
    toast('Сейчас экипированы лучшие доступные предметы.');
  }
}

export function unequipItemUI(slot) {
  if (!unequipItemBySlot(slot)) return;
  saveGame();
  renderGame();
}

export function sellItemByIndexUI(idx) {
  const ok = sellItemByIndex(idx);
  if (ok) renderGame();
}

export function sellJunkUI() {
  const p = state.game.player;
  let totalGold = 0;
  let count = 0;
  for (let i = p.inventory.length - 1; i >= 0; i--) {
    const inst = p.inventory[i];
    const item = ITEMS[inst.id];
    if (!item || ['quest', 'scroll', 'consumable', 'material', 'rune'].includes(item.type)) continue;
    if (inst.rarity && inst.rarity !== 'common') continue;
    const slots = EQUIPMENT_SLOTS.filter(slot => (SLOT_TYPES[slot] || []).includes(item.type));
    const weakest = Math.min(...slots.map(slot => itemScore(p.equipped?.[slot])));
    if (itemScore(inst) > weakest) continue;
    const price = getSellPrice(inst);
    if (price > 0) {
      totalGold += price;
      count++;
      p.inventory.splice(i, 1);
    }
  }
  if (!count) {
    toast('Нет обычных слабых предметов для продажи.');
    return;
  }
  p.gold += totalGold;
  saveGame();
  toast(`Продано: ${count} предметов (+${totalGold}💰)`);
  renderGame();
}

const TYPE_LABELS = {
  weapon: 'Оружие', armor: 'Доспех', chest: 'Нагрудник', helmet: 'Головной убор',
  head: 'Головной убор', shoulders: 'Наплечье', back: 'Плащ', wrists: 'Наручи',
  bracers: 'Наручи', gloves: 'Перчатки', hands: 'Перчатки', boots: 'Обувь',
  legs: 'Поножи', amulet: 'Амулет', ring: 'Кольцо', seal: 'Печать', consumable: 'Расходник',
  material: 'Материал', rune: 'Руна', scroll: 'Свиток', quest: 'Квестовый предмет'
};

function getSlotForItem(item, p) {
  if (!EQUIPMENT_TYPES.has(item.type)) return null;
  if (item.type === 'ring') {
    if (!p.equipped?.ring1) return 'ring1';
    if (!p.equipped?.ring2) return 'ring2';
    return itemScore(p.equipped.ring1) <= itemScore(p.equipped.ring2) ? 'ring1' : 'ring2';
  }
  return EQUIPMENT_SLOTS.find(slot =>
    slot !== 'ring1' && slot !== 'ring2' &&
    (SLOT_TYPES[slot] || []).includes(item.type)
  ) || null;
}

function buildCompareHTML(inst, item) {
  if (!EQUIPMENT_TYPES.has(item.type)) return '';
  const p = state.game.player;
  const slot = getSlotForItem(item, p);
  const eqInst = p.equipped?.[slot];
  const eqObj = typeof eqInst === 'string' ? { id: eqInst, qty: 1 } : eqInst;
  const oldBonus = eqObj ? { ...(ITEMS[eqObj.id]?.bonus || {}), ...(eqObj.bonus || {}) } : {};
  const newBonus = { ...(item.bonus || {}), ...(inst.bonus || {}) };
  const lines = [];
  const stats = [
    ['attack', 'Атака'], ['magic', 'Магия'], ['defense', 'Защита'],
    ['dex', 'Ловкость'], ['armorPen', 'Пробитие брони']
  ];
  for (const [key, label] of stats) {
    const diff = (newBonus[key] || 0) - (oldBonus[key] || 0);
    if (diff) lines.push(`<div class="${diff > 0 ? 'compare-up' : 'compare-down'}">${label}: ${diff > 0 ? '+' : ''}${diff}</div>`);
  }
  const percents = [
    ['dodgeChance', 'Уклонение'], ['blockChance', 'Шанс блока'],
    ['blockPower', 'Сила блока'], ['critChance', 'Крит']
  ];
  for (const [key, label] of percents) {
    const diff = (newBonus[key] || 0) - (oldBonus[key] || 0);
    if (diff) lines.push(`<div class="${diff > 0 ? 'compare-up' : 'compare-down'}">${label}: ${diff > 0 ? '+' : ''}${Math.round(diff * 100)}%</div>`);
  }
  return lines.length ? `<div class="tooltip-compare"><b>Сравнение с: ${eqObj ? ITEMS[eqObj.id]?.name : 'пустым слотом'}</b>${lines.join('')}</div>` : '';
}

function buildTooltipHTML(inst) {
  const item = ITEMS[inst.id];
  if (!item) return '';
  const rarity = RARITIES[inst.rarity];
  const color = rarity?.color || '#c9a227';
  const rarityLabel = rarity && inst.rarity !== 'common' ? ` · ${rarity.name}` : '';
  const stats = item.runeBonus ? formatBonus({ bonus: item.runeBonus }, { bonus: item.runeBonus }) : formatBonus(inst, item);
  const sockets = EQUIPMENT_TYPES.has(item.type)
    ? `<div class="tooltip-sockets">Гнёзда: ${(inst.runes || []).length}/${inst.sockets ?? item.sockets ?? 0} ${(inst.runes || []).map(id => ITEMS[id]?.icon || 'ᛉ').join(' ')}</div>`
    : '';
  return `
    <div class="tooltip-title" style="color:${color}">${item.icon} ${item.name}${rarityLabel}${inst.forgeLevel ? ` +${inst.forgeLevel}` : ''}</div>
    <div class="tooltip-type">${TYPE_LABELS[item.type] || item.type}</div>
    <div class="tooltip-desc">${item.desc}</div>
    ${stats ? `<div class="tooltip-stats">${stats}</div>` : ''}
    ${sockets}
    ${buildCompareHTML(inst, item)}
    ${item.price ? `<div class="tooltip-price">Цена: ${item.price}💰</div>` : ''}
    ${(inst.qty || 1) > 1 ? `<div class="tooltip-type">В стопке: ${inst.qty}</div>` : ''}
  `;
}

function positionTooltip(e, div) {
  const rect = div.getBoundingClientRect();
  const pad = 16;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - pad;
  div.style.left = Math.max(10, x) + 'px';
  div.style.top = Math.max(10, y) + 'px';
}

export function renderTooltip(e, inst) {
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
  renderTooltip(e, state.game.player.inventory[idx]);
}

export function showEqTooltip(e, slot) {
  let inst = state.game.player.equipped?.[slot];
  if (!inst) return;
  if (typeof inst === 'string') inst = { id: inst, qty: 1 };
  renderTooltip(e, inst);
}

export function hideTooltip() {
  document.getElementById('item-tooltip')?.remove();
}
