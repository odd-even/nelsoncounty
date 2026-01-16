#!/usr/bin/env python3
"""
Fix CSV by replacing newlines in data fields with <br> tags
This makes it compatible with JavaScript line-by-line CSV parsers
"""

import csv

def fix_csv_newlines(input_file, output_file):
    """Replace newlines in CSV fields with <br> tags"""
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"Found {len(rows)} rows with {len(fieldnames)} columns")
    
    # Replace newlines in all text fields with <br> tags
    fields_to_fix = ['description', 'detailedDescription', 'accordionPanel1Content', 
                     'accordionPanel2Content', 'accordionPanel3Content', 'accordionPanel4Content']
    
    fixed_count = 0
    for row in rows:
        for field in fieldnames:
            if field in fields_to_fix:
                value = row.get(field, '')
                if value and isinstance(value, str) and '\n' in value:
                    # Replace newlines with <br> tags
                    row[field] = value.replace('\n', '<br>')
                    fixed_count += 1
    
    print(f"Fixed newlines in {fixed_count} fields")
    
    # Write the fixed CSV
    print(f"\nWriting fixed CSV to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL, doublequote=True)
        writer.writeheader()
        
        for row in rows:
            clean_row = {}
            for field in fieldnames:
                value = row.get(field, '')
                if value is None:
                    value = ''
                else:
                    value = str(value)
                clean_row[field] = value
            writer.writerow(clean_row)
    
    # Verify - check that all rows are single-line
    print(f"\nVerifying...")
    with open(output_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f"Total lines: {len(lines)}")
        print(f"Expected rows: {len(rows) + 1} (including header)")
        
        if len(lines) == len(rows) + 1:
            print(f"✅ All rows are single-line!")
        else:
            print(f"⚠️ Some rows still span multiple lines")
            print(f"   Difference: {len(lines) - (len(rows) + 1)} extra lines")
        
        # Parse to verify
        f.seek(0)
        reader = csv.DictReader(f)
        verify_rows = list(reader)
        print(f"✅ Parsed {len(verify_rows)} rows successfully")
        
        # Check Allen Creek
        allen_creek = [r for r in verify_rows if r.get('slug') == 'allen-creek-nature-preserve']
        if allen_creek:
            ac = allen_creek[0]
            dd = ac.get('detailedDescription', '')
            has_newlines = '\n' in dd
            has_br = '<br>' in dd
            print(f"\n✅ Allen Creek Nature Preserve:")
            print(f"   Fields: {len([k for k in fieldnames if k in ac])}")
            print(f"   detailedDescription has newlines: {has_newlines}")
            print(f"   detailedDescription has <br> tags: {has_br}")
    
    print(f"\n✅ Complete!")
    print(f"  Fixed CSV: {output_file}")

if __name__ == '__main__':
    input_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    fix_csv_newlines(input_file, output_file)
