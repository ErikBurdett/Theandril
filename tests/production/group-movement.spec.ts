import { expect, test } from '@playwright/test';
import { deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { campaignMenu, exportedTravel, order, reviewTravel, travelPanel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

test('generated production group travel moves ordinary armies and retains postings, replay and portable saved routes without development hooks', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260927');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Your people await a hearth.');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await openRegistry(page, 'armies');
  const postings = page.getByTestId('group-postings');
  await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await postings.getByRole('button', { name: 'Post selected armies (2)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('2 orders accepted · 0 refused');
  const before = await exportedTravel(page), game = before.game, owner = game.turnOwnerId;
  const own = Object.values(game.armies).filter(army => army.factionId === owner).sort((a, b) => a.id < b.id ? -1 : 1);
  expect(own).toHaveLength(2);
  // Read the actual downloaded campaign to choose a canonical known destination.
  // This computes no browser action and changes neither the world nor resources.
  const view = getObservation(game, owner);
  const candidates = [...game.explored[owner]!].map(target => ({ target, quotes: own.map(army => getMovementPreview(view, army.id, target)) }))
    .filter(item => item.quotes.every(quote => quote.canQueue && quote.cost > 0)
      && item.quotes.some((quote, index) => quote.cost > own[index]!.movement))
    .sort((a, b) => b.quotes[0]!.cost - a.quotes[0]!.cost || a.target - b.target);
  expect(candidates.length).toBeGreaterThan(0);
  const target = candidates[0]!.target;
  await travelPanel(page, true); await reviewTravel(page, target);
  await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 0 unavailable');
  const onlyReviewed = await exportedTravel(page);
  expect(serializeGame(onlyReviewed.game)).toBe(serializeGame(game));
  expect(onlyReviewed.archive).toEqual(before.archive);
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = await travelPanel(page, true, true); await reviewTravel(page, target);
  await panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 0 refused');
  const applied = await exportedTravel(page), serial = deserializeGame(serializeGame(game));
  for (const army of own) order(serial, { type: 'queueMovement', factionId: owner, armyId: army.id, target, append: false });
  expect(serializeGame(applied.game)).toBe(serializeGame(serial));
  expect(applied.archive.records.slice(before.archive.records.length).map(record => record.command)).toEqual(own.map(army => ({ type: 'queueMovement', factionId: owner, armyId: army.id, target, append: false })));
  expect(own.some(army => applied.game.armies[army.id]!.cell !== army.cell)).toBe(true);
  expect(applied.game.postings).toEqual(game.postings);
  const routeCount = Object.keys(applied.game.routes).length;
  expect(routeCount).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await travelPanel(page, true);
  await panel.getByRole('button', { name: `Cancel travel routes (${routeCount})`, exact: true }).click();
  await expect(page.getByTestId('group-movement-results')).toContainText(`${routeCount} orders accepted · 0 refused`);
  const cancelled = await exportedTravel(page);
  expect(cancelled.game.routes).toEqual({}); expect(cancelled.game.postings).toEqual(game.postings);
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const restored = await exportedTravel(page);
  expect(stateHash(restored.game)).toBe(stateHash(applied.game)); expect(restored.archive).toEqual(applied.archive);
  await page.reload();
  await page.getByLabel('Import save file').setInputFiles({ name: 'generated-group-travel.theandril', mimeType: 'application/gzip', buffer: applied.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const portable = await exportedTravel(page);
  expect(serializeGame(portable.game)).toBe(serializeGame(applied.game)); expect(portable.archive).toEqual(applied.archive);
  await travelPanel(page, true, true);
  await expect(panel.getByRole('button', { name: `Cancel travel routes (${routeCount})`, exact: true })).toBeEnabled();
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('production-group-travel-restored-narrow.png') });
  await campaignMenu(page);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
