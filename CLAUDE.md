# CLAUDE.md — Scientia AI build notes

Session handoff file. Read this first.

## Session 5 changes (this session) — site is now live at sci.aaron.kr

Thirteen items from Aaron, addressed after the site went live and he could
see real behavior for the first time. Grouped by theme:

- **Nav**: added `Courses ↗` (courses.aaron.kr) and `Lab ↗` (pailab.io)
  links to the sticky subnav, after a divider. Added a mobile hamburger
  (`.subnav-toggle`, shows under 640px) since the nav no longer fits on one
  line on small screens — `initSubnavToggle()` in `main.js`.
- **Multi-priority pinning** (`_layouts/entry.html`, `index.html`,
  `scripts/lib.py`): replaced the single `pin: true` boolean with
  `pin_priority` (nullable int) + `pin_own_research` (bool). Priority 1 is
  the full-width `.lead-story`; any number of priority 2+ entries render as
  half-width `.lead-card`s in a `.lead-grid` below it. `pin_own_research:
  true` swaps the pink border/badge for gold — reserved for Aaron's own
  papers, distinct from an editorial "external work I'm highlighting" pick.
  Old `pin` field is not renamed in existing files (harmless dead data, see
  "Data model") — only templates and the one demo entry were migrated.
- **Fixed the demo pin's fake "Full commentary on aaron.kr" link** — the
  `handedit-...` demo entry had `commentary_url: "https://aaron.kr/writing"`
  hardcoded as a worked example from an earlier session; Aaron correctly
  flagged that no such commentary exists. Nulled it, and removed the
  placeholder "[Demo of the pin workflow...]" body text — the entry now
  renders as a normal unwritten pin, no fake data left standing in for real
  content on the live site.
- **Language-reactive accent color**: added `--accent`/`--accent-dim` custom
  properties (default = cyan), overridden to jade under `html[lang="ko"]`
  (main.js's `setLang()` already sets `document.documentElement.lang`, so no
  new JS was needed). Generic UI chrome — hovers, CTAs, the topic-head rank
  badge, focus rings, selection color — now uses `--accent` and shifts blue
  ↔ green with the interface language toggle. **Deliberately NOT switched**:
  `src-tag.en/.ko`, `list-src.en/.ko`, and the embedded/health/education flag
  colors — those label the *item's own* source language/category, which
  doesn't change when the reader toggles UI language. Also added `--gold`/
  `--gold-dim` as a third accent, reserved for "this is Aaron's own work"
  (own-research pins, written-summary badges) — not language-tied.
- **Removed the coverage edge-highlight bar** (`.list-row.cov-2/3/4/5plus`
  gradient bars) per Aaron's request — kept `.list-mini-cov` (the EN/KO
  split bar) and the visible `N sources` footnote text, both less "loud."
- **Reading list page**: "Your bookmarks (this browser only)" →
  "Bookmarked articles (this browser only)" (Aaron's own suggested wording
  covered news only; broadened since research entries get bookmarked too),
  with a clearer one-line explanation of what sets it. Added a "✕ Clear all"
  button (`#bookmark-clear`, `clearBookmarks()` in main.js) with a native
  `confirm()` — client-side only, since it's localStorage. Did **not** touch
  the separate "This week's set" authoritative list (`marked_for_class`
  front-matter flag, set by hand) — that's still a distinct mechanism
  documented in "Reading list page" below; Clear All only makes sense for
  the browser-local one.
- **Alerts system** replacing the "CONCEPT" banner: new `_alerts` collection
  (`output: false`), each file has `active` (bool), `starts`/`expires`
  (optional dates), `text_en`/`text_ko`. `_layouts/default.html` picks the
  first active alert whose date window includes today and renders it in
  `.site-alert` (gold `UPDATE` label); renders nothing if none match. Example
  alert at `_alerts/2026-09-01-semester-begins.md`. This was overdue — the
  banner used to hardcode "real fetched sample entries... not wired up live
  yet," which stopped being true the moment the site went live and Aaron
  never noticed it was still there.
