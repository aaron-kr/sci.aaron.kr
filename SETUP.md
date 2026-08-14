# SETUP.md — getting Scientia AI's pipeline actually running

Everything in this repo builds and runs without any of this — arXiv, RSS, and
story clustering all work with zero setup (see `_research/`/`_news/`, already
populated from live runs, real folder-organized archive under year/month).
This file is for the pieces that need your own accounts/keys: Korean keyword
search + translation, fine-grained auto-tagging, the weekly digest, and going
live on the custom domain.

Do these roughly in this order. None of them are urgent — the site works
without any of them, just with fewer sources and blank hooks until you do.

---

## 1. GitHub repo secrets (where all the keys below go)

Every key in this doc gets added the same way:

1. Go to `github.com/aaron-kr/sci.aaron.kr` → **Settings → Secrets and variables → Actions**
2. **New repository secret** → paste the name and value exactly as shown below.

Nothing here should ever be committed to the repo itself — only added as a secret.

---

## 2. Naver Open API — one app, two APIs (correction from last session)

You found `developers.naver.com/apps/#/cooperation` listing 검색 (Search),
CAPTCHA, Papago Translation, and Maps as **not** going through the API
제휴 (partnership) program. That's actually **good news, not a blocker** —
read that page as a negative list: "these APIs do *not* require the special
partnership application" — i.e. they're confirmed to use the normal
self-service path below. I misread your question as "these are gated";
they're actually explicitly exempted from gating. The registration flow I
originally described is correct and current:

1. Go to **developers.naver.com**, sign in with a Naver account.
2. **Application → 애플리케이션 등록** (Register Application).
3. Name it anything, e.g. "Scientia AI".
4. Under **사용 API** (APIs to use), add **both**:
   - **검색 (Search)** — powers `scripts/fetch_naver.py`
   - **Papago 번역 (Papago Translation)** — powers `scripts/translate_papago.py` (see §3 below — this replaced the original Anthropic-based hook translation)
5. Under environment, add a **Web service URL** — `https://sci.aaron.kr` once
   the domain is live, or `https://aaron-kr.github.io` in the meantime. Not
   strictly checked for these two APIs, so it won't block local testing.
6. Submit → you get **one Client ID / Client Secret pair covering both APIs**
   on the application's detail page.
