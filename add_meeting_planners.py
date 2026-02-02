#!/usr/bin/env python3
"""Add 'Meeting Planners' to amenities for listings that had it in older data."""
import csv

CSV_PATH = "CSV/final_listings_PERFECT_br_cleaned.csv"
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

def main():
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    amenities_col = "amenities"
    updated = []
    for row in rows:
        slug = row.get("slug", "")
        if slug not in SLUGS:
            continue
        current = (row.get(amenities_col) or "").strip()
        if "Meeting Planners" in current:
            continue
        if current:
            row[amenities_col] = current + ", Meeting Planners"
        else:
            row[amenities_col] = "Meeting Planners"
        updated.append((slug, row[amenities_col]))

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    for slug, new_amenities in updated:
        print(f"  {slug}: amenities -> ...{new_amenities[-80:]}")
    print(f"\nUpdated {len(updated)} listings with 'Meeting Planners'.")

if __name__ == "__main__":
    main()
