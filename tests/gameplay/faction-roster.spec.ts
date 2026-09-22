import { closeManagement, closeCampaignOptions, openRegistry, selectFromRegistry, openSelectedOrders, openProduction } from './ui-navigation';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { BUILDINGS, FACTIONS, FACTION_ECOLOGIES, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS } from '@theandril/content';
import { deserializeCampaign, importSave } from '@theandril/persistence';
import { stateHash } from '@theandril/sim';
import { yieldText } from '../../apps/web/src/land';

const newCultures = FACTIONS.slice(6);
const menu = (page: Page) => page.getByTestId('campaign-menu');
const hash = (page: Page) => page.evaluate(() => window.__THEANDRIL__!.getStateHash());

async function openMenu(page: Page) {
  await closeManagement(page);
  if (await menu(page).getAttribute('open') === null) await menu(page).locator('summary').click();
}
async function exportCampaign(page: Page) {
  await openMenu(page);
  const ready = page.waitForEvent('download');
  await menu(page).getByRole('button', { name: 'Export campaign', exact: true }).click();
  const download = await ready, path = await download.path();
  if (!path) throw new Error('No campaign export was downloaded.');
  expect(download.suggestedFilename()).toMatch(/\.theandril$/);
  return readFile(path);
}
async function setup(page: Page, definitionId: string, count = 2) {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Player faction', exact: true }).selectOption(definitionId);
  await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('17');
  await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill(String(count));
  await page.getByRole('combobox', { name: 'Campaign pace', exact: true }).selectOption('short');
}
async function begin(page: Page, definitionId: string) {
  await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return view.factions.find(faction => faction.id === view.factionId)?.definitionId;
  })).toBe(definitionId);
}
async function reachable(locator: Locator) {
  await locator.evaluate(element => element.scrollIntoView({ block: 'center' }));
  expect(await locator.evaluate(element => {
    const bounds = element.getBoundingClientRect(), hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit !== null && (hit === element || element.contains(hit));
  })).toBe(true);
}

for (const faction of newCultures) test(`${faction.name} is a real chosen culture through founding, paid construction and portable saves`, async ({ page }, testInfo) => {
  await setup(page, faction.id);
  const identity = page.getByRole('region', { name: 'Player culture', exact: true }).getByTestId('faction-identity');
  await expect(identity).toHaveAttribute('data-definition-id', faction.id);
  await expect(identity).toContainText(FACTION_PROFILES[faction.id]!.description);
  for (const affinity of FACTION_ECOLOGIES[faction.id]!.affinities) await expect(identity.getByRole('list', { name: 'Biome affinities' })).toContainText(yieldText(affinity.yields));
  await identity.locator('summary').click();
  await expect(identity).toContainText(FACTION_PROFILES[faction.id]!.recruitmentRationale);
  await begin(page, faction.id);
  const colonyName = `${faction.name} witness`;
  const caravan = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.canFound)!.id);
  await selectFromRegistry(page, 'armies', /Hearth caravan/); await openSelectedOrders(page);
  await page.getByRole('textbox', { name: 'Settlement name', exact: true }).fill(colonyName);
  await page.getByRole('button', { name: 'Found settlement', exact: true }).click();
  await openRegistry(page, 'settlements');
  await expect(page.getByTestId('settlement-registry')).toContainText(colonyName);
  await selectFromRegistry(page, 'settlements', colonyName);
  await openSelectedOrders(page);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.some(army => army.id === id), caravan)).toBe(false);
  const town = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownSettlements[0]!.id);
  const culture = page.getByTestId('realm-culture');
  await culture.locator(':scope > summary').click();
  await expect(culture.getByTestId('faction-identity')).toHaveAttribute('data-definition-id', faction.id);
  await expect(culture).toContainText(FACTION_PROFILES[faction.id]!.description);
  await culture.locator(':scope > summary').click();
  const beforeCoin = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  const cellar = BUILDINGS.find(building => building.id === 'building.granary')!;
  await openProduction(page, 'building');
  await page.getByRole('button', { name: /^Build Root cellar/ }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownSettlements.find(item => item.id === id)!.queue[0]?.itemId, town)).toBe(cellar.id);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(beforeCoin - cellar.coinCost);
  await openMenu(page);
  await menu(page).getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  const saved = await hash(page);
  await page.reload();
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => hash(page)).toBe(saved);
  const bytes = await exportCampaign(page), portable = deserializeCampaign(await importSave(bytes));
  expect(portable.game.rosterVersion).toBe(4);
  expect(portable.game.factions.find(item => item.id === portable.game.turnOwnerId)!.definitionId).toBe(faction.id);
  expect(stateHash(portable.game)).toBe(saved);
  expect(portable.archive.records).toEqual(expect.arrayContaining([
    expect.objectContaining({ ok: true, command: expect.objectContaining({ type: 'found' }) }),
    expect.objectContaining({ ok: true, command: expect.objectContaining({ type: 'queue' }) }),
  ]));
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await hash(page)).not.toBe(saved);
  await openMenu(page);
  const chooser = page.waitForEvent('filechooser');
  await menu(page).getByRole('button', { name: 'Import campaign', exact: true }).click();
  await (await chooser).setFiles({ name: 'culture-witness.theandril', mimeType: 'application/gzip', buffer: bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect(await hash(page)).toBe(saved);
  await openRegistry(page, 'settlements');
  await selectFromRegistry(page, 'settlements', new RegExp(colonyName)); await openSelectedOrders(page);
  await page.getByTestId('realm-culture').locator(':scope > summary').click();
  await expect(page.getByTestId('realm-culture').getByTestId('faction-identity')).toHaveAttribute('data-definition-id', faction.id);
  await page.getByTestId('realm-culture').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`${faction.id}-saved-economy.png`) });
});

