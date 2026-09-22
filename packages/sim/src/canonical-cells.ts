/** Copy once, retaining the original numeric-sort behavior for unusual inputs.
 * Large unordered cell lists use the engine's integer sort instead of invoking
 * a JavaScript comparator for every comparison. No exploration state is cached. */
export function sortedExploredCells(cells: Iterable<number>): number[] {
  const copied = [...cells];
  for (let index = 1; index < copied.length; index++) {
    const previous = copied[index - 1], next = copied[index];
    if (typeof previous !== 'number' || typeof next !== 'number' || !(previous <= next)) {
      // Preserve negative zero and malformed/coercible inputs on the old path.
      // Small lists avoid the extra typed-array allocation and conversion.
      if (copied.length >= 256 && copied.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= 0xffff_ffff && !Object.is(cell, -0))) {
        return Array.from(Uint32Array.from(copied).sort());
      }
      return copied.sort((a, b) => a - b);
    }
  }
  return copied;
}