- **AI Education graduated from a cross-cutting tag to a full 5th research
  topic** (`topic: "ai-education"`, rank 05 in `index.html`, after Biomedical
  AI). Reasoning: Aaron's strongest current publication niche, high expected
  volume (ChatGPT-in-classrooms, cognitive offloading, computing/engineering
  education), and a 5th section supports a "one subsection a day" reading
  cadence he wants for motivation. `sources.example.json`'s
  `arxiv-ai-education`/`naver-ai-education` sources now set
  `topic: "ai-education"` instead of `general-ai`. The `ai_education` flag/
  badge/filter-chip system stays too, for the rarer case of an
  education-relevant entry that isn't itself in the AI Education topic (e.g.
  an OCR or biomedical paper with a teaching angle). Vibe-coding /
  human-in-the-loop stays a lighter-touch tag under General AI, unchanged —
  lower confirmed volume so far (~5 papers expected, not yet arrived).
- **Removed "my summary →" / "add a summary →" action links** — redundant
  once the title itself already conditionally links to the right place (the
  source when unwritten, the permalink page once written — that logic
  shipped last session). Replaced with a small muted `↗` (`.ext-icon`) next
  to the title *only* when it links out to the source; its absence signals
  the title links internally.
- **Reading frequency calendar** (`scripts/reading_frequency.py`,
  `_data/reading_frequency.json`, `_includes/reading-frequency.html`) — a
  GitHub-commit-style grid under the Sources & Watches box. Counts the day
  Aaron's own summary first went non-empty for each entry, found by walking
  each file's git history (`git log`/`git show`, stdlib `subprocess`, no pip
  deps). **Runs as a step in `fetch.yml`, not at Jekyll-build time** —
  GitHub Pages' classic "Deploy from a branch" build only runs `jekyll
  build` itself with no way to run custom scripts around it, so the data
  file has to already be committed before Jekyll ever sees it (same reason
  the fetch pipeline itself works this way). `fetch.yml`'s checkout now uses
  `fetch-depth: 0` — the script needs full git history. Levels 1–4 shade
  jade→gold (a level-4 day, 4+ summaries, lights up gold — same "this is
  real work" color as own-research pins and written-summary badges).
  Currently renders all-empty (0 summaries) since no entry has real body
  content yet — expected, will fill in as Aaron actually writes.
- **Dimmed un-summarized entries, gold-badged written ones**: `.no-summary`
  (opacity .82, or .68 combined with `.wire`) on any entry/row where
  `has_summary` is 0, for quick "what still needs writing" triage. Entries
  *with* a summary get a small gold `✓ written` badge (`.summary-badge` on
  research cards and the permalink page, a smaller `.summary-dot` on the
  denser news rows) — same gold as own-research pins and the frequency
  calendar's best days, one consistent "this is Aaron's own work" signal
  across the site.
- **Bug found and fixed while in this area, not from Aaron's list**:
  `_layouts/entry.html`'s "no write-up yet" placeholder never actually
  rendered, on any of the ~60 unwritten permalink pages — the check was
  `page.content and page.content.size > 0`, but every file's trailing
  `\r\n` after `---` makes `page.content` a non-empty *whitespace* string,
  which passes that check (truthy, size > 0) and then renders to nothing
  after Markdown conversion. Fixed by reusing the already-stripped
  `has_summary` variable (`page.content | strip | size`) instead. Also found
  `scripts/send_digest.py`'s `collect()` only listed each collection's
  top-level directory (`os.listdir`, not recursive) — it has never actually
  found any entry since the year/month archive folders were introduced, so
  the weekly digest has been silently sending "Nothing flagged this week"
  regardless of real content. Switched to `os.walk`, and updated its
  "interesting" check from the retired `pin` bool to `pin_priority`.
  Untested against a real send (needs `RESEND_API_KEY`/`DIGEST_TO_EMAIL` and
  a live cron fire to confirm end-to-end) but the logic bugs are fixed.
- **Excluded `Claude-code-v1-notes.md` from the Jekyll build** — it was
  triggering a Liquid syntax warning on every build (`{{}}` in its text
  being parsed as a tag) and was never meant to be part of the deployed
  site; just missing from `_config.yml`'s `exclude:` list.

### Second follow-up (same session, after Aaron pushed the first round himself)

- **Calendar month/day labels update automatically** — `reading_frequency.py`
  recomputes the entire `weeks` array from `datetime.date.today()` on every
  run (daily, via `fetch.yml`), so month labels always reflect the real
  current date; nothing is hardcoded or could go stale. Confirmed, not a
  risk — explained to Aaron, no code change needed for this one.
- **Bookmarking moved from Research to News, cleanly split**: removed the
  "☐ mark for class" button from `entry-card.html` — Research's "This
  week's set" is the authoritative list now, driven purely by
  `marked_for_class` front matter (set by hand), no client button pretending
  to control it (that dual-system was the exact confusion flagged earlier).
  Added a pink bookmark icon (inline SVG, outline→filled on toggle,
  `.bookmark-btn`) to `news-row.html` instead — News' "Bookmarked articles"
  section is now genuinely news-only, populated only by that icon.
  `toggleMark()`/`markButtonsFromBookmarks()` in `main.js` retargeted from
  `.entry`/`.entry-title` to `.list-row`/`.list-title`.
- **"This week's set" now auto-resets weekly**: `scripts/reset_class_marks.py`
  walks `_research/` and flips `marked_for_class: true` back to `false`,
  research only. Wired into `digest.yml` as a step right after
  `send_digest.py` (the sent email is the record of what was marked, so
  nothing's lost), with a commit+push step (`digest.yml` needed
  `permissions: contents: write` added, since it never touched files
  before). A live "Clear all" button for this list isn't actually possible
  on a static site — front matter can't be edited by client-side JS, only a
  workflow run can — so the honest equivalent of "give me a button" is that
  `digest.yml` already has `workflow_dispatch: {}`: Actions → Weekly digest →
  Run workflow fires the same reset on demand, any time, not just Fridays.
- **Active nav state**: `_includes/masthead.html`'s Reading List link now
  gets `class="current"` via `{% if page.url contains "/reading-list" %}`.
  The three homepage anchor links (Research/News/Sources) all point at the
  same `page.url` (`/`) so there's no meaningful way to distinguish "current"
  among them — left alone, scoped this fix to the one page that actually has
  a distinct URL.
- **Per-topic pill/CTA colors**: added `t1`–`t5` classes directly to each
  `.filter-group` wrapper (not just the `.topic-head` inside it) and used
  them to override `--accent`/`--accent-dim` in scope. Every element inside
  a topic section that reads `var(--accent)` — `.pill-cta` background,
  title-hover color, tag-hover color — now inherits that topic's fixed
  color, overriding the language-tied default from the ancestor `html[lang]`
  rule, in both languages. No changes needed to `entry-card.html` itself;
  pure CSS custom-property cascade.
- **Filters were hiding entries but leaving topic headers floating over
  empty space** — most fine-grained tags (`humanoids`, `manipulation`, etc.)
  only exist on entries `auto_tag.py` has classified, which needs
  `ANTHROPIC_API_KEY` (not set up yet), so most topic sections have zero
  matches for those chips right now. Wrapped each topic block (and News) in
  a `.filter-group`; `applyFilter()` now hides the whole group, header
  included, when it has no visible entries left. Also dropped the "AI
  Education" filter chip — redundant now that it's its own section.

### First follow-up in the same session

Three quick fixes right after the batch above landed:

- **Filters hid entries but left the topic header floating over an empty
  gap** — fine-grained tags (`humanoids`, `manipulation`, etc.) only exist on
  entries `scripts/auto_tag.py` has classified, which needs
  `ANTHROPIC_API_KEY` (not yet set up — see SETUP.md), so most topic
  sections currently have zero matches for those chips. Rather than wait on
  that setup, wrapped each of the 5 topic blocks and the News block in a
  `.filter-group` div; `applyFilter()` in `main.js` now hides the whole
  group (header included) when it has no visible entries left, instead of
  leaving a bare header over dead space. Also removed the "AI Education"
  filter chip — redundant now that AI Education is its own section.
- **Per-topic color palette**: `.topic-head.t1`–`.t5` give each of the 5
  research sections a fixed identity color (rank badge + underline) — cyan /
  jade / magenta / gold / orange, in priority order. Deliberately **not**
  tied to `--accent` (which is language-driven, see Session 5 above) — the
  point here is 5 *fixed* colors that stay put regardless of EN/KO toggle,
  so the sections stay visually distinguishable while scrolling. Added
  `--orange`/`--orange-dim` as a new token for this.
- **Reading frequency calendar made responsive**: rebuilt as full-width flex
  (53 `flex:1` columns × 7 stacked squares, `aspect-ratio:1/1`) instead of
  fixed 10px squares — it now always spans the container exactly (the
  previous version was both too narrow and, apparently, clipping a square at
  the overflow edge; a strict flex layout with no wrapping structurally
  guarantees the 53×7 grid regardless). Added day-of-week letters (S M T W T
  F S) in a fixed left column and 3-letter month labels
  (`week.month_label` in `reading_frequency.py`, set on each week's first
  new month) above the grid — both required restructuring the JSON from
  `weeks: [[day, ...]]` to `weeks: [{month_label, days: [...]}]`, so this is
  a breaking change to `_data/reading_frequency.json`'s shape (fine, it's
  regenerated fresh every run, nothing reads the old shape). On mobile
  (<640px) the grid switches to fixed small squares inside a horizontally
  scrolling `.freq-scroll` div, auto-scrolled to its right edge on load
  (`initFreqScroll()` in `main.js`) so the most recent weeks are what's
  visible by default — chosen over `overflow:hidden` so history is still
  reachable by swiping, just not the default view.

## Session 4 changes (previous session)

- **Naver Search/Papago moved to Naver Cloud Platform — Aaron decided to
  proceed anyway.** As of ~July 2026, Naver Search moved to "NAVER API HUB"
  and Papago moved to NCP's AI Services, both now requiring an NCP account
  (real-name ID verification + a payment method on file — NCP is a paid
  cloud platform, not the old free-and-open Developers Center), with
  pay-as-you-go pricing on Search (exact rate/free-tier threshold still
  unconfirmed — NCP's calculator requires login). Given a choice between
  deferring this or going through NCP registration, Aaron chose to register.
  **Code updated accordingly this session:**
  - `scripts/fetch_naver.py` and `scripts/translate_papago.py` now use NCP's
    headers (`X-NCP-APIGW-API-KEY-ID` / `X-NCP-APIGW-API-KEY`) and endpoints.
  - Papago's endpoint (`https://papago.apigw.ntruss.com/nmt/v1/translation`)
    is **confirmed** — found a literal documented example, high confidence.
  - The news search endpoint (`https://naverapihub.apigw.ntruss.com/search/v1/news`)
    is **inferred by pattern**, not literally confirmed — the only
    documented API HUB example found was Knowledge-iN search
    (`/search/v1/kin`); `news` is the same-family extension of that pattern
    but hasn't been tested against a real key. **If Aaron's first real run
    404s on the news fetch, check the NCP console's own API HUB
    documentation (needs login) for the exact path** and fix
    `NEWS_ENDPOINT` in `fetch_naver.py` — everything else in that script
    should still be correct.
  - `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` env var *names* are unchanged
    (still hold NCP's Client ID/Secret now, not the old Developers Center
    ones) — no changes needed to `.github/workflows/fetch.yml` or any
    already-added GitHub secret name, just the values once Aaron registers.
