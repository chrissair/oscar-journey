// scripts/insert-additions-languages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'),'utf8'));
const langs = JSON.parse(fs.readFileSync(R('../src/data/languages.json'),'utf8'));
let n = 0;
for (const m of meta) if (m.foreign) { langs[m.id] = { lang: m.lang, country: m.country }; n++; }
fs.writeFileSync(R('../src/data/languages.json'), JSON.stringify(langs, null, 2) + '\n');
console.log(`Added ${n} foreign-language rows.`);
