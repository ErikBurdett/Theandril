import { useEffect, useId, useRef, type ReactNode } from 'react';

/** One native management window; the world stays mounted and the browser owns
 * focus containment. Inspection never issues a campaign command. */
export function CampaignWindow({ title, subtitle, children, close, returnFocus }: {
  title: string; subtitle?: string; children: ReactNode; close: () => void; returnFocus?: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element?.showModal(); heading.current?.focus({ preventScroll: true });
    return () => {
      element?.close();
      // A child window may already own focus. Never steal it during a switch.
      if (document.querySelector('dialog[open]')) return;
      const target = previous instanceof HTMLElement && previous.isConnected && previous !== document.body && previous !== document.documentElement ? previous : returnFocus;
      target?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="campaign-window" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); close(); }}>
    <header className="campaign-window-header"><div><span className="eyebrow">The realm's ledgers</span><h2 ref={heading} tabIndex={-1} id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" aria-label={`Close ${title}`} onClick={close}>×</button></header>
    <div className="campaign-window-body">{children}</div>
  </dialog>;
}

export type HudSymbol = 'armies' | 'settlements' | 'characters' | 'research' | 'diplomacy' | 'journal' | 'orders' | 'world';
const paths: Record<HudSymbol, string> = {
  armies: 'm6 3 15 18m-3-18L3 18M3 3l4 1-3 3-1-4Zm18 0-4 1 3 3 1-4ZM2 16l6 6m8-6 6 6',
  settlements: 'M3 21V10h5V5h8v5h5v11H3Zm7 0v-6h4v6M2 10h7M15 10h7M8 5l4-3 4 3',
  characters: 'M8 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 22v-4c0-6 16-6 16 0v4M9 14l3 5 3-5',
  research: 'M12 5C8 2 4 2 2 3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-2-1-6-1-10 2Zm0 0v16M5 7l4 1M15 8l4-1M5 11l4 1M15 12l4-1',
  diplomacy: 'M7 2v20m10-20v20M3 5h18M5 5 1 13h8L5 5Zm14 0-4 8h8l-4-8ZM4 22h16',
  journal: 'M5 2h14v20H5V2Zm3 4h8M8 9h8M8 13h6M8 17h8M2 5h5M2 10h5M2 15h5M2 20h5',
  orders: 'M6 3h12v19H6V3Zm4 0V1h4v2M9 8l2 2 4-4M9 14h6M9 18h6',
  world: 'M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0M2 12h20M12 2c-7 5-7 15 0 20 7-5 7-15 0-20Z',
};
export function HudIcon({ symbol }: { symbol: HudSymbol }) {
  return <svg className="hud-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><path d={paths[symbol]}/></svg>;
}
