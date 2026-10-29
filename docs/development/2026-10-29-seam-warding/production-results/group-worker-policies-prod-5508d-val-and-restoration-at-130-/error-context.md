# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-worker-policies.spec.ts >> production worker policies govern 30 hearths, preserve unaffected selections and survive keyboard removal and restoration at 130%
- Location: tests/production/group-worker-policies.spec.ts:24:1

# Error details

```
Error: locator.scrollIntoViewIfNeeded: Target crashed 
Call log:
  - attempting scroll into view action
    - waiting for element to be stable

```

# Test source

```ts
  1   | import { mkdirSync, writeFileSync } from 'node:fs';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
  4   | import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
  5   | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6   | import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
  7   | import { characterCampaign } from '../../packages/test-fixtures/src/character-fixture';
  8   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  9   | import { openRegistry } from '../gameplay/ui-navigation';
  10  | 
  11  | async function recallRealm(page: Page) {
  12  |   await openRegistry(page, 'settlements');
  13  |   const groups = page.getByTestId('selection-groups');
  14  |   if (await groups.getAttribute('open') === null) await groups.locator(':scope > summary').click();
  15  |   await groups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Realm works' });
  16  |   const recall = groups.getByRole('button', { name: 'Recall group', exact: true });
  17  |   await recall.focus(); await page.keyboard.press('Enter');
  18  |   await expect(groups).toContainText('30 hearths selected');
  19  |   const policies = page.getByTestId('group-worker-policies');
  20  |   if (await policies.getAttribute('open') === null) { await policies.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  21  |   return policies;
  22  | }
  23  | 
  24  | test('production worker policies govern 30 hearths, preserve unaffected selections and survive keyboard removal and restoration at 130%', async ({ page }, testInfo) => {
  25  |   mkdirSync(testInfo.outputDir, { recursive: true });
  26  |   const fixture = empireDelegationCampaign(), factionId = fixture.game.turnOwnerId;
  27  |   const towns = Object.values(fixture.game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  28  |   expect(towns).toHaveLength(30);
  29  |   const view = getObservation(fixture.game, factionId, { landDetails: 'none', developmentCandidates: false });
  30  |   expect(view.armies.filter(army => army.factionId === factionId)).toHaveLength(128); expect(view.wars).toHaveLength(2);
  31  |   expect(applyCommand(fixture.game, { type: 'setWorkerPolicy', factionId, settlementId: towns[0]!.id, focus: 'industry' }).ok).toBe(true);
  32  |   const archive = createJournal(fixture.game, { mode: 'player', coverage: 'from-save' }).materialize();
  33  |   const expected = deserializeGame(serializeGame(fixture.game)), journal = resumeJournal(expected, archive);
  34  |   const record = (command: GameCommand) => { expect(journal.record(expected, command).ok).toBe(true); };
  35  |   const errors: string[] = [];
  36  |   page.on('pageerror', error => errors.push(error.message));
  37  |   await page.goto('./');
  38  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  39  |   await page.getByLabel('Import save file').setInputFiles({ name: 'worker-stewardship.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, archive))) });
  40  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  41  |   await campaignMenu(page);
  42  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  43  |   let policies = await recallRealm(page);
  44  |   // Removing a common policy targets only its current holders; the other29
  45  |   // remain checked. No response or refusal is fabricated in this journey.
  46  |   await policies.getByRole('button', { name: 'Remove worker policies (1)', exact: true }).click();
  47  |   await expect(policies).toContainText('29 hearths selected');
  48  |   await expect(page.getByTestId('group-worker-policy-results')).toContainText('1 orders accepted · 0 refused');
  49  |   record({ type: 'setWorkerPolicy', factionId, settlementId: towns[0]!.id, focus: 'none' });
  50  | 
  51  |   policies = await recallRealm(page);
  52  |   await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill('Frontier');
  53  |   await expect(policies).toContainText('30 hearths selected · 27 outside this filter');
  54  |   await policies.getByRole('combobox', { name: 'Group worker priority', exact: true }).selectOption('food');
  55  |   const apply = policies.getByRole('button', { name: 'Apply worker policies (30)', exact: true });
  56  |   await apply.focus(); await page.keyboard.press('Enter');
  57  |   for (const town of towns) record({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
  58  |   await expect(policies).toContainText('0 hearths selected');
  59  |   let receipt = page.getByTestId('group-worker-policy-results');
  60  |   await expect(receipt).toContainText('30 orders accepted · 0 refused');
  61  |   await receipt.getByText('Review worker policy results', { exact: true }).click();
  62  |   await expect(receipt.getByRole('listitem')).toHaveCount(25);
  63  |   await receipt.getByRole('button', { name: 'Next worker-policy results page', exact: true }).click();
  64  |   await expect(receipt.getByRole('listitem')).toHaveCount(5);
  65  |   await expect(receipt.getByRole('listitem').last()).toContainText(towns[29]!.name);
> 66  |   await receipt.scrollIntoViewIfNeeded();
      |                 ^ Error: locator.scrollIntoViewIfNeeded: Target crashed 
  67  |   await page.screenshot({ path: testInfo.outputPath('group-worker-policies-desktop-130.png') });
  68  |   const granted = await exportedTravel(page);
  69  |   expect(serializeGame(granted.game)).toBe(serializeGame(expected));
  70  |   expect(granted.archive).toEqual(journal.materialize()); expect(granted.archive.records).toHaveLength(31);
  71  |   expect(granted.game.factions).toEqual(fixture.game.factions);
  72  |   expect(granted.game.settlements).toEqual(fixture.game.settlements);
  73  |   expect(granted.game.armies).toEqual(fixture.game.armies);
  74  |   expect(granted.game.charters).toEqual(fixture.game.charters);
  75  |   await campaignMenu(page);
  76  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  77  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  78  | 
  79  |   await page.setViewportSize({ width: 390, height: 844 });
  80  |   policies = await recallRealm(page);
  81  |   const remove = policies.getByRole('button', { name: 'Remove worker policies (30)', exact: true });
  82  |   await remove.scrollIntoViewIfNeeded();
  83  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  84  |   expect(await remove.evaluate(element => {
  85  |     const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
  86  |     return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  87  |   })).toBe(true);
  88  |   await remove.focus(); await page.keyboard.press('Enter');
  89  |   for (const town of towns) record({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'none' });
  90  |   receipt = page.getByTestId('group-worker-policy-results');
  91  |   await expect(receipt).toContainText('30 orders accepted · 0 refused');
  92  |   await expect(policies).toContainText('0 hearths selected');
  93  |   await receipt.scrollIntoViewIfNeeded();
  94  |   await page.screenshot({ path: testInfo.outputPath('group-worker-policies-narrow-130.png') });
  95  |   const removed = await exportedTravel(page);
  96  |   expect(removed.game.workerPolicies).toEqual([]);
  97  |   expect(removed.game.land.settlements).toEqual(granted.game.land.settlements);
  98  |   expect(serializeGame(removed.game)).toBe(serializeGame(expected));
  99  |   expect(removed.archive).toEqual(journal.materialize()); expect(removed.archive.records).toHaveLength(61);
  100 |   expect(serializeGame(replayArchive(removed.archive))).toBe(serializeGame(expected));
  101 |   await campaignMenu(page);
  102 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  103 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  104 |   const restored = await exportedTravel(page);
  105 |   expect(restored.archive).toEqual(granted.archive); expect(serializeGame(restored.game)).toBe(serializeGame(granted.game));
  106 |   writeFileSync(testInfo.outputPath('group-worker-policies.theandril'), removed.bytes);
  107 |   writeFileSync(testInfo.outputPath('group-worker-policies-evidence.json'), JSON.stringify({ authored: fixture.authored, initialWorkerPolicy: 'One ordinary industry policy installed before from-save archive', beforeHash: stateHash(fixture.game), grantedHash: stateHash(granted.game), removedHash: stateHash(removed.game), records: removed.archive.records.length, towns: 30, armies: 128, wars: 2, retainedChecksAfterSelectiveRemoval: 29, viewport: '390x844 at 130%', implicitAutosave: false }, null, 2) + '\n');
  108 |   expect(errors).toEqual([]);
  109 | });
  110 | 
  111 | type WorkerPolicyFaultEvidence = { hash: string; results: { settlementId: string; accepted: boolean }[] };
  112 | for (const fault of ['missing-results', 'wrong-hearth', 'worker-crash'] as const) {
  113 |   test(`production worker policy ${fault} after real allocation preserves selection and requires restoration`, async ({ page }, testInfo) => {
  114 |     // Only the completed native worker reply is damaged. Canonical commands,
  115 |     // worker execution, save storage and the controls remain real.
  116 |     await page.addInitScript(({ fault }) => {
  117 |       const NativeWorker = window.Worker; let damaged = false;
  118 |       window.Worker = class extends NativeWorker {
  119 |         private receiver: Worker['onmessage'] = null;
  120 |         constructor(url: string | URL, options?: WorkerOptions) {
  121 |           super(url, options);
  122 |           this.addEventListener('message', event => {
  123 |             const data = event.data as { type?: string; hash: string; groupWorkerPolicyResults?: { settlementId: string; accepted: boolean }[] };
  124 |             if (!damaged && data.type === 'state' && Array.isArray(data.groupWorkerPolicyResults)) {
  125 |               damaged = true;
  126 |               (window as unknown as { __WORKER_POLICY_FAULT__: WorkerPolicyFaultEvidence }).__WORKER_POLICY_FAULT__ = { hash: data.hash, results: structuredClone(data.groupWorkerPolicyResults) };
  127 |               if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker failure after actual worker allocation' })); return; }
  128 |               const altered = structuredClone(data);
  129 |               if (fault === 'missing-results') delete altered.groupWorkerPolicyResults;
  130 |               else altered.groupWorkerPolicyResults![0]!.settlementId = 'settlement.not-submitted';
  131 |               this.receiver?.call(this, new MessageEvent('message', { data: altered }));
  132 |             } else this.receiver?.call(this, event);
  133 |           });
  134 |         }
  135 |         override get onmessage(): Worker['onmessage'] { return this.receiver; }
  136 |         override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
  137 |       };
  138 |     }, { fault });
  139 |     const game = characterCampaign(), factionId = game.turnOwnerId;
  140 |     const town = Object.values(game.settlements).find(town => town.factionId === factionId)!;
  141 |     const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  142 |     const expected = deserializeGame(serializeGame(game));
  143 |     expect(applyCommand(expected, { type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'balanced' }).ok).toBe(true);
  144 |     const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  145 |     await page.goto('./');
  146 |     await page.getByLabel('Import save file').setInputFiles({ name: 'worker-policy-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
  147 |     await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  148 |     await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  149 |     await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  150 |     const select = async () => {
  151 |       await openRegistry(page, 'settlements');
  152 |       await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill(town.name);
  153 |       await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  154 |       const panel = page.getByTestId('group-worker-policies');
  155 |       if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  156 |       return panel;
  157 |     };
  158 |     let panel = await select();
  159 |     await panel.getByRole('button', { name: 'Apply worker policies (1)', exact: true }).click();
  160 |     await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
  161 |     await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
  162 |     await expect(panel).toContainText('1 hearth selected');
  163 |     await expect(panel).toHaveAttribute('aria-busy', 'false');
  164 |     await expect(page.getByTestId('group-worker-policy-results')).toHaveCount(0);
  165 |     await expect(panel.getByRole('button', { name: 'Apply worker policies (1)', exact: true })).toBeDisabled();
  166 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
```