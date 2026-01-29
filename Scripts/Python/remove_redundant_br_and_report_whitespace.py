#!/usr/bin/env python3
"""
Remove redundant <br> between block-level tags in detailedDescription and accordion content.
Detect and report all listings with excess whitespace (redundant br, multiple spaces, newlines).
Writes cleaned CSV and a full report.
"""
import csv
import re
from pathlib import Path

# Paths: script is in Scripts/Python/, repo root is parent of Scripts
REPO_ROOT = Path(__file__).resolve().parents[2]
INPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT.csv"
OUTPUT_CSV = REPO_ROOT / "CSV" / "final_listings_PERFECT_br_cleaned.csv"
REPORT_PATH = REPO_ROOT / "CSV" / "REDUNDANT_BR_AND_WHITESPACE_REPORT.txt"

# Block end then optional br(s) then block start -> remove br chain
BLOCK_END = r'(</(?:p|h[4-6])>)'
BR_CHAIN = r'\s*(?:<br\s*/?>\s*)+'
BLOCK_START = r'(<(?:p|h[4-6])[\s>])'
REDUNDANT_BR_BETWEEN_BLOCKS = re.compile(
    BLOCK_END + BR_CHAIN + BLOCK_START,
    re.IGNORECASE
)

# Detect excess whitespace for reporting
THREE_OR_MORE_BR = re.compile(r'(<br\s*/?>\s*){3,}', re.IGNORECASE)
MULTIPLE_SPACES = re.compile(r'  +')
NEWLINES = re.compile(r'[\r\n]+')
BR_BETWEEN_BLOCKS_PATTERN = re.compile(
    r'</(?:p|h[4-6])>\s*(?:<br\s*/?>\s*)+<(?:p|h[4-6])',
    re.IGNORECASE
)


def remove_redundant_br(html):
    if not html or not html.strip():
        return html
    return REDUNDANT_BR_BETWEEN_BLOCKS.sub(r'\1\2', html)


def analyze_whitespace(text, column_name):
    """Return list of issues: (issue_type, count or snippet)."""
    if not text or not text.strip():
        return []
    issues = []
    # Redundant br between block tags (before fix)
    m = BR_BETWEEN_BLOCKS_PATTERN.findall(text)
    if m:
        issues.append(("redundant_br_between_blocks", len(m)))
    # 3+ consecutive <br>
    m = THREE_OR_MORE_BR.findall(text)
    if m:
        issues.append(("three_plus_br", len(m)))
    # Multiple spaces (2+)
    m = MULTIPLE_SPACES.findall(text)
    if m:
        issues.append(("multiple_spaces", len(m)))
    # Literal newlines
    if '\n' in text or '\r' in text:
        issues.append(("literal_newlines", text.count('\n') + text.count('\r')))
    return [(column_name, *i) for i in issues]


def main():
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    content_columns = ['detailedDescription']
    for i in range(1, 6):
        content_columns.append(f'accordion{i}Content')
        content_columns.append(f'accordionPanel{i}Content')
    content_columns = [c for c in content_columns if c in fieldnames]

    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("REDUNDANT <br> REMOVAL & WHITESPACE REPORT")
    report_lines.append("Source: final_listings_PERFECT.csv")
    report_lines.append("Output: final_listings_PERFECT_br_cleaned.csv")
    report_lines.append("=" * 80)

    # 1) Pre-scan: list all listings with any whitespace issues (before fix)
    report_lines.append("")
    report_lines.append("SECTION 1: LISTINGS WITH EXCESS WHITESPACE (BEFORE CLEANING)")
    report_lines.append("-" * 80)
    listings_with_issues = []  # (name, slug, issues list)
    for row in rows:
        name = (row.get('name') or '').strip()
        slug = (row.get('slug') or '').strip()
        all_issues = []
        for col in content_columns:
            val = row.get(col)
            if val:
                for item in analyze_whitespace(val, col):
                    all_issues.append(item)
        if all_issues:
            listings_with_issues.append((name, slug, all_issues))

    for name, slug, issues in listings_with_issues:
        report_lines.append(f"\n  {name} ({slug})")
        for col, kind, count in issues:
            report_lines.append(f"    - {col}: {kind} = {count}")

    report_lines.append("")
    report_lines.append(f"Total listings with at least one whitespace issue: {len(listings_with_issues)}")

    # 2) Apply redundant br removal and track changes
    report_lines.append("")
    report_lines.append("SECTION 2: CHANGES MADE (REDUNDANT <br> BETWEEN BLOCK TAGS REMOVED)")
    report_lines.append("-" * 80)
    changed_listings = []
    for row in rows:
        name = (row.get('name') or '').strip()
        slug = (row.get('slug') or '').strip()
        changes = []
        for col in content_columns:
            val = row.get(col)
            if val:
                new_val = remove_redundant_br(val)
                if new_val != val:
                    saved = len(val) - len(new_val)
                    changes.append((col, saved, val.count('<br>') - new_val.count('<br>')))
                    row[col] = new_val
        if changes:
            changed_listings.append((name, slug, changes))

    for name, slug, changes in changed_listings:
        report_lines.append(f"\n  {name} ({slug})")
        for col, bytes_saved, br_removed in changes:
            report_lines.append(f"    - {col}: {br_removed} <br> removed, {bytes_saved} chars saved")

    report_lines.append("")
    report_lines.append(f"Total listings modified: {len(changed_listings)}")

    # 3) Post-scan: remaining issues (3+ br, multiple spaces, newlines) for review
    report_lines.append("")
    report_lines.append("SECTION 3: REMAINING WHITESPACE ISSUES (AFTER CLEANING) — REVIEW THESE")
    report_lines.append("-" * 80)
    remaining = []
    for row in rows:
        name = (row.get('name') or '').strip()
        slug = (row.get('slug') or '').strip()
        all_issues = []
        for col in content_columns:
            val = row.get(col)
            if val:
                # Don't report "redundant_br_between_blocks" again (we fixed those)
                for item in analyze_whitespace(val, col):
                    if item[1] != "redundant_br_between_blocks":
                        all_issues.append(item)
        if all_issues:
            remaining.append((name, slug, all_issues))

    if not remaining:
        report_lines.append("\n  None.")
    else:
        for name, slug, issues in remaining:
            report_lines.append(f"\n  {name} ({slug})")
            for col, kind, count in issues:
                report_lines.append(f"    - {col}: {kind} = {count}")

    report_lines.append("")
    report_lines.append("=" * 80)
    report_lines.append("END OF REPORT")
    report_lines.append("=" * 80)

    # Write cleaned CSV
    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    # Write report
    report_text = "\n".join(report_lines)
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(report_text)

    print(f"Wrote {OUTPUT_CSV}")
    print(f"Wrote {REPORT_PATH}")
    print(f"Listings with issues (before): {len(listings_with_issues)}")
    print(f"Listings modified (redundant br removed): {len(changed_listings)}")
    print(f"Listings with remaining issues (after): {len(remaining)}")


if __name__ == "__main__":
    main()
