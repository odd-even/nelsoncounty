#!/usr/bin/env python3
"""
Fix description issues and add accordions for major trails
"""

import csv
import re

def fix_description(desc: str) -> str:
    """Fix incomplete sentences and formatting issues"""
    if not desc:
        return desc
    
    desc = desc.strip()
    
    # Fix double periods
    desc = desc.replace('..', '.')
    
    # Ensure it ends with punctuation
    if desc and desc[-1] not in '.!?':
        desc += '.'
    
    # Fix ellipsis at end
    if desc.endswith('...'):
        desc = desc[:-3] + '.'
    
    return desc

def get_trail_accordions(trail_name: str, description: str) -> list:
    """Generate appropriate accordions for major trails"""
    accordions = []
    name_lower = trail_name.lower()
    desc_lower = description.lower()
    
    # Major trails that should have accordions
    major_trails = {
        'three ridges': {
            'title': 'Trail Information',
            'content': 'The 13.3-mile Three Ridges loop is a challenging backpacking route combining the Appalachian Trail and Mau-Har Trail. Expect strenuous terrain with significant elevation gain, rocky knife-edge climbs, and multiple waterfalls. The route typically takes 2-3 days to complete and requires proper backpacking gear, navigation skills, and physical fitness. Overnight camping is available at designated sites along the trail.'
        },
        'spy rock': {
            'title': 'Trail Information',
            'content': 'Spy Rock is accessible via a 6.5-mile round-trip hike from Meadows Lane (SR 826). The trail features sustained climbs, rocky scrambles, and limited blazes, so proper navigation is essential. The summit offers 360-degree panoramic views over the Blue Ridge Mountains. Be prepared for a challenging ascent and bring adequate water, snacks, and appropriate footwear.'
        },
        'humpback rocks': {
            'title': 'Trail Information',
            'content': 'The Humpback Rocks trail is a popular 2-mile loop that ascends 740 feet to the summit. Plan on about 45 minutes for the climb up and 20 minutes for the descent. The trail is steep but well-maintained, and the 360-degree views at the top are well worth the effort. Start from the visitor center near Blue Ridge Parkway milepost 5.8.'
        },
        'white rock falls': {
            'title': 'Trail Information',
            'content': 'White Rock Falls is a 2.5-mile moderate hike along the Blue Ridge Parkway. The trail features an impressive gorge, a wading-friendly waterfall, and northeast-facing mountain views. You can combine this trail with the Slacks Overlook Trail for a rewarding 5-mile loop. The waterfall area is perfect for cooling off on warm days.'
        },
        'nelson county wilderness area': {
            'title': 'Trail Information',
            'content': 'The Nelson County Wilderness Area protects nearly 10,000 rugged acres split between The Priest and Three Ridges. The Appalachian Trail traverses this wilderness, climbing from 1,000-foot river valleys to 4,000-foot summits. Backpackers will find permanently protected forests, sweeping overlooks, and some of the wildest terrain in the Blue Ridge. Proper backcountry skills and Leave No Trace principles are essential.'
        },
        'mau-har trail': {
            'title': 'Trail Information',
            'content': 'The blue-blazed Mau-Har Trail is a 3-mile connector that links with the Appalachian Trail to form the famed Three Ridges loop. The trail features waterfalls, campsites, and rugged terrain that backpackers consider one of Virginia\'s best circuits. Expect stream crossings, rock scrambles, and significant elevation changes.'
        },
        'james river state park': {
            'title': 'Park Information',
            'content': 'James River State Park offers 15+ miles of multiuse trails, riverfront overlooks, boat launches, cabins, and a full-service canoe livery. The park provides excellent opportunities for hiking, biking, fishing, and water activities. Reservations may be required for cabins and canoe rentals, so plan ahead for your visit.'
        },
        'appalachian trail from rt 56 to harpers creek': {
            'title': 'Trail Information',
            'content': 'This 2.6-mile segment of the Appalachian Trail crosses the Tye River via a swinging bridge and leads to Harpers Creek Shelter. The trail features beautiful laurel and rhododendron displays, creekside campsites, and relatively moderate terrain. The swinging bridge is a highlight of this section and provides excellent photo opportunities.'
        }
    }
    
    # Check if this is a major trail
    for trail_key, accordion_data in major_trails.items():
        if trail_key in name_lower:
            accordions.append((accordion_data['title'], accordion_data['content']))
            break
    
    return accordions

def process_file():
    """Process the rewritten CSV file"""
    input_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    output_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings...\n")
    
    fixed_count = 0
    accordion_count = 0
    
    for listing in listings:
        name = listing.get('name', '')
        listing_type = listing.get('type', '')
        desc = listing.get('description', '').strip()
        
        # Fix description issues
        original_desc = desc
        desc = fix_description(desc)
        
        if desc != original_desc:
            listing['description'] = desc
            fixed_count += 1
            print(f"Fixed description: {name}")
        
        # Add accordions for major trails that don't have them
        if listing_type == 'Hikes & Trails':
            has_accordion = bool(listing.get('accordionPanel1Title', '').strip())
            
            if not has_accordion:
                trail_accordions = get_trail_accordions(name, desc)
                
                if trail_accordions:
                    # Clear existing accordions
                    for i in range(1, 5):
                        listing[f'accordionPanel{i}Title'] = ''
                        listing[f'accordionPanel{i}Content'] = ''
                    
                    # Add new accordions
                    for idx, (title, content) in enumerate(trail_accordions, 1):
                        if idx <= 4:
                            listing[f'accordionPanel{idx}Title'] = title
                            listing[f'accordionPanel{idx}Content'] = content
                            accordion_count += 1
                            print(f"Added accordion to {name}: {title}")
    
    # Write output
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ Complete!")
    print(f"✅ Fixed {fixed_count} descriptions")
    print(f"✅ Added {accordion_count} accordions to trails")

if __name__ == '__main__':
    process_file()
