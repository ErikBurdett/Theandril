import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, cpus, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Invoke with the same Node 22 executable for every case. No test selection,
// timeouts, isolation, pool, ordering or campaign-work parameters are changed.
const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, '../../../..');
const [label, workers, option] = process.argv.slice(2);
if (!label || !/^[a-z0-9-]+$/.test(label) || !['default', '8', '4'].includes(workers) || (option && option !== '--dry-run')) {
  throw new Error('Usage: node measure.mjs <unique-label> <default|8|4> [--dry-run]');
}
if (process.env.VITEST_MAX_WORKERS) throw new Error('Unset VITEST_MAX_WORKERS so it cannot override the requested case.');
const report = resolve(evidence, `${label}.vitest.json`);
const log = resolve(evidence, `${label}.log`);
const timing = resolve(evidence, `${label}.time.txt`);
const summaryPath = resolve(evidence, `${label}.summary.json`);
const args = [resolve(root, 'node_modules/vitest/vitest.mjs'), 'run', '--reporter=default', '--reporter=json', `--outputFile.json=${report}`];
if (workers !== 'default') args.push(`--maxWorkers=${workers}`);
// Paths/commands remain positional arguments; only this fixed script is shell code.
// Redirect the measured command's stderr to its stdout, retaining only Bash's
// elapsed/user/system accounting in the separate timing artifact.
const timingScript = "case_timing=$1; shift; TIMEFORMAT='elapsed_seconds=%R\nuser_seconds=%U\nsystem_seconds=%S'; { time \"$@\" 2>&1; } 2>\"$case_timing\"";
const shellArgs = ['-c', timingScript, 'theandril-suite-time', timing, process.execPath, ...args];
if (option === '--dry-run') {
  console.log(JSON.stringify({ root, command: ['/usr/bin/bash', ...shellArgs], outputs: { report, log, timing, summaryPath } }, null, 2));
  process.exit(0);
}
mkdirSync(evidence, { recursive: true });
for (const path of [report, log, timing, summaryPath]) if (existsSync(path)) throw new Error(`Refusing to overwrite retained evidence: ${path}`);
const sha256 = data => createHash('sha256').update(data).digest('hex');
function sourceManifest() {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, maxBuffer: 16 * 1024 * 1024 }).toString().split('\0');
  const roots = new Set(['package.json', 'pnpm-lock.yaml', 'vitest.config.ts', 'tsconfig.json', 'tsconfig.base.json', 'pnpm-workspace.yaml']);
  return Object.fromEntries([...new Set(files)].filter(file => file && existsSync(resolve(root, file)) &&
    (roots.has(file) || /^(packages|apps|tests|scripts)\/.*\.(ts|tsx|js|jsx|mjs|cjs|json|yaml|yml)$/.test(file))).sort()
    .map(file => [file, sha256(readFileSync(resolve(root, file)))]));
}
const before = sourceManifest();
const manifestPath = resolve(evidence, 'source-manifest.json');
if (existsSync(manifestPath)) {
  if (JSON.stringify(JSON.parse(readFileSync(manifestPath, 'utf8'))) !== JSON.stringify(before)) throw new Error('Source/config manifest differs from the earlier case. Use a new experiment directory or investigate; do not compare these cases.');
} else writeFileSync(manifestPath, JSON.stringify(before, null, 2) + '\n', { flag: 'wx' });
const started = new Date().toISOString();
const descriptor = openSync(log, 'wx');
const child = spawn('/usr/bin/bash', shellArgs, { cwd: root, env: process.env, stdio: ['ignore', descriptor, descriptor] });
let terminationSignal = null;
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { terminationSignal = signal; child.kill(signal); });
const result = await new Promise(resolveResult => {
  child.once('error', error => resolveResult({ exitCode: null, signal: null, error: error.message }));
  child.once('close', (exitCode, signal) => resolveResult({ exitCode, signal, error: null }));
});
closeSync(descriptor);
const after = sourceManifest();
const sourceStable = JSON.stringify(before) === JSON.stringify(after);
let details = null;
if (existsSync(report)) {
  const parsed = JSON.parse(readFileSync(report, 'utf8'));
  const epic = parsed.testResults?.flatMap(file => file.assertionResults ?? []).find(test => test.fullName?.includes('generated-start epic AI victory'));
  details = Object.fromEntries(['success', 'numTotalTests', 'numPassedTests', 'numFailedTests', 'numPendingTests', 'numTotalTestSuites', 'numPassedTestSuites', 'numFailedTestSuites'].map(key => [key, parsed[key] ?? null]));
  details.testFiles = parsed.testResults?.length ?? null;
  details.epic = epic ? { fullName: epic.fullName, status: epic.status, durationMs: epic.duration ?? null, failureMessages: epic.failureMessages } : null;
}
const summary = { label, started, finished: new Date().toISOString(), node: process.version, executable: process.execPath,
  workers, expectedDefaultWorkerLimit: Math.max(availableParallelism() - 1, 1), availableParallelism: availableParallelism(),
  cpu: cpus()[0]?.model, totalHostMemoryBytes: totalmem(), command: [process.execPath, ...args],
  sourceManifestSha256: sha256(readFileSync(manifestPath)), sourceStable, terminationSignal, ...result, details,
  timing: existsSync(timing) ? Object.fromEntries([...readFileSync(timing, 'utf8').matchAll(/^(elapsed_seconds|user_seconds|system_seconds)=([0-9.]+)$/gm)].map(match => [match[1], Number(match[2])])) : null,
  cachePolicy: 'Unmodified default Vitest cache behavior; no cache reset, custom sequencer or ordering change. Use a reversed-order confirmation pair to assess order/cache effects.',
  measurementLimits: 'Bash builtin time records whole-command elapsed, user and system seconds. No RSS, concurrent process-tree memory or retained-memory measurement is collected. CPU accounting is distinct from wall time.',
  manifestScope: 'Tracked and untracked runtime/test/script source, JSON/YAML inputs and named root configs; not a complete inventory of art assets or imported documentation evidence.',
  artifacts: Object.fromEntries([report, log, timing].filter(existsSync).map(path => [path.slice(evidence.length + 1), sha256(readFileSync(path))])) };
writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary, null, 2));
process.exitCode = sourceStable && !terminationSignal ? result.exitCode ?? 1 : 2;
