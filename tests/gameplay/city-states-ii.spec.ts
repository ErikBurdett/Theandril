import { expect, test } from '@playwright/test';
import { CITY_STATES } from '@theandril/content';
import { createGame, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { openRealmAffairs } from './ui-navigation';

/** Rules 69: the setup seats up to forty-eight city-states, and a standard
 * campaign with twenty-four of them seats the second roster; one the realm
 * has met is listed in Realm affairs under its own name. */
test('a standard campaign seats city-states of the second roster and Realm affairs names one', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = createGame({ seed: 20260905, size: 'standard', factionCount: 8, cityStateCount: 24 }), player = state.turnOwnerId;
  const second = CITY_STATES.filter(item => item.sinceRules === 69);
  const seated = state.factions.filter(faction => second.some(item => item.id === faction.id));
  expect(state.factions.filter(faction => faction.id.startsWith('citystate.'))).toHaveLength(24);
  expect(seated.length).toBeGreaterThan(0);
  const met = seated[0]!, definition = second.find(item => item.id === met.id)!;
  expect(met.name).toBe(definition.name);
  // The realm has met the city-state: a diplomatic relation stands between them.
  state.diplomacy.relations.push({ parties: [player, met.id].sort() as [string, string], trust: 0, respect: 0, grievances: 0, warStartedTurn: null, lastOfferTurn: 0 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('spinbutton', { name: 'City-states', exact: true })).toHaveAttribute('max', '48');
  await page.locator('input[type=file]').setInputFiles({ name: 'second-roster.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId(`city-state-${met.id}`)).toContainText('City-state');
  await expect(affairs).toContainText(definition.name);
  await page.screenshot({ path: test.info().outputPath('second-roster-met.png') });
  expect(errors).toEqual([]);
});