- **GitHub Pages deployment gap found and fixed.** Aaron had already set the
  repo's Pages source to "GitHub Actions" (not "Deploy from a branch") — in
  that mode, GitHub does *not* auto-build Jekyll on push; nothing was
  actually deploying. Added `.github/workflows/pages.yml`
  (`actions/configure-pages` + `jekyll build` + `actions/upload-pages-artifact`
  + `actions/deploy-pages`) to match the mode Aaron already chose, rather
  than switching him back to branch-based deploy. Don't use GitHub's own
  auto-suggested default workflow — this repo has its own.
- **Issue template confirmed correctly present on GitHub** (verified via
  `gh api` against the `main` branch — valid GitHub Issue Forms YAML, right
  path, right branch). If it's still showing blank, the two most likely
  causes are (a) GitHub's template-picker cache not having refreshed yet
  right after a push, or (b) navigating to plain `/issues/new` instead of
  `/issues/new?template=source-suggestion.yml`. Not a bug in the file.
- **Conditional article/summary links.** Every title link (research cards,
  news rows) now points straight to the source article when there's no
  write-up yet, and to the entry's own permalink page once a real summary
  exists — no more sending visitors to an empty page. `has_summary` check is
  `{% assign has_summary = e.content | strip | size %}` in
  `entry-card.html`/`news-row.html`. Verified both branches render correctly
  against real data (68 direct-to-source links + the one demo entry with a
  body linking to its own page).
