import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
import { createGame } from '@theandril/sim';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

const improvementId = 'improvement.terraced_fields';

async function recallRealm(page: Page) {
  await openRegistry(page, 'settlements');
  const groups = page.getByTestId('selection-groups');
  if (await groups.getAttribute('open') === null) await groups.locator(':scope > summary').click();
  await groups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Realm works' });
  const recall = groups.getByRole('button', { name: 'Recall group', exact: true });
  await recall.focus(); await page.keyboard.press('Enter');
  await expect(groups).toContainText('30 hearths selected');
  const policies = page.getByTestId('group-land-policies');
  if (await policies.getAttribute('open') === null) { await policies.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  return policies;
}

test('production land commissions share a finite purse across 30 hearths and preserve exact keyboard removal and restoration at 130%', async ({ page }, testInfo) => {
  mkdirSync(testInfo.outputDir, { recursive: true });
  const fixture = empireDelegationCampaign(), factionId = fixture.game.turnOwnerId;
  const towns = Object.values(fixture.game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  expect(towns).toHaveLength(30);
  const view = getObservation(fixture.game, factionId, { landDetails: 'none', developmentCandidates: false });
  expect(view.armies.filter(army => army.factionId === factionId)).toHaveLength(128); expect(view.wars).toHaveLength(2);
  // Explicit finite synthetic purse on the existing authored mature fixture.
  // Actual ordinary worker commands choose legal generated claims.
  fixture.game.factions.find(item => item.id === factionId)!.treasury = 100;
  for (const town of towns) expect(applyCommand(fixture.game, { type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' }).ok).toBe(true);
  expect(applyCommand(fixture.game, { type: 'setLandPolicy', factionId, settlementId: towns[0]!.id, improvementId, allowance: 0, reserve: 10 }).ok).toBe(true);
  const archive = createJournal(fixture.game, { mode: 'player', coverage: 'from-save' }).materialize();
  const expected = deserializeGame(serializeGame(fixture.game)), journal = resumeJournal(expected, archive);
  const record = (command: GameCommand) => { expect(journal.record(expected, command).ok).toBe(true); };
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  await page.getByLabel('Import save file').setInputFiles({ name: 'group-land-commissions.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, archive))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await campaignMenu(page);
  await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  let policies = await recallRealm(page);
  // Removing a common policy targets only its current holders; the other29
  // remain checked. No response or refusal is fabricated in this journey.
  await policies.getByRole('button', { name: 'End land commissions (1)', exact: true }).click();
  await expect(policies).toContainText('29 hearths selected');
  await expect(page.getByTestId('group-land-policy-results')).toContainText('1 orders accepted · 0 refused');
  record({ type: 'setLandPolicy', factionId, settlementId: towns[0]!.id, improvementId: 'none', allowance: 0, reserve: 0 });

  policies = await recallRealm(page);
  await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill('Frontier');
  await expect(policies).toContainText('30 hearths selected · 27 outside this filter');
  await policies.getByRole('combobox', { name: 'Group commission improvement', exact: true }).selectOption(improvementId);
  const amount = policies.getByRole('textbox', { name: 'Allowance per hearth · coin', exact: true });
  for (const invalid of ['', '-1', '3.2', '9007199254740992']) {
    await amount.fill(invalid);
    await expect(policies.getByRole('button', { name: 'Apply land commissions (30)', exact: true })).toBeDisabled();
  }
  await amount.fill('9007199254740991');
  await expect(policies).toContainText('270215977642229730');
  await amount.fill('100');
  await policies.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('10');
  await policies.locator('.group-land-total').screenshot({ path: testInfo.outputPath('group-land-budget-native.png') });
  const apply = policies.getByRole('button', { name: 'Apply land commissions (30)', exact: true });
  await apply.focus(); await page.keyboard.press('Enter');
  for (const town of towns) record({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 100, reserve: 10 });
  await expect(policies).toContainText('0 hearths selected');
  let receipt = page.getByTestId('group-land-policy-results');
  await expect(receipt).toContainText('30 orders accepted · 0 refused');
  await receipt.getByText('Review land commission results', { exact: true }).click();
  await expect(receipt.getByRole('listitem')).toHaveCount(25);
  await receipt.getByRole('button', { name: 'Next land-policy results page', exact: true }).click();
  await expect(receipt.getByRole('listitem')).toHaveCount(5);
  await expect(receipt.getByRole('listitem').last()).toContainText(towns[29]!.name);
  await receipt.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('group-land-policies-desktop-130.png') });
  const granted = await exportedTravel(page);
  expect(serializeGame(granted.game)).toBe(serializeGame(expected));
  expect(granted.archive).toEqual(journal.materialize()); expect(granted.archive.records).toHaveLength(31);
  expect(getObservation(granted.game, factionId, { landDetails: 'none' }).treasury).toBe(12);
  const works = towns.filter(town => granted.game.land.settlements[town.id]!.work);
  expect(works.map(town => town.id)).toEqual(['settlement.65', 'settlement.66', 'settlement.67', 'settlement.69']);
  expect(works.map(town => granted.game.land.settlements[town.id]!.work!.coinCost)).toEqual([22, 22, 22, 22]);
  expect(granted.game.landPolicies).toHaveLength(30);
  expect(granted.game.landPolicies.filter(policy => policy.allowance === 100)).toHaveLength(26);
  expect(granted.game.settlements).toEqual(fixture.game.settlements);
  expect(granted.game.armies).toEqual(fixture.game.armies);
  expect(granted.game.charters).toEqual(fixture.game.charters);
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');

  await page.setViewportSize({ width: 390, height: 844 });
  policies = await recallRealm(page);
  await policies.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('10');
  const amounts = policies.locator('.group-land-amounts');
  // Center the form in the nested window; nearest scrolling can leave the
  // last input at the clipped lower edge after a fill scrolls it into view.
  await amounts.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  writeFileSync(testInfo.outputPath('narrow-form-bounds.json'), JSON.stringify(await amounts.locator('input').evaluateAll(elements => elements.map(element => {
    const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
    return { label: element.closest('label')!.textContent, input: bounds.toJSON(), frame: frame.toJSON() };
  })), null, 2) + '\n');
  for (const input of await amounts.locator('input').all()) {
    expect(await input.evaluate(element => {
      const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
      return bounds.height >= 44 && bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
    })).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('group-land-form-narrow-130.png') });
  const remove = policies.getByRole('button', { name: 'End land commissions (30)', exact: true });
  await remove.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await remove.evaluate(element => {
    const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
    return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  })).toBe(true);
  await remove.focus(); await page.keyboard.press('Enter');
  for (const town of towns) record({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId: 'none', allowance: 0, reserve: 0 });
  receipt = page.getByTestId('group-land-policy-results');
  await expect(receipt).toContainText('30 orders accepted · 0 refused');
  await expect(policies).toContainText('0 hearths selected');
  await receipt.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('group-land-policies-narrow-130.png') });
  const removed = await exportedTravel(page);
  expect(removed.game.landPolicies).toEqual([]);
  expect(removed.game.land.settlements).toEqual(granted.game.land.settlements);
  expect(serializeGame(removed.game)).toBe(serializeGame(expected));
  expect(removed.archive).toEqual(journal.materialize()); expect(removed.archive.records).toHaveLength(61);
  expect(serializeGame(replayArchive(removed.archive))).toBe(serializeGame(expected));
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const restored = await exportedTravel(page);
  expect(restored.archive).toEqual(granted.archive); expect(serializeGame(restored.game)).toBe(serializeGame(granted.game));
  writeFileSync(testInfo.outputPath('group-land-policies.theandril'), removed.bytes);
  writeFileSync(testInfo.outputPath('group-land-policies-evidence.json'), JSON.stringify({ authored: fixture.authored, initialLandPolicy: 'One zero-allowance commission installed before from-save archive; 100 coin authored purse; all thirty worker policies assigned through ordinary commands', initialTreasury: 100, finalTreasury: 12, reserve: 10, allowancePerHearth: 100, immediateStarts: 4, waiting: 26, beforeHash: stateHash(fixture.game), grantedHash: stateHash(granted.game), removedHash: stateHash(removed.game), records: removed.archive.records.length, towns: 30, armies: 128, wars: 2, retainedChecksAfterSelectiveRemoval: 29, viewport: '390x844 at 130%', implicitAutosave: false }, null, 2) + '\n');
  expect(errors).toEqual([]);
});

type LandPolicyFaultEvidence = { hash: string; results: { settlementId: string; accepted: boolean }[] };
for (const fault of ['missing-results', 'wrong-hearth', 'worker-crash'] as const) {
  test(`production land commission ${fault} after real paid commission installation preserves selection and requires restoration`, async ({ page }, testInfo) => {
    // Only the completed native worker reply is damaged. Canonical commands,
    // worker execution, save storage and the controls remain real.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker; let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { type?: string; hash: string; groupLandPolicyResults?: { settlementId: string; accepted: boolean }[] };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupLandPolicyResults)) {
              damaged = true;
              (window as unknown as { __LAND_POLICY_FAULT__: LandPolicyFaultEvidence }).__LAND_POLICY_FAULT__ = { hash: data.hash, results: structuredClone(data.groupLandPolicyResults) };
              if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker failure after actual worker paid commission installation' })); return; }
              const altered = structuredClone(data);
              if (fault === 'missing-results') delete altered.groupLandPolicyResults;
              else altered.groupLandPolicyResults![0]!.settlementId = 'settlement.not-submitted';
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const game = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2, cityStateCount: 0 }), factionId = game.turnOwnerId;
    expect(applyCommand(game, { type: 'found', factionId, armyId: 'army.1', name: 'Commission recovery' }).ok).toBe(true);
    const founded = Object.values(game.settlements).find(town => town.factionId === factionId)!;
    expect(applyCommand(game, { type: 'setWorkerPolicy', factionId, settlementId: founded.id, focus: 'food' }).ok).toBe(true);
    const town = Object.values(game.settlements).find(town => town.factionId === factionId)!;
    const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
    const expected = deserializeGame(serializeGame(game));
    expect(applyCommand(expected, { type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 100, reserve: 0 }).ok).toBe(true);
    expect(expected.land.settlements[town.id]!.work).not.toBeNull();
    expect(getObservation(expected, factionId).treasury).toBeLessThan(getObservation(game, factionId).treasury);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    await page.getByLabel('Import save file').setInputFiles({ name: 'land-policy-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    const select = async () => {
      await openRegistry(page, 'settlements');
      await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill(town.name);
      await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
      const panel = page.getByTestId('group-land-policies');
      if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
      return panel;
    };
    let panel = await select();
    await panel.getByRole('combobox', { name: 'Group commission improvement', exact: true }).selectOption(improvementId);
    await panel.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('0');
    await panel.getByRole('button', { name: 'Apply land commissions (1)', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
    await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
    await expect(panel).toContainText('1 hearth selected');
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByTestId('group-land-policy-results')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Apply land commissions (1)', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    expect(await page.evaluate(() => (window as unknown as { __LAND_POLICY_FAULT__: LandPolicyFaultEvidence }).__LAND_POLICY_FAULT__)).toEqual({ hash: stateHash(expected), results: [{ settlementId: town.id, accepted: true }] });
    await page.screenshot({ path: testInfo.outputPath(`land-policy-${fault}-recovery.png`) });
    await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    const restored = await exportedTravel(page);
    expect(serializeGame(restored.game)).toBe(serializeGame(game)); expect(restored.archive).toEqual(archive);
    panel = await select();
    await panel.getByRole('combobox', { name: 'Group commission improvement', exact: true }).selectOption(improvementId);
    await panel.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('0');
    await panel.getByRole('button', { name: 'Apply land commissions (1)', exact: true }).click();
    await expect(page.getByTestId('group-land-policy-results')).toContainText('1 orders accepted · 0 refused');
    const retried = await exportedTravel(page);
    expect(serializeGame(retried.game)).toBe(serializeGame(expected)); expect(retried.archive.records).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}
