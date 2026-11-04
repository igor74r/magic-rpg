import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getSecretWallCount } from '../systems/overworld/secrets.js';

assert.equal(getSecretWallCount(() => 0), 2, 'lowest roll should create a second secret');
assert.equal(getSecretWallCount(() => 0.199999), 2, '20% bonus-secret threshold is inclusive below 0.2');
assert.equal(getSecretWallCount(() => 0.2), 1, 'ordinary roll should still guarantee one secret');
assert.equal(getSecretWallCount(() => 0.999999), 1, 'high roll should never remove the guaranteed secret');

const overworldUi = readFileSync(new URL('../ui/overworld.js', import.meta.url), 'utf8');
const mainUi = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
assert.match(overworldUi, /getSecretWallCount\(\)/, 'overworld must use tested secret-count helper');
assert.match(mainUi, /if \(ev\.resolved\) return/, 'world events must reject duplicate resolution');
assert.match(mainUi, /if \(!saveGame\(\)\) \{[\s\S]*?state\.game = previousGame/, 'failed event save must roll back player rewards');
assert.match(mainUi, /getGoldRewardTotals\(p, 12\)/, 'mimic gold must validate balance and lifetime-earned total');
assert.match(mainUi, /getGoldRewardTotals\(p, 8\)/, 'crystal gold must validate balance and lifetime-earned total');
assert.match(mainUi, /Награда не сохранена\. Событие восстановлено/, 'failed event save must restore event for retry');

console.log('check-world-exploration: OK — guaranteed secrets and transactional world events');
