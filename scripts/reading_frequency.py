#!/usr/bin/env python3
"""Generates _data/reading_frequency.json — a GitHub-commit-style calendar of
days Aaron actually wrote his own summary for an entry (not just fetched it).

"Wrote a summary on day X" = the date of the first git commit where an
entry's body (the text after its front matter) went from empty to non-empty.
Runs as a step in .github/workflows/fetch.yml (needs full git history — see
that workflow's `fetch-depth: 0`) so the calendar is a static, pre-committed
data file: GitHub Pages' classic Jekyll build has no way to run scripts of
its own, only read whatever's already in the repo. Stdlib + git CLI only.

Safe to run locally too (`python scripts/reading_frequency.py`) — reads
whatever git history is present in the current checkout.
"""
import datetime
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

WEEKS = 53
FRONT_MATTER_RE = re.compile(r"^---\n.*?\n---\n?(.*)$", re.DOTALL)


def run(args):
    return subprocess.run(
        args, cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )


def body_nonempty(text):
    m = FRONT_MATTER_RE.match(text)
    body = m.group(1) if m else text
    return len(body.strip()) > 0


def find_entries():
    paths = []
    for coll in ("_research", "_news"):
        d = os.path.join(REPO_ROOT, coll)
        if not os.path.isdir(d):
            continue
        for root, _dirs, files in os.walk(d):
            for name in files:
                if name.endswith(".md"):
                    rel = os.path.relpath(os.path.join(root, name), REPO_ROOT)
                    paths.append(rel.replace(os.sep, "/"))
    return paths


def summary_date(rel_path):
    """First commit date (YYYY-MM-DD, author date) where this file's body
    was already non-empty, walking its history oldest-first. None if the
    file has no history yet (uncommitted) or was never non-empty."""
    log = run(["git", "log", "--format=%H", "--reverse", "--", rel_path])
    if log.returncode != 0:
        return None
    for sha in (s for s in log.stdout.splitlines() if s.strip()):
        show = run(["git", "show", f"{sha}:{rel_path}"])
        if show.returncode != 0:
            continue
        if body_nonempty(show.stdout):
            date_out = run(["git", "show", "-s", "--format=%aI", sha])
            if date_out.returncode == 0 and date_out.stdout.strip():
                return date_out.stdout.strip()[:10]
    return None


def main():
    counts = {}
    for rel_path in find_entries():
        abs_path = os.path.join(REPO_ROOT, rel_path)
        with open(abs_path, encoding="utf-8") as f:
            current = f.read()
        if not body_nonempty(current):
            continue  # no summary written (yet) — nothing to count
        d = summary_date(rel_path)
        if d:
            counts[d] = counts.get(d, 0) + 1

    today = datetime.date.today()
    end_date = today
    while end_date.weekday() != 5:  # advance to the next Saturday (Mon=0..Sun=6)
        end_date += datetime.timedelta(days=1)
    start_date = end_date - datetime.timedelta(days=7 * WEEKS - 1)  # lands on a Sunday

    weeks = []
    d = start_date
    total = 0
    for _w in range(WEEKS):
        week = []
        for _d in range(7):
            future = d > today
            c = 0 if future else counts.get(d.isoformat(), 0)
            level = min(c, 4)
            week.append({"date": d.isoformat(), "count": c, "level": level, "future": future})
            total += c
            d += datetime.timedelta(days=1)
        weeks.append(week)

    streak = 0
    cur = today
    while counts.get(cur.isoformat(), 0) > 0:
        streak += 1
        cur -= datetime.timedelta(days=1)

    data = {"weeks": weeks, "total": total, "streak": streak, "generated": today.isoformat()}
    data_dir = os.path.join(REPO_ROOT, "_data")
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "reading_frequency.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    print(f"Wrote reading frequency data: {total} summaries across {len(counts)} day(s), streak={streak}")


if __name__ == "__main__":
    main()
