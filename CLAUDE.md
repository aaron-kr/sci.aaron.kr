# CLAUDE.md — Scientia (working title) build notes

Session handoff file. Read this first.

**Status: concept/refinement stage.** Design mockups exist (`frequency-concept.html` = v1, `sci.html` = v2). This file documents a pivot made after reviewing both mockups together — v2's coverage-count-driven layout was too Ground-News-shaped for what this project actually needs. No fetch pipeline is built yet. Nothing is live.

## What this project is

A bilingual (EN/KO) reading log, **research-first**, for a small set of AI subfields. Two purposes for one person:

1. **Personal habit-building** — Aaron is a CS professor (5 Korean universities, PI at PAI Lab / pailab.io, founding organizer of KSPAI — 한국피지컬AI학회) rebuilding a daily habit of reading and writing about his own research field, in both languages. The habit is the point — this is a training tool aimed at Aaron himself first.
2. **Course prep** — feeds a graduate "Research Methods" course (international engineering dept., textbooks: *The Craft of Research*, *Writing for Computer Science*) with a running, filterable pool of current English-language papers/articles for students to read and analyze weekly.

Secondary audience: other professors (starting with KSPAI colleagues) who may want to add their own RSS feed or keyword watch without touching code.

### Explicitly NOT this project
- Not the lab's research output site (that's pailab.io — Astro, has its own EN/KO handling, publications, curriculum).
- Not the courses site (`courses.aaron.kr` — pure static HTML, no build step, documented in its own CLAUDE.md).
- Not a SCIE-writing or Zotero/citation-management guide — that's deliberately being built out on pailab.io's curriculum instead (`pailab.io/curriculum/track-00-research`, which already covers finding/citing sources, IMRaD writing, and getting published). Don't duplicate it here.
- Not the place for long-form commentary essays — see "Where commentary lives" below.
- This project should stay a personal/practice tool, not a lab-branded deliverable. Keep it off pailab.io's nav.

## Where commentary lives (resolved)

Aaron wants to react to some stories the way Cal Newport reacts to AI news — real essays, not one-line glosses. Two different artifacts, two different homes:

- **The gloss** (1–3 sentence paraphrase, required for every entry, the daily writing-practice habit) stays inline on this site. See "Content rules."
- **A full commentary/reaction essay** (occasional, only for stories that earn it) belongs on **aaron.kr's existing Writing section** — it's WordPress-backed (see `aaron.kr` repo, `components/Writing.tsx`), already publishes exactly this genre (e.g. "On Physical AI: What Embodied Intelligence Means for Education"), and already has an audience/design for long-form personal essays. Don't build a second blog here.
- The link direction: the Scientia entry can carry an optional `commentary_url` pointing out to the aaron.kr Writing post once one exists. Not the other way around — Scientia is the log, aaron.kr/writing is where the essay lives.
- Not pailab.io (lab-branded, third-person research voice) and not courses.aaron.kr (course materials, not personal opinion).

## Decisions made in planning

