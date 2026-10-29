# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: charter-templates.spec.ts >> production charter templates cross campaigns and browser reloads before explicit application and saved restoration
- Location: tests/production/charter-templates.spec.ts:41:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('feedback')
Expected substring: "Campaign restored."
Received string:    "!The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('feedback') with timeout 5000ms
  - waiting for getByTestId('feedback')
    3 × locator resolved to <div role="status" class="feedback " aria-live="polite" data-testid="feedback">…</div>
      - unexpected value "◆Resolving… A world of broken oaths awaits a new beginning."
    11 × locator resolved to <div role="alert" aria-live="polite" class="feedback error" data-testid="feedback">…</div>
       - unexpected value "!The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"

```

```yaml
- alert: "The map could not start WebGL: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4174/assets/WebGLRenderer-CvYmRMFw.js"
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { closeManagement, openRegistry, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  3   | 
  4   | async function begin(page: Page) {
  5   |   await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  6   |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  7   |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  8   |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  9   |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  10  |   await expect(page.getByRole('button', { name: 'Begin campaign', exact: true })).not.toBeVisible();
  11  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  12  | }
  13  | 
  14  | async function found(page: Page, name: string) {
  15  |   await selectFromRegistry(page, 'armies', /Hearth caravan/);
  16  |   await openSelectedOrders(page);
  17  |   await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(name);
  18  |   await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  19  |   await openRegistry(page, 'settlements');
  20  |   await expect(page.getByTestId('settlement-registry')).toContainText(name);
  21  | }
  22  | 
  23  | async function settings(page: Page) {
  24  |   await closeManagement(page);
  25  |   const menu = page.getByTestId('campaign-menu');
  26  |   if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  27  | }
  28  | 
  29  | async function save(page: Page) {
  30  |   await settings(page);
  31  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  32  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  33  | }
  34  | 
  35  | async function templates(page: Page) {
  36  |   const details = page.getByTestId('charter-templates');
  37  |   if (await details.getAttribute('open') === null) await details.locator(':scope > summary').click();
  38  |   return details;
  39  | }
  40  | 
  41  | test('production charter templates cross campaigns and browser reloads before explicit application and saved restoration', async ({ page }, testInfo) => {
  42  |   const errors: string[] = [];
  43  |   page.on('pageerror', error => errors.push(error.message));
  44  |   await page.goto('./');
  45  |   await begin(page);
  46  |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  47  |   await found(page, 'First Template Hearth');
  48  |   const group = page.getByTestId('group-charters');
  49  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  50  |   const focus = group.getByRole('combobox', { name: 'Charter focus', exact: true });
  51  |   const ceiling = group.getByRole('spinbutton', { name: 'Coin ceiling per hearth', exact: true });
  52  |   await focus.selectOption('wealth');
  53  |   await ceiling.fill('24');
  54  |   const library = await templates(page);
  55  |   const saved = library.getByRole('combobox', { name: 'Saved charter template', exact: true });
  56  |   await library.getByRole('textbox', { name: 'Template name', exact: true }).fill('Market works');
  57  |   await library.getByRole('button', { name: 'Save new template', exact: true }).click();
  58  |   await expect(saved.getByRole('option', { name: /Market works/ })).toHaveCount(1);
  59  |   const templateId = await saved.getByRole('option', { name: /Market works/ }).getAttribute('value');
  60  |   expect(templateId).toBeTruthy();
  61  |   await selectFromRegistry(page, 'settlements', 'First Template Hearth');
  62  |   await openSelectedOrders(page);
  63  |   await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('none');
  64  | 
  65  |   // The library belongs to this browser, so a genuinely new campaign can use it
  66  |   // without importing a campaign archive or issuing any template command.
  67  |   await settings(page);
  68  |   await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  69  |   await begin(page);
  70  |   await found(page, 'Second Template Hearth');
  71  |   await save(page);
  72  |   await page.reload();
  73  |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
> 74  |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  75  |   await openRegistry(page, 'settlements');
  76  |   await expect(page.getByTestId('settlement-registry')).toContainText('Second Template Hearth');
  77  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  78  |   await templates(page);
  79  |   await expect(saved.getByRole('option', { name: /Market works/ })).toHaveCount(1);
  80  |   await saved.selectOption(templateId!);
  81  |   await expect(focus).toHaveValue('works');
  82  |   await library.getByRole('button', { name: 'Recall template', exact: true }).click();
  83  |   await expect(focus).toHaveValue('wealth');
  84  |   await expect(ceiling).toHaveValue('24');
  85  |   await group.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
  86  |   await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  87  |   await selectFromRegistry(page, 'settlements', 'Second Template Hearth');
  88  |   await openSelectedOrders(page);
  89  |   await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  90  |   await save(page);
  91  |   await page.setViewportSize({ width: 390, height: 844 });
  92  |   await openRegistry(page, 'settlements');
  93  |   await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  94  |   await group.getByRole('button', { name: 'Revoke charters (1)', exact: true }).click();
  95  |   await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
  96  |   await selectFromRegistry(page, 'settlements', 'Second Template Hearth');
  97  |   await openSelectedOrders(page);
  98  |   await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('none');
  99  |   await settings(page);
  100 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  101 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  102 |   await selectFromRegistry(page, 'settlements', 'Second Template Hearth');
  103 |   await openSelectedOrders(page);
  104 |   await expect(page.getByTestId('settlement-charter').locator(':scope > summary')).toContainText('Wealth · 24 coin');
  105 |   await page.screenshot({ path: testInfo.outputPath('production-template-charter-restored-narrow.png') });
  106 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  107 |   expect(errors).toEqual([]);
  108 | });
  109 | 
```