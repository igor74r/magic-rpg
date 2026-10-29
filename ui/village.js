import { state } from '../systems/state.js';
import { saveGame } from '../systems/save.js';
import { addItem } from '../systems/inventory.js';
import { checkAchievements } from '../systems/achievements.js';
import { emit } from '../systems/events.js';
import { playSound } from '../systems/audio.js';
import { ITEMS } from '../data/items.js';

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function canOpenDaily() {
  const p = state.game?.player;
  if (!p) return false;
  const last = p.stats?.dailyChestAt || 0;
  return Date.now() - last >= DAILY_COOLDOWN_MS;
}

export function timeUntilDaily() {
  const p = state.game?.player;
  if (!p) return 0;
  const last = p.stats?.dailyChestAt || 0;
  const remaining = DAILY_COOLDOWN_MS - (Date.now() - last);
  return Math.max(0, remaining);
}

export function formatRemaining(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

export function openDailyChest() {
  if (!canOpenDaily()) {
    emit('toast', 'Ежедневный сундук ещё не готов');
    return;
  }
  const p = state.game.player;
  if (!p.stats) p.stats = { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 };

  p.gold = (p.gold || 0) + 100;
  p.stats.dailyChestAt = Date.now();
  p.stats.dailyChestsOpened = (p.stats.dailyChestsOpened || 0) + 1;

  const pool = ['health-potion', 'mana-potion', 'strong-health-potion', 'strong-mana-potion'];
  const id = pool[Math.floor(Math.random() * pool.length)];
  addItem(id, 1);

  playSound('chest');
  emit('log', { channel: 'game', msg: `🎁 Ежедневный сундук: +100💰, ${ITEMS[id].name}`, cls: 'success' });
  emit('toast', `🎁 +100💰 и ${ITEMS[id].name}`);

  saveGame();
  checkAchievements();
  emit('game:update');
}