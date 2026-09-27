import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type Charter, type GameState } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { cellTransferBytes, packCells } from '../../apps/web/src/cell-transfer';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { closeManagement, openProduction, openRegistry, selectFromRegistry } from './ui-navigation';

// Authored acceptance scenario, not earned conquest. This test author also
// authored personal template storage; parent browser execution/review is separate.
const sequenceIds = ['unit.guard', 'building.workshop', 'unit.guard'];
type RequestTrace = { id?: number; type?: string; armyId?: string; target?: number; append?: boolean };
type ResponseTrace = { id?: number; type?: string; hash?: string; movementJsonBytes?: number };
type Traffic = { sent: number; received: number; states: number; groups: number; pending: number; requestTypes: Record<string, number>; responseTypes: Record<string, number>; requests: RequestTrace[]; responses: ResponseTrace[] };
const charterPolicies = (charters: readonly Charter[]) => charters.map(({ settlementId, factionId, focus, ceiling }) => ({ settlementId, factionId, focus, ceiling }));
const countDelta = (after: Record<string, number>, before: Record<string, number>) => Object.fromEntries(Object.entries(after).map(([type, count]) => [type, count - (before[type] ?? 0)] as const).filter(([, count]) => count !== 0));

async function observeTraffic(page: Page) {
  await page.addInitScript(() => {
    const trace: Traffic = { sent: 0, received: 0, states: 0, groups: 0, pending: 0, requestTypes: {}, responseTypes: {}, requests: [], responses: [] };
    (window as unknown as { __PRODUCTION_TRAFFIC__: typeof trace }).__PRODUCTION_TRAFFIC__ = trace;
    const NativeWorker = window.Worker;
    // Observe the real transport; forward every request/response unchanged.
    window.Worker = class extends NativeWorker {
      private readonly waiting = new Set<number>();
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data as { id?: number; type?: string; hash?: string };
          trace.received++;
          trace.responseTypes[data.type ?? 'missing'] = (trace.responseTypes[data.type ?? 'missing'] ?? 0) + 1;
          trace.responses.push({ id: data.id, type: data.type, hash: data.hash,
            ...(data.type === 'movementQuery' ? { movementJsonBytes: new TextEncoder().encode(JSON.stringify(data)).byteLength } : {}) });
          if (data.type === 'state') trace.states++;
          if (typeof data.id === 'number' && data.type !== 'progress') this.waiting.delete(data.id);
          trace.pending = this.waiting.size;
        });
      }
      override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
        const data = message as RequestTrace;
        trace.sent++;
        trace.requestTypes[data.type ?? 'missing'] = (trace.requestTypes[data.type ?? 'missing'] ?? 0) + 1;
        trace.requests.push({ id: data.id, type: data.type, armyId: data.armyId, target: data.target, append: data.append });
        if (data.type === 'groupProduction') trace.groups++;
        if (typeof data.id === 'number') this.waiting.add(data.id);
        trace.pending = this.waiting.size;
        if (Array.isArray(options)) super.postMessage(message, options);
        else super.postMessage(message, options);
      }
    };
  });
}

async function traffic(page: Page): Promise<Traffic> {
  await expect.poll(() => page.evaluate(() => (window as unknown as { __PRODUCTION_TRAFFIC__: Traffic }).__PRODUCTION_TRAFFIC__.pending)).toBe(0);
  return page.evaluate(() => ({ ...(window as unknown as { __PRODUCTION_TRAFFIC__: Traffic }).__PRODUCTION_TRAFFIC__ }));
}

async function snapshot(page: Page) {
  return page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, metrics: window.__THEANDRIL__!.getPerformanceCounters(), selection: window.__THEANDRIL__!.getSelection() }));
}

