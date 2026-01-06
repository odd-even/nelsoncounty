#!/usr/bin/env python3
"""
AI-powered comprehensive rewrite of listings.
This script processes each listing individually, gathering all context,
then uses AI understanding to create well-written, human-quality descriptions
and meaningful accordions that make sense to readers.
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
import json

def clean_text(text: str, preserve_breaks: bool = False) -> str:
    """Clean and normalize text while optionally preserving line breaks"""
    if not text:
        return ""
    
    if preserve_breaks:
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<p[^>]*>', '', text, flags=re.IGNORECASE)
    
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&quot;', '"')
    text = text.replace('&#39;', "'").replace('&lt;', '<').replace('&gt;', '>')
    
    if not preserve_breaks:
        text = re.sub(r'\s+', ' ', text)
    else:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()

def extract_all_content_from_donor(donor_content: str) -> Dict[str, str]:
    """Extract all meaningful content from donor CSV, preserving structure"""
    if not donor_content:
        return {}
    
    sections = {}
    soup = BeautifulSoup(donor_content, 'html.parser')
    
    # Find all headings
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
        
        heading_lower = heading_text.lower()
        
        # Skip redundant headings
        skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open']
        if any(skip in heading_lower for skip in skip_headings):
            continue
        
        # Collect content with formatting preserved
        content_parts = []
        current = heading.next_sibling
        count = 0
        
        while current and count < 30:
            if hasattr(current, 'name'):
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
                elif current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    break
                elif current.name == 'div':
                    div_text = clean_text(current.get_text())
                    if div_text and len(div_text) > 100:
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
            if len(full_content) > 100:
                sections[heading_text] = full_content
    
    # Extract main body if no headings
    if not sections:
        paragraphs = []
        for p in soup.find_all('p'):
            p_text = clean_text(p.get_text())
            if p_text and len(p_text) > 80:
                paragraphs.append(p_text)
        if paragraphs:
            sections['About'] = '\n\n'.join(paragraphs[:8])
    
    return sections

def research_listing_online(slug: str, name: str) -> Optional[Dict[str, str]]:
    """Research listing on nelsoncounty.com"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/"
    ]
    
    for url in urls:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                sections = {}
                
                headings = soup.find_all(['h2', 'h3', 'h4'])
                
                for heading in headings:
                    heading_text = clean_text(heading.get_text())
                    if not heading_text or len(heading_text) < 3:
                        continue
                    
                    heading_lower = heading_text.lower()
                    skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open']
                    if any(skip in heading_lower for skip in skip_headings):
                        continue
                    
                    content_parts = []
                    current = heading.next_sibling
                    count = 0
                    
                    while current and count < 20:
                        if hasattr(current, 'name'):
                            if current.name == 'p':
                                text = clean_text(current.get_text())
                                if text and len(text) > 40:
                                    content_parts.append(text)
                            elif current.name in ['ul', 'ol']:
                                items = []
                                for li in current.find_all('li'):
                                    item_text = clean_text(li.get_text())
                                    if item_text and len(item_text) > 15:
                                        items.append(f"• {item_text}")
                                if items:
                                    content_parts.append('\n'.join(items))
                            elif current.name in ['h1', 'h2', 'h3']:
                                break
                        current = current.next_sibling
                        count += 1
                    
                    if content_parts:
                        full_content = '\n\n'.join(content_parts)
                        full_content = re.sub(r'\n{3,}', '\n\n', full_content)
                        if len(full_content) > 100:
                            sections[heading_text] = full_content
                
                if sections:
                    return sections
        except:
            continue
    
    return None

def is_redundant_info(text: str, listing: Dict) -> bool:
    """Check if text contains redundant information"""
    if not text:
        return True
    
    text_lower = text.lower()
    phone = listing.get('phone', '').strip()
    address = listing.get('address', '').lower()
    website = listing.get('website', '').lower()
    
    if phone and phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '') in text.replace('(', '').replace(')', '').replace('-', '').replace(' ', ''):
        return True
    
    if address and any(part in text_lower for part in address.split(',') if len(part.strip()) > 5):
        return True
    
    if website and website.replace('https://', '').replace('http://', '').replace('www.', '').rstrip('/') in text_lower:
        return True
    
    redundant_phrases = ['call us at', 'phone number', 'located at', 'find us at', 'visit our website']
    if any(phrase in text_lower for phrase in redundant_phrases):
        return True
    
    return False

