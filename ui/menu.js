import { state } from '../systems/state.js';
import { showScreen, toast } from './screens.js';
import {
  loadGameData, saveSettings, deleteSave, getSlotInfo, getMaxSlot, getMaxSlot as _getMax
} from '../systems/save.js';
import { renderClassSelection } from './character.js';
import { emit } from '../systems/events.js';
import { updateVolume, stopBGM, playBGM } from '../systems/audio.js';
import { CLASSES } from '../data/classes.js';
import { LOCATIONS } from '../data/locations.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { ENEMIES } from '../data/enemies.js';
import { saveGame } from '../systems/save.js';

let currentSettingsTab = 'sound';

export function updateMainMenu() {
  renderSlots();
}

export function renderSlots() {
  const grid = document.getElementById('slots-grid');
  if (!grid) return;
  const max = getMaxSlot();
  let html = '';

  for (let slot = 1; slot <= max; slot++) {
    const info = getSlotInfo(slot);
    if (info) {
      const cls = CLASSES[info.class] || { emoji: '❓', name: '???' };
      const loc = LOCATIONS[info.location] || { emoji: '❓', name: '???' };
      const ng = info.ngPlus > 0 ? ` · <span class="slot-ng">NG+${info.ngPlus}</span>` : '';
      html += `<div class="slot-card">
        <div class="slot-num">Слот ${slot}</div>
        <div class="slot-body">
          <div class="slot-name">${cls.emoji} ${info.name}</div>
          <div class="slot-info">${cls.name}, Ур. ${info.level}${ng}</div>
          <div class="slot-info">${loc.emoji} ${loc.name}</div>
        </div>
        <div class="slot-actions">
          <button onclick="GameAPI.loadSlot(${slot})" class="slot-play">▶️ Продолжить</button>
          <button onclick="GameAPI.deleteSlot(${slot})" class="slot-delete" title="Удалить слот">🗑️</button>
        </div>
      </div>`;
    } else {
      html += `<div class="slot-card empty">
        <div class="slot-num">Слот ${slot}</div>
        <div class="slot-body">
          <div class="slot-info" style="color:#6a5a3a;font-style:italic;">Пустой слот</div>
        </div>
        <div class="slot-actions">
          <button onclick="GameAPI.newGameSlot(${slot})" class="slot-new">⚔️ Новая игра</button>
        </div>
      </div>`;
    }
  }

  grid.innerHTML = html;
}

// ============ НАСТРОЙКИ ============

export function openSettings() {
  currentSettingsTab = 'sound';
  showScreen('screen-settings');
  switchSettingsTab('sound');
}

export function switchSettingsTab(tab) {
  currentSettingsTab = tab;
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderSettingsTab(tab);
}

