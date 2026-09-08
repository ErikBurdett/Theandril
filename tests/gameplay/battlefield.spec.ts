import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { characterBattleCampaign, CHARACTER_FIXTURE as C } from '../../packages/test-fixtures/src/character-fixture';
import { conquestCampaign } from '../../packages/test-fixtures/src/conquest-fixture';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../packages/test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { closeCampaignOptions, closeManagement, openCampaignJournal, openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';

async function load(page: Page, game: GameState) {
  const canonical = serializeGame(deserializeGame(serializeGame(game)));
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'battlefield.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(canonical)) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
}
async function war(page: Page) {
  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await openSelectedOrders(page);
}
async function ready(page: Page) {
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.active)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(2);
}
async function settings(page: Page) {
  const menu = page.getByTestId('campaign-menu');
  if (!await menu.evaluate(element => (element as HTMLDetailsElement).open)) await menu.locator('summary').click();
}
async function expectSeparatedFigures(page: Page) {
  const scene = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
  for (const [index, actor] of scene.actors.entries()) {
    const box = actor.bounds!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(scene.width); expect(box.y + box.height).toBeLessThanOrEqual(scene.height);
    for (const other of scene.actors.slice(index + 1)) {
      const next = other.bounds!;
      expect(box.x + box.width <= next.x || next.x + next.width <= box.x || box.y + box.height <= next.y || next.y + next.height <= box.y, `${actor.id} and ${other.id} complete sprite/label/motion envelopes`).toBe(true);
    }
  }
  if (scene.actorScale === .5) {
    const titleTop = await page.evaluate(() => document.querySelector('[data-testid=battle-attacker-label]')!.getBoundingClientRect().top - document.querySelector('[data-testid=map-container]')!.getBoundingClientRect().top);
    for (const actor of scene.actors) expect(actor.bounds!.y + actor.bounds!.height).toBeLessThanOrEqual(titleTop - 28);
  }
}
async function captureLiveCast(page: Page, info: TestInfo, effectId: string, casterId: string, filename: string) {
  const pause = page.getByRole('button', { name: 'Pause actions', exact: true });
  const evidence = await page.evaluate(async ({ effectId, casterId }) => {
    const effects = new Set<string>(), poses = new Set<string>();
    const hash = window.__THEANDRIL__!.getStateHash();
    let visibleFrames = 0;
    for (let i = 0; i < 180; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const scene = window.__THEANDRIL__!.getBattleDiagnostics()!;
      const effect = scene.effects.find(item => item.assetId === effectId && item.sourceId === casterId);
      const caster = scene.actors.find(item => item.id === casterId);
      if (effect) {
        effects.add(effect.frameId);
        const target = scene.actors.find(item => item.id === effect.targetId)!.bounds!;
        const field = document.querySelector('[data-testid=map-container]')!.getBoundingClientRect();
        if (field.top + target.y < 0 || field.top + target.y + target.height > innerHeight) throw new Error('The actual cast target is offscreen before any test scrolling.');
        if (document.activeElement?.matches('[data-testid=map-container],canvas')) throw new Error('Revealing the cast stole keyboard focus.');
        visibleFrames++;
      }
      if (caster?.frameId) poses.add(caster.frameId);
      const frame = Number(effect?.frameId.split('/').at(-1));
      if (frame >= 3 && frame <= 4) return { hash, visibleFrames, effects: [...effects], poses: [...poses] };
    }
    throw new Error('The live spell did not reach its visible middle frames.');
  }, { effectId, casterId });
  await pause.click();
  const held = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
  const effect = held.effects.find(item => item.assetId === effectId && item.sourceId === casterId)!;
  expect(held.paused).toBe(true); expect(effect).toBeTruthy();
  expect(Number(effect.frameId.split('/').at(-1))).toBeGreaterThanOrEqual(2);
  expect(Number(effect.frameId.split('/').at(-1))).toBeLessThanOrEqual(5);
  expect(evidence.effects.length).toBeGreaterThan(1); expect(evidence.poses.length).toBeGreaterThan(1);
  expect(evidence.visibleFrames).toBeGreaterThan(1);
  expect(held.actors.find(item => item.id === casterId)?.frameId).toMatch(/character\.waykeeper\/cast\/se\/[2-5]$/);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(evidence.hash);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath(filename + '.png') });
  const raw = JSON.stringify({ ...evidence, held }, null, 2);
  await writeFile(info.outputPath(filename + '-frames.json'), raw);
  await mkdir('docs/performance', { recursive: true });
  await writeFile(`docs/performance/slice0035-cast-${effectId === 'effect.battle_ward' ? 'ward' : 'ember'}.json`, raw);
  await info.attach(filename + '-frames.json', { body: raw, contentType: 'application/json' });
}

