import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import { IMPROVEMENTS } from '@theandril/content';

export const MAX_LAND_POLICY_TEMPLATES = 24;
export const LAND_POLICY_TEMPLATE_NAME_MAX = 40;
export interface LandPolicyTemplate { id: string; name: string; improvementId: string; allowance: number; reserve: number }

const DATABASE_VERSION = 1;
const improvements = new Set(IMPROVEMENTS.map(improvement => improvement.id));
const coin = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const values = { improvementId: z.string().refine(id => improvements.has(id)), allowance: coin, reserve: coin };
const inputSchema = z.object({ name: z.string().trim().min(1).max(LAND_POLICY_TEMPLATE_NAME_MAX), ...values }).strict();
const idSchema = z.string().uuid();
const rowSchema = z.object({
  version: z.literal(1), id: idSchema,
  name: z.string().min(1).max(LAND_POLICY_TEMPLATE_NAME_MAX).refine(name => name === name.trim()),
  nameKey: z.string().min(1).max(LAND_POLICY_TEMPLATE_NAME_MAX * 3),
  ...values,
}).strict();
type TemplateRow = z.infer<typeof rowSchema>;
const nameKey = (name: string): string => name.toLowerCase();
const publicTemplate = ({ id, name, improvementId, allowance, reserve }: TemplateRow): LandPolicyTemplate => ({ id, name, improvementId, allowance, reserve });
const invalidLibrary = (): Error => new Error('Saved land commission templates are invalid or from a newer version. No templates were changed.');
const missingTemplate = (): Error => new Error('That land commission template no longer exists. Refresh the template library.');

function checkedInput(input: Omit<LandPolicyTemplate, 'id'>): Omit<LandPolicyTemplate, 'id'> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Use a template name of 1–${LAND_POLICY_TEMPLATE_NAME_MAX} characters, a known land improvement, and whole nonnegative allowance and reserve amounts up to ${Number.MAX_SAFE_INTEGER}.`);
  return parsed.data;
}

function checkUnique(rows: readonly TemplateRow[], name: string, id?: string): void {
  if (rows.some(row => row.id !== id && row.nameKey === nameKey(name))) throw new Error('A land commission template already uses that name. Choose another name.');
}

/** Personal preferences only; canonical land commissions are issued separately by commands. No campaign references are stored. */
export class LandPolicyTemplateStore extends Dexie {
  private readonly templates: Table<TemplateRow, string>;
  constructor(name = 'theandril-land-policy-templates') {
    super(name);
    this.version(DATABASE_VERSION).stores({ landPolicyTemplates: '&id,&nameKey' });
    this.templates = this.table('landPolicyTemplates');
    this.on.ready.subscribe(() => {
      // Dexie scales native versions by ten and may reopen a newer compatible
      // database. Do not let a version-one library edit its newer contents.
      if (this.backendDB().version !== DATABASE_VERSION * 10) throw invalidLibrary();
    }, true);
  }

  /** The extra row detects corrupt oversized libraries without an unbounded read. */
  private async checkedRows(): Promise<TemplateRow[]> {
    const raw = await this.templates.limit(MAX_LAND_POLICY_TEMPLATES + 1).toArray();
    if (raw.length > MAX_LAND_POLICY_TEMPLATES) throw invalidLibrary();
    const rows = raw.map(row => {
      const parsed = rowSchema.safeParse(row);
      if (!parsed.success || parsed.data.nameKey !== nameKey(parsed.data.name)) throw invalidLibrary();
      return parsed.data;
    });
    if (new Set(rows.map(row => row.nameKey)).size !== rows.length) throw invalidLibrary();
    return rows;
  }

  async list(): Promise<LandPolicyTemplate[]> {
    return this.transaction('r', this.templates, async () => (await this.checkedRows())
      .sort((a, b) => a.nameKey < b.nameKey ? -1 : a.nameKey > b.nameKey ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      .map(publicTemplate));
  }

  async create(input: Omit<LandPolicyTemplate, 'id'>): Promise<LandPolicyTemplate> {
    const value = checkedInput(input);
    // Personal UUIDs never enter deterministic campaign state or its ID counter.
    const id = crypto.randomUUID();
    return this.transaction('rw', this.templates, async () => {
      const rows = await this.checkedRows();
      if (rows.length >= MAX_LAND_POLICY_TEMPLATES) throw new Error(`The land commission template library holds ${MAX_LAND_POLICY_TEMPLATES} templates. Remove one before saving another.`);
      checkUnique(rows, value.name);
      const row: TemplateRow = { version: 1, id, ...value, nameKey: nameKey(value.name) };
      await this.templates.add(row);
      return publicTemplate(row);
    });
  }

  async update(id: string, input: Omit<LandPolicyTemplate, 'id'>): Promise<LandPolicyTemplate> {
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
