#!/usr/bin/env python3
"""Fills in hook_en / hook_ko for any collection entry that doesn't have one
yet — a single translated sentence per language, NOT a summary. Aaron writes
the real summary himself in the entry's markdown body; this script only
generates the short hook that acts as a bilingual "is this worth a click"
signal. See CLAUDE.md → "Content rules" and README.md.

Uses Claude Haiku (cheap, fast) — a run over ~40 entries costs a fraction of
a cent. Requires ANTHROPIC_API_KEY. Stdlib only (raw HTTPS call, no `anthropic`
package dependency) so CI doesn't need an extra pip install step.
"""
import json
import os
import re
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

MODEL = "claude-haiku-4-5-20251001"
MAX_PER_RUN = int(os.environ.get("GLOSS_MAX_PER_RUN", "40"))
API_URL = "https://api.anthropic.com/v1/messages"

SYSTEM_PROMPT = (
    "You write a single-sentence bilingual hook for a research/news reading log. "
    "Given a title (and which language it's originally in), reply with ONLY a JSON object: "
    '{"hook_en": "...", "hook_ko": "..."}. '
    "Each hook is ONE plain factual sentence (12-25 words), not a summary, not clickbait, "
    "no emoji, no quotation marks around the whole sentence. "
    "hook_en and hook_ko must say the same thing in English and Korean respectively — "
    "if the title is already in one of those languages, that language's hook is a natural "
    "restatement of the title, and the other language's hook is a translation of it."
)


def find_entries():
    for coll_dir in ("_research", "_news"):
        d = os.path.join(REPO_ROOT, coll_dir)
        if not os.path.isdir(d):
            continue
        for name in sorted(os.listdir(d)):
            if name.endswith(".md"):
                yield os.path.join(d, name)


def read_front_matter(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.DOTALL)
    if not m:
        return None, None, text
    return m.group(1), m.group(2), text


def field(fm_text, key):
    m = re.search(rf'^{key}: "?(.*?)"?$', fm_text, re.MULTILINE)
    return m.group(1) if m else None


def needs_hook(fm_text):
    return field(fm_text, "hook_en") == "" and (field(fm_text, "title_en") or field(fm_text, "title"))


def call_claude(api_key, title, source_lang):
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 300,
        "system": SYSTEM_PROMPT,
        "messages": [{
            "role": "user",
            "content": f'Title (originally in {"English" if source_lang == "en" else "Korean"}): "{title}"',
        }],
    }).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, headers={
        "content-type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read())
    text = payload["content"][0]["text"].strip()
    return json.loads(text)


def write_hooks(path, raw_text, hook_en, hook_ko):
    def esc(s):
        return s.replace("\\", "\\\\").replace('"', '\\"')
    new_text = re.sub(r'^hook_en: ".*"$', f'hook_en: "{esc(hook_en)}"', raw_text, count=1, flags=re.MULTILINE)
    new_text = re.sub(r'^hook_ko: ".*"$', f'hook_ko: "{esc(hook_ko)}"', new_text, count=1, flags=re.MULTILINE)
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
            print(f"Hit GLOSS_MAX_PER_RUN={MAX_PER_RUN}, stopping for this run.")
            break
        fm_text, _, raw_text = read_front_matter(path)
        if fm_text is None or not needs_hook(fm_text):
            continue

        title = field(fm_text, "title_en") or field(fm_text, "title")
        source_lang = field(fm_text, "source_lang") or "en"
        try:
            result = call_claude(api_key, title, source_lang)
            write_hooks(path, raw_text, result["hook_en"], result["hook_ko"])
            print(f"  hooked {os.path.basename(path)}")
            done += 1
            time.sleep(0.3)  # gentle pacing, not required by the API but costs nothing
        except Exception as exc:  # noqa: BLE001 — one bad entry shouldn't kill the run
            print(f"  ! failed on {os.path.basename(path)}: {exc}")

    print(f"Done. {done} entries hooked this run.")


if __name__ == "__main__":
    main()
