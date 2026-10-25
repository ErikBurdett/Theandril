import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { armyOrderFilterScene } from '../gameplay/army-order-filter-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { closeManagement, openRegistry, openSelectedOrders } from '../gameplay/ui-navigation';

test('production registry finds real waiting orders and a paused last-page patrol without changing travel, then explicitly resumes its policy', async ({ page }, testInfo) => {
  const fixture = armyOrderFilterScene();
  const bytes = await exportSave(serializeCampaign(fixture.game, fixture.archive));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({ name: 'authored-101-army-orders.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  let registryWindow = await openRegistry(page, 'armies');
  const filter = page.getByRole('combobox', { name: 'Army orders', exact: true });
  const registry = page.getByTestId('army-registry'), group = page.getByTestId('group-postings');
  const search = page.getByRole('searchbox', { name: 'Search your realm', exact: true });
  const force = page.getByRole('combobox', { name: 'Force type', exact: true });
  const pausedRow = registry.getByRole('button', { name: new RegExp(fixture.paused.name) });
  await expect(filter).toHaveValue('all');
  await expect(filter.locator('option')).toHaveText(['All forces (101)', 'Postings and patrols (4)', 'Orders waiting (2)', 'Paused patrols (1)']);
  // Explicitly reset pagination after any initial map selection is followed.
  await filter.selectOption('standing'); await filter.selectOption('all');
  await expect(registry.getByRole('button')).toHaveCount(25);
  await expect(pausedRow).toHaveCount(0);
  await registry.getByRole('checkbox', { name: `Select ${fixture.posted.name} for group orders`, exact: true }).check();
  for (let pageIndex = 0; pageIndex < 4; pageIndex++) await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Registry pages', exact: true })).toContainText('Page 5 of 5');
  await expect(registry.getByRole('button')).toHaveCount(1); await expect(pausedRow).toBeVisible();

  // Native keyboard selection, not a programmatic change event or component hook.
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('paused-patrols');
  await expect(registry.getByRole('button')).toHaveCount(1);
  await expect(pausedRow).toContainText('0 movement');
  await expect(pausedRow).toContainText('Patrol policy: paused');
  await expect(pausedRow).toContainText('Travel queued');
  await expect(group).toContainText('1 armies selected · 1 outside this filter');
  await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await expect(group).toContainText('2 armies selected · 1 outside this filter');
  await expect(registry.getByRole('checkbox', { name: `Select ${fixture.paused.name} for group orders`, exact: true })).toBeChecked();
  await pausedRow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('registry-paused-policy-desktop.png') });
  await page.locator('.realm-registry-content > .registry-tools').first().screenshot({ path: testInfo.outputPath('registry-paused-selector-detail.png') });
  await filter.focus(); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('all');
  await expect(registry.getByRole('checkbox', { name: `Select ${fixture.posted.name} for group orders`, exact: true })).toBeChecked();
  await page.getByRole('combobox', { name: 'Registry order', exact: true }).selectOption('name');
  await expect(registry.getByRole('button')).toHaveCount(25);
  await filter.selectOption('paused-patrols');
  await expect(registry.getByRole('checkbox', { name: `Select ${fixture.paused.name} for group orders`, exact: true })).toBeChecked();
  await search.fill(fixture.paused.name);
  await expect(filter.locator('option')).toHaveText(['All forces (1)', 'Postings and patrols (1)', 'Orders waiting (0)', 'Paused patrols (1)']);
  await force.selectOption('naval');
  await expect(filter.locator('option')).toHaveText(['All forces (0)', 'Postings and patrols (0)', 'Orders waiting (0)', 'Paused patrols (0)']);
  await expect(registry).toContainText('No matching entries. Clear your search or filter.');
  await force.selectOption('land'); await search.fill(''); await filter.selectOption('waiting');
  await expect(registry.getByRole('button')).toHaveCount(2);
  await expect(registry).toContainText(fixture.postingReason);
  await expect(registry).toContainText(fixture.waitingReason);
  await expect(registry).toContainText('Posting: Hold at hex 0');
  await expect(registry).toContainText('Route interrupted');
  await expect(group).toContainText('2 armies selected · 2 outside this filter');

  // Review is an explicit public query, separate from filter-only behavior.
  // Observe the real transient lock through DOM attributes; never delay or
  // intercept the worker, synthesize a response, or apply the reviewed orders.
  const movement = page.getByTestId('group-movement');
  await movement.locator(':scope > summary').click();
  await movement.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  await movement.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill('510');
  const lockObserved = filter.evaluate(element => new Promise<boolean>((resolve, reject) => {
    const select = element as HTMLSelectElement;
    const observer = new MutationObserver(() => {
      if (select.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); }
    });
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('The order filter never reflected the real pending review lock.')); }, 3000);
    observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
  }));
  await movement.getByRole('button', { name: 'Review routes', exact: true }).click();
  expect(await lockObserved).toBe(true);
  await expect(page.getByTestId('group-movement-preview')).toContainText('Destination hex 510');
  await expect(filter).toBeEnabled();
  await filter.selectOption('standing');
  await expect(group).toContainText('2 armies selected');
  await expect(page.getByTestId('group-movement-preview')).toContainText('Destination hex 510');
  await expect(movement.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true })).toBeEnabled();
  const browsed = await exportedTravel(page);
  expect(stateHash(browsed.game)).toBe(fixture.hash); expect(browsed.archive).toEqual(fixture.archive);
  expect(browsed.game.routes[fixture.paused.id]).toEqual(fixture.route);

  registryWindow = await openRegistry(page, 'armies');
  await expect(filter).toHaveValue('all');
  await filter.selectOption('paused-patrols'); await pausedRow.click();
  await expect(registryWindow).toHaveCount(0);
  await expect(page.getByTestId('current-selection')).toContainText(fixture.paused.name);
  await openSelectedOrders(page);
  const patrol = page.getByTestId('army-patrol');
  await patrol.locator(':scope > summary').click();
  await expect(patrol.locator(':scope > summary')).toContainText('Paused');
  await expect(page.getByTestId('queued-route')).toContainText('Route active');
  const located = await exportedTravel(page);
  expect(stateHash(located.game)).toBe(fixture.hash); expect(located.archive).toEqual(fixture.archive);

  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  await openRegistry(page, 'armies'); await expect(filter).toHaveValue('all');
  await filter.selectOption('waiting');
  await expect(registry).toContainText(fixture.postingReason); await expect(registry).toContainText(fixture.waitingReason);
  await registry.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('registry-waiting-narrow-130.png') });
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await pausedRow.click(); await openSelectedOrders(page);
  await patrol.locator(':scope > summary').click();
  const resume = patrol.getByRole('button', { name: 'Resume patrol', exact: true });
  await resume.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('registry-to-paused-orders-narrow-130.png') });
  // The sole post-import command is now deliberate. No End turn is pressed.
  await resume.focus(); await page.keyboard.press('Enter');
  await expect(patrol.locator(':scope > summary')).toContainText('Enabled');
  await expect(page.getByTestId('queued-route')).toContainText('Route active');
  const resumed = await exportedTravel(page);
  expect(resumed.game.routes[fixture.paused.id]).toEqual(fixture.route);
  expect(resumed.game.armies[fixture.paused.id]).toEqual(fixture.game.armies[fixture.paused.id]);
  expect(resumed.game.patrols.find(order => order.armyId === fixture.paused.id)?.enabled).toBe(true);
  expect(resumed.archive.records.slice(0, fixture.archive.records.length)).toEqual(fixture.archive.records);
  const added = resumed.archive.records.slice(fixture.archive.records.length);
  expect(added).toHaveLength(1); expect(added[0]!.ok).toBe(true);
  expect(added[0]!.command as GameCommand).toEqual({ type: 'setPatrolEnabled', factionId: fixture.factionId, armyId: fixture.paused.id, enabled: true });
  await openRegistry(page, 'armies'); await expect(filter).toHaveValue('all');
  await filter.selectOption('paused-patrols'); await expect(registry.getByRole('button')).toHaveCount(0);
  await expect(registry).toContainText('No matching entries. Clear your search or filter.');
  await page.getByRole('tab', { name: /^Settlements/ }).click(); await expect(filter).toHaveCount(0);
  await closeManagement(page); await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  const restored = await exportedTravel(page);
  expect(stateHash(restored.game)).toBe(stateHash(resumed.game)); expect(restored.archive).toEqual(resumed.archive);
  writeFileSync(testInfo.outputPath('registry-order-filter-restored.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('registry-order-filter-evidence.json'), JSON.stringify({ authored: 'Open-terrain theaterCampaign(101) and one foreign obstruction guard; all eight setup orders canonical.', initialHash: fixture.hash, finalHash: stateHash(restored.game), counts: fixture.counts, route: fixture.route, waitingReason: fixture.waitingReason, postingReason: fixture.postingReason, added, exactReplay: true }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
