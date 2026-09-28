# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:71:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  0
+ Received  + 27

  Array [
+   "faction.ashen_compact.25",
+   "faction.brine_choir",
+   "faction.cairnwing_concord",
+   "faction.cinder_march.27",
+   "faction.cistern_assembly",
+   "faction.emberwake_convocation",
+   "faction.glass_tide",
+   "faction.glass_tide.28",
+   "faction.iron_covenant",
+   "faction.iron_covenant.29",
+   "faction.lantern_hospices",
+   "faction.manytrack_moot",
+   "faction.margin_observance",
+   "faction.mire_courts",
    "faction.mire_courts.31",
+   "faction.morrow_spore",
+   "faction.red_sluice",
+   "faction.reedbound_council.26",
+   "faction.rimehorn_clans",
+   "faction.sable_steppe",
+   "faction.saltwind_remnant",
    "faction.saltwind_remnant.32",
+   "faction.sepulchral_synod",
+   "faction.sepulchral_synod.30",
+   "faction.underhush_exchange",
+   "faction.unsealed_companies",
+   "faction.velvet_meridian",
+   "faction.vesper_court",
+   "faction.wardhall_remnant",
  ]
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
          - strong [ref=e15]: "35"
    - navigation "Campaign navigation" [ref=e16]:
      - generic [ref=e17]:
        - text: Standard pace ·
        - generic [ref=e18]: 32 realms
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
          - generic [ref=e45]: Diplomacy
        - button "Campaign journal" [ref=e46] [cursor=pointer]
        - button "World overview" [ref=e50] [cursor=pointer]
      - generic [ref=e54]:
        - button "Zoom in" [ref=e55] [cursor=pointer]: +
        - button "Zoom out" [ref=e56] [cursor=pointer]: −
        - button "Focus selection" [ref=e57] [cursor=pointer]
        - button "Open map actions" [ref=e58] [cursor=pointer]
        - button "Map guide" [ref=e59] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e60] [cursor=pointer]
  - contentinfo [ref=e61]:
    - generic [ref=e63]:
      - generic [ref=e64]: Selected settlement
      - strong [ref=e65]: Frontier west
      - generic [ref=e66]: 10 people · 1 queued projects
      - button "Show selected orders" [ref=e68] [cursor=pointer]
    - region "Next-action navigation" [ref=e69]:
      - generic [ref=e70]:
        - button "Previous army needing orders" [disabled] [ref=e71]: ‹
        - button "Next army needing orders" [disabled] [ref=e72]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e73]: ‹
        - button "Next idle settlement" [disabled] [ref=e74]: Next town S
      - paragraph [ref=e75]: "Labor: 300 unassigned households · 30 settlements"
      - generic [ref=e76]:
        - button "Previous settlement with unassigned households" [ref=e77] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e78] [cursor=pointer]: Review households
      - group [ref=e79]:
        - generic "What wants a decision 2 kinds" [ref=e80] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e81]: 2 kinds
        - button "Defensive theaters need attention · 1" [ref=e82] [cursor=pointer]
        - button "30 hearths with unassigned households" [ref=e83] [cursor=pointer]
    - generic [ref=e84]:
      - strong [ref=e86]: Turn 3
      - button "End turn" [ref=e87] [cursor=pointer]:
        - text: End turn
        - generic [ref=e88]: E
    - status [ref=e89]:
      - generic [aria-hidden] [ref=e90]: ◆
      - text: "Turn 3: orders are ready. Autosaved."
  - generic [ref=e91]:
    - button "Art Lab" [ref=e92] [cursor=pointer]
    - generic [ref=e93]: Development asset inspector
