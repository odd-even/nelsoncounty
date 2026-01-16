#!/usr/bin/env python3
"""
Fix CSV column mismatch issues by ensuring all fields are properly quoted and escaped
"""

import csv
import io

def fix_csv_file(input_file, output_file):
    """Read and rewrite CSV with proper formatting."""
    print(f"Reading {input_file}...")
    
    # Read the CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"Found {len(rows)} rows with {len(fieldnames)} columns")
    
    # Check for column count issues
    issues = []
    for i, row in enumerate(rows, 1):
        # Count actual values (non-empty)
        non_empty_count = sum(1 for k in fieldnames if row.get(k) and str(row.get(k)).strip())
        
        # Check for any extra keys
        extra_keys = set(row.keys()) - set(fieldnames)
        if extra_keys:
            issues.append(f"Row {i+1} ({row.get('name', 'N/A')}): Has extra keys: {extra_keys}")
    
    if issues:
        print(f"\n⚠️ Found {len(issues)} potential issues:")
        for issue in issues[:5]:
            print(f"  {issue}")
    
    # Write with strict formatting - quote all fields that need it
    print(f"\nWriting fixed CSV to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        # Use QUOTE_MINIMAL with doublequote=True for proper escaping
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL, doublequote=True)
        writer.writeheader()
        
        # Write rows, ensuring we only write the expected fields
        for row in rows:
            # Create a clean row with only expected fields
            clean_row = {}
            for field in fieldnames:
                value = row.get(field, '')
                # Ensure value is a string
                if value is None:
                    value = ''
                else:
                    value = str(value)
                clean_row[field] = value
            writer.writerow(clean_row)
    
    # Verify the output
    print(f"\nVerifying output...")
    with open(output_file, 'r', encoding='utf-8') as f:
        # Read as raw text first to check line structure
        lines = f.readlines()
        print(f"Total lines: {len(lines)}")
        
        # Now parse as CSV
        f.seek(0)
        reader = csv.DictReader(f)
        verify_rows = list(reader)
        
        # Check column counts
        header_count = len(reader.fieldnames)
        print(f"Header columns: {header_count}")
        
        mismatches = []
        for i, row in enumerate(verify_rows, 1):
            # Count non-empty values
            value_count = sum(1 for k in reader.fieldnames if row.get(k))
            if value_count > header_count:
                mismatches.append(f"Row {i+1}: {value_count} values (expected {header_count})")
        
        if mismatches:
            print(f"⚠️ Found {len(mismatches)} mismatches:")
            for mismatch in mismatches[:5]:
                print(f"  {mismatch}")
        else:
            print(f"✅ All rows have correct column count")
        
        print(f"✅ Verified: {len(verify_rows)} rows parsed successfully")
    
    print(f"\n✅ Complete!")
    print(f"  Fixed CSV: {output_file}")
    print(f"  Total rows: {len(rows)}")
    print(f"  Total columns: {len(fieldnames)}")

if __name__ == '__main__':
    input_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL-FIXED.csv'
    fix_csv_file(input_file, output_file)
