# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:74:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 2
Received:   2
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
  133 |   await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  134 |   const charters = page.getByTestId('group-charters');
  135 |   await charters.getByLabel('Charter focus').selectOption('works');
  136 |   await charters.getByLabel('Coin ceiling per hearth').fill('24');
  137 |   await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  138 |   await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  139 |   const policy = await snapshot(page);
  140 |   expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  141 |   expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  142 |   stage('30-hearth registry recall and policy application');
  143 | 
  144 |   await recall(page, 'settlements', 'Frontier works');
  145 |   const production = await disclose(page, 'group-production');
  146 |   for (const item of fixture.sequence) {
  147 |     await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  148 |     await production.getByRole('button', { name: 'Add project', exact: true }).click();
  149 |   }
  150 |   const templates = await disclose(page, 'production-templates');
  151 |   await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  152 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  153 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  154 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  155 |   const beforeRecall = await snapshot(page);
  156 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  157 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  158 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  159 |   const results = page.getByTestId('group-production-results');
  160 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  161 |   await expect(charters).toContainText('2 hearths selected');
  162 |   await results.locator(':scope > details > summary').click();
  163 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  164 |   const paid = await snapshot(page);
  165 |   expect(paid.treasury).toBe(8);
  166 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  167 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  168 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  169 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  170 |   await results.scrollIntoViewIfNeeded();
  171 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  172 |   stage('production template and partial shared-budget batch');
  173 | 
  174 |   await recall(page, 'armies', 'Northern relief');
  175 |   const travel = await disclose(page, 'group-movement');
  176 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  177 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  178 |   const beforeReview = await snapshot(page);
  179 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  180 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  181 |   const reviewed = await snapshot(page);
  182 |   expect(reviewed.hash).toBe(beforeReview.hash);
  183 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  184 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  185 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  186 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  187 |   const rerouted = await snapshot(page);
  188 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  189 |   expect(rerouted.postings).toEqual(initial.postings);
  190 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  191 |   stage('explicit group route review and partial application');
  192 | 
  193 |   await recall(page, 'armies', 'Northern watch');
  194 |   const theater = await disclose(page, 'defense-theaters', true);
  195 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  196 |   await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
  197 |   await theater.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('1');
  198 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  199 |   await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  200 |   for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  201 |   await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  202 |   await page.setViewportSize({ width: 390, height: 844 });
  203 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).scrollIntoViewIfNeeded();
  204 |   await page.screenshot({ path: testInfo.outputPath('joined-reinforcement-controls-narrow.png') });
  205 |   const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  206 |   await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  207 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  208 |   await create.focus(); await page.keyboard.press('Enter');
  209 |   await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  210 |   const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  211 |   await closeManagement(page);
  212 |   await disclose(page, 'next-action-causes', true);
  213 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).focus();
  214 |   await page.keyboard.press('Enter');
  215 |   await expect(page.getByRole('dialog', { name: 'Realm registry', exact: true })).toBeVisible();
  216 |   await expect(theater).toHaveAttribute('open');
  217 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  218 |   await expect(theater.locator(':scope > summary')).toBeFocused();
  219 |   await expect(theater.locator(':scope > summary')).toBeInViewport();
  220 |   await page.screenshot({ path: testInfo.outputPath('joined-attention-focus-narrow.png') });
  221 |   await endTurn(page);
  222 |   const allocated = await snapshot(page), report = allocated.theaters!.find(row => row.id === created.id)!;
  223 |   expect(report.enabled).toBe(true); expect(report.armyIds).toHaveLength(14);
  224 |   expect(report.reinforcementLimit).toBe(1);
  225 |   expect(report.hearths.find(hearth => hearth.settlementId === fixture.frontier[1]!.id)).toMatchObject({
  226 |     required: 2, reinforcement: { visibleEnemies: 1, extraGuards: 1 },
  227 |   });
  228 |   expect(report.members.find(member => member.armyId === fixture.overrideId)?.status).toBe('overridden');
  229 |   expect(report.lastDispatches.some(dispatch => !dispatch.accepted && dispatch.armyId === fixture.strandedId)).toBe(true);
  230 |   expect(report.lastDispatches.some(dispatch => dispatch.accepted)).toBe(true);
  231 |   expect(allocated.wars).toEqual(expect.arrayContaining(initial.wars)); expect(allocated.battle).toBe(false);
  232 |   expect(allocated.charters).toHaveLength(30);
