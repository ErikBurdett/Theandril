import { expect, test, type Page } from '@playwright/test';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { attunementCampaign } from '../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openRealmAffairs } from './ui-navigation';

const roster = (page: Page) => page.getByRole('dialog', { name: 'Characters & agents', exact: true });

/** Rules 40: a besieged realm's lodged Waykeeper wards the hearth through the
 * real character sheet, the ashglass is spent, the ledger marks the walls and
 * the besieger's works fail to wear them down. */
test('ward a besieged hearth through its lodged Waykeeper and read the held walls', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  await page.goto('/');
  // The unbundled dev page and the module worker together exceed Chromium's in-flight request budget; let the page settle first.
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'warded-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);

  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  const rites = roster(page).getByTestId('strategic-rites');
  await expect(rites).toContainText('Seam warding');
  await expect(rites).toContainText(`6 ashglass · 10 turns · at ${host.name}`);
  await rites.screenshot({ path: testInfo.outputPath('rite-offered.png') });
  await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  await expect(rites.getByTestId(`ward-${host.id}`)).toContainText(`stands over ${host.name}: 10 turns remaining.`);
  await expect(rites).toContainText('This hearth is already warded.');
  await expect(rites.getByRole('button', { name: 'Perform Seam warding', exact: true })).toBeDisabled();
  await rites.screenshot({ path: testInfo.outputPath('rite-performed.png') });
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();

  // The ledger marks the warded walls; the besieger reads them too and, unable to storm them, lifts the siege on its turn.
  await openRealmAffairs(page);
  const ledger = page.getByLabel('Known sieges', { exact: true });
  await expect(ledger).toContainText(host.name);
  await expect(ledger).toContainText('30 · warded');
  await ledger.screenshot({ path: testInfo.outputPath('warded-ledger.png') });
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.length)).toBe(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.map(ward => ward.remainingTurns))).toEqual([9]);
  expect(errors).toEqual([]);
});

/** Rules 41: the besieger's riding Rune caster breaks the ward on its turn; the
 * player reads the broken ward, the jarred caster and the resumed works. */
test('a besieger breaks the ward on its turn and the holder is jarred', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  const column = Object.values(state.armies).find(army => army.factionId === rival.id)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival.id, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival.id, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  const hearth = Object.values(state.settlements).find(town => town.factionId === rival.id)!;
  rival.treasury += 200; state.resources.stockpiles[rival.id] = { ...state.resources.stockpiles[rival.id], 'resource.ashglass': 10 };
  expect(applyCommand(state, { type: 'recruitCharacter', factionId: rival.id, settlementId: hearth.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  const breaker = Object.values(state.characters).find(item => item.factionId === rival.id && item.definitionId === 'character.waykeeper')!;
  breaker.aptitudes = { 'path.flame': 1, 'path.rune': 2 }; breaker.location = { kind: 'army', armyId: column.id };
  state.arcaneResearch[rival.id] = [...new Set([...(state.arcaneResearch[rival.id] ?? []), 'arcane.rune_binding', 'arcane.unbinding'])];
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'contested-ward.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  const rites = roster(page).getByTestId('strategic-rites');
  await rites.getByRole('button', { name: 'Perform Seam warding', exact: true }).click();
  await expect(rites.getByTestId(`ward-${host.id}`)).toContainText('10 turns remaining');
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();

  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.wards?.length ?? 0)).toBe(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges.map(siege => [siege.defenses, siege.warded ?? false]))).toEqual([[20, false]]);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  await expect(roster(page).getByTestId('character-sheet')).toContainText('wounded · 1 turns');
  await expect(rites.getByTestId(`ward-${host.id}`)).toHaveCount(0);
  await expect(rites).toContainText('This caster must recover from wounds.');
  await rites.screenshot({ path: testInfo.outputPath('ward-broken.png') });
  expect(errors).toEqual([]);
});

/** Rules 42: a Flame caster kindles the hearth; the besieging column burns
 * each turn while the works still wear the walls, and the ledger says so. */
test('kindle a besieged hearth from a Flame seam and read the burning column', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  caster.aptitudes = { 'path.flame': 2 };
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  // Two full guard companies, shaken: too strong to lift the siege for a kindling (three times the defenders), above the preservation threshold yet below assault morale when the AI acts, so the column stands and burns.
  column.movement = 3; column.formations = [createArmyFormation(column.id, 'unit.guard'), createArmyFormation(`army.${state.nextId++}`, 'unit.guard')];
  for (const formation of column.formations) formation.morale = 28;
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  const strengthBefore = column.formations.reduce((total, formation) => total + formation.strength, 0);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=file]').setInputFiles({ name: 'kindled-hearth.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await closeManagement(page);
  await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
  await roster(page).getByRole('searchbox', { name: 'Search characters', exact: true }).fill(caster.name);
  await roster(page).getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  const rites = roster(page).getByTestId('strategic-rites');
  await expect(rites.getByTestId('rite-rite.seam_warding')).toContainText('This Waykeeper lacks the personal path for the rite.');
  await expect(rites.getByRole('button', { name: 'Perform Seam warding', exact: true })).toBeDisabled();
  await rites.getByRole('button', { name: 'Perform Seam kindling', exact: true }).click();
  await expect(rites.getByTestId(`ward-${host.id}`)).toContainText('Seam kindling');
  await rites.screenshot({ path: testInfo.outputPath('kindling-performed.png') });
  await roster(page).getByRole('button', { name: 'Close characters', exact: true }).click();

  await openRealmAffairs(page);
  const ledger = page.getByLabel('Known sieges', { exact: true });
  await expect(ledger).toContainText('30 · kindled');
  await ledger.screenshot({ path: testInfo.outputPath('kindled-ledger.png') });
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  // The column stood before the kindled walls and burned while the works wore the walls.
  const summary = await page.evaluate(() => { const view = window.__THEANDRIL__!.getSummary()!; return { sieges: view.sieges.map(siege => [siege.defenses, siege.kindled ?? false]), wards: view.wards?.length ?? 0, enemyStrength: view.armies.filter(army => army.factionId !== view.factionId).reduce((total, army) => total + army.strength, 0) }; });
  expect(summary.sieges).toEqual([[20, true]]);
  expect(summary.wards).toBe(1);
  expect(summary.enemyStrength).toBe(strengthBefore - 8);
  await openRealmAffairs(page);
  await expect(page.getByLabel('Known sieges', { exact: true })).toContainText('20 · kindled');
  expect(errors).toEqual([]);
});
