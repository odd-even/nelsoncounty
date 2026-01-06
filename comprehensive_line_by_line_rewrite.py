#!/usr/bin/env python3
"""
Comprehensive line-by-line rewrite with full research and analysis.
This script processes each listing individually with great care,
researching from all sources and creating high-quality, human-readable content.
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
import html

def clean_text(text: str, preserve_breaks: bool = False) -> str:
    """Clean and normalize text while optionally preserving line breaks"""
    if not text:
        return ""
    
    if preserve_breaks:
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<p[^>]*>', '', text, flags=re.IGNORECASE)
    
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = text.replace('&nbsp;', ' ').replace('&quot;', '"')
    text = text.replace('&#39;', "'").replace('&lt;', '<').replace('&gt;', '>')
    
    if not preserve_breaks:
        text = re.sub(r'\s+', ' ', text)
    else:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()

def extract_structured_content(html_content: str) -> Dict[str, str]:
    """Extract structured content from HTML, preserving meaningful sections"""
    if not html_content:
        return {}
    
    sections = {}
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find all headings
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
        
        heading_lower = heading_text.lower()
        
        # Skip redundant headings
        skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open', 'closed']
        if any(skip in heading_lower for skip in skip_headings):
            continue
        
        # Collect content following the heading
        content_parts = []
        current = heading.next_sibling
        count = 0
        max_iterations = 50
        
        while current and count < max_iterations:
            if hasattr(current, 'name'):
                if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    break
                
                if current.name == 'p':
                    text = clean_text(current.get_text(), preserve_breaks=False)
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
                elif current.name == 'div':
                    div_text = clean_text(current.get_text(), preserve_breaks=False)
                    if div_text and len(div_text) > 100:
                        # Check if it's not just navigation or footer
                        if not any(word in div_text.lower() for word in ['menu', 'navigation', 'footer', 'copyright']):
                            content_parts.append(div_text)
            elif isinstance(current, str):
                text = clean_text(current)
                if text and len(text) > 30:
                    content_parts.append(text)
            
            current = current.next_sibling
            count += 1
        
        if content_parts:
            full_content = '\n\n'.join(content_parts)
            full_content = re.sub(r'\n{3,}', '\n\n', full_content)
            if len(full_content) > 80:
                sections[heading_text] = full_content
    
    # If no headings, extract main paragraphs
    if not sections:
        paragraphs = []
        for p in soup.find_all('p'):
            p_text = clean_text(p.get_text())
            if p_text and len(p_text) > 80:
                paragraphs.append(p_text)
        if paragraphs:
            sections['About'] = '\n\n'.join(paragraphs[:10])
    
    return sections

def research_listing_online(slug: str, name: str) -> Optional[Dict[str, str]]:
    """Research listing on nelsoncounty.com with multiple URL attempts"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/",
        f"https://nelsoncounty.com/{slug}",
    ]
    
    for url in urls:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=20)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                sections = extract_structured_content(str(soup))
                
                if sections:
                    return sections
        except Exception as e:
            continue
    
    return None

def is_redundant_info(text: str, listing: Dict) -> bool:
    """Check if text contains redundant information already in listing fields"""
    if not text:
        return True
    
    text_lower = text.lower()
    phone = listing.get('phone', '').strip()
    address = listing.get('address', '').lower()
    website = listing.get('website', '').lower()
    name = listing.get('name', '').lower()
    
    # Check for phone number redundancy
    if phone:
        phone_clean = re.sub(r'[^\d]', '', phone)
        text_clean = re.sub(r'[^\d]', '', text)
        if phone_clean and phone_clean in text_clean:
            return True
    
    # Check for address redundancy
    if address:
        address_parts = [part.strip() for part in address.split(',') if len(part.strip()) > 5]
        if any(part in text_lower for part in address_parts):
            return True
    
    # Check for website redundancy
    if website:
        website_clean = website.replace('https://', '').replace('http://', '').replace('www.', '').rstrip('/')
        if website_clean and website_clean in text_lower:
            return True
    
    # Check for generic redundant phrases
    redundant_phrases = [
        'call us at', 'phone number', 'located at', 'find us at',
        'visit our website', 'check out our website', 'visit us at'
    ]
    if any(phrase in text_lower for phrase in redundant_phrases):
        return True
    
    return False

