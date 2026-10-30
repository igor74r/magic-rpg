import { state } from '../systems/state.js';
import { LOCATIONS } from '../data/locations.js';
import { canOpenDaily, timeUntilDaily, formatRemaining } from './village.js';
import { emit } from '../systems/events.js';
import { saveGame } from '../systems/save.js';
import { renderGame } from './header.js';
import { enterOverworld } from '../systems/overworld.js';

export function renderLocations() {
  const loc = LOCATIONS[state.game.location]; const actions = [];
  if (state.game.location === 'village') {
    actions.push(`<button onclick="GameAPI.enterOverworld()">🗺️ Выйти на улицу (Исследовать деревню)</button>`);
    actions.push(`<button onclick="GameAPI.openShop()">🛒 Магазин (Быстрый доступ)</button>`);
    const canOpen = canOpenDaily(); const label = canOpen ? '🎁 Открыть ежедневный сундук' : `🎁 Через ${formatRemaining(timeUntilDaily())}`;
    actions.push(`<button onclick="GameAPI.openDailyChest()" ${canOpen ? '' : 'disabled'}>${label}</button>`);
    const riftReady = !!(state.game.shards.forest && state.game.shards.ruins && state.game.shards.shadow); const best = state.game.player.riftBest || 0;
    actions.push(`<button onclick="GameAPI.enterRift()" ${riftReady ? '' : 'disabled'} class="rift-btn">🌀 Бесконечный разлом${best > 0 ? ` (рекорд: ${best})` : ''}</button>`);
  } else {
    if (loc.enemies?.length) actions.push(`<button onclick="GameAPI.enterOverworld()">🗺️ Войти в локацию</button>`);
    if (loc.shop) actions.push(`<button onclick="GameAPI.openShop()">🛒 Магазин</button>`);
  }
  if (!actions.length) actions.push(`<p style="color:#a89060;text-align:center;grid-column:1/-1;">Здесь тихо и безопасно.</p>`);
  const travelBtns = Object.entries(LOCATIONS).filter(([id]) => id !== state.game.location).map(([id, l]) => `<button onclick="GameAPI.travelTo('${id}')" style="font-size:14px;">${l.emoji} ${l.name}</button>`).join('');
  return `<h3>Действия</h3><div class="actions" style="margin-bottom:15px;">${actions.join('')}</div><div class="divider"></div><h3>Путешествие</h3><div class="location-list">${travelBtns}</div>`;
}

export function travelTo(locId) { state.game.location = locId; emit('log', { channel: 'game', msg: `Вы прибыли в ${LOCATIONS[locId].name}.`, cls: 'info' }); saveGame(); renderGame(); }
export function enterOverworldFromUI() { enterOverworld(state.game.location); }
