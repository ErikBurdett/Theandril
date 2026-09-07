import { openRealmAffairs, openProduction } from './ui-navigation';
import { expect, test, type Page } from '@playwright/test';
import { serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { isPassable, neighbors } from '@theandril/mapgen';
import { CONQUEST_FIXTURE, conquestCampaign } from '../../packages/test-fixtures/src/conquest-fixture';

async function beginSiege(page: Page): Promise<GameState> {
  const fixture = conquestCampaign();
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await page.getByRole('button', { name: 'Besiege Reedwatch', exact: true }).click();
  await expect(page.getByTestId(`siege-${CONQUEST_FIXTURE.settlementId}`)).toContainText('Besieging Reedwatch');
  for (let turn = 2; turn <= 4; turn++) {
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn}`);
  }
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.sieges[0]?.defenses)).toBe(0);
  await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toContainText('Reedwatch has fallen');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  return fixture;
}

test('besiege and assault a town, save the capture decision, and apply distinct occupation or sack outcomes', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await beginSiege(page);
  await page.screenshot({ path: testInfo.outputPath('capture-choices.png'), fullPage: true });
  await page.getByText('Campaign & settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const decisionHash = await page.evaluate(() => window.__THEANDRIL__?.getStateHash());
  await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  const occupied = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.id === id), CONQUEST_FIXTURE.settlementId);
  expect(occupied?.occupationTurns).toBe(3);
  expect(occupied?.devastation).toBe(20);
  expect(occupied?.buildings).toHaveLength(2);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__?.getStateHash())).toBe(decisionHash);
  const before = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury);
  const loot = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.pendingCapture?.options.find(option => option.outcome === 'sack')?.coinGain);
  await page.getByRole('button', { name: 'Sack settlement', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  const sacked = await page.evaluate(id => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.id === id), CONQUEST_FIXTURE.settlementId);
  expect(sacked?.population).toBe(1);
  expect(sacked?.buildings).toHaveLength(1);
  expect(sacked?.devastation).toBe(60);
  expect(sacked?.occupationTurns).toBe(5);
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.treasury)).toBe(before! + loot!);
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await page.getByTestId('settlement-registry').getByRole('button', { name: /Reedwatch/ }).click();
  await expect(page.getByTestId('settlement-defense')).toContainText('60/100');
  await page.screenshot({ path: testInfo.outputPath('occupied-town.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('conquest-narrow.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('confirm razing and resettle the visible ruins with a normally recruited caravan', async ({ page }, testInfo) => {
  const fixture = await beginSiege(page);
  const ruinCell = fixture.settlements[CONQUEST_FIXTURE.settlementId]!.cell;
  const home = Object.values(fixture.settlements).find(town => town.factionId === fixture.turnOwnerId)!;
  await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Confirm settlement destruction' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep settlement', exact: true }).click();
  await expect(page.getByTestId('capture-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Raze settlement', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm raze', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ruins.length)).toBe(1);
  await page.getByTestId('army-registry').getByRole('button', { name: /Ashen Vanguard/ }).click();
  await expect(page.getByTestId('ruin-inspection')).toContainText('Reedwatch');
  await page.screenshot({ path: testInfo.outputPath('reedwatch-ruins.png'), fullPage: true });
  await page.getByRole('tab', { name: /Settlements/ }).click();
  await page.getByTestId('settlement-registry').getByRole('button', { name: /Ashen Hearth/ }).click();
  await openProduction(page, 'land');
  await page.getByRole('button', { name: 'Recruit Hearth caravan', exact: true }).click();
  let turn = 4;
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  }
  await page.getByRole('tab', { name: /Armies/ }).click();
  await page.getByTestId('army-registry').getByRole('button', { name: /Hearth caravan/ }).click();
  const paths = new Map<number, number[]>([[home.cell, []]]);
  const frontier = [home.cell];
  for (let cursor = 0; cursor < frontier.length && !paths.has(ruinCell); cursor++) {
    const current = frontier[cursor]!;
    for (const cell of neighbors(current, fixture.world.width, fixture.world.height)) {
      if (paths.has(cell) || !isPassable(fixture.world.terrain[cell]!)) continue;
      paths.set(cell, [...paths.get(current)!, cell]); frontier.push(cell);
    }
  }
  const route = paths.get(ruinCell);
  expect(route).toBeTruthy();
  for (const cell of route!) {
    const cost = [2, 3].includes(fixture.world.terrain[cell]!) ? 2 : 1;
    const movement = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownArmies.find(army => army.unitId === 'unit.colonist')?.movement);
    if (movement! < cost) {
      await page.getByRole('button', { name: 'End turn', exact: true }).click();
      await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
    }
    await page.getByRole('button', { name: `Move to cell ${cell}`, exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(`explored hex ${cell}`);
  }
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${++turn}`);
  await page.getByLabel('Settlement name', { exact: true }).fill('New Reedwatch');
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await expect(page.getByTestId('settlement-registry')).toContainText('New Reedwatch');
  expect(await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ruins.length)).toBe(0);
  const rebuilt = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements.find(town => town.name === 'New Reedwatch'));
  expect(rebuilt?.cell).toBe(ruinCell);
  expect(rebuilt?.founderFactionId).toBe(fixture.turnOwnerId);
});

test('defending a settlement pauses the AI assault and resolves the AI capture after human withdrawal', async ({ page }) => {
  const fixture = conquestCampaign();
  // Swap the human seat in this authored fixture; every siege/battle/capture remains a real order.
  fixture.turnOwnerId = CONQUEST_FIXTURE.enemyFactionId;
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'defend-reedwatch.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  const battle = await page.evaluate(() => window.__THEANDRIL__?.getSummary()?.battle);
  expect(battle?.settlementId).toBe(CONQUEST_FIXTURE.settlementId);
  expect(battle?.defenderFactionId).toBe(fixture.turnOwnerId);
  await page.getByRole('button', { name: 'Withdraw', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__?.getSummary()?.ownSettlements.length)).toBe(0);
  await expect(page.getByTestId('chronicle')).toContainText(/Reedwatch: occupy|Reedwatch: sack/);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
});
