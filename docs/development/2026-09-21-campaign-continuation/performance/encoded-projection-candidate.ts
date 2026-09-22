// Experimental benchmark code only; never imported by production.
type Shape = { prototype: object | null; keys: (string | symbol)[]; enumerable: boolean[]; values: unknown[]; children: (Shape | null)[] };
// Retain raw insertion order, not the schema's different fixed-field order.
// A mismatching key, descriptor, prototype or value disables this cache entry.
function capture(value: object, parsed: object): Shape | null {
  const prototype = Object.getPrototypeOf(value) as object | null;
  if (prototype !== Object.getPrototypeOf(parsed) || prototype !== Object.prototype && prototype !== Array.prototype) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== Reflect.ownKeys(parsed).length) return null;
  const result: Shape = { prototype, keys, enumerable: [], values: [], children: [] };
  for (const key of keys) {
    const source = Object.getOwnPropertyDescriptor(value, key), output = Object.getOwnPropertyDescriptor(parsed, key);
    if (!source || !output || !('value' in source) || !('value' in output) || source.enumerable !== output.enumerable) return null;
    const entry: unknown = source.value, projected: unknown = output.value;
    let child: Shape | null = null;
    if (entry && typeof entry === 'object') {
      if (!projected || typeof projected !== 'object') return null;
      child = capture(entry, projected);
      if (!child) return null;
    } else if (!Object.is(entry, projected)) return null;
    result.enumerable.push(source.enumerable ?? false);
    result.values.push(child ? undefined : entry);
    result.children.push(child);
  }
  return result;
}
function matches(value: unknown, expected: Shape): boolean {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== expected.prototype) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== expected.keys.length) return false;
  for (let index = 0; index < expected.keys.length; index++) {
    if (keys[index] !== expected.keys[index]) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, expected.keys[index]!);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== expected.enumerable[index]) return false;
    const child = expected.children[index];
    if (child ? !matches(descriptor.value, child) : !Object.is(descriptor.value, expected.values[index])) return false;
  }
  return true;
}
const prototypes = [Object.prototype, Array.prototype].map(value => ({ value, prototype: Object.getPrototypeOf(value) as unknown, descriptors: Object.getOwnPropertyDescriptors(value) }));
export function unchangedPrototypes(): boolean {
  for (const { value, prototype, descriptors } of prototypes) {
    if (Object.getPrototypeOf(value) !== prototype || Reflect.ownKeys(value).length !== Reflect.ownKeys(descriptors).length) return false;
    for (const key of Reflect.ownKeys(descriptors)) {
      const before = Reflect.get(descriptors, key) as PropertyDescriptor, after = Object.getOwnPropertyDescriptor(value, key);
      if (!after || before.value !== after.value || before.get !== after.get || before.set !== after.set
        || before.enumerable !== after.enumerable || before.configurable !== after.configurable || before.writable !== after.writable) return false;
    }
  }
  return true;
}
const encoded = new WeakMap<object, string>();
export const statistics = { reads: 0, hits: 0, parses: 0, bypasses: 0, encodedBytes: 0 };
export function validatedProjection<T extends object>(parse: (input: T) => T): (input: T, reuse: boolean) => T {
  const cache = new WeakMap<T, { parsed: T; shape: Shape }>();
  return (input, reuse) => {
    statistics.reads++;
    const previous = reuse ? cache.get(input) : undefined;
    if (previous && matches(input, previous.shape)) { statistics.hits++; return previous.parsed; }
    statistics.parses++;
    const parsed = parse(input);
    if (reuse) {
      const expected = capture(input, parsed);
      if (expected) {
        cache.set(input, { parsed, shape: expected });
        const text = JSON.stringify(parsed);
        encoded.set(parsed, text);
        statistics.encodedBytes += text.length;
      } else { statistics.bypasses++; cache.delete(input); }
    }
    return parsed;
  };
}

/** Only bytes encoded here from a successful schema projection are eligible.
 * Ordinary fields retain their parent key while JSON performs conversions. */
export function stringifyPayload(payload: object): string {
  if (!unchangedPrototypes()) return JSON.stringify(payload);
  const chunks: string[] = [];
  let ordinary: Record<string, unknown> = {};
  const flush = () => {
    if (Object.keys(ordinary).length) {
      const text = JSON.stringify(ordinary).slice(1, -1);
      if (text) chunks.push(text);
    }
    ordinary = {};
  };
  for (const [key, value] of Object.entries(payload)) {
    let text = value && typeof value === 'object' ? encoded.get(value) : undefined;
    if (key === 'battleReports' && Array.isArray(value) && value.length && value.every(entry => entry && typeof entry === 'object' && encoded.has(entry))) {
      text = '[' + value.map(entry => encoded.get(entry)).join(',') + ']';
    }
    if (text === undefined) ordinary[key] = value;
    else { flush(); chunks.push(JSON.stringify(key) + ':' + text); }
  }
  flush();
  return '{' + chunks.join(',') + '}';
}
