#!/usr/bin/env python3
"""
Deep analysis of addresses in the CSV file to identify non-standard addresses.
"""

import csv
import re

def analyze_address(address, name):
    """Analyze an address and return issues found."""
    if not address or address.strip() == '':
        return {'status': 'empty', 'issues': ['Address is empty']}
    
    address_clean = address.strip()
    issues = []
    status = 'valid'
    
    # Check for directions/instructions instead of addresses
    direction_keywords = [
        r'\d+\s+miles?\s+(east|west|north|south|northeast|northwest|southeast|southwest)',
        r'travel\s+(east|west|north|south|easterly|westerly|northerly|southerly)',
        r'following\s+road',
        r'past\s+[A-Z]',
        r'cross\s+the',
        r'right\s+onto',
        r'left\s+onto',
        r'where\s+the\s+road',
        r'winds\s+up',
        r'from\s+[A-Z]',
        r'to\s+[A-Z]',
    ]
    
    for pattern in direction_keywords:
        if re.search(pattern, address_clean, re.IGNORECASE):
            issues.append(f"Contains directions/instructions: matches pattern '{pattern}'")
            status = 'directions'
    
    # Check for route intersections without proper address
    if re.search(r'^\d+\s+and\s+\d+', address_clean, re.IGNORECASE):
        issues.append("Route intersection format (e.g., '151 and 56') without street address")
        status = 'route_intersection'
    
    # Check for incomplete addresses (missing city/state/zip)
    if not re.search(r',\s*VA\s+\d{5}', address_clean, re.IGNORECASE):
        if not re.search(r',\s*Virginia\s+\d{5}', address_clean, re.IGNORECASE):
            if not re.search(r',\s*VA', address_clean, re.IGNORECASE):
                if not re.search(r',\s*Virginia', address_clean, re.IGNORECASE):
                    issues.append("Missing state (VA/Virginia)")
                    if status == 'valid':
                        status = 'incomplete'
    
    # Check for addresses that are just route numbers
    if re.match(r'^(Route|Rt\.?|Highway|Hwy)\s+\d+', address_clean, re.IGNORECASE):
        if not re.search(r'\d+\s+(Route|Rt\.?|Highway|Hwy)', address_clean, re.IGNORECASE):
            issues.append("Only route number, no street number")
            status = 'route_only'
    
    # Check for addresses that start with numbers but are clearly descriptions
    if re.match(r'^\d+\.\d+', address_clean):  # Like "5.8 Blue Ridge Parkway"
        if 'parkway' in address_clean.lower() or 'mile' in address_clean.lower():
            issues.append("Appears to be a mile marker or distance, not a street address")
            status = 'mile_marker'
    
    # Check for addresses that are too long (likely contain extra text)
    if len(address_clean) > 100:
        issues.append(f"Address is very long ({len(address_clean)} chars) - may contain extra text")
        if status == 'valid':
            status = 'too_long'
    
    # Check for addresses that contain URLs or other non-address content
    if re.search(r'https?://', address_clean):
        issues.append("Contains URL")
        status = 'contains_url'
    
    # Check for addresses that are clearly descriptions
    descriptive_patterns = [
        r'is\s+Main\s+Street',
        r'comfortably\s+sleeps',
        r'per\s+lb\.',
        r'or\s*$',  # Ends with "or"
        r'Parking\s+and\s+Trail',
        r'To\s+a',  # Fragment
    ]
    
    for pattern in descriptive_patterns:
        if re.search(pattern, address_clean, re.IGNORECASE):
            issues.append(f"Contains descriptive text: matches '{pattern}'")
            if status == 'valid':
                status = 'descriptive'
    
    # Check for incomplete addresses (cut off)
    if address_clean.endswith(' o') or address_clean.endswith(' P'):
        issues.append("Address appears to be cut off/incomplete")
        status = 'incomplete'
    
    return {'status': status, 'issues': issues, 'address': address_clean}

# Read the CSV file
with open('CSV/final_listings_PERFECT.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    listings = list(reader)

# Analyze all addresses
results = []
for listing in listings:
    address = listing.get('address', '').strip()
    name = listing.get('name', '').strip()
    
    if address:
        analysis = analyze_address(address, name)
        if analysis['status'] != 'valid' or analysis['issues']:
            results.append({
                'name': name,
                'address': address,
                'analysis': analysis
            })

# Sort by status severity
status_order = {
    'directions': 1,
    'route_intersection': 2,
    'mile_marker': 3,
    'descriptive': 4,
    'contains_url': 5,
    'incomplete': 6,
    'too_long': 7,
    'route_only': 8,
    'valid': 9
}

results.sort(key=lambda x: (status_order.get(x['analysis']['status'], 99), x['name']))

# Generate report
print('=' * 100)
print('COMPREHENSIVE ADDRESS ANALYSIS REPORT')
print('=' * 100)
print(f'Total listings analyzed: {len(listings)}')
print(f'Addresses with issues: {len(results)}')
print('=' * 100)
print()

# Group by status
by_status = {}
for result in results:
    status = result['analysis']['status']
    if status not in by_status:
        by_status[status] = []
    by_status[status].append(result)

# Print by category
for status in sorted(by_status.keys(), key=lambda x: status_order.get(x, 99)):
    items = by_status[status]
    print(f'\n{"=" * 100}')
    print(f'{status.upper().replace("_", " ")} ({len(items)} addresses)')
    print(f'{"=" * 100}')
    print()
    
    for i, item in enumerate(items, 1):
        print(f'{i}. {item["name"]}')
        print(f'   Address: "{item["address"]}"')
        if item['analysis']['issues']:
            print(f'   Issues:')
            for issue in item['analysis']['issues']:
                print(f'     - {issue}')
        print()

# Summary
print('\n' + '=' * 100)
print('SUMMARY BY ISSUE TYPE')
print('=' * 100)
for status, items in sorted(by_status.items(), key=lambda x: len(x[1]), reverse=True):
    print(f'{status.replace("_", " ").title()}: {len(items)} addresses')



