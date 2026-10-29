# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> public journal opens a permanent, refresh-safe campaign dispatch
- Location: tests/gameplay/updates.spec.ts:142:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByRole('heading', { name: 'A campaign worth keeping', level: 1 })
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'A campaign worth keeping', level: 1 }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'A campaign worth keeping', level: 1 })
  - 

```

# Test source

```ts
  74  |       // Paper's translucent wash is bounded against black and white underneath.
  75  |       // Multiply-blended walnut cannot be brighter than its background color.
  76  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  77  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  78  |     });
  79  |   });
  80  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  81  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  82  | });
  83  | 
  84  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  85  |   await page.goto('updates/dispatches/?dispatch=not-published');
  86  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  87  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  88  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  89  |   await page.keyboard.press('Tab');
  90  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  91  |   await page.keyboard.press('Enter');
  92  |   await expect(page.getByRole('main')).toBeFocused();
  93  | });
  94  | 
  95  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  96  |   await page.goto('updates/dispatches/#archive');
  97  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  98  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  99  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  100 |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  101 |   await page.reload();
  102 |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  103 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  104 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  105 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  106 |   await expect(page.getByRole('status')).toHaveText(`${dispatches.length} dispatches`);
  107 |   await expect(page.locator('.dispatch-row')).toHaveCount(dispatches.length);
  108 | });
  109 | 
  110 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  111 |   await page.goto('updates/dispatches/');
  112 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  113 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  114 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  115 |   await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  116 |   await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  117 |   await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  118 |   await expect(ledger).toContainText('player travel never resumes itself');
  119 |   await expect(ledger).toContainText('2,486');
  120 |   await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  121 |   await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  122 |   await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  123 |   await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
  124 | });
  125 | 
  126 | test('a keyboard reader can enlarge a real image and return to the same control', async ({ page }) => {
  127 |   await page.goto('updates/dispatches/?dispatch=twenty-four-cultures');
  128 |   const trigger = page.getByRole('button', { name: 'Enlarge cultures image', exact: true });
  129 |   await expect(trigger).toBeVisible();
  130 |   await trigger.focus();
  131 |   await page.keyboard.press('Enter');
  132 |   const dialog = page.getByRole('dialog', { name: 'Image detail' });
  133 |   await expect(dialog).toBeVisible();
  134 |   await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
  135 |   await expect(dialog.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
  136 |   await page.keyboard.press('Escape');
  137 |   await expect(dialog).not.toBeVisible();
  138 |   await expect(trigger).toBeFocused();
  139 | });
  140 | 
  141 | // Resolves under either the normal root server or the Pages-base journal harness.
  142 | test('public journal opens a permanent, refresh-safe campaign dispatch', async ({ page }) => {
  143 |   await page.goto('updates/dispatches/');
  144 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  145 |   await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  146 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=group-land-commissions$/);
  147 |   await expect(page.getByRole('heading', { level: 1, name: 'Give several hearths a land budget' })).toBeVisible();
  148 |   await page.reload();
  149 |   await expect(page.getByRole('heading', { level: 1, name: 'Give several hearths a land budget' })).toBeVisible();
  150 |   await expect(page.getByRole('link', { name: 'Group commission verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/cfd660c1b20bf5e0f1966fa69c8efb4e2b1acab5/docs/development/2026-10-26-group-land-commissions/README.md');
  151 |   await page.getByRole('link', { name: 'Give land work a budget', exact: true }).click();
  152 |   await expect(page.getByRole('link', { name: 'Land commission verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/24a710aaa8ddc49aa4ce56173ac043fe4ba1f767/docs/development/2026-10-25-land-commissions/README.md');
  153 |   await page.getByRole('link', { name: 'Keep growing hearths at work', exact: true }).click();
  154 |   await expect(page.getByRole('link', { name: 'Worker stewardship verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/97b248ed596c931f01d0df66d60fcf25f819eaef/docs/development/2026-10-25-worker-stewardship/README.md');
  155 |   await page.getByRole('link', { name: 'Give the order, then review each result', exact: true }).click();
  156 |   await expect(page.getByRole('link', { name: 'Posting and charter intent checks' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/670a18af843f95c80198a255e1894a708c5f1391/docs/development/2026-10-25-group-intent/README.md');
  157 |   await page.getByRole('link', { name: 'Find empty queues and waiting charters', exact: true }).click();
  158 |   await expect(page.getByRole('link', { name: 'Settlement order implementation and acceptance' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/5da6b62e9d9522d973f87b0c7022ada370636dcc/docs/development/2026-10-25-settlement-order-filters/README.md');
  159 |   await page.getByRole('link', { name: 'Change patrol policies across the checked companies', exact: true }).click();
  160 |   await expect(page.getByRole('link', { name: 'Group patrol implementation and acceptance' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8d880eb60cdca549d5ff1086ef95e095e81feea5/docs/development/2026-10-24-group-patrols/README.md');
  161 |   await page.getByRole('link', { name: 'Find waiting orders in a crowded roster', exact: true }).click();
  162 |   await expect(page.getByRole('link', { name: 'Registry implementation and acceptance' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/da12978fb596a73a7fddcfb8e914efb7924efbc2/docs/development/2026-10-24-army-order-filters/README.md');
  163 |   await page.getByRole('link', { name: 'Before peace decides the race', exact: true }).click();
  164 |   await expect(page.getByRole('link', { name: 'Counterplay implementation and retained evidence' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/2026-10-24-project-counterplay/README.md');
  165 |   await page.getByRole('link', { name: 'When a home patrol loses its hearth', exact: true }).click();
  166 |   await expect(page.getByRole('link', { name: 'Retirement implementation and retained evidence' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/68ef5fa7e524a3cd4e7e60fd7bbdd9037a6bc120/docs/development/2026-10-24-patrol-retirement/README.md');
  167 |   await page.getByRole('link', { name: 'Keep the watch moving', exact: true }).click();
  168 |   await expect(page.getByRole('link', { name: 'Recovery evidence and retained failures' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrol-recovery/README.md');
  169 |   await page.getByRole('link', { name: 'Hold the frontier, provision the crossing', exact: true }).click();
  170 |   await expect(page.getByRole('link', { name: 'Implementation and retained failures' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/f33a816f3a853229695b902af007e4e3f3547275/docs/development/2026-09-27-reinforcement-logistics/README.md');
  171 |   await page.getByRole('link', { name: 'A voyage needs stores for the way home', exact: true }).click();
  172 |   await expect(page.getByRole('link', { name: 'Factual evidence review' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/b623c2c91d4d852cba710f2d996c28a6b1b5d624/docs/development/2026-09-23-fleet-provisions/factual-review.md');
  173 |   await page.getByRole('link', { name: 'A campaign worth keeping', exact: true }).click();
> 174 |   await expect(page.getByRole('heading', { level: 1, name: 'A campaign worth keeping' })).toBeVisible();
      |                                                                                           ^ Error: expect(locator).toBeVisible() failed
  175 |   await expect(page.getByRole('link', { name: 'Post-fix review reconciliation' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/development/post-fix-review/summary.json');
  176 |   await page.getByRole('link', { name: 'All dispatches', exact: true }).click();
  177 |   await expect(page).toHaveURL(/updates\/dispatches\/#archive$/);
  178 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  179 |   // Searching must keep the reader on the dispatches page, not send them to the site home.
  180 |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('archive');
  181 |   await expect(page).toHaveURL(/updates\/dispatches\/\?q=archive#archive$/);
  182 |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dispatches' })).toHaveAttribute('aria-current', 'page');
  183 | });
  184 | 
```