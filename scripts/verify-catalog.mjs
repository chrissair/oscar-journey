// scripts/verify-catalog.mjs — post-insert invariants.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href + '?t=' + process.pid)).MOVIES;
const { getTier } = await import(pathToFileURL(R('../src/utils/tierInfo.js')).href);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'),'utf8'));
const errs = [];
if (MOVIES.length !== 855) errs.push(`expected 855 films, got ${MOVIES.length}`);
const ids = MOVIES.map(m=>m.id); const dupes = ids.filter((x,i)=>ids.indexOf(x)!==i);
if (dupes.length) errs.push(`duplicate ids: ${[...new Set(dupes)].join(', ')}`);
const byId = new Map(MOVIES.map(m=>[m.id,m]));
for (const m of meta) {
  const f = byId.get(m.id);
  if (!f) { errs.push(`missing in catalog: ${m.id}`); continue; }
  if (getTier(f) !== m.tier) errs.push(`tier mismatch ${m.id}: baked ${m.tier} vs getTier ${getTier(f)}`);
}
if (errs.length) { console.error('FAIL:\n'+errs.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log('OK: 855 films, no dup ids, all 68 additions tier-consistent.');
