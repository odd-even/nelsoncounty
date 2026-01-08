#!/usr/bin/env python3
"""
Fix CSV structure issues - ensure all rows have correct number of fields
and all data is properly escaped for Framer compatibility
"""

import csv
import sys
import os

def fix_csv_structure(input_path, output_path):
    """Fix CSV structure to ensure Framer compatibility"""
    
    print(f"📖 Reading CSV: {input_path}")
    
    # Read all rows
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
            # Ensure all fields exist
            fixed_row = {}
            for field in fieldnames:
                value = row.get(field, '')
                # Clean up the value
                if value is None:
                    value = ''
                else:
                    value = str(value).strip()
                fixed_row[field] = value
            
            rows.append(fixed_row)
            
            # Check for issues
            name = fixed_row.get('name', 'Unknown')
            pub_date = fixed_row.get('publishedDate', '')
            mod_date = fixed_row.get('modifiedDate', '')
            dir_link = fixed_row.get('directionsLink', '')
            
            # Fix common issues
            if pub_date == 'josh' or pub_date.lower() in ['false', 'true']:
                print(f"   ⚠️  Line {i}: {name} - Fixing publishedDate: '{pub_date}' → ''")
                fixed_row['publishedDate'] = ''
            
            if mod_date == 'josh' or mod_date.lower() in ['false', 'true']:
                print(f"   ⚠️  Line {i}: {name} - Fixing modifiedDate: '{mod_date}' → ''")
                fixed_row['modifiedDate'] = ''
            
            if dir_link.lower() == 'false':
                print(f"   ⚠️  Line {i}: {name} - Fixing directionsLink: 'false' → ''")
                fixed_row['directionsLink'] = ''
            
            # Fix image URLs that contain descriptions
            for img_field in ['image1', 'image2', 'image3']:
                img_url = fixed_row.get(img_field, '')
                if img_url and not img_url.startswith('http'):
                    # If it doesn't start with http, it's probably wrong
                    if ',' in img_url or len(img_url) > 200:
                        print(f"   ⚠️  Line {i}: {name} - Fixing {img_field}: contains description → ''")
                        fixed_row[img_field] = ''
    
    print(f"\n✅ Processed {len(rows)} rows")
    
    # Write fixed CSV
    print(f"\n💾 Writing fixed CSV: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        
        for row in rows:
            writer.writerow(row)
    
    print(f"✅ Fixed CSV written successfully")
    return True


def main():
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned.csv'
    output_file = input_file.replace('.csv', '-fixed.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    if fix_csv_structure(input_file, output_file):
        print(f"\n✅ Complete! Fixed CSV saved to: {output_file}")
    else:
        print(f"\n❌ Failed to fix CSV")
        sys.exit(1)


if __name__ == '__main__':
    main()
