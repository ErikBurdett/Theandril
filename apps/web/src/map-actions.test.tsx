import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapActions, mapActionsBottomInset, mapActionsTopInset, mapActionsPosition, mapActionTabIndex, mapActionTabState, type MapActionsProps } from './map-actions';

function props(overrides: Partial<MapActionsProps> = {}): MapActionsProps {
  return {
    sessionKey: 'campaign.1:open.1', anchor: { x: 640, y: 350 }, title: 'Lantern ferry', selectedId: 'army.1',
    choices: [{ id: 'army.1', kind: 'army', label: 'Lantern ferry', summary: '3 actual formations · 2 movement' }, { id: 'town.1', kind: 'settlement', label: 'Hearth' }, { id: 'tile.24', kind: 'tile', label: 'Shore at 24' }],
    onSelect: () => { throw new Error('Presentation must not select during render.'); }, onClose: () => { throw new Error('Presentation must not close during render.'); },
    tabs: [{ id: 'actions', label: 'Actions', render: () => <button>Move on map</button> }, { id: 'land', label: 'Land', render: () => <button disabled>Claim tile · actual blocker</button> }],
    ...overrides,
  };
}

describe('map action surface', () => {
  it('has named non-modal navigation, real location choices and exactly one mounted management pane', () => {
    let inactiveCalls = 0;
    const html = renderToStaticMarkup(<MapActions {...props({ tabs: [{ id: 'actions', label: 'Actions', render: () => <button>Move on map</button> }, { id: 'land', label: 'Land', render: () => { inactiveCalls++; return <p>Duplicate query consumer</p>; } }], onManageInPanel: () => undefined })}/>);
    expect(inactiveCalls).toBe(0);
    expect(html).toContain('role="dialog" aria-modal="false"');
    expect(html).toContain('Inspect at this location'); expect(html).toContain('Settlement — Hearth'); expect(html).toContain('Tile — Shore at 24');
    expect(html.match(/role="tabpanel"/g)).toHaveLength(1); expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('Move on map'); expect(html).toContain('Manage in side panel'); expect(html).toContain('Close map actions');
    expect(html).not.toContain('Duplicate query consumer');
  });
  it('can open a tile directly at Land, preserving actual disabled controls and caller summaries', () => {
    const html = renderToStaticMarkup(<MapActions {...props({ initialTab: 'land', selectedId: 'tile.24', summary: <p>Known shore; no foreign private facts.</p> })}/>);
    expect(html).toContain('Claim tile · actual blocker'); expect(html).toContain('disabled=""');
    expect(html).not.toContain('Move on map'); expect(html).toContain('Known shore');
  });
  it('offers an optional 320px compact unit shell with the same named controls and only the supplied quick-action pane', () => {
    let inactiveCalls = 0;
    const supplied = props({ presentation: 'compact', summary: <p>3 formations · no movement</p>, onManageInPanel: () => undefined, manageLabel: 'Open full orders',
      tabs: [{ id: 'actions', label: 'Actions', render: () => <button disabled>Move on map</button> },
        { id: 'route', label: 'Route', render: () => { inactiveCalls++; return <button>Queue reviewed route</button>; } }] });
    const html = renderToStaticMarkup(<MapActions {...supplied}/>);
    expect(html).toContain('class="map-actions map-actions-compact"'); expect(html).toContain('data-presentation="compact"');
    expect(html).toContain('style="width:320px;');
    expect(html).toContain('Lantern ferry'); expect(html).toContain('Close map actions');
    expect(html).toContain('Inspect at this location'); expect(html.match(/<option /g)).toHaveLength(3);
    expect(html).toContain('3 formations · no movement'); expect(html).toContain('<button disabled="">Move on map</button>');
    expect(html).toContain('Open full orders'); expect(html).not.toContain('Manage in side panel');
    expect(html.match(/role="tabpanel"/g)).toHaveLength(1); expect(inactiveCalls).toBe(0);
    const normal = renderToStaticMarkup(<MapActions {...props({ onManageInPanel: () => undefined })}/>);
    expect(normal).toContain('data-presentation="default"'); expect(normal).toContain('style="width:420px;');
    expect(normal).toContain('Map orders'); expect(normal).toContain('Manage in side panel');
    expect(normal).not.toContain('map-actions-compact');
  });
  it('can open a compact long-route confirmation directly and retain it while suspended for a modal', () => {
    const html = renderToStaticMarkup(<MapActions {...props({ presentation: 'compact', initialTab: 'route', suspended: true,
      tabs: [{ id: 'actions', label: 'Actions', render: () => { throw new Error('The inactive quick-action pane must not mount.'); } },
        { id: 'route', label: 'Route', render: () => <><p>Actual reviewed route · 9 movement</p><button>Queue route</button></> }] })}/>);
    expect(html).toContain('hidden=""'); expect(html).toContain('Actual reviewed route · 9 movement'); expect(html).toContain('Queue route');
    expect(html.match(/role="tabpanel"/g)).toHaveLength(1); expect(html).toContain('aria-modal="false"');
  });
  it('uses a safe first pane if an initial tab was removed and permits no management tabs', () => {
    expect(renderToStaticMarkup(<MapActions {...props({ initialTab: 'retired' })}/>)).toContain('Move on map');
    const html = renderToStaticMarkup(<MapActions {...props({ tabs: [], choices: [] })}/>);
    expect(html).not.toContain('role="tablist"'); expect(html).not.toContain('role="tabpanel"'); expect(html).toContain('Close map actions');
  });
  it('retains the mounted pane but hides input while a native modal owns the session', () => {
    const html = renderToStaticMarkup(<MapActions {...props({ suspended: true, initialTab: 'land' })}/>);
    expect(html).toContain('hidden=""'); expect(html).toContain('Claim tile · actual blocker');
    expect(html).not.toContain('aria-modal="true"');
  });
  it('provides unique heading/tab/pane references even if more than one surface is rendered', () => {
    const html = renderToStaticMarkup(<><MapActions {...props()}/><MapActions {...props()}/></>);
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length); expect(ids.filter(id => id!.startsWith('mapActionsHeading'))).toHaveLength(2);
    for (const match of html.matchAll(/aria-(?:labelledby|controls)="([^"]+)"/g)) expect(ids).toContain(match[1]);
  });
  it('wraps local keyboard tabs without taking typing, vertical arrows or Tab navigation', () => {
    expect(mapActionTabIndex(3, 0, 'ArrowLeft')).toBe(2); expect(mapActionTabIndex(3, 2, 'ArrowRight')).toBe(0);
    expect(mapActionTabIndex(3, 1, 'Home')).toBe(0); expect(mapActionTabIndex(3, 1, 'End')).toBe(2);
    for (const key of ['ArrowUp', 'ArrowDown', 'Tab', 'n', 'Escape']) expect(mapActionTabIndex(3, 1, key)).toBeNull();
    expect(mapActionTabIndex(0, 0, 'ArrowRight')).toBeNull();
  });
  it('resets A→B→A without a tab click in B, while command publications retain the same context', () => {
    const a = { selectionKey: 'session1:armyA', id: 'officers' };
    expect(mapActionTabState(a, a.selectionKey, 'actions')).toBe(a);
    const b = mapActionTabState(a, 'session1:townB', 'production');
    expect(b.id).toBe('production');
    const again = mapActionTabState(b, a.selectionKey, 'actions');
    expect(again.id).toBe('actions');
    expect(mapActionTabState(again, again.selectionKey, 'hex')).toBe(again);
    expect(mapActionTabState(again, 'session2:armyA', 'hex').id).toBe('hex');
  });
  it('bounds desktop pointer corners and a narrow sheet above a dynamically sized footer', () => {
    for (const width of [320, 390, 600, 850, 1280]) for (const height of [480, 844, 1000]) for (const inset of [0, 80, 180]) {
      const size = { width: Math.min(420, width - 16), height: 640 };
      for (const anchor of [{ x: 0, y: 0 }, { x: width, y: height }, { x: width / 2, y: height / 2 }, { x: -1000, y: 2000 }]) {
        const actual = mapActionsPosition(anchor, { width, height }, size, inset);
        expect(actual.left).toBeGreaterThanOrEqual(8); expect(actual.left + size.width).toBeLessThanOrEqual(width - 8);
        expect(actual.top).toBeGreaterThanOrEqual(8); expect(actual.top + Math.min(size.height, actual.maxHeight)).toBeLessThanOrEqual(height - inset - 8);
        if (width <= 600) expect(actual.top + Math.min(size.height, actual.maxHeight)).toBe(height - inset - 8);
        else { expect(actual.maxHeight).toBeLessThanOrEqual(680); expect(actual.maxHeight).toBeLessThanOrEqual(height * .75); }
      }
    }
    const shifted = mapActionsPosition({ x: 200, y: 200 }, { width: 390, height: 500, top: 100, left: 20 }, { width: 374, height: 700 }, 90);
    expect(shifted).toEqual({ width: 374, left: 28, top: 108, maxHeight: 394 });
    expect(mapActionsPosition({ x: 700, y: 600 }, { width: 1440, height: 1000 }, { width: 420, height: 1100 }).maxHeight).toBe(680);
    expect(mapActionsPosition({ x: 400, y: 300 }, { width: 900, height: 600 }, { width: 420, height: 1100 }).maxHeight).toBe(450);
  });
  it('reserves the real footer top rather than assuming its bottom reaches the viewport edge', () => {
    const viewport = { width: 390, height: 844 };
    // Actual failed browser geometry: the Art Lab strip sits below this footer.
    const footer = { top: 675.375, bottom: 797 };
    const reserve = mapActionsBottomInset(viewport, footer);
    expect(reserve).toBe(168.625);
    expect(reserve).toBeGreaterThan(footer.bottom - footer.top);
    const position = mapActionsPosition({ x: 170, y: 400 }, viewport, { width: 374, height: 900 }, reserve);
    expect(position.top + position.maxHeight).toBe(footer.top - 8);
    // A page scroll moves the same-height normal-flow bar; remeasure its edge.
    const scrolled = { top: footer.top + 60, bottom: footer.bottom + 60 };
    expect(mapActionsBottomInset(viewport, scrolled)).toBe(108.625);
    expect(mapActionsBottomInset(viewport, { top: 900, bottom: 1020 })).toBe(0);
    expect(mapActionsBottomInset(viewport, { top: -150, bottom: -30 })).toBe(0);
    expect(mapActionsBottomInset(viewport, { top: 20, bottom: 20 })).toBe(0);
    expect(mapActionsBottomInset({ top: 100, height: 500 }, { top: 550, bottom: 680 })).toBe(50);
  });
  it('places short desktop panels beside low map anchors instead of treating the scroll-height cap as a viewport edge', () => {
    const actual = mapActionsPosition({ x: 700, y: 700 }, { width: 1440, height: 1000 }, { width: 320, height: 200 });
    expect(actual.maxHeight).toBe(680);
    expect(actual.top).toBe(712);
    expect(actual.top + 200).toBeLessThanOrEqual(992);
    expect(actual.top).toBeGreaterThan(actual.maxHeight);
    const above = mapActionsPosition({ x: 700, y: 950 }, { width: 1440, height: 1000 }, { width: 320, height: 200 });
    expect(above.top).toBe(738);
  });
  it('measures the complete visible top HUD including its gap and clipped visual viewport', () => {
    expect(mapActionsTopInset({ height: 844 }, { top: 12, bottom: 104 })).toBe(104);
    expect(mapActionsTopInset({ height: 844 }, { top: -20, bottom: 72 })).toBe(72);
    expect(mapActionsTopInset({ top: 100, height: 500 }, { top: 80, bottom: 150 })).toBe(50);
    for (const header of [undefined, { top: -100, bottom: -1 }, { top: 844, bottom: 950 }, { top: 20, bottom: 20 }]) {
      expect(mapActionsTopInset({ height: 844 }, header)).toBe(0);
    }
  });
  it('keeps both shell widths between measured HUD edges on desktop, mobile and keyboard-sized visual viewports', () => {
    for (const width of [320, 390, 600, 850, 1440]) for (const height of [480, 844, 1000]) for (const header of [0, 72, 116]) for (const footer of [0, 80, 180]) {
      for (const requestedWidth of [320, 420]) for (const requestedHeight of [160, 640, 1100]) {
        const viewport = { width, height, top: 30, left: 20 };
        const topInset = mapActionsTopInset(viewport, header ? { top: 30, bottom: 30 + header } : undefined);
        const bottomInset = mapActionsBottomInset(viewport, footer ? { top: 30 + height - footer, bottom: 30 + height } : undefined);
        const size = { width: requestedWidth, height: requestedHeight };
        for (const anchor of [{ x: 0, y: 0 }, { x: width / 2, y: height / 2 }, { x: width + 20, y: height + 30 }]) {
          const actual = mapActionsPosition(anchor, viewport, size, bottomInset, topInset);
          expect(actual.left).toBeGreaterThanOrEqual(28);
          expect(actual.left + actual.width).toBeLessThanOrEqual(20 + width - 8);
          expect(actual.top).toBeGreaterThanOrEqual(30 + header + 8);
          expect(actual.top + Math.min(size.height, actual.maxHeight)).toBeLessThanOrEqual(30 + height - footer - 8);
          expect(actual.maxHeight).toBeLessThanOrEqual(height - header - footer - 16);
        }
      }
    }
  });
});
