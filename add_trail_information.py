#!/usr/bin/env python3
"""
Add missing trail information to Hikes & Trails listings.
Extracts and formats: Trail Distance, Blaze Color, Difficulty Level, Directions, Trail Map
"""

import csv
import re
from urllib.parse import urlparse, parse_qs

def extract_trail_info_from_description(description, detailed_description):
    """Extract trail information from existing descriptions."""
    info = {
        'distance': None,
        'blaze_color': None,
        'difficulty': None,
        'directions_link': None,
        'trail_map': None,
        'trail_map_name': None
    }
    
    # Combine both descriptions for searching
    full_text = (description or '') + '\n' + (detailed_description or '')
    
    # Extract distance (look for patterns like "0.6-mile", "0.6 mile", "Miles: 0.6")
    distance_patterns = [
        r'Miles?:\s*([0-9.]+)',
        r'([0-9.]+)[\s-]mile',
        r'([0-9.]+)\s*mile'
    ]
    for pattern in distance_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            info['distance'] = match.group(1)
            break
    
    # Extract blaze color (look for "Blaze Color:", "yellow-blazed", "red-blazed", etc.)
    blaze_patterns = [
        r'Blaze\s+Color:\s*([^\n]+)',
        r'([a-z]+(?:-[a-z]+)?)[\s-]blazed',
        r'blaze[:\s]+([a-z]+(?:-[a-z]+)?)'
    ]
    for pattern in blaze_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            info['blaze_color'] = match.group(1).strip().title()
            break
    
    # Extract difficulty (look for "Difficulty Level:", "Moderate", "Easy", "Difficult")
    difficulty_patterns = [
        r'Difficulty\s+Level:\s*([^\n]+)',
        r'\b(Easy|Moderate|Difficult|Strenuous|Challenging)\b'
    ]
    for pattern in difficulty_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            info['difficulty'] = match.group(1).strip()
            break
    
    # Extract Google Maps link
    maps_patterns = [
        r'https?://(?:www\.)?google\.com/maps[^\s<>"\']+',
        r'https?://goo\.gl/maps/[^\s<>"\']+',
        r'https?://maps\.google\.com[^\s<>"\']+'
    ]
    for pattern in maps_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            info['directions_link'] = match.group(0)
            break
    
    return info

def format_trail_info_section(distance, blaze_color, difficulty, directions_link):
    """Format trail information section for detailedDescription."""
    sections = []
    
    if distance:
        sections.append(f"Trail Distance: {distance} miles")
    
    if blaze_color:
        sections.append(f"Blaze Color: {blaze_color}")
    
    if difficulty:
        sections.append(f"Difficulty Level: {difficulty}")
    
    if directions_link:
        sections.append(f'Directions: <a href="{directions_link}" target="_blank" rel="noopener noreferrer">Google Maps</a>')
    
    if sections:
        return '\n\n'.join(sections) + '\n\n'
    return ''

def extract_address_from_maps_link(maps_link):
    """Extract address from Google Maps link."""
    if not maps_link:
        return None
    
    # Try to extract from query parameter
    if 'query=' in maps_link:
        try:
            parsed = urlparse(maps_link)
            params = parse_qs(parsed.query)
            if 'query' in params:
                address = params['query'][0]
                return address
        except:
            pass
    
    # Try to extract from destination parameter
    if 'destination=' in maps_link:
        try:
            parsed = urlparse(maps_link)
            params = parse_qs(parsed.query)
            if 'destination' in params:
                address = params['destination'][0]
                return address
        except:
            pass
    
    return None

