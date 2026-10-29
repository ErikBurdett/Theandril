# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: patrols.spec.ts >> a generated production campaign patrols, pauses and restores through real controls without development hooks
- Location: tests/production/patrols.spec.ts:7:1

# Error details

```
Error: locator.click: Target crashed 
Call log:
  - waiting for getByTestId('army-patrol').getByRole('button', { name: 'Start patrol', exact: true })
    - locator resolved to <button class="primary wide">Start patrol</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { neighbors } from '@theandril/mapgen';
  3  | import { getMovementPreview, getObservation, stateHash } from '@theandril/sim';
  4  | import { campaignMenu, exportedTravel } from '../gameplay/group-movement-fixture';
  5  | import { closeManagement, openSelectedOrders, selectFromRegistry } from '../gameplay/ui-navigation';
  6  | 
  7  | test('a generated production campaign patrols, pauses and restores through real controls without development hooks', async ({ page }, testInfo) => {
  8  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  9  |   await page.goto('./');
  10 |   await page.getByRole('textbox', { name: 'World seed', exact: true }).fill('20260927');
  11 |   await page.getByRole('combobox', { name: 'World size', exact: true }).selectOption('tiny');
  12 |   await page.getByRole('spinbutton', { name: 'Faction count', exact: true }).fill('2');
  13 |   await page.getByRole('spinbutton', { name: 'City-states', exact: true }).fill('0');
  14 |   await page.getByRole('button', { name: 'Begin campaign', exact: true }).click();
  15 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  16 |   expect(await page.evaluate(() => typeof window.__THEANDRIL__)).toBe('undefined');
  17 |   const origin = await exportedTravel(page), view = getObservation(origin.game, origin.game.turnOwnerId);
  18 |   const army = view.armies.find(army => army.factionId === view.factionId && army.canAttack && !army.canFound && army.domain === 'land')!;
  19 |   expect(army).toBeTruthy();
  20 |   const target = neighbors(army.cell, view.width, view.height).find(cell => {
  21 |     const route = getMovementPreview(view, army.id, cell);
  22 |     return route.canQueue && route.action === 'move' && route.canMoveNow;
  23 |   });
  24 |   expect(target).toBeDefined();
  25 |   await selectFromRegistry(page, 'armies', army.name); await openSelectedOrders(page);
  26 |   const patrol = page.getByTestId('army-patrol'); await patrol.locator(':scope > summary').click();
  27 |   await patrol.getByRole('spinbutton', { name: 'Second patrol point', exact: true }).fill(String(target));
> 28 |   await patrol.getByRole('button', { name: 'Start patrol', exact: true }).click();
     |                                                                           ^ Error: locator.click: Target crashed 
  29 |   await closeManagement(page);
  30 |   await page.getByRole('button', { name: 'End turn', exact: true }).click();
  31 |   await expect(page.getByTestId('turn-counter')).toHaveText('Turn 2');
  32 |   await expect(page.getByRole('button', { name: 'End turn', exact: true })).toBeEnabled();
  33 |   const moving = await exportedTravel(page);
  34 |   expect(moving.game.armies[army.id]!.cell).toBe(target);
  35 |   expect(moving.game.patrols[0]!.target).toBe('first');
  36 |   await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  37 |   await expect(page.getByTestId('feedback')).toContainText('Campaign saved.');
  38 |   await selectFromRegistry(page, 'armies', army.name); await openSelectedOrders(page);
  39 |   await patrol.locator(':scope > summary').click();
  40 |   await patrol.getByRole('button', { name: 'Pause patrol', exact: true }).click();
  41 |   await expect(patrol.locator(':scope > summary')).toContainText('Paused');
  42 |   await campaignMenu(page);
  43 |   await page.getByRole('button', { name: 'Load campaign', exact: true }).click();
  44 |   await expect(page.getByTestId('feedback')).toContainText('Campaign restored.');
  45 |   const restored = await exportedTravel(page);
  46 |   expect(stateHash(restored.game)).toBe(stateHash(moving.game));
  47 |   expect(restored.archive).toEqual(moving.archive);
  48 |   await page.getByRole('combobox', { name: 'Text scale', exact: true }).selectOption('1.3');
  49 |   await page.setViewportSize({ width: 390, height: 844 });
  50 |   await selectFromRegistry(page, 'armies', army.name); await openSelectedOrders(page);
  51 |   await patrol.locator(':scope > summary').click();
  52 |   await patrol.getByRole('button', { name: 'Pause patrol', exact: true }).focus(); await page.keyboard.press('Enter');
  53 |   await expect(patrol.getByRole('button', { name: 'Resume patrol', exact: true })).toBeEnabled();
  54 |   const remove = patrol.getByRole('button', { name: 'Remove patrol', exact: true });
  55 |   await remove.scrollIntoViewIfNeeded();
  56 |   expect(await remove.evaluate(button => {
  57 |     const bounds = button.getBoundingClientRect(), frame = button.closest('.campaign-window-body')!.getBoundingClientRect();
  58 |     return bounds.top >= frame.top && bounds.bottom <= frame.bottom && bounds.left >= frame.left && bounds.right <= frame.right;
  59 |   })).toBe(true);
  60 |   await page.screenshot({ path: testInfo.outputPath('production-patrol-narrow-large-text.png') });
  61 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  62 |   expect(errors).toEqual([]);
  63 | });
  64 | 
```