#!/usr/bin/env python3
"""
Fix and clean up amenities in the merged CSV file:
1. Remove URLs from amenities column
2. Consolidate similar amenities (Tours vs Guided Tours)
3. Optionally consolidate single-use amenities
"""

import csv
import sys
import re
from pathlib import Path

# Amenity consolidation mapping
AMENITY_FIXES = {
    # Consolidate Tours
    'Guided Tours': 'Tours',  # Merge Guided Tours into Tours
    
    # Consolidate single-use amenities (excluding Classes, Delivery, Museum)
    'Biking': 'Adventure',  # Merge Biking into Adventure
    'Curbside Pickup': 'Order Pickup',  # Merge Curbside Pickup into Order Pickup
    'Drive-Thru': 'Takeout',  # Merge Drive-Thru into Takeout
    'Grocery': 'Market',  # Merge Grocery into Market
    'Meetings': 'Events',  # Merge Meetings into Events
    # Note: Classes, Delivery, and Museum are NOT consolidated per user request
}

def is_url(text):
    """Check if text is a URL"""
    text_lower = text.lower().strip()
    return 'http' in text_lower or 'www.' in text_lower or text_lower.startswith('//')

def clean_amenities(amenities_str):
    """Clean amenities string - remove URLs and apply fixes"""
    if not amenities_str or not amenities_str.strip():
        return ''
    
    # Split by semicolon or comma
    amenities = re.split(r'[;,]', amenities_str)
    amenities = [a.strip() for a in amenities if a.strip()]
    
    # Remove URLs
    amenities = [a for a in amenities if not is_url(a)]
    
    # Apply fixes
    cleaned = []
    for amenity in amenities:
        if amenity in AMENITY_FIXES:
            new_amenity = AMENITY_FIXES[amenity]
            # Only add if not already in list
            if new_amenity not in cleaned:
                cleaned.append(new_amenity)
        else:
            if amenity and amenity not in cleaned:
                cleaned.append(amenity)
    
    return '; '.join(cleaned)

def main():
    input_file = Path('listings-2025-11-13-14-merged.csv')
    output_file = Path('listings-2025-11-13-14-merged.csv')
    
    if not input_file.exists():
        print(f"Error: {input_file} not found")
        sys.exit(1)
    
    print(f"Reading {input_file.name}...")
    
    rows = []
    header = None
    updates = []
    url_removed = []
    consolidated = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        amen_idx = header.index('amenities')
        name_idx = header.index('name')
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) > amen_idx:
                name = row[name_idx].strip() if len(row) > name_idx else ''
                amenities_str = row[amen_idx].strip() if len(row) > amen_idx else ''
                
                if amenities_str:
                    # Check for URLs or consolidation needed
                    original_amenities = amenities_str
                    cleaned_amenities = clean_amenities(amenities_str)
                    
                    if cleaned_amenities != original_amenities:
                        # Check what changed
                        original_list = [a.strip() for a in re.split(r'[;,]', original_amenities) if a.strip()]
                        cleaned_list = [a.strip() for a in cleaned_amenities.split(';') if a.strip()]
                        
                        # Find removed URLs
                        removed_urls = [a for a in original_list if is_url(a)]
                        if removed_urls:
                            url_removed.append({
                                'row_num': row_num,
                                'name': name,
                                'urls': removed_urls
                            })
                        
                        # Find consolidated amenities
                        for orig_amenity in original_list:
                            if orig_amenity in AMENITY_FIXES and orig_amenity not in removed_urls:
                                new_amenity = AMENITY_FIXES[orig_amenity]
                                if orig_amenity not in cleaned_list and new_amenity in cleaned_list:
                                    consolidated.append({
                                        'row_num': row_num,
                                        'name': name,
                                        'old': orig_amenity,
                                        'new': new_amenity
                                    })
                        
                        # Update the row
                        row[amen_idx] = cleaned_amenities
                        updates.append({
                            'row_num': row_num,
                            'name': name,
                            'old': original_amenities[:80] + '...' if len(original_amenities) > 80 else original_amenities,
                            'new': cleaned_amenities[:80] + '...' if len(cleaned_amenities) > 80 else cleaned_amenities
                        })
            
            rows.append(row)
    
    if not updates:
        print("✅ No amenity updates needed.")
        return
    
    print(f"\nFound {len(updates)} listings with amenity updates:\n")
    
    if url_removed:
        print(f"1. URLs removed ({len(url_removed)} listings):")
        for item in url_removed:
            print(f"   Row {item['row_num']}: {item['name']}")
            for url in item['urls']:
                print(f"     Removed: {url[:70]}...")
        print()
    
    if consolidated:
        print(f"2. Amenities consolidated ({len(consolidated)} listings):")
        for item in consolidated[:10]:
            print(f"   Row {item['row_num']}: {item['name']}")
            print(f"     \"{item['old']}\" → \"{item['new']}\"")
        if len(consolidated) > 10:
            print(f"   ... and {len(consolidated) - 10} more")
        print()
    
    if updates:
        print(f"3. Total updates: {len(updates)} listings")
        print("   Sample changes:")
        for update in updates[:5]:
            print(f"   Row {update['row_num']}: {update['name']}")
            print(f"     Old: {update['old']}")
            print(f"     New: {update['new']}")
            print()
        if len(updates) > 5:
            print(f"   ... and {len(updates) - 5} more\n")
    
    # Write updated CSV
    print(f"Writing updated CSV to {output_file.name}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"\n✅ Done!")
    print(f"  - Removed URLs from {len(url_removed)} listings")
    print(f"  - Consolidated amenities in {len(consolidated)} listings")
    print(f"  - Total updates: {len(updates)} listings")

if __name__ == '__main__':
    main()

