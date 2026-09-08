import { expect, test } from 'vitest';
import { checksum } from '@theandril/content';
import { isLake, riverSize } from '@theandril/mapgen';
import { createGame, deserializeGame, serializeGame } from './index';

test('checksum-valid geography corruption is rejected instead of regenerating or repairing a world', () => {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 4, layout: 'continents' });
  const original = serializeGame(game);
  const lake = [...game.world.hydrology.keys()].find(cell => isLake(game.world.hydrology[cell]!))!;
  const river = [...game.world.hydrology.keys()].find(cell => riverSize(game.world.hydrology[cell]!) > 0)!;
  expect(lake).toBeDefined(); expect(river).toBeDefined();
  type WorldData = { hydrology: number[]; waterDepth: number[]; generatorVersion: number; layout: string };
  const changes: { mutate: (world: WorldData) => void; error: RegExp }[] = [
    { mutate: world => { world.hydrology.pop(); }, error: /hydrology dimensions/ },
    { mutate: world => { world.hydrology[river] = 64; }, error: /63/ },
    { mutate: world => { world.hydrology[river] = 8; }, error: /Invalid hydrology cell/ },
    { mutate: world => { world.waterDepth[lake] = 2; }, error: /freshwater lakes/ },
    { mutate: world => { world.layout = 'legacy'; }, error: /geography.*generator/ },
    { mutate: world => { world.generatorVersion = 4; }, error: /geography.*generator/ },
  ];
  for (const { mutate, error } of changes) {
    const envelope = JSON.parse(original) as { stateChecksum: string; state: { world: WorldData } };
    mutate(envelope.state.world); envelope.stateChecksum = checksum(JSON.stringify(envelope.state));
    expect(() => deserializeGame(JSON.stringify(envelope))).toThrow(error);
    expect(serializeGame(game)).toBe(original);
  }
  expect(serializeGame(deserializeGame(original))).toBe(original);
});
