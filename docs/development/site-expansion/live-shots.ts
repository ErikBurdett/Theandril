import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] });
const out = '/home/telephoneheater/.hermes/artifacts';
for (const [name, path] of [['home', 'updates/'], ['lore', 'updates/lore/?book=broken-roads&chapter=iv-the-age-of-crowns'], ['compendium', 'updates/compendium/?culture=faction.vesper_court']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`https://erikburdett.github.io/Theandril/${path}`, { waitUntil: 'networkidle' });
  if (name === 'compendium') await page.locator('.unit-grid').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/theandril-site-0643cc8-${name}-live.png` });
  console.log(name, await page.title());
  await page.close();
}
await browser.close();
