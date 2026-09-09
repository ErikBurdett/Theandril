import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../../packages/test-fixtures/src/combat-fixture.ts';
import { openRealmAffairs, openSelectedOrders, closeCampaignOptions } from '../../../tests/gameplay/ui-navigation.ts';
const root = process.env.QA_LIFECYCLE_OUTPUT ?? '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa/lifecycle';
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(), cdp = await context.newCDPSession(page);
const records = [], errors = [], consoleMessages = [];
page.on('console', message => { if (['error', 'warning'].includes(message.type())) consoleMessages.push({ type: message.type(), text: message.text() }); });
page.on('pageerror', error => errors.push(error.message));
const capture = async stage => {
  await expect(page.locator('.campaign-options button').filter({ hasText: /^Save campaign$/ })).toBeEnabled();
  await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
  const dom = await page.evaluate(() => ({ controls: [...document.querySelectorAll('[data-testid=faction-overview-control]')].map(node => ({ parent: node.parentElement.className, text: node.textContent, html: node.outerHTML, rect: node.getBoundingClientRect().toJSON() })), debugHookPresent: Boolean(window.__THEANDRIL__), canvases: document.querySelectorAll('canvas').length, hash: window.__THEANDRIL__?.getStateHash(), heap: performance.memory?.usedJSHeapSize }));
  const listeners = {};
  for (const expression of ['window', 'document', 'document.querySelector("canvas")']) {
    const { result } = await cdp.send('Runtime.evaluate', { expression });
    if (!result.objectId) continue;
    const observed = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    listeners[expression] = observed.listeners.map(({ type, useCapture, passive, scriptId, lineNumber }) => ({ type, useCapture, passive, scriptId, lineNumber }));
    await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
  }
  records.push({ stage, ...dom, listeners });
  await writeFile(`${root}/observations.json`, JSON.stringify({ scope: 'Fresh Chromium context; no injected JavaScript, DOM changes, hooks for mutation, or instrumentation; actual UI calls, CDP listener observation only. Desktop no mobile emulation.', browser: browser.version(), errors, consoleMessages, records }, null, 2) + '\n');
  console.log(JSON.stringify({ stage, controls: dom.controls.length, canvases: dom.canvases, listeners: Object.fromEntries(Object.entries(listeners).map(([k, v]) => [k, v.length])) }));
};
const settings = async () => { const menu = page.getByTestId('campaign-menu'); if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click(); };
try {
  await page.goto(process.env.QA_LIFECYCLE_URL ?? 'http://127.0.0.1:4173/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260909');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('small');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('12');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await capture('generated-small12');
  await settings(); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  for (let i = 1; i <= 4; i++) {
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
    await capture(`load-${i}`);
  }
  await closeCampaignOptions(page);
  const bytes = Buffer.from(await exportSave(serializeGame(borderBattleCampaign())));
  for (let i = 1; i <= 4; i++) {
    await page.getByLabel('Import save file').setInputFiles({ name: `border-${i}.theandril`, mimeType: 'application/gzip', buffer: bytes });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await capture(`import-${i}`);
  }
  await openRealmAffairs(page); await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await openSelectedOrders(page); await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  const skip = page.getByRole('button', { name: 'Skip animations', exact: true }); if (await skip.isEnabled()) await skip.click();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  await capture('after-battle');
  await page.screenshot({ path: `${root}/after-battle.png`, fullPage: true });
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  await capture('full-document-reload');
} finally { await browser.close(); }
