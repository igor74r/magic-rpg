import { state } from '../systems/state.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { SPELLS } from '../data/spells.js';
import { FORGE_BONUS } from '../data/npcs.js';
import { useItem, equipItemByIndex, unequipItemBySlot, equipBest } from '../systems/inventory.js';
import { sellItemByIndex, getSellPrice } from '../systems/shop.js';
import { saveGame } from '../systems/save.js';
import { toast } from './screens.js';
import { renderGame } from './header.js';

let invFilter = 'all', invSort = 'default';

// ============ НОВЫЙ РЕНДЕР ИНВЕНТАРЯ ============

function itemHeader(inst, item) { const rar = inst.rarity ? RARITIES[inst.rarity] : null; const color = rar ? rar.color : '#c9a227'; const label = rar && inst.rarity !== 'common' ? ` [${rar.name}]` : ''; const forge = inst.forgeLevel ? ` <span style="color:#ffd060;">+${inst.forgeLevel}</span>` : ''; return `<div class="item-name" style="color:${color};">${item.icon} ${item.name}${label}${forge}</div>`; }
function itemBonus(inst, item) { const b = inst.bonus || item.bonus; if (!b) return ''; const parts = []; if (b.attack) parts.push(`+${b.attack} атака`); if (b.magic) parts.push(`+${b.magic} магия`); if (b.defense) parts.push(`+${b.defense} защита`); return parts.length ? ` (${parts.join(', ')})` : ''; }
const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };
function getItemValue(inst) { const item = ITEMS[inst.id]; if (!item) return 0; const mult = inst.rarity ? RARITIES[inst.rarity].multiplier : 1; return (item.price || 0) * mult * (inst.qty || 1); }
function filterAndSort(entries) { let list = entries; if (invFilter !== 'all') list = list.filter(({ inst }) => ITEMS[inst.id]?.type === invFilter); if (invSort === 'rarity') list = list.slice().sort((a, b) => { const ra = RARITY_ORDER[a.inst.rarity || 'common'] ?? 0; const rb = RARITY_ORDER[b.inst.rarity || 'common'] ?? 0; return rb - ra; }); else if (invSort === 'price') list = list.slice().sort((a, b) => getItemValue(b.inst) - getItemValue(a.inst)); return list; }
export function setInvFilter(f) { invFilter = f; if (state.currentTab === 'inventory') { const el = document.getElementById('tab-content'); if (el) el.innerHTML = renderInventory(); } }
export function setInvSort(s) { invSort = s; if (state.currentTab === 'inventory') { const el = document.getElementById('tab-content'); if (el) el.innerHTML = renderInventory(); } }

function filterBarHTML() { 
  const f = (key, label) => `<button class="inv-filter-btn ${invFilter === key ? 'active' : ''}" onclick="GameAPI.setInvFilter('${key}')">${label}</button>`; 
  const s = (key, label) => `<button class="inv-filter-btn ${invSort === key ? 'active' : ''}" onclick="GameAPI.setInvSort('${key}')">${label}</button>`; 
  return `<div class="inv-controls">
    <div class="inv-filter-row">${f('all', 'Все')}${f('weapon', '⚔️ Оружие')}${f('armor', '🥋 Броня')}${f('consumable', '🧪 Расходники')}${f('material', '🌿 Материалы')}${f('scroll', '📜 Свитки')}${f('quest', '💎 Квесты')}</div>
    <div class="inv-filter-row"><span style="color:#a89060;font-size:12px;align-self:center;">Сортировка:</span>${s('default', 'По умолчанию')}${s('rarity', 'По редкости ↓')}${s('price', 'По цене ↓')}</div>
  </div>`; 
}

function itemScore(inst) { if (!inst) return 0; const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst; const item = ITEMS[obj.id]; if (!item) return 0; const b = obj.bonus || item.bonus || {}; let score = (b.attack || 0) + (b.magic || 0) + (b.defense || 0); const forge = obj.forgeLevel || 0; score += FORGE_BONUS[forge] || 0; return score; }
function hasBetterFor(slot, inv, eq) { const eqInst = eq[slot]; const eqScore = itemScore(eqInst); for (const it of inv) { const item = ITEMS[it.id]; if (!item || item.type !== slot) continue; if (itemScore(it) > eqScore) return true; } return false; }

