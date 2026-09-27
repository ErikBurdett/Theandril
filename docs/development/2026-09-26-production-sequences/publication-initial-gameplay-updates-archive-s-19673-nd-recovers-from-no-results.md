# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> archive search combines topic filters, survives refresh and recovers from no results
- Location: tests/gameplay/updates.spec.ts:92:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('status')
Expected: "9 dispatches"
Received: "10 dispatches"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByRole('status') with timeout 5000ms
  - waiting for getByRole('status')
    14 × locator resolved to <p role="status" aria-live="polite">10 dispatches</p>
       - unexpected value "10 dispatches"

```

```yaml
- status: 10 dispatches
```

# Test source

```ts
  3   | 
  4   | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 1366, height: 768, scale: 100 }, { width: 390, height: 844, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  5   |   test(`readable journal at ${dimensions.width}px and ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  6   |     const errors: string[] = [];
  7   |     const workers: string[] = [];
  8   |     page.on('pageerror', error => errors.push(error.message));
  9   |     page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  10  |     page.on('worker', worker => workers.push(worker.url()));
  11  |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  12  |     await page.emulateMedia({ reducedMotion: 'reduce' });
  13  |     await page.goto('updates/dispatches/');
  14  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  15  |     await page.getByRole('heading', { name: 'Theandril Dispatches', exact: true }).waitFor();
  16  |     // Exercise real lazy loading by scrolling to each visible image before the full-page capture.
  17  |     for (const image of await page.locator('img:visible').all()) {
  18  |       await image.scrollIntoViewIfNeeded();
  19  |       await image.evaluate(element => (element as HTMLImageElement).decode());
  20  |     }
  21  |     await page.evaluate(() => window.scrollTo(0, 0));
  22  |     await page.screenshot({ path: testInfo.outputPath('explore-top.png') });
  23  |     await page.screenshot({ path: testInfo.outputPath('explore-full.png'), fullPage: true });
  24  |     await expect(page.locator('figure > figcaption').first()).toHaveCSS('font-size', /./);
  25  |     expect(await page.locator('figure > figcaption').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  26  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  27  |     await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('no-such-dispatch');
  28  |     await page.getByRole('heading', { name: 'No dispatches found' }).scrollIntoViewIfNeeded();
  29  |     await page.screenshot({ path: testInfo.outputPath('no-results.png') });
  30  |     await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  31  |     await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  32  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  33  |     await expect(page.getByRole('heading', { level: 1, name: 'Queue a plan across your hearths' })).toBeVisible();
  34  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  35  |     await page.locator('.illustration-production-sequence-results').scrollIntoViewIfNeeded();
  36  |     await page.locator('.illustration-production-sequence-results > button > img').evaluate(image => (image as HTMLImageElement).decode());
  37  |     await page.locator('.illustration-production-sequence-results').screenshot({ path: testInfo.outputPath('production-sequence-results-illustration.png') });
  38  |     await page.getByRole('heading', { name: 'Remember the plan separately' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  39  |     await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
  40  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  41  |     const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
  42  |     expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
  43  |     expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
  44  |     await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
  45  |     expect(errors).toEqual([]);
  46  |     expect(workers).toEqual([]);
  47  |   });
  48  | }
  49  | 
  50  | test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  51  |   await page.goto('updates/dispatches/');
  52  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  53  |   const measurements = await page.evaluate(() => {
  54  |     const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  55  |     const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
  56  |       const s = channel / 255;
  57  |       return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
  58  |     }, 0);
  59  |     const ratio = (a: number[], b: number[]) => {
  60  |       const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  61  |       return (values[0]! + .05) / (values[1]! + .05);
  62  |     };
  63  |     return [
  64  |       ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
  65  |       ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
  66  |       ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
  67  |     ].map(([foregroundSelector, backgroundSelector]) => {
  68  |       const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
  69  |       const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
  70  |       const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
  71  |       // Paper's translucent wash is bounded against black and white underneath.
  72  |       // Multiply-blended walnut cannot be brighter than its background color.
  73  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  74  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  75  |     });
  76  |   });
  77  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  78  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  79  | });
  80  | 
  81  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  82  |   await page.goto('updates/dispatches/?dispatch=not-published');
  83  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  84  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  85  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  86  |   await page.keyboard.press('Tab');
  87  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  88  |   await page.keyboard.press('Enter');
  89  |   await expect(page.getByRole('main')).toBeFocused();
  90  | });
  91  | 
  92  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  93  |   await page.goto('updates/dispatches/#archive');
  94  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  95  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  96  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  97  |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  98  |   await page.reload();
  99  |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  100 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  101 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  102 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
> 103 |   await expect(page.getByRole('status')).toHaveText('9 dispatches');
      |                                          ^ Error: expect(locator).toHaveText(expected) failed
  104 |   await expect(page.locator('.dispatch-row')).toHaveCount(9);
  105 | });
  106 | 
  107 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  108 |   await page.goto('updates/dispatches/');
  109 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  110 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  111 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  112 |   await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  113 |   await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  114 |   await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  115 |   await expect(ledger).toContainText('observed supply');
  116 |   await expect(ledger).toContainText('1,941 headless tests');
  117 |   await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  118 |   await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  119 |   await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  120 |   await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
  121 | });
  122 | 
  123 | test('a keyboard reader can enlarge a real image and return to the same control', async ({ page }) => {
  124 |   await page.goto('updates/dispatches/?dispatch=twenty-four-cultures');
  125 |   const trigger = page.getByRole('button', { name: 'Enlarge cultures image', exact: true });
  126 |   await expect(trigger).toBeVisible();
  127 |   await trigger.focus();
  128 |   await page.keyboard.press('Enter');
  129 |   const dialog = page.getByRole('dialog', { name: 'Image detail' });
  130 |   await expect(dialog).toBeVisible();
  131 |   await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
  132 |   await expect(dialog.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
  133 |   await page.keyboard.press('Escape');
  134 |   await expect(dialog).not.toBeVisible();
  135 |   await expect(trigger).toBeFocused();
  136 | });
  137 | 
  138 | // Resolves under either the normal root server or the Pages-base journal harness.
  139 | test('public journal opens a permanent, refresh-safe campaign dispatch', async ({ page }) => {
  140 |   await page.goto('updates/dispatches/');
  141 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  142 |   await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  143 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=production-sequences$/);
  144 |   await expect(page.getByRole('heading', { level: 1, name: 'Queue a plan across your hearths' })).toBeVisible();
  145 |   await page.reload();
  146 |   await expect(page.getByRole('heading', { level: 1, name: 'Queue a plan across your hearths' })).toBeVisible();
  147 |   await expect(page.getByRole('link', { name: 'Production sequences verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-26-production-sequences/README.md');
  148 |   await page.getByRole('link', { name: 'A voyage needs stores for the way home', exact: true }).click();
  149 |   await expect(page.getByRole('link', { name: 'Factual evidence review' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/b623c2c91d4d852cba710f2d996c28a6b1b5d624/docs/development/2026-09-23-fleet-provisions/factual-review.md');
  150 |   await page.getByRole('link', { name: 'A campaign worth keeping', exact: true }).click();
  151 |   await expect(page.getByRole('heading', { level: 1, name: 'A campaign worth keeping' })).toBeVisible();
  152 |   await expect(page.getByRole('link', { name: 'Post-fix review reconciliation' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/development/post-fix-review/summary.json');
  153 |   await page.getByRole('link', { name: 'All dispatches', exact: true }).click();
  154 |   await expect(page).toHaveURL(/updates\/dispatches\/#archive$/);
  155 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  156 |   // Searching must keep the reader on the dispatches page, not send them to the site home.
  157 |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('archive');
  158 |   await expect(page).toHaveURL(/updates\/dispatches\/\?q=archive#archive$/);
  159 |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dispatches' })).toHaveAttribute('aria-current', 'page');
  160 | });
  161 | 
```