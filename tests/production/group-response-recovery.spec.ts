import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createJournal, resumeJournal } from '@theandril/chronicle';
import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

type Kind = 'posting' | 'charter';
type CapturedReply = { hash: string; results: Record<string, unknown>[]; damagedResults: Record<string, unknown>[] };

function fixtureFor(kind: Kind) {
  // Authored scale-independent infrastructure. The helper founds both hearths
  // canonically before this from-save archive; no earned-campaign claim.
  const game = theaterCampaign(2), factionId = game.turnOwnerId;
  const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  const armies = Object.values(game.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id.localeCompare(b.id));
  const towns = Object.values(game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id.localeCompare(b.id));
  expect(armies).toHaveLength(2); expect(towns).toHaveLength(2);
  const commands: GameCommand[] = kind === 'posting'
    ? armies.map(army => ({ type: 'setPosting', factionId, armyId: army.id, cell: army.cell, mode: 'hold' }))
    : towns.map(town => ({ type: 'setCharter', factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 }));
  const expected = deserializeGame(serializeGame(game));
  const journal = resumeJournal(expected, archive);
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
  for (const fault of ['missing-row', 'duplicate', 'wrong-actor'] as const) {
    test(`production group ${kind} ${fault} reply requires restoration after two real commands`, async ({ page }, testInfo) => {
      mkdirSync(testInfo.outputDir, { recursive: true });
      const fixture = fixtureFor(kind);
      const field = kind === 'posting' ? 'groupPostingResults' : 'groupCharterResults';
      const actorKey = kind === 'posting' ? 'armyId' : 'settlementId';
      await page.addInitScript(({ field, actorKey, fault }) => {
        const NativeWorker = window.Worker;
        let damaged = false;
        window.Worker = class extends NativeWorker {
          private receiver: Worker['onmessage'] = null;
          constructor(url: string | URL, options?: WorkerOptions) {
            super(url, options);
            this.addEventListener('message', event => {
              const response = event.data as Record<string, unknown>;
              if (!damaged && response.type === 'state' && Array.isArray(response[field])) {
                damaged = true;
                const altered = structuredClone(response);
                const original = structuredClone(response[field]) as Record<string, unknown>[];
                if (fault === 'missing-row') altered[field] = original.slice(0, 1);
                else if (fault === 'duplicate') altered[field] = [original[0], original[0]];
                else altered[field] = [original[0], { ...original[1], [actorKey]: 'not-submitted' }];
                (window as unknown as { __GROUP_REPLY_FAULT__: CapturedReply }).__GROUP_REPLY_FAULT__ = {
                  hash: String(response.hash), results: original, damagedResults: structuredClone(altered[field]) as Record<string, unknown>[],
                };
                this.receiver?.call(this, new MessageEvent('message', { data: altered }));
              } else this.receiver?.call(this, event);
            });
          }
          override get onmessage(): Worker['onmessage'] { return this.receiver; }
          override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
        };
      }, { field, actorKey, fault });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('./');
      expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
      await page.getByLabel('Import save file').setInputFiles({
        name: 'group-reply-two-actors.theandril', mimeType: 'application/gzip',
        buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, fixture.archive))),
      });
      await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
      await campaignMenu(page);
      await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
      await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
      let { panel, submit } = await selectActors(page, kind);
      await submit.click();
      await page.waitForFunction(() => '__GROUP_REPLY_FAULT__' in window);
      await expect(panel).toHaveAttribute('aria-busy', 'false');
      const originalReply = await page.evaluate(() => (window as unknown as { __GROUP_REPLY_FAULT__: CapturedReply }).__GROUP_REPLY_FAULT__);
      expect(originalReply.hash).toBe(stateHash(fixture.expected));
      expect(originalReply.results).toEqual(fixture.ids.map(id => ({ [actorKey]: id, accepted: true })));
      const results = page.getByTestId(kind === 'posting' ? 'group-posting-results' : 'group-charter-results');
      // Written before the fail-before assertion, so the broken old-build run
      // retains both genuine mutation evidence and its false UI completion.
      writeFileSync(testInfo.outputPath(`${kind}-${fault}-reply.json`), JSON.stringify({
        initialHash: stateHash(fixture.game), expectedMutatedHash: stateHash(fixture.expected),
        commands: fixture.commands, originalReply,
        actualResultsText: await results.count() ? await results.textContent() : null,
        actualPanelText: await panel.textContent(),
        endTurnDisabled: await page.getByRole('button', { name: 'End turn', exact: true }).isDisabled(),
      }, null, 2) + '\n');
      await page.screenshot({ path: testInfo.outputPath(`${kind}-${fault}-reply.png`) });

      await expect(page.getByTestId('feedback')).toContainText(/restore a saved campaign/i);
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
      ({ panel, submit } = await selectActors(page, kind));
      await submit.click();
      await expect(results).toContainText('2 orders accepted · 0 refused');
      const retried = await exportedTravel(page);
      expect(serializeGame(retried.game)).toBe(serializeGame(fixture.expected));
      expect(retried.archive).toEqual(fixture.expectedArchive);
      expect(retried.archive.records).toHaveLength(2);
      expect(retried.game.armies).toEqual(fixture.game.armies);
      expect(retried.game.routes).toEqual(fixture.game.routes);
      if (kind === 'charter') {
        expect(retried.game.settlements).toEqual(fixture.game.settlements);
        expect(retried.game.factions).toEqual(fixture.game.factions);
      }
      writeFileSync(testInfo.outputPath(`${kind}-${fault}-retried.theandril`), retried.bytes);
      writeFileSync(testInfo.outputPath(`${kind}-${fault}-restored.theandril`), restored.bytes);
      expect(errors).toEqual([]);
    });
  }
}
