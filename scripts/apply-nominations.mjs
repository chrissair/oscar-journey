// Reads the backfill report and writes `nominations: [...]` onto each
// matching movie entry in src/data/movies.js. Preserves all existing fields
// (awards, won, alsoWon, category). Skips films the report couldn't parse
// (rawCount: 0) so they retain whatever legacy data the display falls
// back on.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOVIES_PATH = path.resolve(__dirname, '../src/data/movies.js');
const REPORT_PATH = path.resolve(__dirname, 'nominations-backfill.json');

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const byId = new Map(report.map(r => [r.id, r]));

// Legacy-wins derivation — mirrors deriveLegacyNominations in
// CeremonyTooltip.jsx. Existing `awards`/`won`/`alsoWon`/`category` data
// has been hand-curated and verified against AMPAS, so these wins are
// authoritative. The Wikipedia parser occasionally misses wins (parser
// expects a specific template format that not every film uses), so we
// merge: existing wins → base layer, parsed nominations fill in losses.
function legacyWins(m) {
  const out = [];
  // category='BP' in the catalog means "was a Best Picture nominee" — so
  // we always emit a BP entry for those, flagging won/lost off m.won.
  // This covers the gap where Wikipedia's structured row for BP is
  // inconsistently parsed.
  if (m.category === 'BP') {
    out.push({ category: 'Best Picture', won: !!m.won });
  }
  for (const cat of (m.alsoWon || [])) {
    const label = cat === 'INT' ? 'International Feature'
                : cat === 'ANIM' ? 'Animated Feature'
                : cat;
    out.push({ category: label, won: true });
  }
  if (m.category === 'INT' && !m.alsoWon?.includes('INT')) {
    out.push({ category: 'International Feature', won: true });
  }
  if (m.category === 'ANIM' && !m.alsoWon?.includes('ANIM')) {
    out.push({ category: 'Animated Feature', won: true });
  }
  for (const a of (m.awards || [])) {
    out.push({ category: a.category, won: true, nominee: a.winner, detail: a.detail });
  }
  return out;
}

function mergeNominations(existing, parsed) {
  // Key = category. Legacy entries are authoritative for their own
  // won-state (wins hand-verified; BP losses derived from category='BP'
  // && !won). Parsed entries fill in categories legacy doesn't cover
  // and can upgrade a legacy loss to a win if Wikipedia says so.
  const byCat = new Map();
  for (const n of existing) byCat.set(n.category, n);
  for (const n of parsed) {
    const prior = byCat.get(n.category);
    if (prior) {
      if (prior.won) continue; // legacy win wins
      if (n.won) byCat.set(n.category, n); // upgrade legacy loss → parsed win
      // else: already a loss, keep legacy (has nominee info maybe)
    } else {
      byCat.set(n.category, n);
    }
  }
  return Array.from(byCat.values());
}

const ORDER = [
  'Best Picture', 'Director', 'Actor', 'Actress',
  'Supporting Actor', 'Supporting Actress',
  'Original Screenplay', 'Adapted Screenplay',
  'Animated Feature', 'International Feature', 'Documentary Feature',
  'Cinematography', 'Film Editing', 'Production Design', 'Art Direction',
  'Costume Design', 'Makeup', 'Sound', 'Sound Editing', 'Sound Mixing',
  'Sound Effects Editing', 'Original Score', 'Original Song', 'Visual Effects',
];
function orderKey(c) { const i = ORDER.indexOf(c); return i === -1 ? 999 : i; }

// Load catalog for merging with legacy data. Dynamic import since it's ESM.
const mm = await import(pathToFileURL(MOVIES_PATH).href);
const byMovieId = new Map(mm.MOVIES.map(m => [m.id, m]));

// Serialize a nominations array as a compact JS literal. Matches the
// existing awards: [...] inline style so diffs stay readable.
function fmtNomination(n) {
  const parts = [`category: "${n.category}"`, `won: ${n.won}`];
  if (n.nominee) parts.push(`nominee: ${JSON.stringify(n.nominee)}`);
  if (n.detail) parts.push(`detail: ${JSON.stringify(n.detail)}`);
  return `{ ${parts.join(', ')} }`;
}

let src = fs.readFileSync(MOVIES_PATH, 'utf8');
let patched = 0;
let skipped = 0;

// movies.js has each film on its own line, ending with "}," — so we can
// match line-by-line and rewrite the matching line atomically. This avoids
// the nested-brace trap that a greedy character class would fall into
// when `awards: [{...}]` sits inside the entry.
const lines = src.split('\n');
for (let li = 0; li < lines.length; li++) {
  const line = lines[li];
  const idMatch = line.match(/^\s*\{\s*id:\s*'([^']+)'/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const movie = byMovieId.get(id);
  if (!movie) continue;
  const r = byId.get(id);
  // Only populate `nominations` when the Wikipedia parser found at least
  // one entry — that's our only source of loss (non-winning nomination)
  // data. Films with zero parsed data fall back to the derived-from-
  // legacy path in CeremonyTooltip, which correctly reports "X won"
  // without claiming a nom-total we don't actually know.
  if (!r?.nominations || r.nominations.length === 0) { skipped++; continue; }
  const existing = legacyWins(movie);
  const merged = mergeNominations(existing, r.nominations)
    .sort((a, b) => orderKey(a.category) - orderKey(b.category));
  if (merged.length === 0) { skipped++; continue; }
  // Idempotent: strip any existing nominations block before inserting.
  let stripped = line.replace(/,\s*nominations:\s*\[[^\]]*\]/, '');
  const closeIdx = stripped.lastIndexOf('}');
  if (closeIdx === -1) { skipped++; continue; }
  const nomsLiteral = `, nominations: [${merged.map(fmtNomination).join(', ')}]`;
  lines[li] = stripped.slice(0, closeIdx) + nomsLiteral + ' ' + stripped.slice(closeIdx);
  patched++;
}
src = lines.join('\n');

fs.writeFileSync(MOVIES_PATH, src);
console.log(`Patched ${patched} films, skipped ${skipped} (no data found).`);
