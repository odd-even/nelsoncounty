#!/usr/bin/env python3
"""
Remove accordions that don't contain meaningful or useful information
- Check if content is too short, generic, or not useful
- Remove accordions that don't add value to the listing
"""

import csv
import re

def is_meaningful_content(content: str, title: str, listing: dict) -> bool:
    """
    Determine if accordion content is meaningful and useful for this listing
    """
    if not content or len(content.strip()) < 50:
        return False
    
    content_lower = content.lower()
    listing_type = listing.get('type', '').lower()
    name = listing.get('name', '').lower()
    
    # Check for generic/non-useful patterns
    generic_patterns = [
        r'there\'s something to do',
        r'if you\'d like to do a little shopping',
        r'check out the nelson 151',
        r'rockfish valley community center',
        r'nelson 151 gift shops',
        r'virginia rock shop',
        r'rockfish pottery collective',
        r'rockfish river gallery',
        r'live music performances, good food',
        r'if you\'re planning on spending',
        r'nelson farmer\'s market cooperative',
        r'local vendors gather there',
        r'nelson 151\'s wineries',
        r'often include food pairing',
    ]
    
    # For non-trail businesses, reject generic area activity content
    if listing_type not in ['hikes & trails', 'activities']:
        if any(re.search(pattern, content_lower) for pattern in generic_patterns):
            return False
    
    # Check if content is just an address or phone number
    if re.match(r'^\d+\s+[^,]+,\s*[A-Z]{2}\s+\d{5}', content.strip()):
        return False
    
    if re.match(r'^\(?\d{3}\)?\s*-?\s*\d{3}\s*-?\s*\d{4}', content.strip()):
        return False
    
    # Check if content is too vague or incomplete
    vague_patterns = [
        r'^featuring\s+[^.]{0,30}\.$',  # "Featuring sandwiches." (too short)
        r'^homemade\s+[^.]{0,30}\.$',   # "Homemade bake goods." (too short)
        r'^find us at\s+[^.]{0,50}\.$', # "Find us at The Colleen Exxon." (not useful alone)
    ]
    
    for pattern in vague_patterns:
        if re.match(pattern, content_lower):
            return False
    
    # Check if content provides actual useful information
    useful_indicators = [
        'specialties include',
        'features',
        'offers',
        'serves',
        'open',
        'hours',
        'menu',
        'serving',
        'includes',
        'provides',
        'available',
    ]
    
    has_useful_info = any(indicator in content_lower for indicator in useful_indicators)
    
    # For very short content, it must have useful info
    if len(content) < 100:
        if not has_useful_info:
            return False
    
    # Check if content mentions the business or business-specific details
    name_words = [w for w in name.split() if len(w) > 3]
    mentions_business = any(word in content_lower for word in name_words) if name_words else False
    
    # Business language
    business_language = any(phrase in content_lower for phrase in [
        'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
        'specializes', 'menu', 'serving', 'open', 'hours', 'located at',
        'find us', 'stop in', 'check out our', 'featuring', 'includes',
    ])
    
    # For non-trail businesses, must have business relevance
    if listing_type not in ['hikes & trails', 'activities']:
        if not mentions_business and not business_language and not has_useful_info:
            return False
    
    return True

def process_all_listings():
    """Process all listings and remove meaningless accordions"""
    print("=" * 80)
    print("REMOVING MEANINGLESS ACCORDIONS")
    print("Keeping only accordions with useful, meaningful information")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"\nProcessing {len(listings)} listings...")
    print("=" * 80)
    
    total_removed = 0
    total_kept = 0
    updated_listings = 0
    
    for listing in listings:
        name = listing.get('name', '').strip()
        updated = False
        
        # Collect meaningful accordions
        meaningful_accordions = []
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if title and content:
                if is_meaningful_content(content, title, listing):
                    meaningful_accordions.append((title, content))
                    total_kept += 1
                else:
                    total_removed += 1
                    updated = True
        
        if updated:
            updated_listings += 1
            # Clear all accordions
            for i in range(1, 5):
                listing[f'accordionPanel{i}Title'] = ''
                listing[f'accordionPanel{i}Content'] = ''
            
            # Set only meaningful accordions
            for idx, (title, content) in enumerate(meaningful_accordions[:4], 1):
                listing[f'accordionPanel{idx}Title'] = title
                listing[f'accordionPanel{idx}Content'] = content
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ COMPLETE!")
    print(f"   Processed: {len(listings)} listings")
    print(f"   Updated: {updated_listings} listings")
    print(f"   Accordions kept: {total_kept}")
    print(f"   Accordions removed: {total_removed}")

if __name__ == '__main__':
    process_all_listings()
