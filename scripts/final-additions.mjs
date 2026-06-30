// Produce the FINAL rebalanced addition list from the audit result + the
// user-approved classic-Hollywood rebalance. Tiers recomputed from `lists`
// using the repo's exact r2 bucket logic so they're internally consistent.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);

// --- repo tier math (mirrors src/utils/tierInfo.js r2Raw + bucket) ---
function r2Raw(lists) {
  const set = new Set(lists);
  let canonRaw = 0;
  if (set.has('NFR') || set.has('AFI')) canonRaw += 1;
  for (const c of set) if (c !== 'NFR' && c !== 'AFI' && c !== 'OSCAR' && c !== 'OSCAR_NOM') canonRaw += 1;
  return canonRaw;
}
function bucket(raw) { if (raw === 0) return 0; if (raw <= 2) return 1; if (raw === 3) return 2; if (raw === 4) return 3; if (raw === 5) return 4; return 5; }
const tierOf = lists => bucket(r2Raw(lists));

const audit = JSON.parse(fs.readFileSync(R('audit-result.json'), 'utf8'));
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// 8 SWAP-OUTS — the deepest-arthouse picks (4 the user named explicitly as "most obscure";
// the CRIT+SS-only leaks are the arthouse mirror of the IMDb+RT populist-pair problem).
// + 2 final-decision cuts: Philadelphia & Hotel Rwanda (weakest cross-worldview leak pairings).
const swapOut = ['Soleil O', 'Sambizanga', 'India Song', 'News From Home', 'Gertrud', 'Daisies', 'Memories Of Underdevelopment', 'Day Of Wrath', 'Philadelphia', 'Hotel Rwanda'];

// 8 SWAP-INS — canonical classic Hollywood, each TSPDT + 2 existing lists = 3.
const swapIn = [
  { title: 'Frankenstein', year: 1931, lists: ['AFI', 'NFR', 'TSPDT'], signal: 'TSPDT #619', note: 'Whale — foundational Universal horror' },
  { title: 'Ninotchka', year: 1939, lists: ['AFI', 'NFR', 'TSPDT'], signal: 'TSPDT #564', note: 'Lubitsch — "Garbo Laughs"' },
  { title: 'Detour', year: 1945, lists: ['CRIT', 'NFR', 'TSPDT'], signal: 'TSPDT #778', note: 'Ulmer — poverty-row noir landmark' },
  { title: 'The Asphalt Jungle', year: 1950, lists: ['CRIT', 'NFR', 'TSPDT'], signal: 'TSPDT #605', note: 'Huston — archetypal heist noir' },
  { title: 'A Star Is Born', year: 1954, lists: ['AFI', 'NFR', 'TSPDT'], signal: 'TSPDT #442', note: 'Cukor / Garland' },
  { title: 'Kiss Me Deadly', year: 1955, lists: ['CRIT', 'NFR', 'TSPDT'], signal: 'TSPDT #348', note: 'Aldrich — apocalyptic noir, hugely influential' },
  { title: 'The Hustler', year: 1961, lists: ['AFI', 'NFR', 'TSPDT'], signal: 'TSPDT #501', note: 'Rossen / Newman' },
  { title: 'Shadow of a Doubt', year: 1943, lists: ['NFR', 'RT', 'TSPDT'], signal: 'TSPDT #586', note: 'Hitchcock — his own favorite' },
];
// Gilda — DROPPED per final decision (full mechanical purity; fails the bar: NFR+CRIT only, pre-1970 needs 3).

// Reconstruct each rescued film's FINAL list set = existing lists + the justifying list code.
// LEAK / CURATED already qualify on their existing lists (no code added).
function finalLists(a) {
  const set = new Set(a.currentLists || []);
  const j = a.justifyingList || '';
  if (j.startsWith('TSPDT')) set.add('TSPDT');
  else if (j.startsWith('FEST')) set.add('FEST'); // covers "FEST+" widening and the Aparajito data-fix
  return [...set];
}

const swapOutSet = new Set(swapOut.map(norm));
const kept = audit.additions.filter(a => !swapOutSet.has(norm(a.title)));
const removed = audit.additions.filter(a => swapOutSet.has(norm(a.title)));

const final = [
  ...kept.map(a => { const lists = finalLists(a); return ({ title: a.title, year: a.year, lists, tier: tierOf(lists), justifyingList: a.justifyingList, defense: a.defense }); }),
  ...swapIn.map(s => ({ title: s.title, year: s.year, lists: s.lists, tier: tierOf(s.lists), justifyingList: 'TSPDT (rebalance swap-in)', defense: `${s.signal} — ${s.note}` })),
];
final.sort((a, b) => a.year - b.year);

fs.writeFileSync(R('final-additions.json'), JSON.stringify(final, null, 1));
console.log('SWAP-OUT (', removed.length, '):', removed.map(r => `${r.title}(${r.year})`).join(', '));
console.log('SWAP-IN  (', swapIn.length, '): ', swapIn.map(s => `${s.title}(${s.year})`).join(', '), '+ Gilda(curated)');
console.log('\nFINAL ADDITIONS:', final.length);
const tc = {};
for (const f of final) tc[f.tier] = (tc[f.tier] || 0) + 1;
console.log('Tier distribution:', JSON.stringify(tc));
// classic-Hollywood vs world count (rough: by presence of AFI or NFR with US studio era pre-1970)
console.log('\n=== FINAL LIST (chronological) ===');
for (const f of final) console.log(`  ${f.year}  T${f.tier}  ${f.title}  [${f.lists.join(',')}]`);
