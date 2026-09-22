// Experimental benchmark candidate, not imported by production.
type Shape = { prototype: object | null; keys: (string | symbol)[]; values: unknown[]; children: (Shape | null)[] };
const shape = (value: object): Shape => {
  const keys = Reflect.ownKeys(value);
  const values: unknown[] = keys.map(key => Reflect.get(value, key));
  return { prototype: Object.getPrototypeOf(value) as object | null, keys, values,
    children: values.map(entry => entry && typeof entry === 'object' ? shape(entry) : null) };
};
function matches(value: unknown, expected: Shape): boolean {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== expected.prototype
    || Reflect.ownKeys(value).length !== expected.keys.length) return false;
  for (let index = 0; index < expected.keys.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, expected.keys[index]!);
    if (!descriptor || !('value' in descriptor)) return false;
    const child = expected.children[index];
    if (child ? !matches(descriptor.value, child) : !Object.is(descriptor.value, expected.values[index])) return false;
  }
  return true;
}
export function validatedProjection<T extends object>(parse: (input: T) => T): (input: T) => T {
  const cache = new WeakMap<T, { parsed: T; shape: Shape }>();
  return input => {
    const previous = cache.get(input);
    if (previous && matches(input, previous.shape)) return previous.parsed;
    const parsed = parse(input);
    const expected = shape(parsed);
    // Accessors, custom prototypes and unknown array properties cannot seed a hit.
    if (matches(input, expected)) cache.set(input, { parsed, shape: expected });
    else cache.delete(input);
    return parsed;
  };
}
