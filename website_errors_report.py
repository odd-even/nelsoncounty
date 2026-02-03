#!/usr/bin/env python3
"""
Check final CSV for website errors we identified earlier:
- Wrong website (one business's URL on another listing per donor)
- Same URL on multiple different listings (fill-down style error)
- Any nelsoncounty.com in website column (should be blank or external only)
- Any listing where current website != correct (donor external or blank)

Report ONLY what needs to change from current state.
"""

import csv
from collections import defaultdict

DONOR_FILE = "CSV/framer-cms-export.csv"
FINAL_FILE = "CSV/final_listings_PERFECT.csv"
REPORT_FILE = "WEBSITE_CHANGES_NEEDED_REPORT.txt"

def normalize_url(url):
    if not url or not isinstance(url, str):
        return ""
    u = url.strip().lower()
    if not u:
        return ""
    if u.endswith("/"):
        u = u[:-1]
    return u

def correct_website_from_donor(donor_web):
    """External only; no nelsoncounty.com; if none then blank."""
    if not donor_web or not isinstance(donor_web, str):
        return ""
    donor_web = donor_web.strip()
    if not donor_web:
        return ""
    if "nelsoncounty.com" in donor_web.lower():
        return ""
    return donor_web

def normalize_name(name):
    return (name or "").lower().strip()

def main():
    # Load donor
    donor = {}
    donor_by_slug = {}
    with open(DONOR_FILE, "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            name = (row.get("name") or "").strip()
            slug = (row.get("slug") or "").strip()
            web = (row.get("website") or "").strip()
            if name:
                donor[normalize_name(name)] = {"name": name, "website": web, "slug": slug}
            if slug:
                donor_by_slug[slug.lower()] = {"name": name, "website": web, "slug": slug}

    # Load final CSV (current state)
    rows = []
    with open(FINAL_FILE, "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        fieldnames = r.fieldnames
        for row in r:
            rows.append(row)

    # 1) Listings where current != correct (donor external or blank)
    needs_change = []
    # 2) Listings that still have nelsoncounty.com
    has_nelsoncounty = []
    # 3) Same URL on multiple listings -> which are wrong per donor
    url_to_listings = defaultdict(list)

    for idx, row in enumerate(rows):
        name = (row.get("name") or "").strip()
        slug = (row.get("slug") or "").strip()
        current = (row.get("website") or "").strip()

        if current and "nelsoncounty.com" in current.lower():
            has_nelsoncounty.append({"name": name, "slug": slug, "current": current})

        if current:
            url_to_listings[normalize_url(current)].append({"name": name, "slug": slug, "current": current})

        donor_info = None
        nn = normalize_name(name)
        if nn in donor:
            donor_info = donor[nn]
        elif slug and slug.lower() in donor_by_slug:
            donor_info = donor_by_slug[slug.lower()]
        else:
            for dn, d in donor.items():
                if nn == dn or nn in dn or dn in nn:
                    donor_info = d
                    break

        if not donor_info:
            if current:
                needs_change.append({"name": name, "slug": slug, "current": current, "correct": ""})
            continue

        correct = correct_website_from_donor(donor_info["website"])
        if normalize_url(current) != normalize_url(correct):
            needs_change.append({"name": name, "slug": slug, "current": current, "correct": correct})

    # Duplicate-URL errors: URL shared by 2+ listings where per donor only one or none should have it
    duplicate_errors = []
    for url_norm, listing_list in url_to_listings.items():
        if not url_norm or len(listing_list) < 2:
            continue
        for entry in listing_list:
            name = entry["name"]
            nn = normalize_name(name)
            donor_info = donor.get(nn) or next((d for dn, d in donor.items() if nn in dn or dn in nn), None)
            correct = correct_website_from_donor(donor_info["website"]) if donor_info else ""
            if normalize_url(entry["current"]) != normalize_url(correct):
                duplicate_errors.append({
                    "name": name, "slug": entry["slug"],
                    "current": entry["current"], "correct": correct,
                    "note": f"Same URL used by {len(listing_list)} listings; this one should not have it per donor."
                })

    dup_urls = {u: lst for u, lst in url_to_listings.items() if u and len(lst) >= 2}

    # Tag entries that have nelsoncounty.com or are duplicate-URL errors
    for m in needs_change:
        m["error_type"] = "has nelsoncounty.com" if m["current"] and "nelsoncounty.com" in m["current"].lower() else "wrong per donor (or duplicate URL)"
    for m in has_nelsoncounty:
        if not any(n["name"] == m["name"] and n["slug"] == m["slug"] for n in needs_change):
            needs_change.append({"name": m["name"], "slug": m["slug"], "current": m["current"], "correct": "", "error_type": "has nelsoncounty.com"})

    # Build report: only what needs to change (single list)
    with open(REPORT_FILE, "w", encoding="utf-8") as out:
        out.write("=" * 80 + "\n")
        out.write("WEBSITE COLUMN: CHANGES NEEDED (from current state)\n")
        out.write("=" * 80 + "\n\n")
        out.write("Rule: External sites only (no nelsoncounty.com). If no external in donor, blank.\n")
        out.write("Checks: nelsoncounty.com present, wrong website per donor, same URL on multiple listings.\n\n")
        out.write(f"Total listings that need a change: {len(needs_change)}\n\n")
        out.write("=" * 80 + "\n")
        out.write("LISTING | CURRENT (wrong) | CHANGE TO (correct)\n")
        out.write("=" * 80 + "\n\n")

        if needs_change:
            for i, m in enumerate(needs_change, 1):
                out.write(f"{i}. {m['name']}\n")
                out.write(f"   Slug: {m['slug']}\n")
                out.write(f"   Current: {m['current']}\n")
                out.write(f"   Change to: {m['correct']}\n")
                if m.get("error_type"):
                    out.write(f"   Error: {m['error_type']}\n")
                out.write("\n")
        else:
            out.write("(No changes needed. Current CSV matches the rule.)\n\n")

        # Summary of duplicate URLs (for context)
        if dup_urls:
            out.write("=" * 80 + "\n")
            out.write("NOTE: Same URL on multiple listings (possible fill-down errors)\n")
            out.write("=" * 80 + "\n\n")
            for url_norm, listing_list in list(dup_urls.items())[:20]:
                out.write(f"  URL: {listing_list[0]['current'][:70]}...\n")
                for e in listing_list:
                    out.write(f"    - {e['name']}\n")
                out.write("\n")
            if len(dup_urls) > 20:
                out.write(f"  ... and {len(dup_urls) - 20} more duplicate-URL groups\n\n")

        out.write("=" * 80 + "\n")
        out.write("END OF REPORT\n")
        out.write("=" * 80 + "\n")

    print(f"Report written: {REPORT_FILE}")
    print(f"  Listings that need a change: {len(needs_change)}")
    print(f"  Duplicate-URL groups (same URL on 2+ listings): {len(dup_urls)}")

if __name__ == "__main__":
    main()
