import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { deserializeGame, getObservation, stateHash, stateHashForVersion, type GameCommand } from '@theandril/sim';
import { createJournal, type ArchiveRecord, type CampaignMode } from '@theandril/chronicle';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { closeManagement, openRealmAffairs } from '../gameplay/ui-navigation';

const owner = 'faction.ashen_compact', actor = 'faction.reedbound_council';
const armyId = 'army.4', settlementId = 'settlement.5';
const offer: GameCommand = { type: 'proposePeace', factionId: owner, targetFactionId: actor,
  terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } };
const commandOf = (record: ArchiveRecord) => record.command as GameCommand;

async function preparedImport(page: Page, mode: CampaignMode, incoming: boolean) {
  const snapshot = readFileSync(new URL('../../docs/development/2026-10-24-project-counterplay/near-complete.theandril', import.meta.url), 'utf8');
  expect(createHash('sha256').update(snapshot).digest('hex')).toBe('f77d05d363e8065bbcc263632100797afd8ee1502b47df2bf9f5149413ed1a4a');
  const game = deserializeGame(snapshot);
  expect(stateHashForVersion(game, 35)).toBe('c705fc04');
  expect(game.turnOwnerId).toBe(owner);
  expect(game.projects.find(project => project.factionId === owner)).toMatchObject({ status: 'active', progress: 4, requiredTurns: 5 });
  expect(game.armies[armyId]).toMatchObject({ cell: 489, movement: 3 });
  const journal = createJournal(game, { mode, coverage: 'from-save' });
  // Watch cannot issue player offers. Its incoming case imports an ordinary
  // recorded setup offer; player mode sends the offer through real controls.
  if (mode === 'watch' && incoming) expect(journal.record(game, offer).ok).toBe(true);
  const bytes = await exportSave(serializeCampaign(game, journal.materialize()));
  await page.goto('./');
  expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  await page.getByLabel('Import save file').setInputFiles({ name: 'authored-project-counterplay.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  await expect(page.getByTestId('turn-counter')).toHaveText('Turn 27');
  if (mode === 'watch') await expect(page.getByTestId('watch-controls')).toContainText('AI watch paused');
}

async function sendPlayerOffer(page: Page) {
  await openRealmAffairs(page);
  await page.getByRole('button', { name: 'Negotiate peace with Reedbound Council', exact: true }).click();
  const terms = page.getByTestId('peace-builder');
  await terms.getByLabel('Coin offered', { exact: true }).fill('0');
  await terms.getByLabel('Coin requested', { exact: true }).fill('0');
  await terms.getByLabel('Peace duration', { exact: true }).fill('10');
  await terms.getByRole('button', { name: 'Review peace terms', exact: true }).click();
  await expect(terms.getByTestId('peace-assessment')).toBeVisible();
  await terms.getByRole('button', { name: 'Send peace offer', exact: true }).click();
  await expect(page.getByTestId('peace-offers')).toContainText('Awaiting a response on End turn');
}

for (const mode of ['player', 'watch'] as const) for (const incoming of [true, false]) {
  test(`production ${mode} ${mode === 'watch' ? 'sustains' : 'establishes'} project interruption with ${incoming ? 'an incoming offer' : 'no initial offer'}`, async ({ page }, testInfo) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await preparedImport(page, mode, incoming);
    await openRealmAffairs(page);
    const project = page.getByTestId(`project-${owner}`);
    await expect(project).toContainText('active · 4/5');
    if (mode === 'player' && incoming) await sendPlayerOffer(page);
    await closeManagement(page);
    await page.getByRole('button', { name: mode === 'watch' ? 'Step one round' : 'End turn', exact: true }).click();
    await expect(page.getByTestId('turn-counter')).toHaveText('Turn 28');
    await openRealmAffairs(page);
    await expect(project).toContainText('paused · 4/5');
    await project.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('project-paused-desktop.png') });
    const interrupted = await exportedTravel(page);
    const records = interrupted.archive.records;
    const siege = records.find(record => { const command = commandOf(record); return record.ok && command.type === 'besiege' && command.factionId === actor && command.armyId === armyId && command.settlementId === settlementId; });
    const turn = records.find(record => record.ok && commandOf(record).type === 'endTurn');
    expect(siege).toBeDefined(); expect(turn).toBeDefined();
    expect(siege!.sequence).toBeLessThan(turn!.sequence);
    if (incoming) {
      const proposal = records.find(record => record.ok && commandOf(record).type === 'proposePeace');
      const rejection = records.find(record => { const command = commandOf(record); return record.ok && command.type === 'respondPeace' && command.factionId === actor && !command.accept; });
      expect(proposal).toBeDefined(); expect(rejection).toBeDefined();
      expect(proposal!.sequence).toBeLessThan(rejection!.sequence);
      expect(rejection!.sequence).toBeLessThan(siege!.sequence);
    }
    // In Watch, the other AI realm may itself introduce an offer in this round.
    // The no-initial-offer case records that full branch rather than suppressing it.
    if (mode === 'player' && !incoming) expect(records.some(record => { const command = commandOf(record); return command.type === 'proposePeace' && command.factionId === actor; })).toBe(false);
    expect(interrupted.game.victory).toBeNull();
    expect(interrupted.game.projects.find(item => item.factionId === owner)).toMatchObject({ progress: 4, status: 'paused' });
    expect(getObservation(interrupted.game, owner).wars).toContain(actor);
    expect(interrupted.game.diplomacy.treaties.some(treaty => treaty.parties.includes(owner) && treaty.parties.includes(actor))).toBe(false);
    let continued = interrupted;
    const rounds = [{ turn: continued.game.turn, hash: stateHash(continued.game), project: continued.game.projects.find(item => item.factionId === owner), victory: continued.game.victory }];
    if (mode === 'watch') {
      // A one-round pause is insufficient: the existing siege must not become
      // a reason to overlook the imminent project when another offer arrives.
      // Keep actual AI work and battle/capture outcomes; never grant a winner.
      for (let nextTurn = 29; nextTurn <= 32; nextTurn++) {
        await page.getByTestId('campaign-menu').locator(':scope > summary').click();
        await page.getByRole('button', { name: 'Step one round', exact: true }).click();
        await expect(page.getByTestId('turn-counter')).toHaveText(`Turn ${nextTurn}`);
        if (incoming && nextTurn === 32) {
          await expect(page.getByRole('dialog', { name: 'Campaign chronicles', exact: true })).toBeVisible();
          await page.getByRole('button', { name: 'Close campaign chronicles', exact: true }).click();
        }
        continued = await exportedTravel(page);
        const currentProject = continued.game.projects.find(item => item.factionId === owner);
        rounds.push({ turn: continued.game.turn, hash: stateHash(continued.game), project: currentProject, victory: continued.game.victory });
        // Preserve the observed branch even if a subsequent assertion reveals
        // renewed peace or victory. Failed evidence must remain inspectable.
        writeFileSync(testInfo.outputPath('project-continuation.json'), `${JSON.stringify({ rounds, records: continued.archive.records }, null, 2)}\n`);
        writeFileSync(testInfo.outputPath('project-continuation.theandril'), continued.bytes);
        expect(continued.archive.records.some(record => {
          const command = commandOf(record);
          return record.ok && (command.type === 'respondPeace' && command.accept || command.type === 'proposePeace' && command.factionId === actor);
        }), 'No peace may abandon the defended project').toBe(false);
        expect(getObservation(continued.game, owner).wars).toContain(actor);
        expect(continued.game.diplomacy.treaties.some(treaty => treaty.parties.includes(owner) && treaty.parties.includes(actor))).toBe(false);
        if (nextTurn <= 31) {
          expect(continued.game.victory).toBeNull();
          expect(currentProject).toMatchObject({ status: 'paused', progress: 4 });
          expect(continued.game.sieges[settlementId]).toMatchObject({ factionId: actor, armyId });
        }
        if (nextTurn === 31) {
          const freshOffer = continued.archive.records.find(record => record.ok && record.turn === 30 && commandOf(record).type === 'proposePeace');
          const freshRejection = continued.archive.records.find(record => {
            const command = commandOf(record);
            return record.ok && record.turn === 30 && command.type === 'respondPeace' && command.factionId === actor && !command.accept;
          });
          expect(freshOffer).toBeDefined(); expect(freshRejection).toBeDefined();
          expect(freshOffer!.sequence).toBeLessThan(freshRejection!.sequence);
        }
      }
      expect(rounds).toHaveLength(5);
      const assault = continued.archive.records.find(record => {
        const command = commandOf(record);
        return record.ok && record.turn === 31 && command.type === 'assault' && command.factionId === actor && command.settlementId === settlementId;
      });
      const battle = continued.archive.records.find(record => record.ok && record.turn === 31 && commandOf(record).type === 'autoResolveBattle');
      expect(assault).toBeDefined(); expect(battle).toBeDefined();
      expect(assault!.sequence).toBeLessThan(battle!.sequence);
      expect(battle!.battles).toHaveLength(1);
      if (incoming) {
        // Real combat ends in mutual withdrawal. This legitimately lifts the
        // siege and lets Ashen finish; the policy must not manufacture a win.
        expect(battle!.events.some(event => event.type === 'battle_finished' && event.message.includes('mutual withdrawal'))).toBe(true);
        expect(battle!.events.some(event => event.type === 'siege_lifted')).toBe(true);
        expect(continued.game.projects.find(item => item.factionId === owner)).toMatchObject({ status: 'completed', progress: 5 });
        expect(continued.game.victory).toMatchObject({ factionId: owner, turn: 32 });
      } else {
        const capture = continued.archive.records.find(record => {
          const command = commandOf(record);
          return record.ok && command.type === 'resolveCapture' && command.factionId === actor && command.settlementId === settlementId;
        });
        expect(capture).toBeDefined();
        expect(battle!.sequence).toBeLessThan(capture!.sequence);
        expect(continued.game.settlements[settlementId]?.factionId).toBe(actor);
        expect(continued.game.projects.find(item => item.factionId === owner)).toMatchObject({ status: 'cancelled', progress: 4 });
        expect(continued.game.victory).toBeNull();
      }
    }
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved');
    await page.reload();
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    if (mode === 'watch' && incoming) {
      await expect(page.getByRole('dialog', { name: 'Campaign chronicles', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Close campaign chronicles', exact: true }).click();
    }
    const restored = await exportedTravel(page);
    expect(restored.archive).toEqual(continued.archive);
    expect(stateHash(restored.game)).toBe(stateHash(continued.game));
    writeFileSync(testInfo.outputPath('project-counterplay.theandril'), restored.bytes);
    writeFileSync(testInfo.outputPath('project-counterplay.json'), `${JSON.stringify({ mode, incoming, initialHash: 'c705fc04', finalHash: stateHash(restored.game), coverage: restored.archive.coverage, rounds, records: restored.archive.records }, null, 2)}\n`);
    await campaignMenu(page);
    await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
    await page.setViewportSize({ width: 390, height: 844 });
    await openRealmAffairs(page);
    await project.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('project-outcome-narrow.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
