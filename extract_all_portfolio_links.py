#!/usr/bin/env python3
"""
Extract all trail links from Portfolio donor file by searching for each trail
"""

import csv
import re

def main():
    donor_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    current_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/TRAIL_LINKS_FIX_FROM_PORTFOLIO_REPORT.txt'
    
    # Get list of all trail slugs from current file
    print(f"Reading current file to get trail list: {current_file}...")
    trail_slugs = []
    with open(current_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('type', '').strip() == 'Hikes & Trails':
                slug = row.get('slug', '').strip().lower()
                name = row.get('name', '').strip()
                if slug:
                    trail_slugs.append({'slug': slug, 'name': name})
    
    print(f"Found {len(trail_slugs)} trails")
    
    # Read Portfolio file as text
    print(f"\nReading donor file: {donor_file}...")
    with open(donor_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # For each trail, find its link in Portfolio file
    donor_links = {}
    for trail in trail_slugs:
        slug = trail['slug']
        name = trail['name']
        
        # Search for /explore/slug pattern (case insensitive)
        pattern = f'/explore/{slug}'
        matches = list(re.finditer(re.escape(pattern), content, re.IGNORECASE))
        
        for match in matches:
            pos = match.start()
            # Look in window around this position
            start = max(0, pos - 2000)
            end = min(len(content), pos + 4000)
            section = content[start:end]
            
            # Find Google Maps links near Directions
            if 'Directions' in section:
                dir_pos = section.find('Directions')
                # Look in 500 chars after Directions
                dir_section = section[dir_pos:min(dir_pos+500, len(section))]
                links = re.findall(r'(https?://(?:goo\.gl/maps|(?:www\.)?google\.com/maps)[^\s<>"]+)', dir_section, re.IGNORECASE)
                if links:
                    link = links[0].replace('&amp;', '&').replace('&amp;', '&')  # Double replace for safety
                    donor_links[slug] = link
                    break  # Found it, move to next trail
    
    print(f"Found {len(donor_links)} trails with links in Portfolio file")
    
    # Show sample
    print("\nSample links found:")
    for slug, link in sorted(list(donor_links.items())[:15]):
        trail_name = next((t['name'] for t in trail_slugs if t['slug'] == slug), slug)
        print(f"  {trail_name} ({slug}): {link}")
    
    # Update current file
    print(f"\nReading current file: {current_file}...")
    with open(current_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    updated_count = 0
    updates = []
    
    for row in rows:
        listing_type = row.get('type', '').strip()
        listing_name = row.get('name', '').strip()
        slug = row.get('slug', '').strip().lower()
        
        # Only process Hikes & Trails
        if listing_type != 'Hikes & Trails':
            continue
        
        # Check if we have a donor link for this trail
        if slug in donor_links:
            donor_link = donor_links[slug]
            detailed_desc = row.get('detailedDescription', '')
            
            # Extract current link from detailedDescription
            current_link = None
            match = re.search(r'Directions:\s*<a\s+href="([^"]+)"', detailed_desc, re.IGNORECASE)
            if match:
                current_link = match.group(1)
            
            # If links don't match, update
            if current_link != donor_link:
                # Replace the link in detailedDescription
                if current_link and 'Directions:' in detailed_desc:
                    # Replace the existing link
                    new_dd = re.sub(
                        r'Directions:\s*<a\s+href="[^"]+"[^>]*>Google Maps</a>',
                        f'Directions: <a href="{donor_link}" target="_blank" rel="noopener noreferrer">Google Maps</a>',
                        detailed_desc,
                        flags=re.IGNORECASE
                    )
                    row['detailedDescription'] = new_dd
                    updated_count += 1
                    updates.append({
                        'name': listing_name,
                        'slug': slug,
                        'old_link': current_link,
                        'new_link': donor_link
                    })
                elif 'Directions:' not in detailed_desc or not current_link:
                    # Add Directions section if it doesn't exist
                    if detailed_desc:
                        detailed_desc = f'Directions: <a href="{donor_link}" target="_blank" rel="noopener noreferrer">Google Maps</a><br><br>' + detailed_desc
                    else:
                        detailed_desc = f'Directions: <a href="{donor_link}" target="_blank" rel="noopener noreferrer">Google Maps</a>'
                    row['detailedDescription'] = detailed_desc
                    updated_count += 1
                    updates.append({
                        'name': listing_name,
                        'slug': slug,
                        'old_link': current_link or '(none)',
                        'new_link': donor_link
                    })
            
            # Also update directionsLink field
            if row.get('directionsLink', '').strip() != donor_link:
                row['directionsLink'] = donor_link
    
    # Write updated CSV
    print(f"\nWriting updated CSV to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL, doublequote=True)
        writer.writeheader()
        writer.writerows(rows)
    
    # Write report
    print(f"Writing report to {report_file}...")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("TRAIL DIRECTIONS LINKS FIX FROM PORTFOLIO DONOR REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Donor file: {donor_file}\n")
        f.write(f"Current file: {current_file}\n")
        f.write(f"Found {len(donor_links)} trails with links in Portfolio file\n")
        f.write(f"Updated {updated_count} trail links\n\n")
        
        if updates:
            f.write("UPDATED LINKS:\n")
            f.write("-" * 80 + "\n")
            for update in updates:
                f.write(f"{update['name']} ({update['slug']})\n")
                f.write(f"  Old link: {update['old_link']}\n")
                f.write(f"  New link: {update['new_link']}\n\n")
        else:
            f.write("No updates needed - all links match Portfolio file.\n")
    
    print(f"\n✅ Complete!")
    print(f"  Found {len(donor_links)} links in Portfolio file")
    print(f"  Updated {updated_count} trail links")
    print(f"  Output: {output_file}")
    print(f"  Report: {report_file}")

if __name__ == '__main__':
    main()
