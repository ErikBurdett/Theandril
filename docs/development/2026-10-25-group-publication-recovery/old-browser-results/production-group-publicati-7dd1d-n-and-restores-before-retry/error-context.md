# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/group-publication-recovery.spec.ts >> production group posting publication failure locks after real mutation and restores before retry
- Location: tests/production/group-publication-recovery.spec.ts:41:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected pattern: /restore a saved campaign/i
Received string:  "!Authored publication evidence: {\"hash\":\"782d91b7\",\"results\":[{\"armyId\":\"army.10\",\"accepted\":true},{\"armyId\":\"army.9\",\"accepted\":true}]}"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    14 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!Authored publication evidence: {"hash":"782d91b7","results":[{"armyId":"army.10","accepted":true},{"armyId":"army.9","accepted":true}]}"

```

```yaml
- alert: "Authored publication evidence: {\"hash\":\"782d91b7\",\"results\":[{\"armyId\":\"army.10\",\"accepted\":true},{\"armyId\":\"army.9\",\"accepted\":true}]}"
```

# Test source

```ts
  16  |   const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  17  |   const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  18  |   const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  19  |   expect(armies).toHaveLength(2); expect(towns).toHaveLength(2);
  20  |   const commands: GameCommand[] = kind === 'posting'
  21  |     ? armies.map(army => ({ type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'hold' }))
  22  |     : towns.map(town => ({ type: 'setCharter', factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 }));
  23  |   const expected = deserializeGame(serializeGame(game)), journal = resumeJournal(expected, archive);
  24  |   commands.forEach(command => expect(journal.record(expected, command).ok).toBe(true));
  25  |   return { game, archive, commands, expected, expectedArchive: journal.materialize(),
  26  |     ids: kind === 'posting' ? armies.map(army => army.id) : towns.map(town => town.id) };
  27  | }
  28  | 
  29  | async function selectActors(page: Page, kind: Kind) {
  30  |   await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
  31  |   const panel = page.getByTestId(kind === 'posting' ? 'group-postings' : 'group-charters');
  32  |   await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
  33  |   if (kind === 'charter') {
  34  |     await panel.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  35  |     await panel.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
  36  |   }
  37  |   return { panel, submit: panel.getByRole('button', { name: kind === 'posting' ? 'Post selected armies (2)' : 'Apply charters (2)', exact: true }) };
  38  | }
  39  | 
  40  | for (const kind of ['posting', 'charter'] as const) {
  41  |   test(`production group ${kind} publication failure locks after real mutation and restores before retry`, async ({ page }, testInfo) => {
  42  |     mkdirSync(testInfo.outputDir, { recursive: true });
  43  |     const fixture = fixtureFor(kind), field = kind === 'posting' ? 'groupPostingResults' : 'groupCharterResults';
  44  |     await page.addInitScript(({ field, marker }) => {
  45  |       const NativeWorker = window.Worker;
  46  |       window.Worker = class extends NativeWorker {
  47  |         private readonly wrapperUrl: string;
  48  |         constructor(url: string | URL, options?: WorkerOptions) {
  49  |           const originalUrl = new URL(String(url), window.location.href).href;
  50  |           // Buffer only transport during the dynamic module bootstrap. Every
  51  |           // queued request is delivered unchanged to the production handler.
  52  |           // The sole injected fault is a throw inside its final postMessage.
  53  |           const source = `
  54  |             const queued = [];
  55  |             const buffer = event => { queued.push(event.data); event.stopImmediatePropagation(); };
  56  |             self.addEventListener('message', buffer);
  57  |             const originalPost = self.postMessage.bind(self);
  58  |             let failed = false;
  59  |             self.postMessage = (message, options) => {
  60  |               if (!failed && message.type === 'state' && Array.isArray(message[${JSON.stringify(field)}])) {
  61  |                 failed = true;
  62  |                 throw new Error(${JSON.stringify(marker)} + JSON.stringify({ hash: message.hash, results: message[${JSON.stringify(field)}] }));
  63  |               }
  64  |               return originalPost(message, options);
  65  |             };
  66  |             await import(${JSON.stringify(originalUrl)});
  67  |             self.removeEventListener('message', buffer);
  68  |             for (const data of queued) self.dispatchEvent(new MessageEvent('message', { data }));
  69  |           `;
  70  |           const wrapperUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  71  |           super(wrapperUrl, { ...options, type: 'module' });
  72  |           this.wrapperUrl = wrapperUrl;
  73  |           // Observe the real outer-catch response without replacing any reply.
  74  |           this.addEventListener('message', event => {
  75  |             const response = event.data as { type?: string; message?: string; recoveryRequired?: boolean };
  76  |             if (response.type === 'error' && response.message?.includes(marker)) {
  77  |               (window as unknown as { __GROUP_PUBLICATION_ERROR__: PublicationError }).__GROUP_PUBLICATION_ERROR__ = {
  78  |                 message: response.message, recoveryRequired: response.recoveryRequired,
  79  |               };
  80  |             }
  81  |           });
  82  |         }
  83  |         override terminate() { super.terminate(); URL.revokeObjectURL(this.wrapperUrl); }
  84  |       };
  85  |     }, { field, marker });
  86  |     const errors: string[] = [];
  87  |     page.on('pageerror', error => errors.push(error.message));
  88  |     await page.goto('./');
  89  |     expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  90  |     await page.getByLabel('Import save file').setInputFiles({ name: 'publication-two-actors.theandril', mimeType: 'application/gzip',
  91  |       buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))) });
  92  |     await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  93  |     await campaignMenu(page);
  94  |     await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  95  |     await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  96  |     let { panel, submit } = await selectActors(page, kind);
  97  |     await submit.click();
  98  |     await page.waitForFunction(() => '__GROUP_PUBLICATION_ERROR__' in window);
  99  |     await expect(panel).toHaveAttribute('aria-busy', 'false');
  100 |     const response = await page.evaluate(() => (window as unknown as { __GROUP_PUBLICATION_ERROR__: PublicationError }).__GROUP_PUBLICATION_ERROR__);
  101 |     const evidence = JSON.parse(response.message.slice(response.message.indexOf(marker) + marker.length)) as { hash: string; results: Record<string, unknown>[] };
  102 |     const actorKey = kind === 'posting' ? 'armyId' : 'settlementId';
  103 |     expect(evidence.hash).toBe(stateHash(fixture.expected));
  104 |     expect(evidence.results).toEqual(fixture.ids.map(id => ({ [actorKey]: id, accepted: true })));
  105 |     const results = page.getByTestId(kind === 'posting' ? 'group-posting-results' : 'group-charter-results');
  106 |     // Persist the actual mutation and outer-catch response before fail-before
  107 |     // assertions, so a failing old build retains independently useful evidence.
  108 |     writeFileSync(testInfo.outputPath(`${kind}-publication-failure.json`), JSON.stringify({
  109 |       initialHash: stateHash(fixture.game), expectedMutatedHash: stateHash(fixture.expected), commands: fixture.commands,
  110 |       evidence, response, actualPanelText: await panel.textContent(),
  111 |       actualResultsText: await results.count() ? await results.textContent() : null,
  112 |       endTurnDisabled: await page.getByRole('button', { name: 'End turn', exact: true }).isDisabled(),
  113 |     }, null, 2) + '\n');
  114 |     await page.screenshot({ path: testInfo.outputPath(`${kind}-publication-failure.png`) });
  115 | 
