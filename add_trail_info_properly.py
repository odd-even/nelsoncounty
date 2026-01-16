#!/usr/bin/env python3
"""
Add complete trail information to Hikes & Trails listings from donor source.
Preserves existing formatted information and only adds missing fields.
"""

import csv
import re
from urllib.parse import urlparse, parse_qs, unquote

def extract_existing_trail_info(detailed_description):
    """Extract existing trail information from formatted detailedDescription."""
    if not detailed_description:
        return {}
    
    info = {}
    
    # Check if it starts with formatted trail info
    if not (detailed_description.strip().startswith('Trail Distance:') or 
            detailed_description.strip().startswith('Miles:')):
        return {}
    
    # Extract distance
    distance_match = re.search(r'Trail\s+Distance:\s*([0-9.]+)|Miles?:\s*([0-9.]+)', detailed_description, re.IGNORECASE)
    if distance_match:
        info['distance'] = distance_match.group(1) or distance_match.group(2)
    
    # Extract blaze color
    blaze_match = re.search(r'Blaze\s+Color:\s*([^\n]+)', detailed_description, re.IGNORECASE)
    if blaze_match:
        info['blaze_color'] = blaze_match.group(1).strip()
    
    # Extract difficulty
    difficulty_match = re.search(r'Difficulty\s+Level:\s*([^\n(]+)', detailed_description, re.IGNORECASE)
    if difficulty_match:
        info['difficulty'] = difficulty_match.group(1).strip()
    
    # Extract directions link
    directions_match = re.search(r'Directions:\s*<a\s+href="([^"]+)"', detailed_description, re.IGNORECASE)
    if directions_match:
        info['directions_link'] = directions_match.group(1)
    
    return info

def extract_trail_info_from_text(text):
    """Extract trail information from unformatted text."""
    if not text:
        return {}
    
    info = {}
    
    # Extract distance
    distance_match = re.search(r'Miles?:\s*([0-9.]+)', text, re.IGNORECASE)
    if distance_match:
        info['distance'] = distance_match.group(1)
    
    # Extract blaze color
    blaze_match = re.search(r'Blaze\s+Color:\s*([^\n]+)', text, re.IGNORECASE)
    if blaze_match:
        color = blaze_match.group(1).strip()
        if 'yellow' in color.lower() and 'red' in color.lower():
            if color.lower().startswith('red'):
                info['blaze_color'] = 'Red-Yellow'
            else:
                info['blaze_color'] = 'Yellow-Red'
        else:
            info['blaze_color'] = color.title()
    else:
        # Try to find blaze color from description text
        if 'yellow-blazed' in text.lower() or 'yellow blazed' in text.lower():
            info['blaze_color'] = 'Yellow'
        elif 'red-blazed' in text.lower() or 'red blazed' in text.lower():
            info['blaze_color'] = 'Red'
        elif 'blue-blazed' in text.lower() or 'blue blazed' in text.lower():
            info['blaze_color'] = 'Blue'
        elif 'yellow-red' in text.lower() or 'yellow/red' in text.lower():
            info['blaze_color'] = 'Yellow-Red'
        elif 'red-yellow' in text.lower() or 'red/yellow' in text.lower():
            info['blaze_color'] = 'Red-Yellow'
    
    # Extract difficulty
    difficulty_match = re.search(r'Difficulty\s+Level:\s*([^\n(]+)', text, re.IGNORECASE)
    if difficulty_match:
        info['difficulty'] = difficulty_match.group(1).strip()
    else:
        # Try to find difficulty from description
        if re.search(r'\b(easy|moderate|difficult|strenuous|challenging)\b', text, re.IGNORECASE):
            match = re.search(r'\b(easy|moderate|difficult|strenuous|challenging)\b', text, re.IGNORECASE)
            if match:
                info['difficulty'] = match.group(1).title()
    
    # Extract Google Maps link
    maps_match = re.search(r'https?://(?:www\.)?google\.com/maps[^\s<>"\']+', text, re.IGNORECASE)
    if maps_match:
        info['directions_link'] = maps_match.group(0)
    else:
        googl_match = re.search(r'https?://goo\.gl/maps/[^\s<>"\']+', text, re.IGNORECASE)
        if googl_match:
            info['directions_link'] = googl_match.group(0)
    
    # Extract trail map PDF
    map_pdf_match = re.search(r'Trail\s+Map[^\n]*:?\s*(https?://[^\s<>"\']+\.pdf)', text, re.IGNORECASE)
    if map_pdf_match:
        info['trail_map'] = map_pdf_match.group(1)
        info['trail_map_name'] = 'Trail Map'
    
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
    
    try:
        parsed = urlparse(maps_link)
        params = parse_qs(parsed.query)
        
        if 'query' in params:
            return unquote(params['query'][0])
        elif 'destination' in params:
            return unquote(params['destination'][0])
    except:
        pass
    
    return None

