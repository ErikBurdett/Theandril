import { expect, test } from '@playwright/test';
import { applyCommand, createGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { openCampaignJournal, openRealmAffairs } from './ui-navigation';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); return result; };
const contact = (state: GameState, seer: string, seen: string, offset = 1) => {
  const mine = Object.values(state.armies).find(army => army.factionId === seer)!, theirs = Object.values(state.armies).find(army => army.factionId === seen)!;
  mine.cell = theirs.cell + offset; refreshAuthoredSight(state);
};

/** Rules 58: a war declared on the player's client brings the player in as
 * its guarantor; Realm affairs says so and the journal records the entry. */
test('read the guarantee a patron owes its client in Realm affairs and the journal', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const player = state.turnOwnerId, [client, attacker] = state.factions.filter(faction => faction.id !== player && !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string];
  contact(state, client, player, -1);
  issue(state, { type: 'proposeClient', factionId: player, targetFactionId: client, terms: { giftCoin: 40, tributeCoin: 6, termTurns: 12 } });
  issue(state, { type: 'respondClient', factionId: client, offerId: state.diplomacy.clientOffers[0]!.id, accept: true });
  contact(state, attacker, client);
  contact(state, attacker, player);
  const declared = issue(state, { type: 'declareWar', factionId: attacker, targetFactionId: client });
  expect(declared.events.some(event => event.type === 'patronage_answered')).toBe(true);
  const names = Object.fromEntries(state.factions.map(faction => [faction.id, faction.name]));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'guarantee.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  const affairs = await openRealmAffairs(page);
  await expect(affairs.getByTestId('patronage')).toContainText('A war declared on a client brings you in as its guarantor');
  await expect(affairs.getByTestId('alliance-call')).toContainText(`You entered the war against ${names[attacker]}`);
  await page.screenshot({ path: test.info().outputPath('guarantee-affairs.png') });
  const journal = await openCampaignJournal(page);
  await expect(journal).toContainText(`${names[player]} enters the war against ${names[attacker]} for its client ${names[client]}`);
  expect(errors).toEqual([]);
});
