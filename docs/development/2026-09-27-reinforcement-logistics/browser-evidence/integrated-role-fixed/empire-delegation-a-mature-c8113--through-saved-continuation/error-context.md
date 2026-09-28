# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empire-delegation.spec.ts >> a mature realm resolves joined budget and frontier exceptions while preserving delegated work through saved continuation
- Location: tests/gameplay/empire-delegation.spec.ts:58:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByTestId('defense-theaters').locator(':scope > summary')
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByTestId('defense-theaters').locator(':scope > summary') with timeout 5000ms
  - waiting for getByTestId('defense-theaters').locator(':scope > summary')
    14 × locator resolved to <summary>Defensive theaters</summary>
       - unexpected value "inactive"

```

```yaml
- text: Defensive theaters
```

# Test source

```ts
  74  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  75  |   const initial = await snapshot(page);
  76  |   expect(initial.armies).toHaveLength(128); expect(initial.queues).toHaveLength(30); expect(initial.wars).toHaveLength(2); expect(initial.events).toBeGreaterThanOrEqual(32);
  77  |   await openRealmAffairs(page);
  78  |   await expect(page.locator('.war-state')).toHaveCount(2);
  79  |   await openCampaignJournal(page);
  80  |   await expect(page.getByTestId('chronicle').getByRole('listitem')).toHaveCount(16);
  81  |   await closeManagement(page);
  82  | 
  83  |   const causes = await disclose(page, 'next-action-causes', true);
  84  |   await causes.getByRole('button', { name: '1 company with an interrupted route', exact: true }).focus();
  85  |   await page.keyboard.press('Enter');
  86  |   await expect(page.getByTestId('current-selection')).toContainText('Northern relief interrupted');
  87  |   expect((await snapshot(page)).hash).toBe(initial.hash);
  88  |   await causes.getByRole('button', { name: /hearths with a stalled charter/ }).click();
  89  |   await openSelectedOrders(page);
  90  |   const stalled = await disclose(page, 'settlement-charter');
  91  |   await expect(stalled).toContainText('Nothing this charter builds costs 4 coin or less');
  92  | 
  93  |   await recall(page, 'settlements', 'Realm works');
  94  |   await expect(page.getByTestId('settlement-registry').getByRole('checkbox')).toHaveCount(25);
  95  |   const charters = page.getByTestId('group-charters');
  96  |   await charters.getByLabel('Charter focus').selectOption('works');
  97  |   await charters.getByLabel('Coin ceiling per hearth').fill('24');
  98  |   await charters.getByRole('button', { name: 'Apply charters (30)', exact: true }).click();
  99  |   await expect(page.getByTestId('group-charter-results')).toContainText('30 orders accepted · 0 refused');
  100 |   const policy = await snapshot(page);
  101 |   expect(policy.treasury).toBe(initial.treasury); expect(policy.queues).toEqual(initial.queues);
  102 |   expect(policy.charters.every(charter => charter.focus === 'works' && charter.ceiling === 24)).toBe(true);
  103 | 
  104 |   await recall(page, 'settlements', 'Frontier works');
  105 |   const production = await disclose(page, 'group-production');
  106 |   for (const item of fixture.sequence) {
  107 |     await production.getByRole('combobox', { name: 'Production item', exact: true }).selectOption(item);
  108 |     await production.getByRole('button', { name: 'Add project', exact: true }).click();
  109 |   }
  110 |   const templates = await disclose(page, 'production-templates');
  111 |   await templates.getByRole('textbox', { name: 'Production template name', exact: true }).fill('Frontier relief kit');
  112 |   await templates.getByRole('button', { name: 'Save production template', exact: true }).click();
  113 |   await expect(templates.getByRole('option', { name: /Frontier relief kit/ })).toHaveCount(1);
  114 |   for (let count = fixture.sequence.length; count > 0; count--) await production.getByTestId('production-sequence-item').first().getByRole('button', { name: /^Remove item/ }).click();
  115 |   const beforeRecall = await snapshot(page);
  116 |   await templates.getByRole('button', { name: 'Recall production template', exact: true }).click();
  117 |   expect((await snapshot(page)).hash).toBe(beforeRecall.hash);
  118 |   await production.getByRole('button', { name: 'Apply production (3)', exact: true }).click();
  119 |   const results = page.getByTestId('group-production-results');
  120 |   await expect(results).toContainText('1 hearth complete · 2 partial or refused. 3 orders accepted · 2 refused.');
  121 |   await expect(charters).toContainText('2 hearths selected');
  122 |   await results.locator(':scope > details > summary').click();
  123 |   await expect(results).toContainText('Paid and queued'); await expect(results).toContainText('Refused:');
  124 |   const paid = await snapshot(page);
  125 |   expect(paid.treasury).toBe(8);
  126 |   expect(paid.queues.find(town => town.id === fixture.frontier[0]!.id)!.queue.map(item => item.itemId)).toEqual(['building.granary', ...fixture.sequence]);
  127 |   expect(paid.queues.find(town => town.id === fixture.frontier[1]!.id)!.queue.map(item => item.itemId)).toEqual([fixture.sequence[0]]);
  128 |   expect(paid.queues.find(town => town.id === fixture.frontier[2]!.id)!.queue).toEqual([]);
  129 |   expect(paid.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling }))).toEqual(policy.charters.map(({ settlementId, focus, ceiling }) => ({ settlementId, focus, ceiling })));
  130 |   await results.scrollIntoViewIfNeeded();
  131 |   await page.screenshot({ path: testInfo.outputPath('joined-budget-refusals-desktop.png') });
  132 | 
  133 |   await recall(page, 'armies', 'Northern relief');
  134 |   const travel = await disclose(page, 'group-movement');
  135 |   await travel.getByRole('combobox', { name: 'Travel destination', exact: true }).selectOption('hex');
  136 |   await travel.getByRole('spinbutton', { name: 'Destination hex', exact: true }).fill(String(fixture.frontier[2]!.cell));
  137 |   const beforeReview = await snapshot(page);
  138 |   await travel.getByRole('button', { name: 'Review routes', exact: true }).click();
  139 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 1 unavailable');
  140 |   const reviewed = await snapshot(page);
  141 |   expect(reviewed.hash).toBe(beforeReview.hash);
  142 |   expect(reviewed.traffic.slice(beforeReview.traffic.length)).toEqual(['groupMovementPreview']);
  143 |   await travel.getByRole('button', { name: 'Apply reviewed routes (3)', exact: true }).click();
  144 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 1 refused');
  145 |   await expect(page.getByTestId('group-postings')).toContainText('1 armies selected');
  146 |   const rerouted = await snapshot(page);
  147 |   expect(rerouted.wars).toEqual(initial.wars); expect(rerouted.battle).toBe(false);
  148 |   expect(rerouted.postings).toEqual(initial.postings);
  149 |   expect(rerouted.routes.find(route => route.armyId === fixture.interruptedId)?.status).not.toBe('paused');
  150 | 
  151 |   await recall(page, 'armies', 'Northern watch');
  152 |   const theater = await disclose(page, 'defense-theaters', true);
  153 |   await theater.getByLabel('Theater name', { exact: true }).fill('Northern watch');
  154 |   await theater.getByRole('combobox', { name: 'Reserve destination', exact: true }).selectOption(String(fixture.reserve));
  155 |   await theater.getByRole('combobox', { name: 'Guards per hearth', exact: true }).selectOption('1');
  156 |   await theater.getByRole('combobox', { name: 'Extra guards when threatened', exact: true }).selectOption('1');
  157 |   await theater.getByRole('searchbox', { name: 'Find protected hearths', exact: true }).fill('Frontier');
  158 |   for (const town of fixture.frontier.slice(1)) await theater.getByRole('checkbox', { name: `${town.name} · hex ${town.cell}`, exact: true }).check();
  159 |   await theater.getByRole('button', { name: 'Use checked armies (14)', exact: true }).click();
  160 |   await page.setViewportSize({ width: 390, height: 844 });
  161 |   const create = theater.getByRole('button', { name: 'Create theater', exact: true });
  162 |   await create.scrollIntoViewIfNeeded(); await expect(create).toBeInViewport();
  163 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-controls-narrow.png') });
  164 |   await create.focus(); await page.keyboard.press('Enter');
  165 |   await expect(page.getByTestId('theater-report')).toContainText('Northern watch · Enabled');
  166 |   const created = (await snapshot(page)).theaters!.find(row => row.name === 'Northern watch')!;
  167 |   await closeManagement(page);
  168 |   await disclose(page, 'next-action-causes', true);
  169 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).focus();
  170 |   await page.keyboard.press('Enter');
  171 |   await expect(page.getByRole('dialog', { name: 'Realm registry', exact: true })).toBeVisible();
  172 |   await expect(theater).toHaveAttribute('open');
  173 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
