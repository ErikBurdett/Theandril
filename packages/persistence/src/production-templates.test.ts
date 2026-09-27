import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { BUILDINGS, UNITS } from '@theandril/content';
import { CharterTemplateStore } from './charter-templates';
import { MAX_PRODUCTION_TEMPLATES, MAX_PRODUCTION_TEMPLATE_ITEMS, PRODUCTION_TEMPLATE_NAME_MAX, ProductionTemplateStore, type ProductionTemplate } from './production-templates';

const stores: Dexie[] = [];
let serial = 0;
const input = (name = 'Raise the watch'): Omit<ProductionTemplate, 'id'> => ({ name, itemIds: ['building.granary', 'unit.guard', 'unit.guard'] });
function store(name = `production-template-test-${++serial}`): ProductionTemplateStore {
  const db = new ProductionTemplateStore(name); stores.push(db); return db;
}
afterEach(async () => {
  const names = new Set(stores.map(db => db.name));
  for (const db of stores.splice(0)) db.close();
  for (const name of names) await Dexie.delete(name);
});

describe('personal production template storage', () => {
  it('preserves order and detached arrays through create, replacement, list, reopening and delete', async () => {
    const db = store(), draft = input('  Raise the watch  ');
    const creating = db.create(draft); draft.itemIds[0] = 'unit.scout';
    const saved = await creating;
    expect(saved).toEqual({ id: expect.any(String), ...input() });
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    saved.itemIds.splice(0); saved.name = 'Detached result';
    expect(await db.list()).toEqual([{ id: saved.id, ...input() }]);
    const replacement = { name: '  Harbor guard  ', itemIds: ['building.harbor', 'unit.transport', 'unit.coastal_warship'] };
    const updating = db.update(saved.id, replacement); replacement.itemIds.reverse();
    const updated = await updating;
    expect(updated).toEqual({ id: saved.id, name: 'Harbor guard', itemIds: ['building.harbor', 'unit.transport', 'unit.coastal_warship'] });
    const listed = await db.list(); listed[0]!.itemIds.push('unit.scout'); updated.itemIds.splice(0);
    expect((await db.list())[0]!.itemIds).toEqual(['building.harbor', 'unit.transport', 'unit.coastal_warship']);
    db.close();
    const reopened = store(db.name);
    expect((await reopened.list())[0]).toEqual({ id: saved.id, name: 'Harbor guard', itemIds: ['building.harbor', 'unit.transport', 'unit.coastal_warship'] });
    await reopened.remove(saved.id);
    expect(await reopened.list()).toEqual([]);
  });

  it('validates strict bounded content while permitting repeated units and current gated content', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('productionTemplates').toArray();
    const invalid: unknown[] = [
      null, {}, { ...input(), name: '' }, { ...input(), name: '  ' }, { ...input(), name: 'x'.repeat(PRODUCTION_TEMPLATE_NAME_MAX + 1) },
      { ...input(), itemIds: [] }, { ...input(), itemIds: Array(MAX_PRODUCTION_TEMPLATE_ITEMS + 1).fill('unit.guard') },
      { ...input(), itemIds: ['building.granary', 'unit.guard', 'building.granary'] },
      { ...input(), itemIds: ['unit.future'] }, { ...input(), itemIds: ['building.future'] },
      { ...input(), itemIds: ['technology.stewardship'] }, { ...input(), itemIds: [' unit.guard'] },
      { ...input(), itemIds: ['x'.repeat(101)] }, { ...input(), itemIds: [null] },
      { ...input(), itemIds: [12] }, { ...input(), itemIds: 'unit.guard' },
      { ...input(), itemIds: [undefined] }, { ...input(), id: saved.id }, { ...input(), version: 1 }, { ...input(), extra: true },
    ];
    for (const value of invalid) {
      await expect(db.create(value as Omit<ProductionTemplate, 'id'>)).rejects.toThrow('known construction or recruitment items');
      await expect(db.update(saved.id, value as Omit<ProductionTemplate, 'id'>)).rejects.toThrow('known construction or recruitment items');
      expect(await db.table('productionTemplates').toArray()).toEqual(before);
    }
    for (const item of [...BUILDINGS, ...UNITS]) {
      expect(await db.update(saved.id, { name: 'Current content', itemIds: [item.id] })).toMatchObject({ itemIds: [item.id] });
    }
    expect(await db.update(saved.id, { name: 'x'.repeat(PRODUCTION_TEMPLATE_NAME_MAX), itemIds: Array(MAX_PRODUCTION_TEMPLATE_ITEMS).fill('unit.guard') }))
      .toMatchObject({ name: 'x'.repeat(PRODUCTION_TEMPLATE_NAME_MAX), itemIds: Array(5).fill('unit.guard') });
    for (const id of ['', 'invalid', crypto.randomUUID()]) {
      await expect(db.update(id, input())).rejects.toThrow('no longer exists');
      await expect(db.remove(id)).rejects.toThrow('no longer exists');
    }
  });

  it('enforces trimmed case-insensitive names and permits a case-only rename of the same template', async () => {
    const db = store(), first = await db.create(input('Harbor watch'));
    const second = await db.create(input('Road watch'));
    await expect(db.create(input('  HARBOR WATCH  '))).rejects.toThrow('already uses that name');
    await expect(db.update(second.id, input('harbor watch'))).rejects.toThrow('already uses that name');
    await db.update(first.id, input('HARBOR WATCH'));
    expect((await db.list()).map(row => row.name)).toEqual(['HARBOR WATCH', 'Road watch']);
  });

  it('serializes competing connections at the duplicate-name and final-capacity boundaries', async () => {
    const first = store(), second = store(first.name);
    const duplicate = await Promise.allSettled([first.create(input('Same')), second.create(input(' SAME '))]);
    expect(duplicate.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(duplicate.filter(result => result.status === 'rejected')).toHaveLength(1);
    for (let index = 1; index < MAX_PRODUCTION_TEMPLATES - 1; index++) await first.create(input(`Sequence ${index}`));
    const lastSlot = await Promise.allSettled([first.create(input('Last A')), second.create(input('Last B'))]);
    expect(lastSlot.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(lastSlot.filter(result => result.status === 'rejected')).toHaveLength(1);
    const full = await second.list();
    expect(full).toHaveLength(MAX_PRODUCTION_TEMPLATES);
    await expect(first.create(input('Overflow'))).rejects.toThrow('holds 24 templates');
    await first.update(full[0]!.id, input('Rename at capacity'));
    await second.remove(full[0]!.id);
    await first.create(input('Replacement'));
    expect(await first.list()).toHaveLength(MAX_PRODUCTION_TEMPLATES);
    expect(await first.list()).toEqual(await second.list());
  });

  it('refuses malformed or future rows before any library mutation and preserves them for recovery', async () => {
    const db = store(), saved = await db.create(input());
    const original = await db.table('productionTemplates').get(saved.id) as Record<string, unknown>;
    const badRows = [
      { ...original, version: 2 }, { ...original, extra: true }, { ...original, name: ' untrimmed ' },
      { ...original, nameKey: 'wrong name' }, { ...original, itemIds: [] },
      { ...original, itemIds: ['unit.unknown'] }, { ...original, itemIds: ['building.unknown'] },
      { ...original, itemIds: ['building.market', 'building.market'] },
      { ...original, itemIds: Array(MAX_PRODUCTION_TEMPLATE_ITEMS + 1).fill('unit.guard') },
    ];
    for (const row of badRows) {
      await db.table('productionTemplates').put(row);
      const before = await db.table('productionTemplates').toArray();
      await expect(db.list()).rejects.toThrow('invalid or from a newer version');
      await expect(db.create(input('New'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.update(saved.id, input('Changed'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.remove(saved.id)).rejects.toThrow('invalid or from a newer version');
      expect(await db.table('productionTemplates').toArray()).toEqual(before);
    }
    await db.table('productionTemplates').put(original);
    expect(await db.list()).toEqual([saved]);
  });

  it('detects an oversized injected library with a bounded read and never deletes its excess rows', async () => {
    const db = store();
    await db.table('productionTemplates').bulkAdd(Array.from({ length: MAX_PRODUCTION_TEMPLATES + 1 }, (_, index) => ({
      version: 1, id: crypto.randomUUID(), name: `Injected ${index}`, nameKey: `injected ${index}`, itemIds: ['unit.guard'],
    })));
    const before = await db.table('productionTemplates').toArray();
    await expect(db.list()).rejects.toThrow('invalid or from a newer version');
    await expect(db.create(input())).rejects.toThrow('invalid or from a newer version');
    await expect(db.update(before[0].id, input())).rejects.toThrow('invalid or from a newer version');
    await expect(db.remove(before[0].id)).rejects.toThrow('invalid or from a newer version');
    expect(await db.table('productionTemplates').toArray()).toEqual(before);
  });

  it('rolls back actual writes on transaction failure and allows retry after a rejected quota write', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('productionTemplates').toArray();
    await expect(db.transaction('rw', db.table('productionTemplates'), async () => {
      await db.update(saved.id, { name: 'Uncommitted', itemIds: ['unit.transport'] });
      await db.create(input('Uncommitted addition'));
      throw new DOMException('Authored quota failure after writes', 'QuotaExceededError');
    })).rejects.toThrow('quota');
    expect(await db.table('productionTemplates').toArray()).toEqual(before);
    const hook = () => { throw new DOMException('Authored write denied', 'QuotaExceededError'); };
    db.table('productionTemplates').hook('updating', hook);
    await expect(db.update(saved.id, input('Denied'))).rejects.toThrow('write denied');
    db.table('productionTemplates').hook('updating').unsubscribe(hook);
    expect(await db.list()).toEqual([saved]);
    expect(await db.update(saved.id, input('Retried'))).toMatchObject({ id: saved.id, name: 'Retried' });
  });

  it('refuses a future database even with compatible version-one rows, preserving version and contents', async () => {
    const name = `production-template-test-${++serial}`;
    const future = new Dexie(name); stores.push(future);
    future.version(2).stores({ productionTemplates: '&id,&nameKey' });
    const row = { version: 1, id: crypto.randomUUID(), name: 'Future', nameKey: 'future', itemIds: ['unit.guard'] };
    await future.table('productionTemplates').add(row);
    future.close();
    const older = store(name);
    await expect(older.list()).rejects.toThrow('invalid or from a newer version');
    older.close();
    const writing = store(name);
    await expect(writing.create(input('Forbidden'))).rejects.toThrow('invalid or from a newer version');
    writing.close();
    await future.open();
    expect(future.verno).toBe(2);
    expect(await future.table('productionTemplates').toArray()).toEqual([row]);
  });

  it('rechecks the database version when a previously valid connection reopens after an external upgrade', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('productionTemplates').toArray();
    db.close();
    const future = new Dexie(db.name); stores.push(future);
    future.version(2).stores({ productionTemplates: '&id,&nameKey' });
    await future.open(); future.close();
    await expect(db.open()).rejects.toThrow('invalid or from a newer version');
    db.close();
    await future.open();
    expect(future.verno).toBe(2);
    expect(await future.table('productionTemplates').toArray()).toEqual(before);
    expect(before[0].id).toBe(saved.id);
  });

  it('coexists with an open charter library in separate default databases without migration or shared rows', async () => {
    const charter = new CharterTemplateStore(); stores.push(charter);
    const savedCharter = await charter.create({ name: 'Same personal name', focus: 'works', ceiling: 24 });
    const db = new ProductionTemplateStore(); stores.push(db);
    const savedProduction = await db.create(input('Same personal name'));
    expect(db.name).toBe('theandril-production-preferences');
    expect(charter.name).toBe('theandril-preferences');
    expect(db.tables.map(table => table.name)).toEqual(['productionTemplates']);
    expect(charter.tables.map(table => table.name)).toEqual(['charterTemplates']);
    expect(db.verno).toBe(1); expect(charter.verno).toBe(1);
    expect(await db.list()).toEqual([savedProduction]);
    expect(await charter.list()).toEqual([savedCharter]);
    await db.remove(savedProduction.id);
    expect(await charter.list()).toEqual([savedCharter]);
    expect(await charter.update(savedCharter.id, { name: 'Still available', focus: 'learning', ceiling: 12 })).toMatchObject({ name: 'Still available' });
  });
});
