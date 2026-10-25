// Draft for tests/production/posting-targets.spec.ts; relative imports target that final location.
// Not included by any current Playwright configuration. Activate only after retirement live39 collection.
import { expect, test, type Page } from '@playwright/test';
import { serializeGame, stateHash, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
import { postingTargetsScene } from '../gameplay/posting-targets-fixture';

async function importTravel(page: Page, game: GameState) {
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await page.getByLabel('Import save file').setInputFiles({ name: 'posting-targets.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

async function openPosting(page: Page) {
  await selectFromRegistry(page, 'armies', 'Target scouts');
  await openSelectedOrders(page);
  const posting = page.getByTestId('army-posting');
  await posting.locator(':scope > summary').click();
  return posting;
}

async function restoreExact(page: Page, expected: Awaited<ReturnType<typeof exportedTravel>>) {
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  const restored = await exportedTravel(page);
  expect(restored.archive).toEqual(expected.archive);
  expect(stateHash(restored.game)).toBe(stateHash(expected.game));
}

test('production where it stands posts to the displayed current position after real movement in the mounted inspector', async ({ page }, testInfo) => {
  const fixture = postingTargetsScene('moving');
  await importTravel(page, fixture.game);
  const posting = await openPosting(page);
  await posting.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  await posting.getByLabel('On arrival').selectOption('hold');
  // Keep the same inspector and posting component mounted while its sibling
  // movement controls issue a real command and replace the army observation.
  const movement = page.getByTestId('map-orders');
  await movement.getByLabel('Destination hex', { exact: true }).fill(String(fixture.initialCell + 1));
  await movement.getByRole('button', { name: 'Review route', exact: true }).click();
  await movement.getByRole('button', { name: 'Move now', exact: true }).click();
  await expect(posting.getByRole('button', { name: 'Post army', exact: true })).toBeEnabled();
  await expect(posting.getByLabel('Posted to').locator('option:checked')).toHaveText(`Where it stands · hex ${fixture.initialCell + 1}`);
  await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  await expect(posting.locator(':scope > summary')).toContainText(`Hold · hex ${fixture.initialCell + 1}`);
  await posting.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('posting-current-after-movement.png') });
  const posted = await exportedTravel(page);
  expect(posted.game.armies[fixture.armyId]!.cell).toBe(fixture.initialCell + 1);
  expect(posted.game.postings.find(order => order.armyId === fixture.armyId)).toMatchObject({ cell: fixture.initialCell + 1, mode: 'hold' });
  await restoreExact(page, posted);
});

test('production unavailable saved posting stays explicit and clearable without changing its existing route at narrow text scale', async ({ page }, testInfo) => {
  const fixture = postingTargetsScene('posting'), route = structuredClone(fixture.game.routes[fixture.armyId]);
  await importTravel(page, fixture.game);
  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  const posting = await openPosting(page);
  await expect(posting.locator(':scope > summary')).toContainText('Hold · hex 0');
  await expect(posting.getByLabel('Posted to')).toHaveValue('');
  await expect(posting.getByRole('button', { name: 'Update posting', exact: true })).toBeDisabled();
  await expect(posting.getByLabel('Posted to')).toHaveAttribute('aria-describedby', /.+/);
  const clear = posting.getByRole('button', { name: 'Clear posting', exact: true });
  await expect(clear).toBeEnabled();
  await clear.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('posting-unavailable-narrow.png') });
  await clear.focus(); await page.keyboard.press('Enter');
  await expect(posting.locator(':scope > summary')).toContainText('none');
  const cleared = await exportedTravel(page);
  expect(cleared.game.postings.some(order => order.armyId === fixture.armyId)).toBe(false);
  expect(cleared.game.routes[fixture.armyId]).toEqual(route);
  const fresh = await openPosting(page);
  await fresh.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  await fresh.getByLabel('On arrival').selectOption('hold');
  await fresh.getByRole('button', { name: 'Post army', exact: true }).click();
  const posted = await exportedTravel(page);
  expect(posted.game.postings.find(order => order.armyId === fixture.armyId)?.cell).toBe(fixture.initialCell);
  expect(posted.game.routes[fixture.armyId]).toEqual(route);
  await restoreExact(page, posted);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('production saved muster at an unavailable hex requires a fresh owned choice and remains clearable with exact saved history', async ({ page }, testInfo) => {
  const fixture = postingTargetsScene('muster');
  await importTravel(page, fixture.game);
  await selectFromRegistry(page, 'settlements', 'Target Hearth');
  await openSelectedOrders(page);
  const muster = page.getByTestId('settlement-muster');
  await muster.locator(':scope > summary').click();
  await expect(muster.locator(':scope > summary')).toContainText('hex 0');
  await expect(muster.getByLabel('Muster at')).toHaveValue('');
  await expect(muster.getByRole('button', { name: 'Move muster point', exact: true })).toBeDisabled();
  await expect(muster.getByLabel('Muster at')).toHaveAttribute('aria-describedby', /.+/);
  await expect(muster.getByRole('button', { name: 'Clear muster point', exact: true })).toBeEnabled();
  await muster.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('muster-unavailable-desktop.png') });
  // Clearing must not require inventing a valid replacement destination.
  await muster.getByRole('button', { name: 'Clear muster point', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(muster.locator(':scope > summary')).toContainText('none');
  await muster.getByLabel('Muster at').selectOption(String(fixture.hearthCell));
  await muster.getByRole('button', { name: 'Set muster point', exact: true }).click();
  await expect(muster.locator(':scope > summary')).toContainText('Target Hearth');
  const saved = await exportedTravel(page);
  expect(saved.game.musters.find(order => order.settlementId === fixture.settlementId)?.cell).toBe(fixture.hearthCell);
  await restoreExact(page, saved);
});
