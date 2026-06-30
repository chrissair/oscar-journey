// scripts/verify-additions-languages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'),'utf8'));
const { isInternational } = await import(pathToFileURL(R('../src/utils/filmAttributes.js')).href);
const errs = [];
for (const m of meta) {
  const intl = isInternational({ id: m.id, category: 'ESSENTIAL' });
  if (m.foreign && !intl) errs.push(`foreign film not flagged international: ${m.id}`);
  if (!m.foreign && intl) errs.push(`english film wrongly flagged international: ${m.id}`);
}
if (errs.length) { console.error('FAIL:\n'+errs.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log('OK: international flags correct for all 68 additions.');
