import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function scene(limited = false) {
  const base = empireDelegationCampaign();
  let game = base.game;
  const factionId = game.turnOwnerId;
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort(byId);
  const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort(byId);
  expect(armies).toHaveLength(128); expect(towns).toHaveLength(30);
  if (limited) {
    // Disclosed capacity boundary: saved lost-army postings remain valid until
    // next-turn cleanup. This is the existing gameplay group-postings fixture
    // technique, expanded to 32 actual canonical refusals, not fabricated replies.
    game.postings = [
      ...armies.slice(0, 96).map(army => ({ armyId: army.id, factionId, cell: army.cell, mode: 'join' as const })),
      ...Array.from({ length: 8192 - 96 }, (_, index) => ({
        armyId: `army.expired.${String(index).padStart(4, '0')}`, factionId: base.enemyIds[0]!,
        cell: game.world.starts[1]!, mode: 'hold' as const,
      })),
    ].sort((a, b) => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0);
    game = deserializeGame(serializeGame(game));
  }
  const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  return { game, archive, factionId, armies, towns, authored: base.authored + (limited ? ' Posting-capacity boundary authors 96 own policies and 8096 expired foreign policies before the from-save archive; no turn advances.' : '') };
}
async function load(page: Page, fixture: ReturnType<typeof scene>) {
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({ name: 'group-policy-receipts.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
}
async function lastPage(page: Page, receipt: Locator, kind: 'posting' | 'charter') {
  const next = receipt.getByRole('button', { name: `Next ${kind} results page`, exact: true });
  while (await next.isEnabled()) {
    await next.focus(); await page.keyboard.press('Enter');
  }
}
async function assertNarrow(page: Page, receipt: Locator, control: Locator) {
  await page.setViewportSize({ width: 390, height: 844 });
  await control.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await control.evaluate(element => {
    const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  })).toBe(true);
  await expect(receipt.getByRole('listitem')).toHaveCount(7);
}
function expectedOrders(fixture: ReturnType<typeof scene>, commands: GameCommand[]) {
  const game = deserializeGame(serializeGame(fixture.game));
  const journal = resumeJournal(game, fixture.archive);
  const results = commands.map(command => journal.record(game, command));
  const archive = journal.materialize();
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  return { game, archive, results };
}
function sameWorld(actual: GameState, before: GameState) {
  expect(actual.armies).toEqual(before.armies);
  expect(actual.routes).toEqual(before.routes);
  expect(actual.patrols).toEqual(before.patrols);
  expect(actual.settlements).toEqual(before.settlements);
  expect(actual.factions).toEqual(before.factions);
}

test('production posting receipts expose all 128 actual results, preserve 32 refused selections and never retry while browsing', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const fixture = scene(true), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const commands: GameCommand[] = fixture.armies.map(army => ({ type: 'setPosting', factionId: fixture.factionId, armyId: army.id, cell: army.cell, mode: 'hold' }));
  const expected = expectedOrders(fixture, commands);
  expect(expected.results.filter(result => result.ok)).toHaveLength(96);
  expect(expected.results.filter(result => !result.ok)).toHaveLength(32);
  await load(page, fixture);
  const window = await openRegistry(page, 'armies');
  const group = page.getByTestId('group-postings');
  await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  await group.getByRole('button', { name: 'Post selected armies (128)', exact: true }).click();
  const receipt = page.getByTestId('group-posting-results');
  await expect(receipt).toContainText('96 orders accepted · 32 refused');
  await expect(receipt.locator('details')).toHaveAttribute('open', '');
  await expect(group).toContainText('32 armies selected');
  const filter = receipt.getByRole('combobox', { name: 'Posting result filter', exact: true });
  await expect(filter).toHaveValue('refused');
  await filter.locator('..').screenshot({ path: testInfo.outputPath('posting-receipt-filter-native.png') });
  await receipt.getByRole('list', { name: 'Posting order results', exact: true }).screenshot({ path: testInfo.outputPath('posting-receipt-rows-native.png') });
  await expect(receipt.getByRole('listitem')).toHaveCount(25);
  await expect(receipt.getByRole('listitem').first()).toContainText(fixture.armies[96]!.name);
  await lastPage(page, receipt, 'posting');
  await expect(receipt.getByRole('listitem')).toHaveCount(7);
  await expect(receipt.getByRole('listitem').last()).toContainText(fixture.armies[127]!.name);
  await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  await receipt.getByRole('navigation').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('posting-receipt-desktop-130.png') });

  await filter.selectOption('accepted');
  await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 4');
  await expect(receipt.getByRole('listitem').first()).toContainText(fixture.armies[0]!.name);
  await lastPage(page, receipt, 'posting');
  await expect(receipt.getByRole('listitem')).toHaveCount(21);
  await expect(receipt.getByRole('listitem').last()).toContainText(fixture.armies[95]!.name);
  await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  await filter.selectOption('all');
  await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 6');
  await lastPage(page, receipt, 'posting');
  await expect(receipt.getByRole('listitem')).toHaveCount(3);
  await expect(receipt.getByRole('listitem').last()).toContainText(fixture.armies[127]!.name);
  await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  // Native keyboard selects Refused and resets its page; no order callback exists.
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('refused');
  await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 2');
  await lastPage(page, receipt, 'posting');
  await assertNarrow(page, receipt, receipt.getByRole('button', { name: 'Previous posting results page', exact: true }));
  await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('posting-receipt-narrow-130.png') });
  await expect(group).toContainText('32 armies selected');
  const checked: string[] = [];
  const registry = page.getByTestId('army-registry');
  const previous = window.getByRole('button', { name: 'Previous registry page', exact: true });
  while (await previous.count() && await previous.isEnabled()) await previous.click();
  for (;;) {
    checked.push(...await registry.getByRole('checkbox', { checked: true }).evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')!)));
    const next = window.getByRole('button', { name: 'Next registry page', exact: true });
    if (!await next.count() || !await next.isEnabled()) break;
    await next.click();
  }
  expect(checked.sort()).toEqual(fixture.armies.slice(96).map(army => `Select ${army.name} for group orders`).sort());
  const exported = await exportedTravel(page);
  expect(serializeGame(exported.game)).toBe(serializeGame(expected.game));
  expect(exported.archive).toEqual(expected.archive);
  expect(exported.archive.records).toHaveLength(128);
  sameWorld(exported.game, fixture.game);
  expect(exported.game.charters).toEqual(fixture.game.charters);
  writeFileSync(testInfo.outputPath('posting-receipt.theandril'), exported.bytes);
  writeFileSync(testInfo.outputPath('posting-receipt-evidence.json'), JSON.stringify({ authored: fixture.authored, beforeHash: stateHash(fixture.game), afterHash: stateHash(exported.game), accepted: 96, refused: 32, records: exported.archive.records.length, selection: checked, receiptRows: 25, viewport: '390x844 at 130%' }, null, 2) + '\n');
  expect(errors).toEqual([]);
});

