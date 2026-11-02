import { state } from '../systems/state.js';
import { CLASSES } from '../data/classes.js';
import { createCharacter } from '../systems/character.js';
import { toast } from './screens.js';
import { drawHero } from './overworld/sprites.js';

const PLAYABLE_CLASSES = ['warrior', 'mage', 'archer'];

function drawClassModels() {
  for (const classId of PLAYABLE_CLASSES) {
    const canvas = document.getElementById(`class-model-${classId}`);

    if (!canvas) continue;

    const ctx = canvas.getContext('2d');

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawHero(
      ctx,
      canvas.width / 2,
      canvas.height - 12,
      classId,
      'rgba(0,0,0,0.38)'
    );
  }
}

export function renderClassSelection() {
  const root = document.getElementById('classes-grid');

  if (!root) return;

  if (root.dataset.classSelectionBound !== 'true') {
    root.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest('[data-class-id]');
      if (card && root.contains(card)) selectClass(card.dataset.classId);
    });
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest('[data-class-id]');
      if (!card || !root.contains(card)) return;
      event.preventDefault();
      const classId = card.dataset.classId;
      selectClass(classId);
      root.querySelector(`[data-class-id="${classId}"]`)?.focus();
    });
    root.dataset.classSelectionBound = 'true';
  }

  root.innerHTML = Object.entries(CLASSES)
    .filter(([id]) => PLAYABLE_CLASSES.includes(id))
    .map(([id, cls]) => {
      const combat = cls.combat || {};
      const resource = cls.resourceName || 'Ресурс';

      return `
        <div
          class="class-card ${state.selectedClass === id ? 'selected' : ''}"
          data-class-id="${id}"
          role="button"
          tabindex="0"
          aria-pressed="${state.selectedClass === id}"
        >
          <div class="class-model-frame">
            <canvas
              id="class-model-${id}"
              width="100"
              height="112"
              aria-label="Модель класса ${cls.name}"
            ></canvas>
          </div>

          <h3>${cls.name}</h3>

          <div class="class-role">
            ${cls.role || ''}
          </div>

          <p class="class-description">
            ${cls.desc}
          </p>

          <div class="class-base-stats">
            <b>❤️ ${cls.baseStats.maxHp} HP</b>
            <b>🔷 ${cls.baseStats.maxMp} ${resource}</b>

            <span>СИЛ ${cls.baseStats.str}</span>
            <span>ИНТ ${cls.baseStats.int}</span>
            <span>МДР ${cls.baseStats.wis}</span>
            <span>ТЕЛ ${cls.baseStats.con}</span>
            <span>ЛОВ ${cls.baseStats.dex || 0}</span>

            <span>
              💨 Уклон ${Math.round((combat.dodgeChance || 0) * 100)}%
            </span>

            <span>
              🛡️ Блок ${Math.round((combat.blockChance || 0) * 100)}%
            </span>

            <span>
              🎯 Крит ${Math.round((combat.critChance || 0) * 100)}%
            </span>
          </div>
        </div>
      `;
    })
    .join('');

  requestAnimationFrame(drawClassModels);
}

export function selectClass(id) {
  if (!PLAYABLE_CLASSES.includes(id)) return;

  state.selectedClass = id;
  renderClassSelection();
}

export function confirmClassSelection() {
  if (!state.selectedClass) {
    return toast('Выберите класс');
  }

  const name =
    document.getElementById('char-name').value.trim() || 'Герой';

  createCharacter(name, state.selectedClass);
}