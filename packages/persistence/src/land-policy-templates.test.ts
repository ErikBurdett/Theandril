import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IMPROVEMENTS } from '@theandril/content';
import { CharterTemplateStore } from './charter-templates';
import { PostingTemplateStore } from './posting-templates';
import { LandPolicyTemplateStore, MAX_LAND_POLICY_TEMPLATES, LAND_POLICY_TEMPLATE_NAME_MAX, type LandPolicyTemplate } from './land-policy-templates';

const stores: Dexie[] = [];
let serial = 0;
const input = (name = 'Terraced estates'): Omit<LandPolicyTemplate, 'id'> => ({
  name, improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 40,
});
function store(name = `land-policy-template-test-${++serial}`): LandPolicyTemplateStore {
  const db = new LandPolicyTemplateStore(name); stores.push(db); return db;
}
afterEach(async () => {
  vi.restoreAllMocks();
  const names = new Set(stores.map(db => db.name));
  for (const db of stores.splice(0)) db.close();
  for (const name of names) await Dexie.delete(name);
});

describe('personal land commission template storage', () => {
  it('stores detached named budgets, keeps identity on update and reopens without campaign data', async () => {
    const db = store();
    const saved = await db.create(input('  Terraced estates  '));
    expect(saved).toEqual({ id: expect.any(String), ...input() });
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    saved.allowance = 1; saved.name = 'Detached edit';
    expect(await db.list()).toEqual([{ id: saved.id, ...input() }]);
    const replacement = { name: '  Reserved works ', improvementId: IMPROVEMENTS[1]!.id, allowance: 0, reserve: Number.MAX_SAFE_INTEGER };
    const updated = await db.update(saved.id, replacement);
    expect(updated).toEqual({ id: saved.id, ...replacement, name: 'Reserved works' });
    const listed = await db.list(); listed[0]!.reserve = 0;
    expect(await db.list()).toEqual([updated]);
    expect(db.tables.map(table => table.name)).toEqual(['landPolicyTemplates']);
    db.close();
    const reopened = store(db.name);
    expect(await reopened.list()).toEqual([updated]);
    await reopened.remove(saved.id);
    expect(await reopened.list()).toEqual([]);
  });

  it('accepts every shipped improvement and both exact integer boundaries independently', async () => {
    const db = store();
    for (const [index, improvement] of IMPROVEMENTS.entries()) {
      const saved = await db.create({ name: `Improvement ${index}`, improvementId: improvement.id, allowance: Number.MAX_SAFE_INTEGER, reserve: 0 });
      expect(saved).toMatchObject({ improvementId: improvement.id, allowance: Number.MAX_SAFE_INTEGER, reserve: 0 });
      expect(await db.update(saved.id, { ...input(), name: saved.name, improvementId: improvement.id, allowance: 0, reserve: Number.MAX_SAFE_INTEGER }))
        .toMatchObject({ allowance: 0, reserve: Number.MAX_SAFE_INTEGER });
      await db.remove(saved.id);
    }
  });

  it('rejects invalid budgets, unknown improvements and campaign fields without overwriting stored values', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('landPolicyTemplates').toArray();
    const invalid: unknown[] = [
      null, {}, { ...input(), name: '' }, { ...input(), name: '   ' }, { ...input(), name: 'x'.repeat(LAND_POLICY_TEMPLATE_NAME_MAX + 1) },
      { ...input(), improvementId: 'none' }, { ...input(), improvementId: 'improvement.future' }, { ...input(), improvementId: 42 },
      { ...input(), id: saved.id }, { ...input(), version: 1 }, { ...input(), factionId: 'faction.1' }, { ...input(), settlementId: 'settlement.65' },
      { ...input(), cell: 300 }, { ...input(), extra: true },
      ...['allowance', 'reserve'].flatMap(field => [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, Infinity, '10', null, undefined]
        .map(value => ({ ...input(), [field]: value }))),
    ];
    for (const value of invalid) {
      await expect(db.create(value as Omit<LandPolicyTemplate, 'id'>)).rejects.toThrow('template name');
      await expect(db.update(saved.id, value as Omit<LandPolicyTemplate, 'id'>)).rejects.toThrow('template name');
      expect(await db.table('landPolicyTemplates').toArray()).toEqual(before);
    }
    const maximum = await db.create(input('x'.repeat(LAND_POLICY_TEMPLATE_NAME_MAX)));
    expect(maximum.name).toHaveLength(LAND_POLICY_TEMPLATE_NAME_MAX);
    for (const id of ['', 'bad-id', crypto.randomUUID()]) {
      await expect(db.update(id, input('Changed'))).rejects.toThrow('no longer exists');
      await expect(db.remove(id)).rejects.toThrow('no longer exists');
    }
    expect(await db.list()).toHaveLength(2);
  });

  it('enforces trimmed case-insensitive names, allows a case-only self rename and lists stable name order', async () => {
    const db = store(), first = await db.create(input('Hearth reserves'));
    const second = await db.create(input('Terraces'));
    await expect(db.create(input('  HEARTH RESERVES  '))).rejects.toThrow('already uses that name');
    await expect(db.update(second.id, input('hearth reserves'))).rejects.toThrow('already uses that name');
    expect(await db.update(first.id, { ...input('HEARTH RESERVES'), allowance: 0 })).toMatchObject({ id: first.id, name: 'HEARTH RESERVES', allowance: 0 });
    expect((await db.list()).map(row => row.name)).toEqual(['HEARTH RESERVES', 'Terraces']);
  });

  it('serializes concurrent connections so duplicate names and the last library slot cannot race', async () => {
    const first = store(), second = store(first.name);
    const duplicates = await Promise.allSettled([first.create(input('Same name')), second.create(input(' SAME NAME '))]);
    expect(duplicates.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(duplicates.filter(result => result.status === 'rejected')).toHaveLength(1);
    for (let index = 1; index < MAX_LAND_POLICY_TEMPLATES - 1; index++) await first.create(input(`Policy ${index}`));
    const lastSlot = await Promise.allSettled([first.create(input('Last A')), second.create(input('Last B'))]);
    expect(lastSlot.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(lastSlot.filter(result => result.status === 'rejected')).toHaveLength(1);
    const full = await first.list();
    expect(full).toHaveLength(MAX_LAND_POLICY_TEMPLATES);
    await expect(first.create(input('Overflow'))).rejects.toThrow('holds 24 templates');
    expect(await second.list()).toEqual(full);
    await first.update(full[0]!.id, input('Renamed at capacity'));
    await second.remove(full[0]!.id);
    await first.create(input('Replacement'));
    expect(await first.list()).toHaveLength(MAX_LAND_POLICY_TEMPLATES);
    expect(await second.list()).toEqual(await first.list());
  });

  it('fails closed for corrupt, unsupported and campaign-bearing rows without repairing or deleting them', async () => {
    const db = store(), saved = await db.create(input());
    const original = await db.table('landPolicyTemplates').get(saved.id) as Record<string, unknown>;
    const badRows = [
      { ...original, version: 2 }, { ...original, extra: true }, { ...original, name: ' untrimmed ' },
      { ...original, nameKey: 'incorrect' }, { ...original, improvementId: 'none' }, { ...original, improvementId: 'improvement.future' },
      { ...original, allowance: -1 }, { ...original, allowance: Number.MAX_SAFE_INTEGER + 1 }, { ...original, reserve: 0.25 },
      { ...original, factionId: 'faction.1' }, { ...original, settlementId: 'settlement.65' },
    ];
    for (const row of badRows) {
      await db.table('landPolicyTemplates').put(row);
      const before = await db.table('landPolicyTemplates').toArray();
      await expect(db.list()).rejects.toThrow('invalid or from a newer version');
      await expect(db.create(input('New'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.update(saved.id, input('Changed'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.remove(saved.id)).rejects.toThrow('invalid or from a newer version');
      expect(await db.table('landPolicyTemplates').toArray()).toEqual(before);
    }
    await db.table('landPolicyTemplates').put(original);
    expect(await db.list()).toEqual([saved]);
  });

  it('detects an oversized injected library without deleting excess rows', async () => {
    const db = store();
    await db.table('landPolicyTemplates').bulkAdd(Array.from({ length: MAX_LAND_POLICY_TEMPLATES + 1 }, (_, index) => ({
      version: 1, id: crypto.randomUUID(), ...input(`Injected ${index}`), nameKey: `injected ${index}`,
    })));
    const before = await db.table('landPolicyTemplates').toArray();
    await expect(db.list()).rejects.toThrow('invalid or from a newer version');
    await expect(db.create(input())).rejects.toThrow('invalid or from a newer version');
    await expect(db.update(before[0].id, input())).rejects.toThrow('invalid or from a newer version');
    await expect(db.remove(before[0].id)).rejects.toThrow('invalid or from a newer version');
    expect(await db.table('landPolicyTemplates').toArray()).toEqual(before);
  });

  it('rolls back real writes on transaction failure and permits retry after a rejected quota write', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('landPolicyTemplates').toArray();
    await expect(db.transaction('rw', db.table('landPolicyTemplates'), async () => {
      await db.update(saved.id, { ...input('Uncommitted'), allowance: 0 });
      await db.create(input('Uncommitted addition'));
      await db.remove(saved.id);
      throw new DOMException('Authored quota failure after writes', 'QuotaExceededError');
    })).rejects.toThrow('quota');
    expect(await db.table('landPolicyTemplates').toArray()).toEqual(before);
    const hook = () => { throw new DOMException('Authored write denied', 'QuotaExceededError'); };
    db.table('landPolicyTemplates').hook('updating', hook);
    await expect(db.update(saved.id, input('Denied'))).rejects.toThrow('write denied');
    db.table('landPolicyTemplates').hook('updating').unsubscribe(hook);
    expect(await db.list()).toEqual([saved]);
    expect(await db.update(saved.id, input('Retried'))).toMatchObject({ id: saved.id, name: 'Retried' });
  });

  it('recovers the retained library through a fresh connection after browser access denial', async () => {
    const db = store(), saved = await db.create(input()); db.close();
    const failing = store(db.name);
    const denied = vi.spyOn(indexedDB, 'open').mockImplementationOnce(() => { throw new DOMException('Authored browser denial', 'SecurityError'); });
    await expect(failing.list()).rejects.toThrow('Authored browser denial');
    denied.mockRestore(); failing.close();
    const retry = store(db.name);
    expect(await retry.list()).toEqual([saved]);
    expect(await retry.update(saved.id, input('Available again'))).toMatchObject({ id: saved.id, name: 'Available again' });
  });

  it('refuses newer database versions even with compatible rows and rechecks after reopening', async () => {
    const db = store(); await db.create(input());
    const before = await db.table('landPolicyTemplates').toArray(); db.close();
    const future = new Dexie(db.name); stores.push(future);
    future.version(2).stores({ landPolicyTemplates: '&id,&nameKey' });
    await future.open(); future.close();
    await expect(db.open()).rejects.toThrow('invalid or from a newer version'); db.close();
    const writing = store(db.name);
    await expect(writing.create(input('Forbidden'))).rejects.toThrow('invalid or from a newer version'); writing.close();
    await future.open();
    expect(future.backendDB().version).toBe(20);
    expect(await future.table('landPolicyTemplates').toArray()).toEqual(before);
  });

  it('uses its own default database without upgrading or altering legacy campaign and other preference databases', async () => {
    // Raw old campaign data is deliberately opaque here: the personal store
    // must not open the campaign database, migrate it, or inspect its payload.
    const legacy = new Dexie('theandril-campaigns'); stores.push(legacy);
    legacy.version(1).stores({ saves: '++id,kind' });
    const legacyRow = { id: 1, kind: 'manual', payload: 'opaque legacy save sentinel' };
    await legacy.table('saves').add(legacyRow);
    const charters = new CharterTemplateStore(); stores.push(charters);
    const charter = await charters.create({ name: 'Charters', focus: 'works', ceiling: 24 });
    const postings = new PostingTemplateStore(); stores.push(postings);
    const posting = await postings.create({ name: 'Postings', mode: 'hold', destination: 'current' });
    const db = store('theandril-land-policy-templates');
    expect(db.name).not.toBe(legacy.name); expect(db.name).not.toBe(charters.name); expect(db.name).not.toBe(postings.name);
    const defaultStore = new LandPolicyTemplateStore(); stores.push(defaultStore);
    expect(defaultStore.name).toBe(db.name);
    const saved = await db.create(input());
    await db.update(saved.id, { ...input('Updated'), allowance: 0 }); await db.remove(saved.id);
    expect(legacy.backendDB().version).toBe(10);
    expect(legacy.tables.map(table => table.name)).toEqual(['saves']);
    expect(await legacy.table('saves').toArray()).toEqual([legacyRow]);
    expect(charters.backendDB().version).toBe(10); expect(await charters.list()).toEqual([charter]);
    expect(postings.backendDB().version).toBe(10); expect(await postings.list()).toEqual([posting]);
    expect(await db.list()).toEqual([]);
  });
});
