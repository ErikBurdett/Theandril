import { describe, expect, it } from 'vitest';
import type { GameCommand } from '@theandril/sim';
import { GroupWorkerPolicyRequests, GroupCharterRequests, GroupOrderRequests, GroupPostingRequests } from './group-posting-requests';
import { MAX_GROUP_ORDER_COMMANDS, type GroupWorkerPolicyResult, type GroupCharterResult, type GroupPostingResult } from './protocol';

interface Ledger<Command, Result> {
  busy: boolean;
  has(id: number): boolean;
  enqueue(id: number, commands: readonly Command[]): Promise<Result[]>;
  validate(id: number, factionId: string, results: unknown, error: unknown): void;
  finish(id: number, result: Result[] | Error): void;
  reset(message: string): void;
}

function correlationCases<Command extends { factionId: string }, Result extends { accepted: boolean; message?: string }>(
  kind: string, create: () => Ledger<Command, Result>, orders: () => Command[], rows: () => Result[], idField: string,
) {
  describe(`group ${kind} response identity`, () => {
    it('accepts exact sorted successes and canonical partial refusals after reversed submission', async () => {
      const ledger = create(), commands = orders().reverse(), results = rows();
      results[1] = { ...results[1]!, accepted: false, message: 'The canonical command refused this actor.' };
      const pending = ledger.enqueue(1, commands);
      ledger.validate(1, 'faction.1', results, undefined);
      ledger.finish(1, results);
      await expect(pending).resolves.toEqual(results);
      expect(ledger.busy).toBe(false);
    });

    it('rejects incomplete, duplicated, reordered, unrelated and malformed arrays without settling uncertainty', async () => {
      const ledger = create(), valid = rows(), sparse = new Array(2);
      sparse[1] = valid[1];
      const resultArrayWithProperty = Object.assign([...valid], { extra: true });
      const invalid: unknown[] = [
        undefined, null, {}, [], [valid[0]], sparse, resultArrayWithProperty,
        [...valid, { ...valid[0], [idField]: 'extra.actor' }], [valid[0], valid[0]], [...valid].reverse(),
        [valid[0], { ...valid[1], [idField]: 'not.submitted' }], [valid[0], null], [valid[0], []],
        [valid[0], { ...valid[1], accepted: 'yes' }], [valid[0], { ...valid[1], extra: true }],
        [valid[0], { ...valid[1], accepted: false }],
        ...['', '   ', 'x'.repeat(10_001), 3, {}, null].flatMap(message => [
          [valid[0], { ...valid[1], accepted: false, message }],
          [valid[0], { ...valid[1], accepted: true, message }],
        ]),
      ];
      const pending = ledger.enqueue(2, orders()), rejected = expect(pending).rejects.toThrow('Restore');
      for (const result of invalid) {
        expect(() => ledger.validate(2, 'faction.1', result, undefined)).toThrow('Some orders may have applied');
        expect(ledger.busy).toBe(true); expect(ledger.has(2)).toBe(true);
      }
      expect(() => ledger.validate(2, 'faction.other', valid, undefined)).toThrow('does not match');
      ledger.finish(2, new Error('Restore the campaign after an uncertain reply.'));
      await rejected;
    });

    it('snapshots requested IDs and faction against later command mutation and keeps stale replies isolated', async () => {
      const ledger = create(), commands = orders(), expected = rows();
      const first = ledger.enqueue(3, commands), reset = expect(first).rejects.toThrow('changed');
      Object.assign(commands[0]!, { factionId: 'faction.changed', [idField]: 'changed.actor' });
      commands.reverse(); commands.length = 0;
      expect(() => ledger.validate(3, 'faction.1', expected, undefined)).not.toThrow();
      await expect(ledger.enqueue(4, orders())).rejects.toThrow('Wait');
      ledger.validate(99, 'wrong', undefined, undefined); ledger.finish(99, []);
      expect(ledger.has(3)).toBe(true);
      ledger.reset('The campaign changed.'); await reset;
      const next = ledger.enqueue(4, orders());
      ledger.validate(3, 'wrong', undefined, undefined); ledger.finish(3, expected);
      expect(ledger.has(4)).toBe(true);
      ledger.validate(4, 'faction.1', expected, undefined); ledger.finish(4, expected);
      await expect(next).resolves.toEqual(expected);
    });

    it('accepts explicit recording-error recovery without interpreting partial rows as success', async () => {
      const ledger = create(), pending = ledger.enqueue(5, orders());
      const rejected = expect(pending).rejects.toThrow('Recording');
      for (const results of [undefined, [], [rows()[0]], { malformed: true }]) {
        expect(() => ledger.validate(5, 'faction.1', results, 'Recording interrupted; restore.')).not.toThrow();
      }
      for (const error of ['', ' ', null, false, {}, 'x'.repeat(10_001)]) {
        expect(() => ledger.validate(5, 'faction.1', [], error)).toThrow('does not match');
      }
      expect(() => ledger.validate(5, 'wrong', [], 'Recording failed.')).toThrow('does not match');
      expect(ledger.busy).toBe(true);
      ledger.finish(5, new Error('Recording interrupted; restore.')); await rejected;
      expect(ledger.busy).toBe(false);
    });

    it('safely rejects invalid metadata before creating a pending request and accepts the128-actor boundary', async () => {
      const ledger = create(), commands = orders();
      const tooMany = Array.from({ length: MAX_GROUP_ORDER_COMMANDS + 1 }, (_, index) => ({ ...commands[0]!, [idField]: `actor.${index}` }));
      const invalid = [[], new Array<Command>(2), tooMany, [commands[0]!, commands[0]!],
        [commands[0]!, { ...commands[1]!, factionId: 'faction.2' }],
        [{ ...commands[0]!, [idField]: '' }], [{ ...commands[0]!, factionId: '' }]];
      for (const input of invalid) {
        await expect(ledger.enqueue(6, input)).rejects.toThrow(); expect(ledger.busy).toBe(false);
      }
      for (const id of [-1, NaN, 1.5, Infinity]) {
        await expect(ledger.enqueue(id, commands)).rejects.toThrow(); expect(ledger.busy).toBe(false);
      }
      const ceilingCommands = tooMany.slice(0, MAX_GROUP_ORDER_COMMANDS);
      const ceilingRows = ceilingCommands.map(command => ({ ...rows()[0]!, [idField]: (command as unknown as Record<string, unknown>)[idField] }))
        .sort((a, b) => String((a as Record<string, unknown>)[idField]).localeCompare(String((b as Record<string, unknown>)[idField])));
      const accepted = ledger.enqueue(7, ceilingCommands);
      expect(() => ledger.validate(7, 'faction.1', ceilingRows, undefined)).not.toThrow();
      ledger.finish(7, ceilingRows); await expect(accepted).resolves.toHaveLength(128);
    });
  });
}

