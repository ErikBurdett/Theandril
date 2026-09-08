import { describe, expect, it } from 'vitest';
import { inspectAnimationCoverage, type AnimationCoverageInput } from './animation-coverage';
import { encodePng } from './png';
import { sha256 } from './provenance';
import type { RuntimeAsset, RuntimeCatalog } from './runtime';

interface Sample { tone: number; hiddenRgb?: number; state?: string; direction?: string }
function fixture(specs: { id: string; type: RuntimeAsset['type']; samples: Sample[] }[]) {
  const width = Math.max(2, specs.reduce((sum, spec) => sum + spec.samples.length * 2, 0));
  const pixels = new Uint8Array(width * 2 * 4); let x = 0;
  const assets: RuntimeAsset[] = specs.map(spec => {
    const indices = new Map<string, number>();
    const frames = spec.samples.map(sample => {
      const state = sample.state ?? 'idle', direction = sample.direction ?? 'se', group = `${state}/${direction}`, index = indices.get(group) ?? 0;
      indices.set(group, index + 1);
      const frame = { id: `${spec.id}/${group}/${index}`, frame: { x, y: 0, w: 2, h: 2 }, direction, state, index, durationMs: 250 };
      pixels.set([sample.tone, sample.tone, sample.tone, 255], x * 4);
      pixels.set([sample.hiddenRgb ?? 0, 0, 0, 0], (x + 1) * 4); x += 2;
      return frame;
    });
    const clips = [...indices.keys()].map(group => {
      const sequence = frames.filter(frame => `${frame.state}/${frame.direction}` === group);
      return { id: `${spec.id}/${group}`, state: sequence[0]!.state, direction: sequence[0]!.direction,
        frames: sequence.map(frame => frame.id), durationsMs: sequence.map(frame => frame.durationMs), loop: true };
    });
    return { id: spec.id, type: spec.type, status: 'ATLASED', contentIds: [spec.id], nativeResolution: { width: 2, height: 2 },
      pivot: [1, 1], atlasId: 'test', frames, clips, validation: { passed: true, score: 100, reportPath: 'test/report.json' },
      provenance: { provider: 'technical-fixture', promptHash: '0'.repeat(64), sourceRefs: ['tests/fixture.ts'], licenseNotes: ['Synthetic inventory fixture; no production approval.'] },
      review: { reviewer: 'Technical test', reviewedAt: '2026-09-07T00:00:00.000Z', notes: 'Synthetic fixture, never production artwork.', evidencePaths: ['tests/review.txt'], inputHash: '1'.repeat(64) } };
  });
  const bytes = encodePng({ width, height: 2, data: pixels });
  const catalog: RuntimeCatalog = { schemaVersion: 1, palette: { id: 'test.palette', version: 1, colors: ['#111111'] },
    atlases: [{ id: 'test', imageUrl: '/art/test.png', jsonUrl: '/art/test.json', width, height: 2, sha256: sha256(bytes) }], assets };
  return { catalog, atlasPngs: new Map([['test', bytes]]), liveBindings: specs.map(spec => spec.id) };
}