def create_well_written_description(current_desc: str, listing: Dict, all_sources: Dict) -> str:
    """
    Create a well-written, concise summary description that flows naturally.
    This should be 2-3 sentences that describe what the place IS and what it OFFERS.
    """
    name = listing.get('name', '').strip()
    listing_type = listing.get('type', '').strip()
    
    # Start with current description
    desc = clean_text(current_desc)
    
    # Break into sentences
    sentences = re.split(r'(?<=[.!?])\s+', desc)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    # Identify core essence sentences
    core_sentences = []
    detail_sentences = []
    
    for sent in sentences:
        sent_lower = sent.lower()
        
        # Skip if redundant
        if is_redundant_info(sent, listing):
            continue
        
        # Skip generic filler
        generic_phrases = [
            "there's something to do", "every season of the year",
            "great destination for", "check out", "visit us"
        ]
        if any(phrase in sent_lower for phrase in generic_phrases) and len(sent) < 60:
            continue
        
        # Core sentences describe WHAT the place IS
        if any(word in sent_lower for word in ['is', 'offers', 'features', 'serves', 'provides', 'specializes', 'located']):
            if len(sent) < 250:  # Not too detailed
                core_sentences.append(sent)
        else:
            if len(sent) < 200:
                detail_sentences.append(sent)
    
    # Build summary: 2-3 sentences
    summary_parts = []
    
    # First sentence: What it is
    if core_sentences:
        summary_parts.append(core_sentences[0])
    
    # Second sentence: Key feature
    if len(core_sentences) > 1:
        summary_parts.append(core_sentences[1])
    elif detail_sentences:
        summary_parts.append(detail_sentences[0])
    
    # Third sentence: Additional context if needed and available
    if len(summary_parts) < 2 and detail_sentences:
        summary_parts.append(detail_sentences[0])
    
    if summary_parts:
        summary = ' '.join(summary_parts)
        # Ensure proper punctuation
        if summary[-1] not in '.!?':
            summary += '.'
        return summary
    
    # Fallback: create from first meaningful sentence
    if desc:
        first_sentence = sentences[0] if sentences else desc[:250]
        if len(first_sentence) > 250:
            first_sentence = first_sentence[:247] + '...'
        if first_sentence[-1] not in '.!?':
            first_sentence += '.'
        return first_sentence
    
    return ""

def determine_accordion_value(title: str, content: str, listing: Dict) -> Tuple[bool, str, str]:
    """
    Determine if accordion content is valuable and suggest a good title.
    Returns (is_valuable, suggested_title, cleaned_content)
    """
    listing_type = listing.get('type', '').strip()
    is_trail = listing_type == 'Hikes & Trails'
    
    if not content or len(content.strip()) < 80:
        return False, "", ""
    
    content_lower = content.lower()
    
    # Skip if redundant (but be less strict for trails)
    if is_redundant_info(content, listing) and not is_trail:
        return False, "", ""
    
    # Skip generic content
    generic_phrases = [
        "there's something to do", "every season of the year",
        "and live music", "nelson 151's wineries", "check out",
        "stay in the loop", "sign up for", "newsletter", "email updates",
        "subscribe to", "follow us on", "social media"
    ]
    if any(phrase in content_lower for phrase in generic_phrases) and len(content) < 200 and not is_trail:
        return False, "", ""
    
    # Skip if it's clearly a newsletter/signup form
    if any(phrase in content_lower for phrase in ["stay in the loop", "sign up", "newsletter"]) and len(content) < 400:
        return False, "", ""
    
    # Determine appropriate title
    title_lower = title.lower()
    
    title_mapping = {
        'history': "History & Background",
        'story': "History & Background",
        'background': "History & Background",
        'heritage': "History & Background",
        'about': "About",
        'menu': "Menu & Offerings",
        'offerings': "Menu & Offerings",
        'what we serve': "Menu & Offerings",
        'specialties': "Menu & Offerings",
        'products': "Menu & Offerings",
        'experience': "What to Expect",
        'what to expect': "What to Expect",
        'visit': "What to Expect",
        'explore': "What to Expect",
        'rules': "Rules & Guidelines",
        'guidelines': "Rules & Guidelines",
        'policies': "Rules & Guidelines",
        'regulations': "Rules & Guidelines",
        'trail rules': "Rules & Guidelines",
        'trail': "Trail Information",
        'hiking': "Trail Information",
        'park': "Trail Information",
        'outdoor': "Trail Information",
        'trail information': "Trail Information",
        'events': "Events & Activities",
        'activities': "Events & Activities",
        'programs': "Events & Activities",
        'accessibility': "Accessibility & Facilities",
        'access': "Accessibility & Facilities",
        'parking': "Accessibility & Facilities",
        'facilities': "Accessibility & Facilities",
        'faq': "Frequently Asked Questions",
        'frequently asked': "Frequently Asked Questions",
        'questions': "Frequently Asked Questions",
        'what to bring': "What to Bring",
        'packing': "What to Bring",
        'map': "Maps & Trailheads",
        'maps': "Maps & Trailheads",
        'trailhead': "Maps & Trailheads",
    }
    
    suggested_title = None
    for key, value in title_mapping.items():
        if key in title_lower:
            suggested_title = value
            break
    
    if not suggested_title:
        if len(title) < 50 and title[0].isupper() and not any(char in title for char in ['&', '|', '>', '<']):
            suggested_title = title
        else:
            suggested_title = "Additional Information"
    
    # Clean content
    cleaned_content = content.strip()
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)
    
    return True, suggested_title, cleaned_content

