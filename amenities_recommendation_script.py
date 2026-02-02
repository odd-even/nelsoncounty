#!/usr/bin/env python3
"""
Parse ALL_LISTINGS_AMENITIES_MISSED_REPORT.txt, join with slug->category/type from final CSV,
and produce RECOMMEND ADD vs SKIP for each missed amenity. Recommendation only.

If applying recommendations: only APPEND new amenities to existing lists; never
remove, overwrite, or change any amenities currently in the CSV.
"""
import csv
import re
import os

CURRENT_CSV = "CSV/final_listings_PERFECT_br_cleaned.csv"
REPORT_PATH = "CSV/ALL_LISTINGS_AMENITIES_MISSED_REPORT.txt"
OUT_PATH = "CSV/AMENITIES_MISSED_RECOMMENDATIONS.txt"

# CONSERVATIVE: Only recommend amenities that clearly describe the listing. When in doubt, REVIEW or SKIP.

# Stay: SKIP anything that could mean "nearby" or activity, not the lodging itself
SKIP_FOR_STAY = {
    "Adventure", "Appalachian Trail", "Biking", "Boating", "Educational", "Fishing",
    "Fuel", "Hiking", "Hunting", "Resort", "Full Service Resort", "Snow Sports",
    "Water Sports", "Tours", "Seasonal Menu", "Tastings", "Beer", "Wine", "Cider",
    "Spirits", "Bar", "Retail", "Market", "Events", "Golf", "Farm", "Meeting Planners",
    "Cafe", "Coffee", "Tea", "Desserts", "Deli", "Takeout", "Food Available",
    "Order Pickup", "Dinner", "Lunch", "BBQ", "Local Ingredients", "Picnic Area",
}
# Taste: SKIP stay/outdoor/activity
SKIP_FOR_TASTE = {
    "Adventure", "Appalachian Trail", "Biking", "Boating", "Cabins", "Educational",
    "Fishing", "Hiking", "Hunting", "Lodging", "Snow Sports", "Water Sports",
}
# Outdoor/do: SKIP dining/stay-only
SKIP_FOR_DO = {"Cabins", "Lodging", "Breakfast", "Dinner", "Lunch", "Takeout", "Deli", "Bakery", "BBQ", "Desserts", "Cafe", "Coffee", "Tea", "Bar", "Beer", "Wine", "Cider", "Spirits", "Tastings", "Full Kitchen", "Seasonal Menu", "Food Available", "Order Pickup", "Retail", "Market"}

# RECOMMEND only when clearly on-site and unambiguous (conservative short list)
RECOMMEND_FOR_STAY = {
    "Scenic Views", "Outdoor Seating", "Full Kitchen", "Breakfast", "Cabins",
    "Family Friendly", "Pet Friendly", "Wi-Fi", "Parking", "Pool", "Swimming Pool", "Hot Tub",
}
RECOMMEND_FOR_TASTE = {
    "Tastings", "Outdoor Seating", "Scenic Views", "Family Friendly", "Live Music",
}
# Outdoor/experience (trails, parks): only clear activity/venue amenities
RECOMMEND_FOR_DO = {"Biking", "Hiking", "Scenic Views", "Parking", "Picnic Area", "Family Friendly"}


def load_slug_category_type():
    with open(CURRENT_CSV, "r", encoding="utf-8", newline="") as f:
        r = csv.DictReader(f)
        return {(row["slug"], row.get("category", ""), row.get("type", "")) for row in r if row.get("slug")}


def slug_to_cat_type(rows):
    by_slug = {}
    for slug, cat, typ in rows:
        by_slug[slug] = (cat.strip(), typ.strip())
    return by_slug


def parse_report():
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
    entries = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("  ") and not line.startswith("    ") and "MISSED" not in line:
            slug = line.strip()
            if slug and not slug.startswith("Listings") and not slug.startswith("Below") and "=" not in slug and "Total" not in slug:
                i += 1
                if i < len(lines) and "MISSED" in lines[i]:
                    am_line = lines[i].replace("MISSED (in OLD, not in CURRENT):", "").strip()
                    am_list = [a.strip() for a in am_line.split(",") if a.strip()]
                    entries.append((slug, am_list))
        i += 1
    return entries


