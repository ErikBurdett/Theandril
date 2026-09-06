import { expect, test, type Page } from '@playwright/test';
import { neighbors, isPassable } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
/** Authored veteran scenario: 72 available XP and twenty conserved formations, not a claim of earning them in this browser run. */
function generalCampaign(): GameState {
  let state = characterCampaign();
  const first = state.armies[C.armyId]!, reserve = Object.values(state.armies).find(army => army.name === C.reserveName)!;
  const formation = (index: number) => createArmyFormation(`army.${state.nextId++}`, ['unit.guard', 'unit.spearman', 'unit.heavy_infantry'][index % 3]!);
  first.formations = Array.from({ length: 12 }, (_, index) => formation(index)); first.movement = 2;
  reserve.formations = Array.from({ length: 4 }, (_, index) => formation(index)); reserve.movement = 2;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: state.turnOwnerId, name: 'Second reserve', cell: first.cell, movement: 2, formations: Array.from({ length: 4 }, (_, index) => formation(index)) };
  for (const army of Object.values(state.armies)) army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  state = deserializeGame(serializeGame(state));
  issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: C.homeId, definitionId: 'character.marshal' });
  Object.values(state.characters).find(character => character.definitionId === 'character.marshal')!.experience = 72;
  return deserializeGame(serializeGame(state));
}
function commandedCampaign(wounded = false): GameState {
  let state = generalCampaign();
  const marshal = Object.values(state.characters).find(character => character.definitionId === 'character.marshal')!;
  issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: marshal.id, armyId: C.armyId });
  for (const skillId of ['skill.decisive', 'skill.muster_rolls', 'skill.field_orders']) issue(state, { type: 'promoteCharacter', factionId: state.turnOwnerId, characterId: marshal.id, skillId });
  for (const army of Object.values(state.armies)) if (army.factionId === state.turnOwnerId && army.id !== C.armyId) issue(state, { type: 'mergeArmies', factionId: state.turnOwnerId, sourceArmyId: army.id, targetArmyId: C.armyId });
  if (wounded) { marshal.woundedTurns = 3; state.armies[C.armyId]!.movement = 1; }
  state = deserializeGame(serializeGame(state));
  return state;
}
async function importCampaign(page: Page, state: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'general-command.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function selectArmy(page: Page, name: string) {
  await page.getByRole('tab', { name: /Armies/ }).click();
  await page.getByTestId('army-registry').getByRole('button', { name: new RegExp(name) }).click();
}
async function composition(page: Page) {
  const panel = page.getByTestId('army-composition');
  if (!await panel.evaluate(element => (element as HTMLDetailsElement).open)) await panel.locator('summary').click();
  return panel;
}
async function saveReload(page: Page) {
  const settings = page.locator('.campaign-options');
  if (!await settings.evaluate(element => (element as HTMLDetailsElement).open)) await settings.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
}

test('a real marshal assignment and prerequisite skill branches expand command from twelve through sixteen to twenty', async ({ page }, testInfo) => {
  const state = generalCampaign(), marshal = Object.values(state.characters)[0]!;
  const initialFormations = Object.values(state.armies).filter(army => army.factionId === state.turnOwnerId).flatMap(army => army.formations).map(item => item.id).sort();
  await importCampaign(page, state); await selectArmy(page, C.armyName);
  await expect(page.getByTestId('army-command-capacity')).toContainText('12 / 12');
  await page.getByRole('button', { name: `Manage characters for ${C.armyName}`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
  await dialog.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
  await dialog.getByRole('button', { name: 'Assign character', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!.formationCapacity)).toBe(16);
  const tree = dialog.getByTestId('character-skill-tree');
  await tree.getByRole('tab', { name: /^Command/ }).click();
  await expect(tree.getByRole('button', { name: 'Promote Field orders', exact: true })).toBeDisabled();
  await expect(tree.getByTestId('skill-skill.field_orders')).toContainText('Requires: Muster rolls');
  await tree.getByRole('tab', { name: /^Specialization/ }).click();
  await tree.getByRole('button', { name: 'Promote Decisive orders', exact: true }).click();
  await expect(tree.getByTestId('available-character-xp')).toHaveText('60 available experience');
  await expect(tree.getByRole('button', { name: 'Promote Keeper of the line', exact: true })).toBeDisabled();
  await tree.getByRole('tab', { name: /^Command/ }).click();
  await tree.getByRole('button', { name: 'Promote Muster rolls', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!.formationCapacity)).toBe(18);
  await tree.getByRole('button', { name: 'Promote Field orders', exact: true }).click();
  await expect(tree.getByTestId('available-character-xp')).toHaveText('18 available experience');
  await tree.getByRole('tab', { name: /^Battlecraft/ }).click();
  await tree.getByRole('button', { name: 'Promote Measured advance', exact: true }).click();
  await expect(tree.getByTestId('available-character-xp')).toHaveText('0 available experience');
  await tree.getByRole('tab', { name: /^Command/ }).click();
  await tree.screenshot({ path: testInfo.outputPath('general-command-skill-branches.png') });
  await page.keyboard.press('Escape');
  for (const reserveName of [C.reserveName, 'Second reserve']) {
    await selectArmy(page, reserveName); const panel = await composition(page);
    await panel.getByRole('combobox', { name: 'Other army at this hex', exact: true }).selectOption(C.armyId);
    await panel.getByRole('button', { name: 'Merge armies', exact: true }).click();
    await expect(page.locator('.inspector h2')).toHaveText(C.armyName);
  }
  await expect(page.getByTestId('army-command-capacity')).toContainText('20 / 20');
  const assembled = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === 'army.2')!);
  expect(assembled.formations.map(item => item.id).sort()).toEqual(initialFormations);
  expect(assembled.commander?.id).toBe(marshal.id); expect(assembled.movement).toBeLessThanOrEqual(2);
  await saveReload(page);
  const saved = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters[0]!);
  expect(saved).toMatchObject({ experience: 0, skillId: 'skill.decisive', learnedSkillIds: ['skill.field_orders', 'skill.measured_advance', 'skill.muster_rolls'] });
});

