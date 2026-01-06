#!/usr/bin/env python3
"""
Fix and clean up areas/locations in the merged CSV file:
1. Fix areas that are actually activity types (Motorcycling, Kids Activities, etc.)
2. Fill in empty areas for rivers/lakes based on nearby locations
3. Consolidate overly broad areas
"""

import csv
import sys
import re
from pathlib import Path

# Areas that are actually activity types, not locations
# Map them to proper location or remove
AREA_FIXES = {
    # Activity types that shouldn't be areas
    'Motorcycling': 'Nelson County',  # Blue Ridge Parkway Loops - probably in Nelson County
    'Kids Activities': 'Montebello',  # Fishing at Montebello - probably Montebello area
    'Horseback Riding': 'Nelson County',  # Appalachian Horse Adventures - probably Nelson County
    'Staff on Site': 'Wintergreen Resort',  # This is a feature, not a location - use main area
    'Tent Camping': 'Nelson County',  # Meili Mountain - probably Nelson County
    
    # Overly broad areas - might want to make more specific, but keep for now
    # 'Commonwealth of Virginia': 'Nelson County',  # Virginia Spirits Trail - probably Nelson County
    # 'Nelson County': 'Nelson County',  # Keep as is for regional listings
    
    # Areas that might need more specific location
    # 'Nelson 29': 'Nelson County',  # Could be kept if it's a specific route/area
}

# Fix empty areas based on listing name/description
EMPTY_AREA_FIXES = {
    'Tye River': 'Nelson County',  # River - use county
    'James River': 'Nelson County',  # River - use county  
    'Rockfish River': 'Afton',  # Rockfish River Access - probably Afton area
    'Lake Nelson': 'Arrington',  # Lake Nelson - probably Arrington area
}

def determine_area_from_address(address):
    """Try to determine area from address"""
    if not address:
        return None
    
    address_lower = address.lower()
    
    # Check for common area names in address
    areas_in_address = {
        'wintergreen': 'Wintergreen Resort',
        'afton': 'Afton',
        'lovingston': 'Lovingston',
        'nellysford': 'Nellysford',
        'arrington': 'Arrington',
        'montebello': 'Montebello',
        'schuyler': 'Schuyler',
        'tyro': 'Tyro',
        'vesuvius': 'Vesuvius',
        'roseland': 'Roseland',
    }
    
    for keyword, area in areas_in_address.items():
        if keyword in address_lower:
            return area
    
    return None

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
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        area_idx = header.index('area')
        name_idx = header.index('name')
        address_idx = header.index('address') if 'address' in header else None
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) > area_idx:
                name = row[name_idx].strip() if len(row) > name_idx else ''
                area = row[area_idx].strip() if len(row) > area_idx else ''
                address = row[address_idx].strip() if address_idx and len(row) > address_idx else ''
                
                original_area = area
                new_area = area
                update_reason = None
                
                # 1. Fix areas that are activity types
                if area in AREA_FIXES:
                    new_area = AREA_FIXES[area]
                    update_reason = 'Fix activity type used as location'
                
                # 2. Fill in empty areas
                elif not area or area == '':
                    # Try name-based fix first
                    if name in EMPTY_AREA_FIXES:
                        new_area = EMPTY_AREA_FIXES[name]
                        update_reason = 'Fill empty area from name'
                    # Try address-based determination
                    elif address:
                        area_from_address = determine_area_from_address(address)
                        if area_from_address:
                            new_area = area_from_address
                            update_reason = 'Fill empty area from address'
                    else:
                        new_area = 'Nelson County'  # Default fallback
                        update_reason = 'Fill empty area with default'
                
                # Update if changed
                if new_area != original_area:
                    row[area_idx] = new_area
                    updates.append({
                        'row_num': row_num,
                        'name': name,
                        'old_area': original_area or '(empty)',
                        'new_area': new_area,
                        'reason': update_reason
                    })
            
            rows.append(row)
    
    if not updates:
        print("✅ No area updates needed.")
        return
    
    print(f"\nFound {len(updates)} listings with area updates:\n")
    
    # Group by reason
    by_reason = {}
    for update in updates:
        reason = update['reason']
        if reason not in by_reason:
            by_reason[reason] = []
        by_reason[reason].append(update)
    
    for reason, update_list in sorted(by_reason.items()):
        print(f"{reason} ({len(update_list)} updates):")
        for update in update_list[:10]:  # Show first 10
            print(f"  Row {update['row_num']}: '{update['name']}'")
            print(f"    '{update['old_area']}' → '{update['new_area']}'")
        if len(update_list) > 10:
            print(f"  ... and {len(update_list) - 10} more")
        print()
    
    # Write updated CSV
    print(f"Writing updated CSV to {output_file.name}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"\n✅ Done! Updated {len(updates)} listings.")
    
    # Show summary
    print("\n=== SUMMARY OF CHANGES ===")
    area_changes = {}
    for update in updates:
        old = update['old_area']
        new = update['new_area']
        key = f"{old} → {new}"
        area_changes[key] = area_changes.get(key, 0) + 1
    
    for change, count in sorted(area_changes.items(), key=lambda x: -x[1]):
        print(f"  {change}: {count} listings")

if __name__ == '__main__':
    main()

