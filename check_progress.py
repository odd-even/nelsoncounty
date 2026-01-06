#!/usr/bin/env python3
"""Quick script to check rewrite progress"""

import csv

with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
    listings = list(csv.DictReader(f))

focus_keywords = ['trail', 'hike', 'hiking', 'bike', 'biking', 'fishing', 'fisher', 'river', 'mountain', 'park', 'nature', 'outdoor', 'adventure', 'museum', 'gallery', 'art', 'history', 'historic', 'cultural', 'swannanoa', 'soaring', 'skiing', 'snowboarding']
focus_types = ['hikes & trails', 'activities', 'fishing']

processed = 0
total_focused = 0
processed_list = []

for listing in listings:
    listing_type = listing.get('type', '').strip().lower()
    name = listing.get('name', '').strip().lower()
    
    is_focused = (
        any(ft in listing_type for ft in focus_types) or
        any(kw in name for kw in focus_keywords)
    )
    
    if is_focused:
        total_focused += 1
        has_rewritten = False
        for i in range(1, 5):
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            if content and len(content) > 400:
                has_rewritten = True
                break
        
        if has_rewritten:
            processed += 1
            processed_list.append(listing.get('name', '').strip())

print(f'📊 PROGRESS UPDATE:')
print(f'   Focused listings: {total_focused}')
print(f'   Processed: {processed} ({processed/total_focused*100:.1f}%)')
print(f'   Remaining: {total_focused - processed}')
print(f'')
if processed_list:
    print(f'✅ Recently processed (last 5):')
    for name in processed_list[-5:]:
        print(f'   - {name}')
