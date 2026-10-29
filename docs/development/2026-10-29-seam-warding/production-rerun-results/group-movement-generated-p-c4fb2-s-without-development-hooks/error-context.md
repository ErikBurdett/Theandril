# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: group-movement.spec.ts >> generated production group travel moves ordinary armies and retains postings, replay and portable saved routes without development hooks
- Location: tests/production/group-movement.spec.ts:6:1

# Error details

```
Error: locator.setInputFiles: Target crashed 
Call log:
  - waiting for getByLabel('Import save file')

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash } from '@theandril/sim';
  3  | import { campaignMenu, exportedTravel, order, reviewTravel, travelPanel } from '../gameplay/group-movement-fixture';
  4  | import { openRegistry } from '../gameplay/ui-navigation';
  5  | 
  6  | test('generated production group travel moves ordinary armies and retains postings, replay and portable saved routes without development hooks', async ({ page }, testInfo) => {
  7  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  8  |   await page.goto('./');
  9  |   await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260927');
  10 |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  11 |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  12 |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  13 |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  14 |   await expect(page.getByTestId('feedback')).toContainText('Your people await a hearth.');
  15 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  16 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  17 |   await openRegistry(page, 'armies');
  18 |   const postings = page.getByTestId('group-postings');
  19 |   await postings.getByRole('button', { name: 'Select matching armies', exact: true }).click();
  20 |   await postings.getByRole('button', { name: 'Post selected armies (2)', exact: true }).click();
  21 |   await expect(page.getByTestId('group-posting-results')).toContainText('2 orders accepted · 0 refused');
  22 |   const before = await exportedTravel(page), game = before.game, owner = game.turnOwnerId;
  23 |   const own = Object.values(game.armies).filter(army => army.factionId === owner).sort((a, b) => a.id < b.id ? -1 : 1);
  24 |   expect(own).toHaveLength(2);
  25 |   // Read the actual downloaded campaign to choose a canonical known destination.
  26 |   // This computes no browser action and changes neither the world nor resources.
  27 |   const view = getObservation(game, owner);
  28 |   const candidates = [...game.explored[owner]!].map(target => ({ target, quotes: own.map(army => getMovementPreview(view, army.id, target)) }))
  29 |     .filter(item => item.quotes.every(quote => quote.canQueue && quote.cost > 0)
  30 |       && item.quotes.some((quote, index) => quote.cost > own[index]!.movement))
  31 |     .sort((a, b) => b.quotes[0]!.cost - a.quotes[0]!.cost || a.target - b.target);
  32 |   expect(candidates.length).toBeGreaterThan(0);
  33 |   const target = candidates[0]!.target;
  34 |   await travelPanel(page, true); await reviewTravel(page, target);
  35 |   await expect(page.getByTestId('group-movement-preview')).toContainText('2 can queue · 0 unavailable');
  36 |   const onlyReviewed = await exportedTravel(page);
  37 |   expect(serializeGame(onlyReviewed.game)).toBe(serializeGame(game));
  38 |   expect(onlyReviewed.archive).toEqual(before.archive);
  39 |   await page.setViewportSize({ width: 390, height: 844 });
  40 |   const panel = await travelPanel(page, true, true); await reviewTravel(page, target);
  41 |   await panel.getByRole('button', { name: 'Apply reviewed routes (2)', exact: true }).focus(); await page.keyboard.press('Enter');
  42 |   await expect(page.getByTestId('group-movement-results')).toContainText('2 orders accepted · 0 refused');
  43 |   const applied = await exportedTravel(page), serial = deserializeGame(serializeGame(game));
  44 |   for (const army of own) order(serial, { type: 'queueMovement', factionId: owner, armyId: army.id, target, append: false });
  45 |   expect(serializeGame(applied.game)).toBe(serializeGame(serial));
  46 |   expect(applied.archive.records.slice(before.archive.records.length).map(record => record.command)).toEqual(own.map(army => ({ type: 'queueMovement', factionId: owner, armyId: army.id, target, append: false })));
  47 |   expect(own.some(army => applied.game.armies[army.id]!.cell !== army.cell)).toBe(true);
  48 |   expect(applied.game.postings).toEqual(game.postings);
  49 |   const routeCount = Object.keys(applied.game.routes).length;
  50 |   expect(routeCount).toBeGreaterThan(0);
  51 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  52 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  53 |   await travelPanel(page, true);
  54 |   await panel.getByRole('button', { name: `Cancel travel routes (${routeCount})`, exact: true }).click();
  55 |   await expect(page.getByTestId('group-movement-results')).toContainText(`${routeCount} orders accepted · 0 refused`);
  56 |   const cancelled = await exportedTravel(page);
  57 |   expect(cancelled.game.routes).toEqual({}); expect(cancelled.game.postings).toEqual(game.postings);
  58 |   await page.reload(); await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  59 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  60 |   const restored = await exportedTravel(page);
  61 |   expect(stateHash(restored.game)).toBe(stateHash(applied.game)); expect(restored.archive).toEqual(applied.archive);
  62 |   await page.reload();
> 63 |   await page.getByLabel('Import save file').setInputFiles({ name: 'generated-group-travel.theandril', mimeType: 'application/gzip', buffer: applied.bytes });
     |   ^ Error: locator.setInputFiles: Target crashed 
  64 |   await expect(page.getByTestId('feedback')).toContainText('Imported campaign');
  65 |   const portable = await exportedTravel(page);
  66 |   expect(serializeGame(portable.game)).toBe(serializeGame(applied.game)); expect(portable.archive).toEqual(applied.archive);
  67 |   await travelPanel(page, true, true);
  68 |   await expect(panel.getByRole('button', { name: `Cancel travel routes (${routeCount})`, exact: true })).toBeEnabled();
  69 |   await panel.scrollIntoViewIfNeeded();
  70 |   await page.screenshot({ path: testInfo.outputPath('production-group-travel-restored-narrow.png') });
  71 |   await campaignMenu(page);
  72 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  73 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  74 |   expect(errors).toEqual([]);
  75 | });
  76 | 
```