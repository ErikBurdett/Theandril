import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { generateWorld, naturalFeatures, type GeneratorVersion, type MapLayout, type MapSize, type World } from './index';

/**
 * Byte-exact seals for every historical generator (1–7) and every layout it
 * accepts. Saved campaigns regenerate from their seed, so any change here is a
 * save-compatibility break, never a fixture to refresh. Captured from the
 * pre-generator8 code (c20f147). Each hash is the first 16 hex digits of
 * SHA-256 over terrain, fertility, biome, waterDepth, hydrology and
 * {seed, width, height, generatorVersion, layout, starts}; the Small
 * seed-20260905 entries equal the retained diagnostics/v5–v7 JSON seals.
 * Huge/Legendary share this exact code path at different dimensions, so they
 * are covered by Small/Standard seals instead of costly regeneration.
 */
const CASES: readonly [MapSize, number, number][] = [
  ['tiny', 20260905, 4], ['tiny', 20260905, 48], ['tiny', 42, 4], ['tiny', 42, 48], ['tiny', 74, 4], ['tiny', 74, 48],
  // Historical tests used 8 (legacy) / 12 (modern) seats at Small; both are kept.
  ['small', 20260905, 0], ['small', 74, 48],
];
const SEALS: readonly [GeneratorVersion, MapLayout, string][] = [
  [1, 'legacy', 'f9ba31a55dc946bf 84b83163bf2e15e5 dd292a9267c17e75 33febf774e1395d0 9dd92397a84e7b77 1b0b0ebd3d9f084c c0ef1b7a26c4b854 a30035005d82b5be'],
  [2, 'legacy', '56cd4074241bad93 f095beae4c12094a 07c5e7f9efed9d0f 0a8315def1e81d88 cdccfce04b8e8b48 e39e3bb560b3d412 f85b1c354b85db9d 424d253a7269ddd8'],
  [3, 'legacy', 'f597ce6c23c3a446 64291554532bbdbd bf96da7f868aa423 f6096fc1d60c66de 3a275d9a652e2fdf f95cce18f2823b07 9306c82e3e988515 e252429ba64e792e'],
  [4, 'legacy', 'a27ed5a342356f17 e0c56a3ddaaeedd4 15583312224b78ca 6f08d2723814c20a 8209809ba7ff6118 9ba0539a6d017da3 451267382fac6253 f30b2c7be195af32'],
  [5, 'continents', 'c892b3d7f215a827 cdbc81abd4863bd9 95dbffb6406f91ec 21af9672ab8d6916 82aab542a392654b 19d50d6b7123845a 3f9277d9c64fad93 a8d538489ecba93e'],
  [5, 'islands', 'abf20105b733c94d 872fed9e8329ef80 5ebbcb4147598267 13d66d73a57bb3f9 9106177706e4840b 26485bb4effbd696 75893b4ab6f8e54d dac6971d1ea84e0d'],
  [5, 'archipelago', '7ebf7b93538f9ba1 6337ae3983e9fa7a 557c44c3bc0c17df 217940cbec2bb430 af5bcd08e51f58b3 5cb0018b18225dd7 f1568b8cc43127e9 27b9a9bf0ce62ec1'],
  [6, 'continents', 'e48f7983e4fb6c94 f29e0e6458641fb3 16ff49ce3be5ae07 9ae64fe1c52a9b30 a5f50ded475e684f 410c86e662677c98 f9504d9ec72b69c2 96581c0e87c3e57a'],
  [6, 'islands', '1dffdbc2a695b5d4 cc44dbe57e644cf4 252a8f4a5380c8d5 34811a0b4a613c4c 3f171be64238baff 1748b73312b28637 2699a445c525810e f5a2de7433330214'],
  [6, 'archipelago', 'a82adf44c6d34ec3 36d581f9552cf9e6 95f14d338431b6ab ace7207455ceaff1 f5c146efea3a2976 a1e8dd31a020118d 788ca3d42711e4a2 cada64127c369b70'],
  [7, 'continents', '28bea5e12493c443 6a88a0bc7020f5e2 33c61b6e3f4d19a5 2d7f01376dda80fb 1e8dc31afa0a2af6 814df2a2424b8d01 906112c391647a5f ad880572b65f8a7e'],
  [7, 'islands', 'fb6ce3b687366c0f 4e96decbc3d7af23 d354c1e3c436d66f 303023f7a0792763 a9f90f56dfdb636e 0486d0edf1b6c79a 7133503203d9959a 63f2be74daca2f10'],
  [7, 'archipelago', 'bacf1f0fc593d3dd a70353ac02388544 6b8b320891305388 b3b73f071e8bccba dc8da62dc98ca438 34fa6f00b309c050 8d5ffd5d62f029dc 3272e1423be9e3f3'],
];
/** One Standard world per era guards width-scaled parameters beyond Small. */
const STANDARD: readonly [GeneratorVersion, MapLayout, number, string][] = [
  [4, 'legacy', 20260905, '15055936904bd945'], [5, 'archipelago', 74, '62590815cc1fa937'],
  [6, 'islands', 42, '476a568008437e70'], [7, 'continents', 20260905, 'e27d9040cb812525'],
];
/** naturalFeatures() over whole maps; generators1–4 share one physical geography. */
const FEATURES: readonly [GeneratorVersion, MapLayout, MapSize, number, number, string][] = [
  [1, 'legacy', 'tiny', 20260905, 4, '7e4ba95510b47735'], [4, 'legacy', 'tiny', 20260905, 4, '7e4ba95510b47735'],
  [4, 'legacy', 'small', 74, 48, '8774ce478206cd29'],
  [5, 'continents', 'tiny', 20260905, 4, '0a399f77fbb90346'], [5, 'islands', 'tiny', 20260905, 4, 'b68d12e1fddb320a'],
  [5, 'archipelago', 'tiny', 20260905, 4, '511f9f48d8675aa0'], [7, 'continents', 'tiny', 20260905, 4, '51e3d9895f6f7146'],
  [7, 'islands', 'tiny', 20260905, 4, '72cdc77be858c9a4'], [7, 'continents', 'small', 74, 48, '2a190dfb232d4d06'],
];