function renderSettingsTab(tab) {
  const content = document.getElementById('settings-content');
  if (!content) return;
  const s = state.settings;

  if (tab === 'sound') {
    content.innerHTML = `
      <div class="settings-row">
        <label>🎵 Музыка</label>
        <input type="range" id="set-music-volume" min="0" max="100" value="${s.musicVolume ?? 60}" oninput="GameAPI.applySettings()">
        <span id="set-music-volume-val">${s.musicVolume ?? 60}%</span>
      </div>
      <div class="settings-row">
        <label>🔊 Эффекты</label>
        <input type="range" id="set-sfx-volume" min="0" max="100" value="${s.sfxVolume ?? 80}" oninput="GameAPI.applySettings()">
        <span id="set-sfx-volume-val">${s.sfxVolume ?? 80}%</span>
      </div>
      <div class="settings-row">
        <label>🔇 Общий звук</label>
        <select id="set-sound" onchange="GameAPI.applySettings()">
          <option value="on" ${s.soundEnabled !== false ? 'selected' : ''}>Включён</option>
          <option value="off" ${s.soundEnabled === false ? 'selected' : ''}>Выключен</option>
        </select>
        <span></span>
      </div>
    `;
  } else if (tab === 'game') {
    content.innerHTML = `
      <div class="settings-row">
        <label>⚔️ Сложность</label>
        <select id="set-difficulty" onchange="GameAPI.applySettings()">
          <option value="easy" ${s.difficulty === 'easy' ? 'selected' : ''}>Лёгкая</option>
          <option value="normal" ${s.difficulty === 'normal' ? 'selected' : ''}>Обычная</option>
          <option value="hard" ${s.difficulty === 'hard' ? 'selected' : ''}>Сложная</option>
        </select>
        <span></span>
      </div>
      <div class="settings-row">
        <label>💾 Автосохранение</label>
        <select id="set-autosave" onchange="GameAPI.applySettings()">
          <option value="on" ${s.autoSave !== false ? 'selected' : ''}>Включено (каждые 30 сек)</option>
          <option value="off" ${s.autoSave === false ? 'selected' : ''}>Выключено</option>
        </select>
        <span></span>
      </div>
      <div class="settings-row">
        <label>💡 Подсказки хоткеев</label>
        <select id="set-hotkeys" onchange="GameAPI.applySettings()">
          <option value="on" ${s.showHotkeys !== false ? 'selected' : ''}>Показывать</option>
          <option value="off" ${s.showHotkeys === false ? 'selected' : ''}>Скрывать</option>
        </select>
        <span></span>
      </div>
      <div class="settings-row">
        <label>📊 Счётчик FPS</label>
        <select id="set-fps" onchange="GameAPI.applySettings()">
          <option value="off" ${s.showFps !== true ? 'selected' : ''}>Скрыт</option>
          <option value="on" ${s.showFps === true ? 'selected' : ''}>Показывать в бою</option>
        </select>
        <span></span>
      </div>
    `;
  } else if (tab === 'data') {
    content.innerHTML = `
      <p style="color:#a89060;margin-bottom:20px;line-height:1.7;font-size:14px;">Эти действия <b style="color:#ff6060;">необратимы</b>. Используй с осторожностью.</p>
      <button onclick="GameAPI.deleteAllSaves()" style="width:100%;border-color:#8b1a1a;background:linear-gradient(180deg,#5a1a1a,#2a0a0a);">
        🗑️ Удалить ВСЕ сохранения (все 3 слота)
      </button>
      <button onclick="GameAPI.resetAllSettings()" style="width:100%;margin-top:12px;">
        🔄 Сбросить настройки на стандартные
      </button>
    `;
  }
}

export function applySettings() {
  const s = state.settings;
  const musicEl = document.getElementById('set-music-volume');
  const sfxEl = document.getElementById('set-sfx-volume');
  const soundEl = document.getElementById('set-sound');
  const diffEl = document.getElementById('set-difficulty');
  const autoEl = document.getElementById('set-autosave');
  const hkEl = document.getElementById('set-hotkeys');
  const fpsEl = document.getElementById('set-fps');

  if (musicEl) {
    s.musicVolume = parseInt(musicEl.value);
    const val = document.getElementById('set-music-volume-val');
    if (val) val.textContent = s.musicVolume + '%';
  }
  if (sfxEl) {
    s.sfxVolume = parseInt(sfxEl.value);
    const val = document.getElementById('set-sfx-volume-val');
    if (val) val.textContent = s.sfxVolume + '%';
  }
  if (soundEl) s.soundEnabled = soundEl.value === 'on';
  if (diffEl) s.difficulty = diffEl.value;
  if (autoEl) s.autoSave = autoEl.value === 'on';
  if (hkEl) s.showHotkeys = hkEl.value === 'on';
  if (fpsEl) s.showFps = fpsEl.value === 'on';

  updateVolume();
  saveSettings();
}

export function backFromSettings() {
  applySettings();
  if (state.settings.soundEnabled === false) stopBGM();
  else if (state.game && state.overworld) playBGM('explore');
  showScreen('screen-main');
  updateMainMenu();
}

export function resetAllSettings() {
  if (!confirm('Сбросить ВСЕ настройки на стандартные?')) return;
  state.settings = {
    musicVolume: 60, sfxVolume: 80, difficulty: 'normal',
    soundEnabled: true, autoSave: true, showHotkeys: true,
    showFps: false, settingsVersion: 3
  };
  saveSettings();
  updateVolume();
  switchSettingsTab(currentSettingsTab);
  toast('Настройки сброшены');
}

