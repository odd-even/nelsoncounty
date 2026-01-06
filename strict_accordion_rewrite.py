#!/usr/bin/env python3
"""
STRICT accordion rewrite - only include content that makes sense
for the specific listing. Remove all generic, irrelevant, or nonsensical content.
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
    STRICT check: Is this content actually about THIS specific listing?
    Returns False for generic area info, town history, etc.
    """
    if not content or len(content.strip()) < 50:
        return False
    
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    content_lower = content.lower()
    
    # Check if content mentions the listing name or related terms
    name_words = [w for w in name.split() if len(w) > 3]
    mentions_listing = any(word in content_lower for word in name_words) if name_words else False
    
    # Generic area/town content that should be rejected
    generic_patterns = [
        r'\bduring the great depression\b',
        r'\bthose who travel to\b',
        r'\bencouraged to visit\b',
        r'\blovingstown.*began with a land grant\b',
        r'\bthe original 30 acres was donated\b',
        r'\bnelson 151\'s wineries\b',
        r'\bif you\'d like to do a little shopping\b',
        r'\bcheck out the nelson 151\b',
        r'\bschuyler\'s forests bloom\b',
        r'\bif you\'re traveling through\b',
        r'\bthe history of nelson county\b',
        r'\bvisit the walton\'s mountain museum\b',
        r'\bthe walton\'s mountain museum\b',
        r'\blovingston is a great destination\b',
        r'\blovingston was defined as\b',
        r'\bthe nelson county courthouse\b',
        r'\bthomas jefferson\b',
        r'\bbright hope baptist church\b',
        r'\bthere\'s something to do in\b',
        r'\bevery season of the year\b',
        r'\blive music performances, good food\b',
        r'\bnelson farmer\'s market cooperative\b',
        r'\bnelson\'s wineries make for\b',
    ]
    
    # If it matches generic patterns and doesn't mention the listing, reject it
    matches_generic = any(re.search(pattern, content_lower) for pattern in generic_patterns)
    if matches_generic and not mentions_listing:
        return False
    
    # Check for incomplete sentences or fragments
    if content.strip().startswith(('S ', 'A ', 'The ', 'And ', 'If ', 'Those ')) and len(content) < 100:
        # Might be a fragment
        sentences = re.split(r'[.!?]', content)
        if len(sentences) == 1 and not content.endswith(('.', '!', '?')):
            return False
    
    # Check if content is about the area/town rather than the specific business
    area_keywords = ['nelson county', 'lovingston', 'afton', 'schuyler', 'nellysford', 'the area', 'the region']
    business_keywords = ['we ', 'our ', 'this ', 'here ', 'at ', 'serves', 'offers', 'features', 'specializes']
    
    area_mentions = sum(1 for keyword in area_keywords if keyword in content_lower)
    business_mentions = sum(1 for keyword in business_keywords if keyword in content_lower)
    
    # If it's mostly about the area and not the business, reject (unless it's a trail/area listing)
    if listing_type not in ['hikes & trails', 'activities'] and area_mentions > business_mentions and not mentions_listing:
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
    
    # Find headings
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
        
        heading_lower = heading_text.lower()
        
        # Skip generic headings
        skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open', 'closed', 'stay in the loop']
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
            
            # STRICT check: only keep if relevant to this listing
            if len(full_content) > 80 and is_content_relevant_to_listing(full_content, listing):
                # Check if heading or content mentions the listing
                mentions_listing = any(word in heading_lower or word in full_content.lower() for word in name_words) if name_words else False
                
                # For non-trail listings, require mention of listing name or business-specific language
                listing_type = listing.get('type', '').lower()
                if listing_type not in ['hikes & trails', 'activities']:
                    if not mentions_listing and not any(word in full_content.lower() for word in ['we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features']):
                        continue
                
                sections[heading_text] = full_content
    
    return sections

def determine_accordion_value(title: str, content: str, listing: Dict) -> Tuple[bool, str, str]:
    """Determine if accordion is valuable - STRICT checking"""
    if not content or len(content.strip()) < 100:
        return False, "", ""
    
    # Check if content is relevant to this specific listing
    if not is_content_relevant_to_listing(content, listing):
        return False, "", ""
    
    # Check for incomplete sentences
    if content.strip().startswith(('S ', 'A ', 'The ', 'And ', 'If ')) and len(content) < 150:
        sentences = re.split(r'[.!?]', content)
        if len([s for s in sentences if s.strip()]) == 1:
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

def process_listings():
    """Process all listings with STRICT accordion filtering"""
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_file = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    
    # Build donor lookup
    print("Building source lookup...")
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
    
    print(f"Processing {len(listings)} listings with STRICT accordion filtering...\n")
    
    # Process each listing
    for i, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        slug = listing.get('slug', '').strip()
        
        if i % 50 == 0:
            print(f"  Progress: {i}/{len(listings)}...")
        
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
            try:
                urls = [
                    f"https://nelsoncounty.com/{slug}/",
                    f"https://nelsoncounty.com/explore/{slug}/",
                ]
                for url in urls:
                    headers = {'User-Agent': 'Mozilla/5.0'}
                    response = requests.get(url, headers=headers, timeout=15)
                    if response.status_code == 200:
                        all_sources['research'] = extract_listing_specific_content(response.text, listing)
                        break
            except:
                pass
            time.sleep(0.5)
        
        # Collect valid accordions
        valid_accordions = []
        seen_hashes = set()
        
        # Check original accordions
        for panel_num in range(1, 5):
            title = listing.get(f'accordionPanel{panel_num}Title', '').strip()
            content = listing.get(f'accordionPanel{panel_num}Content', '').strip()
            if title and content:
                content_hash = hash(content[:200])
                if content_hash not in seen_hashes:
                    is_valid, good_title, cleaned = determine_accordion_value(title, content, listing)
                    if is_valid:
                        valid_accordions.append((good_title, cleaned))
                        seen_hashes.add(content_hash)
        
        # Check research sources
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
    print(f"\nWriting results to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"✅ Complete! Processed {len(listings)} listings")
    print(f"✅ Removed all generic/nonsensical accordion content")

if __name__ == '__main__':
    process_listings()
