# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/deployment-assets.spec.ts >> built game loads verified map art, UI materials and its real worker inside the configured deployment base
- Location: tests/production/deployment-assets.spec.ts:7:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('.setup .faction-card .faction-art')
Expected: "ready"
Received: "loading"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" locator('.setup .faction-card .faction-art') with timeout 5000ms
  - waiting for locator('.setup .faction-card .faction-art')
    14 × locator resolved to <span aria-hidden="true" data-art-state="loading" data-art-content-id="ui.crest" data-art-id="ui.crest.ashen_compact" class="faction-art faction-art--loading" data-art-definition="faction.ashen_compact" title="Selected culture crest · loading approved artwork">…</span>
       - unexpected value "loading"

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
    - group [ref=e14]:
      - generic "Campaign & settings" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - generic [ref=e18]: Keep the hearth. Keep the oath.
      - heading "From the ashes, a new dominion." [level=2] [ref=e19]: From the ashes,a new dominion.
      - paragraph [ref=e20]: "The old roads end in wilderness. Lead your chosen people beyond their last milestones: chart the forests, raise a settlement, and give your people a future."
      - paragraph [ref=e22]: Found a hearth. Work its land.Send wayfinders into the unknown.
      - paragraph [ref=e23]:
        - link "Developer updates (opens in a new tab)" [ref=e24] [cursor=pointer]:
          - /url: /Theandril/updates/
          - text: Developer updates
          - generic [aria-hidden] [ref=e25]: ↗
    - generic [ref=e26]:
      - generic [ref=e27]: A chronicle begins
      - heading "Establish your campaign" [level=2] [ref=e28]
      - generic [ref=e31]:
        - heading "Ashen Compact" [level=3] [ref=e32]
        - paragraph [ref=e33]: Your chosen player seat
      - generic [ref=e34]:
        - region "Player culture" [ref=e35]:
          - generic [ref=e36]:
            - text: Player faction
            - combobox "Player faction" [ref=e37]:
              - option "Ashen Compact" [selected]
              - option "Reedbound Council"
              - option "Cinder March"
              - option "Glass Tide"
              - option "Iron Covenant"
              - option "Sepulchral Synod"
              - option "Mire Courts"
              - option "Saltwind Remnant"
              - option "Wardhall Remnant"
              - option "Rimehorn Clans"
              - option "Sable Steppe"
              - option "Morrow Spore"
              - option "Cistern Assembly"
              - option "Unsealed Companies"
              - option "Lantern Hospices"
              - option "Cairnwing Concord"
              - option "Red Sluice Directorate"
              - option "Velvet Meridian"
              - option "Brine Choir"
              - option "Emberwake Convocation"
              - option "Underhush Exchange"
              - option "Vesper Court"
              - option "Manytrack Moot"
              - option "Margin Observance"
          - paragraph [ref=e38]: Keep the hearth. Keep the oath.
          - generic [ref=e39]:
            - paragraph [ref=e40]: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
            - paragraph [ref=e41]:
              - strong [ref=e42]: Worked-land strengths & drawbacks
            - list "Biome affinities" [ref=e43]:
              - listitem [ref=e44]:
                - strong [ref=e45]: Temperate grassland
                - text: ": +1 food per worked tile"
              - listitem [ref=e46]:
                - strong [ref=e47]: Temperate forest
                - text: ": +1 industry per worked tile"
              - listitem [ref=e48]:
                - strong [ref=e49]: Tundra
                - text: ": −1 food per worked tile"
              - listitem [ref=e50]:
                - strong [ref=e51]: Desert
                - text: ": −1 food per worked tile"
            - paragraph [ref=e52]: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
            - paragraph [ref=e53]: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
            - group [ref=e54]:
              - generic "Recruitment tendencies" [ref=e55] [cursor=pointer]
        - generic [ref=e56]:
          - text: World seed
          - textbox "World seed" [ref=e57]:
            - /placeholder: Random for each new campaign
        - paragraph [ref=e58]: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
        - generic [ref=e59]:
          - text: World size
          - combobox "World size" [ref=e60]:
            - option "Tiny · 1,536 hexes · 4 realms"
            - option "Small · 19,360 hexes · 8 realms"
            - option "Standard · 31,360 hexes · 12 realms" [selected]
            - option "Large · 51,840 hexes · 16 realms"
            - option "Huge · 77,440 hexes · 20 realms"
        - generic [ref=e61]:
          - text: Faction count
          - spinbutton "Faction count" [ref=e62]: "12"
        - generic [ref=e63]:
          - text: City-states
          - spinbutton "City-states" [ref=e64]: "8"
        - paragraph [ref=e65]: "Independent single-city powers that settle the land between realms and can be conquered like any neighbour. Recommended here: 8. They borrow a culture's art under their own banner colour."
        - paragraph [ref=e66]: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
        - generic [ref=e67]:
          - text: Map type
          - combobox "Map type" [ref=e68]:
            - option "Continents" [selected]
            - option "Pangaea"
            - option "Fractal"
            - option "Islands"
            - option "Archipelago"
            - option "Earth-like"
            - option "Inland Sea"
        - paragraph [ref=e69]: Two or three large continents separated by open ocean, with offshore islands.
        - generic [ref=e70]:
          - text: Campaign pace
          - combobox "Campaign pace" [ref=e71]:
            - option "Short · test/skirmish"
            - option "Standard · about 200 turns" [selected]
            - option "Long · about 300 turns"
            - option "Epic · about 350–400 turns"
        - paragraph [ref=e72]: A full campaign aiming for about two hundred turns, with a twenty-turn window to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
        - generic [ref=e73]:
          - text: Campaign mode
          - combobox "Campaign mode" [ref=e74]:
            - option "Lead a realm" [selected]
            - option "AI watch"
        - paragraph [ref=e75]: The same seed, size, map type and faction count create the same world within a generator version. Larger maps need more realms to create nearby rivals; terrain can still separate them.
        - button "Begin campaign" [ref=e76] [cursor=pointer]:
          - text: Begin campaign
          - generic [aria-hidden] [ref=e77]: →
      - generic [ref=e78]:
        - button "Load campaign" [ref=e79] [cursor=pointer]
        - button "Restore autosave" [ref=e80] [cursor=pointer]
        - button "Import campaign" [ref=e81] [cursor=pointer]
    - region [ref=e82]:
      - heading "Introductory cultures" [level=3] [ref=e83]
      - paragraph [ref=e84]: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
      - generic [ref=e85]:
        - article [ref=e86]:
          - img "Ashen Compact crest · approved faction artwork" [ref=e87]
          - generic [ref=e88]:
            - heading "Ashen Compact" [level=4] [ref=e89]
            - paragraph [ref=e90]: Keep the hearth. Keep the oath.
        - article [ref=e91]:
          - img "Reedbound Council crest · approved faction artwork" [ref=e92]
          - generic [ref=e93]:
            - heading "Reedbound Council" [level=4] [ref=e94]
            - paragraph [ref=e95]: No river belongs to one shore.
        - article [ref=e96]:
          - img "Cinder March crest · approved faction artwork" [ref=e97]
          - generic [ref=e98]:
            - heading "Cinder March" [level=4] [ref=e99]
            - paragraph [ref=e100]: We hold what the fire spared.
        - article [ref=e101]:
          - img "Glass Tide crest · approved faction artwork" [ref=e102]
          - generic [ref=e103]:
            - heading "Glass Tide" [level=4] [ref=e104]
            - paragraph [ref=e105]: Every horizon is a promise.
        - article [ref=e106]:
          - img "Iron Covenant crest · approved faction artwork" [ref=e107]
          - generic [ref=e108]:
            - heading "Iron Covenant" [level=4] [ref=e109]
            - paragraph [ref=e110]: The hold endures. The valley is owed.
        - article [ref=e111]:
          - img "Sepulchral Synod crest · approved faction artwork" [ref=e112]
          - generic [ref=e113]:
            - heading "Sepulchral Synod" [level=4] [ref=e114]
            - paragraph [ref=e115]: No measure ends at the grave.
        - article [ref=e116]:
          - img "Mire Courts crest · approved faction artwork" [ref=e117]
          - generic [ref=e118]:
            - heading "Mire Courts" [level=4] [ref=e119]
            - paragraph [ref=e120]: The season returns. The court remembers.
        - article [ref=e121]:
          - img "Saltwind Remnant crest · approved faction artwork" [ref=e122]
          - generic [ref=e123]:
            - heading "Saltwind Remnant" [level=4] [ref=e124]
            - paragraph [ref=e125]: A keel is pledged only once.
        - article [ref=e126]:
          - img "Wardhall Remnant crest · approved faction artwork" [ref=e127]
          - generic [ref=e128]:
            - heading "Wardhall Remnant" [level=4] [ref=e129]
            - paragraph [ref=e130]: Let the work stand witness.
        - article [ref=e131]:
          - img "Rimehorn Clans crest · approved faction artwork" [ref=e132]
          - generic [ref=e133]:
            - heading "Rimehorn Clans" [level=4] [ref=e134]
            - paragraph [ref=e135]: Share the shelter. Answer the horn.
        - article [ref=e136]:
          - img "Sable Steppe crest · approved faction artwork" [ref=e137]
          - generic [ref=e138]:
            - heading "Sable Steppe" [level=4] [ref=e139]
            - paragraph [ref=e140]: The road moves with the camp.
        - article [ref=e141]:
          - img "Morrow Spore crest · approved faction artwork" [ref=e142]
          - generic [ref=e143]:
            - heading "Morrow Spore" [level=4] [ref=e144]
            - paragraph [ref=e145]: What falls shall feed what follows.
        - article [ref=e146]:
          - img "Cistern Assembly crest · approved faction artwork" [ref=e147]
          - generic [ref=e148]:
            - heading "Cistern Assembly" [level=4] [ref=e149]
            - paragraph [ref=e150]: Read the measure. Share the draw.
        - article [ref=e151]:
          - img "Unsealed Companies crest · approved faction artwork" [ref=e152]
          - generic [ref=e153]:
            - heading "Unsealed Companies" [level=4] [ref=e154]
            - paragraph [ref=e155]: The living make their own terms.
        - article [ref=e156]:
          - img "Lantern Hospices crest · approved faction artwork" [ref=e157]
          - generic [ref=e158]:
            - heading "Lantern Hospices" [level=4] [ref=e159]
            - paragraph [ref=e160]: Keep a place beside the lamp.
        - article [ref=e161]:
          - img "Cairnwing Concord crest · approved faction artwork" [ref=e162]
          - generic [ref=e163]:
            - heading "Cairnwing Concord" [level=4] [ref=e164]
            - paragraph [ref=e165]: No ledge stands without the lift.
        - article [ref=e166]:
          - img "Red Sluice Directorate crest · approved faction artwork" [ref=e167]
          - generic [ref=e168]:
            - heading "Red Sluice Directorate" [level=4] [ref=e169]
            - paragraph [ref=e170]: Count the harvest. Answer the banks.
        - article [ref=e171]:
          - img "Velvet Meridian crest · approved faction artwork" [ref=e172]
          - generic [ref=e173]:
            - heading "Velvet Meridian" [level=4] [ref=e174]
            - paragraph [ref=e175]: A measure is not the final word.
        - article [ref=e176]:
          - img "Brine Choir crest · approved faction artwork" [ref=e177]
          - generic [ref=e178]:
            - heading "Brine Choir" [level=4] [ref=e179]
            - paragraph [ref=e180]: Let every shore be heard.
        - article [ref=e181]:
          - img "Emberwake Convocation crest · approved faction artwork" [ref=e182]
          - generic [ref=e183]:
            - heading "Emberwake Convocation" [level=4] [ref=e184]
            - paragraph [ref=e185]: Keep the seed. Account for the fire.
        - article [ref=e186]:
          - img "Underhush Exchange crest · approved faction artwork" [ref=e187]
          - generic [ref=e188]:
            - heading "Underhush Exchange" [level=4] [ref=e189]
            - paragraph [ref=e190]: Leave room for those who dwell.
        - article [ref=e191]:
          - img "Vesper Court crest · approved faction artwork" [ref=e192]
          - generic [ref=e193]:
            - heading "Vesper Court" [level=4] [ref=e194]
            - paragraph [ref=e195]: Hospitality must have an ending.
        - article [ref=e196]:
          - img "Manytrack Moot crest · approved faction artwork" [ref=e197]
          - generic [ref=e198]:
            - heading "Manytrack Moot" [level=4] [ref=e199]
            - paragraph [ref=e200]: Unlike tracks may share a road.
        - article [ref=e201]:
          - img "Margin Observance crest · approved faction artwork" [ref=e202]
          - generic [ref=e203]:
            - heading "Margin Observance" [level=4] [ref=e204]
            - paragraph [ref=e205]: Keep the gap beside the record.
  - contentinfo [ref=e206]:
    - status [ref=e207]:
      - generic [aria-hidden] [ref=e208]: ◆
      - text: A world of broken oaths awaits a new beginning.
