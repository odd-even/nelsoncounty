#!/usr/bin/env python3
"""
Merge slugs from listings-2025-11-13-15.csv into listings-2025-11-13-14.csv
Matches listings by name and updates slugs while keeping all other data from -14.csv
"""

import csv
import sys
from pathlib import Path

def normalize_name(name):
    """Normalize name for matching (lowercase, strip quotes)"""
    if not name:
        return ''
    return str(name).strip().lower().strip('"').strip("'")

def parse_csv_line(line):
    """Parse a CSV line, handling quoted fields with newlines"""
    reader = csv.reader([line])
    try:
        return next(reader)
    except:
        # If that fails, try reading the whole line manually
        return line.split(',')

def read_csv_file(filename):
    """Read CSV file handling multiline fields"""
    rows = []
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            rows.append(row)
    return header, rows

def main():
    # File paths
    base_path = Path(__file__).parent
    file_14 = base_path / 'listings-2025-11-13-14.csv'
    file_15 = base_path / 'listings-2025-11-13-15.csv'
    output_file = base_path / 'listings-2025-11-13-14-merged.csv'
    
    print(f"Reading {file_14.name}...")
    header_14, rows_14 = read_csv_file(file_14)
    
    print(f"Reading {file_15.name}...")
    header_15, rows_15 = read_csv_file(file_15)
    
    # Find column indices
    try:
        name_idx_14 = header_14.index('name')
        slug_idx_14 = header_14.index('slug')
        name_idx_15 = header_15.index('name')
        slug_idx_15 = header_15.index('slug')
    except ValueError as e:
        print(f"Error: Could not find required column. {e}")
        sys.exit(1)
    
    # Create a lookup map from -15.csv: normalized_name -> slug
    slug_map = {}
    for row_15 in rows_15:
        if len(row_15) > max(name_idx_15, slug_idx_15):
            name_15 = normalize_name(row_15[name_idx_15])
            slug_15 = row_15[slug_idx_15].strip().strip('"').strip("'")
            if name_15 and slug_15:
                slug_map[name_15] = slug_15
    
    print(f"Found {len(slug_map)} slugs in {file_15.name}")
    
    # Update rows from -14.csv with slugs from -15.csv
    updated_count = 0
    not_found = []
    
    for row_14 in rows_14:
        if len(row_14) > max(name_idx_14, slug_idx_14):
            name_14 = normalize_name(row_14[name_idx_14])
            
            if name_14 in slug_map:
                # Update slug
                old_slug = row_14[slug_idx_14]
                new_slug = slug_map[name_14]
                row_14[slug_idx_14] = new_slug
                if old_slug != new_slug:
                    updated_count += 1
                    print(f"  Updated: '{row_14[name_idx_14]}' -> slug: '{new_slug}'")
            else:
                not_found.append(row_14[name_idx_14] if row_14[name_idx_14] else '(empty name)')
    
    # Write merged CSV
    print(f"\nWriting merged CSV to {output_file.name}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header_14)
        writer.writerows(rows_14)
    
    print(f"\n✅ Done!")
    print(f"  - Updated {updated_count} slugs")
    print(f"  - Output: {output_file.name}")
    
    if not_found:
        print(f"\n⚠️  {len(not_found)} listings from -14.csv not found in -15.csv:")
        for name in not_found[:10]:  # Show first 10
            print(f"    - {name}")
        if len(not_found) > 10:
            print(f"    ... and {len(not_found) - 10} more")

if __name__ == '__main__':
    main()
