import { expect, it } from 'vitest';
import { hitStrategicMarker } from './marker-hit';

it('selects the visible overhanging badge and respects painter order where badges overlap', () => {
  const targets = [
    { cell: 210, entityId: 'town.1', x: 100, y: 100, width: 44, height: 44 },
    { cell: 210, entityId: 'army.1', x: 126, y: 126, width: 44, height: 44 },
  ];
  expect(hitStrategicMarker(targets, 160, 160)?.entityId).toBe('army.1');
  expect(hitStrategicMarker(targets, 135, 135)?.entityId).toBe('army.1');
  expect(hitStrategicMarker(targets, 110, 110)?.entityId).toBe('town.1');
  expect(hitStrategicMarker(targets, 171, 171)).toBeUndefined();
  expect(hitStrategicMarker([], 135, 135)).toBeUndefined();
});
