#!/usr/bin/env python3
"""
Apply RECOMMEND ADD from AMENITIES_MISSED_RECOMMENDATIONS.txt to final_listings CSV.
Only APPEND new amenities; never remove or change existing ones.
"""
import csv
import re

REPORT_PATH = "CSV/AMENITIES_MISSED_RECOMMENDATIONS.txt"
CSV_PATH = "CSV/final_listings_PERFECT_br_cleaned.csv"


def parse_recommend_add():
    """Parse RECOMMEND ADD section: slug -> list of amenities to add."""
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
    slug_to_add = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        # Section start: "  [category] slug  (type: ...)"
        m = re.match(r"^\s+\[[\w]+\]\s+([a-z0-9\-]+)\s+\(type:", line)
        if m:
            slug = m.group(1).strip()
            i += 1
            if i < len(lines) and "ADD:" in lines[i]:
                add_line = lines[i].split("ADD:", 1)[1].strip()
                am_list = [a.strip() for a in add_line.split(",") if a.strip()]
                slug_to_add[slug] = am_list
        elif "SKIP —" in line or line.strip() == "SKIP — Do not add these back; they are activity/nearby descriptors or wrong category.":
            # End of RECOMMEND ADD section (section header only, not "SKIP:" in RULES)
            break
        i += 1
    return slug_to_add


def parse_amenities(s):
    if not s or not isinstance(s, str):
        return []
    return [a.strip() for a in s.split(",") if a.strip()]


def main():
    slug_to_add = parse_recommend_add()
    print(f"Parsed {len(slug_to_add)} listings with recommended amenities to add.")

    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    amenities_col = "amenities"
    updated_count = 0
    for row in rows:
        slug = row.get("slug", "").strip()
        if slug not in slug_to_add:
            continue
        current_raw = row.get(amenities_col) or ""
        current_list = parse_amenities(current_raw)
        current_set = {a for a in current_list}
        to_add = [a for a in slug_to_add[slug] if a not in current_set]
        if not to_add:
            continue
        new_list = current_list + to_add
        row[amenities_col] = ", ".join(new_list)
        updated_count += 1
        print(f"  {slug}: appended {to_add}")

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nDone. Updated {updated_count} listings (append-only; no existing amenities changed).")


if __name__ == "__main__":
    main()