test('battlefield pauses for orders, presents actual strikes and restores a saved round and map without replay mutations', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await load(page, borderBattleCampaign());
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(1);
  await war(page); await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click(); await ready(page);
  const initial = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), scene: window.__THEANDRIL__!.getBattleDiagnostics(), battle: window.__THEANDRIL__!.getSummary()!.battle! }));
  expect(initial.scene?.formations).toHaveLength(initial.battle.combat.attacker.length + initial.battle.combat.defender.length);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('field-deployment.png') });
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.eventTotal)).toBeGreaterThan(0);
  const playedHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  expect(playedHash).not.toBe(initial.hash);
  await page.getByRole('button', { name: 'Skip animations', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.completed)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(playedHash);
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  const finalHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await openCampaignJournal(page);
  await page.getByRole('button', { name: 'Watch recorded battle actions', exact: true }).click();
  await expect(page.getByTestId('battle-replay')).toBeVisible();
  const replay = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
  expect(replay.completed).toBe(false); expect(replay.eventCount).toBeLessThan(replay.eventTotal);
  await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption('4');
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(finalHash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.active)).toBe(false);
  await settings(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(playedHash);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.eventTotal)).toBe(0);
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(finalHash);
  expect(errors).toEqual([]);
});

test('paid personal Waykeeper and separate research enable actual ward and ember target controls at narrow width', async ({ page }, info) => {
  const game = characterBattleCampaign();
  game.factions[0]!.knowledge = 120;
  game.settlements[C.homeId]!.buildings.push('building.archive');
  await load(page, game);
  await selectFromRegistry(page, 'settlements', 'Ashen Hearth');
  await openSelectedOrders(page);
  await page.getByTestId('character-appointments').locator('summary').click();
  const treasury = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury);
  await page.getByRole('button', { name: 'Appoint Waykeeper', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.filter(item => item.definitionId === 'character.waykeeper').length)).toBe(1);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.treasury)).toBe(treasury - 40);
  await page.getByRole('button', { name: 'Open character roster', exact: true }).click();
  const caster = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.definitionId === 'character.waykeeper')!);
  await page.getByRole('button', { name: `Inspect ${caster.name} (${caster.id})`, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Personal magical aptitude' })).toContainText('Flame 1');
  await page.getByRole('combobox', { name: 'Assign to army', exact: true }).selectOption(C.armyId);
  await page.getByRole('button', { name: 'Assign character', exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.characters.find(item => item.id === id)?.location, caster.id)).toMatchObject({ kind: 'army', armyId: C.armyId });
  await page.getByRole('button', { name: 'Close characters', exact: true }).click();
  await closeManagement(page);
  await page.getByRole('button', { name: 'Realm progression', exact: true }).click();
  await page.getByRole('tab', { name: 'Arcane Theory', exact: true }).click();
  await page.getByTestId('arcane-research').locator('summary').click();
  await page.getByRole('button', { name: 'Research Contained ember projection', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(84);
  await page.getByRole('button', { name: 'Research Measured rune binding', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.knowledge)).toBe(36);
  await page.getByRole('button', { name: 'Close realm progression', exact: true }).click();
  await selectFromRegistry(page, 'armies', 'Witness column');
  await war(page); await page.getByRole('button', { name: 'Attack Reedbound Watch (army.4)', exact: true }).click(); await ready(page);
  await page.getByLabel(`Automatic Cinder thread (${caster.id})`, { exact: true }).uncheck();
  await page.getByLabel(`Automatic Bound ward (${caster.id})`, { exact: true }).uncheck();
  await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption('0.5');
  await page.getByRole('button', { name: `Bound ward (${caster.id})`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battleScene!.formations.some(item => item.ward === 8))).toBe(true);
  await captureLiveCast(page, info, 'effect.battle_ward', caster.id, 'actual-bound-ward');
  await page.getByRole('button', { name: 'Brace', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  await page.getByRole('button', { name: `Cinder thread (${caster.id})`, exact: true }).click();
  await captureLiveCast(page, info, 'effect.battle_ember', caster.id, 'actual-cinder-thread');
  const magicHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.actorScale)).toBe(.5);
  await page.getByRole('combobox', { name: 'Inspect formation or officer', exact: true }).selectOption(caster.id);
  await expectSeparatedFigures(page);
  await expect(page.locator('.command-bar')).toHaveCSS('position', 'relative');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  const footerGeometry = await page.evaluate(() => {
    const field = document.querySelector('[data-testid=map-container]')!.getBoundingClientRect();
    const footer = document.querySelector('.command-bar')!.getBoundingClientRect();
    return { fieldBottom: field.bottom + scrollY, footerTop: footer.top + scrollY };
  });
  expect(footerGeometry.footerTop).toBeGreaterThanOrEqual(footerGeometry.fieldBottom);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByTestId('battle-panel').screenshot({ path: info.outputPath('battle-magic-narrow.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(magicHash);
  await settings(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
  await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(magicHash);
  expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.battleAbilities.filter(item => item.sourceId === id).every(item => !item.automatic), caster.id)).toBe(true);
});

test('fortified assault opens the shared battlefield and reduced motion keeps decisions explicit', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, conquestCampaign()); await war(page);
  await page.getByRole('button', { name: 'Besiege Reedwatch', exact: true }).click();
  await closeManagement(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click(); await ready(page);
  await expect(page.getByRole('heading', { name: /Settlement assault/ })).toBeVisible();
  const before = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  expect(await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.fortification)).toBeGreaterThan(0);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('fortified-assault.png') });
  await page.getByRole('button', { name: 'Step one battle round', exact: true }).click();
  await expect(page.getByTestId('battle-round')).toHaveText('1');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).not.toBe(before);
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.completed)).toBe(true);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.effects)).toEqual([]);
  await expect(page.getByRole('button', { name: 'Watch battle', exact: true })).toBeVisible();
});

