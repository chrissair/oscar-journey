// Fetches Traditional Chinese (zh-TW) titles + plot summaries from TMDB for
// every film in the catalog. Writes the result to src/data/chineseTitles.json
// so the app can surface Chinese titles alongside English ones when the user
// flips the language toggle.
//
// Reuses tmdb-cache.json (built by backfill-series.mjs) — every catalog film
// already has its TMDB id there, so this script is just a metadata fetch
// per film with a different language parameter.
//
// Output shape:
//   {
//     "the-godfather-1972": {
//       "tmdbId": 238,
//       "title": "教父",       // zh-TW title if available, else null
//       "overview": "…"         // zh-TW overview if available, else null
//     },
//     …
//   }
//
// Run:   node --env-file=.env scripts/fetch-chinese-titles.mjs
// Flags: --limit=N        only process first N films (for testing)
//        --no-cache        ignore the output file and refetch everything

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const TMDB_CACHE_PATH = join(__dirname, 'tmdb-cache.json');
const OUTPUT_PATH = join(REPO_ROOT, 'src/data/chineseTitles.json');

const TOKEN = process.env.TMDB_READ_TOKEN;
if (!TOKEN) {
  console.error('TMDB_READ_TOKEN missing. Run with:  node --env-file=.env scripts/fetch-chinese-titles.mjs');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const limitArg = [...args].find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const USE_CACHE = !args.has('--no-cache');

// --- tiny TMDB client ------------------------------------------------------

const BASE = 'https://api.themoviedb.org/3';
const HEADERS = { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' };

async function tmdb(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${url.pathname}: ${await res.text()}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- load the TMDB-id cache (filmId → tmdbId) ------------------------------

if (!existsSync(TMDB_CACHE_PATH)) {
  console.error(`Missing ${TMDB_CACHE_PATH}. Run backfill-series.mjs first to build the TMDB id cache.`);
  process.exit(1);
}
const tmdbCache = JSON.parse(readFileSync(TMDB_CACHE_PATH, 'utf8'));
const films = Object.entries(tmdbCache)
  .filter(([, v]) => v && typeof v.tmdbId === 'number')
  .map(([filmId, v]) => ({ filmId, tmdbId: v.tmdbId, englishTitle: v.tmdbTitle }));
console.log(`Loaded ${films.length} films with TMDB ids.`);

// --- load existing output so reruns skip already-fetched films --------------

let out = {};
if (USE_CACHE && existsSync(OUTPUT_PATH)) {
  out = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  console.log(`Loaded ${Object.keys(out).length} existing Chinese title entries.`);
}

function save() {
  writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));
}

// --- fetch loop ------------------------------------------------------------

let done = 0;
let fetched = 0;
let noZh = 0;

for (const { filmId, tmdbId, englishTitle } of films) {
  if (done >= LIMIT) break;
  done++;

  if (out[filmId]) continue; // already cached

  try {
    const data = await tmdb(`/movie/${tmdbId}`, { language: 'zh-TW' });

    // TMDB falls back to English when no zh-TW translation exists. Detect by
    // comparing titles + checking character set — if the returned title is
    // the same ASCII English title, there's no real Chinese translation.
    const hasChineseTitle = data.title && data.title !== englishTitle && /[一-鿿]/.test(data.title);
    const hasChineseOverview = data.overview && /[一-鿿]/.test(data.overview);

    out[filmId] = {
      tmdbId,
      title: hasChineseTitle ? data.title : null,
      overview: hasChineseOverview ? data.overview : null,
    };
    fetched++;
    if (!hasChineseTitle && !hasChineseOverview) noZh++;

    if (fetched % 25 === 0) {
      console.log(`  ${fetched} fetched (${done}/${films.length} processed, ${noZh} with no zh-TW data)…`);
      save();
    }
  } catch (err) {
    console.error(`  FAILED ${filmId} (tmdbId=${tmdbId}): ${err.message}`);
    // Don't cache failures — we want to retry next run.
  }

  // Gentle pacing to stay well below TMDB's 50 req/sec limit.
  await sleep(40);
}

save();

const withTitle = Object.values(out).filter((v) => v.title).length;
const withOverview = Object.values(out).filter((v) => v.overview).length;
console.log(`\nDone. ${Object.keys(out).length} entries total; ${withTitle} have zh-TW titles, ${withOverview} have zh-TW overviews.`);
console.log(`Wrote ${OUTPUT_PATH}`);
