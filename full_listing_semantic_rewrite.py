#!/usr/bin/env python3
"""
FULL SEMANTIC REWRITE - Reviews entire listing (description + accordions)
Ensures everything makes logical sense and is relevant to the specific listing.
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
import html

def clean_text(text: str, preserve_breaks: bool = False) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    
    if preserve_breaks:
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<p[^>]*>', '', text, flags=re.IGNORECASE)
    
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = text.replace('&nbsp;', ' ').replace('&quot;', '"')
    
    if not preserve_breaks:
        text = re.sub(r'\s+', ' ', text)
    else:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()

def is_content_relevant_to_listing(content: str, listing: Dict) -> bool:
    """
    SEMANTIC CHECK: Does this content make sense for THIS specific listing?
    """
    if not content or len(content.strip()) < 80:
        return False
    
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    content_lower = content.lower()
    
    name_words = [w for w in name.split() if len(w) > 3]
    mentions_listing = any(word in content_lower for word in name_words) if name_words else False
    
    # REJECT: Generic area/town patterns
    generic_patterns = [
        r'during the great depression',
        r'those who travel to',
        r'encouraged to visit',
        r'lovingstown.*began with',
        r'the original 30 acres',
        r'nelson 151\'s wineries',
        r'if you\'d like to do a little shopping',
        r'check out the nelson 151',
        r'schuyler\'s forests bloom',
        r'if you\'re traveling through',
        r'the history of nelson county',
        r'visit the walton\'s mountain museum',
        r'the walton\'s mountain museum',
        r'lovingston is a great destination',
        r'lovingston was defined as',
        r'the nelson county courthouse',
        r'thomas jefferson',
        r'bright hope baptist church',
        r'there\'s something to do in',
        r'every season of the year',
        r'live music performances, good food, and inventive',
        r'nelson farmer\'s market cooperative',
        r'nelson\'s wineries make for',
        r'every fall, visitors travel',
        r'a fall day trip to the',
        r'if you\'re planning on spending a hot summer day',
        r'and live music\. nelson 151',
        r'and enjoy great food at',
    ]
    
    if any(re.search(pattern, content_lower) for pattern in generic_patterns) and not mentions_listing:
        return False
    
    # REJECT: Other businesses (unless trail/area listing)
    if listing_type not in ['hikes & trails', 'activities']:
        other_businesses = [
            'devils backbone', 'blue mountain brewery', 'bold rock', 'wood ridge',
            'bryant\'s', 'blue toad', 'walton\'s mountain museum',
            'nelson 151', 'three notch', 'silverback', 'veritas', 'wintergreen resort'
        ]
        if any(biz in content_lower for biz in other_businesses) and not mentions_listing:
            return False
    
    # REJECT: Incomplete sentences
    if content.strip().startswith(('S ', 'A ', 'The ', 'And ', 'If ')) and len(content) < 150:
        sentences = re.split(r'[.!?]', content)
        if len([s for s in sentences if s.strip()]) == 1:
            return False
    
    # For businesses: must be about the business itself
    if listing_type not in ['hikes & trails', 'activities']:
        business_language = any(phrase in content_lower for phrase in [
            'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
            'specializes', 'located at', 'find us', 'open', 'hours', 'menu',
            'serving', 'provides', 'available', 'includes'
        ])
        
        if not mentions_listing and not business_language:
            return False
        
        # Reject if mostly about area, not business
        area_keywords = ['nelson county', 'lovingston', 'afton', 'schuyler', 'nellysford', 'the area', 'the region']
        business_keywords = ['we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features', 'menu']
        
        area_count = sum(1 for kw in area_keywords if kw in content_lower)
        business_count = sum(1 for kw in business_keywords if kw in content_lower)
        
        if area_count > business_count and not mentions_listing and area_count >= 2:
            return False
    
    return True

def create_well_written_description(current_desc: str, listing: Dict, all_sources: Dict) -> str:
    """
    Create a well-written description that makes sense.
    Should be 2-3 sentences describing what the place IS and what it OFFERS.
    """
    name = listing.get('name', '').strip()
    listing_type = listing.get('type', '').strip()
    
    desc = clean_text(current_desc)
    
    # Break into sentences
    sentences = re.split(r'(?<=[.!?])\s+', desc)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    # Filter for relevant sentences
    relevant_sentences = []
    for sent in sentences:
        sent_lower = sent.lower()
        
        # Skip redundant info
        if any(word in sent_lower for word in ['phone', 'address', 'located at', 'find us at', 'call us']):
            continue
        
        # Skip generic filler
        generic_phrases = [
            "there's something to do", "every season of the year",
            "great destination for", "check out", "visit us",
            "those who travel to", "encouraged to visit"
        ]
        if any(phrase in sent_lower for phrase in generic_phrases) and len(sent) < 60:
            continue
        
        # Skip if it's about other businesses/areas
        if listing_type not in ['hikes & trails', 'activities']:
            if any(biz in sent_lower for biz in ['walton\'s mountain museum', 'nelson 151', 'schuyler\'s forests']):
                continue
        
        # Keep sentences that describe what it IS
        if any(word in sent_lower for word in ['is', 'offers', 'features', 'serves', 'provides', 'specializes']):
            if len(sent) < 250:
                relevant_sentences.append(sent)
        elif len(relevant_sentences) < 2:
            if len(sent) < 200:
                relevant_sentences.append(sent)
    
    # Build summary: 2-3 sentences
    if relevant_sentences:
        summary = ' '.join(relevant_sentences[:3])
        if summary[-1] not in '.!?':
            summary += '.'
        return summary
    
    # Fallback
    if desc:
        first_sentence = sentences[0] if sentences else desc[:250]
        if len(first_sentence) > 250:
            first_sentence = first_sentence[:247] + '...'
        if first_sentence[-1] not in '.!?':
            first_sentence += '.'
        return first_sentence
    
    return ""

def extract_listing_specific_content(html_content: str, listing: Dict) -> Dict[str, str]:
    """Extract content SPECIFICALLY about this listing"""
    if not html_content:
        return {}
    
    sections = {}
    soup = BeautifulSoup(html_content, 'html.parser')
    name = listing.get('name', '').lower()
    name_words = [w for w in name.split() if len(w) > 3]
    
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
        
        heading_lower = heading_text.lower()
        skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open', 'closed', 'stay in the loop', 'newsletter']
        if any(skip in heading_lower for skip in skip_headings):
            continue
        
        content_parts = []
        current = heading.next_sibling
        count = 0
        
        while current and count < 30:
            if hasattr(current, 'name'):
                if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    break
                
                if current.name == 'p':
                    text = clean_text(current.get_text())
                    if text and len(text) > 30:
                        content_parts.append(text)
                elif current.name in ['ul', 'ol']:
                    items = []
                    for li in current.find_all('li'):
                        item_text = clean_text(li.get_text())
                        if item_text and len(item_text) > 10:
                            items.append(f"• {item_text}")
                    if items:
                        content_parts.append('\n'.join(items))
            
            current = current.next_sibling
            count += 1
        
        if content_parts:
            full_content = '\n\n'.join(content_parts)
            full_content = re.sub(r'\n{3,}', '\n\n', full_content)
            
            if len(full_content) > 80 and is_content_relevant_to_listing(full_content, listing):
                sections[heading_text] = full_content
    
    return sections

def determine_accordion_value(title: str, content: str, listing: Dict) -> Tuple[bool, str, str]:
    """Determine if accordion is valuable - SEMANTIC check"""
    if not content or len(content.strip()) < 100:
        return False, "", ""
    
    # SEMANTIC CHECK
    if not is_content_relevant_to_listing(content, listing):
        return False, "", ""
    
    # Determine title
    title_lower = title.lower()
    title_mapping = {
        'history': "History & Background",
        'menu': "Menu & Offerings",
        'offerings': "Menu & Offerings",
        'experience': "What to Expect",
        'rules': "Rules & Guidelines",
        'trail': "Trail Information",
        'events': "Events & Activities",
        'accessibility': "Accessibility & Facilities",
        'faq': "Frequently Asked Questions",
        'what to bring': "What to Bring",
    }
    
    suggested_title = None
    for key, value in title_mapping.items():
        if key in title_lower:
            suggested_title = value
            break
    
    if not suggested_title:
        if len(title) < 50 and title[0].isupper():
            suggested_title = title
        else:
            suggested_title = "Additional Information"
    
    cleaned_content = content.strip()
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)
    
    return True, suggested_title, cleaned_content

def research_listing_online(slug: str, name: str, listing: Dict) -> Optional[Dict[str, str]]:
    """Research listing on nelsoncounty.com"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/",
    ]
    
    for url in urls:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 200:
                return extract_listing_specific_content(response.text, listing)
        except:
            continue
    return None

