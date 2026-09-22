import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, createRoutePreviewer, getMovementPreview, getObservation, type Observation } from './index';
import { previewCorpus } from '../../../docs/development/2026-09-21-campaign-continuation/movement-preview/corpus';

/** Every answer must be the ordinary preview, or null where that preview is a blocked, non-queueable result. */
function expectEquivalent(view: Observation, armyId: string, targets: Iterable<number>) {
  const previewer = createRoutePreviewer(view);
  let skipped = 0, compared = 0;
  for (const target of targets) {
    const expected = getMovementPreview(view, armyId, target), actual = previewer(armyId, target);
    if (actual === null) {
      skipped++;
      expect(expected).toMatchObject({ action: 'blocked', canQueue: false, canMoveNow: false, path: [] });
    } else { compared++; expect(actual).toStrictEqual(expected); }
  }
  return { skipped, compared };
}

describe('route previewer answers repeated planner queries exactly', () => {
  it.each(previewCorpus().filter(item => !item.append))('$name keeps every ordinary preview', item => {
    const targets = [item.target, item.view.armies[0]!.cell, ...Array.from({ length: 64 }, (_, index) => (index * 67) % (item.view.width * item.view.height))];
    expectEquivalent(item.view, item.armyId, targets);
  });

  it('skips only targets outside a proven reachable basin and still previews attacks and sieges there', () => {
    const naval = structuredClone(previewCorpus().find(item => item.name === 'coastal-shallow-preview')!);
    const view = naval.view, width = view.width;
    // A land wall splits the shallow water; the fleet sits east of it.
    for (const cell of view.cells) if (cell.cell % width === 10) { cell.terrain = 1; cell.waterDepth = 0; }
    const west = Array.from({ length: 64 }, (_, row) => row * width + 4), east = Array.from({ length: 64 }, (_, row) => row * width + 18);
    const hostile = { ...structuredClone(view.armies[0]!), id: 'army.hostile', factionId: 'faction.other', cell: 20 * width + 5 };
    view.armies.push(hostile); view.wars = ['faction.other'];
    const { skipped, compared } = expectEquivalent(view, naval.armyId, [west[0]!, ...west, ...east, hostile.cell]);
    expect(skipped).toBe(west.length); // Only the first unreachable target searches (it is repeated); the hostile cell is always previewed.
    expect(compared).toBe(east.length + 2);
  });

  it('matches every army and a spread of targets in real generated observations', () => {
    const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 4, pace: 'short' });
    let totals = { skipped: 0, compared: 0 };
    for (let turn = 0; turn < 12; turn++) {
      const view = getObservation(game, game.turnOwnerId);
      for (const army of view.armies.filter(item => item.factionId === view.factionId)) {
        const result = expectEquivalent(view, army.id, view.cells.filter((_, index) => index % 5 === turn % 5).map(cell => cell.cell));
        totals = { skipped: totals.skipped + result.skipped, compared: totals.compared + result.compared };
      }
      expect(applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    }
    expect(totals.compared).toBeGreaterThan(100);
  });
});
