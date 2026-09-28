import { expect, test, type Page } from '@playwright/test';
import { applyCommand, serializeGame, stateHash } from '@theandril/sim';
import { replayArchive } from '@theandril/chronicle';
import { supplyAccessCampaign } from '../../packages/test-fixtures/src/supply-access-fixture';
import { campaignMenu, exportedTravel, importTravel } from './group-movement-fixture';
import { closeManagement, openRealmAffairs } from './ui-navigation';

async function requestSupply(page: Page, sourceId: string, keyboard = false) {
  await openRealmAffairs(page);
  const panel = page.getByTestId('supply-access');
  await panel.getByRole('combobox', { name: 'Supply hearth or harbor', exact: true }).selectOption(sourceId);
  await panel.getByLabel('Supply fee', { exact: true }).fill('20');
  await panel.getByLabel('Supply term in turns', { exact: true }).fill('10');
  await panel.getByRole('button', { name: 'Review supply terms', exact: true }).click();
  await expect(panel.getByTestId('supply-assessment')).toContainText('appears likely');
  const send = panel.getByRole('button', { name: 'Send supply request', exact: true });
  if (keyboard) { await send.focus(); await page.keyboard.press('Enter'); } else await send.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.offers.length)).toBe(1);
}
async function turn(page: Page) {
  const previous = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.turn);
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${previous + 1}`);
}

test('negotiate foreign harbor service, sustain the convoy and field force, interrupt it and recover with a saved agreement', async ({ page }, testInfo) => {
  const fixture = supplyAccessCampaign(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await importTravel(page, fixture.state);
  const initial = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supply);
  expect(initial.find(row => row.armyId === fixture.fleetId)).toMatchObject({ supplied: false, fleetProvisions: { remaining: 0 } });
  expect(initial.find(row => row.armyId === fixture.fieldId)?.supplied).toBe(false);
  await requestSupply(page, fixture.sourceId, true);
  await expect(page.getByTestId('supply-access')).toContainText('20 coin across 1 pending');
  await turn(page);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.agreements.length)).toBe(1);
  const supplied = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supply);
  for (const id of [fixture.fleetId, fixture.cargoId, fixture.fieldId]) expect(supplied.find(row => row.armyId === id)).toMatchObject({ supplied: true, sourceSettlementId: fixture.sourceId });
  expect(supplied.find(row => row.armyId === fixture.fleetId)?.fleetProvisions).toMatchObject({ remaining: 8, refilling: true });
  await openRealmAffairs(page);
  await page.getByTestId('supply-access').screenshot({ path: testInfo.outputPath('contracted-harbor-desktop.png') });
  const active = await exportedTravel(page), agreement = active.game.supplyAccess.agreements[0]!;
  const strength = active.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength);
  await openRealmAffairs(page);
  await page.getByRole('button', { name: `End supply agreement ${agreement.id}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.agreements.length)).toBe(0);
  await turn(page);
  const interrupted = await exportedTravel(page);
  expect(interrupted.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength)).toEqual(strength.map(value => value - 4));
  expect(interrupted.game.armies[fixture.fleetId]!.provisions).toBe(7);
  await page.setViewportSize({ width: 390, height: 844 });
  await requestSupply(page, fixture.sourceId, true);
  await page.getByTestId('supply-access').screenshot({ path: testInfo.outputPath('supply-request-narrow.png') });
  await turn(page);
  const recovered = await exportedTravel(page);
  expect(recovered.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength)).toEqual(interrupted.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength));
  expect(recovered.game.armies[fixture.fleetId]!.provisions).toBe(8);
  expect(recovered.game.supplyAccess.agreements).toHaveLength(1);
  expect(stateHash(replayArchive(recovered.archive))).toBe(stateHash(recovered.game));
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
  const loaded = await exportedTravel(page);
  expect(serializeGame(loaded.game)).toBe(serializeGame(recovered.game));
  expect(loaded.archive).toEqual(recovered.archive);
  await openRealmAffairs(page);
  const panel = page.getByTestId('supply-access');
  await expect(panel).toContainText('20 coin paid');
  expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('a provider reviews a real incoming request and receives exactly one payment through keyboard acceptance', async ({ page }) => {
  const fixture = supplyAccessCampaign();
  expect(applyCommand(fixture.state, fixture.proposal).ok).toBe(true);
  fixture.state.turnOwnerId = fixture.providerId;
  const before = fixture.state.factions.find(faction => faction.id === fixture.providerId)!.treasury;
  const offerId = fixture.state.supplyAccess.offers[0]!.id;
  await importTravel(page, fixture.state);
  await openRealmAffairs(page);
  const accept = page.getByRole('button', { name: `Accept supply request ${offerId}`, exact: true });
  await accept.focus(); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(before + 20);
  await expect(accept).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.supplyAccess!.agreements.length)).toBe(1);
  const exported = await exportedTravel(page);
  expect(exported.archive.records.filter(record => typeof record.command === 'object' && record.command !== null && 'type' in record.command && record.command.type === 'respondSupplyAccess')).toHaveLength(1);
  expect(stateHash(replayArchive(exported.archive))).toBe(stateHash(exported.game));
});
