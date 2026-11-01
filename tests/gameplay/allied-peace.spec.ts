import { expect, test } from '@playwright/test';
import { applyCommand, createGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); return result; };
/** Puts one of `seer`'s armies beside one of `seen`'s so war may be declared. */
const contact = (state: GameState, seer: string, seen: string, offset = 1) => {
  const mine = Object.values(state.armies).find(army => army.factionId === seer)!, theirs = Object.values(state.armies).find(army => army.factionId === seen)!;
  mine.cell = theirs.cell + offset; refreshAuthoredSight(state);
};

/** Rules 56: an ally that entered the player's war is listed with its call;
 * the peace the player accepts ends the ally's war too, and the journal
 * records it. */
test('accept a peace from Realm affairs and read the ally leaving the war with it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const player = state.turnOwnerId, [ally, attacker] = state.factions.filter(faction => faction.id !== player && !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string];
  // The realms have met: the ally's and the attacker's companies stand in sight of the player's.
  contact(state, ally, player, -1);
  issue(state, { type: 'proposeAlliance', factionId: ally, targetFactionId: player, termTurns: 30 });
  issue(state, { type: 'respondAlliance', factionId: player, offerId: state.alliances.offers[0]!.id, accept: true });
  contact(state, attacker, player);
  issue(state, { type: 'declareWar', factionId: attacker, targetFactionId: player });
  expect(state.alliances.calls).toHaveLength(1);
  issue(state, { type: 'proposePeace', factionId: attacker, targetFactionId: player, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 12 } });
  const offer = state.diplomacy.offers.find(item => item.proposerId === attacker && item.recipientId === player)!;
  const names = Object.fromEntries(state.factions.map(faction => [faction.id, faction.name]));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'allied-peace.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  const call = affairs.getByTestId('alliance-call');
  await expect(call).toContainText(`${names[ally]} entered your war against ${names[attacker]}`);
  await page.screenshot({ path: test.info().outputPath('allied-call.png') });
  await affairs.getByRole('button', { name: `Accept peace offer ${offer.id}` }).click();
  await expect(call).toHaveCount(0);
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${names[ally]} leaves the war against ${names[attacker]} with the peace its ally ${names[player]} made`);
  await page.screenshot({ path: test.info().outputPath('allied-peace-journal.png') });
  expect(errors).toEqual([]);
});
