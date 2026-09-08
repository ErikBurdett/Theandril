import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { serializeGame, stateHash, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { characterCampaign, CHARACTER_FIXTURE } from '../../packages/test-fixtures/src/character-fixture';

async function load(page: Page, state: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'realm-navigation.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

async function reimport(page: Page, state: GameState, name: string) {
  const buffer = Buffer.from(await exportSave(serializeGame(state)));
  const feedback = page.getByTestId('feedback');
  // The previous import has the same IDs, hash and success text. Witness this
  // import's actual busy/completed transition before reopening native windows.
  await Promise.all([
    expect(feedback).toContainText('Resolving…'),
    page.locator('input[type=file]').setInputFiles({ name, mimeType: 'application/gzip', buffer }),
  ]);
  await expect(feedback).not.toContainText('Resolving…');
  await expect(feedback).toContainText('Imported campaign');
}

test('unified registry finds the hundredth army and fortieth town without rendering the whole empire or changing orders', async ({ page }, testInfo) => {
  const game = empireLandCampaign('legendary'); await load(page, game);
  const view = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  const armies = [...view.ownArmies].sort((a, b) => a.id.localeCompare(b.id));
  const towns = [...view.ownSettlements].sort((a, b) => a.id.localeCompare(b.id));
  expect(armies).toHaveLength(100); expect(towns).toHaveLength(40);
  await openRegistry(page, 'armies');
  await expect(page.getByTestId('army-registry').getByRole('button')).toHaveCount(25);
  const initialSelection = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Registry pages' })).toContainText('Page 4 of 4');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(initialSelection);
  // Import in the same mounted application, with identical entity IDs and hash.
  // Close the native window before using campaign import. The application and
  // renderer stay mounted; reopening must not retain an obsolete registry page.
  await closeManagement(page);
  await reimport(page, game, 'same-ids-reimport.theandril');
  await openRegistry(page, 'armies');
  await expect(page.getByRole('navigation', { name: 'Registry pages' })).toContainText('Page 1 of 4');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(initialSelection);
  await expect(page.getByTestId('army-registry').locator('[aria-current="true"]')).toBeVisible();
  // Merely browsing towns does not change the selected army. After a same-ID
  // import, the Armies launcher must open the requested registry with that
  // selection intact, even though no selected-entity effect fires.
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await expect(page.getByRole('tab', { name: /Settlements/ })).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(initialSelection);
  await closeManagement(page);
  await reimport(page, game, 'same-ids-wrong-tab.theandril');
  await openRegistry(page, 'armies');
  await expect(page.getByRole('tab', { name: /Armies/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('navigation', { name: 'Registry pages' })).toContainText('Page 1 of 4');
  await expect(page.getByTestId('army-registry').locator('[aria-current="true"]')).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(initialSelection);
  await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Registry pages' })).toContainText('Page 2 of 4');
  const search = page.getByRole('searchbox', { name: 'Search your realm' });
  await search.fill(armies.at(-1)!.id);
  await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(armies.at(-1)!.name) }).click();
  await expect(page.getByTestId('current-selection')).toContainText(armies.at(-1)!.name);
  await openSelectedOrders(page);
  await expect(page.getByRole('dialog', { name: 'Selected orders', exact: true }).getByRole('heading', { name: 'Selected orders', exact: true })).toBeFocused();
  await openRegistry(page, 'armies');
  await page.getByRole('tab', { name: /Armies/ }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Settlements/ })).toBeFocused();
  await search.fill(towns.at(-1)!.id);
  await page.getByTestId('settlement-registry').getByRole('button', { name: new RegExp(towns.at(-1)!.name) }).click();
  await openSelectedOrders(page);
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-settlement-id', towns.at(-1)!.id);
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  await page.getByRole('dialog', { name: 'Selected orders', exact: true }).getByRole('button', { name: 'Show on map', exact: true }).click();
  await expect(page.getByTestId('map-container')).toBeFocused();
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Characters & agents', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(game));
  await openRegistry(page, 'settlements');
  await page.getByTestId('realm-navigation').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('unified-empire-navigation-desktop.png') });
});

test('narrow town categories expose real production, blockers and character-to-army navigation with save restoration', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, characterCampaign());
  await selectFromRegistry(page, 'settlements', CHARACTER_FIXTURE.homeName);
  await openSelectedOrders(page);
  const land = page.getByTestId('production-land'), navy = page.getByTestId('production-naval');
  await expect(land).not.toHaveAttribute('open'); await expect(navy).not.toHaveAttribute('open');
  await navy.locator(':scope > summary').focus(); await page.keyboard.press('Enter');
  await expect(navy.getByRole('button', { name: 'Recruit Charter transport', exact: true })).toBeDisabled();
  await expect(navy).toContainText('Coastal navigation');
  await navy.locator(':scope > summary').click(); await land.locator(':scope > summary').click();
  const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  const recruit = land.getByRole('button', { name: 'Recruit Oath guard', exact: true });
  await recruit.scrollIntoViewIfNeeded();
  expect(await recruit.evaluate(element => { const r = element.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return element === hit || element.contains(hit); })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('compact-production-narrow.png') });
  await recruit.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownSettlements.find(town => town.id === 'settlement.5')!.queue.some(item => item.itemId === 'unit.guard'))).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBeLessThan(before);
  await page.getByTestId('character-appointments').locator(':scope > summary').click();
  await page.getByRole('button', { name: 'Appoint Hearth marshal', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.length)).toBe(1);
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  await dialog.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(CHARACTER_FIXTURE.armyId);
  await dialog.getByRole('button', { name: 'Assign character', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters[0]!.location)).toEqual({ kind: 'army', armyId: CHARACTER_FIXTURE.armyId });
  await dialog.getByRole('button', { name: 'Locate character', exact: true }).click();
  await openRegistry(page, 'armies');
  await expect(page.getByRole('tab', { name: /Armies/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('current-selection')).toContainText(CHARACTER_FIXTURE.armyName);
  await page.getByTestId('realm-navigation').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('character-to-army-navigation-narrow.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await closeManagement(page);
  await page.getByTestId('campaign-menu').locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
});
