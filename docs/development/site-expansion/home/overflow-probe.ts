import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(process.env.PROBE_URL ?? 'http://127.0.0.1:4181/Theandril/updates/');
await page.evaluate(() => { document.documentElement.style.fontSize = '130%'; });
await page.waitForTimeout(300);
const facts = await page.evaluate(() => {
  const out: unknown[] = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (el.scrollWidth > Math.ceil(r.width) + 2 || r.right > innerWidth + 1) out.push([el.tagName, (el as HTMLElement).className || el.id, Math.round(r.width), el.scrollWidth, (el.textContent || '').slice(0, 50)]);
  }
  return { innerWidth, scrollWidth: document.documentElement.scrollWidth, overflowing: out.slice(0, 40) };
});
console.log(JSON.stringify(facts, null, 1));
await browser.close();
