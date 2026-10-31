import { state } from '../systems/state.js';
import { CLASSES } from '../data/classes.js';
import { LOCATIONS } from '../data/locations.js';
import { EFFECTS } from '../systems/status.js';
import { getEffStats } from '../systems/stats.js';
import { saveGame } from '../systems/save.js';
import { toast } from './screens.js';
import { renderLocations } from './locations.js';
import { renderInventory } from './inventory.js';
import { renderSpells } from './spells.js';
import {
  renderQuests,
  renderAchievements,
  renderStatistics,
  renderBestiary
} from './quests.js';
import { renderPassives } from './passives.js';
import { renderChronicles } from './chronicles.js';
import { DRAGON_SHARDS } from '../data/rift-canon.js';
import { canOpenRift, ensureRiftProgress } from '../systems/rift-progression.js';

let overhaulCssLoaded = false;

function ensureOverhaulCss() {
  if (
    overhaulCssLoaded ||
    document.getElementById('rpg-overhaul-css')
  ) {
    return;
  }

  const link = document.createElement('link');

  link.id = 'rpg-overhaul-css';
  link.rel = 'stylesheet';
  link.href = 'css/rpg-overhaul.css';

  document.head.appendChild(link);

  overhaulCssLoaded = true;
}

export function renderGame() {
  ensureOverhaulCss();

  if (!state.game) return;

  renderHeader();
  renderLocation();
  renderTab(state.currentTab);
}

function totalKills() {
  const kills = state.game.player.stats?.kills || {};

  return Object.values(kills).reduce(
    (sum, value) => sum + value,
    0
  );
}

export function renderHeader() {
  const p = state.game.player;

  const points = p.statPoints || 0;
  const passivePoints = p.passivePoints || 0;

  const stats = getEffStats();

  const statBlock = points > 0
    ? `
      <div class="stat-points-panel">
        <span class="stat-points-label">
          🎯 Очков характеристик: ${points}
        </span>

        <div class="stat-buttons">
          <button onclick="GameAPI.spendStat('str')">+1 СИЛ</button>
          <button onclick="GameAPI.spendStat('int')">+1 ИНТ</button>
          <button onclick="GameAPI.spendStat('wis')">+1 МДР</button>
          <button onclick="GameAPI.spendStat('con')">+1 ТЕЛ</button>
          <button onclick="GameAPI.spendStat('dex')">+1 ЛОВ</button>
        </div>
      </div>
    `
    : '';

  const effectsHtml = renderActiveEffectsInline(p.effects);
  const endgameHtml = renderEndgameHint(p);

  const mpLabel = p.class === 'warrior'
    ? '🔥 Ярость'
    : p.class === 'archer'
      ? '🎯 Концентрация'
      : '🔵 Мана';

  const mpClass = p.class === 'warrior'
    ? 'bar-rage'
    : p.class === 'archer'
      ? 'bar-focus'
      : 'bar-mp';

  const dodge = Math.round(stats.dodgeChance * 100);
  const block = Math.round(stats.blockChance * 100);
  const crit = Math.round(stats.critChance * 100);

  const playerClass = CLASSES[p.class] || CLASSES.mage;

  document.getElementById('game-header').innerHTML = `
    <div class="rpg-header-main">
      <div class="rpg-identity">
        <span class="rpg-player-name">
          ${playerClass.emoji} ${p.name}
        </span>

        <span class="rpg-player-class">
          ${playerClass.name}, Ур. ${p.level}
        </span>
      </div>

      <div class="rpg-gold">
        💰 ${p.gold}
      </div>
    </div>

    <div class="bar">
      <div
        class="bar-fill bar-hp"
        style="width:${p.maxHp > 0 ? p.hp / p.maxHp * 100 : 0}%"
      ></div>

      <div class="bar-text">
        HP ${p.hp}/${p.maxHp}
      </div>
    </div>

    <div class="bar">
      <div
        class="bar-fill ${mpClass}"
        style="width:${p.maxMp > 0 ? p.mp / p.maxMp * 100 : 0}%"
      ></div>

      <div class="bar-text">
        ${mpLabel} ${p.mp}/${p.maxMp}
      </div>
    </div>

    <div class="bar">
      <div
        class="bar-fill bar-exp"
        style="width:${p.expNext > 0 ? p.exp / p.expNext * 100 : 0}%"
      ></div>

      <div class="bar-text">
        EXP ${p.exp}/${p.expNext}
      </div>
    </div>

    <div class="header-exp-caption">
      До следующего уровня: ${p.expNext - p.exp} EXP
    </div>

    <div class="header-combat-stats">
      <span>СИЛ ${p.str}</span>
      <span>ИНТ ${p.int}</span>
      <span>МДР ${p.wis}</span>
      <span>ТЕЛ ${p.con}</span>
      <span>ЛОВ ${p.dex || 0}</span>
      <span>💨 Уклон ${dodge}%</span>
      <span>🛡️ Блок ${block}%</span>
      <span>🎯 Крит ${crit}%</span>
      <span>⚔️ ${totalKills()} убийств</span>

      ${
        passivePoints > 0
          ? `<b class="header-passive-points">✦ ${passivePoints} очк. древа</b>`
          : ''
      }
    </div>

    ${effectsHtml}

    <div class="rpg-endgame-area">
      ${endgameHtml}
    </div>

    ${statBlock}
  `;
}

