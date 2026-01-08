#!/usr/bin/env python3
"""
Fix CSV to ensure proper column alignment for admin panel and Google Sheets
This script ensures all fields are properly escaped and all rows have correct field counts
"""

import csv
import sys
import os

def fix_csv_for_admin(input_path, output_path):
    """Fix CSV structure to ensure admin panel compatibility"""
    
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
            # Create a clean row with all fields properly set
            clean_row = {}
            
            for field in fieldnames:
                value = row.get(field, '')
                
                # Convert None to empty string
                if value is None:
                    value = ''
                else:
                    value = str(value).strip()
                
                # Clean up problematic values
                # Fix date fields - must be YYYY-MM-DD or empty
                if field in ['publishedDate', 'modifiedDate']:
                    if value and value.lower() in ['josh', 'false', 'true']:
                        value = ''
                    elif value:
                        import re
                        if not re.match(r'^\d{4}-\d{2}-\d{2}$', value):
                            # If it's not a valid date format, clear it
                            if len(value) < 10 or not value.startswith('20'):
                                value = ''
                
                # Fix URL fields - must be valid URL or empty
                if field in ['directionsLink', 'website', 'videoLink', 'googleMapsUrl']:
                    if value and value.lower() == 'false':
                        value = ''
                    elif value and not value.startswith('http://') and not value.startswith('https://'):
                        # If it looks like it should be a URL but isn't, clear it
                        if len(value) > 5 and '.' not in value:
                            value = ''
                
                # Fix image fields - must be URL or empty
                if field in ['image1', 'image2', 'image3']:
                    if value and not value.startswith('http://') and not value.startswith('https://'):
                        # If it's not a URL and has commas or is very long, it's probably wrong
                        if ',' in value or len(value) > 200:
                            value = ''
                
                clean_row[field] = value
            
            rows.append(clean_row)
    
    print(f"✅ Processed {len(rows)} rows")
    
    # Write fixed CSV with proper escaping
    print(f"\n💾 Writing fixed CSV: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        # Use QUOTE_NONNUMERIC to ensure all fields that might contain commas are quoted
        # This prevents Google Sheets from misinterpreting the CSV
        writer = csv.DictWriter(
            f, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_NONNUMERIC,  # Quote all non-numeric fields
            escapechar=None,
            doublequote=True
        )
        writer.writeheader()
        
        for row in rows:
            # Convert all values to strings and ensure proper formatting
            clean_write_row = {}
            for field in fieldnames:
                value = row.get(field, '')
                # Convert to string, but keep empty strings as empty
                if value == '':
                    clean_write_row[field] = ''
                else:
                    clean_write_row[field] = str(value)
            
            writer.writerow(clean_write_row)
    
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
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned.csv'
    output_file = input_file.replace('.csv', '-admin-fixed.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    if fix_csv_for_admin(input_file, output_file):
        print(f"\n✅ Complete! Fixed CSV saved to: {output_file}")
        print(f"\n📋 This file should work correctly in:")
        print(f"   - Google Sheets upload")
        print(f"   - Admin panel CSV import")
        print(f"   - Framer CMS sync")
    else:
        print(f"\n❌ Failed to fix CSV")
        sys.exit(1)


if __name__ == '__main__':
    main()
