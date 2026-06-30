# Catalog Expansion — Classic Hollywood + Festival Standouts: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 68 hand-audited Essentials (classic Hollywood + festival/world canon) to the catalog by adopting TSPDT-1000 as a 9th orthogonal canon list + a FEST widening, without changing any existing film's tier.

**Architecture:** Data-only expansion. A generated metadata file (`scripts/additions-meta.json`, 68 entries) is the single source of truth. Generator scripts transform it into `movies.js` ESSENTIAL entries, IMDb IDs, and language rows. The new TSPDT list code is registered for display only — existing films are never re-scored (entry-gate). Verification is via node assertion scripts (the repo has no unit-test framework; this matches its existing `scripts/*.mjs` audit style).

**Tech Stack:** Node ESM scripts (import `movies.js` via `pathToFileURL`), Vite/React app, OMDb API (hardcoded key rotation, already used by repo scripts).

## Global Constraints

- **Entry-gate only:** never add `TSPDT`/`FEST` to any EXISTING film's `lists`. The 787 existing films' tiers MUST be byte-identical before/after (Task 8 proves it).
- **No new tiers:** the 5-tier scale is untouched. New films are `category: 'ESSENTIAL'` with a baked `tier` (1–3 here).
- **Final count:** 68 additions → catalog **787 → 855**. Essentials 330 → 398.
- **Genre codes** must be one of: `D C R T Ho H W B X N S F M I Fa` (see `GENRE_LABELS` in `src/data/movies.js`).
- **Source of truth:** `scripts/final-additions.json` (68 films, lists+tier) and `scripts/additions-meta.json` (adds id/canonical-title/genre/language). Do not re-derive the film list — it is the audited, user-approved set.
- **OMDb keys:** reuse the `OMDB_KEYS` rotation array from `scripts/backfill-imdb-ids.mjs` (no `.env` needed).
- **Spec:** `docs/superpowers/specs/2026-06-30-catalog-classic-hollywood-festival-expansion-design.md`.

---

### Task 1: Validate the additions metadata

`scripts/additions-meta.json` is produced during planning (68 objects: `id, title, year, genre, altGenres, tier, lists, foreign, lang?, country?`). This task hardens it before anything consumes it.

**Files:**
- Create: `scripts/validate-additions.mjs`
- Read: `scripts/additions-meta.json`, `src/data/movies.js`, `scripts/canon-lists/title-aliases.json`

**Interfaces:**
- Produces: a trusted `scripts/additions-meta.json` consumed by Tasks 2, 3, 6.

- [ ] **Step 1: Write the validator**

```js
// scripts/validate-additions.mjs — asserts the additions metadata is well-formed
// and genuinely absent from the catalog. Exits non-zero on any violation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const GENRES = new Set(['D','C','R','T','Ho','H','W','B','X','N','S','F','M','I','Fa']);
const LISTS = new Set(['SS','AFI','IMDB','LBXD','FEST','NFR','CRIT','RT','TSPDT','OSCAR','OSCAR_NOM']);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'), 'utf8'));
const MOVIES = (await import(pathToFileURL(R('../src/data/movies.js')).href)).MOVIES;

const normalize = s => (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/^(the|a|an) /i,'').replace(/&/g,'and').replace(/:/g,'')
  .replace(/colou?r/g,'color').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const aliasesRaw = JSON.parse(fs.readFileSync(R('canon-lists/title-aliases.json'),'utf8'));
const ALIASES = new Map();
for (const [f,t] of Object.entries(aliasesRaw)) if(!f.startsWith('_')) ALIASES.set(normalize(f),normalize(t));
const an = t => { const n = normalize(t); return ALIASES.get(n) || n; };

const errors = [];
const ids = new Set(MOVIES.map(m => m.id));
const catKeys = new Set(MOVIES.map(m => `${an(m.title)}|${m.year}`));
const seen = new Set();
if (meta.length !== 68) errors.push(`expected 68 entries, got ${meta.length}`);
for (const m of meta) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*-(19|20)\d\d$/.test(m.id)) errors.push(`bad id: ${m.id}`);
  if (seen.has(m.id)) errors.push(`duplicate id in meta: ${m.id}`); seen.add(m.id);
  if (ids.has(m.id)) errors.push(`id already in catalog: ${m.id}`);
  for (let dy=-1; dy<=1; dy++) if (catKeys.has(`${an(m.title)}|${m.year+dy}`)) errors.push(`title already in catalog: ${m.title} (${m.year})`);
  if (!GENRES.has(m.genre)) errors.push(`bad genre '${m.genre}' on ${m.id}`);
  for (const g of (m.altGenres||[])) if (!GENRES.has(g)) errors.push(`bad altGenre '${g}' on ${m.id}`);
  if (![1,2,3,4,5].includes(m.tier)) errors.push(`bad tier ${m.tier} on ${m.id}`);
  if (!Array.isArray(m.lists) || m.lists.length < 2) errors.push(`<2 lists on ${m.id}`);
  for (const l of m.lists) if (!LISTS.has(l)) errors.push(`bad list '${l}' on ${m.id}`);
  if (m.foreign && (!m.lang || !m.country)) errors.push(`foreign film missing lang/country: ${m.id}`);
}
if (errors.length) { console.error('FAIL:\n' + errors.map(e=>'  - '+e).join('\n')); process.exit(1); }
console.log(`OK: ${meta.length} additions valid, none already in catalog.`);
```

