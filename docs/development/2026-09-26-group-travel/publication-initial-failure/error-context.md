# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> scope ledger links real gates and a contributor can reach authoring guidance
- Location: tests/gameplay/updates.spec.ts:107:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('region', { name: 'Road to 1.0' })
Expected substring: "1,975 headless tests"
Received string:    "The promise & the remaining workRoad to 1.0Selected gates and decisions. Not a complete release report or a completion percentage.The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.Open the full roadmap →Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.Accepted scopeThe agreed game, not a moving finish lineThe canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.Read the source for The agreed game, not a moving finish line↗Current / partialGates E & F · Save integrity and combatRules32 retains campaign groups with exact rules31 checkpoints and mixed-history saves and exports. A benchmark exposed a pre-existing sixty-four-realm research-save limit; current saves now support it while historical schemas remain frozen. Campaign-safety and fleet-store evidence remains historical; whole save, combat and release gates remain open.Read the source for Gates E & F · Save integrity and combat↗Current / partialGates B, F2 & J · A playable foundationTwenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.Read the source for Gates B, F2 & J · A playable foundation↗Open gateGate C & integration · Remaining campaign proofThe group-travel implementation passes 2,000 headless tests across 250 files. Twenty-one affected Chromium journeys plus six focused journeys with four overlaps cover 23 distinct cases; one separate generated-production journey passes without development hooks. Ordinary movement commands retain authority; rules/save32, AI policy and prices remain unchanged. These scopes precede dispatch publication. Fleet attrition and Standard/Long pacing limits remain separately dated evidence. M0 and overall integration remain open.Read the source for Gate C & integration · Remaining campaign proof↗Current / partialGate I · Orders across a large realmNamed campaign groups recall selections before explicit orders. Up to 128 owned land armies ashore can review a shared destination, apply ordinary routes, append, resume or cancel; arrival stays individual and postings remain active. Production sequences preserve existing queues and paid prefixes. Separate browser-local libraries hold up to 24 charter policies and 24 production templates, excluded from campaign exports. Theaters, patrol/escort roles, army order templates, broader governors and combined mature-empire acceptance remain open.Read the source for Gate I · Orders across a large realm↗Open gateGates D, K & L · Scale and browser confidenceStorage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.Read the source for Gates D, K & L · Scale and browser confidence↗Proposal / deferredSuggested follow-ups, not new release promisesPromoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.Read the source for Suggested follow-ups, not new release promises↗Not this updateGate M, full magic and a 1.0 announcementNo online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.Read the source for Gate M, full magic and a 1.0 announcement↗Read all release gates →"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('region', { name: 'Road to 1.0' }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Road to 1.0' })
    14 × locator resolved to <section id="scope" class="scope-section" aria-labelledby="scope-title">…</section>
       - unexpected value "The promise & the remaining workRoad to 1.0Selected gates and decisions. Not a complete release report or a completion percentage.The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.Open the full roadmap →Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.Accepted scopeThe agreed game, not a moving finish lineThe canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.Read the source for The agreed game, not a moving finish line↗Current / partialGates E & F · Save integrity and combatRules32 retains campaign groups with exact rules31 checkpoints and mixed-history saves and exports. A benchmark exposed a pre-existing sixty-four-realm research-save limit; current saves now support it while historical schemas remain frozen. Campaign-safety and fleet-store evidence remains historical; whole save, combat and release gates remain open.Read the source for Gates E & F · Save integrity and combat↗Current / partialGates B, F2 & J · A playable foundationTwenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.Read the source for Gates B, F2 & J · A playable foundation↗Open gateGate C & integration · Remaining campaign proofThe group-travel implementation passes 2,000 headless tests across 250 files. Twenty-one affected Chromium journeys plus six focused journeys with four overlaps cover 23 distinct cases; one separate generated-production journey passes without development hooks. Ordinary movement commands retain authority; rules/save32, AI policy and prices remain unchanged. These scopes precede dispatch publication. Fleet attrition and Standard/Long pacing limits remain separately dated evidence. M0 and overall integration remain open.Read the source for Gate C & integration · Remaining campaign proof↗Current / partialGate I · Orders across a large realmNamed campaign groups recall selections before explicit orders. Up to 128 owned land armies ashore can review a shared destination, apply ordinary routes, append, resume or cancel; arrival stays individual and postings remain active. Production sequences preserve existing queues and paid prefixes. Separate browser-local libraries hold up to 24 charter policies and 24 production templates, excluded from campaign exports. Theaters, patrol/escort roles, army order templates, broader governors and combined mature-empire acceptance remain open.Read the source for Gate I · Orders across a large realm↗Open gateGates D, K & L · Scale and browser confidenceStorage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.Read the source for Gates D, K & L · Scale and browser confidence↗Proposal / deferredSuggested follow-ups, not new release promisesPromoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.Read the source for Suggested follow-ups, not new release promises↗Not this updateGate M, full magic and a 1.0 announcementNo online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.Read the source for Gate M, full magic and a 1.0 announcement↗Read all release gates →"

```

```yaml
- region "Road to 1.0":
  - paragraph: The promise & the remaining work
  - heading "Road to 1.0" [level=2]
  - paragraph: Selected gates and decisions. Not a complete release report or a completion percentage.
  - paragraph: The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.
  - paragraph:
    - link "Open the full roadmap →":
      - /url: /Theandril/updates/roadmap/
    - text: Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.
  - term:
    - text: Accepted scope
    - heading "The agreed game, not a moving finish line" [level=3]
  - definition:
    - paragraph: The canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.
    - link "Read the source for The agreed game, not a moving finish line":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/GAME_1_0_SCOPE.md
  - term:
    - text: Current / partial
    - heading "Gates E & F · Save integrity and combat" [level=3]
  - definition:
    - paragraph: Rules32 retains campaign groups with exact rules31 checkpoints and mixed-history saves and exports. A benchmark exposed a pre-existing sixty-four-realm research-save limit; current saves now support it while historical schemas remain frozen. Campaign-safety and fleet-store evidence remains historical; whole save, combat and release gates remain open.
    - link "Read the source for Gates E & F · Save integrity and combat":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/2026-09-25-selection-groups/integration-review.md
  - term:
    - text: Current / partial
    - heading "Gates B, F2 & J · A playable foundation" [level=3]
  - definition:
    - paragraph: Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.
    - link "Read the source for Gates B, F2 & J · A playable foundation":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/IMPLEMENTATION_STATUS.md
  - term:
    - text: Open gate
    - heading "Gate C & integration · Remaining campaign proof" [level=3]
  - definition:
    - paragraph: The group-travel implementation passes 2,000 headless tests across 250 files. Twenty-one affected Chromium journeys plus six focused journeys with four overlaps cover 23 distinct cases; one separate generated-production journey passes without development hooks. Ordinary movement commands retain authority; rules/save32, AI policy and prices remain unchanged. These scopes precede dispatch publication. Fleet attrition and Standard/Long pacing limits remain separately dated evidence. M0 and overall integration remain open.
    - link "Read the source for Gate C & integration · Remaining campaign proof":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/2026-09-26-group-travel/README.md
  - term:
    - text: Current / partial
    - heading "Gate I · Orders across a large realm" [level=3]
  - definition:
    - paragraph: Named campaign groups recall selections before explicit orders. Up to 128 owned land armies ashore can review a shared destination, apply ordinary routes, append, resume or cancel; arrival stays individual and postings remain active. Production sequences preserve existing queues and paid prefixes. Separate browser-local libraries hold up to 24 charter policies and 24 production templates, excluded from campaign exports. Theaters, patrol/escort roles, army order templates, broader governors and combined mature-empire acceptance remain open.
    - link "Read the source for Gate I · Orders across a large realm":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/2026-09-26-group-travel/README.md
  - term:
    - text: Open gate
    - heading "Gates D, K & L · Scale and browser confidence" [level=3]
  - definition:
    - paragraph: Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.
    - link "Read the source for Gates D, K & L · Scale and browser confidence":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/review-fix-2/persistence-REPORT.md
  - term:
    - text: Proposal / deferred
    - heading "Suggested follow-ups, not new release promises" [level=3]
  - definition:
    - paragraph: Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.
    - link "Read the source for Suggested follow-ups, not new release promises":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/post-fix-review/persistence.verdict.json
  - term:
    - text: Not this update
    - heading "Gate M, full magic and a 1.0 announcement" [level=3]
  - definition:
    - paragraph: No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.
    - link "Read the source for Gate M, full magic and a 1.0 announcement":
      - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/DEFINITION_OF_DONE.md
  - link "Read all release gates →":
    - /url: https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/DEFINITION_OF_DONE.md
```

# Test source

```ts
  16  |     // Exercise real lazy loading by scrolling to each visible image before the full-page capture.
  17  |     for (const image of await page.locator('img:visible').all()) {
  18  |       await image.scrollIntoViewIfNeeded();
  19  |       await image.evaluate(element => (element as HTMLImageElement).decode());
  20  |     }
  21  |     await page.evaluate(() => window.scrollTo(0, 0));
  22  |     await page.screenshot({ path: testInfo.outputPath('explore-top.png') });
  23  |     await page.screenshot({ path: testInfo.outputPath('explore-full.png'), fullPage: true });
  24  |     await expect(page.locator('figure > figcaption').first()).toHaveCSS('font-size', /./);
  25  |     expect(await page.locator('figure > figcaption').first().evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  26  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  27  |     await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('no-such-dispatch');
  28  |     await page.getByRole('heading', { name: 'No dispatches found' }).scrollIntoViewIfNeeded();
  29  |     await page.screenshot({ path: testInfo.outputPath('no-results.png') });
  30  |     await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  31  |     await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  32  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  33  |     await expect(page.getByRole('heading', { level: 1, name: 'Give your armies a shared destination' })).toBeVisible();
  34  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  35  |     await page.locator('.illustration-group-travel-results').scrollIntoViewIfNeeded();
  36  |     await page.locator('.illustration-group-travel-results > button > img').evaluate(image => (image as HTMLImageElement).decode());
  37  |     await page.locator('.illustration-group-travel-results').screenshot({ path: testInfo.outputPath('group-travel-results-illustration.png') });
  38  |     await page.getByRole('heading', { name: 'Travel and standing duty' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  39  |     await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
  40  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  41  |     const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
  42  |     expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
  43  |     expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
  44  |     await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
  45  |     expect(errors).toEqual([]);
  46  |     expect(workers).toEqual([]);
  47  |   });
  48  | }
  49  | 
  50  | test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  51  |   await page.goto('updates/dispatches/');
  52  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  53  |   const measurements = await page.evaluate(() => {
  54  |     const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  55  |     const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
  56  |       const s = channel / 255;
  57  |       return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
  58  |     }, 0);
  59  |     const ratio = (a: number[], b: number[]) => {
  60  |       const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  61  |       return (values[0]! + .05) / (values[1]! + .05);
  62  |     };
  63  |     return [
  64  |       ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
  65  |       ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
  66  |       ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
  67  |     ].map(([foregroundSelector, backgroundSelector]) => {
  68  |       const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
  69  |       const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
  70  |       const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
  71  |       // Paper's translucent wash is bounded against black and white underneath.
  72  |       // Multiply-blended walnut cannot be brighter than its background color.
  73  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  74  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  75  |     });
  76  |   });
  77  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  78  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  79  | });
  80  | 
  81  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  82  |   await page.goto('updates/dispatches/?dispatch=not-published');
  83  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  84  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  85  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  86  |   await page.keyboard.press('Tab');
  87  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  88  |   await page.keyboard.press('Enter');
  89  |   await expect(page.getByRole('main')).toBeFocused();
  90  | });
  91  | 
  92  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  93  |   await page.goto('updates/dispatches/#archive');
  94  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  95  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  96  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  97  |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  98  |   await page.reload();
  99  |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  100 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  101 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  102 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  103 |   await expect(page.getByRole('status')).toHaveText('11 dispatches');
  104 |   await expect(page.locator('.dispatch-row')).toHaveCount(11);
  105 | });
  106 | 
  107 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  108 |   await page.goto('updates/dispatches/');
  109 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  110 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  111 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  112 |   await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  113 |   await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  114 |   await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  115 |   await expect(ledger).toContainText('Fleet attrition and Standard/Long pacing limits remain separately dated evidence');
