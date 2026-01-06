#!/usr/bin/env python3
"""
Comprehensive script to rewrite descriptions and accordions for listings.
- Creates well-written, concise summary descriptions
- Extracts valuable information from donor CSV
- Researches listings on nelsoncounty.com when needed
- Creates meaningful accordion panels with sensible titles
- Only includes really important, non-redundant information
- Skips accordions if no valuable content
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple, Set
from urllib.parse import urlparse

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove common HTML entities
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&quot;', '"')
    return text.strip()

def is_redundant_info(text: str, listing: Dict) -> bool:
    """Check if text contains information already in listing fields"""
    text_lower = text.lower()
    
    # Check for phone numbers
    phone = listing.get('phone', '').strip()
    if phone and phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '') in text.replace('(', '').replace(')', '').replace('-', '').replace(' ', ''):
        return True
    
    # Check for addresses
    address = listing.get('address', '').lower()
    if address and any(part in text_lower for part in address.split(',') if len(part.strip()) > 5):
        return True
    
    # Check for website
    website = listing.get('website', '').lower()
    if website and website in text_lower:
        return True
    
    # Generic redundant phrases
    redundant_phrases = [
        'call us at', 'phone number', 'located at', 'find us at',
        'visit our website', 'check out our website', 'directions to'
    ]
    if any(phrase in text_lower for phrase in redundant_phrases):
        return True
    
    return False

def extract_meaningful_sections(donor_content: str) -> Dict[str, str]:
    """Extract meaningful sections from donor CSV Content field"""
    if not donor_content:
        return {}
    
    sections = {}
    soup = BeautifulSoup(donor_content, 'html.parser')
    
    # Find all headings and their content
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
        
        # Collect content after heading
        content_parts = []
        current = heading.next_sibling
        count = 0
        max_elements = 20
        
        while current and count < max_elements:
            if hasattr(current, 'name'):
                if current.name == 'p':
                    text = clean_text(current.get_text())
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
                elif current.name == 'br':
                    # Preserve line breaks
                    content_parts.append('\n')
                elif current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    # Stop at next heading
                    break
                elif current.name == 'div':
                    # Check if div has substantial text
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
            # Join with double line breaks for paragraphs, preserve single line breaks
            full_content = '\n\n'.join(content_parts)
            # Clean up excessive line breaks but preserve intentional ones
            full_content = re.sub(r'\n{3,}', '\n\n', full_content)
            if len(full_content) > 100:  # Only keep substantial content
                sections[heading_text] = full_content
    
    # Also extract main body text if no headings found
    if not sections:
        # Preserve paragraph structure
        paragraphs = []
        for p in soup.find_all('p'):
            p_text = clean_text(p.get_text())
            if p_text and len(p_text) > 50:
                paragraphs.append(p_text)
        
        if paragraphs:
            sections['About'] = '\n\n'.join(paragraphs[:5])  # Limit to first 5 paragraphs
        else:
            # Fallback to plain text extraction
            body_text = clean_text(soup.get_text())
            if body_text and len(body_text) > 200:
                # Split by double line breaks or periods followed by space
                paragraphs = [p.strip() for p in re.split(r'\n\n+|\.\s+(?=[A-Z])', body_text) if p.strip() and len(p.strip()) > 50]
                if paragraphs:
                    sections['About'] = '\n\n'.join(paragraphs[:5])
    
    return sections

def research_listing_online(slug: str, name: str) -> Optional[Dict[str, str]]:
    """Research listing on nelsoncounty.com"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/"
    ]
    
    for url in urls:
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            
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
                    
                    # Get content after heading
                    content_parts = []
                    current = heading.next_sibling
                    count = 0
                    
                    while current and count < 15:
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
                            elif current.name == 'br':
                                # Preserve line breaks
                                content_parts.append('\n')
                            elif current.name in ['h1', 'h2', 'h3']:
                                break
                        current = current.next_sibling
                        count += 1
                    
                    if content_parts:
                        # Join with double line breaks for paragraphs, preserve single line breaks
                        full_content = '\n\n'.join(content_parts)
                        # Clean up excessive line breaks but preserve intentional ones
                        full_content = re.sub(r'\n{3,}', '\n\n', full_content)
                        if len(full_content) > 100:
                            sections[heading_text] = full_content
                
                if sections:
                    return sections
                    
        except Exception as e:
            continue
    
    return None

def create_summary_description(current_desc: str, listing: Dict, donor_info: Dict, research_info: Optional[Dict]) -> str:
    """Create a well-written, concise summary description"""
    
    # Start with current description
    desc = clean_text(current_desc)
    
    # Remove sentences that are too detailed or redundant
    sentences = re.split(r'[.!?]+', desc)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 15]
    
    # Filter out sentences that:
    # - Are too long (likely detailed info for accordions)
    # - Contain redundant info (phone, address, etc.)
    # - Are generic filler
    good_sentences = []
    for sent in sentences:
        sent_lower = sent.lower()
        
        # Skip if too long (likely detailed)
        if len(sent) > 200:
            continue
        
        # Skip if contains redundant info
        if is_redundant_info(sent, listing):
            continue
        
        # Skip generic filler
        generic_phrases = [
            "there's something to do", "every season of the year",
            "great destination", "check out", "visit"
        ]
        if any(phrase in sent_lower for phrase in generic_phrases) and len(sent) < 50:
            continue
        
        good_sentences.append(sent)
    
    # Take first 2-3 good sentences for summary
    summary_sentences = good_sentences[:3]
    
    if summary_sentences:
        summary = '. '.join(summary_sentences)
        # Ensure it ends with punctuation
        if not summary[-1] in '.!?':
            summary += '.'
        return summary
    
    # Fallback: truncate current description
    if len(desc) > 300:
        return desc[:297] + '...'
    
    return desc if desc else ""

