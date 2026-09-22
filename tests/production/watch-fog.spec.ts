import { expect, test } from '@playwright/test';

test('production exposes the watch-only fog command without development hooks', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.theandril?.toggleFogOfWar)).toBe('function');
  expect(await page.evaluate(() => window.theandril!.toggleFogOfWar().then(() => 'unexpected', error => String(error)))).toContain('only in an active AI-watch');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('combobox', { name: 'Map type', exact: true }).selectOption('archipelago');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('watch');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  const revealed = await page.evaluate(() => window.theandril!.toggleFogOfWar());
  expect(revealed.enabled).toBe(false); expect(revealed.hash).toMatch(/^[a-f0-9]{8}$/);
  await expect(page.getByRole('button', { name: 'Restore fog of war', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'World overview', exact: true }).click();
  const restored = await page.evaluate(() => window.theandril!.setWatchFog(true));
  expect(restored).toEqual({ enabled: true, hash: revealed.hash });
  await expect(page.getByRole('button', { name: 'Reveal spectator map', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(errors).toEqual([]);
});
