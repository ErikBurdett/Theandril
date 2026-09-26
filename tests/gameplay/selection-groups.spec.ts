import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { empireLandCampaign } from '../../packages/test-fixtures/src/empire-land-fixture';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../packages/test-fixtures/src/naval-fixture';
import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

type Kind = 'armies' | 'settlements';

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

async function importCampaign(page: Page, game: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'selection-groups.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

async function snapshot(page: Page) {
  return page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()!, metrics: window.__THEANDRIL__!.getPerformanceCounters() }));
}

async function groups(page: Page, kind: Kind, keyboard = false) {
  await openRegistry(page, kind);
  const details = page.getByTestId('selection-groups');
  if (await details.getAttribute('open') === null) {
    const summary = details.locator(':scope > summary');
    if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
    else await summary.click();
  }
  return details;
}

async function createGroup(page: Page, kind: Kind, name: string) {
  const details = await groups(page, kind);
  await details.getByRole('textbox', { name: 'Group name', exact: true }).fill(name);
  await details.getByRole('button', { name: 'Save new group', exact: true }).click();
  const saved = details.getByRole('combobox', { name: kind === 'armies' ? 'Saved army group' : 'Saved hearth group', exact: true });
  await expect(saved.getByRole('option', { name, exact: true })).toHaveCount(1);
  await saved.selectOption({ label: name });
  return details;
}

