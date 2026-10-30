import { state } from '../systems/state.js';
import { CLASSES } from '../data/classes.js';
import { LOCATIONS } from '../data/locations.js';
import { EFFECTS } from '../systems/status.js';
import { saveGame } from '../systems/save.js';
import { toast } from './screens.js';
import { renderLocations } from './locations.js';
import { renderInventory } from './inventory.js';
import { renderSpells } from './spells.js';
import { renderQuests, renderAchievements, renderStatistics, renderBestiary, renderTalents } from './quests.js';

export function renderGame() { if (!state.game) return; renderHeader(); renderLocation(); renderTab(state.currentTab); }
function totalKills() { const kills = state.game.player.stats?.kills || {}; return Object.values(kills).reduce((s, v) => s + v, 0); }

export function renderHeader() {
  const p = state.game.player; const points = p.statPoints || 0;
  const statBlock = points > 0 ? `<div class="stat-points-panel"><span class="stat-points-label">🎯 Очков характеристик: ${points}</span><div class="stat-buttons"><button onclick="GameAPI.spendStat('str')">+1 СИЛ</button><button onclick="GameAPI.spendStat('int')">+1 ИНТ</button><button onclick="GameAPI.spendStat('wis')">+1 МДР</button><button onclick="GameAPI.spendStat('con')">+1 ТЕЛ</button></div></div>` : '';

  const effectsHtml = renderActiveEffectsInline(p.effects);
  const endgameHtml = renderEndgameHint(p);

  const mpLabel = p.class === 'warrior' ? '🔥 Ярость' : 'MP';
  const mpClass = p.class === 'warrior' ? 'bar-rage' : 'bar-mp';

  document.getElementById('game-header').innerHTML = `
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
      <div><span style="color:#c9a227;font-size:18px;">${CLASSES[p.class].emoji} ${p.name}</span> <span style="color:#a89060;">— ${CLASSES[p.class].name}, Ур. ${p.level}</span></div>
      <div><span style="color:#ffd060;">💰 ${p.gold}</span></div>
    </div>
    <div class="bar"><div class="bar-fill bar-hp" style="width:${p.hp/p.maxHp*100}%"></div><div class="bar-text">HP ${p.hp}/${p.maxHp}</div></div>
    <div class="bar"><div class="bar-fill ${mpClass}" style="width:${p.mp/p.maxMp*100}%"></div><div class="bar-text">${mpLabel} ${p.mp}/${p.maxMp}</div></div>
    <div class="bar"><div class="bar-fill bar-exp" style="width:${p.exp/p.expNext*100}%"></div><div class="bar-text">EXP ${p.exp}/${p.expNext}</div></div>

    <div style="text-align:center;font-size:11px;color:#a89060;margin-bottom:2px;">До следующего уровня: ${p.expNext - p.exp} EXP</div>

    <div style="margin-top:8px;font-size:13px;color:#a89060;text-align:center;">
      СИЛ ${p.str} · ИНТ ${p.int} · МДР ${p.wis} · ТЕЛ ${p.con} · ⚔️ ${totalKills()} убийств
    </div>

    ${effectsHtml}

    <div style="display: flex; justify-content: center; width: 100%; margin-top: 6px;">
      ${endgameHtml}
    </div>

    ${statBlock}`;
}

function renderEndgameHint(p) {
  const shards = state.game.shards || {}; const shardCount = Object.values(shards).filter(Boolean).length; const riftBest = p.riftBest || 0;
  if (riftBest > 0) return `<div class="endgame-hint rift">🌀 Рекорд Разлома: <b>этаж ${riftBest}</b></div>`;
  if (shardCount === 3) return `<div class="endgame-hint rift">🌀 <b>Разлом открыт!</b> Зайди в деревню и войди в портал</div>`;
  return `<div class="endgame-hint">💎 Осколки Кристалла: <b>${shardCount}/3</b> · собери все — откроется Разлом</div>`;
}

function renderActiveEffectsInline(effects) {
  if (!Array.isArray(effects) || !effects.length) return '';
  const badges = effects.map(e => { const d = EFFECTS[e.id]; if (!d) return ''; return `<span class="fx-badge" style="border-color:${d.color};color:${d.color};" title="${d.name}${d.desc ? ': ' + d.desc : ''} (${e.duration} ${e.duration === 1 ? 'ход' : 'хода'})">${d.icon}${e.duration}</span>`; }).join('');
  return `<div class="effects-inline" style="display:flex; justify-content:center; width:100%; margin-top:6px;"><span style="color:#a89060;font-size:11px;margin-right:6px;">Эффекты:</span>${badges}</div>`;
}

const STAT_NAMES = { str: 'Силе', int: 'Интеллекту', wis: 'Мудрости', con: 'Телосложению' };
export function spendStat(stat) { const p = state.game.player; if (!p.statPoints || p.statPoints <= 0 || !(stat in STAT_NAMES)) return; p[stat] += 1; p.statPoints -= 1; if (stat === 'con') p.maxHp += 10; if (stat === 'int') p.maxMp += 5; saveGame(); renderHeader(); toast(`+1 к ${STAT_NAMES[stat]}`); }
function renderLocation() { const loc = LOCATIONS[state.game.location]; document.getElementById('location-info').innerHTML = `<h2>${loc.emoji} ${loc.name}</h2><p style="color:#a89060;margin-top:5px;font-size:14px;">${loc.desc}</p>`; }
export function switchTab(tab) { state.currentTab = tab; document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab)); renderTab(tab); }

function renderTab(tab) {
  const el = document.getElementById('tab-content');

  if (tab === 'spells' && state.game.player.class === 'warrior') {
    el.innerHTML = `<p style="color:#a89060;text-align:center;padding:15px;">Воин не умеет колдовать. Используйте способности!</p>`;
    return;
  }

  if (tab === 'locations') el.innerHTML = renderLocations();
  else if (tab === 'inventory') el.innerHTML = renderInventory();
  else if (tab === 'spells') el.innerHTML = renderSpells();
  else if (tab === 'quests') el.innerHTML = renderQuests();
  else if (tab === 'achievements') el.innerHTML = renderAchievements();
  else if (tab === 'statistics') el.innerHTML = renderStatistics();
  else if (tab === 'talents') el.innerHTML = renderTalents();
  else if (tab === 'bestiary') el.innerHTML = renderBestiary();
}
