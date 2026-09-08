import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { generateWorld, naturalFeatures } from './index';

// Captured from clean b17900d BEFORE v5 edits, using actual raw array SHA-256.
// Shared physical fields are stored once; each historical biome version remains explicit.
const captures = [
  { size: 'tiny', terrain: '93861eaae9d9b29d078b7e43506940b18dda5e5767726b24d5c935f87ef9b059', fertility: '2693bc31a03f29b97c06fd824390addcc4c18fe9488ce0b9607b70d119a90d43', waterDepth: 'b9e613905da152cb9f7d4fbc64b8cabc2ec31501b440b074d1eeeda3f35fe866', features: '7e4ba95510b477356b9b862959bb4726e3ae1d62a4ab068df52f30bb8dee0780', starts: [488,1052,318,1132,1164,428,644,756], biomes: ['1f643d84be4d6f6a986801078b5e313444880728a63c7c2f9dac8eb530e6a9be','b6adf3e8f06769b0d57d09c647d1d39b830f7c3471153a83f98a9d6980ca8493','b6adf3e8f06769b0d57d09c647d1d39b830f7c3471153a83f98a9d6980ca8493','e93eb7346e2895cff526ebf64a312b344ac370fdef190c62c37ee1d8dc1738b8'] },
  { size: 'small', terrain: '043a21412c9ede03510efc18d8e3e21b573282039a643ba4f7b96216a875a6ed', fertility: 'b40afe08c58e3aff9d19927c4d062962cd8dec4e65d6cadfbc2508d985f0c822', waterDepth: '091ff30b49198860a2f66e556c9016e7bcf5441e3fe201d649d97c0e1cc3f1e9', features: 'b6e7ef7c074e0c3925a689a5c44dae8168ae4be4796078bad359bebbdab75d6a', starts: [13160,29939,22530,6335,32674,5676,29758,13553], biomes: ['01e8463f4223c040eb90f186ee5bd90a7ed3cc7619d9fe0bf32b1e6b704142a5','8e99a1ae4a1ad45796224673aafec70700dd8ed2aeddd2d62630b7f20d46245f','8e99a1ae4a1ad45796224673aafec70700dd8ed2aeddd2d62630b7f20d46245f','729f036e640b1f05b133414dd3efef20d5c7736d774a2cddd3fe68caf4493e9d'] },
  { size: 'huge', terrain: 'e7d63a045aefa66181f4ce8c5d5bc8d29f51bd88f3aea49bfd2d9b4cc9f6f471', fertility: '77d0e4c407ea8a08e00714a23da0902bb0696f542fb09b2d6bf7dc3983a2426c', waterDepth: 'c8346fbcfa33ff5c508f0f0164196334d52e8f351281f543e6c0aa9713749b13', features: 'c4ef964907d9f9daa4d4da4165d6961f6869db6ca05a2d50c70d3e8277f67546', starts: [62183,129525,127514,29071,27714,156494,150699,95123], biomes: ['c3d35c1ae49ea990e8b9046b78ebaadab931c7fbdf08f630cdf7e41cea45af55','5af4d4fdfc5dab1cbc5805d741a14ca5657e578861cb32b37a77edc91bd59ed2','5af4d4fdfc5dab1cbc5805d741a14ca5657e578861cb32b37a77edc91bd59ed2','5bcd59952f83707f2bfa77e7c3a2af7cd5d1b49fb1734c5e97dcb11f43e07e8d'] },
  { size: 'legendary', terrain: '394cb7a3556b3b40d893bed3ced9005f21db7b7f887fdbe8831ee35a88709670', fertility: 'b2646210a4f19491f1c3e75fa67621b5dd1525713b79ed44639b07394633e0dc', waterDepth: '36ebc3d4057231ba958738264d0ce04603367e2fbec7f9b21a325b6cf8178221', features: 'e734eadc73a40d612c133786adda87127aca527a9728e951f344b5610c3c5918', starts: [97544,193915,160643,43364,243612,242728,41070,139276], biomes: ['2cefa2de9f9340310757eff15216bb087885515d7aa606f1021305838da97f3d','8dfac9edda2703d21de9ececfa1ff682954e67cbcf3a05c6399b77b464491525','8dfac9edda2703d21de9ececfa1ff682954e67cbcf3a05c6399b77b464491525','0600c9dd38a9c3c89b9729eef6f1d3ddad9094ffe5ba790ee4af5bb2db26ca8a'] },
] as const;
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
test.each(captures)('preserves captured generators1–4 on $size exactly', capture => {
  for (const version of [1,2,3,4] as const) {
    const world = generateWorld(20260905, capture.size, 8, version);
    for (const key of ['terrain','fertility','waterDepth'] as const) expect(hash(world[key])).toBe(capture[key]);
    expect(hash(world.biome)).toBe(capture.biomes[version - 1]); expect(world.starts).toEqual(capture.starts);
    expect(hash(Uint8Array.from(world.terrain, (_, cell) => naturalFeatures(world, cell)))).toBe(capture.features);
    expect(world.layout).toBe('legacy'); expect(world.hydrology.every(value => value === 0)).toBe(true);
  }
});