> 174 |   await expect(theater.locator(':scope > summary')).toBeFocused();
      |                                                     ^ Error: expect(locator).toBeFocused() failed
  175 |   await endTurn(page);
  176 |   const allocated = await snapshot(page), report = allocated.theaters!.find(row => row.id === created.id)!;
  177 |   expect(report.enabled).toBe(true); expect(report.armyIds).toHaveLength(14);
  178 |   expect(report.reinforcementLimit).toBe(1);
  179 |   expect(report.hearths.find(hearth => hearth.settlementId === fixture.frontier[1]!.id)).toMatchObject({
  180 |     required: 2, reinforcement: { visibleEnemies: 1, extraGuards: 1 },
  181 |   });
  182 |   expect(report.members.find(member => member.armyId === fixture.overrideId)?.status).toBe('overridden');
  183 |   expect(report.lastDispatches.some(dispatch => !dispatch.accepted && dispatch.armyId === fixture.strandedId)).toBe(true);
  184 |   expect(report.lastDispatches.some(dispatch => dispatch.accepted)).toBe(true);
  185 |   expect(allocated.wars).toEqual(initial.wars); expect(allocated.battle).toBe(false);
  186 |   expect(allocated.charters).toHaveLength(30);
  187 |   expect(allocated.queues.filter(town => town.queue.length).length).toBeGreaterThan(paid.queues.filter(town => town.queue.length).length);
  188 |   await disclose(page, 'next-action-causes');
  189 |   await page.getByTestId('next-action-causes').getByRole('button', { name: 'Defensive theaters need attention · 1', exact: true }).click();
  190 |   await expect(theater.getByRole('combobox', { name: 'Defensive theater', exact: true })).toHaveValue(created.id);
  191 |   const incoming = report.members.find(member => member.status === 'incoming')!; expect(incoming).toBeTruthy();
  192 |   const incomingName = await page.evaluate(id => window.__THEANDRIL__!.getSummary()!.ownArmies.find(army => army.id === id)!.name, incoming.armyId);
  193 |   await theater.getByRole('button', { name: `Detach ${incomingName} from theater`, exact: true }).click();
  194 |   const detached = await snapshot(page);
  195 |   expect(detached.theaters!.find(row => row.id === created.id)!.armyIds).toHaveLength(13);
  196 |   expect(detached.theaters!.find(row => row.id === created.id)!.enabled).toBe(true);
  197 |   expect(detached.routes).toEqual(allocated.routes); expect(detached.postings).toEqual(allocated.postings);
  198 |   await page.getByTestId('theater-report').scrollIntoViewIfNeeded();
  199 |   await page.screenshot({ path: testInfo.outputPath('joined-watch-report-narrow.png') });
  200 |   expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  201 | 
  202 |   await menu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  203 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  204 |   const saved = await exported(page), expected = deserializeGame(serializeGame(saved.game));
  205 |   expect(saved.archive.records.length).toBeGreaterThan(30);
  206 |   expect(saved.game.selectionGroups).toEqual(fixture.game.selectionGroups);
  207 |   expect(applyCommand(expected, { type: 'endTurn', factionId: fixture.owner }).ok).toBe(true);
  208 |   await endTurn(page); expect((await snapshot(page)).hash).toBe(stateHash(expected));
  209 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  210 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  211 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  212 |   await page.reload();
  213 |   await page.getByLabel('Import save file').setInputFiles({ name: 'delegated-watch-continuation.theandril', mimeType: 'application/gzip', buffer: saved.bytes });
  214 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  215 |   expect((await snapshot(page)).hash).toBe(stateHash(saved.game));
  216 |   await endTurn(page);
  217 |   const continued = await exported(page);
  218 |   expect(serializeGame(continued.game)).toBe(serializeGame(expected));
  219 |   await writeFile(testInfo.outputPath('integrated-acceptance.json'), JSON.stringify({ authored: fixture.authored, patch: fixture.patch,
  220 |     ownedArmies: initial.armies.length, ownedHearths: initial.queues.length, wars: initial.wars, initialEvents: initial.events,
  221 |     initialHash: initial.hash, budget: { before: policy.treasury, after: paid.treasury, paid: 3, refused: 2 },
  222 |     routeReviewRequests: reviewed.traffic.slice(beforeReview.traffic.length), theater: { id: created.id, dispatches: report.lastDispatches, detachedArmy: incoming.armyId },
  223 |     savedHash: stateHash(saved.game), continuedHash: stateHash(continued.game), archiveCommands: continued.archive.records.length,
  224 |     limits: 'Synthetic mature state; local Chromium controls and exact canonical continuation. Not organic growth, campaign pacing, planner/frame-time measurement or release acceptance.',
  225 |   }, null, 2));
  226 |   expect(errors).toEqual([]);
  227 | });
  228 | 
```