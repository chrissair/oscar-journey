// Third pass: for films whose Wikipedia article had no structured
// accolades table, derive nominations from the ceremony page instead.
// Every nominee/winner is on a given "Xth Academy Awards" page under
// `{{Award category|...|[[Academy Award for Best X|...]]}}` headers —
// parse those once per ceremony and map back to catalog films.
//
// Narrower scope than v1/v2: only films where the ceremony modal WILL
// open (has a ceremony line) and where we currently have empty
// nominations. For ESSENTIAL-derived ceremony films (INT winners, etc.)
// we infer ceremony from year.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOVIES_PATH = path.resolve(__dirname, '../src/data/movies.js');
const REPORT_PATH = path.resolve(__dirname, 'nominations-backfill.json');

const UA = 'oscars-journey-nominations/1.0 (mailto:iswhat444@gmail.com)';

// Category mapping — same as backfill-nominations.mjs. Only categories
// with entries here count; unknown labels are dropped.
const AWARD_MAP = {
  'Best Director': { category: 'Director' },
  'Best Directing': { category: 'Director' },
  'Best Actor': { category: 'Actor' },
  'Best Actress': { category: 'Actress' },
  'Best Actor in a Leading Role': { category: 'Actor' },
  'Best Actress in a Leading Role': { category: 'Actress' },
  'Best Supporting Actor': { category: 'Supporting Actor' },
  'Best Supporting Actress': { category: 'Supporting Actress' },
  'Best Actor in a Supporting Role': { category: 'Supporting Actor' },
  'Best Actress in a Supporting Role': { category: 'Supporting Actress' },
  'Best Original Screenplay': { category: 'Original Screenplay' },
  'Best Writing, Original Screenplay': { category: 'Original Screenplay' },
  'Best Story and Screenplay': { category: 'Original Screenplay' },
  'Best Writing, Story and Screenplay': { category: 'Original Screenplay' },
  'Best Adapted Screenplay': { category: 'Adapted Screenplay' },
  'Best Writing, Adapted Screenplay': { category: 'Adapted Screenplay' },
  'Best Screenplay': { category: 'Adapted Screenplay' }, // pre-1940s split
  'Best Writing, Screenplay': { category: 'Adapted Screenplay' },
  'Best Writing, Screenplay Based on Material from Another Medium': { category: 'Adapted Screenplay' },
  'Best Cinematography': { category: 'Cinematography' },
  'Best Cinematography, Black-and-White': { category: 'Cinematography' },
  'Best Cinematography, Color': { category: 'Cinematography' },
  'Best Original Score': { category: 'Original Score' },
  'Best Original Music Score': { category: 'Original Score' },
  'Best Music, Original Score': { category: 'Original Score' },
  'Best Music, Scoring': { category: 'Original Score' },
  'Best Music, Scoring of a Dramatic Picture': { category: 'Original Score' },
  'Best Music, Scoring of a Dramatic or Comedy Picture': { category: 'Original Score' },
  'Best Music, Scoring of a Musical Picture': { category: 'Original Score' },
  'Best Music, Scoring of a Motion Picture': { category: 'Original Score' },
  'Best Music, Original Dramatic Score': { category: 'Original Score' },
  'Best Music, Original Musical or Comedy Score': { category: 'Original Score' },
  'Best Original Dramatic Score': { category: 'Original Score' },
  'Best Original Musical or Comedy Score': { category: 'Original Score' },
  'Best Original Musical Score': { category: 'Original Score' },
  'Best Score, Adaptation or Treatment': { category: 'Original Score' },
  'Best Original Song': { category: 'Original Song' },
  'Best Music, Original Song': { category: 'Original Song' },
  'Best Film Editing': { category: 'Film Editing' },
  'Best Visual Effects': { category: 'Visual Effects' },
  'Best Special Effects': { category: 'Visual Effects' },
  'Best Special Visual Effects': { category: 'Visual Effects' },
  'Best Effects': { category: 'Visual Effects' },
  'Best Costume Design': { category: 'Costume Design' },
  'Best Costume Design, Black-and-White': { category: 'Costume Design' },
  'Best Costume Design, Color': { category: 'Costume Design' },
  'Best Production Design': { category: 'Production Design' },
  'Best Art Direction': { category: 'Art Direction' },
  'Best Art Direction, Black and White': { category: 'Art Direction' },
  'Best Art Direction, Black-and-White': { category: 'Art Direction' },
  'Best Art Direction, Color': { category: 'Art Direction' },
  'Best Makeup and Hairstyling': { category: 'Makeup' },
  'Best Makeup': { category: 'Makeup' },
  'Best Sound': { category: 'Sound' },
  'Best Sound Editing': { category: 'Sound Editing' },
  'Best Sound Mixing': { category: 'Sound Mixing' },
  'Best Sound Effects': { category: 'Sound Effects Editing' },
  'Best Sound Effects Editing': { category: 'Sound Effects Editing' },
  'Best Sound Recording': { category: 'Sound' },
  'Best Documentary Feature': { category: 'Documentary Feature' },
  'Best Documentary Feature Film': { category: 'Documentary Feature' },
  'Best Foreign Language Film': { category: 'International Feature' },
  'Best International Feature Film': { category: 'International Feature' },
  'Best Animated Feature': { category: 'Animated Feature' },
  'Best Motion Picture': { category: 'Best Picture' },
  'Best Picture': { category: 'Best Picture' },
  'Outstanding Motion Picture': { category: 'Best Picture' },
  'Outstanding Picture': { category: 'Best Picture' },
  'Outstanding Production': { category: 'Best Picture' },
};

