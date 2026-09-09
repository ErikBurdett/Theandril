import { expect, type Page, type TestInfo } from '@playwright/test';

/** Inspect screenshot PNG pixels, not WebGL readPixels or renderer counters.
 * Call with local detail focused and dialogs/overview menu closed. The whole
 * sample must hit the original visible canvas, so DOM artwork cannot pass it. */
export async function expectLocalMapPixels(page: Page, info: TestInfo, name: string) {
  const canvas = page.locator('[data-testid=map-container] canvas');
  await expect(canvas).toBeVisible();
  // Enlarged text can move the overview trigger across the exact centre crop.
  // Keep the same 14,400-pixel sample and thresholds, but locate an unobscured
  // nearby patch rather than accidentally testing DOM artwork as map content.
  const clip = await canvas.evaluate(element => {
    const box = element.getBoundingClientRect();
    for (const dy of [0, -10, 10, -20, 20, -30, 30, -40, 40]) {
      const rect = { x: Math.floor(box.x + box.width / 2 - 60), y: Math.floor(box.y + box.height / 2 - 60 + dy), width: 120, height: 120 };
      if ([0, 20, 40, 60, 80, 100, 119].every(x => [0, 20, 40, 60, 80, 100, 119].every(y => document.elementFromPoint(rect.x + x, rect.y + y) === element))) return rect;
    }
    return null;
  });
  expect(clip, 'A complete 120×120 local canvas patch must be unobscured').not.toBeNull();
  if (!clip) throw new Error('No unobscured local map sample');
  let png: Buffer | undefined;
  let pixels: { colors: number; nonDominantFraction: number; dominantRgb: number[] } | undefined;
  await expect.poll(async () => {
    png = await page.screenshot({ clip, animations: 'disabled' });
    pixels = await page.evaluate(async encoded => {
      const binary = atob(encoded);
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0); image.close();
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      const colors = new Map<number, number>();
      for (let index = 0; index < data.length; index += 4) {
        const rgb = (data[index]! << 16) | (data[index + 1]! << 8) | data[index + 2]!;
        colors.set(rgb, (colors.get(rgb) ?? 0) + 1);
      }
      const [dominant, count] = [...colors].sort((a, b) => b[1] - a[1])[0]!;
      return { colors: colors.size, nonDominantFraction: 1 - count / (canvas.width * canvas.height), dominantRgb: [dominant >> 16, (dominant >> 8) & 255, dominant & 255] };
    }, png.toString('base64'));
    return pixels.colors > 100 && pixels.nonDominantFraction > .2;
  }, { message: 'Known local terrain must produce nonblank screenshot pixels', timeout: 10000 }).toBe(true);
  await info.attach(`${name}-pixels`, { body: png!, contentType: 'image/png' });
  await info.attach(`${name}-pixels`, { body: JSON.stringify({ clip, ...pixels }, null, 2), contentType: 'application/json' });
}
