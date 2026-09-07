import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const menu = (page: Page) => page.getByTestId('campaign-menu');
const summary = (page: Page) => menu(page).locator('summary');
const currentHash = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getStateHash());

async function begin(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260905');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
}

async function directlyBelowNavigation(page: Page, campaign: boolean) {
  await expect(menu(page)).toHaveCount(1);
  expect(await menu(page).evaluate((element, inCampaign) => {
    const previous = element.previousElementSibling;
    const next = element.nextElementSibling;
    return previous?.matches(inCampaign ? 'nav.campaign-tools' : 'header.masthead') &&
      next?.matches(inCampaign ? 'main.campaign' : 'main.landing');
  }, campaign)).toBe(true);
  await expect(menu(page)).toHaveCSS('position', 'static');
  const [above, disclosure, below] = await Promise.all([
    page.locator(campaign ? '.campaign-tools' : '.masthead').boundingBox(),
    menu(page).boundingBox(),
    page.locator(campaign ? 'main.campaign' : 'main.landing').boundingBox(),
  ]);
  expect(above).not.toBeNull(); expect(disclosure).not.toBeNull(); expect(below).not.toBeNull();
  expect(disclosure!.y).toBeGreaterThanOrEqual(above!.y + above!.height - 1);
  expect(below!.y).toBeGreaterThanOrEqual(disclosure!.y + disclosure!.height - 1);
}

async function reachable(control: Locator) {
  await control.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await expect(control).toBeVisible();
  expect(await control.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit === element || (hit !== null && element.contains(hit));
  })).toBe(true);
}

async function settledMenuGeometry(page: Page) {
  // Observe actual post-scroll layout across painted frames. Do not change styles,
  // hide the sticky footer, or force a repaint to conceal a compositing defect.
  return page.evaluate(async () => {
    await document.fonts.ready;
    const disclosure = document.querySelector<HTMLElement>('[data-testid="campaign-menu"]')!;
    const controls = [...disclosure.querySelector('.options-content')!.querySelectorAll<HTMLElement>('button,input,select')];
    const map = document.querySelector<HTMLElement>('.map-section')!;
    const bounds = (element: Element) => {
      const { x, y, width, height, bottom } = element.getBoundingClientRect();
      return { x, y, width, height, bottom };
    };
    let previous = '', stable = 0;
    for (let frame = 0; frame < 30; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const current = JSON.stringify([scrollX, scrollY, bounds(disclosure), bounds(map), controls.map(bounds)]);
      stable = current === previous ? stable + 1 : 0;
      previous = current;
      if (stable < 3) continue;
      const menuBounds = bounds(disclosure);
      return {
        scrollY, frames: frame + 1, menu: menuBounds, map: bounds(map),
        viewport: { width: innerWidth, height: innerHeight, devicePixelRatio,
          visual: visualViewport ? { offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop,
            pageLeft: visualViewport.pageLeft, pageTop: visualViewport.pageTop,
            width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale } : null },
        controls: controls.map(element => ({
          name: element.closest('label')?.firstChild?.textContent ?? element.textContent,
          ...bounds(element), insideMenu: element.getBoundingClientRect().bottom <= menuBounds.bottom,
        })),
        // Probe the band containing the alleged duplicate shortcut controls.
        // Map labels may legitimately intercept it; menu controls may not.
        belowMenuHits: [8, 30, 55, 78].flatMap(offset => [80, innerWidth - 80].map(x => {
          const y = menuBounds.bottom + offset, hit = document.elementFromPoint(x, y);
          return { x, y, tag: hit?.tagName ?? null, className: hit?.getAttribute('class') ?? null,
            isMenu: hit !== null && disclosure.contains(hit) };
        })),
      };
    }
    throw new Error('Campaign menu/scroll geometry did not settle across three consecutive frames.');
  });
}

