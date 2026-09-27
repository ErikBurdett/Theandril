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
      - generic [ref=e29]:
        - generic [aria-hidden] [ref=e30]:
          - generic [aria-hidden] [ref=e31]: ◇
          - generic [aria-hidden] [ref=e32]: Loading
        - generic [ref=e33]:
          - heading "Ashen Compact" [level=3] [ref=e34]
          - paragraph [ref=e35]: Your chosen player seat
      - generic [ref=e36]:
        - region "Player culture" [ref=e37]:
          - generic [ref=e38]:
            - text: Player faction
            - combobox "Player faction" [ref=e39]:
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
          - paragraph [ref=e40]: Keep the hearth. Keep the oath.
          - generic [ref=e41]:
            - paragraph [ref=e42]: Public hearth councils rebuild reliable workshops while frontier households contest their share of the common grain.
            - paragraph [ref=e43]:
              - strong [ref=e44]: Worked-land strengths & drawbacks
            - list "Biome affinities" [ref=e45]:
              - listitem [ref=e46]:
                - strong [ref=e47]: Temperate grassland
                - text: ": +1 food per worked tile"
              - listitem [ref=e48]:
                - strong [ref=e49]: Temperate forest
                - text: ": +1 industry per worked tile"
              - listitem [ref=e50]:
                - strong [ref=e51]: Tundra
                - text: ": −1 food per worked tile"
              - listitem [ref=e52]:
                - strong [ref=e53]: Desert
                - text: ": −1 food per worked tile"
            - paragraph [ref=e54]: Unlisted biomes are neutral. These contributions modify worked tiles, not movement or combat.
            - paragraph [ref=e55]: "Cultivation traditions: Temperate grassland, Temperate forest. Cultivation is paid work, not free conversion."
            - group [ref=e56]:
              - generic "Recruitment tendencies" [ref=e57] [cursor=pointer]
        - generic [ref=e58]:
          - text: World seed
          - textbox "World seed" [ref=e59]:
            - /placeholder: Random for each new campaign
        - paragraph [ref=e60]: Leave blank for a fresh random world. Enter a seed to revisit a world; its seed is shown above the map.
        - generic [ref=e61]:
          - text: World size
          - combobox "World size" [ref=e62]:
            - option "Tiny · 1,536 hexes · 4 realms"
            - option "Small · 19,360 hexes · 8 realms"
            - option "Standard · 31,360 hexes · 12 realms" [selected]
            - option "Large · 51,840 hexes · 16 realms"
            - option "Huge · 77,440 hexes · 20 realms"
        - generic [ref=e63]:
          - text: Faction count
          - spinbutton "Faction count" [ref=e64]: "12"
        - generic [ref=e65]:
          - text: City-states
          - spinbutton "City-states" [ref=e66]: "8"
        - paragraph [ref=e67]: "Independent single-city powers that settle the land between realms and can be conquered like any neighbour. Recommended here: 8. They borrow a culture's art under their own banner colour."
        - paragraph [ref=e68]: "Recommended for this size: 12 realms. Changing world size resets this recommendation; you can override it. 24 introductory faction templates are authored. Additional seats are generated variants, not additional authored nations. Extreme crowding is not balanced."
        - generic [ref=e69]:
          - text: Map type
          - combobox "Map type" [ref=e70]:
            - option "Continents" [selected]
            - option "Pangaea"
            - option "Fractal"
            - option "Islands"
            - option "Archipelago"
            - option "Earth-like"
            - option "Inland Sea"
        - paragraph [ref=e71]: Two or three large continents separated by open ocean, with offshore islands.
        - generic [ref=e72]:
          - text: Campaign pace
          - combobox "Campaign pace" [ref=e73]:
            - option "Short · test/skirmish"
            - option "Standard · about 200 turns" [selected]
            - option "Long · about 300 turns"
            - option "Epic · about 350–400 turns"
        - paragraph [ref=e74]: A full campaign aiming for about two hundred turns, with a twenty-turn window to oppose public projects. Actual length depends on play. Pace changes economic costs and the public response window, not AI strength. Campaign length varies with play.
        - generic [ref=e75]:
          - text: Campaign mode
          - combobox "Campaign mode" [ref=e76]:
            - option "Lead a realm" [selected]
            - option "AI watch"
        - paragraph [ref=e77]: The same seed, size, map type and faction count create the same world within a generator version. Larger maps need more realms to create nearby rivals; terrain can still separate them.
        - button "Begin campaign" [ref=e78] [cursor=pointer]:
          - text: Begin campaign
          - generic [aria-hidden] [ref=e79]: →
      - generic [ref=e80]:
        - button "Load campaign" [ref=e81] [cursor=pointer]
        - button "Restore autosave" [ref=e82] [cursor=pointer]
        - button "Import campaign" [ref=e83] [cursor=pointer]
    - region [ref=e84]:
      - heading "Introductory cultures" [level=3] [ref=e85]
      - paragraph [ref=e86]: Public culture reference, not a player-seat selector. Generated realms reuse these traditions; their locations and forces must still be discovered.
      - generic [ref=e87]:
        - article [ref=e88]:
          - img "Ashen Compact crest · loading approved artwork" [ref=e89]:
            - generic [aria-hidden] [ref=e90]: ◇
            - generic [aria-hidden] [ref=e91]: Loading
          - generic [ref=e92]:
            - heading "Ashen Compact" [level=4] [ref=e93]
            - paragraph [ref=e94]: Keep the hearth. Keep the oath.
        - article [ref=e95]:
          - img "Reedbound Council crest · loading approved artwork" [ref=e96]:
            - generic [aria-hidden] [ref=e97]: ◇
            - generic [aria-hidden] [ref=e98]: Loading
          - generic [ref=e99]:
            - heading "Reedbound Council" [level=4] [ref=e100]
            - paragraph [ref=e101]: No river belongs to one shore.
        - article [ref=e102]:
          - img "Cinder March crest · loading approved artwork" [ref=e103]:
            - generic [aria-hidden] [ref=e104]: ◇
            - generic [aria-hidden] [ref=e105]: Loading
          - generic [ref=e106]:
            - heading "Cinder March" [level=4] [ref=e107]
            - paragraph [ref=e108]: We hold what the fire spared.
        - article [ref=e109]:
          - img "Glass Tide crest · loading approved artwork" [ref=e110]:
            - generic [aria-hidden] [ref=e111]: ◇
            - generic [aria-hidden] [ref=e112]: Loading
          - generic [ref=e113]:
            - heading "Glass Tide" [level=4] [ref=e114]
            - paragraph [ref=e115]: Every horizon is a promise.
        - article [ref=e116]:
          - img "Iron Covenant crest · loading approved artwork" [ref=e117]:
            - generic [aria-hidden] [ref=e118]: ◇
            - generic [aria-hidden] [ref=e119]: Loading
          - generic [ref=e120]:
            - heading "Iron Covenant" [level=4] [ref=e121]
            - paragraph [ref=e122]: The hold endures. The valley is owed.
        - article [ref=e123]:
          - img "Sepulchral Synod crest · loading approved artwork" [ref=e124]:
            - generic [aria-hidden] [ref=e125]: ◇
            - generic [aria-hidden] [ref=e126]: Loading
          - generic [ref=e127]:
            - heading "Sepulchral Synod" [level=4] [ref=e128]
            - paragraph [ref=e129]: No measure ends at the grave.
        - article [ref=e130]:
          - img "Mire Courts crest · loading approved artwork" [ref=e131]:
            - generic [aria-hidden] [ref=e132]: ◇
            - generic [aria-hidden] [ref=e133]: Loading
          - generic [ref=e134]:
            - heading "Mire Courts" [level=4] [ref=e135]
            - paragraph [ref=e136]: The season returns. The court remembers.
        - article [ref=e137]:
          - img "Saltwind Remnant crest · loading approved artwork" [ref=e138]:
            - generic [aria-hidden] [ref=e139]: ◇
            - generic [aria-hidden] [ref=e140]: Loading
          - generic [ref=e141]:
            - heading "Saltwind Remnant" [level=4] [ref=e142]
            - paragraph [ref=e143]: A keel is pledged only once.
        - article [ref=e144]:
          - img "Wardhall Remnant crest · loading approved artwork" [ref=e145]:
            - generic [aria-hidden] [ref=e146]: ◇
            - generic [aria-hidden] [ref=e147]: Loading
          - generic [ref=e148]:
            - heading "Wardhall Remnant" [level=4] [ref=e149]
            - paragraph [ref=e150]: Let the work stand witness.
        - article [ref=e151]:
          - img "Rimehorn Clans crest · loading approved artwork" [ref=e152]:
            - generic [aria-hidden] [ref=e153]: ◇
            - generic [aria-hidden] [ref=e154]: Loading
          - generic [ref=e155]:
            - heading "Rimehorn Clans" [level=4] [ref=e156]
            - paragraph [ref=e157]: Share the shelter. Answer the horn.
        - article [ref=e158]:
          - img "Sable Steppe crest · loading approved artwork" [ref=e159]:
            - generic [aria-hidden] [ref=e160]: ◇
            - generic [aria-hidden] [ref=e161]: Loading
          - generic [ref=e162]:
            - heading "Sable Steppe" [level=4] [ref=e163]
            - paragraph [ref=e164]: The road moves with the camp.
        - article [ref=e165]:
          - img "Morrow Spore crest · loading approved artwork" [ref=e166]:
            - generic [aria-hidden] [ref=e167]: ◇
            - generic [aria-hidden] [ref=e168]: Loading
          - generic [ref=e169]:
            - heading "Morrow Spore" [level=4] [ref=e170]
            - paragraph [ref=e171]: What falls shall feed what follows.
        - article [ref=e172]:
          - img "Cistern Assembly crest · loading approved artwork" [ref=e173]:
            - generic [aria-hidden] [ref=e174]: ◇
            - generic [aria-hidden] [ref=e175]: Loading
          - generic [ref=e176]:
            - heading "Cistern Assembly" [level=4] [ref=e177]
            - paragraph [ref=e178]: Read the measure. Share the draw.
        - article [ref=e179]:
          - img "Unsealed Companies crest · loading approved artwork" [ref=e180]:
            - generic [aria-hidden] [ref=e181]: ◇
            - generic [aria-hidden] [ref=e182]: Loading
          - generic [ref=e183]:
            - heading "Unsealed Companies" [level=4] [ref=e184]
            - paragraph [ref=e185]: The living make their own terms.
        - article [ref=e186]:
          - img "Lantern Hospices crest · loading approved artwork" [ref=e187]:
            - generic [aria-hidden] [ref=e188]: ◇
            - generic [aria-hidden] [ref=e189]: Loading
          - generic [ref=e190]:
            - heading "Lantern Hospices" [level=4] [ref=e191]
            - paragraph [ref=e192]: Keep a place beside the lamp.
        - article [ref=e193]:
          - img "Cairnwing Concord crest · loading approved artwork" [ref=e194]:
            - generic [aria-hidden] [ref=e195]: ◇
            - generic [aria-hidden] [ref=e196]: Loading
          - generic [ref=e197]:
            - heading "Cairnwing Concord" [level=4] [ref=e198]
            - paragraph [ref=e199]: No ledge stands without the lift.
        - article [ref=e200]:
          - img "Red Sluice Directorate crest · loading approved artwork" [ref=e201]:
            - generic [aria-hidden] [ref=e202]: ◇
            - generic [aria-hidden] [ref=e203]: Loading
          - generic [ref=e204]:
            - heading "Red Sluice Directorate" [level=4] [ref=e205]
            - paragraph [ref=e206]: Count the harvest. Answer the banks.
        - article [ref=e207]:
          - img "Velvet Meridian crest · loading approved artwork" [ref=e208]:
            - generic [aria-hidden] [ref=e209]: ◇
            - generic [aria-hidden] [ref=e210]: Loading
          - generic [ref=e211]:
            - heading "Velvet Meridian" [level=4] [ref=e212]
            - paragraph [ref=e213]: A measure is not the final word.
        - article [ref=e214]:
          - img "Brine Choir crest · loading approved artwork" [ref=e215]:
            - generic [aria-hidden] [ref=e216]: ◇
            - generic [aria-hidden] [ref=e217]: Loading
          - generic [ref=e218]:
            - heading "Brine Choir" [level=4] [ref=e219]
            - paragraph [ref=e220]: Let every shore be heard.
        - article [ref=e221]:
          - img "Emberwake Convocation crest · loading approved artwork" [ref=e222]:
            - generic [aria-hidden] [ref=e223]: ◇
            - generic [aria-hidden] [ref=e224]: Loading
          - generic [ref=e225]:
            - heading "Emberwake Convocation" [level=4] [ref=e226]
            - paragraph [ref=e227]: Keep the seed. Account for the fire.
        - article [ref=e228]:
          - img "Underhush Exchange crest · loading approved artwork" [ref=e229]:
            - generic [aria-hidden] [ref=e230]: ◇
            - generic [aria-hidden] [ref=e231]: Loading
          - generic [ref=e232]:
            - heading "Underhush Exchange" [level=4] [ref=e233]
            - paragraph [ref=e234]: Leave room for those who dwell.
        - article [ref=e235]:
          - img "Vesper Court crest · loading approved artwork" [ref=e236]:
            - generic [aria-hidden] [ref=e237]: ◇
            - generic [aria-hidden] [ref=e238]: Loading
          - generic [ref=e239]:
            - heading "Vesper Court" [level=4] [ref=e240]
            - paragraph [ref=e241]: Hospitality must have an ending.
        - article [ref=e242]:
          - img "Manytrack Moot crest · loading approved artwork" [ref=e243]:
            - generic [aria-hidden] [ref=e244]: ◇
            - generic [aria-hidden] [ref=e245]: Loading
          - generic [ref=e246]:
            - heading "Manytrack Moot" [level=4] [ref=e247]
            - paragraph [ref=e248]: Unlike tracks may share a road.
        - article [ref=e249]:
          - img "Margin Observance crest · loading approved artwork" [ref=e250]:
            - generic [aria-hidden] [ref=e251]: ◇
            - generic [aria-hidden] [ref=e252]: Loading
          - generic [ref=e253]:
            - heading "Margin Observance" [level=4] [ref=e254]
            - paragraph [ref=e255]: Keep the gap beside the record.
  - contentinfo [ref=e256]:
    - status [ref=e257]:
      - generic [aria-hidden] [ref=e258]: ◆
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