describe('read-only approved animation coverage inventory', () => {
  it('counts unique visible pixels, not repeated frames, timings, transparent RGB or different still facings', () => {
    const input = fixture([
      { id: 'unit.repeat', type: 'unit', samples: [{ tone: 20 }, { tone: 20, hiddenRgb: 200 }, { tone: 20 }, { tone: 20 }] },
      { id: 'unit.motion', type: 'unit', samples: [{ tone: 20 }, { tone: 30 }, { tone: 20 }] },
      { id: 'unit.facings', type: 'unit', samples: [{ tone: 20, direction: 'e' }, { tone: 30, direction: 'w' }] },
    ]);
    const report = inspectAnimationCoverage(input), repeated = report.assets.find(asset => asset.id === 'unit.repeat')!;
    expect(report.summary.live).toMatchObject({ assets: 3, animatedAssets: 1, staticAssets: 2, repeatedStillClips: 1 });
    expect(repeated.clips[0]).toMatchObject({ frameCount: 4, uniqueVisibleFrames: 1, repeatedFrameCount: 3, pixelEvidence: 'repeated-still', durationMs: 1000 });
    expect(repeated.frames[0]!.rgbaSha256).not.toBe(repeated.frames[1]!.rgbaSha256);
    expect(repeated.frames[0]!.visiblePixelSha256).toBe(repeated.frames[1]!.visiblePixelSha256);
    expect(report.assets.find(asset => asset.id === 'unit.motion')!.clips[0]).toMatchObject({ uniqueVisibleFrames: 2, repeatedFrameCount: 1, pixelEvidence: 'pixel-varying' });
    expect(report.assets.find(asset => asset.id === 'unit.facings')).toMatchObject({ uniqueVisibleFrames: 2, animation: 'static' });
    expect(report.qualityApproval).toBe(false);
  });

  it('separates terrain, future assets, current static consumers and actual playback states', () => {
    const input = fixture([
      { id: 'terrain.forest', type: 'terrain', samples: [{ tone: 10 }, { tone: 20 }] },
      { id: 'effect.future', type: 'effect', samples: [{ tone: 10 }, { tone: 20 }] },
      { id: 'unit.live', type: 'unit', samples: [{ tone: 10 }, { tone: 20 }, { tone: 30, state: 'attack' }, { tone: 40, state: 'attack' }] },
      { id: 'ui.crest', type: 'ui', samples: [{ tone: 10 }] },
    ]);
    input.liveBindings = ['terrain.forest', 'unit.live', 'ui.crest', 'unit.missing'];
    const report = inspectAnimationCoverage({ ...input, playbackBindings: [{ contentId: 'unit.live', states: ['idle'] }] });
    expect(report.summary).toMatchObject({ catalogAssets: 4, excludedTerrainAssets: 1, live: { assets: 2, animatedAssets: 1, unusedClips: 2, unusedPixelVaryingClips: 1 }, future: { assets: 1, animatedAssets: 1, playbackBoundClips: 0 } });
    expect(report.assets.some(asset => asset.id === 'terrain.forest')).toBe(false);
    expect(report.excludedTerrain).toEqual([{ id: 'terrain.forest', frameCount: 2 }]);
    expect(report.missingLiveBindings).toEqual(['unit.missing']);
    expect(report.assets.find(asset => asset.id === 'unit.live')!.clips.map(clip => [clip.state, clip.playbackBound])).toEqual([['attack', false], ['idle', true]]);
    expect(report.assets.find(asset => asset.id === 'effect.future')!.usage).toBe('future-only');
  });

  it('distinguishes character, improvement and fixed-object rollout without inventing locomotion or spells', () => {
    const input = fixture([
      { id: 'character.engineer.ashen_compact', type: 'unit', samples: [{ tone: 20 }] },
      { id: 'improvement.quarry', type: 'map-object', samples: [{ tone: 20 }] },
      { id: 'map.ruin', type: 'map-object', samples: [{ tone: 20 }] },
      { id: 'settlement.city', type: 'settlement', samples: [{ tone: 20 }] },
      { id: 'ui.banner', type: 'ui', samples: [{ tone: 20 }] },
    ]);
    const report = inspectAnimationCoverage(input);
    expect(report.assets.map(asset => asset.role)).toEqual(['character', 'improvement', 'map-prop', 'settlement', 'ui']);
    expect(report.assets[0]!.rollout.map(slot => [slot.slot, slot.phase, slot.applicability, slot.needsFrames])).toEqual([
      ['idle', 'future-rollout', 'planned', true], ['move', 'future-rollout', 'planned', true], ['action', 'future-rollout', 'planned', true],
    ]);
    for (const asset of report.assets.slice(1)) expect(asset.rollout.find(slot => slot.slot === 'move')).toMatchObject({ applicability: 'not-applicable', suggestedFrames: null, needsFrames: false });
    expect(report.assets[0]!.rollout.find(slot => slot.slot === 'action')!.note).toContain('grants no attack, spell');
  });

  it('is stable under catalog/set order, pure and detached while retaining clip playback order', () => {
    const input = fixture([{ id: 'unit.z', type: 'unit', samples: [{ tone: 10 }, { tone: 20 }] }, { id: 'unit.a', type: 'unit', samples: [{ tone: 30 }] }]);
    const before = structuredClone(input), first = inspectAnimationCoverage(input);
    const reversed = structuredClone(input); reversed.catalog.assets.reverse(); reversed.liveBindings.reverse();
    for (const asset of reversed.catalog.assets) { asset.frames.reverse(); asset.clips.reverse(); }
    expect(inspectAnimationCoverage(reversed)).toEqual(first); expect(input).toEqual(before);
    first.assets[0]!.contentIds.push('unit.changed'); first.assets[1]!.clips[0]!.frameIds.reverse(); first.assets[0]!.nativeResolution.width = 1;
    expect(inspectAnimationCoverage(input)).toEqual(inspectAnimationCoverage(before)); expect(input).toEqual(before);
  });

  it('handles an empty approved catalog without manufacturing work or requiring images', () => {
    const base = fixture([]), input = { ...base, catalog: { ...base.catalog, atlases: [] }, atlasPngs: new Map<string, Uint8Array>() };
    expect(inspectAnimationCoverage(input)).toMatchObject({ assets: [], excludedTerrain: [], missingLiveBindings: [], summary: { catalogAssets: 0, allNonTerrain: { assets: 0, frames: 0, clips: 0 } } });
  });

  it('rejects malformed metadata, missing frames, incorrect timing and non-approved catalog entries', () => {
    const mutations: ((input: ReturnType<typeof fixture>) => void)[] = [
      input => { input.catalog.assets[0]!.clips[0]!.durationsMs[0] = 0; },
      input => { input.catalog.assets[0]!.clips[0]!.frames[0] = 'unit.missing/idle/se/0'; },
      input => { input.catalog.assets[0]!.clips[0]!.durationsMs.push(10); },
      input => { input.catalog.assets[0]!.frames[0]!.frame.x = 100; },
      input => { input.catalog.assets.push(structuredClone(input.catalog.assets[0]!)); },
      input => { input.catalog.assets[0]!.validation.passed = false; },
    ];
    for (const mutate of mutations) { const input = fixture([{ id: 'unit.test', type: 'unit', samples: [{ tone: 20 }] }]); mutate(input); expect(() => inspectAnimationCoverage(input)).toThrow(); }
    const input = fixture([{ id: 'unit.test', type: 'unit', samples: [{ tone: 20 }] }]);
    const catalog = { ...input.catalog, assets: input.catalog.assets.map(asset => ({ ...asset, status: 'CANDIDATE' })) };
    expect(() => inspectAnimationCoverage({ ...input, catalog })).toThrow();
  });

  it('rejects missing/corrupt/extra atlas PNGs and dimensions inconsistent with the catalog', () => {
    const input = fixture([{ id: 'unit.test', type: 'unit', samples: [{ tone: 20 }] }]);
    expect(() => inspectAnimationCoverage({ ...input, atlasPngs: new Map() })).toThrow(/set differs/);
    expect(() => inspectAnimationCoverage({ ...input, atlasPngs: new Map([['extra', input.atlasPngs.get('test')!]]) })).toThrow(/Missing or oversized/);
    const corrupt = input.atlasPngs.get('test')!.slice(); corrupt[40] = corrupt[40]! ^ 255;
    expect(() => inspectAnimationCoverage({ ...input, atlasPngs: new Map([['test', corrupt]]) })).toThrow(/mismatched/);
    input.catalog.atlases[0]!.width += 1;
    expect(() => inspectAnimationCoverage(input)).toThrow(/dimensions differ/);
  });

  it('rejects contradictory or duplicate consumer contracts', () => {
    const input = fixture([{ id: 'unit.test', type: 'unit', samples: [{ tone: 20 }] }]);
    const mutations: Partial<AnimationCoverageInput>[] = [
      { liveBindings: ['unit.test', 'unit.test'] },
      { playbackBindings: [{ contentId: 'unit.dead', states: ['idle'] }] },
      { playbackBindings: [{ contentId: 'unit.test', states: ['idle', 'idle'] }] },
      { playbackBindings: [{ contentId: 'unit.test', states: ['idle'] }, { contentId: 'unit.test', states: ['move'] }] },
    ];
    for (const change of mutations) expect(() => inspectAnimationCoverage({ ...input, ...change })).toThrow();
  });
});