- **URL**: `sci.aaron.kr` — this is resolved (the repo itself is already named for it). Not `servo.aaron.kr` / `field.aaron.kr` as earlier candidates.
- **Name**: working title **Scientia** (as used in `sci.html`'s `<title>`) — still not 100% final, but no longer an open question the way "SERVO" was. Confirm before final launch, since it touches meta tags, OG images, etc.
- **Monetization/traffic**: deliberately not a goal. Build for Aaron + students + KSPAI colleagues. Revisit only if it organically grows.
- **Coverage metrics are metadata, not the sort key.** Earlier planning (and the v2 mockup) borrowed Ground News's "more coverage = bigger card" model directly, sorting and sizing everything by EN/KO source count. Aaron doesn't need to know "how many outlets are covering this" as a primary signal — it's mildly interesting, not decisive. `coverage_count_en/ko`, `cross_language`, and `gap_flag` are still computed and still shown (small, inline, per-entry), but they no longer drive hero/paired/grid card tiering. What drives structure now is **content type and topic** — see Layout below.
- **No forced thumbnails.** v1 (`frequency-concept.html`) proved a pure list/text layout works and looks better than manufacturing placeholder images. Keep that instinct system-wide: if a source provides a real thumbnail, it can be shown small; if it doesn't, don't fake one. This ruled out v2's `no-photo` diagonal-stripe placeholder pattern for papers — papers just don't get an image slot at all, full stop.
- **No full-text republishing**: see "Content rules."

## Design tokens

Fonts (Google Fonts CDN, matches the rest of the `aaron.kr` family) — unchanged:
- Display / headings: `Playfair Display` (500/600/700, italic 500)
- Labels / metadata / timestamps: `IBM Plex Mono` (400/500/600)
- Body text: `IBM Plex Sans` (EN) / `IBM Plex Sans KR` (KO) (400/500/600)

**Color palette — switched to the v1 (`frequency-concept.html`) palette.** Aaron prefers its background and the restraint of its list-first layout over v2's brighter indigo/violet card treatment. v2's palette is retired.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#161c27` | page background |
| `--bg-1` | `#1e2635` | card / row surface |
| `--bg-2` | `#252f42` | nested surface / inputs |
| `--ink` | `#EDE7DC` | primary text |
| `--ink-dim` | `#9BA2B0` | secondary text |
| `--ink-faint` | `#6C7484` | metadata / disabled |
| `--brass` | `#CDA24A` | English-source marker / brand |
| `--jade` | `#57AD98` | Korean-source marker |
| `--rust` | `#C1583D` | "new" / one-sided-coverage flag |

Dark mode only for now (matches the rest of the family's dark-default pattern).

## Layout — research first, news second, coverage as a footnote

Replaces v2's hero/paired/grid/dense-list tiering entirely.

1. **Masthead** — title, bilingual tagline, EN/KO interface toggle. Unchanged from both mockups.
2. **Anchor nav** — jump links: `Research` · `News` · `Sources`. The page is long (research topics + a big news list); anchors matter more here than they did in either mockup.
3. **Research section (top, largest share of the page).** Subsections in priority order (see "Research topic priority" below), each its own list in v1's entry style — date/time rail, source badge, serif title, EN summary (+ KO title line when the source is Korean), tags, actions (mark for class / add note). Target **~10 recent items per topic/source**, newest first within each. No thumbnails, ever, for papers — arXiv/Semantic Scholar/IEEE don't provide them and nothing should be faked.
4. **News section (below research, anchor-linked, visually smaller/denser).** A straight list — closer to a blog index than cards: date, title (serif, smaller than research titles), source name, and — only when the source actually supplies one — a small thumbnail sitting *beside* the title (horizontal), never stacked above it, never a placeholder. Target **~20+ recent items**, across all watched news sources combined. This is also where the coverage badge (EN/KO count, cross-language, gap flag) actually earns its keep — it's most useful as a "these two are the same story" signal in a dense list, not as a hero-sizing algorithm.
5. **Course view** — unchanged concept from v2 (marked items collect into a printable/linkable weekly reading set for Research Methods). Filters by English-only since that's the course's language.
6. **Sources** — see below.
7. **Footer.**

A manual "pin as lead story" override for the very top of Research should still exist for days when Aaron wants a specific item first regardless of recency — kept from the original planning notes, just no longer tied to a coverage algorithm.

## Research topic priority

This is Aaron's actual reading order, and the order subsections should appear on the page:

1. **Physical AI** — top priority, the core of KSPAI and pailab.io's focus.
2. **General AI** — broader ML/AI research, not embodiment-specific.
3. **Handwritten script recognition / OCR** — Aaron's Ph.D. thesis was on Manchu and Hangul handwritten script recognition; Cherokee is a newer interest. Keep this as its own subsection even though volume will be lower than the first two.
4. **Biomedical AI** — Aaron teaches this across several schools and wants to publish in it; still building expertise here, so this is the newest/thinnest subsection.

**Cross-cutting research niche, not a fifth section:** Aaron's likely long-term research identity is *small, cheap, embedded AI for classrooms and labs without major funding* (he's a solo, unfunded researcher). This is a lens across all four topics above, not a separate pillar — implement as a filter chip (e.g. `low-cost / embedded`) that can be applied within any topic, plus make sure the source list includes feeds that actually cover this (TinyML-adjacent venues, edge-inference hardware coverage). Don't build a 5th top-level subsection for it yet — there may not be enough volume to sustain one on its own.

## News selection lens

Ground News comparison is gone from the layout, but the *reason* Aaron wants a news section at all is specific: he wants news that could become evergreen commentary — reacting to a story the way Cal Newport reacts to AI news (see "Where commentary lives"). Practical implications:
- Prefer trade press and analysis-flavored coverage over raw wire/press-release rewrites when a source offers a choice.
- The per-entry data model should support a lightweight flag Aaron can set by hand (`commentary_worthy: bool` or similar) separate from `marked_for_class` — different downstream use (aaron.kr Writing vs. the Research Methods reading list).
- This is a hand-curation lens, not something to over-automate — don't try to build a "commentary-worthiness" classifier.

## Content rules (copyright) — unchanged

- Never republish full article text or full machine translations of Korean articles publicly.
- Every entry gets a short paraphrased gloss (1–3 sentences), not a translation — generated by an LLM pass, ideally hand-edited by Aaron as the writing-practice step. This is a feature, not just a legal safeguard: editing the gloss is the point of the daily habit.
- Always link the title to the original source. Always attribute the source name.
- If unsure whether a summary is too close to the source's wording, shorten and reword further rather than publish as-is.

## Data model

### `sources.json` (or `.yml`) — the watch list

See `sources.example.json` in this repo for the schema. Fields:

```
id        — unique slug
label     — display name
type      — "api" | "rss" | "keyword"
provider  — for type=keyword: which backend handles it ("naver", "arxiv", etc.)
endpoint  — for type=api/rss: the URL to hit
query     — for type=keyword: the search string
lang      — "en" | "ko"
category  — "papers" | "news"
topic     — "physical-ai" | "general-ai" | "ocr-handwriting" | "biomedical-ai" | null (news sources may span topics; papers sources should usually set one)
owner     — who added it (supports the multi-professor use case)
```

`topic` is new — it's what drives which research subsection an entry lands in. News entries can leave it null and rely on tags instead, since news volume/categorization is looser than papers.

### Contributor flow for other professors

The concept mockup includes an in-browser "add a watch" form as a UX reference, but a live form on a static site has nowhere to write to without a backend. Two real options, not yet chosen:

1. **Git-based**: colleagues (or Aaron on their behalf) add an entry to `sources.json` via a PR. Best practice, but not realistic for non-technical colleagues to do themselves.
2. **Shared Google Sheet → CSV → build step**: a Google Sheet that any professor can edit directly (no git needed), pulled into the GitHub Action as CSV at build time and merged with `sources.json`. Recommended for actually getting colleague contributions — lower friction wins here over purity.

Leaning toward (2) as the primary path, with (1) staying available for Aaron's own edits. Not implemented yet.

### Per-entry record (after fetch + gloss pass)

```
id, title_en, title_ko, summary_en, summary_ko, url, source_label,
source_lang, published_at, category ("papers"|"news"), topic, tags[],
image_url (nullable — papers should always be null; news only when the source
  provides one, never generated),
coverage_count_en, coverage_count_ko, cross_language (bool),
gap_flag ("en_only" | "ko_only" | null),
marked_for_class (bool), commentary_worthy (bool), commentary_url (nullable),
note (string)
```

`cross_language`, `coverage_count_*`, and `gap_flag` require basic story-clustering (matching entries across sources that are "the same story") — start simple (same keyword/entity match within a ~48h window) rather than building real dedup/clustering up front. Remember: these fields are for display as metadata, not for computing layout/sort order anymore.

## Source list to start with

**Physical AI (English):**
- arXiv `cs.RO` — REST API, free, no key: `http://export.arxiv.org/api/query?search_query=cat:cs.RO&sortBy=submittedDate&sortOrder=descending`
- IEEE Spectrum Robotics — RSS: `https://spectrum.ieee.org/feeds/topic/robotics.rss`
- The Robot Report — RSS
- Semantic Scholar API — for citation context / dedup, not primary feed

**Physical AI (Korean):**
- 로봇신문 (irobotnews.com) — confirmed RSS feeds:
  - 전체기사 (all articles): `https://www.irobotnews.com/rss/allArticle.xml`
  - 인공지능 (AI section): `https://www.irobotnews.com/rss/S1N2.xml`
  - 로봇 (robot section): `https://www.irobotnews.com/rss/S1N1.xml`
- Naver Open API — News Search (`https://openapi.naver.com/v1/search/news`) — requires a free registered app (client ID + secret) at developers.naver.com. Good starter queries: "피지컬 AI", "휴머노이드 로봇", "엣지 AI".
- ETRI / KAIST press releases — RSS if available, otherwise check manually at first.

**General AI (English):**
- arXiv `cs.AI` / `cs.LG` — same API pattern as above, swap `search_query=cat:cs.AI` or `cat:cs.LG`.
- Semantic Scholar API — same as above, broader query.

**General AI (Korean):**
- Naver News Search — query candidates: "인공지능", "생성형 AI".

**Handwritten script recognition / OCR (English):**
- arXiv `cs.CV` filtered to handwriting/OCR keywords — e.g. `search_query=cat:cs.CV+AND+abs:handwriting` or `abs:OCR`. Broad `cs.CV` alone is too noisy; needs the keyword filter.
- Consider a Semantic Scholar keyword watch for "handwritten text recognition," "historical document OCR" — this subfield moves slowly enough that a keyword watch may outperform a category feed.

**Handwritten script recognition / OCR (Korean):**
- Naver News / Naver Open API keyword watch: "한글 필기체 인식" (Hangul handwriting recognition) — low volume expected, keep it anyway for the rare hit.
- No confirmed Korean academic-press RSS yet for this niche — flag as a manual-check source until one is found.

**Biomedical AI (English):**
- arXiv `q-bio` (quantitative biology) and `cs.AI` filtered to biomedical keywords — e.g. `abs:clinical` or `abs:medical`.
- PubMed / NCBI E-utilities — free API, no key required for low-volume use: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` — worth a dedicated fetch script since it's a different shape than arXiv's Atom feed.

**Biomedical AI (Korean):**
- Naver News keyword watch: "의료 AI", "헬스케어 AI".

**Cross-cutting: low-cost / embedded AI (tag, not a separate topic — apply across the above):**
- arXiv `eess.SY` and `cs.AR` keyword-filtered for edge/embedded inference — e.g. `abs:tinyml`, `abs:edge+inference`.
- Watch for TinyML Foundation / tinyML.org content if they publish RSS — not yet confirmed.

**News (English, for the evergreen-commentary lens):**
- IEEE Spectrum (general, not just robotics) — RSS
- The Robot Report — RSS
- Ars Technica AI tag — RSS if available
- MIT Technology Review AI section — RSS if available

**News (Korean):**
- 로봇신문 전체기사 (already listed above, also serves news)
- Naver News Search — broader industry queries beyond the Physical AI ones above.

**Utility, not a content source:**
- Naver Papago API (`https://openapi.naver.com/v1/papago/n2mt`) — optional, for a first-pass literal translation to edit from. Don't publish its raw output — see content rules.

Several of the above ("RSS if available") need a five-minute check before being added to `sources.json` for real — this list intentionally includes a few unconfirmed candidates so the next session knows where to look first, rather than starting from zero.

## Build pipeline (proposed, not built)

1. GitHub Action on a cron schedule (start with every 4–6 hours).
2. Fetch step: iterate `sources.json`, hit each source by type (api/rss/keyword), normalize into the per-entry record shape above.
3. Dedup/cluster step: group entries that look like the same story within ~48h, compute `coverage_count_en/ko`, `cross_language`, `gap_flag`. Display-only — does not affect placement.
4. Gloss step: call the Anthropic API once per new entry to generate `summary_en` + `summary_ko` (short, paraphrased — see content rules). Cache so re-runs don't re-summarize existing entries.
5. Render step: write the static page(s) — research subsections (by topic, ~10 each) first, news list (~20+) second, per the layout rules above.
6. Commit + push the generated static files (or deploy artifact) as the last step of the Action.

"Alerts" = the page updating on schedule. Revisit an email digest (e.g. via Resend) only if that turns out to be worth the extra moving part.

## Stack: static + Jekyll (confirmed)

Still the right call, now confirmed rather than an open question:
- `courses.aaron.kr` is pure static HTML with no build step; this project follows the same zero-maintenance instinct, but with enough shared chrome (masthead, footer, card/list markup repeated per research topic) that hand-copy-pasting HTML like the mockups do would get error-prone fast.
- **Jekyll** (GitHub Pages' native build) solves that without adding real infrastructure: `_layouts/default.html` for shared page chrome, `_includes/` for repeated partials (a research-topic-section partial reused four times, a news-row partial, etc.), and it deploys on GitHub Pages with zero extra CI setup beyond what Pages does automatically.
- CSS and JS are pulled out of the mockups' inline `<style>`/`<script>` blocks into `assets/css/main.css` and `assets/js/main.js` — one shared stylesheet/script per site instead of duplicated per mockup file.
- The eventual fetch pipeline (GitHub Action) writes generated entry data (likely `_data/entries.yml` or per-topic YAML/JSON files under `_data/`) that Jekyll's Liquid templates consume at build time — this keeps content generation (Python/Node fetch script) and rendering (Jekyll) as separate concerns.
- Astro (to match `pailab.io`) was the other option on the table; not chosen, since this project doesn't need pailab.io's component-sharing and Jekyll better matches the "as close to zero maintenance as possible" goal already established for `courses.aaron.kr`.

## Open decisions for the next session

- [ ] Final name (currently "Scientia" as used in `sci.html`'s `<title>` — confirm or replace before shipping).
- [ ] Naver Open API app registration (needs a Naver account + app registration at developers.naver.com) — needed before any Korean keyword search works.
- [ ] Google Sheet vs. git PR for the multi-professor contributor flow (leaning Sheet — see above).
- [ ] Story clustering approach for `cross_language`/`gap_flag` — keep it simple at first (keyword/entity match), don't over-engineer. Remember it's metadata-only now, not layout-driving, so it doesn't need to be perfect at launch.
- [ ] Whether "mark for class" output should just be an on-page list (as in the mockup) or also export to something like Markdown/a printable page for handing to students.
- [ ] Confirm the unconfirmed RSS candidates in "Source list to start with" (Ars Technica AI tag, MIT Tech Review AI, TinyML Foundation, any Korean handwriting-recognition press).
- [ ] PubMed/NCBI fetch script needs its own shape (E-utilities XML, not Atom like arXiv) — budget real time for this, it's not a copy-paste of the arXiv fetcher.

## Immediate next steps

1. Build the new Jekyll scaffold (`_config.yml`, `_layouts/default.html`, `_includes/`, `assets/css/main.css`, `assets/js/main.js`) reflecting this file's layout section — in progress this session.
2. Register a Naver Open API app (client ID/secret) — needed before any Korean keyword search works.
3. Scaffold `sources.json` (seed from the expanded `sources.example.json`), a `/scripts` fetch script per source type, and a minimal render step that can turn today's fetched entries into the research-first layout.
4. Get the arXiv fetch working first — it's the easiest (no auth, stable API) and proves the pipeline end to end (and covers 3 of the 4 research topics) before adding Naver/RSS/PubMed complexity.
