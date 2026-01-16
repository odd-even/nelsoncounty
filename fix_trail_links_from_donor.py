#!/usr/bin/env python3
"""
Fix trail Directions links to match the donor/source file
"""

import csv
import re

def extract_link_from_text(text):
    """Extract Google Maps link from text."""
    if not text:
        return None
    
    # Look for Directions: <a href="..."> pattern
    match = re.search(r'Directions:\s*<a\s+href="([^"]+)"', text, re.IGNORECASE)
    if match:
        return match.group(1)
    
    # Also check for goo.gl links
    match = re.search(r'https?://goo\.gl/maps/[^\s<>"\']+', text, re.IGNORECASE)
    if match:
        return match.group(0)
    
    # Check for google.com/maps links
    match = re.search(r'https?://(?:www\.)?google\.com/maps[^\s<>"\']+', text, re.IGNORECASE)
    if match:
        return match.group(0)
    
    return None

def main():
    donor_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content-reviewed-fixed-with-short-summaries-with-links-cleaned-descriptions.csv'
    current_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/TRAIL_LINKS_FIX_REPORT.txt'
    
    print(f"Reading donor file: {donor_file}...")
    donor_links = {}
    
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('type', '').strip() == 'Hikes & Trails':
                slug = row.get('slug', '').strip().lower()
                if slug:
                    # Get link from detailedDescription first
                    dd = row.get('detailedDescription', '')
                    link = extract_link_from_text(dd)
                    
                    # If not found, check directionsLink field
                    if not link:
                        link = row.get('directionsLink', '').strip()
                    
                    if link:
                        donor_links[slug] = link
    
    print(f"Found {len(donor_links)} trails with links in donor file")
    
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
            current_link = extract_link_from_text(detailed_desc)
            
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
        f.write("TRAIL DIRECTIONS LINKS FIX REPORT\n")
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
