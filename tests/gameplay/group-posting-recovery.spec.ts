import { expect, test } from '@playwright/test';
import { createGame, serializeGame, stateHash } from '@theandril/sim';
import { exportSave } from '@theandril/persistence';
import { closeManagement, openRegistry } from './ui-navigation';

for (const fault of ['map-revision', 'missing-results'] as const) {
  test(`a group with an unreadable ${fault} response ends pending work and recovers from the saved campaign`, async ({ page }) => {
    // Exercise the real worker and canonical commands. Only the first group's
    // outbound presentation metadata is damaged, after the worker has applied it.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker;
      let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { type?: string; groupPostingResults?: unknown; mapRevision?: number };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupPostingResults)) {
              damaged = true;
              const altered = { ...data };
              if (fault === 'map-revision') altered.mapRevision = -1;
              else delete altered.groupPostingResults;
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
    const originalHash = stateHash(game);
    const armyCount = Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).length;
    await page.goto('/');
    await page.locator('input[type=file]').setInputFiles({ name: 'group-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeGame(game))) });
    await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    await openRegistry(page, 'armies');
    const group = page.getByTestId('group-postings');
    await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
    await group.getByRole('button', { name: `Post selected armies (${armyCount})`, exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('The group order response could not be displayed.');
    await expect(group.getByRole('alert')).toContainText('Some orders may have applied; restore a saved campaign');
    await expect(group).not.toContainText('Applying group orders');
    await expect(group).toHaveAttribute('aria-busy', 'false');
    await expect(group.getByRole('button', { name: /^Post selected armies/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await closeManagement(page);
    await page.getByTestId('campaign-menu').locator(':scope > summary').click();
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.length)).toBe(0);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    await openRegistry(page, 'armies');
    await expect(group).toContainText('0 armies selected');
    await group.getByRole('button', { name: 'Select matching armies', exact: true }).click();
    await group.getByRole('button', { name: `Post selected armies (${armyCount})`, exact: true }).click();
    await expect(page.getByTestId('group-posting-results')).toContainText(`${armyCount} orders accepted · 0 refused`);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.postings.length)).toBe(armyCount);
    expect(errors).toEqual([]);
  });
}
