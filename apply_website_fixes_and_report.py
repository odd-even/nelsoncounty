#!/usr/bin/env python3
"""
Apply website fixes per WEBSITE_COLUMN_ADVISORY_REPORT (lines 181-191):
1. Five market/deli with Ashley's URL -> blank
2. IGA URL on Ike's, Indian Oven, Mac's -> blank
3. Subway URL on Williams Grocery, Ann's -> blank
4. Single Airbnb room URL on four properties -> blank
5. Generic airbnb.com on five listings -> blank
6. nelsoncounty.com -> blank

Output: WEBSITE_FIXES_BEFORE_AFTER_REPORT.txt and update CSV.
"""

import csv
from datetime import datetime

CSV_PATH = "CSV/final_listings_PERFECT.csv"
REPORT_PATH = "WEBSITE_FIXES_BEFORE_AFTER_REPORT.txt"

# Slugs to set website to blank (per advisory)
SLUGS_TO_FIX = {
    # 1. Markets & Delis - five that had Ashley's URL
    "chicken-coop",
    "colleen-deli",
    "corner-market",
    "graves-grocery-deli",
    "hickmans-exxon-grocery",
    # 2. IGA URL on wrong listings (keep on iga-blue-ridge-grocery)
    "ikes-market-deli",
    "indian-oven",
    "macs-country-store",
    # 3. Subway URL on wrong listings (keep on subway)
    "williams-grocery",
    "anns-family-restaurant",
    # 4. Single Airbnb room on four different properties
    "crestvue-cottage",
    "three-springs-myndus",
    "sunset-vista-villa",
    "nectar-landing",
    # 5. Generic airbnb.com on five listings
    "home-on-the-ridge",
    "wake-in-the-clouds",
    "woodland-hideaway",
    "ski-house",
    "1566-vistas-condo",
    # 6. nelsoncounty.com
    "montebello-nature-trail",
    "north-fork-of-the-piney-river",
    "marigold-on-the-mountain",
    "goldfinch",
}

def main():
    changes = []  # (name, slug, before, after)
    rows_out = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            slug = (row.get("slug") or "").strip()
            if slug in SLUGS_TO_FIX:
                before = (row.get("website") or "").strip()
                changes.append((row.get("name") or "", slug, before, ""))
                row["website"] = ""
            rows_out.append(row)

    # Write updated CSV
    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows_out)

    # Build report
    lines = [
        "=" * 80,
        "WEBSITE FIXES — BEFORE AND AFTER REPORT",
        "=" * 80,
        "",
        "Applied per WEBSITE_COLUMN_ADVISORY_REPORT.txt (lines 181-191):",
        "  1. Five market/deli (Ashley's URL wrong) -> blank",
        "  2. IGA URL on Ike's, Indian Oven, Mac's -> blank",
        "  3. Subway URL on Williams Grocery, Ann's -> blank",
        "  4. Single Airbnb room on four properties -> blank",
        "  5. Generic airbnb.com on five listings -> blank",
        "  6. nelsoncounty.com -> blank",
        "",
        f"File updated: {CSV_PATH}",
        f"Total changes: {len(changes)}",
        "",
        "=" * 80,
        "BEFORE | AFTER (each change)",
        "=" * 80,
        "",
    ]
    for i, (name, slug, before, after) in enumerate(changes, 1):
        lines.append(f"{i}. {name}")
        lines.append(f"   Slug: {slug}")
        lines.append(f"   Before: {before or '(empty)'}")
        lines.append(f"   After:  {after or '(blank)'}")
        lines.append("")

    lines.append("=" * 80)
    lines.append("END OF REPORT")
    lines.append("=" * 80)

    report_text = "\n".join(lines)
    with open(REPORT_PATH, "w", encoding="utf-8") as out:
        out.write(report_text)
    print(report_text)
    print(f"\nReport written to {REPORT_PATH}")
    print(f"CSV updated: {CSV_PATH}")

if __name__ == "__main__":
    main()