function getJunkCount() {
  const p = state.game.player;
  const inv = p.inventory;
  const eq = p.equipped;
  const eqScore = { weapon: itemScore(eq.weapon), armor: itemScore(eq.armor) };
  let count = 0;
  for (const it of inv) {
    const item = ITEMS[it.id];
    if (!item) continue;
    if (item.type === 'quest' || item.type === 'scroll') continue;
    if (item.type === 'consumable' || item.type === 'material') continue;
    if (it.rarity && it.rarity !== 'common') continue;
    if ((item.type === 'weapon' || item.type === 'armor') && itemScore(it) > eqScore[item.type]) continue;
    count++;
  }
  return count;
}

function renderPaperdoll(p) {
  const eq = p.equipped;
  const clsEmoji = CLASSES[p.class].emoji;
  
  const renderEqSlot = (slot, label, iconDefault) => {
    const inst = eq[slot];
    if (!inst) {
      return `<div class="eq-slot-wrapper">
        <div class="eq-icon">${iconDefault}</div>
        <div class="eq-info"><span class="eq-name empty">${label} (пусто)</span></div>
      </div>`;
    }
    const obj = typeof inst === 'string' ? { id: inst, qty: 1 } : inst;
    const item = ITEMS[obj.id];
    const rar = obj.rarity ? RARITIES[obj.rarity] : null;
    const color = rar ? rar.color : '#c9a227';
    const lvl = obj.forgeLevel || 0;
    
    return `<div class="eq-slot-wrapper" onmouseover="GameAPI.showEqTooltip(event, '${slot}')" onmouseout="GameAPI.hideTooltip()">
      <div class="eq-icon filled" style="border-color:${color}; color:${color};">${item.icon}</div>
      <div class="eq-info">
        <span class="eq-name" style="color:${color};">${item.name} ${lvl > 0 ? `<span style="color:#ffd060;">+${lvl}</span>` : ''}</span>
        <span class="eq-desc">${itemBonus(obj, item)}</span>
      </div>
      <button class="eq-action-btn" onclick="GameAPI.unequip('${slot}')" title="Снять">✖</button>
    </div>`;
  };

  return `<div class="paperdoll-panel">
    <div class="paperdoll-bg"></div>
    <div class="paperdoll-silhouette">${clsEmoji}</div>
    <div class="eq-slots-container">
      ${renderEqSlot('weapon', 'Оружие', '🗡️')}
      ${renderEqSlot('armor', 'Броня', '🥋')}
    </div>
  </div>`;
}

export function renderInventory() {
  const p = state.game.player;
  const rawInv = p.inventory;
  const eq = p.equipped;
  
  const canUpgradeWeapon = hasBetterFor('weapon', rawInv, eq);
  const canUpgradeArmor = hasBetterFor('armor', rawInv, eq);
  const junkCount = getJunkCount();

  let topActions = '';
  if (canUpgradeWeapon || canUpgradeArmor || junkCount > 0) {
    topActions += `<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px;flex-wrap:wrap;">`;
    if (canUpgradeWeapon || canUpgradeArmor) {
      topActions += `<button onclick="GameAPI.equipBest()" class="equip-best-btn">⚡ Экипировать лучшее</button>`;
    }
    if (junkCount > 0) {
      topActions += `<button onclick="GameAPI.sellJunk()" style="background:linear-gradient(180deg,#5a4a1a,#2a1a0a);border-color:#a89060;padding:8px 16px;font-size:13px;">💰 Продать мусор (${junkCount})</button>`;
    }
    topActions += `</div>`;
  }

  const entries = rawInv.map((inst, idx) => ({ inst, idx }));
  const visible = filterAndSort(entries);

  // Генерируем сетку слотов (минимум 35 ячеек для красоты)
  const minSlots = 35;
  let gridHtml = '';
  
  for (let i = 0; i < Math.max(minSlots, visible.length); i++) {
    if (i < visible.length) {
      const { inst: it, idx } = visible[i];
      const item = ITEMS[it.id];
      if (!item) continue;
      const rar = it.rarity || 'common';
      const qtyText = it.qty > 1 ? `<span class="slot-qty">${it.qty}</span>` : '';
      
      gridHtml += `<div class="inv-slot has-item ${rar}" 
        onmouseover="GameAPI.showInvTooltip(event, ${idx})" 
        onmouseout="GameAPI.hideTooltip()"
        onclick="GameAPI.invSlotClick(${idx})"
        title="${item.name}">
        <span class="slot-icon">${item.icon}</span>
        ${qtyText}
      </div>`;
    } else {
      gridHtml += `<div class="inv-slot empty"></div>`;
    }
  }

  return `
    <div class="inv-layout">
      ${renderPaperdoll(p)}
      
      <div class="backpack-panel">
        ${topActions}
        <h3 style="margin-top:0;">🎒 Рюкзак</h3>
        ${filterBarHTML()}
        <div class="inv-grid">
          ${gridHtml}
        </div>
      </div>
    </div>
  `;
}