- **"Read article" pills.** All source-article links now render as a
  distinct bright pill button (`assets/css/main.css` `.pill-cta`), not plain
  text — meant to be the most obviously-clickable thing on the page, text
  changed from "original" to "read article". The entry permalink page
  (`_layouts/entry.html`) gets a bigger magenta/pink version
  (`.pill-cta-big`) prominently placed right under the title/hook.
  Commentary/video links stay conditional (only render if
  `commentary_url`/`commentary_video_url` is actually set) — unchanged, was
  already correct.
- **New cross-cutting tag: `ai_education`.** Same pattern as
  `health_flourishing`/`embedded` — boolean front-matter field, a flag badge,
  a filter chip, propagated from source `tags: ["ai-education"]`. This is
  Aaron's strongest current publication niche (numerous existing papers),
  so it got the full dedicated-field treatment like the other two lenses,
  not just a plain tag. Sources added: `arxiv-ai-education` (cs.CY/cs.AI),
  `naver-ai-education`.
- **New topical tag (not a dedicated field): `human-in-the-loop`** — Aaron's
  newer research direction (vibe coding, human-in-the-loop AI, ~5 papers
  expected). Deliberately *not* given the full dedicated-lens treatment yet
  (no boolean field, no flag badge) since the volume isn't established —
  it's a plain tag for now, added to `auto_tag.py`'s known vocabulary and a
  candidate source (`arxiv-human-in-the-loop`, cs.SE/cs.HC). **Watch this**:
  if the "~5 more papers" materializes, this is a strong candidate to
  graduate to a full cross-cutting lens (or even a 5th research topic) —
  revisit once there's real volume, don't force the decision now.
