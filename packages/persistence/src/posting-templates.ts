import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import type { PostingMode } from '@theandril/sim';

export const MAX_POSTING_TEMPLATES = 24;
export const POSTING_TEMPLATE_NAME_MAX = 40;
export interface PostingTemplate { id: string; name: string; mode: PostingMode; destination: 'current' | 'hearth' }

const DATABASE_VERSION = 1;
const values = { mode: z.enum(['hold', 'join']), destination: z.enum(['current', 'hearth']) };
const inputSchema = z.object({ name: z.string().trim().min(1).max(POSTING_TEMPLATE_NAME_MAX), ...values }).strict();
const idSchema = z.string().uuid();
const rowSchema = z.object({
  version: z.literal(1), id: idSchema,
  name: z.string().min(1).max(POSTING_TEMPLATE_NAME_MAX).refine(name => name === name.trim()),
  nameKey: z.string().min(1).max(POSTING_TEMPLATE_NAME_MAX * 3),
  ...values,
}).strict();
type TemplateRow = z.infer<typeof rowSchema>;
const nameKey = (name: string): string => name.toLowerCase();
const publicTemplate = ({ id, name, mode, destination }: TemplateRow): PostingTemplate => ({ id, name, mode, destination });
const invalidLibrary = (): Error => new Error('Saved posting templates are invalid or from a newer version. No templates were changed.');
const missingTemplate = (): Error => new Error('That posting template no longer exists. Refresh the template library.');

function checkedInput(input: Omit<PostingTemplate, 'id'>): Omit<PostingTemplate, 'id'> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Use a template name of 1–${POSTING_TEMPLATE_NAME_MAX} characters, a hold or join order, and a current-position or hearth destination policy.`);
  return parsed.data;
}

function checkUnique(rows: readonly TemplateRow[], name: string, id?: string): void {
  if (rows.some(row => row.id !== id && row.nameKey === nameKey(name))) throw new Error('A posting template already uses that name. Choose another name.');
}

/** Personal preferences only; canonical postings are issued separately by commands. No campaign locations are stored. */
export class PostingTemplateStore extends Dexie {
  private readonly templates: Table<TemplateRow, string>;
  constructor(name = 'theandril-posting-preferences') {
    super(name);
    this.version(DATABASE_VERSION).stores({ postingTemplates: '&id,&nameKey' });
    this.templates = this.table('postingTemplates');
    this.on.ready.subscribe(() => {
      // Dexie scales native versions by ten and may reopen a newer compatible
      // database. Do not let a version-one library edit its newer contents.
      if (this.backendDB().version !== DATABASE_VERSION * 10) throw invalidLibrary();
    }, true);
  }

  /** The extra row detects corrupt oversized libraries without an unbounded read. */
  private async checkedRows(): Promise<TemplateRow[]> {
    const raw = await this.templates.limit(MAX_POSTING_TEMPLATES + 1).toArray();
    if (raw.length > MAX_POSTING_TEMPLATES) throw invalidLibrary();
    const rows = raw.map(row => {
      const parsed = rowSchema.safeParse(row);
      if (!parsed.success || parsed.data.nameKey !== nameKey(parsed.data.name)) throw invalidLibrary();
      return parsed.data;
    });
    if (new Set(rows.map(row => row.nameKey)).size !== rows.length) throw invalidLibrary();
    return rows;
  }

  async list(): Promise<PostingTemplate[]> {
    return this.transaction('r', this.templates, async () => (await this.checkedRows())
      .sort((a, b) => a.nameKey < b.nameKey ? -1 : a.nameKey > b.nameKey ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map(publicTemplate));
  }

  async create(input: Omit<PostingTemplate, 'id'>): Promise<PostingTemplate> {
    const value = checkedInput(input);
    // Personal UUIDs never enter deterministic campaign state or its ID counter.
    const id = crypto.randomUUID();
    return this.transaction('rw', this.templates, async () => {
      const rows = await this.checkedRows();
      if (rows.length >= MAX_POSTING_TEMPLATES) throw new Error(`The posting template library holds ${MAX_POSTING_TEMPLATES} templates. Remove one before saving another.`);
      checkUnique(rows, value.name);
      const row: TemplateRow = { version: 1, id, ...value, nameKey: nameKey(value.name) };
      await this.templates.add(row);
      return publicTemplate(row);
    });
  }

  async update(id: string, input: Omit<PostingTemplate, 'id'>): Promise<PostingTemplate> {
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
