import { expect, test, type Page } from '@playwright/test';
import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave, serializeCampaign } from '@theandril/persistence';
import { armyOrderFilterScene } from '../gameplay/army-order-filter-fixture';
import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
import { openRegistry } from '../gameplay/ui-navigation';

type FaultEvidence = { hash: string; results: { armyId: string; accepted: boolean }[] };
async function selectPausedPatrol(page: Page) {
  await openRegistry(page, 'armies');
  await page.getByRole('combobox', { name: 'Army orders', exact: true }).selectOption('paused-patrols');
  await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  const panel = page.getByTestId('group-patrols');
  if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  return panel;
}

for (const fault of ['missing-results', 'wrong-army', 'worker-crash'] as const) {
  test(`production group patrol ${fault} after real policy mutation requires saved restoration before retry`, async ({ page }, testInfo) => {
    // Fault injection damages only the native worker's completed presentation
    // reply, after ordinary canonical execution/recording/autosave. The real
    // campaign, command outcome and public controls are never substituted.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker; let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { type?: string; hash: string; groupPatrolResults?: { armyId: string; accepted: boolean }[] };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupPatrolResults)) {
              damaged = true;
              (window as unknown as { __PATROL_FAULT__: FaultEvidence }).__PATROL_FAULT__ = { hash: data.hash, results: structuredClone(data.groupPatrolResults) };
              if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected failure after real group patrol mutation' })); return; }
              const altered = structuredClone(data);
              if (fault === 'missing-results') delete altered.groupPatrolResults;
              else altered.groupPatrolResults![0]!.armyId = 'army.not-submitted';
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const fixture = armyOrderFilterScene();
    const expected = deserializeGame(serializeGame(fixture.game));
    const command = { type: 'setPatrolEnabled', factionId: expected.turnOwnerId, armyId: fixture.paused.id, enabled: true } as const;
    const canonical = applyCommand(expected, command);
    expect(canonical.ok).toBe(true);
    const bytes = await exportSave(serializeCampaign(fixture.game, fixture.archive));
    await page.goto('./');
    expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
    await page.getByLabel('Import save file').setInputFiles({ name: 'patrol-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    let panel = await selectPausedPatrol(page);
    await panel.getByRole('button', { name: 'Resume paused patrols (1)', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
    await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByTestId('group-patrol-results')).toHaveCount(0);
    await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
    await expect(panel.getByRole('button', { name: 'Resume paused patrols (1)', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: 'Army orders', exact: true })).toBeDisabled();
    const originalReply = await page.evaluate(() => (window as unknown as { __PATROL_FAULT__: FaultEvidence }).__PATROL_FAULT__);
    expect(originalReply).toEqual({ hash: stateHash(expected), results: [{ armyId: fixture.paused.id, accepted: true, message: canonical.events.at(-1)!.message }] });
    await page.screenshot({ path: testInfo.outputPath(`patrol-${fault}-recovery.png`) });

    await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    const restored = await exportedTravel(page);
    expect(serializeGame(restored.game)).toBe(serializeGame(fixture.game));
    expect(restored.archive).toEqual(fixture.archive);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    panel = await selectPausedPatrol(page);
    await panel.getByRole('button', { name: 'Resume paused patrols (1)', exact: true }).click();
    await expect(page.getByTestId('group-patrol-results')).toContainText('1 patrol orders accepted · 0 refused');
    const retried = await exportedTravel(page);
    expect(serializeGame(retried.game)).toBe(serializeGame(expected));
    expect(retried.game.armies).toEqual(fixture.game.armies);
    expect(retried.game.routes).toEqual(fixture.game.routes);
    expect(retried.archive.records.slice(0, -1)).toEqual(fixture.archive.records);
    expect(retried.archive.records).toHaveLength(fixture.archive.records.length + 1);
    expect(retried.archive.records.at(-1)!.command).toEqual(command);
    expect(errors).toEqual([]);
  });
}
