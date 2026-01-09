#!/usr/bin/env python3
"""
Merge shorter summaries from source CSV into description column
Move detailed nectar descriptions to detailedDescription column
"""

import csv
import sys
import os

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)


def main():
    source_file = 'CSV/listings-2026-01-07-4.csv'
    current_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content-reviewed-fixed.csv'
    output_file = current_file.replace('.csv', '-with-short-summaries.csv')
    
    if not os.path.exists(source_file):
        print(f"❌ Source file not found: {source_file}")
        sys.exit(1)
    
    if not os.path.exists(current_file):
        print(f"❌ Current file not found: {current_file}")
        sys.exit(1)
    
    print(f"📖 Loading source file: {source_file}")
    
    # Load shorter summaries from source
    source_summaries = {}
    with open(source_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('slug', '').strip().lower()
            name = row.get('name', '').strip()
            description = row.get('description', '').strip()
            
            if slug:
                source_summaries[slug] = {
                    'name': name,
                    'description': description
                }
            # Also index by name as fallback
            if name:
                source_summaries[name.lower()] = {
                    'name': name,
                    'description': description
                }
    
    print(f"✅ Loaded {len(source_summaries)} summaries from source")
    print()
    
    print(f"📖 Loading current file: {current_file}")
    
    # Load current listings
    listings = []
    with open(current_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings from current file")
    print()
    
    # Process listings
    print(f"🔄 Merging summaries...")
    
    updated_count = 0
    not_found_count = 0
    
    for listing in listings:
        slug = listing.get('slug', '').strip().lower()
        name = listing.get('name', '').strip()
        current_description = listing.get('description', '').strip()
        
        # Try to find matching summary
        summary = None
        if slug and slug in source_summaries:
            summary = source_summaries[slug]
        elif name and name.lower() in source_summaries:
            summary = source_summaries[name.lower()]
        
        if summary and summary['description']:
            # Move current detailed description to detailedDescription
            listing['detailedDescription'] = current_description
            
            # Put shorter summary in description
            listing['description'] = summary['description']
            updated_count += 1
        else:
            # No summary found - keep current description
            not_found_count += 1
    
    print(f"   Updated: {updated_count} listings")
    print(f"   Not found: {not_found_count} listings")
    print()
    
    # Write output
    print(f"💾 Writing output to: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for listing in listings:
            writer.writerow(listing)
    
    print(f"✅ Complete! Output saved to: {output_file}")
    print()
    print("📊 Summary:")
    print(f"   Total listings: {len(listings)}")
    print(f"   Updated with short summaries: {updated_count}")
    print(f"   Kept detailed descriptions: {not_found_count}")
    print()
    print("✅ Short summaries are now in 'description' column")
    print("✅ Detailed nectar descriptions are now in 'detailedDescription' column")


if __name__ == '__main__':
    main()
