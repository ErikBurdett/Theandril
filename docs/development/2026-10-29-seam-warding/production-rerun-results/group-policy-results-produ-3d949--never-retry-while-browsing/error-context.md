# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-policy-results.spec.ts >> production posting receipts expose all 128 actual results, preserve 32 refused selections and never retry while browsing
- Location: tests/production/group-policy-results.spec.ts:74:1

# Error details

```
Error: locator.focus: Target crashed 
Call log:
  - waiting for getByTestId('group-posting-results').getByRole('button', { name: 'Next posting results page', exact: true })

```

# Test source

```ts
  1   | import { mkdirSync, writeFileSync } from 'node:fs';
  2   | import { expect, test, type Locator, type Page } from '@playwright/test';
  3   | import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
  4   | import { deserializeGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
  5   | import { exportSave, serializeCampaign } from '@theandril/persistence';
  6   | import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
  7   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  8   | import { openRegistry } from '../gameplay/ui-navigation';
  9   | 
  10  | const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  11  | function scene(limited = false) {
  12  |   const base = empireDelegationCampaign();
  13  |   let game = base.game;
  14  |   const factionId = game.turnOwnerId;
  15  |   const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort(byId);
  16  |   const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort(byId);
  17  |   expect(armies).toHaveLength(128); expect(towns).toHaveLength(30);
  18  |   if (limited) {
  19  |     // Disclosed capacity boundary: saved lost-army postings remain valid until
  20  |     // next-turn cleanup. This is the existing gameplay group-postings fixture
  21  |     // technique, expanded to 32 actual canonical refusals, not fabricated replies.
  22  |     game.postings = [
  23  |       ...armies.slice(0, 96).map(army => ({ armyId: army.id, factionId, cell: army.cell, mode: 'join' as const })),
  24  |       ...Array.from({ length: 8192 - 96 }, (_, index) => ({
  25  |         armyId: `army.expired.${String(index).padStart(4, '0')}`, factionId: base.enemyIds[0]!,
  26  |         cell: game.world.starts[1]!, mode: 'hold' as const,
  27  |       })),
  28  |     ].sort((a, b) => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0);
  29  |     game = deserializeGame(serializeGame(game));
  30  |   }
  31  |   const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  32  |   return { game, archive, factionId, armies, towns, authored: base.authored + (limited ? ' Posting-capacity boundary authors 96 own policies and 8096 expired foreign policies before the from-save archive; no turn advances.' : '') };
  33  | }
  34  | async function load(page: Page, fixture: ReturnType<typeof scene>) {
  35  |   await page.goto('./');
  36  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  37  |   await page.getByLabel('Import save file').setInputFiles({ name: 'group-policy-receipts.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))) });
  38  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  39  |   await campaignMenu(page);
  40  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  41  | }
  42  | async function lastPage(page: Page, receipt: Locator, kind: 'posting' | 'charter') {
  43  |   const next = receipt.getByRole('button', { name: `Next ${kind} results page`, exact: true });
  44  |   while (await next.isEnabled()) {
> 45  |     await next.focus(); await page.keyboard.press('Enter');
      |                ^ Error: locator.focus: Target crashed 
  46  |   }
  47  | }
  48  | async function assertNarrow(page: Page, receipt: Locator, control: Locator) {
  49  |   await page.setViewportSize({ width: 390, height: 844 });
  50  |   await control.scrollIntoViewIfNeeded();
  51  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  52  |   expect(await control.evaluate(element => {
  53  |     const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
  54  |     return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  55  |   })).toBe(true);
  56  |   await expect(receipt.getByRole('listitem')).toHaveCount(7);
  57  | }
  58  | function expectedOrders(fixture: ReturnType<typeof scene>, commands: GameCommand[]) {
  59  |   const game = deserializeGame(serializeGame(fixture.game));
  60  |   const journal = resumeJournal(game, fixture.archive);
  61  |   const results = commands.map(command => journal.record(game, command));
  62  |   const archive = journal.materialize();
  63  |   expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  64  |   return { game, archive, results };
  65  | }
  66  | function sameWorld(actual: GameState, before: GameState) {
  67  |   expect(actual.armies).toEqual(before.armies);
  68  |   expect(actual.routes).toEqual(before.routes);
  69  |   expect(actual.patrols).toEqual(before.patrols);
  70  |   expect(actual.settlements).toEqual(before.settlements);
  71  |   expect(actual.factions).toEqual(before.factions);
  72  | }
  73  | 
  74  | test('production posting receipts expose all 128 actual results, preserve 32 refused selections and never retry while browsing', async ({ page }, testInfo) => {
  75  |   mkdirSync(testInfo.outputDir, { recursive: true });
  76  |   const fixture = scene(true), errors: string[] = [];
  77  |   page.on('pageerror', error => errors.push(error.message));
  78  |   const commands: GameCommand[] = fixture.armies.map(army => ({ type: 'setPosting', factionId: fixture.factionId, armyId: army.id, cell: army.cell, mode: 'hold' }));
  79  |   const expected = expectedOrders(fixture, commands);
  80  |   expect(expected.results.filter(result => result.ok)).toHaveLength(96);
  81  |   expect(expected.results.filter(result => !result.ok)).toHaveLength(32);
  82  |   await load(page, fixture);
  83  |   const window = await openRegistry(page, 'armies');
  84  |   const group = page.getByTestId('group-postings');
  85  |   await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  86  |   await group.getByRole('button', { name: 'Post selected armies (128)', exact: true }).click();
  87  |   const receipt = page.getByTestId('group-posting-results');
  88  |   await expect(receipt).toContainText('96 orders accepted · 32 refused');
  89  |   await expect(receipt.locator('details')).toHaveAttribute('open', '');
  90  |   await expect(group).toContainText('32 armies selected');
  91  |   const filter = receipt.getByRole('combobox', { name: 'Posting result filter', exact: true });
  92  |   await expect(filter).toHaveValue('refused');
  93  |   await filter.locator('..').screenshot({ path: testInfo.outputPath('posting-receipt-filter-native.png') });
  94  |   await receipt.getByRole('list', { name: 'Posting order results', exact: true }).screenshot({ path: testInfo.outputPath('posting-receipt-rows-native.png') });
  95  |   await expect(receipt.getByRole('listitem')).toHaveCount(25);
  96  |   await expect(receipt.getByRole('listitem').first()).toContainText(fixture.armies[96]!.name);
  97  |   await lastPage(page, receipt, 'posting');
  98  |   await expect(receipt.getByRole('listitem')).toHaveCount(7);
  99  |   await expect(receipt.getByRole('listitem').last()).toContainText(fixture.armies[127]!.name);
  100 |   await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  101 |   await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  102 |   await receipt.getByRole('navigation').scrollIntoViewIfNeeded();
  103 |   await page.screenshot({ path: testInfo.outputPath('posting-receipt-desktop-130.png') });
  104 | 
  105 |   await filter.selectOption('accepted');
  106 |   await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 4');
  107 |   await expect(receipt.getByRole('listitem').first()).toContainText(fixture.armies[0]!.name);
  108 |   await lastPage(page, receipt, 'posting');
  109 |   await expect(receipt.getByRole('listitem')).toHaveCount(21);
  110 |   await expect(receipt.getByRole('listitem').last()).toContainText(fixture.armies[95]!.name);
  111 |   await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  112 |   await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  113 |   await filter.selectOption('all');
  114 |   await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 6');
  115 |   await lastPage(page, receipt, 'posting');
  116 |   await expect(receipt.getByRole('listitem')).toHaveCount(3);
  117 |   await expect(receipt.getByRole('listitem').last()).toContainText(fixture.armies[127]!.name);
  118 |   await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  119 |   await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  120 |   // Native keyboard selects Refused and resets its page; no order callback exists.
  121 |   await filter.focus(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  122 |   await expect(filter).toHaveValue('refused');
  123 |   await expect(receipt.getByRole('navigation')).toContainText('Page 1 of 2');
  124 |   await lastPage(page, receipt, 'posting');
  125 |   await assertNarrow(page, receipt, receipt.getByRole('button', { name: 'Previous posting results page', exact: true }));
  126 |   await receipt.getByRole('listitem').last().scrollIntoViewIfNeeded();
  127 |   await expect(receipt.getByRole('listitem').last()).toBeInViewport();
  128 |   await page.screenshot({ path: testInfo.outputPath('posting-receipt-narrow-130.png') });
  129 |   await expect(group).toContainText('32 armies selected');
  130 |   const checked: string[] = [];
  131 |   const registry = page.getByTestId('army-registry');
  132 |   const previous = window.getByRole('button', { name: 'Previous registry page', exact: true });
  133 |   while (await previous.count() && await previous.isEnabled()) await previous.click();
  134 |   for (;;) {
  135 |     checked.push(...await registry.getByRole('checkbox', { checked: true }).evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')!)));
  136 |     const next = window.getByRole('button', { name: 'Next registry page', exact: true });
  137 |     if (!await next.count() || !await next.isEnabled()) break;
  138 |     await next.click();
  139 |   }
  140 |   expect(checked.sort()).toEqual(fixture.armies.slice(96).map(army => `Select ${army.name} for group orders`).sort());
  141 |   const exported = await exportedTravel(page);
  142 |   expect(serializeGame(exported.game)).toBe(serializeGame(expected.game));
  143 |   expect(exported.archive).toEqual(expected.archive);
  144 |   expect(exported.archive.records).toHaveLength(128);
  145 |   sameWorld(exported.game, fixture.game);
```