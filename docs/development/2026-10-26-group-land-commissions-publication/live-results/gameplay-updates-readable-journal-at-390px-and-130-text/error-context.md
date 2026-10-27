# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> readable journal at 390px and 130% text
- Location: tests/gameplay/updates.spec.ts:6:3

# Error details

```
Error: page.goto: net::ERR_NETWORK_CHANGED at https://erikburdett.github.io/Theandril/updates/dispatches/
Call log:
  - navigating to "https://erikburdett.github.io/Theandril/updates/dispatches/", waiting until "load"

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
  1   | import { writeFile } from 'node:fs/promises';
  2   | import { expect, test } from '@playwright/test';
  3   | import { dispatches } from '../../apps/web/src/updates/content';
  4   | 
  5   | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 1366, height: 768, scale: 100 }, { width: 390, height: 844, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  6   |   test(`readable journal at ${dimensions.width}px and ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  7   |     const errors: string[] = [];
  8   |     const workers: string[] = [];
  9   |     page.on('pageerror', error => errors.push(error.message));
  10  |     page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  11  |     page.on('worker', worker => workers.push(worker.url()));
  12  |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  13  |     await page.emulateMedia({ reducedMotion: 'reduce' });
> 14  |     await page.goto('updates/dispatches/');
      |                ^ Error: page.goto: net::ERR_NETWORK_CHANGED at https://erikburdett.github.io/Theandril/updates/dispatches/
  15  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  16  |     await page.getByRole('heading', { name: 'Theandril Dispatches', exact: true }).waitFor();
  17  |     // Exercise real lazy loading by scrolling to each visible image before the full-page capture.
  18  |     for (const image of await page.locator('img:visible').all()) {
  19  |       await image.scrollIntoViewIfNeeded();
  20  |       await image.evaluate(element => (element as HTMLImageElement).decode());
  21  |     }
  22  |     await page.evaluate(() => window.scrollTo(0, 0));
  23  |     await page.screenshot({ path: testInfo.outputPath('explore-top.png') });
  24  |     await page.screenshot({ path: testInfo.outputPath('explore-full.png'), fullPage: true });
  25  |     await expect(page.locator('figure > figcaption').first()).toHaveCSS('font-size', /./);
  26  |     expect(await page.locator('figure > figcaption').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  27  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  28  |     await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('no-such-dispatch');
  29  |     await page.getByRole('heading', { name: 'No dispatches found' }).scrollIntoViewIfNeeded();
  30  |     await page.screenshot({ path: testInfo.outputPath('no-results.png') });
  31  |     await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  32  |     await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  33  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  34  |     await expect(page.getByRole('heading', { level: 1, name: 'Give several hearths a land budget' })).toBeVisible();
  35  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  36  |     for (const id of ['group-land-budget']) {
  37  |       await page.locator(`.illustration-${id}`).scrollIntoViewIfNeeded();
  38  |       await page.locator(`.illustration-${id} > button > img`).evaluate(image => (image as HTMLImageElement).decode());
  39  |       await page.locator(`.illustration-${id}`).screenshot({ path: testInfo.outputPath(`${id}-illustration.png`) });
  40  |     }
  41  |     await page.getByRole('heading', { name: 'Permission is not a purchase' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  42  |     await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
  43  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  44  |     const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
  45  |     expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
  46  |     expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
  47  |     await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
  48  |     expect(errors).toEqual([]);
  49  |     expect(workers).toEqual([]);
  50  |   });
  51  | }
  52  | 
  53  | test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  54  |   await page.goto('updates/dispatches/');
  55  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  56  |   const measurements = await page.evaluate(() => {
  57  |     const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  58  |     const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
  59  |       const s = channel / 255;
  60  |       return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
  61  |     }, 0);
  62  |     const ratio = (a: number[], b: number[]) => {
  63  |       const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  64  |       return (values[0]! + .05) / (values[1]! + .05);
  65  |     };
  66  |     return [
  67  |       ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
  68  |       ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
  69  |       ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
  70  |     ].map(([foregroundSelector, backgroundSelector]) => {
  71  |       const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
  72  |       const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
  73  |       const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
  74  |       // Paper's translucent wash is bounded against black and white underneath.
  75  |       // Multiply-blended walnut cannot be brighter than its background color.
  76  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  77  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  78  |     });
  79  |   });
  80  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  81  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  82  | });
  83  | 
  84  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  85  |   await page.goto('updates/dispatches/?dispatch=not-published');
  86  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  87  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  88  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  89  |   await page.keyboard.press('Tab');
  90  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  91  |   await page.keyboard.press('Enter');
  92  |   await expect(page.getByRole('main')).toBeFocused();
  93  | });
  94  | 
  95  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  96  |   await page.goto('updates/dispatches/#archive');
  97  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  98  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  99  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  100 |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  101 |   await page.reload();
  102 |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  103 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  104 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  105 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  106 |   await expect(page.getByRole('status')).toHaveText(`${dispatches.length} dispatches`);
  107 |   await expect(page.locator('.dispatch-row')).toHaveCount(dispatches.length);
  108 | });
  109 | 
  110 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  111 |   await page.goto('updates/dispatches/');
  112 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  113 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  114 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
```