- [ ] **Step 2: Run it**

Run: `node scripts/validate-additions.mjs`
Expected: `OK: 68 additions valid, none already in catalog.` If it FAILS, fix the offending rows in `scripts/additions-meta.json` (bad genre, duplicate, or a film that turns out to already be in the catalog) and re-run until OK.

- [ ] **Step 3: Commit**

```bash
git add scripts/additions-meta.json scripts/validate-additions.mjs
git commit -m "data: add + validate 68-film additions metadata (TSPDT/FEST expansion)"
```

---

### Task 2: Fetch and verify IMDb IDs for the 68 films

**Files:**
- Create: `scripts/fetch-additions-imdb.mjs`
- Modify: `src/data/imdbIds.json`

**Interfaces:**
- Consumes: `scripts/additions-meta.json` (`id`, `title`, `year`).
- Produces: 68 new `{ id: "tt…" }` rows in `src/data/imdbIds.json`.

- [ ] **Step 1: Write the fetch+merge script**

```js
// scripts/fetch-additions-imdb.mjs — fetch OMDb imdbID by title+year for each
// addition, merge into src/data/imdbIds.json. Title/year collisions handled
// by MANUAL_IDS (see note: "Crash" 1996 vs 2004).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const OMDB_KEYS = ['84fee249','398cefbb','2bcfc5d9','4c4c2593','fcfc8238','5f47a8f8','fbe9d009','8a3c9a0','b76841fa'];
let keyIdx = 0;
// Films OMDb can't disambiguate by title+year (shared title) — set by hand:
const MANUAL_IDS = { 'crash-1996': 'tt0115964' }; // Cronenberg's Crash, NOT the 2004 BP
// OMDb title quirks for these specific additions:
const TITLE_FIX = { 'The World of Apu': 'The World of Apu' };

const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'), 'utf8'));
const ids = JSON.parse(fs.readFileSync(R('../src/data/imdbIds.json'), 'utf8'));

async function fetchId(title, year) {
  const t = TITLE_FIX[title] || title;
  for (let i = 0; i < OMDB_KEYS.length; i++) {
    const key = OMDB_KEYS[keyIdx];
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(t)}&y=${year}&type=movie&apikey=${key}`;
    let r; try { r = await (await fetch(url)).json(); } catch { keyIdx=(keyIdx+1)%OMDB_KEYS.length; continue; }
    if (r && r.Response === 'True') return { imdbID: r.imdbID, omdbTitle: r.Title, omdbYear: r.Year };
    if (r && /limit reached|invalid api key/i.test(r.Error||'')) { keyIdx=(keyIdx+1)%OMDB_KEYS.length; continue; }
    return null;
  }
  return null;
}

const report = [];
for (const m of meta) {
  if (MANUAL_IDS[m.id]) { ids[m.id] = MANUAL_IDS[m.id]; report.push(`${m.id} = ${MANUAL_IDS[m.id]} (manual)`); continue; }
  const res = await fetchId(m.title, m.year);
  if (!res) { report.push(`${m.id} = !! NOT FOUND — set manually`); continue; }
  const yrOff = Math.abs(parseInt(res.omdbYear) - m.year);
  const flag = yrOff > 1 ? `  ⚠ year off by ${yrOff} (omdb=${res.omdbYear})` : '';
  ids[m.id] = res.imdbID;
  report.push(`${m.id} = ${res.imdbID}  (${res.omdbTitle} ${res.omdbYear})${flag}`);
}
fs.writeFileSync(R('../src/data/imdbIds.json'), JSON.stringify(ids, null, 2) + '\n');
console.log(report.join('\n'));
console.log('\nReview every ⚠ and "NOT FOUND" line above, then re-run Step 3 verifier.');
```

- [ ] **Step 2: Run it and manually review flags**

Run: `node scripts/fetch-additions-imdb.mjs`
Expected: 68 lines. Manually confirm every `⚠ year off` / `NOT FOUND` line — open `https://www.imdb.com/title/<id>/` for suspicious ones. Known checks: `a-star-is-born-1954` → `tt0046912`; `crash-1996` → `tt0115964`; `napoleon-1927` (Gance) → `tt0018192`; `the-river-1951` (Renoir) → `tt0043972`. Hardcode any wrong/missing one into `MANUAL_IDS` and re-run.