test('naval battlefield renders the actual hull formations and excludes embarked cargo', async ({ page }, info) => {
  const game = navalCampaign(); game.armies[N.enemyFleetId]!.cell = N.shallowCell; refreshAuthoredSight(game);
  await load(page, game);
  await selectFromRegistry(page, 'armies', N.cargoName);
  await openSelectedOrders(page);
  await page.getByRole('button', { name: 'Embark army', exact: true }).click();
  await page.getByRole('button', { name: 'Select carrying fleet', exact: true }).click();
  await war(page); await page.getByRole('button', { name: `Attack ${N.enemyFleetName} (${N.enemyFleetId})`, exact: true }).click(); await ready(page);
  const scene = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics());
  expect(scene?.domain).toBe('naval'); expect(scene?.formations).toHaveLength(4);
  expect(scene?.actors.filter(actor => actor.assetId?.startsWith('unit.transport.'))).toHaveLength(3);
  expect(scene?.actors.some(actor => actor.assetId?.startsWith('unit.colonist.'))).toBe(false);
  await expectSeparatedFigures(page);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('naval-battlefield.png') });
  const navalHash = await page.evaluate(() => window.__THEANDRIL__!.getStateHash());
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.actorScale)).toBe(.5);
  await expectSeparatedFigures(page);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('naval-battlefield-narrow.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(navalHash);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption('4');
  await page.getByRole('button', { name: 'Watch battle', exact: true }).click();
  await settings(page); await page.getByRole('button', { name: 'New campaign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Begin campaign', exact: false })).toBeVisible();
  const paused = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), frame: window.__THEANDRIL__!.getPerformanceCounters().frameCount! }));
  // Actual warmed frames exceed the round scheduler delay; the old hidden
  // campaign must remain unchanged rather than resume behind its setup form.
  await page.waitForFunction(frame => window.__THEANDRIL__!.getPerformanceCounters().frameCount! >= frame + 45, paused.frame);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(paused.hash);
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Watch battle', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Watch battle', exact: true }).click();
  await expect(page.getByTestId('battle-replay')).toBeVisible();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battle)).toBeNull();
  const finished = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), scene: window.__THEANDRIL__!.getBattleDiagnostics() }));
  await info.attach('naval-battle-presentation.json', { body: JSON.stringify(finished, null, 2), contentType: 'application/json' });
  await page.getByRole('button', { name: 'Return to campaign', exact: true }).click();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(finished.hash);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.command-bar')).toHaveCSS('position', 'relative');
  const restoredLayout = await page.evaluate(() => {
    const map = document.querySelector('[data-testid=map-container]')!.getBoundingClientRect();
    const footer = document.querySelector('.command-bar')!.getBoundingClientRect();
    return { mapBottom: map.bottom, footerTop: footer.top, footerBottom: footer.bottom, viewport: innerHeight };
  });
  expect(restoredLayout.footerTop).toBeGreaterThanOrEqual(restoredLayout.mapBottom);
  expect(restoredLayout.footerBottom).toBeLessThanOrEqual(restoredLayout.viewport);
});
