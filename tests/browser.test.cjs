const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('test-results', { recursive: true });
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.resolve('web/index.html')).href);
      await page.screenshot({ path: `test-results/${name}-briefing.png`, fullPage: true });
      assert(await page.getByRole('button', { name: 'BEGIN EVACUATION' }).isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow on iPhone');
      await page.getByRole('button', { name: 'BEGIN EVACUATION' }).click();
      const items = page.locator('.items button');
      for (const i of [0, 1, 2, 4, 5, 8]) await items.nth(i).click();
      assert.equal(await page.locator('.items button:disabled').count(), 9, 'All packing controls lock when six slots are full');
      await page.getByRole('button', { name: 'LAUNCH ESCAPE POD' }).click();
      assert.equal(await page.locator('#day').textContent(), '01 / 12');
      await page.getByRole('button', { name: 'Send Juno' }).click();
      assert.equal(await page.locator('#day').textContent(), '02 / 12');
      await page.screenshot({ path: `test-results/${name}-survival.png`, fullPage: true });
      // Complete a real run through visible controls; use the packed supplies wisely.
      const plan = [true, false, true, true, true, true, true, true, false, true, false];
      for (const first of plan) {
        if (await page.locator('#phase').textContent() !== 'SURVIVAL MODE') break;
        const choices = page.locator('#actions button');
        const index = first && await choices.nth(0).isEnabled() ? 0 : 1;
        await choices.nth(index).click();
      }
      assert.equal(await page.locator('#phase').textContent(), 'CREW RECOVERED', 'Packed supplies and planned choices must allow rescue');
      await page.getByRole('button', { name: 'TRY ANOTHER ORBIT' }).click();
      assert.equal(await page.locator('#phase').textContent(), 'AWAITING LAUNCH');
      await page.clock.install();
      await page.getByRole('button', { name: 'BEGIN EVACUATION' }).click();
      await page.clock.runFor(60_100);
      assert.equal(await page.locator('#day').textContent(), '01 / 12', 'Timer automatically launches the pod');
      await page.getByRole('button', { name: 'Let it drift' }).click();
      await page.getByRole('button', { name: 'Seal the cabin' }).click();
      await page.getByRole('button', { name: 'Tell terrible jokes' }).click();
      await page.getByRole('button', { name: 'Transmit softly' }).click();
      await page.getByRole('button', { name: 'Stay on course' }).click();
      assert.equal(await page.locator('#phase').textContent(), 'SIGNAL LOST', 'Running out of rations ends the run');
      assert.deepEqual(errors, []);
      console.log(`${name}: iPhone layout, packing, daily choices, rescue, restart, timed launch, and resource loss passed`);
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
