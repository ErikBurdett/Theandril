import type { LandYield } from '@theandril/content';

/** Pure text helper kept free of stylesheet imports so browser specs can import it under Node. */
const yields = ['food', 'industry', 'coin', 'knowledge'] as const;
export function yieldText(value: LandYield): string {
  return yields.filter(key => value[key] !== 0).map(key => `${value[key] > 0 ? '+' : '−'}${Math.abs(value[key])} ${key}`).join(', ') || 'No change';
}
