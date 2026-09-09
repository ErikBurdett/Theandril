# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: battle-defense.spec.ts >> R03 narrow public assaults complete occupation at 390px without intercepted controls
- Location: tests/gameplay/battle-defense.spec.ts:117:1

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Occupy settlement', exact: true })
    - locator resolved to <button class="wide" aria-label="Occupy settlement">Occupy</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <canvas width="390" height="399" aria-hidden="true"></canvas> from <div tabindex="0" class="map-host" data-testid="map-container" aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls.">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    4 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <canvas width="390" height="399" aria-hidden="true"></canvas> from <div tabindex="0" class="map-host" data-testid="map-container" aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls.">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <canvas width="390" height="399" aria-hidden="true"></canvas> from <div tabindex="0" class="map-host" data-testid="map-container" aria-label="World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls.">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button aria-haspopup="dialog" aria-label="Characters & agents">…</button> from <nav class="hud-tools" aria-label="Map management">…</nav> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Import save file"
  - generic [ref=e4]:
    - banner [ref=e5]:
      - heading "Theandril" [level=1] [ref=e8]
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: TREASURY
          - strong [ref=e12]: 0 coin
        - generic [ref=e13]:
          - generic [ref=e14]: KNOWLEDGE
          - strong [ref=e15]: "8"
    - navigation "Campaign navigation" [ref=e16]:
      - generic [ref=e17]:
        - text: Standard pace ·
        - generic [ref=e18]: 2 realms
    - group [ref=e19]:
      - generic "Campaign & settings" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - region "Strategic map" [ref=e22]:
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [ref=e23]
      - navigation "Map management" [ref=e25]:
        - button "Armies & fleets" [ref=e26] [cursor=pointer]
        - button "Settlements" [ref=e30] [cursor=pointer]
        - button "Characters & agents" [ref=e34] [cursor=pointer]:
          - generic [ref=e37]: Characters
        - button "Realm progression" [ref=e38] [cursor=pointer]:
          - generic [ref=e41]: Research
        - button "Realm affairs" [ref=e42] [cursor=pointer]:
          - generic [ref=e45]:
            - text: Diplomacy
            - generic [ref=e46]: "1"
        - button "Campaign journal" [ref=e47] [cursor=pointer]
        - button "World overview" [ref=e51] [cursor=pointer]
      - generic [ref=e55]:
        - button "Zoom in" [ref=e56] [cursor=pointer]: +
        - button "Zoom out" [ref=e57] [cursor=pointer]: −
        - button "Focus selection" [ref=e58] [cursor=pointer]
        - button "Open map actions" [ref=e59] [cursor=pointer]
        - button "Map guide" [ref=e60] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e61] [cursor=pointer]
      - region [ref=e62]:
        - generic [ref=e63]: The fate of a hearth
        - heading "Reedwatch has fallen" [active] [level=2] [ref=e64]
        - paragraph [ref=e65]: Choose what follows the victory. Campaign orders pause until this decision is resolved.
        - generic [ref=e66]:
          - article [ref=e67]:
            - heading "Occupy" [level=3] [ref=e68]
            - paragraph [ref=e69]: Keep the settlement and its buildings. Add 20 devastation and impose 3 turns of occupation. Existing production orders are cancelled.
            - button "Occupy settlement" [ref=e70] [cursor=pointer]: Occupy
            - generic [ref=e71]:
              - generic [ref=e72]:
                - term [ref=e73]: Coin gained
                - definition [ref=e74]: "0"
              - generic [ref=e75]:
                - term [ref=e76]: Population lost
                - definition [ref=e77]: "0"
              - generic [ref=e78]:
                - term [ref=e79]: Buildings lost
                - definition [ref=e80]: "0"
              - generic [ref=e81]:
                - term [ref=e82]: Devastation after capture
                - definition [ref=e83]: 20/100
              - generic [ref=e84]:
                - term [ref=e85]: Occupation
                - definition [ref=e86]: 3 turns
            - paragraph [ref=e87]: "Governing faction: Ashen Compact"
          - article [ref=e88]:
            - heading "Sack" [level=3] [ref=e89]
            - paragraph [ref=e90]: Take 0 coin, lose 1 population and 1 buildings, and keep the settlement. Add 60 devastation and impose 5 turns of occupation. Food and production orders are lost.
            - button "Sack settlement" [ref=e91] [cursor=pointer]: Sack
            - generic [ref=e92]:
              - generic [ref=e93]:
                - term [ref=e94]: Coin gained
                - definition [ref=e95]: "0"
              - generic [ref=e96]:
                - term [ref=e97]: Population lost
                - definition [ref=e98]: "1"
              - generic [ref=e99]:
                - term [ref=e100]: Buildings lost
                - definition [ref=e101]: "1"
              - generic [ref=e102]:
                - term [ref=e103]: Devastation after capture
                - definition [ref=e104]: 60/100
              - generic [ref=e105]:
                - term [ref=e106]: Occupation
                - definition [ref=e107]: 5 turns
            - paragraph [ref=e108]: "Governing faction: Ashen Compact"
          - article [ref=e109]:
            - heading "Raze" [level=3] [ref=e110]
            - paragraph [ref=e111]: Destroy the settlement, all population, buildings and production orders. Leave a ruin that a hearth caravan can resettle.
            - button "Raze settlement" [ref=e112] [cursor=pointer]: Raze
            - generic [ref=e113]:
              - generic [ref=e114]:
                - term [ref=e115]: Coin gained
                - definition [ref=e116]: "0"
              - generic [ref=e117]:
                - term [ref=e118]: Population lost
                - definition [ref=e119]: "2"
              - generic [ref=e120]:
                - term [ref=e121]: Buildings lost
                - definition [ref=e122]: "2"
              - generic [ref=e123]:
                - term [ref=e124]: Devastation after capture
                - definition [ref=e125]: 100/100
              - generic [ref=e126]:
                - term [ref=e127]: Occupation
                - definition [ref=e128]: 0 turns
  - contentinfo [ref=e129]:
    - generic [ref=e131]:
      - generic [ref=e132]: Selected army
      - strong [ref=e133]: Ashen Vanguard
      - generic [ref=e134]: 12 / 12 formations · 720 strength · 0 movement
      - button "Show selected orders" [ref=e136] [cursor=pointer]
    - region "Next-action navigation" [ref=e137]:
      - generic [ref=e138]:
        - button "Previous army needing orders" [disabled] [ref=e139]: ‹
        - button "Next army needing orders" [disabled] [ref=e140]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e141]: ‹
        - button "Next idle settlement" [disabled] [ref=e142]: Next town S
      - paragraph [ref=e143]: "Labor: 2 unassigned households · 1 settlement"
      - generic [ref=e144]:
        - button "Previous settlement with unassigned households" [disabled] [ref=e145]: ‹
        - button "Next settlement with unassigned households" [disabled] [ref=e146]: Review households
    - generic [ref=e147]:
      - paragraph [ref=e148]: Resolve the settlement capture before ending the turn.
      - strong [ref=e150]: Turn 5
      - button "End turn" [disabled] [ref=e151]:
        - text: End turn
        - generic [ref=e152]: E
    - status [ref=e153]:
      - generic [aria-hidden] [ref=e154]: ◆
      - text: Reedwatch has fallen. Choose its fate. Choose the captured settlement’s fate before continuing. Autosaved.
  - generic [ref=e155]:
    - button "Art Lab" [ref=e156] [cursor=pointer]
    - generic [ref=e157]: Development asset inspector
