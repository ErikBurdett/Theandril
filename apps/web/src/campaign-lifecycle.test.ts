import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// Source-level identity guard complements the real load/import browser scenario.
// Do not mount App with a mocked worker or replace its imperative renderer.
const source = ts.createSourceFile('main.tsx', readFileSync(new URL('./main.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function keyFor(component: string, epoch: number): unknown {
  let expression: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === component) {
      const key = node.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.getText(source) === 'key');
      if (key && ts.isJsxAttribute(key) && key.initializer && ts.isJsxExpression(key.initializer)) expression = key.initializer.expression?.getText(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!expression) throw new Error(`Missing campaign reset key on ${component}`);
  return runInNewContext(expression, { registryEpoch: epoch });
}

describe('campaign presentation replacement identity', () => {
  it('gives overview and battlefield distinct identities while resetting both on every campaign epoch', () => {
    const overview: unknown[] = [], battlefield: unknown[] = [];
    for (const epoch of [0, 1, 2, 8]) {
      overview.push(keyFor('FactionOverviewControl', epoch));
      battlefield.push(keyFor('BattlefieldPanel', epoch));
      expect(overview.at(-1)).not.toBe(battlefield.at(-1));
    }
    expect(new Set(overview).size).toBe(4);
    expect(new Set(battlefield).size).toBe(4);
  });
});
