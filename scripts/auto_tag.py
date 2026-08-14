#!/usr/bin/env python3
"""Fine-grained auto-tagging via Claude Haiku — picks 0-4 short tags from a
title (e.g. "humanoids", "manipulation", "ocr") to save Aaron hand-tagging
every entry. Separate from translate_papago.py (which handles hook_en/hook_ko)
because tagging needs actual judgment, not translation — that's worth an LLM
call, translation isn't. See CLAUDE.md → "Automation vs. manual".

Cheap: one short title in, a handful of tag words out, per entry. Requires
ANTHROPIC_API_KEY. Capped at AUTO_TAG_MAX_PER_RUN per run. Stdlib only (raw
HTTPS call, no `anthropic` package dependency).
"""
import json
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

MODEL = "claude-haiku-4-5"
MAX_PER_RUN = int(os.environ.get("AUTO_TAG_MAX_PER_RUN", "60"))
API_URL = "https://api.anthropic.com/v1/messages"

# Not an enforced enum — a steer, so the model reuses existing vocabulary
# instead of inventing a slightly-different tag every run.
KNOWN_TAGS = [
    "humanoids", "manipulation", "locomotion", "navigation", "benchmark",
    "dataset", "multi-agent", "autonomous-driving", "ocr", "handwriting",
    "historical-documents", "document-parsing", "biomedical", "clinical",
    "reasoning", "training-efficiency", "evaluation", "industry", "policy",
]

SYSTEM_PROMPT = (
    "You tag research paper / news titles for a reading log. Given a title, "
    "reply with ONLY a JSON array of 0-4 short kebab-case tags, e.g. "
    '["humanoids", "manipulation"]. Prefer reusing one of these existing tags '
    f"when it genuinely fits: {', '.join(KNOWN_TAGS)}. Only invent a new tag "
    "if none of these fit and the title has a clear, specific topic. Return "
    "[] if nothing beyond the obvious applies — don't force tags onto a title "
    "that doesn't warrant them."
)


def find_entries():
    for coll_dir in ("_research", "_news"):
        d = os.path.join(REPO_ROOT, coll_dir)
        if not os.path.isdir(d):
            continue
        for root, _dirs, files in os.walk(d):
            for name in sorted(files):
                if name.endswith(".md"):
                    yield os.path.join(root, name)


def read_front_matter(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
    if not m:
        return None, text
    return m.group(1), text


def field(fm_text, key):
    m = re.search(rf'^{key}: "?(.*?)"?$', fm_text, re.MULTILINE)
    return m.group(1) if m else None


def needs_tagging(fm_text):
    tags_line = re.search(r"^tags: \[(.*)\]$", fm_text, re.MULTILINE)
    already_tagged = bool(tags_line and tags_line.group(1).strip())
    title = field(fm_text, "title_en") or field(fm_text, "title")
    return not already_tagged and title


def call_claude(api_key, title):
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 100,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": f'Title: "{title}"'}],
    }).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, headers={
        "content-type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read())
    text = payload["content"][0]["text"].strip()
    tags = json.loads(text)
    return [t for t in tags if isinstance(t, str)][:4]


def write_tags(path, raw_text, tags):
    tag_str = ", ".join(f'"{t}"' for t in tags)
    new_text = re.sub(r"^tags: \[.*\]$", f"tags: [{tag_str}]", raw_text, count=1, flags=re.MULTILINE)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY not set — skipping. See SETUP.md.")
        return

    done = 0
    for path in find_entries():
        if done >= MAX_PER_RUN:
            print(f"Hit AUTO_TAG_MAX_PER_RUN={MAX_PER_RUN}, stopping for this run.")
            break
        fm_text, raw_text = read_front_matter(path)
        if fm_text is None or not needs_tagging(fm_text):
            continue

        title = field(fm_text, "title_en") or field(fm_text, "title")
        try:
            tags = call_claude(api_key, title)
            write_tags(path, raw_text, tags)
            print(f"  tagged {os.path.basename(path)}: {tags}")
            done += 1
            time.sleep(0.2)
        except Exception as exc:  # noqa: BLE001 — one bad entry shouldn't kill the run
            print(f"  ! failed on {os.path.basename(path)}: {exc}")

    print(f"Done. {done} entries tagged this run.")


if __name__ == "__main__":
    main()
