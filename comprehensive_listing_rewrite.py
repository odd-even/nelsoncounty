#!/usr/bin/env python3
"""
Comprehensive line-by-line review and rewrite of listings.
- Reviews each listing individually
- Rewrites descriptions as well-written summaries
- Extracts valuable information from donor CSV
- Researches listings on nelsoncounty.com
- Creates meaningful accordions with sensible titles
- Only includes really important, non-redundant information
- Ensures everything flows and makes sense
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

def clean_text(text: str, preserve_breaks: bool = False) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    
    # Remove HTML tags but preserve structure
    if preserve_breaks:
        # Replace <br> and <br/> with newlines
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        # Replace </p> with double newline
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        # Replace <p> with nothing (we already have the content)
        text = re.sub(r'<p[^>]*>', '', text, flags=re.IGNORECASE)
    
    # Remove remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up HTML entities
    text = text.replace('&amp;', '&')
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    
    if not preserve_breaks:
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
    else:
        # Preserve line breaks but clean up excessive ones
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)  # Clean up spaces but keep newlines
    
    return text.strip()

def is_redundant_info(text: str, listing: Dict) -> bool:
    """Check if text contains information already in listing fields"""
    if not text:
        return True
    
    text_lower = text.lower()
    
    # Check for phone numbers
    phone = listing.get('phone', '').strip()
    if phone:
        phone_clean = re.sub(r'[^\d]', '', phone)
        text_clean = re.sub(r'[^\d]', '', text)
        if phone_clean and phone_clean in text_clean:
            return True
    
    # Check for addresses
    address = listing.get('address', '').lower()
    if address:
        address_parts = [p.strip() for p in address.split(',') if len(p.strip()) > 5]
        if any(part in text_lower for part in address_parts):
            return True
    
    # Check for website URLs
    website = listing.get('website', '').lower()
    if website:
        website_clean = website.replace('https://', '').replace('http://', '').replace('www.', '').rstrip('/')
        if website_clean and website_clean in text_lower:
            return True
    
    # Generic redundant phrases
    redundant_phrases = [
        'call us at', 'phone number', 'located at', 'find us at',
        'visit our website', 'check out our website', 'directions to',
        'our address is', 'we are located', 'contact us at'
    ]
    if any(phrase in text_lower for phrase in redundant_phrases):
        return True
    
    return False

def extract_meaningful_content_from_donor(donor_content: str) -> Dict[str, str]:
    """Extract meaningful, well-structured content from donor CSV"""
    if not donor_content:
        return {}
    
    sections = {}
    soup = BeautifulSoup(donor_content, 'html.parser')
    
    # Find all headings and extract their content
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
        
        heading_lower = heading_text.lower()
        
        # Skip generic/redundant headings
        skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open', 'menu']
        if any(skip in heading_lower for skip in skip_headings):
            continue
        
        # Collect well-formatted content after heading
        content_parts = []
        current = heading.next_sibling
        count = 0
        max_elements = 25
        
        while current and count < max_elements:
            if hasattr(current, 'name'):
                if current.name == 'p':
                    text = clean_text(current.get_text(), preserve_breaks=False)
                    if text and len(text) > 30:
                        content_parts.append(text)
                elif current.name in ['ul', 'ol']:
                    # Extract list items with formatting
                    items = []
                    for li in current.find_all('li'):
                        item_text = clean_text(li.get_text())
                        if item_text and len(item_text) > 10:
                            items.append(f"• {item_text}")
                    if items:
                        content_parts.append('\n'.join(items))
                elif current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    # Stop at next heading
                    break
                elif current.name == 'div':
                    # Check if div has substantial, meaningful text
                    div_text = clean_text(current.get_text())
                    if div_text and len(div_text) > 100:
                        # Check if it's not just a repeat
                        if not any(div_text[:50] in existing for existing in content_parts):
                            content_parts.append(div_text)
            elif isinstance(current, str):
                text = clean_text(current)
                if text and len(text) > 30:
                    content_parts.append(text)
            
            current = current.next_sibling
            count += 1
        
        if content_parts:
            full_content = '\n\n'.join(content_parts)
            # Clean up but preserve paragraph structure
            full_content = re.sub(r'\n{3,}', '\n\n', full_content)
            if len(full_content) > 100:  # Only keep substantial content
                sections[heading_text] = full_content
    
    # If no headings found, extract main body paragraphs
    if not sections:
        paragraphs = []
        for p in soup.find_all('p'):
            p_text = clean_text(p.get_text())
            if p_text and len(p_text) > 80:
                paragraphs.append(p_text)
        
        if paragraphs:
            sections['About'] = '\n\n'.join(paragraphs[:6])
    
    return sections

def research_listing_online(slug: str, name: str) -> Optional[Dict[str, str]]:
    """Research listing on nelsoncounty.com and extract meaningful content"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/"
    ]
    
    for url in urls:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                sections = {}
                
                # Find meaningful headings
                headings = soup.find_all(['h2', 'h3', 'h4'])
                
                for heading in headings:
                    heading_text = clean_text(heading.get_text())
                    if not heading_text or len(heading_text) < 3:
                        continue
                    
                    heading_lower = heading_text.lower()
                    
                    # Skip redundant headings
                    skip_headings = ['contact', 'address', 'phone', 'location', 'directions', 'hours', 'open']
                    if any(skip in heading_lower for skip in skip_headings):
                        continue
                    
                    # Get well-formatted content after heading
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
                    
        except Exception as e:
            continue
    
    return None

