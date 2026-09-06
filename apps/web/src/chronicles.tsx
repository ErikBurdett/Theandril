import { useEffect, useRef, useState } from 'react';
import type { ChronicleDocuments } from '@theandril/chronicle';

function download(text: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Full archives cross the worker boundary only when this postgame reader is opened. */
export function CampaignChronicles({ documents, error, turn, close }: { documents?: ChronicleDocuments; error: string; turn: number; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'history' | 'technical'>('history');
  const [chapter, setChapter] = useState(0);
  const [technicalTurn, setTechnicalTurn] = useState<number>();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => { if (reader.current) reader.current.scrollTop = 0; }, [chapter, technicalTurn, tab]);
  const current = documents?.history.chapters[chapter];
  const pages = documents?.history.chapters.length ?? 0;
  const technicalPages = documents?.technicalPages ?? [];
  const technicalIndex = Math.max(0, technicalPages.findIndex(page => page.turn === technicalTurn));
  const technicalPage = technicalPages[technicalIndex];
  const chooseTab = (value: 'history' | 'technical') => { setTab(value); document.getElementById(`chronicle-${value}-tab`)?.focus(); };
  return <dialog ref={dialog} className="chronicles-dialog" aria-labelledby="chronicles-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="chronicles-header"><div><span className="eyebrow">The record of a realm</span><h2 id="chronicles-title">Campaign chronicles</h2></div><button className="chronicles-close" onClick={close} aria-label="Close campaign chronicles">Close ×</button></div>
    <p className="chronicles-disclosure">The campaign has ended. These records reveal every faction’s recorded commands and events, including those hidden during play.</p>
    <div className="chronicles-tabs" role="tablist" aria-label="Chronicle format" onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); chooseTab(tab === 'history' ? 'technical' : 'history'); }
      if (event.key === 'Home') { event.preventDefault(); chooseTab('history'); }
      if (event.key === 'End') { event.preventDefault(); chooseTab('technical'); }
    }}>
      <button role="tab" id="chronicle-history-tab" aria-controls="chronicle-history-panel" aria-selected={tab === 'history'} tabIndex={tab === 'history' ? 0 : -1} onClick={() => setTab('history')}>History tome</button>
      <button role="tab" id="chronicle-technical-tab" aria-controls="chronicle-technical-panel" aria-selected={tab === 'technical'} tabIndex={tab === 'technical' ? 0 : -1} onClick={() => setTab('technical')}>Technical log</button>
    </div>
    {!documents && !error && <p className="chronicles-loading" role="status">Binding the campaign’s two chronicles…</p>}
    {error && <p className="chronicles-loading" role="alert">{error}</p>}
    {documents && <>
      {tab === 'history' ? <section role="tabpanel" id="chronicle-history-panel" aria-labelledby="chronicle-history-tab" className="chronicles-panel">
        <div className="tome-heading"><span className="eyebrow">The history tome</span><h3>{documents.history.title}</h3><p>{documents.history.subtitle}</p><p className="archive-coverage">{documents.history.coverage}</p></div>
        <div className="chapter-navigation"><label>Chapter<select aria-label="History chapter" value={chapter} onChange={event => setChapter(Number(event.target.value))}>{documents.history.chapters.map((entry, index) => <option key={index} value={index}>{index + 1}. {entry.title}</option>)}</select></label><div><button disabled={chapter === 0} onClick={() => setChapter(value => value - 1)}>Previous chapter</button><button disabled={chapter >= pages - 1} onClick={() => setChapter(value => value + 1)}>Next chapter</button></div></div>
        <div className="tome-reader" ref={reader} tabIndex={0} aria-label="History chapter text" data-testid="history-chapter">
          {current && <article><span className="chapter-number">Chapter {chapter + 1} of {pages} · Turns {current.turnFrom}–{current.turnTo}</span><h4>{current.title}</h4>{current.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</article>}
        </div>
        <div className="chronicles-download"><span>The full text contains every chapter.</span><button onClick={() => download(documents.historyText, `theandril-history-turn-${turn}.txt`, 'text/plain;charset=utf-8')}>Download history text</button></div>
      </section> : <section role="tabpanel" id="chronicle-technical-panel" aria-labelledby="chronicle-technical-tab" className="chronicles-panel">
        <p className="technical-help">Browse command attempts, domain events and battle reports by the turn in which orders were submitted. The complete JSON download also includes the initial save, campaign metadata and replay information.</p>
        <div className="chapter-navigation"><label>Turn<select aria-label="Technical turn" value={technicalPage?.turn ?? ''} disabled={!technicalPages.length} onChange={event => setTechnicalTurn(Number(event.target.value))}>{!technicalPages.length && <option value="">No recorded orders</option>}{technicalPages.map(page => <option key={page.turn} value={page.turn}>Turn {page.turn}</option>)}</select></label><div><button disabled={technicalIndex === 0} onClick={() => setTechnicalTurn(technicalPages[technicalIndex - 1]?.turn)}>Previous turn</button><button disabled={technicalIndex >= technicalPages.length - 1} onClick={() => setTechnicalTurn(technicalPages[technicalIndex + 1]?.turn)}>Next turn</button></div></div>
        <div className="technical-reader" ref={reader} tabIndex={0} aria-label="Technical log preview"><pre>{technicalPage ? technicalPage.text.slice(0, 200_000) : 'No command attempts were recorded in this archive. The full JSON preserves its initial save and available campaign metadata.'}{technicalPage && technicalPage.text.length > 200_000 ? '\n\n… This exceptionally large turn exceeds the 200,000-character reader limit. Download the full technical JSON below for every order and event.' : ''}</pre></div>
        <div className="chronicles-download"><span>{documents.technical.length.toLocaleString()} characters in the full log.</span><button onClick={() => download(documents.technical, `theandril-technical-turn-${turn}.json`, 'application/json')}>Download technical JSON</button></div>
      </section>}
    </>}
  </dialog>;
}
