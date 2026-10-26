# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production/group-land-policies.spec.ts >> production land commissions share a finite purse across 30 hearths and preserve exact keyboard removal and restoration at 130%
- Location: tests/production/group-land-policies.spec.ts:26:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
          - strong [ref=e12]: 12 coin
        - generic [ref=e13]:
          - generic [ref=e14]: KNOWLEDGE
          - strong [ref=e15]: "31"
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
  - dialog [ref=e61]:
    - banner [ref=e62]:
      - generic [ref=e63]:
        - generic [ref=e64]: The realm's ledgers
        - heading "Realm registry" [level=2] [ref=e65]
        - paragraph [ref=e66]: Ashen Compact
      - button "Close Realm registry" [ref=e67] [cursor=pointer]: ×
    - generic [ref=e69]:
      - generic [ref=e70]:
        - img "Ashen Compact crest · approved faction artwork" [ref=e71]
        - generic [ref=e72]:
          - generic [ref=e73]: Your people
          - heading "Ashen Compact" [level=3] [ref=e74]
      - generic [ref=e76]:
        - tablist "Realm registry" [ref=e77]:
          - tab "Armies 128" [ref=e78] [cursor=pointer]
          - tab "Settlements 30" [selected] [ref=e79] [cursor=pointer]
        - button "Characters & agents" [ref=e80] [cursor=pointer]: Characters 0
      - generic [ref=e81]:
        - text: Search your realm
        - searchbox "Search your realm" [ref=e82]: Frontier
      - tabpanel "Settlements 30" [ref=e83]:
        - generic [ref=e84]:
          - generic [ref=e86]:
            - text: Settlement orders
            - combobox "Settlement orders" [ref=e87]:
              - option "All hearths (3)" [selected]
              - option "No production (2)"
              - option "Without charters (0)"
              - option "Charters waiting (2)"
          - group [ref=e88]:
            - generic "How these filters work" [ref=e89] [cursor=pointer]
          - generic [ref=e90]:
            - generic [ref=e91]:
              - text: Registry order
              - combobox "Registry order" [ref=e92]:
                - option "Stable order" [selected]
                - option "Name A–Z"
            - generic [ref=e93]: 3 towns
          - group [ref=e94]:
            - generic "Saved hearth groups" [ref=e95] [cursor=pointer]
            - paragraph [ref=e96]: Groups belong to this campaign and are included in its saves and exports. Recall replaces this tab’s checked selection; apply postings or charters separately.
            - generic [ref=e97]:
              - generic [ref=e98]:
                - text: Saved hearth group
                - combobox "Saved hearth group" [ref=e99]:
                  - option "Choose a saved hearth group"
                  - option "Frontier works"
                  - option "Realm works" [selected]
              - button "Recall group" [ref=e100] [cursor=pointer]
              - paragraph [ref=e101]: 30 saved members · Only currently owned hearths can be checked for orders.
              - status [ref=e102]: "Recalled group “Realm works”: 30 hearths selected. 0 skipped (0 embarked, 0 unavailable or no longer owned). Existing orders are unchanged."
            - generic [ref=e103]:
              - text: Group name
              - textbox "Group name" [ref=e104]: Realm works
            - paragraph [ref=e105]: Save up to 128 checked hearths per group. Names can use 40 characters and must be unique among hearth groups. This realm has 4 of 24 saved groups across both tabs.
            - paragraph [ref=e106]: Update group replaces all saved members with the 30 currently checked hearths. Unchecked hearths are removed from the group.
            - generic [ref=e107]:
              - button "Save new group" [ref=e108] [cursor=pointer]
              - button "Update group" [ref=e109] [cursor=pointer]
              - button "Delete group" [ref=e110] [cursor=pointer]
          - region "Group hearth charters" [ref=e111]:
            - generic [ref=e112]:
              - button "Select matching hearths" [disabled] [ref=e113]
              - button "Clear hearth selection" [ref=e114] [cursor=pointer]
            - status [ref=e115]: 30 hearths selected · 27 outside this filter
            - paragraph [ref=e116]: Check hearths to give them standing charters together. Select up to 128 at a time; page, search and registry changes keep your selection.
            - generic [ref=e117]:
              - generic [ref=e118]:
                - text: Charter focus
                - combobox "Charter focus" [ref=e119]:
                  - option "Works" [selected]
                  - option "Wealth"
                  - option "Learning"
                  - option "Muster"
              - generic [ref=e120]:
                - text: Coin ceiling per hearth
                - spinbutton "Coin ceiling per hearth" [ref=e121]: "24"
            - paragraph [ref=e122]: Applying charters spends no coin now. Each hearth may spend up to its ceiling on one work whenever its queue is empty, once per turn after upkeep. All charters share your treasury and leave 40 coin in reserve.
            - paragraph [ref=e123]: Works, Wealth and Learning prioritize buildings; Muster raises land companies that add upkeep. Existing production orders stay in place. Revoking a charter stops future orders and keeps its current queue.
            - paragraph [ref=e124]: 1 selected hearth already has production queued; those orders come first.
            - group [ref=e125]:
              - generic "Charter templates" [ref=e126] [cursor=pointer]
            - generic [ref=e127]:
              - button "Apply charters (30)" [ref=e128] [cursor=pointer]
              - button "Revoke charters (30)" [ref=e129] [cursor=pointer]
          - group [ref=e130]:
            - generic "Worker policies" [ref=e131]
            - option "Balanced" [selected]
            - option "Food"
            - option "Industry"
            - option "Coin"
            - option "Knowledge"
          - group [ref=e132]:
            - generic "Land commissions" [ref=e133] [cursor=pointer]
            - paragraph [ref=e134]: 30 hearths selected · 27 outside this filter
            - paragraph [ref=e135]: Use checked hearths or recall a saved hearth group. Apply one improvement and budget per hearth to up to 128 hearths together.
            - generic [ref=e136]:
              - text: Group commission improvement
              - combobox "Group commission improvement" [ref=e137]:
                - option "Terraced fields" [selected]
                - option "Managed woodlot"
                - option "Measured quarry"
                - option "Reedworks"
                - option "Shore fishery"
                - option "Spring garden"
                - option "Polder"
                - option "Grove archive"
                - option "Oreworks"
                - option "Tide observatory"
                - option "Hearthgrain grange"
                - option "Ironstone mine"
                - option "Copper mine"
                - option "Salt house"
                - option "Heartwood yard"
                - option "Remount yard"
                - option "Silver mine"
                - option "Ashglass refinery"
            - generic [ref=e138]:
              - generic [ref=e139]:
                - text: Allowance per hearth · coin
                - textbox "Allowance per hearth · coin" [ref=e140]: "100"
              - generic [ref=e141]:
                - text: Shared treasury reserve · coin
                - textbox "Shared treasury reserve · coin" [active] [ref=e142]: "10"
            - status [ref=e143]: 100 coin per hearth × 30 = 3000 coin total permission.
            - paragraph [ref=e144]: This replaces each hearth’s remaining allowance; it does not add to it. Permission is not escrow or a payment quote. Zero allowance stops new purchases. Applying can pay for each first order immediately in stable hearth order, sharing the same treasury.
            - paragraph [ref=e145]: Each purchase must leave the shared treasury reserve; the reserve is not multiplied by the hearth count. Other realm orders can still spend it. Further orders begin after upkeep and production charters. Accepted means the commission was set, not that work started.
            - paragraph [ref=e146]: Only suitable worked, unimproved land qualifies. Existing sites and mismatched deposits are protected. Commissions do not claim land, cultivate biomes or assign workers. Siege and occupation pause work.
            - paragraph [ref=e147]: Ending commissions keeps paid work underway. Successful manual construction, cultivation or cancellation ends that hearth’s commission. Ownership loss ends permission; cancelled work is not refunded.
            - generic [ref=e148]:
              - button "Apply land commissions (30)" [ref=e149] [cursor=pointer]
              - button "End land commissions (30)" [ref=e150] [cursor=pointer]
          - group [ref=e151]:
            - generic "Production sequences" [ref=e152] [cursor=pointer]
            - option "Root cellar · 8 coin" [selected]
            - option "Cinder workshop · 12 coin"
            - option "Charter market · 10 coin"
            - option "Witness archive · 12 coin"
            - option "Charter harbor · 20 coin"
            - option "Hearth caravan · 16 coin"
            - option "Wayfinder · 8 coin"
            - option "Oath guard · 12 coin"
            - option "Ash pike company · 10 coin"
            - option "Cinder plate cohort · 22 coin"
            - option "Charter outriders · 18 coin"
            - option "Charter transport · 24 coin"
            - option "Coastwatch galley · 30 coin"
            - option "Deepwake warship · 48 coin"
            - option "Reed skirmishers · 14 coin"
            - option "Witness arbalesters · 22 coin"
            - option "Kiln halberdiers · 28 coin"
            - option "Road lancers · 32 coin"
          - generic [ref=e153]:
            - generic [ref=e154]:
              - checkbox "Select Frontier reserve for group orders" [checked] [ref=e156]
              - 'button "Frontier reserve 9 people · Root cellar Muster charter · 4 coin per work · Current queue comes first. Land commission: Terraced fields · 78 coin left · 10 reserve · Existing paid land work must finish first." [ref=e157] [cursor=pointer]':
                - generic [aria-hidden] [ref=e158]: ⌂
                - generic [ref=e159]:
                  - strong [ref=e160]: Frontier reserve
                  - generic [ref=e161]: 9 people · Root cellar
                  - generic [ref=e162]: Muster charter · 4 coin per work · Current queue comes first.
                  - generic [ref=e163]: "Land commission: Terraced fields · 78 coin left · 10 reserve · Existing paid land work must finish first."
                - generic [aria-hidden] [ref=e164]: ›
            - generic [ref=e165]:
              - checkbox "Select Frontier west for group orders" [checked] [ref=e167]
              - 'button "Frontier west 9 people · No production Muster charter · 4 coin per work · Nothing this charter builds costs 4 coin or less; raise the ceiling. Land commission: Terraced fields · 78 coin left · 10 reserve · Existing paid land work must finish first." [ref=e168] [cursor=pointer]':
                - generic [aria-hidden] [ref=e169]: ⌂
                - generic [ref=e170]:
                  - strong [ref=e171]: Frontier west
                  - generic [ref=e172]: 9 people · No production
                  - generic [ref=e173]: Muster charter · 4 coin per work · Nothing this charter builds costs 4 coin or less; raise the ceiling.
                  - generic [ref=e174]: "Land commission: Terraced fields · 78 coin left · 10 reserve · Existing paid land work must finish first."
                - generic [aria-hidden] [ref=e175]: ›
            - generic [ref=e176]:
              - checkbox "Select Frontier east for group orders" [checked] [ref=e178]
              - 'button "Frontier east 9 people · No production Muster charter · 4 coin per work · Nothing this charter builds costs 4 coin or less; raise the ceiling. Land commission: Terraced fields · 78 coin left · 10 reserve · Existing paid land work must finish first." [ref=e179] [cursor=pointer]':
                - generic [aria-hidden] [ref=e180]: ⌂
                - generic [ref=e181]:
                  - strong [ref=e182]: Frontier east
                  - generic [ref=e183]: 9 people · No production
                  - generic [ref=e184]: Muster charter · 4 coin per work · Nothing this charter builds costs 4 coin or less; raise the ceiling.
                  - generic [ref=e185]: "Land commission: Terraced fields · 78 coin left · 10 reserve · Existing paid land work must finish first."
                - generic [aria-hidden] [ref=e186]: ›
      - paragraph [ref=e187]: Choose an entry to locate it on the map. Use the bottom command tray for its orders.
  - contentinfo [ref=e188]:
    - generic [ref=e190]:
      - generic [ref=e191]: Selected army
      - strong [ref=e192]: Northern relief interrupted
      - generic [ref=e193]: 1 / 12 formations · 60 strength · 2 movement
      - button "Show selected orders" [ref=e195] [cursor=pointer]
    - region "Next-action navigation" [ref=e196]:
      - generic [ref=e197]:
        - button "Previous army needing orders" [ref=e198] [cursor=pointer]: ‹
        - button "Next army needing orders" [ref=e199] [cursor=pointer]: Next army N
        - button "Previous idle settlement" [ref=e200] [cursor=pointer]: ‹
        - button "Next idle settlement" [ref=e201] [cursor=pointer]: Next town S
      - paragraph [ref=e202]: "Labor: 90 unassigned households · 30 settlements"
      - generic [ref=e203]:
        - button "Previous settlement with unassigned households" [ref=e204] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e205] [cursor=pointer]: Review households
      - group [ref=e206]:
        - generic "What wants a decision 4 kinds" [ref=e207] [cursor=pointer]:
          - text: What wants a decision
          - generic [ref=e208]: 4 kinds
    - generic [ref=e209]:
      - strong [ref=e211]: Turn 2
      - button "End turn" [ref=e212] [cursor=pointer]:
        - text: End turn
        - generic [ref=e213]: E
    - status [ref=e214]:
      - generic [aria-hidden] [ref=e215]: ◆
      - text: Campaign saved.
