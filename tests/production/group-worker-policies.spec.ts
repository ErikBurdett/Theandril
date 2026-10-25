import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
import { characterCampaign } from '../../packages/test-fixtures/src/character-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

async function recallRealm(page: Page) {
  await openRegistry(page, 'settlements');
  const groups = page.getByTestId('selection-groups');
  if (await groups.getAttribute('open') === null) await groups.locator(':scope > summary').click();
  await groups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Realm works' });
  const recall = groups.getByRole('button', { name: 'Recall group', exact: true });
  await recall.focus(); await page.keyboard.press('Enter');
  await expect(groups).toContainText('30 hearths selected');
  const policies = page.getByTestId('group-worker-policies');
  if (await policies.getAttribute('open') === null) { await policies.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  return policies;
}

test('production worker policies govern 30 hearths, preserve unaffected selections and survive keyboard removal and restoration at 130%', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const fixture = empireDelegationCampaign(), factionId = fixture.game.turnOwnerId;
  const towns = Object.values(fixture.game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  expect(towns).toHaveLength(30);
  const view = getObservation(fixture.game, factionId, { landDetails: 'none', developmentCandidates: false });
  expect(view.armies.filter(army => army.factionId === factionId)).toHaveLength(128); expect(view.wars).toHaveLength(2);
  expect(applyCommand(fixture.game, { type: 'setWorkerPolicy', factionId, settlementId: towns[0]!.id, focus: 'industry' }).ok).toBe(true);
  const archive = createJournal(fixture.game, { mode: 'player', coverage: 'from-save' }).materialize();
  const expected = deserializeGame(serializeGame(fixture.game)), journal = resumeJournal(expected, archive);
  const record = (command: GameCommand) => { expect(journal.record(expected, command).ok).toBe(true); };
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({ name: 'worker-stewardship.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, archive))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  let policies = await recallRealm(page);
  // Removing a common policy targets only its current holders; the other29
  // remain checked. No response or refusal is fabricated in this journey.
  await policies.getByRole('button', { name: 'Remove worker policies (1)', exact: true }).click();
  await expect(policies).toContainText('29 hearths selected');
  await expect(page.getByTestId('group-worker-policy-results')).toContainText('1 orders accepted · 0 refused');
  record({ type: 'setWorkerPolicy', factionId, settlementId: towns[0]!.id, focus: 'none' });

  policies = await recallRealm(page);
  await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill('Frontier');
  await expect(policies).toContainText('30 hearths selected · 27 outside this filter');
  await policies.getByRole('combobox', { name: 'Group worker priority', exact: true }).selectOption('food');
  const apply = policies.getByRole('button', { name: 'Apply worker policies (30)', exact: true });
  await apply.focus(); await page.keyboard.press('Enter');
  for (const town of towns) record({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
  await expect(policies).toContainText('0 hearths selected');
  let receipt = page.getByTestId('group-worker-policy-results');
  await expect(receipt).toContainText('30 orders accepted · 0 refused');
  await receipt.getByText('Review worker policy results', { exact: true }).click();
  await expect(receipt.getByRole('listitem')).toHaveCount(25);
  await receipt.getByRole('button', { name: 'Next worker-policy results page', exact: true }).click();
  await expect(receipt.getByRole('listitem')).toHaveCount(5);
  await expect(receipt.getByRole('listitem').last()).toContainText(towns[29]!.name);
  await receipt.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('group-worker-policies-desktop-130.png') });
  const granted = await exportedTravel(page);
  expect(serializeGame(granted.game)).toBe(serializeGame(expected));
  expect(granted.archive).toEqual(journal.materialize()); expect(granted.archive.records).toHaveLength(31);
  expect(granted.game.factions).toEqual(fixture.game.factions);
  expect(granted.game.settlements).toEqual(fixture.game.settlements);
  expect(granted.game.armies).toEqual(fixture.game.armies);
  expect(granted.game.charters).toEqual(fixture.game.charters);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');

  await page.setViewportSize({ width: 390, height: 844 });
  policies = await recallRealm(page);
  const remove = policies.getByRole('button', { name: 'Remove worker policies (30)', exact: true });
  await remove.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await remove.evaluate(element => {
    const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  })).toBe(true);
  await remove.focus(); await page.keyboard.press('Enter');
  for (const town of towns) record({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'none' });
  receipt = page.getByTestId('group-worker-policy-results');
  await expect(receipt).toContainText('30 orders accepted · 0 refused');
  await expect(policies).toContainText('0 hearths selected');
  await receipt.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('group-worker-policies-narrow-130.png') });
  const removed = await exportedTravel(page);
  expect(removed.game.workerPolicies).toEqual([]);
  expect(removed.game.land.settlements).toEqual(granted.game.land.settlements);
  expect(serializeGame(removed.game)).toBe(serializeGame(expected));
  expect(removed.archive).toEqual(journal.materialize()); expect(removed.archive.records).toHaveLength(61);
  expect(serializeGame(replayArchive(removed.archive))).toBe(serializeGame(expected));
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const restored = await exportedTravel(page);
  expect(restored.archive).toEqual(granted.archive); expect(serializeGame(restored.game)).toBe(serializeGame(granted.game));
  writeFileSync(testInfo.outputPath('group-worker-policies.theandril'), removed.bytes);
  writeFileSync(testInfo.outputPath('group-worker-policies-evidence.json'), JSON.stringify({ authored: fixture.authored, initialWorkerPolicy: 'One ordinary industry policy installed before from-save archive', beforeHash: stateHash(fixture.game), grantedHash: stateHash(granted.game), removedHash: stateHash(removed.game), records: removed.archive.records.length, towns: 30, armies: 128, wars: 2, retainedChecksAfterSelectiveRemoval: 29, viewport: '390x844 at 130%', implicitAutosave: false }, null, 2) + '\n');
  expect(errors).toEqual([]);
});

