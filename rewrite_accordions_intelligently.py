#!/usr/bin/env python3
"""
Intelligently rewrite accordions using language understanding:
1. Fix spacing issues (broken words, URLs with spaces)
2. Remove nonsensical content (hotel language in hikes, etc.)
3. Ensure content is relevant to the listing type
4. Process in batches
"""

import csv
import re

def fix_spacing_issues(text: str) -> str:
    """Fix spacing issues in text"""
    if not text:
        return text
    
    # Fix common spacing issues
    # U. S. -> U.S.
    text = re.sub(r'\bU\.\s+S\.', 'U.S.', text)
    text = re.sub(r'\bN\.\s+Y\.', 'N.Y.', text)
    text = re.sub(r'\bV\.\s+A\.', 'VA', text)
    
    # Fix numbers with spaces: 1. 5 -> 1.5, 4. 5 -> 4.5
    text = re.sub(r'(\d+)\.\s+(\d+)', r'\1.\2', text)
    
    # Fix website URLs with spaces
    # Pattern: http://example .com -> http://example.com
    text = re.sub(r'(https?://[^\s]+)\s+\.([a-z]{2,})', r'\1.\2', text, flags=re.IGNORECASE)
    text = re.sub(r'(www\.)\s+([^\s]+)', r'\1\2', text, flags=re.IGNORECASE)
    text = re.sub(r'([a-z0-9])\s+\.(com|org|net|edu|gov)', r'\1.\2', text, flags=re.IGNORECASE)
    
    # Fix broken short words (be careful - only obvious cases)
    # "t he" -> "the", "w ebsite" -> "website" (but not "y Organic" which is fine)
    common_words = {
        r'\bt\s+he\b': 'the',
        r'\bw\s+ebsite\b': 'website',
        r'\bw\s+e\b': 'we',
        r'\by\s+ou\b': 'you',
    }
    for pattern, replacement in common_words.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    return text.strip()

def is_content_relevant(listing_name: str, listing_type: str, content: str) -> bool:
    """Check if accordion content is relevant to the listing"""
    if not content or len(content) < 50:
        return False
    
    content_lower = content.lower()
    name_words = [w.lower() for w in listing_name.split() if len(w) > 3]
    
    # Hikes & Trails - reject hotel/comfort language
    if listing_type == 'Hikes & Trails':
        hotel_phrases = [
            'as comfortable as possible',
            'comfortable stay',
            'make your stay',
            'during your stay',
            'check-in',
            'check-out',
            'amenities include',
            'room features',
            'bedroom',
            'bathroom',
            'kitchen',
            'fully equipped kitchen',
            'linens provided',
            'we want your visit with us',
            'relaxing and trouble-free'
        ]
        if any(phrase in content_lower for phrase in hotel_phrases):
            return False
        
        # Should mention the trail/hike name or be about hiking
        if name_words:
            mentions_trail = any(word in content_lower for word in name_words)
            hiking_keywords = ['trail', 'hike', 'hiking', 'walk', 'mile', 'portal', 'tunnel', 'path', 'route']
            has_hiking_language = any(kw in content_lower for kw in hiking_keywords)
            
            if not mentions_trail and not has_hiking_language:
                return False
    
    # Restaurants - shouldn't be about hiking
    elif listing_type == 'Restaurants':
        if any(phrase in content_lower for phrase in ['hiking trail', 'trail head', 'backpacking', 'wilderness']):
            if 'menu' not in content_lower and 'food' not in content_lower:
                return False
    
    # Cabins/Lodging - shouldn't be about unrelated businesses
    elif listing_type in ['Cabins & Cottages', 'Whole House Rentals', 'Bed and Breakfast']:
        # Should be about the property, not other businesses
        if name_words:
            mentions_property = any(word in content_lower for word in name_words)
            property_keywords = ['cabin', 'cottage', 'house', 'property', 'accommodation', 'stay', 'bedroom', 'bathroom']
            has_property_language = any(kw in content_lower for kw in property_keywords)
            
            if not mentions_property and not has_property_language:
                # Might be about other businesses
                if any(biz in content_lower for biz in ['brewery', 'winery', 'restaurant']) and 'nearby' not in content_lower:
                    return False
    
    return True

def rewrite_accordion_content(listing_name: str, listing_type: str, title: str, content: str) -> tuple[bool, str]:
    """
    Rewrite accordion content to be relevant and properly formatted
    Returns: (should_keep, rewritten_content)
    """
    if not content:
        return False, ""
    
    # Fix spacing first
    content = fix_spacing_issues(content)
    
    # Check relevance
    if not is_content_relevant(listing_name, listing_type, content):
        return False, ""
    
    # For Hikes & Trails, rewrite hotel language
    if listing_type == 'Hikes & Trails':
        # Remove hotel language
        content = re.sub(r'we want your visit with us to be[^.]*\.', '', content, flags=re.IGNORECASE)
        content = re.sub(r'as comfortable as possible[^.]*\.', '', content, flags=re.IGNORECASE)
        content = re.sub(r'make your stay[^.]*\.', '', content, flags=re.IGNORECASE)
        
        # Clean up
        content = re.sub(r'\s+', ' ', content)
        content = content.strip()
        
        if len(content) < 50:
            return False, ""
    
    return True, content

def process_batch(listings, start_idx=0, batch_size=50):
    """Process a batch of listings"""
    end_idx = min(start_idx + batch_size, len(listings))
    batch = listings[start_idx:end_idx]
    
    fixes_made = []
    removed_count = 0
    
    for listing in batch:
        name = listing.get('name', '').strip()
        listing_type = listing.get('type', '').strip()
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if content:
                should_keep, rewritten = rewrite_accordion_content(name, listing_type, title, content)
                
                if not should_keep:
                    listing[f'accordionPanel{i}Title'] = ''
                    listing[f'accordionPanel{i}Content'] = ''
                    removed_count += 1
                    fixes_made.append(f"{name}: Removed accordion {i} ({title}) - not relevant")
                elif rewritten != content:
                    listing[f'accordionPanel{i}Content'] = rewritten
                    fixes_made.append(f"{name}: Fixed accordion {i} ({title}) - spacing/relevance")
    
    return fixes_made, removed_count

def main():
    print("=" * 80)
    print("INTELLIGENT ACCORDION REWRITE")
    print("=" * 80)
    
    # Load CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    total_listings = len(listings)
    batch_size = 50
    
    print(f"\nTotal listings: {total_listings}")
    print(f"Processing in batches of {batch_size}")
    print("=" * 80)
    
    all_fixes = []
    total_removed = 0
    
    # Process all listings
    for start_idx in range(0, total_listings, batch_size):
        end_idx = min(start_idx + batch_size, total_listings)
        print(f"\n📦 Processing batch: listings {start_idx+1}-{end_idx} ({end_idx-start_idx} listings)")
        
        fixes, removed = process_batch(listings, start_idx, batch_size)
        all_fixes.extend(fixes)
        total_removed += removed
        
        print(f"   Fixed: {len(fixes)} accordions")
        print(f"   Removed: {removed} irrelevant accordions")
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ REWRITE COMPLETE!")
    print(f"   Total accordions fixed: {len(all_fixes)}")
    print(f"   Total accordions removed: {total_removed}")
    print(f"   Total listings processed: {total_listings}")
    
    if all_fixes:
        print(f"\n   Sample fixes (first 20):")
        for fix in all_fixes[:20]:
            print(f"     - {fix}")
        if len(all_fixes) > 20:
            print(f"     ... and {len(all_fixes) - 20} more")

if __name__ == '__main__':
    main()