> 116 |     await expect(page.getByTestId('feedback')).toContainText(/restore a saved campaign/i);
      |                                                ^ Error: expect(locator).toContainText(expected) failed
  117 |     expect(response.recoveryRequired).toBe(true);
  118 |     await expect(panel.getByRole('alert')).toContainText(/restore a saved campaign/i);
  119 |     await expect(results).toHaveCount(0);
  120 |     await expect(panel).toContainText(kind === 'posting' ? '2 armies selected' : '2 hearths selected');
  121 |     await expect(submit).toBeDisabled();
  122 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  123 |     await campaignMenu(page);
  124 |     await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  125 |     await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  126 |     const restored = await exportedTravel(page);
  127 |     expect(serializeGame(restored.game)).toBe(serializeGame(fixture.game));
  128 |     expect(restored.archive).toEqual(fixture.archive);
  129 |     expect(restored.archive.records).toHaveLength(0);
  130 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  131 |     await page.screenshot({ path: testInfo.outputPath(`${kind}-publication-restored.png`) });
  132 |     ({ panel, submit } = await selectActors(page, kind));
  133 |     await submit.click();
  134 |     await expect(results).toContainText('2 orders accepted · 0 refused');
  135 |     const retried = await exportedTravel(page);
  136 |     expect(serializeGame(retried.game)).toBe(serializeGame(fixture.expected));
  137 |     expect(retried.archive).toEqual(fixture.expectedArchive);
  138 |     expect(retried.archive.records).toHaveLength(2);
  139 |     expect(serializeGame(replayArchive(retried.archive))).toBe(serializeGame(retried.game));
  140 |     expect(retried.game.armies).toEqual(fixture.game.armies); expect(retried.game.routes).toEqual(fixture.game.routes);
  141 |     writeFileSync(testInfo.outputPath(`${kind}-publication-restored.theandril`), restored.bytes);
  142 |     writeFileSync(testInfo.outputPath(`${kind}-publication-retried.theandril`), retried.bytes);
  143 |     writeFileSync(testInfo.outputPath(`${kind}-publication-recovery.json`), JSON.stringify({ initialHash: stateHash(fixture.game),
  144 |       interruptedHash: evidence.hash, restoredHash: stateHash(restored.game), retryHash: stateHash(retried.game),
  145 |       restoredRecords: restored.archive.records.length, retryRecords: retried.archive.records.length, exactReplay: true }, null, 2) + '\n');
  146 |     expect(errors).toEqual([]);
  147 |   });
  148 | }
  149 | 
```