- [ ] **Step 3: Write + run the ID verifier**

```js
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
```

Run: `node scripts/verify-additions-imdb.mjs`
Expected: `OK: all 68 additions have a unique tt id.` (A shared-id error usually means a same-title collision like Crash — fix via `MANUAL_IDS`.)

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-additions-imdb.mjs scripts/verify-additions-imdb.mjs src/data/imdbIds.json
git commit -m "data: backfill IMDb IDs for 68 additions (manual Crash-1996 disambiguation)"
```

---

### Task 3: Snapshot existing tiers (entry-gate baseline)

Capture every existing film's tier BEFORE adding anything, so Task 8 can prove nothing moved.

**Files:**
- Create: `scripts/snapshot-tiers.mjs`
- Create: `scripts/tiers-before.json` (output)

- [ ] **Step 1: Write the snapshot script**

```js
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
```

- [ ] **Step 2: Run it (BEFORE any catalog edit)**

Run: `node scripts/snapshot-tiers.mjs`
Expected: `Snapshotted 787 tiers to tiers-before.json`

- [ ] **Step 3: Commit**

```bash
git add scripts/snapshot-tiers.mjs scripts/tiers-before.json
git commit -m "test: snapshot existing 787 tiers as entry-gate baseline"
```

---

### Task 4: Register the TSPDT list label

**Files:**
- Modify: `src/utils/tierInfo.js` (`LIST_LABELS`, `LIST_SHORT_LABELS`)

**Interfaces:**
- Produces: a renderable label for the `TSPDT` pip used by new films' tooltips.

- [ ] **Step 1: Add the label entries**

In `src/utils/tierInfo.js`, add to `LIST_LABELS` (after the `RT:` line):
```js
  TSPDT: "They Shoot Pictures, Don't They? 1,000 Greatest",
```
and to `LIST_SHORT_LABELS` (after the `RT:` line):
```js
  TSPDT: 'TSPDT 1,000',
```

- [ ] **Step 2: Verify it loads**

Run: `node -e "import('./src/utils/tierInfo.js').then(m=>{if(!m.LIST_LABELS.TSPDT||!m.LIST_SHORT_LABELS.TSPDT)process.exit(1);console.log('OK TSPDT label:',m.LIST_LABELS.TSPDT)})"`
Expected: `OK TSPDT label: They Shoot Pictures, Don't They? 1,000 Greatest`

- [ ] **Step 3: Commit**

```bash
git add src/utils/tierInfo.js
git commit -m "feat: register TSPDT as 9th canon list label (display only)"
```

---

### Task 5: Generate and insert the 68 ESSENTIAL entries into movies.js

**Files:**
- Create: `scripts/insert-additions.mjs`
- Modify: `src/data/movies.js`

**Interfaces:**
- Consumes: `scripts/additions-meta.json`.
- Produces: 68 new `MOVIES` entries; `MOVIES.length === 855`.

- [ ] **Step 1: Write the insert script**

```js
// scripts/insert-additions.mjs — render 68 ESSENTIAL entries from meta and
// splice them into the MOVIES array (before its closing `];`), under a header.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = p => path.resolve(__dirname, p);
const meta = JSON.parse(fs.readFileSync(R('additions-meta.json'),'utf8')).slice().sort((a,b)=>a.year-b.year);
const q = s => `"${String(s).replace(/"/g,'\\"')}"`;     // double-quote titles
const arr = a => `[${(a||[]).map(x=>`'${x}'`).join(', ')}]`;
const line = m => {
  const parts = [`id: '${m.id}'`, `title: ${q(m.title)}`, `year: ${m.year}`, `genre: '${m.genre}'`];
  if (m.altGenres && m.altGenres.length) parts.push(`altGenres: ${arr(m.altGenres)}`);
  parts.push(`category: 'ESSENTIAL'`, `tier: ${m.tier}`, `lists: ${arr(m.lists)}`);
  return `  { ${parts.join(', ')} },`;
};
const block = [
  '',
  '  // =====================================================',
  '  // 2026-06 EXPANSION — TSPDT-1000 (9th list) + FEST widening',
  '  // 68 audited additions (classic Hollywood + festival/world canon).',
  '  // See docs/superpowers/specs/2026-06-30-catalog-classic-hollywood-festival-expansion-design.md',
  '  // =====================================================',
  ...meta.map(line),
].join('\n');

