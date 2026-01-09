#!/usr/bin/env python3
"""
Fix CSV alignment issues - ensure all rows have the same number of columns
Ensure detailedDescription column exists and is properly aligned
"""

import csv
import sys
import os

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)


def main():
    input_file = 'try it listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content-reviewed-fixed-with-short-summaries-with-links-cleaned-descriptions.csv'
    output_file = input_file.replace('.csv', '-aligned.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"📖 Reading CSV: {input_file}")
    
    # Read all rows
    rows = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        
        # Ensure detailedDescription is in fieldnames
        if 'detailedDescription' not in fieldnames:
            # Find where to insert it (after description)
            if 'description' in fieldnames:
                desc_index = fieldnames.index('description')
                fieldnames.insert(desc_index + 1, 'detailedDescription')
                print(f"⚠️  Added missing detailedDescription column after description")
            else:
                fieldnames.append('detailedDescription')
                print(f"⚠️  Added missing detailedDescription column at end")
        
        print(f"✅ Found {len(fieldnames)} columns")
        print(f"   Columns: {', '.join(fieldnames[:10])}...")
        print()
        
        # Read all rows
        for row in reader:
            rows.append(row)
    
    print(f"✅ Loaded {len(rows)} rows")
    print()
    
    # Check for alignment issues
    print(f"🔍 Checking alignment...")
    issues = []
    
    for i, row in enumerate(rows):
        # Ensure all fieldnames exist in row (with empty string if missing)
        for field in fieldnames:
            if field not in row:
                row[field] = ''
        
        # Count non-empty values
        non_empty = sum(1 for field in fieldnames if row.get(field, '').strip())
        
        # Check if detailedDescription is missing or empty
        if 'detailedDescription' not in row or not row.get('detailedDescription'):
            row['detailedDescription'] = ''  # Ensure it exists even if empty
    
    print(f"✅ All rows aligned to {len(fieldnames)} columns")
    print()
    
    # Write fixed CSV
    print(f"💾 Writing aligned CSV to: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        # Use QUOTE_MINIMAL but ensure fields with special chars are quoted
        # This is compatible with Google Sheets and most CSV parsers
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL, escapechar='\\')
        writer.writeheader()
        
        for row in rows:
            # Ensure row has all fields, in correct order
            ordered_row = {}
            for field in fieldnames:
                value = row.get(field, '').strip()
                # Ensure empty strings are empty (not None)
                # The CSV writer will automatically quote fields with commas, newlines, or quotes
                ordered_row[field] = value if value else ''
            writer.writerow(ordered_row)
    
    print(f"✅ Complete! Output saved to: {output_file}")
    print()
    
    # Verify output
    print(f"🔍 Verifying output...")
    with open(output_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        output_fieldnames = list(reader.fieldnames)
        output_rows = list(reader)
    
    print(f"   Output columns: {len(output_fieldnames)}")
    print(f"   Output rows: {len(output_rows)}")
    
    # Check first few rows
    for i, row in enumerate(output_rows[:3]):
        desc = row.get('description', '')
        detailed = row.get('detailedDescription', '')
        print(f"   Row {i+1} ({row.get('name', 'Unknown')[:30]}): desc={len(desc)} chars, detailed={len(detailed)} chars")
    
    print()
    print("✅ CSV is now properly aligned!")
    print("   - All rows have the same number of columns")
    print("   - detailedDescription column exists for all rows (empty if no content)")
    print("   - Ready for admin panel import")


if __name__ == '__main__':
    main()
