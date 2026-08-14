#!/usr/bin/env python3
"""Fetch recent items from every RSS source in sources.json and write them
into the _news/ Jekyll collection. Picks up a real thumbnail only if the feed
actually supplies one (media:thumbnail or enclosure) — never fabricates one,
per CLAUDE.md's no-forced-thumbnails rule.

Stdlib only. Safe to re-run — dedups on the item link via lib.write_entry.
"""
import datetime
import email.utils
import os
import sys
import urllib.request
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT, dated_dir, load_sources, slugify, write_entry

MEDIA_NS = "{http://search.yahoo.com/mrss/}"
ENTRIES_PER_SOURCE = int(os.environ.get("ENTRIES_PER_SOURCE", "8"))
NEWS_DIR = os.path.join(REPO_ROOT, "_news")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "scientia-ai-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def parse_date(raw):
    if not raw:
        return datetime.date.today().isoformat()
    try:
        return email.utils.parsedate_to_datetime(raw).date().isoformat()
    except (TypeError, ValueError):
        return datetime.date.today().isoformat()


def parse_items(xml_bytes, limit):
    root = ET.fromstring(xml_bytes)
    channel = root.find("channel")
    items = channel.findall("item") if channel is not None else root.findall(f"{{}}entry")
    for item in items[:limit]:
        title = " ".join((item.findtext("title") or "").split())
        link = (item.findtext("link") or "").strip()
        date = parse_date(item.findtext("pubDate"))
        thumb = None
        media_thumb = item.find(f"{MEDIA_NS}thumbnail")
        if media_thumb is not None:
            thumb = media_thumb.get("url")
        if not thumb:
            enclosure = item.find("enclosure")
            if enclosure is not None and (enclosure.get("type") or "").startswith("image"):
                thumb = enclosure.get("url")
        if not title or not link:
            continue
        yield {"title": title, "link": link, "date": date, "thumb": thumb}


def main():
    sources, source_file = load_sources()
    rss_sources = [
        s for s in sources
        if s.get("type") == "rss" and s.get("enabled", True)
    ]
    print(f"Loaded {len(rss_sources)} RSS sources from {source_file}")

    total_written = 0
    for source in rss_sources:
        print(f"  fetching {source['id']} ...")
        try:
            xml_bytes = fetch(source["endpoint"])
        except Exception as exc:  # noqa: BLE001
            print(f"    ! failed: {exc}")
            continue

        written_here = 0
        for item in parse_items(xml_bytes, ENTRIES_PER_SOURCE):
            fm = {
                "title": item["title"],
                "source": source["label"],
                "source_lang": source["lang"],
                "source_url": item["link"],
                "topic": source.get("topic"),
                "tags": source.get("tags", []),
                "date": item["date"],
                "thumb": item["thumb"],
            }
            if "low-cost-embedded" in source.get("tags", []):
                fm["embedded"] = True
            if "health-flourishing" in source.get("tags", []):
                fm["health_flourishing"] = True
            if "ai-education" in source.get("tags", []):
                fm["ai_education"] = True

            stem = slugify(item["title"])
            target_dir = dated_dir(NEWS_DIR, item["date"])
            if write_entry(target_dir, stem, fm, dedup_key=item["link"], dedup_scan_root=NEWS_DIR):
                written_here += 1
        print(f"    +{written_here} new")
        total_written += written_here

    print(f"Done. {total_written} new news entries written to _news/")


if __name__ == "__main__":
    main()