def create_valuable_accordions(all_sources: Dict, listing: Dict, original_accordions: Dict = None) -> List[Tuple[str, str]]:
    """Create valuable accordion panels with sensible titles, prioritizing quality over quantity"""
    accordions = []
    seen_hashes = set()
    listing_type = listing.get('type', '').strip()
    is_trail = listing_type == 'Hikes & Trails'
    
    # Priority 1: Original accordions (especially for trails)
    if original_accordions:
        for title, content in original_accordions.items():
            if not title or not content:
                continue
            
            content_hash = hash(content[:300])
            if content_hash in seen_hashes:
                continue
            
            is_valuable, good_title, cleaned_content = determine_accordion_value(title, content, listing)
            
            # For trails, be more lenient
            if is_valuable or (is_trail and len(content.strip()) > 80 and not is_redundant_info(content, listing)):
                if not is_valuable:
                    _, good_title, cleaned_content = determine_accordion_value(title, content, listing)
                
                accordions.append((good_title, cleaned_content))
                seen_hashes.add(content_hash)
    
    # Priority 2: Research info (most current and accurate)
    if 'research' in all_sources:
        for title, content in all_sources['research'].items():
            content_hash = hash(content[:300])
            if content_hash in seen_hashes:
                continue
            
            is_valuable, good_title, cleaned_content = determine_accordion_value(title, content, listing)
            if is_valuable:
                accordions.append((good_title, cleaned_content))
                seen_hashes.add(content_hash)
    
    # Priority 3: Donor info
    for source_key in ['donor_portfolio', 'donor_pages']:
        if source_key in all_sources:
            for title, content in all_sources[source_key].items():
                content_hash = hash(content[:300])
                if content_hash in seen_hashes:
                    continue
                
                is_valuable, good_title, cleaned_content = determine_accordion_value(title, content, listing)
                if is_valuable:
                    accordions.append((good_title, cleaned_content))
                    seen_hashes.add(content_hash)
    
    # Limit to 4 accordions max
    return accordions[:4]

