#!/usr/bin/env python3
"""
Compare donor (framer-cms-export.csv) vs final (final_listings_PERFECT.csv)
using NAME and SLUG only (no id). Report:
1. Slugs in final not in donor (and vice versa)
2. Column mismatches when matched by slug: name, type, area, phone, address
3. Spot-check: possible row-order / wrong-assignment indicators
"""

import csv
import re
from collections import defaultdict

DONOR_PATH = "CSV/framer-cms-export.csv"
FINAL_PATH = "CSV/final_listings_PERFECT.csv"
REPORT_PATH = "SPOTCHECK_DONOR_VS_FINAL_BY_SLUG_REPORT.txt"

def norm(s):
    if s is None:
        return ""
    return " ".join(str(s).strip().split()).strip()

def norm_phone(s):
    if not s:
        return ""
    return re.sub(r"\D", "", str(s).strip())

def norm_for_match(s):
    return norm(s).lower()

def main():
    # Load donor by slug
    donor_by_slug = {}
    donor_slugs = set()
    with open(DONOR_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = norm(row.get("slug") or "")
            if not slug:
                continue
            donor_slugs.add(slug)
            donor_by_slug[slug] = {
                "name": norm(row.get("name") or ""),
                "type": norm(row.get("type") or ""),
                "area": norm(row.get("area") or ""),
                "phone": norm(row.get("phone") or ""),
                "address": norm(row.get("address") or ""),
                "website": norm(row.get("website") or ""),
            }

    # Load final by slug
    final_by_slug = {}
    final_slugs = set()
    with open(FINAL_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = norm(row.get("slug") or "")
            if not slug:
                continue
            final_slugs.add(slug)
            final_by_slug[slug] = {
                "name": norm(row.get("name") or ""),
                "type": norm(row.get("type") or ""),
                "category": norm(row.get("category") or ""),
                "area": norm(row.get("area") or ""),
                "phone": norm(row.get("phone") or ""),
                "address": norm(row.get("address") or ""),
                "website": norm(row.get("website") or ""),
            }

    # Build report
    lines = [
        "=" * 80,
        "SPOTCHECK: DONOR VS FINAL BY NAME/SLUG (NO ID)",
        "=" * 80,
        "",
        "Donor: " + DONOR_PATH,
        "Final: " + FINAL_PATH,
        "Match key: slug (normalized). No id used.",
        "",
    ]

    # 1. Slug coverage
    only_final = sorted(final_slugs - donor_slugs)
    only_donor = sorted(donor_slugs - final_slugs)
    common = sorted(final_slugs & donor_slugs)
    lines.append("=" * 80)
    lines.append("1. SLUG COVERAGE")
    lines.append("=" * 80)
    lines.append(f"  In both:     {len(common)}")
    lines.append(f"  Only in final: {len(only_final)}")
    lines.append(f"  Only in donor: {len(only_donor)}")
    if only_final:
        lines.append("")
        lines.append("  Slugs only in final (no donor row to compare):")
        for s in only_final[:30]:
            name = final_by_slug.get(s, {}).get("name", "?")
            lines.append(f"    - {s}  ({name})")
        if len(only_final) > 30:
            lines.append(f"    ... and {len(only_final) - 30} more")
    if only_donor:
        lines.append("")
        lines.append("  Slugs only in donor (missing in final):")
        for s in only_donor[:20]:
            name = donor_by_slug.get(s, {}).get("name", "?")
            lines.append(f"    - {s}  ({name})")
        if len(only_donor) > 20:
            lines.append(f"    ... and {len(only_donor) - 20} more")
    lines.append("")

    # 2. Column mismatches (when matched by slug)
    name_mismatch = []
    type_mismatch = []
    area_mismatch = []
    phone_mismatch = []
    address_mismatch = []
    for slug in common:
        d = donor_by_slug[slug]
        f = final_by_slug[slug]
        if norm_for_match(d["name"]) != norm_for_match(f["name"]):
            name_mismatch.append((slug, d["name"], f["name"]))
        if norm_for_match(d["type"]) != norm_for_match(f["type"]):
            type_mismatch.append((slug, d["type"], f["type"]))
        if norm_for_match(d["area"]) != norm_for_match(f["area"]):
            area_mismatch.append((slug, d["area"], f["area"]))
        if norm_phone(d["phone"]) != norm_phone(f["phone"]):
            phone_mismatch.append((slug, d["phone"], f["phone"]))
        if norm_for_match(d["address"]) != norm_for_match(f["address"]):
            address_mismatch.append((slug, d["address"][:50], f["address"][:50]))

    lines.append("=" * 80)
    lines.append("2. COLUMN MISMATCHES (matched by slug)")
    lines.append("=" * 80)
    lines.append("")
    lines.append(f"  Name mismatches:    {len(name_mismatch)}")
    lines.append(f"  Type mismatches:   {len(type_mismatch)}")
    lines.append(f"  Area mismatches:   {len(area_mismatch)}")
    lines.append(f"  Phone mismatches:  {len(phone_mismatch)}")
    lines.append(f"  Address mismatches: {len(address_mismatch)}")
    lines.append("")

    if name_mismatch:
        lines.append("  --- NAME (donor vs final) ---")
        for slug, dname, fname in name_mismatch[:25]:
            lines.append(f"    {slug}")
            lines.append(f"      Donor: {dname[:60]}")
            lines.append(f"      Final: {fname[:60]}")
        if len(name_mismatch) > 25:
            lines.append(f"    ... and {len(name_mismatch) - 25} more")
        lines.append("")
    if phone_mismatch:
        lines.append("  --- PHONE (donor vs final) ---")
        for slug, dphone, fphone in phone_mismatch[:20]:
            lines.append(f"    {slug}: donor={dphone}  final={fphone}")
        if len(phone_mismatch) > 20:
            lines.append(f"    ... and {len(phone_mismatch) - 20} more")
        lines.append("")
    if address_mismatch:
        lines.append("  --- ADDRESS (donor vs final) ---")
        for slug, daddr, faddr in address_mismatch[:15]:
            lines.append(f"    {slug}")
            lines.append(f"      Donor: {daddr}")
            lines.append(f"      Final: {faddr}")
        if len(address_mismatch) > 15:
            lines.append(f"    ... and {len(address_mismatch) - 15} more")
        lines.append("")
    if type_mismatch:
        lines.append("  --- TYPE (donor vs final) ---")
        for slug, dtype, ftype in type_mismatch[:15]:
            lines.append(f"    {slug}: donor={dtype}  final={ftype}")
        if len(type_mismatch) > 15:
            lines.append(f"    ... and {len(type_mismatch) - 15} more")
        lines.append("")
    if area_mismatch:
        lines.append("  --- AREA (donor vs final) ---")
        for slug, darea, farea in area_mismatch[:15]:
            lines.append(f"    {slug}: donor={darea}  final={farea}")
        if len(area_mismatch) > 15:
            lines.append(f"    ... and {len(area_mismatch) - 15} more")
        lines.append("")

    # 3. ID vs slug usage in codebase (summary from grep)
    lines.append("=" * 80)
    lines.append("3. ID VS SLUG USAGE (codebase note)")
    lines.append("=" * 80)
    lines.append("  - COMPLETE-GOOGLE-APPS-SCRIPT.gs: saveListing/find row uses SLUG first,")
    lines.append("    fallback to ID for backward compatibility. CSV parsing still reads")
    lines.append("    'id' column if present; writes it if header exists.")
    lines.append("  - index.html / frontpage_framer.html: fallbackData has 'id' in sample")
    lines.append("    listings; frontpage_framer has data-listing-id and id===idOrSlug check.")
    lines.append("  - Recommendation: ensure admin/sheets UI finds listings by slug only;")
    lines.append("    remove id from fallback data and URL/lookup logic when safe.")
    lines.append("")

    # 4. Spot-check: possible wrong assignments (same slug, different key fields)
    lines.append("=" * 80)
    lines.append("4. SPOT-CHECK: ERRORS LIKELY FROM ROW/ID MISMATCH")
    lines.append("=" * 80)
    lines.append("  Name mismatch with same slug suggests wrong row merged (e.g. by id/position).")
    lines.append(f"  Found {len(name_mismatch)} name mismatches for same slug — review list above.")
    lines.append("  Phone/address mismatch with same slug may be donor vs final data entry difference")
    lines.append("  (e.g. corrected address) or a true merge error.")
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
