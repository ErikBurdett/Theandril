import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LandPolicyTemplate } from '@theandril/persistence';
import { LandPolicyTemplates, LandPolicyTemplateSession } from './land-policy-templates';
import { getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { GroupLandPolicyOrders } from './group-land-policies';

const template: LandPolicyTemplate = { id: 'policy.works', name: 'Village fields', improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 40 };
function storage() {
  return {
    list: vi.fn(async (): Promise<LandPolicyTemplate[]> => [template]),
    create: vi.fn(async (): Promise<LandPolicyTemplate> => template),
    update: vi.fn(async (): Promise<LandPolicyTemplate> => template),
    remove: vi.fn(async () => {}),
    close: vi.fn(),
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('land commission template panel lifetime', () => {
  it('lets a started write settle after navigation without closing its database transaction early', async () => {
    const db = storage(), session = new LandPolicyTemplateSession(db), write = deferred<LandPolicyTemplate>();
    db.create.mockImplementationOnce(() => write.promise);
    const pending = session.run(store => store.create({ name: template.name, improvementId: template.improvementId, allowance: template.allowance, reserve: template.reserve }));
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
    const oldDb = storage(), old = new LandPolicyTemplateSession(oldDb), read = deferred<LandPolicyTemplate[]>();
    oldDb.list.mockImplementationOnce(() => read.promise);
    const previousRead = old.run(store => store.list());
    const duplicate = vi.fn(async () => []);
    await expect(old.run(duplicate)).rejects.toThrow('already in progress');
    expect(duplicate).not.toHaveBeenCalled();
    old.close();
    const currentDb = storage(), current = new LandPolicyTemplateSession(currentDb);
    expect(await current.run(store => store.list())).toEqual([template]);
    read.resolve([]); await previousRead;
    expect(old.active).toBe(false); expect(current.active).toBe(true);
    expect(currentDb.close).not.toHaveBeenCalled();
    current.close(); expect(currentDb.close).toHaveBeenCalledTimes(1);
  });

  it('preserves storage errors and releases the lock for explicit retry', async () => {
    const db = storage(), session = new LandPolicyTemplateSession(db), failure = new Error('Malformed stored template');
    db.list.mockRejectedValueOnce(failure);
    await expect(session.run(store => store.list())).rejects.toBe(failure);
    expect(session.active).toBe(true); expect(session.pending).toBe(false);
    expect(db.close).not.toHaveBeenCalled();
    expect(await session.run(store => store.list())).toEqual([template]);
    session.close(); expect(db.close).toHaveBeenCalledTimes(1);
  });

  it('settles a failed in-flight write before closing and never replays it on a new session', async () => {
    const db = storage(), session = new LandPolicyTemplateSession(db);
    let reject!: (error: Error) => void;
    db.remove.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const pending = session.run(store => store.remove(template.id));
    const outcome = expect(pending).rejects.toThrow('Storage access lost');
    session.close(); expect(db.close).not.toHaveBeenCalled();
    reject(new Error('Storage access lost')); await outcome;
    expect(db.remove).toHaveBeenCalledTimes(1); expect(db.close).toHaveBeenCalledTimes(1);
    const nextDb = storage(), next = new LandPolicyTemplateSession(nextDb);
    expect(await next.run(store => store.list())).toEqual([template]);
    expect(nextDb.remove).not.toHaveBeenCalled(); next.close();
  });

  it('keeps a completed write distinct from a subsequent failed library read', async () => {
    const db = storage(), session = new LandPolicyTemplateSession(db);
    db.list.mockRejectedValueOnce(new Error('Library read failed'));
    let wrote = false;
    await expect(session.run(async store => {
      await store.create({ name: template.name, improvementId: template.improvementId, allowance: template.allowance, reserve: template.reserve });
      wrote = true;
      return store.list();
    })).rejects.toThrow('Library read failed');
    expect(wrote).toBe(true); expect(session.pending).toBe(false);
    expect(await session.run(store => store.list())).toEqual([template]);
    expect(db.create).toHaveBeenCalledTimes(1);
    session.close();
  });

  it('starts collapsed, explains browser-only persistence and does not recall during render', () => {
    const recall = vi.fn(), busy = vi.fn();
    const html = renderToStaticMarkup(<LandPolicyTemplates improvementId={template.improvementId} allowance={100} reserve={40} busy={false} recall={recall} onPendingChange={busy}/>);
    expect(html).toContain('<summary>Land commission templates</summary>');
    expect(html).not.toContain(' open=');
    expect(html).toContain('not included in campaign exports');
    expect(html).toContain('issues no game orders');
    expect(recall).not.toHaveBeenCalled(); expect(busy).not.toHaveBeenCalled();
  });

  it('offers the library without a selected hearth and keeps it outside historical campaigns', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId), before = stateHash(game);
    const issue = vi.fn(async () => []), accepted = vi.fn(), pending = vi.fn();
    const props = { view, hash: before, selected: new Set<string>(), matching: new Set<string>(), busy: false, issue, accepted, onPendingChange: pending };
    const html = renderToStaticMarkup(<GroupLandPolicyOrders {...props}/>);
    expect(html).toContain('data-testid="land-policy-templates"');
    expect(html).toContain('Land commission templates');
    expect(html).toContain('<button class="primary" disabled="">Apply land commissions (0)</button>');
    expect(html).toContain('not included in campaign exports');
    expect(issue).not.toHaveBeenCalled(); expect(accepted).not.toHaveBeenCalled(); expect(pending).not.toHaveBeenCalled();
    expect(stateHash(game)).toBe(before);
    delete view.landPolicies;
    expect(renderToStaticMarkup(<GroupLandPolicyOrders {...props}/>)).toBe('');
  });
});
