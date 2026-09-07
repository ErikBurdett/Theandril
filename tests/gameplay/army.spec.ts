import { openRealmAffairs, openProduction } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';

const ORIGIN = 500;
function formation(state: GameState, unitId: string) { return createArmyFormation(`army.${state.nextId++}`, unitId); }
/** Authored formations enter through the production save validator, never a browser mutation hook. */
function rosterCampaign(kind: 'reorganize' | 'battle' | 'capacity' = 'reorganize'): GameState {
  const state = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2 });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  const first = state.armies['army.1']!; const second = state.armies['army.2']!;
  const guard = formation(state, 'unit.guard'); guard.strength = 40; guard.morale = 65; guard.fatigue = 7;
  Object.assign(first, { cell: ORIGIN, name: 'Roadguard column', movement: 3, formations: [guard, formation(state, 'unit.scout'), formation(state, 'unit.colonist')] });
  Object.assign(second, { cell: ORIGIN, name: 'Iron detachment', movement: 1, formations: [formation(state, 'unit.heavy_infantry')] });
  delete state.armies['army.3'];
  if (kind === 'battle') {
    first.formations = [guard, formation(state, 'unit.scout'), formation(state, 'unit.spearman'), formation(state, 'unit.cavalry')];
    Object.assign(state.armies['army.4']!, { cell: ORIGIN + 1, name: 'Reedbound rear guard', movement: 3, formations: [formation(state, 'unit.guard'), formation(state, 'unit.spearman')] });
  } else delete state.armies['army.4'];
  if (kind === 'capacity') {
    first.formations = [guard];
    second.formations = Array.from({ length: 12 }, () => formation(state, 'unit.guard'));
  }
  for (const army of Object.values(state.armies)) army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  for (const faction of state.factions) state.explored[faction.id] = new Set(Array.from({ length: state.world.width * state.world.height }, (_, cell) => cell));
  return deserializeGame(serializeGame(state));
}
async function importRoster(page: Page, state = rosterCampaign()) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'formation-column.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.getByTestId('army-registry').getByRole('button', { name: /Roadguard column/ }).click();
}
async function openComposition(page: Page) {
  const panel = page.getByTestId('army-composition');
  if (!await panel.evaluate(element => (element as HTMLDetailsElement).open)) await panel.locator('summary').click();
  return panel;
}
async function saveReload(page: Page): Promise<void> {
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(hash);
}

test('mixed armies merge, split and transfer stable formations without refreshing movement; an escorted caravan founds without consuming its scouts', async ({ page }, testInfo) => {
  const state = rosterCampaign(); const original = Object.values(state.armies).flatMap(army => army.formations).sort((a, b) => a.id.localeCompare(b.id));
  await importRoster(page, state);
  let panel = await openComposition(page);
  await expect(panel).toContainText('Oath guard'); await expect(panel).toContainText('Wayfinder');
  await panel.getByRole('combobox', { name: 'Other army at this hex', exact: true }).selectOption('army.2');
  await panel.getByRole('button', { name: 'Merge armies', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.length)).toBe(1);
  const merged = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies[0]);
  expect(merged).toMatchObject({ id: 'army.2', movement: 1, maxMovement: 2, strength: 155, maxStrength: 175, upkeep: 7, canFound: true, canAttack: true });
  expect(merged?.formations).toEqual(original);
  panel = await openComposition(page);
  const scoutId = original.find(item => item.unitId === 'unit.scout')!.id;
  await panel.getByRole('checkbox', { name: `Select formation ${scoutId}`, exact: true }).check();
  await panel.getByRole('textbox', { name: 'New detachment name', exact: true }).fill('Farlook patrol');
  await panel.getByRole('button', { name: 'Split selected formations', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.length)).toBe(2);
  const patrol = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.name === 'Farlook patrol'));
  expect(patrol).toMatchObject({ movement: 1, maxMovement: 5, formations: [{ id: scoutId, unitId: 'unit.scout', strength: 20 }] });
  panel = await openComposition(page);
  await panel.getByRole('checkbox', { name: `Select formation ${original.find(item => item.unitId === 'unit.colonist')!.id}`, exact: true }).check();
  await panel.getByRole('combobox', { name: 'Other army at this hex', exact: true }).selectOption(patrol!.id);
  await panel.getByRole('button', { name: 'Transfer selected formations', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === id)?.formations.length, patrol!.id)).toBe(2);
  await saveReload(page);
  await page.getByTestId('army-registry').getByRole('button', { name: /Farlook patrol/ }).click();
  panel = await openComposition(page);
  await expect(panel).toContainText('Founding consumes one caravan formation only');
  await panel.screenshot({ path: testInfo.outputPath('mixed-army-roster.png') });
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill('Escort Hearth');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements[0]?.name)).toBe('Escort Hearth');
  expect(await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.id === id), patrol!.id)).toMatchObject({ movement: 0, formations: [{ id: scoutId, unitId: 'unit.scout', strength: 20 }] });
  await openProduction(page, 'land');
  await expect(page.getByRole('button', { name: 'Recruit Ash pike company', exact: true })).toBeEnabled();
  await openProduction(page, 'land');
  await expect(page.getByRole('button', { name: 'Recruit Cinder plate cohort', exact: true })).toBeEnabled();
  await openProduction(page, 'land');
  await expect(page.getByRole('button', { name: 'Recruit Charter outriders', exact: true })).toBeEnabled();
});

