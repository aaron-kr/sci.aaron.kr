# Scientia (working title)

A bilingual (English / Korean) reading log, **research-first**, built to rebuild a daily reading and writing habit — and to feed weekly English readings for a graduate Research Methods course.

Not a lab site (that's [pailab.io](https://pailab.io)) and not the courses site (that's `courses.aaron.kr`). This is a personal current-awareness tool that happens to be useful to both.

## What it does

- Pulls research papers first (arXiv, Semantic Scholar, PubMed) across four topics, in priority order: **Physical AI → General AI → Handwritten script recognition/OCR → Biomedical AI**. Each topic gets its own section, ~10 recent items, newest first.
- Pulls news second — English and Korean trade press — as a smaller, denser list further down the page (title + source + date, small thumbnail beside the title only when the source actually provides one, never a placeholder). Target ~20+ recent items.
- Shows English/Korean coverage counts and flags stories with coverage in only one language, but as **inline metadata**, not as the thing that decides layout or sort order — that was the original Ground-News-inspired plan, and it turned out to be less useful than just reading research first, news second.
- Every item gets a short paraphrased gloss in both languages (not a full translation) — written by an LLM pass, then editable by hand. The hand-editing *is* the writing practice.
- Lets you mark any item "for class," building a running weekly reading list for Research Methods.
- Lets you flag a news item as commentary-worthy — separate from marking it for class — as a pointer toward writing a full reaction essay (see "Where longer commentary lives" below).
- Lets other professors add an RSS feed or a keyword to watch without touching code.

## Where longer commentary lives

Short glosses (1–3 sentences) stay inline on this site — that's the daily habit. When a story is worth a real reaction essay (à la Cal Newport writing about AI news), that gets published on **aaron.kr's existing Writing section**, which already publishes exactly this kind of personal, longer-form piece. This site links out to it, not the other way around.

## Why static + Jekyll, not a live backend

`courses.aaron.kr` is pure static HTML with no build step; this project follows the same zero-maintenance instinct, but with enough shared page chrome (masthead, footer, a research-topic section repeated four times, a news-row layout) that it's worth using Jekyll's layouts/includes instead of hand-copying HTML. A GitHub Action runs on a schedule (every few hours), fetches sources, filters/tags/glosses new items, and writes generated data that Jekyll renders into a static page at build time. No server to babysit, no uptime to worry about.

"Alerts" are just the page updating — optionally paired with a scheduled email digest later if that turns out to be worth adding.

## Stack

- **Jekyll** (static site generator, native to GitHub Pages) — `_layouts/` + `_includes/` for shared chrome, `assets/css/main.css` + `assets/js/main.js` for styling/behavior, `_data/` for generated entries.
- GitHub Actions on a cron schedule for fetching.
- Anthropic API for the bilingual gloss/summary pass.
- arXiv API for papers (Physical AI, General AI, OCR/handwriting, part of Biomedical AI).
- PubMed/NCBI E-utilities for the rest of Biomedical AI.
- Naver Open API (News Search) for Korean keyword search across outlets.
- Plain RSS parsing for everything else.

## Design

- Fonts shared with the rest of the `aaron.kr` family: Playfair Display (headings) + IBM Plex Mono (labels/metadata) + IBM Plex Sans / IBM Plex Sans KR (body).
- Palette carried over from the v1 concept mockup (`frequency-concept.html`): slate background, brass (English) / jade (Korean) accents — preferred over the brighter indigo/violet palette tried in v2 (`sci.html`).
- List-first, text-first: no manufactured thumbnails. Papers never get an image slot; news gets a small thumbnail beside the title only when the source provides one.
- Dark mode only for now (matches the rest of the family's dark-default pattern).
- See `CLAUDE.md` for full design tokens, layout rules, and the two concept mockups kept in this repo for reference.

## Copyright note

This aggregates headlines, short paraphrased summaries, and links — it does not republish full article text or full machine translations. That's a deliberate legal and pedagogical choice: see `CLAUDE.md` → "Content rules."

## Status

Concept/refinement stage. Two design mockups exist (`frequency-concept.html`, `sci.html`); this session pivoted the plan away from v2's coverage-driven card layout toward a research-first, no-forced-thumbnail layout, and confirmed Jekyll as the build target. Jekyll scaffold + new reference page in progress. No fetch pipeline built yet. See `CLAUDE.md` for the current plan and open decisions.
