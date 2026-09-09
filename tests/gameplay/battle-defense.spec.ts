import { expect, test, type Page, type Locator } from '@playwright/test';
import { applyCommand, createArmyFormation, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { conquestCampaign, CONQUEST_FIXTURE as C } from '../../packages/test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeManagement, openRealmAffairs, openSelectedOrders } from './ui-navigation';
import { expectLocalMapPixels } from './map-pixel-evidence';

/** Authored full-container reserve stress fixture; no naturally earned force-size claim.
 * Uses the same setup as the parent's canonical frontage regression tests.
 * Siege preparation uses three simulation ticks without AI scheduling; browser
 * AI turns can legally change this deliberately fragile 21-defender setup.
 * Assaults, autoresolve, the later live AI turn and capture use public controls. */
function reserveCampaign(siege: boolean): GameState {
  let state = siege ? conquestCampaign() : borderBattleCampaign();
  const town = state.settlements[C.settlementId]!;
  if (siege) {
    const attackers = state.armies[C.playerArmyId]!;
    attackers.formations = Array.from({ length: 12 }, (_, index) => createArmyFormation(index === 0 ? attackers.id : `army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1);
  }
  for (let index = 0; index < 21; index++) {
    const id = !siege && index === 0 ? 'army.4' : `army.${state.nextId++}`;
    const original = state.armies['army.4'];
    state.armies[id] = { id, name: `Reserve defender ${index}`, factionId: town.factionId,
      cell: siege ? town.cell : original!.cell, movement: 0,
      formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
  }
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  if (siege) {
    const factionId = state.turnOwnerId;
    const issue = (command: GameCommand) => {
      const result = applyCommand(state, command);
      if (!result.ok) throw new Error(`Reserve fixture ${command.type}: ${result.error}`);
    };
    issue({ type: 'declareWar', factionId, targetFactionId: town.factionId });
    issue({ type: 'besiege', factionId, armyId: C.playerArmyId, settlementId: town.id });
    for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId });
  }
  return deserializeGame(serializeGame(state));
}
async function importAndDeclare(page: Page, game: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'reserve-contingent.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  if (!Object.keys(game.sieges).length) {
    await openRealmAffairs(page);
    await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  }
  await openSelectedOrders(page);
}
async function assertQuote(panel: Locator, quote: { engagedFormations: number; engagedStrength: number; reserveFormations: number; reserveStrength: number }) {
  await expect(panel).toContainText(`Committed defense: ${quote.engagedFormations} formations · ${quote.engagedStrength} strength`);
  await expect(panel).toContainText(`Reserves: ${quote.reserveFormations} formation · ${quote.reserveStrength} strength`);
  await expect(panel).toContainText('Reserves defend in later engagements');
}

test('R03 public attack previews the canonical contingent and leaves its reserve on the map', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importAndDeclare(page, reserveCampaign(false));
  const target = page.locator('.attack-target').filter({ has: page.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }) });
  const before = await page.evaluate(() => { const api = window.__THEANDRIL__!, view = api.getSummary()!; return { hash: api.getStateHash(), army: view.ownArmies.find(army => army.id === 'army.2')!, target: view.armies.find(army => army.id === 'army.4')! }; });
  expect(before.target.battleDefense).toBeDefined();
  await assertQuote(target.getByTestId('battle-defense-preview'), before.target.battleDefense!);
  await target.screenshot({ path: info.outputPath('field-defense-desktop.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  await target.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battle!.combat.defender.length)).toBe(before.target.battleDefense!.engagedFormations);
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(after.ownArmies.find(army => army.id === before.army.id)!.cell).toBe(before.army.cell);
  expect(after.armies.filter(army => army.cell === before.target.cell && army.factionId === before.target.factionId)).toHaveLength(1);
  await info.attach('field-defense', { body: JSON.stringify({ before, afterArmies: after.armies, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('R03 siege preview fits 390px and desktop public assaults clear reserves before capture', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importAndDeclare(page, reserveCampaign(true));
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 4');
  await openSelectedOrders(page); await page.setViewportSize({ width: 390, height: 844 });
  const card = page.getByTestId(`siege-${C.settlementId}`);
  const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), siege: window.__THEANDRIL__!.getSummary()!.sieges[0]! }));
  expect(before.siege.battleDefense?.reserveFormations).toBe(1);
  await assertQuote(card.getByTestId('battle-defense-preview'), before.siege.battleDefense!);
  await card.screenshot({ path: info.outputPath('siege-defense-390.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  // Narrow coverage is the new preview. The capture panel has a
  // separate 390px pointer-occlusion failure retained in the v2 run evidence.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  const contested = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(contested.sieges).toHaveLength(1); expect(contested.pendingCapture).toBeNull();
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 5');
  await openSelectedOrders(page);
  await expect(card.getByTestId('battle-defense-preview')).toHaveCount(0);
  await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownSettlements.some(town => town.id === id), C.settlementId)).toBe(true);
  await info.attach('siege-defense', { body: JSON.stringify({ before, contestedSieges: contested.sieges, errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

for (const textScale of ['1', '1.3']) test(`R03 narrow public assaults complete occupation at 390px without intercepted controls${textScale === '1' ? '' : ' at 130% text'}`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await importAndDeclare(page, reserveCampaign(true));
  if (textScale !== '1') {
    await closeManagement(page);
    const settings = page.getByTestId('campaign-menu').locator(':scope > summary');
    await settings.click();
    await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption(textScale);
    await settings.click();
    await openSelectedOrders(page);
  }
  const canvas = await page.locator('canvas').elementHandle();
  const card = page.getByTestId(`siege-${C.settlementId}`);
  const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges[0]!);
  expect(before.battleDefense?.reserveFormations).toBe(1);
  await assertQuote(card.getByTestId('battle-defense-preview'), before.battleDefense!);
  await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  const contested = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(contested.sieges).toHaveLength(1); expect(contested.pendingCapture).toBeNull();
  await closeManagement(page);
  // This is a real scheduled AI turn, not an in-browser resource/state grant.
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 5');
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('capture-prompt-390.png') });
  const occupy = page.getByRole('button', { name: 'Occupy settlement', exact: true });
  // Trial uses the same native scrolling/actionability checks as a real click;
  // scrollIntoViewIfNeeded alone can leave enlarged text under the top bar.
  await occupy.click({ trial: true, timeout: 10000 });
  await page.screenshot({ path: info.outputPath('capture-occupy-ready-390.png') });
  const layout = await occupy.evaluate(button => {
    const box = button.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return {
      viewport: { width: innerWidth, height: innerHeight }, button: box.toJSON(),
      hit: hit?.outerHTML, receivesPointer: button.contains(hit),
      layers: ['.map-host', '.hud-tools', '.capture-panel'].map(selector => {
        const element = document.querySelector(selector)!;
        const style = getComputedStyle(element);
        return { selector, box: element.getBoundingClientRect().toJSON(), position: style.position, zIndex: style.zIndex, overflow: style.overflow };
      }),
    };
  });
  await info.attach('narrow-capture-before', { body: JSON.stringify({ before, contestedSieges: contested.sieges, layout }, null, 2), contentType: 'application/json' });
  expect(layout.receivesPointer).toBe(true);
  const decisionHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  // Scroll to the lower destructive choice, then return without issuing it.
  await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm settlement destruction', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep settlement', exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath('capture-raze-review-390.png') });
  await page.getByRole('button', { name: 'Keep settlement', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(decisionHash);
  // Ordinary pointer action is the acceptance boundary; no force or viewport escape.
  await occupy.click({ timeout: 10000 });
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  const after = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()! }));
  expect(after.view.pendingCapture).toBeNull();
  expect(after.view.ownSettlements.some(town => town.id === C.settlementId)).toBe(true);
  expect(await canvas!.evaluate(element => element === document.querySelector('canvas'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
  await closeManagement(page);
  await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
  await expectLocalMapPixels(page, info, 'capture-completed-390');
  await page.screenshot({ path: info.outputPath('capture-completed-390.png') });
  await info.attach('narrow-capture-after', { body: JSON.stringify({ hash: after.hash, pendingCapture: after.view.pendingCapture, town: after.view.ownSettlements.find(town => town.id === C.settlementId), errors }, null, 2), contentType: 'application/json' });
  expect(errors).toEqual([]);
});
