import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, deserializeGame, getDevelopmentEntity, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { characterBattleCampaign, characterCampaign, CHARACTER_FIXTURE } from '../../packages/test-fixtures/src/character-fixture';

function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Development fixture rejected ${command.type}: ${result.error}`);
}
function civicCampaign() {
  const state = createGame({ seed: 17, generatorVersion: 4, size: 'tiny', factionCount: 1, pace: 'short' });
  state.factions[0]!.treasury = 2000;
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Civic Witness' });
  const hearth = Object.values(state.settlements)[0]!;
  // Only population and starting funds are authored. The granary, market and
  // every civic/influence point below come from paid commands and active turns.
  hearth.population = 8; hearth.food = 0;
  for (const itemId of ['building.granary', 'building.market']) issue(state, { type: 'queue', factionId: state.turnOwnerId, settlementId: hearth.id, itemId });
  for (let turn = 0; turn < 50 && (state.development.factions[state.turnOwnerId]?.influence ?? 0) < 6; turn++) issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
  expect(state.development.hearths[hearth.id]!.civicPoints).toBeGreaterThanOrEqual(4);
  expect(state.development.factions[state.turnOwnerId]!.influence).toBeGreaterThanOrEqual(6);
  issue(state, { type: 'adoptInstitution', factionId: state.turnOwnerId, institutionId: 'institution.common_stewardship' });
  return deserializeGame(serializeGame(state));
}
function veteranCampaign() {
  const state = characterBattleCampaign();
  issue(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: CHARACTER_FIXTURE.enemyFactionId });
  issue(state, { type: 'attack', factionId: state.turnOwnerId, armyId: CHARACTER_FIXTURE.armyId, targetArmyId: CHARACTER_FIXTURE.enemyArmyId });
  // Real saved battle input, real deterministic aftermath, earned experience.
  const restored = deserializeGame(serializeGame(state));
  issue(restored, { type: 'autoResolveBattle', factionId: restored.turnOwnerId });
  expect(restored.battleReports.at(-1)?.combat.result?.winner).toBe('attacker');
  return restored;
}
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Realm progression', exact: true });
async function load(page: Page, state: GameState) {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'earned-development.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function openDevelopment(page: Page) {
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await dialog(page).getByRole('tab', { name: 'Development', exact: true }).click();
  await expect(page.getByTestId('development-panel')).toBeVisible();
}
async function ready(page: Page, entityId: string) {
  // A paid command can settle between separate DOM/hash reads. Compare the
  // complete live pair atomically on each poll, rather than freezing an old
  // expected hash while the query legitimately advances to its replacement.
  await expect.poll(() => page.evaluate(() => {
    const query = document.querySelector<HTMLElement>('[data-testid="development-query"]');
    const currentHash = window.__THEANDRIL__!.getStateHash(), queryHash = query?.dataset.queryHash;
    return { entityId: query?.dataset.entityId, status: query?.dataset.queryState,
      currentHash, queryHash, matchesCurrent: Boolean(currentHash) && queryHash === currentHash };
  })).toMatchObject({ entityId, status: 'ready', matchesCurrent: true });
}
async function saveReload(page: Page) {
  await dialog(page).getByRole('button', { name: 'Close realm progression', exact: true }).click();
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator('summary').click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(hash);
  return hash;
}

test('earned civic and faction branches pay authoritative costs, refresh one selected query and persist at 390px', async ({ page }, testInfo) => {
  const state = civicCampaign(), hearth = Object.values(state.settlements)[0]!;
  const civic = getDevelopmentEntity(state, state.turnOwnerId, { scope: 'hearth', entityId: hearth.id })!;
  const store = civic.choices.find(node => node.id === 'hearth.common_store')!;
  await load(page, state); await openDevelopment(page);
  const original = stateHash(state);
  await expect(dialog(page).getByRole('button', { name: 'Acquire Store pledges', exact: true })).toBeEnabled();
  await dialog(page).getByRole('button', { name: 'Acquire Store pledges', exact: true }).click();
  await expect(page.getByTestId('development-tradition.store_pledges')).toHaveAttribute('data-state', 'acquired');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).not.toBe(original);
  await dialog(page).getByRole('tab', { name: 'Hearth development', exact: true }).click();
  await dialog(page).getByRole('navigation', { name: 'Hearth development directory' }).getByRole('button', { name: /Civic Witness/ }).click();
  await ready(page, hearth.id);
  const queries = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().developmentQueryCount ?? 0);
  const coins = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await expect(page.getByTestId('development-hearth.common_store')).toContainText(`${store.progressCost} civic points + ${store.coinCost} coin`);
  await dialog(page).getByRole('button', { name: `Acquire ${store.name}`, exact: true }).click();
  await ready(page, hearth.id);
  await expect(page.getByTestId('development-hearth.common_store')).toHaveAttribute('data-state', 'acquired');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(coins - store.coinCost);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().developmentQueryCount)).toBe(queries + 1);
  await saveReload(page); await page.setViewportSize({ width: 390, height: 844 }); await openDevelopment(page);
  await dialog(page).getByRole('tab', { name: 'Hearth development', exact: true }).click();
  await dialog(page).getByRole('navigation', { name: 'Hearth development directory' }).getByRole('button', { name: /Civic Witness/ }).click(); await ready(page, hearth.id);
  await expect(page.getByTestId('development-hearth.common_store')).toHaveAttribute('data-state', 'acquired');
  const beforeInspect = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await dialog(page).getByRole('button', { name: `Inspect prerequisite ${store.name}`, exact: true }).click();
  await expect(page.getByTestId('development-hearth.common_store')).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(beforeInspect);
  expect(await dialog(page).evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await dialog(page).screenshot({ path: testInfo.outputPath('earned-hearth-development-390.png') });
});

test('survivors spend experience earned in a saved real battle and preserve training after reload', async ({ page }, testInfo) => {
  const state = veteranCampaign(), army = state.armies[CHARACTER_FIXTURE.armyId]!, formation = army.formations[0]!;
  expect(state.development.formations[formation.id]!.experience).toBe(3);
  await load(page, state); await openDevelopment(page);
  await dialog(page).getByRole('tab', { name: 'Formation training', exact: true }).click();
  await dialog(page).getByRole('navigation', { name: 'Training army directory' }).getByRole('button', { name: /Witness column/ }).click(); await ready(page, formation.id);
  const tree = page.getByTestId('development-tree'), strength = army.formations.map(item => item.strength), coins = state.factions[0]!.treasury;
  await expect(tree).toContainText('3 battle experience + 8 coin');
  await dialog(page).getByRole('button', { name: 'Acquire Field habits', exact: true }).click(); await ready(page, formation.id);
  await expect(page.getByTestId('development-training.field_habits')).toHaveAttribute('data-state', 'acquired');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(coins - 8);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.formations.map(item => item.strength), army.id)).toEqual(strength);
  await expect(tree.locator('dl')).toContainText('battle experience0');
  await dialog(page).screenshot({ path: testInfo.outputPath('earned-formation-training.png') });
  await page.getByTestId('development-training.field_habits').scrollIntoViewIfNeeded();
  await dialog(page).screenshot({ path: testInfo.outputPath('earned-formation-branches.png') });
  await saveReload(page); await openDevelopment(page);
  await dialog(page).getByRole('tab', { name: 'Formation training', exact: true }).click();
  await dialog(page).getByRole('navigation', { name: 'Training army directory' }).getByRole('button', { name: /Witness column/ }).click(); await ready(page, formation.id);
  await expect(page.getByTestId('development-training.field_habits')).toHaveAttribute('data-state', 'acquired');
});

test('100 armies use a bounded directory and one arbitrary selected tree; branch keyboard inspection makes no orders', async ({ page }) => {
  const state = characterCampaign(100), last = Object.values(state.armies).filter(army => army.factionId === state.turnOwnerId).at(-1)!;
  await load(page, state); await openDevelopment(page);
  const tab = dialog(page).getByRole('tab', { name: 'Faction traditions', exact: true });
  await tab.focus(); await page.keyboard.press('Home');
  await expect(dialog(page).getByRole('tab', { name: 'Formation training', exact: true })).toBeFocused();
  const directory = dialog(page).getByRole('navigation', { name: 'Training army directory' });
  await expect(directory.getByRole('button')).toHaveCount(20);
  const initialHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  const before = await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().developmentQueryCount ?? 0);
  await dialog(page).getByRole('searchbox', { name: 'Search armies', exact: true }).fill(last.name);
  await directory.getByRole('button').click(); await ready(page, last.formations[0]!.id);
  await expect(page.getByTestId('development-tree')).toHaveCount(1);
  await expect(page.getByTestId('development-tree').locator('.development-node')).toHaveCount(8);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getPerformanceCounters().developmentQueryCount)).toBe(before + 1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.development!.candidates.length)).toBe(0);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(initialHash);
});