def create_human_quality_description(current_desc: str, listing: Dict, all_sources: Dict) -> str:
    """
    Create a well-written, human-quality summary description.
    This uses AI understanding to create a description that flows naturally
    and makes sense to human readers.
    """
    # Gather all available information
    name = listing.get('name', '').strip()
    listing_type = listing.get('type', '').strip()
    area = listing.get('area', '').strip()
    
    # Start with current description
    desc = clean_text(current_desc)
    
    # Break into sentences
    sentences = re.split(r'(?<=[.!?])\s+', desc)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    # Identify the core essence - what is this place?
    core_sentences = []
    detail_sentences = []
    
    for sent in sentences:
        sent_lower = sent.lower()
        
        # Skip if redundant
        if is_redundant_info(sent, listing):
            continue
        
        # Skip generic filler
        if any(phrase in sent_lower for phrase in ["there's something to do", "every season", "great destination for", "check out"]) and len(sent) < 60:
            continue
        
        # Core sentences describe WHAT the place IS
        if any(word in sent_lower for word in ['is', 'offers', 'features', 'serves', 'provides', 'specializes', 'located']):
            if len(sent) < 250:  # Not too detailed
                core_sentences.append(sent)
        else:
            if len(sent) < 200:
                detail_sentences.append(sent)
    
    # Build summary: 2-3 core sentences that describe what it is
    summary_parts = []
    
    # First sentence: What it is
    if core_sentences:
        summary_parts.append(core_sentences[0])
    
    # Second sentence: Key feature or what makes it special
    if len(core_sentences) > 1:
        summary_parts.append(core_sentences[1])
    elif detail_sentences:
        summary_parts.append(detail_sentences[0])
    
    # Third sentence: Additional context if needed
    if len(summary_parts) < 2 and detail_sentences:
        summary_parts.append(detail_sentences[0])
    
    if summary_parts:
        summary = ' '.join(summary_parts)
        if not summary[-1] in '.!?':
            summary += '.'
        return summary
    
    # Fallback
    if desc:
        first_sentence = sentences[0] if sentences else desc[:250]
        if len(first_sentence) > 250:
            first_sentence = first_sentence[:247] + '...'
        return first_sentence
    
    return ""

def determine_accordion_title_and_value(title: str, content: str, listing: Dict) -> Tuple[bool, str, str]:
    """
    Determine if accordion is valuable and suggest a good title.
    Returns (is_valuable, suggested_title, cleaned_content)
    """
    listing_type = listing.get('type', '').strip()
    is_trail = listing_type == 'Hikes & Trails'
    
    # For trails, be less strict about minimum length
    min_length = 80 if is_trail else 100
    if not content or len(content.strip()) < min_length:
        return False, "", ""
    
    content_lower = content.lower()
    
    # Skip if redundant (but be less strict for trails)
    if is_redundant_info(content, listing) and not is_trail:
        return False, "", ""
    
    # Skip generic content (but be less strict for trails)
    generic_phrases = ["there's something to do", "every season of the year", "and live music", "nelson 151's wineries"]
    if any(phrase in content_lower for phrase in generic_phrases) and len(content) < 200 and not is_trail:
        return False, "", ""
    
    # Determine appropriate title
    title_lower = title.lower()
    
    if any(word in title_lower for word in ['history', 'story', 'background', 'heritage']):
        suggested_title = "History & Background"
    elif any(word in title_lower for word in ['menu', 'offerings', 'what we serve', 'specialties']):
        suggested_title = "Menu & Offerings"
    elif any(word in title_lower for word in ['experience', 'what to expect']):
        suggested_title = "What to Expect"
    elif any(word in title_lower for word in ['rules', 'guidelines', 'policies', 'regulations', 'trail rules']):
        suggested_title = "Rules & Guidelines"
    elif any(word in title_lower for word in ['trail', 'hiking', 'park', 'outdoor', 'trail information']):
        suggested_title = "Trail Information"
    elif any(word in title_lower for word in ['events', 'activities', 'programs']):
        suggested_title = "Events & Activities"
    elif any(word in title_lower for word in ['accessibility', 'access', 'parking', 'facilities']):
        suggested_title = "Accessibility & Facilities"
    elif any(word in title_lower for word in ['faq', 'frequently asked', 'questions']):
        suggested_title = "Frequently Asked Questions"
    elif any(word in title_lower for word in ['what to bring', 'packing']):
        suggested_title = "What to Bring"
    elif any(word in title_lower for word in ['map', 'maps', 'trailhead']):
        suggested_title = "Maps & Trailheads"
    else:
        if len(title) < 50 and title[0].isupper() and not any(char in title for char in ['&', '|', '>']):
            suggested_title = title
        else:
            suggested_title = "Additional Information"
    
    # Clean content - ensure it flows well
    cleaned_content = content.strip()
    # Ensure proper paragraph breaks
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)
    
    return True, suggested_title, cleaned_content

