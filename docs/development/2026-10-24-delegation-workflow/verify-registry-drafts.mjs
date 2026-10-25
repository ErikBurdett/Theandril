/** Read-only compiler overlay: drafts resolve at their eventual source paths,
 * without applying the patch or writing application/discovered-test files. */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = process.cwd();
const packet = path.join(root, 'docs/development/2026-10-24-delegation-workflow');
const virtual = new Map([
  ['apps/web/src/army-order-status.ts', 'army-order-status.ts.txt'],
  ['apps/web/src/realm-navigation.tsx', 'realm-navigation.tsx.txt'],
  ['apps/web/src/army-order-status.test.ts', 'army-order-status.test.ts.txt'],
  ['apps/web/src/realm-order-filter.test.tsx', 'realm-order-filter.test.tsx.txt'],
  ['tests/gameplay/army-order-filter-fixture.ts', 'army-order-filter-fixture.ts.txt'],
  ['tests/production/army-order-filter.spec.ts', 'army-order-filter.spec.ts.txt'],
].map(([target, draft]) => [path.join(root, target), fs.readFileSync(path.join(packet, draft), 'utf8')]));
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const options = { ...parsed.options, noEmit: true };
const host = ts.createCompilerHost(options);
const read = host.readFile.bind(host), exists = host.fileExists.bind(host), source = host.getSourceFile.bind(host);
host.readFile = file => virtual.get(path.resolve(file)) ?? read(file);
host.fileExists = file => virtual.has(path.resolve(file)) || exists(file);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => {
  const text = virtual.get(path.resolve(file));
  return text === undefined ? source(file, languageVersion, onError, shouldCreateNewSourceFile)
    : ts.createSourceFile(file, text, languageVersion, true);
};
const program = ts.createProgram([...virtual.keys()], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  process.stderr.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => '\n',
  }));
  process.exitCode = 1;
} else console.log('All six unapplied source/test/fixture drafts typecheck through a read-only compiler overlay. No runtime files were written; no browser or unit test was executed.');
