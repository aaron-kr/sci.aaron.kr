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

## 2. Naver — now via Naver Cloud Platform (correction, again — Naver moved this)

**This changed since the last session, and my previous correction here was
itself wrong.** The old Developers Center self-service flow (검색/Papago
under 애플리케이션 등록) is gone — as of ~July 2026, Naver moved both APIs to
**Naver Cloud Platform (NCP)**:
- **Search** → hosted on the new **NAVER API HUB**
- **Papago Translation** → NCP's **AI Services**

Both now require an **NCP account**, which means real-name identity
verification and a registered payment method — NCP is a full paid cloud
platform (like AWS/GCP), not the old open developer portal. Pricing on
Search is confirmed **pay-as-you-go**; the exact rate and whether there's a
free monthly quota before billing kicks in wasn't confirmable without
logging into NCP's pricing calculator yourself — **check that before you
commit**, ideally right after creating the account and before enabling
billing on anything.

You already decided to go through this rather than defer it, so:

1. Go to **console.ncloud.com**, sign up / sign in. This is where the
   real-name verification and payment method get requested — that's normal
   NCP onboarding, not something specific to these two services.
2. **For Papago**: Console → **Services → AI Services → Papago Translation**
   → **Request Service** (이용 신청) → **AI·NAVER API → Application**
   → register an application, check **Papago Translation**, generate
   Client ID/Secret.
3. **For Search**: Console → **NAVER API HUB** → create an application →
   select/activate the **Search** API → issue the key. (This is a newer,
   separate flow from Papago's — API HUB unifies several search-family APIs
   under one key rather than the old per-service application model.)
4. You'll end up with credentials from these steps — add them as GitHub
   secrets exactly as before:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
   (If Papago and Search end up issuing *separate* credential pairs rather
   than one shared pair — possible, since they're technically different NCP
   services now — use the Papago ones for these two secret names, since
   `translate_papago.py` needs them confirmed-working; if Search's News
   endpoint needs a different key, that'll surface as an auth error in
   `fetch_naver.py` specifically, and we can add a second secret pair then.)

**Code is already updated for this** (see CLAUDE.md → Session 4) —
`fetch_naver.py` and `translate_papago.py` now send NCP's headers
(`X-NCP-APIGW-API-KEY-ID` / `X-NCP-APIGW-API-KEY`) to NCP's endpoints. The
Papago endpoint is confirmed against a real documented example; the news
search endpoint is a high-confidence pattern-match, not literally confirmed
— **if your first real run of `fetch_naver.py` 404s**, that's the most
likely reason. Check NCP's own API HUB docs (needs your login) for the exact
path and update `NEWS_ENDPOINT` near the top of `fetch_naver.py`.

**On cost**: I can't give you a confirmed free-tier number the way I could
for the old API — check NCP's pricing calculator yourself before enabling
billing on anything, since "pay-as-you-go" with an unknown rate is a real
risk for a project meant to stay near-free. Papago's older Open API tier
(now retired) was 10,000 free characters/day; if NCP's Papago pricing is
similar in spirit, your actual volume (titles only, ~40–80 characters each)
would stay small regardless — but confirm rather than assume.

Once both secrets exist, `fetch.yml` automatically starts running
`fetch_naver.py` and `translate_papago.py` on the next scheduled run (or
trigger it by hand — see §7).

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
