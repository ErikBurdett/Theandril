export type ChangelogEntry = { sha: string; shortSha: string; author: string; date: string; subject: string; body: string; files: number; insertions: number; deletions: number; areas: string[]; notes?: string };
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);
function inline(text: string) { return escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)]\((https?:\/\/[^ )]+)\)/g, '<a href="$2">$1</a>'); }
export function renderMarkdown(markdown: string): string { const lines = markdown.trim().split('\n'); let result = '', list: string[] = []; const flush = () => { if (list.length) { result += `<ul>${list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`; list = []; } }; for (const raw of lines) { const line = raw.trim(); if (!line) { flush(); continue; } const heading = line.match(/^(#{1,3})\s+(.+)$/); if (heading) { flush(); const level = heading[1]!.length; result += `<h${level}>${inline(heading[2]!)}</h${level}>`; } else if (line.startsWith('- ')) list.push(line.slice(2)); else { flush(); result += `<p>${inline(line)}</p>`; } } flush(); return result; }

/** A permalink to a folded commit must reveal it first; otherwise the fold stays at the default. */
export function initialVisibleCommits(search: string, entries: readonly { shortSha: string }[], fold: number): number {
  const wanted = new URLSearchParams(search).get('commit');
  const index = wanted ? entries.findIndex(entry => entry.shortSha === wanted) : -1;
  return index >= fold ? index + 1 : fold;
}
