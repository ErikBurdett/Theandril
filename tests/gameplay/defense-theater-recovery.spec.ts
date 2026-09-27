import { expect, test, type Page } from '@playwright/test';
import { stateHash } from '@theandril/sim';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { campaignMenu, importTravel } from './group-movement-fixture';
import { closeCampaignOptions, openRegistry } from './ui-navigation';

interface RecoveryProbe { commandsSent: number; acceptedHash: string | null; acceptedTheaters: { id: string; name: string }[] }
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __THEATER_RECOVERY__: RecoveryProbe }).__THEATER_RECOVERY__);

async function prepareTheater(page: Page) {
  await openRegistry(page, 'armies');
  await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  const panel = page.getByTestId('defense-theaters');
  if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  await panel.getByRole('textbox', { name: 'Theater name', exact: true }).fill('Recovery watch');
  await panel.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption('495');
  await panel.getByRole('checkbox', { name: /^West watch · hex 500$/ }).check();
  await panel.getByRole('button', { name: 'Use checked armies (2)', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Create theater', exact: true })).toBeEnabled();
  return panel;
}

test('an ordinary completed turn with a missing theater view cannot silently erase delegation controls', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker, turns = new Set<number>();
    const evidence = { turnsSent: 0, acceptedHash: '' }; let damaged = false;
    (window as unknown as { __THEATER_TURN_RECOVERY__: typeof evidence }).__THEATER_TURN_RECOVERY__ = evidence;
    window.Worker = class extends NativeWorker {
      private receiver: Worker['onmessage'] = null;
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data as { id: number; type: string; hash?: string; observation?: { theaters?: unknown[] } };
          if (!damaged && turns.has(data.id) && data.type === 'state' && data.observation?.theaters?.length) {
            damaged = true; evidence.acceptedHash = data.hash!;
            const altered = structuredClone(data); delete altered.observation!.theaters;
            this.receiver?.call(this, new MessageEvent('message', { data: altered }));
          } else this.receiver?.call(this, event);
        });
      }
      override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
        const request = message as { id?: number; type?: string; command?: { type?: string } };
        if (request.type === 'command' && request.command?.type === 'endTurn' && typeof request.id === 'number') {
          turns.add(request.id); evidence.turnsSent++;
        }
        if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
      }
      override get onmessage(): Worker['onmessage'] { return this.receiver; }
      override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
    };
  });
  const turnProbe = () => page.evaluate(() => (window as unknown as { __THEATER_TURN_RECOVERY__: { turnsSent: number; acceptedHash: string } }).__THEATER_TURN_RECOVERY__);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await importTravel(page, theaterCampaign(2));
  const panel = await prepareTheater(page);
  await panel.getByRole('button', { name: 'Create theater', exact: true }).click();
  await expect(page.getByTestId('theater-report')).toContainText('Recovery watch · Enabled');
  const baseline = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), theaters: window.__THEANDRIL__!.getSummary()!.theaters }));
  await campaignMenu(page);
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  await closeCampaignOptions(page);
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('The defensive theater update could not be read.');
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  const damaged = await turnProbe(); expect(damaged.turnsSent).toBe(1);
  expect(damaged.acceptedHash).toMatch(/^[a-f0-9]{8}$/); expect(damaged.acceptedHash).not.toBe(baseline.hash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(baseline.hash);
  expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.theaters)).toEqual(baseline.theaters);
  await page.screenshot({ path: testInfo.outputPath('recovery-missing-turn-view-locked.png') });
  await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(baseline.hash);
  expect((await turnProbe()).turnsSent).toBe(1);
  await closeCampaignOptions(page);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(damaged.acceptedHash);
  await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(damaged.acceptedHash);
  expect((await turnProbe()).turnsSent).toBe(2); expect(errors).toEqual([]);
});

