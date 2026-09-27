# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/updates.spec.ts >> a keyboard reader can enlarge a real image and return to the same control
- Location: tests/gameplay/updates.spec.ts:123:1

# Error details

```
Error: expect(locator).toHaveJSProperty(expected) failed

Locator:  getByRole('dialog', { name: 'Image detail' }).getByRole('img')
Expected: 900
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveJSProperty" getByRole('dialog', { name: 'Image detail' }).getByRole('img') with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Image detail' }).getByRole('img')
    14 × locator resolved to <img width="900" height="325" loading="lazy" src="/Theandril/updates/cultures.webp" alt="Three distinctly built cultural cities arranged on a textured hex map in Theandril’s authored art-review gallery."/>
       - unexpected value "0"

```

```yaml
- link "Skip to content":
  - /url: "#main"
- banner:
  - link "Theandril home":
    - /url: /Theandril/updates/
    - text: The age of fracture
    - strong: Theandril
  - navigation "Main navigation":
    - link "Home":
      - /url: /Theandril/updates/
    - link "Dispatches":
      - /url: /Theandril/updates/dispatches/
    - link "Roadmap":
      - /url: /Theandril/updates/roadmap/
    - link "Lore":
      - /url: /Theandril/updates/lore/
    - link "Compendium":
      - /url: /Theandril/updates/compendium/
    - link "Play development build":
      - /url: /Theandril/
- main:
  - article:
    - link "All dispatches":
      - /url: /Theandril/updates/dispatches/#archive
    - paragraph: Dispatch 03 World & culture
    - text: Playable baseline
    - heading "Twenty-four ways to keep a hearth" [level=1]
    - paragraph: The playable baseline · People, places & material identity
    - paragraph: A culture is a political bargain, not a recolored banner. The current roster connects authored societies to real names, ecological choices and distinct approved art.
    - paragraph: Theandril development Roster 4 · slices 22–27
    - complementary:
      - navigation "In this dispatch":
        - paragraph: In this dispatch
        - list:
          - listitem:
            - link "More than a color on the map":
              - /url: "#political-bargains"
          - listitem:
            - link "Identity becomes a decision about land":
              - /url: "#land-and-livelihood"
          - listitem:
            - link "An art kit is a promise with evidence":
              - /url: "#material-record"
          - listitem:
            - link "Where the fiction stops and the rules begin":
              - /url: "#world-limits"
        - link "Sources & review notes":
          - /url: "#source-notes"
      - paragraph: A permanent record, tied to the evidence below. No invented release date or completion score.
      - link "Permanent link ↗":
        - /url: /Theandril/updates/dispatches/?dispatch=twenty-four-cultures
    - complementary:
      - paragraph: The short version
      - list:
        - listitem: Twenty-four authored cultures are selectable; repeated campaign seats are not new cultures.
        - listitem: Biome affinities and paid cultivation are implemented, while many supernatural hooks remain lore.
        - listitem: Gallery images are authored in-game review fixtures, not scenes from an organic campaign.
    - figure "Slice-22 cultural city gallery, an authored in-game review fixture cropped to its city silhouettes. Illustrative, not an organic campaign cityscape. Original image ↗":
      - button "Enlarge cultures image":
        - img "Three distinctly built cultural cities arranged on a textured hex map in Theandril’s authored art-review gallery."
      - text: Slice-22 cultural city gallery, an authored in-game review fixture cropped to its city silhouettes. Illustrative, not an organic campaign cityscape.
      - link "Original image ↗":
        - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/screenshots/slice22-factions/culture-cohort-4-stage-3-near.png
      - dialog "Image detail":
        - text: From the development record
        - button "Close image"
        - img "Three distinctly built cultural cities arranged on a textured hex map in Theandril’s authored art-review gallery."
        - paragraph: Slice-22 cultural city gallery, an authored in-game review fixture cropped to its city silhouettes. Illustrative, not an organic campaign cityscape.
        - link "View the complete source screenshot ↗":
          - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/screenshots/slice22-factions/culture-cohort-4-stage-3-near.png
    - heading "More than a color on the map" [level=2]
    - paragraph: The faction bible treats each culture as a political bargain between households and institutions. People migrate, dissent and serve other banners. Material choices and ecological traditions should make those bargains legible without turning ancestry into a single personality.
    - paragraph: The Ashen Compact brings hearth-gold, soot brown, repaired shields and workshop obligations. The Reedbound Council belongs to the river margins. The Vesper Court includes genuine vampiric patrons alongside living valley households; it is not simply a costume theme. These identities share a fractured world without settling the disputed causes of the Ashfall or the nature of the Witness Roads.
    - paragraph: Twenty-four selectable definitions now have stable IDs, name pools, worked-biome benefits and drawbacks, cultivation targets and paid AI recruitment preferences. A campaign uses distinct definitions before repeated seats. Larger seat counts can repeat a culture; they do not create new authored societies.
    - heading "Identity becomes a decision about land" [level=2]
    - paragraph: A faction’s preferred ground changes explicit yields on worked land. For example, the Vesper Court gains knowledge from temperate forest and coin from taiga, while desert and ash scrub carry documented penalties. Paid cultivation can establish eligible preferred biomes on claimed land; it does not rewrite physical relief, water depth or movement rules.
    - paragraph: The slice-27 baseline also supports eight generated resource economies, paid extraction works, household assignment and branching development for companies, hearths and factions. Older worlds retain their original geography instead of gaining retroactively placed deposits. The baseline is substantive, but it is not the full economy or content target in the 1.0 scope.
    - heading "An art kit is a promise with evidence" [level=2]
    - paragraph: The current art record qualifies distinct settlement, heraldic, land-role and naval assets for all twenty-four cultures. Campaign-map hulls use static southeast poses; battles use shared animated role sheets. A separate source, review and runtime binding matter more than a renamed file or a tint.
    - paragraph: The image here is a retained, authored in-game city gallery from the culture review. Its deliberate arrangement lets a reviewer compare silhouettes and materials. It is illustrative/regression evidence, not an organic campaign cityscape, and it does not demonstrate every culture in every biome.
    - heading "Where the fiction stops and the rules begin" [level=2]
    - paragraph: "These are not twenty-four separate rules engines. Common troops, paid recruitment, upkeep, transport and combat rules are shared. The Vesper Court’s blood dependence is lore: feeding, life-steal, resurrection and night bonuses are not implemented systems. A proposed named character in the bible is not a unique runtime entity."
    - paragraph: Further faction asymmetry, exclusive rosters, full supernatural progression and the remaining 1.0 content targets require authored data, canonical rules, AI understanding, persistence and tests. The public journal will distinguish those additions from a new painting or a writing hook rather than counting them early.
    - paragraph: Evidence, not decoration
    - heading "Sources & review notes" [level=2]
    - paragraph:
      - text: These links preserve the source checkpoint at
      - code: 8b3b8c1
      - text: . Counts describe the cited executions, not new runs performed for this journal.
    - list:
      - listitem:
        - link "Faction bible":
          - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/lore/FACTION_BIBLE.md
        - paragraph: Canonical identities, implementation boundaries and proposed character seeds.
      - listitem:
        - link "Executable faction definitions":
          - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/packages/content/src/factions.ts
        - paragraph: Stable registered definitions, not a future roster wishlist.
      - listitem:
        - link "Faction asset catalog":
          - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/art/FACTION_ASSET_CATALOG.md
        - paragraph: Approved culture kit coverage and source provenance.
      - listitem:
        - link "Art implementation status":
          - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/art/ART_IMPLEMENTATION_STATUS.md
        - paragraph: Published assets, animation scope and visual/performance limitations.
      - listitem:
        - link "Playable baseline and remaining work":
          - /url: https://github.com/ErikBurdett/Theandril/blob/8b3b8c148b7e8ee3689001210033fee7a1b8a6ef/docs/IMPLEMENTATION_STATUS.md
        - paragraph: Slice-27 systems and later campaign-safety corrections.
    - navigation "Continue reading":
      - paragraph: Continue reading
      - link "Queue a plan across your hearths":
        - /url: /Theandril/updates/dispatches/?dispatch=production-sequences
      - link "Recall a group, then give the order":
        - /url: /Theandril/updates/dispatches/?dispatch=selection-groups
      - link "Keep a charter worth repeating":
        - /url: /Theandril/updates/dispatches/?dispatch=charter-templates
      - link "One charter policy for forty hearths":
        - /url: /Theandril/updates/dispatches/?dispatch=group-charters
      - link "One posting for a hundred armies":
        - /url: /Theandril/updates/dispatches/?dispatch=group-postings
      - link "A voyage needs stores for the way home":
        - /url: /Theandril/updates/dispatches/?dispatch=fleet-provisions
      - link "A funded expedition and a practical route to 1.0":
        - /url: /Theandril/updates/dispatches/?dispatch=campaign-foundation-and-development-order
      - link "A campaign worth keeping":
        - /url: /Theandril/updates/dispatches/?dispatch=r17-campaign-safety
      - link "Keeping the whole record":
        - /url: /Theandril/updates/dispatches/?dispatch=keeping-the-record
- contentinfo:
  - paragraph:
    - strong: Theandril
    - text: · A world in the making. Single-player development build. Not Theandril 1.0.
  - link "Current implementation status ↗":
    - /url: https://github.com/ErikBurdett/Theandril/blob/master/docs/IMPLEMENTATION_STATUS.md
  - link "Image provenance ↗":
    - /url: /Theandril/updates/provenance.json
  - link "Hearth & Card roadmap ↗":
    - /url: https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/
  - link "Source repository ↗":
    - /url: https://github.com/ErikBurdett/Theandril
```