function seal(world: World): string {
  const hash = createHash('sha256');
  for (const values of [world.terrain, world.fertility, world.biome, world.waterDepth, world.hydrology]) hash.update(values);
  const { seed, width, height, generatorVersion, layout, starts } = world;
  return hash.update(JSON.stringify({ seed, width, height, generatorVersion, layout, starts })).digest('hex').slice(0, 16);
}
function historical(seed: number, size: MapSize, factions: number, version: GeneratorVersion, layout: MapLayout): World {
  return generateWorld(seed, size, factions, version, layout === 'legacy' ? {} : { layout: layout as 'continents' });
}

test.each(SEALS)('generator%i %s regenerates byte-exact Tiny and Small worlds', (version, layout, seals) => {
  const expected = seals.split(' ');
  CASES.forEach(([size, seed, factions], index) => {
    const world = historical(seed, size, factions || (version <= 4 ? 8 : 12), version, layout);
    expect(world.generatorVersion).toBe(version); expect(world.layout).toBe(layout);
    expect(`${size}/${seed}/${factions}:${seal(world)}`).toBe(`${size}/${seed}/${factions}:${expected[index]}`);
  });
});

test.each(STANDARD)('generator%i %s regenerates a byte-exact Standard world', (version, layout, seed, expected) => {
  expect(seal(historical(seed, 'standard', 24, version, layout))).toBe(expected);
});

test.each(FEATURES)('generator%i %s %s natural features stay byte-exact', (version, layout, size, seed, factions, expected) => {
  const world = historical(seed, size, factions, version, layout);
  expect(createHash('sha256').update(Uint8Array.from(world.terrain, (_, cell) => naturalFeatures(world, cell))).digest('hex').slice(0, 16)).toBe(expected);
});

test.each([[5, 'v5-geography-final.json'], [6, 'v6-geography-climate.json'], [7, 'v7-inland-seas.json']] as const)(
  'generator%i seals agree with the retained diagnostics measurements', (version, file) => {
    // The retained Huge/Legendary measurements stay as documentation; their
    // Tiny (4 seats) and Small (12 seats) seed-20260905 seals must match CASES.
    const { measurements } = JSON.parse(readFileSync(new URL(`../diagnostics/${file}`, import.meta.url), 'utf8')) as {
      measurements: { size: MapSize; layout: MapLayout; seed: number; factionCount: number; sha256: string }[];
    };
    const retained = measurements.filter(sample => sample.size === 'tiny' || sample.size === 'small');
    expect(retained).toHaveLength(6);
    for (const sample of retained) {
      const index = CASES.findIndex(([size, seed, factions]) => size === sample.size && seed === sample.seed && (factions || 12) === sample.factionCount);
      const row = SEALS.find(([sealed, layout]) => sealed === version && layout === sample.layout)!;
      expect(row[2].split(' ')[index]).toBe(sample.sha256.slice(0, 16));
    }
  });
