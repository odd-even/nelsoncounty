#!/usr/bin/env python3
"""
Use DONOR source (A - Donor - Portfolio-Export) to set Pet Friendly amenity for stay listings.
- If donor does NOT mention pet friendly in nectar/Content/WordPress structure → should NOT have amenity.
- If donor says "Pet Friendly: No" or "Pet-Friendly? No" or "N/A" → should NOT have amenity.
- If donor says Yes or has "Pet Friendly" in Project Categories → SHOULD have amenity.
Produce full report of changes for spot-checking, then apply to final_listings_PERFECT_br_cleaned.csv.
"""
import csv
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DONOR_CSV = REPO_ROOT / "CSV" / "A - Donor - Portfolio-Export-2026-January-02-1652.csv"
FINAL_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"
REPORT_PATH = REPO_ROOT / "CSV" / "PET_FRIENDLY_FROM_DONOR_REPORT.txt"


def get_donor_pet_verdict(row):
    """
    Returns: ('yes' | 'no' | 'no_mention', evidence_snippet)
    """
    content = (row.get("Content") or "") + " " + (row.get("_nectar_portfolio_extra_content") or "")
    categories = (row.get("Project Categories") or "") + " " + (row.get("Project Attributes") or "")

    # 1) Explicit No: "Pet-Friendly?</strong>No" or "Pet-Friendly?</strong>N/A"
    m = re.search(
        r"Pet-Friendly\?\s*</strong>\s*(No|N/A)(?:\s|$|<)",
        content,
        re.IGNORECASE | re.DOTALL,
    )
    if m:
        return ("no", f"Donor: Pet-Friendly? {m.group(1)}")

    # 2) Explicit Yes: "Pet-Friendly?</strong>Yes" or "Pet-Friendly?</strong>Pets"
    m = re.search(
        r"Pet-Friendly\?\s*</strong>\s*(Yes|Pets[^<]*)",
        content,
        re.IGNORECASE | re.DOTALL,
    )
    if m:
        return ("yes", f"Donor: Pet-Friendly? {m.group(1).strip()[:50]}")

    # 3) WordPress structure: "Pet Friendly" in Project Categories (e.g. "All (Lodging)>Pet Friendly")
    if "Pet Friendly" in categories or "Pet-Friendly" in categories:
        return ("yes", "Donor: Project Categories include Pet Friendly")

    # 4) No mention
    return ("no_mention", "Donor: no pet-friendly mention in nectar/Content/Categories")


def normalize_slug(s):
    return (s or "").strip().lower()


def remove_pet_friendly_from_amenities(amenities_str):
    """Remove 'Pet Friendly' or 'Pet-Friendly' from comma/semicolon-separated amenities."""
    if not amenities_str or not (amenities_str.strip()):
        return ""
    # Split by comma or semicolon, strip, filter out Pet Friendly variants, rejoin
    parts = re.split(r"[,;]", amenities_str)
    kept = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if re.fullmatch(r"Pet\s*[- ]?Friendly", p, re.IGNORECASE):
            continue
        kept.append(p)
    # Preserve original separator if possible (semicolon vs comma)
    sep = ";" if ";" in amenities_str else ","
    return sep.join(kept)


def add_pet_friendly_to_amenities(amenities_str):
    """Add Pet Friendly if not present."""
    if not amenities_str or not amenities_str.strip():
        return "Pet Friendly"
    if re.search(r"Pet\s*[- ]?Friendly", amenities_str, re.IGNORECASE):
        return amenities_str
    sep = ";" if ";" in amenities_str else ","
    return amenities_str.strip() + sep + " Pet Friendly"


