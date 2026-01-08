#!/usr/bin/env python3
"""
Fix CSV escaping issues that cause column misalignment
Re-exports the cleaned file with proper CSV escaping
"""

import csv
import sys
import os

def fix_csv_escaping(input_path, output_path):
    """Re-export CSV with proper escaping to fix column alignment"""
    
    print(f"📖 Reading CSV: {input_path}")
    
    rows = []
    fieldnames = None
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ No headers found in CSV")
            return False
        
        print(f"✅ Found {len(fieldnames)} columns")
        
        for i, row in enumerate(reader, 2):
            # Create a clean row - ensure all values are properly formatted
            clean_row = {}
            
            for field in fieldnames:
                value = row.get(field, '')
                
                # Convert None to empty string
                if value is None:
                    value = ''
                else:
                    # Convert to string and strip
                    value = str(value).strip()
                
                # The CSV writer will handle escaping automatically
                # We just need to ensure the value is a string
                clean_row[field] = value
            
            rows.append(clean_row)
    
    print(f"✅ Processed {len(rows)} rows")
    
    # Write with proper CSV escaping
    print(f"\n💾 Writing properly escaped CSV: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        # Use QUOTE_MINIMAL - Python's csv module will automatically:
        # - Quote fields containing commas, quotes, or newlines
        # - Escape quotes by doubling them
        writer = csv.DictWriter(
            f, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_MINIMAL,  # Quote only when necessary
            escapechar=None,
            doublequote=True  # Double quotes to escape quotes
        )
        writer.writeheader()
        
        for row in rows:
            writer.writerow(row)
    
    print(f"✅ Fixed CSV written successfully")
    
    # Verify the output
    print(f"\n🔍 Verifying output CSV...")
    with open(output_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        expected_fields = len(headers)
        
        issues = 0
        for i, row in enumerate(reader, 2):
            if len(row) != expected_fields:
                issues += 1
                if issues <= 5:
                    print(f"   ⚠️  Line {i}: Expected {expected_fields} fields, got {len(row)}")
        
        if issues == 0:
            print(f"✅ All {len(rows)} rows have correct field count ({expected_fields})")
        else:
            print(f"⚠️  Found {issues} rows with incorrect field counts")
    
    return True


def main():
    # Use the cleaned file (with address/phone fixes) but re-export with proper escaping
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned.csv'
    output_file = input_file.replace('.csv', '-properly-escaped.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    if fix_csv_escaping(input_file, output_file):
        print(f"\n✅ Complete! Properly escaped CSV saved to: {output_file}")
        print(f"\n📋 This file:")
        print(f"   - Keeps all your address/phone cleaning changes")
        print(f"   - Has proper CSV escaping to prevent column misalignment")
        print(f"   - Should work correctly in admin panel and Google Sheets")
    else:
        print(f"\n❌ Failed to fix CSV")
        sys.exit(1)


if __name__ == '__main__':
    main()