async function importCampaign(page: Page, game: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'production-sequences.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

async function settings(page: Page) {
  await closeManagement(page);
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

async function save(page: Page) {
  await settings(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
}

async function restoreAfterReload(page: Page) {
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
}

async function disclose(page: Page, id: string, keyboard = false): Promise<Locator> {
  const panel = page.getByTestId(id);
  if (await panel.getAttribute('open') === null) {
    const summary = panel.locator(':scope > summary');
    if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
    else await summary.click();
  }
  return panel;
}

async function recallHearths(page: Page, keyboard = false) {
  await openRegistry(page, 'settlements');
  const groups = await disclose(page, 'selection-groups', keyboard);
  await groups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'All workshop hearths' });
  if (keyboard) { await groups.getByRole('button', { name: 'Recall group', exact: true }).focus(); await page.keyboard.press('Enter'); }
  else await groups.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(page.getByTestId('group-charters')).toContainText('40 hearths selected');
}

async function addItem(panel: Locator, itemId: string) {
  await panel.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(itemId);
  await panel.getByRole('button', { name: 'Add project', exact: true }).click();
}

async function removeAll(panel: Locator) {
  const rows = panel.getByTestId('production-sequence-item');
  for (let remaining = await rows.count(); remaining > 0; remaining--) await rows.first().getByRole('button', { name: /^Remove item / }).click();
  await expect(rows).toHaveCount(0);
}

test('forty hearths recall a personal ordered sequence, pay for one batch, retain individual control and restore saved queues', async ({ page }, testInfo) => {
  const game = empireLandCampaign('legendary');
  const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  towns.forEach((town, index) => { town.name = `Sequence hearth ${String(index + 1).padStart(3, '0')}`; });
  expect(towns).toHaveLength(40);
  expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId)).toHaveLength(100);
  expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  // Real standing policies make preservation meaningful; their next-item quotes
  // may legitimately change when ordinary production fills their queues.
  for (const town of towns.slice(0, 2)) expect(applyCommand(game, { type: 'setCharter', factionId: game.turnOwnerId, settlementId: town.id, focus: 'works', ceiling: 24 }).ok).toBe(true);
  expect(applyCommand(game, { type: 'setSelectionGroup', factionId: game.turnOwnerId, kind: 'settlements', name: 'All workshop hearths', memberIds: towns.map(town => town.id) }).ok).toBe(true);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await observeTraffic(page);
  await importCampaign(page, game);
  await save(page);
  await openRegistry(page, 'armies');
  await page.getByTestId('army-registry').getByRole('checkbox').first().check();
  await openRegistry(page, 'settlements');
  const beforeRecall = await snapshot(page), recallTraffic = await traffic(page);
  await recallHearths(page, true);
  expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  expect(await traffic(page)).toEqual(recallTraffic);
  const panel = await disclose(page, 'group-production');
  await removeAll(panel);
  const beforePreferences = await snapshot(page), preferenceTraffic = await traffic(page);
  await addItem(panel, 'building.workshop');
  await addItem(panel, 'unit.guard');
  await addItem(panel, 'unit.scout');
  await addItem(panel, 'unit.guard');
  const rows = panel.getByTestId('production-sequence-item');
  await rows.nth(1).getByRole('button', { name: /^Move item .* up$/ }).click();
  await rows.nth(2).getByRole('button', { name: /^Remove item / }).click();
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('Oath guard');
  await expect(rows.nth(1)).toContainText('Cinder workshop');
  await expect(rows.nth(2)).toContainText('Oath guard');
  const templates = await disclose(page, 'production-templates');
  const library = templates.getByRole('combobox', { name: 'Saved production template', exact: true });
  const name = templates.getByRole('textbox', { name: 'Production template name', exact: true });
  await name.fill('Workshop watch');
  await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  await expect(library.getByRole('option', { name: /Workshop watch/ })).toHaveCount(1);
  const templateId = await library.getByRole('option', { name: /Workshop watch/ }).getAttribute('value');
  expect(templateId).toBeTruthy();
  await name.fill('Realm watch');
  await templates.getByRole('button', { name: 'Update production template', exact: true }).click();
  await expect(library.getByRole('option', { name: /Realm watch/ })).toHaveAttribute('value', templateId!);
  await expect(library.getByRole('option', { name: /Workshop watch/ })).toHaveCount(0);
  await removeAll(panel);
  await library.selectOption(templateId!);
  await expect(rows).toHaveCount(0);
  await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  await expect(rows).toHaveCount(3);
  expect((await snapshot(page)).hash).toBe(beforePreferences.hash);
  expect((await snapshot(page)).view.ownSettlements.map(town => town.queue)).toEqual(beforePreferences.view.ownSettlements.map(town => town.queue));
  expect(await traffic(page)).toEqual(preferenceTraffic);
  await expect(page.getByTestId('group-charters')).toContainText('40 hearths selected');
  await expect(panel.getByTestId('production-sequence-cost')).toContainText('36 coin per hearth · 1440 coin across this selection');
  await page.screenshot({ path: testInfo.outputPath('production-sequences-desktop.png') });
  await openRegistry(page, 'armies');
  await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('group-charters')).toContainText('40 hearths selected');

  await settings(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const downloaded = await (await downloadPromise).path();
  expect(downloaded).toBeTruthy();
  const exported = await importSave(await readFile(downloaded!)), campaign = deserializeCampaign(exported);
  expect(stateHash(campaign.game)).toBe(beforePreferences.hash);
  expect(campaign.archive.records).toHaveLength(0);
  expect(exported).not.toContain('Realm watch');
  expect(exported).not.toContain('Workshop watch');
  expect(campaign.game.selectionGroups).toEqual(game.selectionGroups);

  await restoreAfterReload(page);
  await recallHearths(page, true);
  await disclose(page, 'group-production', true);
  await removeAll(panel);
  await disclose(page, 'production-templates', true);
  await expect(library.getByRole('option', { name: /Realm watch/ })).toHaveCount(1);
  const beforeTemplateRecall = await snapshot(page), beforeTemplateTraffic = await traffic(page);
  await library.selectOption(templateId!);
  await expect(rows).toHaveCount(0);
  await templates.getByRole('button', { name: 'Recall production template', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(3);
  expect((await snapshot(page)).hash).toBe(beforeTemplateRecall.hash);
  expect(await traffic(page)).toEqual(beforeTemplateTraffic);
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('production-sequences-narrow.png') });
  const before = await snapshot(page), beforeTraffic = await traffic(page);
  await panel.getByRole('button', { name: 'Apply production (40)', exact: true }).click();
  const results = page.getByTestId('group-production-results');
  await expect(results.locator(':scope > p').first()).toContainText('40 hearths complete · 0 partial or refused. 120 orders accepted · 0 refused.');
  await expect(page.getByTestId('group-charters')).toContainText('0 hearths selected');
  // Loading the campaign selected an army. Its map movement hook refreshes once
  // when the changed hash unlocks; this is a read query, not another state/order.
  expect(before.selection.armyId).toBeTruthy();
  await expect.poll(async () => (await traffic(page)).requestTypes.movementQuery! - (beforeTraffic.requestTypes.movementQuery ?? 0)).toBe(1);
  const afterTraffic = await traffic(page), applied = await snapshot(page);
  const requests = afterTraffic.requests.slice(beforeTraffic.requests.length), responses = afterTraffic.responses.slice(beforeTraffic.responses.length);
  const transport = { requests, responses, requestTypes: countDelta(afterTraffic.requestTypes, beforeTraffic.requestTypes), responseTypes: countDelta(afterTraffic.responseTypes, beforeTraffic.responseTypes) };
  // Retain the real per-type transcript even if an exact assertion below fails.
  await testInfo.attach('production-sequence-transport.json', { body: JSON.stringify(transport, null, 2), contentType: 'application/json' });
  expect(afterTraffic.sent - beforeTraffic.sent).toBe(2);
  expect(afterTraffic.received - beforeTraffic.received).toBe(2);
  expect(transport.requestTypes).toEqual({ groupProduction: 1, movementQuery: 1 });
  expect(transport.responseTypes).toEqual({ state: 1, movementQuery: 1 });
  expect(requests).toEqual([
    { id: expect.any(Number), type: 'groupProduction', armyId: undefined, target: undefined, append: undefined },
    { id: expect.any(Number), type: 'movementQuery', armyId: before.selection.armyId, target: undefined, append: undefined },
  ]);
  expect(responses).toEqual([
    { id: requests[0]!.id, type: 'state', hash: applied.hash },
    { id: requests[1]!.id, type: 'movementQuery', hash: applied.hash, movementJsonBytes: expect.any(Number) },
  ]);
  expect(responses[1]!.movementJsonBytes).toBeGreaterThan(0);
  expect(afterTraffic.states - beforeTraffic.states).toBe(1);
  expect(afterTraffic.groups - beforeTraffic.groups).toBe(1);
  const serial = deserializeGame(serializeGame(game));
  for (const town of towns) for (const itemId of sequenceIds) expect(applyCommand(serial, { type: 'queue', factionId: serial.turnOwnerId, settlementId: town.id, itemId }).ok).toBe(true);
  expect(applied.hash).toBe(stateHash(serial));
  expect(applied.view.treasury).toBe(before.view.treasury - 40 * 36);
  for (const town of applied.view.ownSettlements) expect(town.queue.map(item => item.itemId)).toEqual([...(town.id === towns[0]!.id ? ['building.granary'] : []), ...sequenceIds]);
  expect(before.view.charters).toHaveLength(2);
  expect(charterPolicies(applied.view.charters)).toEqual(charterPolicies(before.view.charters));
  expect(applied.view.charters).toEqual(getObservation(serial, serial.turnOwnerId).charters);
  expect(applied.view.selectionGroups).toEqual(before.view.selectionGroups);
  expect(applied.view.exploredCells).toBe(before.view.exploredCells);
  expect(applied.metrics.cellTransferBytes).toBe(cellTransferBytes(packCells([])));
  expect(applied.metrics.landQueryCount).toBe(before.metrics.landQueryCount);
  expect(applied.metrics.developmentQueryCount).toBe(before.metrics.developmentQueryCount);
  // Existing worker metrics count state/land/development payloads, not movement
  // replies. Keep their exact state delta and disclose the extra read JSON below.
  expect(applied.metrics.totalTransferBytes - before.metrics.totalTransferBytes).toBe(applied.metrics.transferBytes);
  const summary = results.locator(':scope > p').first();
  await summary.scrollIntoViewIfNeeded();
  const png = await summary.screenshot({ path: testInfo.outputPath('production-sequence-results.png') });
  const capture = { authored: 'Legendary/gen4/seed20260905; 40 owned hearths, 100 owned armies, 4000 total armies; paid initial granary queue; two works charters; saved hearth-group command', viewport: { width: 390, height: 844 }, locator: '[data-testid="group-production-results"] > p:first-child', boundingBox: await summary.boundingBox(), bytes: png.byteLength, stage: 'Explicit three-item list completed for forty hearths:120 paid queue commands, preserving the existing granary and charter policies. Capture shows the actual result summary only.', transformations: 'none; direct Playwright locator PNG', publishedStates: afterTraffic.states - beforeTraffic.states, transferBytes: applied.metrics.transferBytes, cellTransferBytes: applied.metrics.cellTransferBytes, additionalMovementReplyJsonBytes: responses[1]!.movementJsonBytes, transferAccounting: 'transferBytes is the existing worker state-payload metric; the separately measured selected-army movement reply is not counted by that metric. Neither value includes browser structured-clone framing.', transport, commandMs: applied.metrics.commandMs, beforeHash: before.hash, afterHash: applied.hash };
  await writeFile(testInfo.outputPath('production-sequence-capture.json'), JSON.stringify(capture, null, 2));
  await testInfo.attach('production-sequence-capture.json', { body: JSON.stringify(capture, null, 2), contentType: 'application/json' });

  await selectFromRegistry(page, 'settlements', towns[0]!.name);
  await openProduction(page, 'land');
  await page.getByRole('button', { name: 'Recruit Wayfinder', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.ownSettlements.find(town => town.id === towns[0]!.id)?.queue.map(item => item.itemId)).toEqual(['building.granary', ...sequenceIds, 'unit.scout']);
  const overridden = await snapshot(page);
  expect(overridden.view.treasury).toBe(applied.view.treasury - 8);
  expect(overridden.view.ownSettlements.filter(town => town.id !== towns[0]!.id).map(town => town.queue)).toEqual(applied.view.ownSettlements.filter(town => town.id !== towns[0]!.id).map(town => town.queue));
  await save(page);
  await restoreAfterReload(page);
  expect((await snapshot(page)).hash).toBe(overridden.hash);
  await recallHearths(page);
  await disclose(page, 'group-production');
  await disclose(page, 'production-templates');
  await library.selectOption(templateId!);
  const beforeDelete = await snapshot(page), deleteTraffic = await traffic(page);
  await templates.getByRole('button', { name: 'Delete production template', exact: true }).click();
  await expect(library.getByRole('option', { name: /Realm watch/ })).toHaveCount(0);
  expect((await snapshot(page)).hash).toBe(beforeDelete.hash);
  expect(await traffic(page)).toEqual(deleteTraffic);
  expect(errors).toEqual([]);
});

