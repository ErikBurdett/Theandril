# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: posting-targets.spec.ts >> an unavailable saved posting stays explicit and clearable without changing its existing route at narrow text scale
- Location: tests/gameplay/posting-targets.spec.ts:48:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByTestId('army-posting').getByLabel('Posted to')
Expected: ""
Received: "505"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" getByTestId('army-posting').getByLabel('Posted to') with timeout 5000ms
  - waiting for getByTestId('army-posting').getByLabel('Posted to')
    14 × locator resolved to <select>…</select>
       - unexpected value "505"

```

```yaml
- combobox "Posted to":
  - option "Where it stands · hex 505" [selected]
  - option "Target Hearth · hex 490"
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { stateHash } from '@theandril/sim';
  3   | import { campaignMenu, exportedTravel, importTravel } from './group-movement-fixture';
  4   | import { openSelectedOrders, selectFromRegistry } from './ui-navigation';
  5   | import { postingTargetsScene } from './posting-targets-fixture';
  6   | 
  7   | async function openPosting(page: Page) {
  8   |   await selectFromRegistry(page, 'armies', 'Target scouts');
  9   |   await openSelectedOrders(page);
  10  |   const posting = page.getByTestId('army-posting');
  11  |   await posting.locator(':scope > summary').click();
  12  |   return posting;
  13  | }
  14  | 
  15  | async function restoreExact(page: Page, expected: Awaited<ReturnType<typeof exportedTravel>>) {
  16  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  17  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  18  |   await page.reload();
  19  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  20  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  21  |   const restored = await exportedTravel(page);
  22  |   expect(restored.archive).toEqual(expected.archive);
  23  |   expect(stateHash(restored.game)).toBe(stateHash(expected.game));
  24  | }
  25  | 
  26  | test('where it stands posts to the displayed current position after real movement in the mounted inspector', async ({ page }) => {
  27  |   const fixture = postingTargetsScene('moving');
  28  |   await importTravel(page, fixture.game);
  29  |   const posting = await openPosting(page);
  30  |   await posting.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  31  |   await posting.getByLabel('On arrival').selectOption('hold');
  32  |   // Keep the same inspector and posting component mounted while its sibling
  33  |   // movement controls issue a real command and replace the army observation.
  34  |   const movement = page.getByTestId('map-orders');
  35  |   await movement.getByLabel('Destination hex', { exact: true }).fill(String(fixture.initialCell + 1));
  36  |   await movement.getByRole('button', { name: 'Review route', exact: true }).click();
  37  |   await movement.getByRole('button', { name: 'Move now', exact: true }).click();
  38  |   await expect(posting.getByRole('button', { name: 'Post army', exact: true })).toBeEnabled();
  39  |   await expect(posting.getByLabel('Posted to').locator('option:checked')).toHaveText(`Where it stands · hex ${fixture.initialCell + 1}`);
  40  |   await posting.getByRole('button', { name: 'Post army', exact: true }).click();
  41  |   await expect(posting.locator(':scope > summary')).toContainText(`Hold · hex ${fixture.initialCell + 1}`);
  42  |   const posted = await exportedTravel(page);
  43  |   expect(posted.game.armies[fixture.armyId]!.cell).toBe(fixture.initialCell + 1);
  44  |   expect(posted.game.postings.find(order => order.armyId === fixture.armyId)).toMatchObject({ cell: fixture.initialCell + 1, mode: 'hold' });
  45  |   await restoreExact(page, posted);
  46  | });
  47  | 
  48  | test('an unavailable saved posting stays explicit and clearable without changing its existing route at narrow text scale', async ({ page }, testInfo) => {
  49  |   const fixture = postingTargetsScene('posting'), route = structuredClone(fixture.game.routes[fixture.armyId]);
  50  |   await importTravel(page, fixture.game);
  51  |   await campaignMenu(page);
  52  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  53  |   await page.setViewportSize({ width: 390, height: 844 });
  54  |   const posting = await openPosting(page);
  55  |   await expect(posting.locator(':scope > summary')).toContainText('Hold · hex 0');
> 56  |   await expect(posting.getByLabel('Posted to')).toHaveValue('');
      |                                                 ^ Error: expect(locator).toHaveValue(expected) failed
  57  |   await expect(posting.getByRole('button', { name: 'Update posting', exact: true })).toBeDisabled();
  58  |   await expect(posting.getByLabel('Posted to')).toHaveAttribute('aria-describedby', /.+/);
  59  |   const clear = posting.getByRole('button', { name: 'Clear posting', exact: true });
  60  |   await expect(clear).toBeEnabled();
  61  |   await clear.scrollIntoViewIfNeeded();
  62  |   await page.screenshot({ path: testInfo.outputPath('posting-unavailable-narrow.png') });
  63  |   await clear.focus(); await page.keyboard.press('Enter');
  64  |   await expect(posting.locator(':scope > summary')).toContainText('none');
  65  |   const cleared = await exportedTravel(page);
  66  |   expect(cleared.game.postings.some(order => order.armyId === fixture.armyId)).toBe(false);
  67  |   expect(cleared.game.routes[fixture.armyId]).toEqual(route);
  68  |   const fresh = await openPosting(page);
  69  |   await fresh.getByLabel('Posted to').selectOption({ label: `Where it stands · hex ${fixture.initialCell}` });
  70  |   await fresh.getByLabel('On arrival').selectOption('hold');
  71  |   await fresh.getByRole('button', { name: 'Post army', exact: true }).click();
  72  |   const posted = await exportedTravel(page);
  73  |   expect(posted.game.postings.find(order => order.armyId === fixture.armyId)?.cell).toBe(fixture.initialCell);
  74  |   expect(posted.game.routes[fixture.armyId]).toEqual(route);
  75  |   await restoreExact(page, posted);
  76  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  77  | });
  78  | 
  79  | test('a saved muster at an unavailable hex requires a fresh owned choice and remains clearable with exact saved history', async ({ page }, testInfo) => {
  80  |   const fixture = postingTargetsScene('muster');
  81  |   await importTravel(page, fixture.game);
  82  |   await selectFromRegistry(page, 'settlements', 'Target Hearth');
  83  |   await openSelectedOrders(page);
  84  |   const muster = page.getByTestId('settlement-muster');
  85  |   await muster.locator(':scope > summary').click();
  86  |   await expect(muster.locator(':scope > summary')).toContainText('hex 0');
  87  |   await expect(muster.getByLabel('Muster at')).toHaveValue('');
  88  |   await expect(muster.getByRole('button', { name: 'Move muster point', exact: true })).toBeDisabled();
  89  |   await expect(muster.getByLabel('Muster at')).toHaveAttribute('aria-describedby', /.+/);
  90  |   await expect(muster.getByRole('button', { name: 'Clear muster point', exact: true })).toBeEnabled();
  91  |   await muster.scrollIntoViewIfNeeded();
  92  |   await page.screenshot({ path: testInfo.outputPath('muster-unavailable-desktop.png') });
  93  |   // Clearing must not require inventing a valid replacement destination.
  94  |   await muster.getByRole('button', { name: 'Clear muster point', exact: true }).focus(); await page.keyboard.press('Enter');
  95  |   await expect(muster.locator(':scope > summary')).toContainText('none');
  96  |   await muster.getByLabel('Muster at').selectOption(String(fixture.hearthCell));
  97  |   await muster.getByRole('button', { name: 'Set muster point', exact: true }).click();
  98  |   await expect(muster.locator(':scope > summary')).toContainText('Target Hearth');
  99  |   const saved = await exportedTravel(page);
  100 |   expect(saved.game.musters.find(order => order.settlementId === fixture.settlementId)?.cell).toBe(fixture.hearthCell);
  101 |   await restoreExact(page, saved);
  102 | });
  103 | 
```