def recommend(slug, category, type_, amenity):
    cat = (category or "").strip().lower()
    # Treat outdoor/experience as "do" for activity listings
    is_do = cat in ("do", "outdoor", "experience")
    if is_do:
        if amenity in SKIP_FOR_DO:
            return "SKIP", "Dining/retail amenity; not for trails/parks/activities."
        if amenity in RECOMMEND_FOR_DO:
            return "RECOMMEND", "Relevant for activity/outdoor listing."
        return "REVIEW", "Case-by-case for outdoor/experience."
    if cat == "stay":
        if amenity in SKIP_FOR_STAY:
            return "SKIP", "Activity/nearby or dining; avoid on stay (conservative)."
        if amenity in RECOMMEND_FOR_STAY:
            return "RECOMMEND", "Clear on-site lodging amenity."
        return "REVIEW", "Case-by-case for stay."
    if cat == "taste":
        if amenity in SKIP_FOR_TASTE:
            return "SKIP", "Not a taste/dining amenity (e.g. no Biking/Cabins)."
        if amenity in RECOMMEND_FOR_TASTE:
            return "RECOMMEND", "Clear taste/dining amenity."
        return "REVIEW", "Case-by-case for taste."
    if cat in ("culture", "community"):
        # Conservative: don't auto-recommend; send to REVIEW
        if amenity in SKIP_FOR_TASTE or amenity in SKIP_FOR_STAY:
            return "SKIP", "Unclear fit for culture/community."
        return "REVIEW", "Case-by-case for culture/community."
    return "REVIEW", "Unknown category."


def main():
    rows = load_slug_category_type()
    by_slug = slug_to_cat_type(rows)
    entries = parse_report()

    recommend_add = []   # (slug, category, type, [amenities])
    skip_list = []       # (slug, category, type, [amenities], reason)
    review_list = []    # (slug, category, type, [amenities])

    for slug, am_list in entries:
        cat, typ = by_slug.get(slug, ("", ""))
        rec_am, skip_am, review_am = [], [], []
        for a in am_list:
            verdict, reason = recommend(slug, cat, typ, a)
            if verdict == "RECOMMEND":
                rec_am.append(a)
            elif verdict == "SKIP":
                skip_am.append((a, reason))
            else:
                review_am.append(a)
        if rec_am:
            recommend_add.append((slug, cat, typ, rec_am))
        if skip_am:
            skip_list.append((slug, cat, typ, skip_am))
        if review_am:
            review_list.append((slug, cat, typ, review_am))

    lines = []
    lines.append("AMENITIES MISSED — RECOMMENDATIONS (do not apply automatically)")
    lines.append("=" * 72)
    lines.append("")
    lines.append("RECOMMEND ADD — These missed amenities are appropriate for the listing category/type.")
    lines.append("(No Biking/Hiking on stay, no Cabins on taste, etc.)")
    lines.append("")
    for slug, cat, typ, am in sorted(recommend_add, key=lambda x: (x[1], x[0])):
        lines.append(f"  [{cat}] {slug}  (type: {typ})")
        lines.append("    ADD: " + ", ".join(sorted(am)))
        lines.append("")
    lines.append("")
    lines.append("SKIP — Do not add these back; they are activity/nearby descriptors or wrong category.")
    lines.append("")
    for slug, cat, typ, skip_am in sorted(skip_list, key=lambda x: (x[1], x[0])):
        lines.append(f"  [{cat}] {slug}")
        for a, reason in skip_am:
            lines.append(f"    SKIP: {a}  — {reason}")
        lines.append("")
    lines.append("")
    lines.append("REVIEW — Case-by-case (category missing or ambiguous).")
    lines.append("")
    for slug, cat, typ, am in sorted(review_list, key=lambda x: (x[1], x[0])):
        lines.append(f"  [{cat}] {slug}  (type: {typ})")
        lines.append("    REVIEW: " + ", ".join(sorted(am)))
        lines.append("")

    summary = [
        "",
        "=" * 72,
        "SUMMARY",
        f"  RECOMMEND ADD: {len(recommend_add)} listings with at least one recommended amenity to add.",
        f"  SKIP: {len(skip_list)} listings with at least one amenity to skip.",
        f"  REVIEW: {len(review_list)} listings with at least one to review by hand.",
    ]
    lines.extend(summary)

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Recommendations written to {OUT_PATH}")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
