import { state } from '../../systems/state.js';
import { ITEMS } from '../../data/items.js';
import { SPELLS } from '../../data/spells.js';
import { CLASSES } from '../../data/classes.js';
import { ENEMIES } from '../../data/enemies.js';
import { EFFECTS_DATA, MODIFIERS_LABEL } from './models.js';
import {
  combatAttack, combatCastSpell, combatUseItem, combatBlock, combatFlee,
  combatUseAbility
} from '../../systems/overworld.js';

let subPanel = null;
let lastPanelKey = '';

export function getSubPanel() { return subPanel; }
export function setSubPanel(val) { subPanel = val; }

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
  const renderEffectBadges = (effects) => { if (!effects || !effects.length) return ''; return '<div style="display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle;">' + effects.map(e => { const d = EFFECTS_DATA[e.id]; if (!d) return ''; return `<span class="fx-badge" style="border-color:${d.color};color:${d.color};" title="${d.name} (${e.duration})">${d.icon}${e.duration}</span>`; }).join('') + '</div>'; };
  const playerEffects = renderEffectBadges(p.effects); const enemyEffects = renderEffectBadges(c.enemy.effects);
  const showHK = state.settings?.showHotkeys !== false;
  const hotkeyHint = !showHK ? '' : (subPanel ? `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1]–[9] — выбрать · [Esc] — отмена</div>` : `<div style="margin-top:4px;font-size:11px;color:#6a5a3a;">[1] Атака · [2] Магия · [3] Предмет · [4] Побег · [5] Блок · [6] Способность · [Пробел] — быстрая атака · [Esc] — выйти</div>`);
  document.getElementById('combat-panel-info').innerHTML = `⚔️ <b style="color:${nameColor};">${prefix}${def.name}</b> — ${c.enemy.hp}/${c.enemy.maxHp} HP${enemyEffects}${riftLine} · Ход: ${c.turn === 'player' ? '<span style="color:#60ff60;">ваш</span>' : '<span style="color:#ff6060;">врага</span>'}${specialLine}${blockLine}${modLine}${chargeLine}<br><small style="color:#a89060;">Вы${playerEffects} · ${ow.log.slice(-2).map(l => l.msg).join(' · ')}</small>` + hotkeyHint;

  const actions = document.getElementById('combat-panel-actions');
  if (c.turn !== 'player') { actions.innerHTML = `<button disabled style="grid-column:1/-1;">Ход противника...</button>`; return; }

  if (subPanel === 'spells') {
    const btns = p.spells.map((id, i) => {
      const sp = SPELLS[id];
      let disabled = p.mp < sp.cost;
      if (id === 'sacrifice') disabled = p.hp <= p.maxHp * sp.selfDamagePct;
      return `<button onclick="GameAPI.owCast('${id}')" ${disabled ? 'disabled' : ''} style="font-size:13px;">[${i + 1}] ${sp.icon} ${sp.name} ${sp.cost > 0 ? `(${sp.cost})` : '(0)'}</button>`;
    }).join('');
    actions.innerHTML = btns + `<button onclick="GameAPI.owCloseSub()" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`;
    return;
  }

  if (subPanel === 'items') {
    const items = p.inventory.filter(it => ITEMS[it.id].type === 'consumable');
    const btns = items.map((it, i) => { const item = ITEMS[it.id]; return `<button onclick="GameAPI.owUseItem('${it.id}')" style="font-size:13px;">[${i + 1}] ${item.icon} ${item.name} ×${it.qty}</button>`; }).join('');
    actions.innerHTML = (btns || `<p style="color:#a89060;grid-column:1/-1;text-align:center;">Нет предметов</p>`) + `<button onclick="GameAPI.owCloseSub()" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`;
    return;
  }

  if (subPanel === 'abilities') {
    const abilities = cls.abilities || [];
    const btns = abilities.filter(a => !a.passive).map((a, i) => { const cd = p.cooldowns?.[a.id] || 0; const noMp = p.mp < (a.cost || 0); const can = cd === 0 && !noMp; const label = cd > 0 ? `⌛ ${cd}` : (noMp ? 'мало' : `${a.cost || 0}`); return `<button onclick="GameAPI.owUseAbility('${a.id}')" ${can ? '' : 'disabled'} style="font-size:13px;" title="${a.desc}">[${i + 1}] ${a.icon} ${a.name} <small style="color:#a89060;">(${label})</small></button>`; }).join('');
    actions.innerHTML = btns + `<button onclick="GameAPI.owCloseSub()" style="grid-column:1/-1;background:#3a1a1a;">Отмена [Esc]</button>`;
    return;
  }

  const hideMagic = p.class === 'warrior';
  actions.innerHTML = `
    <button onclick="GameAPI.owAttack()">[1] ⚔️ Атака</button>
    ${!hideMagic ? `<button onclick="GameAPI.owOpenSpells()" ${p.spells.length === 0 ? 'disabled' : ''}>[2] ✨ Магия</button>` : ''}
    <button onclick="GameAPI.owOpenItems()" ${p.inventory.filter(i => ITEMS[i.id].type === 'consumable').length === 0 ? 'disabled' : ''}>[3] 🎒 Предмет</button>
    <button onclick="GameAPI.owFlee()">[4] 🏃 Побег</button>
    <button onclick="GameAPI.owBlock()" style="background:linear-gradient(180deg,#2a5a8b,#1a3a6a);border-color:#60a0ff;">[5] 🛡️ Блок</button>
    <button onclick="GameAPI.owOpenAbilities()" style="background:linear-gradient(180deg,#5a2a7a,#3a1a4a);border-color:#b060ff;">[6] ✨ Способность</button>`;
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