- **`sources.example.json`'s `example-colleague-watch` placeholder entry
  removed** — it never actually rendered on the site (the Sources & Watches
  section is hand-written markup, not driven by `sources.json`), so it was
  just noise in the schema file.
- **Sources & Watches list is now fully linked.** Every entry in
  `_includes/sources.html` is a real `<a>` to the source's homepage or (for
  Naver keyword watches) a live `search.naver.com` search URL for that exact
  query — Aaron can click through the whole list to explore. KAIST/ETRI
  entries link to the pages already confirmed to have no RSS (per SETUP.md),
  marked "manual" accordingly.
- **News coverage count is now a visible footnote**, not just a hover
  tooltip — `.cov-count` span in `news-row.html` shows "N sources" in the
  row's metadata directly. The hover tooltip on `.list-mini-cov` stays too
  (exact EN/KO split on inspection); the footnote is the at-a-glance number.

## Session 3 changes (previous session) — still accurate, read after Session 4

The rest of this file is mostly still accurate but has some stale
references from the session that wrote it. Corrections and additions:

- **Archive is now organized by year/month.** `_research/YYYY/MM/slug.md` and
  `_news/YYYY/MM/slug.md`, not flat. Filenames dropped their date prefix
  (the folder encodes it now). `scripts/lib.py` has a `dated_dir()` helper;
  all three fetch scripts use it. Jekyll's `permalink: /:collection/:path/`
  handles nested paths automatically — no `_config.yml` change was needed.
- **No retention policy / no auto-delete.** Considered and explicitly
  rejected: static markdown files cost nothing meaningful to keep forever,
  and deleting old entries would break permalinks that might get linked to
  or indexed. Entries stay up indefinitely. If Aaron wants a "last 3–5
  years" *view* for a job-application-style presentation, that's a future
  filtered page, not a deletion policy — nothing built for this yet since
  it's speculative until actually needed.
