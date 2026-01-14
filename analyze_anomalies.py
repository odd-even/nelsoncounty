#!/usr/bin/env python3
"""
Analyze CSV listings for anomalies and mismatched information.
Reports issues without fixing them.
"""

import csv
import re
from collections import defaultdict

# Valid Nelson County areas/towns
VALID_AREAS = {
    'afton', 'lovingston', 'nellysford', 'wintergreen', 'montebello', 
    'arrington', 'roseland', 'schuyler', 'massies mill', 'tye', 
    'piney river', 'gladstone', 'norwood', 'wingina', 'faber'
}

# Stay-related types
STAY_TYPES = {
    'lodging', 'hotel', 'resort', 'b&b', 'bnb', 'inn', 'cabin', 
    'camping', 'glamping', 'hostel', 'boutique stay', 'treehouse', 
    'unique stay', 'airbnb', 'lodge', 'boat', 'entire house', 
    'house stay', 'house rental', 'vacation rental', 'rental', 
    'apartment', 'condo', 'cottage', 'villa', 'home', 'property'
}

# Outdoor activity amenities (should NOT be in stay listings)
OUTDOOR_ACTIVITY_AMENITIES = {
    'fishing', 'biking', 'hiking', 'kayaking', 'swimming', 
    'water sports', 'climbing', 'skiing', 'camping', 'hunt'
}

# Amenities that should only be in stay listings
STAY_ONLY_AMENITIES = {
    'full kitchen', 'kitchen', 'wi-fi', 'wifi', 'hot tub', 
    'jacuzzi', 'fireplace', 'air conditioning', 'ac', 'heating',
    'washer', 'dryer', 'dishwasher', 'microwave', 'refrigerator',
    'bedroom', 'bathroom', 'bath', 'shower', 'bed', 'linens',
    'towels', 'parking', 'garage', 'balcony', 'deck', 'patio',
    'grill', 'bbq', 'pool', 'swimming pool', 'private pool'
}

def normalize_text(text):
    """Normalize text for comparison."""
    if not text:
        return ''
    return text.lower().strip()

