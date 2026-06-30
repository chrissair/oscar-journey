// scripts/snapshot-tiers.mjs — record {id: tier} for the CURRENT catalog.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href + '?t=' + process.pid)).MOVIES;
const { getTier } = await import(pathToFileURL(R('../src/utils/tierInfo.js')).href);
const snap = {};
for (const m of MOVIES) snap[m.id] = getTier(m);
fs.writeFileSync(R('tiers-before.json'), JSON.stringify(snap, null, 0));
console.log(`Snapshotted ${Object.keys(snap).length} tiers to tiers-before.json`);
