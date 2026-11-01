import { expect, test, type Page } from '@playwright/test';
import { CHARACTER_DEFINITIONS, NOTABLE_CHARACTERS } from '@theandril/content';
import { serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterCampaign, CHARACTER_FIXTURE as FIXTURE } from '../../packages/test-fixtures/src/character-fixture';
import { closeManagement, openCampaignJournal, openRegistry, openSelectedOrders, selectFromRegistry } from './ui-navigation';

const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });

/** Rules 64: the first appointment of a culture's notable role, made from the
 * hearth's orders like any other, is that figure — named on the roster, with
 * their story on the sheet and their specialization already acquired — and
 * the journal records that the name was known. */
test('appoint a culture’s notable figure from the hearth and read their story on the sheet', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = characterCampaign(), player = state.turnOwnerId;
  const faction = state.factions.find(item => item.id === player)!; faction.treasury = 5000;
  const figure = NOTABLE_CHARACTERS.find(item => item.factionId === faction.definitionId)!;
  const definition = CHARACTER_DEFINITIONS.find(item => item.id === figure.definitionId)!;
  expect(Object.values(state.characters).some(item => item.notableId)).toBe(false);
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'notable.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', new RegExp(FIXTURE.homeName)); await openSelectedOrders(page);
  const appointments = page.getByTestId('character-appointments');
  if (!await appointments.evaluate(element => (element as HTMLDetailsElement).open)) await appointments.locator('summary').click();
  await page.getByRole('button', { name: `Appoint ${definition.name}`, exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.some(item => item.name === id), figure.name)).toBe(true);
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(figure.name);
  await roster(page).getByTestId('character-roster').getByRole('button', { name: new RegExp(figure.name) }).first().click();
  const sheet = roster(page).getByTestId('character-sheet');
  await expect(sheet).toContainText(figure.name);
  await expect(sheet.getByTestId('character-notable')).toHaveText(figure.lore);
  await expect(sheet).toContainText('rank 2');
  await page.screenshot({ path: test.info().outputPath('notable-sheet.png') });
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${figure.name}, whose name is known beyond the realm, was appointed ${definition.name}`);
  expect(errors).toEqual([]);
});
