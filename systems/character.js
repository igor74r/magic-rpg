import { state } from './state.js';
import { CLASSES } from '../data/classes.js';
import { STORY } from '../data/story.js';
import { addItem } from './inventory.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

export function createCharacter(name, className) {
  const cls = CLASSES[className];
  const s = cls.baseStats;
  state.game = {
    version: 9,
    player: {
      name, class: className, level: 1, exp: 0, expNext: 100,
      hp: s.maxHp, maxHp: s.maxHp, mp: s.maxMp, maxMp: s.maxMp,
      str: s.str, int: s.int, wis: s.wis, con: s.con,
      statPoints: 0, gold: 50,
      inventory: [], equipped: { weapon: null, armor: null },
      spells: [...cls.startingSpells],
      stats: { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0, eliteKills: 0, bossKills: 0, flawlessStreak: 0 },
      achievements: [], weaponLevel: 0, armorLevel: 0,
      herbs: {}, cooldowns: {}, effects: [],
      ngPlus: 0, riftBest: 0, playtimeSec: 0, createdAt: Date.now(),
      talents: [], victoryAchieved: false,
      dailyQuests: { date: 0, list: [] },
      buffs: [],
    },
    location: 'village',
    shards: { forest: false, ruins: false, shadow: false },
    quests: {},
  };

  if (className === 'warrior') state.game.player.mp = 0;

  cls.startingItems.forEach(id => addItem(id, 1, { rarity: 'common' }));
  STORY.quests.forEach(q => state.game.quests[q.id] = false);
  saveGame();
  emit('game:started', { name, cls });
}