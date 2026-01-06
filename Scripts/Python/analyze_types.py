#!/usr/bin/env python3
"""Analyze types in the merged CSV file"""

import csv
from collections import defaultdict

with open('listings-2025-11-13-14-merged.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    type_idx = header.index('type')
    name_idx = header.index('name')
    
    type_details = defaultdict(list)
    
    for row in reader:
        if len(row) > type_idx:
            type_val = row[type_idx].strip()
            name_val = row[name_idx].strip() if len(row) > name_idx else ''
            
            if type_val:
                type_details[type_val].append(name_val)

print('=== TYPES ANALYSIS ===\n')
print('ISSUES FOUND:\n')

# Check Bed and Breakfast category
bnb = type_details.get('Bed and Breakfast', [])
if bnb:
    print(f'1. Bed and Breakfast ({len(bnb)} listings):')
    print(f'   Examples: {", ".join(bnb[:5])}')
    if 'Straw Bale House' in bnb:
        print(f'   ⚠️  Note: "Straw Bale House" is listed as B&B - verify this is correct\n')

# Check Activities
activities = type_details.get('Activities', [])
if activities:
    print(f'2. Activities ({len(activities)} listings):')
    print(f'   Examples: {", ".join(activities)}')
    print(f'   ⚠️  Note: Very generic category - might want to break down\n')

# Check Touring Trails vs Hikes & Trails
hikes = len(type_details.get('Hikes & Trails', []))
touring = len(type_details.get('Touring Trails', []))
if hikes > 0 or touring > 0:
    print(f'3. Trail Categories:')
    print(f'   - Hikes & Trails: {hikes} listings')
    print(f'   - Touring Trails: {touring} listings')
    print(f'   ⚠️  Note: Might want to consolidate or clarify difference\n')

# Check lodging categories
print(f'4. Lodging Categories (might want to consolidate):')
print(f'   - Whole House Rentals: {len(type_details.get("Whole House Rentals", []))} listings')
print(f'   - Vacation Rentals: {len(type_details.get("Vacation Rentals", []))} listings')
print(f'   - Cabins & Cottages: {len(type_details.get("Cabins & Cottages", []))} listings')
print(f'   - Bed and Breakfast: {len(type_details.get("Bed and Breakfast", []))} listings')
print(f'   - Motels & Inns: {len(type_details.get("Motels & Inns", []))} listings')
print(f'   - Resorts: {len(type_details.get("Resorts", []))} listings\n')

# Single listing categories
single_categories = {k: v for k, v in type_details.items() if len(v) == 1}
if single_categories:
    print(f'5. Categories with only 1 listing (might want to merge):')
    for cat, listings in sorted(single_categories.items()):
        print(f'   - {cat}: {listings[0]}')
    print()

# Typo check
if 'Art & Artisians' in type_details:
    print(f'6. TYPO FOUND:')
    print(f'   - "Art & Artisians" should be "Art & Artisans"\n')

print('\n=== RECOMMENDATIONS ===\n')
print('1. Fix typo: "Art & Artisians" → "Art & Artisans"')
print('2. Consolidate single-item categories into broader categories')
print('3. Consider merging "Vacation Rentals" with "Whole House Rentals" or "Cabins & Cottages"')
print('4. Consider merging "Touring Trails" with "Hikes & Trails"')
print('5. Break down "Activities" into more specific categories (Golf, Swimming, etc.)')
print('6. Verify "Bed and Breakfast" listings are actually B&Bs')

