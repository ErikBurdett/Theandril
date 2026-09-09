const MAX_WORLD_SEED = 0xffff_ffff;

function randomWorldSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

/** Randomness belongs to campaign setup; the worker receives one explicit seed. */
export function resolveCampaignSeed(input: string, previousSeed?: number, randomSeed = randomWorldSeed): number {
  if (input.trim()) {
    const seed = Number(input);
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > MAX_WORLD_SEED) {
      throw new RangeError('Use a whole-number world seed between 0 and 4294967295, or leave it blank for a random world.');
    }
    return seed;
  }

  // Exclude the current world even in the rare event of an entropy collision.
  let seed: number;
  do { seed = randomSeed(); } while (seed === previousSeed);
  return seed;
}
