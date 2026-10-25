import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createJournal, resumeJournal } from '@theandril/chronicle';
import { applyCommand, commandSchema, createGame, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { closeCampaignOptions, closeManagement, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

async function policyPanel(page: Page, name = 'Stewarded hearth') {
  await selectFromRegistry(page, 'settlements', name); await openSelectedOrders(page);
  const panel = page.getByTestId('worker-policy');
  if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  return panel;
}

test('a generated hearth automatically employs its new population and restores its standing worker policy', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Stewarded hearth');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  const before = await exportedTravel(page), town = Object.values(before.game.settlements).find(item => item.factionId === before.game.turnOwnerId)!;
  const panel = await policyPanel(page);
  await panel.getByRole('combobox', { name: 'Worker priority', exact: true }).selectOption('food');
  await panel.getByRole('button', { name: 'Apply worker policy', exact: true }).click();
  await expect(panel.locator(':scope > summary')).toContainText('Food · 1 / 1 assigned');
  const assigned = await exportedTravel(page);
  expect(assigned.game.factions).toEqual(before.game.factions);
  expect(assigned.game.settlements).toEqual(before.game.settlements);
  expect(assigned.game.land.settlements[town.id]!.claimed).toEqual(before.game.land.settlements[town.id]!.claimed);
  expect(assigned.game.land.settlements[town.id]!.worked).toHaveLength(1);
  expect(assigned.archive.records.filter(record => commandSchema.parse(record.command).type === 'setWorkerPolicy')).toHaveLength(1);

  // Generated geography and ordinary food-funded growth: no authored population,
  // extra treasury, halted AI or development mutation API is used.
  let grew = false, grownTurn = 1;
  for (let turn = 2; turn <= 13; turn++) {
    await closeManagement(page); await closeCampaignOptions(page);
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    await openSelectedOrders(page);
    if ((await panel.locator(':scope > summary').innerText()).includes('2 / 2 assigned')) { grew = true; grownTurn = turn; break; }
  }
  expect(grew, 'A food-focused generated hearth must grow and assign its new worker within twelve ordinary turns.').toBe(true);
  const grown = await exportedTravel(page);
  expect(grown.game.settlements[town.id]!.population).toBe(2);
  expect(grown.game.land.settlements[town.id]!.worked).toHaveLength(2);
  expect(grown.archive.records.filter(record => commandSchema.parse(record.command).type === 'setWorkerPolicy' && commandSchema.parse(record.command).factionId === grown.game.turnOwnerId)).toHaveLength(1);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await policyPanel(page);
  await panel.getByRole('button', { name: 'Return to manual control', exact: true }).click();
  await expect(panel.locator(':scope > summary')).toContainText('Manual control');
  const manual = await exportedTravel(page);
  expect(manual.game.land.settlements[town.id]!.worked).toEqual(grown.game.land.settlements[town.id]!.worked);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const restored = await exportedTravel(page);
  expect(serializeGame(restored.game)).toBe(serializeGame(grown.game)); expect(restored.archive).toEqual(grown.archive);
  await policyPanel(page);
  await panel.screenshot({ path: testInfo.outputPath('worker-policy-generated-growth.png') });
  await panel.locator(':scope > summary').screenshot({ path: testInfo.outputPath('worker-policy-growth-summary-native.png') });
  writeFileSync(testInfo.outputPath('grown.theandril'), grown.bytes);
  writeFileSync(testInfo.outputPath('restored.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('growth.json'), JSON.stringify({ seed: 20260905, size: 'tiny', pace: 'short', realms: 2, generated: true, authoredPopulation: false, town: town.id, grownTurn, assigned: 2, policyCommandsByPlayer: 1, initialHash: stateHash(before.game), assignedHash: stateHash(assigned.game), grownHash: stateHash(grown.game), restoredHash: stateHash(restored.game), records: grown.archive.records.length }, null, 2) + '\n');
  expect(errors).toEqual([]);
});

test('worker priorities and direct manual takeover use real commands at narrow width with exact saved replay', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const game = createGame({ seed: 17, size: 'tiny', pace: 'short', factionCount: 2, cityStateCount: 0 });
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Stewarded hearth' }).ok).toBe(true);
  const town = Object.values(game.settlements)[0]!, archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  const expectedGame = deserializeGame(serializeGame(game)), expected = resumeJournal(expectedGame, archive);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({ name: 'worker-priorities.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = await policyPanel(page);
  const assignments: number[][] = [];
  for (const focus of ['industry', 'food'] as const) {
    if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
    await panel.getByRole('combobox', { name: 'Worker priority', exact: true }).selectOption(focus);
    const apply = panel.getByRole('button', { name: 'Apply worker policy', exact: true });
    await apply.focus(); await page.keyboard.press('Enter');
    await expect(panel.locator(':scope > summary')).toContainText(focus === 'food' ? 'Food' : 'Industry');
    expect(expected.record(expectedGame, { type: 'setWorkerPolicy', factionId: game.turnOwnerId, settlementId: town.id, focus }).ok).toBe(true);
    assignments.push([...expectedGame.land.settlements[town.id]!.worked]);
  }
  expect(assignments[0]).not.toEqual(assignments[1]);
  const focused = await exportedTravel(page);
  expect(serializeGame(focused.game)).toBe(serializeGame(expectedGame)); expect(focused.archive).toEqual(expected.materialize());
  await policyPanel(page);
  const returnToManual = panel.getByRole('button', { name: 'Return to manual control', exact: true });
  await returnToManual.scrollIntoViewIfNeeded();
  expect(await returnToManual.evaluate(button => {
    const bounds = button.getBoundingClientRect(), frame = button.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.height >= 44 && bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('worker-policy-narrow-130.png') });
  const cell = getObservation(expectedGame, game.turnOwnerId).land.settlements[0]!.worked[0]!;
  const tiles = page.getByRole('button', { name: 'Select tiles', exact: true });
  if (await tiles.getAttribute('aria-expanded') !== 'true') await tiles.click();
  await page.getByRole('button', { name: `Inspect land hex ${cell}`, exact: true }).click();
  await expect(page.getByTestId('worker-policy-manual-warning')).toBeVisible();
  await page.getByRole('button', { name: 'Remove worker', exact: true }).click();
  await expect(panel.locator(':scope > summary')).toContainText('Manual control');
  expect(expected.record(expectedGame, { type: 'setWorkedTiles', factionId: game.turnOwnerId, settlementId: town.id, cells: [] }).ok).toBe(true);
  const manual = await exportedTravel(page);
  expect(serializeGame(manual.game)).toBe(serializeGame(expectedGame)); expect(manual.archive).toEqual(expected.materialize());
  expect(manual.game.workerPolicies).toEqual([]); expect(manual.game.land.settlements[town.id]!.worked).toEqual([]);
  writeFileSync(testInfo.outputPath('manual.theandril'), manual.bytes);
  writeFileSync(testInfo.outputPath('manual.json'), JSON.stringify({ generatedSeed: 17, setup: 'Ordinary founding before from-save journal; no authored geography, resources or population.', priorities: ['industry', 'food'], assignments, focusedHash: stateHash(focused.game), manualHash: stateHash(manual.game), records: manual.archive.records.length, manualTakeover: true, width: 390, textScale: 1.3 }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