test('mixed formation battles deploy each real role and preserve exact losses through a saved tactical round', async ({ page }, testInfo) => {
  await importRoster(page, rosterCampaign('battle'));
  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.wars.length)).toBe(1);
  await page.getByRole('button', { name: 'Attack Reedbound rear guard (army.4)', exact: true }).click();
  const battle = page.getByTestId('battle-panel');
  await expect(battle).toBeVisible();
  await expect(battle.getByRole('table', { name: 'Attacking formations', exact: true }).locator('tbody tr')).toHaveCount(4);
  await expect(battle).toContainText('Ash pike company'); await expect(battle).toContainText('Charter outriders');
  await battle.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  await saveReload(page);
  await battle.screenshot({ path: testInfo.outputPath('mixed-formation-battle.png') });
  await battle.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  const report = page.getByTestId('battle-report'); await expect(report).toBeVisible();
  const record = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battleReports.at(-1));
  expect(record?.formationBindings).toHaveLength(6);
  for (const side of ['attacker', 'defender'] as const) {
    const combatIds = new Set(record!.combat[side].map(item => item.id));
    const ids = new Set(record!.formationBindings.filter(binding => combatIds.has(binding.battleFormationId)).map(binding => binding.formationId));
    const entered = record!.formationStrengths.filter(item => ids.has(item.formationId)).reduce((sum, item) => sum + item.strength, 0);
    const survivors = record!.formationAftermath.filter(item => ids.has(item.formationId)).reduce((sum, item) => sum + item.strength, 0);
    await expect(report).toContainText(`${entered - survivors} strength lost · ${survivors} survivors`);
  }
});

test('twelve-formation limits and proper-subset splitting stay explicit in the narrow keyboard roster', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await importRoster(page, rosterCampaign('capacity'));
  let panel = await openComposition(page);
  await panel.getByRole('checkbox').check();
  await expect(panel.getByRole('button', { name: 'Merge armies', exact: true })).toBeDisabled();
  await expect(panel.getByRole('button', { name: 'Transfer selected formations', exact: true })).toBeDisabled();
  await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeDisabled();
  await expect(panel).toContainText('The combined army exceeds its 12-formation command capacity.');
  await page.getByTestId('army-registry').getByRole('button', { name: /Iron detachment/ }).click();
  panel = await openComposition(page);
  await expect(panel.getByRole('checkbox')).toHaveCount(12);
  for (const checkbox of await panel.getByRole('checkbox').all()) await checkbox.check();
  await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeDisabled();
  await panel.getByRole('checkbox').last().focus(); await page.keyboard.press('Space');
  await expect(panel.getByRole('button', { name: 'Split selected formations', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.getByRole('textbox', { name: 'New detachment name', exact: true }).fill('Narrow march');
  const split = panel.getByRole('button', { name: 'Split selected formations', exact: true });
  await split.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('army-capacity-narrow.png') });
  await split.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.name === 'Narrow march')?.formations.length)).toBe(11);
  await page.getByTestId('army-registry').getByRole('button', { name: /Iron detachment/ }).click();
  panel = await openComposition(page);
  await panel.getByRole('checkbox').check();
  const detached = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.name === 'Narrow march'));
  await panel.getByRole('combobox', { name: 'Other army at this hex', exact: true }).selectOption(detached!.id);
  const transfer = panel.getByRole('button', { name: 'Transfer selected formations', exact: true });
  await transfer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('army-transfer-narrow.png') });
  await transfer.click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.name === 'Narrow march')?.formations.length)).toBe(12);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.some(army => army.id === 'army.2'))).toBe(false);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.name === 'Narrow march')?.movement)).toBe(1);
  await testInfo.attach('roster-accessibility.json', { body: JSON.stringify({ viewport: '390x844', controls: 'real keyboard-operable formation checkboxes; twelve cap and proper subset enforced', hash: await page.evaluate(() => window.__THEANDRIL__?.getStateHash()) }), contentType: 'application/json' });
});
