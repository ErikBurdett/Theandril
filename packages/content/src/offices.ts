import { z } from 'zod';
import { CHARACTER_DEFINITIONS } from './characters';

/** Rules 65: offices of the realm. A realm keeps one office for each
 * character role; a living character of that role who sits in a hearth of
 * the realm may hold it, and the hearth they sit in works the better for it.
 * Data only; the simulation seats, counts and vacates the offices. */
const id = z.string().regex(/^office\.[a-z_]+$/);
const name = z.string().min(1).max(60);
const description = z.string().min(1).max(300);
const bonus = z.number().int().min(0).max(3);
export const officeYieldsSchema = z.object({ food: bonus, industry: bonus, coin: bonus, knowledge: bonus }).strict();
export type OfficeYields = z.infer<typeof officeYieldsSchema>;
export const officeSchema = z.object({ id, name, description, role: z.enum(['marshal', 'surveyor', 'engineer', 'waykeeper']), yields: officeYieldsSchema, sinceRules: z.literal(65) }).strict();
export type OfficeDefinition = z.infer<typeof officeSchema>;
const office = (id: string, role: OfficeDefinition['role'], name: string, description: string, yields: Partial<OfficeYields>): OfficeDefinition => ({ id, name, description, role, yields: { food: 0, industry: 0, coin: 0, knowledge: 0, ...yields }, sinceRules: 65 });

/** Sealed packs hash this order; one office for each role. */
export const OFFICES: readonly OfficeDefinition[] = [
  office('office.warden', 'marshal', 'Warden of the Walls', 'A marshal who sits in a hearth drills its levy and keeps its fields and granary guarded; the hearth eats the better for it.', { food: 2 }),
  office('office.keeper_of_the_roll', 'surveyor', 'Keeper of the Roll', 'A surveyor who sits in a hearth keeps its roll of land and tenants, and the dues come in.', { coin: 2 }),
  office('office.master_of_works', 'engineer', 'Master of Works', 'An engineer who sits in a hearth orders its works, and less is wasted.', { industry: 2 }),
  office('office.reader_of_the_seams', 'waykeeper', 'Reader of the Seams', 'A Waykeeper who sits in a hearth reads for its scholars, and they learn the faster.', { knowledge: 2 }),
];
export const officesForRules = (version: number): readonly OfficeDefinition[] => OFFICES.filter(item => item.sinceRules <= version);
export const officeDefinition = (officeId: string): OfficeDefinition | undefined => OFFICES.find(item => item.id === officeId);

export function validateOfficeContent(entries = OFFICES): void {
  entries.forEach(item => officeSchema.parse(item));
  const ids = entries.map(item => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate office ID');
  const roles = new Set(CHARACTER_DEFINITIONS.map(definition => definition.role));
  for (const item of entries) {
    if (!roles.has(item.role)) throw new Error('An office belongs to a role of the catalogue: ' + item.id);
    if (!item.yields.food && !item.yields.industry && !item.yields.coin && !item.yields.knowledge) throw new Error('An office yields something: ' + item.id);
  }
  for (const role of roles) if (entries.filter(item => item.role === role).length !== 1) throw new Error('Every role keeps one office: ' + role);
}
