import { expect, test, type Page } from '@playwright/test';
import { applyCommand, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterCampaign, CHARACTER_FIXTURE as FIXTURE } from '../../packages/test-fixtures/src/character-fixture';
import { closeManagement, openCampaignJournal } from './ui-navigation';

const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });

/** Rules 65: a surveyor sitting in the hearth takes the Keeper of the Roll
 * from the character sheet, the sheet shows the office and its yield, the
 * journal records it, and the office is resigned from the same sheet. */
test('hold and resign an office of the realm from the character sheet', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = characterCampaign(), player = state.turnOwnerId;
  state.factions.find(item => item.id === player)!.treasury = 5000;
  const before = new Set(Object.keys(state.characters));
  const appointed = applyCommand(state, { type: 'recruitCharacter', factionId: player, settlementId: FIXTURE.homeId, definitionId: 'character.surveyor' });
  expect(appointed.ok, appointed.error).toBe(true);
  const surveyor = Object.values(state.characters).find(item => !before.has(item.id))!;
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'office.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(surveyor.name);
  await roster(page).getByTestId('character-roster').getByRole('button', { name: new RegExp(surveyor.name) }).first().click();
  const offices = roster(page).getByTestId('character-offices');
  await expect(offices.getByTestId('office-open-office.keeper_of_the_roll')).toContainText('Keeper of the Roll is vacant');
  await page.screenshot({ path: test.info().outputPath('office-vacant.png') });
  await offices.getByRole('button', { name: `Hold Keeper of the Roll at ${FIXTURE.homeName}`, exact: true }).click();
  const held = offices.getByTestId('office-held-office.keeper_of_the_roll');
  await expect(held).toContainText(`Keeper of the Roll at ${FIXTURE.homeName}: +2 coin for the hearth`);
  await page.screenshot({ path: test.info().outputPath('office-held.png') });
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${surveyor.name} takes office as Keeper of the Roll at ${FIXTURE.homeName}`);
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(surveyor.name);
  await roster(page).getByTestId('character-roster').getByRole('button', { name: new RegExp(surveyor.name) }).first().click();
  await offices.getByRole('button', { name: 'Resign Keeper of the Roll', exact: true }).click();
  await expect(offices.getByTestId('office-open-office.keeper_of_the_roll')).toBeVisible();
  expect(errors).toEqual([]);
});
