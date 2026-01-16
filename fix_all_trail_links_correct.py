#!/usr/bin/env python3
"""
Fix all trail Directions links from Portfolio donor file
Reads the file as text to handle CSV escaping properly
"""

import csv
import re

def main():
    donor_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    current_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/TRAIL_LINKS_FIX_FROM_PORTFOLIO_REPORT.txt'
    
    print(f"Reading donor file as text: {donor_file}...")
    
    # Parse CSV properly to handle escaping
    donor_links = {}
    
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        # Find Content and Permalink column indices
        try:
            content_idx = headers.index('Content')
            permalink_idx = headers.index('Permalink')
        except ValueError:
            print(f"Error: Could not find Content or Permalink columns")
            print(f"Available columns: {headers[:10]}")
            return
        
        for row in reader:
            if len(row) > max(content_idx, permalink_idx):
                permalink = row[permalink_idx].strip()
                content = row[content_idx]
                
                # Extract slug
                slug_match = re.search(r'/explore/([^/]+)', permalink)
                if slug_match:
                    slug = slug_match.group(1).lower()
                    
                    # Find all Google Maps links in content
                    all_links = re.findall(r'https?://(?:goo\.gl/maps|(?:www\.)?google\.com/maps)[^\s<>"\']+', content, re.IGNORECASE)
                    
                    # Prefer link near Directions
                    selected = None
                    if 'Directions' in content:
                        dir_pos = content.find('Directions')
                        dir_section = content[dir_pos:min(dir_pos+500, len(content))]
                        dir_links = re.findall(r'https?://(?:goo\.gl/maps|(?:www\.)?google\.com/maps)[^\s<>"\']+', dir_section, re.IGNORECASE)
                        if dir_links:
                            selected = dir_links[0]
                    
                    if not selected and all_links:
                        selected = all_links[0]
                    
                    if selected:
                        # Clean HTML entities
                        selected = selected.replace('&amp;', '&')
                        donor_links[slug] = selected
    
    print(f"Found {len(donor_links)} trails with links in donor file")
    
    # Show sample
    print("\nSample links:")
    for slug, link in sorted(list(donor_links.items())[:10]):
        print(f"  {slug}: {link}")
    
    print(f"\nReading current file: {current_file}...")
    with open(current_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    print(f"Found {len(rows)} listings")
    
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
        f.write(f"Updated {updated_count} trail links\n\n")
        
        if updates:
            for update in updates:
                f.write(f"{update['name']} ({update['slug']})\n")
                f.write(f"  Old link: {update['old_link']}\n")
                f.write(f"  New link: {update['new_link']}\n\n")
        else:
            f.write("No updates needed - all links match donor file.\n")
    
    print(f"\n✅ Complete!")
    print(f"  Updated {updated_count} trail links")
    print(f"  Output: {output_file}")
    print(f"  Report: {report_file}")

if __name__ == '__main__':
    main()
