#!/usr/bin/env python3
"""
Create a before/after comparison file for all rewritten descriptions
"""

import csv
import os

def main():
    original_path = 'CSV/listings-2026-01-07-4.csv'
    rewritten_path = 'CSV/listings-2026-01-07-4-rewritten.csv'
    deep_fixed_path = 'CSV/listings-2026-01-07-4-rewritten-deep-fixed.csv'
    
    # Load all files
    print("Loading files...")
    
    with open(original_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        original = {row.get('slug', '').strip(): row for row in reader}
    
    with open(rewritten_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rewritten = {row.get('slug', '').strip(): row for row in reader}
    
    with open(deep_fixed_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        deep_fixed = {row.get('slug', '').strip(): row for row in reader}
    
    # Find all listings that were changed
    changed_listings = []
    
    for slug in original.keys():
        orig_desc = original[slug].get('description', '').strip()
        rewritten_desc = rewritten.get(slug, {}).get('description', '').strip()
        deep_fixed_desc = deep_fixed.get(slug, {}).get('description', '').strip()
        
        # Check if it was changed in either pass
        if orig_desc != rewritten_desc or rewritten_desc != deep_fixed_desc:
            name = original[slug].get('name', '').strip()
            listing_type = original[slug].get('type', '').strip()
            
            changed_listings.append({
                'name': name,
                'slug': slug,
                'type': listing_type,
                'original': orig_desc,
                'rewritten': rewritten_desc,
                'deep_fixed': deep_fixed_desc,
                'changed_in_first_pass': orig_desc != rewritten_desc,
                'changed_in_second_pass': rewritten_desc != deep_fixed_desc
            })
    
    # Sort by name
    changed_listings.sort(key=lambda x: x['name'])
    
    # Create comparison file
    output_path = 'CSV/BEFORE_AFTER_COMPARISON.txt'
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("=" * 100 + "\n")
        f.write("BEFORE & AFTER COMPARISON - DESCRIPTION REWRITES\n")
        f.write("=" * 100 + "\n\n")
        f.write(f"Total listings changed: {len(changed_listings)}\n")
        f.write(f"Changed in first pass: {sum(1 for x in changed_listings if x['changed_in_first_pass'])}\n")
        f.write(f"Changed in second pass (deep fix): {sum(1 for x in changed_listings if x['changed_in_second_pass'])}\n")
        f.write("\n" + "=" * 100 + "\n\n")
        
        for i, listing in enumerate(changed_listings, 1):
            f.write(f"{'=' * 100}\n")
            f.write(f"{i}. {listing['name']}\n")
            f.write(f"{'=' * 100}\n")
            f.write(f"Type: {listing['type']}\n")
            f.write(f"Slug: {listing['slug']}\n")
            
            if listing['changed_in_first_pass']:
                f.write(f"\n[FIRST PASS - Initial Rewrite]\n")
            if listing['changed_in_second_pass']:
                f.write(f"\n[SECOND PASS - Deep Fix]\n")
            
            f.write(f"\n{'─' * 100}\n")
            f.write("❌ BEFORE (Original - Problematic):\n")
            f.write(f"{'─' * 100}\n")
            f.write(f"{listing['original']}\n")
            f.write(f"\n   Length: {len(listing['original'])} characters\n")
            
            if listing['changed_in_first_pass']:
                f.write(f"\n{'─' * 100}\n")
                f.write("✅ AFTER (First Pass - Initial Fix):\n")
                f.write(f"{'─' * 100}\n")
                f.write(f"{listing['rewritten']}\n")
                f.write(f"\n   Length: {len(listing['rewritten'])} characters\n")
            
            if listing['changed_in_second_pass']:
                f.write(f"\n{'─' * 100}\n")
                f.write("✅✅ AFTER (Second Pass - Deep Fix):\n")
                f.write(f"{'─' * 100}\n")
                f.write(f"{listing['deep_fixed']}\n")
                f.write(f"\n   Length: {len(listing['deep_fixed'])} characters\n")
            elif listing['changed_in_first_pass']:
                # Only changed in first pass, so deep_fixed is same as rewritten
                f.write(f"\n   (No further changes in deep fix pass)\n")
            
            f.write(f"\n\n")
    
    print(f"\n✅ Comparison file created: {output_path}")
    print(f"   Total listings with changes: {len(changed_listings)}")
    print(f"   Changed in first pass: {sum(1 for x in changed_listings if x['changed_in_first_pass'])}")
    print(f"   Changed in second pass: {sum(1 for x in changed_listings if x['changed_in_second_pass'])}")

if __name__ == '__main__':
    main()