def create_well_written_summary(current_desc: str, listing: Dict, donor_info: Dict, research_info: Optional[Dict]) -> str:
    """Create a well-written, concise summary description that flows naturally"""
    
    # Start with current description
    desc = clean_text(current_desc)
    
    # Break into sentences
    sentences = re.split(r'(?<=[.!?])\s+', desc)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    # Filter and prioritize sentences
    good_sentences = []
    seen_concepts = set()
    
    for sent in sentences:
        sent_lower = sent.lower()
        
        # Skip if too long (likely detailed info for accordions)
        if len(sent) > 250:
            continue
        
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
        
        # Skip if we've seen this concept (avoid repetition)
        sent_key = sent_lower[:50]  # Use first 50 chars as concept key
        if sent_key in seen_concepts:
            continue
        
        # Prefer sentences that describe what the place IS, not generic info
        if any(word in sent_lower for word in ['is', 'offers', 'features', 'serves', 'provides', 'specializes']):
            good_sentences.append(sent)
            seen_concepts.add(sent_key)
        elif len(good_sentences) < 2:  # Allow a couple non-"is" sentences
            good_sentences.append(sent)
            seen_concepts.add(sent_key)
    
    # Take best 2-3 sentences for summary
    summary_sentences = good_sentences[:3]
    
    if summary_sentences:
        summary = ' '.join(summary_sentences)
        # Ensure proper punctuation
        if not summary[-1] in '.!?':
            summary += '.'
        return summary
    
    # Fallback: create a basic summary from what we have
    if desc:
        # Take first sentence or first 250 chars
        first_sentence = sentences[0] if sentences else desc[:250]
        if len(first_sentence) > 250:
            first_sentence = first_sentence[:247] + '...'
        return first_sentence
    
    return ""

def determine_accordion_value(title: str, content: str, listing: Dict) -> Tuple[bool, str]:
    """Determine if accordion content is valuable and suggest a good title"""
    if not content or len(content.strip()) < 100:
        return False, ""
    
    title_lower = title.lower()
    content_lower = content.lower()
    
    # Skip if redundant
    if is_redundant_info(content, listing):
        return False, ""
    
    # Skip generic content
    generic_content = [
        "there's something to do", "every season of the year",
        "and live music", "nelson 151's wineries", "check out"
    ]
    if any(phrase in content_lower for phrase in generic_content) and len(content) < 200:
        return False, ""
    
    # Determine appropriate title
    suggested_title = title
    
    # Map content patterns to good titles
    if any(word in title_lower for word in ['history', 'story', 'background', 'about', 'heritage']):
        suggested_title = "History & Background"
    elif any(word in title_lower for word in ['menu', 'offerings', 'what we serve', 'specialties', 'products']):
        suggested_title = "Menu & Offerings"
    elif any(word in title_lower for word in ['experience', 'what to expect', 'visit', 'explore']):
        suggested_title = "What to Expect"
    elif any(word in title_lower for word in ['rules', 'guidelines', 'policies', 'regulations', 'trail rules']):
        suggested_title = "Rules & Guidelines"
    elif any(word in title_lower for word in ['trail', 'hiking', 'park', 'outdoor', 'trail information']):
        suggested_title = "Trail Information"
    elif any(word in title_lower for word in ['events', 'activities', 'programs', 'schedule', 'calendar']):
        suggested_title = "Events & Activities"
    elif any(word in title_lower for word in ['accessibility', 'access', 'parking', 'facilities', 'amenities']):
        suggested_title = "Accessibility & Facilities"
    elif any(word in title_lower for word in ['faq', 'frequently asked', 'questions', 'common questions']):
        suggested_title = "Frequently Asked Questions"
    elif any(word in title_lower for word in ['what to bring', 'packing', 'preparation']):
        suggested_title = "What to Bring"
    elif any(word in title_lower for word in ['map', 'maps', 'trailhead', 'trail map']):
        suggested_title = "Maps & Trailheads"
    else:
        # Use original title if reasonable, otherwise generic
        if len(title) < 50 and title[0].isupper() and not any(char in title for char in ['&', '|', '>']):
            suggested_title = title
        else:
            suggested_title = "Additional Information"
    
    return True, suggested_title

