import { state } from '../systems/state.js';
import { CLASSES } from '../data/classes.js';
import { createCharacter } from '../systems/character.js';
import { toast } from './screens.js';

export function renderClassSelection() {
  document.getElementById('classes-grid').innerHTML = Object.entries(CLASSES).map(([id, cls]) => `
    <div class="class-card ${state.selectedClass === id ? 'selected' : ''}" onclick="GameAPI.selectClass('${id}')">
      <div style="font-size:50px; text-align:center; margin-bottom:10px;">${cls.emoji}</div>
      <h3 style="text-align:center;">${cls.name}</h3>
      <p style="font-size:12px; text-align:center; color:#a89060; margin-bottom:10px;">${cls.desc}</p>
      <div style="font-size:12px; text-align:center;">
        HP ${cls.baseStats.maxHp} · MP ${cls.baseStats.maxMp}<br>
        СИЛ ${cls.baseStats.str} · ИНТ ${cls.baseStats.int} · МДР ${cls.baseStats.wis} · ТЕЛ ${cls.baseStats.con}
      </div>
    </div>`).join('');
}

export function selectClass(id) {
  state.selectedClass = id;
  renderClassSelection();
}

export function confirmClassSelection() {
  if (!state.selectedClass) return toast('Выберите класс');
  const name = document.getElementById('char-name').value.trim() || 'Герой';
  createCharacter(name, state.selectedClass);
}