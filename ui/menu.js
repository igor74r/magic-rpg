import { state } from '../systems/state.js';
import { showScreen, toast } from './screens.js';
import {
  loadGameData, saveSettings, deleteSave, getSlotInfo, getMaxSlot
} from '../systems/save.js';
import { renderClassSelection } from './character.js';
import { emit } from '../systems/events.js';
import { updateVolume, stopAmbient, playSound } from '../systems/audio.js';
import { CLASSES } from '../data/classes.js';
import { LOCATIONS } from '../data/locations.js';

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

export function openSettings() {
  document.getElementById('set-volume').value = state.settings.volume;
  document.getElementById('set-difficulty').value = state.settings.difficulty;
  document.getElementById('set-sound').value = state.settings.soundEnabled === false ? 'off' : 'on';
  showScreen('screen-settings');
}

export function backFromSettings() {
  state.settings.volume = parseInt(document.getElementById('set-volume').value);
  state.settings.difficulty = document.getElementById('set-difficulty').value;
  state.settings.soundEnabled = document.getElementById('set-sound').value === 'on';
  saveSettings();
  updateVolume();
  if (state.settings.soundEnabled === false) stopAmbient();
  showScreen('screen-main');
  updateMainMenu();
}

export function loadSlot(slot) {
  state.currentSlot = slot;
  if (loadGameData(slot)) {
    const log = document.getElementById('game-log');
    if (log) log.innerHTML = '';
    showScreen('screen-game');
    emit('log', { channel: 'game', msg: `С возвращением, ${state.game.player.name}!`, cls: 'success' });
    emit('game:update');
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

export function saveAndMenu() {
  saveGameWrapper();
  toast('Игра сохранена');
  stopAmbient();
  showScreen('screen-main');
  updateMainMenu();
}

function saveGameWrapper() {
  // импорт в начале модуля не подходит из-за циклов — импортируем здесь
  import('../systems/save.js').then(m => m.saveGame());
}