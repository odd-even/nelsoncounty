#!/usr/bin/env python3
"""
Compare website column in final_listings_PERFECT.csv against donor (framer-cms-export.csv).
Rule: Only external sites (no nelsoncounty.com). If donor has nelsoncounty.com or no site, correct = blank.
Report mismatches and apply corrections to final CSV.
"""

import csv
import shutil
from datetime import datetime

DONOR_FILE = "CSV/framer-cms-export.csv"
FINAL_FILE = "CSV/final_listings_PERFECT.csv"
REPORT_FILE = "WEBSITE_DONOR_MISMATCHES_REPORT.txt"

def normalize_url(url):
    """Normalize URL for comparison."""
    if not url or not isinstance(url, str):
        return ""
    u = url.strip().lower()
    if not u:
        return ""
    if u.endswith("/"):
        u = u[:-1]
    return u

def is_external(url):
    """True if URL is external (does not contain nelsoncounty.com)."""
    if not url or not isinstance(url, str):
        return False
    return "nelsoncounty.com" not in url.strip().lower()

def correct_website_from_donor(donor_web):
    """Per user: external sites only; if no external site exists then blank. No nelsoncounty.com."""
    if not donor_web or not isinstance(donor_web, str):
        return ""
    donor_web = donor_web.strip()
    if not donor_web:
        return ""
    if "nelsoncounty.com" in donor_web.lower():
        return ""
    return donor_web

def normalize_name_for_match(name):
    if not name:
        return ""
    return name.lower().strip()

def main():
    # Load donor
    donor = {}
    donor_by_slug = {}
    with open(DONOR_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("name") or "").strip()
            slug = (row.get("slug") or "").strip()
            web = (row.get("website") or "").strip()
            if name:
                donor[normalize_name_for_match(name)] = {"name": name, "website": web, "slug": slug}
            if slug:
                donor_by_slug[slug.lower()] = {"name": name, "website": web, "slug": slug}

    # Load final CSV
    final_rows = []
    with open(FINAL_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            final_rows.append(row)

    mismatches = []
    not_in_donor = []
    matched_count = 0
    corrections = []  # (row_index, name, current_web, correct_web)

    for idx, row in enumerate(final_rows):
        name = (row.get("name") or "").strip()
        slug = (row.get("slug") or "").strip()
        final_web = (row.get("website") or "").strip()

        donor_info = None
        name_norm = normalize_name_for_match(name)
        if name_norm in donor:
            donor_info = donor[name_norm]
        elif slug and slug.lower() in donor_by_slug:
            donor_info = donor_by_slug[slug.lower()]
        else:
            for d_name_norm, d_info in donor.items():
                if name_norm == d_name_norm or name_norm in d_name_norm or d_name_norm in name_norm:
                    donor_info = d_info
                    break
        if not donor_info:
            not_in_donor.append(name)
            # No donor: correct = blank (no nelsoncounty.com). If final has nelsoncounty.com, clear it.
            correct_web = ""
            if final_web and "nelsoncounty.com" in final_web.lower():
                corrections.append((idx, name, final_web, ""))
                mismatches.append({
                    "name": name, "slug": slug, "donor_name": "(not in donor)",
                    "donor_website": "", "correct_website": "", "final_website": final_web,
                })
            continue

        matched_count += 1
        donor_web = donor_info["website"]
        donor_name = donor_info["name"]
        correct_web = correct_website_from_donor(donor_web)

        fn = normalize_url(final_web)
        cn = normalize_url(correct_web)

        if fn == cn:
            continue

        mismatches.append({
            "name": name,
            "slug": slug,
            "donor_name": donor_name,
            "donor_website": donor_web,
            "correct_website": correct_web,
            "final_website": final_web,
        })
        corrections.append((idx, name, final_web, correct_web))

    # Apply corrections to rows
    for idx, name, current, correct in corrections:
        final_rows[idx]["website"] = correct

    # Backup and write final CSV
    backup_file = f"CSV/final_listings_PERFECT.csv.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(FINAL_FILE, backup_file)
    with open(FINAL_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_rows)

    # Write report
    with open(REPORT_FILE, "w", encoding="utf-8") as out:
        out.write("=" * 80 + "\n")
        out.write("WEBSITE COLUMN: EXTERNAL SITES ONLY (DONOR-BASED)\n")
        out.write("=" * 80 + "\n\n")
        out.write("Rule: Only external sites (no nelsoncounty.com). If no external site in donor, blank.\n\n")
        out.write(f"Donor file: {DONOR_FILE}\n")
        out.write(f"Final file: {FINAL_FILE}\n")
        out.write(f"Backup: {backup_file}\n\n")
        out.write(f"Total listings in final CSV: {len(final_rows)}\n")
        out.write(f"Matched to donor: {matched_count}\n")
        out.write(f"Mismatches corrected: {len(mismatches)}\n")
        out.write(f"Listings not in donor (skipped): {len(not_in_donor)}\n\n")
        out.write("=" * 80 + "\n")
        out.write("CORRECTED: Final had wrong website (now set to external or blank per donor)\n")
        out.write("=" * 80 + "\n\n")

        for i, m in enumerate(mismatches, 1):
            out.write(f"{i}. {m['name']}\n")
            out.write(f"   Slug: {m['slug']}\n")
            out.write(f"   Donor name: {m['donor_name']}\n")
            out.write(f"   Donor website (raw): {m['donor_website']}\n")
            out.write(f"   Correct (external or blank): {m['correct_website']}\n")
            out.write(f"   Final (before fix): {m['final_website']}\n")
            out.write("\n")

        out.write("=" * 80 + "\n")
        out.write("END OF REPORT\n")
        out.write("=" * 80 + "\n")

    print(f"Done. Found {len(mismatches)} mismatches; corrections applied to final CSV.")
    print(f"Backup: {backup_file}")
    print(f"Report: {REPORT_FILE}")
    if mismatches:
        print("\nFirst 10 corrected:")
        for m in mismatches[:10]:
            print(f"  {m['name']}: '{m['final_website'][:50]}...' -> '{m['correct_website'][:50]}...'")

if __name__ == "__main__":
    main()
