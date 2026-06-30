// scripts/diff-tiers.mjs — every id present in tiers-before.json must have the
// SAME tier now. New ids are ignored. Any change fails the entry-gate guarantee.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const before = JSON.parse(fs.readFileSync(R('tiers-before.json'),'utf8'));
const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href + '?t=' + process.pid)).MOVIES;
const { getTier } = await import(pathToFileURL(R('../src/utils/tierInfo.js')).href);
const now = new Map(MOVIES.map(m=>[m.id, getTier(m)]));
const moved = [];
for (const [id, t] of Object.entries(before)) {
  if (!now.has(id)) { moved.push(`${id}: DISAPPEARED`); continue; }
  if (now.get(id) !== t) moved.push(`${id}: ${t} -> ${now.get(id)}`);
}
if (moved.length) { console.error('FAIL — existing films changed tier:\n'+moved.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log(`OK: all ${Object.keys(before).length} pre-existing films unchanged (entry-gate holds).`);
