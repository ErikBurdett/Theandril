import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharterTemplateStore } from './charter-templates';
import { ProductionTemplateStore } from './production-templates';
import { MAX_POSTING_TEMPLATES, POSTING_TEMPLATE_NAME_MAX, PostingTemplateStore, type PostingTemplate } from './posting-templates';

const stores: Dexie[] = [];
let serial = 0;
const input = (name = 'Gather the watch'): Omit<PostingTemplate, 'id'> => ({ name, mode: 'join', destination: 'hearth' });
function store(name = `posting-template-test-${++serial}`): PostingTemplateStore {
  const db = new PostingTemplateStore(name); stores.push(db); return db;
}
afterEach(async () => {
  vi.restoreAllMocks();
  const names = new Set(stores.map(db => db.name));
  for (const db of stores.splice(0)) db.close();
  for (const name of names) await Dexie.delete(name);
});

describe('personal army posting template storage', () => {
  it('persists only detached posting policies through create, replacement, reopen and delete', async () => {
    const db = store(), draft = input('  Gather the watch  ');
    const creating = db.create(draft); draft.destination = 'current';
    const saved = await creating;
    expect(saved).toEqual({ id: expect.any(String), ...input() });
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    saved.name = 'Detached result'; saved.mode = 'hold';
    expect(await db.list()).toEqual([{ id: saved.id, ...input() }]);
    const changed = await db.update(saved.id, { name: '  Hold positions  ', mode: 'hold', destination: 'current' });
    expect(changed).toEqual({ id: saved.id, name: 'Hold positions', mode: 'hold', destination: 'current' });
    const listed = await db.list(); listed[0]!.mode = 'join';
    expect(await db.list()).toEqual([changed]);
    const row = await db.table('postingTemplates').get(saved.id);
    expect(Object.keys(row).sort()).toEqual(['destination', 'id', 'mode', 'name', 'nameKey', 'version']);
    db.close();
    const reopened = store(db.name);
    expect(await reopened.list()).toEqual([changed]);
    await reopened.remove(saved.id);
    expect(await reopened.list()).toEqual([]);
  });

  it('rejects invalid policies and campaign coordinates or IDs without overwriting the old template', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('postingTemplates').toArray();
    const invalid: unknown[] = [
      null, {}, { ...input(), name: '' }, { ...input(), name: '  ' }, { ...input(), name: 'x'.repeat(POSTING_TEMPLATE_NAME_MAX + 1) },
      { ...input(), mode: 'none' }, { ...input(), mode: 'patrol' }, { ...input(), mode: null },
      { ...input(), destination: 'selected' }, { ...input(), destination: 12 }, { ...input(), destination: null },
      { ...input(), cell: 12 }, { ...input(), armyId: 'army.1' }, { ...input(), settlementId: 'settlement.1' },
      { ...input(), factionId: 'faction.1' }, { ...input(), campaignId: 'campaign.1' },
      { ...input(), id: saved.id }, { ...input(), version: 1 }, { ...input(), extra: true },
    ];
    for (const value of invalid) {
      await expect(db.create(value as Omit<PostingTemplate, 'id'>)).rejects.toThrow('template name');
      await expect(db.update(saved.id, value as Omit<PostingTemplate, 'id'>)).rejects.toThrow('template name');
      expect(await db.table('postingTemplates').toArray()).toEqual(before);
    }
    for (const mode of ['hold', 'join'] as const) for (const destination of ['current', 'hearth'] as const) {
      expect(await db.update(saved.id, { name: 'x'.repeat(POSTING_TEMPLATE_NAME_MAX), mode, destination })).toMatchObject({ mode, destination });
    }
    for (const id of ['', 'bad-id', crypto.randomUUID()]) {
      await expect(db.update(id, input())).rejects.toThrow('no longer exists');
      await expect(db.remove(id)).rejects.toThrow('no longer exists');
    }
  });

  it('enforces trimmed case-insensitive names and permits a case-only self rename', async () => {
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
    for (let index = 1; index < MAX_POSTING_TEMPLATES - 1; index++) await first.create(input(`Order ${index}`));
    const lastSlot = await Promise.allSettled([first.create(input('Last A')), second.create(input('Last B'))]);
    expect(lastSlot.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(lastSlot.filter(result => result.status === 'rejected')).toHaveLength(1);
    const full = await second.list();
    expect(full).toHaveLength(MAX_POSTING_TEMPLATES);
    await expect(first.create(input('Overflow'))).rejects.toThrow('holds 24 templates');
    await first.update(full[0]!.id, input('Rename at capacity'));
    await second.remove(full[0]!.id);
    await first.create(input('Replacement'));
    expect(await first.list()).toHaveLength(MAX_POSTING_TEMPLATES);
    expect(await first.list()).toEqual(await second.list());
  });

  it('refuses corrupt and future rows before mutation, preserving every stored value for recovery', async () => {
    const db = store(), saved = await db.create(input());
    const original = await db.table('postingTemplates').get(saved.id) as Record<string, unknown>;
    const badRows = [
      { ...original, version: 2 }, { ...original, extra: true }, { ...original, name: ' untrimmed ' },
      { ...original, nameKey: 'wrong name' }, { ...original, mode: 'none' },
      { ...original, destination: 42 }, { ...original, destination: 'campaign.hearth.1' }, { ...original, cell: 42 },
    ];
    for (const row of badRows) {
      await db.table('postingTemplates').put(row);
      const before = await db.table('postingTemplates').toArray();
      await expect(db.list()).rejects.toThrow('invalid or from a newer version');
      await expect(db.create(input('New'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.update(saved.id, input('Changed'))).rejects.toThrow('invalid or from a newer version');
      await expect(db.remove(saved.id)).rejects.toThrow('invalid or from a newer version');
      expect(await db.table('postingTemplates').toArray()).toEqual(before);
    }
    await db.table('postingTemplates').put(original);
    expect(await db.list()).toEqual([saved]);
  });

  it('detects an oversized injected library without deleting its excess rows', async () => {
    const db = store();
    await db.table('postingTemplates').bulkAdd(Array.from({ length: MAX_POSTING_TEMPLATES + 1 }, (_, index) => ({
      version: 1, id: crypto.randomUUID(), name: `Injected ${index}`, nameKey: `injected ${index}`, mode: 'hold', destination: 'current',
    })));
    const before = await db.table('postingTemplates').toArray();
    await expect(db.list()).rejects.toThrow('invalid or from a newer version');
    await expect(db.create(input())).rejects.toThrow('invalid or from a newer version');
    await expect(db.update(before[0].id, input())).rejects.toThrow('invalid or from a newer version');
    await expect(db.remove(before[0].id)).rejects.toThrow('invalid or from a newer version');
    expect(await db.table('postingTemplates').toArray()).toEqual(before);
  });

  it('rolls back actual writes on transaction failure and permits retry after a rejected quota write', async () => {
    const db = store(), saved = await db.create(input());
    const before = await db.table('postingTemplates').toArray();
    await expect(db.transaction('rw', db.table('postingTemplates'), async () => {
      await db.update(saved.id, { name: 'Uncommitted', mode: 'hold', destination: 'current' });
      await db.create(input('Uncommitted addition'));
      await db.remove(saved.id);
      throw new DOMException('Authored quota failure after writes', 'QuotaExceededError');
    })).rejects.toThrow('quota');
    expect(await db.table('postingTemplates').toArray()).toEqual(before);
    const hook = () => { throw new DOMException('Authored write denied', 'QuotaExceededError'); };
    db.table('postingTemplates').hook('updating', hook);
    await expect(db.update(saved.id, input('Denied'))).rejects.toThrow('write denied');
    db.table('postingTemplates').hook('updating').unsubscribe(hook);
    expect(await db.list()).toEqual([saved]);
    expect(await db.update(saved.id, input('Retried'))).toMatchObject({ id: saved.id, name: 'Retried' });
  });

  it('recovers a retained library through a fresh connection after browser access is denied', async () => {
    const db = store(), saved = await db.create(input());
    db.close();
    const failing = store(db.name);
    const denied = vi.spyOn(indexedDB, 'open').mockImplementationOnce(() => { throw new DOMException('Authored browser denial', 'SecurityError'); });
    await expect(failing.list()).rejects.toThrow('Authored browser denial');
    denied.mockRestore(); failing.close();
    const retry = store(db.name);
    expect(await retry.list()).toEqual([saved]);
    expect(await retry.update(saved.id, input('Available again'))).toMatchObject({ id: saved.id, name: 'Available again' });
  });

  it('refuses a newer database even with compatible rows, retaining its native version and contents', async () => {
    const name = `posting-template-test-${++serial}`;
    const future = new Dexie(name); stores.push(future);
    future.version(2).stores({ postingTemplates: '&id,&nameKey' });
    const row = { version: 1, id: crypto.randomUUID(), ...input('Future'), nameKey: 'future' };
    await future.table('postingTemplates').add(row); future.close();
    const older = store(name);
    await expect(older.list()).rejects.toThrow('invalid or from a newer version'); older.close();
    const writing = store(name);
    await expect(writing.create(input('Forbidden'))).rejects.toThrow('invalid or from a newer version'); writing.close();
    await future.open();
    expect(future.backendDB().version).toBe(20);
    expect(await future.table('postingTemplates').toArray()).toEqual([row]);
  });

  it('rechecks database versions on reopening after an external upgrade', async () => {
    const db = store(); await db.create(input());
    const before = await db.table('postingTemplates').toArray(); db.close();
    const future = new Dexie(db.name); stores.push(future);
    future.version(2).stores({ postingTemplates: '&id,&nameKey' });
    await future.open(); future.close();
    await expect(db.open()).rejects.toThrow('invalid or from a newer version'); db.close();
    await future.open();
    expect(await future.table('postingTemplates').toArray()).toEqual(before);
  });

  it('coexists with charter and production libraries without sharing rows or migrating their databases', async () => {
    const charter = new CharterTemplateStore(), production = new ProductionTemplateStore(), posting = new PostingTemplateStore();
    stores.push(charter, production, posting);
    const savedCharter = await charter.create({ name: 'Watch', focus: 'muster', ceiling: 24 });
    const savedProduction = await production.create({ name: 'Watch', itemIds: ['unit.guard'] });
    const savedPosting = await posting.create(input('Watch'));
    expect(posting.name).toBe('theandril-posting-preferences');
    expect(posting.tables.map(table => table.name)).toEqual(['postingTemplates']);
    expect(posting.backendDB().version).toBe(10);
    expect(charter.backendDB().version).toBe(10); expect(production.backendDB().version).toBe(10);
    expect(await posting.list()).toEqual([savedPosting]);
    await posting.remove(savedPosting.id);
    expect(await charter.list()).toEqual([savedCharter]);
    expect(await production.list()).toEqual([savedProduction]);
  });
});
