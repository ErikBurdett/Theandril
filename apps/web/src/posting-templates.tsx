import { useEffect, useRef, useState } from 'react';
import { POSTING_TEMPLATE_NAME_MAX, MAX_POSTING_TEMPLATES, PostingTemplateStore, type PostingTemplate } from '@theandril/persistence';
import type { PostingMode } from '@theandril/sim';

type TemplateStorage = Pick<PostingTemplateStore, 'list' | 'create' | 'update' | 'remove' | 'close'>;

/** A panel owns its connection; leaving it must not abort an in-flight write. */
export class PostingTemplateSession {
  private disposed = false;
  private working = false;
  constructor(private readonly store: TemplateStorage) {}
  get active() { return !this.disposed; }
  get pending() { return this.working; }
  async run<T>(operation: (store: TemplateStorage) => Promise<T>): Promise<T> {
    if (this.disposed) throw new Error('The posting template panel has closed.');
    if (this.working) throw new Error('A posting template operation is already in progress.');
    this.working = true;
    try { return await operation(this.store); }
    finally { this.working = false; if (this.disposed) this.store.close(); }
  }
  close() {
    if (this.disposed) return;
    this.disposed = true;
    if (!this.working) this.store.close();
  }
}

type TemplateProps = {
  mode: PostingMode; destination: 'current' | 'hearth' | undefined; busy: boolean;
  recall: (template: PostingTemplate) => void; onPendingChange: (pending: boolean) => void;
};
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : 'Browser storage is unavailable. Retry when it is available.';

function PostingTemplateLibrary({ mode, destination, busy, recall, onPendingChange }: TemplateProps) {
  const [templates, setTemplates] = useState<PostingTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const session = useRef<PostingTemplateSession | undefined>(undefined);
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  const markPending = (value: boolean) => { setPending(value); pendingCallback.current(value); };
  const load = async (current: PostingTemplateSession) => {
    if (current.pending) return;
    markPending(true); setError(''); setStatus('');
    try {
      const rows = await current.run(store => store.list());
      if (session.current !== current || !current.active) return;
      setTemplates(rows); setReady(true);
      setSelectedId(id => rows.some(row => row.id === id) ? id : '');
      setStatus(rows.length ? `${rows.length} saved posting ${rows.length === 1 ? 'template' : 'templates'}.` : 'No posting templates saved yet.');
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false); setError(`Posting templates could not be loaded. ${errorMessage(cause)}`);
    } finally { if (session.current === current && current.active) markPending(false); }
  };
  const open = () => {
    if (session.current?.pending) return;
    // Dexie retains a failed open. Retry with a fresh connection after access returns.
    session.current?.close(); session.current = undefined;
    try {
      const current = new PostingTemplateSession(new PostingTemplateStore());
      session.current = current;
      void load(current);
    } catch (cause) {
      setReady(false); setError(`Posting templates could not be loaded. ${errorMessage(cause)}`); markPending(false);
    }
  };
  useEffect(() => {
    open();
    return () => { session.current?.close(); session.current = undefined; pendingCallback.current(false); };
  }, []);
  const selected = templates.find(template => template.id === selectedId);
  const locked = busy || pending || !ready;
  const validName = name.trim().length > 0 && name.trim().length <= POSTING_TEMPLATE_NAME_MAX;
  const save = async (kind: 'create' | 'update' | 'remove') => {
    const current = session.current;
    if (locked || !current || current.pending || (kind !== 'create' && !selected)) return;
    if (kind !== 'remove' && (!validName || destination === undefined)) return;
    const savedName = kind === 'remove' ? selected!.name : name.trim();
    let wrote = false;
    markPending(true); setError(''); setStatus('');
    try {
      const result = await current.run(async store => {
        let template: PostingTemplate | undefined;
        if (kind === 'remove') await store.remove(selected!.id);
        else template = kind === 'create' ? await store.create({ name, mode, destination: destination! })
          : await store.update(selected!.id, { name, mode, destination: destination! });
        wrote = true;
        return { template, rows: await store.list() };
      });
      if (session.current !== current || !current.active) return;
      setTemplates(result.rows); setSelectedId(result.template?.id ?? '');
      setName(result.template?.name ?? '');
      setStatus(kind === 'remove' ? `Deleted template “${savedName}”. Existing postings are unchanged.`
        : `${kind === 'create' ? 'Saved' : 'Updated'} template “${result.template!.name}”. No posting orders were issued.`);
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false);
      setError(`${wrote ? 'The template change was saved, but the library could not be loaded.' : 'The template change could not be saved.'} ${errorMessage(cause)} Retry templates before continuing.`);
    } finally { if (session.current === current && current.active) markPending(false); }
  };
  return <div className="charter-template-library posting-template-library" aria-busy={pending}>
    <label>Saved posting template<select value={selectedId} disabled={locked} onChange={event => {
      const next = templates.find(template => template.id === event.target.value);
      setSelectedId(next?.id ?? ''); setName(next?.name ?? ''); setStatus('');
    }}><option value="">Choose a saved template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
    {selected && <p className="field-help">Saved order: {selected.mode === 'hold' ? 'Hold the hex' : 'Join the force there'} · {selected.destination === 'current' ? 'where each army stands' : 'choose an owned hearth after recall'}.</p>}
    <label>Template name<input value={name} maxLength={POSTING_TEMPLATE_NAME_MAX} disabled={locked} autoComplete="off" onChange={event => setName(event.target.value)}/></label>
    <p className="field-help">Save or update using the arrival order and destination policy above. Hearth templates require a fresh choice of hearth each time you recall them. Choose a unique name, up to {POSTING_TEMPLATE_NAME_MAX} characters. Up to {MAX_POSTING_TEMPLATES} templates fit in this library.</p>
    <div className="group-selection-actions">
      <button disabled={locked || !validName || destination === undefined || templates.length >= MAX_POSTING_TEMPLATES} onClick={() => { void save('create'); }}>Save new template</button>
      <button disabled={locked || !selected || !validName || destination === undefined} onClick={() => { void save('update'); }}>Update template</button>
      <button disabled={locked || !selected} onClick={() => {
        if (locked || !selected) return;
        recall(selected); setStatus(`Recalled template “${selected.name}”. Review the destination and arrival order, then choose Post selected armies to issue orders.`);
      }}>Recall template</button>
      <button disabled={locked || !selected} onClick={() => { void save('remove'); }}>Delete template</button>
    </div>
    {templates.length >= MAX_POSTING_TEMPLATES && <p className="field-help">This library is full. Update a saved template or delete one to make room.</p>}
    {destination === undefined && <p className="field-help">Choose a destination above to save or update. Recalling and deleting saved templates remain available.</p>}
    {pending && <p role="status">Working with posting templates…</p>}
    {status && <p role="status">{status}</p>}
    {error && <><p className="group-order-error" role="alert">{error}</p><button disabled={busy || pending} onClick={open}>Retry templates</button></>}
  </div>;
}

export function PostingTemplates(props: TemplateProps) {
  const [opened, setOpened] = useState(false);
  return <details className="charter-templates posting-templates" data-testid="posting-templates" onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>Posting templates</summary>
    <p className="field-help">Your personal template library stays in this browser across campaigns and sessions. It stores no armies or map coordinates and is not included in campaign exports. Saving, recalling or deleting a template issues no game orders.</p>
    {opened && <PostingTemplateLibrary {...props}/>}
  </details>;
}