def main():
    # Load donor: slug -> verdict, evidence
    donor_by_slug = {}
    with open(DONOR_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = normalize_slug(row.get("Slug") or "")
            if not slug:
                continue
            verdict, evidence = get_donor_pet_verdict(row)
            donor_by_slug[slug] = {"verdict": verdict, "evidence": evidence, "title": (row.get("Title") or "").strip()}

    # Load final CSV
    with open(FINAL_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("PET FRIENDLY FROM DONOR — FULL REPORT")
    report_lines.append("Donor: A - Donor - Portfolio-Export-2026-January-02-1652.csv")
    report_lines.append("Target: final_listings_PERFECT_br_cleaned.csv (stay category only)")
    report_lines.append("Rule: If donor does NOT mention pet friendly, or says No/N/A → remove amenity.")
    report_lines.append("=" * 80)

    changes = []
    stay_no_donor = []
    stay_kept_yes = []
    stay_removed = []

    for row in rows:
        cat = (row.get("category") or "").strip().lower()
        if cat != "stay":
            continue
        name = (row.get("name") or "").strip()
        slug = normalize_slug(row.get("slug") or "")
        amenities = (row.get("amenities") or "").strip()
        has_pet_now = bool(re.search(r"Pet\s*[- ]?Friendly", amenities, re.IGNORECASE))

        donor = donor_by_slug.get(slug)
        if not donor:
            # Stay listing not in donor → treat as no mention → should NOT have Pet Friendly
            stay_no_donor.append((name, slug, amenities))
            if has_pet_now:
                new_amenities = remove_pet_friendly_from_amenities(amenities)
                row["amenities"] = new_amenities
                changes.append({
                    "name": name,
                    "slug": slug,
                    "verdict": "no_mention",
                    "evidence": "Listing not in donor (no nectar/Content); treat as no mention.",
                    "before": amenities,
                    "after": new_amenities,
                    "action": "REMOVED Pet Friendly",
                })
                stay_removed.append((name, slug))
            continue

        verdict = donor["verdict"]
        evidence = donor["evidence"]

        if verdict == "yes":
            if has_pet_now:
                stay_kept_yes.append((name, slug))
            else:
                new_amenities = add_pet_friendly_to_amenities(amenities)
                row["amenities"] = new_amenities
                changes.append({
                    "name": name,
                    "slug": slug,
                    "verdict": "yes",
                    "evidence": evidence,
                    "before": amenities,
                    "after": new_amenities,
                    "action": "ADDED Pet Friendly",
                })
        else:
            # no or no_mention → should NOT have Pet Friendly
            if has_pet_now:
                new_amenities = remove_pet_friendly_from_amenities(amenities)
                row["amenities"] = new_amenities
                changes.append({
                    "name": name,
                    "slug": slug,
                    "verdict": verdict,
                    "evidence": evidence,
                    "before": amenities,
                    "after": new_amenities,
                    "action": "REMOVED Pet Friendly",
                })
                stay_removed.append((name, slug))

    # Write report
    report_lines.append("")
    report_lines.append("SECTION 1: CHANGES MADE (for spot-check)")
    report_lines.append("-" * 80)
    for c in changes:
        report_lines.append("")
        report_lines.append(f"  {c['name']} ({c['slug']})")
        report_lines.append(f"    Donor verdict: {c['verdict']}")
        report_lines.append(f"    Evidence: {c['evidence']}")
        report_lines.append(f"    Action: {c['action']}")
        report_lines.append(f"    Amenities BEFORE: {c['before'][:120]}")
        report_lines.append(f"    Amenities AFTER:  {c['after'][:120]}")

    report_lines.append("")
    report_lines.append("-" * 80)
    report_lines.append(f"Total changes: {len(changes)}")

    report_lines.append("")
    report_lines.append("SECTION 2: Stay listings NOT in donor (Pet Friendly removed if present)")
    report_lines.append("-" * 80)
    for name, slug, am in stay_no_donor:
        report_lines.append(f"  {name} ({slug})")

    report_lines.append("")
    report_lines.append("SECTION 3: Stay listings with donor YES — kept or added Pet Friendly")
    report_lines.append("-" * 80)
    for name, slug in stay_kept_yes:
        report_lines.append(f"  {name} ({slug})")

    report_lines.append("")
    report_lines.append("SECTION 4: Stay listings from which Pet Friendly was REMOVED (donor No or no mention)")
    report_lines.append("-" * 80)
    for name, slug in stay_removed:
        report_lines.append(f"  {name} ({slug})")

    report_lines.append("")
    report_lines.append("=" * 80)
    report_lines.append("END OF REPORT")
    report_lines.append("=" * 80)

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    with open(FINAL_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote report: {REPORT_PATH}")
    print(f"Wrote CSV: {FINAL_CSV}")
    print(f"Total changes: {len(changes)}")
    for c in changes:
        print(f"  {c['action']}: {c['name']} ({c['slug']})")


if __name__ == "__main__":
    main()
