# Scientia AI

A bilingual (English / Korean) reading log, **research-first**, built to
rebuild a daily reading and writing habit — and to feed weekly English
readings for a graduate Research Methodology course at CBNU. Public on
purpose: it doubles as a running, citable body of evidence of active research
engagement.

Not a lab site (that's [pailab.io](https://pailab.io), which links here from
its nav) and not the courses site (that's `courses.aaron.kr`). This is a
personal current-awareness tool that happens to be useful to a lot of other
people too.

## What it does

- Pulls research papers first — arXiv (and eventually Semantic Scholar,
  PubMed) — across four topics, in priority order: **Physical AI → General AI
  → Handwritten script recognition/OCR → Biomedical AI**. Each topic gets its
  own section, most recent first.
- Two cross-cutting lenses run across those topics rather than being their
  own sections: **low-cost/embedded AI** (Aaron's likely long-term research
  niche — small, cheap AI for classrooms and labs without major funding) and
  **health & human flourishing** (AI touching sleep, exercise, behavior,
  wearables).
- Pulls news second — English and Korean trade press — as a smaller, denser
  list further down the page. Raw wire/press-release coverage is included
  but styled distinctly (dimmed, badged), rather than excluded.
- Shows English/Korean coverage counts as **inline metadata only** — not
  something that decides layout or sort order. That was the original
  Ground-News-inspired plan; it turned out to be less useful than just
  reading research first, news second.
- Every entry gets a one-sentence bilingual "hook" (LLM-generated,
  translated, not a summary) and its own permalink page, where Aaron writes
  a real 200–500 word summary by hand whenever he gets to it — that's the
  actual daily habit. Occasional longer (500–1500+ word) reaction essays live
  on **aaron.kr's Writing section** instead, linked from the relevant entry.
- A manual "pin as lead story" feature puts one hand-picked entry above the
  topic sections, with room for a real chosen image and a link to a
  commentary essay/video if one exists.
- A separate **reading list page** (`/reading-list/`) — not the homepage —
  serves the CBNU course, so a general visitor doesn't land on a
  course-specific widget.
- Lets other professors (or anyone) suggest a source via a GitHub issue
  template — no live form writing to the site directly, which matters now
  that this is public.

## Why static + Jekyll + GitHub Actions

A GitHub Action runs daily (not every 4–6 hours — a personal reading log
doesn't need that polling rate), fetches sources with plain Python (stdlib
only, no dependencies to maintain), and commits the results straight into
Jekyll collections (`_research/`, `_news/`). GitHub Pages' own Jekyll build
picks it up from there — no separate render/deploy step. No server to
babysit, no uptime to worry about, and the whole pipeline costs close to
nothing to run (see `SETUP.md` for the actual cost breakdown on the Anthropic
API usage).

## Stack

- **Jekyll** — collections for research/news, `_layouts` + `_includes` for
  shared chrome, `assets/css/main.css` + `assets/js/main.js`.
- GitHub Actions — daily fetch cron, weekly digest cron.
- arXiv API for papers (works today, zero setup).
- Plain RSS parsing (works today, zero setup).
- Naver Open API for Korean keyword search (needs a free app registration — see `SETUP.md`).
- Claude Haiku (Anthropic API) for the one-sentence bilingual hook only —
  Aaron writes the real summary himself (see `SETUP.md` for the (small)
  cost reality).
- Resend for an optional weekly email digest.
- `jekyll-sitemap`, Open Graph/Twitter meta, JSON-LD — basic SEO, since this
  is meant to be found.

## Design

- Fonts shared with the rest of the `aaron.kr` family: Playfair Display
  (headings) + IBM Plex Mono (labels/metadata) + IBM Plex Sans / IBM Plex
  Sans KR (body).
- Dark slate background carried over from the original concept mockup;
  accent colors swapped to cyan/jade/magenta for a more "AI-coded" feel.
- A subtle, intentionally low-key background: an irregular multi-layer grid
  plus a very sparse, slow "digital rain" canvas (respects
  `prefers-reduced-motion`, pauses on background tabs).
- List-first, text-first: no manufactured thumbnails. Papers never get an
  image slot; news gets a small thumbnail beside the title only when the
  source provides one.
- Sticky anchor nav + back-to-top button for a page that's meant to be long.
- Dark mode only for now.
- See `CLAUDE.md` for full design tokens and layout rules.

## Getting it running for real

See **`SETUP.md`** — step by step for Naver, Anthropic, Resend, GitHub
secrets, the custom domain, and a checklist of RSS feeds still worth
confirming. The site works without any of this (arXiv + RSS already run
live, see `_research/`/`_news/`), just with less content until you do.

## Copyright note

This aggregates headlines, one-sentence hooks, and links — it does not
republish full article text or full machine translations. Aaron's own
summaries are his own writing, not machine translations of the source. See
`CLAUDE.md` → "Content rules."

## Status

Near-live. Real fetched content exists (`_research/`, `_news/`), the Jekyll
site builds cleanly, and pailab.io already links here. Remaining before
fully live: DNS for the custom domain, Naver/Anthropic/Resend credentials
(all in `SETUP.md`), and Aaron actually writing summaries beyond the one demo
entry. See `CLAUDE.md` for the full decision log.
