import { writeFileSync } from 'node:fs';
import { expect, test, type Locator } from '@playwright/test';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { groupPatrolScene } from '../gameplay/group-patrol-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

test('production group patrols pause, resume and remove selected policies across filters without changing issued travel', async ({ page }, testInfo) => {
  const fixture = groupPatrolScene();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({
    name: 'authored-101-group-patrols.theandril', mimeType: 'application/gzip',
    buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))),
  });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');

  const filter = page.getByRole('combobox', { name: 'Army orders', exact: true });
  const registry = page.getByTestId('army-registry');
  const selection = page.getByTestId('group-postings');
  const patrols = page.getByTestId('group-patrols');
  const results = page.getByTestId('group-patrol-results');
  const expectedGame = deserializeGame(serializeGame(fixture.game));
  const expectedJournal = resumeJournal(expectedGame, fixture.archive);
  const phases: { action: string; hash: string; records: number; accepted: number; skipped: number }[] = [];

  const selectAll = async () => {
    await openRegistry(page, 'armies');
    await expect(filter).toHaveValue('all');
    await selection.getByRole('button', { name: 'Select matching armies', exact: true }).click();
    await expect(selection).toContainText('101 armies selected');
    await patrols.locator(':scope > summary').click();
  };
  const verifyResults = async (accepted: number, skipped: number) => {
    await expect(results).toContainText(`${accepted} patrol orders accepted · 0 refused.`);
    await expect(results).toContainText(`${skipped} unaffected selected armies remain checked.`);
    await expect(patrols).toContainText(`${skipped} armies selected`);
    await results.locator('summary').click();
    await expect(results.getByRole('listitem')).toHaveCount(Math.min(accepted, 25));
    const pages = Math.ceil(accepted / 25);
    for (let index = 1; index < pages; index++) {
      await results.getByRole('button', { name: 'Next patrol results page', exact: true }).click();
    }
    await expect(results.getByRole('navigation', { name: 'Patrol results', exact: true })).toContainText(`Page ${pages} of ${pages}`);
    await expect(results.getByRole('listitem')).toHaveCount(accepted - 25 * (pages - 1));
  };
  const recordExpected = (commands: GameCommand[]) => {
    for (const command of commands) expect(expectedJournal.record(expectedGame, command).ok).toBe(true);
  };
  const verifyExport = async (action: string, accepted: number, skipped: number) => {
    const exported = await exportedTravel(page);
    expect(exported.game.armies).toEqual(fixture.game.armies);
    expect(exported.game.routes).toEqual(fixture.game.routes);
    expect(exported.game.postings).toEqual(fixture.game.postings);
    expect(serializeGame(exported.game)).toBe(serializeGame(expectedGame));
    expect(exported.archive).toEqual(expectedJournal.materialize());
    expect(serializeGame(replayArchive(exported.archive))).toBe(serializeGame(exported.game));
    phases.push({ action, hash: stateHash(exported.game), records: exported.archive.records.length, accepted, skipped });
    writeFileSync(testInfo.outputPath(`group-patrol-${action}.theandril`), exported.bytes);
    return exported;
  };
  // Observe an actual pending DOM lock without intercepting/delaying the worker.
  const pendingLock = (element: Locator) => element.evaluate(node => new Promise<boolean>((resolve, reject) => {
    const select = node as HTMLSelectElement;
    const observer = new MutationObserver(() => {
      if (select.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); }
    });
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('The real patrol batch never locked the registry filter.')); }, 3000);
    observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
  }));

  await selectAll();
  await expect(filter.locator('option')).toHaveText(['All forces (101)', 'Postings and patrols (101)', 'Orders waiting (2)', 'Paused patrols (50)']);
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('paused-patrols');
  await expect(registry.getByRole('button')).toHaveCount(25);
  await expect(patrols).toContainText('101 armies selected · 51 outside this filter. 99 have patrols.');
  await expect(patrols).toContainText('Existing travel continues unchanged.');
  const pause = patrols.getByRole('button', { name: 'Pause enabled patrols (49)', exact: true });
  await pause.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('group-patrol-pause-desktop.png') });
  const locked = pendingLock(filter);
  await pause.click();
  expect(await locked).toBe(true);
  await verifyResults(49, 52);
  await expect(filter).toBeEnabled();
  await expect(patrols).toContainText('52 armies selected · 2 outside this filter. 50 have patrols.');
  recordExpected(fixture.enabledIds.map(armyId => ({ type: 'setPatrolEnabled', factionId: fixture.factionId, armyId, enabled: false })));
  await verifyExport('paused', 49, 52);

  await selectAll();
  await filter.selectOption('waiting');
  await expect(patrols).toContainText('101 armies selected · 99 outside this filter. 99 have patrols.');
  await expect(patrols).toContainText('1 paused patrol has Pause when war begins enabled.');
  await patrols.getByRole('button', { name: 'Resume paused patrols (99)', exact: true }).click();
  await verifyResults(99, 2);
  await expect(patrols).toContainText('2 armies selected · 1 outside this filter. 0 have patrols.');
  recordExpected(fixture.policyIds.map(armyId => ({ type: 'setPatrolEnabled', factionId: fixture.factionId, armyId, enabled: true })));
  const resumed = await verifyExport('resumed', 99, 2);
  expect(resumed.game.patrols.find(policy => policy.armyId === fixture.warPause.id)?.pauseOnWar).toBe(true);
  expect(resumed.game.routes[fixture.waiting.id]?.status).toBe('paused');
  expect(resumed.game.routes[fixture.travelling.id]?.status).toBe('active');

  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  await page.setViewportSize({ width: 390, height: 844 });
  await selectAll();
  await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await expect(filter).toHaveValue('paused-patrols');
  await expect(registry.getByRole('button')).toHaveCount(0);
  await expect(patrols).toContainText('101 armies selected · 101 outside this filter. 99 have patrols.');
  await expect(patrols.getByRole('button', { name: 'Resume paused patrols (0)', exact: true })).toBeDisabled();
  const remove = patrols.getByRole('button', { name: 'Remove selected patrols (99)', exact: true });
  await remove.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('group-patrol-remove-narrow-130.png') });
  await patrols.locator(':scope > .group-selection-actions').screenshot({ path: testInfo.outputPath('group-patrol-actions-native.png') });
  await remove.focus(); await page.keyboard.press('Enter');
  await verifyResults(99, 2);
  await expect(patrols).toContainText('2 armies selected · 2 outside this filter. 0 have patrols.');
  await filter.focus(); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
  for (const actor of fixture.noPolicy) {
    await expect(registry.getByRole('checkbox', { name: `Select ${actor.name} for group orders`, exact: true })).toBeChecked();
  }
  recordExpected(fixture.policyIds.map(armyId => ({ type: 'clearPatrol', factionId: fixture.factionId, armyId })));
  const removed = await verifyExport('removed', 99, 2);
  expect(removed.game.patrols).toHaveLength(0);
  expect(removed.archive.records).toHaveLength(352);

  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  const restored = await exportedTravel(page);
  expect(serializeGame(restored.game)).toBe(serializeGame(removed.game));
  expect(restored.archive).toEqual(removed.archive);
  writeFileSync(testInfo.outputPath('group-patrol-restored.theandril'), restored.bytes);
  writeFileSync(testInfo.outputPath('group-patrol-evidence.json'), JSON.stringify({
    authored: 'Open-terrain theaterCampaign(101), two hearths, treasury, named companies and foreign obstruction guard; 105 ordinary setup records.',
    initialHash: fixture.hash, counts: fixture.counts, phases, finalHash: stateHash(restored.game),
    unchangedRoutes: fixture.game.routes, unchangedArmies: true, unchangedPostings: true,
    warPausePreservedUntilRemoval: true, exactReplayEveryPhase: true, exactReload: true,
    finalRecords: restored.archive.records.length, realPendingFilterLock: true,
  }, null, 2) + '\n');
  expect(errors).toEqual([]);
});