def main():
    donor_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content-reviewed-fixed-with-short-summaries-with-links-cleaned-descriptions.csv'
    current_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-UPDATED.csv'
    output_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/listings-2026-01-15-FINAL.csv'
    report_file = '/Users/ernest/Documents/GitHub/nelsoncounty/CSV/TRAIL_INFO_FINAL_REPORT.txt'
    
    # Read donor file to extract trail information
    print(f"Reading donor file: {donor_file}...")
    donor_trails = {}
    
    try:
        with open(donor_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('type', '').strip() == 'Hikes & Trails':
                    slug = row.get('slug', '').strip().lower()
                    if slug:
                        detailed_desc = row.get('detailedDescription', '').strip()
                        description = row.get('description', '').strip()
                        directions_link = row.get('directionsLink', '').strip()
                        document1 = row.get('document1', '').strip()
                        document1_name = row.get('document1Name', '').strip()
                        
                        # Extract from formatted detailedDescription first
                        info = extract_existing_trail_info(detailed_desc)
                        
                        # If not formatted, extract from text
                        if not info:
                            full_text = description + '\n' + detailed_desc
                            info = extract_trail_info_from_text(full_text)
                        
                        # Use existing directionsLink if available
                        if directions_link and not info.get('directions_link'):
                            info['directions_link'] = directions_link
                        
                        # Use existing document if available
                        if document1 and not info.get('trail_map'):
                            info['trail_map'] = document1
                            info['trail_map_name'] = document1_name or 'Trail Map'
                        
                        if info:
                            donor_trails[slug] = info
    except FileNotFoundError:
        print(f"⚠️ Donor file not found: {donor_file}")
        print("   Will only use information from current file")
    
    print(f"Found trail information for {len(donor_trails)} trails in donor file")
    
    # Read current file
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
        
        description = row.get('description', '').strip()
        detailed_description = row.get('detailedDescription', '').strip()
        directions_link = row.get('directionsLink', '').strip()
        address = row.get('address', '').strip()
        document1 = row.get('document1', '').strip()
        document1_name = row.get('document1Name', '').strip()
        
        # Get existing formatted info (if any)
        existing_info = extract_existing_trail_info(detailed_description)
        
        # Get info from donor file
        donor_info = donor_trails.get(slug, {})
        
        # Extract info from current descriptions (unformatted)
        current_text = description + '\n' + detailed_description
        extracted_info = extract_trail_info_from_text(current_text)
        
        # Merge: existing formatted > donor > extracted > existing fields
        info = {
            'distance': existing_info.get('distance') or donor_info.get('distance') or extracted_info.get('distance'),
            'blaze_color': existing_info.get('blaze_color') or donor_info.get('blaze_color') or extracted_info.get('blaze_color'),
            'difficulty': existing_info.get('difficulty') or donor_info.get('difficulty') or extracted_info.get('difficulty'),
            'directions_link': existing_info.get('directions_link') or donor_info.get('directions_link') or extracted_info.get('directions_link') or directions_link,
            'trail_map': donor_info.get('trail_map') or extracted_info.get('trail_map'),
            'trail_map_name': donor_info.get('trail_map_name') or extracted_info.get('trail_map_name')
        }
        
        # Check if we need to add/update formatted trail info
        needs_update = False
        update_info = {
            'name': listing_name,
            'slug': slug,
            'added': []
        }
        
        # If we have any trail info and it's not already formatted at the start
        has_formatted_info = existing_info and (detailed_description.strip().startswith('Trail Distance:') or detailed_description.strip().startswith('Miles:'))
        
        if (info['distance'] or info['blaze_color'] or info['difficulty'] or info['directions_link']):
            if not has_formatted_info:
                # Need to add formatted section
                needs_update = True
            elif existing_info:
                # Check if we need to update existing formatted info
                if (info['distance'] and info['distance'] != existing_info.get('distance')):
                    needs_update = True
                if (info['blaze_color'] and info['blaze_color'] != existing_info.get('blaze_color')):
                    needs_update = True
                if (info['difficulty'] and info['difficulty'] != existing_info.get('difficulty')):
                    needs_update = True
                if (info['directions_link'] and info['directions_link'] != existing_info.get('directions_link')):
                    needs_update = True
        
        if needs_update:
            # Format the trail info section
            trail_info_section = format_trail_info_section(
                info['distance'],
                info['blaze_color'],
                info['difficulty'],
                info['directions_link']
            )
            
            if trail_info_section:
                if has_formatted_info:
                    # Replace existing formatted section
                    # Find where the formatted section ends (after Directions and blank line)
                    lines = detailed_description.split('\n')
                    new_lines = []
                    skip_until_blank = False
                    found_directions = False
                    
                    for i, line in enumerate(lines):
                        if line.strip().startswith('Trail Distance:') or line.strip().startswith('Miles:'):
                            skip_until_blank = True
                            continue
                        elif skip_until_blank:
                            if line.strip().startswith('Directions:'):
                                found_directions = True
                                continue
                            elif found_directions and line.strip() == '':
                                skip_until_blank = False
                                found_directions = False
                                continue
                            elif not found_directions:
                                continue
                            else:
                                skip_until_blank = False
                                found_directions = False
                                new_lines.append(line)
                        else:
                            new_lines.append(line)
                    
                    cleaned_desc = '\n'.join(new_lines).strip()
                    detailed_description = trail_info_section + cleaned_desc
                else:
                    # Prepend new formatted section
                    if detailed_description:
                        detailed_description = trail_info_section + detailed_description
                    else:
                        detailed_description = trail_info_section
                
                row['detailedDescription'] = detailed_description
                updated_count += 1
                
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
            # Also update address if we can extract it from the maps link
            extracted_address = extract_address_from_maps_link(info['directions_link'])
            if extracted_address:
                # Only update if current address seems generic or wrong
                if not address or 'Thomas Nelson Hwy' in address or ('Lovingston' in address and 'Wintergreen' in row.get('area', '')):
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
        # Use QUOTE_MINIMAL with proper escaping for multiline fields
        # This ensures fields with newlines are quoted, and quotes are escaped as double quotes
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL, doublequote=True)
        writer.writeheader()
        writer.writerows(rows)
    
    # Write report
    print(f"Writing report to {report_file}...")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("TRAIL INFORMATION - FINAL UPDATE REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Donor file: {donor_file}\n")
        f.write(f"Current file: {current_file}\n")
        f.write(f"Updated {updated_count} trail listings\n\n")
        
        if updates:
            for update in updates:
                f.write(f"{update['name']} ({update['slug']})\n")
                f.write(f"  Added/Updated: {', '.join(update['added']) if update['added'] else 'No new info found'}\n\n")
        else:
            f.write("No updates needed - all trails already have complete formatted information.\n")
    
    print(f"\n✅ Complete!")
    print(f"  Updated {updated_count} trail listings")
    print(f"  Output: {output_file}")
    print(f"  Report: {report_file}")

if __name__ == '__main__':
    main()
