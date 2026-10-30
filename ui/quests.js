import { state } from '../systems/state.js';
import { getMissionProgress, isMissionComplete, getActiveCampaignMission, getNextCampaignMission, getMissionReward } from '../systems/campaign.js';
import { STORY } from '../data/story.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { ENEMIES } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { LOCATIONS } from '../data/locations.js';
import { getDailyQuests, claimQuestReward } from '../systems/dailyQuests.js';
import { takeTalent, resetTalents } from '../systems/talents.js';
import { saveGame } from '../systems/save.js';
import { showScreen, toast } from './screens.js';
import { renderGame, renderHeader } from './header.js';

export function openQuestBoard() {
  const quests = getDailyQuests();

  const html = quests.map(quest => {
    const pct = Math.min(100, (quest.current / quest.max) * 100);
    const reward = [];

    if (quest.gold) reward.push(`${quest.gold}💰`);
    if (quest.exp) reward.push(`${quest.exp} EXP`);

    return `
      <div class="npc-slot">
        <div style="font-weight:bold;color:#c9a227;">
          ${quest.completed ? '✅' : '⏳'} ${quest.text}
        </div>

        <div class="bar" style="margin-top:8px;">
          <div class="bar-fill bar-exp" style="width:${pct}%"></div>
          <div class="bar-text">${quest.current} / ${quest.max}</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
          <div style="color:#ffd060;font-size:12px;">
            Награда: ${reward.join(' + ')}
          </div>

          ${
            quest.completed && !quest.claimed
              ? `<button onclick="GameAPI.claimQuest('${quest.id}')" class="sell-btn" style="padding:6px 12px;font-size:12px;">Забрать</button>`
              : quest.claimed
                ? `<span style="color:#60ff60;font-size:12px;">Получено</span>`
                : ''
          }
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <div class="npc-header">
      <div class="npc-emoji">📋</div>
      <div>
        <h3 style="margin:0;">Доска объявлений</h3>
        <p style="color:#a89060;font-style:italic;margin-top:4px;">
          «Ежедневные задания обновляются каждый день.»
        </p>
      </div>
    </div>

    <div class="item-list" style="margin-top:15px;">
      ${html}
    </div>

    <button onclick="GameAPI.closeNpcAndResume()" style="width:100%;margin-top:15px;">
      ← Уйти
    </button>
  `;

  if (state.overworld && state.overworld.active) {
    document.getElementById('npc-dialog-content').innerHTML = content;
    document.getElementById('npc-dialog-modal').style.display = 'flex';
  } else {
    document.getElementById('tab-content').innerHTML = content;
    showScreen('screen-game');
  }
}

function missionComplete(player, mission) {
  return isMissionComplete(player, mission);
}

function actComplete(player, act) {
  return act.missions.every(mission => missionComplete(player, mission));
}

function actUnlocked(player, actIndex) {
  return (
    actIndex === 0 ||
    STORY.acts.slice(0, actIndex).every(act => actComplete(player, act))
  );
}

function missionUnlocked(player, actIndex, missionIndex) {
  if (!actUnlocked(player, actIndex)) return false;
  if (missionIndex === 0) return true;

  return STORY.acts[actIndex].missions
    .slice(0, missionIndex)
    .every(mission => missionComplete(player, mission));
}

function renderMission(player, act, actIndex, mission, missionIndex) {
  const done = missionComplete(player, mission);
  const unlocked = missionUnlocked(player, actIndex, missionIndex);
  const missionProgress = getMissionProgress(player, mission);
  const progress = Math.min(100, (missionProgress.current / missionProgress.required) * 100);
  const enemy = ENEMIES[mission.enemyId];
  const missionLocationId = mission.locationId || act.locationId;
  const location = LOCATIONS[missionLocationId];
  const reward = getMissionReward(mission);

  const status = done
    ? '<span class="campaign-status complete">Сдано Эдвину</span>'
    : missionProgress.active && missionProgress.complete
      ? '<span class="campaign-status ready">Вернуться к Эдвину</span>'
      : missionProgress.active
        ? '<span class="campaign-status active">Принято</span>'
        : !unlocked
          ? '<span class="campaign-status locked">Закрыто</span>'
          : '<span class="campaign-status available">Выдаёт Эдвин</span>';

  return `
    <article class="campaign-mission ${done ? 'done' : ''} ${missionProgress.active ? 'current' : ''} ${!unlocked ? 'locked' : ''}">
      <div class="campaign-mission-top">
        <span class="campaign-mission-number">${act.number}.${missionIndex + 1}</span>
        ${status}
      </div>

      <h4>${mission.title}</h4>
      <p>${mission.desc}</p>

      <div class="campaign-objective">
        <span>${enemy?.emoji || '⚔️'} ${mission.objective}</span>
        <b>${Math.min(missionProgress.current, mission.count)} / ${mission.count}</b>
      </div>

      <div class="campaign-progress">
        <i style="width:${missionProgress.active ? progress : done ? 100 : 0}%"></i>
      </div>

      <small>Регион: ${location?.name || act.locationId} · Награда: ${reward.gold}💰 / ${reward.exp} EXP</small>
    </article>
  `;
}

export function renderQuests() {
  const player = state.game.player;

  const totalMissions = STORY.acts.reduce(
    (sum, act) => sum + act.missions.length,
    0
  );

  let completedMissions = 0;

  for (const act of STORY.acts) {
    for (const mission of act.missions) {
      if (missionComplete(player, mission)) {
        completedMissions++;
      }
    }
  }

  const currentMission = getActiveCampaignMission(player) || getNextCampaignMission(player);
  const currentProgress = currentMission
    ? getMissionProgress(player, currentMission.mission)
    : null;

  const actsHtml = STORY.acts.map((act, actIndex) => {
    const unlocked = actUnlocked(player, actIndex);
    const completed = actComplete(player, act);
    const actDone = act.missions.filter(
      mission => missionComplete(player, mission)
    ).length;

    const actStatus = completed
      ? '✅ Пройден'
      : unlocked
        ? '⚔️ Открыт'
        : '🔒 Не открыт';

    const missionsHtml = act.missions
      .map((mission, missionIndex) =>
        renderMission(player, act, actIndex, mission, missionIndex)
      )
      .join('');

    return `
      <section class="campaign-act ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}">
        <div class="campaign-act-heading">
          <div>
            <span class="campaign-act-kicker">${act.subtitle}</span>
            <h3>${act.number}. ${act.title}</h3>
            <p>${act.intro}</p>
          </div>

          <div class="campaign-act-progress">
            <b>${actDone}/5</b>
            <span>${actStatus}</span>
          </div>
        </div>

        <div class="campaign-missions">
          ${missionsHtml}
        </div>

        ${completed ? `<p class="campaign-outro">${act.outro}</p>` : ''}
      </section>
    `;
  }).join('');

  const shards = Object.values(state.game.shards || {})
    .filter(Boolean).length;

  const shardItems = STORY.quests.map(quest => {
    const complete = !!state.game.quests?.[quest.id];

    return `
      <div class="item ${complete ? 'campaign-shard-done' : ''}">
        <div class="item-info">
          <div class="item-name">
            ${complete ? '✅' : '◇'} ${quest.name}
          </div>
          <div class="item-desc">${quest.desc}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="campaign-header">
      <div>
        <span class="campaign-kicker">Хроники мира · сюжетная кампания</span>
        <h2>Пять актов. Двадцать пять миссий.</h2>
        <p>${STORY.intro}</p>
      </div>

      <div class="campaign-total">
        <b>${completedMissions}/${totalMissions}</b>
        <span>миссий завершено</span>
      </div>
    </div>

    ${
      currentMission
        ? `
          <div class="campaign-current-objective">
            <span>${currentProgress.active ? 'Активное поручение' : 'Следующее поручение'}</span>
            <b>${currentMission.act.number}.${currentMission.missionIndex + 1} — ${currentMission.mission.title}</b>
            <p>${currentMission.mission.objective}</p>
            <p>${currentProgress.active
              ? currentProgress.complete
                ? 'Цель достигнута. Вернитесь к Старейшине Эдвину в Аврору и сдайте поручение.'
                : 'Поручение принято. Побеждайте указанного врага в нужном регионе.'
              : 'Поговорите со Старейшиной Эдвином в Авроре, чтобы принять это задание.'}</p>
          </div>
        `
        : `
          <div class="campaign-current-objective campaign-finished">
            <span>Кампания завершена</span>
            <b>Все пять актов пройдены</b>
            <p>История о пяти печатях завершена. Теперь можно продолжить исследование мира и испытать себя в Разломе.</p>
          </div>
        `
    }

    <div class="campaign-acts">
      ${actsHtml}
    </div>

    <section class="campaign-shards">
      <h3>Осколки Кристалла Маны: ${shards}/3</h3>
      <div class="item-list">${shardItems}</div>
    </section>
  `;
}

export function renderAchievements() {
  const unlocked = state.game.player.achievements || [];
  const total = ACHIEVEMENTS.length;
  const got = unlocked.length;

  const items = ACHIEVEMENTS.map(achievement => {
    const done = unlocked.includes(achievement.id);
    let progressText = '';

    if (!done && achievement.progress && achievement.target !== undefined) {
      let current = 0;

      try {
        current = achievement.progress(state.game);
      } catch {
        current = 0;
      }

      current = Math.min(current, achievement.target);
      progressText = ` <span style="color:#60ff60;">(${current}/${achievement.target})</span>`;
    }

    return `
      <div class="achievement ${done ? 'done' : ''}">
        <div class="achievement-icon">
          ${done ? achievement.icon : '🔒'}
        </div>

        <div class="achievement-body">
          <div class="achievement-name">
            ${done ? achievement.name : '???'}
          </div>

          <div class="achievement-desc">
            ${achievement.desc}${progressText}
          </div>

          <div class="achievement-reward">
            ${
              done
                ? `✅ Получено (+${achievement.reward}💰)`
                : `🎁 ${achievement.reward}💰`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  const pct = total > 0 ? Math.round((got / total) * 100) : 0;

  return `
    <h3>
      🏆 Достижения: ${got}/${total}
      <span style="color:#a89060;font-size:14px;">(${pct}%)</span>
    </h3>
    <div class="achievement-list">${items}</div>
  `;
}

export function renderStatistics() {
  const player = state.game.player;
  const stats = player.stats || {};
  const kills = stats.kills || {};

  const totalKills = Object.values(kills)
    .reduce((sum, value) => sum + value, 0);

  const deaths = stats.deaths || 0;
  const goldEarned = stats.goldEarned || 0;
  const chestsOpened = stats.chestsOpened || 0;
  const playtimeSec = player.playtimeSec || 0;
  const eliteKills = stats.eliteKills || 0;
  const bossKills = stats.bossKills || 0;
  const riftBest = player.riftBest || 0;
  const ngPlus = player.ngPlus || 0;
  const achievementsCount = (player.achievements || []).length;

  const hours = Math.floor(playtimeSec / 3600);
  const minutes = Math.floor((playtimeSec % 3600) / 60);

  const playtimeStr = hours > 0
    ? `${hours}ч ${minutes}м`
    : `${minutes}м`;

  const killRows = Object.entries(kills)
    .filter(([id, count]) => count > 0 && ENEMIES[id])
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => `
      <div class="stat-row">
        <span>${ENEMIES[id].emoji} ${ENEMIES[id].name}</span>
        <span class="stat-val">${count}</span>
      </div>
    `)
    .join('');

  return `
    <h3>📊 Статистика</h3>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">⚔️ Убийств</div>
        <div class="stat-value">${totalKills}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">💀 Смертей</div>
        <div class="stat-value">${deaths}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">💰 Золота</div>
        <div class="stat-value">${goldEarned}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">📦 Сундуков</div>
        <div class="stat-value">${chestsOpened}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">★ Элитных</div>
        <div class="stat-value">${eliteKills}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">☠️ Боссов</div>
        <div class="stat-value">${bossKills}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">🏆 Достижений</div>
        <div class="stat-value">${achievementsCount}/${ACHIEVEMENTS.length}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">🌀 Разлом</div>
        <div class="stat-value">${riftBest}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">🔄 NG+</div>
        <div class="stat-value">${ngPlus}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">⏱️ Время</div>
        <div class="stat-value">${playtimeStr}</div>
      </div>
    </div>

    ${
      killRows
        ? `
          <h3 style="margin-top:15px;">Детали по врагам</h3>
          <div class="kill-list">${killRows}</div>
        `
        : ''
    }
  `;
}

export function renderBestiary() {
  const kills = state.game.player.stats?.kills || {};
  const totalKilled = Object.values(kills)
    .reduce((sum, value) => sum + value, 0);

  const allIds = Object.keys(ENEMIES);
  const totalEnemies = allIds.length;
  const known = allIds.filter(id => (kills[id] || 0) > 0).length;

  const sorted = allIds.sort((a, b) => {
    const aKnown = (kills[a] || 0) > 0 ? 0 : 1;
    const bKnown = (kills[b] || 0) > 0 ? 0 : 1;

    if (aKnown !== bKnown) return aKnown - bKnown;

    return (ENEMIES[a].hp || 0) - (ENEMIES[b].hp || 0);
  });

  const cards = sorted.map(id => {
    const enemy = ENEMIES[id];
    const count = kills[id] || 0;
    const killed = count > 0;

    if (!killed) {
      return `
        <div class="item bestiary-card" style="opacity:0.45;">
          <div class="item-info">
            <div class="item-name" style="color:#6a5a3a;">❓ ???</div>
            <div class="item-desc">
              Неизвестное существо. Убейте его, чтобы открыть запись.
            </div>
          </div>
        </div>
      `;
    }

    const drops = (enemy.drops || [])
      .map(id => ITEMS[id]?.name || id)
      .join(', ') || '—';

    const bossTag = enemy.boss
      ? ' <span style="color:#b060ff;font-weight:bold;">[БОСС]</span>'
      : '';

    return `
      <div class="item bestiary-card">
        <div class="item-info">
          <div class="item-name">
            ${enemy.emoji || '❓'} ${enemy.name}${bossTag}
            <span style="color:#60ff60;font-size:12px;">×${count}</span>
          </div>

          <div class="item-desc">
            ❤️ ${enemy.hp} · ⚔️ ${enemy.attack} · 🛡️ ${enemy.defense}<br>
            🏆 ${enemy.exp} EXP · 💰 ${enemy.gold} золота<br>
            📦 Дроп: ${drops}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <h3>
      📖 Бестиарий
      <span style="color:#a89060;font-size:14px;">(${known}/${totalEnemies})</span>
    </h3>

    <p style="color:#a89060;font-size:13px;margin-bottom:12px;">
      Всего убито врагов:
      <b style="color:#ffd060;">${totalKilled}</b>
    </p>

    <div class="item-list">${cards}</div>
  `;
}

export function claimQuestUI(id) {
  if (claimQuestReward(id)) {
    renderHeader();
    openQuestBoard();
  }
}

export function takeTalentUI(id) {
  const player = state.game.player;
  const ok = takeTalent(player, id);

  if (ok) {
    saveGame();
    renderGame();
  }
}

export function resetTalentsUI() {
  const player = state.game.player;
  const result = resetTalents(player);

  if (!result.ok && result.msg) {
    toast(result.msg);
  } else {
    saveGame();
    renderGame();
  }
}