def main():
    input_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-UPDATED.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/TRAIL_INFO_UPDATE_REPORT.txt'
    
    updated_count = 0
    updates = []
    
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    
    print(f"Found {len(rows)} listings")
    
    for row in rows:
        listing_type = row.get('type', '').strip()
        listing_name = row.get('name', '').strip()
        
        # Only process Hikes & Trails
        if listing_type != 'Hikes & Trails':
            continue
        
        description = row.get('description', '').strip()
        detailed_description = row.get('detailedDescription', '').strip()
        directions_link = row.get('directionsLink', '').strip()
        address = row.get('address', '').strip()
        document1 = row.get('document1', '').strip()
        document1_name = row.get('document1Name', '').strip()
        
        # Extract trail information
        info = extract_trail_info_from_description(description, detailed_description)
        
        # Use existing directionsLink if available
        if directions_link and not info['directions_link']:
            info['directions_link'] = directions_link
        
        # Check if detailedDescription already has formatted trail info
        has_formatted_info = False
        if detailed_description:
            if 'Trail Distance:' in detailed_description or 'Miles:' in detailed_description:
                if 'Blaze Color:' in detailed_description or 'Difficulty Level:' in detailed_description:
                    has_formatted_info = True
        
        # If we have new information to add and it's not already formatted
        if (info['distance'] or info['blaze_color'] or info['difficulty'] or info['directions_link']) and not has_formatted_info:
            # Format the trail info section
            trail_info_section = format_trail_info_section(
                info['distance'],
                info['blaze_color'],
                info['difficulty'],
                info['directions_link']
            )
            
            # Prepend to detailedDescription (or create it if empty)
            if trail_info_section:
                if detailed_description:
                    # Check if it already starts with trail info
                    if not detailed_description.startswith('Trail Distance:') and not detailed_description.startswith('Miles:'):
                        detailed_description = trail_info_section + detailed_description
                else:
                    detailed_description = trail_info_section
                
                row['detailedDescription'] = detailed_description
                updated_count += 1
                
                update_info = {
                    'name': listing_name,
                    'slug': row.get('slug', ''),
                    'added': []
                }
                
                if info['distance']:
                    update_info['added'].append(f"Distance: {info['distance']} miles")
                if info['blaze_color']:
                    update_info['added'].append(f"Blaze Color: {info['blaze_color']}")
                if info['difficulty']:
                    update_info['added'].append(f"Difficulty: {info['difficulty']}")
                if info['directions_link']:
                    update_info['added'].append("Directions link")
                
                updates.append(update_info)
        
        # Update directionsLink if we found a better one
        if info['directions_link'] and info['directions_link'] != directions_link:
            row['directionsLink'] = info['directions_link']
            # Also update address if we can extract it from the maps link
            extracted_address = extract_address_from_maps_link(info['directions_link'])
            if extracted_address and not address:
                row['address'] = extracted_address
        
        # Check for trail map in description (look for PDF links or map references)
        if not document1:
            map_patterns = [
                r'(trail\s+map|map\s+of\s+trail)[^\n]*:?\s*(https?://[^\s<>"\']+\.pdf)',
                r'(https?://[^\s<>"\']+\.pdf)[^\n]*(trail\s+map|map)',
            ]
            for pattern in map_patterns:
                match = re.search(pattern, detailed_description or description, re.IGNORECASE)
                if match:
                    # Extract PDF URL
                    pdf_url = re.search(r'https?://[^\s<>"\']+\.pdf', match.group(0), re.IGNORECASE)
                    if pdf_url:
                        row['document1'] = pdf_url.group(0)
                        row['document1Name'] = f"{listing_name} Trail Map"
                        if update_info:
                            update_info['added'].append("Trail Map")
                        break
    
    # Write updated CSV
    print(f"\nWriting updated CSV to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)
    
    # Write report
    print(f"Writing report to {report_file}...")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("TRAIL INFORMATION UPDATE REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Updated {updated_count} trail listings\n\n")
        
        for update in updates:
            f.write(f"{update['name']} ({update['slug']})\n")
            f.write(f"  Added: {', '.join(update['added'])}\n\n")
    
    print(f"\n✅ Complete!")
    print(f"  Updated {updated_count} trail listings")
    print(f"  Output: {output_file}")
    print(f"  Report: {report_file}")

if __name__ == '__main__':
    main()