def process_listings():
    """Process all listings with comprehensive line-by-line review"""
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_file = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    
    # Build comprehensive lookup from all sources
    print("=" * 80)
    print("Building comprehensive source lookup...")
    print("=" * 80)
    donor_lookup = {}
    
    # Portfolio export
    print("Loading Portfolio export...")
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            excerpt = row.get('Excerpt', '').strip()
            
            if title and (content or excerpt):
                slug = permalink.rstrip('/').split('/')[-1] if permalink else ''
                key = title.lower()
                donor_lookup[key] = {'content': content, 'excerpt': excerpt, 'slug': slug, 'title': title, 'source': 'portfolio'}
                if slug:
                    donor_lookup[slug.lower()] = {'content': content, 'excerpt': excerpt, 'slug': slug, 'title': title, 'source': 'portfolio'}
    
    # Pages export
    print("Loading Pages export...")
    pages_count = 0
    with open(pages_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            excerpt = row.get('Excerpt', '').strip()
            slug_field = row.get('Slug', '').strip()
            
            if title and (content or excerpt):
                slug = slug_field or (permalink.rstrip('/').split('/')[-1] if permalink else '')
                key = title.lower()
                
                if key in donor_lookup:
                    if len(content) > len(donor_lookup[key].get('content', '')):
                        donor_lookup[key]['content'] = content
                    if excerpt and not donor_lookup[key].get('excerpt'):
                        donor_lookup[key]['excerpt'] = excerpt
                    donor_lookup[key]['source'] = 'both'
                else:
                    donor_lookup[key] = {'content': content, 'excerpt': excerpt, 'slug': slug, 'title': title, 'source': 'pages'}
                    pages_count += 1
                
                if slug:
                    slug_key = slug.lower()
                    if slug_key in donor_lookup:
                        if len(content) > len(donor_lookup[slug_key].get('content', '')):
                            donor_lookup[slug_key]['content'] = content
                        if excerpt and not donor_lookup[slug_key].get('excerpt'):
                            donor_lookup[slug_key]['excerpt'] = excerpt
                    else:
                        donor_lookup[slug_key] = {'content': content, 'excerpt': excerpt, 'slug': slug, 'title': title, 'source': 'pages'}
    
    print(f"Loaded {len(set(d['title'] for d in donor_lookup.values()))} unique entries ({pages_count} from Pages export)\n")
    
    # Read consolidated CSV
    print("Reading consolidated CSV...")
    with open(consolidated_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings with comprehensive line-by-line review...\n")
    print("=" * 80)
    
    # Process each listing
    updated_listings = []
    for i, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        slug = listing.get('slug', '').strip()
        current_desc = listing.get('description', '').strip()
        listing_type = listing.get('type', '').strip()
        
        print(f"\n[{i}/{len(listings)}] {name}")
        print(f"  Type: {listing_type} | Slug: {slug}")
        print("-" * 80)
        
        # Extract original accordions
        original_accordions = {}
        for panel_num in range(1, 5):
            title = listing.get(f'accordionPanel{panel_num}Title', '').strip()
            content = listing.get(f'accordionPanel{panel_num}Content', '').strip()
            if title and content:
                original_accordions[title] = content
        
        # Gather all sources
        all_sources = {}
        
        # Find donor info
        donor_entry = None
        if name:
            donor_entry = donor_lookup.get(name.lower())
            if not donor_entry and slug:
                donor_entry = donor_lookup.get(slug.lower())
        
        if donor_entry:
            content_to_parse = donor_entry.get('content', '') or donor_entry.get('excerpt', '')
            if content_to_parse:
                source_key = 'donor_portfolio' if donor_entry.get('source') in ['portfolio', 'both'] else 'donor_pages'
                all_sources[source_key] = extract_structured_content(content_to_parse)
                if all_sources[source_key]:
                    print(f"  ✓ Found {len(all_sources[source_key])} sections from {donor_entry.get('source', 'donor')} CSV")
        
        # Research online
        research_info = None
        if slug:
            print(f"  Researching on nelsoncounty.com...")
            research_info = research_listing_online(slug, name)
            if research_info:
                all_sources['research'] = research_info
                print(f"  ✓ Found {len(research_info)} sections from website")
            else:
                print(f"  - No additional content found online")
            time.sleep(1.0)  # Be polite to server
        
        # Create well-written description
        new_desc = create_well_written_description(current_desc, listing, all_sources)
        listing['description'] = new_desc
        
        if new_desc != current_desc:
            print(f"  ✓ Description rewritten ({len(new_desc)} chars)")
            print(f"    \"{new_desc[:150]}...\"")
        else:
            print(f"  - Description unchanged")
        
        # Create valuable accordions
        accordions = create_valuable_accordions(all_sources, listing, original_accordions)
        
        # Clear existing accordions
        for panel_num in range(1, 5):
            listing[f'accordionPanel{panel_num}Title'] = ''
            listing[f'accordionPanel{panel_num}Content'] = ''
        
        # Set new accordions
        for idx, (title, content) in enumerate(accordions, 1):
            if idx <= 4:
                listing[f'accordionPanel{idx}Title'] = title
                listing[f'accordionPanel{idx}Content'] = content
                print(f"  ✓ Accordion {idx}: {title} ({len(content)} chars)")
        
        if not accordions:
            print(f"  - No accordions (no valuable non-redundant info found)")
        
        updated_listings.append(listing)
        
        if i % 25 == 0:
            print(f"\n  ⏳ Progress: {i}/{len(listings)} listings processed...\n")
    
    # Write output
    output_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    print(f"\n{'=' * 80}")
    print(f"Writing results to {output_file}...")
    print("=" * 80)
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if updated_listings:
            writer = csv.DictWriter(f, fieldnames=updated_listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(updated_listings)
    
    print(f"✅ Complete! Processed {len(updated_listings)} listings")
    print(f"✅ Output written to: {output_file}")

if __name__ == '__main__':
    process_listings()
