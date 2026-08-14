#!/usr/bin/env python3
"""Simple story clustering for _news/ — groups entries that look like the same
story within a ~48h window, using word-overlap on hook_en (so Korean and
English entries can be compared on common ground once translate_papago.py has
run). Sets coverage_en / coverage_ko / gap on every entry in a cluster of 2+;
solo entries are left alone (coverage_en/ko stay null — no clutter for the
common case of a single-source item). See CLAUDE.md → "Story clustering".

Deliberately simple (keyword overlap, not real NLP/embedding clustering) per
the original design note: start simple, don't over-engineer. Stdlib only.
Re-run safe — always recomputed fresh from current entries, not incremental.
"""
import datetime
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

NEWS_DIR = os.path.join(REPO_ROOT, "_news")
WINDOW_HOURS = 48
JACCARD_THRESHOLD = 0.3

STOPWORDS = {
    "a", "an", "the", "of", "for", "to", "in", "on", "with", "and", "or",
    "is", "are", "at", "by", "from", "as", "its", "new", "how", "why",
    "what", "this", "that", "after", "over", "into", "amid",
}


def read_front_matter(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    return (m.group(1) if m else ""), text


def field(fm_text, key):
    m = re.search(rf'^{key}: "?(.*?)"?$', fm_text, re.MULTILINE)
    return m.group(1) if m else None


def tokenize(text):
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


MIN_TOKENS = 3  # below this, one shared word (e.g. an org name) gives a misleading jaccard of 1.0


def jaccard(a, b):
    if len(a) < MIN_TOKENS or len(b) < MIN_TOKENS:
        return 0.0
    return len(a & b) / len(a | b)


def load_entries():
    entries = []
    for root, _dirs, files in os.walk(NEWS_DIR):
        for name in sorted(files):
            if not name.endswith(".md"):
                continue
            path = os.path.join(root, name)
            fm_text, raw_text = read_front_matter(path)
            date = field(fm_text, "date")
            if not date:
                continue
            hook_en = field(fm_text, "hook_en") or ""
            title = field(fm_text, "title") or field(fm_text, "title_en") or ""
            tokens = tokenize(hook_en) or tokenize(title)
            entries.append({
                "path": path,
                "raw_text": raw_text,
                "date": datetime.date.fromisoformat(date),
                "source_lang": field(fm_text, "source_lang"),
                "tokens": tokens,
            })
    return entries


def cluster(entries):
    clusters = []  # list of lists of entry indices
    assigned = {}
    for i, e in enumerate(entries):
        best_cluster = None
        for c_idx, members in enumerate(clusters):
            for j in members:
                other = entries[j]
                if abs((e["date"] - other["date"]).days) * 24 > WINDOW_HOURS:
                    continue
                if jaccard(e["tokens"], other["tokens"]) >= JACCARD_THRESHOLD:
                    best_cluster = c_idx
                    break
            if best_cluster is not None:
                break
        if best_cluster is not None:
            clusters[best_cluster].append(i)
        else:
            clusters.append([i])
        assigned[i] = best_cluster if best_cluster is not None else len(clusters) - 1
    return clusters


def write_coverage(path, raw_text, coverage_en, coverage_ko, gap):
    def sub(field_name, value):
        return re.sub(
            rf'^{field_name}: .*$',
            f'{field_name}: {value if value is not None else "null"}',
            raw_text_local[0],
            count=1,
            flags=re.MULTILINE,
        )
    raw_text_local = [raw_text]
    raw_text_local[0] = sub("coverage_en", coverage_en)
    raw_text_local[0] = sub("coverage_ko", coverage_ko)
    gap_str = f'"{gap}"' if gap else "null"
    raw_text_local[0] = re.sub(r"^gap: .*$", f"gap: {gap_str}", raw_text_local[0], count=1, flags=re.MULTILINE)
    with open(path, "w", encoding="utf-8") as f:
        f.write(raw_text_local[0])


def main():
    entries = load_entries()
    clusters = cluster(entries)

    # Recomputed fresh every run: an entry whose cluster shrank to a solo
    # story since the last run must have its stale coverage/gap cleared, not
    # just entries that are newly clustered.
    updated = 0
    for members in clusters:
        if len(members) < 2:
            e = entries[members[0]]
            write_coverage(e["path"], e["raw_text"], None, None, None)
            continue
        en_count = sum(1 for i in members if entries[i]["source_lang"] == "en")
        ko_count = sum(1 for i in members if entries[i]["source_lang"] == "ko")
        gap = "ko_only" if en_count == 0 else ("en_only" if ko_count == 0 else None)
        for i in members:
            e = entries[i]
            write_coverage(e["path"], e["raw_text"], en_count or None, ko_count or None, gap)
            updated += 1

    print(f"Clustered {len(entries)} news entries into {len(clusters)} clusters; updated {updated} with coverage metadata.")


if __name__ == "__main__":
    main()
