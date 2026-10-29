# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: geography-performance.spec.ts >> Huge generated archipelago spectator geography stays bounded through reveal, river inspection, pan, overview and restored fog
- Location: tests/gameplay/geography-performance.spec.ts:8:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Realm registry', exact: true }).getByRole('tab', { name: /^Armies/ })
    - locator resolved to <button disabled role="tab" tabindex="0" aria-selected="true" id="realm-tab-armies" aria-controls="realm-registry-panel">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    67 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e11]:
        - generic [ref=e12]: The age of fracture
        - heading "Theandril" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: Your realm
        - strong [ref=e16]: Ashen Compact
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: TREASURY
          - strong [ref=e20]: 60 coin
        - generic [ref=e21]:
          - generic [ref=e22]: KNOWLEDGE
          - strong [ref=e23]: "0"
        - generic [ref=e24]:
          - generic [ref=e25]: HEARTHS
          - strong [ref=e26]: "0"
    - navigation "Campaign navigation" [ref=e27]:
      - generic [ref=e28]:
        - text: Short pace ·
        - generic [ref=e29]: 32 realms
      - region "AI watch controls" [ref=e30]:
        - generic [ref=e31]: AI watch paused
        - button "Resume AI watch" [ref=e32] [cursor=pointer]
        - button "Step one round" [ref=e33] [cursor=pointer]
        - button "Reveal spectator map" [ref=e34] [cursor=pointer]
        - generic [ref=e35]: Map follows your realm’s sight. AI always uses its own faction sight. Changing fog pauses AI watch; resume when ready.
      - generic [ref=e36]: Recording the full campaign
    - group [ref=e37]:
      - generic "Campaign & settings" [ref=e38] [cursor=pointer]
  - main [ref=e39]:
    - region "Strategic map" [ref=e40]:
      - generic: SEED 74 · 288 × 180Archipelago
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e41]
      - navigation "Map management" [ref=e43]:
        - button "Armies & fleets" [ref=e44] [cursor=pointer]
        - button "Settlements" [ref=e48] [cursor=pointer]
        - button "Characters & agents" [ref=e52] [cursor=pointer]:
          - generic [ref=e55]: Characters
        - button "Realm progression" [ref=e56] [cursor=pointer]:
          - generic [ref=e59]: Research
        - button "Realm affairs" [ref=e60] [cursor=pointer]:
          - generic [ref=e63]: Diplomacy
        - button "Campaign journal" [ref=e64] [cursor=pointer]
        - button "World overview" [ref=e68] [cursor=pointer]
      - generic [ref=e72]:
        - button "Zoom in" [ref=e73] [cursor=pointer]: +
        - button "Zoom out" [ref=e74] [cursor=pointer]: −
        - button "Focus selection" [ref=e75] [cursor=pointer]
        - button "Open map actions" [ref=e76] [cursor=pointer]
        - button "Map guide" [ref=e77] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e78] [cursor=pointer]
  - dialog [ref=e79]:
    - banner [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e82]: The realm's ledgers
        - heading "Realm registry" [active] [level=2] [ref=e83]
        - paragraph [ref=e84]: Ashen Compact
      - button "Close Realm registry" [ref=e85] [cursor=pointer]: ×
    - generic [ref=e87]:
      - generic [ref=e88]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e89]
        - generic [ref=e90]:
          - generic [ref=e91]: Your people
          - heading "Ashen Compact" [level=3] [ref=e92]
      - generic [ref=e94]:
        - tablist "Realm registry" [ref=e95]:
          - tab "Armies 2" [disabled] [selected] [ref=e96]
          - tab "Settlements 0" [disabled] [ref=e97]
        - button "Characters & agents" [disabled] [ref=e98]: Characters 0
      - generic [ref=e99]:
        - text: Search your realm
        - searchbox "Search your realm" [disabled] [ref=e100]
      - tabpanel "Armies 2" [ref=e101]:
        - generic [ref=e102]:
          - text: Force type
          - combobox "Force type" [disabled] [ref=e103]:
            - option "All armies & fleets" [selected]
            - option "Land armies ashore"
            - option "Fleets"
            - option "Embarked armies"
        - generic [ref=e104]:
          - generic [ref=e106]:
            - text: Army orders
            - combobox "Army orders" [disabled] [ref=e107]:
              - option "All forces (2)" [selected]
              - option "Postings and patrols (0)"
              - option "Orders waiting (0)"
              - option "Paused patrols (0)"
          - generic [ref=e108]:
            - generic [ref=e109]:
              - text: Registry order
              - combobox "Registry order" [disabled] [ref=e110]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e111]: 2 forces
          - group [ref=e112]:
            - generic "Saved army groups" [ref=e113] [cursor=pointer]
            - option "Choose a saved army group" [selected]
          - region "Group army postings" [ref=e114]:
            - generic [ref=e115]:
              - button "Select matching armies" [disabled] [ref=e116]
              - button "Clear group selection" [disabled] [ref=e117]
            - status [ref=e118]: 0 armies selected
            - paragraph [ref=e119]: Check land armies ashore to give them a standing posting together. Select up to 128 at a time; page and search changes keep your selection.
          - group [ref=e120]:
            - generic "Group travel" [ref=e121] [cursor=pointer]
            - option "Selected map hex · 17716" [selected]
            - option "Enter a hex number"
            - option "Replace route" [selected]
            - option "Append waypoint"
          - group [ref=e122]:
            - generic "Group patrols" [ref=e123] [cursor=pointer]
            - option "Choose an owned hearth" [selected]
            - option "Choose an owned hearth" [selected]
          - group [ref=e124]:
            - generic "Defensive theaters" [ref=e125] [cursor=pointer]
            - option "New theater" [selected]
            - option "Choose a known map hex or owned hearth" [disabled] [selected]
            - option "1 army" [selected]
            - option "2 armies"
            - option "3 armies"
            - option "4 armies"
            - option "Off" [selected]
            - option "Up to 1 extra army"
            - option "Up to 2 extra armies"
            - option "Up to 3 extra armies"
            - option "Up to 4 extra armies"
          - generic [ref=e126]:
            - generic [ref=e127]:
              - checkbox "Select Hearth caravan for group orders" [disabled] [ref=e129]
              - button "Hearth caravan 1 formation · 3 movement · 10 strength" [disabled] [ref=e130]:
                - generic [aria-hidden] [ref=e131]: △
                - generic [ref=e132]:
                  - strong [ref=e133]: Hearth caravan
                  - generic [ref=e134]: 1 formation · 3 movement · 10 strength
                - generic [aria-hidden] [ref=e135]: ›
            - generic [ref=e136]:
              - checkbox "Select Wayfinder for group orders" [disabled] [ref=e138]
              - button "Wayfinder 1 formation · 5 movement · 20 strength" [disabled] [ref=e139]:
                - generic [aria-hidden] [ref=e140]: △
                - generic [ref=e141]:
                  - strong [ref=e142]: Wayfinder
                  - generic [ref=e143]: 1 formation · 5 movement · 20 strength
                - generic [aria-hidden] [ref=e144]: ›
      - paragraph [ref=e145]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e146]:
    - generic [ref=e149]:
      - generic [ref=e150]: Your realm
      - strong [ref=e151]: Select a force or hearth
      - generic [ref=e152]: Explore the map or open a roster.
      - generic [ref=e153]:
        - button "Show selected orders" [ref=e154] [cursor=pointer]
        - button "Show on map" [ref=e155] [cursor=pointer]
    - region "Next-action navigation" [ref=e156]:
      - paragraph [ref=e157]: 2 needing orders · 0 idle settlements
      - generic [ref=e158]:
        - button "Previous army needing orders" [disabled] [ref=e159]: ‹
        - button "Next army needing orders" [disabled] [ref=e160]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e161]: ‹
        - button "Next idle settlement" [disabled] [ref=e162]: Next town S
      - paragraph [ref=e163]: "Labor: 0 unassigned households · 0 settlements"
      - generic [ref=e164]:
        - button "Previous settlement with unassigned households" [disabled] [ref=e165]: ‹
        - button "Next settlement with unassigned households" [disabled] [ref=e166]: Review households
      - group [ref=e167]:
        - generic "What wants a decision 1 kind" [ref=e168] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e169]: 1 kind
      - status
    - generic [ref=e170]:
      - generic [ref=e171]:
        - generic [ref=e172]: AGE OF FRACTURE
        - strong [ref=e173]: Turn 1
      - button "End turn" [disabled] [ref=e174]:
        - text: End turn
        - generic [ref=e175]: E
    - status [ref=e176]:
      - generic [aria-hidden] [ref=e177]: ◆
      - text: Fog of war restored to your realm’s sight.
  - generic [ref=e178]:
    - button "Art Lab" [ref=e179] [cursor=pointer]
    - generic [ref=e180]: Development asset inspector
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | 
  3  | type RegistryKind = 'armies' | 'settlements';
  4  | const managementNames = /^(Realm registry|Selected orders|Realm affairs|Campaign journal|Map guide)$/;
  5  | 
  6  | /** Use native close controls without clearing map selection or dismissing a battle. */
  7  | export async function closeManagement(page: Page) {
  8  |   const window = page.getByRole('dialog', { name: managementNames });
  9  |   if (await window.isVisible()) {
  10 |     await window.locator(':scope > .campaign-window-header').getByRole('button', { name: /^Close / }).click();
  11 |     await expect(window).toHaveCount(0);
  12 |   }
  13 | }
  14 | export async function closeCampaignOptions(page: Page) {
  15 |   const settings = page.getByTestId('campaign-menu');
  16 |   if (await settings.getAttribute('open') !== null) await settings.locator(':scope > summary').click();
  17 | }
  18 | async function openManagement(page: Page, title: string, launcher = title) {
  19 |   const window = page.getByRole('dialog', { name: title, exact: true });
  20 |   if (!await window.isVisible()) {
  21 |     await closeManagement(page);
  22 |     // Save/load leaves this real overlay open; dismiss it before clicking a
  23 |     // potentially covered HUD launcher. Never synthesize Escape or a map click.
  24 |     await closeCampaignOptions(page);
  25 |     await page.getByRole('button', { name: launcher, exact: true }).click();
  26 |   }
  27 |   await expect(window).toBeVisible();
  28 |   return window;
  29 | }
  30 | export async function openRegistry(page: Page, kind: RegistryKind) {
  31 |   const window = await openManagement(page, 'Realm registry', kind === 'armies' ? 'Armies & fleets' : 'Settlements');
> 32 |   await window.getByRole('tab', { name: kind === 'armies' ? /^Armies/ : /^Settlements/ }).click();
     |                                                                                           ^ Error: locator.click: Test timeout of 45000ms exceeded.
  33 |   return window;
  34 | }
  35 | /** Search literal names; regex callers traverse real pages, never a debug selector. */
  36 | export async function selectFromRegistry(page: Page, kind: RegistryKind, name: string | RegExp) {
  37 |   const window = await openRegistry(page, kind);
  38 |   await window.getByRole('searchbox', { name: 'Search your realm' }).fill(typeof name === 'string' ? name : '');
  39 |   if (kind === 'armies') await window.getByRole('combobox', { name: 'Force type' }).selectOption('all');
  40 |   const previous = window.getByRole('button', { name: 'Previous registry page', exact: true });
  41 |   while (await previous.count() && await previous.isEnabled()) await previous.click();
  42 |   const entry = window.getByTestId(kind === 'armies' ? 'army-registry' : 'settlement-registry').getByRole('button', { name }).first();
  43 |   const next = window.getByRole('button', { name: 'Next registry page', exact: true });
  44 |   while (!await entry.count() && await next.count() && await next.isEnabled()) await next.click();
  45 |   await entry.click();
  46 |   await expect(window).toHaveCount(0);
  47 | }
  48 | export async function openSelectedOrders(page: Page) {
  49 |   return openManagement(page, 'Selected orders', 'Show selected orders');
  50 | }
  51 | export async function openRealmAffairs(page: Page) {
  52 |   return openManagement(page, 'Realm affairs');
  53 | }
  54 | export async function openCampaignJournal(page: Page) {
  55 |   return openManagement(page, 'Campaign journal');
  56 | }
  57 | /** Open the currently mounted real production disclosure, or its full orders window. */
  58 | export async function openProduction(page: Page, kind: 'building' | 'land' | 'naval') {
  59 |   const disclosure = page.getByTestId(`production-${kind}`);
  60 |   if (!await disclosure.isVisible()) await openSelectedOrders(page);
  61 |   if (await disclosure.getAttribute('open') === null) await disclosure.locator(':scope > summary').click();
  62 | }
  63 | 
```