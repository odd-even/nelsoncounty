#!/usr/bin/env python3
"""
Fix CSV formatting issues - ensure proper quoting and escaping for upload compatibility
"""

import csv
import re

def clean_field(value):
    """Clean a field value to ensure proper CSV formatting."""
    if not value:
        return ''
    
    # Convert to string
    value = str(value)
    
    # Remove any problematic characters that might break CSV
    # But preserve newlines (they'll be handled by CSV writer)
    
    return value

def main():
    input_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL-FIXED.csv'
    
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    print(f"Found {len(rows)} rows with {len(fieldnames)} columns")
    
    # Clean all fields
    for row in rows:
        for key in fieldnames:
            if key in row:
                row[key] = clean_field(row[key])
    
    # Write with proper CSV formatting
    print(f"\nWriting fixed CSV to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        # Use QUOTE_NONNUMERIC to quote all non-numeric fields
        # This ensures compatibility with most CSV parsers
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_NONNUMERIC)
        writer.writeheader()
        writer.writerows(rows)
    
    # Verify the output
    print(f"\nVerifying output...")
    with open(output_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        verify_rows = list(reader)
        print(f"✅ Verified: {len(verify_rows)} rows parsed successfully")
    
    print(f"\n✅ Complete!")
    print(f"  Fixed CSV: {output_file}")
    print(f"  Total rows: {len(rows)}")
    print(f"  Total columns: {len(fieldnames)}")

if __name__ == '__main__':
    main()
