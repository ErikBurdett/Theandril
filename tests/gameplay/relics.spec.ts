import { expect, test } from '@playwright/test';
import { landmarkKind, relicOfLandmarkKind } from '@theandril/content';
import { landmarks, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { closeCampaignOptions, closeManagement, openCampaignJournal } from './ui-navigation';
import type { Page } from '@playwright/test';

/** Opens the character registry and selects the named character's sheet. */
async function openCharacters(page: Page, name: string) {
  const roster = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  await closeManagement(page);
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster.getByTestId('character-roster').getByRole('button', { name: new RegExp(name) }).first().click();
  await expect(roster.getByTestId('character-sheet')).toContainText(name);
  return roster;
}

/** Rules 63: a relic waiting in the hearth is bestowed on a character from
 * the character sheet, listed there with what it lends, and recorded in the
 * journal. */
test('bestow a relic on a character from the character sheet', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId;
  const site = landmarks(state.world)[0]!, relic = relicOfLandmarkKind(site.kindId)!, place = landmarkKind(site.kindId)!;
  state.relics = [{ id: site.id, relicId: relic.id, landmarkId: site.id, factionId: player, holderCharacterId: null, foundTurn: state.turn }];
  const caster = Object.values(state.characters).find(character => character.factionId === player && !character.dead)!;
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'relic.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const characters = await openCharacters(page, caster.name);
  const relics = characters.getByTestId('character-relics');
  await expect(relics.getByTestId(`relic-waiting-${site.id}`)).toContainText(`${relic.name} waits in the hearth, from ${place.name}.`);
  await page.screenshot({ path: test.info().outputPath('relic-waiting.png') });
  await relics.getByRole('button', { name: `Bestow ${relic.name} on ${caster.name}` }).click();
  await expect(relics.getByTestId(`relic-borne-${site.id}`)).toContainText(relic.name);
  await expect(relics.getByTestId(`relic-borne-${site.id}`)).toContainText('for the company they ride with');
  await page.screenshot({ path: test.info().outputPath('relic-borne.png') });
  await characters.getByRole('button', { name: 'Close characters', exact: true }).click();
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${relic.name} goes to ${caster.name}`);
  expect(errors).toEqual([]);
});
