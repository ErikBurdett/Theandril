import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ChangelogEntry } from '../apps/web/src/updates/changelog';

const root = resolve(import.meta.dirname, '..');
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

/** Numstat must not vary with the clone: autocrlf/attributes, rename heuristics, or the user's diff.algorithm
 * (a global `diff.algorithm=histogram` attributes lines differently from CI's default myers). */
export const gitNumstatArguments = (sha: string) => ['-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', '-c', 'diff.algorithm=myers', 'show', '--format=', '--numstat', '--no-renames', '--ignore-cr-at-eol', sha];

/** First-parent history of the current HEAD, newest first. Short SHAs are a fixed 7 characters
 * because Git's %h abbreviation length grows with the object count of the clone that runs it. */
export function buildFeed(): ChangelogEntry[] {
  return git('log', '--first-parent', '--format=%H%x1f%an%x1f%aI%x1f%s%x1f%b%x1e').split('\x1e').filter(record => record.trim()).map(record => {
    const fields = record.trim().split('\x1f');
    const sha = fields[0]!, author = fields[1]!, date = fields[2]!, subject = fields[3]!, body = fields[4] ?? '';
    const stat = git(...gitNumstatArguments(sha)).trim().split('\n').filter(Boolean);
    let insertions = 0, deletions = 0;
    const areas = new Set<string>();
    for (const line of stat) {
      const [added, removed, path = ''] = line.split('\t');
      insertions += Number(added) || 0;
      deletions += Number(removed) || 0;
      const parts = path.split('/');
      areas.add(parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0]!);
    }
    const note = resolve(root, 'docs/updates/changelog', `${sha}.md`);
    return { sha, shortSha: sha.slice(0, 7), author, date, subject, body: body.trim(), files: stat.length, insertions, deletions, areas: [...areas].sort().slice(0, 5), ...(existsSync(note) ? { notes: readFileSync(note, 'utf8').trim() } : {}) };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const output = resolve(root, 'apps/web/src/updates/changelog/feed.json');
  mkdirSync(resolve(output, '..'), { recursive: true });
  writeFileSync(output, `${JSON.stringify(buildFeed(), null, 2)}\n`);
  console.log(`wrote ${output}`);
}
