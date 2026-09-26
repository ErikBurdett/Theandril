import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { CHARTER_CEILING_MAX, CHARTER_CEILING_MIN } from '@theandril/sim';
import { CharterTemplateStore, MAX_CHARTER_TEMPLATES, CHARTER_TEMPLATE_NAME_MAX, type CharterTemplate } from './charter-templates';

const stores: Dexie[] = [];
let serial = 0;
const input = (name = 'Quiet hearths'): Omit<CharterTemplate, 'id'> => ({ name, focus: 'works', ceiling: 24 });
function store(name = `charter-template-test-${++serial}`): CharterTemplateStore {
  const db = new CharterTemplateStore(name); stores.push(db); return db;
}
afterEach(async () => {
  const names = new Set(stores.map(db => db.name));
  for (const db of stores.splice(0)) db.close();
  for (const name of names) await Dexie.delete(name);
});

describe('personal charter template storage', () => {
  it('stores detached named policies in a separate preferences database, and reopens without campaign data', async () => {
    const db = store();
    const saved = await db.create(input('  Hearth works  '));
    expect(saved).toEqual({ id: expect.any(String), name: 'Hearth works', focus: 'works', ceiling: 24 });
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    saved.name = 'Changed detached result';
    expect((await db.list())[0]!.name).toBe('Hearth works');
    const changed = await db.update(saved.id, { name: '  Scholar hearths ', focus: 'learning', ceiling: CHARTER_CEILING_MAX });
    expect(changed.id).toBe(saved.id);
    const listed = await db.list(); listed[0]!.ceiling = 1;
    expect(await db.list()).toEqual([changed]);
    expect(db.tables.map(table => table.name)).toEqual(['charterTemplates']);
    db.close();
    const reopened = store(db.name);
    expect(await reopened.list()).toEqual([changed]);
    await reopened.remove(saved.id);
    expect(await reopened.list()).toEqual([]);
    const defaultStore = new CharterTemplateStore();
    expect(defaultStore.name).toBe('theandril-preferences');
    defaultStore.close();
  });

  it('validates exact input and canonical focus/ceiling bounds without overwriting the old policy', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('charterTemplates').toArray();
    const invalid: unknown[] = [
      null, {}, { ...input(), name: '' }, { ...input(), name: '   ' }, { ...input(), name: 'x'.repeat(CHARTER_TEMPLATE_NAME_MAX + 1) },
      { ...input(), focus: 'none' }, { ...input(), focus: 'invented' }, { ...input(), ceiling: CHARTER_CEILING_MIN - 1 },
      { ...input(), ceiling: CHARTER_CEILING_MAX + 1 }, { ...input(), ceiling: 12.5 }, { ...input(), ceiling: Number.NaN },
      { ...input(), ceiling: '24' }, { ...input(), id: saved.id }, { ...input(), extra: true },
    ];
    for (const value of invalid) {
      await expect(db.create(value as Omit<CharterTemplate, 'id'>)).rejects.toThrow('template name');
      await expect(db.update(saved.id, value as Omit<CharterTemplate, 'id'>)).rejects.toThrow('template name');
      expect(await db.table('charterTemplates').toArray()).toEqual(before);
    }
    const maximum = await db.create({ name: 'x'.repeat(CHARTER_TEMPLATE_NAME_MAX), focus: 'muster', ceiling: CHARTER_CEILING_MIN });
    expect(maximum.name).toHaveLength(CHARTER_TEMPLATE_NAME_MAX);
    for (const id of ['', 'bad-id', crypto.randomUUID()]) {
      await expect(db.update(id, input('Changed'))).rejects.toThrow('no longer exists');
      await expect(db.remove(id)).rejects.toThrow('no longer exists');
    }
    expect(await db.list()).toHaveLength(2);
  });

  it('enforces trimmed case-insensitive names on create and rename while allowing a case-only self rename', async () => {
    const db = store(), first = await db.create(input('Harbor works'));
    const second = await db.create(input('Scholars'));
    await expect(db.create(input('  HARBOR WORKS  '))).rejects.toThrow('already uses that name');
    await expect(db.update(second.id, input('harbor works'))).rejects.toThrow('already uses that name');
    expect(await db.update(first.id, { name: 'HARBOR WORKS', focus: 'wealth', ceiling: 12 })).toMatchObject({ id: first.id, name: 'HARBOR WORKS' });
    expect((await db.list()).map(row => row.name)).toEqual(['HARBOR WORKS', 'Scholars']);
  });

  it('serializes concurrent connections so duplicate names and the 24th slot cannot race', async () => {
    const first = store(), second = store(first.name);
    const duplicates = await Promise.allSettled([first.create(input('Same name')), second.create(input(' SAME NAME '))]);
    expect(duplicates.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(duplicates.filter(result => result.status === 'rejected')).toHaveLength(1);
    for (let index = 1; index < MAX_CHARTER_TEMPLATES - 1; index++) await first.create(input(`Policy ${index}`));
    const lastSlot = await Promise.allSettled([first.create(input('Last policy A')), second.create(input('Last policy B'))]);
    expect(lastSlot.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(lastSlot.filter(result => result.status === 'rejected')).toHaveLength(1);
    const full = await first.list();
    expect(full).toHaveLength(MAX_CHARTER_TEMPLATES);
    await expect(first.create(input('Overflow'))).rejects.toThrow('holds 24 templates');
    expect(await second.list()).toEqual(full);
    await first.update(full[0]!.id, input('Renamed at capacity'));
    await second.remove(full[0]!.id);
    await first.create(input('Replacement'));
    expect(await first.list()).toHaveLength(MAX_CHARTER_TEMPLATES);
  });

  it('rejects malformed and future-version stored rows without deleting or silently repairing anything', async () => {
    const db = store(), saved = await db.create(input());
    const original = (await db.table('charterTemplates').get(saved.id)) as Record<string, unknown>;
    const badRows = [
      { ...original, version: 2 }, { ...original, extra: true }, { ...original, name: ' untrimmed ' },
      { ...original, nameKey: 'incorrect' }, { ...original, focus: 'future-focus' }, { ...original, ceiling: 4.5 },
    ];
    for (const row of badRows) {
      await db.table('charterTemplates').put(row);
      const before = await db.table('charterTemplates').toArray();
      await expect(db.list()).rejects.toThrow('invalid or from a newer version');
      await expect(db.create(input('New'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.update(saved.id, input('Changed'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.remove(saved.id)).rejects.toThrow('invalid or from a newer version');
      expect(await db.table('charterTemplates').toArray()).toEqual(before);
    }
    await db.table('charterTemplates').put(original);
    expect(await db.list()).toEqual([saved]);
    await db.table('charterTemplates').bulkAdd(Array.from({ length: MAX_CHARTER_TEMPLATES }, (_, index) => ({
      version: 1, id: crypto.randomUUID(), name: `Injected ${index}`, nameKey: `injected ${index}`, focus: 'works', ceiling: 24,
    })));
    const before = await db.table('charterTemplates').toArray();
    await expect(db.list()).rejects.toThrow('invalid or from a newer version');
    await expect(db.remove(saved.id)).rejects.toThrow('invalid or from a newer version');
    expect(await db.table('charterTemplates').toArray()).toEqual(before);
  });

  it('rolls back a transaction that fails after a real write, keeping the former template for retry', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('charterTemplates').toArray();
    await expect(db.transaction('rw', db.table('charterTemplates'), async () => {
      await db.update(saved.id, { name: 'Uncommitted replacement', focus: 'muster', ceiling: 64 });
      await db.create(input('Uncommitted new policy'));
      throw new DOMException('Authored storage quota failure after real writes', 'QuotaExceededError');
    })).rejects.toThrow('quota');
    expect(await db.table('charterTemplates').toArray()).toEqual(before);
    const hook = () => { throw new DOMException('Authored write denied', 'QuotaExceededError'); };
    db.table('charterTemplates').hook('updating', hook);
    await expect(db.update(saved.id, input('Denied replacement'))).rejects.toThrow('write denied');
    db.table('charterTemplates').hook('updating').unsubscribe(hook);
    expect(await db.list()).toEqual([saved]);
    expect(await db.update(saved.id, input('Retried replacement'))).toMatchObject({ id: saved.id, name: 'Retried replacement' });
  });

  it('rejects a future template row while preserving the newer database and its contents', async () => {
    const name = `charter-template-test-${++serial}`;
    const future = new Dexie(name); stores.push(future);
    future.version(2).stores({ charterTemplates: '&id,&nameKey' });
    const row = { version: 2, id: crypto.randomUUID(), name: 'Future', nameKey: 'future', focus: 'works', ceiling: 24 };
    await future.table('charterTemplates').add(row);
    future.close();
    const older = store(name);
    await expect(older.list()).rejects.toThrow();
    older.close();
    await future.open();
    expect(await future.table('charterTemplates').toArray()).toEqual([row]);
    expect(future.verno).toBe(2);
  });
});
