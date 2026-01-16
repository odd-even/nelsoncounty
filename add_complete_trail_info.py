#!/usr/bin/env python3
"""
Add complete trail information to Hikes & Trails listings from donor source.
Extracts and formats: Trail Distance, Blaze Color, Difficulty Level, Directions, Trail Map
"""

import csv
import re
from urllib.parse import urlparse, parse_qs, unquote

# Trail information database (can be expanded or loaded from donor file)
# Based on web research and existing data
TRAIL_INFO = {
    'devils-knob-trail': {
        'distance': '0.6',
        'blaze_color': 'Red-Yellow',
        'difficulty': 'Moderate',
        'directions_link': None,  # Will use existing if available
        'trail_map': None,
        'trail_map_name': None
    },
    # Add more trails as needed from donor source
}

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
        r'blaze[:\s]+([a-z]+(?:-[a-z]+)?)',
        r'([a-z]+(?:-[a-z]+)?)[\s-]blaze'
    ]
    for pattern in blaze_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            color = match.group(1).strip()
            # Normalize color names
            color = color.title()
            if 'yellow' in color.lower() and 'red' in color.lower():
                info['blaze_color'] = 'Red-Yellow' if 'red' in color.lower()[:4] else 'Yellow-Red'
            else:
                info['blaze_color'] = color
            break
    
    # Extract difficulty (look for "Difficulty Level:", "Moderate", "Easy", "Difficult")
    difficulty_patterns = [
        r'Difficulty\s+Level:\s*([^\n(]+)',
        r'\b(Easy|Moderate|Difficult|Strenuous|Challenging)\b'
    ]
    for pattern in difficulty_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            info['difficulty'] = match.group(1).strip().split('(')[0].strip()
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
    
    # Extract trail map PDF link
    map_patterns = [
        r'(trail\s+map|map\s+of\s+trail)[^\n]*:?\s*(https?://[^\s<>"\']+\.pdf)',
        r'(https?://[^\s<>"\']+\.pdf)[^\n]*(trail\s+map|map)',
        r'Trail\s+Map:\s*(https?://[^\s<>"\']+)',
    ]
    for pattern in map_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            pdf_url = re.search(r'https?://[^\s<>"\']+\.pdf', match.group(0), re.IGNORECASE)
            if pdf_url:
                info['trail_map'] = pdf_url.group(0)
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
                address = unquote(params['query'][0])
                return address
        except:
            pass
    
    # Try to extract from destination parameter
    if 'destination=' in maps_link:
        try:
            parsed = urlparse(maps_link)
            params = parse_qs(parsed.query)
            if 'destination' in params:
                address = unquote(params['destination'][0])
                return address
        except:
            pass
    
    return None

def main():
    input_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-UPDATED.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/TRAIL_INFO_COMPLETE_REPORT.txt'
    
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
        slug = row.get('slug', '').strip()
        
        # Only process Hikes & Trails
        if listing_type != 'Hikes & Trails':
            continue
        
        description = row.get('description', '').strip()
        detailed_description = row.get('detailedDescription', '').strip()
        directions_link = row.get('directionsLink', '').strip()
        address = row.get('address', '').strip()
        document1 = row.get('document1', '').strip()
        document1_name = row.get('document1Name', '').strip()
        
        # Check if we have manual trail info in database
        manual_info = TRAIL_INFO.get(slug.lower(), {})
        
        # Extract trail information from descriptions
        extracted_info = extract_trail_info_from_description(description, detailed_description)
        
        # Merge manual info (takes precedence)
        info = {
            'distance': manual_info.get('distance') or extracted_info['distance'],
            'blaze_color': manual_info.get('blaze_color') or extracted_info['blaze_color'],
            'difficulty': manual_info.get('difficulty') or extracted_info['difficulty'],
            'directions_link': manual_info.get('directions_link') or extracted_info['directions_link'] or directions_link,
            'trail_map': manual_info.get('trail_map') or extracted_info['trail_map'],
            'trail_map_name': manual_info.get('trail_map_name') or extracted_info['trail_map_name']
        }
        
        # Check if detailedDescription already has formatted trail info at the start
        has_formatted_info = False
        if detailed_description:
            if detailed_description.strip().startswith('Trail Distance:') or detailed_description.strip().startswith('Miles:'):
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
                    # Remove any existing trail info at the start if present
                    cleaned_desc = detailed_description
                    if cleaned_desc.startswith('Trail Distance:') or cleaned_desc.startswith('Miles:'):
                        # Remove existing trail info section
                        lines = cleaned_desc.split('\n')
                        new_lines = []
                        skip_until_blank = False
                        for line in lines:
                            if line.strip().startswith('Trail Distance:') or line.strip().startswith('Miles:'):
                                skip_until_blank = True
                            elif skip_until_blank and line.strip() == '':
                                skip_until_blank = False
                                continue
                            elif not skip_until_blank:
                                new_lines.append(line)
                        cleaned_desc = '\n'.join(new_lines).strip()
                    
                    detailed_description = trail_info_section + cleaned_desc
                else:
                    detailed_description = trail_info_section
                
                row['detailedDescription'] = detailed_description
                updated_count += 1
                
                update_info = {
                    'name': listing_name,
                    'slug': slug,
                    'added': []
                }
                
                if info['distance']:
                    update_info['added'].append(f"Distance: {info['distance']} miles")
                if info['blaze_color']:
                    update_info['added'].append(f"Blaze Color: {info['blaze_color']}")
                if info['difficulty']:
                    update_info['added'].append(f"Difficulty: {info['difficulty']}")
                if info['directions_link'] and info['directions_link'] != directions_link:
                    update_info['added'].append("Directions link")
                
                updates.append(update_info)
        
        # Update directionsLink if we found a better one
        if info['directions_link'] and info['directions_link'] != directions_link:
            row['directionsLink'] = info['directions_link']
            # Also update address if we can extract it from the maps link and address is generic
            extracted_address = extract_address_from_maps_link(info['directions_link'])
            if extracted_address:
                # Only update if current address seems generic or wrong
                if not address or 'Thomas Nelson Hwy' in address or 'Lovingston' in address:
                    # Check if extracted address is more specific
                    if 'Lovingston' not in extracted_address or 'Thomas Nelson' not in extracted_address:
                        row['address'] = extracted_address
                        if update_info:
                            update_info['added'].append("Updated address from Directions link")
        
        # Add trail map if found
        if info['trail_map'] and not document1:
            row['document1'] = info['trail_map']
            row['document1Name'] = info['trail_map_name'] or f"{listing_name} Trail Map"
            if update_info:
                update_info['added'].append("Trail Map")
    
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
        f.write("COMPLETE TRAIL INFORMATION UPDATE REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Updated {updated_count} trail listings\n\n")
        
        for update in updates:
            f.write(f"{update['name']} ({update['slug']})\n")
            f.write(f"  Added/Updated: {', '.join(update['added'])}\n\n")
    
    print(f"\n✅ Complete!")
    print(f"  Updated {updated_count} trail listings")
    print(f"  Output: {output_file}")
    print(f"  Report: {report_file}")

if __name__ == '__main__':
    main()
