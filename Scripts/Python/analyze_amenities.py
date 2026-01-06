#!/usr/bin/env python3
"""
Comprehensive analysis of amenities in the CSV file.
Similar to the types analysis - finds duplicates, inconsistencies, typos, etc.
"""

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

def normalize_amenity(amenity):
    """Normalize amenity name for comparison"""
    return amenity.strip().lower()

def find_similar_amenities(amenities_list, threshold=0.8):
    """Find similar amenity names that might be duplicates"""
    from difflib import SequenceMatcher
    
    similar_groups = []
    processed = set()
    
    for i, amenity1 in enumerate(amenities_list):
        if amenity1.lower() in processed:
            continue
        
        similar = [amenity1]
        processed.add(amenity1.lower())
        
        for amenity2 in amenities_list[i+1:]:
            if amenity2.lower() in processed:
                continue
            
            similarity = SequenceMatcher(None, amenity1.lower(), amenity2.lower()).ratio()
            if similarity >= threshold:
                similar.append(amenity2)
                processed.add(amenity2.lower())
        
        if len(similar) > 1:
            similar_groups.append(similar)
    
    return similar_groups

def main():
    input_file = Path('listings-2025-11-13-14-merged.csv')
    
    if not input_file.exists():
        print(f"Error: {input_file} not found")
        return
    
    print(f"Reading {input_file.name}...")
    
    amenity_counts = Counter()
    amenity_examples = {}
    all_amenities_list = []
    listings_by_amenity = defaultdict(list)
    
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
                    # Split by semicolon or comma
                    amenities = re.split(r'[;,]', amenities_str)
                    amenities = [a.strip() for a in amenities if a.strip()]
                    
                    for amenity in amenities:
                        if amenity:
                            amenity_counts[amenity] += 1
                            all_amenities_list.append(amenity)
                            listings_by_amenity[amenity].append(name)
                            
                            # Store first example
                            if amenity not in amenity_examples:
                                amenity_examples[amenity] = name
    
    print(f"\n=== AMENITIES SUMMARY ===\n")
    print(f'Total unique amenities: {len(amenity_counts)}')
    print(f'Total amenity instances: {sum(amenity_counts.values())}')
    
    # Count listings with amenities
    listings_with_amenities = len(set([name for names in listings_by_amenity.values() for name in names]))
    print(f'Listings with amenities: {listings_with_amenities}\n')
    
    # Show all amenities sorted by count
    print('=== ALL AMENITIES (Sorted by Count) ===\n')
    print('Amenity'.ljust(50) + 'Count'.ljust(10) + 'Example Listing')
    print('=' * 100)
    
    for amenity, count in amenity_counts.most_common():
        example = amenity_examples[amenity]
        print(amenity[:48].ljust(50) + str(count).ljust(10) + example[:38])
    
    # Find potential duplicates (case-insensitive)
    print(f'\n=== POTENTIAL DUPLICATES (Case Variations) ===\n')
    normalized_groups = defaultdict(list)
    for amenity in amenity_counts.keys():
        normalized = normalize_amenity(amenity)
        normalized_groups[normalized].append(amenity)
    
    duplicates = {k: v for k, v in normalized_groups.items() if len(v) > 1}
    if duplicates:
        for normalized, variants in sorted(duplicates.items()):
            print(f'  "{normalized}":')
            for variant in variants:
                count = amenity_counts[variant]
                print(f'    - "{variant}" ({count} listings)')
        print()
    else:
        print('  ✅ No case-sensitive duplicates found\n')
    
    # Find similar amenities (potential typos)
    print('=== POTENTIALLY SIMILAR AMENITIES (Possible Typos) ===\n')
    unique_amenities = list(amenity_counts.keys())
    similar_groups = find_similar_amenities(unique_amenities, threshold=0.85)
    
    if similar_groups:
        for group in similar_groups[:20]:  # Show first 20
            if len(group) > 1:
                print(f'  Similar group:')
                for amenity in group:
                    count = amenity_counts[amenity]
                    print(f'    - "{amenity}" ({count} listings)')
        if len(similar_groups) > 20:
            print(f'    ... and {len(similar_groups) - 20} more groups')
        print()
    else:
        print('  ✅ No obviously similar amenities found\n')
    
    # Check for issues
    print('=== POTENTIAL ISSUES ===\n')
    
    # Very short or very long
    issues = []
    for amenity, count in amenity_counts.items():
        if len(amenity) < 2:
            issues.append(f'Too short: "{amenity}" ({count} listings)')
        elif len(amenity) > 80:
            issues.append(f'Too long: "{amenity[:50]}..." ({count} listings)')
    
    if issues:
        print('Length issues:')
        for issue in issues[:10]:
            print(f'  - {issue}')
        if len(issues) > 10:
            print(f'  ... and {len(issues) - 10} more')
        print()
    else:
        print('  ✅ No length issues found\n')
    
    # Single-use amenities (might want to consolidate)
    single_use = {a: c for a, c in amenity_counts.items() if c == 1}
    if single_use:
        print(f'=== SINGLE-USE AMENITIES ({len(single_use)} total) ===\n')
        print('These amenities appear only once - might want to consolidate:\n')
        for amenity, listing in sorted(list(single_use.items()), key=lambda x: x[0])[:30]:
            print(f'  - "{amenity}" (in: {amenity_examples[amenity]})')
        if len(single_use) > 30:
            print(f'  ... and {len(single_use) - 30} more')
        print()
    
    # Common patterns/issues
    print('=== COMMON PATTERNS ===\n')
    
    # Check for Pet Friendly variations
    pet_variations = [a for a in amenity_counts.keys() if 'pet' in a.lower() and 'friendly' in a.lower()]
    if pet_variations:
        print(f'Pet Friendly variations ({len(pet_variations)}):')
        for amenity in pet_variations:
            count = amenity_counts[amenity]
            print(f'  - "{amenity}" ({count} listings)')
        print()
    
    # Check for Family Friendly variations
    family_variations = [a for a in amenity_counts.keys() if 'family' in a.lower() and 'friendly' in a.lower()]
    if family_variations:
        print(f'Family Friendly variations ({len(family_variations)}):')
        for amenity in family_variations:
            count = amenity_counts[amenity]
            print(f'  - "{amenity}" ({count} listings)')
        print()
    
    # Summary recommendations
    print('=== RECOMMENDATIONS ===\n')
    recommendations = []
    
    if duplicates:
        recommendations.append(f'1. Consolidate {len(duplicates)} case-sensitive duplicates')
    
    if similar_groups:
        recommendations.append(f'2. Review {len(similar_groups)} groups of similar amenities for typos')
    
    if single_use:
        recommendations.append(f'3. Consider consolidating {len(single_use)} single-use amenities')
    
    if pet_variations and len(pet_variations) > 1:
        recommendations.append('4. Standardize Pet Friendly variations to single format')
    
    if family_variations and len(family_variations) > 1:
        recommendations.append('5. Standardize Family Friendly variations to single format')
    
    for rec in recommendations:
        print(f'  {rec}')
    
    if not recommendations:
        print('  ✅ Amenities look good! No major issues found.')

if __name__ == '__main__':
    main()