> 233 |   expect(allocated.queues.filter(town => town.queue.length).length).toBeGreaterThan(paid.queues.filter(town => town.queue.length).length);
      |                                                                     ^ Error: expect(received).toBeGreaterThan(expected)
  234 |   await disclose(page, 'next-action-causes');
  235 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).click();
  236 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  237 |   await page.getByTestId('theater-report').getByRole('heading', { name: 'Northern watch · Enabled', exact: true }).scrollIntoViewIfNeeded();
  238 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-report-narrow.png') });
  239 |   await theater.locator('.theater-dispatches > summary').click();
  240 |   await expect(page.getByTestId('theater-dispatch-report')).toContainText('Refused:');
  241 |   await page.getByTestId('theater-dispatch-report').getByRole('listitem').first().scrollIntoViewIfNeeded();
  242 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-dispatches-narrow.png') });
  243 |   const incoming = report.members.find(member => member.status === 'incoming')!; expect(incoming).toBeTruthy();
  244 |   const incomingName = await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.name, incoming.armyId);
  245 |   await theater.getByRole('button', { name: `Detach ${incomingName} from theater`, exact: true }).click();
  246 |   const detached = await snapshot(page);
  247 |   expect(detached.theaters!.find(row => row.id === created.id)!.armyIds).toHaveLength(13);
  248 |   expect(detached.theaters!.find(row => row.id === created.id)!.enabled).toBe(true);
  249 |   expect(detached.routes).toEqual(allocated.routes); expect(detached.postings).toEqual(allocated.postings);
  250 |   expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  251 |   stage('narrow theater setup, exception focus, turn allocation and detachment');
  252 | 
  253 |   await menu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  254 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  255 |   const saved = await exported(page);
  256 |   expect(saved.archive.records.length).toBeGreaterThan(30);
  257 |   expect(saved.game.selectionGroups).toEqual(fixture.game.selectionGroups);
  258 |   const declarations = saved.archive.records.filter(record => record.command.type === 'declareWar').map(record => record.command);
  259 |   expect(declarations.every(command => command.factionId !== fixture.owner)).toBe(true);
  260 |   expect(declarations.filter(command => command.type === 'declareWar' && command.targetFactionId === fixture.owner)).toHaveLength(allocated.wars.length - initial.wars.length);
  261 |   // Use the real UI continuation as the reference: End turn includes ordinary
  262 |   // faction AI proposals as well as the canonical phase command.
  263 |   await endTurn(page, true); const firstFuture = await exported(page), beforeReload = await snapshot(page);
  264 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  265 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  266 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  267 |   await endTurn(page, true); const manualFuture = await exported(page), restored = await snapshot(page);
  268 |   expect(serializeGame(manualFuture.game)).toBe(serializeGame(firstFuture.game));
  269 |   await page.reload();
  270 |   await page.getByLabel('Import save file').setInputFiles({ name: 'delegated-watch-continuation.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  271 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  272 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  273 |   await endTurn(page, true);
  274 |   const continued = await exported(page);
  275 |   expect(serializeGame(continued.game)).toBe(serializeGame(firstFuture.game));
  276 |   const continuedView = await snapshot(page);
  277 |   stage('manual restore, portable restore, replay and exact future continuation');
  278 |   await writeFile(testInfo.outputPath('integrated-acceptance.json'), JSON.stringify({ authored: fixture.authored, patch: fixture.patch,
  279 |     ownedArmies: initial.armies.length, ownedHearths: initial.queues.length, wars: initial.wars, initialEvents: initial.events,
  280 |     initialHash: initial.hash, budget: { before: policy.treasury, after: paid.treasury, paid: 3, refused: 2 },
  281 |     foreignDeclarations: declarations, continuationOutcome: { turn: continued.game.turn, pendingBattle: Boolean(continued.game.battle) },
  282 |     routeReviewRequests: reviewed.traffic.slice(beforeReview.traffic.length), theater: { id: created.id, dispatches: report.lastDispatches, detachedArmy: incoming.armyId },
  283 |     savedHash: stateHash(saved.game), continuedHash: stateHash(continued.game), archiveCommands: continued.archive.records.length,
  284 |     observationalCost: { stages, totalMs: performance.now() - started,
  285 |       sessions: [{ name: 'original', costs: beforeReload.costs }, { name: 'manual restore', costs: restored.costs }, { name: 'portable continuation', costs: continuedView.costs }],
  286 |       limits: 'Single correctness journey with assertions, screenshots and neighboring development work; wall-clock observations, not quiet benchmarks or performance gates. Roundtrips include worker queueing, execution, cloning and delivery. Only numeric worker metrics and request/reply metadata are retained; no extra gameplay query is issued.',
  287 |     },
  288 |     limits: 'Synthetic mature state; local Chromium controls and exact canonical continuation. Not organic growth, campaign pacing, planner/frame-time measurement or release acceptance.',
  289 |   }, null, 2));
  290 |   expect(errors).toEqual([]);
  291 | });
  292 | 
```