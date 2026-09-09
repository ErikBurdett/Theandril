import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { applyCommand, createArmyFormation, deserializeGame, getBattleScene, serializeGame, stateHash, type BattlePresentation, type GameCommand, type GameState } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { fullBattlefieldCampaign } from './battlefield-fixture';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../packages/test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { openRealmAffairs, openSelectedOrders, selectFromRegistry } from './ui-navigation';

const landRoles = ['colonist', 'scout', 'guard', 'spearman', 'heavy_infantry', 'skirmisher', 'arbalester', 'halberdier', 'cavalry', 'lancer'];
const hullRoles = ['transport', 'coastal_warship', 'ocean_warship'];
function campaign(naval: boolean) {
  const game = naval ? navalCampaign() : fullBattlefieldCampaign(), roles = naval ? hullRoles : landRoles;
  for (const id of ['army.2', 'army.4']) {
    const army = game.armies[id]!;
    army.formations = roles.map(role => createArmyFormation(`army.${game.nextId++}`, `unit.${role}`)).sort((a, b) => a.id < b.id ? -1 : 1);
    // Authored damaged hulls expose the real sinking transition in this bounded
    // visual test; hull integrity is setup, never an injected combat outcome.
    if (naval) for (const formation of army.formations) formation.strength = 20;
  }
  if (naval) game.armies[N.enemyFleetId]!.cell = N.shallowCell;
  refreshAuthoredSight(game);
  return deserializeGame(serializeGame(game));
}
function issue(game: GameState, command: GameCommand, packets?: BattlePresentation[]) {
  const result = applyCommand(game, command, undefined, packets ? packet => packets.push(packet) : undefined);
  expect(result, `${command.type}: ${result.error ?? ''}`).toMatchObject({ ok: true });
}
async function load(page: Page, game: GameState) {
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'individual-roles.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(2);
}

