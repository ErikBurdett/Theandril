import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { RECOMMENDED_FACTION_COUNTS } from '@theandril/mapgen';

test('world-size recommendations expose generated seats honestly and a chosen faction count survives manual save and reload', async ({ page }) => {
  await page.goto('/');
  const size = page.getByRole('combobox', { name: 'World size', exact: true });
  const count = page.getByRole('spinbutton', { name: 'Faction count', exact: true });
  await expect(size).toHaveValue('standard'); await expect(count).toHaveValue(String(RECOMMENDED_FACTION_COUNTS.standard));
  for (const [value, recommended] of Object.entries(RECOMMENDED_FACTION_COUNTS)) {
    await size.selectOption(value);
    await expect(count).toHaveValue(String(recommended));
    await expect(page.getByTestId('faction-density-help')).toContainText(`Recommended for this size: ${recommended} realms`);
  }
  await expect(page.getByTestId('faction-density-help')).toContainText('Additional seats are generated variants, not additional authored nations');
  await expect(page.locator('.faction-card')).toContainText('Ashen Compact');
  await expect(page.locator('.faction-card')).toContainText('Your chosen player seat');
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
  await expect(page.getByRole('spinbutton', { name: 'Faction count', exact: true })).toHaveValue(String(RECOMMENDED_FACTION_COUNTS.standard));
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('long');
  await page.getByRole('combobox', { name: 'Campaign mode', exact: true }).selectOption('watch');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await page.getByRole('button', { name: 'Resume AI watch', exact: true }).click();
  const observeContact = () => page.evaluate(() => {
    const view = window.__THEANDRIL__?.getSummary();
    if (!view) return { turn: 0, witness: null };
    const army = view.armies.find(item => item.factionId !== view.factionId);
    const town = view.settlements.find(item => item.factionId !== view.factionId);
    const entity = army ?? town;
    const faction = entity && view.factions.find(item => item.id === entity.factionId);
    return {
      turn: view.turn,
      witness: entity && faction ? {
        seed: view.seed, width: view.width, height: view.height, pace: view.pace,
        configuredFactions: view.factionCount, turn: view.turn, factionId: view.factionId,
        fogEnabled: view.watch.fogEnabled, foreignFaction: faction,
        foreignEntity: { kind: army ? 'army' : 'settlement', id: entity.id, factionId: entity.factionId, cell: entity.cell },
      } : null,
    };
  });
  let contactWitness: NonNullable<Awaited<ReturnType<typeof observeContact>>['witness']> | undefined;
  await expect.poll(async () => {
    const observed = await observeContact();
    if (observed.witness && observed.turn <= 50) contactWitness = observed.witness;
    return { contacted: observed.witness !== null, underLimit: observed.turn <= 50 };
  }, { timeout: 60_000, intervals: [100, 250, 500] }).toEqual({ contacted: true, underLimit: true });
  await page.getByRole('button', { name: 'Pause AI watch', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Step one round', exact: true })).toBeEnabled();
  const view = await page.evaluate(() => window.__THEANDRIL__?.getSummary());
  expect(view?.factionCount).toBe(RECOMMENDED_FACTION_COUNTS.standard); expect(view?.turn).toBeLessThanOrEqual(50);
  // A neutral passing army can leave sight during the round already in flight
  // when Pause is clicked. Assert the actual witnessed entity, not persistent
  // diplomatic memory that this observation contract does not promise.
  expect(contactWitness).toBeDefined();
  expect(contactWitness?.turn).toBeLessThanOrEqual(50);
  expect(contactWitness?.configuredFactions).toBe(RECOMMENDED_FACTION_COUNTS.standard);
  expect(contactWitness?.fogEnabled).toBe(true);
  expect(contactWitness?.foreignEntity.factionId).not.toBe(contactWitness?.factionId);
  expect(contactWitness?.foreignFaction.id).toBe(contactWitness?.foreignEntity.factionId);
  expect(view?.watch.running).toBe(false);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath('standard-long-post-contact-pause.png'), fullPage: true });
  const witnessPath = testInfo.outputPath('standard-contact-witness.json'), pausedPath = testInfo.outputPath('standard-contact-post-pause.json');
  await writeFile(witnessPath, JSON.stringify(contactWitness, null, 2));
  await writeFile(pausedPath, JSON.stringify({ seed: view?.seed, width: view?.width, height: view?.height, pace: view?.pace, configuredFactions: view?.factionCount, observedFactions: view?.factions, turn: view?.turn, watch: view?.watch, ownArmies: view?.ownArmies.length, ownSettlements: view?.ownSettlements.length, metrics: await page.evaluate(() => window.__THEANDRIL__?.getPerformanceCounters()) }, null, 2));
  await testInfo.attach('standard-contact-witness.json', { path: witnessPath, contentType: 'application/json' });
  await testInfo.attach('standard-contact-post-pause.json', { path: pausedPath, contentType: 'application/json' });
});
