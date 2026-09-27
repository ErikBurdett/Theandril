import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProductionTemplate } from '@theandril/persistence';
import { ProductionTemplates, ProductionTemplateSession } from './production-templates';

const template: ProductionTemplate = { id: 'sequence.watch', name: 'Village watch', itemIds: ['unit.guard', 'building.workshop', 'unit.guard'] };
function storage() {
  return { list: vi.fn(async (): Promise<ProductionTemplate[]> => [template]), create: vi.fn(async (): Promise<ProductionTemplate> => template),
    update: vi.fn(async (): Promise<ProductionTemplate> => template), remove: vi.fn(async () => {}), close: vi.fn() };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('production template library lifetime', () => {
  it('lets a started preference write settle after navigation without aborting its transaction', async () => {
    const db = storage(), session = new ProductionTemplateSession(db), write = deferred<ProductionTemplate>();
    db.create.mockImplementationOnce(() => write.promise);
    const pending = session.run(store => store.create({ name: template.name, itemIds: [...template.itemIds] }));
    session.close(); session.close();
    expect(session.active).toBe(false); expect(session.pending).toBe(true); expect(db.close).not.toHaveBeenCalled();
    write.resolve(template); expect(await pending).toEqual(template);
    expect(db.close).toHaveBeenCalledTimes(1); expect(session.pending).toBe(false);
    const stale = vi.fn(async () => []);
    await expect(session.run(stale)).rejects.toThrow('panel has closed'); expect(stale).not.toHaveBeenCalled();
  });

  it('rejects overlapping actions and keeps a replacement mount independent of a late old read', async () => {
    const oldDb = storage(), old = new ProductionTemplateSession(oldDb), read = deferred<ProductionTemplate[]>();
    oldDb.list.mockImplementationOnce(() => read.promise);
    const pending = old.run(store => store.list());
    const duplicate = vi.fn(async () => []);
    await expect(old.run(duplicate)).rejects.toThrow('already in progress'); expect(duplicate).not.toHaveBeenCalled();
    old.close();
    const newDb = storage(), current = new ProductionTemplateSession(newDb);
    expect(await current.run(store => store.list())).toEqual([template]);
    read.resolve([]); await pending;
    expect(old.active).toBe(false); expect(current.active).toBe(true);
    expect(oldDb.close).toHaveBeenCalledTimes(1); expect(newDb.close).not.toHaveBeenCalled();
    current.close(); expect(newDb.close).toHaveBeenCalledTimes(1);
  });

  it('preserves failed storage errors and permits fresh-connection retry without reusing the failed connection', async () => {
    const failedDb = storage(), failed = new ProductionTemplateSession(failedDb), error = new Error('Storage denied');
    failedDb.list.mockRejectedValue(error);
    await expect(failed.run(store => store.list())).rejects.toBe(error);
    expect(failed.pending).toBe(false); failed.close(); expect(failedDb.close).toHaveBeenCalledTimes(1);
    const restoredDb = storage(), restored = new ProductionTemplateSession(restoredDb);
    expect(await restored.run(store => store.list())).toEqual([template]);
    expect(failedDb.list).toHaveBeenCalledTimes(1);
    restored.close();
  });

  it('starts collapsed without storage access or preference recall and explains the campaign boundary', () => {
    const recall = vi.fn();
    const html = renderToStaticMarkup(<ProductionTemplates itemIds={template.itemIds} valid busy={false} recall={recall}/>);
    expect(html).toContain('<summary>Production templates</summary>'); expect(html).not.toContain(' open=');
    expect(html).toContain('not included in campaign exports'); expect(html).toContain('issues no game orders');
    expect(html).not.toContain('Saved production template<select'); expect(recall).not.toHaveBeenCalled();
  });
});