for (const naval of [false, true]) test(`${naval ? 'naval' : 'land'} role sprites follow exact canonical members, actions and deaths at desktop and 390px`, async ({ page }, info) => {
  test.setTimeout(120000);
  const game = campaign(naval), imported = deserializeGame(serializeGame(game)), own = game.turnOwnerId, enemy = game.factions[1]!.id;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  issue(game, { type: 'declareWar', factionId: own, targetFactionId: enemy });
  issue(game, { type: 'attack', factionId: own, armyId: 'army.2', targetArmyId: 'army.4' });
  const deployment = getBattleScene(game, game.battle!), deploymentHash = stateHash(game);
  const rounds: { packet: BattlePresentation; hash: string }[] = [];
  for (let round = 0; round < 4 && game.battle; round++) {
    const packets: BattlePresentation[] = [];
    issue(game, { type: 'battleOrder', factionId: own, order: 'advance' }, packets);
    expect(packets).toHaveLength(1); rounds.push({ packet: packets[0]!, hash: stateHash(game) });
  }
  expect(rounds.flatMap(item => item.packet.events).some(event => event.killedSoldierIds?.length)).toBe(true);
  await load(page, imported);
  if (naval) await selectFromRegistry(page, 'armies', N.fleetName);
  await openRealmAffairs(page); await page.getByRole('button', { name: 'Declare war on Reedbound Council', exact: true }).click();
  await openSelectedOrders(page);
  await page.getByRole('button', { name: `Attack ${naval ? N.enemyFleetName : 'Reedbound Watch'} (army.4)`, exact: true }).click();
  await expect(page.getByTestId('battle-panel')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getArtDiagnostics()?.atlasPages)).toBe(5);
  const initial = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(deploymentHash);
  expect(initial.soldiers.map(soldier => soldier.id).sort()).toEqual(deployment.soldiers!.map(soldier => soldier.id).sort());
  expect(new Set(initial.soldiers.map(soldier => soldier.assetId))).toEqual(new Set((naval ? hullRoles : landRoles).map(role => `battle.unit.${role}`)));
  expect(initial.soldiers.every(soldier => soldier.frameId?.startsWith(soldier.assetId) && soldier.hull === naval)).toBe(true);
  expect(initial.missingArt).toEqual([]);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('roles-deployment.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.width)).toBeLessThanOrEqual(390);
  const narrow = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
  expect(narrow.soldiers.map(soldier => soldier.id).sort()).toEqual(initial.soldiers.map(soldier => soldier.id).sort());
  expect(narrow.soldiers.every(soldier => soldier.x >= 0 && soldier.x <= narrow.width && soldier.y >= 0 && soldier.y <= narrow.height)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('roles-deployment-390.png') });
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(deploymentHash);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption('2');
  const samples = [];
  let captured = false;
  for (const [round, expected] of rounds.entries()) {
    await page.getByRole('button', { name: 'Advance', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(expected.hash);
    const sample = await page.evaluate(async packet => {
      const states = new Set<string>(), frames = new Set<string>(), deaths = new Set<string>(), effects = new Set<string>();
      const beforeIds = new Set(packet.before.soldiers!.map(soldier => soldier.id));
      let activeFrames = 0, captured = false;
      for (let frame = 0; frame < 1800; frame++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const scene = window.__THEANDRIL__!.getBattleDiagnostics()!;
        const applied = packet.events.slice(0, scene.eventCount), killed = new Set(applied.flatMap(event => event.killedSoldierIds ?? []));
        const completedLiving = new Set(packet.after.soldiers!.map(soldier => soldier.id));
        for (const soldier of scene.soldiers) {
          if (!beforeIds.has(soldier.id)) throw new Error(`Invented soldier ${soldier.id}`);
          if (soldier.alive === killed.has(soldier.id)) throw new Error(`Premature or missing casualty ${soldier.id}`);
          if (scene.completed && soldier.alive !== completedLiving.has(soldier.id)) throw new Error(`Final member mismatch ${soldier.id}`);
          states.add(soldier.state); if (soldier.frameId) frames.add(soldier.frameId);
          if (!soldier.alive) deaths.add(soldier.id);
          if (['attack', 'fire'].includes(soldier.state) && !packet.events.some((event, index) => scene.elapsedMs >= index * 150 && scene.elapsedMs < index * 150 + 800 && event.sourceSoldierIds?.includes(soldier.id))) throw new Error(`Unrecorded attacker ${soldier.id}`);
          if (['walk', 'sail'].includes(soldier.state) && !packet.events.some((event, index) => scene.elapsedMs >= index * 150 && scene.elapsedMs < index * 150 + 400 && event.movement?.formationId === soldier.formationId)) throw new Error(`Unrecorded movement ${soldier.id}`);
        }
        for (const effect of scene.effects) {
          if (!packet.events.some(event => (event.targetSoldierIds?.includes(effect.targetId) || event.targetIds.includes(effect.targetId)) && (event.sourceSoldierIds?.includes(effect.sourceId ?? '') || event.sourceId === effect.sourceId))) throw new Error(`Unrecorded effect target ${effect.targetId}`);
          effects.add(effect.frameId);
        }
        if (scene.effects.length) activeFrames++;
        if (!captured && scene.effects.length && scene.soldiers.some(soldier => !soldier.alive && /\/(death|sink)\/[ew]\/[3-6]$/.test(soldier.frameId ?? ''))) {
          const pause = [...document.querySelectorAll('button')].find(button => button.textContent === 'Pause actions');
          if (pause) { pause.click(); captured = true; return { states: [...states], frames: [...frames], deaths: [...deaths], effects: [...effects], activeFrames, captured, scene }; }
        }
        if (scene.completed) return { states: [...states], frames: [...frames], deaths: [...deaths], effects: [...effects], activeFrames, captured, scene };
      }
      throw new Error('Recorded role playback exceeded 1800 browser frames.');
    }, expected.packet);
    if (sample.captured) {
      await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.paused)).toBe(true);
      if (!captured) { await page.getByTestId('map-container').screenshot({ path: info.outputPath('roles-live-impact.png') }); captured = true; }
      const held = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
      await page.waitForTimeout(100);
      expect((await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!)).soldiers).toEqual(held.soldiers);
    }
    if (!sample.scene.completed) await page.getByRole('button', { name: 'Skip animations', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()?.completed)).toBe(true);
    const finished = await page.evaluate(() => window.__THEANDRIL__!.getBattleDiagnostics()!);
    expect(finished.soldiers.filter(soldier => soldier.alive).map(soldier => soldier.id).sort()).toEqual(expected.packet.after.soldiers!.map(soldier => soldier.id).sort());
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(expected.hash);
    samples.push({ round: round + 1, ...sample, finished });
  }
  expect(samples.some(sample => sample.activeFrames > 0)).toBe(true);
  expect(samples.some(sample => sample.deaths.length > 0)).toBe(true);
  await page.getByTestId('map-container').screenshot({ path: info.outputPath('roles-final.png') });
  const evidence = { scope: 'Authored funded role cohorts, terrain and 20-integrity damaged naval hulls; actual declare-war, attack and Advance commands. No injected battle, strike participants, targets, combat damage or casualties. Exact packets computed independently by the same canonical engine and compared to browser playback.', initial, narrow, deploymentHash, rounds, samples, errors };
  await writeFile(info.outputPath('individual-roles.json'), JSON.stringify(evidence, null, 2));
  expect(errors).toEqual([]);
});
