# CLAUDE.md — Scientia AI build notes

Session handoff file. Read this first.

**Status: near-live.** The Jekyll site builds and runs today with real fetched
data — `_research/` and `_news/` are populated from a live run of
`scripts/fetch_arxiv.py` and `scripts/fetch_rss.py` (not hand-written sample
HTML anymore). What's still missing before this is genuinely "live": Naver/
Anthropic/Resend credentials (see `SETUP.md`), a DNS record for the custom
domain, and Aaron's own written summaries on any entry beyond the one demo
pin. See "Open decisions" at the bottom for what's left.

## What this project is

A bilingual (EN/KO) reading log, **research-first**, for a small set of AI
subfields. Publicly discoverable on purpose (see "Public, not private" below)
— this is no longer a "keep it off the nav" project.

1. **Personal habit-building** — Aaron is a CS professor (5 Korean
   universities, PI at PAI Lab / pailab.io, founding organizer of KSPAI —
   한국피지컬AI학회) rebuilding a daily habit of reading and writing about his
   own research field, in both languages.
2. **Course prep** — feeds a graduate "Research Methodology" course at CBNU
   (`courses.aaron.kr/courses/2026/cbnu-grad-research/`, currently
   `visible: false` — not published yet) with a running, filterable pool of
   current English-language papers/articles. See "Reading list page" below.
3. **Professional portfolio / credibility** — Aaron is aiming for a visiting
   lecturer position in the US in roughly three years, as a solo, unfunded
   researcher whose co-authors are mostly full-time-employed academics
   without lab funding either. A public, well-designed, actively-maintained
   research aggregator is concrete evidence of research engagement and
   initiative that a résumé line can't convey on its own — this is exactly
   the kind of "small, cheap, embedded, solo-researcher" project that fits
   his actual niche and is realistic to sustain without grant funding.

Secondary audience: other professors (starting with KSPAI colleagues) who may
want to add their own RSS feed or keyword watch, and — because this is now
public — anyone who finds it organically via Feedly/Google/search and finds
it useful for tracking Physical AI, OCR, or biomedical AI research
specifically (see "Why this instead of Feedly/Inoreader/Google News" below).

### Explicitly NOT this project
- Not the lab's research output site (that's pailab.io — Astro, has its own
  EN/KO handling, publications, curriculum). It **is**, however, now linked
  *from* pailab.io's nav (Research → "Scientia AI (reading log) ↗") — see
  "Public, not private."
- Not the courses site (`courses.aaron.kr` — pure static HTML, no build step).
- Not a SCIE-writing or Zotero/citation-management guide — that's on
  pailab.io's curriculum instead (`pailab.io/curriculum/track-00-research`,
  which already covers finding/citing sources, IMRaD writing, and getting
  published). Confirmed again this session — don't duplicate it here.
- Not the place for AI-driven feed personalization (adaptive ranking based on
  click behavior) — considered and explicitly deferred, see "Deferred ideas."

## Public, not private (reversed from earlier planning)

Earlier planning said to keep this off pailab.io's nav and stay a private
practice tool. **Reversed this session.** Aaron wants it publicly known —
business card material, discoverable by students/colleagues who find it
organically, and evidence of active research engagement for a future US
visiting-lecturer search. Concretely, this session:
- Added a link to it from **pailab.io's nav** (`Nav.astro`, under Research →
  after "Doing Research →", labeled "Scientia AI (reading log) ↗").
- Added SEO basics to the Jekyll build: per-page `<title>`/meta description,
  Open Graph + Twitter card tags, canonical URLs, `jekyll-sitemap`,
  `robots.txt`, and a `WebSite` JSON-LD block. See `_layouts/default.html`.
- Set the custom domain (`CNAME` → `sci.aaron.kr`) so it reads as a real
  destination, not a `github.io` URL, on a business card.

Implication: because a general audience (not just students) can now land
here, the homepage should read as more than a course tool — hence moving the
class-specific "reading list" off the homepage and onto its own page (see
below), and treating the contributor form as a public-facing surface that
needs spam resistance (see "Contributor flow").

