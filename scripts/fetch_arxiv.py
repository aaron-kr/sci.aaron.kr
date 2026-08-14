#!/usr/bin/env python3
"""Fetch recent arXiv papers for every arxiv-provider source in sources.json
and write them into the _research/ Jekyll collection.

Stdlib only. Safe to re-run — dedups on arXiv ID via lib.write_entry.
See CLAUDE.md → "Build pipeline" and SETUP.md.
"""
import datetime
import os
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT, dated_dir, load_sources, slugify, write_entry

ATOM_NS = "{http://www.w3.org/2005/Atom}"
ENTRIES_PER_SOURCE = int(os.environ.get("ENTRIES_PER_SOURCE", "5"))
RESEARCH_DIR = os.path.join(REPO_ROOT, "_research")


def build_url(source, n):
    if source["type"] == "api":
        base = source["endpoint"]
        sep = "&" if "?" in base else "?"
        if "max_results=" not in base:
            base = f"{base}{sep}max_results={n}"
        return base
    if source["type"] == "keyword" and source.get("provider") == "arxiv":
        q = urllib.parse.quote(source["query"])
        return (
            "http://export.arxiv.org/api/query"
            f"?search_query={q}&sortBy=submittedDate&sortOrder=descending&max_results={n}"
        )
    raise ValueError(f"Not an arXiv source: {source['id']}")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "scientia-ai-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def parse_entries(xml_bytes):
    root = ET.fromstring(xml_bytes)
    for entry in root.findall(f"{ATOM_NS}entry"):
        arxiv_id = entry.findtext(f"{ATOM_NS}id", "").strip()
        title = " ".join(entry.findtext(f"{ATOM_NS}title", "").split())
        published = entry.findtext(f"{ATOM_NS}published", "")[:10]
        if not arxiv_id or not title:
            continue
        yield {"arxiv_id": arxiv_id, "title": title, "date": published}


def main():
    sources, source_file = load_sources()
    arxiv_sources = [
        s for s in sources
        if s.get("provider") == "arxiv" and s.get("enabled", True)
    ]
    print(f"Loaded {len(arxiv_sources)} arXiv sources from {source_file}")

    total_written = 0
    for source in arxiv_sources:
        url = build_url(source, ENTRIES_PER_SOURCE)
        print(f"  fetching {source['id']} ...")
        try:
            xml_bytes = fetch(url)
        except Exception as exc:  # noqa: BLE001 — log and keep going, one bad feed shouldn't kill the run
            print(f"    ! failed: {exc}")
            continue

        written_here = 0
        for item in parse_entries(xml_bytes):
            fm = {
                "title_en": item["title"],
                "source": source["label"],
                "source_lang": "en",
                "source_url": item["arxiv_id"],
                "topic": source["topic"],
                "tags": source.get("tags", []),
                "date": item["date"] or datetime.date.today().isoformat(),
            }
            if "low-cost-embedded" in source.get("tags", []):
                fm["embedded"] = True
            if "health-flourishing" in source.get("tags", []):
                fm["health_flourishing"] = True

            entry_date = item["date"] or datetime.date.today().isoformat()
            stem = slugify(item["title"])
            target_dir = dated_dir(RESEARCH_DIR, entry_date)
            if write_entry(target_dir, stem, fm, dedup_key=item["arxiv_id"], dedup_scan_root=RESEARCH_DIR):
                written_here += 1
        print(f"    +{written_here} new")
        total_written += written_here

    print(f"Done. {total_written} new research entries written to _research/")


if __name__ == "__main__":
    main()
