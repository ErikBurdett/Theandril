# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-patrol-recovery.spec.ts >> production group patrol missing-results after real policy mutation requires saved restoration before retry
- Location: tests/production/group-patrol-recovery.spec.ts:19:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('group-patrol-results')
Expected substring: "1 patrol orders accepted · 0 refused"
Error: element(s) not found

Call log:
  - Expect "toContainText" getByTestId('group-patrol-results') with timeout 5000ms
  - waiting for getByTestId('group-patrol-results')
  - Protocol error (Runtime.callFunctionOn): Page crashed.

```

```yaml
- button "Import save file"
- banner:
  - text: The age of fracture
  - heading "Theandril" [level=1]
  - text: Your realm
  - strong: Ashen Compact
  - text: TREASURY
  - strong: 99796 coin
  - text: KNOWLEDGE
  - strong: "3"
  - text: HEARTHS
  - strong: "2"
- navigation "Campaign navigation": Standard pace · 2 realms Partial archive · earlier history unavailable
- group: Campaign & settings
- main:
  - region "Strategic map":
    - text: SEED 20260927 · 48 × 32 Legacy geography
    - navigation "Map management":
      - button "Armies & fleets"
      - button "Settlements"
      - button "Characters & agents": Characters
      - button "Realm progression": Research
      - button "Realm affairs": Diplomacy
      - button "Campaign journal"
      - button "World overview"
    - button "Zoom in": +
    - button "Zoom out": −
    - button "Focus selection"
    - button "Open map actions"
    - button "Map guide": "?"
    - group: World map · Terrain
- dialog "Realm registry":
  - banner:
    - text: The realm's ledgers
    - heading "Realm registry" [level=2]
    - paragraph: Ashen Compact
    - button "Close Realm registry": ×
  - img "Ashen Compact crest · approved faction artwork"
  - text: Your people
  - heading "Ashen Compact" [level=3]
  - tablist "Realm registry":
    - tab "Armies 101" [disabled] [selected]
    - tab "Settlements 2" [disabled]
  - button "Characters & agents" [disabled]: Characters 0
  - text: Search your realm
  - searchbox "Search your realm" [disabled]
  - tabpanel "Armies 101":
    - text: Force type
    - combobox "Force type" [disabled]:
      - option "All armies & fleets" [selected]
      - option "Land armies ashore"
      - option "Fleets"
      - option "Embarked armies"
    - text: Army orders
    - combobox "Army orders" [disabled]:
      - option "All forces (101)"
      - option "Postings and patrols (4)"
      - option "Orders waiting (2)"
      - option "Paused patrols (1)" [selected]
    - text: Registry order
    - combobox "Registry order" [disabled]:
      - option "Stable order" [selected]
      - option "Name A–Z"
    - text: 1 forces
    - group: Saved army groups
    - region "Group army postings":
      - button "Select matching armies" [disabled]
      - button "Clear group selection" [disabled]
      - status: 1 armies selected
      - paragraph: Check land armies ashore to give them a standing posting together. Select up to 128 at a time; page and search changes keep your selection.
      - text: Group destination
      - combobox "Group destination" [disabled]:
        - option "Choose an owned hearth" [disabled]
        - option "Where each army stands" [selected]
        - option "West watch · hex 500"
        - option "East watch · hex 510"
      - text: Group arrival order
      - combobox "Group arrival order" [disabled]:
        - option "Hold the hex" [selected]
        - option "Join the force there"
      - paragraph: Each army receives its own posting. Existing travel orders come first. Routes, arrival and joining use the ordinary army rules; a stalled posting explains its reason in selected orders.
      - group: Posting templates
      - button "Post selected armies (1)" [disabled]
      - button "Clear selected postings (0)" [disabled]
      - paragraph: Clearing postings leaves the 1 selected armies without postings unchanged.
    - group: Group travel
    - group:
      - text: Group patrols
      - paragraph: 1 armies selected. 1 have patrols.
      - paragraph: Use checked land armies ashore or a saved army group, up to 128 at a time. Actions include checked armies outside this filter. Assigning patrols submits every checked land army ashore; each must be a combat army without caravans. The ordinary army rules explain any refusal.
      - group: Assign two-point patrols
      - paragraph: Pause, Resume and Remove affect existing policies in the matching enabled/paused state only; armies without a patrol or already in the requested state stay checked.
      - paragraph: Pause and Remove stop future patrol assignments. Resume allows future assignments; it does not resume a paused travel route. Existing travel continues unchanged. Use Group travel → Cancel travel routes to stop issued travel too.
      - button "Pause enabled patrols (0)" [disabled]
      - button "Resume paused patrols (1)" [disabled]
      - button "Remove selected patrols (1)" [disabled]
      - paragraph: Removing a patrol discards its saved points and war option. Accepted armies leave the selection; refused and unaffected armies stay checked.
      - status: Applying patrol orders…
    - group: Defensive theaters
    - checkbox "Select Registry company 101 for group orders" [checked] [disabled]
    - 'button "Registry company 101 1 formation · 0 movement · 60 strength Patrol policy: paused · target hex 497 · Patrol assignments are paused. Existing travel continues. ↝ Travel queued · target hex 510" [disabled]':
      - strong: Registry company 101
      - text: "1 formation · 0 movement · 60 strength Patrol policy: paused · target hex 497 · Patrol assignments are paused. Existing travel continues. ↝ Travel queued · target hex 510"
  - paragraph: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
