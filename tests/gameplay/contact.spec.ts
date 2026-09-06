import { expect, test } from '@playwright/test';
import { RECOMMENDED_FACTION_COUNTS } from '@theandril/mapgen';

test('world-size recommendations expose generated seats honestly and a chosen faction count survives manual save and reload', async ({ page }) => {
  await page.goto('/');
  const size = page.getByRole('combobox', { name: 'World size', exact: true });
  const count = page.getByRole('spinbutton', { name: 'Faction count', exact: true });
  await expect(size).toHaveValue('small'); await expect(count).toHaveValue('12');
  for (const [value, recommended] of Object.entries(RECOMMENDED_FACTION_COUNTS)) {
    await size.selectOption(value);
    await expect(count).toHaveValue(String(recommended));
    await expect(page.getByTestId('faction-density-help')).toContainText(`Recommended for this size: ${recommended} realms`);
  }
  await expect(page.getByTestId('faction-density-help')).toContainText('Additional seats are generated variants, not additional authored nations');
  await expect(page.locator('.faction-card')).toContainText('Ashen Compact');
  await expect(page.locator('.faction-card')).toContainText('Your current player seat');
  await count.fill('1'); expect(await count.evaluate(element => (element as HTMLInputElement).validity.rangeUnderflow)).toBe(true);
  await count.fill('49'); expect(await count.evaluate(element => (element as HTMLInputElement).validity.rangeOverflow)).toBe(true);
  await size.selectOption('tiny'); await count.fill('6');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByTestId('campaign-faction-count')).toHaveText('6 realms');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.factionCount)).toBe(6);
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('campaign-faction-count')).toHaveText('6 realms');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
});

test('the recorded Standard Long seed with recommended density makes real faction contact through responsive AI watch', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('748291');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('standard');
  await expect(page.getByRole('spinbutton', { name: 'Faction count', exact: true })).toHaveValue('24');
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('long');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('watch');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await page.getByRole('button', { name: 'Resume AI watch', exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const view = window.__THEANDRIL__?.getSummary();
    return view ? { contacted: view.factions.some(faction => faction.id !== view.factionId), underLimit: view.turn <= 50 } : { contacted: false, underLimit: true };
  }), { timeout: 60_000, intervals: [100, 250, 500] }).toEqual({ contacted: true, underLimit: true });
  await page.getByRole('button', { name: 'Pause AI watch', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  const view = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  expect(view?.factionCount).toBe(24); expect(view?.turn).toBeLessThanOrEqual(50);
  expect(view?.factions.length).toBeGreaterThan(1);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('standard-long-real-contact.png'), fullPage: true });
  await testInfo.attach('standard-contact.json', { body: JSON.stringify({ seed: view?.seed, width: view?.width, height: view?.height, pace: view?.pace, configuredFactions: view?.factionCount, observedFactions: view?.factions, observedContactByTurn: view?.turn, ownArmies: view?.ownArmies.length, ownSettlements: view?.ownSettlements.length, metrics: await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()) }, null, 2), contentType: 'application/json' });
});
