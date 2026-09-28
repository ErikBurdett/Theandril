# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:60:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Imported campaign"
Received string:    "◆Resolving… A world of broken oaths awaits a new beginning."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    13 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
       - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."

```

```yaml
- status: Resolving… A world of broken oaths awaits a new beginning.
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
  9   | interface DelegationCost { request: string; reply: string; elapsedMs: number; metrics?: Record<string, number> }
  10  | async function disclose(page: Page, id: string, keyboard = false) {
  11  |   const panel = page.getByTestId(id);
  12  |   if (await panel.getAttribute('open') === null) {
  13  |     if (keyboard) { await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  14  |     else await panel.locator(':scope > summary').click();
  15  |   }
  16  |   return panel;
  17  | }
  18  | async function recall(page: Page, kind: 'armies' | 'settlements', name: string) {
  19  |   await openRegistry(page, kind);
  20  |   const groups = await disclose(page, 'selection-groups', true);
  21  |   await groups.getByRole('combobox', { name: kind === 'armies' ? 'Saved army group' : 'Saved hearth group', exact: true }).selectOption({ label: name });
  22  |   await groups.getByRole('button', { name: 'Recall group', exact: true }).focus();
  23  |   await page.keyboard.press('Enter');
  24  | }
  25  | async function menu(page: Page) {
  26  |   await closeManagement(page);
  27  |   return disclose(page, 'campaign-menu');
  28  | }
  29  | async function snapshot(page: Page) {
  30  |   return page.evaluate(() => {
  31  |     const view = window.__THEANDRIL__!.getSummary()!;
  32  |     return { hash: window.__THEANDRIL__!.getStateHash(), turn: view.turn, treasury: view.treasury, wars: view.wars,
  33  |       queues: view.ownSettlements.map(({ id, queue }) => ({ id, queue })), charters: view.charters, postings: view.postings,
  34  |       routes: view.routes, theaters: view.theaters, groups: view.selectionGroups,
  35  |       armies: view.ownArmies.map(({ id, cell }) => ({ id, cell })), battle: Boolean(view.battle), events: view.events.length,
  36  |       traffic: (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__.slice(),
  37  |       costs: (window as unknown as { __DELEGATION_COSTS__: DelegationCost[] }).__DELEGATION_COSTS__.slice(),
  38  |     };
  39  |   });
  40  | }
  41  | async function exported(page: Page) {
  42  |   await menu(page);
  43  |   const download = page.waitForEvent('download');
  44  |   await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  45  |   const path = await (await download).path(); expect(path).toBeTruthy();
  46  |   const bytes = await readFile(path!), campaign = deserializeCampaign(await importSave(bytes));
  47  |   expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  48  |   return { bytes, ...campaign };
  49  | }
  50  | async function endTurn(page: Page) {
  51  |   const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  52  |   await closeManagement(page);
  53  |   const options = page.getByTestId('campaign-menu');
  54  |   if (await options.getAttribute('open') !== null) await options.locator(':scope > summary').click();
  55  |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  56  |   await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
  57  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  58  | }
  59  | 
  60  | test('a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation', async ({ page }, testInfo) => {
  61  |   const started = performance.now(), stages: { name: string; elapsedMs: number }[] = [];
  62  |   let stageStarted = started;
  63  |   const stage = (name: string) => { const now = performance.now(); stages.push({ name, elapsedMs: now - stageStarted }); stageStarted = now; };
  64  |   const fixture = empireDelegationCampaign();
  65  |   stage('authored fixture construction and strict validation');
  66  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  67  |   await page.addInitScript(() => {
  68  |     const traffic: string[] = [];
  69  |     const costs: DelegationCost[] = [];
  70  |     (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__ = traffic;
  71  |     (window as unknown as { __DELEGATION_COSTS__: DelegationCost[] }).__DELEGATION_COSTS__ = costs;
  72  |     const NativeWorker = window.Worker;
  73  |     window.Worker = class extends NativeWorker {
  74  |       private pending = new Map<number, { type: string; started: number }>();
  75  |       constructor(url: string | URL, options?: WorkerOptions) {
  76  |         super(url, options);
  77  |         this.addEventListener('message', (event: MessageEvent<unknown>) => {
  78  |           const reply = event.data as { id?: number; type?: string; metrics?: Record<string, number> };
  79  |           if (reply.id === undefined || reply.type === 'progress') return;
  80  |           const request = this.pending.get(reply.id);
  81  |           if (!request) return;
  82  |           costs.push({ request: request.type, reply: reply.type ?? 'unknown', elapsedMs: performance.now() - request.started,
  83  |             ...(reply.metrics ? { metrics: { ...reply.metrics } } : {}) });
  84  |           this.pending.delete(reply.id);
  85  |         });
  86  |       }
  87  |       override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
  88  |         const request = message as { id?: number; type?: string };
  89  |         traffic.push(request.type ?? 'unknown');
  90  |         if (request.id !== undefined) this.pending.set(request.id, { type: request.type ?? 'unknown', started: performance.now() });
  91  |         if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
  92  |       }
  93  |     };
  94  |   });
  95  |   await page.goto('/');
  96  |   await page.getByLabel('Import save file').setInputFiles({ name: 'authored-mature-delegation.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.game))) });
> 97  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  98  |   stage('browser navigation, portable import and rendered state');
  99  |   const initial = await snapshot(page);
  100 |   expect(initial.armies).toHaveLength(128); expect(initial.queues).toHaveLength(30); expect(initial.wars).toHaveLength(2); expect(initial.events).toBeGreaterThanOrEqual(32);
  101 |   await openRealmAffairs(page);
  102 |   await expect(page.locator('.war-state')).toHaveCount(2);
  103 |   await openCampaignJournal(page);
  104 |   await expect(page.getByTestId('chronicle').getByRole('listitem')).toHaveCount(16);
  105 |   await closeManagement(page);
  106 | 
  107 |   const causes = await disclose(page, 'next-action-causes', true);
  108 |   await causes.getByRole('button', { name: '1 company with an interrupted route', exact: true }).focus();
  109 |   await page.keyboard.press('Enter');
  110 |   await expect(page.getByTestId('current-selection')).toContainText('Northern relief interrupted');
  111 |   expect((await snapshot(page)).hash).toBe(initial.hash);
  112 |   await causes.getByRole('button', { name: /hearths with a stalled charter/ }).click();
  113 |   await openSelectedOrders(page);
  114 |   const stalled = await disclose(page, 'settlement-charter');
  115 |   await expect(stalled).toContainText('Nothing this charter builds costs 4 coin or less');
  116 |   stage('wars, event journal and grouped exception navigation');
  117 | 
  118 |   await recall(page, 'settlements', 'Realm works');
  119 |   await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  120 |   const charters = page.getByTestId('group-charters');
  121 |   await charters.getByLabel('Charter focus').selectOption('works');
  122 |   await charters.getByLabel('Coin ceiling per hearth').fill('24');
  123 |   await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  124 |   await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  125 |   const policy = await snapshot(page);
  126 |   expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  127 |   expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  128 |   stage('30-hearth registry recall and policy application');
  129 | 
  130 |   await recall(page, 'settlements', 'Frontier works');
  131 |   const production = await disclose(page, 'group-production');
  132 |   for (const item of fixture.sequence) {
  133 |     await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  134 |     await production.getByRole('button', { name: 'Add project', exact: true }).click();
  135 |   }
  136 |   const templates = await disclose(page, 'production-templates');
  137 |   await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  138 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  139 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  140 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  141 |   const beforeRecall = await snapshot(page);
  142 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  143 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  144 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  145 |   const results = page.getByTestId('group-production-results');
  146 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  147 |   await expect(charters).toContainText('2 hearths selected');
  148 |   await results.locator(':scope > details > summary').click();
  149 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  150 |   const paid = await snapshot(page);
  151 |   expect(paid.treasury).toBe(8);
  152 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  153 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  154 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  155 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  156 |   await results.scrollIntoViewIfNeeded();
  157 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  158 |   stage('production template and partial shared-budget batch');
  159 | 
  160 |   await recall(page, 'armies', 'Northern relief');
  161 |   const travel = await disclose(page, 'group-movement');
  162 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  163 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  164 |   const beforeReview = await snapshot(page);
  165 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  166 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  167 |   const reviewed = await snapshot(page);
  168 |   expect(reviewed.hash).toBe(beforeReview.hash);
  169 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  170 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  171 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  172 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  173 |   const rerouted = await snapshot(page);
  174 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  175 |   expect(rerouted.postings).toEqual(initial.postings);
  176 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  177 |   stage('explicit group route review and partial application');
  178 | 
  179 |   await recall(page, 'armies', 'Northern watch');
  180 |   const theater = await disclose(page, 'defense-theaters', true);
  181 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  182 |   await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
  183 |   await theater.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('1');
  184 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  185 |   await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  186 |   for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  187 |   await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  188 |   await page.setViewportSize({ width: 390, height: 844 });
  189 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).scrollIntoViewIfNeeded();
  190 |   await page.screenshot({ path: testInfo.outputPath('joined-reinforcement-controls-narrow.png') });
  191 |   const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  192 |   await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  193 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  194 |   await create.focus(); await page.keyboard.press('Enter');
  195 |   await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  196 |   const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  197 |   await closeManagement(page);
```