type WorkerPolicyFaultEvidence = { hash: string; results: { settlementId: string; accepted: boolean }[] };
for (const fault of ['missing-results', 'wrong-hearth', 'worker-crash'] as const) {
  test(`production worker policy ${fault} after real allocation preserves selection and requires restoration`, async ({ page }, testInfo) => {
    // Only the completed native worker reply is damaged. Canonical commands,
    // worker execution, save storage and the controls remain real.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker; let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { type?: string; hash: string; groupWorkerPolicyResults?: { settlementId: string; accepted: boolean }[] };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupWorkerPolicyResults)) {
              damaged = true;
              (window as unknown as { __WORKER_POLICY_FAULT__: WorkerPolicyFaultEvidence }).__WORKER_POLICY_FAULT__ = { hash: data.hash, results: structuredClone(data.groupWorkerPolicyResults) };
              if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker failure after actual worker allocation' })); return; }
              const altered = structuredClone(data);
              if (fault === 'missing-results') delete altered.groupWorkerPolicyResults;
              else altered.groupWorkerPolicyResults![0]!.settlementId = 'settlement.not-submitted';
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const game = characterCampaign(), factionId = game.turnOwnerId;
    const town = Object.values(game.settlements).find(town => town.factionId === factionId)!;
    const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
    const expected = deserializeGame(serializeGame(game));
    expect(applyCommand(expected, { type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'balanced' }).ok).toBe(true);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    await page.getByLabel('Import save file').setInputFiles({ name: 'worker-policy-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    const select = async () => {
      await openRegistry(page, 'settlements');
      await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill(town.name);
      await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
      const panel = page.getByTestId('group-worker-policies');
      if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
      return panel;
    };
    let panel = await select();
    await panel.getByRole('button', { name: 'Apply worker policies (1)', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
    await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
    await expect(panel).toContainText('1 hearth selected');
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByTestId('group-worker-policy-results')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Apply worker policies (1)', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => (window as unknown as { __WORKER_POLICY_FAULT__: WorkerPolicyFaultEvidence }).__WORKER_POLICY_FAULT__)).toEqual({ hash: stateHash(expected), results: [{ settlementId: town.id, accepted: true }] });
    await page.screenshot({ path: testInfo.outputPath(`worker-policy-${fault}-recovery.png`) });
    await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    const restored = await exportedTravel(page);
    expect(serializeGame(restored.game)).toBe(serializeGame(game)); expect(restored.archive).toEqual(archive);
    panel = await select();
    await panel.getByRole('button', { name: 'Apply worker policies (1)', exact: true }).click();
    await expect(page.getByTestId('group-worker-policy-results')).toContainText('1 orders accepted · 0 refused');
    const retried = await exportedTravel(page);
    expect(serializeGame(retried.game)).toBe(serializeGame(expected)); expect(retried.archive.records).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}
