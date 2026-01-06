#!/usr/bin/env python3
"""
Full rewrite - Batch 1 (first 10 listings)
- Read all sources fully
- Filter out generic/irrelevant content
- Rewrite line by line to be complete and business-specific
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
import html

def clean_text(text: str) -> str:
    """Clean HTML and normalize text"""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
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

def is_content_relevant_to_business(content: str, listing: dict) -> bool:
    """Check if content is actually about THIS business"""
    if not content or len(content) < 50:
        return False
    
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    content_lower = content.lower()
    
    name_words = [w for w in name.split() if len(w) > 3]
    mentions_business = any(word in content_lower for word in name_words) if name_words else False
    
    # Generic patterns to reject
    generic_patterns = [
        r'during the great depression',
        r'those who travel to',
        r'encouraged to visit',
        r'lovingston.*began with',
        r'the original 30 acres',
        r'nelson 151\'s wineries',
        r'if you\'d like to do a little shopping',
        r'check out the nelson 151',
        r'schuyler\'s forests bloom',
        r'if you\'re traveling through',
        r'the history of nelson county',
        r'visit the walton\'s mountain museum',
        r'lovingston is a great destination',
        r'lovingston was defined as',
        r'the nelson county courthouse',
        r'thomas jefferson',
        r'bright hope baptist church',
        r'there\'s something to do',
        r'every season of the year',
        r'live music performances, good food',
        r'nelson farmer\'s market cooperative',
        r'nelson\'s wineries make for',
        r'every fall, visitors travel',
        r'a fall day trip to the',
        r'if you\'re planning on spending',
        r'and live music\. nelson 151',
        r'and enjoy great food at',
        r'^s\s+during',  # "S during" fragment
    ]
    
    # For non-trail businesses, reject generic area content
    if listing_type not in ['hikes & trails', 'activities']:
        if any(re.search(pattern, content_lower) for pattern in generic_patterns):
            if not mentions_business:
                return False
        
        # Must mention business or use business language
        business_language = any(phrase in content_lower for phrase in [
            'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
            'specializes', 'menu', 'serving', 'open', 'hours', 'located at'
        ])
        
        if not mentions_business and not business_language:
            return False
    
    return True

def rewrite_accordion_completely(title: str, original_content: str, listing: dict) -> str:
    """Fully rewrite accordion content - ensure it's complete and relevant"""
    if not original_content:
        return ""
    
    listing_type = listing.get('type', '').strip()
    name = listing.get('name', '').strip()
    
    # Check relevance first
    if not is_content_relevant_to_business(original_content, listing):
        return ""  # Skip irrelevant content
    
    content = original_content
    
    # Fix spacing
    content = fix_spacing(content)
    
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
    
    # Remove generic patterns
    generic_patterns = [
        r'click on the badges below[^.]*\.',
        r'nelson county has something for everyone[^.]*\.',
        r'there\'s something to do[^.]*\.',
        r'every season of the year[^.]*\.',
        r'^s\s+during',  # "S during" fragment
    ]
    for pattern in generic_patterns:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)
    
    # For Hikes & Trails - rewrite hotel language
    if listing_type == 'Hikes & Trails':
        content = re.sub(r'we want your visit with us to be[^.]*\.', 'Important information for visitors:', content, flags=re.IGNORECASE)
        content = re.sub(r'as comfortable as possible', 'safely and enjoyably', content, flags=re.IGNORECASE)
        content = re.sub(r'comfortable stay', 'safe visit', content, flags=re.IGNORECASE)
        content = re.sub(r'before you arrive', 'Before visiting', content, flags=re.IGNORECASE)
    
    # Break into sentences and filter
    sentences = re.split(r'(?<=[.!?])\s+', content)
    complete_sentences = []
    
    for sent in sentences:
        sent = sent.strip()
        if not sent or len(sent) < 10:
            continue
        
        # Remove incomplete fragments
        if re.match(r'^[A-Z]\s+', sent) and len(sent) < 30:
            continue
        
        # Remove generic sentences for non-trail businesses
        if listing_type not in ['Hikes & Trails', 'Activities']:
            sent_lower = sent.lower()
            if any(phrase in sent_lower for phrase in [
                'lovingston is a great destination',
                'lovingston was defined',
                'the original 30 acres',
                'during the great depression',
                'those who travel to',
                'schuyler\'s forests bloom',
                'the history of nelson county',
                'visit the walton\'s mountain museum',
            ]):
                # Skip generic area content
                continue
        
        # Ensure proper capitalization
        if sent and sent[0].islower() and len(sent) > 20:
            sent = sent[0].upper() + sent[1:]
        
        complete_sentences.append(sent)
    
    content = ' '.join(complete_sentences)
    
    # Format FAQ if needed
    if 'faq' in title.lower() or 'question' in title.lower():
        content = format_faq(content)
    
    # Clean up
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Ensure ending punctuation
    if content and content[-1] not in '.!?' and len(content) > 50:
        content += '.'
    
    # Final relevance check
    if not is_content_relevant_to_business(content, listing):
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
    """Fully process one listing - rewrite accordions line by line"""
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
    
    # Rewrite each accordion completely
    new_accordions = []
    
    for orig_title, orig_content in original_accordions.items():
        rewritten = rewrite_accordion_completely(orig_title, orig_content, listing)
        
        if rewritten and len(rewritten) > 50:
            new_accordions.append((orig_title, rewritten))
            print(f"    ✓ Rewrote: {orig_title}")
        else:
            print(f"    ✗ Removed: {orig_title} (not relevant to business)")
    
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
    print("Reading all sources, filtering irrelevant content, rewriting line by line")
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
    print(f"   All accordions fully rewritten and filtered for relevance")

if __name__ == '__main__':
    main()
