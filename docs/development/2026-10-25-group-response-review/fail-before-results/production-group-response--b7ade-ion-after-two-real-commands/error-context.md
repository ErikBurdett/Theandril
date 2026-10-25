# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/group-response-recovery.spec.ts >> production group charter wrong-actor reply requires restoration after two real commands
- Location: tests/production/group-response-recovery.spec.ts:45:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected pattern: /restore a saved campaign/i
Received string:  "◆2 charters accepted; 0 refused."
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    14 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
       - unexpected value "◆2 charters accepted; 0 refused."

```

```yaml
- status: 2 charters accepted; 0 refused.
```

# Test source

```ts
  8   | import { openRegistry } from '../gameplay/ui-navigation';
  9   | 
  10  | type Kind = 'posting' | 'charter';
  11  | type Fault = 'missing-row' | 'duplicate' | 'wrong-actor';
  12  | type CapturedReply = { hash: string; results: Record<string, unknown>[]; damagedResults: Record<string, unknown>[] };
  13  | 
  14  | function fixtureFor(kind: Kind) {
  15  |   // Authored scale-independent infrastructure. The helper founds both hearths
  16  |   // canonically before this from-save archive; no earned-campaign claim.
  17  |   const game = theaterCampaign(2), factionId = game.turnOwnerId;
  18  |   const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  19  |   const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id.localeCompare(b.id));
  20  |   const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id.localeCompare(b.id));
  21  |   expect(armies).toHaveLength(2); expect(towns).toHaveLength(2);
  22  |   const commands: GameCommand[] = kind === 'posting'
  23  |     ? armies.map(army => ({ type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'hold' }))
  24  |     : towns.map(town => ({ type: 'setCharter', factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 }));
  25  |   const expected = deserializeGame(serializeGame(game));
  26  |   const journal = resumeJournal(expected, archive);
  27  |   commands.forEach(command => expect(journal.record(expected, command).ok).toBe(true));
  28  |   return { game, archive, commands, expected, expectedArchive: journal.materialize(),
  29  |     ids: kind === 'posting' ? armies.map(army => army.id) : towns.map(town => town.id) };
  30  | }
  31  | 
  32  | async function selectActors(page: Page, kind: Kind) {
  33  |   await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
  34  |   const panel = page.getByTestId(kind === 'posting' ? 'group-postings' : 'group-charters');
  35  |   await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
  36  |   if (kind === 'charter') {
  37  |     await panel.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  38  |     await panel.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
  39  |   }
  40  |   return { panel, submit: panel.getByRole('button', { name: kind === 'posting' ? 'Post selected armies (2)' : 'Apply charters (2)', exact: true }) };
  41  | }
  42  | 
  43  | for (const kind of ['posting', 'charter'] as const) {
  44  |   for (const fault of ['missing-row', 'duplicate', 'wrong-actor'] as const) {
  45  |     test(`production group ${kind} ${fault} reply requires restoration after two real commands`, async ({ page }, testInfo) => {
  46  |       mkdirSync(testInfo.outputDir, { recursive: true });
  47  |       const fixture = fixtureFor(kind);
  48  |       const field = kind === 'posting' ? 'groupPostingResults' : 'groupCharterResults';
  49  |       const actorKey = kind === 'posting' ? 'armyId' : 'settlementId';
  50  |       await page.addInitScript(({ field, actorKey, fault }) => {
  51  |         const NativeWorker = window.Worker;
  52  |         let damaged = false;
  53  |         window.Worker = class extends NativeWorker {
  54  |           private receiver: Worker['onmessage'] = null;
  55  |           constructor(url: string | URL, options?: WorkerOptions) {
  56  |             super(url, options);
  57  |             this.addEventListener('message', event => {
  58  |               const response = event.data as Record<string, unknown>;
  59  |               if (!damaged && response.type === 'state' && Array.isArray(response[field])) {
  60  |                 damaged = true;
  61  |                 const altered = structuredClone(response);
  62  |                 const original = structuredClone(response[field]) as Record<string, unknown>[];
  63  |                 if (fault === 'missing-row') altered[field] = original.slice(0, 1);
  64  |                 else if (fault === 'duplicate') altered[field] = [original[0], original[0]];
  65  |                 else altered[field] = [original[0], { ...original[1], [actorKey]: 'not-submitted' }];
  66  |                 (window as unknown as { __GROUP_REPLY_FAULT__: CapturedReply }).__GROUP_REPLY_FAULT__ = {
  67  |                   hash: String(response.hash), results: original, damagedResults: structuredClone(altered[field]) as Record<string, unknown>[],
  68  |                 };
  69  |                 this.receiver?.call(this, new MessageEvent('message', { data: altered }));
  70  |               } else this.receiver?.call(this, event);
  71  |             });
  72  |           }
  73  |           override get onmessage(): Worker['onmessage'] { return this.receiver; }
  74  |           override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
  75  |         };
  76  |       }, { field, actorKey, fault });
  77  |       const errors: string[] = [];
  78  |       page.on('pageerror', error => errors.push(error.message));
  79  |       await page.goto('./');
  80  |       expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  81  |       await page.getByLabel('Import save file').setInputFiles({
  82  |         name: 'group-reply-two-actors.theandril', mimeType: 'application/gzip',
  83  |         buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))),
  84  |       });
  85  |       await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  86  |       await campaignMenu(page);
  87  |       await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  88  |       await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  89  |       let { panel, submit } = await selectActors(page, kind);
  90  |       await submit.click();
  91  |       await page.waitForFunction(() => '__GROUP_REPLY_FAULT__' in window);
  92  |       await expect(panel).toHaveAttribute('aria-busy', 'false');
  93  |       const originalReply = await page.evaluate(() => (window as unknown as { __GROUP_REPLY_FAULT__: CapturedReply }).__GROUP_REPLY_FAULT__);
  94  |       expect(originalReply.hash).toBe(stateHash(fixture.expected));
  95  |       expect(originalReply.results).toEqual(fixture.ids.map(id => ({ [actorKey]: id, accepted: true })));
  96  |       const results = page.getByTestId(kind === 'posting' ? 'group-posting-results' : 'group-charter-results');
  97  |       // Written before the fail-before assertion, so the broken old-build run
  98  |       // retains both genuine mutation evidence and its false UI completion.
  99  |       writeFileSync(testInfo.outputPath(`${kind}-${fault}-reply.json`), JSON.stringify({
  100 |         initialHash: stateHash(fixture.game), expectedMutatedHash: stateHash(fixture.expected),
  101 |         commands: fixture.commands, originalReply,
  102 |         actualResultsText: await results.count() ? await results.textContent() : null,
  103 |         actualPanelText: await panel.textContent(),
  104 |         endTurnDisabled: await page.getByRole('button', { name: 'End turn', exact: true }).isDisabled(),
  105 |       }, null, 2) + '\n');
  106 |       await page.screenshot({ path: testInfo.outputPath(`${kind}-${fault}-reply.png`) });
  107 | 
> 108 |       await expect(page.getByTestId('feedback')).toContainText(/restore a saved campaign/i);
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  109 |       await expect(panel.getByRole('alert')).toContainText(/restore a saved campaign/i);
  110 |       await expect(results).toHaveCount(0);
  111 |       await expect(panel).toContainText(kind === 'posting' ? '2 armies selected' : '2 hearths selected');
  112 |       await expect(submit).toBeDisabled();
  113 |       await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  114 | 
  115 |       await campaignMenu(page);
  116 |       await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  117 |       await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  118 |       const restored = await exportedTravel(page);
  119 |       expect(serializeGame(restored.game)).toBe(serializeGame(fixture.game));
  120 |       expect(restored.archive).toEqual(fixture.archive);
  121 |       expect(restored.archive.records).toHaveLength(0);
  122 |       await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  123 |       ({ panel, submit } = await selectActors(page, kind));
  124 |       await submit.click();
  125 |       await expect(results).toContainText('2 orders accepted · 0 refused');
  126 |       const retried = await exportedTravel(page);
  127 |       expect(serializeGame(retried.game)).toBe(serializeGame(fixture.expected));
  128 |       expect(retried.archive).toEqual(fixture.expectedArchive);
  129 |       expect(retried.archive.records).toHaveLength(2);
  130 |       expect(retried.game.armies).toEqual(fixture.game.armies);
  131 |       expect(retried.game.routes).toEqual(fixture.game.routes);
  132 |       if (kind === 'charter') {
  133 |         expect(retried.game.settlements).toEqual(fixture.game.settlements);
  134 |         expect(retried.game.factions).toEqual(fixture.game.factions);
  135 |       }
  136 |       writeFileSync(testInfo.outputPath(`${kind}-${fault}-retried.theandril`), retried.bytes);
  137 |       writeFileSync(testInfo.outputPath(`${kind}-${fault}-restored.theandril`), restored.bytes);
  138 |       expect(errors).toEqual([]);
  139 |     });
  140 |   }
  141 | }
  142 | 
```