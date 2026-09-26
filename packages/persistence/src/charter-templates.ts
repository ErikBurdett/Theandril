import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import { CHARTER_CEILING_MAX, CHARTER_CEILING_MIN, CHARTER_FOCI, type CharterFocus } from '@theandril/sim';

export const MAX_CHARTER_TEMPLATES = 24;
export const CHARTER_TEMPLATE_NAME_MAX = 40;
export interface CharterTemplate { id: string; name: string; focus: CharterFocus; ceiling: number }

const values = {
  focus: z.enum(CHARTER_FOCI),
  ceiling: z.number().int().min(CHARTER_CEILING_MIN).max(CHARTER_CEILING_MAX),
};
const inputSchema = z.object({ name: z.string().trim().min(1).max(CHARTER_TEMPLATE_NAME_MAX), ...values }).strict();
const idSchema = z.string().uuid();
const rowSchema = z.object({
  version: z.literal(1), id: idSchema,
  name: z.string().min(1).max(CHARTER_TEMPLATE_NAME_MAX).refine(name => name === name.trim()),
  nameKey: z.string().min(1).max(CHARTER_TEMPLATE_NAME_MAX * 3), ...values,
}).strict();
type TemplateRow = z.infer<typeof rowSchema>;
const nameKey = (name: string): string => name.toLowerCase();
const publicTemplate = ({ id, name, focus, ceiling }: TemplateRow): CharterTemplate => ({ id, name, focus, ceiling });
const invalidLibrary = (): Error => new Error('Saved charter templates are invalid or from a newer version. No templates were changed.');
const missingTemplate = (): Error => new Error('That charter template no longer exists. Refresh the template library.');

function checkedInput(input: Omit<CharterTemplate, 'id'>): Omit<CharterTemplate, 'id'> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Use a template name of 1–${CHARTER_TEMPLATE_NAME_MAX} characters, a charter focus and a whole coin ceiling from ${CHARTER_CEILING_MIN} to ${CHARTER_CEILING_MAX}.`);
  return parsed.data;
}

function checkUnique(rows: readonly TemplateRow[], name: string, id?: string): void {
  if (rows.some(row => row.id !== id && row.nameKey === nameKey(name))) throw new Error('A charter template already uses that name. Choose another name.');
}

/** Personal preferences only: never included in campaign state, saves or replay. */
export class CharterTemplateStore extends Dexie {
  private readonly templates: Table<TemplateRow, string>;
  constructor(name = 'theandril-preferences') {
    super(name);
    this.version(1).stores({ charterTemplates: '&id,&nameKey' });
    this.templates = this.table('charterTemplates');
  }

  /** Read one extra row to detect corrupt oversized storage without an unbounded scan. */
  private async checkedRows(): Promise<TemplateRow[]> {
    const raw = await this.templates.limit(MAX_CHARTER_TEMPLATES + 1).toArray();
    if (raw.length > MAX_CHARTER_TEMPLATES) throw invalidLibrary();
    const rows = raw.map(row => {
      const parsed = rowSchema.safeParse(row);
      if (!parsed.success || parsed.data.nameKey !== nameKey(parsed.data.name)) throw invalidLibrary();
      return parsed.data;
    });
    if (new Set(rows.map(row => row.nameKey)).size !== rows.length) throw invalidLibrary();
    return rows;
  }

  async list(): Promise<CharterTemplate[]> {
    return this.transaction('r', this.templates, async () => (await this.checkedRows())
      .sort((a, b) => a.nameKey < b.nameKey ? -1 : a.nameKey > b.nameKey ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map(publicTemplate));
  }

  async create(input: Omit<CharterTemplate, 'id'>): Promise<CharterTemplate> {
    const value = checkedInput(input);
    // UUIDs identify personal preferences; they never enter deterministic gameplay.
    const id = crypto.randomUUID();
    return this.transaction('rw', this.templates, async () => {
      const rows = await this.checkedRows();
      if (rows.length >= MAX_CHARTER_TEMPLATES) throw new Error(`The template library holds ${MAX_CHARTER_TEMPLATES} templates. Remove one before saving another.`);
      checkUnique(rows, value.name);
      const row: TemplateRow = { version: 1, id, ...value, nameKey: nameKey(value.name) };
      await this.templates.add(row);
      return publicTemplate(row);
    });
  }

  async update(id: string, input: Omit<CharterTemplate, 'id'>): Promise<CharterTemplate> {
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
