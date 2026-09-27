import { useEffect, useRef, useState } from 'react';
import { BUILDINGS, UNITS } from '@theandril/content';
import { MAX_PRODUCTION_TEMPLATES, PRODUCTION_TEMPLATE_NAME_MAX, ProductionTemplateStore, type ProductionTemplate } from '@theandril/persistence';

type TemplateStorage = Pick<ProductionTemplateStore, 'list' | 'create' | 'update' | 'remove' | 'close'>;
const names = new Map([...BUILDINGS, ...UNITS].map(item => [item.id, item.name]));

/** Navigation retires the session without aborting its already-started transaction. */
export class ProductionTemplateSession {
  private disposed = false;
  private working = false;
  constructor(private readonly store: TemplateStorage) {}
  get active() { return !this.disposed; }
  get pending() { return this.working; }
  async run<T>(operation: (store: TemplateStorage) => Promise<T>): Promise<T> {
    if (this.disposed) throw new Error('The production template panel has closed.');
    if (this.working) throw new Error('A production template operation is already in progress.');
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

type TemplateProps = { itemIds: readonly string[]; valid: boolean; busy: boolean; recall: (template: ProductionTemplate) => void };
const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : 'Browser storage is unavailable. Retry when it is available.';

function ProductionTemplateLibrary({ itemIds, valid, busy, recall }: TemplateProps) {
  const [templates, setTemplates] = useState<ProductionTemplate[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const session = useRef<ProductionTemplateSession | undefined>(undefined);
  const load = async (current: ProductionTemplateSession) => {
    if (current.pending) return;
    setPending(true); setError(''); setStatus('');
    try {
      const rows = await current.run(store => store.list());
      if (session.current !== current || !current.active) return;
      setTemplates(rows); setReady(true);
      setSelectedId(id => rows.some(row => row.id === id) ? id : '');
      setStatus(rows.length ? `${rows.length} saved production ${rows.length === 1 ? 'template' : 'templates'}.` : 'No production templates saved yet.');
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false); setError(`Production templates could not be loaded. ${errorMessage(cause)}`);
    } finally { if (session.current === current && current.active) setPending(false); }
  };
  const open = () => {
    if (session.current?.pending) return;
    setError(''); setStatus(''); setPending(true);
    // Dexie caches a failed open; restored access requires a fresh connection.
    session.current?.close(); session.current = undefined;
    try {
      const current = new ProductionTemplateSession(new ProductionTemplateStore());
      session.current = current;
      void load(current);
    } catch (cause) {
      setReady(false); setError(`Production templates could not be loaded. ${errorMessage(cause)}`); setPending(false);
    }
  };
  useEffect(() => {
    open();
    return () => { session.current?.close(); session.current = undefined; };
  }, []);
  const selected = templates.find(template => template.id === selectedId);
  const locked = busy || pending || !ready;
  const validName = name.trim().length > 0 && name.trim().length <= PRODUCTION_TEMPLATE_NAME_MAX;
  const save = async (kind: 'create' | 'update' | 'remove') => {
    const current = session.current;
    if (locked || !current || current.pending || (kind !== 'create' && !selected)) return;
    if (kind !== 'remove' && (!validName || !valid)) return;
    const input = { name, itemIds: [...itemIds] };
    const savedName = kind === 'remove' ? selected!.name : name.trim();
    let wrote = false;
    setPending(true); setError(''); setStatus('');
    try {
      const result = await current.run(async store => {
        let template: ProductionTemplate | undefined;
        if (kind === 'remove') await store.remove(selected!.id);
        else template = kind === 'create' ? await store.create(input) : await store.update(selected!.id, input);
        wrote = true;
        return { template, rows: await store.list() };
      });
      if (session.current !== current || !current.active) return;
      setTemplates(result.rows); setSelectedId(result.template?.id ?? ''); setName(result.template?.name ?? '');
      setStatus(kind === 'remove' ? `Deleted template “${savedName}”. Existing production is unchanged.`
        : `${kind === 'create' ? 'Saved' : 'Updated'} template “${result.template!.name}”. No production orders were issued.`);
    } catch (cause) {
      if (session.current !== current || !current.active) return;
      setReady(false);
      setError(`${wrote ? 'The template change was saved, but the library could not be loaded.' : 'The template change could not be saved.'} ${errorMessage(cause)} Retry production templates before continuing with the library.`);
    } finally { if (session.current === current && current.active) setPending(false); }
  };
  return <div className="production-template-library" aria-busy={pending}>
    <label>Saved production template<select value={selectedId} disabled={locked} onChange={event => {
      const next = templates.find(template => template.id === event.target.value);
      setSelectedId(next?.id ?? ''); setName(next?.name ?? ''); setStatus('');
    }}><option value="">Choose a saved template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
    {selected && <p className="field-help">Saved sequence: {selected.itemIds.map(id => names.get(id) ?? id).join(' → ')}. Recall it to fill the editor.</p>}
    <label>Production template name<input value={name} maxLength={PRODUCTION_TEMPLATE_NAME_MAX} disabled={locked} autoComplete="off" onChange={event => setName(event.target.value)}/></label>
    <p className="field-help">Save or update using the current ordered list. Choose a unique name, up to {PRODUCTION_TEMPLATE_NAME_MAX} characters. Up to {MAX_PRODUCTION_TEMPLATES} templates fit in this library.</p>
    <div className="group-selection-actions">
      <button disabled={locked || !validName || !valid || templates.length >= MAX_PRODUCTION_TEMPLATES} onClick={() => { void save('create'); }}>Save production template</button>
      <button disabled={locked || !selected || !validName || !valid} onClick={() => { void save('update'); }}>Update production template</button>
      <button disabled={locked || !selected} onClick={() => {
        if (locked || !selected) return;
        recall({ ...selected, itemIds: [...selected.itemIds] });
        setStatus(`Recalled template “${selected.name}”. Review the sequence, then choose Apply production to issue orders.`);
      }}>Recall production template</button>
      <button disabled={locked || !selected} onClick={() => { void save('remove'); }}>Delete production template</button>
    </div>
    {templates.length >= MAX_PRODUCTION_TEMPLATES && <p className="field-help">This library is full. Update a saved template or delete one to make room.</p>}
    {!valid && <p className="field-help">Add a valid sequence above to save or update. Recalling and deleting saved templates remain available.</p>}
    {pending && <p role="status">Working with production templates…</p>}
    {status && <p role="status">{status}</p>}
    {error && <><p className="group-order-error" role="alert">{error}</p><p className="field-help">Direct sequence editing and Apply production remain available.</p><button disabled={busy || pending} onClick={open}>Retry production templates</button></>}
  </div>;
}

export function ProductionTemplates(props: TemplateProps) {
  const [opened, setOpened] = useState(false);
  return <details className="production-templates" data-testid="production-templates" onToggle={event => { if (event.currentTarget.open) setOpened(true); }}>
    <summary>Production templates</summary>
    <p className="field-help">Your personal template library stays in this browser across campaigns and sessions. It is separate from campaign saves and is not included in campaign exports. Saving, selecting, updating, recalling or deleting a template issues no game orders.</p>
    {opened && <ProductionTemplateLibrary {...props}/>}
  </details>;
}