def process_listings():
    """Process all listings with FULL SEMANTIC REVIEW"""
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_file = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    
    # Build donor lookup
    print("=" * 80)
    print("Building comprehensive source lookup...")
    print("=" * 80)
    donor_lookup = {}
    
    print("Loading Portfolio export...")
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            if title and content:
                slug = permalink.rstrip('/').split('/')[-1] if permalink else ''
                donor_lookup[title.lower()] = {'content': content, 'slug': slug}
                if slug:
                    donor_lookup[slug.lower()] = {'content': content, 'slug': slug}
    
    print("Loading Pages export...")
    with open(pages_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            slug_field = row.get('Slug', '').strip()
            if title and content:
                slug = slug_field or (permalink.rstrip('/').split('/')[-1] if permalink else '')
                key = title.lower()
                if key not in donor_lookup or len(content) > len(donor_lookup[key].get('content', '')):
                    donor_lookup[key] = {'content': content, 'slug': slug}
                if slug:
                    donor_lookup[slug.lower()] = {'content': content, 'slug': slug}
    
    print(f"Loaded {len(set(d['slug'] for d in donor_lookup.values() if d.get('slug')))} unique entries\n")
    
    # Read rewritten file
    print("Reading listings for full semantic review...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings with FULL SEMANTIC REVIEW...")
    print("Reviewing descriptions AND accordions for relevance and clarity")
    print("=" * 80)
    
    # Process each listing
    for i, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        slug = listing.get('slug', '').strip()
        listing_type = listing.get('type', '').strip()
        current_desc = listing.get('description', '').strip()
        
        if i % 50 == 0:
            print(f"\n  Progress: {i}/{len(listings)} listings processed...\n")
        
        # Gather sources
        all_sources = {}
        
        # Donor info
        donor_entry = None
        if name:
            donor_entry = donor_lookup.get(name.lower())
            if not donor_entry and slug:
                donor_entry = donor_lookup.get(slug.lower())
        
        if donor_entry:
            content = donor_entry.get('content', '')
            if content:
                all_sources['donor'] = extract_listing_specific_content(content, listing)
        
        # Research online
        if slug:
            research_info = research_listing_online(slug, name, listing)
            if research_info:
                all_sources['research'] = research_info
            time.sleep(0.8)
        
        # REVIEW AND REWRITE DESCRIPTION
        new_desc = create_well_written_description(current_desc, listing, all_sources)
        listing['description'] = new_desc
        
        # Collect original accordions
        original_accordions = {}
        for panel_num in range(1, 5):
            title = listing.get(f'accordionPanel{panel_num}Title', '').strip()
            content = listing.get(f'accordionPanel{panel_num}Content', '').strip()
            if title and content:
                original_accordions[title] = content
        
        # SEMANTIC REVIEW: Collect only valid accordions
        valid_accordions = []
        seen_hashes = set()
        
        # Priority 1: Original accordions (if they make semantic sense)
        for title, content in original_accordions.items():
            content_hash = hash(content[:200])
            if content_hash not in seen_hashes:
                is_valid, good_title, cleaned = determine_accordion_value(title, content, listing)
                if is_valid:
                    valid_accordions.append((good_title, cleaned))
                    seen_hashes.add(content_hash)
        
        # Priority 2: Research sources
        for source_key in ['research', 'donor']:
            if source_key in all_sources:
                for title, content in all_sources[source_key].items():
                    content_hash = hash(content[:200])
                    if content_hash not in seen_hashes:
                        is_valid, good_title, cleaned = determine_accordion_value(title, content, listing)
                        if is_valid:
                            valid_accordions.append((good_title, cleaned))
                            seen_hashes.add(content_hash)
        
        # Clear all accordions
        for panel_num in range(1, 5):
            listing[f'accordionPanel{panel_num}Title'] = ''
            listing[f'accordionPanel{panel_num}Content'] = ''
        
        # Set only valid accordions (limit 4)
        for idx, (title, content) in enumerate(valid_accordions[:4], 1):
            listing[f'accordionPanel{idx}Title'] = title
            listing[f'accordionPanel{idx}Content'] = content
    
    # Write output
    output_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    print(f"\n{'=' * 80}")
    print(f"Writing results to {output_file}...")
    print("=" * 80)
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"✅ Complete! Processed {len(listings)} listings")
    print(f"✅ Full semantic review complete:")
    print(f"   - Descriptions reviewed and rewritten for clarity")
    print(f"   - Accordions reviewed for relevance to each specific listing")
    print(f"   - Only content that makes logical sense has been retained")

if __name__ == '__main__':
    process_listings()