test('twenty-four unique authored choices include accessible Vesper in a real twenty-four-seat campaign without disclosing unseen realms', async ({ page }) => {
  await setup(page, 'faction.vesper_court', 24);
  const selector = page.getByRole('combobox', { name: 'Player faction', exact: true });
  await reachable(selector);
  await expect(selector.locator('option')).toHaveCount(24);
  const choices = await selector.locator('option').evaluateAll(options => options.map(option => ({ value: (option as HTMLOptionElement).value, name: option.textContent })));
  expect(choices).toEqual(FACTIONS.map(faction => ({ value: faction.id, name: faction.name })));
  expect(new Set(choices.map(choice => choice.value)).size).toBe(24);
  expect(new Set(choices.map(choice => choice.name)).size).toBe(24);
  await expect(selector.getByRole('option', { name: 'Vesper Court', exact: true })).toHaveCount(1);
  await expect(selector).toHaveValue('faction.vesper_court');
  await expect(page.getByTestId('faction-identity')).toHaveAttribute('data-definition-id', 'faction.vesper_court');
  await expect(page.getByTestId('faction-density-help')).toContainText('24 introductory faction templates are authored');
  await expect(page.getByTestId('faction-density-help')).toContainText('Additional seats are generated variants');
  await begin(page, 'faction.vesper_court');
  await expect(page.getByTestId('campaign-faction-count')).toHaveText('24 realms');
  const observed = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  expect(observed.factions.length).toBeLessThan(24);
  expect(observed.cells).toEqual([]);
  // Omniscient roster assertions use only an explicitly requested portable save,
  // never an extra production publication or a debug-state mutation hook.
  const portable = deserializeCampaign(await importSave(await exportCampaign(page)));
  expect(portable.game.factions).toHaveLength(24);
  expect(portable.game.rosterVersion).toBe(4);
  expect(portable.game.factions[0]!.definitionId).toBe('faction.vesper_court');
  const definitions = portable.game.factions.map(faction => faction.definitionId);
  expect(new Set(definitions)).toEqual(new Set(FACTIONS.map(faction => faction.id)));
  for (const definition of FACTIONS) expect(definitions.filter(id => id === definition.id)).toHaveLength(1);
});

test('all twenty-four profiles and actual drawbacks remain readable by touch and keyboard at narrow width', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.getByTestId('campaign-menu').locator('summary').tap();
    await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
    await page.getByTestId('campaign-menu').locator('summary').tap();
    const selector = page.getByRole('combobox', { name: 'Player faction', exact: true });
    await expect(selector.locator('option')).toHaveCount(24);
    for (const faction of FACTIONS) {
      await reachable(selector); await selector.selectOption(faction.id);
      const identity = page.getByTestId('faction-identity');
      await expect(identity).toHaveAttribute('data-definition-id', faction.id);
      await reachable(identity.locator('.faction-profile'));
      expect((await identity.boundingBox())!.width).toBeGreaterThan(200);
      const affinities = identity.getByRole('list', { name: 'Biome affinities' });
      for (const row of await affinities.getByRole('listitem').all()) await reachable(row);
      await identity.locator('summary').focus(); await page.keyboard.press('Enter');
      const preferences = identity.getByRole('list', { name: 'AI land recruitment preferences' });
      await expect(preferences.getByRole('listitem')).toHaveCount(Object.keys(FACTION_RECRUITMENT_WEIGHTS[faction.id]!).length);
      await reachable(preferences.getByRole('listitem').last());
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await identity.locator('summary').focus(); await page.keyboard.press('Space');
      await expect(preferences).not.toBeVisible();
    }
    await selector.evaluate(element => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: testInfo.outputPath('faction-profile-narrow.png') });
    await page.getByTestId('faction-identity').locator('summary').tap();
    await reachable(page.getByRole('list', { name: 'AI land recruitment preferences' }));
    await page.screenshot({ path: testInfo.outputPath('faction-recruitment-tendencies-narrow.png') });
    await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
    await reachable(page.getByRole('button', { name: 'Begin campaign', exact: true }));
  } finally { await context.close(); }
});
