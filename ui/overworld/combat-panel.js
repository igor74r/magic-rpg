import { state } from '../../systems/state.js';
import { ITEMS } from '../../data/items.js';
import { SPELLS } from '../../data/spells.js';
import { CLASSES } from '../../data/classes.js';
import { ENEMIES } from '../../data/enemies.js';
import { EFFECTS_DATA, MODIFIERS_LABEL } from './models.js';
import { escapeHtml } from '../screens.js';
import {
  combatAttack, combatCastSpell, combatUseItem, combatBlock, combatFlee,
  combatUseAbility
} from '../../systems/overworld.js';

let subPanel = null;
let lastPanelKey = '';

export function getSubPanel() { return subPanel; }
export function setSubPanel(val) { subPanel = val; }

function setCombatActionsMarkup(actions, markup) {
  const active = actions.contains?.(document.activeElement) ? document.activeElement : null;
  const activeAction = active?.dataset.combatAction;
  const activeId = active?.dataset.actionId;
  actions.innerHTML = markup;
  if (!activeAction) return;
  const next = [...actions.querySelectorAll('button[data-combat-action]')].find(button =>
    button.dataset.combatAction === activeAction &&
    (activeId === undefined || button.dataset.actionId === activeId)
  );
  (next || actions.querySelector('button:not(:disabled)'))?.focus();
}

