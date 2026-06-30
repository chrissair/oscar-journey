// scripts/gen-filmattributes-patch.mjs — prints the id literals to add to each
// of the 4 sets in src/utils/filmAttributes.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const attrs = JSON.parse(fs.readFileSync(R('additions-attributes.json'), 'utf8'));
const yr = id => parseInt(id.slice(-4));
const fmt = ids => ids.map(id => `  '${id}',`).join('\n') || '  (none)';
const colorPre = attrs.filter(a => a.colour === 'color' && yr(a.id) < 1955).map(a => a.id);
const bwPost = attrs.filter(a => a.colour === 'bw' && yr(a.id) >= 1955).map(a => a.id);
const silent = attrs.filter(a => a.silent && yr(a.id) >= 1928).map(a => a.id);
const docs = attrs.filter(a => a.documentary).map(a => a.id);
console.log('// → COLOR_PRE_1955_IDS (add these):\n' + fmt(colorPre));
console.log('\n// → BW_POST_1955_IDS (add these):\n' + fmt(bwPost));
console.log('\n// → SILENT_POST_1928_IDS (add these):\n' + fmt(silent));
console.log('\n// → DOC_IDS (add these):\n' + fmt(docs));