```

# Test source

```ts
  128 | 
  129 |   await recall(page, 'settlements', 'Realm works');
  130 |   await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  131 |   const charters = page.getByTestId('group-charters');
  132 |   await charters.getByLabel('Charter focus').selectOption('works');
  133 |   await charters.getByLabel('Coin ceiling per hearth').fill('24');
  134 |   await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  135 |   await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  136 |   const policy = await snapshot(page);
  137 |   expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  138 |   expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  139 |   stage('30-hearth registry recall and policy application');
  140 | 
  141 |   await recall(page, 'settlements', 'Frontier works');
  142 |   const production = await disclose(page, 'group-production');
  143 |   for (const item of fixture.sequence) {
  144 |     await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  145 |     await production.getByRole('button', { name: 'Add project', exact: true }).click();
  146 |   }
  147 |   const templates = await disclose(page, 'production-templates');
  148 |   await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  149 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  150 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  151 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  152 |   const beforeRecall = await snapshot(page);
  153 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  154 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  155 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  156 |   const results = page.getByTestId('group-production-results');
  157 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  158 |   await expect(charters).toContainText('2 hearths selected');
  159 |   await results.locator(':scope > details > summary').click();
  160 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  161 |   const paid = await snapshot(page);
  162 |   expect(paid.treasury).toBe(8);
  163 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  164 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  165 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  166 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  167 |   await results.scrollIntoViewIfNeeded();
  168 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  169 |   stage('production template and partial shared-budget batch');
  170 | 
  171 |   await recall(page, 'armies', 'Northern relief');
  172 |   const travel = await disclose(page, 'group-movement');
  173 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  174 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  175 |   const beforeReview = await snapshot(page);
  176 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  177 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  178 |   const reviewed = await snapshot(page);
  179 |   expect(reviewed.hash).toBe(beforeReview.hash);
  180 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  181 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  182 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  183 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  184 |   const rerouted = await snapshot(page);
  185 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  186 |   expect(rerouted.postings).toEqual(initial.postings);
  187 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  188 |   stage('explicit group route review and partial application');
  189 | 
  190 |   await recall(page, 'armies', 'Northern watch');
  191 |   const theater = await disclose(page, 'defense-theaters', true);
  192 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  193 |   await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
  194 |   await theater.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('1');
  195 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  196 |   await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  197 |   for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  198 |   await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  199 |   await page.setViewportSize({ width: 390, height: 844 });
  200 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).scrollIntoViewIfNeeded();
  201 |   await page.screenshot({ path: testInfo.outputPath('joined-reinforcement-controls-narrow.png') });
  202 |   const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  203 |   await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  204 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  205 |   await create.focus(); await page.keyboard.press('Enter');
  206 |   await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  207 |   const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  208 |   await closeManagement(page);
  209 |   await disclose(page, 'next-action-causes', true);
  210 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).focus();
  211 |   await page.keyboard.press('Enter');
  212 |   await expect(page.getByRole('dialog', { name: 'Realm registry', exact: true })).toBeVisible();
  213 |   await expect(theater).toHaveAttribute('open');
  214 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  215 |   await expect(theater.locator(':scope > summary')).toBeFocused();
  216 |   await expect(theater.locator(':scope > summary')).toBeInViewport();
  217 |   await page.screenshot({ path: testInfo.outputPath('joined-attention-focus-narrow.png') });
  218 |   await endTurn(page);
  219 |   const allocated = await snapshot(page), report = allocated.theaters!.find(row => row.id === created.id)!;
  220 |   expect(report.enabled).toBe(true); expect(report.armyIds).toHaveLength(14);
  221 |   expect(report.reinforcementLimit).toBe(1);
  222 |   expect(report.hearths.find(hearth => hearth.settlementId === fixture.frontier[1]!.id)).toMatchObject({
  223 |     required: 2, reinforcement: { visibleEnemies: 1, extraGuards: 1 },
  224 |   });
  225 |   expect(report.members.find(member => member.armyId === fixture.overrideId)?.status).toBe('overridden');
  226 |   expect(report.lastDispatches.some(dispatch => !dispatch.accepted && dispatch.armyId === fixture.strandedId)).toBe(true);
  227 |   expect(report.lastDispatches.some(dispatch => dispatch.accepted)).toBe(true);
