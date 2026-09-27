import { expect, test } from '@playwright/test';
import { stateHash } from '@theandril/sim';
import { campaignMenu, importTravel, reviewTravel, smallTravel, travelPanel } from './group-movement-fixture';

for (const fault of ['missing-results', 'wrong-army', 'worker-crash'] as const) {
  test(`group travel ${fault} after real movement locks orders until the actual manual save is restored`, async ({ page }) => {
    // The native worker executes and records ordinary movement. Damage only its
    // first completed batch reply, never the campaign or UI state.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker; let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { type?: string; groupMovementResults?: { armyId: string; accepted: boolean }[] };
            if (!damaged && data.type === 'state' && Array.isArray(data.groupMovementResults)) {
              damaged = true;
              if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected failure after real group movement' })); return; }
              const altered = structuredClone(data);
              if (fault === 'missing-results') delete altered.groupMovementResults;
              else altered.groupMovementResults![0]!.armyId = 'army.not-submitted';
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const { game, target } = smallTravel(), originalHash = stateHash(game);
    await importTravel(page, game); await campaignMenu(page);
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    const panel = await travelPanel(page, true); await reviewTravel(page, target);
    await panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
    await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    await expect(panel).not.toContainText('Applying travel orders…');
    await expect(page.getByTestId('group-movement-results')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Review routes', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.routes)).toEqual([]);
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    await travelPanel(page, true); await reviewTravel(page, target);
    await panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true }).click();
    await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 0 refused');
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).not.toBe(originalHash);
    expect(errors).toEqual([]);
  });
}

test('a superseded route review cannot fault a restored campaign when its late reply claims recovery is required', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker; let held = false;
    window.Worker = class extends NativeWorker {
      private receiver: Worker['onmessage'] = null;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data as { id: number; type?: string };
          if (!held && data.type === 'groupMovementPreview') {
            held = true;
            // Release only the delayed real response ID after ordinary Load has
            // reset the read request. The fault must remain scoped to that ID.
            (window as unknown as { __RELEASE_OLD_TRAVEL__: () => void }).__RELEASE_OLD_TRAVEL__ = () => {
              this.receiver?.call(this, new MessageEvent('message', { data: { id: data.id, type: 'error', recoveryRequired: true, message: 'Superseded travel review must be ignored' } }));
            };
          } else this.receiver?.call(this, event);
        });
      }
      override get onmessage(): Worker['onmessage'] { return this.receiver; }
      override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
    };
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const { game, target } = smallTravel(), originalHash = stateHash(game);
  await importTravel(page, game); await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  const panel = await travelPanel(page, true);
  await panel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  await panel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(target));
  await panel.getByRole('button', { name: 'Review routes', exact: true }).click();
  await expect(panel).toContainText('Reviewing group routes…');
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { __RELEASE_OLD_TRAVEL__?: () => void }).__RELEASE_OLD_TRAVEL__)).toBe('function');
  await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await page.evaluate(() => (window as unknown as { __RELEASE_OLD_TRAVEL__: () => void }).__RELEASE_OLD_TRAVEL__());
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await travelPanel(page, true); await reviewTravel(page, target);
  await expect(panel).toHaveAttribute('aria-busy', 'false');
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
  expect(errors).toEqual([]);
});
