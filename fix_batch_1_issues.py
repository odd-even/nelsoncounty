#!/usr/bin/env python3
"""
Fix issues in Batch 1 (first 10 listings)
- Remove generic area content
- Ensure business-specific content only
- Create natural, complete sentences
"""

import csv
import re

def is_generic_content(content: str) -> bool:
    """Check if content is generic area content, not business-specific"""
    if not content:
        return True
    
    content_lower = content.lower()
    
    # Generic patterns to reject
    generic_patterns = [
        r'lovingston is a great destination',
        r'lovingston was defined as',
        r'the original 30 acres',
        r'during the great depression',
        r'those who travel to',
        r'encouraged to visit',
        r'schuyler\'s forests bloom',
        r'if you\'re traveling through',
        r'the history of nelson county',
        r'visit the walton\'s mountain museum',
        r'the nelson county courthouse',
        r'thomas jefferson',
        r'bright hope baptist church',
        r'^s\s+during',
        r'walton\'s mountain museum',
        r'hamner\'s boyhood school',
        r'john-boy walton',
        r'the rural electrification act',
        r'oakland museum',
        r'area schools',
        r'lovingstown, virginia',
        r'james loving',
        r'there were 49 lots',
        r'the lots were numbered',
    ]
    
    # Check if content matches generic patterns
    for pattern in generic_patterns:
        if re.search(pattern, content_lower):
            return True
    
    return False

def is_business_specific(content: str, listing: dict) -> bool:
    """Check if content is about THIS business"""
    if not content or len(content) < 30:
        return False
    
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    content_lower = content.lower()
    
    name_words = [w for w in name.split() if len(w) > 3]
    mentions_business = any(word in content_lower for word in name_words) if name_words else False
    
    # Business language indicators
    business_language = any(phrase in content_lower for phrase in [
        'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
        'specializes', 'menu', 'serving', 'open', 'hours', 'located at',
        'find us', 'stop in', 'check out our', 'featuring', 'includes',
        'tbc is', 'family-owned', 'sight roast', 'roasters', 'baristas',
        'coffee', 'café', 'cafe', 'espresso', 'beans', 'roasting',
        'homemade', 'baked goods', 'sandwiches', 'wraps', 'subs',
        'deli', 'convenience store', 'gas', 'breakfast', 'lunch',
        'fried chicken', 'barbecue', 'burgers', 'mac and cheese'
    ])
    
    # For non-trail businesses, must have business language or mention business
    if listing_type not in ['hikes & trails', 'activities']:
        if not mentions_business and not business_language:
            return False
    
    return True

def rewrite_for_natural_flow(content: str) -> str:
    """Rewrite content into natural, flowing sentences"""
    if not content:
        return ""
    
    # Fix missing periods before sentence starters
    sentence_starters = ['Specialties', 'Features', 'Includes', 'Offers', 'Our', 'We', 'The']
    for starter in sentence_starters:
        content = re.sub(rf'([a-z])\s+{starter}', rf'\1. {starter}', content, flags=re.IGNORECASE)
    
    # Fix awkward breaks
    content = re.sub(r'\bat\.\s+([A-Z][a-z])', r'at \1', content, flags=re.IGNORECASE)
    content = re.sub(r'\bus\.\s+([A-Z][a-z])', r'us at \1', content, flags=re.IGNORECASE)
    content = re.sub(r'kind\s+Our', 'kind. Our', content, flags=re.IGNORECASE)
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 15]
    
    if not sentences:
        return ""
    
    # For short choppy sentences, combine naturally
    if len(sentences) <= 3 and all(len(s) < 80 for s in sentences):
        # Pattern: "Convenience store and gas. Deli open for breakfast and lunch. Specialties include..."
        if len(sentences) == 3:
            first = sentences[0].lower()
            second = sentences[1].lower()
            third = sentences[2].lower()
            
            if 'convenience store' in first and 'gas' in first and 'deli' in second and 'open' in second:
                # Extract time from second sentence
                time_match = re.search(r'open\s+(.+?)(?:\.|$)', sentences[1], re.IGNORECASE)
                time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
                
                # Extract specialties from third
                specialties_match = re.search(r'(?:specialties|features)\s+include\s+(.+?)(?:\.|$)', sentences[2], re.IGNORECASE)
                specialties = specialties_match.group(1).strip() if specialties_match else ""
                
                return f"This convenience store and gas station features a deli open {time_info}. Specialties include {specialties}."
        
        # Pattern: "Locally owned convenience and gas store. The Deli is open..."
        if len(sentences) == 2:
            first = sentences[0].lower()
            second = sentences[1].lower()
            
            if 'locally owned' in first and 'convenience' in first and 'deli' in second and 'open' in second:
                time_match = re.search(r'open\s+(.+?)(?:\.|$)', sentences[1], re.IGNORECASE)
                time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
                
                return f"This locally owned convenience store and gas station features a deli open {time_info}."
    
    # Default: join sentences naturally
    result = ' '.join(sentences)
    
    # Clean up
    result = re.sub(r'\s+', ' ', result)
    result = result.strip()
    
    # Ensure ending punctuation
    if result and not result.endswith(('.', '!', '?')):
        result += '.'
    
    # Ensure proper capitalization
    if result and result[0].islower():
        result = result[0].upper() + result[1:]
    
    return result

def process_listing(listing: dict) -> dict:
    """Process one listing - remove generic content and ensure natural flow"""
    name = listing.get('name', '').strip()
    listing_type = listing.get('type', '').strip()
    
    print(f"\n  📝 {name} ({listing_type})")
    
    new_accordions = []
    
    for i in range(1, 5):
        title = listing.get(f'accordionPanel{i}Title', '').strip()
        content = listing.get(f'accordionPanel{i}Content', '').strip()
        
        if title and content:
            # Check if content is generic or not business-specific
            if is_generic_content(content):
                print(f"    ✗ Removed: {title} (generic area content)")
                continue
            
            if not is_business_specific(content, listing):
                print(f"    ✗ Removed: {title} (not business-specific)")
                continue
            
            # Rewrite for natural flow
            rewritten = rewrite_for_natural_flow(content)
            
            if rewritten and len(rewritten) > 50:
                new_accordions.append((title, rewritten))
                print(f"    ✓ Kept: {title}")
            else:
                print(f"    ✗ Removed: {title} (insufficient content)")
    
    # Clear existing accordions
    for i in range(1, 5):
        listing[f'accordionPanel{i}Title'] = ''
        listing[f'accordionPanel{i}Content'] = ''
    
    # Set new accordions
    for idx, (title, content) in enumerate(new_accordions[:4], 1):
        listing[f'accordionPanel{idx}Title'] = title
        listing[f'accordionPanel{idx}Content'] = content
    
    return listing

def main():
    print("=" * 80)
    print("FIXING BATCH 1 ISSUES")
    print("Removing generic content, ensuring business-specific natural sentences")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    # Process first 10 listings
    batch = listings[:10]
    
    print(f"\nProcessing {len(batch)} listings...")
    print("=" * 80)
    
    for listing in batch:
        process_listing(listing)
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ BATCH 1 FIXED!")
    print(f"   Processed: {len(batch)} listings")
    print(f"   Removed generic content, ensured natural business-specific sentences")

if __name__ == '__main__':
    main()
