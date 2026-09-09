import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './map-actions.css';

export type MapActionChoice = { id: string; kind: 'army' | 'settlement' | 'tile'; label: string; summary?: string };
export type MapActionTab = { id: string; label: string; render: () => ReactNode };
export type MapActionsProps = {
  sessionKey: string | number;
  /** CSS client coordinates, not world/canvas coordinates. */
  anchor: { x: number; y: number };
  title: string;
  subtitle?: string;
  /** Unit quick actions can use less chrome; city management keeps the default shell. */
  presentation?: 'default' | 'compact';
  choices: readonly MapActionChoice[];
  selectedId: string;
  onSelect: (id: string) => void;
  tabs: readonly MapActionTab[];
  initialTab?: string;
  /** Attention shortcuts reveal the requested pane, not offscreen context chrome. */
  revealContent?: boolean;
  summary?: ReactNode;
  onClose: (reason: 'close' | 'escape' | 'outside') => void;
  returnFocus?: HTMLElement | null;
  /** A native character/progression dialog owns input; retain this pane underneath. */
  suspended?: boolean;
  onManageInPanel?: () => void;
  manageLabel?: string;
};

type Viewport = { width: number; height: number; left?: number; top?: number };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;

/** A footer may sit above the viewport bottom in normal flow (or be offscreen). */
export function mapActionsBottomInset(viewport: Pick<Viewport, 'height' | 'top'>, footer?: { top: number; bottom: number }): number {
  const top = viewport.top ?? 0, bottom = top + viewport.height;
  if (!footer || footer.bottom <= footer.top || footer.bottom <= top || footer.top >= bottom) return 0;
  return clamp(bottom - footer.top, 0, viewport.height);
}

/** Reserve the actual top HUD edge, including any gap above its visible rows. */
export function mapActionsTopInset(viewport: Pick<Viewport, 'height' | 'top'>, header?: { top: number; bottom: number }): number {
  const top = viewport.top ?? 0, bottom = top + viewport.height;
  if (!header || header.bottom <= header.top || header.bottom <= top || header.top >= bottom) return 0;
  return clamp(header.bottom - top, 0, viewport.height);
}

/** Bounded local presentation geometry; never inspects world cells or game rules. */
export function mapActionsPosition(anchor: MapActionsProps['anchor'], viewport: Viewport, size: { width: number; height: number }, bottomInset = 0, topInset = 0) {
  const margin = 8, leftEdge = (viewport.left ?? 0) + margin, viewportTop = viewport.top ?? 0;
  const topEdge = viewportTop + Math.max(0, topInset) + margin;
  const width = Math.min(size.width, Math.max(1, viewport.width - margin * 2));
  const narrow = viewport.width <= 600;
  // A height cap limits the scroll surface, not the part of the viewport in
  // which it may be placed. Small panels can still sit beside lower map units.
  const bottom = viewportTop + viewport.height - Math.max(0, bottomInset) - margin;
  const availableHeight = Math.max(1, bottom - topEdge);
  const maxHeight = narrow ? availableHeight : Math.min(availableHeight, 680, viewport.height * .75);
  const height = Math.min(size.height, maxHeight);
  const right = leftEdge + viewport.width - margin * 2;
  const x = finite(anchor.x, leftEdge), y = finite(anchor.y, topEdge);
  return {
    width,
    left: narrow ? leftEdge : clamp(x + 12 + width <= right ? x + 12 : x - width - 12, leftEdge, right - width),
    top: narrow ? bottom - height : clamp(y + 12 + height <= bottom ? y + 12 : y - height - 12, topEdge, bottom - height),
    maxHeight,
  };
}

export function mapActionTabIndex(count: number, current: number, key: string): number | null {
  if (!count) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowRight') return (current + 1) % count;
  if (key === 'ArrowLeft') return (current + count - 1) % count;
  return null;
}

type TabState = { selectionKey: string; id: string | undefined };
/** A changed choice is a fresh context, even if the player immediately returns. */
export function mapActionTabState(previous: TabState, selectionKey: string, initialTab?: string): TabState {
  return previous.selectionKey === selectionKey ? previous : { selectionKey, id: initialTab };
}