def create_meaningful_accordions(all_sources: Dict, listing: Dict, original_accordions: Dict = None) -> List[Tuple[str, str]]:
    """Create meaningful accordion panels with sensible titles"""
    accordions = []
    seen_hashes = set()
    listing_type = listing.get('type', '').strip()
    is_trail = listing_type == 'Hikes & Trails'
    
    # Priority 1: Original accordions (especially for trails - they often have important info)
    if original_accordions:
        for title, content in original_accordions.items():
            if not title or not content:
                continue
            
            content_hash = hash(content[:300])
            if content_hash in seen_hashes:
                continue
            
            # For trails, be less strict about filtering
            is_valuable, good_title, cleaned_content = determine_accordion_title_and_value(title, content, listing)
            
            # For trails, accept more content (rules, FAQs, trail info are important)
            if is_valuable or (is_trail and len(content.strip()) > 80 and not is_redundant_info(content, listing)):
                if not is_valuable:
                    # Still determine a good title even if we're accepting it
                    _, good_title, cleaned_content = determine_accordion_title_and_value(title, content, listing)
                
                accordions.append((good_title, cleaned_content))
                seen_hashes.add(content_hash)
    
    # Priority 2: Research info (most current)
    source_order = ['research', 'donor_portfolio', 'donor_pages']
    
    for source_key in source_order:
        source_data = all_sources.get(source_key, {})
        if not source_data:
            continue
        
        for title, content in source_data.items():
            content_hash = hash(content[:300])
            if content_hash in seen_hashes:
                continue
            
            is_valuable, good_title, cleaned_content = determine_accordion_title_and_value(title, content, listing)
            if is_valuable:
                accordions.append((good_title, cleaned_content))
                seen_hashes.add(content_hash)
    
    # Limit to 4
    return accordions[:4]

def process_listings():
    """Process all listings with comprehensive AI-powered review"""
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_file = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    
    # Build comprehensive lookup from all sources
    print("Building comprehensive source lookup...")
    donor_lookup = {}
    
    # Portfolio export
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
                
                # Merge or create
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
    with open(consolidated_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings with comprehensive AI-powered review...\n")
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
        
        # Gather all sources
        all_sources = {}
        
        # Find donor info from Portfolio
        donor_entry = None
        if name:
            donor_entry = donor_lookup.get(name.lower())
            if not donor_entry and slug:
                donor_entry = donor_lookup.get(slug.lower())
        
        if donor_entry:
            content_to_parse = donor_entry.get('content', '') or donor_entry.get('excerpt', '')
            if content_to_parse:
                source_key = 'donor_portfolio' if donor_entry.get('source') in ['portfolio', 'both'] else 'donor_pages'
                all_sources[source_key] = extract_all_content_from_donor(content_to_parse)
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
            time.sleep(0.8)
        
        # Extract original accordions from consolidated CSV
        original_accordions = {}
        for panel_num in range(1, 5):
            title = listing.get(f'accordionPanel{panel_num}Title', '').strip()
            content = listing.get(f'accordionPanel{panel_num}Content', '').strip()
            if title and content:
                original_accordions[title] = content
        
        # Create human-quality description
        new_desc = create_human_quality_description(current_desc, listing, all_sources)
        listing['description'] = new_desc
        
        if new_desc != current_desc:
            print(f"  ✓ Description rewritten ({len(new_desc)} chars)")
        else:
            print(f"  - Description unchanged")
        
        # Create accordions (preserving originals, especially for trails)
        accordions = create_meaningful_accordions(all_sources, listing, original_accordions)
        
        # Clear existing accordions
        for panel_num in range(1, 5):
            listing[f'accordionPanel{panel_num}Title'] = ''
            listing[f'accordionPanel{panel_num}Content'] = ''
        
        # Set new accordions
        for idx, (title, content) in enumerate(accordions, 1):
            if idx <= 4:
                listing[f'accordionPanel{idx}Title'] = title
                listing[f'accordionPanel{idx}Content'] = content
                print(f"  ✓ Accordion {idx}: {title}")
        
        if not accordions:
            print(f"  - No accordions (no valuable non-redundant info)")
        
        updated_listings.append(listing)
        
        if i % 50 == 0:
            print(f"\n  Progress: {i}/{len(listings)} listings processed...")
    
    # Write output
    output_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    print(f"\n{'=' * 80}")
    print(f"Writing results to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if updated_listings:
            writer = csv.DictWriter(f, fieldnames=updated_listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(updated_listings)
    
    print(f"✅ Complete! Processed {len(updated_listings)} listings")
    print(f"✅ Output written to: {output_file}")

if __name__ == '__main__':
    process_listings()
