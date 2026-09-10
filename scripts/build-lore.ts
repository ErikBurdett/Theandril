import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type Inline = { type: 'text'; value: string } | { type: 'strong' | 'em' | 'code'; value: string } | { type: 'wikilink'; label: string; target: string } | { type: 'link'; label: string; href: string };
export type Block = { type: 'heading'; level: number; id: string; children: Inline[] } | { type: 'paragraph' | 'blockquote'; children: Inline[] } | { type: 'callout'; title: string; children: Inline[] } | { type: 'list'; ordered: boolean; items: Inline[][] } | { type: 'table'; headers: Inline[][]; rows: Inline[][][] };
export type LoreDocument = { id: string; title: string; sourcePath: string; order?: number; blocks: Block[]; body: string };
export type LoreLibrary = { books: { id: string; title: string; documents: LoreDocument[] }[]; factionAnchors: Record<string, string> };

const root = resolve(import.meta.dirname, '..');
const loreRoot = resolve(root, 'docs/lore');
const slug = (value: string) => value.toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const inlinePattern = /(\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]*\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
export function inline(value: string): Inline[] {
  return value.split(inlinePattern).filter(Boolean).map((part): Inline => {
    if (part.startsWith('[[')) { const [label = '', target = label] = part.slice(2, -2).split('|').map(piece => piece.trim()); return { type: 'wikilink', label, target }; }
    const link = part.match(/^\[([^\]]+)\]\(([^)]*)\)$/); if (link) return { type: 'link', label: link[1]!, href: link[2]! };
    if (part.startsWith('**')) return { type: 'strong', value: part.slice(2, -2) };
    if (part.startsWith('`')) return { type: 'code', value: part.slice(1, -1) };
    if (part.startsWith('*')) return { type: 'em', value: part.slice(1, -1) };
    return { type: 'text', value: part };
  });
}
function plain(nodes: Inline[]) { return nodes.map(node => 'value' in node ? node.value : node.label).join(''); }
function frontmatter(lines: string[]) { const data: Record<string, string> = {}; if (lines[0] !== '---') return { data, offset: 0 }; let offset = 1; for (; offset < lines.length && lines[offset] !== '---'; offset++) { const match = lines[offset]!.match(/^([^:]+):\s*(.*)$/); if (match) data[match[1]!] = match[2]!.replace(/^['"]|['"]$/g, ''); } return { data, offset: offset + 1 }; }
export function parseMarkdown(markdown: string): { title: string; order?: number; blocks: Block[]; body: string } {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n'); const { data, offset } = frontmatter(lines); const blocks: Block[] = []; let i = offset; let title = data.title ?? '';
  const isTable = (line: string) => /^\|.*\|\s*$/.test(line);
  while (i < lines.length) { const line = lines[i]!; if (!line.trim()) { i++; continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/); if (heading) { const value = heading[2]!; title ||= value; blocks.push({ type: 'heading', level: heading[1]!.length, id: slug(value), children: inline(value) }); i++; continue; }
    const note = line.match(/^>\s*\[!note\]\s*(.*)$/i); if (note) { const content: string[] = []; i++; while (i < lines.length && /^>/.test(lines[i]!)) { content.push(lines[i]!.replace(/^>\s?/, '')); i++; } blocks.push({ type: 'callout', title: note[1]!.trim() || 'Note', children: inline(content.join(' ').trim()) }); continue; }
    if (/^>/.test(line)) { const content: string[] = []; while (i < lines.length && /^>/.test(lines[i]!)) { content.push(lines[i]!.replace(/^>\s?/, '')); i++; } blocks.push({ type: 'blockquote', children: inline(content.join(' ').trim()) }); continue; }
    const list = line.match(/^(\s*)([-*+] |\d+\. )(.*)$/); if (list) { const ordered = /^\d+\./.test(list[2]!); const items: Inline[][] = []; while (i < lines.length) { const item = lines[i]!.match(/^\s*(?:[-*+] |\d+\. )(.*)$/); if (!item) break; items.push(inline(item[1]!)); i++; } blocks.push({ type: 'list', ordered, items }); continue; }
    if (isTable(line) && /^\|?\s*:?-{3,}/.test(lines[i + 1] ?? '')) { const cells = (row: string) => row.replace(/^\||\|$/g, '').split('|').map(cell => inline(cell.trim())); const headers = cells(line); i += 2; const rows: Inline[][][] = []; while (i < lines.length && isTable(lines[i]!)) { rows.push(cells(lines[i]!)); i++; } blocks.push({ type: 'table', headers, rows }); continue; }
    const paragraph: string[] = [line.trim()]; i++; while (i < lines.length && lines[i]!.trim() && !/^(#{1,6})\s|^>|^\s*(?:[-*+] |\d+\. )/.test(lines[i]!) && !isTable(lines[i]!)) paragraph.push(lines[i++]!.trim()); blocks.push({ type: 'paragraph', children: inline(paragraph.join(' ')) });
  }
  return { title, order: data.order ? Number(data.order) : undefined, blocks, body: blocks.map(block => block.type === 'list' ? block.items.map(plain).join(' ') : block.type === 'table' ? [...block.headers, ...block.rows.flat()].map(plain).join(' ') : plain(block.children)).join('\n') };
}
async function documentFrom(relative: string): Promise<LoreDocument> { const parsed = parseMarkdown(await readFile(resolve(root, relative), 'utf8')); return { id: slug(relative.split('/').at(-1)!.replace(/\.md$/, '')), title: parsed.title, sourcePath: relative, order: parsed.order, blocks: parsed.blocks, body: parsed.body }; }
export async function buildLoreLibrary(): Promise<LoreLibrary> {
  const bookDirectory = resolve(loreRoot, 'The Book of Broken Roads'); const names = (await readdir(bookDirectory)).filter(name => name.endsWith('.md') && name !== 'The Book of Broken Roads.md');
  const chapters = await Promise.all(names.map(name => documentFrom(`docs/lore/The Book of Broken Roads/${name}`))); chapters.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
  const bible = await documentFrom('docs/lore/FACTION_BIBLE.md');
  return { books: [
    { id: 'broken-roads', title: 'The Book of Broken Roads', documents: chapters },
    { id: 'foundations', title: 'Foundations', documents: [await documentFrom('docs/lore/FOUNDATIONS.md')] },
    { id: 'faction-bible', title: 'Faction Bible', documents: [bible] },
    { id: 'cohort-notes', title: 'Cohort Notes', documents: [await documentFrom('docs/lore/FACTION_COHORT_12.md')] },
  ], factionAnchors: factionAnchors(bible.blocks) };
}

/** Each culture section of the bible names its stable ID in inline code right under its `###` heading. */
export function factionAnchors(blocks: Block[]): Record<string, string> {
  const anchors: Record<string, string> = {};
  let heading: string | undefined;
  const codes = (nodes: Inline[]): string[] => nodes.flatMap(node => node.type === 'code' ? [node.value] : []);
  for (const block of blocks) {
    if (block.type === 'heading') { heading = block.level === 3 ? block.id : undefined; continue; }
    if (heading && block.type === 'paragraph') for (const value of codes(block.children)) if (/^faction\.[a-z_]+$/.test(value) && !anchors[value]) anchors[value] = heading;
  }
  return anchors;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const library = await buildLoreLibrary(); const output = resolve(root, 'apps/web/src/updates/lore/library.json'); await mkdir(resolve(output, '..'), { recursive: true }); await writeFile(output, `${JSON.stringify(library, null, 2)}\n`); console.log('Generated apps/web/src/updates/lore/library.json');
}