correlationCases<Extract<GameCommand, { type: 'setPosting' }>, GroupPostingResult>('posting', () => new GroupPostingRequests(),
  () => ['army.1', 'army.2'].map(armyId => ({ type: 'setPosting', factionId: 'faction.1', armyId, cell: 12, mode: 'hold' })),
  () => ['army.1', 'army.2'].map(armyId => ({ armyId, accepted: true })), 'armyId');
correlationCases<Extract<GameCommand, { type: 'setCharter' }>, GroupCharterResult>('charter', () => new GroupCharterRequests(),
  () => ['settlement.1', 'settlement.2'].map(settlementId => ({ type: 'setCharter', factionId: 'faction.1', settlementId, focus: 'works', ceiling: 100 })),
  () => ['settlement.1', 'settlement.2'].map(settlementId => ({ settlementId, accepted: true })), 'settlementId');

it('preserves generic request-ID-only behavior for independent clients', async () => {
  const generic = new GroupOrderRequests<{ selected: boolean }>();
  const pending = generic.enqueue(9);
  generic.finish(9, []);
  await expect(pending).resolves.toEqual([]);
});

correlationCases<Extract<GameCommand, { type: 'setWorkerPolicy' }>, GroupWorkerPolicyResult>('worker policy', () => new GroupWorkerPolicyRequests(),
  () => ['settlement.1', 'settlement.2'].map(settlementId => ({ type: 'setWorkerPolicy', factionId: 'faction.1', settlementId, focus: 'balanced' })),
  () => ['settlement.1', 'settlement.2'].map(settlementId => ({ settlementId, accepted: true })), 'settlementId');
