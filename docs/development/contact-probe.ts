import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { deserializeGame, getMovementQuery, type Observation } from '../../packages/sim/src/index';
import { neighbors, hexDistance, TERRAIN } from '../../packages/mapgen/src/index';
import { createSeaKnowledge } from '../../packages/ai/src/sea-knowledge';
import { createNavigation } from '../../packages/ai/src/navigation';
const read = (name: string) => gunzipSync(readFileSync(new URL(`./contact-before-${name}.json.gz`, import.meta.url))).toString();
const initial = deserializeGame(read('initial'));
const components = new Map<number, { size: number; edge: boolean; box: number[] }>();
function actualBasin(origin: number) {
  const cached = components.get(origin); if (cached) return cached;
  const { width, height, terrain } = initial.world, queue = [origin], seen = new Set(queue);
  let edge = false;
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i]!, x = cell % width, y = Math.floor(cell / width);
    edge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;
    for (const next of neighbors(cell, width, height)) if (terrain[next] === TERRAIN.water && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
  const result = { size: seen.size, edge, box: [Math.min(...queue.map(c => c % width)), Math.min(...queue.map(c => Math.floor(c / width))), Math.max(...queue.map(c => c % width)), Math.max(...queue.map(c => Math.floor(c / width)))] };
  for (const cell of queue) components.set(cell, result); return result;
}
for (const turn of [40, 60, 80, 100]) {
  const view = JSON.parse(read(`turn${turn}-view`)) as Observation;
  const sea = createSeaKnowledge(view), nav = createNavigation(view), cells = new Map(view.cells.map(c => [c.cell, c]));
  const fleet = view.armies.find(a => a.unitId === 'unit.ocean_warship')!;
  const center = Math.floor(view.height / 2) * view.width + Math.floor(view.width / 2);
  const shores = new Set(view.cells.filter(c => c.terrain !== 0 && c.terrain !== 4 && neighbors(c.cell, view.width, view.height).some(n => cells.get(n)?.terrain === 0) && neighbors(c.cell, view.width, view.height).some(n => !cells.has(n))).map(c => c.cell));
  const nearShore = (cell: number) => [...shores].some(s => hexDistance(s, cell, view.width) <= 5);
  const candidates = getMovementQuery({ ...view, cells: view.cells.filter(c => c.visible) }, fleet.id).reachable.map(c => {
    const gain = nav.informationGain(c.cell, fleet.sight), near = nearShore(c.cell), inward = hexDistance(fleet.cell, center, view.width) - hexDistance(c.cell, center, view.width);
    return { cell: c.cell, xy: [c.cell % view.width, Math.floor(c.cell / view.width)], gain, near, inward, score: gain * (near ? 250 : 100) + (gain > 0 ? inward * 200 : 0) };
  }).sort((a, b) => b.score - a.score);
  console.log(JSON.stringify({ turn, fleets: view.armies.filter(a => a.domain === 'naval').map(a => ({ id: a.id, cell: a.cell, observedStatus: sea.basinStatus(a.cell), actualBasin: actualBasin(a.cell) })), oceanCandidates: candidates.slice(0, 8), mostInward: [...candidates].sort((a, b) => b.inward - a.inward || b.gain - a.gain).slice(0, 4) }));
}