for (const fault of ['missing-theaters', 'malformed-theaters', 'worker-crash'] as const) {
  test(`a real theater edit followed by ${fault} locks orders until manual save restoration, without automatic retry`, async ({ page }, testInfo) => {
    // The native worker receives the ordinary command, applies it, records it
    // and emits its actual state. Only that completed presentation is damaged.
    // The probe observes accepted reply metadata; it never changes game/UI state.
    await page.addInitScript(({ fault }) => {
      const NativeWorker = window.Worker;
      const evidence: RecoveryProbe = { commandsSent: 0, acceptedHash: null, acceptedTheaters: [] };
      (window as unknown as { __THEATER_RECOVERY__: RecoveryProbe }).__THEATER_RECOVERY__ = evidence;
      const submitted = new Set<number>(); let damaged = false;
      window.Worker = class extends NativeWorker {
        private receiver: Worker['onmessage'] = null;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', event => {
            const data = event.data as { id: number; type: string; hash?: string; observation?: { theaters?: { id: string; name: string; armyIds: string[] }[] } };
            if (!damaged && submitted.has(data.id) && data.type === 'state'
              && data.observation?.theaters?.some(theater => theater.name === 'Recovery watch')) {
              damaged = true;
              evidence.acceptedHash = data.hash ?? null;
              evidence.acceptedTheaters = data.observation.theaters.map(({ id, name }) => ({ id, name }));
              if (fault === 'worker-crash') {
                this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker failure after the real theater edit' }));
                return;
              }
              const altered = structuredClone(data);
              if (fault === 'missing-theaters') delete altered.observation!.theaters;
              else altered.observation!.theaters![0]!.armyIds = null as unknown as string[];
              this.receiver?.call(this, new MessageEvent('message', { data: altered }));
            } else this.receiver?.call(this, event);
          });
        }
        override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
          const request = message as { id?: number; type?: string; command?: { type?: string } };
          if (request.type === 'command' && request.command?.type === 'setTheater' && typeof request.id === 'number') {
            submitted.add(request.id); evidence.commandsSent++;
          }
          if (Array.isArray(options)) super.postMessage(message, options); else super.postMessage(message, options);
        }
        override get onmessage(): Worker['onmessage'] { return this.receiver; }
        override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
      };
    }, { fault });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const game = theaterCampaign(2), originalHash = stateHash(game);
    await importTravel(page, game);
    await campaignMenu(page);
    await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
    await page.setViewportSize({ width: 390, height: 844 });
    const panel = await prepareTheater(page);
    await panel.getByRole('button', { name: 'Create theater', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash'
      ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
    await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash'
      ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    await expect(panel).not.toContainText('Saving theater changes…');
    await expect(panel.getByRole('button', { name: 'Create theater', exact: true })).toBeDisabled();
    await expect(panel.getByRole('combobox', { name: 'Defensive theater', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
    await expect(page.getByTestId('theater-report')).toHaveCount(0);
    const damaged = await probe(page);
    expect(damaged.commandsSent).toBe(1);
    expect(damaged.acceptedHash).toMatch(/^[a-f0-9]{8}$/); expect(damaged.acceptedHash).not.toBe(originalHash);
    expect(damaged.acceptedTheaters).toEqual([{ id: 'theater.1', name: 'Recovery watch' }]);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
    await panel.getByRole('alert').scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    await page.screenshot({ path: testInfo.outputPath(`recovery-${fault}-locked.png`) });

    await campaignMenu(page);
    await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
    await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(originalHash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.theaters)).toEqual([]);
    expect((await probe(page)).commandsSent).toBe(1); // Restore never reissues the uncertain mutation.

    await prepareTheater(page);
    await panel.getByRole('button', { name: 'Create theater', exact: true }).click();
    await expect(page.getByTestId('theater-report')).toContainText('Recovery watch · Enabled');
    await expect(panel).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
    expect((await probe(page)).commandsSent).toBe(2);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(damaged.acceptedHash);
    expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.theaters!.map(({ id, name }) => ({ id, name })))).toEqual(damaged.acceptedTheaters);
    expect(errors).toEqual([]);
  });
}
