#!/usr/bin/env python3
"""Weekly email digest via Resend — the week's pinned/commentary-worthy
entries, sent once. Requires RESEND_API_KEY and DIGEST_TO_EMAIL. See SETUP.md.
("Marked for class" isn't part of this anymore — it moved to Firestore as of
Session 7, see CLAUDE.md; the reading list itself is now the record.)
Stdlib only.
"""
import datetime
import json
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import REPO_ROOT

SITE_URL = "https://sci.aaron.kr"


def read_front_matter(path):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.DOTALL)
    return m.group(1) if m else ""


def field(fm_text, key):
    m = re.search(rf'^{key}: "?(.*?)"?$', fm_text, re.MULTILINE)
    return m.group(1) if m else None


def bool_field(fm_text, key):
    return field(fm_text, key) == "true"


def field_is_set(fm_text, key):
    """True if the field is present and not the YAML null/empty sentinel —
    used for pin_priority, which is an int-or-null, not a bool."""
    v = field(fm_text, key)
    return v not in (None, "null", "")


def collect(coll_dir, kind, since):
    items = []
    d = os.path.join(REPO_ROOT, coll_dir)
    if not os.path.isdir(d):
        return items
    for root, _dirs, files in os.walk(d):  # entries live under year/month subfolders
        for name in sorted(files):
            if not name.endswith(".md"):
                continue
            path = os.path.join(root, name)
            fm = read_front_matter(path)
            date = field(fm, "date")
            if not date or date < since:
                continue
            interesting = (
                field_is_set(fm, "pin_priority")
                or bool_field(fm, "commentary_worthy")
            )
            if not interesting:
                continue
            title = field(fm, "title_en") or field(fm, "title")
            slug = name[:-3]
            url = f"{SITE_URL}/{kind}/{slug}/"
            items.append({"title": title, "url": url, "date": date})
    return items


def build_html(research_items, news_items):
    def rows(items):
        return "".join(f'<li><a href="{i["url"]}">{i["title"]}</a> <span style="color:#888">({i["date"]})</span></li>' for i in items)
    return f"""
    <h2>Scientia AI — weekly digest</h2>
    <h3>Research</h3>
    <ul>{rows(research_items) or '<li>Nothing flagged this week.</li>'}</ul>
    <h3>News</h3>
    <ul>{rows(news_items) or '<li>Nothing flagged this week.</li>'}</ul>
    <p><a href="{SITE_URL}/">View the full log →</a></p>
    """


def send(api_key, to_email, html):
    body = json.dumps({
        "from": "Scientia AI <digest@sci.aaron.kr>",
        "to": [to_email],
        "subject": f"Scientia AI weekly digest — {datetime.date.today().isoformat()}",
        "html": html,
    }).encode("utf-8")
    req = urllib.request.Request("https://api.resend.com/emails", data=body, headers={
        "content-type": "application/json",
        "authorization": f"Bearer {api_key}",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def main():
    api_key = os.environ.get("RESEND_API_KEY")
    to_email = os.environ.get("DIGEST_TO_EMAIL")
    if not api_key or not to_email:
        print("RESEND_API_KEY / DIGEST_TO_EMAIL not set — skipping. See SETUP.md.")
        return

    since = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    research_items = collect("_research", "research", since)
    news_items = collect("_news", "news", since)
    html = build_html(research_items, news_items)

    if not research_items and not news_items:
        print("Nothing flagged this week — sending a short heads-up anyway so the digest stays reliable.")

    send(api_key, to_email, html)
    print(f"Digest sent to {to_email} ({len(research_items)} research, {len(news_items)} news).")


if __name__ == "__main__":
    main()
