#!/usr/bin/env python3
"""Compare amenities for ALL listings: older CSV vs current final. Report amenities that may have been missed (in OLD, not in CURRENT)."""
import csv
import os

CURRENT_CSV = "CSV/final_listings_PERFECT_br_cleaned.csv"
OLDER_CSV = "CSV/listings-2026-01-16-2.csv"


def parse_amenities(s):
    if not s or not isinstance(s, str):
        return set()
    parts = s.replace(";", ",").split(",")
    return {a.strip() for a in parts if a.strip()}


def load_all_amenities_by_slug(path):
    by_slug = {}
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if "amenities" not in (reader.fieldnames or []):
            return by_slug
        for row in reader:
            slug = (row.get("slug") or "").strip()
            if not slug:
                continue
            by_slug[slug] = parse_amenities(row.get("amenities") or "")
    return by_slug


def main():
    current = load_all_amenities_by_slug(CURRENT_CSV)
    if not os.path.exists(OLDER_CSV):
        print(f"Older file not found: {OLDER_CSV}")
        return
    old = load_all_amenities_by_slug(OLDER_CSV)

    # All slugs that appear in current; only report those that also appear in old (so we can diff)
    current_slugs = set(current.keys())
    old_slugs = set(old.keys())
    common_slugs = sorted(current_slugs & old_slugs)
    only_current = current_slugs - old_slugs
    only_old = old_slugs - current_slugs

    lines = []
    lines.append("AMENITIES DIFF REPORT: ALL listings (older vs current) — amenities you may have missed")
    lines.append("=" * 72)
    lines.append(f"Current file: {CURRENT_CSV}")
    lines.append(f"Older file:  {OLDER_CSV}")
    lines.append("")
    lines.append("Listings only in current (not in older file): " + str(len(only_current)))
    if only_current:
        lines.append("  " + ", ".join(sorted(only_current)[:30]) + (" ..." if len(only_current) > 30 else ""))
    lines.append("Listings only in older (not in current): " + str(len(only_old)))
    if only_old:
        lines.append("  " + ", ".join(sorted(only_old)[:30]) + (" ..." if len(only_old) > 30 else ""))
    lines.append("")
    lines.append("Below: for each listing in BOTH files, amenities that were in OLD but are NOT in CURRENT (missed).")
    lines.append("")

    missed_count = 0
    for slug in common_slugs:
        old_set = old[slug]
        cur_set = current[slug]
        in_old_not_cur = old_set - cur_set
        if not in_old_not_cur:
            continue
        missed_count += 1
        lines.append(f"  {slug}")
        lines.append("    MISSED (in OLD, not in CURRENT): " + ", ".join(sorted(in_old_not_cur)))
        lines.append("")

    lines.append("=" * 72)
    lines.append(f"Total listings with at least one missed amenity: {missed_count} of {len(common_slugs)} common listings.")

    out_path = "CSV/ALL_LISTINGS_AMENITIES_MISSED_REPORT.txt"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Report written to {out_path}")
    print(f"Listings with missed amenities: {missed_count}. Full report in {out_path}")


if __name__ == "__main__":
    main()
