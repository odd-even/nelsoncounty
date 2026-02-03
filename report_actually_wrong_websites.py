#!/usr/bin/env python3
"""
Report websites that are actually wrong:
1. Shared URL - same website on multiple different listings (wrong for all but one)
2. nelsoncounty.com - internal links that should not be in website field
"""

import csv
import re
from collections import defaultdict
from urllib.parse import urlparse

CSV_PATH = "CSV/final_listings_PERFECT.csv"
REPORT_PATH = "WEBSITE_ACTUALLY_WRONG_REPORT.txt"

def normalize_url(url):
    if not url or not isinstance(url, str):
        return ""
    s = url.strip().lower()
    if not s:
        return ""
    # strip trailing slash
    s = s.rstrip("/")
    # optional: strip query string for grouping (so we catch same base URL)
    try:
        parsed = urlparse(s)
        base = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
        return base if base else s
    except Exception:
        return s

def main():
    url_to_listings = defaultdict(list)  # normalized_url -> [(name, slug, raw_url), ...]
    nelsoncounty_listings = []  # (name, slug, website)

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        if "website" not in headers:
            print("No 'website' column found")
            return
        for row in reader:
            name = (row.get("name") or "").strip()
            slug = (row.get("slug") or "").strip()
            website = (row.get("website") or "").strip()
            if not name:
                continue
            if "nelsoncounty.com" in website.lower():
                nelsoncounty_listings.append((name, slug, website))
            if website:
                norm = normalize_url(website)
                if norm:
                    url_to_listings[norm].append((name, slug, website))

    # Build report
    lines = [
        "=" * 80,
        "WEBSITE COLUMN — ACTUALLY WRONG REPORT",
        "=" * 80,
        "",
        "Criteria for 'actually wrong':",
        "  1. SHARED URL — Same website appears on 2+ different listings (only one can be correct).",
        "  2. NELSONCOUNTY.COM — Internal links; you requested these not be in the website field.",
        "",
        "File: " + CSV_PATH,
        "",
    ]

    # 1. Shared URLs
    shared = [(url, listings) for url, listings in url_to_listings.items() if len(listings) > 1]
    shared.sort(key=lambda x: -len(x[1]))

    lines.append("=" * 80)
    lines.append("1. SHARED URL (same website on multiple listings — wrong for all but one)")
    lines.append("=" * 80)
    lines.append("")
    if not shared:
        lines.append("  None found.")
    else:
        lines.append(f"  Total URLs shared across 2+ listings: {len(shared)}")
        lines.append("")
        for i, (url, listings) in enumerate(shared, 1):
            lines.append(f"  --- Shared URL #{i} ({len(listings)} listings) ---")
            lines.append(f"  URL: {url}")
            for name, slug, raw in listings:
                lines.append(f"    - {name}  (slug: {slug})")
            lines.append("")

    # 2. nelsoncounty.com
    lines.append("=" * 80)
    lines.append("2. NELSONCOUNTY.COM (should be blank per your preference)")
    lines.append("=" * 80)
    lines.append("")
    if not nelsoncounty_listings:
        lines.append("  None found.")
    else:
        lines.append(f"  Total listings with nelsoncounty.com in website: {len(nelsoncounty_listings)}")
        lines.append("")
        for name, slug, website in nelsoncounty_listings:
            lines.append(f"  - {name}")
            lines.append(f"    Slug: {slug}")
            lines.append(f"    Current website: {website[:80]}{'...' if len(website) > 80 else ''}")
        lines.append("")

    # Summary
    total_wrong_shared = sum(len(listings) for _, listings in shared)
    total_nelson = len(nelsoncounty_listings)
    # Some listings may be in both (nelsoncounty URL shared); avoid double-count in narrative
    lines.append("=" * 80)
    lines.append("SUMMARY")
    lines.append("=" * 80)
    lines.append(f"  Listings with a shared (suspicious) URL: {total_wrong_shared}")
    lines.append(f"  Listings with nelsoncounty.com:         {total_nelson}")
    lines.append("")
    lines.append("Recommendation: Fix shared URLs (set to blank or correct one per business)")
    lines.append("                and clear nelsoncounty.com URLs to blank.")
    lines.append("")
    lines.append("=" * 80)
    lines.append("END OF REPORT")
    lines.append("=" * 80)

    report_text = "\n".join(lines)
    with open(REPORT_PATH, "w", encoding="utf-8") as out:
        out.write(report_text)
    print(report_text)
    print(f"\nReport written to {REPORT_PATH}")

if __name__ == "__main__":
    main()
