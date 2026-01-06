#!/usr/bin/env python3
"""Fix remaining redundant contact info in accordions"""

import csv
import re

with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    listings = list(reader)

fixes = []

for listing in listings:
    name = listing.get('name', '').strip()
    website = listing.get('website', '').strip()
    phone = listing.get('phone', '').strip()
    address = listing.get('address', '').strip()
    
    # Fix Tennis accordion - remove address
    if name == 'Tennis':
        content = listing.get('accordionPanel1Content', '').strip()
        if content and '6919 Thomas Nelson Highway' in content:
            content = re.sub(r'6919\s+Thomas\s+Nelson\s+Highway[^\n]*', '', content)
            content = re.sub(r'434-263-8317[^\n]*', '', content)
            content = re.sub(r'\|\s*Website[^\n]*', '', content, flags=re.IGNORECASE)
            content = re.sub(r'\s+', ' ', content)
            content = content.strip()
            if content and len(content) > 20:
                listing['accordionPanel1Content'] = content
                fixes.append(f'{name}: Removed address from accordion 1')
            else:
                listing['accordionPanel1Title'] = ''
                listing['accordionPanel1Content'] = ''
                fixes.append(f'{name}: Removed accordion 1 (only redundant info)')
    
    # Fix Glass Hollow Studio
    elif name == 'Glass Hollow Studio & Gallery':
        content = listing.get('accordionPanel2Content', '').strip()
        if content:
            content = re.sub(r'Location:\s*[^\n.]+', '', content, flags=re.IGNORECASE)
            content = re.sub(r'Hours:\s*[^\n.]+', '', content, flags=re.IGNORECASE)
            content = re.sub(r'Contact:\s*[^\n.]+', '', content, flags=re.IGNORECASE)
            content = re.sub(r'\(434\)\s*270-6104', '', content)
            content = re.sub(r'glasshollow\.com', '', content, flags=re.IGNORECASE)
            content = re.sub(r'9080\s+Rockfish\s+Valley\s+Highway[^\n]*', '', content)
            content = re.sub(r'Afton,\s*VA\s*22920', '', content)
            content = re.sub(r'\s+', ' ', content)
            content = re.sub(r'\s*,\s*\.', '.', content)
            content = content.strip()
            if content and len(content) > 20:
                listing['accordionPanel2Content'] = content
                fixes.append(f'{name}: Cleaned accordion 2')
    
    # Fix Airkey
    elif name == 'Airkey Boutique Rentals':
        content = listing.get('accordionPanel2Content', '').strip()
        if content:
            content = re.sub(r'[Ww]wwmyairkey\.\s*[Cc]om', '', content)
            content = re.sub(r'myairkey\.com', '', content, flags=re.IGNORECASE)
            content = re.sub(r'\s+', ' ', content)
            content = content.strip()
            if content and len(content) > 20:
                listing['accordionPanel2Content'] = content
                fixes.append(f'{name}: Removed website from accordion 2')

# Write back
with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
    if listings:
        writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(listings)

print(f'✅ Fixed {len(fixes)} issues:')
for fix in fixes:
    print(f'  - {fix}')
