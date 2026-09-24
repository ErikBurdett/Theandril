import { expect, test } from '@playwright/test';
import { applyCommand, createGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { closeManagement, openRegistry } from './ui-navigation';

for (const fault of ['map-revision', 'missing-results'] as const) {
  test(`a charter group with an unreadable ${fault} response ends pending work and recovers from the saved campaign`, async ({ page }) => {
    // The actual worker applies and records ordinary charter commands. Damage
    // only its first group response, never canonical state or the saved origin.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker;
      let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { type?: string; groupCharterResults?: unknown; mapRevision?: number };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupCharterResults)) {
              damaged = true;
              const altered = { ...data };
              if (fault === 'map-revision') altered.mapRevision = -1;
              else delete altered.groupCharterResults;
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
    const founded = applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Recovery Hearth' });
    expect(founded.ok).toBe(true);
    const originalHash = stateHash(game);
    const hearth = Object.values(game.settlements).find(settlement => settlement.factionId === game.turnOwnerId)!;
    await page.goto('/');
    await page.locator('input[type=file]').setInputFiles({ name: 'group-charter-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    await openRegistry(page, 'settlements');
    const group = page.getByTestId('group-charters');
    await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
    await group.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
    await group.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
    await group.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('The group order response could not be displayed.');
    await expect(group.getByRole('alert')).toContainText('Some orders may have applied; restore a saved campaign');
    await expect(group).not.toContainText('Applying charter orders');
    await expect(group).toHaveAttribute('aria-busy', 'false');
    await expect(group.getByRole('button', { name: /^Apply charters/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await closeManagement(page);
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.charters.length)).toBe(0);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    await openRegistry(page, 'settlements');
    await expect(group).toContainText('0 hearths selected');
    await group.getByRole('button', { name: 'Select matching hearths', exact: true }).click();
    await group.getByRole('combobox', { name: 'Charter focus', exact: true }).selectOption('wealth');
    await group.getByLabel('Coin ceiling per hearth', { exact: true }).fill('24');
    await group.getByRole('button', { name: 'Apply charters (1)', exact: true }).click();
    await expect(page.getByTestId('group-charter-results')).toContainText('1 orders accepted · 0 refused');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.charters)).toEqual([expect.objectContaining({ settlementId: hearth.id, focus: 'wealth', ceiling: 24 })]);
    expect(errors).toEqual([]);
  });
}