test('shared coin and ordinary duplicate, full-queue and prerequisite refusals retain paid prefixes in stable hearth order', async ({ page }) => {
  const game = empireLandCampaign('legendary');
  const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  towns.forEach((town, index) => { town.name = `Refusal hearth ${String(index + 1).padStart(3, '0')}`; });
  expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  for (let index = 0; index < 4; index++) expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[1]!.id, itemId: 'unit.guard' }).ok).toBe(true);
  // Authored budget after real paid setup:12+12+(12+8), then the fourth hearth cannot pay.
  game.factions.find(faction => faction.id === game.turnOwnerId)!.treasury = 44;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importCampaign(page, game);
  await openRegistry(page, 'settlements');
  const registry = page.getByTestId('settlement-registry');
  for (let index = 3; index >= 0; index--) await registry.getByRole('checkbox').nth(index).check();
  const panel = await disclose(page, 'group-production');
  await removeAll(panel);
  for (const itemId of ['unit.guard', 'building.granary', 'unit.transport']) await addItem(panel, itemId);
  await panel.getByRole('button', { name: 'Apply production (4)', exact: true }).click();
  const results = page.getByTestId('group-production-results');
  await expect(results.locator(':scope > p').first()).toContainText('0 hearths complete · 4 partial or refused. 4 orders accepted · 4 refused.');
  await expect(results).toContainText('already built or queued');
  await expect(results).toContainText('queue is full');
  await expect(results).toContainText('Coastal navigation');
  await expect(results).toContainText('Not enough coin');
  await expect(page.getByTestId('group-charters')).toContainText('4 hearths selected');
  const after = await snapshot(page), queue = (id: string) => after.view.ownSettlements.find(town => town.id === id)!.queue.map(item => item.itemId);
  expect(after.view.treasury).toBe(0);
  expect(queue(towns[0]!.id)).toEqual(['building.granary', 'unit.guard']);
  expect(queue(towns[1]!.id)).toEqual(Array(5).fill('unit.guard'));
  expect(queue(towns[2]!.id)).toEqual(['unit.guard', 'building.granary']);
  expect(queue(towns[3]!.id)).toEqual([]);
  expect(after.view.ownSettlements.filter(town => !towns.slice(0, 4).some(selected => selected.id === town.id)).every(town => town.queue.length === 0)).toBe(true);
  for (let index = 0; index < 4; index++) await expect(registry.getByRole('checkbox').nth(index)).toBeChecked();
  expect(errors).toEqual([]);
});
