import assert from 'node:assert/strict';
import { state } from '../systems/state.js';
import { getDailyQuests, updateQuestProgress, claimQuestReward } from '../systems/dailyQuests.js';

const previousStorage = globalThis.localStorage;
const saved = new Map();
globalThis.localStorage = { setItem: (key, value) => saved.set(key, String(value)) };
state.currentSlot = 1;
const now = Date.now();

try {
  state.game = {
    version: 17,
    player: {
      level: 1, exp: 0, expNext: 100, gold: 10,
      dailyQuests: {
        date: now,
        list: [
          { id: 'q-kill-any', text: '<img src=x onerror=alert(1)>', type: 'kill', target: 'any', max: 10, current: 10, completed: true, claimed: false, gold: 999999, exp: 999999 },
          { id: 'q-kill-any', current: 10, completed: true, claimed: false },
          { id: '<svg onload=alert(1)>', current: 10, completed: true, claimed: false }
        ]
      }
    }
  };
  const quests = getDailyQuests();
  assert.equal(quests.length, 3, 'malformed or duplicate daily quests should be replaced');
  assert.ok(quests.every(quest => !quest.text.includes('<')), 'quest display text must come from trusted definitions');

  state.game.player.dailyQuests = {
    date: now,
    list: [
      { id: 'q-kill-any', current: 10, completed: true, claimed: false, gold: 999999, exp: 999999 },
      { id: 'q-kill-goblin', current: 0, completed: false, claimed: false },
      { id: 'q-kill-skeleton', current: 0, completed: false, claimed: false }
    ]
  };
  const normalized = getDailyQuests();
  const target = normalized.find(quest => quest.id === 'q-kill-any');
  assert.ok(target);
  assert.equal(target.gold, 8);
  assert.equal(target.exp, 50);
  assert.equal(claimQuestReward('q-kill-any'), true);
  assert.equal(state.game.player.gold, 18, 'claim must use canonical reward, not imported save values');
  assert.equal(state.game.player.exp, 50);
  assert.equal(claimQuestReward('q-kill-any'), false, 'daily quest reward can only be claimed once');

  state.game.player.dailyQuests = {
    date: now,
    list: [
      { id: 'q-kill-wolf', current: 0, completed: true, claimed: false },
      { id: 'q-kill-any', current: 0, completed: false, claimed: false },
      { id: 'q-kill-goblin', current: 0, completed: false, claimed: false }
    ]
  };
  const repairedCompletion = getDailyQuests().find(quest => quest.id === 'q-kill-wolf');
  assert.equal(repairedCompletion.completed, false, 'completion must be derived from progress, not a saved boolean');
  assert.equal(repairedCompletion.claimed, false, 'an incomplete quest cannot retain a claimed reward flag');
  assert.equal(claimQuestReward('q-kill-wolf'), false, 'a forged completion flag must not unlock a reward');

  updateQuestProgress('kill', 'goblin', '2');
  const goblinQuest = getDailyQuests().find(quest => quest.id === 'q-kill-goblin');
  assert.equal(goblinQuest.current, 2);
  assert.equal(typeof goblinQuest.current, 'number', 'numeric progress input must not turn the counter into a string');

  state.game.player.dailyQuests = {
    date: now,
    list: [
      { id: 'q-kill-goblin', current: 5, completed: true, claimed: false },
      { id: 'q-kill-any', current: 0, completed: false, claimed: false },
      { id: 'q-kill-skeleton', current: 0, completed: false, claimed: false }
    ]
  };
  getDailyQuests();
  state.game.player.gold = Number.MAX_SAFE_INTEGER;
  assert.equal(claimQuestReward('q-kill-goblin'), false, 'daily reward must reject gold balance overflow');
  assert.equal(state.game.player.gold, Number.MAX_SAFE_INTEGER);
  assert.equal(state.game.player.dailyQuests.list[0].claimed, false, 'overflow rejection must not consume the reward');

  for (const invalidGold of ['100', -1, NaN, Infinity]) {
    state.game.player.dailyQuests = {
      date: now,
      list: [
        { id: 'q-kill-goblin', current: 5, completed: true, claimed: false },
        { id: 'q-kill-any', current: 0, completed: false, claimed: false },
        { id: 'q-kill-skeleton', current: 0, completed: false, claimed: false }
      ]
    };
    getDailyQuests();
    state.game.player.gold = invalidGold;
    assert.equal(claimQuestReward('q-kill-goblin'), false, 'daily reward must reject invalid gold balances');
    assert.equal(state.game.player.gold, invalidGold, 'invalid gold balance must remain untouched');
    assert.equal(state.game.player.dailyQuests.list[0].claimed, false, 'invalid balance must not consume the reward');
  }

  state.game.player.dailyQuests = {
    date: now + 3 * 24 * 60 * 60 * 1000,
    list: [
      { id: 'q-kill-goblin', current: 4, completed: false, claimed: false },
      { id: 'q-kill-any', current: 0, completed: false, claimed: false },
      { id: 'q-kill-skeleton', current: 0, completed: false, claimed: false }
    ]
  };
  getDailyQuests();
  assert.ok(state.game.player.dailyQuests.date <= Date.now(), 'future quest timestamps must be repaired');
  assert.ok(state.game.player.dailyQuests.list.every(quest => quest.current === 0), 'future-dated quests must refresh instead of freezing daily rotation');

  state.game.player.dailyQuests = {
    date: now,
    list: [
      { id: 'q-kill-any', current: 0, completed: false, claimed: false },
      { id: 'q-kill-goblin', current: 0, completed: false, claimed: false },
      { id: 'q-kill-skeleton', current: 0, completed: false, claimed: false }
    ]
  };
  getDailyQuests();
  const before = state.game.player.dailyQuests.list[0].current;
  updateQuestProgress('kill', 'any', -5);
  assert.equal(state.game.player.dailyQuests.list[0].current, before, 'negative progress must be ignored');
  updateQuestProgress('kill', 'any', Infinity);
  assert.equal(state.game.player.dailyQuests.list[0].current, before, 'non-finite progress must be ignored');
  assert.ok(saved.has('magic-rpg-save-1'), 'normalized quests and rewards should be saved');
  console.log('check-daily-quests: PASS (save normalization, canonical rewards, forged completion, future dates, progress and balance guards)');
} finally {
  state.game = null;
  if (previousStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = previousStorage;
}