# Test source

```ts
  31  |     await page.getByRole('link', { name: 'Read the featured dispatch' }).click();
  32  |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  33  |     await expect(page.getByRole('heading', { level: 1, name: 'Queue a plan across your hearths' })).toBeVisible();
  34  |     await page.screenshot({ path: testInfo.outputPath('reader-top.png') });
  35  |     await page.locator('.illustration-production-sequence-results').scrollIntoViewIfNeeded();
  36  |     await page.locator('.illustration-production-sequence-results > button > img').evaluate(image => (image as HTMLImageElement).decode());
  37  |     await page.locator('.illustration-production-sequence-results').screenshot({ path: testInfo.outputPath('production-sequence-results-illustration.png') });
  38  |     await page.getByRole('heading', { name: 'Remember the plan separately' }).evaluate(element => element.scrollIntoView({ block: 'start' }));
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
  103 |   await expect(page.getByRole('status')).toHaveText('10 dispatches');
  104 |   await expect(page.locator('.dispatch-row')).toHaveCount(10);
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
  116 |   await expect(ledger).toContainText('1,975 headless tests');
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
> 131 |   await expect(dialog.getByRole('img')).toHaveJSProperty('naturalWidth', 900);
      |                                         ^ Error: expect(locator).toHaveJSProperty(expected) failed
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
  143 |   await expect(page).toHaveURL(/updates\/dispatches\/\?dispatch=production-sequences$/);
  144 |   await expect(page.getByRole('heading', { level: 1, name: 'Queue a plan across your hearths' })).toBeVisible();
  145 |   await page.reload();
  146 |   await expect(page.getByRole('heading', { level: 1, name: 'Queue a plan across your hearths' })).toBeVisible();
  147 |   await expect(page.getByRole('link', { name: 'Production sequences verification' })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-26-production-sequences/README.md');
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