async function fetchJson(url) {
  const resp = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!resp.ok) throw new Error(`${resp.status} ${url}`);
  return await resp.json();
}
async function fetchWikitext(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&redirects=1&origin=*`;
  const data = await fetchJson(url);
  return data.parse?.wikitext?.['*'] || null;
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Normalize a Wikipedia film title to a catalog-id-style slug.
function slugify(title, year) {
  return title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + year;
}

// Parse every `{{Award category|...|[[Academy Award for Best X|Label]]}}`
// block. Returns [{category, films: [{title, won}]}].
function parseCeremonyPage(wt) {
  if (!wt) return [];
  const markerRe = /\{\{\s*Award category\|[^|}]*\|\s*\[\[\s*Academy Award for Best [^|}]+(?:\|\s*([^}\]]+))?\]\]\s*\}\}/gi;
  const results = [];
  const markers = [];
  let m;
  while ((m = markerRe.exec(wt)) !== null) {
    markers.push({ idx: m.index + m[0].length, label: (m[1] || '').trim() });
  }
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].idx;
    const end = i + 1 < markers.length ? markers[i + 1].idx : Math.min(wt.length, start + 3000);
    const section = wt.slice(start, end);
    const label = markers[i].label;
    const mapped = AWARD_MAP[label];
    if (!mapped) continue;
    const films = [];
    for (const raw of section.split('\n')) {
      const line = raw.trim();
      if (!line.startsWith('*')) continue;
      const bulletDepth = line.match(/^\*+/)[0].length;
      // First italicized wikilink in the line is the film.
      let fm = line.match(/''\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]''/);
      if (!fm) continue;
      const title = fm[1].replace(/\s*\(\d{4} film\)$/, '').replace(/\s*\(film\)$/, '').trim();
      const won = bulletDepth === 1 && (/'''/.test(line) || /\{\{double dagger\}\}/i.test(line));
      films.push({ title, won });
    }
    results.push({ category: mapped.category, films });
  }
  return results;
}

async function main() {
  const mm = await import(pathToFileURL(MOVIES_PATH).href);
  const MOVIES = mm.MOVIES;
  const byId = new Map(MOVIES.map(m => [m.id, m]));
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const byReportId = new Map(report.map(r => [r.id, r]));

  // Target set: films with empty nominations AND a ceremony line in the UI.
  const targets = report
    .filter(r => !r.nominations || r.nominations.length === 0)
    .map(r => {
      const m = byId.get(r.id);
      if (!m) return null;
      const hasOscar = m.category === 'BP' || m.category === 'INT' || m.category === 'ANIM'
        || (m.awards?.length > 0) || (m.alsoWon?.length > 0) || m.won;
      if (!hasOscar) return null;
      const ceremony = m.ceremony ?? (m.year >= 1929 ? m.year - 1927 : null);
      if (!ceremony) return null;
      return { ...r, _movie: m, _ceremony: ceremony };
    })
    .filter(Boolean);

  // Group by ceremony so we fetch each page once.
  const byCeremony = new Map();
  for (const t of targets) {
    if (!byCeremony.has(t._ceremony)) byCeremony.set(t._ceremony, []);
    byCeremony.get(t._ceremony).push(t);
  }
  console.log(`Targeting ${targets.length} films across ${byCeremony.size} ceremonies`);

  let recovered = 0;
  for (const [cer, films] of [...byCeremony].sort((a, b) => a[0] - b[0])) {
    const page = `${ordinal(cer)} Academy Awards`;
    process.stdout.write(`  ${page} (${films.length} films)... `);
    const wt = await fetchWikitext(page);
    const parsed = parseCeremonyPage(wt);
    let perCeremonyRecovered = 0;
    for (const t of films) {
      const m = t._movie;
      const matches = [];
      const expectedSlug = m.id;
      const lcTitle = m.title.toLowerCase();
      for (const section of parsed) {
        for (const f of section.films) {
          const fslug = slugify(f.title, m.year);
          if (fslug === expectedSlug || f.title.toLowerCase() === lcTitle) {
            matches.push({ category: section.category, won: f.won });
          }
        }
      }
      if (matches.length === 0) continue;
      // Dedupe: same category may appear twice (winner + bulleted non-winner if
      // parser got confused). Prefer won=true.
      const byCat = new Map();
      for (const x of matches) {
        const prev = byCat.get(x.category);
        if (!prev || (x.won && !prev.won)) byCat.set(x.category, x);
      }
      t.nominations = Array.from(byCat.values());
      t.source = `${page} (ceremony-page)`;
      // Write back into the report entry.
      const entry = byReportId.get(t.id);
      if (entry) {
        entry.nominations = t.nominations;
        entry.source = t.source;
      }
      perCeremonyRecovered++;
      recovered++;
    }
    console.log(`recovered ${perCeremonyRecovered}`);
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  const totalWithNoms = report.filter(r => r.nominations?.length > 0).length;
  console.log(`\nRecovered ${recovered} films.  Total coverage: ${totalWithNoms}/${report.length}`);
  const stillEmpty = report.filter(r => !r.nominations || r.nominations.length === 0);
  console.log(`Still empty: ${stillEmpty.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
