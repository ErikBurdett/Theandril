import { expect, test } from '@playwright/test';
import { roadmapGates, roadmapItems } from '../../apps/web/src/updates/library';

test('the roadmap is discoverable from home and shows bounded completion with every release gate open', async ({ page }) => {
  const workers: string[] = [];
  const errors: string[] = [];
  page.on('worker', worker => workers.push(worker.url()));
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('updates/');
  await page.getByRole('link', { name: 'Explore the full roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Theandril Roadmap' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Roadmap', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  await expect(page.locator('.roadmap-item[data-status="completed"]').first().locator('.roadmap-status')).toHaveText('✓ Completed');
  await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  await expect(page.locator('.roadmap-gates .roadmap-status-completed')).toHaveCount(0);
  await expect(page.locator('.roadmap-introduction')).toContainText('No overall 1.0 gate is signed off.');
  await expect(page.getByRole('link', { name: 'Hearth & Card roadmap' })).toHaveAttribute('href', 'https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/');
  expect(workers).toEqual([]);
  expect(errors).toEqual([]);
});

test('status and acceptance search survive refresh, reset cleanly and preserve the release check', async ({ page }) => {
  await page.goto('updates/roadmap/');
  const pending = page.getByRole('button', { name: 'Pending', exact: true });
  await pending.focus();
  await page.keyboard.press('Enter');
  await expect(pending).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  await page.getByRole('searchbox', { name: 'Search roadmap' }).fill('authoritative');
  await expect(page.locator('.roadmap-item')).toHaveCount(1);
  await expect(page).toHaveURL(/q=authoritative&status=pending#roadmap-items$/);
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search roadmap' })).toHaveValue('authoritative');
  await expect(pending).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No roadmap items found' })).toBeVisible();
  await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('an item permalink opens its evidence, survives refresh and returns to the filtered record', async ({ page }) => {
  await page.goto('updates/roadmap/?status=pending');
  await page.getByRole('link', { name: 'Build authoritative online campaigns', exact: true }).click();
  await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  const item = page.locator('#roadmap-online-campaigns');
  await expect(item).toBeFocused();
  await expect(item.locator('details')).toHaveAttribute('open', '');
  await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  await expect(item.getByRole('link', { name: 'Implementation status', exact: true })).toHaveAttribute('href', /\/blob\/[a-f0-9]{40}\/docs\/IMPLEMENTATION_STATUS.md$/);
  await page.reload();
  await expect(item).toBeFocused();
  await expect(item.locator('details')).toHaveAttribute('open', '');
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(entry => entry.status === 'pending').length);
});

test('same-document Back and Forward restore filters and linked-item evidence', async ({ page }) => {
  await page.goto('updates/roadmap/');
  await page.getByRole('link', { name: /Complete the playable systems/ }).click();
  await expect(page).toHaveURL(/#current-work$/);
  await page.getByRole('button', { name: 'Pending', exact: true }).click();
  await expect(page).toHaveURL(/\?status=pending#roadmap-items$/);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  await page.goForward();
  await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);

  await page.goto('updates/roadmap/?item=online-campaigns#roadmap-online-campaigns');
  const item = page.locator('#roadmap-online-campaigns');
  await item.locator('summary').click();
  await expect(item.locator('details')).not.toHaveAttribute('open', '');
  await item.getByRole('link', { name: 'Gate M', exact: true }).click();
  await expect(page.locator('#gate-M')).toBeInViewport();
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(item).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  await expect(item).toBeFocused();
  await expect(item.locator('details')).toHaveAttribute('open', '');
  await page.goForward();
  await expect(page.getByRole('button', { name: 'Completed', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(item).toHaveCount(0);
});

for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  test(`roadmap keyboard and layout at ${dimensions.width}px / ${dimensions.scale}% text`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
    await page.goto('updates/roadmap/');
    await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath('roadmap-top.png') });
    const item = page.locator('#roadmap-campaign-safety-review');
    const summary = item.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
    await item.screenshot({ path: testInfo.outputPath('roadmap-open-item.png') });
    await page.keyboard.press('Space');
    await expect(item.locator('details')).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('button', { name: 'Pending', exact: true }).click();
    await page.getByRole('link', { name: /Build the missing release systems/ }).click();
    await expect(page.locator('#missing-systems')).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('roadmap-pending.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

test('unknown item links recover honestly and dispatches link to the full roadmap', async ({ page }) => {
  await page.goto('updates/roadmap/?item=%3Cscript%3E&status=completed');
  await expect(page.getByRole('heading', { name: 'That roadmap item is not in this record' })).toBeVisible();
  await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  await page.getByRole('button', { name: 'Reset search & filters' }).click();
  await expect(page.getByRole('heading', { name: 'That roadmap item is not in this record' })).toHaveCount(0);
  await page.goto('updates/dispatches/#scope');
  await page.getByRole('link', { name: 'Open the full roadmap' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Theandril Roadmap' })).toBeVisible();
});
