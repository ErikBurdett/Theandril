import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { FACTIONS } from '@theandril/content';
import { characterCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { closeCampaignOptions, closeManagement, openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';
import { expectLocalMapPixels } from './map-pixel-evidence';

async function importCampaign(page: Page, state: GameState) {
  await page.locator('input[type=file]').setInputFiles({ name: 'hermes-ui-slice.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(state))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function evidence(info: TestInfo, name: string, value: unknown) {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function settings(page: Page) {
  const menu = page.getByTestId('campaign-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
}

test('R23 repeated public loads and cross-size imports retain one responsive map control and canvas', async ({ page, browser }, info) => {
  const consoleMessages: string[] = [], errors: string[] = [], records: unknown[] = [];
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const cdp = await page.context().newCDPSession(page);
  const saveEvidence = () => writeFile(info.outputPath('lifecycle.json'), JSON.stringify({ browser: browser.version(), consoleMessages, errors, records }, null, 2));
  let initialListeners: Record<string, number> | undefined;
  const capture = async (stage: string) => {
    await expect(page.getByRole('button', { name: 'Save campaign', exact: true, includeHidden: true })).toBeEnabled();
    const dom = await page.evaluate(() => ({ controls: document.querySelectorAll('[data-testid=faction-overview-control]').length, canvases: document.querySelectorAll('canvas').length, mapNodes: document.querySelector('[data-testid=map-container]')!.querySelectorAll('*').length, debugHookPresent: Boolean(window.__THEANDRIL__) }));
    const listeners: Record<string, number> = {};
    for (const expression of ['window', 'document', 'document.querySelector("canvas")']) {
      const { result } = await cdp.send('Runtime.evaluate', { expression });
      if (result.objectId) {
        listeners[expression] = (await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })).listeners.length;
        await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
      }
    }
    records.push({ stage, ...dom, listeners }); await saveEvidence();
    console.log(JSON.stringify({ stage, ...dom, listeners }));
    expect.soft(dom.controls, stage).toBe(1); expect.soft(dom.canvases, stage).toBe(1);
    initialListeners ??= listeners;
    expect.soft(listeners, `${stage} attached listener counts`).toEqual(initialListeners);
  };
  try {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260909');
    await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('small');
    await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('12');
    await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
    const canvas = await page.locator('canvas').elementHandle();
    await capture('generated-small12'); await settings(page);
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
    const download = await downloading, downloadedPath = await download.path();
    if (!downloadedPath) throw new Error('Missing exported Small campaign');
    const small = await readFile(downloadedPath);
    for (let index = 1; index <= 4; index++) {
      await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
      await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
      await capture(`load-${index}`);
    }
    const tiny = Buffer.from(await exportSave(serializeGame(borderBattleCampaign())));
    for (let index = 1; index <= 4; index++) {
      await page.locator('input[type=file]').setInputFiles({ name: `replacement-${index}.theandril`, mimeType: 'application/gzip', buffer: index % 2 ? small : tiny });
      await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      await capture(`import-${index}-${index % 2 ? 'small' : 'tiny'}`);
    }
    await page.locator('input[type=file]').setInputFiles({ name: 'corrupt.theandril', mimeType: 'application/gzip', buffer: Buffer.from('not a save') });
    await expect(page.getByTestId('feedback')).toHaveClass(/error/);
    await capture('failed-import');
    await closeCampaignOptions(page);
    // Use the newest actual control even during RED, so all replacement counts
    // are retained instead of stopping at the first duplicate locator error.
    const control = page.getByTestId('faction-overview-control').last();
    await control.locator(':scope > summary').click();
    await control.getByRole('button', { name: 'Realms', exact: true }).click();
    await expect(control.getByRole('button', { name: 'Realms', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await control.getByRole('button', { name: 'Clear realms', exact: true }).click();
    for (const checkbox of await control.getByRole('checkbox').all()) await expect(checkbox).not.toBeChecked();
    await control.getByRole('button', { name: 'All known realms', exact: true }).click();
    for (const checkbox of await control.getByRole('checkbox').all()) await expect(checkbox).toBeChecked();
    await control.locator(':scope > summary').click();
    await openRealmAffairs(page);
    await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
    await openSelectedOrders(page);
    await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click();
    await expect(page.getByTestId('battle-panel')).toBeVisible();
    await expect(control).toBeHidden();
    await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
    await expect(page.getByTestId('battle-panel')).toHaveCount(0);
    await expect(control.locator(':scope > summary')).toContainText('Realms');
    await capture('after-battle');
    expect(await canvas!.evaluate(element => element === document.querySelector('canvas'))).toBe(true);
    await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
    await page.getByTestId('map-container').focus(); await page.keyboard.press('Enter');
    await expect(page.getByTestId('map-actions')).toBeVisible();
    await page.keyboard.press('Escape');
    await expectLocalMapPixels(page, info, 'lifecycle-desktop');
    await page.screenshot({ path: info.outputPath('lifecycle-after-battle.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await control.locator(':scope > summary').click();
    await control.getByRole('button', { name: 'Terrain', exact: true }).click();
    await expect(control.getByRole('button', { name: 'Terrain', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('lifecycle-controls-390.png') });
    // Mode selection deliberately fits the full world. Its small known patch
    // can sit behind the open menu; inspect local terrain with that menu closed.
    await control.locator(':scope > summary').click();
    await page.screenshot({ path: info.outputPath('lifecycle-overview-390.png') });
    await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
    await expectLocalMapPixels(page, info, 'lifecycle-390');
    await page.screenshot({ path: info.outputPath('lifecycle-local-390.png') });
    expect.soft(consoleMessages.filter(message => /same key|Encountered two children/.test(message))).toEqual([]);
    expect(errors).toEqual([]);
  } finally { await saveEvidence(); await cdp.detach(); }
});

for (const definitionId of ['faction.ashen_compact', 'faction.reedbound_council']) {
  test(`R18 paid Waykeeper resolves shared art for ${definitionId}`, async ({ page }, info) => {
    const consoleMessages: string[] = [], errors: string[] = [], requests: string[] = [];
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') consoleMessages.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/\/art\/.*\.png/.test(request.url())) requests.push(new URL(request.url()).pathname); });
    // Authored funded/infrastructure fixture, not a natural campaign. Appointment,
    // attachment and all inspection below use public controls; no debug mutations.
    const game = characterCampaign();
    game.factions[0]!.definitionId = definitionId;
    game.factions[0]!.color = FACTIONS.find(faction => faction.id === definitionId)!.color;
    game.settlements[C.homeId]!.buildings.push('building.archive');
    const validated = deserializeGame(serializeGame(game));
    const catalog = JSON.parse(await readFile('apps/web/public/art/catalog.json', 'utf8'));
    const asset = catalog.assets.find((item: { id: string }) => item.id === 'character.waykeeper');
    const atlas = catalog.atlases.find((item: { id: string }) => item.id === asset.atlasId);
    expect(atlas.width * atlas.height * 4).toBe(4 * 1024 * 1024);
    await page.goto('/'); await importCampaign(page, validated);
    await selectFromRegistry(page, 'settlements', C.homeName); await openSelectedOrders(page);
    await page.getByTestId('character-appointments').locator('summary').click();
    const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
    await page.getByRole('button', { name: 'Appoint Waykeeper', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.filter(item => item.definitionId === 'character.waykeeper').length)).toBe(1);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(before - 40);
    await page.getByRole('button', { name: 'Open character roster', exact: true }).click();
    const caster = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.definitionId === 'character.waykeeper')!);
    const roster = page.getByRole('dialog', { name: 'Characters & agents', exact: true });
    await roster.getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
    const art = roster.locator('[data-art-content-id="character.waykeeper"]');
    await expect(art).toHaveCount(2);
    for (const icon of await art.all()) {
      await expect(icon).toHaveAttribute('data-art-state', 'shared');
      await expect(icon).toHaveAttribute('data-art-rendered-id', 'character.waykeeper');
      await expect(icon).toHaveAttribute('title', /shared Waykeeper silhouette/);
      await expect(icon).not.toContainText('Generic');
    }
    await expect(roster.getByRole('img', { name: /shared Waykeeper silhouette/ })).toHaveCount(1);
    await roster.screenshot({ path: info.outputPath('waykeeper-paid-desktop.png') });
    const hash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
    await page.setViewportSize({ width: 390, height: 844 });
    await roster.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
    await roster.getByRole('button', { name: 'Assign character', exact: true }).click();
    await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.id === id)?.location, caster.id)).toEqual({ kind: 'army', armyId: C.armyId });
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).not.toBe(hash);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await roster.screenshot({ path: info.outputPath('waykeeper-assigned-390.png') });
    await roster.getByRole('button', { name: 'Close characters', exact: true }).click();
    await closeManagement(page); await closeCampaignOptions(page);
    await page.getByRole('button', { name: 'Characters & agents', exact: true }).click();
    await expect(roster.locator('[data-art-content-id="character.waykeeper"][data-art-state="shared"]').first()).toBeVisible();
    expect(requests.filter(url => url === atlas.imageUrl)).toHaveLength(1);
    const otherBattlePages = catalog.atlases.filter((item: { id: string }) => item.id.startsWith('battle') && item.id !== atlas.id);
    for (const other of otherBattlePages) expect(requests).not.toContain(other.imageUrl);
    expect(errors).toEqual([]);
    await evidence(info, 'waykeeper-evidence', { definitionId, caster, paidCoin: 40, atlas, requests, consoleMessages, errors });
  });
}