## Why this instead of Feedly / Inoreader / Google News

Worth stating explicitly since it's the site's actual value proposition, not
just a design note: those tools aggregate by keyword/feed but don't do
EN/KO bilingual corroboration, don't structure around a fixed research-topic
taxonomy (Physical AI → General AI → OCR/handwriting → Biomedical AI), and
have no concept of "mark for class" or a research-methods pedagogy layer.
This project is narrow and opinionated where they're general-purpose — that
narrowness is the value, not a limitation to apologize for.

## Deferred ideas (considered, not building now)

- **AI-driven adaptive feed personalization** (re-ranking based on Aaron's
  click/read behavior) — overkill for a solo-maintained static site with no
  backend or analytics infrastructure. Manual curation (topic order, pin,
  filters) is sufficient at this scale. Revisit only if traffic/usage
  patterns actually demand it.
- **PubMed/NCBI fetch script** — see sources.example.json's `pubmed-ai` entry
  (`"enabled": false`). Reasoning: arXiv's `q-bio` + `cs.AI` keyword filter
  already covers a meaningful slice of biomedical AI research, Biomedical AI
  is already the thinnest/newest of the four topics, and PubMed's E-utilities
  XML shape is a genuinely different parser from arXiv's Atom feed (not a
  copy-paste job). Launch on arXiv-only biomedical coverage, add PubMed once
  that volume is assessed and feels thin.
- **Semantic Scholar fetch script** — referenced in `sources.example.json` as
  aspirational; no fetch script exists yet. Not blocking launch.
- **Google Sheet contributor flow** — still an open decision (see below); the
  GitHub issue template is the working path for now.

## Where commentary lives (three content tiers, not two)

Revised this session — Aaron wants to write real 200–500 word summaries
himself, not just edit a machine gloss. Three distinct tiers now:

1. **The hook** (`hook_en` / `hook_ko`, one sentence each, LLM-generated by
   `scripts/gloss.py`) — a translated one-line "is this worth a look," shown
   inline in the log and on the entry's permalink page. Fully automated,
   cheap (see SETUP.md § Anthropic). This is the *only* auto-generated prose
   in the pipeline now — it used to be a 1–3 sentence paraphrase; that scope
   shrank specifically so Aaron's own writing isn't competing with an LLM
   draft for the same slot.
2. **Aaron's own summary** (200–500 words, the entry's markdown body,
   written by hand, whenever he gets to it) — lives on the entry's own
   permalink page (`_research/<slug>.md` / `_news/<slug>.md`, rendered via
   `_layouts/entry.html` at `/research/<slug>/` or `/news/<slug>/`). This is
   the actual daily-habit writing practice, Seth-Godin-length, and it lives
   **here on sci.aaron.kr**, not on aaron.kr — see "Why per-entry pages"
   below for the reasoning (volume + site identity).
3. **Full commentary/reaction essays** (500–1500+ words, occasional, only for
   stories that earn it, à la Cal Newport reacting to AI news) — these go on
   **aaron.kr's existing Writing section** (WordPress-backed, already
   publishes this genre — e.g. "On Physical AI: What Embodied Intelligence
   Means for Education"). An entry can carry a `commentary_url` pointing out
   to the aaron.kr post once one exists, and/or a `commentary_video_url` if
   Aaron records a talking-head reaction (see "YouTube" below). Confirmed
   again this session, unchanged from before.

## Why per-entry pages (and why tier 2 doesn't go on aaron.kr)

This session added real per-entry permalink pages
(`_layouts/entry.html`, Jekyll collections `research` and `news`) instead of
everything living only in list form on the homepage. Reasoning:
- Aaron's own 200–500 word summaries (tier 2 above) need *somewhere* to live
  that isn't the homepage list view or aaron.kr.
