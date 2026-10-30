import { state } from '../systems/state.js';
import { SHOP_ITEMS } from '../data/shop.js';
import { ITEMS } from '../data/items.js';
import { buyItem } from '../systems/shop.js';
import { upgradeEquipment, healAtHealer, craftRecipe } from '../systems/crafting.js';
import { toast } from './screens.js';
import { renderHeader, switchTab } from './header.js';
import { openBlacksmith, openHealer, openAlchemist } from './npcs.js';
import { renderTooltip } from './inventory.js';

export function openShop() { const p = state.game.player; const html = SHOP_ITEMS.map(id => { const item = ITEMS[id]; return `<div class="item" onmouseover="GameAPI.showShopTooltip(event, '${id}')" onmouseout="GameAPI.hideTooltip()"><div class="item-info"><div class="item-name">${item.icon} ${item.name}</div><div class="item-desc">${item.desc} · 💰 ${item.price}</div></div><button onclick="GameAPI.buy('${id}')" ${p.gold < item.price ? 'disabled' : ''} style="font-size:12px;padding:6px 12px;">Купить</button></div>`; }).join(''); document.getElementById('tab-content').innerHTML = `<h3>🛒 Магазин</h3><div class="item-list">${html}</div><button onclick="GameAPI.backToVillage()" style="width:100%;margin-top:15px;">← Назад</button>`; }
export function showShopTooltip(e, id) { const inst = { id, qty: 1, rarity: 'common' }; renderTooltip(e, inst); }
export function buyItemUI(id) { if (buyItem(id)) { renderHeader(); openShop(); } }
export function backToVillage() { switchTab('locations'); }
export function upgradeEquipmentUI(slot) { const res = upgradeEquipment(slot); if (!res.ok && res.msg) toast(res.msg); renderHeader(); openBlacksmith(); }
export function healAtHealerUI() { const res = healAtHealer(); if (!res.ok && res.msg) toast(res.msg); renderHeader(); openHealer(); }
export function craftRecipeUI(recipeId) { const res = craftRecipe(recipeId); if (!res.ok && res.msg) toast(res.msg); renderHeader(); openAlchemist(); }
