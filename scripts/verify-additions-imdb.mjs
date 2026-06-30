// scripts/verify-additions-imdb.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'),'utf8'));
const ids = JSON.parse(fs.readFileSync(R('../src/data/imdbIds.json'),'utf8'));
const errs = [];
const seen = new Map();
for (const [id, v] of Object.entries(ids)) {
  if (!/^tt\d+$/.test(v)) continue;
  if (seen.has(v)) seen.get(v).push(id); else seen.set(v, [id]);
}
for (const m of meta) {
  if (!ids[m.id]) errs.push(`missing imdb id: ${m.id}`);
  else if (!/^tt\d+$/.test(ids[m.id])) errs.push(`bad imdb id format: ${m.id} = ${ids[m.id]}`);
}
for (const [tt, owners] of seen) if (owners.length > 1) errs.push(`imdb id ${tt} shared by: ${owners.join(', ')}`);
if (errs.length) { console.error('FAIL:\n'+errs.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log(`OK: all 68 additions have a unique tt id.`);
