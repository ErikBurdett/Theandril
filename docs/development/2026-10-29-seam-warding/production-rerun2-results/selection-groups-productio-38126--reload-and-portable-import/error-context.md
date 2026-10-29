# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: selection-groups.spec.ts >> production saved groups remain campaign-specific through founding, explicit orders, save, reload and portable import
- Location: tests/production/selection-groups.spec.ts:33:1

# Error details

```
Error: page.evaluate: Target crashed 
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  3   | 
  4   | async function begin(page: Page, seed: string) {
  5   |   await page.getByRole('textbox', { name: 'World seed', exact: true }).fill(seed);
  6   |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  7   |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  8   |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  9   |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  10  |   await expect(page.getByTestId('feedback')).toHaveText('◆Your people await a hearth. Select the caravan and found your first settlement.');
  11  |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  12  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
> 13  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
      |                     ^ Error: page.evaluate: Target crashed 
  14  | }
  15  | 
  16  | async function settings(page: Page) {
  17  |   await closeManagement(page);
  18  |   const menu = page.getByTestId('campaign-menu');
  19  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  20  | }
  21  | 
  22  | async function groups(page: Page, kind: 'armies' | 'settlements', keyboard = false) {
  23  |   await openRegistry(page, kind);
  24  |   const details = page.getByTestId('selection-groups');
  25  |   if (await details.getAttribute('open') === null) {
  26  |     const summary = details.locator(':scope > summary');
  27  |     if (keyboard) { await summary.focus(); await page.keyboard.press('Enter'); }
  28  |     else await summary.click();
  29  |   }
  30  |   return details;
  31  | }
  32  | 
  33  | test('production saved groups remain campaign-specific through founding, explicit orders, save, reload and portable import', async ({ page }, testInfo) => {
  34  |   const errors: string[] = [];
  35  |   page.on('pageerror', error => errors.push(error.message));
  36  |   await page.goto('./');
  37  |   await begin(page, '20260905');
  38  |   await openRegistry(page, 'armies');
  39  |   const postings = page.getByTestId('group-postings');
  40  |   await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  41  |   await expect(postings).toContainText('2 armies selected');
  42  |   const armyGroups = await groups(page, 'armies');
  43  |   await armyGroups.getByRole('textbox', { name: 'Group name', exact: true }).fill('First expedition');
  44  |   await armyGroups.getByRole('button', { name: 'Save new group', exact: true }).click();
  45  |   await expect(armyGroups.getByRole('option', { name: 'First expedition', exact: true })).toHaveCount(1);
  46  |   await postings.getByRole('button', { name: 'Clear group selection', exact: true }).click();
  47  |   await armyGroups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'First expedition' });
  48  |   await expect(postings).toContainText('0 armies selected');
  49  |   await armyGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  50  |   await expect(postings).toContainText('2 armies selected');
  51  |   await expect(page.getByTestId('group-posting-results')).toHaveCount(0);
  52  | 
  53  |   await selectFromRegistry(page, 'armies', /Hearth caravan/);
  54  |   await openSelectedOrders(page);
  55  |   await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Group Hearth');
  56  |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  57  |   await openRegistry(page, 'settlements');
  58  |   await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  59  |   await expect(page.getByTestId('settlement-registry')).toContainText('Group Hearth');
  60  |   const charters = page.getByTestId('group-charters');
  61  |   await charters.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  62  |   const hearthGroups = await groups(page, 'settlements');
  63  |   await hearthGroups.getByRole('textbox', { name: 'Group name', exact: true }).fill('Home hearths');
  64  |   await hearthGroups.getByRole('button', { name: 'Save new group', exact: true }).click();
  65  |   await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(1);
  66  |   await charters.getByRole('button', { name: 'Clear hearth selection', exact: true }).click();
  67  |   await hearthGroups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Home hearths' });
  68  |   await expect(charters).toContainText('0 hearths selected');
  69  |   await hearthGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  70  |   await expect(charters).toContainText('1 hearth selected');
  71  |   await expect(page.getByTestId('group-charter-results')).toHaveCount(0);
  72  |   await charters.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
  73  |   await charters.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true }).fill('24');
  74  |   await charters.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
  75  |   await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  76  | 
  77  |   await groups(page, 'armies');
  78  |   await page.getByRole('searchbox', { name: 'Search your realm' }).fill('');
  79  |   await armyGroups.getByRole('combobox', { name: 'Saved army group', exact: true }).selectOption({ label: 'First expedition' });
  80  |   await armyGroups.getByRole('button', { name: 'Recall group', exact: true }).click();
  81  |   await expect(postings).toContainText('1 armies selected');
  82  |   await postings.getByRole('button', { name: 'Post selected armies (1)', exact: true }).click();
  83  |   await expect(page.getByTestId('group-posting-results')).toContainText('1 orders accepted · 0 refused');
  84  |   await settings(page);
  85  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  86  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  87  |   const downloadPromise = page.waitForEvent('download');
  88  |   await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  89  |   const downloaded = await (await downloadPromise).path();
  90  |   expect(downloaded).toBeTruthy();
  91  |   await page.reload();
  92  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  93  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  94  |   await groups(page, 'armies');
  95  |   await expect(armyGroups.getByRole('option', { name: 'First expedition', exact: true })).toHaveCount(1);
  96  |   await groups(page, 'settlements');
  97  |   await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(1);
  98  | 
  99  |   // A new generated campaign has its own group library. Importing the actual
  100 |   // downloaded campaign restores that campaign's groups and existing orders.
  101 |   await settings(page);
  102 |   await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  103 |   await begin(page, '77');
  104 |   await groups(page, 'armies');
  105 |   await expect(armyGroups.getByRole('option', { name: 'First expedition', exact: true })).toHaveCount(0);
  106 |   await groups(page, 'settlements');
  107 |   await expect(hearthGroups.getByRole('option', { name: 'Home hearths', exact: true })).toHaveCount(0);
  108 |   await settings(page);
  109 |   await page.locator('input[type=file]').setInputFiles(downloaded!);
  110 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  111 |   await page.setViewportSize({ width: 390, height: 844 });
  112 |   await groups(page, 'settlements', true);
  113 |   await hearthGroups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Home hearths' });
```