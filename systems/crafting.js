import { state } from './state.js';
import { ITEMS } from '../data/items.js';
import { NPCS, FORGE_BONUS } from '../data/npcs.js';
import { addItem, removeItem, countItem } from './inventory.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

export function getEquipmentForgeLevel(slot) {
  const inst = state.game?.player?.equipped?.[slot];
  if (!inst) return 0;
  if (typeof inst === 'string') return 0;
  return inst.forgeLevel || 0;
}

export function canUpgrade(slot) {
  const p = state.game.player;
  const inst = p.equipped[slot];
  if (!inst) return { ok: false, msg: 'Сначала экипируйте предмет в этот слот' };
  if (typeof inst === 'string') return { ok: false, msg: 'Ошибка формата предмета' };

  const level = inst.forgeLevel || 0;
  const maxLevel = NPCS.blacksmith.maxLevel;
  if (level >= maxLevel) return { ok: false, msg: 'Максимальный уровень улучшения' };

  const upgrade = NPCS.blacksmith.upgrades[level];
  if (p.gold < upgrade.cost) return { ok: false, msg: `Не хватает золота (нужно ${upgrade.cost})` };

  return { ok: true, nextLevel: level + 1, cost: upgrade.cost, bonus: upgrade.forgeBonus };
}

export function upgradeEquipment(slot) {
  const check = canUpgrade(slot);
  if (!check.ok) return check;

  const p = state.game.player;
  const inst = p.equipped[slot];
  p.gold -= check.cost;
  inst.forgeLevel = (inst.forgeLevel || 0) + 1;

  saveGame();
  emit('toast', `⚒️ Улучшено до +${inst.forgeLevel} (−${check.cost}💰)`);
  emit('game:update');
  return { ok: true };
}

export function healAtHealer() {
  const p = state.game.player;
  const cost = NPCS.healer.cost;

  if (p.hp >= p.maxHp && p.mp >= p.maxMp) {
    return { ok: false, msg: 'Вы полностью здоровы' };
  }
  if (p.gold < cost) {
    return { ok: false, msg: `Не хватает золота (нужно ${cost})` };
  }

  p.gold -= cost;
  p.hp = p.maxHp;
  p.mp = p.maxMp;
  saveGame();
  emit('toast', `💚 Полное исцеление (−${cost}💰)`);
  emit('game:update');
  return { ok: true };
}

export function craftRecipe(recipeId) {
  const recipe = NPCS.alchemist.recipes.find(r => r.id === recipeId);
  if (!recipe) return { ok: false, msg: 'Рецепт не найден' };

  for (const ing of recipe.ingredients) {
    const have = countItem(ing.id);
    if (have < ing.qty) {
      const itemName = ITEMS[ing.id]?.name || ing.id;
      return { ok: false, msg: `Не хватает: ${itemName} (${have}/${ing.qty})` };
    }
  }

  for (const ing of recipe.ingredients) {
    removeItem(ing.id, ing.qty);
  }
  addItem(recipe.result, recipe.qty);

  saveGame();
  emit('toast', `⚗️ Скрафчено: ${ITEMS[recipe.result].name} ×${recipe.qty}`);
  emit('game:update');
  return { ok: true };
}

export function forgeBonusFor(slot) {
  const level = getEquipmentForgeLevel(slot);
  return FORGE_BONUS[level] || 0;
}