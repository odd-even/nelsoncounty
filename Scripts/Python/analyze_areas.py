#!/usr/bin/env python3
"""
Comprehensive analysis of areas/locations in the CSV file.
Similar to types and amenities analysis - finds duplicates, inconsistencies, typos, etc.
"""

import csv
import re
from collections import Counter, defaultdict
from pathlib import Path

def normalize_area(area):
    """Normalize area name for comparison"""
    return area.strip().lower()

def find_similar_areas(areas_list, threshold=0.85):
    """Find similar area names that might be duplicates"""
    from difflib import SequenceMatcher
    
    similar_groups = []
    processed = set()
    
    for i, area1 in enumerate(areas_list):
        if area1.lower() in processed:
            continue
        
        similar = [area1]
        processed.add(area1.lower())
        
        for area2 in areas_list[i+1:]:
            if area2.lower() in processed:
                continue
            
            similarity = SequenceMatcher(None, area1.lower(), area2.lower()).ratio()
            if similarity >= threshold:
                similar.append(area2)
                processed.add(area2.lower())
        
        if len(similar) > 1:
            similar_groups.append(similar)
    
    return similar_groups

def main():
    input_file = Path('listings-2025-11-13-14-merged.csv')
    
    if not input_file.exists():
        print(f"Error: {input_file} not found")
        return
    
    print(f"Reading {input_file.name}...")
    
    area_counts = Counter()
    area_examples = {}
    all_areas_list = []
    listings_by_area = defaultdict(list)
    empty_areas = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        area_idx = header.index('area')
        name_idx = header.index('name')
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) > area_idx:
                name = row[name_idx].strip() if len(row) > name_idx else ''
                area = row[area_idx].strip() if len(row) > area_idx else ''
                
                if area:
                    area_counts[area] += 1
                    all_areas_list.append(area)
                    listings_by_area[area].append(name)
                    
                    # Store first example
                    if area not in area_examples:
                        area_examples[area] = name
                else:
                    empty_areas.append((row_num, name))
    
    print(f"\n=== AREAS/LOCATIONS SUMMARY ===\n")
    print(f'Total unique areas: {len(area_counts)}')
    print(f'Total listings: {sum(area_counts.values())}')
    print(f'Listings with empty area: {len(empty_areas)}\n')
    
    # Show all areas sorted by count
    print('=== ALL AREAS (Sorted by Count) ===\n')
    print('Area'.ljust(40) + 'Count'.ljust(10) + 'Example Listing')
    print('=' * 100)
    
    for area, count in area_counts.most_common():
        example = area_examples[area]
        print(area[:38].ljust(40) + str(count).ljust(10) + example[:48])
    
    # Find potential duplicates (case-insensitive)
    print(f'\n=== POTENTIAL DUPLICATES (Case Variations) ===\n')
    normalized_groups = defaultdict(list)
    for area in area_counts.keys():
        normalized = normalize_area(area)
        normalized_groups[normalized].append(area)
    
    duplicates = {k: v for k, v in normalized_groups.items() if len(v) > 1}
    if duplicates:
        for normalized, variants in sorted(duplicates.items()):
            print(f'  "{normalized}":')
            for variant in variants:
                count = area_counts[variant]
                print(f'    - "{variant}" ({count} listings)')
        print()
    else:
        print('  ✅ No case-sensitive duplicates found\n')
    
    # Find similar areas (potential typos)
    print('=== POTENTIALLY SIMILAR AREAS (Possible Typos) ===\n')
    unique_areas = list(area_counts.keys())
    similar_groups = find_similar_areas(unique_areas, threshold=0.85)
    
    if similar_groups:
        for group in similar_groups[:20]:  # Show first 20
            if len(group) > 1:
                print(f'  Similar group:')
                for area in group:
                    count = area_counts[area]
                    print(f'    - "{area}" ({count} listings)')
        if len(similar_groups) > 20:
            print(f'    ... and {len(similar_groups) - 20} more groups')
        print()
    else:
        print('  ✅ No obviously similar areas found\n')
    
    # Check for issues
    print('=== POTENTIAL ISSUES ===\n')
    
    # Very short or very long
    issues = []
    for area, count in area_counts.items():
        if len(area) < 2:
            issues.append(f'Too short: "{area}" ({count} listings)')
        elif len(area) > 80:
            issues.append(f'Too long: "{area[:50]}..." ({count} listings)')
    
    if issues:
        print('Length issues:')
        for issue in issues[:10]:
            print(f'  - {issue}')
        if len(issues) > 10:
            print(f'  ... and {len(issues) - 10} more')
        print()
    else:
        print('  ✅ No length issues found\n')
    
    # Empty areas
    if empty_areas:
        print(f'=== EMPTY AREAS ({len(empty_areas)} listings) ===\n')
        for row_num, name in empty_areas[:20]:
            print(f'  Row {row_num}: {name}')
        if len(empty_areas) > 20:
            print(f'  ... and {len(empty_areas) - 20} more')
        print()
    
    # Single-use areas (might want to review)
    single_use = {a: c for a, c in area_counts.items() if c == 1}
    if single_use:
        print(f'=== SINGLE-USE AREAS ({len(single_use)} total) ===\n')
        print('These areas appear only once - might want to review:\n')
        for area, listing in sorted(single_use.items(), key=lambda x: x[0])[:30]:
            print(f'  - "{area}" (in: {area_examples[area]})')
        if len(single_use) > 30:
            print(f'  ... and {len(single_use) - 30} more')
        print()
    
    # Common patterns/issues
    print('=== COMMON PATTERNS ===\n')
    
    # Check for variations of common areas
    common_patterns = {
        'wintergreen': [a for a in area_counts.keys() if 'wintergreen' in a.lower()],
        'lovingston': [a for a in area_counts.keys() if 'lovingston' in a.lower()],
        'afton': [a for a in area_counts.keys() if 'afton' in a.lower()],
        'nellysford': [a for a in area_counts.keys() if 'nellysford' in a.lower()],
        'arrington': [a for a in area_counts.keys() if 'arrington' in a.lower()],
    }
    
    for pattern, areas in common_patterns.items():
        if areas and len(areas) > 1:
            print(f'{pattern.capitalize()} variations ({len(areas)}):')
            for area in areas:
                count = area_counts[area]
                print(f'  - "{area}" ({count} listings)')
            print()
    
    # Summary recommendations
    print('=== RECOMMENDATIONS ===\n')
    recommendations = []
    
    if duplicates:
        recommendations.append(f'1. Consolidate {len(duplicates)} case-sensitive duplicates')
    
    if similar_groups:
        recommendations.append(f'2. Review {len(similar_groups)} groups of similar areas for typos')
    
    if empty_areas:
        recommendations.append(f'3. Fill in {len(empty_areas)} empty area fields')
    
    if single_use:
        recommendations.append(f'4. Review {len(single_use)} single-use areas for accuracy')
    
    for rec in recommendations:
        print(f'  {rec}')
    
    if not recommendations:
        print('  ✅ Areas look good! No major issues found.')

if __name__ == '__main__':
    main()