const file = R('../src/data/movies.js');
const src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');
const start = lines.findIndex(l => l.startsWith('export const MOVIES = ['));
if (start < 0) throw new Error('MOVIES array start not found');
let close = -1;
for (let i = start + 1; i < lines.length; i++) if (lines[i].trim() === '];') { close = i; break; }
if (close < 0) throw new Error('MOVIES array close not found');
lines.splice(close, 0, block);
fs.writeFileSync(file, lines.join('\n'));
console.log(`Inserted 68 entries before line ${close + 1}.`);
```

- [ ] **Step 2: Write the catalog verifier**

```js
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
```

- [ ] **Step 3: Run insert, then verify**

Run: `node scripts/insert-additions.mjs && node scripts/verify-catalog.mjs`
Expected: `Inserted 68 entries…` then `OK: 855 films, no dup ids, all 68 additions tier-consistent.`

- [ ] **Step 4: Commit**

```bash
git add scripts/insert-additions.mjs scripts/verify-catalog.mjs src/data/movies.js
git commit -m "feat: add 68 Essentials (TSPDT + FEST-widening expansion), catalog 787->855"
```

---

### Task 6: Add language rows for foreign additions

**Files:**
- Create: `scripts/insert-additions-languages.mjs`
- Modify: `src/data/languages.json`

**Interfaces:**
- Consumes: `scripts/additions-meta.json` (`foreign`, `lang`, `country`).
- Produces: a `languages.json` row per foreign addition → flips `isInternational` true.

- [ ] **Step 1: Write the merge script**

```js
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
```

- [ ] **Step 2: Write + run the verifier**

```js
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
```

Run: `node scripts/insert-additions-languages.mjs && node scripts/verify-additions-languages.mjs`
Expected: `Added N foreign-language rows.` then `OK: international flags correct for all 68 additions.`

- [ ] **Step 3: Commit**

```bash
git add scripts/insert-additions-languages.mjs scripts/verify-additions-languages.mjs src/data/languages.json
git commit -m "data: language rows for foreign additions (International flag/pill)"
```

---

### Task 7: Extend filmAttributes for Documentary / Silent / B&W filters

The Films-tab category filters derive from per-id override sets in `src/utils/filmAttributes.js`.
Defaults: a film is B&W if `year < 1955` (else colour); silent if `year < 1928`; documentary only
if enumerated. So the new films need explicit overrides for: pre-1955 COLOUR films, post-1955 B&W
films, year≥1928 SILENT films, and all DOCUMENTARIES. Classifications live in
`scripts/additions-attributes.json` (`{id, colour, silent, documentary}`, produced during planning).

**Files:**
- Create: `scripts/gen-filmattributes-patch.mjs`, `scripts/verify-additions-attributes.mjs`
- Modify: `src/utils/filmAttributes.js` (the `DOC_IDS`, `SILENT_POST_1928_IDS`, `COLOR_PRE_1955_IDS`, `BW_POST_1955_IDS` sets)

- [ ] **Step 1: Generate the exact id lines to paste**

```js
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
```

Run: `node scripts/gen-filmattributes-patch.mjs`
It prints four id blocks.

- [ ] **Step 2: Paste each block into the matching Set in `src/utils/filmAttributes.js`**

Add each printed id (e.g. `  'kiss-me-deadly-1955',`) inside the corresponding existing `new Set([ … ])`
literal — `COLOR_PRE_1955_IDS`, `BW_POST_1955_IDS`, `SILENT_POST_1928_IDS`, `DOC_IDS`. Keep one id
per line, matching the file's existing style. Do not remove any existing id.

- [ ] **Step 3: Write + run the attribute verifier**

```js
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
```

Run: `node scripts/verify-additions-attributes.mjs`
Expected: `OK: B&W / Silent / Documentary attributes correct for all 68 additions.` A failure means a paste was missed — re-check Step 2 against the gen output.

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-filmattributes-patch.mjs scripts/verify-additions-attributes.mjs scripts/additions-attributes.json src/utils/filmAttributes.js
git commit -m "feat: Documentary/Silent/B&W filter overrides for 68 additions"
```

