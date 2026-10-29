import { expect, test, type Page } from '@playwright/test';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openRealmAffairs } from './ui-navigation';

const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });

/** Rules 40: a besieged realm's lodged Waykeeper wards the hearth through the
 * real character sheet, the ashglass is spent, the ledger marks the walls and
 * the besieger's works fail to wear them down. */
test('ward a besieged hearth through its lodged Waykeeper and read the held walls', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  await page.goto('/');
  // The unbundled dev page and the module worker together exceed Chromium's in-flight request budget; let the page settle first.
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'warded-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);

  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  const rites = roster(page).getByTestId('strategic-rites');
  await expect(rites).toContainText('Seam warding');
  await expect(rites).toContainText(`6 ashglass · 10 turns · at ${host.name}`);
  await rites.screenshot({ path: testInfo.outputPath('rite-offered.png') });
  await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  await expect(rites.getByTestId(`ward-${host.id}`)).toContainText(`stands over ${host.name}: 10 turns remaining.`);
  await expect(rites).toContainText('This hearth is already warded.');
  await expect(rites.getByRole('button', { name: 'Perform Seam warding', exact: true })).toBeDisabled();
  await rites.screenshot({ path: testInfo.outputPath('rite-performed.png') });
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();

  // The ledger marks the warded walls; the besieger reads them too and, unable to storm them, lifts the siege on its turn.
  await openRealmAffairs(page);
  const ledger = page.getByLabel('Known sieges', { exact: true });
  await expect(ledger).toContainText(host.name);
  await expect(ledger).toContainText('30 · warded');
  await ledger.screenshot({ path: testInfo.outputPath('warded-ledger.png') });
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.length)).toBe(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.map(ward => ward.remainingTurns))).toEqual([9]);
  expect(errors).toEqual([]);
});
