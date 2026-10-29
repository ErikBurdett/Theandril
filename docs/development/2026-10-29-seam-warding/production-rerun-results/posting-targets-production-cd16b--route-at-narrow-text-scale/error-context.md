# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: posting-targets.spec.ts >> production unavailable saved posting stays explicit and clearable without changing its existing route at narrow text scale
- Location: tests/production/posting-targets.spec.ts:58:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Campaign restored"
Received string:    "◆Resolving… A world of broken oaths awaits a new beginning."

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    3 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
  - Protocol error (Runtime.callFunctionOn): Page crashed.

```

```yaml
- status: Resolving… A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { serializeGame, stateHash, type GameState } from '@theandril/sim';
  3   | import { exportSave } from '@theandril/persistence';
  4   | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  5   | import { openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  6   | import { postingTargetsScene } from '../gameplay/posting-targets-fixture';
  7   | 
  8   | async function importTravel(page: Page, game: GameState) {
  9   |   await page.goto('./');
  10  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  11  |   await page.getByLabel('Import save file').setInputFiles({ name: 'posting-targets.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  12  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  13  | }
  14  | 
  15  | async function openPosting(page: Page) {
  16  |   await selectFromRegistry(page, 'armies', 'Target scouts');
  17  |   await openSelectedOrders(page);
  18  |   const posting = page.getByTestId('army-posting');
  19  |   await posting.locator(':scope > summary').click();
  20  |   return posting;
  21  | }
  22  | 
  23  | async function restoreExact(page: Page, expected: Awaited<ReturnType<typeof exportedTravel>>) {
  24  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  25  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  26  |   await page.reload();
  27  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
> 28  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  29  |   const restored = await exportedTravel(page);
  30  |   expect(restored.archive).toEqual(expected.archive);
  31  |   expect(stateHash(restored.game)).toBe(stateHash(expected.game));
  32  | }
  33  | 
  34  | test('production where it stands posts to the displayed current position after real movement in the mounted inspector', async ({ page }, testInfo) => {
  35  |   const fixture = postingTargetsScene('moving');
  36  |   await importTravel(page, fixture.game);
  37  |   const posting = await openPosting(page);
  38  |   await posting.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  39  |   await posting.getByLabel('On arrival').selectOption('hold');
  40  |   // Keep the same inspector and posting component mounted while its sibling
  41  |   // movement controls issue a real command and replace the army observation.
  42  |   const movement = page.getByTestId('map-orders');
  43  |   await movement.getByLabel('Destination hex', { exact: true }).fill(String(fixture.initialCell + 1));
  44  |   await movement.getByRole('button', { name: 'Review route', exact: true }).click();
  45  |   await movement.getByRole('button', { name: 'Move now', exact: true }).click();
  46  |   await expect(posting.getByRole('button', { name: 'Post army', exact: true })).toBeEnabled();
  47  |   await expect(posting.getByLabel('Posted to').locator('option:checked')).toHaveText(`Where it stands · hex ${fixture.initialCell + 1}`);
  48  |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  49  |   await expect(posting.locator(':scope > summary')).toContainText(`Hold · hex ${fixture.initialCell + 1}`);
  50  |   await posting.scrollIntoViewIfNeeded();
  51  |   await page.screenshot({ path: testInfo.outputPath('posting-current-after-movement.png') });
  52  |   const posted = await exportedTravel(page);
  53  |   expect(posted.game.armies[fixture.armyId]!.cell).toBe(fixture.initialCell + 1);
  54  |   expect(posted.game.postings.find(order => order.armyId === fixture.armyId)).toMatchObject({ cell: fixture.initialCell + 1, mode: 'hold' });
  55  |   await restoreExact(page, posted);
  56  | });
  57  | 
  58  | test('production unavailable saved posting stays explicit and clearable without changing its existing route at narrow text scale', async ({ page }, testInfo) => {
  59  |   const fixture = postingTargetsScene('posting'), route = structuredClone(fixture.game.routes[fixture.armyId]);
  60  |   await importTravel(page, fixture.game);
  61  |   await campaignMenu(page);
  62  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  63  |   await page.setViewportSize({ width: 390, height: 844 });
  64  |   const posting = await openPosting(page);
  65  |   await expect(posting.locator(':scope > summary')).toContainText('Hold · hex 0');
  66  |   await expect(posting.getByLabel('Posted to')).toHaveValue('');
  67  |   await expect(posting.getByRole('button', { name: 'Update posting', exact: true })).toBeDisabled();
  68  |   await expect(posting.getByLabel('Posted to')).toHaveAttribute('aria-describedby', /.+/);
  69  |   const clear = posting.getByRole('button', { name: 'Clear posting', exact: true });
  70  |   await expect(clear).toBeEnabled();
  71  |   await clear.scrollIntoViewIfNeeded();
  72  |   await page.screenshot({ path: testInfo.outputPath('posting-unavailable-narrow.png') });
  73  |   await clear.focus(); await page.keyboard.press('Enter');
  74  |   await expect(posting.locator(':scope > summary')).toContainText('none');
  75  |   const cleared = await exportedTravel(page);
  76  |   expect(cleared.game.postings.some(order => order.armyId === fixture.armyId)).toBe(false);
  77  |   expect(cleared.game.routes[fixture.armyId]).toEqual(route);
  78  |   const fresh = await openPosting(page);
  79  |   await fresh.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  80  |   await fresh.getByLabel('On arrival').selectOption('hold');
  81  |   await fresh.getByRole('button', { name: 'Post army', exact: true }).click();
  82  |   const posted = await exportedTravel(page);
  83  |   expect(posted.game.postings.find(order => order.armyId === fixture.armyId)?.cell).toBe(fixture.initialCell);
  84  |   expect(posted.game.routes[fixture.armyId]).toEqual(route);
  85  |   await restoreExact(page, posted);
  86  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  87  | });
  88  | 
  89  | test('production saved muster at an unavailable hex requires a fresh owned choice and remains clearable with exact saved history', async ({ page }, testInfo) => {
  90  |   const fixture = postingTargetsScene('muster');
  91  |   await importTravel(page, fixture.game);
  92  |   await selectFromRegistry(page, 'settlements', 'Target Hearth');
  93  |   await openSelectedOrders(page);
  94  |   const muster = page.getByTestId('settlement-muster');
  95  |   await muster.locator(':scope > summary').click();
  96  |   await expect(muster.locator(':scope > summary')).toContainText('hex 0');
  97  |   await expect(muster.getByLabel('Muster at')).toHaveValue('');
  98  |   await expect(muster.getByRole('button', { name: 'Move muster point', exact: true })).toBeDisabled();
  99  |   await expect(muster.getByLabel('Muster at')).toHaveAttribute('aria-describedby', /.+/);
  100 |   await expect(muster.getByRole('button', { name: 'Clear muster point', exact: true })).toBeEnabled();
  101 |   await muster.scrollIntoViewIfNeeded();
  102 |   await page.screenshot({ path: testInfo.outputPath('muster-unavailable-desktop.png') });
  103 |   // Clearing must not require inventing a valid replacement destination.
  104 |   await muster.getByRole('button', { name: 'Clear muster point', exact: true }).focus(); await page.keyboard.press('Enter');
  105 |   await expect(muster.locator(':scope > summary')).toContainText('none');
  106 |   await muster.getByLabel('Muster at').selectOption(String(fixture.hearthCell));
  107 |   await muster.getByRole('button', { name: 'Set muster point', exact: true }).click();
  108 |   await expect(muster.locator(':scope > summary')).toContainText('Target Hearth');
  109 |   const saved = await exportedTravel(page);
  110 |   expect(saved.game.musters.find(order => order.settlementId === fixture.settlementId)?.cell).toBe(fixture.hearthCell);
  111 |   await restoreExact(page, saved);
  112 | });
  113 | 
```