- **`scripts/gloss.py` is gone, replaced by two scripts with a cleaner
  cost/purpose split:**
  - `scripts/translate_papago.py` — generates `hook_en`/`hook_ko` as a
    **literal Papago translation of the title**, not an LLM paraphrase. A
    title is a few words; that's a translation problem, not a judgment
    problem, and Papago is free at this volume (10,000 chars/day free tier)
    where an LLM call isn't necessary. Uses the same Naver app/credentials
    as `fetch_naver.py`.
  - `scripts/auto_tag.py` — the only remaining Claude Haiku call in the
    pipeline. Picks 0–4 fine-grained tags (`humanoids`, `manipulation`,
    etc.) from a title. This is genuinely a judgment call, unlike
    translation, so it's the one place an LLM earns its cost. ~$0.0003 per
    entry — see SETUP.md § 4 for the full math. Answers the "how much is
    automatic" question from the Automation table below: **fine-grained
    tags are now automatic**, not manual — update that table's row.
  - `.github/workflows/fetch.yml` updated to call both, plus `cluster.py`
    (below), in sequence after the existing fetch steps.
- **Story clustering is implemented** (`scripts/cluster.py`) — simple
  word-overlap (Jaccard on tokenized `hook_en`, falling back to title) within
  a 48h window, news only. Sets `coverage_en`/`coverage_ko`/`gap` on every
  entry in a cluster of 2+; solo entries are left with those fields `null`
  (deliberately no clutter for the common single-source case). Re-run safe —
  recomputes from scratch every run rather than incrementally, so a story
  that drops out of a cluster gets its stale coverage data cleared, not just
  newly-clustered stories getting updated. Caught and fixed a real bug this
  session: a naive Jaccard on very short token sets (e.g. both titles
  sharing only the word "KAIST") gives a misleading 1.0 score — added a
  `MIN_TOKENS = 3` floor before comparing two entries at all.
- **Coverage now has a visual UI element**, not just inline text: a
  right-edge gradient bar on news rows (`.list-row.cov-2`
  through `.cov-5plus` in `assets/css/main.css`), opacity scaled by cluster
  size, meant as an at-a-glance "how covered is this" cue while skimming —
  separate from the precise `.list-mini-cov` bar, which stays for exact
  numbers on inspection. Still metadata, still not sort-driving — the
  gradient doesn't move anything, it just colors what's already there.
- **AI-driven feed personalization: still deferred, re-confirmed this
  session.** Not building adaptive/click-based re-ranking. Same reasoning as
  before (no backend/analytics infra, manual curation sufficient at this
  scale) plus a new one: with clustering and auto-tagging now handling the
  categorization work, there's even less of a gap for personalization to
  fill.
- **courses.aaron.kr integration: confirmed not needed.** Aaron decided the
  `/reading-list/` page link is sufficient; the course's `readings:` field
  linking out to it (documented in the prior session's version of this file)
  is no longer planned. Removed from "Immediate next steps" below.
- **GitHub issue template was blank when tested — root cause: nothing had
  been pushed to GitHub yet.** All of the previous session's work (and this
  one) existed only in the local working tree. Not a bug in the template
  itself. See SETUP.md § 8.
- **Naver Search/Papago access clarification.** Aaron found
  `developers.naver.com/apps/#/cooperation` listing Search, Papago, CAPTCHA,
  and Maps — initially read as "these need special partnership approval."
  Corrected: that page is a *negative* list — these APIs are explicitly
  **exempt** from the partnership-application requirement, i.e. confirmed to
  use the normal self-service `애플리케이션 등록` flow already documented in
  SETUP.md. No change needed to the registration steps themselves.
- **Semantic Scholar / Google Scholar / Scopus / ScienceDirect**: no fetch
  script exists for any of these, and that's expected to stay true.
  Semantic Scholar has a real free public API (unlike the others) and is
  listed in `sources.example.json` as aspirational, but arXiv already covers
  most of the same ground for this project's topics, so it hasn't been
  prioritized. Google Scholar has no public API (scraping it violates its
  ToS — not doing that). Scopus and ScienceDirect are Elsevier products
  requiring an institutional subscription and API key per-institution, not
  a free public source — realistically only usable if one of Aaron's 5
  university affiliations provides institutional API access, which hasn't
  been checked. Not a near-term priority either way.