export function invSlotClick(idx) {
  const p = state.game.player;
  const inst = p.inventory[idx];
  if (!inst) return;
  const item = ITEMS[inst.id];
  if (!item) return;

  if (item.type === 'weapon' || item.type === 'armor') {
    equipItemByIndex(idx);
    toast(`Экипировано: ${item.name}`);
    saveGame();
    renderGame();
  } else if (item.type === 'consumable') {
    useItemOutside(inst.id);
  } else if (item.type === 'scroll') {
    useItemOutside(inst.id);
  } else {
    toast('Этот предмет нельзя использовать.');
  }
}

export function useItemOutside(id) { const item = ITEMS[id]; if (item && item.combatOnly) { toast('Можно использовать только в бою'); return; } if (item && item.type === 'scroll') { if (state.game.player.spells.includes(item.spellId)) { toast('Уже изучено'); return; } } const ok = useItem(id); if (!ok) return; if (item.type === 'scroll') toast(`📖 Изучено: ${SPELLS[item.spellId].name}`); else toast(`Использовано: ${ITEMS[id].name}`); saveGame(); renderGame(); }
export function equipItemByIndexUI(idx) { equipItemByIndex(idx); toast(`Экипировано`); saveGame(); renderGame(); }
export function equipBestUI() { const changed = equipBest(); if (changed) { toast('⚡ Экипировано лучшее'); saveGame(); renderGame(); } else toast('Всё уже оптимально'); }
export function unequipItemUI(slot) { unequipItemBySlot(slot); saveGame(); renderGame(); }
export function sellItemByIndexUI(idx) { const ok = sellItemByIndex(idx); if (ok) renderGame(); }

export function sellJunkUI() {
  const p = state.game.player;
  const inv = p.inventory;
  const eq = p.equipped;
  const eqScore = { weapon: itemScore(eq.weapon), armor: itemScore(eq.armor) };

  let totalGold = 0, count = 0;
  for (let i = inv.length - 1; i >= 0; i--) {
    const it = inv[i];
    const item = ITEMS[it.id];
    if (!item) continue;
    if (item.type === 'quest' || item.type === 'scroll') continue;
    if (item.type === 'consumable' || item.type === 'material') continue;
    if (it.rarity && it.rarity !== 'common') continue;
    if ((item.type === 'weapon' || item.type === 'armor') && itemScore(it) > eqScore[item.type]) continue;
    const price = getSellPrice(it);
    if (price > 0) {
      totalGold += price;
      count++;
      inv.splice(i, 1);
    }
  }

  if (count === 0) { toast('Нечего продавать — мусора нет'); return; }
  p.gold += totalGold;
  saveGame();
  toast(`💰 Продано ${count} предметов (+${totalGold}💰)`);
  renderGame();
}