// ============ ДОСТИЖЕНИЯ (в меню) ============

export function openAchievementsMenu() {
  showScreen('screen-achievements-menu');
  renderMenuAchievements();
}

function renderMenuAchievements() {
  const content = document.getElementById('menu-achievements-content');
  if (!content) return;

  if (!state.game) {
    content.innerHTML = `
      <p style="text-align:center;color:#a89060;padding:20px;font-style:italic;">
        Загрузите игру, чтобы увидеть прогресс достижений.<br>
        <small>Показаны все ${ACHIEVEMENTS.length} достижений, но статус скрыт.</small>
      </p>
      <div class="achievement-list">
        ${ACHIEVEMENTS.map(a => `
          <div class="achievement">
            <div class="achievement-icon">🔒</div>
            <div class="achievement-body">
              <div class="achievement-name">???</div>
              <div class="achievement-desc">${a.desc}</div>
              <div class="achievement-reward">🎁 ${a.reward}💰</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    return;
  }

  const unlocked = state.game.player.achievements || [];
  const total = ACHIEVEMENTS.length;
  const got = unlocked.length;

  const items = ACHIEVEMENTS.map(a => {
    const done = unlocked.includes(a.id);
    let progressText = '';
    if (!done && a.progress && a.target !== undefined) {
      let cur = 0;
      try { cur = a.progress(state.game); } catch (e) { cur = 0; }
      cur = Math.min(cur, a.target);
      progressText = ` <span style="color:#60ff60;">(${cur}/${a.target})</span>`;
    }
    return `<div class="achievement ${done ? 'done' : ''}">
      <div class="achievement-icon">${done ? a.icon : '🔒'}</div>
      <div class="achievement-body">
        <div class="achievement-name">${done ? a.name : '???'}</div>
        <div class="achievement-desc">${a.desc}${progressText}</div>
        <div class="achievement-reward">${done ? `✅ Получено (+${a.reward}💰)` : `🎁 ${a.reward}💰`}</div>
      </div>
    </div>`;
  }).join('');

  const pct = total > 0 ? Math.round((got / total) * 100) : 0;

  content.innerHTML = `
    <h3>${state.game.player.name} · ${got}/${total} <span style="color:#a89060;font-size:14px;">(${pct}%)</span></h3>
    <div class="achievement-list">${items}</div>
  `;
}

// ============ ПОМОЩЬ ============

export function openHelp() {
  showScreen('screen-help');
}

// ============ СЛОТЫ ============

export function loadSlot(slot) {
  state.currentSlot = slot;
  if (loadGameData(slot)) {
    const log = document.getElementById('game-log');
    if (log) log.innerHTML = '';
    showScreen('screen-game');
    emit('log', { channel: 'game', msg: `С возвращением, ${state.game.player.name}!`, cls: 'success' });
    emit('game:update');
    playBGM('village');
  } else {
    toast('Не удалось загрузить слот');
  }
}

export function newGameSlot(slot) {
  state.currentSlot = slot;
  state.selectedClass = null;
  renderClassSelection();
  showScreen('screen-char');
}

export function deleteSlot(slot) {
  if (!confirm(`Удалить слот ${slot}? Это необратимо.`)) return;
  deleteSave(slot);
  toast(`Слот ${slot} удалён`);
  renderSlots();
}

export function deleteAllSaves() {
  if (!confirm('Удалить ВСЕ сохранения во всех 3 слотах?\n\nЭто необратимо. Прогресс будет потерян.')) return;
  const max = getMaxSlot();
  for (let i = 1; i <= max; i++) deleteSave(i);
  state.game = null;
  state.currentSlot = 1;
  toast('Все сохранения удалены');
  renderSlots();
}

export function saveAndMenu() {
  saveGame();
  toast('Игра сохранена');
  stopBGM();
  showScreen('screen-main');
  updateMainMenu();
}