7. Add as GitHub secrets:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`

Both `fetch_naver.py` and `translate_papago.py` read the same two secrets —
no separate registration needed for the Korean-blog Papago setup you already
have; that was a different application (tied to that blog's own client
ID/secret), so register a fresh one here rather than reusing it, since
usage/rate limits are tracked per application.

**Free tier, concretely:**
- Search API: 25,000 calls/day.
- Papago Translation: **10,000 characters/day free** on the Open API tier (this
  is the free developer tier — separate from Naver Cloud Platform's paid
  Papago NMT product, which has a larger 150,000/month allotment but requires
  a paid NCP account; you don't need that for this project's volume). A title
  is roughly 40–80 characters; even 100 new entries a day is under 8,000
  characters — comfortably inside the free daily limit.

Once both secrets exist, `fetch.yml` automatically starts running
`fetch_naver.py` and `translate_papago.py` on the next scheduled run (or
trigger it by hand — see §6).

---

## 3. Why Papago instead of Anthropic for hooks (changed this session)

The original plan used Claude Haiku to generate `hook_en`/`hook_ko`. Changed
after your question about cost: a hook is a **literal translation of the
title** (a few words), not a paraphrase — that's exactly what a translation
API does, for free, without needing an LLM call at all. `scripts/gloss.py` is
gone; `scripts/translate_papago.py` replaced it (§2 above).

**Claude Haiku is still used, but only for fine-grained tagging**
(`scripts/auto_tag.py`) — deciding whether a title is about "humanoids" vs.
"manipulation" vs. neither genuinely needs judgment, which translation
doesn't. This is the one place an LLM call earns its cost.

---

## 4. Anthropic API (fine-grained auto-tagging)

1. Go to **console.anthropic.com** → sign in / create an account.
2. **Settings → Billing** → add a payment method and set a small spend limit
   (e.g. $5/month — keep the ceiling low on purpose for a side project).
3. **Settings → API Keys → Create Key**. Copy it immediately (shown once).
4. Add as a GitHub secret: `ANTHROPIC_API_KEY`

**Cost, specifically (Claude Haiku 4.5 pricing: $1.00 / million input tokens,
$5.00 / million output tokens, as of this writing):**

- Per entry: the system prompt (~180 tokens, mostly a fixed tag vocabulary
  list) + a one-line title (~15–20 tokens) as input; a JSON array of up to 4
  short tags (~15–25 tokens) as output.
- Per-call cost ≈ (200 input tokens × $1/1,000,000) + (20 output tokens ×
  $5/1,000,000) ≈ **$0.0003** — three hundredths of a cent.
- `auto_tag.py` is capped at `AUTO_TAG_MAX_PER_RUN` (default 40) per run, once
  daily → at most 40 calls/day ≈ **$0.012/day, about $0.36/month** worst
  case, and in practice far less once the backlog is tagged and only new
  entries need it.
- This is the entire Anthropic spend for this project — nothing else in the
  pipeline calls the API. You will not "rack up" real usage here unless you
  point something else at this same key.

---

## 5. Resend (weekly email digest)

1. Go to **resend.com** → sign up (free tier: 3,000 emails/month, 100/day —
   one weekly digest to yourself needs 4/month).
2. **Domains** → add `aaron.kr` (or a subdomain like `mail.aaron.kr`) and add
   the DNS records Resend gives you (SPF/DKIM) at your DNS provider, so the
   digest sends from a real aaron.kr address. Skip this step and use Resend's
   sandbox sender if you want to test faster first.
3. **API Keys → Create API Key** → copy it.
4. Add GitHub secrets:
   - `RESEND_API_KEY`
   - `DIGEST_TO_EMAIL` — your own inbox address.

**Status: you've already added `RESEND_API_KEY` and `DIGEST_TO_EMAIL`** — DNS
confirmation is the only remaining step, and it doesn't block the digest from
sending (it'll just come from Resend's default sender address until DNS
verifies).

**Schedule:** you already changed `.github/workflows/digest.yml` to Fridays
20:00 UTC ≈ Saturday 05:00 KST — that's live as written; nothing more to do
here. To change it again later, edit the `cron:` line
(`minute hour day month weekday`, weekday 0=Sunday, all in UTC) —
[crontab.guru](https://crontab.guru) is the easiest way to sanity-check an
expression before committing it.

---

## 6. Custom domain (sci.aaron.kr on GitHub Pages, inside the aaron-kr org)

Being inside an **organization** (`aaron-kr`) rather than your personal
account changes nothing about the custom-domain steps — GitHub Pages custom
domains are configured per-repository either way:

1. At your DNS provider (wherever `aaron.kr`'s DNS is managed), add a
   **CNAME record**:
   - Host/name: `sci`
   - Value/target: `aaron-kr.github.io` (the org's Pages hostname — this is
     the org-level equivalent of a personal `username.github.io`; the `CNAME`
     file already committed in this repo contains `sci.aaron.kr` and is what
     tells GitHub Pages to expect that domain)
2. In the repo (not the org settings): **Settings → Pages** → confirm the
   custom domain field shows `sci.aaron.kr`, and check **Enforce HTTPS** once
   it's available (can take a few minutes to a few hours after DNS
   propagates — GitHub needs to issue a certificate for the domain, which
   only starts after it sees the DNS record resolve correctly).
3. One thing that *is* org-specific: if `aaron-kr` is an organization with
   restricted repository visibility/Pages settings, confirm **Settings
   (org-level) → Pages** doesn't have a policy blocking custom domains for
   member repos. Unlikely to be an issue for your own org, but it's the one
   place org vs. personal actually matters here.

---

## 7. Running the fetch pipeline manually (before or without waiting on cron)

From **Actions** tab → **Fetch sources** → **Run workflow** — runs the exact
same steps as the daily cron, on demand. Useful right after adding a secret,
to confirm it worked without waiting for the next scheduled run.

Locally (useful for testing before pushing):
```
python scripts/fetch_arxiv.py
python scripts/fetch_rss.py
NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... python scripts/fetch_naver.py
NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... python scripts/translate_papago.py
python scripts/cluster.py
ANTHROPIC_API_KEY=... python scripts/auto_tag.py
```

`cluster.py` needs no credentials — it only reads `_news/` and recomputes
`coverage_en`/`coverage_ko`/`gap` from what's already there, so it's safe (and
useful) to run any time, independent of the other steps.

---

## 8. Why the GitHub issue template showed a blank form

You clicked the "Suggest a source" link and got an empty issue form instead
of the pre-filled template. That's not a bug in the template — it's because
**none of this work has been pushed to GitHub yet.** Everything up to and
including this session has existed only in your local working tree;
`.github/ISSUE_TEMPLATE/source-suggestion.yml` isn't on GitHub until it's
committed and pushed, which is also why the workflow files, the issue
template, and the `_research`/`_news` content aren't live yet even though
you've already configured secrets for them. This should get resolved once
you commit and push — ask your assistant to do that, or run it yourself:

```
git add -A
git commit -m "Scientia AI: research-first rebuild, live pipeline, docs"
git push
```

---

## 9. RSS feeds — status

Confirmed and already wired into `sources.example.json` this session:
IEEE Spectrum (all topics), Ars Technica (Technology Lab), MIT Technology
Review, EdgeAI Foundation (their Substack — the .org homepage has no feed).

Still unconfirmed / needs a manual check:
- [ ] KAIST press releases (`news.kaist.ac.kr/newsen/html/news/`) — no RSS found; checked this session, confirmed absent. Manual-check source for now, or ask KAIST's press office if they publish one.
- [ ] ETRI news (`etri.re.kr/eng/bbs/list.etri?b_board_id=ENG02`) — same, no RSS found.
- [ ] ETRI papers search (`ksp.etri.re.kr/ksp/article/search`) — same, no RSS found; this is a database search UI, unlikely to ever have one — a keyword-based manual check is probably the permanent answer here, not a fetchable source.
- [ ] Any Korean academic-press outlet covering handwriting recognition / OCR specifically — still none confirmed.

## 10. What you do NOT need to set up

- **PubMed/NCBI** — deferred on purpose (see CLAUDE.md). No key needed even when it's added later.
- **Semantic Scholar** — no fetch script exists yet; see CLAUDE.md for why (and why Google Scholar/Scopus/ScienceDirect aren't realistic fetch targets — no free public search API for any of them).
- **Google Sheet contributor flow** — the GitHub issue template is the working "suggest a source" path for now.
