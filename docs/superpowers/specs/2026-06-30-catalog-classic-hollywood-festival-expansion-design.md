# Catalog Expansion — Classic Hollywood + Festival Standouts (Design)

**Date:** 2026-06-30
**Status:** Design — awaiting user review before plan
**Author:** brainstorming session (audit-driven)

## 1. Goal

Expand the Oscars Journey Essentials with **classic Hollywood** and **Cannes/Venice
festival standouts** (plus adjacent comps), the user's two named targets. The user's seed
examples were Gilda, Meet Me in St. Louis, and a 10-film list (8 of which were already in
the catalog). Constraints fixed up front by the user:

- **Mechanism:** add one or more *orthogonal canon lists* and re-run the existing 2-of-N
  rule — keep additions mechanical and defensible, not hand-picked.
- **Budget:** ~40–80 net new films (landed at **68**).
- **No new tiers.** Only new films; the 5-tier scale is untouched.
- **Composition:** rebalanced toward classic Hollywood (user choice).
- **List scope:** entry-gate only — the new list gates new films but does **not** re-score
  the existing catalog (existing tiers stay frozen).

## 2. The criterion (what we add to the system)

### 2.1 Add **They Shoot Pictures, Don't They? — "1,000 Greatest Films" (2025, 21st ed.)** as the 9th canon list (`TSPDT`)

TSPDT is a statistical meta-poll aggregating thousands of critics'/directors' ballots. It is
the single most authoritative academic meta-canon and — uniquely among candidate lists — is
strong on **both** classic Hollywood **and** world cinema, hitting both user targets with one
list. Its *mechanism* (aggregated polling) is genuinely distinct from all 8 existing lists.

### 2.2 Widen **FEST** to secondary competitive jury prizes (`FEST` widening)

