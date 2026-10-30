import { state } from '../systems/state.js';
import { STORY } from '../data/story.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { ENEMIES } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { CLASSES } from '../data/classes.js';
import { getClassTalents } from '../data/talents.js';
import { getDailyQuests, claimQuestReward } from '../systems/dailyQuests.js';
import { getAvailableTalents, getTakenTalents, takeTalent, getNextTierLevel, resetTalents } from '../systems/talents.js';
import { saveGame } from '../systems/save.js';
import { showScreen, toast } from './screens.js';
import { renderGame, renderHeader } from './header.js';

export function openQuestBoard() {
  const quests = getDailyQuests();
  const html = quests.map(q => {
    const pct = Math.min(100, (q.current / q.max) * 100);
    const reward = [];
    if (q.gold) reward.push(`${q.gold}💰`);
    if (q.exp) reward.push(`${q.exp} EXP`);
    return `<div class="npc-slot">
      <div style="font-weight:bold; color:#c9a227;">${q.completed ? '✅' : '⏳'} ${q.text}</div>
      <div class="bar" style="margin-top:8px;"><div class="bar-fill bar-exp" style="width:${pct}%"></div><div class="bar-text">${q.current} / ${q.max}</div></div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <div style="color:#ffd060; font-size:12px;">Награда: ${reward.join(' + ')}</div>
        ${q.completed && !q.claimed ? `<button onclick="GameAPI.claimQuest('${q.id}')" class="sell-btn" style="padding:6px 12px; font-size:12px;">Забрать</button>` : (q.claimed ? `<span style="color:#60ff60; font-size:12px;">Получено</span>` : '')}
      </div>
    </div>`;
  }).join('');
  document.getElementById('tab-content').innerHTML = `<div class="npc-header"><div class="npc-emoji">📋</div><div><h3 style="margin:0;">Доска объявлений</h3><p style="color:#a89060;font-style:italic;margin-top:4px;">«Ежедневные задания обновляются каждый день.»</p></div></div><div class="item-list" style="margin-top:15px;">${html}</div><button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">← Уйти</button>`;
  showScreen('screen-game');
}

export function renderQuests() { const done = Object.values(state.game.shards).filter(Boolean).length; const items = STORY.quests.map(q => { const c = state.game.quests[q.id]; return `<div class="item" style="${c ? 'border-color:#60ff60;' : ''}"><div class="item-info"><div class="item-name">${c ? '✅' : '⏳'} ${q.name}</div><div class="item-desc">${q.desc}</div></div></div>`; }).join(''); return `<h3>Осколки Кристалла: ${done}/3</h3><div class="item-list">${items}</div>`; }

export function renderAchievements() { const unlocked = state.game.player.achievements || []; const total = ACHIEVEMENTS.length; const got = unlocked.length; const items = ACHIEVEMENTS.map(a => { const done = unlocked.includes(a.id); let progressText = ''; if (!done && a.progress && a.target !== undefined) { let cur = 0; try { cur = a.progress(state.game); } catch (e) { cur = 0; } cur = Math.min(cur, a.target); progressText = ` <span style="color:#60ff60;">(${cur}/${a.target})</span>`; } return `<div class="achievement ${done ? 'done' : ''}"><div class="achievement-icon">${done ? a.icon : '🔒'}</div><div class="achievement-body"><div class="achievement-name">${done ? a.name : '???'}</div><div class="achievement-desc">${a.desc}${progressText}</div><div class="achievement-reward">${done ? `✅ Получено (+${a.reward}💰)` : `🎁 ${a.reward}💰`}</div></div></div>`; }).join(''); const pct = total > 0 ? Math.round((got / total) * 100) : 0; return `<h3>🏆 Достижения: ${got}/${total} <span style="color:#a89060;font-size:14px;">(${pct}%)</span></h3><div class="achievement-list">${items}</div>`; }

export function renderStatistics() { const p = state.game.player; const s = p.stats || {}; const kills = s.kills || {}; const totalKillsVal = Object.values(kills).reduce((a, b) => a + b, 0); const deaths = s.deaths || 0; const goldEarned = s.goldEarned || 0; const chestsOpened = s.chestsOpened || 0; const playtimeSec = p.playtimeSec || 0; const eliteKills = s.eliteKills || 0; const bossKills = s.bossKills || 0; const riftBest = p.riftBest || 0; const ngPlus = p.ngPlus || 0; const achievementsCount = (p.achievements || []).length; const hours = Math.floor(playtimeSec / 3600); const minutes = Math.floor((playtimeSec % 3600) / 60); const playtimeStr = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`; const killRows = Object.entries(kills).filter(([id, n]) => n > 0 && ENEMIES[id]).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<div class="stat-row"><span>${ENEMIES[id].emoji} ${ENEMIES[id].name}</span><span class="stat-val">${n}</span></div>`).join(''); return `<h3>📊 Статистика</h3><div class="stats-grid"><div class="stat-card"><div class="stat-label">⚔️ Убийств</div><div class="stat-value">${totalKillsVal}</div></div><div class="stat-card"><div class="stat-label">💀 Смертей</div><div class="stat-value">${deaths}</div></div><div class="stat-card"><div class="stat-label">💰 Золота</div><div class="stat-value">${goldEarned}</div></div><div class="stat-card"><div class="stat-label">📦 Сундуков</div><div class="stat-value">${chestsOpened}</div></div><div class="stat-card"><div class="stat-label">★ Элитных</div><div class="stat-value">${eliteKills}</div></div><div class="stat-card"><div class="stat-label">☠️ Боссов</div><div class="stat-value">${bossKills}</div></div><div class="stat-card"><div class="stat-label">🏆 Достижений</div><div class="stat-value">${achievementsCount}/${ACHIEVEMENTS.length}</div></div><div class="stat-card"><div class="stat-label">🌀 Разлом</div><div class="stat-value">${riftBest}</div></div><div class="stat-card"><div class="stat-label">🔄 NG+</div><div class="stat-value">${ngPlus}</div></div><div class="stat-card"><div class="stat-label">⏱️ Время</div><div class="stat-value">${playtimeStr}</div></div></div>${killRows ? `<h3 style="margin-top:15px;">Детали по врагам</h3><div class="kill-list">${killRows}</div>` : ''}`; }

