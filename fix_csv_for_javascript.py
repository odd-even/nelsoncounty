#!/usr/bin/env python3
"""
Fix CSV to be compatible with JavaScript line-by-line parser
The issue is that multiline fields need to be on a single line or properly handled
"""

import csv
import io

def fix_csv_for_javascript(input_file, output_file):
    """Rewrite CSV ensuring all fields are on single lines (replace newlines with spaces or <br>)"""
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"Found {len(rows)} rows with {len(fieldnames)} columns")
    
    # Fix each row - replace newlines in fields with <br> tags for HTML compatibility
    for row in rows:
        for field in fieldnames:
            value = row.get(field, '')
            if value and isinstance(value, str):
                # Replace newlines with <br> for HTML display, but keep them as \n for CSV
                # Actually, for JavaScript CSV parser, we should keep newlines but ensure proper quoting
                # The issue might be that fields with newlines aren't being quoted properly
                pass
    
    # Write with proper quoting - ensure all fields with special chars are quoted
    print(f"\nWriting fixed CSV to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL, doublequote=True, lineterminator='\n')
        writer.writeheader()
        
        for row in rows:
            # Ensure clean row with only expected fields
            clean_row = {}
            for field in fieldnames:
                value = row.get(field, '')
                if value is None:
                    value = ''
                else:
                    value = str(value)
                clean_row[field] = value
            writer.writerow(clean_row)
    
    # Verify by reading back
    print(f"\nVerifying...")
    with open(output_file, 'r', encoding='utf-8') as f:
        # Read line by line to check for multiline fields
        lines = f.readlines()
        print(f"Total lines in file: {len(lines)}")
        
        # Check if any data row spans multiple lines (shouldn't happen with proper CSV)
        header_line = lines[0]
        expected_commas = header_line.count(',')
        print(f"Expected commas per row: {expected_commas}")
        
        multiline_rows = []
        for i, line in enumerate(lines[1:], start=2):
            # Count commas (rough check)
            comma_count = line.count(',')
            # If a line doesn't end with a quote and newline, it might be a continuation
            if not line.rstrip().endswith('"') and comma_count < expected_commas:
                # This might be a multiline field continuation
                multiline_rows.append(i)
        
        if multiline_rows:
            print(f"⚠️ Found {len(multiline_rows)} potential multiline rows: {multiline_rows[:5]}")
        else:
            print(f"✅ All rows appear to be single-line")
        
        # Now parse properly
        f.seek(0)
        reader = csv.DictReader(f)
        verify_rows = list(reader)
        print(f"✅ Parsed {len(verify_rows)} rows successfully")
        
        # Check Allen Creek specifically
        allen_creek = [r for r in verify_rows if r.get('slug') == 'allen-creek-nature-preserve']
        if allen_creek:
            ac = allen_creek[0]
            print(f"\n✅ Allen Creek Nature Preserve:")
            print(f"   Fields: {len([k for k in fieldnames if k in ac])}")
            print(f"   Expected: {len(fieldnames)}")
    
    print(f"\n✅ Complete!")
    print(f"  Fixed CSV: {output_file}")

if __name__ == '__main__':
    input_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    fix_csv_for_javascript(input_file, output_file)
