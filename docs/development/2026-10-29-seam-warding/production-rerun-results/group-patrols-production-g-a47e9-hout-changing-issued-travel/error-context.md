# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-patrols.spec.ts >> production group patrols pause, resume and remove selected policies across filters without changing issued travel
- Location: tests/production/group-patrols.spec.ts:10:1

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByRole('combobox', { name: 'Army orders', exact: true })
Expected: enabled
Received: undefined

Call log:
  - Expect "toBeEnabled" getByRole('combobox', { name: 'Army orders', exact: true }) with timeout 5000ms
  - waiting for getByRole('combobox', { name: 'Army orders', exact: true })
  - 

```

# Test source

```ts
  1   | import { writeFileSync } from 'node:fs';
  2   | import { expect, test, type Locator } from '@playwright/test';
  3   | import { replayArchive, resumeJournal } from '@theandril/chronicle';
  4   | import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
  5   | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6   | import { groupPatrolScene } from '../gameplay/group-patrol-fixture';
  7   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  8   | import { openRegistry } from '../gameplay/ui-navigation';
  9   | 
  10  | test('production group patrols pause, resume and remove selected policies across filters without changing issued travel', async ({ page }, testInfo) => {
  11  |   const fixture = groupPatrolScene();
  12  |   const errors: string[] = [];
  13  |   page.on('pageerror', error => errors.push(error.message));
  14  |   await page.goto('./');
  15  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  16  |   await page.getByLabel('Import save file').setInputFiles({
  17  |     name: 'authored-101-group-patrols.theandril', mimeType: 'application/gzip',
  18  |     buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))),
  19  |   });
  20  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  21  | 
  22  |   const filter = page.getByRole('combobox', { name: 'Army orders', exact: true });
  23  |   const registry = page.getByTestId('army-registry');
  24  |   const selection = page.getByTestId('group-postings');
  25  |   const patrols = page.getByTestId('group-patrols');
  26  |   const results = page.getByTestId('group-patrol-results');
  27  |   const expectedGame = deserializeGame(serializeGame(fixture.game));
  28  |   const expectedJournal = resumeJournal(expectedGame, fixture.archive);
  29  |   const phases: { action: string; hash: string; records: number; accepted: number; skipped: number }[] = [];
  30  | 
  31  |   const selectAll = async () => {
  32  |     await openRegistry(page, 'armies');
  33  |     await expect(filter).toHaveValue('all');
  34  |     await selection.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  35  |     await expect(selection).toContainText('101 armies selected');
  36  |     await patrols.locator(':scope > summary').click();
  37  |   };
  38  |   const verifyResults = async (accepted: number, skipped: number) => {
  39  |     await expect(results).toContainText(`${accepted} patrol orders accepted · 0 refused.`);
  40  |     await expect(results).toContainText(`${skipped} unaffected selected armies remain checked.`);
  41  |     await expect(patrols).toContainText(`${skipped} armies selected`);
  42  |     await results.locator('summary').click();
  43  |     await expect(results.getByRole('listitem')).toHaveCount(Math.min(accepted, 25));
  44  |     const pages = Math.ceil(accepted / 25);
  45  |     for (let index = 1; index < pages; index++) {
  46  |       await results.getByRole('button', { name: 'Next patrol results page', exact: true }).click();
  47  |     }
  48  |     await expect(results.getByRole('navigation', { name: 'Patrol results', exact: true })).toContainText(`Page ${pages} of ${pages}`);
  49  |     await expect(results.getByRole('listitem')).toHaveCount(accepted - 25 * (pages - 1));
  50  |   };
  51  |   const recordExpected = (commands: GameCommand[]) => {
  52  |     for (const command of commands) expect(expectedJournal.record(expectedGame, command).ok).toBe(true);
  53  |   };
  54  |   const verifyExport = async (action: string, accepted: number, skipped: number) => {
  55  |     const exported = await exportedTravel(page);
  56  |     expect(exported.game.armies).toEqual(fixture.game.armies);
  57  |     expect(exported.game.routes).toEqual(fixture.game.routes);
  58  |     expect(exported.game.postings).toEqual(fixture.game.postings);
  59  |     expect(serializeGame(exported.game)).toBe(serializeGame(expectedGame));
  60  |     expect(exported.archive).toEqual(expectedJournal.materialize());
  61  |     expect(serializeGame(replayArchive(exported.archive))).toBe(serializeGame(exported.game));
  62  |     phases.push({ action, hash: stateHash(exported.game), records: exported.archive.records.length, accepted, skipped });
  63  |     writeFileSync(testInfo.outputPath(`group-patrol-${action}.theandril`), exported.bytes);
  64  |     return exported;
  65  |   };
  66  |   // Observe an actual pending DOM lock without intercepting/delaying the worker.
  67  |   const pendingLock = (element: Locator) => element.evaluate(node => new Promise<boolean>((resolve, reject) => {
  68  |     const select = node as HTMLSelectElement;
  69  |     const observer = new MutationObserver(() => {
  70  |       if (select.disabled) { observer.disconnect(); clearTimeout(timeout); resolve(true); }
  71  |     });
  72  |     const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('The real patrol batch never locked the registry filter.')); }, 3000);
  73  |     observer.observe(select, { attributes: true, attributeFilter: ['disabled'] });
  74  |   }));
  75  | 
  76  |   await selectAll();
  77  |   await expect(filter.locator('option')).toHaveText(['All forces (101)', 'Postings and patrols (101)', 'Orders waiting (2)', 'Paused patrols (50)']);
  78  |   await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  79  |   await expect(filter).toHaveValue('paused-patrols');
  80  |   await expect(registry.getByRole('button')).toHaveCount(25);
  81  |   await expect(patrols).toContainText('101 armies selected · 51 outside this filter. 99 have patrols.');
  82  |   await expect(patrols).toContainText('Existing travel continues unchanged.');
  83  |   const pause = patrols.getByRole('button', { name: 'Pause enabled patrols (49)', exact: true });
  84  |   await pause.scrollIntoViewIfNeeded();
  85  |   await page.screenshot({ path: testInfo.outputPath('group-patrol-pause-desktop.png') });
  86  |   const locked = pendingLock(filter);
  87  |   await pause.click();
  88  |   expect(await locked).toBe(true);
  89  |   await verifyResults(49, 52);