- contentinfo:
  - text: Selected army
  - strong: Registry company 001
  - text: 1 / 12 formations · 60 strength · 3 movement
  - button "Show selected orders"
  - button "Show on map"
  - region "Next-action navigation":
    - paragraph: 99 needing orders · 2 idle settlements
    - button "Previous army needing orders" [disabled]: ‹
    - button "Next army needing orders" [disabled]: Next army N
    - button "Previous idle settlement" [disabled]: ‹
    - button "Next idle settlement" [disabled]: Next town S
    - paragraph: "Labor: 2 unassigned households · 2 settlements"
    - button "Previous settlement with unassigned households" [disabled]: ‹
    - button "Next settlement with unassigned households" [disabled]: Review households
    - group: What wants a decision 5 kinds
    - status
  - text: AGE OF FRACTURE
  - strong: Turn 2
  - button "End turn" [disabled]: End turn E
  - status: Resolving… Campaign exported. Keep this file as a backup.
```

# Test source

```ts
  1  | import { expect, test, type Page } from '@playwright/test';
  2  | import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
  3  | import { exportSave, serializeCampaign } from '@theandril/persistence';
  4  | import { armyOrderFilterScene } from '../gameplay/army-order-filter-fixture';
  5  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  6  | import { openRegistry } from '../gameplay/ui-navigation';
  7  | 
  8  | type FaultEvidence = { hash: string; results: { armyId: string; accepted: boolean }[] };
  9  | async function selectPausedPatrol(page: Page) {
  10 |   await openRegistry(page, 'armies');
  11 |   await page.getByRole('combobox', { name: 'Army orders', exact: true }).selectOption('paused-patrols');
  12 |   await page.getByTestId('group-postings').getByRole('button', { name: 'Select matching armies', exact: true }).click();
  13 |   const panel = page.getByTestId('group-patrols');
  14 |   if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  15 |   return panel;
  16 | }
  17 | 
  18 | for (const fault of ['missing-results', 'wrong-army', 'worker-crash'] as const) {
  19 |   test(`production group patrol ${fault} after real policy mutation requires saved restoration before retry`, async ({ page }, testInfo) => {
  20 |     // Fault injection damages only the native worker's completed presentation
  21 |     // reply, after ordinary canonical execution/recording/autosave. The real
  22 |     // campaign, command outcome and public controls are never substituted.
  23 |     await page.addInitScript(({ fault }) => {
  24 |       const NativeWorker = window.Worker; let damaged = false;
  25 |       window.Worker = class extends NativeWorker {
  26 |         private receiver: Worker['onmessage'] = null;
  27 |         constructor(url: string | URL, options?: WorkerOptions) {
  28 |           super(url, options);
  29 |           this.addEventListener('message', event => {
  30 |             const data = event.data as { type?: string; hash: string; groupPatrolResults?: { armyId: string; accepted: boolean }[] };
  31 |             if (!damaged && data.type === 'state' && Array.isArray(data.groupPatrolResults)) {
  32 |               damaged = true;
  33 |               (window as unknown as { __PATROL_FAULT__: FaultEvidence }).__PATROL_FAULT__ = { hash: data.hash, results: structuredClone(data.groupPatrolResults) };
  34 |               if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected failure after real group patrol mutation' })); return; }
  35 |               const altered = structuredClone(data);
  36 |               if (fault === 'missing-results') delete altered.groupPatrolResults;
  37 |               else altered.groupPatrolResults![0]!.armyId = 'army.not-submitted';
  38 |               this.receiver?.call(this, new MessageEvent('message', { data: altered }));
  39 |             } else this.receiver?.call(this, event);
  40 |           });
  41 |         }
  42 |         override get onmessage(): Worker['onmessage'] { return this.receiver; }
  43 |         override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
  44 |       };
  45 |     }, { fault });
  46 |     const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  47 |     const fixture = armyOrderFilterScene();
  48 |     const expected = deserializeGame(serializeGame(fixture.game));
  49 |     const command = { type: 'setPatrolEnabled', factionId: expected.turnOwnerId, armyId: fixture.paused.id, enabled: true } as const;
  50 |     const canonical = applyCommand(expected, command);
  51 |     expect(canonical.ok).toBe(true);
  52 |     const bytes = await exportSave(serializeCampaign(fixture.game, fixture.archive));
  53 |     await page.goto('./');
  54 |     expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  55 |     await page.getByLabel('Import save file').setInputFiles({ name: 'patrol-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(bytes) });
  56 |     await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  57 |     await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  58 |     await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  59 |     let panel = await selectPausedPatrol(page);
  60 |     await panel.getByRole('button', { name: 'Resume paused patrols (1)', exact: true }).click();
  61 |     await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
  62 |     await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
  63 |     await expect(panel).toHaveAttribute('aria-busy', 'false');
  64 |     await expect(page.getByTestId('group-patrol-results')).toHaveCount(0);
  65 |     await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  66 |     await expect(panel.getByRole('button', { name: 'Resume paused patrols (1)', exact: true })).toBeDisabled();
  67 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  68 |     await expect(page.getByRole('combobox', { name: 'Army orders', exact: true })).toBeDisabled();
  69 |     const originalReply = await page.evaluate(() => (window as unknown as { __PATROL_FAULT__: FaultEvidence }).__PATROL_FAULT__);
  70 |     expect(originalReply).toEqual({ hash: stateHash(expected), results: [{ armyId: fixture.paused.id, accepted: true, message: canonical.events.at(-1)!.message }] });
  71 |     await page.screenshot({ path: testInfo.outputPath(`patrol-${fault}-recovery.png`) });
  72 | 
  73 |     await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  74 |     await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  75 |     const restored = await exportedTravel(page);
  76 |     expect(serializeGame(restored.game)).toBe(serializeGame(fixture.game));
  77 |     expect(restored.archive).toEqual(fixture.archive);
  78 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  79 |     panel = await selectPausedPatrol(page);
  80 |     await panel.getByRole('button', { name: 'Resume paused patrols (1)', exact: true }).click();
> 81 |     await expect(page.getByTestId('group-patrol-results')).toContainText('1 patrol orders accepted · 0 refused');
     |                                                            ^ Error: expect(locator).toContainText(expected) failed
  82 |     const retried = await exportedTravel(page);
  83 |     expect(serializeGame(retried.game)).toBe(serializeGame(expected));
  84 |     expect(retried.game.armies).toEqual(fixture.game.armies);
  85 |     expect(retried.game.routes).toEqual(fixture.game.routes);
  86 |     expect(retried.archive.records.slice(0, -1)).toEqual(fixture.archive.records);
  87 |     expect(retried.archive.records).toHaveLength(fixture.archive.records.length + 1);
  88 |     expect(retried.archive.records.at(-1)!.command).toEqual(command);
  89 |     expect(errors).toEqual([]);
  90 |   });
  91 | }
  92 | 
```