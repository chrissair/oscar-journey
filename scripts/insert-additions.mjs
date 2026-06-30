// scripts/insert-additions.mjs — render 68 ESSENTIAL entries from meta and
// splice them into the MOVIES array (before its closing `];`), under a header.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'),'utf8')).slice().sort((a,b)=>a.year-b.year);
const q = s => `"${String(s).replace(/"/g,'\\"')}"`;     // double-quote titles
const arr = a => `[${(a||[]).map(x=>`'${x}'`).join(', ')}]`;
const line = m => {
  const parts = [`id: '${m.id}'`, `title: ${q(m.title)}`, `year: ${m.year}`, `genre: '${m.genre}'`];
  if (m.altGenres && m.altGenres.length) parts.push(`altGenres: ${arr(m.altGenres)}`);
  parts.push(`category: 'ESSENTIAL'`, `tier: ${m.tier}`, `lists: ${arr(m.lists)}`);
  return `  { ${parts.join(', ')} },`;
};
const block = [
  '',
  '  // =====================================================',
  '  // 2026-06 EXPANSION — TSPDT-1000 (9th list) + FEST widening',
  '  // 68 audited additions (classic Hollywood + festival/world canon).',
  '  // See docs/superpowers/specs/2026-06-30-catalog-classic-hollywood-festival-expansion-design.md',
  '  // =====================================================',
  ...meta.map(line),
].join('\n');

const file = R('../src/data/movies.js');
const src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');
const start = lines.findIndex(l => l.startsWith('export const MOVIES = ['));
if (start < 0) throw new Error('MOVIES array start not found');
let close = -1;
for (let i = start + 1; i < lines.length; i++) if (lines[i].trim() === '];') { close = i; break; }
if (close < 0) throw new Error('MOVIES array close not found');
lines.splice(close, 0, block);
fs.writeFileSync(file, lines.join('\n'));
console.log(`Inserted 68 entries before line ${close + 1}.`);
