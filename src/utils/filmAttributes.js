// Shared film-attribute predicates used by both the Journey filter (App.jsx)
// and the Film tab filter (FilmList.jsx). A film can have multiple attributes
// simultaneously (Parasite is International AND Best Picture winner). These
// helpers let a single checkbox "International" or "Animated" catch every
// film with that property across all Oscar categories and Essentials.

import LANGUAGES from '../data/languages.json';

// International = non-English spoken language. Covers Oscar INT winners, any
// film with a non-English entry in languages.json (which is populated only
// for non-English films), and any film whose alsoWon includes 'INT'.
export function isInternational(movie) {
  if (movie.category === 'INT') return true;
  if ((movie.alsoWon || []).includes('INT')) return true;
  return LANGUAGES[movie.id] != null;
}

// Animated = Oscar ANIM category, alsoWon ANIM, or genre code 'A' (Animation
// / Family) — catches films like Toy Story that predate the ANIM Oscar but
// are clearly animated.
export function isAnimated(movie) {
  if (movie.category === 'ANIM') return true;
  if ((movie.alsoWon || []).includes('ANIM')) return true;
  return movie.genre === 'A';
}

// Category filter (additive): returns true if the film matches the current
// attribute selection. If nothing is checked, the filter is a no-op (passes
// everything). Otherwise a film passes if it matches ANY checked attribute.
export function matchesCategoryFilter(movie, categories) {
  const c = categories || {};
  const anyChecked = c.INT || c.ANIM;
  if (!anyChecked) return true;
  if (c.INT && isInternational(movie)) return true;
  if (c.ANIM && isAnimated(movie)) return true;
  return false;
}
