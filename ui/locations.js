// ui/locations.js
// Вкладка «Локации» — карта мира: деревня в центре, вокруг — локации.
// Управление мышкой: клик по точке — переход. Стрелки оставлены для антуража.
import { state } from '../systems/state.js';
import { LOCATIONS } from '../data/locations.js';
import { canOpenDaily, timeUntilDaily, formatRemaining } from './village.js';
import { emit } from '../systems/events.js';
import { saveGame } from '../systems/save.js';
import { renderGame } from './header.js';
import { enterOverworld } from '../systems/overworld.js';

const MAP_SPEED_X = 26;
const MAP_SPEED_Y = 20;
const MAP_CLUSTER_RADIUS_MIN = 18;
const MAP_CLUSTER_RADIUS_MAX = 28;
const MAP_NODE_MIN_DISTANCE = 9.5;

let selected = null;
let keysBound = false;
let worldLayout = null;
const map = { raf: 0, keys: new Set(), x: 50, y: 50, nodes: [] };

export function createWorldMapLayout(ids, random = Math.random) {
  const source = Array.isArray(ids) ? ids.filter(id => id && id !== 'village') : [];
  const shuffled = source.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const nodes = [];
  for (const id of shuffled) {
    let point = null;
    for (let attempt = 0; attempt < 500; attempt++) {
      const angle = random() * Math.PI * 2;
      const radius = MAP_CLUSTER_RADIUS_MIN +
        random() * (MAP_CLUSTER_RADIUS_MAX - MAP_CLUSTER_RADIUS_MIN);
      const candidate = {
        id,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius * 0.86
      };
      if (nodes.every(node =>
        Math.hypot(node.x - candidate.x, (node.y - candidate.y) * 1.12) >= MAP_NODE_MIN_DISTANCE
      )) {
        point = candidate;
        break;
      }
    }

    if (!point) {
      const angle = (nodes.length / Math.max(1, source.length)) * Math.PI * 2;
      point = {
        id,
        x: 50 + Math.cos(angle) * MAP_CLUSTER_RADIUS_MAX,
        y: 50 + Math.sin(angle) * MAP_CLUSTER_RADIUS_MAX * 0.86
      };
    }
    nodes.push(point);
  }
  return nodes;
}

function ringNodes() {
  if (!worldLayout) worldLayout = createWorldMapLayout(Object.keys(LOCATIONS));
  return worldLayout.map(node => ({ ...node }));
}

function panelHtml(id) {
  const loc = LOCATIONS[id];
  const here = id === state.game.location;
  const actions = [];
  if (here) {
    if (loc.safe || loc.enemies?.length) actions.push(`<button onclick="GameAPI.enterOverworld()">Исследовать</button>`);
    if (loc.shop) actions.push(`<button onclick="GameAPI.openShop()">Магазин</button>`);
    if (id === 'village') {
      const canOpen = canOpenDaily();
      actions.push(`<button onclick="GameAPI.openDailyChest()" ${canOpen ? '' : 'disabled'}>${canOpen ? 'Ежедневный сундук' : `Сундук через ${formatRemaining(timeUntilDaily())}`}</button>`);
      const riftReady = !!(state.game.shards.forest && state.game.shards.ruins && state.game.shards.shadow);
      const best = state.game.player.riftBest || 0;
      actions.push(`<button onclick="GameAPI.enterRift()" ${riftReady ? '' : 'disabled'}>Разлом${best > 0 ? ` · рекорд ${best}` : ''}</button>`);
    }
  } else {
    // Если локация не текущая, кнопка "Перейти" всё ещё нужна для тех, кто хочет сначала прочитать описание
    actions.push(`<button onclick="GameAPI.mapTravel('${id}')">Перейти сюда</button>`);
  }
  return `
    <div class="map-panel-head">
      <div>
        <h3>${loc.name}${here ? ' <span class="map-here">вы здесь</span>' : ''}</h3>
        <p>${loc.desc || ''}</p>
      </div>
      <div class="map-panel-actions">${actions.join('')}</div>
    </div>`;
}

function renderPanel(id) {
  const el = document.getElementById('map-panel');
  if (el) el.innerHTML = panelHtml(id || state.game.location);
}

function highlight() {
  document.querySelectorAll('.wnode').forEach((n) => n.classList.toggle('selected', n.dataset.loc === selected));
}

function updateAvatar() {
  const avatar = document.getElementById('map-avatar');
  if (!avatar) return;
  avatar.style.left = map.x + '%';
  avatar.style.top = map.y + '%';
}

function selectNode(id) {
  if (!LOCATIONS[id] || selected === id) return;
  selected = id;
  highlight();
  renderPanel(id);
}

// ===== ИЗМЕНЕНО: клик сразу перемещает, если это другая локация =====
export function mapSelect(id) {
  if (!LOCATIONS[id]) return;
  
  if (id !== state.game.location) {
    mapTravel(id);
  } else {
    selectNode(id);
  }
}