test('saved groups replace paged selections without orders, then explicitly post armies and charter forty hearths', async ({ page }, testInfo) => {
  const game = empireLandCampaign('legendary');
  const armies = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1);
  armies.forEach((army, index) => { army.name = `Saved company ${String(index + 1).padStart(3, '0')}`; });
  towns.forEach((town, index) => { town.name = `Saved hearth ${String(index + 1).padStart(3, '0')}`; });
  expect(armies).toHaveLength(100); expect(towns).toHaveLength(40);
  expect(applyCommand(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: towns[0]!.id, itemId: 'building.granary' }).ok).toBe(true);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importCampaign(page, game);
  const original = await snapshot(page);
  await openRegistry(page, 'armies');
  const postings = page.getByTestId('group-postings');
  const search = page.getByRole('searchbox', { name: 'Search your realm' });
  await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await expect(postings).toContainText('100 armies selected');
  const armyGroups = await createGroup(page, 'armies', 'Northern host');
  await expect.poll(async () => (await snapshot(page)).view.selectionGroups[0]?.memberIds.length).toBe(100);
  expect((await snapshot(page)).hash).not.toBe(original.hash);
  expect((await snapshot(page)).view.postings).toEqual([]);

  // Updating replaces membership across pages and filters; it does not append
  // the new checks to the hundred members already saved in the campaign.
  await postings.getByRole('button', { name: 'Clear group selection', exact: true }).click();
  const registry = page.getByTestId('army-registry');
  await registry.getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  await registry.getByRole('checkbox').first().check();
  await search.fill('Saved company 100');
  await registry.getByRole('checkbox').check();
  await expect(postings).toContainText('3 armies selected · 2 outside this filter');
  await armyGroups.getByRole('textbox', { name: 'Group name', exact: true }).fill('Watch company');
  await armyGroups.getByRole('button', { name: 'Update group', exact: true }).click();
  await expect(armyGroups.getByRole('option', { name: 'Watch company', exact: true })).toHaveCount(1);
  await expect(armyGroups.getByRole('option', { name: 'Northern host', exact: true })).toHaveCount(0);
  const members = [armies[0]!.id, armies[25]!.id, armies[99]!.id].sort();
  expect((await snapshot(page)).view.selectionGroups[0]?.memberIds).toEqual(members);

  await search.fill('');
  await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await armyGroups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'Watch company' });
  await expect(postings).toContainText('100 armies selected');
  const beforeRecall = await snapshot(page);
  await armyGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(postings).toContainText('3 armies selected');
  const recalled = await snapshot(page);
  expect(recalled.hash).toBe(beforeRecall.hash);
  expect(recalled.metrics.totalTransferBytes).toBe(beforeRecall.metrics.totalTransferBytes);
  expect(recalled.view.postings).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('selection-groups-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await postings.getByRole('button', { name: 'Clear group selection', exact: true }).click();
  await armyGroups.getByRole('button', { name: 'Recall group', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(postings).toContainText('3 armies selected');
  const compact = armyGroups.getByTestId('selection-group-recall');
  await compact.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('selection-groups-narrow.png') });
  const labelBounds = await compact.locator(':scope > label').boundingBox();
  const recallBounds = await compact.getByRole('button', { name: 'Recall group', exact: true }).boundingBox();
  expect(labelBounds).not.toBeNull(); expect(recallBounds).not.toBeNull();
  const x = Math.floor(Math.min(labelBounds!.x, recallBounds!.x));
  const y = Math.floor(Math.min(labelBounds!.y, recallBounds!.y));
  const clip = { x, y, width: Math.ceil(Math.max(labelBounds!.x + labelBounds!.width, recallBounds!.x + recallBounds!.width)) - x,
    height: Math.ceil(Math.max(labelBounds!.y + labelBounds!.height, recallBounds!.y + recallBounds!.height)) - y };
  const png = await page.screenshot({ path: testInfo.outputPath('selection-groups-recall.png'), clip });
  const capture = { authored: 'Legendary/gen4/seed20260905; 40 owned hearths, 100 owned armies, 4000 total armies; paid manual granary queue', viewport: { width: 390, height: 844 }, locator: '[data-testid="selection-group-recall"] > label and Recall group button', elementBounds: { label: labelBounds, recall: recallBounds }, clip, bytes: png.byteLength, stage: 'Watch company recalled by keyboard; three armies selected, no postings yet. Capture includes only the saved-group label, dropdown and Recall button; member count and recall status below are outside the clip.', transformations: 'none after capture; direct Playwright page.screenshot PNG using the union of the two actual element bounds, rounded outward to whole pixels' };
  await writeFile(testInfo.outputPath('selection-group-capture.json'), JSON.stringify(capture, null, 2));
  await testInfo.attach('selection-group-capture.json', { body: JSON.stringify(capture, null, 2), contentType: 'application/json' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await postings.getByRole('button', { name: 'Post selected armies (3)', exact: true }).click();
  await expect(page.getByTestId('group-posting-results')).toContainText('3 orders accepted · 0 refused');
  expect((await snapshot(page)).view.postings.map(posting => posting.armyId).sort()).toEqual(members);

  await openRegistry(page, 'settlements');
  await search.fill('');
  const charters = page.getByTestId('group-charters');
  await charters.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  const hearthGroups = await createGroup(page, 'settlements', 'Hearth watch');
  expect((await snapshot(page)).view.selectionGroups.find(group => group.kind === 'settlements')?.memberIds).toHaveLength(40);
  await charters.getByRole('button', { name: 'Clear hearth selection', exact: true }).click();
  await hearthGroups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Hearth watch' });
  await expect(charters).toContainText('0 hearths selected');
  const beforeHearthRecall = await snapshot(page);
  await hearthGroups.getByRole('button', { name: 'Recall group', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(charters).toContainText('40 hearths selected');
  const recalledHearths = await snapshot(page);
  expect(recalledHearths.hash).toBe(beforeHearthRecall.hash);
  expect(recalledHearths.metrics.totalTransferBytes).toBe(beforeHearthRecall.metrics.totalTransferBytes);
  await charters.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  await charters.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true }).fill('24');
  await charters.getByRole('button', { name: 'Apply charters (40)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('40 orders accepted · 0 refused');
  const applied = await snapshot(page);
  expect(applied.view.charters).toHaveLength(40);
  expect(applied.view.charters.every(charter => charter.focus === 'wealth' && charter.ceiling === 24)).toBe(true);
  expect(applied.view.ownSettlements.map(town => town.queue)).toEqual(original.view.ownSettlements.map(town => town.queue));
  expect(applied.view.treasury).toBe(original.view.treasury);
  expect(applied.view.exploredCells).toBe(original.view.exploredCells);
  // Removing the saved selection is independent of the orders already issued.
  await hearthGroups.getByRole('button', { name: 'Delete group', exact: true }).click();
  await expect(hearthGroups.getByRole('option', { name: 'Hearth watch', exact: true })).toHaveCount(0);
  expect((await snapshot(page)).view.charters).toEqual(applied.view.charters);
  expect((await snapshot(page)).view.selectionGroups.map(group => group.name)).toEqual(['Watch company']);
  expect(errors).toEqual([]);
});

test('campaign groups prune a consumed caravan, survive canonical save and export, and never leak into another campaign', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2, cityStateCount: 0 });
  await importCampaign(page, game);
  await openRegistry(page, 'armies');
  await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await createGroup(page, 'armies', 'First expedition');
  expect((await snapshot(page)).view.selectionGroups[0]?.memberIds).toHaveLength(2);
  await selectFromRegistry(page, 'armies', /Hearth caravan/);
  await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Saved Group Hearth');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.selectionGroups[0]?.memberIds).toEqual(['army.2']);
  await openRegistry(page, 'settlements');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await createGroup(page, 'settlements', 'Home hearths');
  const saved = await snapshot(page);
  expect(saved.view.selectionGroups.map(group => group.kind)).toEqual(['armies', 'settlements']);
  await save(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const downloaded = await (await downloadPromise).path();
  expect(downloaded).toBeTruthy();
  const exported = deserializeCampaign(await importSave(await readFile(downloaded!)));
  expect(stateHash(exported.game)).toBe(saved.hash);
  expect(exported.game.selectionGroups).toEqual(saved.view.selectionGroups);
  expect(exported.archive.records).toEqual(expect.arrayContaining([expect.objectContaining({ command: expect.objectContaining({ type: 'setSelectionGroup', name: 'First expedition' }) }), expect.objectContaining({ command: expect.objectContaining({ type: 'setSelectionGroup', name: 'Home hearths' }) })]));
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect((await snapshot(page)).hash).toBe(saved.hash);
  const library = await groups(page, 'armies');
  await library.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'First expedition' });
  await library.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  expect((await snapshot(page)).hash).toBe(saved.hash);
  await library.getByRole('button', { name: 'Delete group', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.selectionGroups.map(group => group.name)).toEqual(['Home hearths']);
  await save(page);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect((await snapshot(page)).view.selectionGroups.map(group => group.name)).toEqual(['Home hearths']);
  await settings(page);
  await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('77');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  // Generation renames the submit button to "Shaping the world…" while the
  // previous turn-one campaign stays readable. Await the new worker's terminal
  // feedback and enabled gameplay controls, then verify the requested seed.
  await expect(page.getByTestId('feedback')).toHaveText('◆Your people await a hearth. Select the caravan and found your first settlement.');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect.poll(async () => (await snapshot(page)).view.seed).toBe(77);
  expect((await snapshot(page)).view.selectionGroups).toEqual([]);
  await settings(page);
  await page.locator('input[type=file]').setInputFiles(downloaded!);
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect((await snapshot(page)).hash).toBe(saved.hash);
  expect((await snapshot(page)).view.selectionGroups).toEqual(saved.view.selectionGroups);
  expect(errors).toEqual([]);
});