- **New file: `US_ROADMAP.md`** — private career-planning tracker (US
  visiting-position timeline, SCIE-first publishing strategy, societies/
  conferences/journals open questions). Explicitly not a public page — see
  its own "Where this doesn't go" section for the reasoning (a genuinely
  public "publications & venues" page, if it ever makes sense, belongs on
  pailab.io's team/bio page once there's real content, not as a new
  sci.aaron.kr page).
- **pailab.io nav link**: added last session, confirmed still in place
  (`Nav.astro`, Research group → "Scientia AI (reading log) ↗").

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

1. **The hook** (`hook_en` / `hook_ko`, one sentence each, generated by
   `scripts/translate_papago.py` as a literal translation, not an LLM
   paraphrase — see Session 3 notes above) — a translated one-line "is this
   worth a look," shown inline in the log and on the entry's permalink page.
   Fully automated, free at this volume (see SETUP.md § 2–3). This is the
   only auto-generated text in the pipeline for the hook slot — it used to
   be a 1–3 sentence LLM paraphrase; that scope shrank specifically so
   Aaron's own writing isn't competing with an LLM draft for the same slot.
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

1. **Masthead** — sticky anchor nav: `Research` · `News` · `Reading list` ·
   `Sources` · (divider) · `Courses ↗` (courses.aaron.kr) · `Lab ↗`
   (pailab.io), collapsing into a hamburger (`☰`, `.subnav-toggle`) under
   640px. See Session 5.
2. **Pinned lead stories** (optional, `pin_priority: 1, 2, 3…` on any number
   of `_research` entries) — see Session 5's "Multi-priority pinning" for the
   current mechanism; this replaced the old single-boolean `pin: true` field.
3. **Research section**, five subsections in priority order (Physical AI →
   General AI → OCR/handwriting → Biomedical AI → AI Education), ~10 shown
   per topic (`limit: 10` in `index.html`, most recent first — the
   underlying collection can hold more).
4. **News section**, dense list, ~30 shown (`limit: 30`), smaller than
   research, mini coverage bar where applicable, wire styling where
   applicable.
5. **Sources** (`_includes/sources.html`) — full source list by topic, plus
   the "suggest a source" GitHub issue CTA (see "Contributor flow").
6. **Reading frequency calendar** (`_includes/reading-frequency.html`) — a
   GitHub-commit-style grid under the sources box. See Session 5.
