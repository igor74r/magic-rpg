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
    version: 8,
    player: {
      name, class: className,
      level: 1, exp: 0, expNext: 100,
      hp: s.maxHp, maxHp: s.maxHp,
      mp: s.maxMp, maxMp: s.maxMp,
      str: s.str, int: s.int, wis: s.wis, con: s.con,
      statPoints: 0,
      gold: 50,
      inventory: [],
      equipped: { weapon: null, armor: null },
      spells: [...cls.startingSpells],
      stats: { kills: {}, deaths: 0, goldEarned: 0, chestsOpened: 0, dailyChestAt: 0, dailyChestsOpened: 0 },
      achievements: [],
      weaponLevel: 0,
      armorLevel: 0,
      herbs: {},
      cooldowns: {},
      effects: [],
      ngPlus: 0,
      riftBest: 0,
      playtimeSec: 0,
      createdAt: Date.now(),
      talents: [],
      victoryAchieved: false, // <--- Флаг для фикса спама NG+
    },
    location: 'village',
    shards: { forest: false, ruins: false, shadow: false },
    quests: {},
  };
  cls.startingItems.forEach(id => addItem(id, 1, { rarity: 'common' }));
  STORY.quests.forEach(q => state.game.quests[q.id] = false);
  saveGame();
  emit('game:started', { name, cls });
}