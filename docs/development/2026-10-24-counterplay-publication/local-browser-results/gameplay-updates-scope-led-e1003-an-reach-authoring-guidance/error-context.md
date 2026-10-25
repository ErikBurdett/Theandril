# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> scope ledger links real gates and a contributor can reach authoring guidance
- Location: tests/gameplay/updates.spec.ts:109:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('region', { name: 'Road to 1.0' })
Expected substring: "2,242"
Received string:    "The promise & the remaining workRoad to 1.0Selected gates and decisions. Not a complete release report or a completion percentage.The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.Open the full roadmap →Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.Accepted scopeThe agreed game, not a moving finish lineThe canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.Read the source for The agreed game, not a moving finish line↗Current / partialGates E & F · Save integrity and combatRules/save 35 retains two-point patrols and their policy through exact saves and replay. Six genuine pre-change rules 34 checkpoints preserve original bytes and continuations; strict old schemas reject future fields. Posting templates are separate browser preferences. Mixed history and reopened storage pass; whole save, combat and release gates remain open.Read the source for Gates E & F · Save integrity and combat↗Current / partialGates B, F2 & J · A playable foundationTwenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.Read the source for Gates B, F2 & J · A playable foundation↗Open gateGate C & integration · Remaining campaign proofThe bounded project-counterplay checkpoint passes 2,304 tests across 280 files and four affected built-production journeys. New immediate sieges and existing own project-pausing sieges can prevent binding peace from releasing a visible imminent rival project. Real battles can still be lost. Three fixed seeds yield Standard 219/194/201, Long 329/309/287 and Epic 374/332/327. The original Long remains eighteen turns later than retained rules34 and two Epic seeds finish too early. No prices or proxy bounds changed; DH-021 and all fifteen release gates remain open.Read the source for Gate C & integration · Remaining campaign proof↗Current / partialGate I · Orders across a large realmPersonal posting templates recall a policy before explicit group orders. Saved two-point land patrols respect direct routes, postings, voyages, missions and sieges. An AI seat can review a safe interrupted home leg or retire a narrowly observed captured-hearth circuit while preserving issued travel; player travel never resumes itself and ordinary player turns do not perform AI cleanup. Multi-step programs, escorts, broader governors and organic mature-empire acceptance remain unfinished.Read the source for Gate I · Orders across a large realm↗Open gateGates D, K & L · Scale and browser confidenceStorage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.Read the source for Gates D, K & L · Scale and browser confidence↗Proposal / deferredSuggested follow-ups, not new release promisesPromoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.Read the source for Suggested follow-ups, not new release promises↗Not this updateGate M, full magic and a 1.0 announcementNo online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.Read the source for Gate M, full magic and a 1.0 announcement↗Read all release gates →"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('region', { name: 'Road to 1.0' }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Road to 1.0' })
    14 × locator resolved to <section id="scope" class="scope-section" aria-labelledby="scope-title">…</section>
       - unexpected value "The promise & the remaining workRoad to 1.0Selected gates and decisions. Not a complete release report or a completion percentage.The agreed scope stays put. The evidence changes. A scoped approval moves a piece of the game forward; it does not clear every gate around it.Open the full roadmap →Browse checked completed checkpoints, in-progress systems and pending features with evidence and remaining acceptance. The selected decisions below use the current roadmap snapshot; historical dispatches retain their own evidence.Accepted scopeThe agreed game, not a moving finish lineThe canonical scope still calls for long single-player campaigns, online human campaigns, deep progression, multiple victory paths and authored world content. No scope cuts or new gameplay obligations are adopted by these dispatches.Read the source for The agreed game, not a moving finish line↗Current / partialGates E & F · Save integrity and combatRules/save 35 retains two-point patrols and their policy through exact saves and replay. Six genuine pre-change rules 34 checkpoints preserve original bytes and continuations; strict old schemas reject future fields. Posting templates are separate browser preferences. Mixed history and reopened storage pass; whole save, combat and release gates remain open.Read the source for Gates E & F · Save integrity and combat↗Current / partialGates B, F2 & J · A playable foundationTwenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.Read the source for Gates B, F2 & J · A playable foundation↗Open gateGate C & integration · Remaining campaign proofThe bounded project-counterplay checkpoint passes 2,304 tests across 280 files and four affected built-production journeys. New immediate sieges and existing own project-pausing sieges can prevent binding peace from releasing a visible imminent rival project. Real battles can still be lost. Three fixed seeds yield Standard 219/194/201, Long 329/309/287 and Epic 374/332/327. The original Long remains eighteen turns later than retained rules34 and two Epic seeds finish too early. No prices or proxy bounds changed; DH-021 and all fifteen release gates remain open.Read the source for Gate C & integration · Remaining campaign proof↗Current / partialGate I · Orders across a large realmPersonal posting templates recall a policy before explicit group orders. Saved two-point land patrols respect direct routes, postings, voyages, missions and sieges. An AI seat can review a safe interrupted home leg or retire a narrowly observed captured-hearth circuit while preserving issued travel; player travel never resumes itself and ordinary player turns do not perform AI cleanup. Multi-step programs, escorts, broader governors and organic mature-empire acceptance remain unfinished.Read the source for Gate I · Orders across a large realm↗Open gateGates D, K & L · Scale and browser confidenceStorage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.Read the source for Gates D, K & L · Scale and browser confidence↗Proposal / deferredSuggested follow-ups, not new release promisesPromoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.Read the source for Suggested follow-ups, not new release promises↗Not this updateGate M, full magic and a 1.0 announcementNo online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.Read the source for Gate M, full magic and a 1.0 announcement↗Read all release gates →"

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
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/GAME_1_0_SCOPE.md
  - term:
    - text: Current / partial
    - heading "Gates E & F · Save integrity and combat" [level=3]
  - definition:
    - paragraph: Rules/save 35 retains two-point patrols and their policy through exact saves and replay. Six genuine pre-change rules 34 checkpoints preserve original bytes and continuations; strict old schemas reject future fields. Posting templates are separate browser preferences. Mixed history and reopened storage pass; whole save, combat and release gates remain open.
    - link "Read the source for Gates E & F · Save integrity and combat":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/2026-10-24-patrols/README.md
  - term:
    - text: Current / partial
    - heading "Gates B, F2 & J · A playable foundation" [level=3]
  - definition:
    - paragraph: Twenty-four cultures, resource economies, development branches and individual soldier battles are playable. Waykeepers are a first paid caster role, not complete magic. Content depth, campaign counterplay and the full progression targets remain partial.
    - link "Read the source for Gates B, F2 & J · A playable foundation":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/IMPLEMENTATION_STATUS.md
  - term:
    - text: Open gate
    - heading "Gate C & integration · Remaining campaign proof" [level=3]
  - definition:
    - paragraph: The bounded project-counterplay checkpoint passes 2,304 tests across 280 files and four affected built-production journeys. New immediate sieges and existing own project-pausing sieges can prevent binding peace from releasing a visible imminent rival project. Real battles can still be lost. Three fixed seeds yield Standard 219/194/201, Long 329/309/287 and Epic 374/332/327. The original Long remains eighteen turns later than retained rules34 and two Epic seeds finish too early. No prices or proxy bounds changed; DH-021 and all fifteen release gates remain open.
    - link "Read the source for Gate C & integration · Remaining campaign proof":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/2026-10-24-project-counterplay/README.md
  - term:
    - text: Current / partial
    - heading "Gate I · Orders across a large realm" [level=3]
  - definition:
    - paragraph: Personal posting templates recall a policy before explicit group orders. Saved two-point land patrols respect direct routes, postings, voyages, missions and sieges. An AI seat can review a safe interrupted home leg or retire a narrowly observed captured-hearth circuit while preserving issued travel; player travel never resumes itself and ordinary player turns do not perform AI cleanup. Multi-step programs, escorts, broader governors and organic mature-empire acceptance remain unfinished.
    - link "Read the source for Gate I · Orders across a large realm":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/2026-10-24-patrol-retirement/README.md
  - term:
    - text: Open gate
    - heading "Gates D, K & L · Scale and browser confidence" [level=3]
  - definition:
    - paragraph: Storage publication performs O(prefix bytes) reads; queued-GC proof scans the store. Large-store GC, sustained memory, real quota/process-kill durability and cross-browser certification still need separate evidence. A still image is not a frame-time result.
    - link "Read the source for Gates D, K & L · Scale and browser confidence":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/review-fix-2/persistence-REPORT.md
  - term:
    - text: Proposal / deferred
    - heading "Suggested follow-ups, not new release promises" [level=3]
  - definition:
    - paragraph: Promoting the temporary storage probes to permanent regressions and separately profiling large-store GC are review suggestions. They require a bounded work packet and acceptance criteria. This journal does not authorize blocked probes or turn every suggestion into scope.
    - link "Read the source for Suggested follow-ups, not new release promises":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/post-fix-review/persistence.verdict.json
  - term:
    - text: Not this update
    - heading "Gate M, full magic and a 1.0 announcement" [level=3]
  - definition:
    - paragraph: No online multiplayer service, complete magic system, new art production or overall 1.0 signoff is delivered here. Online play and full magical depth remain accepted release scope—not silently deferred out of 1.0. This journal adds a review surface, not those game systems.
    - link "Read the source for Gate M, full magic and a 1.0 announcement":
      - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/DEFINITION_OF_DONE.md
  - link "Read all release gates →":
    - /url: https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/DEFINITION_OF_DONE.md
```

# Test source

```ts
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
  33  |     await expect(page.getByRole('heading', { level: 1, name: 'Before peace decides the race' })).toBeVisible();
  34  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  35  |     for (const id of ['technical-ledger']) {
  36  |       await page.locator(`.illustration-${id}`).scrollIntoViewIfNeeded();
  37  |       await page.locator(`.illustration-${id} > button > img`).evaluate(image => (image as HTMLImageElement).decode());
  38  |       await page.locator(`.illustration-${id}`).screenshot({ path: testInfo.outputPath(`${id}-illustration.png`) });
  39  |     }
  40  |     await page.getByRole('heading', { name: 'The same round matters' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
  41  |     await page.screenshot({ path: testInfo.outputPath('reader-chapter.png') });
  42  |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  43  |     const imageFacts = await page.locator('figure > button > img').evaluateAll(elements => elements.map(element => { const image = element as HTMLImageElement; return { src: image.currentSrc, width: image.naturalWidth, complete: image.complete }; }));
  44  |     expect(imageFacts.every(image => image.complete && image.width > 0)).toBe(true);
  45  |     expect(imageFacts.every(image => new URL(image.src).pathname.includes('/updates/'))).toBe(true);
  46  |     await writeFile(testInfo.outputPath('layout-evidence.json'), JSON.stringify({ dimensions, imageFacts, errors, workers }, null, 2));
  47  |     expect(errors).toEqual([]);
  48  |     expect(workers).toEqual([]);
  49  |   });
  50  | }
  51  | 
  52  | test('reading surfaces retain contrast without putting texture over the text', async ({ page }, testInfo) => {
  53  |   await page.goto('updates/dispatches/');
  54  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  55  |   const measurements = await page.evaluate(() => {
  56  |     const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  57  |     const luminance = (color: number[]) => color.slice(0, 3).reduce((total, channel, index) => {
  58  |       const s = channel / 255;
  59  |       return total + (s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4) * [ .2126, .7152, .0722 ][index]!;
  60  |     }, 0);
  61  |     const ratio = (a: number[], b: number[]) => {
  62  |       const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  63  |       return (values[0]! + .05) / (values[1]! + .05);
  64  |     };
  65  |     return [
  66  |       ['.feature-summary', '.paper-content'], ['figure > figcaption', '.paper-content'],
  67  |       ['.scope-ledger dd', '.paper-content'], ['.contribution-note', '.contribute-section'],
  68  |       ['.plaque', '.plaque'], ['.site-header nav', '.journal-site'], ['.site-footer', '.journal-site'],
  69  |     ].map(([foregroundSelector, backgroundSelector]) => {
  70  |       const foreground = getComputedStyle(document.querySelector(foregroundSelector!)!).color;
  71  |       const background = getComputedStyle(document.querySelector(backgroundSelector!)!).backgroundColor;
  72  |       const fg = rgb(foreground), bg = rgb(background), alpha = bg[3] ?? 1;
  73  |       // Paper's translucent wash is bounded against black and white underneath.
  74  |       // Multiply-blended walnut cannot be brighter than its background color.
  75  |       const extremes = [0, 255].map(under => bg.slice(0, 3).map(channel => channel * alpha + under * (1 - alpha)));
  76  |       return { foregroundSelector, backgroundSelector, foreground, background, conservativeRatio: Math.min(...extremes.map(value => ratio(fg, value))) };
  77  |     });
  78  |   });
  79  |   await writeFile(testInfo.outputPath('contrast-evidence.json'), JSON.stringify(measurements, null, 2));
  80  |   for (const entry of measurements) expect(entry.conservativeRatio, entry.foregroundSelector).toBeGreaterThanOrEqual(4.5);
  81  | });
  82  | 
  83  | test('unknown dispatch links fail honestly and keyboard skip navigation works', async ({ page }) => {
  84  |   await page.goto('updates/dispatches/?dispatch=not-published');
  85  |   await expect(page.getByRole('heading', { name: 'That page is not in the journal' })).toBeVisible();
  86  |   await page.getByRole('link', { name: 'Browse published dispatches' }).click();
  87  |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  88  |   await page.keyboard.press('Tab');
  89  |   await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  90  |   await page.keyboard.press('Enter');
  91  |   await expect(page.getByRole('main')).toBeFocused();
  92  | });
  93  | 
  94  | test('archive search combines topic filters, survives refresh and recovers from no results', async ({ page }) => {
  95  |   await page.goto('updates/dispatches/#archive');
  96  |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('Vesper');
  97  |   await page.getByRole('button', { name: 'World & culture', exact: true }).click();
  98  |   await expect(page.getByRole('status')).toHaveText('1 dispatch');
  99  |   await expect(page.locator('.dispatch-row')).toHaveCount(1);
  100 |   await page.reload();
  101 |   await expect(page.getByRole('searchbox', { name: 'Search dispatches' })).toHaveValue('Vesper');
  102 |   await page.getByRole('button', { name: 'Engineering', exact: true }).click();
  103 |   await expect(page.getByRole('heading', { name: 'No dispatches found' })).toBeVisible();
  104 |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  105 |   await expect(page.getByRole('status')).toHaveText('16 dispatches');
  106 |   await expect(page.locator('.dispatch-row')).toHaveCount(16);
  107 | });
  108 | 
  109 | test('scope ledger links real gates and a contributor can reach authoring guidance', async ({ page }) => {
  110 |   await page.goto('updates/dispatches/');
  111 |   await expect(page.getByRole('heading', { name: 'Road to 1.0', exact: true })).toBeVisible();
  112 |   const ledger = page.getByRole('region', { name: 'Road to 1.0' });
  113 |   await expect(ledger.getByText('Accepted scope', { exact: true })).toBeVisible();
  114 |   await expect(ledger.getByText('Current / partial', { exact: true }).first()).toBeVisible();
  115 |   await expect(ledger.getByText('Proposal / deferred', { exact: true })).toBeVisible();
  116 |   await expect(ledger.getByText('Not this update', { exact: true })).toBeVisible();
  117 |   await expect(ledger).toContainText('player travel never resumes itself');
> 118 |   await expect(ledger).toContainText('2,242');
      |                        ^ Error: expect(locator).toContainText(expected) failed
  119 |   await expect(page.getByRole('link', { name: 'Definition of done', exact: true })).toHaveAttribute('href', /DEFINITION_OF_DONE.md$/);
  120 |   await expect(page.getByRole('heading', { name: 'The reference shelf' })).toBeVisible();
  121 |   await expect(page.getByRole('link', { name: 'Authoring guide', exact: true })).toHaveAttribute('href', /docs\/updates\/CONTRIBUTING.md$/);
  122 |   await expect(page.getByRole('link', { name: 'Dispatch template', exact: true })).toHaveAttribute('href', /docs\/updates\/TEMPLATE.md$/);
  123 | });
  124 | 
  125 | test('a keyboard reader can enlarge a real image and return to the same control', async ({ page }) => {
  126 |   await page.goto('updates/dispatches/?dispatch=twenty-four-cultures');
  127 |   const trigger = page.getByRole('button', { name: 'Enlarge cultures image', exact: true });
  128 |   await expect(trigger).toBeVisible();
  129 |   await trigger.focus();
  130 |   await page.keyboard.press('Enter');
  131 |   const dialog = page.getByRole('dialog', { name: 'Image detail' });
  132 |   await expect(dialog).toBeVisible();
  133 |   await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
  134 |   await expect(dialog.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
  135 |   await page.keyboard.press('Escape');
  136 |   await expect(dialog).not.toBeVisible();
  137 |   await expect(trigger).toBeFocused();
  138 | });
  139 | 
  140 | // Resolves under either the normal root server or the Pages-base journal harness.
  141 | test('public journal opens a permanent, refresh-safe campaign dispatch', async ({ page }) => {
  142 |   await page.goto('updates/dispatches/');
  143 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  144 |   await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  145 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=project-counterplay$/);
  146 |   await expect(page.getByRole('heading', { level: 1, name: 'Before peace decides the race' })).toBeVisible();
  147 |   await page.reload();
  148 |   await expect(page.getByRole('heading', { level: 1, name: 'Before peace decides the race' })).toBeVisible();
  149 |   await expect(page.getByRole('link', { name: 'Counterplay implementation and retained evidence' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/bff98894992762e797daf2aa63b487b4a98c0f28/docs/development/2026-10-24-project-counterplay/README.md');
  150 |   await page.getByRole('link', { name: 'When a home patrol loses its hearth', exact: true }).click();
  151 |   await expect(page.getByRole('link', { name: 'Retirement implementation and retained evidence' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/68ef5fa7e524a3cd4e7e60fd7bbdd9037a6bc120/docs/development/2026-10-24-patrol-retirement/README.md');
  152 |   await page.getByRole('link', { name: 'Keep the watch moving', exact: true }).click();
  153 |   await expect(page.getByRole('link', { name: 'Recovery evidence and retained failures' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/dee74cf9c4e2d153f9c5f5cfdbd9221798205481/docs/development/2026-10-24-patrol-recovery/README.md');
  154 |   await page.getByRole('link', { name: 'Hold the frontier, provision the crossing', exact: true }).click();
  155 |   await expect(page.getByRole('link', { name: 'Implementation and retained failures' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/f33a816f3a853229695b902af007e4e3f3547275/docs/development/2026-09-27-reinforcement-logistics/README.md');
  156 |   await page.getByRole('link', { name: 'A voyage needs stores for the way home', exact: true }).click();
  157 |   await expect(page.getByRole('link', { name: 'Factual evidence review' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/b623c2c91d4d852cba710f2d996c28a6b1b5d624/docs/development/2026-09-23-fleet-provisions/factual-review.md');
  158 |   await page.getByRole('link', { name: 'A campaign worth keeping', exact: true }).click();
  159 |   await expect(page.getByRole('heading', { level: 1, name: 'A campaign worth keeping' })).toBeVisible();
  160 |   await expect(page.getByRole('link', { name: 'Post-fix review reconciliation' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/development/post-fix-review/summary.json');
  161 |   await page.getByRole('link', { name: 'All dispatches', exact: true }).click();
  162 |   await expect(page).toHaveURL(/updates\/dispatches\/#archive$/);
  163 |   await expect(page.getByRole('heading', { name: 'Theandril Dispatches', exact: true })).toBeVisible();
  164 |   // Searching must keep the reader on the dispatches page, not send them to the site home.
  165 |   await page.getByRole('searchbox', { name: 'Search dispatches' }).fill('archive');
  166 |   await expect(page).toHaveURL(/updates\/dispatches\/\?q=archive#archive$/);
  167 |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dispatches' })).toHaveAttribute('aria-current', 'page');
  168 | });
  169 | 
```