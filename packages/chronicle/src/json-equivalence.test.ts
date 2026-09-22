import fc from 'fast-check';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { stateHashForVersion } from '@theandril/sim';
import { replayArchive, type CampaignArchive } from './index';
import { sameJson, stableJson, stablePrettyJson } from './json-equivalence';
import captured from './fixtures/v15-development-baseline.json';

// Frozen pre-optimization renderer: replay compared these complete strings.
const original = (value: unknown) => JSON.stringify(value, (_key, entry: unknown) => entry && typeof entry === 'object' && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
const reverseKeys = (value: unknown): unknown => Array.isArray(value) ? value.map(reverseKeys)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, entry]) => [key, reverseKeys(entry)])) : value;

describe('archive JSON equivalence without canonical string allocation', () => {
  it('matches the original renderer for arbitrary JSON, including reordered object keys', () => {
    fc.assert(fc.property(fc.jsonValue(), fc.jsonValue(), (left, right) => {
      expect(sameJson(left, right)).toBe(original(left) === original(right));
      const reordered = reverseKeys(left);
      expect(sameJson(left, reordered)).toBe(true);
      expect(stableJson(left)).toBe(original(left));
      expect(stableJson(reordered)).toBe(original(left));
      expect(stablePrettyJson(left)).toBe(JSON.stringify(JSON.parse(original(left)!) as unknown, null, 2));
      expect(stablePrettyJson(reordered)).toBe(stablePrettyJson(left));
    }), { seed: 20260921, numRuns: 500 });
  });

  it.each([
    ['absent optional', { turn: 1, cell: undefined }, { turn: 1 }],
    ['explicit null is retained', { cell: null }, {}],
    ['undefined array slot', [undefined, 2], [null, 2]],
    ['array hole', new Array(2), [null, null]],
    ['array order', [1, 2], [2, 1]],
    ['nested extra key', { battle: { round: 1, extra: true } }, { battle: { round: 1 } }],
    ['negative zero', { value: -0 }, { value: 0 }],
    ['nonfinite numbers', [NaN, Infinity, -Infinity], [null, null, null]],
    ['nonfinite object value', { value: NaN }, { value: null }],
    ['omitted function', { value: () => 2 }, {}],
    ['omitted symbol', { value: Symbol('ignored') }, {}],
    ['root omission', undefined, Symbol('ignored')],
    ['root null', undefined, null],
    ['null prototype', Object.assign(Object.create(null) as object, { turn: 1 }), { turn: 1 }],
    ['inherited name', { toString: 1 }, {}],
    ['numeric and special keys', JSON.parse('{"10":1,"2":2,"__proto__":{"value":3}}') as unknown, JSON.parse('{"__proto__":{"value":3},"2":2,"10":1}') as unknown],
    ['date conversion', new Date('2026-09-21T00:00:00Z'), '2026-09-21T00:00:00.000Z'],
    ['boxed value preserves replacer behavior', Object(2) as unknown, {}],
    ['custom conversion receives original key', { wrapper: { toJSON: (key: string) => ({ key, z: 2 }) } }, { wrapper: { z: 2, key: 'wrapper' } }],
    ['custom conversion omits its parent key', { wrapper: { toJSON: () => undefined } }, {}],
    ['nested custom omission', { wrapper: { nested: { toJSON: () => undefined }, absent: undefined } }, { wrapper: {} }],
    ['function conversion', { wrapper: Object.assign(() => 2, { toJSON: (key: string) => key }) }, { wrapper: 'wrapper' }],
  ])('%s retains the old JSON semantics', (_name, left, right) => {
    expect(sameJson(left, right)).toBe(original(left) === original(right));
    for (const value of [left, right]) {
      const encoded = original(value);
      if (encoded === undefined) expect(() => stablePrettyJson(value)).toThrow(SyntaxError);
      else expect(stablePrettyJson(value)).toBe(JSON.stringify(JSON.parse(encoded) as unknown, null, 2));
    }
  });

  it('retains refusal to encode unsupported bigint data', () => {
    expect(() => original({ value: 1n })).toThrow();
    expect(() => sameJson({ value: 1n }, { value: 1n })).toThrow();
  });

  it('replays reordered historical records while refusing forged event and battle text', () => {
    const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { hash: string; archive: CampaignArchive }> };
    const entry = fixture.cases.fieldCompleted!;
    const reordered = reverseKeys(entry.archive) as CampaignArchive;
    expect(stateHashForVersion(replayArchive(reordered), 15)).toBe(entry.hash);
    const eventForgery = structuredClone(reordered);
    eventForgery.records[0]!.events[0]!.message = 'Forged event';
    expect(() => replayArchive(eventForgery)).toThrow(/result mismatch/);
    const battleForgery = structuredClone(reordered);
    battleForgery.records.find(record => record.battles.length)!.battles[0]!.combat.log[0] = 'Forged battle round';
    expect(() => replayArchive(battleForgery)).toThrow(/battle mismatch/);
  });

  it('renders frozen real battle records without changing source properties or optional fields', () => {
    const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { archive: CampaignArchive }> };
    const freeze = (value: unknown): void => {
      if (!value || typeof value !== 'object') return;
      for (const entry of Object.values(value)) freeze(entry);
      Object.freeze(value);
    };
    const archive = fixture.cases.fieldCompleted!.archive;
    const before = JSON.stringify(archive);
    freeze(archive);
    expect(stablePrettyJson(archive)).toBe(JSON.stringify(JSON.parse(original(archive)!) as unknown, null, 2));
    for (const record of archive.records) expect(stablePrettyJson(record)).toBe(JSON.stringify(JSON.parse(original(record)!) as unknown, null, 2));
    expect(JSON.stringify(archive)).toBe(before);
    expect(() => stablePrettyJson({ toJSON: () => undefined })).toThrow(SyntaxError);
  });
});
