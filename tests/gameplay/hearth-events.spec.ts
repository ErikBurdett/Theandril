import { expect, test } from '@playwright/test';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

/** Rules 46: a hearth event offered to the realm is answered from Realm affairs
 * with one of its quoted answers; the coin arrives in the treasury and the
 * campaign journal records the answer. */
test('answer a hearth event from Realm affairs and read its effect in the treasury and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const faction = state.factions.find(item => item.id === player)!;
  faction.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.bumper_harvest', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'heavy-harvest.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('A heavy harvest');
  await expect(panel).toContainText(`The terraces of ${host.name} yield beyond`);
  await expect(panel).toContainText('+40 coin');
  await page.screenshot({ path: test.info().outputPath('hearth-event-offered.png') });
  await panel.getByRole('button', { name: `Sell the surplus: A heavy harvest at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b140\b.*coin|coin.*\b140\b/).first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('hearth-event-answered.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('A heavy harvest at');
  await expect(journal).toContainText('sell the surplus');
  expect(errors).toEqual([]);
});

/** Rules 62: a template of the third catalogue is answered the same way. */
test('answer a rules 62 hearth event from Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.lost_ledger', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'lost-ledger.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('The lost ledger');
  await expect(panel).toContainText(`The clerks of ${host.name} have found an old tax roll`);
  await panel.getByRole('button', { name: `Enforce the roll: The lost ledger at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b125\b.*coin|coin.*\b125\b/).first()).toBeVisible();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The lost ledger at');
  await expect(journal).toContainText('enforce the roll');
  expect(errors).toEqual([]);
});

test('answer a rules 66 hearth event from Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.whale_ashore', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'whale-ashore.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('A whale ashore');
  await expect(panel).toContainText(`A whale has come ashore below ${host.name}`);
  await panel.getByRole('button', { name: `Render it: A whale ashore at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b108\b.*coin|coin.*\b108\b/).first()).toBeVisible();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('A whale ashore at');
  await expect(journal).toContainText('render it');
  expect(errors).toEqual([]);
});

test('answer a rules 73 hearth event from Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.horse_fair', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'horse-fair.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('The horse fair');
  await expect(panel).toContainText(`The horse fair has pitched outside ${host.name}`);
  await panel.getByRole('button', { name: `Charge the fair: The horse fair at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b112\b.*coin|coin.*\b112\b/).first()).toBeVisible();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The horse fair at');
  await expect(journal).toContainText('charge the fair');
  expect(errors).toEqual([]);
});

test('answer a rules 74 hearth event from Realm affairs', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.factions.find(item => item.id === player)!.treasury = 100;
  state.hearthEvents.pending = [{ id: `event.${state.turn}.1`, factionId: player, settlementId: host.id, templateId: 'event.salt_road_toll', turn: state.turn, expiresTurn: state.turn + 5 }];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'salt-road-toll.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const panel = affairs.getByTestId('hearth-events');
  await expect(panel).toContainText('The salt road toll');
  await expect(panel).toContainText(`The carters on the salt road through ${host.name}`);
  await panel.getByRole('button', { name: `Set a toll: The salt road toll at ${host.name}` }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.getByText(/\b110\b.*coin|coin.*\b110\b/).first()).toBeVisible();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText('The salt road toll at');
  await expect(journal).toContainText('set a toll');
  expect(errors).toEqual([]);
});
