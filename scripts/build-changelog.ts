import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ChangelogEntry } from '../apps/web/src/updates/changelog';
const root = resolve(import.meta.dirname, '..');
const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
export function buildFeed(): ChangelogEntry[] { return git('log', '--first-parent', '--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s%x1f%b%x1e').split('\x1e').filter(x => x.trim()).map(record => { const f = record.trim().split('\x1f'); const sha=f[0]!, shortSha=f[1]!, author=f[2]!, date=f[3]!, subject=f[4]!, body=f[5] ?? ''; const stat=git('show','--format=','--numstat',sha).trim().split('\n').filter(Boolean); let insertions=0,deletions=0; const areas=new Set<string>(); for(const line of stat){const [a,b,path='']=line.split('\t');insertions+=Number(a)||0;deletions+=Number(b)||0;const p=path.split('/');areas.add(p.length>1?`${p[0]}/${p[1]}`:p[0]!)} const note=resolve(root,'docs/updates/changelog',`${sha}.md`); return {sha,shortSha,author,date,subject,body:body.trim(),files:stat.length,insertions,deletions,areas:[...areas].sort().slice(0,5),...(existsSync(note)?{notes:readFileSync(note,'utf8').trim()}:{})}; }); }
const output=resolve(root,'apps/web/src/updates/changelog/feed.json'); mkdirSync(resolve(output,'..'),{recursive:true}); writeFileSync(output,`${JSON.stringify(buildFeed(),null,2)}\n`); console.log(`wrote ${output}`);
