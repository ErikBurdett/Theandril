import { closeManagement, openRegistry, selectFromRegistry, openSelectedOrders, openRealmAffairs, openCampaignJournal } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { applyCommand, deserializeGame, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterBattleCampaign, characterCampaign, CHARACTER_FIXTURE as FIXTURE } from '../../packages/test-fixtures/src/character-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../packages/test-fixtures/src/conquest-fixture';

const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });
async function loadScenario(page: Page, state = characterCampaign()) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'witness-company.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function inspect(page: Page, id: string) {
  if (!await roster(page).isVisible()) {
    await closeManagement(page);
    await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  }
  const character = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id), id);
  if (!character) throw new Error('Missing observed scenario character');
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(character.name);
  await roster(page).getByRole('button', { name: `Inspect ${character.name} (${id})`, exact: true }).click();
  return character;
}
async function closeRoster(page: Page) { if (await roster(page).isVisible()) await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click(); }
async function appoint(page: Page, name: string, definitionId: string) {
  await closeRoster(page);
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', new RegExp(FIXTURE.homeName)); await openSelectedOrders(page);
  const appointments = page.getByTestId('character-appointments');
  if (!await appointments.evaluate(element => (element as HTMLDetailsElement).open)) await appointments.locator('summary').click();
  const before = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.characters.map(item => item.id) ?? []);
  await page.getByRole('button', { name: `Appoint ${name}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.characters.length)).toBe(before.length + 1);
  const character = await page.evaluate(({ before, definitionId }) => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.definitionId === definitionId && !before.includes(item.id)), { before, definitionId });
  if (!character) throw new Error('The real appointment did not produce an observed named character');
  return character.id;
}
async function assign(page: Page, characterId: string, armyId: string = FIXTURE.armyId) {
  await inspect(page, characterId);
  await roster(page).getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(armyId);
  await roster(page).getByRole('button', { name: 'Assign character', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.location, characterId)).toEqual({ kind: 'army', armyId });
}
async function startMission(page: Page, characterId: string, name: string) {
  await inspect(page, characterId);
  await roster(page).getByRole('combobox', { name: 'Choose mission', exact: true }).selectOption({ label: name });
  await roster(page).getByRole('button', { name: `Start ${name}`, exact: true }).click();
  await expect(roster(page).getByTestId('active-character-mission')).toContainText('2 stationary turns remaining');
}
async function endTurn(page: Page) {
  await closeRoster(page);
  const turn = await page.evaluate(() => window.__THEANDRIL__?.getTurn() ?? 0);
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
}
async function saveReload(page: Page) {
  await closeRoster(page);
  await closeManagement(page);
  const settings = page.locator('.campaign-options');
  if (!await settings.evaluate(element => (element as HTMLDetailsElement).open)) await settings.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
}

test('locating an officer from full orders closes both native windows and returns focus to the unchanged army on the map', async ({ page }) => {
  await loadScenario(page, characterBattleCampaign());
  await selectFromRegistry(page, 'armies', FIXTURE.armyName);
  const selection = await page.evaluate(() => window.__THEANDRIL__!.getSelection());
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  expect(selection.armyId).toBe(FIXTURE.armyId);
  const orders = await openSelectedOrders(page);
  await orders.getByRole('button', { name: `Manage characters for ${FIXTURE.armyName}`, exact: true }).click();
  await expect(roster(page)).toBeVisible();
  // Verify the actual nested-window entry path, not the standalone HUD launcher.
  await expect(page.locator('dialog.campaign-window')).toHaveAttribute('open');
  await roster(page).getByRole('button', { name: 'Locate character', exact: true }).click();
  await expect(roster(page)).toHaveCount(0);
  await expect(page.locator('dialog.campaign-window')).toHaveCount(0);
  await expect(page.getByTestId('map-container')).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSelection())).toEqual(selection);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  expect(await page.evaluate(cell => window.__THEANDRIL__!.getCellScreenPoint(cell)?.inViewport, selection.cell!)).toBe(true);
});

test('named appointments attach to a real army, cancel without refund, and preserve a terrain-only survey across save and recovery', async ({ page }, testInfo) => {
  await loadScenario(page);
  const marshal = await appoint(page, 'Hearth marshal', 'character.marshal');
  const surveyor = await appoint(page, 'Road witness', 'character.surveyor');
  const engineer = await appoint(page, 'March engineer', 'character.engineer');
  await assign(page, marshal); await assign(page, surveyor); await assign(page, engineer);
  const army = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(item => item.id === 'army.2'));
  expect(army?.commander?.id).toBe(marshal); expect(army?.agents.map(item => item.id).sort()).toEqual([surveyor, engineer].sort());
  const before = await page.evaluate(() => ({ coin: window.__THEANDRIL__?.getSummary()?.treasury, explored: window.__THEANDRIL__?.getSummary()?.exploredCells }));
  await startMission(page, surveyor, 'Survey the frontier');
  await expect(roster(page).getByRole('button', { name: 'Assign character', exact: true })).toBeDisabled();
  await roster(page).getByRole('button', { name: 'Cancel mission', exact: true }).click();
  await expect(roster(page).getByTestId('active-character-mission')).toHaveCount(0);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(before.coin! - 4);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(item => item.id === 'army.2')?.movement)).toBe(0);
  await startMission(page, surveyor, 'Survey the frontier');
  await endTurn(page); await inspect(page, surveyor);
  await expect(roster(page).getByTestId('active-character-mission')).toContainText('1 stationary turn remaining');
  await roster(page).screenshot({ path: testInfo.outputPath('named-survey-in-progress.png') });
  await saveReload(page); await inspect(page, surveyor);
  await expect(roster(page).getByTestId('active-character-mission')).toContainText('1 stationary turn remaining');
  await endTurn(page);
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.mission, surveyor)).toBeNull();
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.exploredCells)).toBeGreaterThan(before.explored!);
  expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.experience, surveyor)).toBe(4);
  await openCampaignJournal(page);
  await expect(page.getByTestId('chronicle')).toContainText('hidden armies were not revealed');
});

test('field refits restore actual formation losses and earned specialization improves the next mission', async ({ page }, testInfo) => {
  await loadScenario(page);
  const engineer = await appoint(page, 'March engineer', 'character.engineer');
  await assign(page, engineer);
  const strength = () => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(item => item.id === 'army.2')?.formations.find(item => item.unitId === 'unit.guard')?.strength);
  expect(await strength()).toBe(25);
  await expect(roster(page).getByRole('button', { name: 'Promote Patient fieldcraft', exact: true })).toBeDisabled();
  for (let attempt = 0; attempt < 3; attempt++) {
    await startMission(page, engineer, 'Refit the column');
    await endTurn(page); await endTurn(page);
    expect(await strength()).toBe(30 + attempt * 5);
  }
  await inspect(page, engineer);
  expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.experience, engineer)).toBe(12);
  await roster(page).getByRole('button', { name: 'Promote Patient fieldcraft', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.skillId, engineer)).toBe('skill.fieldcraft');
  await expect(roster(page).getByRole('button', { name: 'Promote Siege craft', exact: true })).toBeDisabled();
  await startMission(page, engineer, 'Refit the column');
  await expect(roster(page).getByTestId('mission-preview')).toContainText('Restore up to 7');
  await endTurn(page); await endTurn(page);
  expect(await strength()).toBe(47);
  await saveReload(page); await inspect(page, engineer);
  await roster(page).screenshot({ path: testInfo.outputPath('experienced-field-engineer.png') });
});

test('a named marshal rallies real formations once, saves its used ability, and appears in the exact battle aftermath', async ({ page }, testInfo) => {
  await loadScenario(page, characterBattleCampaign());
  const marshal = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.role === 'marshal'));
  await openRegistry(page, 'armies');
  await selectFromRegistry(page, 'armies', new RegExp(FIXTURE.armyName)); await openSelectedOrders(page);
  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(1);
  await openSelectedOrders(page);
  await page.getByTestId(`attack-${FIXTURE.enemyArmyId}`).click();
  const battle = page.getByTestId('battle-panel'); await expect(battle).toBeVisible();
  await expect(page.getByTestId('commander-battle')).toContainText(marshal!.name);
  await expect(page.getByTestId('commander-battle')).toContainText('+1 attack');
  const before = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battle?.combat.attacker.map(item => item.morale));
  await battle.getByRole('button', { name: `Rally the line (${marshal!.id})`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battle?.usedAbilities.length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battle?.combat.attacker.map(item => item.morale))).toEqual(before!.map(value => value + 12));
  await saveReload(page);
  await expect(battle.getByRole('button', { name: `Rally the line (${marshal!.id})`, exact: true })).toBeDisabled();
  await expect(page.getByTestId('commander-battle')).toContainText('already rallied');
  await battle.screenshot({ path: testInfo.outputPath('named-marshal-rally.png') });
  await battle.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await openCampaignJournal(page);
  await expect(page.getByTestId('character-battle-aftermath')).toContainText(marshal!.name);
  const aftermath = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battleReports.at(-1)?.characterAftermath[0]);
  await openCampaignJournal(page);
  await expect(page.getByTestId('character-battle-aftermath')).toContainText(`${aftermath!.experience} experience`);
  await saveReload(page);
});

test('a narrow paginated roster finds and assigns a specialist in a hundred-army realm without bypassing companion limits', async ({ page }, testInfo) => {
  let state = characterCampaign(100);
  for (let index = 0; index < 30; index++) {
    const result = applyCommand(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: FIXTURE.homeId, definitionId: index === 29 ? 'character.engineer' : 'character.surveyor' });
    if (!result.ok) throw new Error(result.error);
  }
  const characters = Object.values(state.characters); const engineer = characters.find(item => item.definitionId === 'character.engineer')!;
  for (const character of characters.slice(0, 2)) {
    const result = applyCommand(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: character.id, armyId: FIXTURE.armyId });
    if (!result.ok) throw new Error(result.error);
  }
  state = deserializeGame(serializeGame(state));
  await page.setViewportSize({ width: 390, height: 844 });
  await loadScenario(page, state);
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await expect(roster(page).getByTestId('character-roster').getByRole('button')).toHaveCount(25);
  await roster(page).getByRole('button', { name: 'Next characters', exact: true }).click();
  await expect(roster(page).getByTestId('character-roster').getByRole('button')).toHaveCount(5);
  await inspect(page, engineer.id);
  await expect(roster(page).getByTestId('character-roster').getByRole('button')).toHaveCount(1);
  await roster(page).getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(FIXTURE.armyId);
  await expect(roster(page).getByRole('button', { name: 'Assign character', exact: true })).toBeDisabled();
  await expect(roster(page).getByTestId('character-sheet')).toContainText('one marshal and two companions');
  const reserve = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(item => item.name === 'Reserve escort'));
  await roster(page).getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(reserve!.id);
  const assignButton = roster(page).getByRole('button', { name: 'Assign character', exact: true });
  await assignButton.scrollIntoViewIfNeeded(); await assignButton.focus();
  await page.screenshot({ path: testInfo.outputPath('characters-narrow-assignment.png') });
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.location, engineer.id)).toEqual({ kind: 'army', armyId: reserve!.id });
  await roster(page).getByRole('combobox', { name: 'Return to settlement', exact: true }).selectOption(FIXTURE.homeId);
  await roster(page).getByRole('button', { name: 'Return character', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.location, engineer.id)).toEqual({ kind: 'settlement', settlementId: FIXTURE.homeId });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await roster(page).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Characters & agents', exact: true })).toBeFocused();
});

test('siege sabotage changes real defenses, and a failed mission preserves wounds through save and recovery', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  for (const failure of [false, true]) {
    const state = conquestCampaign();
    const approach = state.armies[FIXTURE.armyId]!.cell;
    // Authored peaceful home deployment only. Every appointment, move, siege and outcome below is a real UI order.
    state.armies[FIXTURE.armyId]!.cell = state.settlements[FIXTURE.homeId]!.cell;
    state.factions[0]!.treasury = 500;
    await loadScenario(page, deserializeGame(serializeGame(state)));
    const engineer = await appoint(page, 'March engineer', 'character.engineer');
    // A second real appointment gives mission9 (known seed20260905 roll12); mission8 rolls93.
    if (failure) await appoint(page, 'Hearth marshal', 'character.marshal');
    await assign(page, engineer);
    await closeRoster(page);
    await openRegistry(page, 'armies');
    await selectFromRegistry(page, 'armies', new RegExp(CONQUEST_FIXTURE.playerArmyName)); await openSelectedOrders(page);
    await page.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(approach));
    await page.getByRole('button', { name: 'Review route', exact: true }).click();
    await page.getByRole('button', { name: 'Move now', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === 'army.2')?.cell)).toBe(approach);
    await openRealmAffairs(page);
    await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
    await openSelectedOrders(page);
    await page.getByRole('button', { name: 'Besiege Reedwatch', exact: true }).click();
    await expect(page.getByTestId(`siege-${CONQUEST_FIXTURE.settlementId}`)).toContainText('Besieging Reedwatch');
    await inspect(page, engineer);
    await roster(page).getByRole('combobox', { name: 'Choose mission', exact: true }).selectOption({ label: 'Undermine the defenses · Reedwatch' });
    await expect(roster(page).getByTestId('mission-preview')).toContainText('25%');
    const coin = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury);
    await roster(page).getByRole('button', { name: 'Start Undermine the defenses', exact: true }).click();
    await expect(roster(page).getByTestId('active-character-mission')).toContainText('2 stationary turns remaining');
    expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(coin! - 10);
    expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.mission?.id, engineer)).toBe(failure ? 'mission.9' : 'mission.8');
    await endTurn(page); await endTurn(page);
    await inspect(page, engineer);
    const character = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id), engineer);
    const siege = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.sieges.find(item => item.settlementId === 'settlement.6'));
    expect(character?.mission).toBeNull();
    if (!failure) {
      expect(siege?.defenses).toBe(0); expect(siege?.canAssault).toBe(true);
      expect(character?.experience).toBe(6); expect(character?.woundedTurns).toBe(0);
    } else {
      // Fortified assaults are legal after the first siege turn; failure leaves defenses in the actual battle.
      expect(siege?.defenses).toBe(10); expect(siege?.canAssault).toBe(true);
      expect(character?.experience).toBe(0); expect(character?.woundedTurns).toBe(3);
      await expect(roster(page).getByTestId('character-sheet')).toContainText('wounded · 3 turns');
      await roster(page).getByRole('combobox', { name: 'Choose mission', exact: true }).selectOption({ label: 'Undermine the defenses · Reedwatch' });
      await expect(roster(page).getByRole('button', { name: 'Start Undermine the defenses', exact: true })).toBeDisabled();
      await expect(roster(page).getByTestId('character-sheet')).toContainText('recover from wounds first');
      await expect(roster(page).getByRole('button', { name: 'Cancel mission', exact: true })).toHaveCount(0);
      await roster(page).screenshot({ path: testInfo.outputPath('wounded-siege-engineer.png') });
      await saveReload(page);
      expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.woundedTurns, engineer)).toBe(3);
      for (const remaining of [2, 1, 0]) {
        await endTurn(page);
        expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.characters.find(item => item.id === id)?.woundedTurns, engineer)).toBe(remaining);
      }
      await inspect(page, engineer);
      await expect(roster(page).getByTestId('character-sheet')).toContainText('ready');
      await closeRoster(page); await openCampaignJournal(page); await expect(page.getByTestId('chronicle')).toContainText('recovered from wounds');
    }
  }
});
