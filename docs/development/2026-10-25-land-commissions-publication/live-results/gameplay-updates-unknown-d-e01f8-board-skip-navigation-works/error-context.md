# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> unknown dispatch links fail honestly and keyboard skip navigation works
- Location: tests/gameplay/updates.spec.ts:83:1

# Error details

```
Error: page.goto: net::ERR_NETWORK_CHANGED at https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=not-published
Call log:
  - navigating to "https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=not-published", waiting until "load"

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
  33  |     await expect(page.getByRole('heading', { level: 1, name: 'Give land work a budget' })).toBeVisible();
  34  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  35  |     for (const id of ['land-commission-summary']) {
  36  |       await page.locator(`.illustration-${id}`).scrollIntoViewIfNeeded();
  37  |       await page.locator(`.illustration-${id} > button > img`).evaluate(image => (image as HTMLImageElement).decode());
  38  |       await page.locator(`.illustration-${id}`).screenshot({ path: testInfo.outputPath(`${id}-illustration.png`) });
  39  |     }
  40  |     await page.getByRole('heading', { name: 'Watch two paid works complete' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  41  |     await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
  42  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  43  |     const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
  44  |     expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
  45  |     expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
  46  |     await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
  47  |     expect(errors).toEqual([]);
  48  |     expect(workers).toEqual([]);
  49  |   });
  50  | }
  51  | 
  52  | test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  53  |   await page.goto('updates/dispatches/');
  54  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  55  |   const measurements = await page.evaluate(() => {
  56  |     const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  57  |     const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
  58  |       const s = channel / 255;
  59  |       return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
  60  |     }, 0);
  61  |     const ratio = (a: number[], b: number[]) => {
  62  |       const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  63  |       return (values[0]! + .05) / (values[1]! + .05);
  64  |     };
  65  |     return [
  66  |       ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
  67  |       ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
  68  |       ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
  69  |     ].map(([foregroundSelector, backgroundSelector]) => {
  70  |       const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
  71  |       const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
  72  |       const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
  73  |       // Paper's translucent wash is bounded against black and white underneath.
  74  |       // Multiply-blended walnut cannot be brighter than its background color.
  75  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  76  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  77  |     });
  78  |   });
  79  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  80  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  81  | });
  82  | 
  83  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
> 84  |   await page.goto('updates/dispatches/?dispatch=not-published');
      |              ^ Error: page.goto: net::ERR_NETWORK_CHANGED at https://erikburdett.github.io/Theandril/updates/dispatches/?dispatch=not-published
  85  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  86  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  87  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  88  |   await page.keyboard.press('Tab');
  89  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  90  |   await page.keyboard.press('Enter');
  91  |   await expect(page.getByRole('main')).toBeFocused();
  92  | });
  93  | 
  94  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  95  |   await page.goto('updates/dispatches/#archive');
  96  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  97  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  98  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  99  |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  100 |   await page.reload();
  101 |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  102 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  103 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  104 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  105 |   await expect(page.getByRole('status')).toHaveText('22 dispatches');
  106 |   await expect(page.locator('.dispatch-row')).toHaveCount(22);
  107 | });
  108 | 
  109 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  110 |   await page.goto('updates/dispatches/');
  111 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  112 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  113 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  114 |   await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  115 |   await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  116 |   await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  117 |   await expect(ledger).toContainText('player travel never resumes itself');
  118 |   await expect(ledger).toContainText('2,461');
  119 |   await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  120 |   await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  121 |   await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  122 |   await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
  123 | });
  124 | 
  125 | test('a keyboard reader can enlarge a real image and return to the same control', async ({ page }) => {
  126 |   await page.goto('updates/dispatches/?dispatch=twenty-four-cultures');
  127 |   const trigger = page.getByRole('button', { name: 'Enlarge cultures image', exact: true });
  128 |   await expect(trigger).toBeVisible();
  129 |   await trigger.focus();
  130 |   await page.keyboard.press('Enter');
  131 |   const dialog = page.getByRole('dialog', { name: 'Image detail' });
  132 |   await expect(dialog).toBeVisible();
  133 |   await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
  134 |   await expect(dialog.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
  135 |   await page.keyboard.press('Escape');
  136 |   await expect(dialog).not.toBeVisible();
  137 |   await expect(trigger).toBeFocused();
  138 | });
  139 | 
  140 | // Resolves under either the normal root server or the Pages-base journal harness.
  141 | test('public journal opens a permanent, refresh-safe campaign dispatch', async ({ page }) => {
  142 |   await page.goto('updates/dispatches/');
  143 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  144 |   await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  145 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=land-commissions$/);
  146 |   await expect(page.getByRole('heading', { level: 1, name: 'Give land work a budget' })).toBeVisible();
  147 |   await page.reload();
  148 |   await expect(page.getByRole('heading', { level: 1, name: 'Give land work a budget' })).toBeVisible();
  149 |   await expect(page.getByRole('link', { name: 'Land commission verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-25-land-commissions/README.md');
  150 |   await page.getByRole('link', { name: 'Keep growing hearths at work', exact: true }).click();
  151 |   await expect(page.getByRole('link', { name: 'Worker stewardship verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/97b248ed596c931f01d0df66d60fcf25f819eaef/docs/development/2026-10-25-worker-stewardship/README.md');
  152 |   await page.getByRole('link', { name: 'Give the order, then review each result', exact: true }).click();
  153 |   await expect(page.getByRole('link', { name: 'Posting and charter intent checks' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/670a18af843f95c80198a255e1894a708c5f1391/docs/development/2026-10-25-group-intent/README.md');
  154 |   await page.getByRole('link', { name: 'Find empty queues and waiting charters', exact: true }).click();
  155 |   await expect(page.getByRole('link', { name: 'Settlement order implementation and acceptance' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/5da6b62e9d9522d973f87b0c7022ada370636dcc/docs/development/2026-10-25-settlement-order-filters/README.md');
  156 |   await page.getByRole('link', { name: 'Change patrol policies across the checked companies', exact: true }).click();
  157 |   await expect(page.getByRole('link', { name: 'Group patrol implementation and acceptance' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8d880eb60cdca549d5ff1086ef95e095e81feea5/docs/development/2026-10-24-group-patrols/README.md');
  158 |   await page.getByRole('link', { name: 'Find waiting orders in a crowded roster', exact: true }).click();
  159 |   await expect(page.getByRole('link', { name: 'Registry implementation and acceptance' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/da12978fb596a73a7fddcfb8e914efb7924efbc2/docs/development/2026-10-24-army-order-filters/README.md');
  160 |   await page.getByRole('link', { name: 'Before peace decides the race', exact: true }).click();
  161 |   await expect(page.getByRole('link', { name: 'Counterplay implementation and retained evidence' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/2026-10-24-project-counterplay/README.md');
  162 |   await page.getByRole('link', { name: 'When a home patrol loses its hearth', exact: true }).click();
  163 |   await expect(page.getByRole('link', { name: 'Retirement implementation and retained evidence' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/68ef5fa7e524a3cd4e7e60fd7bbdd9037a6bc120/docs/development/2026-10-24-patrol-retirement/README.md');
  164 |   await page.getByRole('link', { name: 'Keep the watch moving', exact: true }).click();
  165 |   await expect(page.getByRole('link', { name: 'Recovery evidence and retained failures' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrol-recovery/README.md');
  166 |   await page.getByRole('link', { name: 'Hold the frontier, provision the crossing', exact: true }).click();
  167 |   await expect(page.getByRole('link', { name: 'Implementation and retained failures' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/f33a816f3a853229695b902af007e4e3f3547275/docs/development/2026-09-27-reinforcement-logistics/README.md');
  168 |   await page.getByRole('link', { name: 'A voyage needs stores for the way home', exact: true }).click();
  169 |   await expect(page.getByRole('link', { name: 'Factual evidence review' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/b623c2c91d4d852cba710f2d996c28a6b1b5d624/docs/development/2026-09-23-fleet-provisions/factual-review.md');
  170 |   await page.getByRole('link', { name: 'A campaign worth keeping', exact: true }).click();
  171 |   await expect(page.getByRole('heading', { level: 1, name: 'A campaign worth keeping' })).toBeVisible();
  172 |   await expect(page.getByRole('link', { name: 'Post-fix review reconciliation' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/development/post-fix-review/summary.json');
  173 |   await page.getByRole('link', { name: 'All dispatches', exact: true }).click();
  174 |   await expect(page).toHaveURL(/updates\/dispatches\/#archive$/);
  175 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  176 |   // Searching must keep the reader on the dispatches page, not send them to the site home.
  177 |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('archive');
  178 |   await expect(page).toHaveURL(/updates\/dispatches\/\?q=archive#archive$/);
  179 |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dispatches' })).toHaveAttribute('aria-current', 'page');
  180 | });
  181 | 
```