// Build the candidate dossier the parallel audits will consume.
// Focus per user's chosen levers: classic Hollywood (pre-1970 near-miss),
// festival standouts (any near-miss touching FEST), and the already-qualify
// "leaks". Enrich each with every signal available in-repo (AFI genre slate,
// festival top-prize scrapes) so audit agents only need to add EXTERNAL
// knowledge (TSPDT, secondary festival prizes, critics' guild awards).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const normalize = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/^(the|a|an) /i, '').replace(/&/g, 'and').replace(/:/g, '')
  .replace(/colou?r/g, 'color').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const aliasesRaw = JSON.parse(fs.readFileSync(R('canon-lists/title-aliases.json'), 'utf8'));
const ALIASES = new Map();
for (const [from, to] of Object.entries(aliasesRaw)) { if (!from.startsWith('_')) ALIASES.set(normalize(from), normalize(to)); }
const an = t => { const n = normalize(t); return ALIASES.get(n) || n; };

const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href + '?t=' + Date.now())).MOVIES;
const lists = JSON.parse(fs.readFileSync(R('canon-lists/lists.json'), 'utf8'));
const parseE = s => { const m = s.match(/^(.*)\s*\((\d{4})\)\s*$/); return m ? { title: m[1].trim(), year: +m[2] } : null; };

const filmMap = new Map();
for (const code of Object.keys(lists)) {
  if (code.startsWith('_')) continue;
  for (const raw of lists[code]) { const e = parseE(raw); if (!e) continue;
    const k = `${an(e.title)}|${e.year}`;
    if (!filmMap.has(k)) filmMap.set(k, { title: e.title, year: e.year, lists: new Set() });
    filmMap.get(k).lists.add(code); }
}
const catKeys = new Set(MOVIES.map(m => `${an(m.title)}|${m.year}`));
const inCat = (t, y) => { for (let d = -1; d <= 1; d++) if (catKeys.has(`${an(t)}|${y + d}`)) return true; return false; };

// Repo enrichment signals
const loadArr = f => { try { return JSON.parse(fs.readFileSync(R(f), 'utf8')); } catch { return []; } };
const afiGenre = new Map(); // normkey -> [which AFI genre lists]
const afiFiles = { passions: 'afi-passions', thrills: 'afi-thrills', cheers: 'afi-cheers', laughs: 'afi-laughs' };
for (const [label, file] of Object.entries(afiFiles))
  for (const e of loadArr(`../.playwright-mcp/${file}.json`)) {
    const k = `${an(e.title)}|${e.year}`; if (!afiGenre.has(k)) afiGenre.set(k, []); afiGenre.get(k).push(label);
  }
const festScrape = new Map(); // normkey -> [cannes/venice/berlin]
for (const [label, file] of [['cannes', 'cannes-winners'], ['venice', 'venice-winners'], ['berlin', 'berlin-winners']])
  for (const e of loadArr(`../.playwright-mcp/${file}.json`)) {
    const k = `${an(e.title)}|${e.year}`; if (!festScrape.has(k)) festScrape.set(k, []); festScrape.get(k).push(label);
  }
const sig = (t, y) => { for (let d = -1; d <= 1; d++) { const k = `${an(t)}|${y + d}`;
  if (afiGenre.has(k) || festScrape.has(k)) return { afiGenre: afiGenre.get(k) || [], festPrize: festScrape.get(k) || [] }; }
  return { afiGenre: [], festPrize: [] }; };

const threshold = y => (y < 1970 ? 3 : 2);
const rows = [];
for (const f of filmMap.values()) {
  if (inCat(f.title, f.year)) continue;
  const n = f.lists.size, need = threshold(f.year), short = need - n;
  const L = [...f.lists].sort();
  const isLeak = short <= 0;
  const isClassic = f.year < 1970 && short === 1;
  const touchesFest = L.includes('FEST');
  const isFestNear = short === 1 && touchesFest;
  if (!(isLeak || isClassic || isFestNear)) continue;
  rows.push({ title: f.title, year: f.year, lists: L, n, need, short,
    bucket: isLeak ? 'LEAK' : isClassic ? 'CLASSIC' : 'FEST',
    ...sig(f.title, f.year) });
}
rows.sort((a, b) => a.bucket.localeCompare(b.bucket) || a.short - b.short || b.n - a.n || a.year - b.year);

const byBucket = b => rows.filter(r => r.bucket === b);
console.log('=== CANDIDATE DOSSIER ===');
console.log('LEAK (already qualify, missing):', byBucket('LEAK').length);
console.log('CLASSIC (pre-1970, one short):  ', byBucket('CLASSIC').length);
console.log('FEST (1970+ near-miss on FEST): ', byBucket('FEST').length);
console.log('TOTAL candidate pool:           ', rows.length);
fs.writeFileSync(R('candidate-dossier.json'), JSON.stringify(rows, null, 1));
console.log('\nWrote candidate-dossier.json');

// Quick look at classic-Hollywood candidates that ALSO have an AFI-genre or fest signal
console.log('\n=== CLASSIC candidates WITH an extra repo signal (AFI-genre or fest prize) ===');
for (const r of byBucket('CLASSIC').filter(r => r.afiGenre.length || r.festPrize.length))
  console.log(`  ${r.title} (${r.year})  [${r.lists.join(',')}]  afi-genre:${r.afiGenre.join('/')||'-'}  fest:${r.festPrize.join('/')||'-'}`);
