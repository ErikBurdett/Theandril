import { useEffect, useRef, useState } from 'react';
import { LAND_POLICY_TEMPLATE_NAME_MAX, MAX_LAND_POLICY_TEMPLATES, LandPolicyTemplateStore, type LandPolicyTemplate } from '@theandril/persistence';
import { IMPROVEMENTS } from '@theandril/content';
import './land-policy-templates.css';

type TemplateStorage = Pick<LandPolicyTemplateStore, 'list' | 'create' | 'update' | 'remove' | 'close'>;

/** A panel owns its connection; leaving it must not abort an in-flight write. */
export class LandPolicyTemplateSession {
  private disposed = false;
  private working = false;
  constructor(private readonly store: TemplateStorage) {}
  get active() { return !this.disposed; }
  get pending() { return this.working; }
  async run<T>(operation: (store: TemplateStorage) => Promise<T>): Promise<T> {
    if (this.disposed) throw new Error('The land commission template panel has closed.');
    if (this.working) throw new Error('A land commission template operation is already in progress.');
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
  improvementId: string; allowance: number | undefined; reserve: number | undefined; busy: boolean;
  recall: (template: LandPolicyTemplate) => void; onPendingChange: (pending: boolean) => void;
};
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : 'Browser storage is unavailable. Retry when it is available.';

function LandPolicyTemplateLibrary({ improvementId, allowance, reserve, busy, recall, onPendingChange }: TemplateProps) {
  const [templates, setTemplates] = useState<LandPolicyTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const session = useRef<LandPolicyTemplateSession | undefined>(undefined);
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  const markPending = (value: boolean) => { setPending(value); pendingCallback.current(value); };
  const load = async (current: LandPolicyTemplateSession) => {
    if (current.pending) return;
    markPending(true); setError(''); setStatus('');
    try {
      const rows = await current.run(store => store.list());
      if (session.current !== current || !current.active) return;
      setTemplates(rows); setReady(true);
      setSelectedId(id => rows.some(row => row.id === id) ? id : '');
      setStatus(rows.length ? `${rows.length} saved land commission ${rows.length === 1 ? 'template' : 'templates'}.` : 'No land commission templates saved yet.');
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false); setError(`Land commission templates could not be loaded. ${errorMessage(cause)}`);
    } finally { if (session.current === current && current.active) markPending(false); }
  };
  const open = () => {
    if (session.current?.pending) return;
    // Dexie retains a failed open. Retry with a fresh connection after access returns.
    session.current?.close(); session.current = undefined;
    try {
      const current = new LandPolicyTemplateSession(new LandPolicyTemplateStore());
      session.current = current;
      void load(current);
    } catch (cause) {
      setReady(false); setError(`Land commission templates could not be loaded. ${errorMessage(cause)}`); markPending(false);
    }
  };
  useEffect(() => {
    open();
    return () => { session.current?.close(); session.current = undefined; pendingCallback.current(false); };
  }, []);
  const selected = templates.find(template => template.id === selectedId);
  const locked = busy || pending || !ready;
  const validValues = allowance !== undefined && reserve !== undefined && IMPROVEMENTS.some(item => item.id === improvementId);
  const validName = name.trim().length > 0 && name.trim().length <= LAND_POLICY_TEMPLATE_NAME_MAX;
  const save = async (kind: 'create' | 'update' | 'remove') => {
    const current = session.current;
    if (locked || !current || current.pending || (kind !== 'create' && !selected)) return;
    if (kind !== 'remove' && (!validName || !validValues)) return;
    const savedName = kind === 'remove' ? selected!.name : name.trim();
    let wrote = false;
    markPending(true); setError(''); setStatus('');
    try {
      const result = await current.run(async store => {
        let template: LandPolicyTemplate | undefined;
        if (kind === 'remove') await store.remove(selected!.id);
        else template = kind === 'create' ? await store.create({ name, improvementId, allowance: allowance!, reserve: reserve! })
          : await store.update(selected!.id, { name, improvementId, allowance: allowance!, reserve: reserve! });
        wrote = true;
        return { template, rows: await store.list() };
      });
      if (session.current !== current || !current.active) return;
      setTemplates(result.rows); setSelectedId(result.template?.id ?? '');
      setName(result.template?.name ?? '');
      setStatus(kind === 'remove' ? `Deleted template “${savedName}”. Existing commissions and paid work are unchanged.`
        : `${kind === 'create' ? 'Saved' : 'Updated'} template “${result.template!.name}”. No land commission orders were issued.`);
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false);
      setError(`${wrote ? 'The template change was saved, but the library could not be loaded.' : 'The template change could not be saved.'} ${errorMessage(cause)} Retry templates before continuing.`);
    } finally { if (session.current === current && current.active) markPending(false); }
  };
  return <div className="land-policy-template-library" aria-busy={pending}>
    <label>Saved land commission template<select value={selectedId} disabled={locked} onChange={event => {
      const next = templates.find(template => template.id === event.target.value);
      setSelectedId(next?.id ?? ''); setName(next?.name ?? ''); setStatus('');
    }}><option value="">Choose a saved template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
    {selected && <p className="field-help">Saved budget: {IMPROVEMENTS.find(item => item.id === selected.improvementId)?.name ?? selected.improvementId} · {selected.allowance} coin allowance per hearth · {selected.reserve} coin shared treasury reserve. Recall it to fill the commission form.</p>}
    <label>Template name<input value={name} maxLength={LAND_POLICY_TEMPLATE_NAME_MAX} disabled={locked} autoComplete="off" onChange={event => setName(event.target.value)}/></label>
    <p className="field-help">Save or update using the current improvement, allowance per hearth and shared treasury reserve. Choose a unique name, up to {LAND_POLICY_TEMPLATE_NAME_MAX} characters. Up to {MAX_LAND_POLICY_TEMPLATES} templates fit in this library.</p>
    <div className="group-selection-actions">
      <button disabled={locked || !validName || !validValues || templates.length >= MAX_LAND_POLICY_TEMPLATES} onClick={() => { void save('create'); }}>Save new template</button>
      <button disabled={locked || !selected || !validName || !validValues} onClick={() => { void save('update'); }}>Update template</button>
      <button disabled={locked || !selected} onClick={() => {
        if (locked || !selected) return;
        recall(selected); setStatus(`Recalled template “${selected.name}”. Review the improvement, budgets and checked hearths, then choose Apply land commissions to issue orders.`);
      }}>Recall template</button>
      <button disabled={locked || !selected} onClick={() => { void save('remove'); }}>Delete template</button>
    </div>
    {templates.length >= MAX_LAND_POLICY_TEMPLATES && <p className="field-help">This library is full. Update a saved template or delete one to make room.</p>}
    {!validValues && <p className="field-help">Choose an available improvement and valid whole coin amounts above to save or update. Recalling and deleting saved templates remain available.</p>}
    {pending && <p role="status">Working with land commission templates…</p>}
    {status && <p role="status">{status}</p>}
    {error && <><p className="group-order-error" role="alert">{error}</p><button disabled={busy || pending} onClick={open}>Retry templates</button></>}
  </div>;
}

export function LandPolicyTemplates(props: TemplateProps) {
  const [opened, setOpened] = useState(false);
  return <details className="land-policy-templates" data-testid="land-policy-templates" onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>Land commission templates</summary>
    <p className="field-help">Your personal template library stays in this browser across campaigns and sessions. It is separate from campaign saves and is not included in campaign exports. Saving, recalling or deleting a template issues no game orders.</p>
    {opened && <LandPolicyTemplateLibrary {...props}/>}
  </details>;
}
