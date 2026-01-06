#!/usr/bin/env python3
"""
Full rewrite - Batch 1 (first 10 listings)
- Extract complete, relevant sentences only
- Ensure content makes sense
- Rewrite line by line
"""

import csv
import re

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def fix_spacing(text: str) -> str:
    """Fix spacing issues"""
    if not text:
        return text
    text = re.sub(r'\bU\.\s+S\.', 'U.S.', text)
    text = re.sub(r'\bN\.\s+Y\.', 'N.Y.', text)
    text = re.sub(r'(\d+)\.\s+(\d+)', r'\1.\2', text)
    text = re.sub(r'([a-z0-9])\s+\.(com|org|net)', r'\1.\2', text, flags=re.IGNORECASE)
    return text.strip()

def extract_relevant_sentences(content: str, listing: dict) -> list:
    """Extract only sentences that are relevant to THIS business"""
    if not content:
        return []
    
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    
    name_words = [w for w in name.split() if len(w) > 3]
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    relevant = []
    
    for sent in sentences:
        sent = sent.strip()
        if not sent or len(sent) < 15:
            continue
        
        # Skip incomplete fragments
        if re.match(r'^[A-Z]\s+', sent) and len(sent) < 30:
            continue
        
        sent_lower = sent.lower()
        mentions_business = any(word in sent_lower for word in name_words) if name_words else False
        
        # Generic patterns to reject
        generic_patterns = [
            r'during the great depression',
            r'those who travel to',
            r'encouraged to visit',
            r'lovingston.*began with',
            r'the original 30 acres',
            r'schuyler\'s forests bloom',
            r'if you\'re traveling through',
            r'the history of nelson county',
            r'visit the walton\'s mountain museum',
            r'lovingston is a great destination',
            r'lovingston was defined as',
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
            r'el mariachi mexican restaurant',
            r'vito\'s pizza',
            r'dinner options in lovingston',
        ]
        
        # For non-trail businesses
        if listing_type not in ['hikes & trails', 'activities']:
            # Reject generic area content
            if any(re.search(pattern, sent_lower) for pattern in generic_patterns):
                if not mentions_business:
                    continue
            
            # Must have business language or mention business
            business_language = any(phrase in sent_lower for phrase in [
                'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
                'specializes', 'menu', 'serving', 'open', 'hours', 'located at',
                'find us', 'stop in', 'check out our', 'featuring', 'includes'
            ])
            
            if not mentions_business and not business_language:
                continue
        
        # Ensure proper capitalization
        if sent and sent[0].islower() and len(sent) > 20:
            sent = sent[0].upper() + sent[1:]
        
        relevant.append(sent)
    
    return relevant

def rewrite_accordion_complete(title: str, original_content: str, listing: dict) -> str:
    """Fully rewrite accordion - extract only relevant, complete sentences"""
    if not original_content:
        return ""
    
    listing_type = listing.get('type', '').strip()
    
    # Fix spacing
    content = fix_spacing(original_content)
    
    # Remove redundant contact info
    website = listing.get('website', '').strip()
    phone = listing.get('phone', '').strip()
    address = listing.get('address', '').strip()
    
    if website:
        domain = website.replace('https://', '').replace('http://', '').split('/')[0]
        if domain:
            content = re.sub(re.escape(domain), '', content, flags=re.IGNORECASE)
        content = re.sub(r'https?://[^\s]+', '', content)
        content = re.sub(r'www\.[^\s]+', '', content, flags=re.IGNORECASE)
    
    if phone:
        phone_digits = re.sub(r'\D', '', phone)
        if phone_digits:
            phone_pattern = rf'\(?{phone_digits[0:3]}\)?\s*-?\s*{phone_digits[3:6]}\s*-?\s*{phone_digits[6:10]}'
            content = re.sub(phone_pattern, '', content)
    
    if address:
        street_match = re.search(r'^\d+\s+[^,]+', address)
        if street_match:
            street = street_match.group()
            content = re.sub(re.escape(street), '', content, flags=re.IGNORECASE)
    
    # Extract relevant sentences
    relevant_sentences = extract_relevant_sentences(content, listing)
    
    if not relevant_sentences:
        return ""
    
    content = ' '.join(relevant_sentences)
    
    # For Hikes & Trails - rewrite hotel language
    if listing_type == 'Hikes & Trails':
        content = re.sub(r'we want your visit with us to be[^.]*\.', 'Important information for visitors:', content, flags=re.IGNORECASE)
        content = re.sub(r'as comfortable as possible', 'safely and enjoyably', content, flags=re.IGNORECASE)
        content = re.sub(r'comfortable stay', 'safe visit', content, flags=re.IGNORECASE)
        content = re.sub(r'before you arrive', 'Before visiting', content, flags=re.IGNORECASE)
    
    # Format FAQ if needed
    if 'faq' in title.lower() or 'question' in title.lower():
        content = format_faq(content)
    
    # Clean up
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Ensure ending punctuation
    if content and content[-1] not in '.!?' and len(content) > 50:
        content += '.'
    
    # Final check - must be substantial
    if len(content) < 50:
        return ""
    
    return content

