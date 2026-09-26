import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 1366, height: 768, scale: 100 }, { width: 390, height: 844, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  test(`readable journal at ${dimensions.width}px and ${dimensions.scale}% text`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    const workers: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('worker', worker => workers.push(worker.url()));
    await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('updates/dispatches/');
    await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
    await page.getByRole('heading', { name: 'Theandril Dispatches', exact: true }).waitFor();
    // Exercise real lazy loading by scrolling to each visible image before the full-page capture.
    for (const image of await page.locator('img:visible').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(element => (element as HTMLImageElement).decode());
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath('explore-top.png') });
    await page.screenshot({ path: testInfo.outputPath('explore-full.png'), fullPage: true });
    await expect(page.locator('figure > figcaption').first()).toHaveCSS('font-size', /./);
    expect(await page.locator('figure > figcaption').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('no-such-dispatch');
    await page.getByRole('heading', { name: 'No dispatches found' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('no-results.png') });
    await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
    await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
    await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
    await expect(page.getByRole('heading', { level: 1, name: 'Keep a charter worth repeating' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
    await page.locator('.illustration-charter-templates-controls').scrollIntoViewIfNeeded();
    await page.locator('.illustration-charter-templates-controls > button > img').evaluate(image => (image as HTMLImageElement).decode());
    await page.locator('.illustration-charter-templates-controls').screenshot({ path: testInfo.outputPath('charter-templates-controls-illustration.png') });
    await page.getByRole('heading', { name: 'Another part of delegation' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
    expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
    expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
    await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
    expect(errors).toEqual([]);
    expect(workers).toEqual([]);
  });
}

test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  await page.goto('updates/dispatches/');
  await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  const measurements = await page.evaluate(() => {
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
      const s = channel / 255;
      return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
    }, 0);
    const ratio = (a: number[], b: number[]) => {
      const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (values[0]! + .05) / (values[1]! + .05);
    };
    return [
      ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
      ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
      ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
    ].map(([foregroundSelector, backgroundSelector]) => {
      const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
      const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
      const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
      // Paper's translucent wash is bounded against black and white underneath.
      // Multiply-blended walnut cannot be brighter than its background color.
      const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
      return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
    });
  });
  await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
});

test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  await page.goto('updates/dispatches/?dispatch=not-published');
  await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  await page.goto('updates/dispatches/#archive');
  await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('1 dispatch');
  await expect(page.locator('.dispatch-row')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('8 dispatches');
  await expect(page.locator('.dispatch-row')).toHaveCount(8);
});

test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  await page.goto('updates/dispatches/');
  await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  await expect(ledger).toContainText('observed supply');
  await expect(ledger).toContainText('1,902 headless tests');
  await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
});

test('a keyboard reader can enlarge a real image and return to the same control', async ({ page }) => {
  await page.goto('updates/dispatches/?dispatch=twenty-four-cultures');
  const trigger = page.getByRole('button', { name: 'Enlarge cultures image', exact: true });
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Image detail' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
  await expect(dialog.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

// Resolves under either the normal root server or the Pages-base journal harness.
test('public journal opens a permanent, refresh-safe campaign dispatch', async ({ page }) => {
  await page.goto('updates/dispatches/');
  await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=charter-templates$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Keep a charter worth repeating' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Keep a charter worth repeating' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Charter templates verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/3ed4a6c456c3e4130fddf35b44dfdf51034cc269/docs/development/2026-09-25-charter-templates/README.md');
  await page.getByRole('link', { name: 'A voyage needs stores for the way home', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Factual evidence review' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/b623c2c91d4d852cba710f2d996c28a6b1b5d624/docs/development/2026-09-23-fleet-provisions/factual-review.md');
  await page.getByRole('link', { name: 'A campaign worth keeping', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'A campaign worth keeping' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Post-fix review reconciliation' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/development/post-fix-review/summary.json');
  await page.getByRole('link', { name: 'All dispatches', exact: true }).click();
  await expect(page).toHaveURL(/updates\/dispatches\/#archive$/);
  await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  // Searching must keep the reader on the dispatches page, not send them to the site home.
  await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('archive');
  await expect(page).toHaveURL(/updates\/dispatches\/\?q=archive#archive$/);
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dispatches' })).toHaveAttribute('aria-current', 'page');
});
