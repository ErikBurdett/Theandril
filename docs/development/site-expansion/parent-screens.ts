import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const out = 'docs/development/site-expansion/parent-screens';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--enable-unsafe-swiftshader'] });
const origin = 'http://127.0.0.1:4181/Theandril/';
const shots: [string, string, number][] = [
  ['home', 'updates/', 1440], ['home-mobile', 'updates/', 390],
  ['dispatches', 'updates/dispatches/', 1440],
  ['lore-shelf', 'updates/lore/', 1440], ['lore-chapter', 'updates/lore/?book=broken-roads&chapter=vi-the-reckoning', 1440],
  ['lore-bible', 'updates/lore/?book=faction-bible', 1440],
  ['compendium', 'updates/compendium/', 1440], ['compendium-culture', 'updates/compendium/?culture=faction.vesper_court', 1440],
  ['compendium-unit', 'updates/compendium/?unit=unit.heavy_infantry', 1440], ['compendium-mobile', 'updates/compendium/?culture=faction.sable_steppe', 390],
];
for (const [name, path, width] of shots) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1000 } });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(origin + path, { waitUntil: 'networkidle' });
  if (width === 390) await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
  await page.waitForTimeout(400);
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent();
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  console.log(JSON.stringify({ name, title, h1: h1?.trim(), overflow: scroll, errors }));
  await page.close();
}
await browser.close();
