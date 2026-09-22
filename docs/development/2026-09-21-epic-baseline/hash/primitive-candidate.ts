import { z } from '../../../../packages/sim/node_modules/zod/index.js';
import { knownLandSchema, landStateSchema } from '../../../../packages/sim/src/territory';

/** Evidence only: memoize successful immutable strings, never object validation. */
function successfulStrings(schema: z.ZodType<string>, limit = 1024) {
  const successful = new Set<string>();
  return z.unknown().transform((value, context): string => {
    if (typeof value === 'string' && successful.has(value)) return value;
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) context.addIssue(issue);
      return z.NEVER;
    }
    if (successful.size >= limit) successful.clear();
    successful.add(parsed.data);
    return parsed.data;
  });
}

const identifier = successfulStrings(knownLandSchema.shape.factionId.unwrap()).nullable();
export const candidateKnownLand = knownLandSchema.extend({
  settlementId: identifier, factionId: identifier, improvementId: identifier,
});
export const candidateLand = landStateSchema.extend({
  known: z.record(landStateSchema.shape.known.keyType,
    z.record(landStateSchema.shape.known.valueType.keyType, candidateKnownLand)),
});