export function renderCombatPanel() {
  const panel = document.getElementById('combat-panel'); if (!panel) return;
  const ow = state.overworld; if (!ow || !ow.combat) { panel.style.display = 'none'; lastPanelKey = ''; return; }
  const c = ow.combat; const p = state.game.player; const cls = CLASSES[p.class];
  const cdKey = cls.abilities?.map(a => `${a.id}:${p.cooldowns?.[a.id] || 0}`).join(',') || '';
  const pEffKey = (p.effects || []).map(e => `${e.id}:${e.duration}`).join(','); const eEffKey = (c.enemy.effects || []).map(e => `${e.id}:${e.duration}`).join(',');
  const key = `${c.turn}|${c.enemy.hp}|${subPanel}|${p.hp}|${p.mp}|${p.inventory.length}|${ow.log.length}|${c.turnCount}|${c.blocking}|${cdKey}|${pEffKey}|${eEffKey}|${c.playerChargeNext}|${ow.rifFloor}|${ow.rifMode}`;
  if (key === lastPanelKey) return; lastPanelKey = key;
  panel.style.display = 'block'; const def = ENEMIES[c.enemy.enemyId]; const prefix = c.enemy.boss ? '☠ ' : c.enemy.elite ? '★ ' : '';
  const nameColor = c.enemy.boss ? '#b060ff' : c.enemy.elite ? '#ffd060' : '#d4c8a8';
  let specialLine = '';
  if (def.special) { const every = def.special.every; const rem = every - (c.turnCount % every); if (rem === 1) specialLine = ` · <span style="color:#ff4040;font-weight:bold;">⚠️ ${def.special.name} — следующий ход!</span>`; else specialLine = ` · <span style="color:#ffa500;">${def.special.name} через ${rem} хода</span>`; }
  const blockLine = c.blocking ? ` · <span style="color:#60ff60;">🛡️ блок</span>` : ''; const modLine = c.enemy.modifier ? ` · <span style="color:${MODIFIERS_LABEL[c.enemy.modifier].color};">${MODIFIERS_LABEL[c.enemy.modifier].prefix} ${MODIFIERS_LABEL[c.enemy.modifier].name}</span>` : '';
  const chargeLine = c.playerChargeNext ? ` · <span style="color:#ffd060;">⚡ рывок готов</span>` : ''; const riftLine = ow.rifMode ? ` · <span style="color:#b060ff;font-weight:bold;">🌀 Этаж ${ow.rifFloor}</span>` : '';
  const renderEffectBadges = (effects) => { if (!effects || !effects.length) return ''; return '<div style="display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle;">' + effects.map(e => { const d = EFFECTS_DATA[e.id]; if (!d) return ''; return `<span class="fx-badge" style="border-color:${d.color};color:${d.color};" title="${escapeHtml(d.name)} (${e.duration})">${escapeHtml(d.icon)}${e.duration}</span>`; }).join('') + '</div>'; };
  const playerEffects = renderEffectBadges(p.effects); const enemyEffects = renderEffectBadges(c.enemy.effects);
  const showHK = state.settings?.showHotkeys !== false;
  const hotkeyHint = !showHK ? '' : (subPanel ? `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1]–[9] — выбрать · [Esc] — отмена</div>` : `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1] Атака · [2] Магия · [3] Предмет · [4] Побег · [5] Блок · [6] Способность · [Пробел] — быстрая атака · [Esc] — выйти</div>`);
  document.getElementById('combat-panel-info').innerHTML = `⚔️ <b style="color:${nameColor};">${prefix}${escapeHtml(def.name)}</b> — ${c.enemy.hp}/${c.enemy.maxHp} HP${enemyEffects}${riftLine} · Ход: ${c.turn === 'player' ? '<span style="color:#60ff60;">ваш</span>' : '<span style="color:#ff6060;">врага</span>'}${specialLine}${blockLine}${modLine}${chargeLine}<br><small style="color:#a89060;">Вы${playerEffects} · ${escapeHtml(ow.log.slice(-2).map(l => l.msg).join(' · '))}</small>` + hotkeyHint;

  const actions = document.getElementById('combat-panel-actions');
  if (!actions) return;
  actions.onclick = (event) => {
    const button = event.target.closest('button[data-combat-action]');
    if (!button || button.disabled || !actions.contains(button)) return;
    const action = button.dataset.combatAction;
    const id = button.dataset.actionId;
    switch (action) {
      case 'attack': owAttack(); break;
      case 'open-spells': owOpenSpells(); break;
      case 'open-items': owOpenItems(); break;
      case 'flee': owFlee(); break;
      case 'block': owBlock(); break;
      case 'open-abilities': owOpenAbilities(); break;
      case 'cast': if (id && SPELLS[id]) owCast(id); break;
      case 'use-item': if (id && ITEMS[id]?.type === 'consumable') owUseItem(id); break;
      case 'use-ability': if (id && cls.abilities?.some(a => a.id === id && !a.passive)) owUseAbility(id); break;
      case 'close-sub': owCloseSub(); break;
      default: break;
    }
  };
  if (c.turn !== 'player') {
    setCombatActionsMarkup(actions, `<button type="button" disabled style="grid-column:1/-1;">Ход противника...</button>`);
    return;
  }

  if (subPanel === 'spells') {
    const btns = p.spells.map((id, i) => {
      const sp = SPELLS[id];
      if (!sp) return '';
      let disabled = p.mp < sp.cost;
      if (id === 'sacrifice') disabled = p.hp <= p.maxHp * sp.selfDamagePct;
      return `<button type="button" data-combat-action="cast" data-action-id="${escapeHtml(id)}" ${disabled ? 'disabled' : ''} style="font-size:13px;">[${i + 1}] ${escapeHtml(sp.icon)} ${escapeHtml(sp.name)} ${sp.cost > 0 ? `(${sp.cost})` : '(0)'}</button>`;
    }).join('');
    setCombatActionsMarkup(actions, btns + `<button type="button" data-combat-action="close-sub" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`);
    return;
  }

  if (subPanel === 'items') {
    const items = p.inventory.filter(it => ITEMS[it.id]?.type === 'consumable');
    const btns = items.map((it, i) => {
      const item = ITEMS[it.id];
      if (!item) return '';
      return `<button type="button" data-combat-action="use-item" data-action-id="${escapeHtml(it.id)}" style="font-size:13px;">[${i + 1}] ${escapeHtml(item.icon)} ${escapeHtml(item.name)} ×${escapeHtml(it.qty)}</button>`;
    }).join('');
    setCombatActionsMarkup(actions, (btns || `<p style="color:#a89060;grid-column:1/-1;text-align:center;">Нет предметов</p>`) + `<button type="button" data-combat-action="close-sub" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`);
    return;
  }

  if (subPanel === 'abilities') {
    const abilities = cls.abilities || [];
    const btns = abilities.filter(a => !a.passive).map((a, i) => {
      const cd = p.cooldowns?.[a.id] || 0;
      const noMp = p.mp < (a.cost || 0);
      const can = cd === 0 && !noMp;
      const label = cd > 0 ? `⌛ ${cd}` : (noMp ? 'мало' : `${a.cost || 0}`);
      return `<button type="button" data-combat-action="use-ability" data-action-id="${escapeHtml(a.id)}" ${can ? '' : 'disabled'} style="font-size:13px;" title="${escapeHtml(a.desc)}">[${i + 1}] ${escapeHtml(a.icon)} ${escapeHtml(a.name)} <small style="color:#a89060;">(${escapeHtml(label)})</small></button>`;
    }).join('');
    setCombatActionsMarkup(actions, btns + `<button type="button" data-combat-action="close-sub" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`);
    return;
  }

  const hideMagic = p.class === 'warrior';
  actions.innerHTML = `
    <button data-combat-action="attack">[1] ⚔️ Атака</button>
    ${!hideMagic ? `<button data-combat-action="open-spells" ${p.spells.length === 0 ? 'disabled' : ''}>[2] ✨ Магия</button>` : ''}
    <button data-combat-action="open-items" ${p.inventory.filter(i => ITEMS[i.id]?.type === 'consumable').length === 0 ? 'disabled' : ''}>[3] 🎒 Предмет</button>
    <button data-combat-action="flee">[4] 🏃 Побег</button>
    <button data-combat-action="block" style="background:linear-gradient(180deg,#2a5a8b,#1a3a6a);border-color:#60a0ff;">[5] 🛡️ Блок</button>
    <button data-combat-action="open-abilities" style="background:linear-gradient(180deg,#5a2a7a,#3a1a4a);border-color:#b060ff;">[6] ✨ Способность</button>`;
}

export function owOpenSpells() { subPanel = 'spells'; renderCombatPanel(); }
export function owOpenItems() { subPanel = 'items'; renderCombatPanel(); }
export function owOpenAbilities() { subPanel = 'abilities'; renderCombatPanel(); }
export function owCloseSub() { subPanel = null; renderCombatPanel(); }
export function owAttack() { combatAttack(); subPanel = null; renderCombatPanel(); }
export function owCast(id) { combatCastSpell(id); subPanel = null; renderCombatPanel(); }
export function owUseItem(id) { combatUseItem(id); subPanel = null; renderCombatPanel(); }
export function owBlock() { combatBlock(); subPanel = null; renderCombatPanel(); }
export function owUseAbility(id) { combatUseAbility(id); subPanel = null; renderCombatPanel(); }
export function owFlee() { combatFlee(false); subPanel = null; renderCombatPanel(); }