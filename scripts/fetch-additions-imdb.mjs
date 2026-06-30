// scripts/fetch-additions-imdb.mjs — fetch OMDb imdbID by title+year for each
// addition, merge into src/data/imdbIds.json. Title/year collisions handled
// by MANUAL_IDS (see note: "Crash" 1996 vs 2004).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const OMDB_KEYS = ['84fee249','398cefbb','2bcfc5d9','4c4c2593','fcfc8238','5f47a8f8','fbe9d009','8a3c9a0','b76841fa'];
let keyIdx = 0;
// Films OMDb can't disambiguate by title+year (shared title) — set by hand:
const MANUAL_IDS = {
  'crash-1996': 'tt0115964',        // Cronenberg's Crash, NOT the 2004 BP
  'night-and-fog-1955': 'tt0048434', // IMDb lists as 1956; OMDb misses at year 1955
  'apur-sansar-1959': 'tt0052572',   // "The World of Apu" — OMDb can't find by Bengali title+year
  'le-bonheur-1965': 'tt0058985',    // Agnes Varda — OMDb can't find
};
// OMDb title quirks for these specific additions:
const TITLE_FIX = { 'The World of Apu': 'The World of Apu' };

const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'), 'utf8'));
const ids = JSON.parse(fs.readFileSync(R('../src/data/imdbIds.json'), 'utf8'));

async function fetchId(title, year) {
  const t = TITLE_FIX[title] || title;
  for (let i = 0; i < OMDB_KEYS.length; i++) {
    const key = OMDB_KEYS[keyIdx];
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(t)}&y=${year}&type=movie&apikey=${key}`;
    let r; try { r = await (await fetch(url)).json(); } catch { keyIdx=(keyIdx+1)%OMDB_KEYS.length; continue; }
    if (r && r.Response === 'True') return { imdbID: r.imdbID, omdbTitle: r.Title, omdbYear: r.Year };
    if (r && /limit reached|invalid api key/i.test(r.Error||'')) { keyIdx=(keyIdx+1)%OMDB_KEYS.length; continue; }
    return null;
  }
  return null;
}

const report = [];
for (const m of meta) {
  if (MANUAL_IDS[m.id]) { ids[m.id] = MANUAL_IDS[m.id]; report.push(`${m.id} = ${MANUAL_IDS[m.id]} (manual)`); continue; }
  const res = await fetchId(m.title, m.year);
  if (!res) { report.push(`${m.id} = !! NOT FOUND — set manually`); continue; }
  const yrOff = Math.abs(parseInt(res.omdbYear) - m.year);
  const flag = yrOff > 1 ? `  ⚠ year off by ${yrOff} (omdb=${res.omdbYear})` : '';
  ids[m.id] = res.imdbID;
  report.push(`${m.id} = ${res.imdbID}  (${res.omdbTitle} ${res.omdbYear})${flag}`);
}
fs.writeFileSync(R('../src/data/imdbIds.json'), JSON.stringify(ids, null, 2) + '\n');
console.log(report.join('\n'));
console.log('\nReview every ⚠ and "NOT FOUND" line above, then re-run Step 3 verifier.');
