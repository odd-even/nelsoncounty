#!/usr/bin/env python3
"""
Find errors in final_listings_PERFECT.csv that are FOR SURE wrong.
Match by SLUG only (not id). Compare to donor (framer-cms-export.csv) where slug exists in both.
Also find: shared URLs (wrong for all but one), nelsoncounty.com, phone mismatch.
"""

import csv
import re
from collections import defaultdict

FINAL_PATH = "CSV/final_listings_PERFECT.csv"
DONOR_PATH = "CSV/framer-cms-export.csv"
REPORT_PATH = "CSV/DEFINITE_ERRORS_BY_SLUG_REPORT.txt"

def norm(s):
    if s is None: return ""
    return " ".join(str(s).strip().split()).strip()

def norm_slug(s):
    return norm(s).lower().strip()

def digits_only(s):
    if not s: return ""
    return re.sub(r"\D", "", str(s))

def normalize_url_for_grouping(url):
    if not url or not isinstance(url, str): return ""
    u = url.strip().lower().rstrip("/")
    try:
        from urllib.parse import urlparse
        p = urlparse(u)
        return f"{p.scheme}://{p.netloc}{p.path}".rstrip("/") if p.netloc else u
    except Exception:
        return u

def main():
    # Load donor by slug
    donor_by_slug = {}
    with open(DONOR_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = norm_slug(row.get("slug") or "")
            if not slug: continue
            donor_by_slug[slug] = {
                "name": norm(row.get("name") or ""),
                "phone": norm(row.get("phone") or ""),
                "website": norm(row.get("website") or ""),
            }

    # Load final by slug
    final_by_slug = {}
    final_slugs = set()
    with open(FINAL_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = norm_slug(row.get("slug") or "")
            if not slug: continue
            final_slugs.add(slug)
            final_by_slug[slug] = {
                "name": norm(row.get("name") or ""),
                "phone": norm(row.get("phone") or ""),
                "website": norm(row.get("website") or ""),
            }

    common_slugs = set(donor_by_slug.keys()) & set(final_by_slug.keys())
    errors = []  # list of (slug, field, reason, suggested_fix)

    # 1) Name mismatch by slug (for sure wrong)
    for slug in common_slugs:
        dn = norm(donor_by_slug[slug]["name"]).lower()
        fn = norm(final_by_slug[slug]["name"]).lower()
        if dn != fn:
            errors.append((slug, "name", f"Donor has different name than final for same slug", f"Set name to donor: {donor_by_slug[slug]['name'][:50]}"))

    # 2) Phone mismatch by slug (digits differ = for sure wrong)
    for slug in common_slugs:
        dp = digits_only(donor_by_slug[slug]["phone"])
        fp = digits_only(final_by_slug[slug]["phone"])
        if not dp or not fp: continue
        if dp != fp:
            errors.append((slug, "phone", f"Donor phone digits {dp} vs final {fp}", "Verify correct number; set to donor or known good value"))

    # 3) website: nelsoncounty.com (for sure wrong - internal links)
    for slug in final_slugs:
        w = (final_by_slug.get(slug) or {}).get("website") or ""
        if "nelsoncounty.com" in w.lower():
            errors.append((slug, "website", "Contains nelsoncounty.com (internal link)", "Set to blank"))

    # 4) Shared URL in final: same URL on 2+ listings -> wrong for all but one per URL
    url_to_slugs = defaultdict(list)
    for slug in final_slugs:
        w = (final_by_slug.get(slug) or {}).get("website") or ""
        if not w: continue
        key = normalize_url_for_grouping(w)
        if key:
            url_to_slugs[key].append((slug, final_by_slug[slug]["name"]))

    # Known "correct" owner(s) of a URL. Set of slugs that may keep it; others are wrong. None = all wrong.
    url_keepers = {}
    for key, slugs_names in url_to_slugs.items():
        if len(slugs_names) < 2: continue
        slugs = [s[0] for s in slugs_names]
        if "ashleysmaket" in key:
            url_keepers[key] = {"ashleys-market"}
        elif "subway" in key:
            url_keepers[key] = {"subway"}
        elif "mcdonalds" in key:
            url_keepers[key] = {"mcdonalds"}
        elif "chiriospizza" in key:
            url_keepers[key] = {"chirios-pizza"}
        elif "boldrock" in key or "bold-rock" in key:
            url_keepers[key] = {"bold-kitchen-at-bold-rock"}
        elif "theappleshedva" in key or "appleshed" in key:
            url_keepers[key] = {"the-apple-shed"}
        elif "bluemountainbrewery" in key or "bluemountainbarrel" in key:
            url_keepers[key] = {"blue-mountain-brewery", "blue-mountain-barrel-house"}  # same company
        elif "nellysford.iga" in key:
            url_keepers[key] = {"iga-blue-ridge-grocery"}
        elif "dbbrewingcompany" in key or "devils-backbone" in key:
            url_keepers[key] = {"devils-backbone-brewing-company", "devils-backbone-distilling-co"}  # same company
        elif "oakridgeestate" in key:
            url_keepers[key] = {"oak-ridge-estate", "oak-ridge-loop"}  # same venue
        elif "woodsonsmill" in key:
            url_keepers[key] = {"woodsons-mill", "woodsons-mill-loop"}  # same venue
        elif "dgif.virginia.gov/waterbody/lake-nelson" in key:
            url_keepers[key] = {"lake-nelson", "fishing-at-lake-nelson"}  # same location
        elif "aftonstaysva" in key or "aftonstays" in key:
            url_keepers[key] = {"boogie-nights-manor", "big-tiny-house", "rustys-retreat"}  # same operator
        elif "croftonstays" in key:
            url_keepers[key] = {"branch-at-afton-mountain-retreat", "bungalow-at-afton-mountain-retreat"}
        elif "hospitable.rentals" in key:
            url_keepers[key] = {"creekside", "cottage-on-route-151", "farmhouse-on-route-151"}
        elif "pathwaypropertiesva" in key:
            url_keepers[key] = {"time-to-wine-down", "love-afton-cabin", "adventure-awaits", "wintergreen-ridge-retreat"}
        elif "bestillgetaways" in key:
            url_keepers[key] = {"mountain-view-vista", "pilotview-hollow"}
        elif "afton-awaits" in key or "aftonawaits" in key:
            url_keepers[key] = {"afton-awaits"}
        elif "designspark" in key:
            url_keepers[key] = None  # unclear which; flag all
        elif "airbnb.com/h/" in key or "airbnb.com/rooms/" in key:
            url_keepers[key] = None  # same room on multiple = all suspicious
        elif "airbnb.com" in key and ("www.airbnb.com" in key or key == "http://www.airbnb.com"):
            url_keepers[key] = None  # generic = all wrong
        elif "profile.php" in key or "facebook.com/profile" in key:
            url_keepers[key] = None  # generic Facebook = both wrong
        elif "wintergreen-weekly" in key or "wintergreenresort.com/the-wintergreen" in key:
            url_keepers[key] = None  # newsletter, not a business site
        else:
            url_keepers[key] = {slugs[0]}  # first slug keep; others wrong (conservative)

    for key, slugs_names in url_to_slugs.items():
        if len(slugs_names) < 2: continue
        keepers = url_keepers.get(key)
        for slug, name in slugs_names:
            if keepers is None:
                errors.append((slug, "website", f"Shared URL with {len(slugs_names)} listings (unclear owner)", "Set to blank"))
            elif slug not in keepers:
                errors.append((slug, "website", f"Same URL as another listing (wrong business)", "Set to blank"))

    # (Omitted: "Donor has no external but final has URL" — that rule blanked 300+ and was reverted; not "for sure wrong" without manual review.)

    # Dedupe by (slug, field) keeping first
    seen = set()
    unique_errors = []
    for e in errors:
        k = (e[0], e[1])
        if k in seen: continue
        seen.add(k)
        unique_errors.append(e)

    # Build report
    lines = [
        "=" * 80,
        "DEFINITE ERRORS IN FINAL CSV (matched by SLUG, not id)",
        "=" * 80,
        "",
        "Source: " + FINAL_PATH,
        "Reference: " + DONOR_PATH,
        "Match key: slug (normalized). No id used.",
        "",
        "Total definite errors: " + str(len(unique_errors)),
        "",
        "=" * 80,
        "BY SLUG | FIELD | REASON | SUGGESTED FIX",
        "=" * 80,
        "",
    ]
    by_slug = defaultdict(list)
    for slug, field, reason, fix in unique_errors:
        by_slug[slug].append((field, reason, fix))
    for slug in sorted(by_slug.keys()):
        name = final_by_slug.get(slug, {}).get("name", "?")
        lines.append("Slug: " + slug + "  (" + name[:50] + ")")
        for field, reason, fix in by_slug[slug]:
            lines.append("  Field: " + field)
            lines.append("  Reason: " + reason)
            lines.append("  Fix: " + fix)
        lines.append("")

    lines.append("=" * 80)
    lines.append("SUMMARY BY FIELD")
    lines.append("=" * 80)
    by_field = defaultdict(int)
    for _, field, _, _ in unique_errors:
        by_field[field] += 1
    for f in sorted(by_field.keys()):
        lines.append("  " + f + ": " + str(by_field[f]))
    lines.append("")
    lines.append("=" * 80)
    lines.append("END OF REPORT")
    lines.append("=" * 80)

    report_text = "\n".join(lines)
    with open(REPORT_PATH, "w", encoding="utf-8") as out:
        out.write(report_text)
    print(report_text)
    print("\nReport written to " + REPORT_PATH)

if __name__ == "__main__":
    main()