test('recalling a carried army skips it without rewriting the saved group, while explicit empty replacement is canonical', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importCampaign(page, navalCampaign({ enemyFleet: false }));
  await openRegistry(page, 'armies');
  await page.getByRole('searchbox', { name: 'Search your realm' }).fill(N.cargoName);
  await page.getByTestId('army-registry').getByRole('checkbox').check();
  await createGroup(page, 'armies', 'Island expedition');
  await selectFromRegistry(page, 'armies', N.cargoName);
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Embark army', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.ownArmies.find(army => army.id === N.cargoId)?.carrierId).toBe(N.fleetId);
  const library = await groups(page, 'armies');
  await library.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'Island expedition' });
  const before = await snapshot(page);
  expect(before.view.selectionGroups[0]?.memberIds).toEqual([N.cargoId]);
  await library.getByRole('button', { name: 'Recall group', exact: true }).click();
  await expect(page.getByTestId('group-postings')).toContainText('0 armies selected');
  await expect(library.getByTestId('selection-group-recall')).toContainText('1 skipped (1 embarked, 0 unavailable or no longer owned)');
  const recalled = await snapshot(page);
  expect(recalled.hash).toBe(before.hash);
  expect(recalled.metrics.totalTransferBytes).toBe(before.metrics.totalTransferBytes);
  expect(recalled.view.selectionGroups).toEqual(before.view.selectionGroups);
  await expect(library.getByRole('button', { name: 'Save new group', exact: true })).toBeDisabled();
  await expect(library.getByRole('button', { name: 'Update group', exact: true })).toBeEnabled();
  await library.getByRole('button', { name: 'Update group', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).view.selectionGroups[0]?.memberIds).toEqual([]);
  expect((await snapshot(page)).hash).not.toBe(before.hash);
  expect((await snapshot(page)).view.ownArmies.find(army => army.id === N.cargoId)?.carrierId).toBe(N.fleetId);
  expect(errors).toEqual([]);
});

test('a damaged saved-group response ends pending work, locks uncertain orders and recovers from a real manual save', async ({ page }) => {
  // Let the real worker save and record the group first, then damage only that
  // response's new group read model. No canonical mutation or success is faked.
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    let damaged = false;
    window.Worker = class extends NativeWorker {
      private receiver: Worker['onmessage'] = null;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data as { type?: string; observation?: { selectionGroups?: Array<{ name: string }> } };
          if (!damaged && data.type === 'state' && data.observation?.selectionGroups?.some(group => group.name === 'Recovery group')) {
            damaged = true;
            this.receiver?.call(this, new MessageEvent('message', { data: { ...data, observation: { ...data.observation, selectionGroups: null } } }));
          } else this.receiver?.call(this, event);
        });
      }
      override get onmessage(): Worker['onmessage'] { return this.receiver; }
      override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
    };
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
  await importCampaign(page, game);
  const original = await snapshot(page);
  await save(page);
  await openRegistry(page, 'armies');
  const postings = page.getByTestId('group-postings');
  await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  const library = await groups(page, 'armies');
  await library.getByRole('textbox', { name: 'Group name', exact: true }).fill('Recovery group');
  await library.getByRole('button', { name: 'Save new group', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('The group order response could not be displayed.');
  await expect(library.getByRole('alert')).toContainText('Some orders may have applied; restore a saved campaign');
  await expect(library).not.toContainText('Saving group changes');
  await expect(library).toHaveAttribute('aria-busy', 'false');
  await expect(library.getByRole('button', { name: 'Save new group', exact: true })).toBeDisabled();
  await expect(postings.getByRole('button', { name: 'Post selected armies (2)', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  await settings(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect((await snapshot(page)).hash).toBe(original.hash);
  expect((await snapshot(page)).view.selectionGroups).toEqual([]);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await openRegistry(page, 'armies');
  await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await createGroup(page, 'armies', 'Recovery group');
  expect((await snapshot(page)).view.selectionGroups).toEqual([expect.objectContaining({ name: 'Recovery group', memberIds: ['army.1', 'army.2'] })]);
  expect(errors).toEqual([]);
});