> 90  |   await expect(filter).toBeEnabled();
      |                        ^ Error: expect(locator).toBeEnabled() failed
  91  |   await expect(patrols).toContainText('52 armies selected · 2 outside this filter. 50 have patrols.');
  92  |   recordExpected(fixture.enabledIds.map(armyId => ({ type: 'setPatrolEnabled', factionId: fixture.factionId, armyId, enabled: false })));
  93  |   await verifyExport('paused', 49, 52);
  94  | 
  95  |   await selectAll();
  96  |   await filter.selectOption('waiting');
  97  |   await expect(patrols).toContainText('101 armies selected · 99 outside this filter. 99 have patrols.');
  98  |   await expect(patrols).toContainText('1 paused patrol has Pause when war begins enabled.');
  99  |   await patrols.getByRole('button', { name: 'Resume paused patrols (99)', exact: true }).click();
  100 |   await verifyResults(99, 2);
  101 |   await expect(patrols).toContainText('2 armies selected · 1 outside this filter. 0 have patrols.');
  102 |   recordExpected(fixture.policyIds.map(armyId => ({ type: 'setPatrolEnabled', factionId: fixture.factionId, armyId, enabled: true })));
  103 |   const resumed = await verifyExport('resumed', 99, 2);
  104 |   expect(resumed.game.patrols.find(policy => policy.armyId === fixture.warPause.id)?.pauseOnWar).toBe(true);
  105 |   expect(resumed.game.routes[fixture.waiting.id]?.status).toBe('paused');
  106 |   expect(resumed.game.routes[fixture.travelling.id]?.status).toBe('active');
  107 | 
  108 |   await campaignMenu(page);
  109 |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  110 |   await page.setViewportSize({ width: 390, height: 844 });
  111 |   await selectAll();
  112 |   await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  113 |   await expect(filter).toHaveValue('paused-patrols');
  114 |   await expect(registry.getByRole('button')).toHaveCount(0);
  115 |   await expect(patrols).toContainText('101 armies selected · 101 outside this filter. 99 have patrols.');
  116 |   await expect(patrols.getByRole('button', { name: 'Resume paused patrols (0)', exact: true })).toBeDisabled();
  117 |   const remove = patrols.getByRole('button', { name: 'Remove selected patrols (99)', exact: true });
  118 |   await remove.scrollIntoViewIfNeeded();
  119 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  120 |   await page.screenshot({ path: testInfo.outputPath('group-patrol-remove-narrow-130.png') });
  121 |   await patrols.locator(':scope > .group-selection-actions').screenshot({ path: testInfo.outputPath('group-patrol-actions-native.png') });
  122 |   await remove.focus(); await page.keyboard.press('Enter');
  123 |   await verifyResults(99, 2);
  124 |   await expect(patrols).toContainText('2 armies selected · 2 outside this filter. 0 have patrols.');
  125 |   await filter.focus(); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
  126 |   for (const actor of fixture.noPolicy) {
  127 |     await expect(registry.getByRole('checkbox', { name: `Select ${actor.name} for group orders`, exact: true })).toBeChecked();
  128 |   }
  129 |   recordExpected(fixture.policyIds.map(armyId => ({ type: 'clearPatrol', factionId: fixture.factionId, armyId })));
  130 |   const removed = await verifyExport('removed', 99, 2);
  131 |   expect(removed.game.patrols).toHaveLength(0);
  132 |   expect(removed.archive.records).toHaveLength(352);
  133 | 
  134 |   await campaignMenu(page);
  135 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  136 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  137 |   await page.reload();
  138 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  139 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  140 |   const restored = await exportedTravel(page);
  141 |   expect(serializeGame(restored.game)).toBe(serializeGame(removed.game));
  142 |   expect(restored.archive).toEqual(removed.archive);
  143 |   writeFileSync(testInfo.outputPath('group-patrol-restored.theandril'), restored.bytes);
  144 |   writeFileSync(testInfo.outputPath('group-patrol-evidence.json'), JSON.stringify({
  145 |     authored: 'Open-terrain theaterCampaign(101), two hearths, treasury, named companies and foreign obstruction guard; 105 ordinary setup records.',
  146 |     initialHash: fixture.hash, counts: fixture.counts, phases, finalHash: stateHash(restored.game),
  147 |     unchangedRoutes: fixture.game.routes, unchangedArmies: true, unchangedPostings: true,
  148 |     warPausePreservedUntilRemoval: true, exactReplayEveryPhase: true, exactReload: true,
  149 |     finalRecords: restored.archive.records.length, realPendingFilterLock: true,
  150 |   }, null, 2) + '\n');
  151 |   expect(errors).toEqual([]);
  152 | });
  153 | 
```