```

# Test source

```ts
  61  |   const target = page.locator('.attack-target').filter({ has: page.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }) });
  62  |   const before = await page.evaluate(() => { const api = window.__THEANDRIL__!, view = api.getSummary()!; return { hash: api.getStateHash(), army: view.ownArmies.find(army => army.id === 'army.2')!, target: view.armies.find(army => army.id === 'army.4')! }; });
  63  |   expect(before.target.battleDefense).toBeDefined();
  64  |   await assertQuote(target.getByTestId('battle-defense-preview'), before.target.battleDefense!);
  65  |   await target.screenshot({ path: info.outputPath('field-defense-desktop.png') });
  66  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  67  |   await target.getByRole('button', { name: 'Attack Reserve defender 0 (army.4)', exact: true }).click();
  68  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  69  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.battle!.combat.defender.length)).toBe(before.target.battleDefense!.engagedFormations);
  70  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  71  |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  72  |   const after = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  73  |   expect(after.ownArmies.find(army => army.id === before.army.id)!.cell).toBe(before.army.cell);
  74  |   expect(after.armies.filter(army => army.cell === before.target.cell && army.factionId === before.target.factionId)).toHaveLength(1);
  75  |   await info.attach('field-defense', { body: JSON.stringify({ before, afterArmies: after.armies, errors }, null, 2), contentType: 'application/json' });
  76  |   expect(errors).toEqual([]);
  77  | });
  78  | 
  79  | test('R03 siege preview fits 390px and desktop public assaults clear reserves before capture', async ({ page }, info) => {
  80  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  81  |   await importAndDeclare(page, reserveCampaign(true));
  82  |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 4');
  83  |   await openSelectedOrders(page); await page.setViewportSize({ width: 390, height: 844 });
  84  |   const card = page.getByTestId(`siege-${C.settlementId}`);
  85  |   const before = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), siege: window.__THEANDRIL__!.getSummary()!.sieges[0]! }));
  86  |   expect(before.siege.battleDefense?.reserveFormations).toBe(1);
  87  |   await assertQuote(card.getByTestId('battle-defense-preview'), before.siege.battleDefense!);
  88  |   await card.screenshot({ path: info.outputPath('siege-defense-390.png') });
  89  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  90  |   expect(await page.evaluate(() => window.__THEANDRIL__!.getStateHash())).toBe(before.hash);
  91  |   // Narrow coverage is the new preview. The capture panel has a
  92  |   // separate 390px pointer-occlusion failure retained in the v2 run evidence.
  93  |   await page.setViewportSize({ width: 1440, height: 1000 });
  94  |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  95  |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  96  |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  97  |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  98  |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  99  |   const contested = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  100 |   expect(contested.sieges).toHaveLength(1); expect(contested.pendingCapture).toBeNull();
  101 |   await closeManagement(page);
  102 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  103 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 5');
  104 |   await openSelectedOrders(page);
  105 |   await expect(card.getByTestId('battle-defense-preview')).toHaveCount(0);
  106 |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  107 |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  108 |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  109 |   await expect(page.getByTestId('capture-panel')).toBeVisible();
  110 |   await page.getByRole('button', { name: 'Occupy settlement', exact: true }).click();
  111 |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  112 |   expect(await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownSettlements.some(town => town.id === id), C.settlementId)).toBe(true);
  113 |   await info.attach('siege-defense', { body: JSON.stringify({ before, contestedSieges: contested.sieges, errors }, null, 2), contentType: 'application/json' });
  114 |   expect(errors).toEqual([]);
  115 | });
  116 | 
  117 | test('R03 narrow public assaults complete occupation at 390px without intercepted controls', async ({ page }, info) => {
  118 |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  119 |   await page.setViewportSize({ width: 390, height: 844 });
  120 |   await importAndDeclare(page, reserveCampaign(true));
  121 |   const canvas = await page.locator('canvas').elementHandle();
  122 |   const card = page.getByTestId(`siege-${C.settlementId}`);
  123 |   const before = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!.sieges[0]!);
  124 |   expect(before.battleDefense?.reserveFormations).toBe(1);
  125 |   await assertQuote(card.getByTestId('battle-defense-preview'), before.battleDefense!);
  126 |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  127 |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  128 |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  129 |   await expect(page.getByTestId('battle-panel')).toHaveCount(0);
  130 |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  131 |   const contested = await page.evaluate(() => window.__THEANDRIL__!.getSummary()!);
  132 |   expect(contested.sieges).toHaveLength(1); expect(contested.pendingCapture).toBeNull();
  133 |   await closeManagement(page);
  134 |   // This is a real scheduled AI turn, not an in-browser resource/state grant.
  135 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  136 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 5');
  137 |   await openSelectedOrders(page);
  138 |   await page.getByRole('button', { name: 'Assault Reedwatch', exact: true }).click();
  139 |   await expect(page.getByTestId('battle-panel')).toBeVisible();
  140 |   await page.getByRole('button', { name: 'Auto-resolve battle', exact: true }).click();
  141 |   await expect(page.getByTestId('capture-panel')).toBeVisible();
  142 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  143 |   await page.screenshot({ path: info.outputPath('capture-prompt-390.png') });
  144 |   const occupy = page.getByRole('button', { name: 'Occupy settlement', exact: true });
  145 |   await occupy.scrollIntoViewIfNeeded();
  146 |   const layout = await occupy.evaluate(button => {
  147 |     const box = button.getBoundingClientRect();
  148 |     const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
  149 |     return {
  150 |       viewport: { width: innerWidth, height: innerHeight }, button: box.toJSON(),
  151 |       hit: hit?.outerHTML, receivesPointer: button.contains(hit),
  152 |       layers: ['.map-host', '.hud-tools', '.capture-panel'].map(selector => {
  153 |         const element = document.querySelector(selector)!;
  154 |         const style = getComputedStyle(element);
  155 |         return { selector, box: element.getBoundingClientRect().toJSON(), position: style.position, zIndex: style.zIndex, overflow: style.overflow };
  156 |       }),
  157 |     };
  158 |   });
  159 |   await info.attach('narrow-capture-before', { body: JSON.stringify({ before, contestedSieges: contested.sieges, layout }, null, 2), contentType: 'application/json' });
  160 |   // Ordinary pointer action is the acceptance boundary; no force or viewport escape.
> 161 |   await occupy.click({ timeout: 10000 });
      |                ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  162 |   await expect(page.getByTestId('capture-panel')).toHaveCount(0);
  163 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  164 |   const after = await page.evaluate(() => ({ hash: window.__THEANDRIL__!.getStateHash(), view: window.__THEANDRIL__!.getSummary()! }));
  165 |   expect(after.view.pendingCapture).toBeNull();
  166 |   expect(after.view.ownSettlements.some(town => town.id === C.settlementId)).toBe(true);
  167 |   expect(await canvas!.evaluate(element => element === document.querySelector('canvas'))).toBe(true);
  168 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  169 |   expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
  170 |   await closeManagement(page);
  171 |   await page.screenshot({ path: info.outputPath('capture-completed-390.png') });
  172 |   await info.attach('narrow-capture-after', { body: JSON.stringify({ hash: after.hash, pendingCapture: after.view.pendingCapture, town: after.view.ownSettlements.find(town => town.id === C.settlementId), errors }, null, 2), contentType: 'application/json' });
  173 |   expect(errors).toEqual([]);
  174 | });
  175 | 
```