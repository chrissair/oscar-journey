// scripts/validate-additions.mjs — post-insert: asserts the additions metadata is
// well-formed and that every entry is now present in the catalog.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const GENRES = new Set(['D','C','R','T','Ho','H','W','B','X','N','S','F','M','I','Fa']);
const LISTS = new Set(['SS','AFI','IMDB','LBXD','FEST','NFR','CRIT','RT','TSPDT','OSCAR','OSCAR_NOM']);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'), 'utf8'));
const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href + '?t=' + process.pid)).MOVIES;

const errors = [];
const ids = new Set(MOVIES.map(m => m.id));
const seen = new Set();
if (meta.length !== 68) errors.push(`expected 68 entries, got ${meta.length}`);
for (const m of meta) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*-(19|20)\d\d$/.test(m.id)) errors.push(`bad id: ${m.id}`);
  if (seen.has(m.id)) errors.push(`duplicate id in meta: ${m.id}`); seen.add(m.id);
  if (!ids.has(m.id)) errors.push(`id missing from catalog: ${m.id}`);
  if (!GENRES.has(m.genre)) errors.push(`bad genre '${m.genre}' on ${m.id}`);
  for (const g of (m.altGenres||[])) if (!GENRES.has(g)) errors.push(`bad altGenre '${g}' on ${m.id}`);
  if (![1,2,3,4,5].includes(m.tier)) errors.push(`bad tier ${m.tier} on ${m.id}`);
  if (!Array.isArray(m.lists) || m.lists.length < 2) errors.push(`<2 lists on ${m.id}`);
  for (const l of m.lists) if (!LISTS.has(l)) errors.push(`bad list '${l}' on ${m.id}`);
  if (m.foreign && (!m.lang || !m.country)) errors.push(`foreign film missing lang/country: ${m.id}`);
}
if (errors.length) { console.error('FAIL:\n' + errors.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log(`OK: ${meta.length} additions valid and present in catalog.`);
