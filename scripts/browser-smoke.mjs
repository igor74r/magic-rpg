import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
  stdio: 'ignore'
});
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Static game server did not start');
}

async function checkViewport(page, label) {
  const metrics = await page.evaluate(() => {
    const settings = document.getElementById('screen-settings');
    const content = document.getElementById('settings-content');
    return {
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      settingsWidth: settings?.getBoundingClientRect().width ?? 0,
      settingsScrollWidth: settings?.scrollWidth ?? 0,
      contentWidth: content?.getBoundingClientRect().width ?? 0,
      contentScrollWidth: content?.scrollWidth ?? 0
    };
  });
  assert.ok(metrics.documentWidth <= metrics.viewport + 1, `${label}: document overflows horizontally: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.bodyWidth <= metrics.viewport + 1, `${label}: body overflows horizontally: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.settingsScrollWidth <= metrics.settingsWidth + 1, `${label}: settings screen overflows: ${JSON.stringify(metrics)}`);
  assert.ok(metrics.contentScrollWidth <= metrics.contentWidth + 1, `${label}: settings content overflows: ${JSON.stringify(metrics)}`);
}

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'small-mobile', width: 320, height: 740 }
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('magic-rpg-prologue-seen', '1'));
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    assert.equal(await page.locator('#screen-main.active').count(), 1, `${viewport.name}: main menu did not open`);
    await page.getByRole('button', { name: /Настройки/ }).click();
    assert.equal(await page.locator('#screen-settings.active').count(), 1, `${viewport.name}: settings screen did not open`);

    await page.locator('[data-tab="sound"]').click();
    await page.locator('#set-music-volume').waitFor();
    await checkViewport(page, `${viewport.name}/sound`);

    await page.locator('[data-tab="game"]').click();
    await page.locator('#set-difficulty').waitFor();
    await page.locator('#set-difficulty').selectOption('hard');
    await page.locator('#set-autosave').selectOption('off');
    await page.locator('#set-autosave-interval').selectOption('60');
    await checkViewport(page, `${viewport.name}/game`);

    await page.locator('[data-tab="accessibility"]').click();
    await page.locator('#set-reduced-motion').waitFor();
    await page.locator('#set-reduced-motion').selectOption('on');
    await page.locator('#set-screen-shake').selectOption('off');
    await checkViewport(page, `${viewport.name}/accessibility`);

    await page.locator('[data-tab="data"]').click();
    await page.getByRole('button', { name: /Экспортировать сейв/ }).waitFor();
    await checkViewport(page, `${viewport.name}/data`);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('magic-rpg-settings')));
    assert.equal(stored.difficulty, 'hard', `${viewport.name}: difficulty was not saved`);
    assert.equal(stored.autoSave, false, `${viewport.name}: autosave toggle was not saved`);
    assert.equal(stored.autoSaveInterval, 60, `${viewport.name}: autosave interval was not saved`);
    assert.equal(stored.reducedMotion, true, `${viewport.name}: reduced motion was not saved`);
    assert.equal(stored.screenShake, false, `${viewport.name}: screen shake was not saved`);

    assert.deepEqual(pageErrors, [], `${viewport.name}: uncaught browser errors: ${pageErrors.join('; ')}`);
    console.log(`PASS ${viewport.name} (${viewport.width}x${viewport.height}): boot, settings tabs, persistence, responsive widths, no page errors`);
    await page.close();
  }
  console.log('Browser smoke checks passed (3 viewport sizes)');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
