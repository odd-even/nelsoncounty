#!/usr/bin/env python3
"""
Fix and consolidate types in the merged CSV file:
1. Fix typo: Art & Artisians → Art & Artisans
2. Consolidate single-item categories
3. Merge similar categories
4. Break down Activities into specific categories
"""

import csv
import sys
from pathlib import Path
import re

def normalize_name(name):
    """Normalize name for matching"""
    return str(name).lower().strip()

def determine_activity_type(name, description, current_amenities):
    """Determine specific activity type from generic 'Activities' category"""
    name_lower = normalize_name(name)
    desc_lower = str(description).lower() if description else ''
    combined = name_lower + ' ' + desc_lower
    
    # Swimming
    if 'swimming' in combined:
        return 'Swimming'
    
    # Golf
    if 'golf' in combined:
        return 'Golf'
    
    # Horse-related
    if any(word in combined for word in ['horse', 'riding', 'equestrian']):
        return 'Horseback Riding'
    
    # Guide Service
    if 'guide service' in combined or 'guide' in combined:
        return 'Guided Tours'
    
    # Farms/Orchards (should probably be in Farms & Orchards)
    if any(word in combined for word in ['farm', 'orchard', 'grove']):
        return 'Farms & Orchards'
    
    # Default to Activities if we can't determine
    return 'Activities'

# Type consolidation mapping
TYPE_FIXES = {
    # Fix typo
    'Art & Artisians': 'Art & Artisans',
    
    # Merge Touring Trails into Hikes & Trails
    'Touring Trails': 'Hikes & Trails',
    
    # Consolidate single-item categories
    'Soaring': 'Activities',
    'Skiing & Snowboarding': 'Activities',
    'Tennis': 'Activities',
    'Attractions': 'Museums & Heritage',  # Montebello Fish Hatchery seems like a heritage site
    'Resorts': 'Whole House Rentals',  # Wintergreen Resort is primarily lodging
}

# Special handling for specific listings
SPECIAL_CASES = {
    # Activities that need to be reclassified
    'Swimming': 'Swimming',
    'Fitzgerald Farms': 'Farms & Orchards',
    'Hungry Hill Farm': 'Farms & Orchards',
    'One Forest': 'Farms & Orchards',  # or maybe Hikes & Trails? Check description
    'Seamans\' Orchard': 'Farms & Orchards',
    'Silver Creek and Seamans\' Orchards': 'Farms & Orchards',
    'Silver Creek Orchards': 'Farms & Orchards',
    'Silver Fox Lavender Farm': 'Farms & Orchards',
    'Appalachian Horse Adventures': 'Horseback Riding',
    'Rebel\'s Run at Afton Mountain': 'Horseback Riding',
    'Indian Summer Guide Service': 'Guided Tours',
    
    # Verify B&B
    'Straw Bale House': 'Whole House Rentals',  # Likely not a B&B
}

# Vacation Rentals - merge with Whole House Rentals or Cabins & Cottages based on name
VACATION_RENTAL_KEYWORDS = {
    'cabins': 'Cabins & Cottages',
    'cabin': 'Cabins & Cottages',
    'cottage': 'Cabins & Cottages',
    'condo': 'Vacation Rentals',  # Keep condos as Vacation Rentals
    'condominium': 'Vacation Rentals',
    'unit': 'Vacation Rentals',
    'resort': 'Vacation Rentals',
}

def determine_vacation_rental_type(name, description):
    """Determine if Vacation Rental should be Whole House or Cabins & Cottages"""
    name_lower = normalize_name(name)
    desc_lower = str(description).lower() if description else ''
    combined = name_lower + ' ' + desc_lower
    
    for keyword, new_type in VACATION_RENTAL_KEYWORDS.items():
        if keyword in combined:
            return new_type
    
    # Default to Whole House Rentals
    return 'Whole House Rentals'

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
        
        type_idx = header.index('type')
        name_idx = header.index('name')
        desc_idx = header.index('description') if 'description' in header else None
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) > type_idx:
                current_type = row[type_idx].strip()
                name = row[name_idx].strip() if len(row) > name_idx else ''
                description = row[desc_idx].strip() if desc_idx and len(row) > desc_idx else ''
                
                new_type = current_type
                update_reason = None
                
                # 1. Check for special cases first
                if name in SPECIAL_CASES:
                    new_type = SPECIAL_CASES[name]
                    update_reason = f'Special case mapping'
                
                # 2. Apply type fixes (typos, merges)
                elif current_type in TYPE_FIXES:
                    new_type = TYPE_FIXES[current_type]
                    update_reason = 'Type consolidation/fix'
                
                # 3. Break down Activities category
                elif current_type == 'Activities' and name not in SPECIAL_CASES:
                    new_type = determine_activity_type(name, description, '')
                    if new_type != 'Activities':
                        update_reason = 'Break down Activities'
                
                # 4. Consolidate Vacation Rentals
                elif current_type == 'Vacation Rentals':
                    new_type = determine_vacation_rental_type(name, description)
                    if new_type != current_type:
                        update_reason = 'Consolidate Vacation Rentals'
                
                # Update if changed
                if new_type != current_type:
                    row[type_idx] = new_type
                    updates.append({
                        'row': row_num,
                        'name': name,
                        'old_type': current_type,
                        'new_type': new_type,
                        'reason': update_reason
                    })
            
            rows.append(row)
    
    if not updates:
        print("No type updates needed.")
        return
    
    print(f"\nFound {len(updates)} type updates:\n")
    
    # Group by update type
    by_reason = {}
    for update in updates:
        reason = update['reason']
        if reason not in by_reason:
            by_reason[reason] = []
        by_reason[reason].append(update)
    
    for reason, update_list in sorted(by_reason.items()):
        print(f"{reason} ({len(update_list)} updates):")
        for update in update_list[:5]:  # Show first 5
            print(f"  Row {update['row']}: '{update['name']}'")
            print(f"    '{update['old_type']}' → '{update['new_type']}'")
        if len(update_list) > 5:
            print(f"  ... and {len(update_list) - 5} more")
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
    type_changes = {}
    for update in updates:
        old = update['old_type']
        new = update['new_type']
        key = f"{old} → {new}"
        type_changes[key] = type_changes.get(key, 0) + 1
    
    for change, count in sorted(type_changes.items(), key=lambda x: -x[1]):
        print(f"  {change}: {count} listings")

if __name__ == '__main__':
    main()

