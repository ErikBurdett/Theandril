# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: battle-defense.spec.ts >> R03 narrow public assaults complete occupation at 390px without intercepted controls at 130% text
- Location: tests/gameplay/battle-defense.spec.ts:118:39

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
          - strong [ref=e12]: 0 coin
        - generic [ref=e13]:
          - generic [ref=e14]: KNOWLEDGE
          - strong [ref=e15]: "8"
    - navigation "Campaign navigation" [ref=e16]:
      - generic [ref=e17]:
        - text: Standard pace ·
        - generic [ref=e18]: 2 realms
    - group [ref=e19]:
      - generic "Campaign & settings" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - region "Strategic map" [ref=e22]:
      - generic "World map. Select an army then click a highlighted hex to move or an enemy to attack. Hover to preview routes. Drag to pan; scroll to zoom all the way to world overview. Arrow keys pan; plus and minus zoom. Focus selection returns to local detail. Enter opens map actions for the selection. Escape closes map actions before clearing selection. The army panel has keyboard and touch route controls." [active] [ref=e23]
      - navigation "Map management" [ref=e25]:
        - button "Armies & fleets" [ref=e26] [cursor=pointer]
        - button "Settlements" [ref=e30] [cursor=pointer]
        - button "Characters & agents" [ref=e34] [cursor=pointer]:
          - generic [ref=e37]: Characters
        - button "Realm progression" [ref=e38] [cursor=pointer]:
          - generic [ref=e41]: Research
        - button "Realm affairs" [ref=e42] [cursor=pointer]:
          - generic [ref=e45]:
            - text: Diplomacy
            - generic [ref=e46]: "1"
        - button "Campaign journal" [ref=e47] [cursor=pointer]
        - button "World overview" [ref=e51] [cursor=pointer]
      - generic [ref=e55]:
        - button "Zoom in" [ref=e56] [cursor=pointer]: +
        - button "Zoom out" [ref=e57] [cursor=pointer]: −
        - button "Focus selection" [ref=e58] [cursor=pointer]
        - button "Open map actions" [ref=e59] [cursor=pointer]
        - button "Map guide" [ref=e60] [cursor=pointer]: "?"
      - group:
        - generic "World map · Terrain" [ref=e61] [cursor=pointer]
  - contentinfo [ref=e62]:
    - generic [ref=e64]:
      - generic [ref=e65]: Selected army
      - strong [ref=e66]: Ashen Vanguard
      - generic [ref=e67]: 12 / 12 formations · 720 strength · 0 movement
      - button "Show selected orders" [ref=e69] [cursor=pointer]
    - region "Next-action navigation" [ref=e70]:
      - generic [ref=e71]:
        - button "Previous army needing orders" [disabled] [ref=e72]: ‹
        - button "Next army needing orders" [disabled] [ref=e73]: Next army N
        - button "Previous idle settlement" [disabled] [ref=e74]: ‹
        - button "Next idle settlement" [disabled] [ref=e75]: Next town S
      - paragraph [ref=e76]: "Labor: 4 unassigned households · 2 settlements"
      - generic [ref=e77]:
        - button "Previous settlement with unassigned households" [ref=e78] [cursor=pointer]: ‹
        - button "Next settlement with unassigned households" [ref=e79] [cursor=pointer]: Review households
    - generic [ref=e80]:
      - strong [ref=e82]: Turn 5
      - button "End turn" [ref=e83] [cursor=pointer]:
        - text: End turn
        - generic [ref=e84]: E
    - status [ref=e85]:
      - generic [aria-hidden] [ref=e86]: ◆
      - text: "Reedwatch: occupy. Keep the settlement and its buildings. Add 20 devastation and impose 3 turns of occupation. Existing production orders are cancelled. Autosaved."
  - generic [ref=e87]:
    - button "Art Lab" [ref=e88] [cursor=pointer]
    - generic [ref=e89]: Development asset inspector
```

# Test source

```ts
  1  | import { expect, type Page, type TestInfo } from '@playwright/test';
  2  | 
  3  | /** Inspect screenshot PNG pixels, not WebGL readPixels or renderer counters.
  4  |  * Call with local detail focused and dialogs/overview menu closed. The whole
  5  |  * sample must hit the original visible canvas, so DOM artwork cannot pass it. */
  6  | export async function expectLocalMapPixels(page: Page, info: TestInfo, name: string) {
  7  |   const canvas = page.locator('[data-testid=map-container] canvas');
  8  |   await expect(canvas).toBeVisible();
  9  |   const box = await canvas.boundingBox();
  10 |   if (!box) throw new Error('Map canvas has no screen bounds');
  11 |   const clip = { x: Math.floor(box.x + box.width / 2 - 60), y: Math.floor(box.y + box.height / 2 - 60), width: 120, height: 120 };
> 12 |   expect(await canvas.evaluate((element, rect) => [0, 59, 119].every(x => [0, 59, 119].every(y => document.elementFromPoint(rect.x + x, rect.y + y) === element)), clip)).toBe(true);
     |                                                                                                                                                                           ^ Error: expect(received).toBe(expected) // Object.is equality
  13 |   let png: Buffer | undefined;
  14 |   let pixels: { colors: number; nonDominantFraction: number; dominantRgb: number[] } | undefined;
  15 |   await expect.poll(async () => {
  16 |     png = await page.screenshot({ clip, animations: 'disabled' });
  17 |     pixels = await page.evaluate(async encoded => {
  18 |       const binary = atob(encoded);
  19 |       const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  20 |       const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
  21 |       const canvas = new OffscreenCanvas(image.width, image.height);
  22 |       const context = canvas.getContext('2d')!;
  23 |       context.drawImage(image, 0, 0); image.close();
  24 |       const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  25 |       const colors = new Map<number, number>();
  26 |       for (let index = 0; index < data.length; index += 4) {
  27 |         const rgb = (data[index]! << 16) | (data[index + 1]! << 8) | data[index + 2]!;
  28 |         colors.set(rgb, (colors.get(rgb) ?? 0) + 1);
  29 |       }
  30 |       const [dominant, count] = [...colors].sort((a, b) => b[1] - a[1])[0]!;
  31 |       return { colors: colors.size, nonDominantFraction: 1 - count / (canvas.width * canvas.height), dominantRgb: [dominant >> 16, (dominant >> 8) & 255, dominant & 255] };
  32 |     }, png.toString('base64'));
  33 |     return pixels.colors > 100 && pixels.nonDominantFraction > .2;
  34 |   }, { message: 'Known local terrain must produce nonblank screenshot pixels', timeout: 10000 }).toBe(true);
  35 |   await info.attach(`${name}-pixels`, { body: png!, contentType: 'image/png' });
  36 |   await info.attach(`${name}-pixels`, { body: JSON.stringify({ clip, ...pixels }, null, 2), contentType: 'application/json' });
  37 | }
  38 | 
```