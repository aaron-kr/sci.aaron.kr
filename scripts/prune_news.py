#!/usr/bin/env python3
"""Deletes old _news/ entries that Aaron never bookmarked and never wrote a
summary for — the daily RSS/Naver pull can add dozens of headlines a day,
and most of them are only ever meant to be skimmed once, not archived
forever. Kept regardless of age: anything with a written summary, anything
bookmarked (checked against Firestore's public `bookmarks` collection —
no credentials needed, reads are public by design, see firestore.rules),
and anything flagged commentary_worthy or pinned by hand.

Nothing is ever truly lost — git history keeps deleted files forever, this
only removes them from the working tree / next build. Safe to run by hand
(`python scripts/prune_news.py`) before it's trusted enough to run in
fetch.yml unattended. See CLAUDE.md "News retention" for the reasoning.

Stdlib only. FIREBASE_PROJECT_ID below is not a secret — same reasoning as
assets/js/firebase-config.js, see AUTH_SETUP.md.
"""
import datetime
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

FIREBASE_PROJECT_ID = "scientia-ai-aaronkr"
RETENTION_DAYS = int(os.environ.get("NEWS_RETENTION_DAYS", "21"))
NEWS_DIR = os.path.join(REPO_ROOT, "_news")
FRONT_MATTER_RE = re.compile(r"^---\n(.*?)\n---\n?(.*)$", re.DOTALL)


def field(fm_text, key):
    m = re.search(rf'^{key}: "?(.*?)"?$', fm_text, re.MULTILINE)
    if not m:
        return None
    return m.group(1).replace('\\"', '"').replace("\\\\", "\\")


def fetch_bookmarked_news_hrefs():
    """Every href in Firestore's bookmarks collection with kind == "news" —
    a plain unauthenticated GET, since firestore.rules makes that collection
    publicly readable. Returns an empty set (prune nothing) on any failure,
    since a network hiccup here should never cause data loss."""
    hrefs = set()
    base = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/bookmarks"
    page_token = None
    try:
        while True:
            url = base + "?pageSize=300"
            if page_token:
                url += f"&pageToken={page_token}"
            with urllib.request.urlopen(url, timeout=20) as resp:
                data = json.loads(resp.read())
            for doc in data.get("documents", []):
                f = doc.get("fields", {})
                if f.get("kind", {}).get("stringValue") == "news":
                    href = f.get("href", {}).get("stringValue")
                    if href:
                        hrefs.add(href)
            page_token = data.get("nextPageToken")
            if not page_token:
                break
    except Exception as exc:  # noqa: BLE001 — network/parse issues shouldn't ever delete data
        print(f"  ! couldn't fetch bookmarks ({exc}) — pruning nothing this run")
        return set()
    return hrefs


def should_keep(path, bookmarked_hrefs, cutoff):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = FRONT_MATTER_RE.match(text)
    fm_text, body = (m.group(1), m.group(2)) if m else (text, "")
    if body.strip():
        return True  # Aaron wrote a summary
    if field(fm_text, "commentary_worthy") == "true":
        return True
    pin_priority = field(fm_text, "pin_priority")
    if pin_priority and pin_priority != "null":
        return True
    source_url = field(fm_text, "source_url")
    if source_url and source_url in bookmarked_hrefs:
        return True
    date = field(fm_text, "date")
    if date and date >= cutoff:
        return True  # still within the retention window
    return False


def main():
    bookmarked = fetch_bookmarked_news_hrefs()
    cutoff = (datetime.date.today() - datetime.timedelta(days=RETENTION_DAYS)).isoformat()
    print(f"Retention: {RETENTION_DAYS} days (cutoff {cutoff}), {len(bookmarked)} bookmarked news href(s) exempt")

    removed = 0
    for root, _dirs, files in os.walk(NEWS_DIR):
        for name in files:
            if not name.endswith(".md"):
                continue
            path = os.path.join(root, name)
            if not should_keep(path, bookmarked, cutoff):
                os.remove(path)
                removed += 1
    print(f"Pruned {removed} old, unbookmarked, unsummarized news entr{'y' if removed == 1 else 'ies'}.")


if __name__ == "__main__":
    main()
