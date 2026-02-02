#!/usr/bin/env python3
"""
Find stay listings with Pet-Friendly? No but Pet Friendly in amenities
"""

import csv
import re

anomalies = []

with open('CSV/final_listings_PERFECT.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Only check stay listings
        if row.get('type', '') not in ['Cabins & Cottages', 'Motels & Inns', 'Whole House Rentals', 'Lodging']:
            continue
        
        name = row.get('name', '')
        detailed_desc = row.get('detailedDescription', '')
        amenities = row.get('amenities', '')
        
        # Check for Pet-Friendly? No (handles HTML format: Pet-Friendly? </strong> No)
        has_no = re.search(r'Pet-Friendly\?\s*</strong>\s*No', detailed_desc, re.IGNORECASE)
        
        # Check if Pet Friendly is in amenities
        has_amenity = 'Pet Friendly' in amenities
        
        if has_no and has_amenity:
            # Extract the exact pet status
            pet_match = re.search(r'Pet-Friendly\?\s*</strong>\s*([^<]+)', detailed_desc, re.IGNORECASE)
            pet_status = pet_match.group(1).strip() if pet_match else 'No'
            
            anomalies.append({
                'name': name,
                'slug': row.get('slug', ''),
                'type': row.get('type', ''),
                'pet_status': pet_status,
                'amenities': amenities
            })

print(f"Found {len(anomalies)} stay listings with Pet-Friendly? No but Pet Friendly in amenities:\n")
print("=" * 80)

for i, a in enumerate(anomalies, 1):
    print(f"\n#{i}. {a['name']}")
    print(f"   Type: {a['type']}")
    print(f"   Slug: {a['slug']}")
    print(f"   Current Status: Pet-Friendly? {a['pet_status']}")
    print(f"   Amenities: {a['amenities']}")
    print(f"   ISSUE: Description says 'No' but amenities include 'Pet Friendly'")
    print(f"   RECOMMENDATION: Change to 'Pet-Friendly? Yes'")
    print("-" * 80)


