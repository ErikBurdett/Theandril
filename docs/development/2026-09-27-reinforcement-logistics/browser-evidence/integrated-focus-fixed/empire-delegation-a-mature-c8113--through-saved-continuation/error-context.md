# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:58:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('turn-counter')
Expected: "Turn 3"
Received: "Turn 2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByTestId('turn-counter') with timeout 5000ms
  - waiting for getByTestId('turn-counter')
    14 × locator resolved to <strong data-testid="turn-counter">Turn 2</strong>
       - unexpected value "Turn 2"

```

```yaml
- strong: Turn 2
```

# Test source

```ts
  1   | import { readFile, writeFile } from 'node:fs/promises';
  2   | import { expect, test, type Page } from '@playwright/test';
  3   | import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
  4   | import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
  5   | import { replayArchive } from '@theandril/chronicle';
  6   | import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
  7   | import { closeManagement, openCampaignJournal, openRealmAffairs, openRegistry, openSelectedOrders } from './ui-navigation';
  8   | 
  9   | async function disclose(page: Page, id: string, keyboard = false) {
  10  |   const panel = page.getByTestId(id);
  11  |   if (await panel.getAttribute('open') === null) {
  12  |     if (keyboard) { await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  13  |     else await panel.locator(':scope > summary').click();
  14  |   }
  15  |   return panel;
  16  | }
  17  | async function recall(page: Page, kind: 'armies' | 'settlements', name: string) {
  18  |   await openRegistry(page, kind);
  19  |   const groups = await disclose(page, 'selection-groups', true);
  20  |   await groups.getByRole('combobox', { name: kind === 'armies' ? 'Saved army group' : 'Saved hearth group', exact: true }).selectOption({ label: name });
  21  |   await groups.getByRole('button', { name: 'Recall group', exact: true }).focus();
  22  |   await page.keyboard.press('Enter');
  23  | }
  24  | async function menu(page: Page) {
  25  |   await closeManagement(page);
  26  |   return disclose(page, 'campaign-menu');
  27  | }
  28  | async function snapshot(page: Page) {
  29  |   return page.evaluate(() => {
  30  |     const view = window.__THEANDRIL__!.getSummary()!;
  31  |     return { hash: window.__THEANDRIL__!.getStateHash(), turn: view.turn, treasury: view.treasury, wars: view.wars,
  32  |       queues: view.ownSettlements.map(({ id, queue }) => ({ id, queue })), charters: view.charters, postings: view.postings,
  33  |       routes: view.routes, theaters: view.theaters, groups: view.selectionGroups,
  34  |       armies: view.ownArmies.map(({ id, cell }) => ({ id, cell })), battle: Boolean(view.battle), events: view.events.length,
  35  |       traffic: (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__.slice(),
  36  |     };
  37  |   });
  38  | }
  39  | async function exported(page: Page) {
  40  |   await menu(page);
  41  |   const download = page.waitForEvent('download');
  42  |   await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  43  |   const path = await (await download).path(); expect(path).toBeTruthy();
  44  |   const bytes = await readFile(path!), campaign = deserializeCampaign(await importSave(bytes));
  45  |   expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  46  |   return { bytes, ...campaign };
  47  | }
  48  | async function endTurn(page: Page) {
  49  |   const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  50  |   await closeManagement(page);
  51  |   const options = page.getByTestId('campaign-menu');
  52  |   if (await options.getAttribute('open') !== null) await options.locator(':scope > summary').click();
  53  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
> 54  |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
      |                                                  ^ Error: expect(locator).toHaveText(expected) failed
  55  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  56  | }
  57  | 
  58  | test('a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation', async ({ page }, testInfo) => {
  59  |   const fixture = empireDelegationCampaign();
  60  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  61  |   await page.addInitScript(() => {
  62  |     const traffic: string[] = [];
  63  |     (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__ = traffic;
  64  |     const NativeWorker = window.Worker;
  65  |     window.Worker = class extends NativeWorker {
  66  |       override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
  67  |         traffic.push((message as { type?: string }).type ?? 'unknown');
  68  |         if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
  69  |       }
  70  |     };
  71  |   });
  72  |   await page.goto('/');
  73  |   await page.getByLabel('Import save file').setInputFiles({ name: 'authored-mature-delegation.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.game))) });
  74  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  75  |   const initial = await snapshot(page);
  76  |   expect(initial.armies).toHaveLength(128); expect(initial.queues).toHaveLength(30); expect(initial.wars).toHaveLength(2); expect(initial.events).toBeGreaterThanOrEqual(32);
  77  |   await openRealmAffairs(page);
  78  |   await expect(page.locator('.war-state')).toHaveCount(2);
  79  |   await openCampaignJournal(page);
  80  |   await expect(page.getByTestId('chronicle').getByRole('listitem')).toHaveCount(16);
  81  |   await closeManagement(page);
  82  | 
  83  |   const causes = await disclose(page, 'next-action-causes', true);
  84  |   await causes.getByRole('button', { name: '1 company with an interrupted route', exact: true }).focus();
  85  |   await page.keyboard.press('Enter');
  86  |   await expect(page.getByTestId('current-selection')).toContainText('Northern relief interrupted');
  87  |   expect((await snapshot(page)).hash).toBe(initial.hash);
  88  |   await causes.getByRole('button', { name: /hearths with a stalled charter/ }).click();
  89  |   await openSelectedOrders(page);
  90  |   const stalled = await disclose(page, 'settlement-charter');
  91  |   await expect(stalled).toContainText('Nothing this charter builds costs 4 coin or less');
  92  | 
  93  |   await recall(page, 'settlements', 'Realm works');
  94  |   await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  95  |   const charters = page.getByTestId('group-charters');
  96  |   await charters.getByLabel('Charter focus').selectOption('works');
  97  |   await charters.getByLabel('Coin ceiling per hearth').fill('24');
  98  |   await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  99  |   await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  100 |   const policy = await snapshot(page);
  101 |   expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  102 |   expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  103 | 
  104 |   await recall(page, 'settlements', 'Frontier works');
  105 |   const production = await disclose(page, 'group-production');
  106 |   for (const item of fixture.sequence) {
  107 |     await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  108 |     await production.getByRole('button', { name: 'Add project', exact: true }).click();
  109 |   }
  110 |   const templates = await disclose(page, 'production-templates');
  111 |   await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  112 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  113 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  114 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  115 |   const beforeRecall = await snapshot(page);
  116 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  117 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  118 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  119 |   const results = page.getByTestId('group-production-results');
  120 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  121 |   await expect(charters).toContainText('2 hearths selected');
  122 |   await results.locator(':scope > details > summary').click();
  123 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  124 |   const paid = await snapshot(page);
  125 |   expect(paid.treasury).toBe(8);
  126 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  127 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  128 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  129 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  130 |   await results.scrollIntoViewIfNeeded();
  131 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  132 | 
  133 |   await recall(page, 'armies', 'Northern relief');
  134 |   const travel = await disclose(page, 'group-movement');
  135 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  136 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  137 |   const beforeReview = await snapshot(page);
  138 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  139 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  140 |   const reviewed = await snapshot(page);
  141 |   expect(reviewed.hash).toBe(beforeReview.hash);
  142 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  143 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  144 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  145 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  146 |   const rerouted = await snapshot(page);
  147 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  148 |   expect(rerouted.postings).toEqual(initial.postings);
  149 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  150 | 
  151 |   await recall(page, 'armies', 'Northern watch');
  152 |   const theater = await disclose(page, 'defense-theaters', true);
  153 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  154 |   await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
```