/** One non-modal surface and one live management consumer, supplied by the shell. */
export function MapActions(props: MapActionsProps) {
  const { sessionKey, anchor, title, subtitle, presentation = 'default', choices, selectedId, onSelect, tabs, initialTab, summary, suspended = false, onManageInPanel, manageLabel = 'Manage in side panel' } = props;
  const id = useId(), headingId = `mapActionsHeading-${id}`, paneId = `mapActionsPane-${id}`;
  const selectionKey = JSON.stringify([sessionKey, selectedId]);
  const [storedTab, setStoredTab] = useState({ selectionKey, id: initialTab });
  const tabState = mapActionTabState(storedTab, selectionKey, initialTab);
  // Adjust local state before committing children, not after a stale pane/query
  // has mounted. The identical-key branch terminates this render adjustment.
  if (tabState !== storedTab) setStoredTab(tabState);
  const activeIndex = Math.max(0, tabs.findIndex(tab => tab.id === tabState.id));
  const active = tabs[activeIndex];
  const panel = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null), body = useRef<HTMLDivElement>(null);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const latest = useRef(props); latest.current = props;
  const focusedSession = useRef<string | number | null>(null), opener = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState(() => {
    const width = typeof window === 'undefined' ? 1024 : window.innerWidth;
    return mapActionsPosition(anchor, { width, height: typeof window === 'undefined' ? 768 : window.innerHeight }, { width: width <= 600 ? width - 16 : presentation === 'compact' ? 320 : 420, height: 500 });
  });

  useEffect(() => {
    const host = panel.current;
    if (!host || suspended) return;
    const commandBar = document.querySelector<HTMLElement>('.command-bar');
    const topBar = document.querySelector<HTMLElement>('.campaign-topbar');
    const application = document.querySelector<HTMLElement>('.application');
    const measure = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? innerWidth, height = viewport?.height ?? innerHeight;
      const bottomInset = mapActionsBottomInset({ height, top: viewport?.offsetTop }, commandBar?.getBoundingClientRect());
      const topInset = mapActionsTopInset({ height, top: viewport?.offsetTop }, topBar?.getBoundingClientRect());
      const rect = host.getBoundingClientRect();
      const next = mapActionsPosition(latest.current.anchor, { width, height, left: viewport?.offsetLeft, top: viewport?.offsetTop }, { width: width <= 600 ? width - 16 : latest.current.presentation === 'compact' ? 320 : 420, height: rect.height }, bottomInset, topInset);
      setPosition(old => old.width === next.width && old.left === next.left && old.top === next.top && old.maxHeight === next.maxHeight ? old : next);
    };
    measure();
    const resize = new ResizeObserver(measure); resize.observe(host);
    if (commandBar) resize.observe(commandBar);
    if (topBar) resize.observe(topBar);
    if (application) resize.observe(application);
    // Observe both HUD edges at every width; the footer's measured box also
    // includes a selected-entity dock nested within it. Heights alone miss gaps.
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    window.visualViewport?.addEventListener('resize', measure); window.visualViewport?.addEventListener('scroll', measure);
    return () => { resize.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure); window.visualViewport?.removeEventListener('resize', measure); window.visualViewport?.removeEventListener('scroll', measure); };
  }, [anchor.x, anchor.y, suspended, presentation]);

  useEffect(() => {
    if (suspended || focusedSession.current === sessionKey) return;
    focusedSession.current = sessionKey;
    const candidate = latest.current.returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (candidate && !panel.current?.contains(candidate)) opener.current = candidate;
    else if (!opener.current?.isConnected) opener.current = null;
    heading.current?.focus({ preventScroll: true });
  }, [sessionKey, suspended]);
  // Only explicit attention reveals follow the final measured HUD allocation;
  // ordinary map inspectors retain their scroll position when the HUD resizes.
  const revealHeight = props.revealContent ? position.maxHeight : 0;
  useEffect(() => {
    const scroller = body.current, pane = scroller?.querySelector<HTMLElement>('[role="tabpanel"]');
    if (!scroller) return;
    const top = props.revealContent && active?.id === initialTab && pane
      ? scroller.scrollTop + pane.getBoundingClientRect().top - scroller.getBoundingClientRect().top : 0;
    scroller.scrollTo({ top });
  }, [selectionKey, active?.id, initialTab, props.revealContent, revealHeight]);

  const dismiss = (reason: 'close' | 'escape' | 'outside') => {
    latest.current.onClose(reason);
    // Outside clicks retain their native destination; modal/panel switches own focus.
    if (reason !== 'outside' && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  };
  const dismissRef = useRef(dismiss); dismissRef.current = dismiss;
  useEffect(() => {
    const dialogOwnsInput = () => latest.current.suspended || Boolean(document.querySelector('dialog[open]'));
    const outside = (event: PointerEvent) => {
      if (dialogOwnsInput() || !panel.current || event.composedPath().includes(panel.current)) return;
      dismissRef.current('outside');
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || dialogOwnsInput()) return;
      event.preventDefault(); event.stopPropagation(); dismissRef.current('escape');
    };
    document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true); };
  }, []);

  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = mapActionTabIndex(tabs.length, activeIndex, event.key);
    if (next === null) return;
    event.preventDefault(); setStoredTab({ selectionKey, id: tabs[next]!.id }); tabButtons.current[next]?.focus();
  };
  const choice = choices.find(item => item.id === selectedId);
  const surface = <section ref={panel} className={`map-actions${presentation === 'compact' ? ' map-actions-compact' : ''}`} data-testid="map-actions" data-presentation={presentation} role="dialog" aria-modal="false" aria-labelledby={headingId} hidden={suspended}
    style={{ width: position.width, left: position.left, top: position.top, maxHeight: position.maxHeight }}
    onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()} onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()} onContextMenu={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()}>
    <header className="map-actions-heading"><div>{presentation !== 'compact' && <span className="eyebrow">Map orders</span>}<h2 ref={heading} id={headingId} tabIndex={-1}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="map-actions-close" aria-label="Close map actions" onClick={() => dismiss('close')}>×</button></header>
    <div ref={body} className="map-actions-body">
      {choices.length > 1 && <label className="map-actions-context">At this location<select aria-label="Inspect at this location" value={selectedId} onChange={event => onSelect(event.target.value)}>{choices.map(item => <option key={item.id} value={item.id}>{item.kind === 'army' ? 'Army' : item.kind === 'settlement' ? 'Settlement' : 'Tile'} — {item.label}</option>)}</select></label>}
      {choice?.summary && <p className="map-actions-choice-summary">{choice.summary}</p>}
      {summary && <div className="map-actions-summary">{summary}</div>}
      {tabs.length > 0 && <><div className="map-actions-tabs" role="tablist" aria-label="Selected entity management">{tabs.map((tab, index) => <button key={tab.id} ref={element => { tabButtons.current[index] = element; }} type="button" role="tab" id={`mapActionsTab-${id}-${index}`} aria-controls={paneId} aria-selected={index === activeIndex} tabIndex={index === activeIndex ? 0 : -1} onKeyDown={changeTab} onClick={() => setStoredTab({ selectionKey, id: tab.id })}>{tab.label}</button>)}</div>
        <section key={active!.id} className="map-actions-pane" role="tabpanel" id={paneId} aria-labelledby={`mapActionsTab-${id}-${activeIndex}`} tabIndex={0}>{active!.render()}</section></>}
    </div>
    {onManageInPanel && <footer className="map-actions-footer"><button type="button" onClick={onManageInPanel}>{manageLabel}</button></footer>}
  </section>;
  // Escape map clipping, but retain the application's user-selected text scale.
  // This is only the panel, never a click-blocking viewport backdrop.
  return typeof document === 'undefined' ? surface : createPortal(surface, document.querySelector('.application') ?? document.body);
}
