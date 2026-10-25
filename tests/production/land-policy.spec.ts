import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createJournal } from '@theandril/chronicle';
import { applyCommand, commandSchema, createGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { closeCampaignOptions, closeManagement, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';

const improvementId = 'improvement.terraced_fields';

/** A generated realm, grown through ordinary food-funded turns. No authored
 * terrain, population, treasury, resources or completed work enters this setup. */
function commissionCampaign() {
  const game = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2, cityStateCount: 0 });
  const factionId = game.turnOwnerId;
  const issue = (command: GameCommand) => expect(applyCommand(game, command).ok).toBe(true);
  issue({ type: 'found', factionId, armyId: 'army.1', name: 'Commissioned hearth' });
  const town = Object.values(game.settlements).find(item => item.factionId === factionId)!;
  issue({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
  while (town.population < 2 && game.turn < 10) issue({ type: 'endTurn', factionId });
  expect(game.turn).toBe(3); expect(town.population).toBe(2);
  const land = getObservation(game, factionId).land.settlements.find(item => item.settlementId === town.id)!;
  const cells = land.cells.filter(cell => cell.claimed && cell.canWork && !cell.improvementId && !cell.resourceId
    && cell.improvementOptions.some(option => option.improvementId === improvementId && option.canStart)).map(cell => cell.cell).sort((a, b) => a - b).slice(0, 2);
  expect(cells).toEqual([1100, 1148]);
  issue({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells });
  const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  return { game, archive, town, factionId, cells };
}

async function loadCommissionCampaign(page: Page, scene: ReturnType<typeof commissionCampaign>) {
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({ name: 'generated-land-commission.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(scene.game, scene.archive))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

async function commissionPanel(page: Page) {
  await selectFromRegistry(page, 'settlements', 'Commissioned hearth'); await openSelectedOrders(page);
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  const panel = page.getByTestId('land-policy');
  if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  return panel;
}

async function setCommission(page: Page, allowance: number, reserve: number, keyboard = false) {
  const panel = await commissionPanel(page);
  await panel.getByRole('combobox', { name: 'Commission improvement', exact: true }).selectOption(improvementId);
  await panel.getByRole('textbox', { name: 'Remaining allowance · coin', exact: true }).fill(String(allowance));
  await panel.getByRole('textbox', { name: 'Treasury reserve · coin', exact: true }).fill(String(reserve));
  const apply = panel.getByRole('button', { name: 'Apply land commission', exact: true });
  if (keyboard) { await apply.focus(); await page.keyboard.press('Enter'); } else await apply.click();
  await expect(panel.locator(':scope > summary')).toContainText('Terraced fields');
  await expect(page.getByTestId('land-panel')).toHaveAttribute('data-query-state', 'ready');
  return panel;
}

test('a generated hearth spends its commission allowance on two ordinary paid works and restores the exact saved policy', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const scene = commissionCampaign(), initialTreasury = getObservation(scene.game, scene.factionId).treasury;
  expect(initialTreasury).toBe(70);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadCommissionCampaign(page, scene);
  await setCommission(page, 100, initialTreasury);
  await expect(page.getByTestId('land-policy-status')).toContainText(/reserve/i);
  const waiting = await exportedTravel(page);
  expect(waiting.game.landPolicies[0]).toMatchObject({ allowance: 100, reserve: initialTreasury, improvementId });
  expect(waiting.game.land.settlements[scene.town.id]!.work).toBeNull();
  expect(getObservation(waiting.game, scene.factionId).treasury).toBe(initialTreasury);

  // Replace the allowance with 50; do not add 50 to the waiting 100.
  const panel = await setCommission(page, 50, 0);
  await expect(panel.locator(':scope > summary')).toContainText('28 coin left');
  await expect(page.getByTestId('land-work')).toContainText('0 / 2 turns completed · 22 coin paid');
  const started = await exportedTravel(page);
  expect(started.game.landPolicies[0]).toMatchObject({ allowance: 28, reserve: 0 });
  expect(started.game.land.settlements[scene.town.id]!.work).toMatchObject({ cell: scene.cells[0], coinCost: 22, remainingTurns: 2 });
  expect(getObservation(started.game, scene.factionId).treasury).toBe(initialTreasury - 22);
  await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await commissionPanel(page);
  await panel.getByRole('button', { name: 'End land commission', exact: true }).click();
  await expect(panel.locator(':scope > summary')).toContainText('Direct construction');
  const ended = await exportedTravel(page);
  expect(ended.game.landPolicies).toEqual([]);
  expect(ended.game.land.settlements[scene.town.id]!.work).toEqual(started.game.land.settlements[scene.town.id]!.work);
  expect(ended.game.factions).toEqual(started.game.factions);
  await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const restored = await exportedTravel(page);
  expect(serializeGame(restored.game)).toBe(serializeGame(started.game)); expect(restored.archive).toEqual(started.archive);

  for (let turn = scene.game.turn + 1; turn <= scene.game.turn + 4; turn++) {
    await closeManagement(page); await closeCampaignOptions(page);
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  }
  const completed = await exportedTravel(page), land = completed.game.land.settlements[scene.town.id]!;
  expect(land.work).toBeNull();
  expect(land.improvements).toEqual(Object.fromEntries(scene.cells.map(cell => [cell, improvementId])));
  expect(land.worked).toEqual(scene.cells);
  expect(completed.game.landPolicies.find(policy => policy.settlementId === scene.town.id)).toMatchObject({ allowance: 3, reserve: 0, improvementId });
  expect(completed.archive.records.filter(record => commandSchema.parse(record.command).type === 'setLandPolicy' && commandSchema.parse(record.command).factionId === scene.factionId)).toHaveLength(2);
  await commissionPanel(page);
  await panel.screenshot({ path: testInfo.outputPath('land-commission-completed.png') });
  await panel.locator(':scope > summary').screenshot({ path: testInfo.outputPath('land-commission-summary-native.png') });
  writeFileSync(testInfo.outputPath('started.theandril'), started.bytes);
  writeFileSync(testInfo.outputPath('restored.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('completed.theandril'), completed.bytes);
  writeFileSync(testInfo.outputPath('completion.json'), JSON.stringify({ setup: 'Generated seed20260905; ordinary founding, Food policy and two growth turns, then ordinary manual workers. From-save browser journal; no authored population, purse, terrain or deposits.', startTurn: scene.game.turn, completedTurn: completed.game.turn, cells: scene.cells, initialTreasury, initialAllowance: 50, orderCosts: [22, 25], remainingAllowance: 3, startedHash: stateHash(started.game), restoredHash: stateHash(restored.game), completedHash: stateHash(completed.game), records: completed.archive.records.length }, null, 2) + '\n');
  expect(errors).toEqual([]);
});

test('land commissions validate budgets and yield to real manual work at narrow width with exact replay', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const scene = commissionCampaign(), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await loadCommissionCampaign(page, scene);
  await campaignMenu(page); await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  const panel = await commissionPanel(page), amount = panel.getByRole('textbox', { name: 'Remaining allowance · coin', exact: true });
  for (const invalid of ['', '-1', '3.2', '9007199254740992']) {
    await amount.fill(invalid);
    await expect(panel.getByRole('button', { name: 'Apply land commission', exact: true })).toBeDisabled();
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
  }
  await setCommission(page, 50, 0, true);
  await expect(panel.locator(':scope > summary')).toContainText('28 coin left');
  const end = panel.getByRole('button', { name: 'End land commission', exact: true });
  await end.scrollIntoViewIfNeeded();
  expect(await end.evaluate(button => {
    const bounds = button.getBoundingClientRect(), frame = button.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.height >= 44 && bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('land-commission-narrow-130.png') });
  await expect(page.getByTestId('land-policy-cancel-warning')).toBeVisible();
  const cancel = page.getByRole('button', { name: 'Cancel land work · no refund', exact: true });
  await cancel.focus(); await page.keyboard.press('Enter');
  await expect(panel.locator(':scope > summary')).toContainText('Direct construction');
  const cancelled = await exportedTravel(page);
  expect(cancelled.game.landPolicies).toEqual([]); expect(cancelled.game.land.settlements[scene.town.id]!.work).toBeNull();
  expect(getObservation(cancelled.game, scene.factionId).treasury).toBe(48);

  await setCommission(page, 50, 48, true);
  await expect(page.getByTestId('land-policy-status')).toContainText(/reserve/i);
  const tiles = page.getByRole('button', { name: 'Select tiles', exact: true });
  if (await tiles.getAttribute('aria-expanded') !== 'true') await tiles.click();
  await page.getByRole('button', { name: `Inspect land hex ${scene.cells[0]}`, exact: true }).click();
  await expect(page.getByTestId('land-policy-manual-warning')).toBeVisible();
  const improvements = page.getByTestId('land-cell').locator('details').filter({ has: page.locator('summary', { hasText: /^Tile improvements$/ }) });
  if (await improvements.getAttribute('open') === null) await improvements.locator(':scope > summary').click();
  const build = page.getByRole('button', { name: 'Build Terraced fields', exact: true });
  await build.focus(); await page.keyboard.press('Enter');
  await expect(panel.locator(':scope > summary')).toContainText('Direct construction');
  const manual = await exportedTravel(page);
  expect(manual.game.landPolicies).toEqual([]);
  expect(manual.game.land.settlements[scene.town.id]!.work).toMatchObject({ cell: scene.cells[0], coinCost: 22, improvementId });
  expect(getObservation(manual.game, scene.factionId).treasury).toBe(26);
  expect(manual.archive.records).toHaveLength(4);
  writeFileSync(testInfo.outputPath('manual.theandril'), manual.bytes);
  writeFileSync(testInfo.outputPath('manual.json'), JSON.stringify({ setup: 'Same ordinary generated two-worker hearth as the completion case.', cancelledHash: stateHash(cancelled.game), manualHash: stateHash(manual.game), records: manual.archive.records.length, cancelledCost: 22, manualCost: 22, finalTreasury: 26, width: 390, textScale: 1.3, manualTakeover: true }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
