#!/usr/bin/env python3
"""
Fix all accordion title issues
- Remove generic Events & Activities content
- Improve vague titles
- Ensure all titles are meaningful
"""

import csv
import re

def is_generic_events_content(content: str, listing_type: str) -> bool:
    """Check if Events & Activities content is generic area content"""
    if not content:
        return True
    
    content_lower = content.lower()
    
    # Generic patterns that indicate area content, not business-specific
    generic_patterns = [
        r'nelson 151\'s wineries',
        r'check out the nelson farmer\'s market',
        r'if you\'re planning on spending',
        r'check out the nelson 151',
        r'rockfish valley community center',
        r'nelson\'s wineries make for',
        r'often, there\'s live music',
        r'and enjoy great food at blue mountain',
        r'if your taste runs a bit sweeter',
        r'try a cider or two at',
        r'purchase a piece of nelsonite',
        r'virginia rock shop',
        r'rockfish pottery collective',
        r'rockfish river gallery',
    ]
    
    # For non-activity listings, this is definitely generic
    if listing_type.lower() not in ['activities', 'hikes & trails']:
        if any(re.search(pattern, content_lower) for pattern in generic_patterns):
            return True
    
    return False

def improve_vague_title(title: str, content: str, listing_type: str) -> str:
    """Improve vague titles based on content"""
    if not title or not content:
        return title
    
    content_lower = content.lower()
    title_lower = title.lower()
    
    # Improve "Information" title
    if title == 'Information':
        if 'hour' in content_lower or 'open' in content_lower:
            return 'Hours & Information'
        elif 'amenit' in content_lower or 'feature' in content_lower:
            return 'Amenities & Features'
        elif 'history' in content_lower:
            return 'History & Background'
        elif 'rule' in content_lower or 'guideline' in content_lower:
            return 'Rules & Guidelines'
        else:
            return 'Additional Information'
    
    # Improve "About" title
    if title == 'About':
        if 'history' in content_lower:
            return 'History & Background'
        elif 'amenit' in content_lower:
            return 'Amenities & Features'
        else:
            return 'About'
    
    # Improve "Experience" title
    if title == 'Experience':
        if 'amenit' in content_lower or 'feature' in content_lower:
            return 'Amenities & Features'
        elif 'what to' in content_lower or 'bring' in content_lower:
            return 'What to Bring'
        elif 'rule' in content_lower:
            return 'Rules & Guidelines'
        else:
            return 'Experience'
    
    return title

def process_all_listings():
    """Process all listings and fix title issues"""
    print("=" * 80)
    print("FIXING ALL ACCORDION TITLE ISSUES")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"\nProcessing {len(listings)} listings...")
    print("=" * 80)
    
    removed_generic = 0
    improved_titles = 0
    
    for listing in listings:
        name = listing.get('name', '').strip()
        listing_type = listing.get('type', '').strip()
        
        # Collect good accordions
        good_accordions = []
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if title and content:
                # Check if Events & Activities is generic
                if title == 'Events & Activities':
                    if is_generic_events_content(content, listing_type):
                        removed_generic += 1
                        continue  # Skip this accordion
                
                # Improve vague titles
                new_title = improve_vague_title(title, content, listing_type)
                if new_title != title:
                    improved_titles += 1
                    title = new_title
                
                good_accordions.append((title, content))
        
        # Clear and set
        for i in range(1, 5):
            listing[f'accordionPanel{i}Title'] = ''
            listing[f'accordionPanel{i}Content'] = ''
        
        for idx, (title, content) in enumerate(good_accordions[:4], 1):
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
    print(f"   Removed {removed_generic} generic Events & Activities accordions")
    print(f"   Improved {improved_titles} vague titles")

if __name__ == '__main__':
    process_all_listings()
