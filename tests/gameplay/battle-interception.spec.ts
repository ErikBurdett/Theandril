import { expect, test, type Page } from '@playwright/test';
import { applyCommand, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterBattleCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
import { holdSurveyedSeam } from '../../packages/test-fixtures/src/authored-land';
import { openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';

async function load(page: Page, game: GameState) {
  const canonical = serializeGame(deserializeGame(serializeGame(game)));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Import save file').setInputFiles({ name: 'interception.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(canonical)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}

/** Rules 43: the foe's Rune caster holds Unbinding automatic, so the player's
 * ember working is undone as it is made. The player reads the held counter's
 * answer in the recorded actions, pays the strain and use regardless, and the
 * battle survives save and load unchanged. */
test('an enemy Waykeeper holding Unbinding intercepts the player’s working as it is made', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const game = characterBattleCampaign(), player = game.turnOwnerId, rival = game.factions[1]!;
  game.settlements[C.homeId]!.buildings.push('building.archive');
  holdSurveyedSeam(game, player);
  const casterId = `character.${game.nextId}`;
  expect(applyCommand(game, { type: 'recruitCharacter', factionId: player, settlementId: C.homeId, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  expect(applyCommand(game, { type: 'assignCharacter', factionId: player, characterId: casterId, armyId: C.armyId })).toMatchObject({ ok: true });
  game.arcaneResearch[player] = ['arcane.ember_projection'];
  // The foe's Waykeeper rides with Reedbound Watch, Rune-trained to the second degree, with Measured unbinding known.
  const hearth = Object.values(game.settlements).find(town => town.factionId === rival.id)!;
  rival.treasury += 200;
  const keeperId = `character.${game.nextId}`;
  expect(applyCommand(game, { type: 'recruitCharacter', factionId: rival.id, settlementId: hearth.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  const keeper = game.characters[keeperId]!;
  keeper.aptitudes = { 'path.flame': 1, 'path.rune': 2 }; keeper.location = { kind: 'army', armyId: 'army.4' };
  game.arcaneResearch[rival.id] = ['arcane.unbinding'];
  const caster = game.characters[casterId]!;
  await load(page, game);

  await selectFromRegistry(page, 'armies', 'Witness column');
  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.active)).toBe(true);
  await page.getByLabel(`Automatic Cinder thread (${caster.id})`, { exact: true }).uncheck();
  const panel = page.getByTestId('battle-panel');
  await expect(panel).toContainText('2 uses remaining · 4 strain per use · 0 current strain');
  const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battleScene!.formations.filter(item => item.side === 'defender').map(item => [item.id, item.strength, item.ward]));
  await page.getByRole('button', { name: `Cinder thread (${caster.id})`, exact: true }).click();
  // The player's own feed carries the cast and its answer; the feedback line quotes the interceptor's event.
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.events.filter(event => event.type === 'battle_ability_used' && event.message.includes('intercepted the working')).length)).toBe(1);
  await expect(page.getByTestId('feedback')).toContainText(`${keeper.name} intercepted ${caster.name}’s Cinder thread with Unbinding: the working was undone as it was made.`);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.events.some(event => event.type === 'battle_cast_intercepted'))).toBe(false);
  // Nothing landed on the defenders; the working still cost its strain and use.
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battleScene!.formations.filter(item => item.side === 'defender').map(item => [item.id, item.strength, item.ward]))).toEqual(before);
  await expect(panel).toContainText('1 uses remaining · 4 strain per use · 4 current strain');
  const account = page.getByRole('list', { name: 'Recorded battle actions', exact: true });
  await expect(account).toContainText(`${keeper.name} · Unbinding`);
  await panel.screenshot({ path: info.outputPath('intercepted-working.png') });
  await expect(page.getByTestId('battle-round')).toHaveText('0');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const menu = page.getByTestId('campaign-menu');
  if (!await menu.evaluate(element => (element as HTMLDetailsElement).open)) await menu.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(errors).toEqual([]);
});
