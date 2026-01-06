#!/usr/bin/env python3
"""
Improve accordion titles to better match their content
Uses slightly longer titles when helpful for clarity
"""

import csv
import re

def analyze_content_type(content: str) -> dict:
    """Analyze content to determine what it's actually about"""
    if not content:
        return {'type': 'empty', 'confidence': 0}
    
    content_lower = content.lower()
    
    # Check for contact information
    phone_pattern = r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
    address_patterns = [
        r'\d+\s+[a-z\s]+(?:street|st|road|rd|highway|hwy|drive|dr|lane|ln|avenue|ave|boulevard|blvd|way|court|ct|circle|cir|loop|parkway|pkwy)',
        r'[a-z\s]+,\s*va\s+\d{5}',
    ]
    
    has_phone = bool(re.search(phone_pattern, content))
    has_address = any(re.search(pattern, content_lower) for pattern in address_patterns)
    has_website = 'http' in content_lower or 'www.' in content_lower
    
    # Check for hours
    hour_patterns = [
        r'\d{1,2}\s*(?:am|pm|a\.m\.|p\.m\.)',
        r'open|closed|hours?|daily|weekday|weekend',
        r'monday|tuesday|wednesday|thursday|friday|saturday|sunday',
    ]
    has_hours = any(re.search(pattern, content_lower) for pattern in hour_patterns)
    
    # Check for menu/food items
    food_keywords = ['menu', 'serves', 'serving', 'specialties', 'offers', 'features', 
                     'sandwich', 'pizza', 'burger', 'chicken', 'breakfast', 'lunch', 
                     'dinner', 'appetizer', 'entree', 'dessert', 'coffee', 'beer', 
                     'wine', 'cocktail', 'brunch', 'special', 'dish', 'cuisine']
    has_menu = any(keyword in content_lower for keyword in food_keywords)
    
    # Check for history
    history_keywords = ['history', 'historic', 'founded', 'established', 'built in', 
                       'began', 'created', 'designed by', 'landmark', 'museum', 
                       'exhibit', 'heritage', 'tradition', 'century', 'decade']
    has_history = any(keyword in content_lower for keyword in history_keywords)
    
    # Check for rules/guidelines
    rule_keywords = ['rule', 'guideline', 'regulation', 'policy', 'permit', 'license',
                     'required', 'must', 'should', 'prohibited', 'allowed', 'permitted']
    has_rules = any(keyword in content_lower for keyword in rule_keywords)
    
    # Check for FAQ
    faq_patterns = [r'^[a-z\s]+\?', r'question', r'answer', r'faq', r'frequently asked']
    has_faq = any(re.search(pattern, content_lower) for pattern in faq_patterns)
    
    # Check for amenities/features
    amenity_keywords = ['amenity', 'feature', 'include', 'offers', 'provides', 'equipped',
                       'available', 'access', 'parking', 'wifi', 'pet friendly', 
                       'wheelchair', 'accessible', 'outdoor', 'indoor', 'pool', 'gym']
    has_amenities = any(keyword in content_lower for keyword in amenity_keywords)
    
    # Check for events/activities
    event_keywords = ['event', 'activity', 'festival', 'concert', 'live music', 'tour',
                     'workshop', 'class', 'program', 'schedule', 'calendar']
    has_events = any(keyword in content_lower for keyword in event_keywords)
    
    # Check for location/area info
    location_keywords = ['located', 'location', 'address', 'directions', 'find us',
                        'near', 'close to', 'surrounding', 'area', 'region']
    has_location = any(keyword in content_lower for keyword in location_keywords)
    
    # Check for trail/hike specific
    trail_keywords = ['trail', 'hike', 'hiking', 'park', 'mountain', 'summit', 'peak',
                     'elevation', 'difficulty', 'distance', 'mile', 'bring', 'pack']
    has_trail = any(keyword in content_lower for keyword in trail_keywords)
    
    # Check for area/region descriptions
    area_keywords = ['nelson', 'county', 'blue ridge', 'valley', 'region', 'area',
                    'surrounding', 'nearby', 'local', 'community']
    has_area_desc = any(keyword in content_lower for keyword in area_keywords) and len(content) > 100
    
    # Check for experience/description
    experience_keywords = ['experience', 'enjoy', 'discover', 'explore', 'visit',
                          'offers', 'features', 'provides', 'includes']
    has_experience = any(keyword in content_lower for keyword in experience_keywords)
    
    # Check for lodging disclaimer
    has_disclaimer = 'lodging descriptions' in content_lower or 'provided by the host' in content_lower
    
    # Determine primary type
    scores = {}
    
    if has_phone or has_address or has_website:
        scores['contact'] = 3
    if has_hours:
        scores['hours'] = 2
    if has_menu:
        scores['menu'] = 3
    if has_history:
        scores['history'] = 3
    if has_rules:
        scores['rules'] = 3
    if has_faq:
        scores['faq'] = 3
    if has_amenities:
        scores['amenities'] = 2
    if has_events:
        scores['events'] = 2
    if has_location and not (has_phone or has_address):
        scores['location'] = 1
    if has_trail:
        scores['trail'] = 2
    if has_area_desc and not (has_history or has_menu):
        scores['area'] = 1
    if has_experience and not (has_menu or has_amenities):
        scores['experience'] = 1
    if has_disclaimer:
        scores['disclaimer'] = 1
    
    if not scores:
        # Default to information
        return {'type': 'information', 'confidence': 1}
    
    primary_type = max(scores.items(), key=lambda x: x[1])[0]
    confidence = scores[primary_type]
    
    return {'type': primary_type, 'confidence': confidence, 'scores': scores}