def extract_town_from_address(address):
    """Extract town name from address string."""
    if not address:
        return None
    
    # Common patterns: "City, State ZIP" or "City, VA ZIP"
    patterns = [
        r',\s*([^,]+?),\s*VA\s+\d{5}',  # "..., City, VA 12345"
        r',\s*([^,]+?),\s*VA\s*$',       # "..., City, VA"
        r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*VA',  # "City, VA"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, address, re.IGNORECASE)
        if match:
            return normalize_text(match.group(1))
    
    return None

def parse_amenities(amenities_str):
    """Parse amenities string into list."""
    if not amenities_str:
        return []
    # Split by semicolon or comma
    return [a.strip() for a in re.split(r'[;,]+', amenities_str) if a.strip()]

def is_stay_type(type_str):
    """Check if listing type is a stay type."""
    if not type_str:
        return False
    type_lower = normalize_text(type_str)
    return any(stay_type in type_lower for stay_type in STAY_TYPES)

def is_outdoor_activity_amenity(amenity):
    """Check if amenity is an outdoor activity."""
    amenity_lower = normalize_text(amenity)
    return any(activity in amenity_lower for activity in OUTDOOR_ACTIVITY_AMENITIES)

def is_stay_only_amenity(amenity):
    """Check if amenity should only be in stay listings."""
    amenity_lower = normalize_text(amenity)
    return any(stay_amenity in amenity_lower for stay_amenity in STAY_ONLY_AMENITIES)

def analyze_listing(row, row_num):
    """Analyze a single listing row for anomalies."""
    anomalies = []
    
    name = row.get('name', '').strip()
    slug = row.get('slug', '').strip()
    listing_type = row.get('type', '').strip()
    category = row.get('category', '').strip()
    area = row.get('area', '').strip()
    address = row.get('address', '').strip()
    description = row.get('description', '').strip()
    detailed_description = row.get('detailedDescription', '').strip()
    amenities_str = row.get('amenities', '').strip()
    
    # Parse amenities
    amenities = parse_amenities(amenities_str)
    
    # Check if it's a stay listing
    is_stay = is_stay_type(listing_type)
    
    # 1. Check for outdoor activity amenities in stay listings
    if is_stay:
        for amenity in amenities:
            if is_outdoor_activity_amenity(amenity):
                anomalies.append({
                    'type': 'INAPPROPRIATE_AMENITY_FOR_STAY',
                    'severity': 'MEDIUM',
                    'field': 'amenities',
                    'value': amenity,
                    'message': f'Outdoor activity amenity "{amenity}" in stay listing (type: {listing_type})'
                })
    
    # 2. Check for stay-only amenities in non-stay listings
    if not is_stay:
        for amenity in amenities:
            if is_stay_only_amenity(amenity):
                anomalies.append({
                    'type': 'STAY_AMENITY_IN_NON_STAY',
                    'severity': 'MEDIUM',
                    'field': 'amenities',
                    'value': amenity,
                    'message': f'Stay-specific amenity "{amenity}" in non-stay listing (type: {listing_type})'
                })
    
    # 3. Check for mismatched area and address town
    if area and address:
        area_normalized = normalize_text(area)
        address_town = extract_town_from_address(address)
        
        if address_town:
            # Check if area matches address town (allowing for variations)
            area_matches = False
            if area_normalized == address_town:
                area_matches = True
            elif area_normalized in address_town or address_town in area_normalized:
                area_matches = True
            elif 'wintergreen' in area_normalized and 'nellysford' in address_town:
                # Wintergreen is in Nellysford area
                area_matches = True
            elif 'wintergreen' in area_normalized and 'afton' in address_town:
                # Some Wintergreen addresses are in Afton
                area_matches = True
            
            if not area_matches:
                # Check if it's a valid area/town
                is_valid_area = any(valid in area_normalized for valid in VALID_AREAS)
                is_valid_town = any(valid in address_town for valid in VALID_AREAS)
                
                if is_valid_area and is_valid_town:
                    anomalies.append({
                        'type': 'AREA_ADDRESS_MISMATCH',
                        'severity': 'HIGH',
                        'field': 'area/address',
                        'value': f'Area: "{area}", Address town: "{address_town}"',
                        'message': f'Area "{area}" does not match address town "{address_town}"'
                    })
    
    # 4. Check for description/type mismatches
    if description and listing_type:
        desc_lower = description.lower()
        type_lower = normalize_text(listing_type)
        
        # Check for contradictory keywords
        if 'restaurant' in type_lower or 'cafe' in type_lower or 'dining' in type_lower:
            if 'hiking' in desc_lower or 'trail' in desc_lower or 'camping' in desc_lower:
                anomalies.append({
                    'type': 'DESCRIPTION_TYPE_MISMATCH',
                    'severity': 'HIGH',
                    'field': 'description/type',
                    'value': f'Type: {listing_type}',
                    'message': f'Food service type but description mentions outdoor activities'
                })
        
        if 'hiking' in type_lower or 'trail' in type_lower:
            if 'menu' in desc_lower or 'dining' in desc_lower or 'restaurant' in desc_lower:
                anomalies.append({
                    'type': 'DESCRIPTION_TYPE_MISMATCH',
                    'severity': 'HIGH',
                    'field': 'description/type',
                    'value': f'Type: {listing_type}',
                    'message': f'Trail/hiking type but description mentions food service'
                })
    
    # 5. Check for duplicate description and detailedDescription
    if description and detailed_description:
        desc_clean = normalize_text(description)
        detailed_clean = normalize_text(detailed_description)
        
        # Check if they're essentially the same (one is substring of other)
        if len(desc_clean) > 50 and len(detailed_clean) > 50:
            if desc_clean in detailed_clean or detailed_clean in desc_clean:
                # Check similarity (simple heuristic)
                words_desc = set(desc_clean.split())
                words_detailed = set(detailed_clean.split())
                if len(words_desc) > 10 and len(words_detailed) > 10:
                    overlap = len(words_desc & words_detailed)
                    similarity = overlap / max(len(words_desc), len(words_detailed))
                    if similarity > 0.8:
                        anomalies.append({
                            'type': 'DUPLICATE_DESCRIPTIONS',
                            'severity': 'LOW',
                            'field': 'description/detailedDescription',
                            'value': f'Similarity: {similarity:.1%}',
                            'message': f'Description and detailedDescription are very similar (may be redundant)'
                        })
    
    # 6. Check for empty required fields
    if not name:
        anomalies.append({
            'type': 'MISSING_NAME',
            'severity': 'HIGH',
            'field': 'name',
            'value': '',
            'message': 'Listing name is empty'
        })
    
    if not listing_type:
        anomalies.append({
            'type': 'MISSING_TYPE',
            'severity': 'MEDIUM',
            'field': 'type',
            'value': '',
            'message': 'Listing type is empty'
        })
    
    # 7. Check for suspicious amenities
    suspicious_amenities = []
    for amenity in amenities:
        amenity_lower = normalize_text(amenity)
        # Check for typos or unusual combinations
        if len(amenity) < 3:
            suspicious_amenities.append(amenity)
        elif amenity_lower in ['swimming pool', 'pool'] and not is_stay:
            # Pool in non-stay might be okay (public pool), but flag it
            pass
    
    if suspicious_amenities:
        anomalies.append({
            'type': 'SUSPICIOUS_AMENITIES',
            'severity': 'LOW',
            'field': 'amenities',
            'value': ', '.join(suspicious_amenities),
            'message': f'Potentially suspicious amenities: {", ".join(suspicious_amenities)}'
        })
    
    return anomalies

def main():
    csv_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-14-4.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/ANOMALIES_REPORT.txt'
    
    all_anomalies = []
    anomaly_counts = defaultdict(int)
    
    print(f"Reading CSV file: {csv_file}")
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
            anomalies = analyze_listing(row, row_num)
            
            if anomalies:
                for anomaly in anomalies:
                    anomaly['row'] = row_num
                    anomaly['listing_name'] = row.get('name', 'UNNAMED').strip()
                    anomaly['slug'] = row.get('slug', '').strip()
                    all_anomalies.append(anomaly)
                    anomaly_counts[anomaly['type']] += 1
    
    # Generate report
    print(f"\nFound {len(all_anomalies)} total anomalies across {len(set(a['row'] for a in all_anomalies))} listings")
    print(f"Writing report to: {report_file}")
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("LISTING ANOMALIES REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Generated from: {csv_file}\n")
        f.write(f"Total anomalies found: {len(all_anomalies)}\n")
        f.write(f"Listings with anomalies: {len(set(a['row'] for a in all_anomalies))}\n\n")
        
        # Summary by type
        f.write("SUMMARY BY ANOMALY TYPE\n")
        f.write("-" * 80 + "\n")
        for anomaly_type, count in sorted(anomaly_counts.items(), key=lambda x: x[1], reverse=True):
            f.write(f"  {anomaly_type}: {count}\n")
        f.write("\n")
        
        # Group by severity
        high_severity = [a for a in all_anomalies if a['severity'] == 'HIGH']
        medium_severity = [a for a in all_anomalies if a['severity'] == 'MEDIUM']
        low_severity = [a for a in all_anomalies if a['severity'] == 'LOW']
        
        f.write("SUMMARY BY SEVERITY\n")
        f.write("-" * 80 + "\n")
        f.write(f"  HIGH: {len(high_severity)} anomalies\n")
        f.write(f"  MEDIUM: {len(medium_severity)} anomalies\n")
        f.write(f"  LOW: {len(low_severity)} anomalies\n\n")
        
        # Detailed report by severity
        for severity in ['HIGH', 'MEDIUM', 'LOW']:
            severity_anomalies = [a for a in all_anomalies if a['severity'] == severity]
            if not severity_anomalies:
                continue
            
            f.write("=" * 80 + "\n")
            f.write(f"{severity} SEVERITY ANOMALIES ({len(severity_anomalies)} total)\n")
            f.write("=" * 80 + "\n\n")
            
            # Group by type within severity
            by_type = defaultdict(list)
            for anomaly in severity_anomalies:
                by_type[anomaly['type']].append(anomaly)
            
            for anomaly_type, type_anomalies in sorted(by_type.items()):
                f.write(f"\n{anomaly_type} ({len(type_anomalies)} occurrences)\n")
                f.write("-" * 80 + "\n")
                
                for anomaly in sorted(type_anomalies, key=lambda x: (x['row'], x['listing_name'])):
                    f.write(f"\nRow {anomaly['row']}: {anomaly['listing_name']}\n")
                    f.write(f"  Slug: {anomaly['slug']}\n")
                    f.write(f"  Field: {anomaly['field']}\n")
                    f.write(f"  Value: {anomaly['value']}\n")
                    f.write(f"  Issue: {anomaly['message']}\n")
        
        # List all affected listings
        f.write("\n" + "=" * 80 + "\n")
        f.write("ALL AFFECTED LISTINGS\n")
        f.write("=" * 80 + "\n\n")
        
        affected_listings = {}
        for anomaly in all_anomalies:
            key = (anomaly['row'], anomaly['listing_name'], anomaly['slug'])
            if key not in affected_listings:
                affected_listings[key] = []
            affected_listings[key].append(anomaly)
        
        for (row, name, slug), anomalies in sorted(affected_listings.items()):
            f.write(f"\nRow {row}: {name} ({slug})\n")
            f.write(f"  Total issues: {len(anomalies)}\n")
            for anomaly in anomalies:
                f.write(f"    - [{anomaly['severity']}] {anomaly['type']}: {anomaly['message']}\n")
    
    print(f"\nReport written to: {report_file}")
    print(f"\nSummary:")
    print(f"  High severity: {len(high_severity)}")
    print(f"  Medium severity: {len(medium_severity)}")
    print(f"  Low severity: {len(low_severity)}")

if __name__ == '__main__':
    main()