export function mapTravel(id) {
  if (!LOCATIONS[id] || id === state.game.location) return;
  selected = id;
  travelTo(id);
}

export function mapEnter() {
  if (!selected) return;
  if (selected !== state.game.location) travelTo(selected);
  if (state.game.location === 'village' || LOCATIONS[state.game.location]?.enemies?.length) enterOverworldFromUI();
}

function mapActive() {
  const screen = document.getElementById('screen-game');
  return !!screen && screen.classList.contains('active') && !state.overworld;
}

function onKeyDown(e) {
  if (!document.getElementById('world-map') || !mapActive() || state.currentTab !== 'locations') return;
  const tag = (e.target?.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    e.preventDefault();
    map.keys.add(k);
  } else if (k === 'e' || k === 'enter' || k === ' ') {
    e.preventDefault();
    mapEnter();
  }
}

function onKeyUp(e) {
  map.keys.delete(e.key.toLowerCase());
}

function bindKeys() {
  if (keysBound) return;
  keysBound = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function stopWalk() {
  if (map.raf) cancelAnimationFrame(map.raf);
  map.raf = 0;
}

function walkLoop(ts) {
  if (!document.getElementById('world-map') || !mapActive()) { stopWalk(); return; }
  const dt = Math.min(50, ts - (walkLoop.last || ts)) / 1000;
  walkLoop.last = ts;

  let dx = 0, dy = 0;
  if (map.keys.has('w') || map.keys.has('arrowup')) dy -= 1;
  if (map.keys.has('s') || map.keys.has('arrowdown')) dy += 1;
  if (map.keys.has('a') || map.keys.has('arrowleft')) dx -= 1;
  if (map.keys.has('d') || map.keys.has('arrowright')) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    map.x = Math.min(95, Math.max(5, map.x + (dx / len) * MAP_SPEED_X * dt));
    map.y = Math.min(94, Math.max(6, map.y + (dy / len) * MAP_SPEED_Y * dt));
    updateAvatar();
  }

  let near = null, best = 6.5;
  for (const node of map.nodes) {
    const dist = Math.hypot(node.x - map.x, (node.y - map.y) * 1.15);
    if (dist < best) { best = dist; near = node; }
  }
  if (near) selectNode(near.id);

  map.raf = requestAnimationFrame(walkLoop);
}

function initWorldMap() {
  const el = document.getElementById('world-map');
  if (!el) return;
  stopWalk();

  map.nodes = ringNodes();
  const start = map.nodes.find((n) => n.id === state.game.location) || { x: 50, y: 50 };
  map.x = start.x;
  map.y = start.y;
  selected = state.game.location;
  updateAvatar();
  highlight();
  renderPanel(selected);
  bindKeys();

  walkLoop.last = 0;
  map.raf = requestAnimationFrame(walkLoop);
}

export function renderLocations() {
  const nodes = ringNodes();
  const links = nodes.map((n) => `<line x1="50" y1="50" x2="${n.x.toFixed(2)}" y2="${n.y.toFixed(2)}" />`).join('');
  
  const nodesHtml = nodes.map((n) => {
    const loc = LOCATIONS[n.id];
    return `<div class="wnode${n.id === state.game.location ? ' current' : ''}" data-loc="${n.id}" data-x="${n.x}" data-y="${n.y}"
      style="left:${n.x.toFixed(2)}%;top:${n.y.toFixed(2)}%" onclick="GameAPI.mapSelect('${n.id}')" title="${loc.name}" aria-label="${loc.name}">
      <span class="wnode-icon">${loc.emoji}</span>
      <span class="wnode-name" aria-hidden="true">${loc.name}</span>
    </div>`;
  }).join('');

  requestAnimationFrame(initWorldMap);

  return `
    <div class="world-map" id="world-map">
      <svg class="map-links" viewBox="0 0 100 100" preserveAspectRatio="none">${links}</svg>
      <div class="map-orbit"></div>
      <div class="map-orbit map-orbit-inner"></div>
      <div class="wnode village${state.game.location === 'village' ? ' current' : ''}" data-loc="village" data-x="50" data-y="50" style="left:50%;top:50%"
        onclick="GameAPI.mapSelect('village')" title="Деревня Аврора">
        <span class="wnode-icon">🏘️</span>
        <span class="wnode-name">Деревня Аврора</span>
      </div>
      ${nodesHtml}
      <div class="map-avatar" id="map-avatar"><i></i></div>
    </div>
    <div class="map-hint">Клик по точке — переход · WASD / стрелки — идти · E — войти</div>
    <div class="map-panel" id="map-panel"></div>`;
}

export function travelTo(locId) {
  state.game.location = locId;
  emit('log', { channel: 'game', msg: `Вы прибыли в ${LOCATIONS[locId].name}.`, cls: 'info' });
  saveGame();
  renderGame();
}

export function enterOverworldFromUI() { enterOverworld(state.game.location); }