#!/usr/bin/env python3
"""
Check for stay listings with Pet-Friendly: No that should be Yes
"""

import csv
import re

def check_pet_friendly_anomalies():
    csv_file = "CSV/final_listings_PERFECT.csv"
    
    anomalies = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Only check stay listings
            if row.get('type', '') != 'Cabins & Cottages':
                continue
            
            name = row.get('name', '')
            detailed_desc = row.get('detailedDescription', '')
            amenities = row.get('amenities', '')
            
            # Check if it says "Pet-Friendly? No" in description
            has_pet_friendly_no = re.search(r'Pet-Friendly\?\s*No', detailed_desc, re.IGNORECASE)
            
            # Check if "Pet Friendly" is in amenities
            has_pet_friendly_amenity = 'Pet Friendly' in amenities or 'Pet-Friendly' in amenities
            
            # Check if description mentions pets are allowed
            pet_allowed_indicators = [
                'pet-friendly',
                'pets allowed',
                'pet friendly',
                'pets welcome',
                'bring your pet',
                'dog friendly',
                'dogs allowed'
            ]
            
            has_pet_positive_mention = any(
                indicator in detailed_desc.lower() 
                for indicator in pet_allowed_indicators
            )
            
            if has_pet_friendly_no:
                # Extract the Pet-Friendly line
                pet_line_match = re.search(r'<strong>Pet-Friendly\?\s*</strong>\s*([^<]+)', detailed_desc, re.IGNORECASE)
                pet_line = pet_line_match.group(1).strip() if pet_line_match else "No"
                
                # Check for evidence it should be Yes
                evidence = []
                if has_pet_friendly_amenity:
                    evidence.append("Has 'Pet Friendly' in amenities column")
                if has_pet_positive_mention:
                    evidence.append("Description mentions pets are allowed/welcome")
                
                if evidence:
                    anomalies.append({
                        'name': name,
                        'slug': row.get('slug', ''),
                        'current_pet_status': pet_line,
                        'amenities': amenities,
                        'evidence': evidence,
                        'description_snippet': detailed_desc[:500] if len(detailed_desc) > 500 else detailed_desc
                    })
    
    return anomalies

if __name__ == "__main__":
    anomalies = check_pet_friendly_anomalies()
    
    print(f"Found {len(anomalies)} stay listings with Pet-Friendly: No that should likely be Yes\n")
    print("=" * 80)
    
    for i, anomaly in enumerate(anomalies, 1):
        print(f"\n#{i}. {anomaly['name']}")
        print(f"   Slug: {anomaly['slug']}")
        print(f"   Current Status: Pet-Friendly? {anomaly['current_pet_status']}")
        print(f"   Amenities: {anomaly['amenities']}")
        print(f"   Evidence it should be Yes:")
        for ev in anomaly['evidence']:
            print(f"     - {ev}")
        print(f"\n   Description snippet:")
        print(f"   {anomaly['description_snippet'][:300]}...")
        print("-" * 80)