---

### Task 8: Data fixes uncovered by the audit

**Files:**
- Modify: `scripts/canon-lists/lists.json`

- [ ] **Step 1: Remove the 2001 year-collision noise**

`scripts/canon-lists/lists.json` contains a phantom `"2001 A Space Odyssey (2001)"` (a duplicate of the real 1968 film). Remove that exact string from any list array it appears in (check `AFI` and `IMDB`). Verify:

Run: `node -e "const j=require('./scripts/canon-lists/lists.json');let n=0;for(const k of Object.keys(j))if(Array.isArray(j[k]))n+=j[k].filter(s=>/2001.*\(2001\)/.test(s)).length;console.log('2001-collision entries remaining:',n)"`
Expected: `2001-collision entries remaining: 0`

- [ ] **Step 2: Record Aparajito's Venice Golden Lion in FEST provenance**

Aparajito (1956) won the Venice 1957 Golden Lion but was missing from the FEST scrape. It is already added to the catalog with `FEST` in its `lists` (Task 5). For provenance consistency, add `"Aparajito (1956)"` to the `FEST` array in `scripts/canon-lists/lists.json`. Verify:

Run: `node -e "const j=require('./scripts/canon-lists/lists.json');console.log('FEST has Aparajito:', j.FEST.some(s=>/Aparajito/.test(s)))"`
Expected: `FEST has Aparajito: true`

- [ ] **Step 3: Commit**

```bash
git add scripts/canon-lists/lists.json
git commit -m "fix(data): drop 2001 year-collision noise; record Aparajito Golden Lion in FEST"
```

---

### Task 9: Prove entry-gate (no existing tier moved), build, and document

**Files:**
- Create: `scripts/diff-tiers.mjs`
- Modify: `docs/METHODOLOGY.md`, `CHANGELOG.md`, `README.md`, `package.json`

- [ ] **Step 1: Write the tier-diff (entry-gate proof)**

```js
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
```

- [ ] **Step 2: Run the full verification suite**

Run:
```bash
node scripts/validate-additions.mjs && \
node scripts/verify-additions-imdb.mjs && \
node scripts/verify-catalog.mjs && \
node scripts/verify-additions-languages.mjs && \
node scripts/verify-additions-attributes.mjs && \
node scripts/diff-tiers.mjs
```
Expected: six `OK:` lines, the last being `OK: all 787 pre-existing films unchanged (entry-gate holds).`

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds with no errors (Vite emits `dist/`).

- [ ] **Step 4: Update docs + version**

In `docs/METHODOLOGY.md`: change "8 lists" → "9 lists"; add a short subsection documenting TSPDT-1000 (2025) as the 9th list and the FEST widening to secondary jury prizes, noting **entry-gate scope** (new films only; existing tiers frozen); update the one-line summary and catalog size to **855**.

In `README.md`: update "330 essential … 787 films" → "398 essential … 855 films" and "8 major lists" → "9 major lists (… + They Shoot Pictures, Don't They? 1,000 Greatest)".

In `CHANGELOG.md`: add an entry — "Catalog: +68 Essentials (classic Hollywood + festival/world canon) via new TSPDT-1000 canon list + FEST widening; 787 → 855. No existing tiers changed."

In `package.json`: bump `version` (minor bump from current).

- [ ] **Step 5: Commit**

```bash
git add scripts/diff-tiers.mjs docs/METHODOLOGY.md README.md CHANGELOG.md package.json
git commit -m "docs: document 9th canon list (TSPDT) + FEST widening; catalog 855; vN.N.N"
```

- [ ] **Step 6 (manual smoke test, optional but recommended):**

Run `npm run dev`, open the Films tab, and confirm 3 spot-checks render correctly: **Kiss Me Deadly** (poster + tier-2 pips incl. a TSPDT pip), **Vivre sa vie** (French flag pill / International filter), **Meet Me in St. Louis** (searchable, tier-2). Confirm the canon-depth (tier) and International filters include/exclude them as expected.

---

## Notes for the implementer

- Run tasks in order. Task 3 (snapshot) MUST run before Task 5 (insert) or the entry-gate proof is meaningless.
- If `validate-additions.mjs` reports a film "already in catalog" that you believe is genuinely new, it's a normalization/alias clash — inspect with the same `normalize()` and decide; do not blindly add a near-duplicate.
- The `scripts/*-additions*.json`/`gap-*.json`/`audit-result.json` artifacts are audit provenance; keep them (they're already untracked or can be committed as provenance).
