import { readFile, writeFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { commandSchemaForVersion, serializeGame, stateHash } from '@theandril/sim';
import { deserializeCampaign, exportSave, importSave } from '@theandril/persistence';
import { replayArchive } from '@theandril/chronicle';
import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';
import { closeManagement, openCampaignJournal, openRealmAffairs, openRegistry, openSelectedOrders } from './ui-navigation';

interface DelegationCost { request: string; reply: string; elapsedMs: number; metrics?: Record<string, number> }
async function disclose(page: Page, id: string, keyboard = false) {
  const panel = page.getByTestId(id);
  if (await panel.getAttribute('open') === null) {
    if (keyboard) { await panel.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
    else await panel.locator(':scope > summary').click();
  }
  return panel;
}
async function recall(page: Page, kind: 'armies' | 'settlements', name: string) {
  await openRegistry(page, kind);
  const groups = await disclose(page, 'selection-groups', true);
  await groups.getByRole('combobox', { name: kind === 'armies' ? 'Saved army group' : 'Saved hearth group', exact: true }).selectOption({ label: name });
  await groups.getByRole('button', { name: 'Recall group', exact: true }).focus();
  await page.keyboard.press('Enter');
}
async function menu(page: Page) {
  await closeManagement(page);
  return disclose(page, 'campaign-menu');
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const view = window.__THEANDRIL__!.getSummary()!;
    return { hash: window.__THEANDRIL__!.getStateHash(), turn: view.turn, treasury: view.treasury, wars: view.wars,
      queues: view.ownSettlements.map(({ id, queue }) => ({ id, queue })), charters: view.charters, postings: view.postings,
      routes: view.routes, theaters: view.theaters, groups: view.selectionGroups,
      armies: view.ownArmies.map(({ id, cell }) => ({ id, cell })), battle: Boolean(view.battle), events: view.events.length,
      traffic: (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__.slice(),
      costs: (window as unknown as { __DELEGATION_COSTS__: DelegationCost[] }).__DELEGATION_COSTS__.slice(),
    };
  });
}
async function exported(page: Page) {
  await menu(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export campaign', exact: true }).click();
  const path = await (await download).path(); expect(path).toBeTruthy();
  const bytes = await readFile(path!), campaign = deserializeCampaign(await importSave(bytes));
  expect(serializeGame(replayArchive(campaign.archive))).toBe(serializeGame(campaign.game));
  return { bytes, ...campaign };
}
async function endTurn(page: Page, allowBattle = false) {
  const turn = await page.evaluate(() => window.__THEANDRIL__!.getTurn());
  await closeManagement(page);
  const options = page.getByTestId('campaign-menu');
  if (await options.getAttribute('open') !== null) await options.locator(':scope > summary').click();
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  if (allowBattle) await expect.poll(() => page.evaluate(before => window.__THEANDRIL__!.getTurn() === before + 1 || Boolean(window.__THEANDRIL__!.getSummary()!.battle), turn)).toBe(true);
  else {
    await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${turn + 1}`);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  }
}

test.afterEach(async ({ page }, testInfo) => {
  const observation = await page.evaluate(() => {
    const inspected = window as unknown as { __DELEGATION_TRAFFIC__?: string[]; __DELEGATION_COSTS__?: DelegationCost[] };
    return { requests: inspected.__DELEGATION_TRAFFIC__ ?? [], replies: inspected.__DELEGATION_COSTS__ ?? [],
      feedback: document.querySelector('[data-testid="feedback"]')?.textContent,
      turn: window.__THEANDRIL__?.getTurn(), hash: window.__THEANDRIL__?.getStateHash(),
    };
  }).catch(error => ({ unavailable: String(error) }));
  await writeFile(testInfo.outputPath('worker-observations.json'), JSON.stringify(observation, null, 2));
});

test('a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation', async ({ page }, testInfo) => {
  const started = performance.now(), stages: { name: string; elapsedMs: number }[] = [];
  let stageStarted = started;
  const stage = (name: string) => { const now = performance.now(); stages.push({ name, elapsedMs: now - stageStarted }); stageStarted = now; };
  const fixture = empireDelegationCampaign();
  stage('authored fixture construction and strict validation');
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const traffic: string[] = [];
    const costs: DelegationCost[] = [];
    (window as unknown as { __DELEGATION_TRAFFIC__: string[] }).__DELEGATION_TRAFFIC__ = traffic;
    (window as unknown as { __DELEGATION_COSTS__: DelegationCost[] }).__DELEGATION_COSTS__ = costs;
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      private pending = new Map<number, { type: string; started: number }>();
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', (event: MessageEvent<unknown>) => {
          const reply = event.data as { id?: number; type?: string; metrics?: Record<string, number> };
          if (reply.id === undefined || reply.type === 'progress') return;
          const request = this.pending.get(reply.id);
          if (!request) return;
          costs.push({ request: request.type, reply: reply.type ?? 'unknown', elapsedMs: performance.now() - request.started,
            ...(reply.metrics ? { metrics: { ...reply.metrics } } : {}) });
          this.pending.delete(reply.id);
        });
      }
      override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
        const request = message as { id?: number; type?: string };
        traffic.push(request.type ?? 'unknown');
        if (request.id !== undefined) this.pending.set(request.id, { type: request.type ?? 'unknown', started: performance.now() });
        if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
      }
    };
  });
  await page.goto('/');
  await page.getByLabel('Import save file').setInputFiles({ name: 'authored-mature-delegation.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(fixture.game))) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  stage('browser navigation, portable import and rendered state');
  const initial = await snapshot(page);
  expect(initial.armies).toHaveLength(128); expect(initial.queues).toHaveLength(30); expect(initial.wars).toHaveLength(2); expect(initial.events).toBeGreaterThanOrEqual(32);
  await openRealmAffairs(page);
  await expect(page.locator('.war-state')).toHaveCount(2);
  await openCampaignJournal(page);
  await expect(page.getByTestId('chronicle').getByRole('listitem')).toHaveCount(16);
  await closeManagement(page);

  const causes = await disclose(page, 'next-action-causes', true);
  await causes.getByRole('button', { name: '1 company with an interrupted route', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('current-selection')).toContainText('Northern relief interrupted');
  expect((await snapshot(page)).hash).toBe(initial.hash);
  await causes.getByRole('button', { name: /hearths with a stalled charter/ }).click();
  await openSelectedOrders(page);
  const stalled = await disclose(page, 'settlement-charter');
  await expect(stalled).toContainText('Nothing this charter builds costs 4 coin or less');
  stage('wars, event journal and grouped exception navigation');

  await recall(page, 'settlements', 'Realm works');
  await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  const charters = page.getByTestId('group-charters');
  await charters.getByLabel('Charter focus').selectOption('works');
  await charters.getByLabel('Coin ceiling per hearth').fill('24');
  await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  const policy = await snapshot(page);
  expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  stage('30-hearth registry recall and policy application');

  await recall(page, 'settlements', 'Frontier works');
  const production = await disclose(page, 'group-production');
  for (const item of fixture.sequence) {
    await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
    await production.getByRole('button', { name: 'Add project', exact: true }).click();
  }
  const templates = await disclose(page, 'production-templates');
  await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  const beforeRecall = await snapshot(page);
  await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  const results = page.getByTestId('group-production-results');
  await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  await expect(charters).toContainText('2 hearths selected');
  await results.locator(':scope > details > summary').click();
  await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  const paid = await snapshot(page);
  expect(paid.treasury).toBe(8);
  expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  await results.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  stage('production template and partial shared-budget batch');

  await recall(page, 'armies', 'Northern relief');
  const travel = await disclose(page, 'group-movement');
  await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  const beforeReview = await snapshot(page);
  await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  const reviewed = await snapshot(page);
  expect(reviewed.hash).toBe(beforeReview.hash);
  expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  const rerouted = await snapshot(page);
  expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  expect(rerouted.postings).toEqual(initial.postings);
  expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  stage('explicit group route review and partial application');

  await recall(page, 'armies', 'Northern watch');
  const theater = await disclose(page, 'defense-theaters', true);
  await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
  await theater.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('1');
  await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('joined-reinforcement-controls-narrow.png') });
  const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  await create.focus(); await page.keyboard.press('Enter');
  await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  await closeManagement(page);
  await disclose(page, 'next-action-causes', true);
  await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Realm registry', exact: true })).toBeVisible();
  await expect(theater).toHaveAttribute('open');
  await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  await expect(theater.locator(':scope > summary')).toBeFocused();
  await expect(theater.locator(':scope > summary')).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('joined-attention-focus-narrow.png') });
  await endTurn(page);
  const allocated = await snapshot(page), report = allocated.theaters!.find(row => row.id === created.id)!;
  expect(report.enabled).toBe(true); expect(report.armyIds).toHaveLength(14);
  expect(report.reinforcementLimit).toBe(1);
  expect(report.hearths.find(hearth => hearth.settlementId === fixture.frontier[1]!.id)).toMatchObject({
    required: 2, reinforcement: { visibleEnemies: 1, extraGuards: 1 },
  });
  expect(report.members.find(member => member.armyId === fixture.overrideId)?.status).toBe('overridden');
  expect(report.lastDispatches.some(dispatch => !dispatch.accepted && dispatch.armyId === fixture.strandedId)).toBe(true);
  expect(report.lastDispatches.some(dispatch => dispatch.accepted)).toBe(true);
  expect(allocated.wars).toEqual(expect.arrayContaining(initial.wars)); expect(allocated.battle).toBe(false);
  expect(allocated.charters).toHaveLength(30);
  // This finite purse is exhausted by the mature realm's ordinary upkeep.
  // Delegation must explain its funding stop and preserve already-paid work.
  expect(allocated.treasury).toBe(0);
  expect(allocated.charters.filter(charter => charter.blocker === 'The treasury is within 40 coin of its reserve; the charter is waiting.')).toHaveLength(28);
  expect(allocated.queues.filter(town => town.queue.length).map(town => town.id)).toEqual(paid.queues.filter(town => town.queue.length).map(town => town.id));
  expect(allocated.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue[0]!.progress).toBeGreaterThan(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue[0]!.progress);
  await disclose(page, 'next-action-causes');
  await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).click();
  await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  await page.getByTestId('theater-report').getByRole('heading', { name: 'Northern watch · Enabled', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('joined-watch-report-narrow.png') });
  await theater.locator('.theater-dispatches > summary').click();
  await expect(page.getByTestId('theater-dispatch-report')).toContainText('Refused:');
  await page.getByTestId('theater-dispatch-report').getByRole('listitem').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('joined-watch-dispatches-narrow.png') });
  const incoming = report.members.find(member => member.status === 'incoming')!; expect(incoming).toBeTruthy();
  const incomingName = await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.name, incoming.armyId);
  await theater.getByRole('button', { name: `Detach ${incomingName} from theater`, exact: true }).click();
  await expect.poll(() => page.evaluate(id => window.__THEANDRIL__!.getSummary()!.theaters!.find(row => row.id === id)!.armyIds.length, created.id)).toBe(13);
  const detached = await snapshot(page);
  expect(detached.theaters!.find(row => row.id === created.id)!.armyIds).toHaveLength(13);
  expect(detached.theaters!.find(row => row.id === created.id)!.enabled).toBe(true);
  expect(detached.routes).toEqual(allocated.routes); expect(detached.postings).toEqual(allocated.postings);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  stage('narrow theater setup, exception focus, turn allocation and detachment');

  await menu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  const saved = await exported(page);
  expect(saved.archive.records.length).toBeGreaterThan(30);
  expect(saved.game.selectionGroups).toEqual(fixture.game.selectionGroups);
  const declarations = saved.archive.records.map(record => commandSchemaForVersion(record.rulesVersion).parse(record.command)).filter(command => command.type === 'declareWar');
  expect(declarations.every(command => command.factionId !== fixture.owner)).toBe(true);
  expect(declarations.filter(command => command.type === 'declareWar' && command.targetFactionId === fixture.owner)).toHaveLength(allocated.wars.length - initial.wars.length);
  // Use the real UI continuation as the reference: End turn includes ordinary
  // faction AI proposals as well as the canonical phase command.
  await endTurn(page, true); const firstFuture = await exported(page), beforeReload = await snapshot(page);
  await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  await endTurn(page, true); const manualFuture = await exported(page), restored = await snapshot(page);
  expect(serializeGame(manualFuture.game)).toBe(serializeGame(firstFuture.game));
  await page.reload();
  await page.getByLabel('Import save file').setInputFiles({ name: 'delegated-watch-continuation.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  await endTurn(page, true);
  const continued = await exported(page);
  expect(serializeGame(continued.game)).toBe(serializeGame(firstFuture.game));
  const continuedView = await snapshot(page);
  stage('manual restore, portable restore, replay and exact future continuation');
  await writeFile(testInfo.outputPath('integrated-acceptance.json'), JSON.stringify({ authored: fixture.authored, patch: fixture.patch,
    ownedArmies: initial.armies.length, ownedHearths: initial.queues.length, wars: initial.wars, initialEvents: initial.events,
    initialHash: initial.hash, budget: { before: policy.treasury, after: paid.treasury, paid: 3, refused: 2, afterUpkeep: allocated.treasury, chartersWaitingForReserve: allocated.charters.filter(charter => charter.blocker?.includes('reserve')).length },
    foreignDeclarations: declarations, continuationOutcome: { turn: continued.game.turn, pendingBattle: Boolean(continued.game.battle) },
    routeReviewRequests: reviewed.traffic.slice(beforeReview.traffic.length), theater: { id: created.id, dispatches: report.lastDispatches, detachedArmy: incoming.armyId },
    savedHash: stateHash(saved.game), continuedHash: stateHash(continued.game), archiveCommands: continued.archive.records.length,
    observationalCost: { stages, totalMs: performance.now() - started,
      sessions: [{ name: 'original', costs: beforeReload.costs }, { name: 'manual restore', costs: restored.costs }, { name: 'portable continuation', costs: continuedView.costs }],
      limits: 'Single correctness journey with assertions, screenshots and neighboring development work; wall-clock observations, not quiet benchmarks or performance gates. Roundtrips include worker queueing, execution, cloning and delivery. Only numeric worker metrics and request/reply metadata are retained; no extra gameplay query is issued.',
    },
    limits: 'Synthetic mature state; local Chromium controls and exact canonical continuation. Not organic growth, campaign pacing, planner/frame-time measurement or release acceptance.',
  }, null, 2));
  expect(errors).toEqual([]);
});
