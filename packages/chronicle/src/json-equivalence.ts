/** Canonical rendering is retained for exported technical-record bytes. */
export function stableJson(value: unknown, space?: number): string {
  return JSON.stringify(value, (_key: string, entry: unknown) => entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry, space);
}

/** Same bytes as parsing compact canonical JSON and then indenting it. */
export function stablePrettyJson(value: unknown): string {
  const text = stableJson(value, 2);
  // The previous JSON.parse rejected omitted roots, including custom toJSON.
  if (text === undefined) throw new SyntaxError('Cannot render an omitted JSON root.');
  return text;
}

const customJson = (value: object): boolean => typeof (value as { toJSON?: unknown }).toJSON === 'function';
const omitted = (value: unknown): boolean => value === undefined || typeof value === 'function' && !customJson(value) || typeof value === 'symbol';
const arrayValue = (value: unknown): unknown => omitted(value) ? null : value;
function needsJson(value: unknown): boolean {
  if (typeof value === 'bigint') return true;
  if (!value || typeof value !== 'object' && typeof value !== 'function') return false;
  if (customJson(value)) return true;
  if (Array.isArray(value) || typeof value === 'function') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype !== Object.prototype && prototype !== null;
}
function dataKeys(value: Record<string, unknown>): string[] | undefined {
  const keys: string[] = [];
  for (const key of Object.keys(value)) {
    const entry = value[key];
    // A custom conversion can omit its parent key entirely. Decide whether the
    // whole comparison needs JSON before comparing either object's key count.
    if (needsJson(entry)) return undefined;
    if (!omitted(entry)) keys.push(key);
  }
  return keys;
}

/** Compare ordinary replay data without sorting/copying every object and encoding
 * both complete trees. Undefined means the input needs JSON's custom conversion. */
function compareData(left: unknown, right: unknown): boolean | undefined {
  if (needsJson(left) || needsJson(right)) return undefined;
  if (typeof left === 'number' && !Number.isFinite(left)) left = null;
  if (typeof right === 'number' && !Number.isFinite(right)) right = null;
  if (omitted(left) || omitted(right)) return omitted(left) && omitted(right);
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return left === right;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++) {
      const result = compareData(arrayValue(left[index]), arrayValue(right[index]));
      if (result !== true) return result;
    }
    return true;
  }
  const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
  const keysA = dataKeys(a), keysB = dataKeys(b);
  if (!keysA || !keysB) return undefined;
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.hasOwn(b, key) || omitted(b[key])) return false;
    const result = compareData(a[key], b[key]);
    if (result !== true) return result;
  }
  return true;
}

/** Object order is irrelevant; arrays, omitted optionals and JSON nulls retain
 * their original meaning. Custom toJSON/boxed data use the unchanged renderer. */
export function sameJson(left: unknown, right: unknown): boolean {
  return compareData(left, right) ?? (stableJson(left) === stableJson(right));
}
