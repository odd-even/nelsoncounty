#!/usr/bin/env python3
"""
Move '*Lodging descriptions are provided by the host and not independently verified.'
to the very end of detailedDescription for every listing that contains it.
"""
import csv
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
INPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"
OUTPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"

DISCLAIMER_CANONICAL = "<br><br><em>*Lodging descriptions are provided by the host and not independently verified.</em>"

# Match disclaimer in <em> with optional * and possible truncation (ver vs verified)
DISCLAIMER_PATTERN = re.compile(
    r"\s*<em>\*?Lodging descriptions are provided by the host and not independently ver(?:ified)?\.?</em>(?:\s*<br>\s*<br>)?",
    re.IGNORECASE,
)


def move_disclaimer_to_end(text):
    if not text or "Lodging descriptions are provided by the host" not in text:
        return text
    # Remove disclaimer from wherever it appears (may appear once)
    cleaned = DISCLAIMER_PATTERN.sub("", text)
    # Collapse any double space or <br><br> left where we removed
    cleaned = re.sub(r"  +", " ", cleaned)
    cleaned = re.sub(r"(<br><br>){2,}", "<br><br>", cleaned)
    # Append disclaimer at the very end: before the final closing </p> or at end
    cleaned = cleaned.rstrip()
    last_p = cleaned.rfind("</p>")
    if last_p != -1:
        # Insert disclaimer before the last </p>
        cleaned = cleaned[:last_p].rstrip() + DISCLAIMER_CANONICAL + cleaned[last_p:]
    else:
        cleaned = cleaned + DISCLAIMER_CANONICAL
    return cleaned


def main():
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    updated = 0
    for row in rows:
        det = (row.get("detailedDescription") or "").strip()
        if not det or "Lodging descriptions are provided by the host" not in det:
            continue
        new_det = move_disclaimer_to_end(det)
        if new_det != det:
            row["detailedDescription"] = new_det
            updated += 1
            name = (row.get("name") or "").strip()
            slug = (row.get("slug") or "").strip()
            print(f"  Moved disclaimer to end: {name} ({slug})")

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"\nDone. {updated} detailedDescription(s) updated. Wrote {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
