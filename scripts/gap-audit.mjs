// Gap audit: which films on the 8 canon lists are NOT in the catalog, and
// how many lists each sits on. "Near-miss" = exactly one list short of the
// current Rule C threshold (pre-1970 >=3, 1970+ >=2). These are precisely the
// films a single new orthogonal list could rescue.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOVIES_PATH = path.resolve(__dirname, '../src/data/movies.js');
const LISTS_PATH = path.resolve(__dirname, 'canon-lists/lists.json');
const ALIASES_PATH = path.resolve(__dirname, 'canon-lists/title-aliases.json');

function normalize(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/^(the|a|an) /i, '')
    .replace(/&/g, 'and').replace(/:/g, '').replace(/colou?r/g, 'color')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
const aliasesRaw = JSON.parse(fs.readFileSync(ALIASES_PATH, 'utf8'));
const ALIASES = new Map();
for (const [from, to] of Object.entries(aliasesRaw)) {
  if (from.startsWith('_')) continue;
  ALIASES.set(normalize(from), normalize(to));
}
const aliasedNorm = t => { const n = normalize(t); return ALIASES.get(n) || n; };

const mod = await import(pathToFileURL(MOVIES_PATH).href + '?t=' + Date.now());
const MOVIES = mod.MOVIES;
const lists = JSON.parse(fs.readFileSync(LISTS_PATH, 'utf8'));
const parseE = s => { const m = s.match(/^(.*)\s*\((\d{4})\)\s*$/); return m ? { title: m[1].trim(), year: +m[2] } : null; };

// Build film -> list set across the 8 lists
const filmMap = new Map();
for (const code of Object.keys(lists)) {
  if (code.startsWith('_')) continue;
  for (const raw of lists[code]) {
    const e = parseE(raw); if (!e) continue;
    const key = `${aliasedNorm(e.title)}|${e.year}`;
    if (!filmMap.has(key)) filmMap.set(key, { title: e.title, year: e.year, lists: new Set() });
    filmMap.get(key).lists.add(code);
  }
}

// Catalog membership (match within +/-1 year)
const catByKey = new Map();
for (const m of MOVIES) catByKey.set(`${aliasedNorm(m.title)}|${m.year}`, m);
const inCatalog = (title, year) => {
  for (let dy = -1; dy <= 1; dy++) if (catByKey.has(`${aliasedNorm(title)}|${year + dy}`)) return true;
  return false;
};

const threshold = year => (year < 1970 ? 3 : 2);

const notIn = [];
for (const f of filmMap.values()) {
  if (inCatalog(f.title, f.year)) continue;
  const n = f.lists.size, need = threshold(f.year);
  notIn.push({ title: f.title, year: f.year, n, need, lists: [...f.lists].sort(), short: need - n });
}
notIn.sort((a, b) => a.short - b.short || b.n - a.n || a.year - b.year);

const nearMiss = notIn.filter(f => f.short === 1);        // one list short — rescuable by ONE new list
const twoShort = notIn.filter(f => f.short === 2);        // two short — needs 2 new lists
const already = notIn.filter(f => f.short <= 0);          // ALREADY qualifies but not in catalog (audit leak!)

console.log('=== SUMMARY ===');
console.log('Films on >=1 of 8 lists, NOT in catalog:', notIn.length);
console.log('  ALREADY-QUALIFY but missing (short<=0):', already.length, '  <-- should be ~0; investigate any');
console.log('  NEAR-MISS (exactly 1 list short):', nearMiss.length);
console.log('  TWO short:', twoShort.length);
console.log('  near-miss pre-1970:', nearMiss.filter(f => f.year < 1970).length, '| 1970+:', nearMiss.filter(f => f.year >= 1970).length);

console.log('\n=== ALREADY-QUALIFY BUT MISSING (potential catalog leak) ===');
for (const f of already) console.log(`  ${f.title} (${f.year})  n=${f.n} need=${f.need}  [${f.lists.join(',')}]`);

fs.writeFileSync(path.resolve(__dirname, 'gap-nearmiss.json'), JSON.stringify(nearMiss, null, 1));
fs.writeFileSync(path.resolve(__dirname, 'gap-all-missing.json'), JSON.stringify(notIn, null, 1));
console.log('\nWrote gap-nearmiss.json (' + nearMiss.length + ') and gap-all-missing.json (' + notIn.length + ')');

// Near-miss broken down by which lists they currently hold (shows worldview skew)
const byPair = new Map();
for (const f of nearMiss) {
  const k = f.lists.join('+');
  byPair.set(k, (byPair.get(k) || 0) + 1);
}
console.log('\n=== NEAR-MISS by current list combo (top 20) ===');
[...byPair.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