> 116 |   await expect(ledger).toContainText('1,975 headless tests');
      |                        ^ Error: expect(locator).toContainText(expected) failed
  117 |   await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  118 |   await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  119 |   await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  120 |   await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
  121 | });
  122 | 
  123 | test('a keyboard reader can enlarge a real image and return to the same control', async ({ page }) => {
  124 |   await page.goto('updates/dispatches/?dispatch=twenty-four-cultures');
  125 |   const trigger = page.getByRole('button', { name: 'Enlarge cultures image', exact: true });
  126 |   await expect(trigger).toBeVisible();
  127 |   await trigger.focus();
  128 |   await page.keyboard.press('Enter');
  129 |   const dialog = page.getByRole('dialog', { name: 'Image detail' });
  130 |   await expect(dialog).toBeVisible();
  131 |   await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
  132 |   await expect(dialog.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
  133 |   await page.keyboard.press('Escape');
  134 |   await expect(dialog).not.toBeVisible();
  135 |   await expect(trigger).toBeFocused();
  136 | });
  137 | 
  138 | // Resolves under either the normal root server or the Pages-base journal harness.
  139 | test('public journal opens a permanent, refresh-safe campaign dispatch', async ({ page }) => {
  140 |   await page.goto('updates/dispatches/');
  141 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  142 |   await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  143 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=group-travel$/);
  144 |   await expect(page.getByRole('heading', { level: 1, name: 'Give your armies a shared destination' })).toBeVisible();
  145 |   await page.reload();
  146 |   await expect(page.getByRole('heading', { level: 1, name: 'Give your armies a shared destination' })).toBeVisible();
  147 |   await expect(page.getByRole('link', { name: 'Group travel verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/3b0918999a166f36f6f3d51fbcb49413de549163/docs/development/2026-09-26-group-travel/README.md');
  148 |   await page.getByRole('link', { name: 'A voyage needs stores for the way home', exact: true }).click();
  149 |   await expect(page.getByRole('link', { name: 'Factual evidence review' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/b623c2c91d4d852cba710f2d996c28a6b1b5d624/docs/development/2026-09-23-fleet-provisions/factual-review.md');
  150 |   await page.getByRole('link', { name: 'A campaign worth keeping', exact: true }).click();
  151 |   await expect(page.getByRole('heading', { level: 1, name: 'A campaign worth keeping' })).toBeVisible();
  152 |   await expect(page.getByRole('link', { name: 'Post-fix review reconciliation' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/development/post-fix-review/summary.json');
  153 |   await page.getByRole('link', { name: 'All dispatches', exact: true }).click();
  154 |   await expect(page).toHaveURL(/updates\/dispatches\/#archive$/);
  155 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  156 |   // Searching must keep the reader on the dispatches page, not send them to the site home.
  157 |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('archive');
  158 |   await expect(page).toHaveURL(/updates\/dispatches\/\?q=archive#archive$/);
  159 |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dispatches' })).toHaveAttribute('aria-current', 'page');
  160 | });
  161 | 
```