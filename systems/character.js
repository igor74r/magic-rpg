import { state } from './state.js';
import { CLASSES } from '../data/classes.js';
import { STORY } from '../data/story.js';
import { addItem } from './inventory.js';
import { saveGame } from './save.js';
import { emit } from './events.js';

export function createCharacter(name, className) {
  const cls = CLASSES[className];

  if (!cls || !['warrior', 'mage', 'archer'].includes(className)) {
    return false;
  }

  const stats = cls.baseStats;

  state.game = {
    version: 13,

    player: {
      name,
      class: className,

      level: 1,
      exp: 0,
      expNext: 100,

      hp: stats.maxHp,
      maxHp: stats.maxHp,

      mp: 0,
      maxMp: stats.maxMp,

      str: stats.str,
      int: stats.int,
      wis: stats.wis,
      con: stats.con,
      dex: stats.dex || 0,

      statPoints: 0,
      passivePoints: 0,
      campaignKills: {},
      campaignClaimed: {},
      activeCampaignMission: null,
      campaignShards: {},

      gold: 0,

      inventory: [],

      equipped: {
        weapon: null,
        head: null,
        shoulders: null,
        chest: null,
        back: null,
        wrists: null,
        hands: null,
        legs: null,
        ring1: null,
        ring2: null,
        amulet: null,
        seal: null
      },

      spells: [...cls.startingSpells],

      stats: {
        kills: {},
        deaths: 0,
        goldEarned: 0,
        chestsOpened: 0,
        dailyChestAt: 0,
        dailyChestsOpened: 0,
        eliteKills: 0,
        bossKills: 0,
        flawlessStreak: 0
      },

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
      passives: ['start'],

      victoryAchieved: false,

      dailyQuests: {
        date: 0,
        list: []
      },

      buffs: []
    },

    location: 'village',

    shards: {
      forest: false,
      ruins: false,
      shadow: false
    },

    quests: {}
  };

  // Маг начинает с полной маной.
  // Воин копит ярость, Лучник — концентрацию в бою.
  if (className === 'mage') {
    state.game.player.mp = stats.maxMp;
  }

  for (const itemId of cls.startingItems) {
    addItem(itemId, 1, { rarity: 'common' });
  }

  STORY.quests.forEach(quest => {
    state.game.quests[quest.id] = false;
  });

  saveGame();

  emit('game:started', {
    name,
    cls
  });

  return true;
}