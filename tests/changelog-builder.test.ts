import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildFeed, CHANGELOG_GIT_LIMITS } from '../scripts/build-changelog';
import type { ChangelogEntry } from '../apps/web/src/updates/changelog';

const roots: string[] = [];
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function repository() {
  const root = mkdtempSync(join(tmpdir(), 'theandril-changelog-')); roots.push(root);
  git(root, 'init', '--initial-branch=main');
  git(root, 'config', 'user.name', 'History Fixture'); git(root, 'config', 'user.email', 'history@example.invalid');
  git(root, 'config', 'commit.gpgsign', 'false');
  git(root, 'config', 'gc.auto', '0');
  // Deliberately different local settings must not change the pinned numstat contract.
  git(root, 'config', 'diff.algorithm', 'histogram'); git(root, 'config', 'core.quotepath', 'true');
  return root;
}
function commit(root: string, subject: string, empty = false) {
  git(root, 'add', '--all');
  git(root, 'commit', ...(empty ? ['--allow-empty'] : []), '-m', subject);
  return git(root, 'rev-parse', 'HEAD');
}

/** Independent pre-batching algorithm retained as an oracle. In particular this
 * uses one git show with an empty format per commit, not the new header parser. */
function legacyFeed(root: string): ChangelogEntry[] {
  return git(root, 'log', '--first-parent', '--format=%H%x1f%an%x1f%aI%x1f%s%x1f%b%x1e').split('\x1e').filter(record => record.trim()).map(record => {
    const [sha = '', author = '', date = '', subject = '', body = ''] = record.trim().split('\x1f');
    const stat = git(root, '-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', '-c', 'diff.algorithm=myers', 'show', '--format=', '--numstat', '--no-renames', '--ignore-cr-at-eol', sha).split('\n').filter(Boolean);
    let insertions = 0, deletions = 0;
    const areas = new Set<string>();
    for (const line of stat) {
      const [added, removed, path = ''] = line.split('\t');
      insertions += Number(added) || 0; deletions += Number(removed) || 0;
      const parts = path.split('/'); areas.add(parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0]!);
    }
    const note = join(root, 'docs/updates/changelog', `${sha}.md`);
    return { sha, shortSha: sha.slice(0, 7), author, date, subject, body: body.trim(), files: stat.length, insertions, deletions, areas: [...areas].sort().slice(0, 5), ...(existsSync(note) ? { notes: readFileSync(note, 'utf8').trim() } : {}) };
  });
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('batched changelog history', () => {
  it('preserves the old per-commit output capacity throughout a bounded statistics batch', () => {
    const oldPerCommitLimit = 1024 * 1024;
    // SHA-256 IDs plus framing fit within 128 bytes. A full batch of individually
    // supported 1MiB numstats must still fit; sharing 16MiB regressed that contract.
    const required = CHANGELOG_GIT_LIMITS.statBatchSize * (oldPerCommitLimit + 128);
    expect(CHANGELOG_GIT_LIMITS.statMaxBuffer).toBeGreaterThanOrEqual(required);
    expect(CHANGELOG_GIT_LIMITS.statMaxBuffer).toBeLessThanOrEqual(33 * 1024 * 1024);
    expect(CHANGELOG_GIT_LIMITS.statWorkers).toBe(2);
  });

  it('preserves root, binary, empty, quoted paths, renames, bodies, notes and merge statistics', async () => {
    const root = repository();
    writeFileSync(join(root, 'shared.txt'), 'root\n');
    const first = commit(root, 'Root');
    writeFileSync(join(root, 'binary.dat'), Buffer.from([0, 1, 2, 0, 255]));
    const binary = commit(root, 'Binary');
    const empty = commit(root, 'Empty', true);
    const strange = 'tab\tline\nseparator\x1e.txt';
    writeFileSync(join(root, strange), 'one\r\ntwo\r\n');
    const quoted = commit(root, 'Quoted path\n\nA body with multiple lines.\nAnother line.');
    renameSync(join(root, strange), join(root, 'renamed.txt'));
    const renamed = commit(root, 'Rename is recorded without rename heuristics');
    git(root, 'checkout', '-b', 'side');
    writeFileSync(join(root, 'side.txt'), 'side\n'); commit(root, 'Side only');
    git(root, 'checkout', 'main');
    writeFileSync(join(root, 'main.txt'), 'main\n'); commit(root, 'Main only');
    git(root, 'merge', '--no-ff', 'side', '-m', 'Clean merge');
    const cleanMerge = git(root, 'rev-parse', 'HEAD');
    git(root, 'checkout', '-b', 'conflict');
    writeFileSync(join(root, 'shared.txt'), 'side change\n'); commit(root, 'Side conflict');
    git(root, 'checkout', 'main');
    writeFileSync(join(root, 'shared.txt'), 'main change\n'); commit(root, 'Main conflict');
    expect(() => git(root, 'merge', '--no-ff', 'conflict', '-m', 'Resolved merge')).toThrow();
    writeFileSync(join(root, 'shared.txt'), 'resolved uniquely\nsecond resolution line\n');
    const resolvedMerge = commit(root, 'Resolved merge');
    mkdirSync(join(root, 'docs/updates/changelog'), { recursive: true });
    writeFileSync(join(root, 'docs/updates/changelog', `${first}.md`), '  A preserved root note.\n');

    const expected = legacyFeed(root), result = await buildFeed(root);
    expect(result).toEqual(expected); expect(await buildFeed(root)).toEqual(expected);
    const entry = (sha: string) => result.find(item => item.sha === sha)!;
    expect(entry(first)).toMatchObject({ files: 1, insertions: 1, deletions: 0, notes: 'A preserved root note.' });
    expect(entry(binary)).toMatchObject({ files: 1, insertions: 0, deletions: 0 });
    expect(entry(empty)).toMatchObject({ files: 0, insertions: 0, deletions: 0, areas: [] });
    expect(entry(quoted)).toMatchObject({ files: 1, insertions: 2, body: 'A body with multiple lines.\nAnother line.' });
    expect(entry(renamed)).toMatchObject({ files: 2, insertions: 2, deletions: 2 });
    // git show's numstat includes the side's addition at this clean merge;
    // changing to a log/diff-tree default can silently drop those statistics.
    expect(entry(cleanMerge)).toMatchObject({ files: 1, insertions: 1, deletions: 0 });
    expect(entry(resolvedMerge).files).toBeGreaterThan(0);
    expect(result.some(item => item.subject === 'Side only' || item.subject === 'Side conflict')).toBe(false);
    expect(result.every(item => item.shortSha === item.sha.slice(0, 7))).toBe(true);
  });

  it('preserves metadata order and distinct empty/changed commits across asynchronous batch boundaries', async () => {
    const root = repository();
    writeFileSync(join(root, 'counter.txt'), '0\n'); commit(root, 'Root');
    for (let index = 1; index <= 35; index++) {
      if (index % 2) writeFileSync(join(root, 'counter.txt'), `${index}\n`);
      commit(root, `Step ${index}`, index % 2 === 0);
    }
    const result = await buildFeed(root);
    expect(result).toEqual(legacyFeed(root)); expect(result).toHaveLength(36);
    expect(result.map(entry => entry.subject)).toEqual([...Array.from({ length: 35 }, (_, index) => `Step ${35 - index}`), 'Root']);
    for (const entry of result.slice(0, -1)) {
      const step = Number(entry.subject.slice(5));
      expect(entry).toMatchObject(step % 2 ? { files: 1, insertions: 1, deletions: 1 } : { files: 0, insertions: 0, deletions: 0 });
    }
    expect(result.at(-1)).toMatchObject({ subject: 'Root', files: 1, insertions: 1, deletions: 0 });
  });

  it('rejects Git failures instead of returning an empty or partial history', async () => {
    const root = repository();
    await expect(buildFeed(root)).rejects.toThrow();
    writeFileSync(join(root, 'first.txt'), 'A complete root.\n'); commit(root, 'Recover with a real commit');
    expect(await buildFeed(root)).toEqual(legacyFeed(root));
    await expect(buildFeed(join(root, 'missing'))).rejects.toThrow();
    // Metadata still succeeds, but numstat must reject this damaged fixture's
    // missing blob. Never silently turn a failed statistics child into zeros.
    const blob = git(root, 'rev-parse', 'HEAD:first.txt');
    const object = join(root, '.git/objects', blob.slice(0, 2), blob.slice(2));
    const bytes = readFileSync(object);
    rmSync(object);
    expect(git(root, 'log', '--format=%s')).toBe('Recover with a real commit');
    await expect(buildFeed(root)).rejects.toThrow();
    writeFileSync(object, bytes);
    expect(await buildFeed(root)).toEqual(legacyFeed(root));
  });
});
