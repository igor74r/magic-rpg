import { state } from '../systems/state.js';
import { getPassiveTree } from '../data/passives.js';
import {
  canAllocatePassive,
  allocatePassive,
  resetPassives
} from '../systems/talents.js';
import { toast } from './screens.js';
import { renderHeader } from './header.js';

let treePan = { x: -150, y: -170 };
let treeDrag = null;

export function passiveTreePointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  if (e.target.closest('.passive-node')) return;
  const viewport = e.currentTarget;
  treeDrag = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    panX: treePan.x,
    panY: treePan.y,
    moved: false
  };
  viewport.setPointerCapture?.(e.pointerId);
  viewport.classList.add('dragging');
  e.preventDefault();
}

export function passiveTreePointerMove(e) {
  if (!treeDrag || treeDrag.pointerId !== e.pointerId) return;
  const dx = e.clientX - treeDrag.startX;
  const dy = e.clientY - treeDrag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 3) treeDrag.moved = true;
  treePan = { x: treeDrag.panX + dx, y: treeDrag.panY + dy };
  const world = document.getElementById('passive-tree-world');
  if (world) world.style.transform = `translate(${treePan.x}px, ${treePan.y}px)`;
  e.preventDefault();
}

export function passiveTreePointerUp(e) {
  if (!treeDrag || (e.pointerId !== undefined && treeDrag.pointerId !== e.pointerId)) return;
  const viewport = e.currentTarget;
  try {
    if (viewport.hasPointerCapture?.(treeDrag.pointerId)) {
      viewport.releasePointerCapture(treeDrag.pointerId);
    }
  } catch {}
  treeDrag = null;
  viewport.classList.remove('dragging');
}

export function renderPassives() {
  const player = state.game.player;

  if (!Array.isArray(player.passives)) {
    player.passives = ['start'];
  }

  const tree = getPassiveTree(player.class);
  const nodes = tree.nodes;
  const allocated = player.passives;
  const points = player.passivePoints || 0;

  const lines = [];

  for (const node of Object.values(nodes)) {
    for (const parentId of node.conn) {
      const parent = nodes[parentId];
      if (!parent) continue;

      const active =
        allocated.includes(node.id) &&
        allocated.includes(parentId);

      lines.push(`
        <line
          x1="${parent.x}%"
          y1="${parent.y}%"
          x2="${node.x}%"
          y2="${node.y}%"
          class="${active ? 'active' : ''}"
        />
      `);
    }
  }

  let html = `
    <div class="passive-heading">
      <h3>
        Древо мастерства:
        ${
          player.class === 'warrior'
            ? 'Путь воина'
            : player.class === 'mage'
              ? 'Путь мага'
              : 'Путь следопыта'
        }
      </h3>

      <p style="color:#b7a989;font-size:13px;">
        ${points} очков пассивных навыков · ${allocated.length - 1} узлов изучено
      </p>
      <div class="passive-actions">
        <span>Сброс древа возвращает все вложенные очки. Стоимость: 500 золота.</span>
        <button type="button" class="secondary-btn"
          onclick="GameAPI.resetPassives()"
          ${allocated.length <= 1 || (player.gold || 0) < 500 ? 'disabled' : ''}>
          Сбросить древо · 500 💰
        </button>
      </div>

      <p style="color:#8f8065;font-size:12px;">
        Открывайте соединённые узлы. Ключевые пассивки дают мощный бонус, но имеют цену.
      </p>
    </div>

    <div class="passive-tree-viewport"
      onpointerdown="GameAPI.passiveTreePointerDown(event)"
      onpointermove="GameAPI.passiveTreePointerMove(event)"
      onpointerup="GameAPI.passiveTreePointerUp(event)"
      onpointercancel="GameAPI.passiveTreePointerUp(event)">
      <div class="passive-tree-expanded" id="passive-tree-world"
        style="transform:translate(${treePan.x}px,${treePan.y}px)">
      <svg
        class="passive-lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        ${lines.join('')}
      </svg>
  `;

  for (const node of Object.values(nodes)) {
    const isAllocated = allocated.includes(node.id);
    const available = canAllocatePassive(player, node.id);

    const classes = [
      node.type,
      isAllocated ? 'allocated' : '',
      available ? 'available' : ''
    ].filter(Boolean).join(' ');

    const label = node.id === 'start'
      ? 'Старт'
      : node.name;

    html += `
      <button
        type="button"
        class="passive-node ${classes}"
        style="left:${node.x}%;top:${node.y}%"
        ${
          available
            ? `onclick="GameAPI.allocatePassive('${node.id}')"`
            : 'disabled'
        }
        title="${node.name}: ${node.desc}"
      >
        <span class="node-icon">${node.icon}</span>
        <span class="node-name">${label}</span>
      </button>
    `;
  }

  html += '</div></div>';

  html += `
    <div class="passive-legend">
      <span>● Малый узел</span>
      <span>◆ Усиленный узел</span>
      <span>✦ Ключевая пассивка</span>
      <span>Зелёный — доступен · Золотой — изучен</span>
    </div>
  `;

  html += `
    <div class="passive-details">
      <h4>Ближайшие узлы</h4>
      <div class="passive-detail-grid">
  `;

  const nextNodes = Object.values(nodes).filter(node =>
    node.id !== 'start' &&
    (
      allocated.includes(node.id) ||
      canAllocatePassive(player, node.id)
    )
  );

  for (const node of nextNodes) {
    const taken = allocated.includes(node.id);

    html += `
      <div class="passive-detail ${taken ? 'taken' : ''}">
        <b>${node.icon} ${node.name}</b>
        <small>${node.branch || 'Центр'}</small>
        <p>${node.desc}</p>
        <span>
          ${taken ? 'Изучено' : 'Доступно для изучения'}
        </span>
      </div>
    `;
  }

  html += '</div></div>';

  return html;
}

export function allocatePassiveUI(nodeId) {
  const player = state.game?.player;
  if (!player) return;

  if (!allocatePassive(player, nodeId)) {
    toast(
      (player.passivePoints || 0) <= 0
        ? 'Нет очков пассивных навыков'
        : 'Сначала откройте соседний узел'
    );
    return;
  }

  renderHeader();

  const content = document.getElementById('tab-content');

  if (content) {
    content.innerHTML = renderPassives();
  }
}
export function resetPassivesUI() {
  const player = state.game?.player;
  if (!player) return;

  if (!window.confirm('Сбросить все пассивные навыки за 500 золота? Все вложенные очки будут возвращены.')) {
    return;
  }

  const result = resetPassives(player);
  if (!result.ok) {
    toast(result.msg || 'Не удалось сбросить древо');
    return;
  }

  renderHeader();
  const content = document.getElementById('tab-content');
  if (content) content.innerHTML = renderPassives();
}