```

# Test source

```ts
  9   | import { openRegistry } from '../gameplay/ui-navigation';
  10  | 
  11  | const improvementId = 'improvement.terraced_fields';
  12  | 
  13  | async function recallRealm(page: Page) {
  14  |   await openRegistry(page, 'settlements');
  15  |   const groups = page.getByTestId('selection-groups');
  16  |   if (await groups.getAttribute('open') === null) await groups.locator(':scope > summary').click();
  17  |   await groups.getByRole('combobox', { name: 'Saved hearth group', exact: true }).selectOption({ label: 'Realm works' });
  18  |   const recall = groups.getByRole('button', { name: 'Recall group', exact: true });
  19  |   await recall.focus(); await page.keyboard.press('Enter');
  20  |   await expect(groups).toContainText('30 hearths selected');
  21  |   const policies = page.getByTestId('group-land-policies');
  22  |   if (await policies.getAttribute('open') === null) { await policies.locator(':scope > summary').focus(); await page.keyboard.press('Enter'); }
  23  |   return policies;
  24  | }
  25  | 
  26  | test('production land commissions share a finite purse across 30 hearths and preserve exact keyboard removal and restoration at 130%', async ({ page }, testInfo) => {
  27  |   mkdirSync(testInfo.outputDir, { recursive: true });
  28  |   const fixture = empireDelegationCampaign(), factionId = fixture.game.turnOwnerId;
  29  |   const towns = Object.values(fixture.game.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1);
  30  |   expect(towns).toHaveLength(30);
  31  |   const view = getObservation(fixture.game, factionId, { landDetails: 'none', developmentCandidates: false });
  32  |   expect(view.armies.filter(army => army.factionId === factionId)).toHaveLength(128); expect(view.wars).toHaveLength(2);
  33  |   // Explicit finite synthetic purse on the existing authored mature fixture.
  34  |   // Actual ordinary worker commands choose legal generated claims.
  35  |   fixture.game.factions.find(item => item.id === factionId)!.treasury = 100;
  36  |   for (const town of towns) expect(applyCommand(fixture.game, { type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' }).ok).toBe(true);
  37  |   expect(applyCommand(fixture.game, { type: 'setLandPolicy', factionId, settlementId: towns[0]!.id, improvementId, allowance: 0, reserve: 10 }).ok).toBe(true);
  38  |   const archive = createJournal(fixture.game, { mode: 'player', coverage: 'from-save' }).materialize();
  39  |   const expected = deserializeGame(serializeGame(fixture.game)), journal = resumeJournal(expected, archive);
  40  |   const record = (command: GameCommand) => { expect(journal.record(expected, command).ok).toBe(true); };
  41  |   const errors: string[] = [];
  42  |   page.on('pageerror', error => errors.push(error.message));
  43  |   await page.goto('./');
  44  |   expect(await page.evaluate(() => '__THEANDRIL__' in window)).toBe(false);
  45  |   await page.getByLabel('Import save file').setInputFiles({ name: 'group-land-commissions.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(fixture.game, archive))) });
  46  |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  47  |   await campaignMenu(page);
  48  |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  49  |   let policies = await recallRealm(page);
  50  |   // Removing a common policy targets only its current holders; the other29
  51  |   // remain checked. No response or refusal is fabricated in this journey.
  52  |   await policies.getByRole('button', { name: 'End land commissions (1)', exact: true }).click();
  53  |   await expect(policies).toContainText('29 hearths selected');
  54  |   await expect(page.getByTestId('group-land-policy-results')).toContainText('1 orders accepted · 0 refused');
  55  |   record({ type: 'setLandPolicy', factionId, settlementId: towns[0]!.id, improvementId: 'none', allowance: 0, reserve: 0 });
  56  | 
  57  |   policies = await recallRealm(page);
  58  |   await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill('Frontier');
  59  |   await expect(policies).toContainText('30 hearths selected · 27 outside this filter');
  60  |   await policies.getByRole('combobox', { name: 'Group commission improvement', exact: true }).selectOption(improvementId);
  61  |   const amount = policies.getByRole('textbox', { name: 'Allowance per hearth · coin', exact: true });
  62  |   for (const invalid of ['', '-1', '3.2', '9007199254740992']) {
  63  |     await amount.fill(invalid);
  64  |     await expect(policies.getByRole('button', { name: 'Apply land commissions (30)', exact: true })).toBeDisabled();
  65  |   }
  66  |   await amount.fill('9007199254740991');
  67  |   await expect(policies).toContainText('270215977642229730');
  68  |   await amount.fill('100');
  69  |   await policies.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('10');
  70  |   await policies.locator('.group-land-total').screenshot({ path: testInfo.outputPath('group-land-budget-native.png') });
  71  |   const apply = policies.getByRole('button', { name: 'Apply land commissions (30)', exact: true });
  72  |   await apply.focus(); await page.keyboard.press('Enter');
  73  |   for (const town of towns) record({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 100, reserve: 10 });
  74  |   await expect(policies).toContainText('0 hearths selected');
  75  |   let receipt = page.getByTestId('group-land-policy-results');
  76  |   await expect(receipt).toContainText('30 orders accepted · 0 refused');
  77  |   await receipt.getByText('Review land commission results', { exact: true }).click();
  78  |   await expect(receipt.getByRole('listitem')).toHaveCount(25);
  79  |   await receipt.getByRole('button', { name: 'Next land-policy results page', exact: true }).click();
  80  |   await expect(receipt.getByRole('listitem')).toHaveCount(5);
  81  |   await expect(receipt.getByRole('listitem').last()).toContainText(towns[29]!.name);
  82  |   await receipt.scrollIntoViewIfNeeded();
  83  |   await page.screenshot({ path: testInfo.outputPath('group-land-policies-desktop-130.png') });
  84  |   const granted = await exportedTravel(page);
  85  |   expect(serializeGame(granted.game)).toBe(serializeGame(expected));
  86  |   expect(granted.archive).toEqual(journal.materialize()); expect(granted.archive.records).toHaveLength(31);
  87  |   expect(getObservation(granted.game, factionId, { landDetails: 'none' }).treasury).toBe(12);
  88  |   const works = towns.filter(town => granted.game.land.settlements[town.id]!.work);
  89  |   expect(works.map(town => town.id)).toEqual(['settlement.65', 'settlement.66', 'settlement.67', 'settlement.69']);
  90  |   expect(works.map(town => granted.game.land.settlements[town.id]!.work!.coinCost)).toEqual([22, 22, 22, 22]);
  91  |   expect(granted.game.landPolicies).toHaveLength(30);
  92  |   expect(granted.game.landPolicies.filter(policy => policy.allowance === 100)).toHaveLength(26);
  93  |   expect(granted.game.settlements).toEqual(fixture.game.settlements);
  94  |   expect(granted.game.armies).toEqual(fixture.game.armies);
  95  |   expect(granted.game.charters).toEqual(fixture.game.charters);
  96  |   await campaignMenu(page);
  97  |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  98  |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  99  | 
  100 |   await page.setViewportSize({ width: 390, height: 844 });
  101 |   policies = await recallRealm(page);
  102 |   await policies.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('10');
  103 |   const amounts = policies.locator('.group-land-amounts');
  104 |   await amounts.scrollIntoViewIfNeeded();
  105 |   for (const input of await amounts.locator('input').all()) {
  106 |     expect(await input.evaluate(element => {
  107 |       const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
  108 |       return bounds.height >= 44 && bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
> 109 |     })).toBe(true);
      |         ^ Error: expect(received).toBe(expected) // Object.is equality
  110 |   }
  111 |   await page.screenshot({ path: testInfo.outputPath('group-land-form-narrow-130.png') });
  112 |   const remove = policies.getByRole('button', { name: 'End land commissions (30)', exact: true });
  113 |   await remove.scrollIntoViewIfNeeded();
  114 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  115 |   expect(await remove.evaluate(element => {
  116 |     const bounds = element.getBoundingClientRect(), frame = element.closest('.campaign-window-body')!.getBoundingClientRect();
  117 |     return bounds.left >= frame.left && bounds.right <= frame.right && bounds.top >= frame.top && bounds.bottom <= frame.bottom;
  118 |   })).toBe(true);
  119 |   await remove.focus(); await page.keyboard.press('Enter');
  120 |   for (const town of towns) record({ type: 'setLandPolicy', factionId, settlementId: town.id, improvementId: 'none', allowance: 0, reserve: 0 });
  121 |   receipt = page.getByTestId('group-land-policy-results');
  122 |   await expect(receipt).toContainText('30 orders accepted · 0 refused');
  123 |   await expect(policies).toContainText('0 hearths selected');
  124 |   await receipt.scrollIntoViewIfNeeded();
  125 |   await page.screenshot({ path: testInfo.outputPath('group-land-policies-narrow-130.png') });
  126 |   const removed = await exportedTravel(page);
  127 |   expect(removed.game.landPolicies).toEqual([]);
  128 |   expect(removed.game.land.settlements).toEqual(granted.game.land.settlements);
  129 |   expect(serializeGame(removed.game)).toBe(serializeGame(expected));
  130 |   expect(removed.archive).toEqual(journal.materialize()); expect(removed.archive.records).toHaveLength(61);
  131 |   expect(serializeGame(replayArchive(removed.archive))).toBe(serializeGame(expected));
  132 |   await campaignMenu(page);
  133 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  134 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  135 |   const restored = await exportedTravel(page);
  136 |   expect(restored.archive).toEqual(granted.archive); expect(serializeGame(restored.game)).toBe(serializeGame(granted.game));
  137 |   writeFileSync(testInfo.outputPath('group-land-policies.theandril'), removed.bytes);
  138 |   writeFileSync(testInfo.outputPath('group-land-policies-evidence.json'), JSON.stringify({ authored: fixture.authored, initialLandPolicy: 'One zero-allowance commission installed before from-save archive; 100 coin authored purse; all thirty worker policies assigned through ordinary commands', initialTreasury: 100, finalTreasury: 12, reserve: 10, allowancePerHearth: 100, immediateStarts: 4, waiting: 26, beforeHash: stateHash(fixture.game), grantedHash: stateHash(granted.game), removedHash: stateHash(removed.game), records: removed.archive.records.length, towns: 30, armies: 128, wars: 2, retainedChecksAfterSelectiveRemoval: 29, viewport: '390x844 at 130%', implicitAutosave: false }, null, 2) + '\n');
  139 |   expect(errors).toEqual([]);
  140 | });
  141 | 
  142 | type LandPolicyFaultEvidence = { hash: string; results: { settlementId: string; accepted: boolean }[] };
  143 | for (const fault of ['missing-results', 'wrong-hearth', 'worker-crash'] as const) {
  144 |   test(`production land commission ${fault} after real paid commission installation preserves selection and requires restoration`, async ({ page }, testInfo) => {
  145 |     // Only the completed native worker reply is damaged. Canonical commands,
  146 |     // worker execution, save storage and the controls remain real.
  147 |     await page.addInitScript(({ fault }) => {
  148 |       const NativeWorker = window.Worker; let damaged = false;
  149 |       window.Worker = class extends NativeWorker {
  150 |         private receiver: Worker['onmessage'] = null;
  151 |         constructor(url: string | URL, options?: WorkerOptions) {
  152 |           super(url, options);
  153 |           this.addEventListener('message', event => {
  154 |             const data = event.data as { type?: string; hash: string; groupLandPolicyResults?: { settlementId: string; accepted: boolean }[] };
  155 |             if (!damaged && data.type === 'state' && Array.isArray(data.groupLandPolicyResults)) {
  156 |               damaged = true;
  157 |               (window as unknown as { __LAND_POLICY_FAULT__: LandPolicyFaultEvidence }).__LAND_POLICY_FAULT__ = { hash: data.hash, results: structuredClone(data.groupLandPolicyResults) };
  158 |               if (fault === 'worker-crash') { this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker failure after actual worker paid commission installation' })); return; }
  159 |               const altered = structuredClone(data);
  160 |               if (fault === 'missing-results') delete altered.groupLandPolicyResults;
  161 |               else altered.groupLandPolicyResults![0]!.settlementId = 'settlement.not-submitted';
  162 |               this.receiver?.call(this, new MessageEvent('message', { data: altered }));
  163 |             } else this.receiver?.call(this, event);
  164 |           });
  165 |         }
  166 |         override get onmessage(): Worker['onmessage'] { return this.receiver; }
  167 |         override set onmessage(receiver: Worker['onmessage']) { this.receiver = receiver; }
  168 |       };
  169 |     }, { fault });
  170 |     const game = createGame({ seed: 20260905, size: 'tiny', pace: 'short', factionCount: 2, cityStateCount: 0 }), factionId = game.turnOwnerId;
  171 |     expect(applyCommand(game, { type: 'found', factionId, armyId: 'army.1', name: 'Commission recovery' }).ok).toBe(true);
  172 |     const founded = Object.values(game.settlements).find(town => town.factionId === factionId)!;
  173 |     expect(applyCommand(game, { type: 'setWorkerPolicy', factionId, settlementId: founded.id, focus: 'food' }).ok).toBe(true);
  174 |     const town = Object.values(game.settlements).find(town => town.factionId === factionId)!;
  175 |     const archive = createJournal(game, { mode: 'player', coverage: 'from-save' }).materialize();
  176 |     const expected = deserializeGame(serializeGame(game));
  177 |     expect(applyCommand(expected, { type: 'setLandPolicy', factionId, settlementId: town.id, improvementId, allowance: 100, reserve: 0 }).ok).toBe(true);
  178 |     expect(expected.land.settlements[town.id]!.work).not.toBeNull();
  179 |     expect(getObservation(expected, factionId).treasury).toBeLessThan(getObservation(game, factionId).treasury);
  180 |     const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  181 |     await page.goto('./');
  182 |     await page.getByLabel('Import save file').setInputFiles({ name: 'land-policy-recovery.theandril', mimeType: 'application/gzip', buffer: Buffer.from(await exportSave(serializeCampaign(game, archive))) });
  183 |     await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  184 |     await campaignMenu(page); await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  185 |     await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  186 |     const select = async () => {
  187 |       await openRegistry(page, 'settlements');
  188 |       await page.getByRole('searchbox', { name: 'Search your realm', exact: true }).fill(town.name);
  189 |       await page.getByTestId('group-charters').getByRole('button', { name: 'Select matching hearths', exact: true }).click();
  190 |       const panel = page.getByTestId('group-land-policies');
  191 |       if (await panel.getAttribute('open') === null) await panel.locator(':scope > summary').click();
  192 |       return panel;
  193 |     };
  194 |     let panel = await select();
  195 |     await panel.getByRole('combobox', { name: 'Group commission improvement', exact: true }).selectOption(improvementId);
  196 |     await panel.getByRole('textbox', { name: 'Shared treasury reserve · coin', exact: true }).fill('0');
  197 |     await panel.getByRole('button', { name: 'Apply land commissions (1)', exact: true }).click();
  198 |     await expect(page.getByTestId('feedback')).toContainText(fault === 'worker-crash' ? 'The campaign worker stopped:' : 'The group order response could not be displayed.');
  199 |     await expect(panel.getByRole('alert')).toContainText(fault === 'worker-crash' ? 'Restore a saved campaign before issuing group orders.' : 'Some orders may have applied; restore a saved campaign');
  200 |     await expect(panel).toContainText('1 hearth selected');
  201 |     await expect(panel).toHaveAttribute('aria-busy', 'false');
  202 |     await expect(page.getByTestId('group-land-policy-results')).toHaveCount(0);
  203 |     await expect(panel.getByRole('button', { name: 'Apply land commissions (1)', exact: true })).toBeDisabled();
  204 |     await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeDisabled();
  205 |     expect(await page.evaluate(() => (window as unknown as { __LAND_POLICY_FAULT__: LandPolicyFaultEvidence }).__LAND_POLICY_FAULT__)).toEqual({ hash: stateHash(expected), results: [{ settlementId: town.id, accepted: true }] });
  206 |     await page.screenshot({ path: testInfo.outputPath(`land-policy-${fault}-recovery.png`) });
  207 |     await campaignMenu(page); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  208 |     await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  209 |     const restored = await exportedTravel(page);
```