import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import { BUILDINGS, UNITS } from '@theandril/content';

export const MAX_PRODUCTION_TEMPLATES = 24;
export const PRODUCTION_TEMPLATE_NAME_MAX = 40;
export const MAX_PRODUCTION_TEMPLATE_ITEMS = 5;
export interface ProductionTemplate { id: string; name: string; itemIds: string[] }

const DATABASE_VERSION = 1;
const buildingIds = new Set(BUILDINGS.map(item => item.id));
const knownIds = new Set([...buildingIds, ...UNITS.map(item => item.id)]);
const itemIdsSchema = z.array(z.string().min(1).max(100).refine(id => knownIds.has(id)))
  .min(1).max(MAX_PRODUCTION_TEMPLATE_ITEMS)
  .refine(ids => {
    const buildings = ids.filter(id => buildingIds.has(id));
    return new Set(buildings).size === buildings.length;
  });
const inputSchema = z.object({ name: z.string().trim().min(1).max(PRODUCTION_TEMPLATE_NAME_MAX), itemIds: itemIdsSchema }).strict();
const idSchema = z.string().uuid();
const rowSchema = z.object({
  version: z.literal(1), id: idSchema,
  name: z.string().min(1).max(PRODUCTION_TEMPLATE_NAME_MAX).refine(name => name === name.trim()),
  nameKey: z.string().min(1).max(PRODUCTION_TEMPLATE_NAME_MAX * 3),
  itemIds: itemIdsSchema,
}).strict();
type TemplateRow = z.infer<typeof rowSchema>;
const nameKey = (name: string): string => name.toLowerCase();
const publicTemplate = ({ id, name, itemIds }: TemplateRow): ProductionTemplate => ({ id, name, itemIds: [...itemIds] });
const invalidLibrary = (): Error => new Error('Saved production templates are invalid or from a newer version. No templates were changed.');
const missingTemplate = (): Error => new Error('That production template no longer exists. Refresh the template library.');

function checkedInput(input: Omit<ProductionTemplate, 'id'>): Omit<ProductionTemplate, 'id'> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Use a template name of 1–${PRODUCTION_TEMPLATE_NAME_MAX} characters and 1–${MAX_PRODUCTION_TEMPLATE_ITEMS} known construction or recruitment items. Buildings may appear only once; units may repeat.`);
  return parsed.data;
}

function checkUnique(rows: readonly TemplateRow[], name: string, id?: string): void {
  if (rows.some(row => row.id !== id && row.nameKey === nameKey(name))) throw new Error('A production template already uses that name. Choose another name.');
}

/** Personal preferences only; canonical queues are issued separately by commands. */
export class ProductionTemplateStore extends Dexie {
  private readonly templates: Table<TemplateRow, string>;
  constructor(name = 'theandril-production-preferences') {
    super(name);
    this.version(DATABASE_VERSION).stores({ productionTemplates: '&id,&nameKey' });
    this.templates = this.table('productionTemplates');
    this.on.ready.subscribe(() => {
      // Dexie scales native versions by ten and may reopen a newer compatible
      // database. Do not let a version-one library edit its newer contents.
      if (this.backendDB().version !== DATABASE_VERSION * 10) throw invalidLibrary();
    }, true);
  }

  /** The extra row detects corrupt oversized libraries without an unbounded read. */
  private async checkedRows(): Promise<TemplateRow[]> {
    const raw = await this.templates.limit(MAX_PRODUCTION_TEMPLATES + 1).toArray();
    if (raw.length > MAX_PRODUCTION_TEMPLATES) throw invalidLibrary();
    const rows = raw.map(row => {
      const parsed = rowSchema.safeParse(row);
      if (!parsed.success || parsed.data.nameKey !== nameKey(parsed.data.name)) throw invalidLibrary();
      return parsed.data;
    });
    if (new Set(rows.map(row => row.nameKey)).size !== rows.length) throw invalidLibrary();
    return rows;
  }

  async list(): Promise<ProductionTemplate[]> {
    return this.transaction('r', this.templates, async () => (await this.checkedRows())
      .sort((a, b) => a.nameKey < b.nameKey ? -1 : a.nameKey > b.nameKey ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map(publicTemplate));
  }

  async create(input: Omit<ProductionTemplate, 'id'>): Promise<ProductionTemplate> {
    const value = checkedInput(input);
    // Personal UUIDs never enter deterministic campaign state or its ID counter.
    const id = crypto.randomUUID();
    return this.transaction('rw', this.templates, async () => {
      const rows = await this.checkedRows();
      if (rows.length >= MAX_PRODUCTION_TEMPLATES) throw new Error(`The production template library holds ${MAX_PRODUCTION_TEMPLATES} templates. Remove one before saving another.`);
      checkUnique(rows, value.name);
      const row: TemplateRow = { version: 1, id, ...value, nameKey: nameKey(value.name) };
      await this.templates.add(row);
      return publicTemplate(row);
    });
  }

  async update(id: string, input: Omit<ProductionTemplate, 'id'>): Promise<ProductionTemplate> {
    if (!idSchema.safeParse(id).success) throw missingTemplate();
    const value = checkedInput(input);
    return this.transaction('rw', this.templates, async () => {
      const rows = await this.checkedRows();
      if (!rows.some(row => row.id === id)) throw missingTemplate();
      checkUnique(rows, value.name, id);
      const row: TemplateRow = { version: 1, id, ...value, nameKey: nameKey(value.name) };
      await this.templates.put(row);
      return publicTemplate(row);
    });
  }

  async remove(id: string): Promise<void> {
    if (!idSchema.safeParse(id).success) throw missingTemplate();
    await this.transaction('rw', this.templates, async () => {
      const rows = await this.checkedRows();
      if (!rows.some(row => row.id === id)) throw missingTemplate();
      await this.templates.delete(id);
    });
  }
}
