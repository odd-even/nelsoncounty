#!/usr/bin/env python3
"""
Scan listings for weird formatting:
- Raw URLs (not in <a href>) or broken URLs (space in domain, e.g. .co m)
- Double/multiple spaces
- Contact blocks with unformatted phone/email/URL
- www... without proper link
"""
import csv
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
INPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"
REPORT_PATH = REPO_ROOT / "CSV" / "LINK_AND_WHITESPACE_FORMATTING_REPORT.txt"

# Patterns
DOUBLE_SPACE = re.compile(r"  +")
# URL with space in it (broken): http...something .com or .co m
BROKEN_URL_SPACE = re.compile(r"https?://[^\s<>]*\s+[^\s<>]*\.(?:com|org|net|co\s*m)\b", re.I)
DOMAIN_WITH_SPACE = re.compile(r"\b(?:https?://)?[a-z0-9.-]*\s+[a-z0-9.-]*\.(?:com|org|net|io)\b", re.I)
# Raw URL not inside href= (simplified: URL-like string not preceded by href=)
# Match http:// or https:// or www. when not inside <a ... href="...">
RAW_HTTP = re.compile(r"(?<!href=[\"'])(?<!['\"])(https?://[^\s<>\"']+)", re.I)
RAW_WWW = re.compile(r"(?<![a-z0-9])(www\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,})(?![^<]*>)", re.I)
# Phone as plain digits/spaces/dashes not in tel: link
PLAIN_PHONE_NEAR_CONTACT = re.compile(r"Contact\s+[^<]*(?:\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", re.I)
# Snippet: "Contact " then something that isn't a tag
CONTACT_THEN_RAW = re.compile(r"Contact\s{2,}[^<]+(?:http|www|\d{3})", re.I)


def strip_tags(s):
    """Remove HTML tags for safe snippet."""
    return re.sub(r"<[^>]+>", " ", s)


def analyze(text, column_name):
    issues = []
    if not text or not text.strip():
        return issues

    # Double/multiple spaces
    m = DOUBLE_SPACE.findall(text)
    if m:
        issues.append(("double_or_more_spaces", len(m), _snippet(text, DOUBLE_SPACE.search(text).group(0))))

    # Broken URL (space in domain)
    for pat, label in [
        (BROKEN_URL_SPACE, "broken_url_space_in_domain"),
        (DOMAIN_WITH_SPACE, "domain_with_space"),
    ]:
        m = pat.search(text)
        if m:
            issues.append((label, 1, m.group(0)[:80]))

    # Raw http/https URL (likely not wrapped in <a>)
    # Only flag if the URL is not inside href="...
    for match in RAW_HTTP.finditer(text):
        url = match.group(1)
        # Skip if it's clearly inside an href (simplified: next char is ")
        pos = match.start()
        if "href=" in text[max(0, pos - 20) : pos] and '"' not in text[pos : pos + len(url) + 5]:
            continue
        # Skip image/media URLs
        if "imagekit.io" in url or "youtube.com" in url or "google.com/maps" in url:
            continue
        issues.append(("raw_http_url", 1, url[:80]))
        break  # one per field

    # Raw www. not in link
    for match in RAW_WWW.finditer(text):
        snippet = match.group(1)
        if "imagekit" in snippet or "google" in snippet or "youtube" in snippet:
            continue
        issues.append(("raw_www_url", 1, snippet[:60]))
        break

    # Contact followed by raw URL or phone (double space or unformatted)
    if "Contact" in text:
        m = CONTACT_THEN_RAW.search(text)
        if m:
            issues.append(("contact_then_raw_text", 1, strip_tags(m.group(0))[:100]))
        # Plain phone near Contact (no <a href='tel:')
        if re.search(r"Contact\s+[^<]*\+?\d", text) and "tel:" not in text[max(0, text.find("Contact") - 50) : text.find("Contact") + 200]:
            issues.append(("contact_plain_phone_or_unformatted", 1, _snippet(text, "Contact")))

    return [(column_name, *i) for i in issues]


def _snippet(text, needle, context=50):
    idx = text.find(needle) if isinstance(needle, str) else needle.start()
    if idx < 0:
        return ""
    start = max(0, idx - context)
    end = min(len(text), idx + len(needle) + context)
    s = text[start:end]
    s = strip_tags(s).replace("\n", " ").replace("\r", " ")
    while "  " in s:
        s = s.replace("  ", " ")
    return s.strip()[:120]


def main():
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    content_columns = ["description", "detailedDescription"]
    for i in range(1, 6):
        content_columns.append(f"accordion{i}Content")
        content_columns.append(f"accordionPanel{i}Content")
    content_columns = [c for c in content_columns if c in fieldnames]

    report = []
    report.append("=" * 80)
    report.append("LINK & WHITESPACE FORMATTING REPORT")
    report.append("Source: final_listings_PERFECT_br_cleaned.csv")
    report.append("Checks: broken URLs, raw URLs, double spaces, messy Contact blocks")
    report.append("=" * 80)

    found_any = []
    for row in rows:
        name = (row.get("name") or "").strip()
        slug = (row.get("slug") or "").strip()
        listing_issues = []
        for col in content_columns:
            val = row.get(col)
            if val:
                for item in analyze(val, col):
                    listing_issues.append(item)
        if listing_issues:
            found_any.append((name, slug, listing_issues))

    for name, slug, issues in found_any:
        report.append("")
        report.append(f"  {name} ({slug})")
        for col, kind, *rest in issues:
            if len(rest) == 2:
                count, snippet = rest
                report.append(f"    [{col}] {kind} (count={count})")
                report.append(f"      -> {snippet}")
            else:
                report.append(f"    [{col}] {kind}")
                if rest:
                    report.append(f"      -> {rest[0]}")

    report.append("")
    report.append("-" * 80)
    report.append(f"Total listings with at least one formatting issue: {len(found_any)}")
    report.append("=" * 80)

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print(f"Wrote {REPORT_PATH}")
    print(f"Listings with formatting issues: {len(found_any)}")


if __name__ == "__main__":
    main()
