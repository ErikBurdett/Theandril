import { expect, test } from '@playwright/test';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { supplyAccessCampaign } from '../../packages/test-fixtures/src/supply-access-fixture';
import { exportedTravel } from '../gameplay/group-movement-fixture';
import { closeCampaignOptions, closeManagement, openRealmAffairs } from '../gameplay/ui-navigation';

test('built production negotiates foreign harbor supply through portable import, pays once and restores the replenished agreement without development hooks', async ({ page }, testInfo) => {
  const fixture = supplyAccessCampaign(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // This is an explicitly authored overseas position, imported through the
  // shipped portable-save control. No request, payment or refill is injected.
  const bytes = Buffer.from(await exportSave(serializeGame(fixture.state)));
  await page.goto('./');
  await page.getByLabel('Import save file').setInputFiles({ name: 'overseas-supply.theandril', mimeType: 'application/gzip', buffer: bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  const initial = await exportedTravel(page), owner = fixture.buyerId;
  expect(serializeGame(initial.game)).toBe(serializeGame(fixture.state));
  expect(initial.archive.records).toHaveLength(0);
  const originalSupply = getObservation(initial.game, owner).supply;
  expect(originalSupply.find(row => row.armyId === fixture.fleetId)).toMatchObject({ supplied: false, fleetProvisions: { remaining: 0, refilling: false } });
  expect(originalSupply.find(row => row.armyId === fixture.fieldId)?.supplied).toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await openRealmAffairs(page);
  const panel = page.getByTestId('supply-access');
  await panel.getByRole('combobox', { name: 'Supply hearth or harbor', exact: true }).selectOption(fixture.sourceId);
  await panel.getByRole('spinbutton', { name: 'Supply fee', exact: true }).fill('20');
  await panel.getByRole('spinbutton', { name: 'Supply term in turns', exact: true }).fill('10');
  await panel.getByRole('button', { name: 'Review supply terms', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(panel.getByTestId('supply-assessment')).toContainText('appears likely');
  await panel.getByRole('button', { name: 'Send supply request', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(panel).toContainText('20 coin across 1 pending requests');
  const pending = await exportedTravel(page);
  expect(pending.archive.records.map(record => record.command)).toEqual([fixture.proposal]);
  expect(pending.game.supplyAccess.agreements).toEqual([]);
  expect(pending.game.supplyAccess.offers).toHaveLength(1);
  expect(pending.game.factions.map(faction => faction.treasury)).toEqual(initial.game.factions.map(faction => faction.treasury));

  await closeManagement(page); await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${pending.game.turn + 1}`);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  const active = await exportedTravel(page), agreement = active.game.supplyAccess.agreements[0]!;
  const accepted = { type: 'respondSupplyAccess' as const, factionId: fixture.providerId, offerId: pending.game.supplyAccess.offers[0]!.id, accept: true };
  expect(active.archive.records.slice(pending.archive.records.length).map(record => record.command)).toEqual([
    accepted, { type: 'endTurn', factionId: owner },
  ]);
  // End turn includes ordinary income/upkeep. Reproduce its actual archived
  // commands to verify the exact payment before those economic changes.
  const serial = deserializeGame(serializeGame(pending.game));
  const buyerBefore = serial.factions.find(faction => faction.id === owner)!.treasury;
  const providerBefore = serial.factions.find(faction => faction.id === fixture.providerId)!.treasury;
  expect(applyCommand(serial, accepted).ok).toBe(true);
  expect(serial.factions.find(faction => faction.id === owner)!.treasury).toBe(buyerBefore - 20);
  expect(serial.factions.find(faction => faction.id === fixture.providerId)!.treasury).toBe(providerBefore + 20);
  expect(applyCommand(serial, { type: 'endTurn', factionId: owner }).ok).toBe(true);
  expect(serializeGame(active.game)).toBe(serializeGame(serial));
  expect(active.game.supplyAccess.offers).toEqual([]);
  expect(active.game.supplyAccess.agreements).toHaveLength(1);
  expect(agreement).toMatchObject({ buyerId: owner, providerId: fixture.providerId, feeCoin: 20, termTurns: 10,
    startedTurn: pending.game.turn, expiresTurn: pending.game.turn + 10,
    source: { settlementId: fixture.sourceId, name: initial.game.settlements[fixture.sourceId]!.name, cell: initial.game.settlements[fixture.sourceId]!.cell, harbor: true } });
  const supplied = getObservation(active.game, owner).supply;
  for (const armyId of [fixture.fleetId, fixture.cargoId, fixture.fieldId]) expect(supplied.find(row => row.armyId === armyId)).toMatchObject({ supplied: true, sourceSettlementId: fixture.sourceId });
  for (const armyId of [fixture.fleetId, fixture.cargoId]) expect(supplied.find(row => row.armyId === armyId)?.fleetProvisions).toMatchObject({ remaining: 8, refilling: true });
  expect(active.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength)).toEqual(pending.game.armies[fixture.fieldId]!.formations.map(formation => formation.strength));

  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  const restored = await exportedTravel(page);
  expect(stateHash(restored.game)).toBe(stateHash(active.game)); expect(restored.archive).toEqual(active.archive);
  await page.reload();
  await page.getByLabel('Import save file').setInputFiles({ name: 'paid-supply.theandril', mimeType: 'application/gzip', buffer: active.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const portable = await exportedTravel(page);
  expect(serializeGame(portable.game)).toBe(serializeGame(active.game)); expect(portable.archive).toEqual(active.archive);
  await openRealmAffairs(page);
  const card = page.getByTestId(`supply-agreement-${agreement.id}`);
  await expect(card).toContainText('20 coin paid');
  await expect(card).toContainText(`ends before supply is resolved on turn ${agreement.expiresTurn}`);
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('production-supply-agreement-restored-narrow.png') });
  expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  expect(errors).toEqual([]);
});