const TYPE_LABELS = { weapon: 'Оружие', armor: 'Броня', consumable: 'Расходник', material: 'Материал', scroll: 'Свиток', quest: 'Квестовый предмет' };
function buildCompareHTML(inst, item) { if (item.type !== 'weapon' && item.type !== 'armor') return ''; const p = state.game.player; const eqInst = p.equipped[item.type]; if (!eqInst) return `<div class="tooltip-compare"><div style="color:#60ff60;">Слот пуст — можно экипировать</div></div>`; const eqObj = typeof eqInst === 'string' ? { id: eqInst, qty: 1 } : eqInst; const oldB = eqObj.bonus || ITEMS[eqObj.id]?.bonus || {}; const newB = inst.bonus || item.bonus || {}; const lines = []; for (const key of ['attack', 'magic', 'defense']) { const newV = newB[key] || 0; const oldV = oldB[key] || 0; if (newV === 0 && oldV === 0) continue; const diff = newV - oldV; const label = key === 'attack' ? 'Атака' : key === 'magic' ? 'Магия' : 'Защита'; if (diff === 0) lines.push(`<div style="color:#a89060;">${label}: ${newV} (как сейчас)</div>`); else if (diff > 0) lines.push(`<div style="color:#60ff60;">${label}: ${newV} (+${diff})</div>`); else lines.push(`<div style="color:#ff6060;">${label}: ${newV} (${diff})</div>`); } const newForge = inst.forgeLevel || 0; const oldForge = eqObj.forgeLevel || 0; const newForgeBonus = FORGE_BONUS[newForge] || 0; const oldForgeBonus = FORGE_BONUS[oldForge] || 0; if (newForgeBonus > 0 || oldForgeBonus > 0) { const label = item.type === 'armor' ? 'Защита (ковка)' : (item.bonus && item.bonus.magic !== undefined) ? 'Магия (ковка)' : 'Атака (ковка)'; const diff = newForgeBonus - oldForgeBonus; const color = diff > 0 ? '#60ff60' : diff < 0 ? '#ff6060' : '#a89060'; lines.push(`<div style="color:${color};">⚒️ ${label}: +${newForgeBonus}${diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''}</div>`); } return lines.length ? `<div class="tooltip-compare">${lines.join('')}</div>` : ''; }
function buildTooltipHTML(inst) { const item = ITEMS[inst.id]; if (!item) return ''; const rar = inst.rarity ? RARITIES[inst.rarity] : null; const color = rar ? rar.color : '#c9a227'; const label = rar && inst.rarity !== 'common' ? ` [${rar.name}]` : ''; const forgeLabel = inst.forgeLevel ? ` +${inst.forgeLevel}` : ''; const typeName = TYPE_LABELS[item.type] || ''; const b = inst.bonus || item.bonus; const statLines = []; if (b) { if (b.attack) statLines.push(`+${b.attack} к атаке`); if (b.magic) statLines.push(`+${b.magic} к магии`); if (b.defense) statLines.push(`+${b.defense} к защите`); } const forge = inst.forgeLevel || 0; if (forge > 0) { const fb = FORGE_BONUS[forge] || 0; const target = item.type === 'armor' ? 'защите' : (item.bonus && item.bonus.magic !== undefined) ? 'магии' : 'атаке'; statLines.push(`<span style="color:#ffd060;">⚒️ +${fb} к ${target} (уровень +${forge})</span>`); } return `<div class="tooltip-title" style="color:${color};">${item.icon} ${item.name}${label}${forgeLabel}</div><div class="tooltip-type">${typeName}</div><div class="tooltip-desc">${item.desc}</div>${statLines.length ? `<div class="tooltip-stats">${statLines.join('<br>')}</div>` : ''}${buildCompareHTML(inst, item)}${item.price ? `<div class="tooltip-price">💰 ${item.price}</div>` : ''}`; }
function positionTooltip(e, div) { const rect = div.getBoundingClientRect(); const pad = 16; let x = e.clientX + pad; let y = e.clientY + pad; if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - pad; if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - pad; if (x < 10) x = 10; if (y < 10) y = 10; div.style.left = x + 'px'; div.style.top = y + 'px'; }
export function renderTooltip(e, inst) { hideTooltip(); if (!inst) return; const div = document.createElement('div'); div.id = 'item-tooltip'; div.className = 'item-tooltip'; div.innerHTML = buildTooltipHTML(inst); document.body.appendChild(div); positionTooltip(e, div); }
export function showInvTooltip(e, idx) { const inst = state.game.player.inventory[idx]; renderTooltip(e, inst); }
export function showEqTooltip(e, slot) { let inst = state.game.player.equipped[slot]; if (!inst) return; if (typeof inst === 'string') inst = { id: inst, qty: 1 }; renderTooltip(e, inst); }
export function hideTooltip() { const el = document.getElementById('item-tooltip'); if (el) el.remove(); }
