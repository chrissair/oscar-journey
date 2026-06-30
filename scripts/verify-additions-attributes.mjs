// scripts/verify-additions-attributes.mjs — asserts the derived attributes match the
// classification file for all 68 additions.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const attrs = JSON.parse(fs.readFileSync(R('additions-attributes.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'), 'utf8'));
const byId = new Map(meta.map(m => [m.id, m]));
const fa = await import(pathToFileURL(R('../src/utils/filmAttributes.js')).href);
const errs = [];
for (const a of attrs) {
  const m = byId.get(a.id); if (!m) { errs.push(`no meta for ${a.id}`); continue; }
  const film = { id: m.id, year: m.year, category: 'ESSENTIAL' };
  if (fa.isBlackAndWhite(film) !== (a.colour === 'bw')) errs.push(`B&W wrong: ${a.id} (want ${a.colour})`);
  if (fa.isSilent(film) !== a.silent) errs.push(`silent wrong: ${a.id} (want ${a.silent})`);
  if (fa.isDocumentary(film) !== a.documentary) errs.push(`doc wrong: ${a.id} (want ${a.documentary})`);
}
if (errs.length) { console.error('FAIL:\n' + errs.map(e => '  - ' + e).join('\n')); process.exit(1); }
console.log('OK: B&W / Silent / Documentary attributes correct for all 68 additions.');
