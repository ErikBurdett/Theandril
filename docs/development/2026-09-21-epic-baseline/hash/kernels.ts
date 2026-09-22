// Experimental pure kernels; production does not import this file.
export function foldOriginal(hash: number, text: string): number {
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash;
}
export function fold4(hash: number, text: string): number {
  let index = 0;
  const limit = text.length - 3;
  for (; index < limit; index += 4) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 1), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 2), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 3), 16777619);
  }
  for (; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash;
}
export function fold8(hash: number, text: string): number {
  let index = 0;
  const limit = text.length - 7;
  for (; index < limit; index += 8) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 1), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 2), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 3), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 4), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 5), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 6), 16777619);
    hash = Math.imul(hash ^ text.charCodeAt(index + 7), 16777619);
  }
  for (; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return hash;
}

const typedPrototype = Object.getPrototypeOf(Uint8Array.prototype) as object;
const originalIterator = Object.getOwnPropertyDescriptor(typedPrototype, Symbol.iterator)?.value as unknown;
/** Keep arbitrary iterable and overridden-iterator semantics on the old path. */
export function copyWorldLayer(layer: Uint8Array): number[] {
  if (Object.getPrototypeOf(layer) === Uint8Array.prototype && !Object.hasOwn(layer, Symbol.iterator)
    && !Object.hasOwn(Uint8Array.prototype, Symbol.iterator)
    && Object.getOwnPropertyDescriptor(typedPrototype, Symbol.iterator)?.value === originalIterator) return Array.from(layer);
  return [...layer];
}