test('top campaign disclosure works by keyboard and preserves real save, load, autosave and import controls', async ({ page }, testInfo) => {
  await page.goto('/');
  await directlyBelowNavigation(page, false);
  await summary(page).focus(); await page.keyboard.press('Enter');
  await expect(menu(page)).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(menu(page).getByRole('combobox', { name: 'Text scale', exact: true })).toBeFocused();
  await summary(page).focus(); await page.keyboard.press('Space');
  await expect(menu(page)).not.toHaveAttribute('open');

  await begin(page);
  await directlyBelowNavigation(page, true);
  await summary(page).focus(); await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(menu(page).getByRole('button', { name: 'Save campaign', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const saved = await currentHash(page);
  const downloadReady = page.waitForEvent('download');
  await menu(page).getByRole('button', { name: 'Export campaign', exact: true }).click();
  const download = await downloadReady;
  expect(download.suggestedFilename()).toMatch(/\.theandril$/);
  const path = await download.path();
  if (!path) throw new Error('The campaign export did not produce a file.');
  const exported = await readFile(path);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  const auto = await currentHash(page);
  expect(auto).not.toBe(saved);
  await menu(page).getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => currentHash(page)).toBe(saved);
  await menu(page).getByRole('button', { name: 'Restore autosave', exact: true }).click();
  await expect.poll(() => currentHash(page)).toBe(auto);
  const chooserReady = page.waitForEvent('filechooser');
  await menu(page).getByRole('button', { name: 'Import campaign', exact: true }).click();
  await (await chooserReady).setFiles({ name: 'menu-export.theandril', mimeType: 'application/gzip', buffer: exported });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect(await currentHash(page)).toBe(saved);
  await directlyBelowNavigation(page, true);
  await summary(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('top-campaign-menu-desktop.png') });
});

test('narrow touch settings stay in flow above setup and return to the unchanged campaign', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await begin(page);
    const hash = await currentHash(page);
    await summary(page).tap();
    await menu(page).getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
    await directlyBelowNavigation(page, true);
    // Compare ordinary user wheel scrolling before the programmatic focus/
    // scrolling stress below. Preserve both captures; a clean wheel capture
    // must not conceal an artifact in the later keyboard/touch sequence.
    const wheelTarget = (await menu(page).boundingBox())!.y;
    await page.mouse.move(380, 20);
    await page.mouse.wheel(0, wheelTarget);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(wheelTarget, 0);
    const wheelGeometry = await settledMenuGeometry(page);
    await writeFile(testInfo.outputPath('narrow-menu-wheel-geometry.json'), JSON.stringify(wheelGeometry, null, 2));
    await page.screenshot({ path: testInfo.outputPath('top-campaign-menu-narrow-wheel.png') });
    for (const name of ['Save campaign', 'Export campaign', 'Load campaign', 'Restore autosave', 'Import campaign', 'New campaign']) {
      const control = menu(page).getByRole('button', { name, exact: true });
      await reachable(control);
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    for (const name of ['End turn shortcut', 'Next army shortcut', 'Next settlement shortcut']) {
      const control = menu(page).getByRole('textbox', { name, exact: true });
      await expect(page.getByRole('textbox', { name, exact: true })).toHaveCount(1);
      await reachable(control);
      await control.tap();
      await expect(control).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await summary(page).evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: testInfo.outputPath('top-campaign-menu-narrow-before-settle.png') });
    const geometry = await settledMenuGeometry(page);
    expect(geometry.controls).toHaveLength(10);
    expect(geometry.controls.every(control => control.insideMenu)).toBe(true);
    expect(geometry.map.y).toBeGreaterThanOrEqual(geometry.menu.bottom - 1);
    expect(geometry.belowMenuHits.every(hit => !hit.isMenu)).toBe(true);
    const geometryPath = testInfo.outputPath('narrow-menu-geometry-and-hits.json');
    await writeFile(geometryPath, JSON.stringify(geometry, null, 2));
    await testInfo.attach('narrow-menu-geometry-and-hits', { path: geometryPath, contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath('top-campaign-menu-narrow.png') });
    const canvasPixels = await page.evaluate(() => new Promise<string>(resolve => requestAnimationFrame(() => {
      resolve(document.querySelector<HTMLCanvasElement>('[data-testid="map-container"] canvas')!.toDataURL());
    })));
    await writeFile(testInfo.outputPath('menu-map-canvas-pixels.png'), Buffer.from(canvasPixels.split(',')[1]!, 'base64'));
    const captureSession = await context.newCDPSession(page);
    const viewCapture = await captureSession.send('Page.captureScreenshot', { format: 'png', fromSurface: false, captureBeyondViewport: false });
    await writeFile(testInfo.outputPath('menu-cdp-view-capture.png'), Buffer.from(viewCapture.data, 'base64'));
    await captureSession.detach();
    await menu(page).getByRole('button', { name: 'New campaign', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Establish your campaign', exact: true })).toBeVisible();
    await directlyBelowNavigation(page, false);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    expect(await currentHash(page)).toBe(hash);
    await page.getByRole('button', { name: 'Return to campaign', exact: true }).tap();
    await directlyBelowNavigation(page, true);
    expect(await currentHash(page)).toBe(hash);
    await summary(page).tap();
    await expect(menu(page)).not.toHaveAttribute('open');
    await expect(page.getByTestId('map-container')).toBeVisible();
  } finally { await context.close(); }
});

test('new campaign generation can be cancelled without losing the existing worker or campaign', async ({ page }) => {
  await begin(page);
  const hash = await currentHash(page);
  await summary(page).click();
  await menu(page).getByRole('button', { name: 'New campaign', exact: true }).click();
  await directlyBelowNavigation(page, false);
  // Hold only the replacement worker's real script load, making cancellation deterministic
  // even on fast hosts. No simulation messages, observations or commands are fabricated.
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let arrived!: () => void;
  const requested = new Promise<void>(resolve => { arrived = resolve; });
  await page.route(/\/simulation\.worker\.ts(?:\?|$)/, async route => {
    arrived(); await held;
    await route.continue();
  });
  try {
    await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('legendary');
    await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
    await requested;
    await expect(menu(page).getByRole('button', { name: 'Save campaign', exact: true })).toBeDisabled();
    await expect(menu(page).getByRole('button', { name: 'New campaign', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel generation', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('World generation cancelled');
    await expect(page.getByRole('button', { name: 'Begin campaign', exact: true })).toBeEnabled();
    expect(await currentHash(page)).toBe(hash);
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  await directlyBelowNavigation(page, true);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await currentHash(page)).not.toBe(hash);
});
