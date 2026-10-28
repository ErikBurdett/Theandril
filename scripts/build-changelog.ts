import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import type { ChangelogEntry } from '../apps/web/src/updates/changelog';

const root = resolve(import.meta.dirname, '..');
const exec = promisify(execFile);
const git = async (cwd: string, args: readonly string[], maxBuffer = 16 * 1024 * 1024) => (await exec('git', args, { cwd, encoding: 'utf8', maxBuffer })).stdout;
export const CHANGELOG_GIT_LIMITS = Object.freeze({ statBatchSize: 32, statWorkers: 2, statMaxBuffer: 33 * 1024 * 1024 });

/** Numstat must not vary with the clone: autocrlf/attributes, rename heuristics, or the user's diff.algorithm
 * (a global `diff.algorithm=histogram` attributes lines differently from CI's default myers). */
export const gitNumstatArguments = (shas: readonly string[]) => ['-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', '-c', 'diff.algorithm=myers', 'show', '--format=%x1e%H%x1f', '--numstat', '--no-renames', '--ignore-cr-at-eol', ...shas];

/** Keep git show's root/merge semantics, but amortize process and object
 * database setup. Fixed-size SHA batches avoid command-line length growth.
 * Git quotes control characters in numstat paths, so the literal separators
 * distinguish headers even for tab/newline filenames. Empty commits retain a
 * header and must not inherit the next commit's statistics. */
async function readStats(cwd: string, shas: readonly string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  let cursor = 0;
  let failure: { cause: unknown } | undefined;
  // Two statistics children per build at most. Each 33MiB buffer preserves the
  // old 1MiB-per-commit capacity for all 32 entries plus header space; metadata
  // keeps its separate 16MiB limit. Finish
  // active children after a failure, but do not start further batches or return
  // a partial feed. No cache is shared between independent reconstructions.
  await Promise.all(Array.from({ length: CHANGELOG_GIT_LIMITS.statWorkers }, async () => {
    while (!failure && cursor < shas.length) {
      const batch = shas.slice(cursor, cursor + CHANGELOG_GIT_LIMITS.statBatchSize);
      cursor += CHANGELOG_GIT_LIMITS.statBatchSize;
      try {
        const expected = new Set(batch);
        const output = await git(cwd, gitNumstatArguments(batch), CHANGELOG_GIT_LIMITS.statMaxBuffer);
        for (const block of output.split('\x1e')) {
          if (!block.trim()) continue;
          const boundary = block.indexOf('\x1f');
          const sha = block.slice(0, boundary);
          if (boundary < 0 || !expected.delete(sha) || result.has(sha)) throw new Error('Unexpected Git numstat commit boundary.');
          result.set(sha, block.slice(boundary + 1).trim().split('\n').filter(Boolean));
        }
        if (expected.size) throw new Error('Git numstat omitted a requested commit.');
      } catch (cause) { failure ??= { cause }; }
    }
  }));
  if (failure) throw failure.cause;
  return result;
}

/** First-parent history of the current HEAD, newest first. Short SHAs are a fixed 7 characters
 * because Git's %h abbreviation length grows with the object count of the clone that runs it. */
export async function buildFeed(repositoryRoot = root): Promise<ChangelogEntry[]> {
  const commits = (await git(repositoryRoot, ['log', '--first-parent', '--format=%H%x1f%an%x1f%aI%x1f%s%x1f%b%x1e']))
    .split('\x1e').filter(record => record.trim()).map(record => record.trim().split('\x1f'));
  const stats = await readStats(repositoryRoot, commits.map(fields => fields[0]!));
  return commits.map(fields => {
    const sha = fields[0]!, author = fields[1]!, date = fields[2]!, subject = fields[3]!, body = fields[4] ?? '';
    const stat = stats.get(sha)!;
    let insertions = 0, deletions = 0;
    const areas = new Set<string>();
    for (const line of stat) {
      const [added, removed, path = ''] = line.split('\t');
      insertions += Number(added) || 0;
      deletions += Number(removed) || 0;
      const parts = path.split('/');
      areas.add(parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0]!);
    }
    const note = resolve(repositoryRoot, 'docs/updates/changelog', `${sha}.md`);
    return { sha, shortSha: sha.slice(0, 7), author, date, subject, body: body.trim(), files: stat.length, insertions, deletions, areas: [...areas].sort().slice(0, 5), ...(existsSync(note) ? { notes: readFileSync(note, 'utf8').trim() } : {}) };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const output = resolve(root, 'apps/web/src/updates/changelog/feed.json');
  mkdirSync(resolve(output, '..'), { recursive: true });
  writeFileSync(output, `${JSON.stringify(await buildFeed(), null, 2)}\n`);
  console.log(`wrote ${output}`);
}
