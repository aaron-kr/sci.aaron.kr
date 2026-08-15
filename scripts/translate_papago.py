#!/usr/bin/env python3
"""Fills in hook_en / hook_ko as a literal Papago translation of the title —
not an LLM paraphrase. A title is a few words; translating it isn't the
copyright/paraphrase concern the content rules are about (that's for Aaron's
own summary of the body). This replaced an earlier Anthropic-Haiku version of
this step — Papago is free at this volume and literal translation is actually
more honest for a title than an LLM-generated "hook". See CLAUDE.md → "Where
commentary lives" and SETUP.md § Papago.

As of ~July 2026 Papago Translation moved to Naver Cloud Platform (NCP) — see
fetch_naver.py's docstring for the full context (new auth headers, NCP
account with real-name verification + payment method required). Confirmed
endpoint and header names for this one (unlike the news search path, which
is inferred by pattern) — found a literal documented example.

Requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET — same NCP application as
fetch_naver.py, just a different registered service on it. Stdlib only.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

MAX_PER_RUN = int(os.environ.get("TRANSLATE_MAX_PER_RUN", "60"))
PAPAGO_URL = "https://papago.apigw.ntruss.com/nmt/v1/translation"


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
        return None, None, text
    return m.group(1), m.group(2), text


def field(fm_text, key):
    m = re.search(rf'^{key}: "?(.*?)"?$', fm_text, re.MULTILINE)
    if not m:
        return None
    # the regex captures the raw YAML-escaped text between the quotes (e.g.
    # a literal title containing a quote is stored as \"); unescape here so
    # every caller works with the true string — write_hooks()'s esc() is the
    # only place re-escaping should happen, once, on the way back out.
    return m.group(1).replace('\\"', '"').replace("\\\\", "\\")


def needs_translation(fm_text):
    title = field(fm_text, "title_en") or field(fm_text, "title")
    return field(fm_text, "hook_en") == "" and title


def papago_translate(client_id, client_secret, text, source, target):
    body = urllib.parse.urlencode({"source": source, "target": target, "text": text}).encode("utf-8")
    req = urllib.request.Request(PAPAGO_URL, data=body, headers={
        "X-NCP-APIGW-API-KEY-ID": client_id,
        "X-NCP-APIGW-API-KEY": client_secret,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        payload = json.loads(resp.read())
    return payload["message"]["result"]["translatedText"]


def write_hooks(path, raw_text, hook_en, hook_ko):
    def esc(s):
        return s.replace("\\", "\\\\").replace('"', '\\"')
    new_text = re.sub(r'^hook_en: ".*"$', f'hook_en: "{esc(hook_en)}"', raw_text, count=1, flags=re.MULTILINE)
    new_text = re.sub(r'^hook_ko: ".*"$', f'hook_ko: "{esc(hook_ko)}"', new_text, count=1, flags=re.MULTILINE)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)


def main():
    client_id = os.environ.get("NAVER_CLIENT_ID")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not set — skipping. See SETUP.md.")
        return

    done = 0
    for path in find_entries():
        if done >= MAX_PER_RUN:
            print(f"Hit TRANSLATE_MAX_PER_RUN={MAX_PER_RUN}, stopping for this run.")
            break
        fm_text, _, raw_text = read_front_matter(path)
        if fm_text is None or not needs_translation(fm_text):
            continue

        title = field(fm_text, "title_en") or field(fm_text, "title")
        source_lang = field(fm_text, "source_lang") or "en"
        try:
            if source_lang == "ko":
                hook_ko = title
                hook_en = papago_translate(client_id, client_secret, title, "ko", "en")
            else:
                hook_en = title
                hook_ko = papago_translate(client_id, client_secret, title, "en", "ko")
            write_hooks(path, raw_text, hook_en, hook_ko)
            print(f"  translated {os.path.basename(path)}")
            done += 1
            time.sleep(0.1)
        except Exception as exc:  # noqa: BLE001 — one bad entry shouldn't kill the run
            print(f"  ! failed on {os.path.basename(path)}: {exc}")

    print(f"Done. {done} entries translated this run.")


if __name__ == "__main__":
    main()
