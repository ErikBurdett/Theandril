import { useEffect, useRef, useState } from 'react';
import { CHARTER_TEMPLATE_NAME_MAX, MAX_CHARTER_TEMPLATES, CharterTemplateStore, type CharterTemplate } from '@theandril/persistence';
import { CHARTER_NAMES, type CharterFocus } from '@theandril/sim';

type TemplateStorage = Pick<CharterTemplateStore, 'list' | 'create' | 'update' | 'remove' | 'close'>;

/** A panel owns its connection; leaving it must not abort an in-flight write. */
export class CharterTemplateSession {
  private disposed = false;
  private working = false;
  constructor(private readonly store: TemplateStorage) {}
  get active() { return !this.disposed; }
  get pending() { return this.working; }
  async run<T>(operation: (store: TemplateStorage) => Promise<T>): Promise<T> {
    if (this.disposed) throw new Error('The charter template panel has closed.');
    if (this.working) throw new Error('A charter template operation is already in progress.');
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
  focus: CharterFocus; ceiling: number | undefined; busy: boolean;
  recall: (template: CharterTemplate) => void; onPendingChange: (pending: boolean) => void;
};
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : 'Browser storage is unavailable. Retry when it is available.';

function CharterTemplateLibrary({ focus, ceiling, busy, recall, onPendingChange }: TemplateProps) {
  const [templates, setTemplates] = useState<CharterTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const session = useRef<CharterTemplateSession | undefined>(undefined);
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  const markPending = (value: boolean) => { setPending(value); pendingCallback.current(value); };
  const load = async (current: CharterTemplateSession) => {
    if (current.pending) return;
    markPending(true); setError(''); setStatus('');
    try {
      const rows = await current.run(store => store.list());
      if (session.current !== current || !current.active) return;
      setTemplates(rows); setReady(true);
      setSelectedId(id => rows.some(row => row.id === id) ? id : '');
      setStatus(rows.length ? `${rows.length} saved charter ${rows.length === 1 ? 'template' : 'templates'}.` : 'No charter templates saved yet.');
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false); setError(`Charter templates could not be loaded. ${errorMessage(cause)}`);
    } finally { if (session.current === current && current.active) markPending(false); }
  };
  const open = () => {
    if (session.current?.pending) return;
    // Dexie retains a failed open. Retry with a fresh connection after access returns.
    session.current?.close(); session.current = undefined;
    try {
      const current = new CharterTemplateSession(new CharterTemplateStore());
      session.current = current;
      void load(current);
    } catch (cause) {
      setReady(false); setError(`Charter templates could not be loaded. ${errorMessage(cause)}`); markPending(false);
    }
  };
  useEffect(() => {
    open();
    return () => { session.current?.close(); session.current = undefined; pendingCallback.current(false); };
  }, []);
  const selected = templates.find(template => template.id === selectedId);
  const locked = busy || pending || !ready;
  const validName = name.trim().length > 0 && name.trim().length <= CHARTER_TEMPLATE_NAME_MAX;
  const save = async (kind: 'create' | 'update' | 'remove') => {
    const current = session.current;
    if (locked || !current || current.pending || (kind !== 'create' && !selected)) return;
    if (kind !== 'remove' && (!validName || ceiling === undefined)) return;
    const savedName = kind === 'remove' ? selected!.name : name.trim();
    let wrote = false;
    markPending(true); setError(''); setStatus('');
    try {
      const result = await current.run(async store => {
        let template: CharterTemplate | undefined;
        if (kind === 'remove') await store.remove(selected!.id);
        else template = kind === 'create' ? await store.create({ name, focus, ceiling: ceiling! })
          : await store.update(selected!.id, { name, focus, ceiling: ceiling! });
        wrote = true;
        return { template, rows: await store.list() };
      });
      if (session.current !== current || !current.active) return;
      setTemplates(result.rows); setSelectedId(result.template?.id ?? '');
      setName(result.template?.name ?? '');
      setStatus(kind === 'remove' ? `Deleted template “${savedName}”. Existing charters are unchanged.`
        : `${kind === 'create' ? 'Saved' : 'Updated'} template “${result.template!.name}”. No charter orders were issued.`);
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false);
      setError(`${wrote ? 'The template change was saved, but the library could not be loaded.' : 'The template change could not be saved.'} ${errorMessage(cause)} Retry templates before continuing.`);
    } finally { if (session.current === current && current.active) markPending(false); }
  };
  return <div className="charter-template-library" aria-busy={pending}>
    <label>Saved charter template<select value={selectedId} disabled={locked} onChange={event => {
      const next = templates.find(template => template.id === event.target.value);
      setSelectedId(next?.id ?? ''); setName(next?.name ?? ''); setStatus('');
    }}><option value="">Choose a saved template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
    {selected && <p className="field-help">Saved policy: {CHARTER_NAMES[selected.focus]} · {selected.ceiling} coin per work. Recall it to fill the charter form.</p>}
    <label>Template name<input value={name} maxLength={CHARTER_TEMPLATE_NAME_MAX} disabled={locked} autoComplete="off" onChange={event => setName(event.target.value)}/></label>
    <p className="field-help">Save or update using the current charter focus and coin ceiling. Choose a unique name, up to {CHARTER_TEMPLATE_NAME_MAX} characters. Up to {MAX_CHARTER_TEMPLATES} templates fit in this library.</p>
    <div className="group-selection-actions">
      <button disabled={locked || !validName || ceiling === undefined || templates.length >= MAX_CHARTER_TEMPLATES} onClick={() => { void save('create'); }}>Save new template</button>
      <button disabled={locked || !selected || !validName || ceiling === undefined} onClick={() => { void save('update'); }}>Update template</button>
      <button disabled={locked || !selected} onClick={() => {
        if (locked || !selected) return;
        recall(selected); setStatus(`Recalled template “${selected.name}”. Review the policy, then choose Apply charters to issue orders.`);
      }}>Recall template</button>
      <button disabled={locked || !selected} onClick={() => { void save('remove'); }}>Delete template</button>
    </div>
    {templates.length >= MAX_CHARTER_TEMPLATES && <p className="field-help">This library is full. Update a saved template or delete one to make room.</p>}
    {ceiling === undefined && <p className="field-help">Enter a valid coin ceiling above to save or update. Recalling and deleting saved templates remain available.</p>}
    {pending && <p role="status">Working with charter templates…</p>}
    {status && <p role="status">{status}</p>}
    {error && <><p className="group-order-error" role="alert">{error}</p><button disabled={busy || pending} onClick={open}>Retry templates</button></>}
  </div>;
}

export function CharterTemplates(props: TemplateProps) {
  const [opened, setOpened] = useState(false);
  return <details className="charter-templates" data-testid="charter-templates" onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>Charter templates</summary>
    <p className="field-help">Your personal template library stays in this browser across campaigns and sessions. It is separate from campaign saves and is not included in campaign exports. Saving, recalling or deleting a template issues no game orders.</p>
    {opened && <CharterTemplateLibrary {...props}/>}
  </details>;
}
