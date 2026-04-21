// Thin accessor around chineseTitles.json (Traditional Chinese titles +
// plot summaries fetched from TMDB). Consumers call the helpers below
// rather than importing the JSON directly so we can evolve the format
// without touching every call site.
//
// The JSON is a flat map keyed by catalog film id:
//   { "the-godfather-1972": { tmdbId, title, overview } }
// title / overview are strings if TMDB has a zh-TW translation, else null.
//
// Out-of-canon films (tmdb:<id> watched-keys from the series preview)
// aren't in this map; see getChineseTitleByTmdbId for that path.

import DATA from './chineseTitles.json';

// Prebuild a reverse index so series previews (which only have tmdbId,
// not a catalog filmId) can still look up Chinese metadata. Films that
// appear in multiple catalog entries under the same tmdbId are extremely
// unlikely given the catalog is deduplicated on release, but first-wins
// is the safe tiebreak.
const BY_TMDB_ID = (() => {
  const map = new Map();
  for (const [filmId, entry] of Object.entries(DATA)) {
    if (entry && typeof entry.tmdbId === 'number' && !map.has(entry.tmdbId)) {
      map.set(entry.tmdbId, entry);
    }
  }
  return map;
})();

export function getChineseTitle(filmId) {
  const entry = DATA[filmId];
  return entry && entry.title ? entry.title : null;
}

export function getChineseOverview(filmId) {
  const entry = DATA[filmId];
  return entry && entry.overview ? entry.overview : null;
}

export function getChineseTitleByTmdbId(tmdbId) {
  const entry = BY_TMDB_ID.get(tmdbId);
  return entry && entry.title ? entry.title : null;
}

export function getChineseOverviewByTmdbId(tmdbId) {
  const entry = BY_TMDB_ID.get(tmdbId);
  return entry && entry.overview ? entry.overview : null;
}