- Volume: if this habit sticks, that's potentially 200+ written summaries a
  year. Putting that on aaron.kr's Writing section — a curated portfolio
  meant to read well for a job search — would dilute exactly the credibility
  effect this project is now supposed to support. sci.aaron.kr is expected to
  be high-volume by nature (it's a log), so it's the right home for volume;
  aaron.kr should stay low-volume and curated.
- This also directly enables the reading-list page (below) and the pin/lead
  story feature to link to something concrete instead of an external URL.

## Reading list page (moved off the homepage)

`reading-list.html` → `/reading-list/`. Previously an in-page collapsible
"Course view" section on the homepage; moved to its own page this session
because the homepage now has a general public audience (see "Public, not
private"), not just students, and a course-reading-list widget doesn't belong
on a page meant to read as a general research aggregator.

- Server-rendered from real data: `site.research` / `site.news` where
  `marked_for_class: true` and `source_lang: en` (the course reads in
  English). This is the **authoritative** list.
- A second, separate "your bookmarks" block below it is a **personal,
  per-browser convenience** (localStorage, via the same "mark for class"
  button anywhere on the site) — explicitly not the same thing as the
  authoritative list, and the page says so. A static site has no backend to
  write "this is now marked" back to a file from a button click; the real
  marking happens by setting `marked_for_class: true` in an entry's front
  matter (by hand for now, or via a future admin script).
- **courses.aaron.kr integration (investigated, not yet wired):** the CBNU
  course lives at `_courses/2026/cbnu-grad-research.md` in the
  `courses.aaron.kr` repo (same root folder as this repo), currently
  `visible: false`. Its weekly-lecture data file
  (`_data/2026/cbnu_grad_research_lectures.yml`) doesn't exist yet — other
  courses' lecture files (e.g. `_data/2023/dju_sec_lectures.yml`) show each
  week has a free-form HTML `readings:` field. Once that data file exists,
  each week's `readings:` can simply be
  `<a href="https://sci.aaron.kr/reading-list/">This week's reading list →</a>`
  instead of a copy-pasted list. **Deliberately not implemented yet** — Aaron
  asked to decide this on a future session once the course itself is closer
  to publishing.

## YouTube (advisory, not a repo change beyond one data field)

Discussed this session, not something to build here: recommendation is
**one channel** (the existing PAI Lab / pailab.io channel) with **playlists**
separating course content (Korean) from commentary reactions (English),
rather than splitting into two channels. Reasoning: subscriber/view-count
fragmentation across two channels actively hurts monetization eligibility and
discovery, whereas playlists already solve the audience-segmentation problem
most channels use separate channels for — a viewer who wants only Korean
course content can subscribe to that playlist's notifications via YouTube's
per-playlist follow, and video titles/thumbnails/auto-captions can signal
language clearly per video. Bilingual content coexisting on one channel is
already normal for many EDU channels. The only repo-level change from this:
`commentary_video_url` exists as an optional per-entry field (see data model)
for whenever this starts happening.

## Design tokens

Fonts (Google Fonts CDN, matches the rest of the `aaron.kr` family) — unchanged:
- Display / headings: `Playfair Display` (500/600/700, italic 500)
- Labels / metadata / timestamps: `IBM Plex Mono` (400/500/600)
- Body text: `IBM Plex Sans` (EN) / `IBM Plex Sans KR` (KO) (400/500/600)

**Color palette — v1's background kept, accent hues swapped for a more
"AI-coded" set.** Brass/rust read as too warm/muted for this project (v1's
palette was originally borrowed wholesale from a different aesthetic
intent); jade stayed since it read fine.

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#161c27` | page background |
| `--bg-1` | `#1e2635` | card / row surface |
| `--bg-2` | `#252f42` | nested surface / inputs |
| `--ink` | `#EDE7DC` | primary text |
| `--ink-dim` | `#9BA2B0` | secondary text |
| `--ink-faint` | `#6C7484` | metadata / disabled |
| `--cyan` | `#4FD1FF` | English-source marker / brand / links (was `--brass`) |
| `--jade` | `#57AD98` | Korean-source marker (unchanged) |
| `--magenta` | `#FF5FA8` | flags / pin / "new" (was `--rust`) |

Dark mode only for now.

### Background treatment

Two layered, intentionally subtle effects (`assets/css/main.css` `.bg-grid`,
`assets/js/main.js` `initRain()`):
- **Organic grid**: multiple `repeating-linear-gradient` layers at different
  spacings/opacities (97px / 41px verticals, 160px horizontal) instead of one
  uniform grid — reads as asymmetric/organic rather than a rigid CSS grid,
  per Aaron's request to match the subtle-grid treatment on his other sites
  without it looking mechanical.
- **Digital rain canvas** (`#rain`): a very low-opacity (~4-10%), slow
  (throttled to ~11fps via a manual frame-time check, not full 60fps),
  sparse-column (26px spacing) Matrix-style character fall, tinted
  cyan/jade. Respects `prefers-reduced-motion` (skipped entirely) and pauses
  via the Page Visibility API when the tab isn't active. This is meant to be
  barely noticeable at a glance — if it's ever distracting, turn the opacity
  down further or the frame-time threshold up before removing it outright.

### Interaction details fixed this session
- **Sticky anchor nav**: `.subnav-stick` (position:sticky, top:0, blurred
  background) replaces the old non-sticky subnav — addresses "anchor nav
  with nothing to get back to sections easily."
- **Back-to-top button**: `#back-to-top`, fixed bottom-right, fades in after
  500px of scroll.
- **Title hover behavior**: entry/list/lead/permalink titles have no default
  underline; hover adds color (cyan) + underline together, not underline
  alone as a static state. Applies to `.entry-title a`, `.list-title a`,
  `.lead-title a`.
- **Topic heads stand out more**: `.topic-head .rank` is now a filled cyan
  numeral badge (was plain muted text), plus a 2px bottom border and larger
  heading size — was getting lost against the surrounding hairline-bordered
  sections before.
- **Tag pills are clickable**: `.tag` is a `<button>` now, wired to
  `filterByTag()` in `main.js` — clicking a tag on any entry (including on
  its permalink page) filters the homepage to that tag, navigating there
  first if needed.
- **Mini coverage bar**: `.list-mini-cov`, a small Ground-News-style
  horizontal EN/KO split bar, but scoped to **news rows only**, and only
  rendered when `coverage_en`/`coverage_ko` are actually set on that entry —
  metadata, not a layout/sort driver, consistent with the earlier decision
  to demote coverage counts.
- **Wire/press-release styling**: `raw_wire: true` dims an entry/row (`.wire`,
  `opacity:.72`) and adds a small muted "WIRE" badge instead of excluding
  raw/press-release coverage outright — Aaron still wants it included, just
  visually deprioritized versus trade-press/analysis coverage.

## Layout — research first, news second, coverage as a footnote (unchanged from prior session)

1. **Masthead** — sticky anchor nav: `Research` · `News` · `Reading list` · `Sources`.
2. **Pinned lead story** (optional, `pin: true` on at most one `_research`
   entry) — a visually distinct card above the topic sections: larger title,
   optional custom `pin_image` (the one case where a manually-chosen image is
   fine — this is Aaron deliberately picking a photo, not an auto-fetched
   placeholder), links to both the original source and (if set)
   `commentary_url`/`commentary_video_url`. **How to pin something:** set
   `pin: true` in that entry's front matter (and optionally `pin_image`,
   `commentary_url`) — see the demo entry
   `_research/2026-08-12-handedit-...md` for a worked example. Only the first
   `pin: true` entry found is shown; unpin the old one before pinning a new
   one.
3. **Research section**, four subsections in priority order (Physical AI →
   General AI → OCR/handwriting → Biomedical AI), ~10 shown per topic
   (`limit: 10` in `index.html`, most recent first — the underlying
   collection can hold more).
4. **News section**, dense list, ~30 shown (`limit: 30`), smaller than
   research, mini coverage bar where applicable, wire styling where
   applicable.
5. **Sources** (`_includes/sources.html`) — full source list by topic, plus
   the "suggest a source" GitHub issue CTA (see "Contributor flow").
6. **Footer** — links out to pailab.io / aaron.kr / courses.aaron.kr.

A manual "pin as lead story" override exists (see above) for days when the
algorithmic-by-recency top item isn't what Aaron wants leading.

## Research topic priority (unchanged)

1. **Physical AI** — top priority, the core of KSPAI and pailab.io's focus.
2. **General AI** — broader ML/AI research, not embodiment-specific.
3. **Handwritten script recognition / OCR** — Aaron's Ph.D. thesis was on
   Manchu and Hangul handwritten script recognition; Cherokee is a newer
   interest.
4. **Biomedical AI** — taught across several schools, actively building
   toward publishing here. **Now includes the health & human-flourishing
   lens** (see below) rather than that being a separate topic.

**Cross-cutting lenses, not separate topics** — implemented as `tags` on
sources (propagate straight onto generated entries) and as filter chips:
- `low-cost-embedded` — Aaron's likely long-term research niche: small,
  cheap, embedded AI for classrooms/labs without major funding. Cuts across
  all four topics (currently populated under General AI, via the
  `arxiv-embedded-edge` source).
- `health-flourishing` — new this session. Aaron's interest in AI research
  touching sleep, exercise, behavior change, wearables — the
  Huberman/Peterson-adjacent angle, kept as a lens within Biomedical AI (and
  General AI, if a relevant paper surfaces there) rather than a 5th topic,
  since it's a cross-cutting interest, not a distinct field with its own
  volume. Sources: `arxiv-health-flourishing`, `naver-health-ai`.

Both lenses get their own filter chip on the homepage
(`Low-cost / Embedded`, `Health & Flourishing`) — unlike per-topic chips
(removed this session, see below), these two genuinely need cross-topic
filtering since the topic sections alone don't surface them.

**Chips removed this session**: `Humanoids`/`Manipulation`/`OCR`/`Biomedical`
top-level filter chips existed in the prior draft but were redundant with
the topic sections themselves (OCR items are already grouped under topic 3,
etc.) and, worse, had no real tag data behind them yet — clicking them
against live-fetched entries showed empty results. Kept `Humanoids` and
`Manipulation` as chips (hand-tagged a few real Physical AI entries this
session to prove them out) since those genuinely cut *within* a topic rather
than duplicating a whole section.

## Automation vs. manual — what's actually automatic right now

Answering "how much of this will be automatic vs. me going back in" directly,
since it came up this session:

| Piece | Automatic? |
|---|---|
| Fetching titles/dates/links (arXiv, RSS, Naver once configured) | **Yes** — `fetch_arxiv.py` / `fetch_rss.py` / `fetch_naver.py`, cron-scheduled |
| Which topic section an entry lands in | **Yes** — comes straight from the source's `topic` field in `sources.json` |
| Cross-cutting tags (`low-cost-embedded`, `health-flourishing`) | **Yes, if the *source* is tagged** — propagates automatically; a source that isn't pre-tagged won't get these automatically |
| Fine-grained tags (`humanoids`, `manipulation`, `ocr`, etc.) | **No** — currently hand-added per entry (see the handful tagged this session as a proof of concept). Not auto-classified. Revisit only if this becomes a real bottleneck — a cheap LLM tagging pass during `gloss.py` is the natural next step if so, but wasn't built this session to keep scope down. |
| Hooks (`hook_en`/`hook_ko`) | **Yes, once `ANTHROPIC_API_KEY` is set** — `gloss.py` |
| Aaron's own 200–500 word summary | **No, by design** — this is the point of the habit |
| Pinning a lead story | **No, manual** — `pin: true` |
| Marking for class | **Partially** — the authoritative flag (`marked_for_class: true`) is manual/front-matter; a personal per-browser bookmark button exists as a convenience but doesn't write back to the site |
| Coverage counts / cross-language gap flags | **Not implemented yet** — the fields exist in the schema (`coverage_en`, `coverage_ko`, `gap`) but no clustering step populates them automatically. Still deliberately metadata-only, not sort-driving, per the earlier pivot away from the Ground News model. |

## Contributor flow (fixed a real bug this session)

The previous draft's "add a watch" form used `window.storage.get/set` —
**this is not a real API on GitHub Pages.** It was accidentally carried over
from an Artifact-preview-only convention and would have silently done
nothing (or errored) on the actual deployed site. Caught and removed this
session.

Replaced with a **GitHub issue template**
(`.github/ISSUE_TEMPLATE/source-suggestion.yml`) — the sources section links
out to `github.com/aaron-kr/sci.aaron.kr/issues/new?template=source-suggestion.yml`
instead of a live form. This also directly answers the spam/security
concern raised this session (robots/randoms editing a public form that feeds
`sources.json`): a GitHub issue requires a GitHub account (real friction
against bots and drive-by spam), is reviewable before anything gets merged,
and needs zero backend — a good fit for a static GitHub Pages site. The
Google-Sheet contributor-flow idea from earlier planning is now the fallback
option, not the primary one, if a non-technical colleague specifically can't
use GitHub issues.

## Content rules (copyright) — unchanged

- Never republish full article text or full machine translations of Korean
  articles publicly.
- Every entry gets a one-sentence bilingual hook (see "Where commentary
  lives" tier 1) — not a translation, not a summary.
- Always link the title to the original source. Always attribute the source
  name.
- If unsure whether Aaron's own summary is too close to the source's
  wording, shorten and reword further rather than publish as-is.

## Data model

### `sources.json` (or `.yml`) — the watch list

See `sources.example.json`. Fields (added `tags` and `enabled` this session):

```
id        — unique slug
label     — display name
type      — "api" | "rss" | "keyword"
provider  — for type=keyword: which backend handles it ("naver", "arxiv", "semantic-scholar", "pubmed")
endpoint  — for type=api/rss: the URL to hit
query     — for type=keyword: the search string
lang      — "en" | "ko"
category  — "papers" | "news"
topic     — "physical-ai" | "general-ai" | "ocr-handwriting" | "biomedical-ai" (required — no more null topics; cross-cutting lenses use `tags` instead)
tags      — array, propagates onto every entry this source produces (e.g. ["low-cost-embedded"])
owner     — who added it (supports the multi-professor use case)
enabled   — optional, default true; set false to keep a source documented but skip fetching it (used for the deferred PubMed entry)
```

### Per-entry record (Jekyll collection front matter — `_research/*.md` / `_news/*.md`)

```
title_en, title (news items use `title` in the source's own language; research
  items use `title_en` since arXiv/Semantic Scholar/PubMed are English-only),
hook_en, hook_ko (single sentence each, LLM-generated, empty string until gloss.py runs),
source, source_lang, source_url, topic, tags[],
date, thumb (news only, nullable — null unless the RSS feed actually supplied one),
coverage_en, coverage_ko, gap ("en_only"|"ko_only"|null) — metadata only, see above,
marked_for_class (bool), commentary_worthy (bool),
commentary_url (nullable, → aaron.kr Writing), commentary_video_url (nullable, → YouTube),
pin (bool, research only in practice), pin_image (nullable),
raw_wire (bool), embedded (bool), health_flourishing (bool),
dedup_key (the arXiv ID or article URL — used by scripts/lib.py to avoid re-fetching)
```

Body content (below the `---`) is Aaron's own write-up — empty until he
writes one; `_layouts/entry.html` shows a clear "no write-up yet" note
instead of pretending there's content.

### Contributor flow for other professors

See "Contributor flow" above — GitHub issue template is primary now. Google
Sheet → CSV → build-step merge remains a documented fallback for a
non-technical colleague who genuinely can't use a GitHub account, not yet
implemented.

## Build pipeline (now partially real, not just proposed)

1. **`.github/workflows/fetch.yml`** — daily cron (`0 21 * * *` UTC ≈ 06:00
   KST; was 4–6 hours in earlier planning, **changed to once daily** this
   session — a personal/solo-researcher reading log doesn't need faster
   polling than "once before I sit down to read," and less-frequent runs
   mean less GitHub Actions minutes and fewer Anthropic API calls). Also
   runnable on demand via `workflow_dispatch`.
2. **Fetch step**: `scripts/fetch_arxiv.py` and `scripts/fetch_rss.py` run
   unconditionally (no credentials needed, stdlib only). `scripts/fetch_naver.py`
   runs only if `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` secrets are set.
3. **Hook step**: `scripts/gloss.py` runs only if `ANTHROPIC_API_KEY` is set;
   capped at `GLOSS_MAX_PER_RUN` (default 40) entries per run to bound cost.
4. **Commit step**: the Action commits any new `_research`/`_news` files and
   pushes — GitHub Pages' own Jekyll build then picks it up automatically, no
   separate render/deploy step needed (this is why the fetch scripts write
   directly into the Jekyll collections instead of some intermediate format).
5. **`.github/workflows/digest.yml`** — weekly (currently Mondays 22:00 UTC,
   change the `cron:` line to move the day — see SETUP.md), runs
   `scripts/send_digest.py` (Resend) if `RESEND_API_KEY`/`DIGEST_TO_EMAIL`
   are set.

All five scripts (`lib.py`, `fetch_arxiv.py`, `fetch_rss.py`, `fetch_naver.py`,
`gloss.py`, `send_digest.py`) are stdlib-only Python — no `requirements.txt`,
no pip install step in CI, on purpose (keeps the Action fast and reduces the
site's long-term maintenance surface, consistent with the original
"low-maintenance" instinct from `courses.aaron.kr`).

## Stack: static + Jekyll (confirmed, now built out)

- Jekyll collections (`research`, `news`) instead of hand-authored includes —
  `_config.yml` defines them with `output: true` and clean permalinks
  (`/research/:path/`, `/news/:path/`).
- `_layouts/default.html` (shared chrome, SEO tags, background effects) and
  `_layouts/entry.html` (permalink page, chains to `default`).
- `_includes/`: `masthead.html`, `footer.html`, `entry-card.html` (research
  list item, takes an `entry` param), `news-row.html` (news list item, same
  pattern), `sources.html` (sources tab content).
- `assets/css/main.css` / `assets/js/main.js` — one shared stylesheet/script.
- `jekyll-sitemap` plugin (via the `github-pages` gem, already a Gemfile
  dependency) for `sitemap.xml`.

## Open decisions for the next session

- [ ] ~~Final name~~ — resolved: **Scientia AI**, propagated everywhere.
- [ ] DNS CNAME record for `sci.aaron.kr` — not yet added at the DNS
      provider (see SETUP.md § 5).
- [ ] Naver / Anthropic / Resend credentials — not yet registered (see
      SETUP.md §§ 2–4).
- [ ] courses.aaron.kr integration — investigated, not wired (see "Reading
      list page" above); revisit once the CBNU course page goes `visible: true`.
- [ ] Google Sheet vs. GitHub issue for the multi-professor contributor
      flow — GitHub issue is now primary; Sheet stays a documented fallback.
- [ ] Story clustering for `coverage_en/ko`/`gap` — still not implemented;
      still deliberately low priority since it's metadata-only now.
- [ ] Fine-grained tag auto-classification (`humanoids`, `manipulation`,
      etc.) — currently manual; a `gloss.py`-adjacent LLM tagging pass is the
      natural next step if manual tagging becomes a bottleneck.
- [ ] RSS feeds to confirm — see SETUP.md § 7 for the specific checklist.
- [ ] PubMed — deferred, revisit once arXiv-only biomedical coverage has run
      for a while and its volume can be assessed.

## Immediate next steps

1. Work through `SETUP.md` — Naver app registration first (unlocks the
   biggest missing chunk of content, Korean coverage), then Anthropic
   (unlocks hooks), then DNS, then Resend (lowest priority, weekly digest is
   a nice-to-have).
2. Once Naver + Anthropic are live, let the daily Action run for a week and
   sanity-check the actual volume per topic before deciding whether to widen
   `ENTRIES_PER_SOURCE` or add more sources.
3. Write a real summary on at least one more entry beyond the demo pin, to
   confirm the entry-permalink writing workflow feels right before it's a
   daily habit.
4. Revisit courses.aaron.kr integration once that course page is ready to go
   `visible: true`.
