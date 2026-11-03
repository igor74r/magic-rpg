import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = 4174;
const baseUrl = `http://127.0.0.1:${port}`;
const output = 'test-artifacts/visual-regression';
await mkdir(output, { recursive: true });
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
let browser;
async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(baseUrl)).ok) return; } catch {}
    await delay(250);
  }
  throw new Error('Visual test server did not start');
}
async function capture(page, name) {
  const target = `${output}/${name}.png`;
  await page.screenshot({ path: target, fullPage: false, animations: 'disabled' });
  const size = (await (await import('node:fs/promises')).stat(target)).size;
  assert.ok(size > 5000, `${name}: screenshot appears empty (${size} bytes)`);
  return target;
}
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const vp of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('magic-rpg-prologue-seen','1'));
    await page.goto(baseUrl, { waitUntil:'networkidle' });
    await page.locator('.slot-new').first().click();
    await page.locator('.class-card[data-class-id="mage"]').click();
    await page.locator('#char-name').fill('Visual QA');
    await page.getByRole('button',{name:/Проверить героя/}).click();
    await page.getByRole('button',{name:/Создать героя и начать/}).click();
    await page.locator('#screen-game.active').waitFor();
    await page.locator('#overworld-canvas').waitFor({state:'visible'});
    assert.equal(await page.locator('.dashboard-context-actions button').count(),1,
      `${vp.name}: context block must retain portal shortcut only; obsolete journal shortcut is gone`);
    assert.equal(await page.locator('.dashboard-context-actions button').innerText(), '🌀 Портал миров',
      `${vp.name}: portal shortcut must remain`);
    await capture(page, `${vp.name}-01-gameplay`);

    for (const tab of ['hero','inventory','locations']) {
      const trigger=page.locator(`#game-tab-${tab}`);
      if (tab==='locations') {
        await page.evaluate(() => window.GameAPI.openWorldPortalMenu());
        await page.locator('#aurora-world-portal').waitFor({state:'visible'});
        await capture(page, `${vp.name}-04-map-portal-destinations`);
        const destinations=page.locator('#aurora-world-portal [data-world-location]');
        assert.ok(await destinations.count()>0,`${vp.name}: portal map must show destination cards`);
        await capture(page, `${vp.name}-05-world-portal`);
        await page.locator('#aurora-world-portal [data-world-close]').click();
      } else {
        await trigger.click();
        await page.locator('#dashboard-tab-modal').waitFor({state:'visible'});
        const title=await page.locator('#dashboard-tab-modal h2, #dashboard-tab-modal [role="heading"]').first().innerText().catch(()=>tab);
        assert.ok(title.length>0,`${vp.name}/${tab}: modal title must be rendered`);
        if(tab==='hero') assert.ok(await page.locator('#dashboard-tab-modal .hero-overview').count()>0,`${vp.name}: hero view missing`);
        if(tab==='hero') {
          assert.equal(await page.locator('#dashboard-tab-modal .hero-overview-left .hero-vital').count(),3,
            `${vp.name}: hero profile must show three resource cards`);
          assert.equal(await page.locator('#dashboard-tab-modal .hero-stat-grid .hero-stat').count(),10,
            `${vp.name}: hero profile must retain all ten attributes`);
          assert.equal(await page.locator('#dashboard-tab-modal .hero-progression-grid > div').count(),4,
            `${vp.name}: hero profile must retain four progression indicators`);
        }
        if(tab==='inventory') assert.ok(await page.locator('#dashboard-tab-modal [data-inv-filter]').count()>0,`${vp.name}: inventory controls missing`);
        if(tab==='inventory') {
          assert.ok(await page.locator('#dashboard-tab-modal .rpg-paperdoll .gear-slot').count()>0,
            `${vp.name}: equipment paperdoll must show gear slots`);
          assert.ok(await page.locator('#dashboard-tab-modal .rpg-backpack .inv-search-wrap').count()>0,
            `${vp.name}: backpack must retain item search`);
          const inventoryColumns=await page.locator('#dashboard-tab-modal .rpg-inv-grid').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').length);
          assert.ok(inventoryColumns>=4,`${vp.name}: inventory grid must keep at least four visible columns`);
        }
        await capture(page,`${vp.name}-0${tab==='hero'?2:3}-${tab}`);
        await page.locator('#dashboard-tab-modal [data-dashboard-modal-close]').click();
        await page.locator('#overworld-canvas').waitFor({state:'visible'});
        assert.equal(await page.locator('#dashboard-tab-modal').count(),0,
          `${vp.name}/${tab}: closing tab must remove only the overlay`);
        assert.equal(await page.locator('#screen-overworld').isVisible(),true,
          `${vp.name}/${tab}: playable village scene must remain visible behind tabs`);
        assert.equal(await page.locator('#screen-game').evaluate(el=>el.inert),false,
          `${vp.name}/${tab}: gameplay must be interactive again after closing modal`);
      }
    }
    for (const tab of ['quests','spells','talents']) {
      await page.locator(`#game-tab-${tab}`).click();
      await page.locator('#dashboard-tab-modal').waitFor({state:'visible'});
      if(tab==='quests') assert.ok(await page.locator('#dashboard-tab-modal .campaign-act').count()>0,
        `${vp.name}: quest journal must render campaign acts`);
      if(tab==='spells') assert.ok(await page.locator('#dashboard-tab-modal .ability-item').count()>0,
        `${vp.name}: magic section must render class abilities`);
      if(tab==='talents') {
        assert.ok(await page.locator('#dashboard-tab-modal .passive-tree-viewport').count()>0,
          `${vp.name}: talent section must render the interactive tree`);
        assert.ok(await page.locator('#dashboard-tab-modal .talent-card').count()>0,
          `${vp.name}: talent section must render the talent catalogue`);
      }
      await capture(page,`${vp.name}-06-${tab}`);
      await page.locator('#dashboard-tab-modal [data-dashboard-modal-close]').click();
      await page.locator('#overworld-canvas').waitFor({state:'visible'});
      assert.equal(await page.locator('#screen-game').evaluate(el=>el.inert),false,
        `${vp.name}/${tab}: closing section must restore gameplay interactivity`);
    }
    assert.deepEqual(errors,[], `${vp.name}: browser runtime errors: ${errors.join('; ')}`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
