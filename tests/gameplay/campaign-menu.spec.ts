import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const menu = (page: Page) => page.getByTestId('campaign-menu');
const summary = (page: Page) => menu(page).locator('summary');
const currentHash = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getStateHash());

async function begin(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

async function directlyBelowNavigation(page: Page, campaign: boolean) {
  await expect(menu(page)).toHaveCount(1);
  expect(await menu(page).evaluate((element, inCampaign) => {
    const previous = element.previousElementSibling;
    const next = element.nextElementSibling;
    return previous?.matches(inCampaign ? 'nav.campaign-tools' : 'header.masthead') &&
      next?.matches(inCampaign ? 'main.campaign' : 'main.landing');
  }, campaign)).toBe(true);
  await expect(menu(page)).toHaveCSS('position', 'static');
  const [above, disclosure, below] = await Promise.all([
    page.locator(campaign ? '.campaign-tools' : '.masthead').boundingBox(),
    menu(page).boundingBox(),
    page.locator(campaign ? 'main.campaign' : 'main.landing').boundingBox(),
  ]);
  expect(above).not.toBeNull(); expect(disclosure).not.toBeNull(); expect(below).not.toBeNull();
  expect(disclosure!.y).toBeGreaterThanOrEqual(above!.y + above!.height - 1);
  expect(below!.y).toBeGreaterThanOrEqual(disclosure!.y + disclosure!.height - 1);
}

async function reachable(control: Locator) {
  await control.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await expect(control).toBeVisible();
  expect(await control.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit === element || (hit !== null && element.contains(hit));
  })).toBe(true);
}

test('top campaign disclosure works by keyboard and preserves real save, load, autosave and import controls', async ({ page }, testInfo) => {
  await page.goto('/');
  await directlyBelowNavigation(page, false);
  await summary(page).focus(); await page.keyboard.press('Enter');
  await expect(menu(page)).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(menu(page).getByRole('combobox', { name: 'Text scale', exact: true })).toBeFocused();
  await summary(page).focus(); await page.keyboard.press('Space');
  await expect(menu(page)).not.toHaveAttribute('open');

  await begin(page);
  await directlyBelowNavigation(page, true);
  await summary(page).focus(); await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(menu(page).getByRole('button', { name: 'Save campaign', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const saved = await currentHash(page);
  const downloadReady = page.waitForEvent('download');
  await menu(page).getByRole('button', { name: 'Export campaign', exact: true }).click();
  const download = await downloadReady;
  expect(download.suggestedFilename()).toMatch(/\.theandril$/);
  const path = await download.path();
  if (!path) throw new Error('The campaign export did not produce a file.');
  const exported = await readFile(path);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  const auto = await currentHash(page);
  expect(auto).not.toBe(saved);
  await menu(page).getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => currentHash(page)).toBe(saved);
  await menu(page).getByRole('button', { name: 'Restore autosave', exact: true }).click();
  await expect.poll(() => currentHash(page)).toBe(auto);
  const chooserReady = page.waitForEvent('filechooser');
  await menu(page).getByRole('button', { name: 'Import campaign', exact: true }).click();
  await (await chooserReady).setFiles({ name: 'menu-export.theandril', mimeType: 'application/gzip', buffer: exported });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect(await currentHash(page)).toBe(saved);
  await directlyBelowNavigation(page, true);
  await summary(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('top-campaign-menu-desktop.png') });
});

test('narrow touch settings stay in flow above setup and return to the unchanged campaign', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await begin(page);
    const hash = await currentHash(page);
    await summary(page).tap();
    await menu(page).getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
    await directlyBelowNavigation(page, true);
    for (const name of ['Save campaign', 'Export campaign', 'Load campaign', 'Restore autosave', 'Import campaign', 'New campaign']) {
      const control = menu(page).getByRole('button', { name, exact: true });
      await reachable(control);
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    for (const name of ['End turn shortcut', 'Next army shortcut', 'Next settlement shortcut']) {
      await reachable(menu(page).getByRole('textbox', { name, exact: true }));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await summary(page).evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: testInfo.outputPath('top-campaign-menu-narrow.png') });
    await menu(page).getByRole('button', { name: 'New campaign', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Establish your campaign', exact: true })).toBeVisible();
    await directlyBelowNavigation(page, false);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    expect(await currentHash(page)).toBe(hash);
    await page.getByRole('button', { name: 'Return to campaign', exact: true }).tap();
    await directlyBelowNavigation(page, true);
    expect(await currentHash(page)).toBe(hash);
    await summary(page).tap();
    await expect(menu(page)).not.toHaveAttribute('open');
    await expect(page.getByTestId('map-container')).toBeVisible();
  } finally { await context.close(); }
});

test('new campaign generation can be cancelled without losing the existing worker or campaign', async ({ page }) => {
  await begin(page);
  const hash = await currentHash(page);
  await summary(page).click();
  await menu(page).getByRole('button', { name: 'New campaign', exact: true }).click();
  await directlyBelowNavigation(page, false);
  // Hold only the replacement worker's real script load, making cancellation deterministic
  // even on fast hosts. No simulation messages, observations or commands are fabricated.
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const requested = new Promise<void>(resolve => { arrived = resolve; });
  await page.route(/\/simulation\.worker\.ts(?:\?|$)/, async route => {
    arrived(); await held;
    await route.continue();
  });
  try {
    await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('legendary');
    await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
    await requested;
    await expect(menu(page).getByRole('button', { name: 'Save campaign', exact: true })).toBeDisabled();
    await expect(menu(page).getByRole('button', { name: 'New campaign', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel generation', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('World generation cancelled');
    await expect(page.getByRole('button', { name: 'Begin campaign', exact: true })).toBeEnabled();
    expect(await currentHash(page)).toBe(hash);
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  await directlyBelowNavigation(page, true);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await currentHash(page)).not.toBe(hash);
});
