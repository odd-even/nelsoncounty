#!/usr/bin/env python3
"""
FULL SEMANTIC REWRITE - Each accordion is reviewed for relevance and clarity.
Only includes content that makes logical sense for the specific listing.
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
import html

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = text.replace('&nbsp;', ' ').replace('&quot;', '"')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_content_relevant_to_listing(content: str, listing: Dict) -> bool:
    """
    SEMANTIC CHECK: Does this content make sense for THIS specific listing?
    Returns False for generic area info, other businesses, nonsensical content.
    """
    if not content or len(content.strip()) < 80:
        return False
    
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    area = listing.get('area', '').lower()
    content_lower = content.lower()
    
    # Extract meaningful words from listing name
    name_words = [w for w in name.split() if len(w) > 3]
    
    # Check if content mentions the listing name
    mentions_listing = any(word in content_lower for word in name_words) if name_words else False
    
    # REJECT: Generic area/town history or information
    generic_area_patterns = [
        r'during the great depression',
        r'those who travel to',
        r'encouraged to visit',
        r'lovingstown.*began with',
        r'the original 30 acres was donated',
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
        r'every fall, visitors travel to nelson county',
        r'a fall day trip to the',
        r'if you\'re planning on spending a hot summer day',
    ]
    
    matches_generic = any(re.search(pattern, content_lower) for pattern in generic_area_patterns)
    if matches_generic and not mentions_listing:
        return False
    
    # REJECT: Content about other businesses (unless it's a trail/area listing)
    if listing_type not in ['hikes & trails', 'activities']:
        other_businesses = [
            'devils backbone', 'blue mountain brewery', 'bold rock', 'wood ridge',
            'bryant\'s', 'blue toad', 'walton\'s mountain museum',
            'nelson 151', 'three notch', 'silverback'
        ]
        mentions_other_business = any(biz in content_lower for biz in other_businesses)
        if mentions_other_business and not mentions_listing:
            return False
    
    # REJECT: Incomplete sentences or fragments
    if content.strip().startswith(('S ', 'A ', 'The ', 'And ', 'If ')) and len(content) < 150:
        sentences = re.split(r'[.!?]', content)
        if len([s for s in sentences if s.strip()]) == 1:
            return False
    
    # For non-trail listings: content MUST be about the business itself
    if listing_type not in ['hikes & trails', 'activities']:
        # Must mention listing OR use business-specific language
        business_language = any(phrase in content_lower for phrase in [
            'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
            'specializes', 'located at', 'find us', 'open', 'hours', 'menu',
            'serving', 'provides', 'available', 'includes'
        ])
        
        if not mentions_listing and not business_language:
            return False
        
        # If it's mostly about the area/town and not the business, reject
        area_keywords = ['nelson county', 'lovingston', 'afton', 'schuyler', 'nellysford', 'the area', 'the region', 'the town']
        business_keywords = ['we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features', 'menu', 'serving']
        
        area_count = sum(1 for kw in area_keywords if kw in content_lower)
        business_count = sum(1 for kw in business_keywords if kw in content_lower)
        
        if area_count > business_count and not mentions_listing and area_count >= 2:
            return False
    
    return True

def extract_listing_specific_content(html_content: str, listing: Dict) -> Dict[str, str]:
    """Extract content that is SPECIFICALLY about this listing"""
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
        
        # Skip generic headings
        skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open', 'closed', 'stay in the loop', 'newsletter', 'sign up']
        if any(skip in heading_lower for skip in skip_headings):
            continue
        
        # Collect content
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
            
            # STRICT semantic check
            if len(full_content) > 80 and is_content_relevant_to_listing(full_content, listing):
                sections[heading_text] = full_content
    
    return sections

def determine_accordion_value(title: str, content: str, listing: Dict) -> Tuple[bool, str, str]:
    """
    Determine if accordion is valuable - SEMANTIC understanding required.
    Returns False if content doesn't make logical sense for this listing.
    """
    if not content or len(content.strip()) < 100:
        return False, "", ""
    
    # SEMANTIC CHECK: Is this relevant to THIS listing?
    if not is_content_relevant_to_listing(content, listing):
        return False, "", ""
    
    # Determine appropriate title
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

def research_listing_online(slug: str, name: str) -> Optional[Dict[str, str]]:
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
                return extract_listing_specific_content(response.text, {'name': name, 'type': '', 'area': ''})
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
    
    # Read rewritten file
    print("Reading rewritten CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings with FULL SEMANTIC REVIEW...\n")
    print("=" * 80)
    
    # Process each listing
    for i, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        slug = listing.get('slug', '').strip()
        listing_type = listing.get('type', '').strip()
        
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
            research_info = research_listing_online(slug, name)
            if research_info:
                all_sources['research'] = research_info
            time.sleep(0.8)
        
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
        
        # Priority 1: Original accordions (if they make sense)
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
    print(f"✅ Full semantic review complete - only relevant accordions retained")

if __name__ == '__main__':
    process_listings()
