import { expect, test, type Page } from '@playwright/test';

const seedInput = (page: Page) => page.getByRole('textbox', { name: 'World seed', exact: true });
const campaignMenu = (page: Page) => page.getByTestId('campaign-menu');
const snapshot = (page: Page) => page.evaluate(() => {
  const game = window.__THEANDRIL__!;
  return { seed: game.getSummary()!.seed, hash: game.getStateHash() };
});

async function begin(page: Page) {
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(seedInput(page)).toHaveCount(0);
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  const current = await snapshot(page);
  await expect(page.locator('.map-title')).toContainText(`SEED ${current.seed} ·`);
  return current;
}

async function newCampaign(page: Page) {
  if (await campaignMenu(page).getAttribute('open') === null) await campaignMenu(page).locator('summary').click();
  await campaignMenu(page).getByRole('button', { name: 'New campaign', exact: true }).click();
  await expect(seedInput(page)).toHaveValue('');
}

async function setup(page: Page) {
  await page.goto('/');
  await expect(seedInput(page)).toHaveValue('');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
}

test('default campaigns choose different random worlds, and saved random worlds retain their seed', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await setup(page);
  const first = await begin(page);
  expect(Number.isInteger(first.seed)).toBe(true);
  expect(first.seed).toBeGreaterThanOrEqual(0);
  expect(first.seed).toBeLessThanOrEqual(0xffff_ffff);
  await newCampaign(page);
  await expect(seedInput(page)).toHaveAttribute('placeholder', 'Random for each new campaign');
  await page.setViewportSize({ width: 390, height: 844 });
  await seedInput(page).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('random-seed-narrow-setup.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const second = await begin(page);
  expect(second.seed).not.toBe(first.seed);
  expect(second.hash).not.toBe(first.hash);
  await campaignMenu(page).locator('summary').click();
  await campaignMenu(page).getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload();
  await expect(seedInput(page)).toHaveValue('');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(seedInput(page)).toHaveCount(0);
  await expect.poll(() => snapshot(page)).toEqual(second);
  await page.screenshot({ path: testInfo.outputPath('random-seed-restored-world.png') });
  expect(errors).toEqual([]);
});

for (const seed of ['0', '4294967295']) {
  test(`explicit seed ${seed} recreates the exact same campaign after New campaign`, async ({ page }) => {
    await setup(page);
    await seedInput(page).fill(seed);
    const first = await begin(page);
    expect(first.seed).toBe(Number(seed));
    await newCampaign(page);
    await seedInput(page).fill(seed);
    expect(await begin(page)).toEqual(first);
  });
}

test('an invalid custom seed leaves the existing campaign intact', async ({ page }) => {
  await setup(page);
  const first = await begin(page);
  await newCampaign(page);
  await seedInput(page).fill('4294967296');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Use a whole-number world seed between 0 and 4294967295');
  await expect(seedInput(page)).toHaveValue('4294967296');
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  expect(await snapshot(page)).toEqual(first);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
});
