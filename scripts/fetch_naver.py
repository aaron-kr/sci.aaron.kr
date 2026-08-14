#!/usr/bin/env python3
"""Fetch Naver News Search results for every naver-provider source in
sources.json and write them into the _news/ collection.

Requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET env vars — register a free app
at developers.naver.com first. See SETUP.md. Stdlib only.
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


def strip_tags(s):
    return html.unescape(TAG_RE.sub("", s or "")).strip()


def fetch_naver(query, client_id, client_secret, display):
    url = (
        "https://openapi.naver.com/v1/search/news.json"
        f"?query={urllib.parse.quote(query)}&display={display}&sort=date"
    )
    req = urllib.request.Request(url, headers={
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
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

            stem = slugify(title)
            target_dir = dated_dir(NEWS_DIR, date)
            if write_entry(target_dir, stem, fm, dedup_key=link, dedup_scan_root=NEWS_DIR):
                written_here += 1
        print(f"    +{written_here} new")
        total_written += written_here

    print(f"Done. {total_written} new news entries written to _news/")


if __name__ == "__main__":
    main()
