// Helpers that massage the app's three external ratings (IMDb, Metacritic,
// Letterboxd) and its internal one (User Avg) into the display shapes used by
// FilmCard and FilmDetailModal. Keep the numeric manipulation here so the
// components stay dumb — they just read "rating + label" structs.

import { getLetterboxdRating } from './letterboxd';

// The "consensus" mix: heavy Letterboxd because cinephile ratings tend to be
// less inflated at the top end than IMDb's, and IMDb is the counterweight so
// broadly-loved popular films don't get punished for not being critical
// darlings. Both are normalized to a 0–10 scale before blending.
const LETTERBOXD_WEIGHT = 0.75;
const IMDB_WEIGHT = 0.25;

// Letterboxd rates on 0–5. Scale up so the blend output lives on the 0–10
// scale most viewers already read fluently from IMDb.
function letterboxdOnTen(lbRating) {
  return lbRating * 2;
}

// Returns the blended "Consensus" score (0–10, one decimal) or null if either
// input is missing. Both signals are needed — the blend isn't meaningful with
// only one side of the scale represented.
export function getConsensusScore(movie, omdbData) {
  const lb = getLetterboxdRating(movie);
  const lbRating = lb?.rating;
  const imdbRaw = omdbData?.rating;
  const imdb = imdbRaw ? parseFloat(imdbRaw) : null;
  if (lbRating == null || imdb == null || Number.isNaN(imdb)) return null;
  const blended = LETTERBOXD_WEIGHT * letterboxdOnTen(lbRating) + IMDB_WEIGHT * imdb;
  return Math.round(blended * 10) / 10;
}

// Pretty label explaining the blend — reused by the "?" tooltip so the
// wording stays in one place and can be audited against the weights above.
export const CONSENSUS_TOOLTIP_TEXT = '75% Letterboxd + 25% IMDb';
