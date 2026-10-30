import { state } from '../systems/state.js';
import { PASSIVE_TREE } from '../data/passives.js';
import { saveGame } from '../systems/save.js';
import { toast } from './screens.js';
import { renderHeader } from './header.js';

export function renderPassives() {
  const p = state.game.player;
  const points = p.passivePoints || 0;
  
  let html = `<h3>Древо пассивных навыков <span style="color:#60ff60;font-size:14px;">(Очков: ${points})</span></h3>`;
  html += `<p style="color:#a89060;font-size:13px;margin-bottom:12px;">Кликните на доступный узел, чтобы потратить очко.</p>`;
  html += `<div class="passive-tree">`;
  
  const lines = [];
  for (const key in PASSIVE_TREE) {
    const node = PASSIVE_TREE[key];
    for (const conn of node.conn) {
      if (PASSIVE_TREE[conn]) {
        const target = PASSIVE_TREE[conn];
        const isActive = p.passives?.includes(key) && p.passives?.includes(conn);
        lines.push(`<line x1="${node.x}%" y1="${node.y}%" x2="${target.x}%" y2="${target.y}%" class="${isActive ? 'active' : ''}"/>`);
      }
    }
  }
  html += `<svg class="passive-lines" viewBox="0 0 100 100" preserveAspectRatio="none">${lines.join('')}</svg>`;
  
  for (const key in PASSIVE_TREE) {
    const node = PASSIVE_TREE[key];
    const allocated = p.passives?.includes(key);
    const canAllocate = points > 0 && !allocated && (key === 'start' || node.conn.some(c => p.passives?.includes(c)));
    
    let typeClass = node.type;
    if (allocated) typeClass += ' allocated';
    else if (canAllocate) typeClass += ' available';
    
    html += `
      <div class="passive-node ${typeClass}" style="left:${node.x}%;top:${node.y}%" 
           onclick="GameAPI.allocatePassive('${key}')" title="${node.name}: ${node.desc}">
        <span class="node-icon">${node.icon}</span>
        <span class="node-name">${node.name}</span>
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

export function allocatePassiveUI(nodeId) {
  const p = state.game.player;
  if (!p.passivePoints || p.passivePoints <= 0) { toast('Нет очков навыков'); return; }
  if (!p.passives) p.passives = ['start'];
  if (p.passives.includes(nodeId)) return;
  
  const node = PASSIVE_TREE[nodeId];
  if (!node) return;
  
  if (nodeId !== 'start' && !node.conn.some(c => p.passives.includes(c))) {
    toast('Нужен смежный навык');
    return;
  }
  
  p.passives.push(nodeId);
  p.passivePoints--;
  
  switch(nodeId) {
    case 's1': p.str += 10; break;
    case 's2': p.str += 15; break;
    case 's3': p.maxHp = Math.round(p.maxHp * 1.2); p.hp = p.maxHp; break;
    case 's4': p.str += 20; break;
    case 'i1': p.int += 10; break;
    case 'i2': p.int += 15; break;
    case 'i3': p.int += 20; break;
    case 'i4': p.maxMp = Math.round(p.maxMp * 1.3); p.mp = p.maxMp; break;
    case 'c1': p.con += 10; break;
    case 'c2': p.con += 15; break;
    case 'c3': p.con += 20; break;
    case 'c4': p.wis += 10; break;
  }
  
  saveGame();
  renderHeader();
  document.getElementById('tab-content').innerHTML = renderPassives();
}