def determine_accordion_value(title: str, content: str, listing: Dict) -> Tuple[bool, str]:
    """
    Determine if accordion content is valuable and suggest a good title.
    Returns (is_valuable, suggested_title)
    """
    title_lower = title.lower()
    content_lower = content.lower()
    
    # Skip if redundant
    if is_redundant_info(content, listing):
        return False, ""
    
    # Skip if too short
    if len(content) < 100:
        return False, ""
    
    # Skip generic content
    generic_content = [
        "there's something to do", "every season of the year",
        "and live music", "nelson 151's wineries"
    ]
    if any(phrase in content_lower for phrase in generic_content) and len(content) < 200:
        return False, ""
    
    # Determine good title based on content
    suggested_title = title
    
    # Map common patterns to better titles
    if any(word in title_lower for word in ['history', 'story', 'about', 'background']):
        suggested_title = "History & Background"
    elif any(word in title_lower for word in ['menu', 'offerings', 'what we serve', 'specialties']):
        suggested_title = "Menu & Offerings"
    elif any(word in title_lower for word in ['experience', 'what to expect', 'visit']):
        suggested_title = "What to Expect"
    elif any(word in title_lower for word in ['rules', 'guidelines', 'policies', 'regulations']):
        suggested_title = "Rules & Guidelines"
    elif any(word in title_lower for word in ['trail', 'hiking', 'park', 'outdoor']):
        suggested_title = "Trail Information"
    elif any(word in title_lower for word in ['events', 'activities', 'programs', 'schedule']):
        suggested_title = "Events & Activities"
    elif any(word in title_lower for word in ['accessibility', 'access', 'parking', 'facilities']):
        suggested_title = "Accessibility & Facilities"
    elif any(word in title_lower for word in ['faq', 'frequently asked', 'questions']):
        suggested_title = "Frequently Asked Questions"
    else:
        # Use original title if it's reasonable
        if len(title) < 50 and title[0].isupper():
            suggested_title = title
        else:
            suggested_title = "Additional Information"
    
    return True, suggested_title

def create_accordions(donor_info: Dict, research_info: Optional[Dict], listing: Dict) -> List[Tuple[str, str]]:
    """Create valuable accordion panels"""
    accordions = []
    seen_content = set()  # Avoid duplicates
    
    # Priority 1: Research info (most current)
    if research_info:
        for title, content in research_info.items():
            content_hash = hash(content[:200])  # Use first 200 chars as fingerprint
            if content_hash in seen_content:
                continue
            
            is_valuable, good_title = determine_accordion_value(title, content, listing)
            if is_valuable:
                accordions.append((good_title, content))
                seen_content.add(content_hash)
    
    # Priority 2: Donor info
    if donor_info:
        for title, content in donor_info.items():
            content_hash = hash(content[:200])
            if content_hash in seen_content:
                continue
            
            is_valuable, good_title = determine_accordion_value(title, content, listing)
            if is_valuable:
                accordions.append((good_title, content))
                seen_content.add(content_hash)
    
    # Limit to 4 accordions
    return accordions[:4]

def process_listings():
    """Process all listings"""
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    
    # Build donor lookup
    print("Reading donor CSV...")
    donor_lookup = {}
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            
            if title and content:
                slug = ''
                if permalink:
                    slug = permalink.rstrip('/').split('/')[-1]
                
                donor_lookup[title.lower()] = {
                    'content': content,
                    'slug': slug,
                    'title': title
                }
                if slug:
                    donor_lookup[slug.lower()] = {
                        'content': content,
                        'slug': slug,
                        'title': title
                    }
    
    print(f"Loaded {len(set(d['title'] for d in donor_lookup.values()))} unique donor entries")
    
    # Read consolidated CSV
    print("Reading consolidated CSV...")
    with open(consolidated_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings...\n")
    
    # Process each listing
    updated_listings = []
    for i, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        slug = listing.get('slug', '').strip()
        current_desc = listing.get('description', '').strip()
        
        print(f"[{i}/{len(listings)}] {name}")
        
        # Find donor info
        donor_info = {}
        if name:
            donor_entry = donor_lookup.get(name.lower())
            if not donor_entry and slug:
                donor_entry = donor_lookup.get(slug.lower())
            
            if donor_entry and donor_entry.get('content'):
                donor_info = extract_meaningful_sections(donor_entry['content'])
                if donor_info:
                    print(f"  ✓ Found {len(donor_info)} sections from donor CSV")
        
        # Research online for all listings (but with delay)
        research_info = None
        if slug:
            research_info = research_listing_online(slug, name)
            if research_info:
                print(f"  ✓ Found {len(research_info)} sections from website")
            time.sleep(0.8)  # Be nice to server
        
        # Rewrite description
        new_desc = create_summary_description(current_desc, listing, donor_info, research_info)
        listing['description'] = new_desc
        if new_desc != current_desc:
            print(f"  ✓ Description rewritten ({len(new_desc)} chars)")
        
        # Create accordions
        accordions = create_accordions(donor_info, research_info, listing)
        
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
    
    # Write output
    output_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    print(f"\nWriting to {output_file}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if updated_listings:
            writer = csv.DictWriter(f, fieldnames=updated_listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(updated_listings)
    
    print(f"✅ Complete! Processed {len(updated_listings)} listings")

if __name__ == '__main__':
    process_listings()
