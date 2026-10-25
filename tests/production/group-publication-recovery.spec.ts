import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

type Kind = 'posting' | 'charter';
type PublicationError = { message: string; recoveryRequired?: boolean };
const marker = 'Authored publication evidence: ';

function fixtureFor(kind: Kind) {
  const game = theaterCampaign(2), factionId = game.turnOwnerId;
  const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  expect(armies).toHaveLength(2); expect(towns).toHaveLength(2);
  const commands: GameCommand[] = kind === 'posting'
    ? armies.map(army => ({ type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'hold' }))
    : towns.map(town => ({ type: 'setCharter', factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 }));
  const expected = deserializeGame(serializeGame(game)), journal = resumeJournal(expected, archive);
  commands.forEach(command => expect(journal.record(expected, command).ok).toBe(true));
  return { game, archive, commands, expected, expectedArchive: journal.materialize(),
    ids: kind === 'posting' ? armies.map(army => army.id) : towns.map(town => town.id) };
}

async function selectActors(page: Page, kind: Kind) {
  await openRegistry(page, kind === 'posting' ? 'armies' : 'settlements');
  const panel = page.getByTestId(kind === 'posting' ? 'group-postings' : 'group-charters');
  await panel.getByRole('button', { name: kind === 'posting' ? 'Select matching armies' : 'Select matching hearths', exact: true }).click();
  if (kind === 'charter') {
    await panel.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
    await panel.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
  }
  return { panel, submit: panel.getByRole('button', { name: kind === 'posting' ? 'Post selected armies (2)' : 'Apply charters (2)', exact: true }) };
}

for (const kind of ['posting', 'charter'] as const) {
  test(`production group ${kind} publication failure locks after real mutation and restores before retry`, async ({ page }, testInfo) => {
    mkdirSync(testInfo.outputDir, { recursive: true });
    const fixture = fixtureFor(kind), field = kind === 'posting' ? 'groupPostingResults' : 'groupCharterResults';
    await page.addInitScript(({ field, marker }) => {
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        private readonly wrapperUrl: string;
        constructor(url: string | URL, options?: WorkerOptions) {
          const originalUrl = new URL(String(url), window.location.href).href;
          // Buffer only transport during the dynamic module bootstrap. Every
          // queued request is delivered unchanged to the production handler.
          // The sole injected fault is a throw inside its final postMessage.
          const source = `
            const queued = [];
            const buffer = event => { queued.push(event.data); event.stopImmediatePropagation(); };
            self.addEventListener('message', buffer);
            const originalPost = self.postMessage.bind(self);
            let failed = false;
            self.postMessage = (message, options) => {
              if (!failed && message.type === 'state' && Array.isArray(message[${JSON.stringify(field)}])) {
                failed = true;
                throw new Error(${JSON.stringify(marker)} + JSON.stringify({ hash: message.hash, results: message[${JSON.stringify(field)}] }));
              }
              return originalPost(message, options);
            };
            await import(${JSON.stringify(originalUrl)});
            self.removeEventListener('message', buffer);
            for (const data of queued) self.dispatchEvent(new MessageEvent('message', { data }));
          `;
          const wrapperUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
          super(wrapperUrl, { ...options, type: 'module' });
          this.wrapperUrl = wrapperUrl;
          // Observe the real outer-catch response without replacing any reply.
          this.addEventListener('message', event => {
            const response = event.data as { type?: string; message?: string; recoveryRequired?: boolean };
            if (response.type === 'error' && response.message?.includes(marker)) {
              (window as unknown as { __GROUP_PUBLICATION_ERROR__: PublicationError }).__GROUP_PUBLICATION_ERROR__ = {
                message: response.message, recoveryRequired: response.recoveryRequired,
              };
            }
          });
        }
        override terminate() { super.terminate(); URL.revokeObjectURL(this.wrapperUrl); }
      };
    }, { field, marker });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('./');
    expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
    await page.getByLabel('Import save file').setInputFiles({ name: 'publication-two-actors.theandril', mimeType: 'application/gzip',
      buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await campaignMenu(page);
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
    let { panel, submit } = await selectActors(page, kind);
    await submit.click();
    await page.waitForFunction(() => '__GROUP_PUBLICATION_ERROR__' in window);
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    const response = await page.evaluate(() => (window as unknown as { __GROUP_PUBLICATION_ERROR__: PublicationError }).__GROUP_PUBLICATION_ERROR__);
    const evidence = JSON.parse(response.message.slice(response.message.indexOf(marker) + marker.length)) as { hash: string; results: Record<string, unknown>[] };
    const actorKey = kind === 'posting' ? 'armyId' : 'settlementId';
    expect(evidence.hash).toBe(stateHash(fixture.expected));
    expect(evidence.results).toEqual(fixture.ids.map(id => ({ [actorKey]: id, accepted: true })));
    const results = page.getByTestId(kind === 'posting' ? 'group-posting-results' : 'group-charter-results');
    // Persist the actual mutation and outer-catch response before fail-before
    // assertions, so a failing old build retains independently useful evidence.
    writeFileSync(testInfo.outputPath(`${kind}-publication-failure.json`), JSON.stringify({
      initialHash: stateHash(fixture.game), expectedMutatedHash: stateHash(fixture.expected), commands: fixture.commands,
      evidence, response, actualPanelText: await panel.textContent(),
      actualResultsText: await results.count() ? await results.textContent() : null,
      endTurnDisabled: await page.getByRole('button', { name: 'End turn', exact: true }).isDisabled(),
    }, null, 2) + '\n');
    await page.screenshot({ path: testInfo.outputPath(`${kind}-publication-failure.png`) });

    await expect(page.getByTestId('feedback')).toContainText(/restore a saved campaign/i);
    expect(response.recoveryRequired).toBe(true);
    await expect(panel.getByRole('alert')).toContainText(/restore a saved campaign/i);
    await expect(results).toHaveCount(0);
    await expect(panel).toContainText(kind === 'posting' ? '2 armies selected' : '2 hearths selected');
    await expect(submit).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await campaignMenu(page);
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored');
    const restored = await exportedTravel(page);
    expect(serializeGame(restored.game)).toBe(serializeGame(fixture.game));
    expect(restored.archive).toEqual(fixture.archive);
    expect(restored.archive.records).toHaveLength(0);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath(`${kind}-publication-restored.png`) });
    ({ panel, submit } = await selectActors(page, kind));
    await submit.click();
    await expect(results).toContainText('2 orders accepted · 0 refused');
    const retried = await exportedTravel(page);
    expect(serializeGame(retried.game)).toBe(serializeGame(fixture.expected));
    expect(retried.archive).toEqual(fixture.expectedArchive);
    expect(retried.archive.records).toHaveLength(2);
    expect(serializeGame(replayArchive(retried.archive))).toBe(serializeGame(retried.game));
    expect(retried.game.armies).toEqual(fixture.game.armies); expect(retried.game.routes).toEqual(fixture.game.routes);
    writeFileSync(testInfo.outputPath(`${kind}-publication-restored.theandril`), restored.bytes);
    writeFileSync(testInfo.outputPath(`${kind}-publication-retried.theandril`), retried.bytes);
    writeFileSync(testInfo.outputPath(`${kind}-publication-recovery.json`), JSON.stringify({ initialHash: stateHash(fixture.game),
      interruptedHash: evidence.hash, restoredHash: stateHash(restored.game), retryHash: stateHash(retried.game),
      restoredRecords: restored.archive.records.length, retryRecords: retried.archive.records.length, exactReplay: true }, null, 2) + '\n');
    expect(errors).toEqual([]);
  });
}
