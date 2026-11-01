import { expect, test, type Page } from '@playwright/test';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openCampaignJournal, openRegistry } from './ui-navigation';

const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });

/** Rules 67: a besieged realm's lodged Flame Waykeeper raises an ember host
 * from the character sheet; the ashglass is spent, the company appears in
 * the army registry and the journal records the working. */
test('raise an ember host through a lodged Flame Waykeeper and find the company in the registry', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  caster.aptitudes = { 'path.flame': 2, 'path.rune': 1 };
  state.resources.stockpiles[player]!['resource.ashglass'] = 8; // one host's worth, so the second quote reads the empty stockpile
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'ember-host.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  const rites = roster(page).getByTestId('strategic-rites');
  await expect(rites.getByTestId('rite-rite.ember_host')).toContainText(`8 ashglass · at once · at ${host.name}`);
  await rites.screenshot({ path: testInfo.outputPath('ember-host-offered.png') });
  await rites.getByRole('button', { name: 'Perform Ember host', exact: true }).click();
  await expect(rites.getByTestId('rite-rite.ember_host')).toContainText('Requires 8 Ashglass in the realm stockpile.');
  await expect(rites.getByRole('button', { name: 'Perform Ember host', exact: true })).toBeDisabled();
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  const registry = await openRegistry(page, 'armies');
  await expect(registry).toContainText('Ember host');
  await registry.screenshot({ path: testInfo.outputPath('ember-host-registry.png') });
  await closeManagement(page);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${caster.name} performed Ember host at ${host.name} for 8 ashglass: a company of Oath guard stands at the hearth.`);
  expect(errors).toEqual([]);
});
