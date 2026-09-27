# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gameplay/roadmap.spec.ts >> the roadmap is discoverable from home and shows bounded completion with every release gate open
- Location: tests/gameplay/roadmap.spec.ts:4:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#roadmap-empire-management')
Expected substring: "saved reusable army order templates"
Received string:    "◐ In progressGate IMake large empires practical to governSearchable registries issue existing postings, charters and ordered production to selected groups. Named campaign groups recall whom to select; separate personal browser libraries recall charter policies or production lists. Apply remains explicit, and paid prefixes stay visible after refusals. ACT-32 and wider M3 coordination remain in progress.Next: Extend charters, postings and production sequences with broader governor decisions, bounded theaters, patrol/escort roles, reusable army order templates and coordinated orders, keeping inspectable blockers and clear overrides.Evidence & acceptance for Make large empires practical to governDelivered in this checkpoint✓Map-first management and paged source queries let players inspect entities without duplicating the entire simulation into React.✓Standing hearth charters fill an empty queue within a stated coin ceiling and treasury reserve; direct player work takes precedence and stalled policies explain why.✓Army postings and settlement muster points retain ordinary routes, arrival behavior and blocked reasons. Working policies leave the next-action list; stalled ones remain actionable.✓Selection survives search and 25-row pages. Up to 128 land armies ashore receive existing Hold/Join postings at their current positions or one owned hearth; clearing skips armies without postings. One final worker response reports accepted and refused commands, with refused armies retained for review.✓The authored 100-owned-army, forty-hearth Legendary browser journey verifies individual override, group clearing and exact manual-save restoration. Separate capacity and damaged-response scenarios cover partial refusal and recovery; keyboard and 390px controls pass.✓Up to 128 owned hearths receive an existing Works/Wealth/Learning/Muster charter and per-work ceiling together. Army and hearth selections stay independent across tabs. Assignment and revocation preserve queues and treasury; the form explains the shared forty-coin reserve and ongoing Muster upkeep.✓The forty-hearth browser journey preserves queued work, overrides one policy and restores the exact saved state. A generated-campaign production journey founds a hearth, grants Wealth, saves, revokes at 390px and reloads without development hooks.✓Up to 24 named charter focus/ceiling templates persist in this browser across sessions and campaigns. Recall fills the existing form; Apply charters remains explicit. Template edits leave active charters and the canonical hash unchanged, and campaign exports exclude the library. Keyboard/narrow controls and denied, malformed and restored-access storage journeys pass.✓Up to 24 named campaign groups retain army/hearth selections with 128 members each through save, replay and campaign export/import. Recall changes only the active tab’s checks, skips embarked armies and gives no orders. Permanent losses prune memberships, empty groups remain, and updating warns before replacing all members. Keyboard/narrow controls, generated production restoration and authored forty-hearth/100-army workflows pass.✓Apply an ordered list of one to five existing construction/recruitment items to up to 128 owned hearths. Ordinary canonical commands append after existing queues and spend current coin; a refusal stops that hearth, preserves its paid prefix and leaves it selected for correction. One bounded request publishes one final state for at most 640 attempts.✓Up to 24 named production templates hold ordered lists in a separate personal browser library. Choosing an entry only inspects it; Recall fills the editor and Apply remains the paid action. Template actions never enter campaign saves or exports, and pending or failed preference storage leaves direct editing and production usable.Remaining acceptance○Extend charters, postings and production sequences with broader governor decisions, bounded theaters, patrol/escort roles, reusable army order templates and coordinated orders, keeping inspectable blockers and clear overrides.○Complete broader governor decisions, onboarding, accessible keyboard/tooltip workflows, durable settings and critical canvas alternatives for all major systems; group assignment, saved selections and personal charter/production templates do not complete them.○Prove combined delegation and override in representative mature campaigns with 100+ armies and many settlements; the authored group-order fixture is a bounded checkpoint. Profile sustained query transfers and virtualize large registries where needed.Source & verificationProduction sequences verification1,975 tests across 247 files before publication; Thirty affected Chromium gameplay journeys and one separate built-production sequence journey pass; these overlapping scopes are reported separately. Ordinary paid queues, browser-local templates, partial refusal/recovery and bounded worker measurements.Saved groups verification1,941 tests across 243 files, 20 affected Chromium journeys and one separate built-production group journey; saved membership, exact history, bounded metadata and sixty-four-realm save repair.Charter templates verification1,902 tests across 237 files, 16 affected Chromium journeys and one separate built-production template journey; browser-local policies, explicit application and storage recovery.Group charters verification1,889 tests across 235 files, 12 affected Chromium journeys and one new built-production charter journey; authored scale, queues, partial refusal and saved recovery.Group postings verification1,876 headless tests, seven affected Chromium journeys and 27 production Pages checks at the implementation checkpoint; authored scale, partial refusal and recovery evidence.Implementation statusReviewed campaign foundations, earlier playable slices and known gaps at the pinned evidence snapshot. Historical test totals remain separate.Release acceptance criteriaThe full objective gate, including integration, AI, saving and verification requirements.Link to this item Make large empires practical to govern →"
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('#roadmap-empire-management') with timeout 5000ms
  - waiting for locator('#roadmap-empire-management')
    14 × locator resolved to <article tabindex="-1" class="roadmap-item" data-status="in-progress" id="roadmap-empire-management" aria-labelledby="title-empire-management">…</article>
       - unexpected value "◐ In progressGate IMake large empires practical to governSearchable registries issue existing postings, charters and ordered production to selected groups. Named campaign groups recall whom to select; separate personal browser libraries recall charter policies or production lists. Apply remains explicit, and paid prefixes stay visible after refusals. ACT-32 and wider M3 coordination remain in progress.Next: Extend charters, postings and production sequences with broader governor decisions, bounded theaters, patrol/escort roles, reusable army order templates and coordinated orders, keeping inspectable blockers and clear overrides.Evidence & acceptance for Make large empires practical to governDelivered in this checkpoint✓Map-first management and paged source queries let players inspect entities without duplicating the entire simulation into React.✓Standing hearth charters fill an empty queue within a stated coin ceiling and treasury reserve; direct player work takes precedence and stalled policies explain why.✓Army postings and settlement muster points retain ordinary routes, arrival behavior and blocked reasons. Working policies leave the next-action list; stalled ones remain actionable.✓Selection survives search and 25-row pages. Up to 128 land armies ashore receive existing Hold/Join postings at their current positions or one owned hearth; clearing skips armies without postings. One final worker response reports accepted and refused commands, with refused armies retained for review.✓The authored 100-owned-army, forty-hearth Legendary browser journey verifies individual override, group clearing and exact manual-save restoration. Separate capacity and damaged-response scenarios cover partial refusal and recovery; keyboard and 390px controls pass.✓Up to 128 owned hearths receive an existing Works/Wealth/Learning/Muster charter and per-work ceiling together. Army and hearth selections stay independent across tabs. Assignment and revocation preserve queues and treasury; the form explains the shared forty-coin reserve and ongoing Muster upkeep.✓The forty-hearth browser journey preserves queued work, overrides one policy and restores the exact saved state. A generated-campaign production journey founds a hearth, grants Wealth, saves, revokes at 390px and reloads without development hooks.✓Up to 24 named charter focus/ceiling templates persist in this browser across sessions and campaigns. Recall fills the existing form; Apply charters remains explicit. Template edits leave active charters and the canonical hash unchanged, and campaign exports exclude the library. Keyboard/narrow controls and denied, malformed and restored-access storage journeys pass.✓Up to 24 named campaign groups retain army/hearth selections with 128 members each through save, replay and campaign export/import. Recall changes only the active tab’s checks, skips embarked armies and gives no orders. Permanent losses prune memberships, empty groups remain, and updating warns before replacing all members. Keyboard/narrow controls, generated production restoration and authored forty-hearth/100-army workflows pass.✓Apply an ordered list of one to five existing construction/recruitment items to up to 128 owned hearths. Ordinary canonical commands append after existing queues and spend current coin; a refusal stops that hearth, preserves its paid prefix and leaves it selected for correction. One bounded request publishes one final state for at most 640 attempts.✓Up to 24 named production templates hold ordered lists in a separate personal browser library. Choosing an entry only inspects it; Recall fills the editor and Apply remains the paid action. Template actions never enter campaign saves or exports, and pending or failed preference storage leaves direct editing and production usable.Remaining acceptance○Extend charters, postings and production sequences with broader governor decisions, bounded theaters, patrol/escort roles, reusable army order templates and coordinated orders, keeping inspectable blockers and clear overrides.○Complete broader governor decisions, onboarding, accessible keyboard/tooltip workflows, durable settings and critical canvas alternatives for all major systems; group assignment, saved selections and personal charter/production templates do not complete them.○Prove combined delegation and override in representative mature campaigns with 100+ armies and many settlements; the authored group-order fixture is a bounded checkpoint. Profile sustained query transfers and virtualize large registries where needed.Source & verificationProduction sequences verification1,975 tests across 247 files before publication; Thirty affected Chromium gameplay journeys and one separate built-production sequence journey pass; these overlapping scopes are reported separately. Ordinary paid queues, browser-local templates, partial refusal/recovery and bounded worker measurements.Saved groups verification1,941 tests across 243 files, 20 affected Chromium journeys and one separate built-production group journey; saved membership, exact history, bounded metadata and sixty-four-realm save repair.Charter templates verification1,902 tests across 237 files, 16 affected Chromium journeys and one separate built-production template journey; browser-local policies, explicit application and storage recovery.Group charters verification1,889 tests across 235 files, 12 affected Chromium journeys and one new built-production charter journey; authored scale, queues, partial refusal and saved recovery.Group postings verification1,876 headless tests, seven affected Chromium journeys and 27 production Pages checks at the implementation checkpoint; authored scale, partial refusal and recovery evidence.Implementation statusReviewed campaign foundations, earlier playable slices and known gaps at the pinned evidence snapshot. Historical test totals remain separate.Release acceptance criteriaThe full objective gate, including integration, AI, saving and verification requirements.Link to this item Make large empires practical to govern →"