function renderEndgameHint(p) {
  ensureRiftProgress(p);
  const defeated = DRAGON_SHARDS.filter(dragon => p.dragonDefeated[dragon.shardId]).length;
  const riftBest = p.riftBest || 0;

  if (riftBest > 0) {
    return `
      <div class="endgame-hint rift">
        🌀 Рекорд Разлома: <b>этаж ${riftBest}</b>
      </div>
    `;
  }

  if (canOpenRift(p)) {
    return `
      <div class="endgame-hint rift">
        🌀 <b>Разлом открыт!</b>
        Три драконьи печати восстановлены
      </div>
    `;
  }

  const nextDragon = DRAGON_SHARDS.find(dragon => !p.dragonDefeated[dragon.shardId]);
  const nextHint = nextDragon
    ? `Следующий страж: ${nextDragon.name} · Ур. ${nextDragon.requiredLevel}`
    : 'Проверьте условия открытия Разлома';

  return `
    <div class="endgame-hint">
      🐉 Драконьи печати: <b>${defeated}/3</b>
      <small>${nextHint}</small>
    </div>
  `;
}

function renderActiveEffectsInline(effects) {
  if (!Array.isArray(effects) || !effects.length) {
    return '';
  }

  const badges = effects.map(effect => {
    const data = EFFECTS[effect.id];

    if (!data) return '';

    return `
      <span
        class="fx-badge"
        style="border-color:${data.color};color:${data.color};"
        title="${data.name}${data.desc ? ': ' + data.desc : ''} (${effect.duration} ход.)"
      >
        ${data.icon}${effect.duration}
      </span>
    `;
  }).join('');

  return `
    <div class="effects-inline">
      <span class="effects-inline-label">Эффекты:</span>
      ${badges}
    </div>
  `;
}

const STAT_NAMES = {
  str: 'Силе',
  int: 'Интеллекту',
  wis: 'Мудрости',
  con: 'Телосложению',
  dex: 'Ловкости'
};

export function spendStat(stat) {
  const p = state.game.player;

  if (
    !p.statPoints ||
    p.statPoints <= 0 ||
    !(stat in STAT_NAMES)
  ) {
    return;
  }

  p[stat] = (p[stat] || 0) + 1;
  p.statPoints -= 1;

  if (stat === 'con') {
    p.maxHp += 10;
  }

  if (stat === 'int') {
    p.maxMp += 5;
  }

  saveGame();
  renderHeader();

  toast(`+1 к ${STAT_NAMES[stat]}`);
}

function renderLocation() {
  const element = document.getElementById('location-info');

  if (element) {
    element.innerHTML = '';
  }
}

export function switchTab(tab) {
  state.currentTab = tab;

  document.querySelectorAll('.tab').forEach(element => {
    element.classList.toggle(
      'active',
      element.dataset.tab === tab
    );
  });

  renderTab(tab);
}

function renderTab(tab) {
  const element = document.getElementById('tab-content');
  if (!element) return;

  if (
    tab === 'spells' &&
    state.game.player.class === 'warrior'
  ) {
    element.innerHTML = `
      <div class="rpg-empty-state">
        <div>⚔️</div>
        <h3>Воин не использует заклинания</h3>
        <p>Его сила — оружие, стойка, ярость и боевые умения.</p>
      </div>
    `;

    return;
  }

  if (tab === 'locations') {
    element.innerHTML = renderLocations();
  } else if (tab === 'inventory') {
    element.innerHTML = renderInventory();
  } else if (tab === 'spells') {
    element.innerHTML = renderSpells();
  } else if (tab === 'quests') {
    element.innerHTML = renderQuests();
  } else if (tab === 'achievements') {
    element.innerHTML = renderAchievements();
  } else if (tab === 'statistics') {
    element.innerHTML = renderStatistics();
  } else if (tab === 'talents') {
    element.innerHTML = renderPassives();
  } else if (tab === 'bestiary') {
    element.innerHTML = renderBestiary();
  } else if (tab === 'chronicles') {
    element.innerHTML = renderChronicles();
  }
}