def create_valuable_accordions(donor_info: Dict, research_info: Optional[Dict], listing: Dict) -> List[Tuple[str, str]]:
    """Create valuable accordion panels with sensible titles"""
    accordions = []
    seen_content_hashes = set()
    
    # Priority 1: Research info (most current and accurate)
    if research_info:
        for title, content in research_info.items():
            # Create hash of content to avoid duplicates
            content_hash = hash(content[:300])
            if content_hash in seen_content_hashes:
                continue
            
            is_valuable, good_title = determine_accordion_value(title, content, listing)
            if is_valuable:
                accordions.append((good_title, content))
                seen_content_hashes.add(content_hash)
    
    # Priority 2: Donor info
    if donor_info:
        for title, content in donor_info.items():
            content_hash = hash(content[:300])
            if content_hash in seen_content_hashes:
                continue
            
            is_valuable, good_title = determine_accordion_value(title, content, listing)
            if is_valuable:
                accordions.append((good_title, content))
                seen_content_hashes.add(content_hash)
    
    # Limit to 4 accordions max
    return accordions[:4]

def process_listings():
    """Process all listings with comprehensive review"""
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_file = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    
    # Build comprehensive donor lookup from Portfolio export
    print("Reading Portfolio donor CSV and building lookup...")
    donor_lookup = {}
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            excerpt = row.get('Excerpt', '').strip()
            
            if title and (content or excerpt):
                slug = ''
                if permalink:
                    slug = permalink.rstrip('/').split('/')[-1]
                
                # Store by title
                donor_lookup[title.lower()] = {
                    'content': content,
                    'excerpt': excerpt,
                    'slug': slug,
                    'title': title
                }
                
                # Also store by slug if available
                if slug:
                    donor_lookup[slug.lower()] = {
                        'content': content,
                        'excerpt': excerpt,
                        'slug': slug,
                        'title': title
                    }
    
    # Also load Pages export CSV
    print("Reading Pages export CSV and adding to lookup...")
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
                slug = slug_field
                if not slug and permalink:
                    slug = permalink.rstrip('/').split('/')[-1]
                
                # Merge with existing or create new entry
                key = title.lower()
                if key in donor_lookup:
                    # Merge content if this one has more/better content
                    existing_content = donor_lookup[key].get('content', '')
                    if len(content) > len(existing_content):
                        donor_lookup[key]['content'] = content
                    if excerpt and not donor_lookup[key].get('excerpt'):
                        donor_lookup[key]['excerpt'] = excerpt
                else:
                    # Create new entry
                    donor_lookup[key] = {
                        'content': content,
                        'excerpt': excerpt,
                        'slug': slug,
                        'title': title
                    }
                
                # Also store by slug if available
                if slug:
                    slug_key = slug.lower()
                    if slug_key in donor_lookup:
                        # Merge content
                        existing_content = donor_lookup[slug_key].get('content', '')
                        if len(content) > len(existing_content):
                            donor_lookup[slug_key]['content'] = content
                        if excerpt and not donor_lookup[slug_key].get('excerpt'):
                            donor_lookup[slug_key]['excerpt'] = excerpt
                    else:
                        donor_lookup[slug_key] = {
                            'content': content,
                            'excerpt': excerpt,
                            'slug': slug,
                            'title': title
                        }
                    pages_count += 1
    
    unique_donors = len(set(d['title'] for d in donor_lookup.values()))
    print(f"Loaded {unique_donors} unique entries ({pages_count} from Pages export)\n")
    
    # Read consolidated CSV
    print("Reading consolidated CSV...")
    with open(consolidated_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings with comprehensive review...\n")
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
        
        # Find donor info
        donor_info = {}
        donor_entry = None
        
        if name:
            donor_entry = donor_lookup.get(name.lower())
            if not donor_entry and slug:
                donor_entry = donor_lookup.get(slug.lower())
        
        if donor_entry:
            # Extract meaningful content
            content_to_parse = donor_entry.get('content', '') or donor_entry.get('excerpt', '')
            if content_to_parse:
                donor_info = extract_meaningful_content_from_donor(content_to_parse)
                if donor_info:
                    print(f"  ✓ Found {len(donor_info)} meaningful sections from donor CSV")
        
        # Research online
        research_info = None
        if slug:
            print(f"  Researching on nelsoncounty.com...")
            research_info = research_listing_online(slug, name)
            if research_info:
                print(f"  ✓ Found {len(research_info)} sections from website")
            else:
                print(f"  - No additional content found online")
            time.sleep(0.8)  # Be nice to server
        
        # Rewrite description
        new_desc = create_well_written_summary(current_desc, listing, donor_info, research_info)
        listing['description'] = new_desc
        
        if new_desc != current_desc:
            print(f"  ✓ Description rewritten")
            print(f"    Old: {len(current_desc)} chars")
            print(f"    New: {len(new_desc)} chars")
        else:
            print(f"  - Description unchanged (already good)")
        
        # Create accordions
        accordions = create_valuable_accordions(donor_info, research_info, listing)
        
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
            print(f"  - No accordions added (no valuable non-redundant information)")
        
        updated_listings.append(listing)
        
        # Progress indicator
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