export function renderBestiary() {
  const kills = state.game.player.stats?.kills || {};
  const totalKilled = Object.values(kills).reduce((a, b) => a + b, 0);
  const allIds = Object.keys(ENEMIES);
  const totalEnemies = allIds.length;
  const known = allIds.filter(id => (kills[id] || 0) > 0).length;

  const sorted = allIds.sort((a, b) => {
    const ka = (kills[a] || 0) > 0 ? 0 : 1;
    const kb = (kills[b] || 0) > 0 ? 0 : 1;
    if (ka !== kb) return ka - kb;
    return (ENEMIES[a].hp || 0) - (ENEMIES[b].hp || 0);
  });

  const cards = sorted.map(id => {
    const def = ENEMIES[id];
    const cnt = kills[id] || 0;
    const killed = cnt > 0;

    if (!killed) {
      return `<div class="item bestiary-card" style="opacity:0.45;">
        <div class="item-info">
          <div class="item-name" style="color:#6a5a3a;">❓ ??? </div>
          <div class="item-desc">Неизвестное существо. Убейте его, чтобы открыть запись.</div>
        </div>
      </div>`;
    }

    const drops = (def.drops || []).map(d => ITEMS[d]?.name || d).join(', ') || '—';
    const bossTag = def.boss ? ' <span style="color:#b060ff;font-weight:bold;">[БОСС]</span>' : '';
    return `<div class="item bestiary-card">
      <div class="item-info">
        <div class="item-name">${def.emoji || '❓'} ${def.name}${bossTag} <span style="color:#60ff60;font-size:12px;">×${cnt}</span></div>
        <div class="item-desc">
          ❤️ ${def.hp} · ⚔️ ${def.attack} · 🛡️ ${def.defense}<br>
          🏆 ${def.exp} EXP · 💰 ${def.gold} золота<br>
          📦 Дроп: ${drops}
        </div>
      </div>
    </div>`;
  }).join('');

  return `<h3>📖 Бестиарий <span style="color:#a89060;font-size:14px;">(${known}/${totalEnemies})</span></h3>
    <p style="color:#a89060;font-size:13px;margin-bottom:12px;">Всего убито врагов: <b style="color:#ffd060;">${totalKilled}</b></p>
    <div class="item-list">${cards}</div>`;
}

export function renderTalents() {
  const p = state.game.player;
  const allTalents = getClassTalents(p.class);
  const taken = getTakenTalents(p);
  const available = getAvailableTalents(p);
  const nextTier = getNextTierLevel(p);
  let html = '';

  if (available.length) {
    html += `<h3>🌳 Доступные таланты <span style="color:#60ff60;font-size:14px;">(${available.length})</span></h3><p style="color:#a89060;font-size:12px;margin-bottom:10px;">Выбери один из двух.</p><div class="talents-grid">`;
    html += available.map(t => `<div class="talent-card"><div class="talent-icon">${t.icon}</div><div class="talent-name">${t.name}</div><div class="talent-tier">Уровень ${t.tier}</div><div class="talent-desc">${t.desc}</div><button onclick="GameAPI.takeTalent('${t.id}')" class="talent-btn">Выбрать</button></div>`).join('');
    html += `</div>`;
  } else if (nextTier) {
    html += `<div class="talent-next-hint">🌳 Следующий выбор таланта откроется на <b>${nextTier} уровне</b><br><small style="color:#a89060;">Сейчас у тебя ${p.level} уровень</small></div>`;
  } else {
    html += `<div class="talent-next-hint">🌟 Все таланты взяты!</div>`;
  }

  if (taken.length) {
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;flex-wrap:wrap;gap:10px;">
      <h3 style="margin:0;">Взятые таланты (${taken.length}/${allTalents.length / 2})</h3>
      <button onclick="GameAPI.resetTalents()" style="padding:8px 16px;font-size:13px;background:linear-gradient(180deg,#5a1a1a,#2a0a0a);border-color:#ff6060;">🔄 Сбросить (500💰)</button>
    </div>
    <div class="talents-grid">`;
    html += taken.map(t => `<div class="talent-card taken"><div class="talent-icon">${t.icon}</div><div class="talent-name">${t.name}</div><div class="talent-tier">Уровень ${t.tier}</div><div class="talent-desc">${t.desc}</div><div class="talent-badge">✅ Взят</div></div>`).join('');
    html += `</div>`;
  }
  return html;
}

export function claimQuestUI(id) {
  if (claimQuestReward(id)) {
    renderHeader(); openQuestBoard();
  }
}

export function takeTalentUI(id) { const p = state.game.player; const ok = takeTalent(p, id); if (ok) { saveGame(); renderGame(); } }
export function resetTalentsUI() {
  const p = state.game.player;
  const res = resetTalents(p);
  if (!res.ok && res.msg) toast(res.msg);
  else { saveGame(); renderGame(); }
}