```

# Test source

```ts
  1  | import { createHash } from 'node:crypto';
  2  | import { readFile, writeFile } from 'node:fs/promises';
  3  | import { expect, test, type Response } from '@playwright/test';
  4  | import type { RuntimeCatalog } from '@theandril/art-pipeline/runtime';
  5  | import { closeManagement, openRegistry } from '../gameplay/ui-navigation';
  6  | 
  7  | test('built game loads verified map art, UI materials and its real worker inside the configured deployment base', async ({ page, baseURL }, info) => {
  8  |   expect(baseURL).toBeTruthy();
  9  |   const mount = new URL('./', baseURL);
  10 |   const localUrl = (path: string) => new URL(path.replace(/^\//, ''), mount).href;
  11 |   const requests: { url: string; type: string }[] = [];
  12 |   const responses = new Map<string, Response>();
  13 |   const workers: string[] = [];
  14 |   const errors: string[] = [];
  15 |   page.on('request', request => requests.push({ url: request.url(), type: request.resourceType() }));
  16 |   page.on('response', response => responses.set(response.url(), response));
  17 |   page.on('worker', worker => workers.push(worker.url()));
  18 |   page.on('pageerror', error => errors.push(error.message));
  19 | 
  20 |   const approvedBytes = await readFile(new URL('../../assets/art/runtime/catalog.json', import.meta.url));
  21 |   const approved = JSON.parse(approvedBytes.toString('utf8')) as RuntimeCatalog;
  22 |   const foundation = approved.atlases.find(atlas => atlas.id === 'foundation')!;
  23 |   expect(foundation).toBeDefined();
  24 |   await page.goto('./');
  25 |   await expect(page.getByRole('heading', { name: 'Establish your campaign', exact: true })).toBeVisible();
  26 |   expect(new URL(page.url()).pathname).toBe(mount.pathname);
  27 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  28 |   await expect(page.getByRole('button', { name: 'Art Lab', exact: true })).toHaveCount(0);
> 29 |   await expect(page.locator('.setup .faction-card .faction-art')).toHaveAttribute('data-art-state', 'ready');
     |                                                                   ^ Error: expect(locator).toHaveAttribute(expected) failed
  30 | 
  31 |   // These are computed, actually used CSS backgrounds, not source-code strings
  32 |   // or extra fetches that could hide a broken stylesheet base rewrite.
  33 |   const wood = await page.locator('.setup').evaluate(element => getComputedStyle(element).backgroundImage);
  34 |   const parchment = await page.locator('.setup .faction-card').evaluate(element => getComputedStyle(element).backgroundImage);
  35 |   expect(wood).toContain(localUrl('/ui/hearth-card/wood.webp'));
  36 |   expect(parchment).toContain(localUrl('/ui/hearth-card/parchment.webp'));
  37 |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  38 |   await page.getByLabel('Faction count', { exact: true }).fill('2');
  39 |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  40 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 1');
  41 |   await expect(page.getByTestId('map-container').locator('canvas')).toBeVisible();
  42 |   await expect(page.getByTestId('art-runtime-status')).toHaveText('Art: approved pixel pack');
  43 | 
  44 |   const registry = await openRegistry(page, 'armies');
  45 |   const corner = await registry.locator(':scope > .campaign-window-header').evaluate(element => getComputedStyle(element).backgroundImage);
  46 |   expect(corner).toContain(localUrl('/ui/hearth-card/ornament.corner-idle.webp'));
  47 |   await closeManagement(page);
  48 | 
  49 |   const expectedDownloads = ['/art/catalog.json', foundation.jsonUrl, foundation.imageUrl,
  50 |     '/ui/hearth-card/wood.webp', '/ui/hearth-card/parchment.webp', '/ui/hearth-card/ornament.corner-idle.webp'];
  51 |   for (const path of expectedDownloads) {
  52 |     const url = localUrl(path);
  53 |     await expect.poll(() => responses.has(url), { message: `Actual browser request for ${url}` }).toBe(true);
  54 |     const response = responses.get(url)!;
  55 |     expect(response.ok(), `Successful asset download: ${url}`).toBe(true);
  56 |     const bytes = await response.body();
  57 |     expect(bytes.byteLength).toBeGreaterThan(0);
  58 |     if (path === '/art/catalog.json') expect(bytes.equals(approvedBytes)).toBe(true);
  59 |     if (path === foundation.imageUrl) expect(createHash('sha256').update(bytes).digest('hex')).toBe(foundation.sha256);
  60 |     if (path.startsWith('/ui/')) {
  61 |       const original = await readFile(new URL(`../../apps/web/public${path}`, import.meta.url));
  62 |       expect(bytes.equals(original), `Unchanged reviewed UI bytes: ${path}`).toBe(true);
  63 |     }
  64 |   }
  65 | 
  66 |   const scripts = await page.locator('script[type="module"][src]').evaluateAll(elements => elements.map(element => (element as HTMLScriptElement).src));
  67 |   const stylesheets = await page.locator('link[rel="stylesheet"]').evaluateAll(elements => elements.map(element => (element as HTMLLinkElement).href));
  68 |   expect(scripts.length).toBeGreaterThan(0);
  69 |   expect(stylesheets.length).toBeGreaterThan(0);
  70 |   expect(workers.some(url => /\/assets\/simulation\.worker-[^/]+\.js$/.test(new URL(url).pathname))).toBe(true);
  71 |   for (const url of [...scripts, ...stylesheets, ...workers]) {
  72 |     expect(new URL(url).origin).toBe(mount.origin);
  73 |     expect(new URL(url).pathname.startsWith(mount.pathname), `Bundled URL stays under ${mount.pathname}: ${url}`).toBe(true);
  74 |   }
  75 |   // Ignore browser-owned requests such as favicon.ico, but include every game
  76 |   // public asset plus all scripts/styles/fonts, even an incorrectly rooted one.
  77 |   const runtimeRequests = requests.filter(request => {
  78 |     const url = new URL(request.url);
  79 |     return url.origin === mount.origin && (/\/(?:art|ui|assets)\//.test(url.pathname) || ['script', 'stylesheet', 'font'].includes(request.type));
  80 |   });
  81 |   expect(runtimeRequests.length).toBeGreaterThan(0);
  82 |   expect(runtimeRequests.filter(request => !new URL(request.url).pathname.startsWith(mount.pathname))).toEqual([]);
  83 |   expect(runtimeRequests.some(request => /\/art\/lab-catalog\.json$/.test(new URL(request.url).pathname))).toBe(false);
  84 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  85 |   expect(errors).toEqual([]);
  86 |   const evidence = { base: mount.href, approvedAssets: approved.assets.length, approvedFrames: approved.assets.reduce((sum, asset) => sum + asset.frames.length, 0), foundationSha256: foundation.sha256, scripts, stylesheets, workers, css: { wood, parchment, corner }, runtimeRequests };
  87 |   const evidencePath = info.outputPath('deployment-assets.json');
  88 |   await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  89 |   await info.attach('deployment-assets', { path: evidencePath, contentType: 'application/json' });
  90 |   await page.screenshot({ path: info.outputPath('deployment-new-campaign.png') });
  91 | });
  92 | 
```