FEST currently counts only the top prize (Palme d'Or / Golden Lion / Golden Bear). Widen it to
the major secondary *jury* prizes at the same three festivals: Cannes Grand Prix + Jury Prize;
Venice Silver Lion / Grand or Special Jury Prize; Berlin Silver Bear (Grand Jury + Best
Director). Acting prizes (Volpi) and sidebars (Un Certain Regard) excluded. This is a small,
on-focus second lever for festival standouts, and it forces the FEST re-scrape that fixes the
Aparajito mis-scrape (§5).

### 2.3 Why exactly these two — and not the other levers

The audit fetched each candidate list and intersected it against a grounded 352-film near-miss
dossier. Results:

| Lever | Verdict | Why |
|---|---|---|
| **TSPDT-1000** | **ADD** | Orthogonal mechanism; spans both targets; self-limiting (see §3). |
| **FEST widening** | **ADD (small)** | 5 on-focus festival films + the Aparajito data-fix; minimal dilution. |
| AFI genre slate | REJECT | Double-counts AFI — 100% of films it catches are already on AFI-100; a second stamp from the *same* authority, exactly what the system guards against. |
| Other festivals (Locarno/SS/KV/TIFF/Sundance) | REJECT | Nets only **1** unique film; TIFF People's Choice is an Oscar-precursor (not orthogonal). Not worth a list. |
| Critics' guilds (NYFCC/NSFC/Cahiers) | REJECT | NSFC intersects the gap **zero** times; Cahiers redundant with TSPDT; 2 of 3 NYFCC catches are Oscar-overlap. |

## 3. Why this is defensible — the self-limiting property

Adding a 9th list to a **2-of-N** rule can only promote a film that is **already on ≥1 of the
existing 8 lists** (otherwise it still falls below threshold). Therefore:

- **Bloat is mechanically bounded** — the rescue set can never exceed the near-miss pool.
- **Every addition ends up with ≥2 endorsements from *different* cultural authorities**, by
  construction. Nothing rests on the IMDb+RT populist pair (the pair that would otherwise let
  in Spider-Man / Harry Potter, which the curators rejected). The arthouse mirror of that
  problem — CRIT+SS-only "two-arthouse-authorities" films — was held back in the rebalance (§4).

Pre-1970 films still require **3** lists (the stricter studio-era bar), so every classic-Hollywood
addition lands on 3 lists spanning preservation (NFR) / arthouse (Criterion) / institutional
(AFI) / critics-poll (TSPDT) — not a single worldview.

## 4. The 71 additions

Source of truth: `scripts/final-additions.json` (generated from the audit + the rebalance).
Tier shown is computed from `lists` via the repo's exact r2 bucket math
(`src/utils/tierInfo.js`). Display titles below are normalized-form; implementation must restore
articles/diacritics (e.g. "Kid" → "The Kid", "Cleo From 5 To 7" → "Cléo from 5 to 7",
"Apur Sansar" → "The World of Apu / Apur Sansar"). `lists` already reflect the new TSPDT/FEST
membership where earned.

### 4a. Classic Hollywood (29)

```
1916 T1 Intolerance               [AFI,NFR,SS]
1921 T3 The Kid                   [CRIT,IMDB,NFR,RT]
1925 T1 The Freshman              [AFI,CRIT,NFR]
1928 T2 The Crowd                 [NFR,SS,TSPDT]
1928 T2 The Cameraman             [CRIT,NFR,RT]
1930 T1 Morocco                   [AFI,CRIT,NFR]
1931 T1 Frankenstein              [AFI,NFR,TSPDT]      (rebalance swap-in)
1937 T2 Make Way for Tomorrow     [CRIT,NFR,RT]
1937 T1 The Awful Truth           [AFI,CRIT,NFR]
1939 T1 Ninotchka                 [AFI,NFR,TSPDT]      (rebalance swap-in)
1942 T1 Now, Voyager              [AFI,CRIT,NFR]
1942 T1 Woman of the Year         [AFI,CRIT,NFR]
1943 T2 Shadow of a Doubt         [NFR,RT,TSPDT]       (rebalance swap-in)
1944 T2 Meet Me in St. Louis      [NFR,RT,TSPDT]       ★ user-named
1945 T2 Detour                    [CRIT,NFR,TSPDT]     (rebalance swap-in)
1947 T2 Out of the Past           [NFR,SS,TSPDT]
1948 T2 Letter from an Unknown Woman [NFR,SS,TSPDT]
1950 T2 The Asphalt Jungle        [CRIT,NFR,TSPDT]     (rebalance swap-in)
1952 T1 The Quiet Man             [AFI,NFR,TSPDT]
1954 T2 Johnny Guitar             [NFR,SS,TSPDT]
1954 T1 A Star Is Born            [AFI,NFR,TSPDT]      (rebalance swap-in)
1955 T2 Kiss Me Deadly            [CRIT,NFR,TSPDT]     (rebalance swap-in)
1957 T3 Witness for the Prosecution [AFI,IMDB,LBXD,RT]
1959 T2 Imitation of Life         [NFR,SS,TSPDT]       (1959 Sirk)
1961 T1 A Raisin in the Sun       [AFI,CRIT,NFR]
1961 T1 The Hustler               [AFI,NFR,TSPDT]      (rebalance swap-in)
1963 T2 The Great Escape          [AFI,CRIT,IMDB]
1967 T1 In Cold Blood             [AFI,CRIT,NFR]
1968 T1 Funny Girl                [AFI,CRIT,NFR]
```

### 4b. World / Arthouse / Festival (35)

```
1925 T2 Battleship Potemkin       [RT,SS,TSPDT]
1927 T2 Napoleon                  [LBXD,SS,TSPDT]
1928 T3 The Passion of Joan of Arc[CRIT,IMDB,LBXD,RT]
1932 T2 Vampyr                    [CRIT,SS,TSPDT]
1946 T2 Paisan                    [CRIT,SS,TSPDT]
1949 T2 Kind Hearts and Coronets  [CRIT,RT,TSPDT]
1951 T2 The River                 [CRIT,SS,TSPDT]      (Renoir)
1952 T2 Forbidden Games           [CRIT,FEST,RT]
1953 T2 I Vitelloni               [CRIT,RT,FEST]
1954 T2 Journey to Italy          [CRIT,SS,TSPDT]
1955 T2 Night and Fog             [CRIT,RT,TSPDT]
1956 T2 Aparajito                 [CRIT,LBXD,FEST]     (FEST data-fix, §5)
1957 T2 Throne of Blood           [CRIT,LBXD,TSPDT]
1959 T2 Pickpocket                [CRIT,SS,TSPDT]
1959 T2 Hiroshima mon amour       [CRIT,SS,TSPDT]
1959 T2 Apur Sansar / The World of Apu [CRIT,LBXD,TSPDT]  (completes Apu trilogy)
1962 T2 Vivre sa vie              [CRIT,SS,TSPDT]      ★ user-named
1962 T2 L'Eclisse                 [CRIT,SS,TSPDT]
1962 T2 Cléo from 5 to 7          [CRIT,SS,TSPDT]
1962 T2 The Exterminating Angel   [CRIT,SS,TSPDT]
1962 T2 An Autumn Afternoon       [CRIT,LBXD,SS]       (Ozu)
1963 T2 Contempt                  [CRIT,SS,TSPDT]
1964 T2 Charulata                 [CRIT,SS,FEST]
1964 T2 Red Desert                [CRIT,FEST,SS]
1964 T2 I Am Cuba                 [CRIT,LBXD,RT]
1964 T2 Woman in the Dunes        [CRIT,LBXD,RT]
1965 T2 Pierrot le Fou            [CRIT,SS,TSPDT]
1965 T2 Le Bonheur                [CRIT,SS,FEST]
1965 T2 Simón of the Desert       [CRIT,RT,FEST]
1966 T2 Au hasard Balthazar       [CRIT,RT,SS]
1967 T2 Belle de Jour             [CRIT,FEST,TSPDT]
1967 T2 The Young Girls of Rochefort [CRIT,LBXD,SS]
1969 T2 Kes                       [LBXD,RT,TSPDT]
1969 T3 Army of Shadows           [CRIT,LBXD,RT,SS]
1969 T2 Salesman                  [CRIT,NFR,RT]        (Maysles doc — borderline theme)
```

### 4c. Off-theme leak-fixes (4 kept)

These already satisfy the 2-of-N rule and were missing from the catalog, but they are
post-1970 American films — neither classic Hollywood nor festival. Kept as a
"complete-the-canon" integrity fix. **Philadelphia (AFI+NFR, both US-institutional) and
Hotel Rwanda (AFI+IMDb, institutional+populist) were CUT** — thinnest cross-worldview pairings.

```
1975 T1 Shampoo                   [AFI,CRIT]
1985 T1 Lost in America           [AFI,CRIT]
1989 T1 Tongues Untied            [CRIT,NFR]
1996 T1 Crash (1996, Cronenberg)  [CRIT,SS]   ← must not collide with 2004 BP "Crash"
```

### 4d. The rebalance (documented)

Per the user's "rebalance toward classic Hollywood", 8 deepest-arthouse picks were **swapped
out** for 8 canonical studio films (each still TSPDT + 2 lists = 3, so equally defensible):

- **Out:** Gertrud, Daisies, Memories of Underdevelopment, Day of Wrath (deep-arthouse / Dreyer
  redundant), and 4 CRIT+SS-only leaks the user flagged as "most obscure" (Soleil Ô, Sambizanga,
  India Song, News from Home — the arthouse mirror of the populist-pair problem).
- **In:** Frankenstein, Ninotchka, Detour, The Asphalt Jungle, A Star Is Born, Kiss Me Deadly,
  The Hustler, Shadow of a Doubt.

## 5. Data fixes uncovered by the audit (do as part of this work)

1. **Aparajito** won the **Venice 1957 Golden Lion** (the top prize) but the festival scrape
   missed it. With FEST it is CRIT+LBXD+FEST = 3 lists → it actually *already qualifies*. Fix the
   FEST source data and add it.
2. **`lists.json` noise:** a `"2001 A Space Odyssey (2001)"` entry is a year-collision duplicate
   of the 1968 film (already in catalog). Remove it so it stops surfacing as a phantom candidate.

## 6. Gilda — DROPPED (decision: full mechanical purity)

Gilda is on NFR + Criterion only (2 lists; pre-1970 needs 3), is **not** in TSPDT-1000, won no
festival prize, and is not a critics' pick. There is no mechanical third authority for it — it is
iconic as a *star image* (Hayworth) more than as a ranked film. **Decision: not added**, to keep
every entry rule-derived with zero exceptions. Revisit if a future list (or TSPDT edition) ever
picks it up.

## 7. Implementation surface

| File | Change |
|---|---|
| `src/data/movies.js` | Add 71 `category: 'ESSENTIAL'` entries (id, title, year, genre, altGenres?, tier, lists). Genre codes hand-assigned per `GENRE_LABELS`; display titles canonicalized. |
| `src/utils/tierInfo.js` | Add `TSPDT` to `LIST_LABELS` + `LIST_SHORT_LABELS` (pip tooltip). No change to tier *logic* — Essentials use baked `tier`; existing films untouched (entry-gate only). |
| `src/data/imdbIds.json` | Add IMDb IDs for the 71 (reliable posters/ratings; use existing OMDb tooling / `scripts/audit-imdb-ids.mjs`). Without it, `omdb.js` falls back to title search — risky for common titles ("M", "Gilda", "Crash"). |
| `src/data/languages.json` | Add language/country for the ~28 non-English additions so they flag International + show the flag pill. |
| `src/data/cast.json`, `directors.json`, `actors.json`, `letterboxdRatings.json` | Optional enrichment backfill (director links, cast search). Can be incremental. |
| `docs/METHODOLOGY.md` | Document the 9th list (TSPDT) + FEST widening + entry-gate scope. |
| `CHANGELOG.md`, `package.json` | Changelog entry + version bump (3.4.x → 3.5.0). |
| `scripts/canon-lists/lists.json` | Remove the 2001-year-collision noise; (optionally) record TSPDT membership for provenance. |

Per-film **genre codes**, **canonical display titles/ids**, and **language entries** are
mechanical follow-ups best produced as the first implementation step (one focused pass), keyed
off `scripts/final-additions.json`.

## 8. Acceptance criteria

- Catalog grows 787 → **855** (68 additions); **no existing film's tier changes** (verify with a
  before/after tier diff over the existing 787 — this is the entry-gate guarantee).
- Every addition has ≥2 lists from different worldviews — **zero exceptions** (Gilda dropped).
- Meet Me in St. Louis and Vivre sa vie present (user-named).
- `npm run build` succeeds; the new films render (poster, tier pips incl. a TSPDT pip, language
  flag for foreign titles) and are reachable in Films-tab filters.
- METHODOLOGY + CHANGELOG updated; one-line summary reflects "9 lists".

## 9. Resolved decisions

1. **Off-theme leak-fixes (§4c):** keep 4 (Shampoo, Lost in America, Tongues Untied, Crash '96);
   **cut Philadelphia + Hotel Rwanda** (weakest pairings).
2. **Gilda (§6):** **dropped** — full mechanical purity, no curated exceptions.
3. **Ancillary depth:** `movies.js` + `imdbIds.json` + `languages.json` this pass; backfill
   cast/director links incrementally.

**Final count: 68 additions → catalog 855.**