7. **Footer** — links out to pailab.io / aaron.kr / courses.aaron.kr.

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
| Fine-grained tags (`humanoids`, `manipulation`, `ocr`, etc.) | **Yes, as of Session 3** — `scripts/auto_tag.py`, once `ANTHROPIC_API_KEY` is set. Only tags entries with no existing tags, so hand-tagged entries aren't overwritten. |
| Hooks (`hook_en`/`hook_ko`) | **Yes, once `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` are set** — `scripts/translate_papago.py` (literal translation, not an LLM call — see Session 3 notes above) |
| Coverage counts / cross-language gap flags | **Yes, as of Session 3** — `scripts/cluster.py`, no credentials needed, runs unconditionally in the daily Action |
| Aaron's own 200–500 word summary | **No, by design** — this is the point of the habit |
| Pinning a lead story | **No, manual** — `pin: true` |
| Marking for class | **Partially** — the authoritative flag (`marked_for_class: true`) is manual/front-matter; a personal per-browser bookmark button exists as a convenience but doesn't write back to the site |

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
hook_en, hook_ko (single sentence each, Papago-translated, empty string until translate_papago.py runs),
source, source_lang, source_url, topic, tags[],
date, thumb (news only, nullable — null unless the RSS feed actually supplied one),
coverage_en, coverage_ko, gap ("en_only"|"ko_only"|null) — metadata only, see above,
marked_for_class (bool), commentary_worthy (bool),
commentary_url (nullable, → aaron.kr Writing), commentary_video_url (nullable, → YouTube),
pin_priority (nullable int — 1 = full-width lead, 2+ = half-width card, sorted ascending; replaces the old `pin` bool as of Session 5),
pin_own_research (bool — gold border/badge instead of pink, for Aaron's own papers), pin_image (nullable),
raw_wire (bool), embedded (bool), health_flourishing (bool), ai_education (bool),
dedup_key (the arXiv ID or article URL — used by scripts/lib.py to avoid re-fetching)
```

Note: entries fetched before Session 5 still carry a leftover `pin: false`
line in their front matter — harmless dead data, not referenced by any
template anymore. Not worth a mass find-and-replace across ~60 files for a
key nothing reads.

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
3. **Translate step**: `scripts/translate_papago.py` runs only if the same
   Naver secrets are set (Papago is the same app as Search — see SETUP.md
   § 2); capped at `TRANSLATE_MAX_PER_RUN` (default 60).
4. **Cluster step**: `scripts/cluster.py` runs unconditionally (no
   credentials needed) — computes `coverage_en`/`coverage_ko`/`gap` across
   `_news/`.
5. **Tag step**: `scripts/auto_tag.py` runs only if `ANTHROPIC_API_KEY` is
   set; capped at `AUTO_TAG_MAX_PER_RUN` (default 40) entries per run to
   bound cost (see SETUP.md § 4 for the actual math — a few cents a month).
6. **Commit step**: the Action commits any new/changed `_research`/`_news`
   files and pushes — GitHub Pages' own Jekyll build then picks it up
   automatically, no separate render/deploy step needed (this is why the
   fetch scripts write directly into the Jekyll collections instead of some
   intermediate format).
7. **`.github/workflows/digest.yml`** — weekly, currently **Fridays 20:00
   UTC ≈ Saturday 05:00 KST** (Aaron changed this from the original Monday
   default this session), runs `scripts/send_digest.py` (Resend) if
   `RESEND_API_KEY`/`DIGEST_TO_EMAIL` are set — both are now set as of this
   session, pending DNS confirmation on the Resend side.

All eight scripts (`lib.py`, `fetch_arxiv.py`, `fetch_rss.py`, `fetch_naver.py`,
`translate_papago.py`, `cluster.py`, `auto_tag.py`, `send_digest.py`) are
stdlib-only Python — no `requirements.txt`,
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

- [x] ~~Final name~~ — resolved: **Scientia AI**, propagated everywhere.
- [x] ~~courses.aaron.kr integration~~ — resolved: not needed, the
      `/reading-list/` page link is sufficient. See Session 3 notes above.
- [x] ~~Story clustering~~ — resolved: implemented, `scripts/cluster.py`.
- [x] ~~Fine-grained tag auto-classification~~ — resolved: implemented,
      `scripts/auto_tag.py`.
- [ ] DNS CNAME record for `sci.aaron.kr` — not yet added at the DNS
      provider (see SETUP.md § 6).
- [ ] Naver app registration (unlocks Korean search + translation) and
      Anthropic key — not yet done (see SETUP.md §§ 2, 4). Resend is done
      (secrets added), pending DNS confirmation on Resend's side.
- [ ] Google Sheet vs. GitHub issue for the multi-professor contributor
      flow — GitHub issue is now primary; Sheet stays a documented fallback.
- [ ] RSS feeds to confirm — see SETUP.md § 9 for the specific checklist
      (down to just KAIST/ETRI press + a Korean OCR-specific outlet, after
      this session's 4 new confirmed feeds).
- [ ] PubMed — deferred, revisit once arXiv-only biomedical coverage has run
      for a while and its volume can be assessed.
- [ ] Semantic Scholar fetch script — still aspirational, still not blocking
      (see Session 3 notes above on why arXiv covers most of the same ground).
- [ ] Whether this repo's work is pushed to GitHub — as of this session,
      still local-only; see SETUP.md § 8 for what's blocked until it is.

## Immediate next steps

1. Push this repo to GitHub — several things (the issue template, the
   Actions workflows, the live `_research`/`_news` content) silently don't
   work until this happens. See SETUP.md § 8.
2. Work through `SETUP.md` — Naver app registration first (unlocks Korean
   coverage *and* hook translation now that both run through the same app),
   then Anthropic (unlocks fine-grained tagging), then DNS.
3. Once Naver + Anthropic are live, let the daily Action run for a week and
   sanity-check the actual volume per topic before deciding whether to widen
   `ENTRIES_PER_SOURCE` or add more sources.
4. Write a real summary on at least one more entry beyond the demo pin, to
   confirm the entry-permalink writing workflow feels right before it's a
   daily habit.
