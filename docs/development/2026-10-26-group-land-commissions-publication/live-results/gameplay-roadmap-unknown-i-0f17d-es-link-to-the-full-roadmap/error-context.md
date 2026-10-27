# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/roadmap.spec.ts >> unknown item links recover honestly and dispatches link to the full roadmap
- Location: tests/gameplay/roadmap.spec.ts:133:1

# Error details

```
Error: page.goto: net::ERR_NETWORK_CHANGED at https://erikburdett.github.io/Theandril/updates/roadmap/?item=%3Cscript%3E&status=completed
Call log:
  - navigating to "https://erikburdett.github.io/Theandril/updates/roadmap/?item=%3Cscript%3E&status=completed", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "Your connection was interrupted" [level=1] [ref=e7]
    - paragraph [ref=e8]: A network change was detected.
    - generic [ref=e9]: ERR_NETWORK_CHANGED
  - button "Reload" [ref=e12] [cursor=pointer]
```

# Test source

```ts
  34  |   expect(errors).toEqual([]);
  35  | });
  36  | 
  37  | test('status and acceptance search survive refresh, reset cleanly and preserve the release check', async ({ page }) => {
  38  |   await page.goto('updates/roadmap/');
  39  |   const pending = page.getByRole('button', { name: 'Pending', exact: true });
  40  |   await pending.focus();
  41  |   await page.keyboard.press('Enter');
  42  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  43  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  44  |   await page.getByRole('searchbox', { name: 'Search roadmap' }).fill('authoritative');
  45  |   await expect(page.locator('.roadmap-item')).toHaveCount(1);
  46  |   await expect(page).toHaveURL(/q=authoritative&status=pending#roadmap-items$/);
  47  |   await page.reload();
  48  |   await expect(page.getByRole('searchbox', { name: 'Search roadmap' })).toHaveValue('authoritative');
  49  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  50  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  51  |   await expect(page.getByRole('heading', { name: 'No roadmap items found' })).toBeVisible();
  52  |   await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  53  |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  54  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  55  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  56  | });
  57  | 
  58  | test('an item permalink opens its evidence, survives refresh and returns to the filtered record', async ({ page }) => {
  59  |   await page.goto('updates/roadmap/?status=pending');
  60  |   await page.getByRole('link', { name: 'Build authoritative online campaigns', exact: true }).click();
  61  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  62  |   const item = page.locator('#roadmap-online-campaigns');
  63  |   await expect(item).toBeFocused();
  64  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  65  |   await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  66  |   await expect(item.getByRole('link', { name: 'Implementation status', exact: true })).toHaveAttribute('href', /\/blob\/[a-f0-9]{40}\/docs\/IMPLEMENTATION_STATUS.md$/);
  67  |   await page.reload();
  68  |   await expect(item).toBeFocused();
  69  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  70  |   await page.goBack();
  71  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  72  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(entry => entry.status === 'pending').length);
  73  | });
  74  | 
  75  | test('same-document Back and Forward restore filters and linked-item evidence', async ({ page }) => {
  76  |   await page.goto('updates/roadmap/');
  77  |   await page.getByRole('link', { name: /Complete the playable systems/ }).click();
  78  |   await expect(page).toHaveURL(/#current-work$/);
  79  |   await page.getByRole('button', { name: 'Pending', exact: true }).click();
  80  |   await expect(page).toHaveURL(/\?status=pending#roadmap-items$/);
  81  |   await page.goBack();
  82  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  83  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  84  |   await page.goForward();
  85  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  86  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  87  | 
  88  |   await page.goto('updates/roadmap/?item=online-campaigns#roadmap-online-campaigns');
  89  |   const item = page.locator('#roadmap-online-campaigns');
  90  |   await item.locator('summary').click();
  91  |   await expect(item.locator('details')).not.toHaveAttribute('open', '');
  92  |   await item.getByRole('link', { name: 'Gate M', exact: true }).click();
  93  |   await expect(page.locator('#gate-M')).toBeInViewport();
  94  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  95  |   await expect(item).toHaveCount(0);
  96  |   await page.goBack();
  97  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  98  |   await expect(item).toBeFocused();
  99  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  100 |   await page.goForward();
  101 |   await expect(page.getByRole('button', { name: 'Completed', exact: true })).toHaveAttribute('aria-pressed', 'true');
  102 |   await expect(item).toHaveCount(0);
  103 | });
  104 | 
  105 | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  106 |   test(`roadmap keyboard and layout at ${dimensions.width}px / ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  107 |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  108 |     await page.goto('updates/roadmap/');
  109 |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  110 |     await page.keyboard.press('Tab');
  111 |     await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  112 |     await page.keyboard.press('Enter');
  113 |     await expect(page.getByRole('main')).toBeFocused();
  114 |     await page.screenshot({ path: testInfo.outputPath('roadmap-top.png') });
  115 |     const item = page.locator('#roadmap-campaign-safety-review');
  116 |     const summary = item.locator('summary');
  117 |     await summary.focus();
  118 |     await page.keyboard.press('Enter');
  119 |     await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  120 |     await item.screenshot({ path: testInfo.outputPath('roadmap-open-item.png') });
  121 |     await page.keyboard.press('Space');
  122 |     await expect(item.locator('details')).not.toHaveAttribute('open', '');
  123 |     await expect(summary).toBeFocused();
  124 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  125 |     await page.getByRole('button', { name: 'Pending', exact: true }).click();
  126 |     await page.getByRole('link', { name: /Build the missing release systems/ }).click();
  127 |     await expect(page.locator('#missing-systems')).toBeInViewport();
  128 |     await page.screenshot({ path: testInfo.outputPath('roadmap-pending.png') });
  129 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  130 |   });
  131 | }
  132 | 
  133 | test('unknown item links recover honestly and dispatches link to the full roadmap', async ({ page }) => {
> 134 |   await page.goto('updates/roadmap/?item=%3Cscript%3E&status=completed');
      |              ^ Error: page.goto: net::ERR_NETWORK_CHANGED at https://erikburdett.github.io/Theandril/updates/roadmap/?item=%3Cscript%3E&status=completed
  135 |   await expect(page.getByRole('heading', { name: 'That roadmap item is not in this record' })).toBeVisible();
  136 |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  137 |   await page.getByRole('button', { name: 'Reset search & filters' }).click();
  138 |   await expect(page.getByRole('heading', { name: 'That roadmap item is not in this record' })).toHaveCount(0);
  139 |   await page.goto('updates/dispatches/#scope');
  140 |   await page.getByRole('link', { name: 'Open the full roadmap' }).click();
  141 |   await expect(page.getByRole('heading', { level: 1, name: 'Theandril Roadmap' })).toBeVisible();
  142 | });
  143 | 
```