def suggest_title(content: str, current_title: str, listing_type: str, listing_name: str) -> str:
    """Suggest a better title based on content analysis"""
    if not content:
        return ''
    
    analysis = analyze_content_type(content)
    content_type = analysis['type']
    content_lower = content.lower()
    
    # Get listing context
    listing_lower = listing_type.lower()
    is_hike = 'hike' in listing_lower or 'trail' in listing_lower
    is_restaurant = 'restaurant' in listing_lower or 'deli' in listing_lower or 'market' in listing_lower
    is_brewery = 'brewery' in listing_lower or 'cider' in listing_lower
    is_accommodation = 'cabin' in listing_lower or 'cottage' in listing_lower or 'rental' in listing_lower or 'bed and breakfast' in listing_lower
    
    # Suggest based on content type
    if content_type == 'contact':
        if 'hour' in content_lower or 'open' in content_lower:
            return 'Hours, Contact & Location'
        return 'Contact & Location'
    
    if content_type == 'hours':
        if 'contact' in content_lower or 'phone' in content_lower or 'address' in content_lower:
            return 'Hours, Contact & Location'
        return 'Hours & Information'
    
    if content_type == 'menu':
        if is_restaurant:
            return 'Menu & Specialties'
        elif is_brewery:
            return 'Beer & Food Menu'
        else:
            return 'Menu & Offerings'
    
    if content_type == 'history':
        if 'background' in content_lower or 'story' in content_lower:
            return 'History & Background'
        return 'History'
    
    if content_type == 'rules':
        if is_hike:
            return 'Trail Rules & Guidelines'
        return 'Rules & Guidelines'
    
    if content_type == 'faq':
        return 'Frequently Asked Questions'
    
    if content_type == 'amenities':
        if is_accommodation:
            return 'Amenities & Features'
        elif is_hike:
            return 'Trail Features & Amenities'
        else:
            return 'Amenities & Services'
    
    if content_type == 'events':
        # Check if it's business-specific or generic area content
        if listing_name.lower() in content_lower or 'here' in content_lower or 'at this' in content_lower:
            return 'Events & Activities'
        else:
            # Generic area content - might want to remove, but for now keep title
            return 'Nearby Events & Activities'
    
    if content_type == 'trail':
        if 'information' in content_lower or 'details' in content_lower:
            return 'Trail Information & Details'
        elif 'what to bring' in content_lower or 'pack' in content_lower:
            return 'What to Bring'
        else:
            return 'Trail Information'
    
    if content_type == 'location':
        return 'Location & Directions'
    
    if content_type == 'area':
        # Area/region descriptions
        if 'nearby' in content_lower or 'surrounding' in content_lower:
            return 'Nearby Area & Attractions'
        return 'Area Information'
    
    if content_type == 'experience':
        # Experience/description content
        if is_hike:
            return 'Trail Experience & Details'
        elif is_restaurant:
            return 'Dining Experience'
        elif is_accommodation:
            return 'Accommodation Details'
        else:
            return 'Experience & Details'
    
    if content_type == 'disclaimer':
        return 'Important Information'
    
    # Default based on content length and keywords
    if len(content) < 100:
        # Short content - might be incomplete or just basic info
        # Try to be more specific
        if 'description' in content_lower or 'details' in content_lower:
            return 'Details & Information'
        elif 'note' in content_lower or 'important' in content_lower:
            return 'Important Information'
        elif is_hike:
            return 'Trail Information'
        elif is_restaurant:
            return 'Restaurant Information'
        elif is_accommodation:
            return 'Accommodation Information'
        else:
            return 'Additional Information'
    
    # Longer content - try to be more descriptive
    if 'description' in content_lower or 'details' in content_lower:
        if is_hike:
            return 'Trail Details & Information'
        elif is_restaurant:
            return 'Restaurant Details'
        elif is_accommodation:
            return 'Accommodation Details'
        else:
            return 'Details & Information'
    
    # Generic information - but try to be context-specific
    if is_hike:
        return 'Trail Information'
    elif is_restaurant:
        return 'Restaurant Information'
    elif is_accommodation:
        return 'Accommodation Information'
    elif is_brewery:
        return 'Brewery Information'
    else:
        return 'Additional Information'

def process_all_listings():
    """Process all listings and improve titles"""
    print("=" * 80)
    print("IMPROVING ACCORDION TITLES TO MATCH CONTENT")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"\nProcessing {len(listings)} listings...")
    print("=" * 80)
    
    improved = 0
    examples = []
    
    for listing in listings:
        name = listing.get('name', '').strip()
        listing_type = listing.get('type', '').strip()
        
        for i in range(1, 5):
            current_title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if current_title and content:
                suggested_title = suggest_title(content, current_title, listing_type, name)
                
                if suggested_title and suggested_title != current_title:
                    listing[f'accordionPanel{i}Title'] = suggested_title
                    improved += 1
                    
                    if len(examples) < 10:
                        examples.append({
                            'name': name,
                            'old': current_title,
                            'new': suggested_title
                        })
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ COMPLETE!")
    print(f"   Improved {improved} accordion titles")
    print(f"\n📋 Examples of improvements:")
    for ex in examples:
        print(f"   {ex['name']}:")
        print(f"     '{ex['old']}' → '{ex['new']}'")

if __name__ == '__main__':
    process_all_listings()