test('production charter receipts reveal the thirtieth success, handle an empty refusal filter and reset for the next submitted batch', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const fixture = scene(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const grant: GameCommand[] = fixture.towns.map(town => ({ type: 'setCharter', factionId: fixture.factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 }));
  const revoke: GameCommand[] = fixture.towns.map(town => ({ type: 'setCharter', factionId: fixture.factionId, settlementId: town.id, focus: 'none', ceiling: 24 }));
  const expected = expectedOrders(fixture, [...grant, ...revoke]);
  expect(expected.results.every(result => result.ok)).toBe(true);
  await load(page, fixture);
  await openRegistry(page, 'settlements');
  const group = page.getByTestId('group-charters');
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await group.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  await group.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  const receipt = page.getByTestId('group-charter-results');
  await expect(receipt).toContainText('30 orders accepted · 0 refused');
  await expect(receipt.locator('details')).not.toHaveAttribute('open', '');
  await expect(group).toContainText('0 hearths selected');
  const summary = receipt.locator('summary');
  await summary.focus(); await page.keyboard.press('Enter');
  const filter = receipt.getByRole('combobox', { name: 'Charter result filter', exact: true });
  await expect(filter).toHaveValue('all');
  await expect(receipt.getByRole('listitem')).toHaveCount(25);
  await lastPage(page, receipt, 'charter');
  await expect(receipt.getByRole('listitem')).toHaveCount(5);
  await expect(receipt.getByRole('listitem').last()).toContainText(fixture.towns[29]!.name);
  await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  await filter.selectOption('accepted');
  await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 2');
  await lastPage(page, receipt, 'charter');
  await receipt.getByRole('navigation').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('charter-receipt-desktop-130.png') });
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('refused');
  await expect(receipt).toContainText('No refused orders in this receipt.');
  await expect(receipt.getByRole('listitem')).toHaveCount(0);
  await expect(receipt.getByRole('button', { name: 'Previous charter results page', exact: true })).toBeDisabled();
  await expect(receipt.getByRole('button', { name: 'Next charter results page', exact: true })).toBeDisabled();
  await expect(group).toContainText('0 hearths selected');

  // A new real submission replaces the old filtered receipt and resets defaults.
  await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  await group.getByRole('button', { name: 'Revoke charters (30)', exact: true }).click();
  await expect(receipt).toContainText('30 orders accepted · 0 refused');
  await expect(receipt.locator('details')).not.toHaveAttribute('open', '');
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('all');
  await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 2');
  await page.setViewportSize({ width: 390, height: 844 });
  await lastPage(page, receipt, 'charter');
  await expect(receipt.getByRole('listitem')).toHaveCount(5);
  await expect(receipt.getByRole('listitem').last()).toContainText(fixture.towns[29]!.name);
  await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  const control = receipt.getByRole('button', { name: 'Previous charter results page', exact: true });
  await control.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await control.evaluate(element => {
    const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('charter-receipt-narrow-130.png') });
  const exported = await exportedTravel(page);
  expect(serializeGame(exported.game)).toBe(serializeGame(expected.game));
  expect(exported.archive).toEqual(expected.archive);
  expect(exported.archive.records).toHaveLength(60);
  expect(exported.game.charters.filter(charter => charter.factionId === fixture.factionId)).toEqual([]);
  sameWorld(exported.game, fixture.game);
  expect(exported.game.postings).toEqual(fixture.game.postings);
  writeFileSync(testInfo.outputPath('charter-receipt.theandril'), exported.bytes);
  writeFileSync(testInfo.outputPath('charter-receipt-evidence.json'), JSON.stringify({ authored: fixture.authored, beforeHash: stateHash(fixture.game), afterHash: stateHash(exported.game), grantAccepted: 30, revokeAccepted: 30, records: exported.archive.records.length, lastHearth: fixture.towns[29]!.id, receiptRows: 25, viewport: '390x844 at 130%' }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
