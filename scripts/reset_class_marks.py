#!/usr/bin/env python3
"""Resets marked_for_class back to false on every _research entry — "This
week's set" on the reading list page is meant to start empty each week, not
accumulate forever. Research only: News now uses the personal bookmark
system instead (a bookmark icon on news rows, localStorage-backed) — see
CLAUDE.md "Reading list page" for why the two collections split this way.

Runs as a step in digest.yml, right after send_digest.py — the digest email
is the record of what was marked before the reset, so nothing is lost, and
Aaron can also fire this on demand via that workflow's workflow_dispatch
trigger (Actions tab -> Weekly digest -> Run workflow) as a manual reset.
Stdlib only.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT


def main():
    d = os.path.join(REPO_ROOT, "_research")
    reset = 0
    for root, _dirs, files in os.walk(d):
        for name in files:
            if not name.endswith(".md"):
                continue
            path = os.path.join(root, name)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            new_text, n = re.subn(
                r"^marked_for_class: true$", "marked_for_class: false", text, count=1, flags=re.MULTILINE
            )
            if n:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_text)
                reset += 1
    print(f"Reset marked_for_class on {reset} entr{'y' if reset == 1 else 'ies'}.")


if __name__ == "__main__":
    main()
