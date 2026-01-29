#!/usr/bin/env python3
"""
Fix all issues reported in LINK_AND_WHITESPACE_FORMATTING_REPORT:
- Broken domains: .co m -> .com, .or g -> .org
- Path/text spaces: racquet-sport s -> racquet-sports, KID S IN PARKS -> KIDS IN PARKS
- Malformed tag: </a>'> -> </a> 
- Double/multiple spaces -> single space
- Airkey: fix Contact block (one link, tel: link for phone, remove duplicate URL)
- Basecamp 151: fix cruciblecoffee link (.com and link text Crucible Coffee)
"""
import csv
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
INPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"
OUTPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"

CONTENT_COLUMNS = [
    "description",
    "detailedDescription",
    "customHtml",
] + [f"accordion{i}Content" for i in range(1, 6)] + [f"accordionPanel{i}Content" for i in range(1, 5)]


def apply_fixes(text, column_name=None):
    if not text or not text.strip():
        return text
    s = text

    # 1. Broken domains (space in TLD)
    s = s.replace(".co m", ".com")
    s = s.replace(".co m/", ".com/")
    s = s.replace(".or g", ".org")
    s = s.replace(".or g/", ".org/")

    # 2. Path/text with space
    s = s.replace("racquet-sport s", "racquet-sports")
    s = re.sub(r"KID\s+S\s+IN\s+PARKS", "KIDS IN PARKS", s, flags=re.I)
    s = s.replace("blackrock-trai l", "blackrock-trail")
    s = s.replace("crabtree-fall s", "crabtree-falls")
    s = s.replace("crawfords-kno b", "crawfords-knob")
    s = s.replace("morgans-loo p", "morgans-loop")
    s = s.replace("/di r/", "/dir/")
    s = s.replace("/di r//", "/dir//")

    # 2b. Remove spaces inside goo.gl/maps/ URLs (href and link text, so link works)
    def fix_googl(m):
        inner = m.group(1)
        return "https://goo.gl/maps/" + inner.replace(" ", "")
    s = re.sub(r"https://goo\.gl/maps/([A-Za-z0-9\s]+?)(?='|>)", fix_googl, s)
    # Fix link text (between > and </a>) so displayed URL has no spaces
    def fix_googl_text(m):
        return ">" + "https://goo.gl/maps/" + m.group(1).replace(" ", "") + "</a>"
    s = re.sub(r">https://goo\.gl/maps/([A-Za-z0-9\s]+?)</a>", fix_googl_text, s)

    # 3. Malformed </a>'> (extra quote)
    s = s.replace("</a>'>", "</a> ")

    # 4. Airkey-specific: fix Contact block in detailedDescription
    if "airkey" in (column_name or "").lower() or "myairkey" in s:
        old_block = (
            "<a href='https://myairkey.com/'>https://myairkey.com/</a> wwwmyairkey.com "
            "<strong>Contact </strong> Airkey +14344666942"
        )
        new_block = (
            "<a href='https://myairkey.com/' target='_blank' rel='noopener noreferrer'>myairkey.com</a> "
            "<strong>Contact:</strong> Airkey <a href='tel:+14344666942'>+1 (434) 466-6942</a>"
        )
        if old_block in s:
            s = s.replace(old_block, new_block)
        # Also fix if .co m still present (in case column name not passed)
        old_broken = (
            "<a href='https://myairkey.co m/'>https://myairkey.co m/</a> wwwmyairkey.com "
            "<strong>Contact </strong> Airkey +14344666942"
        )
        if old_broken in s:
            s = s.replace(old_broken, new_block)

    # 5. Basecamp 151: wrong link text and .co m
    s = s.replace(
        "<a href='https://cruciblecoffee.co m'>nelsoncounty.com</a>",
        "<a href='https://cruciblecoffee.com' target='_blank' rel='noopener noreferrer'>Crucible Coffee</a>",
    )
    s = s.replace(
        "<a href='https://cruciblecoffee.com'>nelsoncounty.com</a>",
        "<a href='https://cruciblecoffee.com' target='_blank' rel='noopener noreferrer'>Crucible Coffee</a>",
    )

    # 6. Collapse 2+ spaces to single space
    while "  " in s:
        s = s.replace("  ", " ")

    return s


def main():
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    content_cols = [c for c in CONTENT_COLUMNS if c in fieldnames]
    change_count = 0

    for row in rows:
        for col in content_cols:
            val = row.get(col)
            if val:
                new_val = apply_fixes(val, col)
                if new_val != val:
                    row[col] = new_val
                    change_count += 1
                    name = (row.get("name") or "").strip()
                    slug = (row.get("slug") or "").strip()
                    print(f"  Fixed [{col}] for {name} ({slug})")

    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"\nDone. {change_count} field(s) updated. Wrote {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