def format_faq(content: str) -> str:
    """Format FAQ with bold questions"""
    if not content:
        return ""
    content = re.sub(r'\*\*', '', content)
    sentences = re.split(r'(?<=[.!?])\s+', content)
    formatted = []
    i = 0
    while i < len(sentences):
        sentence = sentences[i].strip()
        if not sentence:
            i += 1
            continue
        is_question = False
        if sentence.endswith('?'):
            is_question = True
        elif re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should)', sentence, re.IGNORECASE):
            if len(sentence) < 100:
                is_question = True
        if is_question:
            question = sentence.rstrip('.')
            if not question.endswith('?'):
                question += '?'
            formatted.append(f"**{question}**")
            answer_parts = []
            i += 1
            while i < len(sentences):
                next_sent = sentences[i].strip()
                if not next_sent:
                    i += 1
                    continue
                if next_sent.endswith('?') or re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does)', next_sent, re.IGNORECASE):
                    break
                answer_parts.append(next_sent)
                i += 1
            if answer_parts:
                formatted.append(' '.join(answer_parts))
            formatted.append('')
        else:
            formatted.append(sentence)
            i += 1
    return '\n\n'.join(formatted).strip()

def process_listing(listing: dict, original_listing: dict) -> dict:
    """Fully process one listing"""
    name = listing.get('name', '').strip()
    listing_type = listing.get('type', '').strip()
    
    print(f"\n  📝 {name} ({listing_type})")
    
    # Get original accordions
    original_accordions = {}
    for i in range(1, 5):
        orig_title = original_listing.get(f'accordionPanel{i}Title', '').strip()
        orig_content = original_listing.get(f'accordionPanel{i}Content', '').strip()
        if orig_title and orig_content:
            original_accordions[orig_title] = orig_content
    
    # Rewrite each accordion
    new_accordions = []
    
    for orig_title, orig_content in original_accordions.items():
        rewritten = rewrite_accordion_complete(orig_title, orig_content, listing)
        
        if rewritten and len(rewritten) > 50:
            new_accordions.append((orig_title, rewritten))
            print(f"    ✓ Rewrote: {orig_title}")
        else:
            print(f"    ✗ Removed: {orig_title} (no relevant content)")
    
    # Clear existing accordions
    for i in range(1, 5):
        listing[f'accordionPanel{i}Title'] = ''
        listing[f'accordionPanel{i}Content'] = ''
    
    # Set rewritten accordions
    for idx, (title, content) in enumerate(new_accordions[:4], 1):
        listing[f'accordionPanel{idx}Title'] = title
        listing[f'accordionPanel{idx}Content'] = content
    
    return listing

def main():
    print("=" * 80)
    print("FULL ACCORDION REWRITE - BATCH 1 (First 10 Listings)")
    print("Extracting complete, relevant sentences only")
    print("=" * 80)
    
    # Load consolidated CSV
    print("\nLoading consolidated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-consolidated.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        original_listings = list(reader)
    
    original_lookup = {}
    for listing in original_listings:
        name = listing.get('name', '').strip()
        if name:
            original_lookup[name] = listing
    
    print(f"  Loaded {len(original_lookup)} original listings")
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    # Process first 10 listings
    batch = listings[:10]
    
    print(f"\n{'=' * 80}")
    print(f"Processing {len(batch)} listings...")
    print("=" * 80)
    
    for listing in batch:
        name = listing.get('name', '').strip()
        original = original_lookup.get(name)
        if original:
            process_listing(listing, original)
        else:
            print(f"\n  ⚠️  {name}: No original listing found")
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ BATCH 1 COMPLETE!")
    print(f"   Processed: {len(batch)} listings")
    print(f"   All accordions rewritten with complete, relevant sentences only")

if __name__ == '__main__':
    main()
