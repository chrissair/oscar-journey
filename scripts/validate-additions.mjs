// scripts/validate-additions.mjs — asserts the additions metadata is well-formed
// and genuinely absent from the catalog. Exits non-zero on any violation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const GENRES = new Set(['D','C','R','T','Ho','H','W','B','X','N','S','F','M','I','Fa']);
const LISTS = new Set(['SS','AFI','IMDB','LBXD','FEST','NFR','CRIT','RT','TSPDT','OSCAR','OSCAR_NOM']);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'), 'utf8'));
const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href)).MOVIES;

const normalize = s => (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/^(the|a|an) /i,'').replace(/&/g,'and').replace(/:/g,'')
  .replace(/colou?r/g,'color').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const aliasesRaw = JSON.parse(fs.readFileSync(R('canon-lists/title-aliases.json'),'utf8'));
const ALIASES = new Map();
for (const [f,t] of Object.entries(aliasesRaw)) if(!f.startsWith('_')) ALIASES.set(normalize(f),normalize(t));
const an = t => { const n = normalize(t); return ALIASES.get(n) || n; };

const errors = [];
const ids = new Set(MOVIES.map(m => m.id));
const catKeys = new Set(MOVIES.map(m => `${an(m.title)}|${m.year}`));
const seen = new Set();
if (meta.length !== 68) errors.push(`expected 68 entries, got ${meta.length}`);
for (const m of meta) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*-(19|20)\d\d$/.test(m.id)) errors.push(`bad id: ${m.id}`);
  if (seen.has(m.id)) errors.push(`duplicate id in meta: ${m.id}`); seen.add(m.id);
  if (ids.has(m.id)) errors.push(`id already in catalog: ${m.id}`);
  for (let dy=-1; dy<=1; dy++) if (catKeys.has(`${an(m.title)}|${m.year+dy}`)) errors.push(`title already in catalog: ${m.title} (${m.year})`);
  if (!GENRES.has(m.genre)) errors.push(`bad genre '${m.genre}' on ${m.id}`);
  for (const g of (m.altGenres||[])) if (!GENRES.has(g)) errors.push(`bad altGenre '${g}' on ${m.id}`);
  if (![1,2,3,4,5].includes(m.tier)) errors.push(`bad tier ${m.tier} on ${m.id}`);
  if (!Array.isArray(m.lists) || m.lists.length < 2) errors.push(`<2 lists on ${m.id}`);
  for (const l of m.lists) if (!LISTS.has(l)) errors.push(`bad list '${l}' on ${m.id}`);
  if (m.foreign && (!m.lang || !m.country)) errors.push(`foreign film missing lang/country: ${m.id}`);
}
if (errors.length) { console.error('FAIL:\n' + errors.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log(`OK: ${meta.length} additions valid, none already in catalog.`);
