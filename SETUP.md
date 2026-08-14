# SETUP.md — getting Scientia AI's pipeline actually running

Everything in this repo builds and runs without any of this (arXiv + RSS fetch
scripts work with zero setup — see `_research/` and `_news/`, already
populated from a live run). This file is for the pieces that need your own
accounts/keys: Korean keyword search, bilingual hooks, the weekly digest, and
going live on the custom domain.

Do these roughly in this order. None of them are urgent — the site works
without any of them, just with fewer sources and blank hooks until you do.

---

## 1. GitHub repo secrets (where all the keys below go)

Every key in this doc gets added the same way:

1. Go to `github.com/aaron-kr/sci.aaron.kr` → **Settings → Secrets and variables → Actions**
2. **New repository secret** → paste the name and value exactly as shown below.

Nothing here should ever be committed to the repo itself — only added as a secret.

---

## 2. Naver Open API (Korean news search)

Powers every `"provider": "naver"` source in `sources.json` — this is the
main way Korean coverage gets searched across outlets rather than one site's
RSS feed.

1. Go to **developers.naver.com** and sign in with a Naver account (personal is fine).
2. **Application → Register Application** (애플리케이션 등록).
3. Application name: anything, e.g. "Scientia AI".
4. Under **API to use**, add **검색 (Search)**.
5. Under **Environment** (환경 추가), add a **Web service URL** — `https://sci.aaron.kr` once the domain is live, or `https://aaron-kr.github.io` in the meantime. This field is required but isn't strictly checked for the News Search API, so it won't block local testing.
6. Submit. You'll get a **Client ID** and **Client Secret** on the application's detail page.
7. Add both as GitHub secrets:
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`

Once both secrets exist, `.github/workflows/fetch.yml` automatically starts
running `scripts/fetch_naver.py` on the next scheduled run (or trigger it by
hand — see §6).

Free tier: 25,000 calls/day, far more than this project needs.

---

## 3. Anthropic API (bilingual hooks)

Powers `scripts/gloss.py` — generates the single-sentence EN/KO hook for each
entry (not a summary — you write that yourself, see CLAUDE.md → "Content rules").

1. Go to **console.anthropic.com** → sign in / create an account.
2. **Settings → Billing** → add a payment method and set a small spend limit
   (e.g. $5/month — this is a side project, keep the ceiling low on purpose).
3. **Settings → API Keys → Create Key**. Copy it immediately (shown once).
4. Add as a GitHub secret: `ANTHROPIC_API_KEY`

**Cost reality check:** `gloss.py` uses Claude Haiku (the cheapest current
model) and sends one short title + gets back one short JSON reply per entry.
At current Haiku pricing that's a small fraction of a cent per entry — even
a daily run over ~40 new entries costs a few cents a month, not dollars. The
script also caps itself at `GLOSS_MAX_PER_RUN` (default 40) per run so a bad
day of fetches can't spike a bill. You will not "rack up" real usage here
unless you point something else at this same key.

---

## 4. Resend (weekly email digest)

Powers `scripts/send_digest.py` and `.github/workflows/digest.yml`.

1. Go to **resend.com** → sign up (free tier: 3,000 emails/month, 100/day — way more than one weekly digest to yourself needs).
2. **Domains** → add `aaron.kr` (or a subdomain like `mail.aaron.kr`) and add the DNS records Resend gives you (SPF/DKIM) at your DNS provider. This step is what lets the digest send *from* an aaron.kr address instead of a generic one — skip it and use Resend's own sandbox sender if you want to test faster first.
3. **API Keys → Create API Key** → copy it.
4. Add GitHub secrets:
   - `RESEND_API_KEY`
   - `DIGEST_TO_EMAIL` — your own inbox address, where the digest gets sent.

**Choosing the day:** the digest runs on the cron schedule in
`.github/workflows/digest.yml` — currently Mondays 22:00 UTC (≈ Tuesday 07:00
KST). To change the day, edit the `cron:` line. Cron format is
`minute hour day month weekday` (weekday 0=Sunday .. 6=Saturday, in UTC).
Example: to run Sundays at 22:00 UTC (≈ Monday 07:00 KST), use `"0 22 * * 0"`.
[crontab.guru](https://crontab.guru) is the easiest way to sanity-check a
cron expression before committing it.

---

## 5. Custom domain (sci.aaron.kr on GitHub Pages)

The `CNAME` file in this repo already contains `sci.aaron.kr`, and GitHub
Pages will use it automatically once DNS is pointed at it:

1. At your DNS provider (wherever `aaron.kr`'s DNS is managed), add a **CNAME record**:
   - Host/name: `sci`
   - Value/target: `aaron-kr.github.io`
2. In the repo: **Settings → Pages** → confirm the custom domain shows `sci.aaron.kr` and check **Enforce HTTPS** (may take a few minutes to become available after DNS propagates).
3. DNS propagation can take anywhere from a few minutes to a few hours.

---

## 6. Running the fetch pipeline manually (before or without waiting on cron)

From **Actions** tab → **Fetch sources** → **Run workflow** — this runs the
exact same steps as the daily cron, on demand. Useful right after adding a
new secret, to confirm it worked without waiting for the next scheduled run.

Locally (useful for testing before pushing):
```
python scripts/fetch_arxiv.py
python scripts/fetch_rss.py
NAVER_CLIENT_ID=... NAVER_CLIENT_SECRET=... python scripts/fetch_naver.py
ANTHROPIC_API_KEY=... python scripts/gloss.py
```

---

## 7. RSS feeds to confirm (checklist for the next session)

These are referenced in `sources.example.json` / `CLAUDE.md` as candidates
but not yet confirmed to have a real, working feed URL. Five minutes each:
search "[outlet] RSS feed", or check `/feed`, `/rss`, `/feed.xml` on the site.

- [ ] IEEE Spectrum — general feed (not just the Robotics topic feed already confirmed)
- [ ] Ars Technica — AI tag feed
- [ ] MIT Technology Review — AI section feed
- [ ] TinyML Foundation / tinyml.org — any RSS
- [ ] ETRI / KAIST press releases — RSS if one exists, otherwise this stays a manual-check source
- [ ] Any Korean academic-press outlet covering handwriting recognition / OCR specifically (none confirmed yet — currently relying on Naver keyword search alone for this topic)

Once you have a working URL for any of these, add it to `sources.json` with
`"type": "rss"` following the pattern of the existing IEEE Spectrum Robotics
entry — no code changes needed, `fetch_rss.py` picks it up automatically.

---

## 8. What you do NOT need to set up

- **PubMed/NCBI** — deferred on purpose (see CLAUDE.md open decisions). No key needed even when it's added later; E-utilities is keyless for this volume of use.
- **Semantic Scholar** — the `sources.example.json` entries for it are aspirational; no fetch script exists for it yet (arXiv covers most of the same ground for now). Not blocking anything.
- **Google Sheet contributor flow** — still undecided (see CLAUDE.md); the GitHub issue template (`.github/ISSUE_TEMPLATE/source-suggestion.yml`) is the working "suggest a source" path for now.
