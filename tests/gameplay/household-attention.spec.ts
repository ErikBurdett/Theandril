import { expect, test, type Page } from '@playwright/test';
import { serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { growingHouseholdCampaign, householdScaleCampaign } from './household-fixture';
import { closeCampaignOptions } from './ui-navigation';

async function importCampaign(page: Page, game: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'household-attention.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeCampaignOptions(page);
}
const review = (page: Page) => page.getByRole('button', { name: 'Next settlement with unassigned households', exact: true });

test('R07 growing queued hearth exposes exact labor attention and preserves manual assignments until a real order', async ({ page }, info) => {
  await importCampaign(page, growingHouseholdCampaign());
  await expect(review(page)).toBeDisabled();
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  const before = await page.evaluate(() => { const api = window.__THEANDRIL__!, view = api.getSummary()!; return { hash: api.getStateHash(), land: view.land.settlements[0]!, treasury: view.treasury, town: view.ownSettlements[0]!, routes: view.routes }; });
  expect(before.town.queue.length).toBeGreaterThan(0);
  expect(before.land.workerCapacity - before.land.worked.length).toBe(1);
  await expect(page.getByTestId('household-counts')).toHaveText('Labor: 1 unassigned household · 1 settlement');
  await expect(page.getByRole('button', { name: 'Next idle settlement', exact: true })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('household-growth-desktop.png') });
  await review(page).focus(); await page.keyboard.press('Enter');
  const popup = page.getByTestId('map-actions');
  await expect(popup.getByRole('tab', { name: 'Land & tiles', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  await expect(page.getByTestId('next-action-notice')).toContainText('unassigned households add no tile yields');
  await popup.getByRole('button', { name: 'Select tiles', exact: true }).click();
  await popup.locator('.land-tile-list button').filter({ hasText: /Owned/ }).first().click();
  const cell = await page.evaluate(() => window.__THEANDRIL__!.getSelection().cell!);
  expect(before.land.worked).not.toContain(cell);
  await popup.getByRole('button', { name: 'Assign worker', exact: true }).click();
  await expect(page.getByTestId('household-counts')).toHaveText('Labor: 0 unassigned households · 0 settlements');
  const after = await page.evaluate(() => { const view = window.__THEANDRIL__!.getSummary()!; return { worked: view.land.settlements[0]!.worked, treasury: view.treasury, routes: view.routes }; });
  expect(after.worked).toEqual([...before.land.worked, cell].sort((a, b) => a - b));
  expect(after.treasury).toBe(before.treasury); expect(after.routes).toEqual(before.routes);
  await popup.getByRole('button', { name: 'Close map actions', exact: true }).click();
  await page.getByTestId('campaign-menu').locator(':scope > summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  await expect(review(page)).toBeDisabled();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.worked)).toEqual(after.worked);
  await info.attach('household-growth', { body: JSON.stringify({ before, cell, after }, null, 2), contentType: 'application/json' });
});

for (const count of [2, 10, 40] as const) {
  test(`R07 ${count}-town labor exception opens the exact hearth in one activation at 390px`, async ({ page }, info) => {
    const game = householdScaleCampaign(count);
    const towns = Object.values(game.settlements).sort((a, b) => a.id < b.id ? -1 : 1), target = towns.at(-1)!;
    await importCampaign(page, game);
    await page.setViewportSize({ width: 390, height: 844 });
    const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()! }));
    expect(before.view.ownSettlements).toHaveLength(count);
    expect(before.view.land.settlements.every(town => town.cells.length === 0)).toBe(true);
    await expect(page.getByTestId('household-counts')).toHaveText('Labor: 1 unassigned household · 1 settlement');
    await page.screenshot({ path: info.outputPath('household-attention-390.png') });
    await review(page).click();
    const popup = page.getByTestId('map-actions');
    await expect(popup.getByRole('heading', { name: target.name, exact: true })).toBeVisible();
    await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-settlement-id', target.id);
    await expect(popup.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(popup.getByRole('heading', { name: 'Land & stewardship', exact: true })).toBeInViewport();
    await popup.screenshot({ path: info.outputPath('household-review-390.png') });
    await popup.getByRole('button', { name: 'Select tiles', exact: true }).click();
    await popup.locator('.land-tile-list button').filter({ hasText: /Owned/ }).first().click();
    await popup.getByRole('button', { name: 'Assign worker', exact: true }).click();
    await expect(page.getByTestId('household-counts')).toHaveText('Labor: 0 unassigned households · 0 settlements');
    const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
    expect(after.treasury).toBe(before.view.treasury);
    for (const land of before.view.land.settlements) {
      const worked = after.land.settlements.find(item => item.settlementId === land.settlementId)!.worked;
      if (land.settlementId !== target.id) expect(worked).toEqual(land.worked);
      else expect(worked).toEqual(expect.arrayContaining(land.worked));
    }
    await info.attach('household-scale', { body: JSON.stringify({ count, target: target.id, locateActivations: 1, beforeHash: before.hash, before: before.view.land.settlements.map(({ settlementId, workerCapacity, worked }) => ({ settlementId, workerCapacity, worked })), after: after.land.settlements.map(({ settlementId, workerCapacity, worked }) => ({ settlementId, workerCapacity, worked })) }, null, 2), contentType: 'application/json' });
  });
}
