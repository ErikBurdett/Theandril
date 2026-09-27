import { expect, test } from '@playwright/test';
import { applyCommand, createGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { closeManagement, openRegistry } from './ui-navigation';

for (const fault of ['missing-results', 'wrong-item', 'map-revision', 'wrong-type', 'worker-crash'] as const) {
  test(`a production batch with ${fault} ends pending work, locks orders and restores the actual manual save`, async ({ page }) => {
    // The real worker pays and records the queue commands; only its reply is
    // damaged. The player must restore a genuine earlier save before retrying.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker;
      let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { id: number; type?: string; groupProductionResults?: { settlementId: string; orders: { itemId: string; accepted: boolean }[] }[]; mapRevision?: number };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupProductionResults)) {
              damaged = true;
              if (fault === 'worker-crash') {
                this.dispatchEvent(new ErrorEvent('error', { message: 'Injected failure after paid production' }));
                return;
              }
              if (fault === 'wrong-type') {
                this.receiver?.call(this, new MessageEvent('message', { data: { id: data.id, type: 'message', message: 'Wrong terminal reply' } }));
                return;
              }
              const altered = structuredClone(data);
              if (fault === 'missing-results') delete altered.groupProductionResults;
              else if (fault === 'map-revision') altered.mapRevision = -1;
              else altered.groupProductionResults![0]!.orders[0]!.itemId = 'building.archive';
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Sequence Recovery' }).ok).toBe(true);
    const originalHash = stateHash(game);
    await page.goto('/');
    await page.locator('input[type=file]').setInputFiles({ name: 'production-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    const prepare = async () => {
      await openRegistry(page, 'settlements');
      await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
      const group = page.getByTestId('group-production');
      if (await group.getAttribute('open') === null) await group.locator(':scope > summary').click();
      await group.getByRole('combobox', { name: 'Production item', exact: true }).selectOption('building.granary');
      await group.getByRole('button', { name: 'Add project', exact: true }).click();
      return group;
    };
    const group = await prepare();
    await group.getByRole('button', { name: 'Apply production (1)', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
    await expect(group.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
    await expect(group).toHaveAttribute('aria-busy', 'false');
    await expect(group.getByRole('button', { name: /^Apply production/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await closeManagement(page);
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownSettlements[0]!.queue)).toEqual([]);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    await prepare();
    await group.getByRole('button', { name: 'Apply production (1)', exact: true }).click();
    await expect(page.getByTestId('group-production-results')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getSummary()!.ownSettlements[0]!.queue.map(item => item.itemId))).toEqual(['building.granary']);
    expect(errors).toEqual([]);
  });
}
