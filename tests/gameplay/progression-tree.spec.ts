import { expect, test, type Page } from '@playwright/test';
import { applyCommand, createGame, getObservation, serializeGame } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';

async function openCampaign(page: Page) {
  const game = createGame({ seed: 20260905, size: 'tiny', pace: 'standard', factionCount: 2 });
  const found = applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Scholars Hearth' });
  if (!found.ok) throw new Error(found.error);
  // Let the real founded settlement mature until its reach has a legal expansion candidate.
  // A population-one town already owns its entire first ring, so research cannot grow it yet.
  for (let wait = 0; getObservation(game, game.turnOwnerId).land.settlements[0]!.borderExpansion.rate === 0 && wait < 16; wait++) {
    const advanced = applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId });
    if (!advanced.ok) throw new Error(advanced.error);
  }
  if (!getObservation(game, game.turnOwnerId).land.settlements[0]!.borderExpansion.rate) throw new Error('Research scenario did not mature into a legal expanding town.');
  game.factions[0]!.knowledge = 1000; game.factions[0]!.treasury = 1000;
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'research-ready.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  return page.getByRole('dialog', { name: 'Realm progression', exact: true });
}

test('research dependencies support keyboard inspection, exact purchases and permanent policy choices across a save', async ({ page }, testInfo) => {
  const dialog = await openCampaign(page);
  const tree = dialog.getByTestId('research-tree');
  const ocean = tree.getByTestId('progression-technology.ocean_navigation');
  const coast = tree.getByTestId('progression-technology.coastal_navigation');
  const before = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await expect(ocean).toHaveAttribute('data-state', 'locked');
  await expect(ocean.getByRole('button', { name: 'Research Ocean navigation', exact: true })).toBeDisabled();
  await ocean.getByRole('button', { name: 'View prerequisite Coastal navigation', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(coast).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before);
  await coast.getByRole('button', { name: 'Research Coastal navigation', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(coast).toHaveAttribute('data-state', 'researched');
  await expect(coast).toBeFocused();
  await expect(ocean).toHaveAttribute('data-state', 'available');
  await expect(ocean).toContainText('Coastal navigation · researched');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(970);
  await ocean.getByRole('button', { name: 'Research Ocean navigation', exact: true }).click();
  await expect(ocean).toHaveAttribute('data-state', 'researched');
  await expect(ocean).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(890);
  await tree.getByRole('button', { name: 'Civic knowledge', exact: true }).click();
  await expect(tree.getByTestId('progression-technology.civic_accounts')).toBeFocused();
  await expect(tree.getByTestId('progression-technology.civic_accounts')).toContainText('400 knowledge');
  await dialog.screenshot({ path: testInfo.outputPath('research-branch-tree-desktop.png') });
  await dialog.getByRole('tab', { name: 'Technology', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('tab', { name: 'Institutions', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: 'Adopt Common stewardship', exact: true }).click();
  const excluded = dialog.getByTestId('progression-institution.charter_compact');
  await expect(excluded).toHaveAttribute('data-state', 'excluded');
  await expect(excluded).toContainText('Permanently excluded by Common stewardship');
  await expect(excluded.getByRole('button')).toBeDisabled();
  await dialog.getByRole('tab', { name: 'Military doctrine', exact: true }).click();
  await dialog.getByRole('button', { name: 'Adopt March columns', exact: true }).click();
  await expect(dialog.getByTestId('progression-doctrine.shield_cohesion')).toContainText('Permanently excluded by March columns');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Realm progression', exact: true })).toBeFocused();
  const settings = page.getByTestId('campaign-menu');
  await settings.locator('summary').click();
  await settings.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const saved = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), progression: window.__THEANDRIL__!.getSummary()!.progression }));
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
  expect(await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), progression: window.__THEANDRIL__!.getSummary()!.progression }))).toEqual(saved);
});

test('narrow research keeps every real branch and its linked purchase reachable without horizontal scrolling', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dialog = await openCampaign(page);
  const tree = dialog.getByTestId('research-tree');
  const view = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.progression);
  expect(view.technologyChoices).toHaveLength(10);
  await expect(tree.locator('.research-node')).toHaveCount(view.technologyChoices.length);
  await tree.getByRole('button', { name: 'Navigation', exact: true }).click();
  const coast = tree.getByTestId('progression-technology.coastal_navigation');
  await expect(coast).toBeFocused();
  const purchase = coast.getByRole('button', { name: 'Research Coastal navigation', exact: true });
  await purchase.scrollIntoViewIfNeeded();
  expect(await purchase.evaluate(element => { const rect = element.getBoundingClientRect(); const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2); return rect.height >= 44 && (hit === element || element.contains(hit)); })).toBe(true);
  await purchase.click();
  await expect(coast).toHaveAttribute('data-state', 'researched');
  const ocean = tree.getByTestId('progression-technology.ocean_navigation');
  await ocean.getByRole('button', { name: 'View prerequisite Coastal navigation', exact: true }).click();
  await expect(coast).toBeFocused();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await tree.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.screenshot({ path: testInfo.outputPath('research-prerequisite-narrow.png') });
  // The new cross-branch discovery changes a real town's quoted expansion rate.
  const beforeGrowth = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.borderExpansion.rate);
  const estates = tree.getByTestId('progression-technology.surveyed_estates');
  await expect(estates.getByRole('button', { name: 'Research Surveyed estates', exact: true })).toBeDisabled();
  await estates.getByRole('button', { name: 'View prerequisite Seasonal stewardship', exact: true }).click();
  const stewardship = tree.getByTestId('progression-technology.stewardship');
  await expect(stewardship).toBeFocused();
  await stewardship.getByRole('button', { name: 'Research Seasonal stewardship', exact: true }).click();
  await expect(stewardship).toHaveAttribute('data-state', 'researched');
  await expect(estates).toHaveAttribute('data-state', 'available');
  await estates.getByRole('button', { name: 'Research Surveyed estates', exact: true }).click();
  await expect(estates).toHaveAttribute('data-state', 'researched');
  await expect(estates).toBeFocused();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(874);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.land.settlements[0]!.borderExpansion.rate)).toBe(beforeGrowth + 1);
  await dialog.screenshot({ path: testInfo.outputPath('surveyed-estates-narrow.png') });
});
