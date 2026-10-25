import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { resumeJournal } from '@theandril/chronicle';
import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { settlementOrderScene } from '../gameplay/settlement-order-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry, openSelectedOrders } from '../gameplay/ui-navigation';

test('production settlement orders locate waiting charters across thirty hearths and preserve queues through explicit group changes and saved restoration', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const fixture = settlementOrderScene();
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({
    name: 'authored-thirty-hearth-orders.theandril', mimeType: 'application/gzip',
    buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  let window = await openRegistry(page, 'settlements');
  const filter = page.getByRole('combobox', { name: 'Settlement orders', exact: true });
  const registry = page.getByTestId('settlement-registry'), group = page.getByTestId('group-charters');
  const search = page.getByRole('searchbox', { name: 'Search your realm', exact: true });
  const firstWaiting = fixture.waiting[0]!, queuedDirect = fixture.direct[0]!;
  const waitingRow = registry.getByRole('button', { name: new RegExp(firstWaiting.name) });
  await expect(filter).toHaveValue('all');
  await expect(filter.locator('option')).toHaveText(['All hearths (30)', 'No production (24)', 'Without charters (10)', 'Charters waiting (5)']);
  const help = page.getByText('How these filters work', { exact: true });
  await expect(help.locator('..')).not.toHaveAttribute('open', '');
  await help.focus(); await page.keyboard.press('Enter');
  await expect(help.locator('..')).toHaveAttribute('open', '');
  await expect(help.locator('..')).toContainText('Counts overlap');
  await expect(help.locator('..')).toContainText('not guaranteed purchases');
  await expect(help.locator('..').locator('p')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(help.locator('..')).not.toHaveAttribute('open', '');
  // The last five stable-ID rows really lie beyond the first registry page.
  await filter.selectOption('empty'); await filter.selectOption('all');
  await expect(registry.getByRole('button')).toHaveCount(25);
  await expect(waitingRow).toHaveCount(0);
  await page.getByRole('button', { name: 'Next registry page', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Registry pages', exact: true })).toContainText('Page 2 of 2');
  await expect(registry.getByRole('button')).toHaveCount(5);
  await expect(waitingRow).toBeVisible();

  // Native keyboard changes the cohort, retaining selection outside its rows.
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('waiting');
  await expect(registry.getByRole('button')).toHaveCount(5);
  await expect(registry).toContainText(fixture.waitingReason);
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await expect(group).toContainText('5 hearths selected');
  await filter.selectOption('unchartered');
  await expect(registry.getByRole('button')).toHaveCount(10);
  await expect(group).toContainText('5 hearths selected · 5 outside this filter');
  await registry.getByRole('checkbox', { name: `Select ${queuedDirect.name} for group orders`, exact: true }).check();
  await filter.selectOption('waiting');
  await expect(group).toContainText('6 hearths selected · 1 outside this filter');
  await expect(registry.getByRole('checkbox', { checked: true })).toHaveCount(5);
  await waitingRow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('settlement-waiting-desktop.png') });

  await search.fill(firstWaiting.name);
  await expect(filter.locator('option')).toHaveText(['All hearths (1)', 'No production (1)', 'Without charters (0)', 'Charters waiting (1)']);
  await expect(registry.getByRole('button')).toHaveCount(1);
  await expect(group).toContainText('6 hearths selected · 5 outside this filter');
  await search.fill('No such authored hearth');
  await expect(filter.locator('option')).toHaveText(['All hearths (0)', 'No production (0)', 'Without charters (0)', 'Charters waiting (0)']);
  await expect(registry).toContainText('No matching entries. Clear your search or filter.');
  await search.fill('');
  await page.getByRole('combobox', { name: 'Registry order', exact: true }).selectOption('name');
  await expect(registry.getByRole('button')).toHaveCount(5);
  await expect(group).toContainText('6 hearths selected · 1 outside this filter');
  await filter.selectOption('empty');
  await expect(registry.getByRole('button')).toHaveCount(24);
  // Empty production includes a charter's current candidate. It is not a
  // promise that shared funds will purchase that work on the next turn.
  await expect(registry.getByRole('button', { name: new RegExp(fixture.ready[0]!.name) })).toContainText(fixture.candidate);
  await expect(registry.getByRole('button', { name: new RegExp(queuedDirect.name) })).toHaveCount(0);
  await filter.selectOption('all');
  await search.fill(fixture.queuedCharters[0]!.name);
  const queuedCharter = registry.getByRole('button', { name: new RegExp(fixture.queuedCharters[0]!.name) });
  await expect(queuedCharter).toContainText('Current queue comes first.');
  await search.fill('');
  await filter.selectOption('waiting'); await waitingRow.click();
  await expect(window).toHaveCount(0);
  await expect(page.getByTestId('current-selection')).toContainText(firstWaiting.name);
  await openSelectedOrders(page);
  const charter = page.getByTestId('settlement-charter');
  await charter.locator(':scope > summary').click();
  await expect(charter).toContainText(fixture.waitingReason);
  const browsed = await exportedTravel(page);
  expect(stateHash(browsed.game)).toBe(fixture.hash);
  expect(browsed.archive).toEqual(fixture.archive);
  expect(serializeGame(browsed.game)).toBe(serializeGame(fixture.game));

  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  window = await openRegistry(page, 'settlements');
  await expect(filter).toHaveValue('all');
  await filter.selectOption('unchartered');
  await registry.getByRole('checkbox', { name: `Select ${queuedDirect.name} for group orders`, exact: true }).check();
  await filter.selectOption('waiting');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await expect(group).toContainText('6 hearths selected · 1 outside this filter');
  await filter.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('settlement-waiting-narrow-130.png') });
  await filter.locator('..').screenshot({ path: testInfo.outputPath('settlement-order-selector-native.png') });
  await group.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('muster');
  await group.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true }).fill('24');
  const locked = filter.evaluate(element => new Promise<boolean>((resolve, reject) => {
    const select = element as HTMLSelectElement;
    const observer = new MutationObserver(() => {
      if (select.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); }
    });
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('The settlement filter never reflected the real pending charter lock.')); }, 3000);
    observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
  }));
  await group.getByRole('button', { name: 'Apply charters (6)', exact: true }).click();
  expect(await locked).toBe(true);
  await expect(page.getByTestId('group-charter-results')).toContainText('6 orders accepted · 0 refused');
  await expect(filter).toBeEnabled();
  await expect(filter.locator('option')).toHaveText(['All hearths (30)', 'No production (24)', 'Without charters (9)', 'Charters waiting (0)']);
  await expect(group).toContainText('0 hearths selected');
  await expect(registry).toContainText('No matching entries. Clear your search or filter.');
  await filter.selectOption('empty');
  await expect(waitingRow).toContainText(fixture.candidate);
  await waitingRow.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('settlement-charters-ready-narrow-130.png') });
  const changed = await exportedTravel(page);
  const expected = deserializeGame(serializeGame(fixture.game)), expectedJournal = resumeJournal(expected, fixture.archive);
  const submittedIds = [queuedDirect.id, ...fixture.waiting.map(town => town.id)].sort();
  const commands: GameCommand[] = submittedIds.map(settlementId => ({ type: 'setCharter', factionId: fixture.factionId, settlementId, focus: 'muster', ceiling: 24 }));
  for (const command of commands) expect(expectedJournal.record(expected, command).ok).toBe(true);
  expect(serializeGame(changed.game)).toBe(serializeGame(expected));
  expect(changed.archive).toEqual(expectedJournal.materialize());
  expect(changed.archive.records).toHaveLength(36);
  expect(changed.game.settlements).toEqual(fixture.game.settlements);
  expect(changed.game.factions).toEqual(fixture.game.factions);
  expect(changed.game.armies).toEqual(fixture.game.armies);
  expect(changed.game.routes).toEqual(fixture.game.routes);
  expect(changed.game.postings).toEqual(fixture.game.postings);
  expect(changed.game.patrols).toEqual(fixture.game.patrols);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  await openRegistry(page, 'settlements');
  await expect(filter).toHaveValue('all');
  await expect(filter.locator('option')).toHaveText(['All hearths (30)', 'No production (24)', 'Without charters (9)', 'Charters waiting (0)']);
  const restored = await exportedTravel(page);
  expect(serializeGame(restored.game)).toBe(serializeGame(changed.game));
  expect(restored.archive).toEqual(changed.archive);
  writeFileSync(testInfo.outputPath('settlement-order-browsed.theandril'), browsed.bytes);
  writeFileSync(testInfo.outputPath('settlement-order-changed.theandril'), changed.bytes);
  writeFileSync(testInfo.outputPath('settlement-order-restored.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('settlement-order-evidence.json'), JSON.stringify({
    authored: fixture.authored, baseHash: fixture.baseHash, initialHash: fixture.hash, finalHash: stateHash(restored.game),
    initialCounts: fixture.counts, finalCounts: { all: 30, empty: 24, unchartered: 9, waiting: 0 },
    initialRecords: fixture.archive.records.length, finalRecords: restored.archive.records.length,
    submittedIds, commands, waitingReason: fixture.waitingReason, candidate: fixture.candidate,
    queuesUnchanged: true, treasuryUnchanged: true, armiesAndRoutesUnchanged: true, exactReplay: true,
  }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