> 228 |   expect(allocated.wars).toEqual(initial.wars); expect(allocated.battle).toBe(false);
      |                          ^ Error: expect(received).toEqual(expected) // deep equality
  229 |   expect(allocated.charters).toHaveLength(30);
  230 |   expect(allocated.queues.filter(town => town.queue.length).length).toBeGreaterThan(paid.queues.filter(town => town.queue.length).length);
  231 |   await disclose(page, 'next-action-causes');
  232 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).click();
  233 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  234 |   await page.getByTestId('theater-report').getByRole('heading', { name: 'Northern watch · Enabled', exact: true }).scrollIntoViewIfNeeded();
  235 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-report-narrow.png') });
  236 |   await theater.locator('.theater-dispatches > summary').click();
  237 |   await expect(page.getByTestId('theater-dispatch-report')).toContainText('Refused:');
  238 |   await page.getByTestId('theater-dispatch-report').getByRole('listitem').first().scrollIntoViewIfNeeded();
  239 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-dispatches-narrow.png') });
  240 |   const incoming = report.members.find(member => member.status === 'incoming')!; expect(incoming).toBeTruthy();
  241 |   const incomingName = await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.name, incoming.armyId);
  242 |   await theater.getByRole('button', { name: `Detach ${incomingName} from theater`, exact: true }).click();
  243 |   const detached = await snapshot(page);
  244 |   expect(detached.theaters!.find(row => row.id === created.id)!.armyIds).toHaveLength(13);
  245 |   expect(detached.theaters!.find(row => row.id === created.id)!.enabled).toBe(true);
  246 |   expect(detached.routes).toEqual(allocated.routes); expect(detached.postings).toEqual(allocated.postings);
  247 |   expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  248 |   stage('narrow theater setup, exception focus, turn allocation and detachment');
  249 | 
  250 |   await menu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  251 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  252 |   const saved = await exported(page);
  253 |   expect(saved.archive.records.length).toBeGreaterThan(30);
  254 |   expect(saved.game.selectionGroups).toEqual(fixture.game.selectionGroups);
  255 |   // Use the real UI continuation as the reference: End turn includes ordinary
  256 |   // faction AI proposals as well as the canonical phase command.
  257 |   await endTurn(page); const firstFuture = await exported(page), beforeReload = await snapshot(page);
  258 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  259 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  260 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  261 |   await endTurn(page); const manualFuture = await exported(page), restored = await snapshot(page);
  262 |   expect(serializeGame(manualFuture.game)).toBe(serializeGame(firstFuture.game));
  263 |   await page.reload();
  264 |   await page.getByLabel('Import save file').setInputFiles({ name: 'delegated-watch-continuation.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  265 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  266 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  267 |   await endTurn(page);
  268 |   const continued = await exported(page);
  269 |   expect(serializeGame(continued.game)).toBe(serializeGame(firstFuture.game));
  270 |   const continuedView = await snapshot(page);
  271 |   stage('manual restore, portable restore, replay and exact future continuation');
  272 |   await writeFile(testInfo.outputPath('integrated-acceptance.json'), JSON.stringify({ authored: fixture.authored, patch: fixture.patch,
  273 |     ownedArmies: initial.armies.length, ownedHearths: initial.queues.length, wars: initial.wars, initialEvents: initial.events,
  274 |     initialHash: initial.hash, budget: { before: policy.treasury, after: paid.treasury, paid: 3, refused: 2 },
  275 |     routeReviewRequests: reviewed.traffic.slice(beforeReview.traffic.length), theater: { id: created.id, dispatches: report.lastDispatches, detachedArmy: incoming.armyId },
  276 |     savedHash: stateHash(saved.game), continuedHash: stateHash(continued.game), archiveCommands: continued.archive.records.length,
  277 |     observationalCost: { stages, totalMs: performance.now() - started,
  278 |       sessions: [{ name: 'original', costs: beforeReload.costs }, { name: 'manual restore', costs: restored.costs }, { name: 'portable continuation', costs: continuedView.costs }],
  279 |       limits: 'Single correctness journey with assertions, screenshots and neighboring development work; wall-clock observations, not quiet benchmarks or performance gates. Roundtrips include worker queueing, execution, cloning and delivery. Only numeric worker metrics and request/reply metadata are retained; no extra gameplay query is issued.',
  280 |     },
  281 |     limits: 'Synthetic mature state; local Chromium controls and exact canonical continuation. Not organic growth, campaign pacing, planner/frame-time measurement or release acceptance.',
  282 |   }, null, 2));
  283 |   expect(errors).toEqual([]);
  284 | });
  285 | 
```