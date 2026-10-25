import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PostingTemplate } from '@theandril/persistence';
import { PostingTemplates, PostingTemplateSession } from './posting-templates';

const template: PostingTemplate = { id: 'policy.guard', name: 'Home watch', mode: 'hold', destination: 'hearth' };
function storage() {
  return {
    list: vi.fn(async (): Promise<PostingTemplate[]> => [template]),
    create: vi.fn(async (): Promise<PostingTemplate> => template),
    update: vi.fn(async (): Promise<PostingTemplate> => template),
    remove: vi.fn(async () => {}),
    close: vi.fn(),
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('posting template panel lifetime', () => {
  it('lets a started write settle after navigation without closing its database transaction early', async () => {
    const db = storage(), session = new PostingTemplateSession(db), write = deferred<PostingTemplate>();
    db.create.mockImplementationOnce(() => write.promise);
    const pending = session.run(store => store.create({ name: template.name, mode: template.mode, destination: template.destination }));
    expect(session.pending).toBe(true);
    session.close(); session.close();
    expect(session.active).toBe(false);
    expect(db.close).not.toHaveBeenCalled();
    write.resolve(template);
    expect(await pending).toEqual(template);
    expect(db.close).toHaveBeenCalledTimes(1);
    expect(session.pending).toBe(false);
    const stale = vi.fn(async () => []);
    await expect(session.run(stale)).rejects.toThrow('panel has closed');
    expect(stale).not.toHaveBeenCalled();
  });

  it('rejects overlapping storage actions and keeps a new mount independent from late old replies', async () => {
    const oldDb = storage(), old = new PostingTemplateSession(oldDb), read = deferred<PostingTemplate[]>();
    oldDb.list.mockImplementationOnce(() => read.promise);
    const previousRead = old.run(store => store.list());
    const duplicate = vi.fn(async () => []);
    await expect(old.run(duplicate)).rejects.toThrow('already in progress');
    expect(duplicate).not.toHaveBeenCalled();
    old.close();
    const currentDb = storage(), current = new PostingTemplateSession(currentDb);
    expect(await current.run(store => store.list())).toEqual([template]);
    read.resolve([]); await previousRead;
    expect(old.active).toBe(false); expect(current.active).toBe(true);
    expect(currentDb.close).not.toHaveBeenCalled();
    current.close(); expect(currentDb.close).toHaveBeenCalledTimes(1);
  });

  it('preserves storage errors and releases the lock for explicit retry', async () => {
    const db = storage(), session = new PostingTemplateSession(db), failure = new Error('Malformed stored template');
    db.list.mockRejectedValueOnce(failure);
    await expect(session.run(store => store.list())).rejects.toBe(failure);
    expect(session.active).toBe(true); expect(session.pending).toBe(false);
    expect(db.close).not.toHaveBeenCalled();
    expect(await session.run(store => store.list())).toEqual([template]);
    session.close(); expect(db.close).toHaveBeenCalledTimes(1);
  });

  it('starts collapsed, explains browser-only persistence and does not recall during render', () => {
    const recall = vi.fn(), busy = vi.fn();
    const html = renderToStaticMarkup(<PostingTemplates mode="hold" destination="current" busy={false} recall={recall} onPendingChange={busy}/>);
    expect(html).toContain('<summary>Posting templates</summary>');
    expect(html).not.toContain(' open=');
    expect(html).toContain('not included in campaign exports');
    expect(html).toContain('issues no game orders');
    expect(recall).not.toHaveBeenCalled(); expect(busy).not.toHaveBeenCalled();
  });
});
