#!/usr/bin/env python3
"""Compare amenities for the 12 'Meeting Planners' listings: older CSV vs current final. Report only."""
import csv
import os

SLUGS = [
    "afton-mountain-vineyards",
    "blue-mountain-brewery",
    "blue-toad-hard-cider",
    "bold-rock-hard-cider",
    "cardinal-point-winery",
    "devils-backbone-brewing-company",
    "love-ridge-mountain-lodging",
    "mountain-and-vine-winery",
    "mountain-cove-vineyards-winery",
    "veritas-vineyards-winery",
    "wild-man-dan-brewery",
    "wintergreen-resort-2",
]

CURRENT_CSV = "CSV/final_listings_PERFECT_br_cleaned.csv"
# Use an older file that had Meeting Planners for these listings
OLDER_CSVS = [
    "CSV/listings-2026-01-16-2.csv",
    "CSV/listings-2026-01-15.csv",
    "CSV/FINAL I listings-2026-01-11-UPDATED.csv",
]


def parse_amenities(s):
    if not s or not isinstance(s, str):
        return set()
    # Older CSVs use "; " and current uses ", "; accept both
    parts = s.replace(";", ",").split(",")
    return {a.strip() for a in parts if a.strip()}


def load_amenities_by_slug(path, slugs_set):
    by_slug = {}
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if "amenities" not in (reader.fieldnames or []):
            return by_slug
        for row in reader:
            slug = (row.get("slug") or "").strip()
            if slug in slugs_set:
                by_slug[slug] = parse_amenities(row.get("amenities") or "")
    return by_slug


def main():
    slugs_set = set(SLUGS)
    current = load_amenities_by_slug(CURRENT_CSV, slugs_set)

    # Try older files until we get amenities for our slugs
    old_by_slug = {}
    for path in OLDER_CSVS:
        if not os.path.exists(path):
            continue
        old_by_slug = load_amenities_by_slug(path, slugs_set)
        if len(old_by_slug) >= 10:  # enough to be useful
            older_source = path
            break
    else:
        older_source = OLDER_CSVS[0]
        if os.path.exists(older_source):
            old_by_slug = load_amenities_by_slug(older_source, slugs_set)
        else:
            old_by_slug = {}

    lines = []
    lines.append("AMENITIES DIFF REPORT: Meeting-Planners listings (older vs current)")
    lines.append("=" * 72)
    lines.append(f"Current file: {CURRENT_CSV}")
    lines.append(f"Older file:  {older_source}")
    lines.append("")
    lines.append("For each listing: amenities in OLD but not in CURRENT, then CURRENT but not in OLD.")
    lines.append("(Meeting Planners was re-added to current; other differences are listed below.)")
    lines.append("")

    for slug in SLUGS:
        old_set = old_by_slug.get(slug, set())
        cur_set = current.get(slug, set())
        in_old_not_cur = old_set - cur_set
        in_cur_not_old = cur_set - old_set
        if not in_old_not_cur and not in_cur_not_old:
            lines.append(f"  {slug}")
            lines.append("    No other differences.")
            lines.append("")
            continue
        lines.append(f"  {slug}")
        if in_old_not_cur:
            lines.append("    In OLD, not in CURRENT: " + ", ".join(sorted(in_old_not_cur)))
        if in_cur_not_old:
            lines.append("    In CURRENT, not in OLD: " + ", ".join(sorted(in_cur_not_old)))
        lines.append("")

    out_path = "CSV/MEETING_PLANNERS_LISTINGS_AMENITIES_DIFF_REPORT.txt"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Report written to {out_path}")
    print("\n" + "\n".join(lines))


if __name__ == "__main__":
    main()
