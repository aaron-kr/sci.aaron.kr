"""Shared helpers for Scientia AI fetch scripts. Stdlib only — no pip installs
required, on purpose (see CLAUDE.md: keep the fetch pipeline low-maintenance).
"""
import json
import os
import re
import unicodedata

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_sources():
    """Reads sources.json if present, else falls back to sources.example.json
    (so the pipeline is runnable out of the box before Aaron copies the file)."""
    for name in ("sources.json", "sources.example.json"):
        path = os.path.join(REPO_ROOT, name)
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                return json.load(f)["sources"], name
    raise FileNotFoundError("Neither sources.json nor sources.example.json found")


def slugify(text, max_len=70):
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text[:max_len].rstrip("-") or "entry"


def dated_dir(collection_root, date_str):
    """_research or _news -> _research/2026/08, from a YYYY-MM-DD date string.
    Entries are filed by year/month so the archive stays browsable as it grows —
    see CLAUDE.md 'Archive organization'."""
    year, month = date_str[:4], date_str[5:7]
    return os.path.join(collection_root, year, month)


def yaml_str(value):
    """Double-quoted YAML scalar, safe for titles containing colons/quotes."""
    if value is None:
        return "null"
    s = str(value).replace("\\", "\\\\").replace('"', '\\"')
    s = s.replace("\n", " ").strip()
    return f'"{s}"'


def yaml_bool(value):
    return "true" if value else "false"


def yaml_list(items):
    if not items:
        return "[]"
    return "[" + ", ".join(yaml_str(i) for i in items) + "]"


DEFAULT_FRONT_MATTER = {
    "hook_en": "",
    "hook_ko": "",
    "tags": [],
    "embedded": False,
    "health_flourishing": False,
    "coverage_en": None,
    "coverage_ko": None,
    "gap": None,
    "marked_for_class": False,
    "commentary_worthy": False,
    "commentary_url": None,
    "commentary_video_url": None,
    "pin": False,
    "pin_image": None,
    "raw_wire": False,
}


def write_entry(collection_dir, filename_stem, front_matter, body="", dedup_key=None, dedup_scan_root=None):
    """Writes a new collection file unless one with the same dedup_key (checked
    via a lightweight grep of existing files) already exists — keeps re-runs
    idempotent without a separate database. `dedup_scan_root` (e.g. _research/)
    scans the whole collection, not just this entry's year/month folder — a
    story published right at a month boundary must still dedup correctly."""
    os.makedirs(collection_dir, exist_ok=True)
    if dedup_key:
        scan_root = dedup_scan_root or collection_dir
        for root, _dirs, files in os.walk(scan_root):
            for existing in files:
                if not existing.endswith(".md"):
                    continue
                with open(os.path.join(root, existing), encoding="utf-8") as f:
                    if dedup_key in f.read():
                        return False  # already fetched, skip

    fm = dict(DEFAULT_FRONT_MATTER)
    fm.update(front_matter)

    lines = ["---"]
    for key, value in fm.items():
        if isinstance(value, bool):
            lines.append(f"{key}: {yaml_bool(value)}")
        elif isinstance(value, list):
            lines.append(f"{key}: {yaml_list(value)}")
        elif value is None:
            lines.append(f"{key}: null")
        else:
            lines.append(f"{key}: {yaml_str(value)}")
    if dedup_key:
        lines.append(f"dedup_key: {yaml_str(dedup_key)}")
    lines.append("---")
    if body:
        lines.append(body)

    path = os.path.join(collection_dir, f"{filename_stem}.md")
    # avoid filename collisions between unrelated entries
    n = 2
    base_stem = filename_stem
    while os.path.exists(path):
        path = os.path.join(collection_dir, f"{base_stem}-{n}.md")
        n += 1

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return True
