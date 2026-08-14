#!/usr/bin/env python3
"""Fetch Naver News Search results for every naver-provider source in
sources.json and write them into the _news/ collection.

As of ~July 2026 this API moved from the old Naver Developers Center to
NAVER API HUB, hosted on Naver Cloud Platform (NCP) — different auth headers
(X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY, not the old X-Naver-Client-Id/
Secret) and a different endpoint. Registration now requires an NCP account
(real-name verification + a payment method on file) — see SETUP.md § 2 for
why, and for the tradeoff Aaron weighed before deciding to proceed anyway.

Requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET env vars (still using these
names for continuity with the rest of this repo — they now hold the NCP
Client ID/Secret, not the old Developers Center ones). Stdlib only.

NOTE ON CONFIDENCE: the endpoint path below (`/search/v1/news`) is inferred
by pattern from NAVER API HUB's confirmed Knowledge-iN endpoint
(`/search/v1/kin`), not copied from a literal documented news example — the
official docs didn't show one. High confidence, not yet verified against a
real key. If this 404s, check the NCP console's own API Hub documentation
(needs login) for the exact path and adjust NEWS_ENDPOINT below.
"""
import datetime
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT, dated_dir, load_sources, slugify, write_entry

ENTRIES_PER_SOURCE = int(os.environ.get("ENTRIES_PER_SOURCE", "8"))
NEWS_DIR = os.path.join(REPO_ROOT, "_news")
TAG_RE = re.compile(r"<[^>]+>")

# NAVER API HUB base — see module docstring re: confidence on the news path.
NEWS_ENDPOINT = "https://naverapihub.apigw.ntruss.com/search/v1/news"


def strip_tags(s):
    return html.unescape(TAG_RE.sub("", s or "")).strip()


def fetch_naver(query, client_id, client_secret, display):
    url = (
        f"{NEWS_ENDPOINT}?query={urllib.parse.quote(query)}"
        f"&display={display}&start=1&sort=date&format=json"
    )
    req = urllib.request.Request(url, headers={
        "X-NCP-APIGW-API-KEY-ID": client_id,
        "X-NCP-APIGW-API-KEY": client_secret,
        "User-Agent": "scientia-ai-fetch/1.0",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())


def parse_naver_date(raw):
    # Naver returns RFC 822 dates, e.g. "Fri, 14 Aug 2026 09:00:00 +0900"
    import email.utils
    try:
        return email.utils.parsedate_to_datetime(raw).date().isoformat()
    except (TypeError, ValueError):
        return datetime.date.today().isoformat()


def main():
    client_id = os.environ.get("NAVER_CLIENT_ID")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not set — skipping. See SETUP.md.")
        return

    sources, source_file = load_sources()
    naver_sources = [
        s for s in sources
        if s.get("provider") == "naver" and s.get("enabled", True)
    ]
    print(f"Loaded {len(naver_sources)} Naver sources from {source_file}")

    total_written = 0
    for source in naver_sources:
        print(f"  fetching {source['id']} ...")
        try:
            data = fetch_naver(source["query"], client_id, client_secret, ENTRIES_PER_SOURCE)
        except Exception as exc:  # noqa: BLE001
            print(f"    ! failed: {exc}")
            continue

        written_here = 0
        for item in data.get("items", []):
            title = strip_tags(item.get("title"))
            link = item.get("originallink") or item.get("link")
            date = parse_naver_date(item.get("pubDate"))
            if not title or not link:
                continue
            fm = {
                "title": title,
                "source": source["label"],
                "source_lang": "ko",
                "source_url": link,
                "topic": source.get("topic"),
                "tags": source.get("tags", []),
                "date": date,
                "thumb": None,
            }
            if "low-cost-embedded" in source.get("tags", []):
                fm["embedded"] = True
            if "health-flourishing" in source.get("tags", []):
                fm["health_flourishing"] = True
            if "ai-education" in source.get("tags", []):
                fm["ai_education"] = True

            stem = slugify(title)
            target_dir = dated_dir(NEWS_DIR, date)
            if write_entry(target_dir, stem, fm, dedup_key=link, dedup_scan_root=NEWS_DIR):
                written_here += 1
        print(f"    +{written_here} new")
        total_written += written_here

    print(f"Done. {total_written} new news entries written to _news/")


if __name__ == "__main__":
    main()
