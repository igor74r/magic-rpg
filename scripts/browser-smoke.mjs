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

async function clickCanvasPoint(page, xRatio, yRatio) {
  const canvas = page.locator('#overworld-canvas');
  const bounds = await canvas.boundingBox();
  assert.ok(bounds, 'overworld canvas must be visible before portal click');
  await page.mouse.click(bounds.x + bounds.width * xRatio, bounds.y + bounds.height * yRatio);
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
    assert.equal(await page.getByLabel('🎵 Музыка').count(), 1, `${viewport.name}: music slider must have an accessible label`);
    assert.equal(await page.getByLabel('🔊 Эффекты').count(), 1, `${viewport.name}: effects slider must have an accessible label`);
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

    await page.locator('#screen-settings .settings-back-btn').click();
    await page.locator('.slot-new').first().click();
    const warriorCard = page.locator('.class-card[data-class-id="warrior"]');
    await warriorCard.focus();
    await warriorCard.press('Space');
    assert.equal(await page.locator('.class-card[data-class-id="warrior"]').getAttribute('aria-pressed'), 'true',
      `${viewport.name}: keyboard class selection must update its pressed state`);
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-class-id')), 'warrior',
      `${viewport.name}: keyboard class selection must preserve focus`);
    await page.locator('#char-name').fill('UI audit');
    await page.getByRole('button', { name: /Начать путь/ }).click();
    await page.locator('#screen-game.active').waitFor();

    for (const tab of ['locations', 'inventory', 'spells', 'quests', 'achievements', 'statistics', 'talents', 'bestiary', 'chronicles']) {
      const tabButton = page.locator(`#game-tab-${tab}`);
      await tabButton.click();
      assert.equal(await tabButton.getAttribute('aria-selected'), 'true', `${viewport.name}: ${tab} tab must become selected`);
      assert.equal(await page.locator('#tab-content').getAttribute('aria-labelledby'), `game-tab-${tab}`,
        `${viewport.name}: tab panel must identify its active tab`);
      if (tab === 'quests') {
        const progress = page.locator('.campaign-progress[role="progressbar"]').first();
        await progress.waitFor();
        assert.ok(Number(await progress.getAttribute('aria-valuemax')) > 0,
          `${viewport.name}: campaign progress must expose a positive maximum`);
        const current = Number(await progress.getAttribute('aria-valuenow'));
        assert.ok(Number.isFinite(current) && current >= 0,
          `${viewport.name}: campaign progress must expose a valid current value`);
      }

      if (tab === 'inventory') {
        const bagFilter = page.locator('[data-inv-filter="bag"]');
        assert.equal(await bagFilter.getAttribute('aria-pressed'), 'true',
          `${viewport.name}: active inventory filter must expose its selected state`);
        await bagFilter.focus();
        await bagFilter.press('Enter');
        const saleOpener = page.locator('[data-inv-action="open-sale"]');
        await saleOpener.focus();
        // The sticky paperdoll can overlap this control in narrow layouts; trigger its real DOM click handler.
        await page.evaluate(() => window.GameAPI.openSaleUI());
        const saleDialog = page.locator('#inventory-sale-overlay [role="dialog"][aria-labelledby="inventory-sale-title"]');
        await saleDialog.waitFor({ state: 'visible' });
        assert.equal(await saleDialog.getAttribute('aria-labelledby'), 'inventory-sale-title', `${viewport.name}: sale dialog must reference its title`);
        assert.equal(await page.getByRole('heading', { name: 'Продажа предметов' }).count(), 1, `${viewport.name}: sale dialog title must be exposed to assistive technology`);
        assert.equal(await saleDialog.getAttribute('aria-modal'), 'true',
          `${viewport.name}: sale window must be announced as modal`);
        await saleDialog.press('Escape');
        await saleDialog.waitFor({ state: 'detached' });
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-inv-action')), 'open-sale',
          `${viewport.name}: closing sale dialog must restore focus to its opener`);
      }
      const dashboard = await page.evaluate(() => {
        const layout = document.querySelector('.dashboard-layout');
        const main = document.querySelector('.dashboard-main');
        const content = document.querySelector('.dashboard-content');
        return {
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          layoutWidth: layout?.getBoundingClientRect().width ?? 0,
          layoutScrollWidth: layout?.scrollWidth ?? 0,
          mainWidth: main?.getBoundingClientRect().width ?? 0,
          mainScrollWidth: main?.scrollWidth ?? 0,
          contentWidth: content?.getBoundingClientRect().width ?? 0,
          contentScrollWidth: content?.scrollWidth ?? 0
        };
      });
      assert.ok(dashboard.documentWidth <= dashboard.viewport + 1, `${viewport.name}/${tab}: document overflow: ${JSON.stringify(dashboard)}`);
      assert.ok(dashboard.layoutScrollWidth <= dashboard.layoutWidth + 1, `${viewport.name}/${tab}: dashboard overflow: ${JSON.stringify(dashboard)}`);
      assert.ok(dashboard.mainScrollWidth <= dashboard.mainWidth + 1, `${viewport.name}/${tab}: main panel overflow: ${JSON.stringify(dashboard)}`);
      assert.ok(dashboard.contentScrollWidth <= dashboard.contentWidth + 1, `${viewport.name}/${tab}: content overflow: ${JSON.stringify(dashboard)}`);
    }

    // Exercise the actual portal sprites and their navigation, not only static markup.
    await page.evaluate(() => window.GameAPI.enterOverworld());
    await page.locator('#screen-overworld.active').waitFor();
    let worldDialog = page.getByRole('dialog', { name: 'Пути между мирами' });
    await page.evaluate(() => window.GameAPI.interactNpc('world-portal'));
    await worldDialog.waitFor({ state: 'visible' });
    assert.equal(await worldDialog.getAttribute('aria-modal'), 'true',
      `${viewport.name}: world portal must open an accessible modal`);
    await page.keyboard.press('Escape');
    await worldDialog.waitFor({ state: 'detached' });

    await clickCanvasPoint(page, 0.44, 0.308);
    worldDialog = page.getByRole('dialog', { name: 'Пути между мирами' });
    await worldDialog.waitFor({ state: 'visible' });
    await worldDialog.getByRole('button', { name: /Тёмный лес/ }).click();
    await worldDialog.waitFor({ state: 'detached' });

    // The forest has its own themed waystone two cells left of the spawn.
    await page.evaluate(() => window.GameAPI.interactNpc('world-waystone'));
    worldDialog = page.getByRole('dialog', { name: 'Пути между мирами' });
    await worldDialog.waitFor({ state: 'visible' });
    await worldDialog.getByRole('button', { name: /Деревня Аврора/ }).click();
    await worldDialog.waitFor({ state: 'detached' });

    // The separate amber gate must launch the existing 40-floor Tower menu.
    await page.evaluate(() => window.GameAPI.interactNpc('tower-portal'));
    await page.locator('#tower-map-overlay').waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: /Башня · 40 этажей/ }).waitFor();
    await page.locator('[data-tower-close]').click();
    await page.locator('#tower-map-overlay').waitFor({ state: 'detached' });

    assert.deepEqual(pageErrors, [], `${viewport.name}: uncaught browser errors: ${pageErrors.join('; ')}`);
    console.log(`PASS ${viewport.name} (${viewport.width}x${viewport.height}): settings labels, game creation, 9 dashboard tabs, responsive widths, no page errors`);
    await page.close();
  }
  console.log('Browser smoke checks passed (3 viewport sizes)');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