```

```yaml
- article "Make large empires practical to govern":
  - text: In progress
  - paragraph:
    - link "Gate I":
      - /url: "#gate-I"
  - heading "Make large empires practical to govern" [level=3]:
    - link "Make large empires practical to govern":
      - /url: /Theandril/updates/roadmap/?item=empire-management#roadmap-empire-management
  - paragraph: Searchable registries issue existing postings, charters and ordered production to selected groups. Named campaign groups recall whom to select; separate personal browser libraries recall charter policies or production lists. Apply remains explicit, and paid prefixes stay visible after refusals. ACT-32 and wider M3 coordination remain in progress.
  - paragraph:
    - strong: "Next:"
    - text: Extend charters, postings and production sequences with broader governor decisions, bounded theaters, patrol/escort roles, reusable army order templates and coordinated orders, keeping inspectable blockers and clear overrides.
  - group:
    - text: Evidence & acceptance for Make large empires practical to govern
    - heading "Delivered in this checkpoint" [level=4]
    - list:
      - listitem: Map-first management and paged source queries let players inspect entities without duplicating the entire simulation into React.
      - listitem: Standing hearth charters fill an empty queue within a stated coin ceiling and treasury reserve; direct player work takes precedence and stalled policies explain why.
      - listitem: Army postings and settlement muster points retain ordinary routes, arrival behavior and blocked reasons. Working policies leave the next-action list; stalled ones remain actionable.
      - listitem: Selection survives search and 25-row pages. Up to 128 land armies ashore receive existing Hold/Join postings at their current positions or one owned hearth; clearing skips armies without postings. One final worker response reports accepted and refused commands, with refused armies retained for review.
      - listitem: The authored 100-owned-army, forty-hearth Legendary browser journey verifies individual override, group clearing and exact manual-save restoration. Separate capacity and damaged-response scenarios cover partial refusal and recovery; keyboard and 390px controls pass.
      - listitem: Up to 128 owned hearths receive an existing Works/Wealth/Learning/Muster charter and per-work ceiling together. Army and hearth selections stay independent across tabs. Assignment and revocation preserve queues and treasury; the form explains the shared forty-coin reserve and ongoing Muster upkeep.
      - listitem: The forty-hearth browser journey preserves queued work, overrides one policy and restores the exact saved state. A generated-campaign production journey founds a hearth, grants Wealth, saves, revokes at 390px and reloads without development hooks.
      - listitem: Up to 24 named charter focus/ceiling templates persist in this browser across sessions and campaigns. Recall fills the existing form; Apply charters remains explicit. Template edits leave active charters and the canonical hash unchanged, and campaign exports exclude the library. Keyboard/narrow controls and denied, malformed and restored-access storage journeys pass.
      - listitem: Up to 24 named campaign groups retain army/hearth selections with 128 members each through save, replay and campaign export/import. Recall changes only the active tab’s checks, skips embarked armies and gives no orders. Permanent losses prune memberships, empty groups remain, and updating warns before replacing all members. Keyboard/narrow controls, generated production restoration and authored forty-hearth/100-army workflows pass.
      - listitem: Apply an ordered list of one to five existing construction/recruitment items to up to 128 owned hearths. Ordinary canonical commands append after existing queues and spend current coin; a refusal stops that hearth, preserves its paid prefix and leaves it selected for correction. One bounded request publishes one final state for at most 640 attempts.
      - listitem: Up to 24 named production templates hold ordered lists in a separate personal browser library. Choosing an entry only inspects it; Recall fills the editor and Apply remains the paid action. Template actions never enter campaign saves or exports, and pending or failed preference storage leaves direct editing and production usable.
    - heading "Remaining acceptance" [level=4]
    - list:
      - listitem: Extend charters, postings and production sequences with broader governor decisions, bounded theaters, patrol/escort roles, reusable army order templates and coordinated orders, keeping inspectable blockers and clear overrides.
      - listitem: Complete broader governor decisions, onboarding, accessible keyboard/tooltip workflows, durable settings and critical canvas alternatives for all major systems; group assignment, saved selections and personal charter/production templates do not complete them.
      - listitem: Prove combined delegation and override in representative mature campaigns with 100+ armies and many settlements; the authored group-order fixture is a bounded checkpoint. Profile sustained query transfers and virtualize large registries where needed.
    - heading "Source & verification" [level=4]
    - list:
      - listitem:
        - link "Production sequences verification":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-26-production-sequences/README.md
        - paragraph: 1,975 tests across 247 files before publication; Thirty affected Chromium gameplay journeys and one separate built-production sequence journey pass; these overlapping scopes are reported separately. Ordinary paid queues, browser-local templates, partial refusal/recovery and bounded worker measurements.
      - listitem:
        - link "Saved groups verification":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-25-selection-groups/README.md
        - paragraph: 1,941 tests across 243 files, 20 affected Chromium journeys and one separate built-production group journey; saved membership, exact history, bounded metadata and sixty-four-realm save repair.
      - listitem:
        - link "Charter templates verification":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-25-charter-templates/README.md
        - paragraph: 1,902 tests across 237 files, 16 affected Chromium journeys and one separate built-production template journey; browser-local policies, explicit application and storage recovery.
      - listitem:
        - link "Group charters verification":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-24-group-charters/README.md
        - paragraph: 1,889 tests across 235 files, 12 affected Chromium journeys and one new built-production charter journey; authored scale, queues, partial refusal and saved recovery.
      - listitem:
        - link "Group postings verification":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/development/2026-09-23-deploy-and-group-postings/README.md
        - paragraph: 1,876 headless tests, seven affected Chromium journeys and 27 production Pages checks at the implementation checkpoint; authored scale, partial refusal and recovery evidence.
      - listitem:
        - link "Implementation status":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/docs/IMPLEMENTATION_STATUS.md
        - paragraph: Reviewed campaign foundations, earlier playable slices and known gaps at the pinned evidence snapshot. Historical test totals remain separate.
      - listitem:
        - link "Release acceptance criteria":
          - /url: https://github.com/ErikBurdett/Theandril/blob/420219d278ae17f42a04871c6319ecf62a4af216/DEFINITION_OF_DONE.md
        - paragraph: The full objective gate, including integration, AI, saving and verification requirements.
    - link "Link to this item Make large empires practical to govern →":
      - /url: /Theandril/updates/roadmap/?item=empire-management#roadmap-empire-management
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { roadmapGates, roadmapItems } from '../../apps/web/src/updates/library';
  3   | 
  4   | test('the roadmap is discoverable from home and shows bounded completion with every release gate open', async ({ page }) => {
  5   |   const workers: string[] = [];
  6   |   const errors: string[] = [];
  7   |   page.on('worker', worker => workers.push(worker.url()));
  8   |   page.on('pageerror', error => errors.push(error.message));
  9   |   page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  10  |   await page.goto('updates/');
  11  |   await page.getByRole('link', { name: 'Explore the full roadmap' }).click();
  12  |   await expect(page.getByRole('heading', { level: 1, name: 'Theandril Roadmap' })).toBeVisible();
  13  |   await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Roadmap', exact: true })).toHaveAttribute('aria-current', 'page');
  14  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  15  |   await expect(page.locator('.roadmap-item[data-status="completed"]').first().locator('.roadmap-status')).toHaveText('✓ Completed');
  16  |   await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  17  |   await expect(page.locator('.roadmap-gates .roadmap-status-completed')).toHaveCount(0);
  18  |   await expect(page.locator('.roadmap-introduction')).toContainText('No overall 1.0 gate is signed off.');
  19  |   const empire = page.locator('#roadmap-empire-management');
  20  |   await empire.locator('summary').click();
  21  |   await expect(empire).toContainText('Up to 24 named campaign groups');
> 22  |   await expect(empire).toContainText('saved reusable army order templates');
      |                        ^ Error: expect(locator).toContainText(expected) failed
  23  |   await expect(empire.getByRole('link', { name: 'Saved groups verification', exact: true })).toHaveAttribute('href', 'https://github.com/ErikBurdett/Theandril/blob/0d26fa3c34ac89164637f515e95671420400a841/docs/development/2026-09-25-selection-groups/README.md');
  24  |   await expect(page.getByRole('link', { name: 'Hearth & Card roadmap' })).toHaveAttribute('href', 'https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/');
  25  |   expect(workers).toEqual([]);
  26  |   expect(errors).toEqual([]);
  27  | });
  28  | 
  29  | test('status and acceptance search survive refresh, reset cleanly and preserve the release check', async ({ page }) => {
  30  |   await page.goto('updates/roadmap/');
  31  |   const pending = page.getByRole('button', { name: 'Pending', exact: true });
  32  |   await pending.focus();
  33  |   await page.keyboard.press('Enter');
  34  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  35  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  36  |   await page.getByRole('searchbox', { name: 'Search roadmap' }).fill('authoritative');
  37  |   await expect(page.locator('.roadmap-item')).toHaveCount(1);
  38  |   await expect(page).toHaveURL(/q=authoritative&status=pending#roadmap-items$/);
  39  |   await page.reload();
  40  |   await expect(page.getByRole('searchbox', { name: 'Search roadmap' })).toHaveValue('authoritative');
  41  |   await expect(pending).toHaveAttribute('aria-pressed', 'true');
  42  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  43  |   await expect(page.getByRole('heading', { name: 'No roadmap items found' })).toBeVisible();
  44  |   await expect(page.locator('.roadmap-gates > div')).toHaveCount(roadmapGates.length);
  45  |   await page.getByRole('button', { name: 'Reset search & filters', exact: true }).click();
  46  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  47  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  48  | });
  49  | 
  50  | test('an item permalink opens its evidence, survives refresh and returns to the filtered record', async ({ page }) => {
  51  |   await page.goto('updates/roadmap/?status=pending');
  52  |   await page.getByRole('link', { name: 'Build authoritative online campaigns', exact: true }).click();
  53  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  54  |   const item = page.locator('#roadmap-online-campaigns');
  55  |   await expect(item).toBeFocused();
  56  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  57  |   await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  58  |   await expect(item.getByRole('link', { name: 'Implementation status', exact: true })).toHaveAttribute('href', /\/blob\/[a-f0-9]{40}\/docs\/IMPLEMENTATION_STATUS.md$/);
  59  |   await page.reload();
  60  |   await expect(item).toBeFocused();
  61  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  62  |   await page.goBack();
  63  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  64  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(entry => entry.status === 'pending').length);
  65  | });
  66  | 
  67  | test('same-document Back and Forward restore filters and linked-item evidence', async ({ page }) => {
  68  |   await page.goto('updates/roadmap/');
  69  |   await page.getByRole('link', { name: /Complete the playable systems/ }).click();
  70  |   await expect(page).toHaveURL(/#current-work$/);
  71  |   await page.getByRole('button', { name: 'Pending', exact: true }).click();
  72  |   await expect(page).toHaveURL(/\?status=pending#roadmap-items$/);
  73  |   await page.goBack();
  74  |   await expect(page.getByRole('button', { name: 'All items', exact: true })).toHaveAttribute('aria-pressed', 'true');
  75  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.length);
  76  |   await page.goForward();
  77  |   await expect(page.getByRole('button', { name: 'Pending', exact: true })).toHaveAttribute('aria-pressed', 'true');
  78  |   await expect(page.locator('.roadmap-item')).toHaveCount(roadmapItems.filter(item => item.status === 'pending').length);
  79  | 
  80  |   await page.goto('updates/roadmap/?item=online-campaigns#roadmap-online-campaigns');
  81  |   const item = page.locator('#roadmap-online-campaigns');
  82  |   await item.locator('summary').click();
  83  |   await expect(item.locator('details')).not.toHaveAttribute('open', '');
  84  |   await item.getByRole('link', { name: 'Gate M', exact: true }).click();
  85  |   await expect(page.locator('#gate-M')).toBeInViewport();
  86  |   await page.getByRole('button', { name: 'Completed', exact: true }).click();
  87  |   await expect(item).toHaveCount(0);
  88  |   await page.goBack();
  89  |   await expect(page).toHaveURL(/\?item=online-campaigns#roadmap-online-campaigns$/);
  90  |   await expect(item).toBeFocused();
  91  |   await expect(item.locator('details')).toHaveAttribute('open', '');
  92  |   await page.goForward();
  93  |   await expect(page.getByRole('button', { name: 'Completed', exact: true })).toHaveAttribute('aria-pressed', 'true');
  94  |   await expect(item).toHaveCount(0);
  95  | });
  96  | 
  97  | for (const dimensions of [{ width: 1440, height: 1000, scale: 100 }, { width: 390, height: 844, scale: 130 }]) {
  98  |   test(`roadmap keyboard and layout at ${dimensions.width}px / ${dimensions.scale}% text`, async ({ page }, testInfo) => {
  99  |     await page.setViewportSize({ width: dimensions.width, height: dimensions.height });
  100 |     await page.goto('updates/roadmap/');
  101 |     await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, dimensions.scale);
  102 |     await page.keyboard.press('Tab');
  103 |     await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  104 |     await page.keyboard.press('Enter');
  105 |     await expect(page.getByRole('main')).toBeFocused();
  106 |     await page.screenshot({ path: testInfo.outputPath('roadmap-top.png') });
  107 |     const item = page.locator('#roadmap-campaign-safety-review');
  108 |     const summary = item.locator('summary');
  109 |     await summary.focus();
  110 |     await page.keyboard.press('Enter');
  111 |     await expect(item.getByText('Remaining acceptance', { exact: true })).toBeVisible();
  112 |     await item.screenshot({ path: testInfo.outputPath('roadmap-open-item.png') });
  113 |     await page.keyboard.press('Space');
  114 |     await expect(item.locator('details')).not.toHaveAttribute('open', '');
  115 |     await expect(summary).toBeFocused();
  116 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  117 |     await page.getByRole('button', { name: 'Pending', exact: true }).click();
  118 |     await page.getByRole('link', { name: /Build the missing release systems/ }).click();
  119 |     await expect(page.locator('#missing-systems')).toBeInViewport();
  120 |     await page.screenshot({ path: testInfo.outputPath('roadmap-pending.png') });
  121 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  122 |   });
```