test('a wounded general retains every formation and permits narrow-screen command-capacity repair', async ({ page }, testInfo) => {
  const state = commandedCampaign(true), originalIds = state.armies[C.armyId]!.formations.map(item => item.id).sort();
  await page.setViewportSize({ width: 390, height: 844 });
  await importCampaign(page, state); await selectArmy(page, C.armyName);
  await expect(page.getByTestId('army-command-capacity')).toContainText('20 / 12');
  let panel = await composition(page);
  await expect(panel).toContainText('command');
  for (const id of originalIds.slice(0, 13)) await panel.getByRole('checkbox', { name: `Select formation ${id}`, exact: true }).check();
  await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeDisabled();
  await panel.getByRole('button', { name: 'Clear formation selection', exact: true }).click();
  for (const id of originalIds.slice(0, 8)) await panel.getByRole('checkbox', { name: `Select formation ${id}`, exact: true }).check();
  await panel.getByRole('textbox', { name: 'New detachment name', exact: true }).fill('Recovery reserve');
  const split = panel.getByRole('button', { name: 'Split selected formations', exact: true });
  await split.evaluate(element => element.scrollIntoView({ block: 'center' }));
  expect(await split.evaluate(element => { const rect = element.getBoundingClientRect(); const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return hit === element || element.contains(hit); })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('wounded-general-repair-narrow.png') });
  await split.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.length)).toBe(2);
  const repaired = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies);
  expect(repaired.flatMap(army => army.formations.map(item => item.id)).sort()).toEqual(originalIds);
  expect(repaired.find(army => army.id === C.armyId)).toMatchObject({ formationCapacity: 12, overCommand: false, movement: 1, commander: { woundedTurns: 3 } });
  expect(repaired.find(army => army.name === 'Recovery reserve')).toMatchObject({ formationCapacity: 12, movement: 1, commander: null });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await saveReload(page); panel = await composition(page); await expect(panel).toContainText('12 / 12 formations');
});

test('twenty general-led formations enter a saved four-rank battle and resolve through the same kernel', async ({ page }, testInfo) => {
  let state = commandedCampaign();
  const own = state.armies[C.armyId]!, cell = neighbors(own.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !Object.values(state.settlements).some(town => town.cell === cell))!;
  const enemyId = `army.${state.nextId++}`;
  state.armies[enemyId] = { id: enemyId, factionId: state.factions[1]!.id, name: 'Reedbound battle line', cell, movement: 3, formations: Array.from({ length: 8 }, () => createArmyFormation(`army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1) };
  for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.width * state.world.height }, (_, cell) => cell));
  refreshAuthoredSight(state); // Explicit authored reinforcement, never a repairing save loader.
  state = deserializeGame(serializeGame(state));
  const expected = deserializeGame(serializeGame(state));
  issue(expected, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: state.factions[1]!.id });
  issue(expected, { type: 'attack', factionId: state.turnOwnerId, armyId: own.id, targetArmyId: enemyId });
  issue(expected, { type: 'battleOrder', factionId: state.turnOwnerId, order: 'brace' });
  const expectedRound = expected.battle!.combat.round;
  issue(expected, { type: 'autoResolveBattle', factionId: state.turnOwnerId });
  await importCampaign(page, state); await selectArmy(page, C.armyName);
  await page.getByRole('button', { name: `Declare war on ${state.factions[1]!.name}`, exact: true }).click();
  await page.getByRole('button', { name: `Attack Reedbound battle line (${enemyId})`, exact: true }).click();
  const battle = page.getByTestId('battle-panel');
  await expect(battle.getByRole('table', { name: 'Attacking formations', exact: true }).locator('tbody tr')).toHaveCount(20);
  await expect(battle).toContainText('rank 4');
  await saveReload(page);
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText(String(expectedRound));
  await battle.screenshot({ path: testInfo.outputPath('twenty-formation-battle.png') });
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(battle).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(stateHash(expected));
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battleReports.at(-1)!.combat.attacker.length)).toBe(20);
});
