#!/usr/bin/env python3
"""
Rewrite descriptions and accordions for listings CSV.
- Rewrite descriptions as concise, well-written summaries
- Review donor CSV for additional information
- Research listings on nelsoncounty.com when needed
- Create meaningful accordion panels with sensible titles
- Skip accordions if no really important information
- Avoid redundant info (phone, address already in fields)
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
import json

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_content_from_donor(donor_content: str) -> Dict[str, str]:
    """Extract useful information from donor CSV Content field"""
    if not donor_content:
        return {}
    
    info = {}
    soup = BeautifulSoup(donor_content, 'html.parser')
    
    # Extract text content
    text = clean_text(soup.get_text())
    if text and len(text) > 50:
        info['content'] = text
    
    # Look for specific sections
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        heading_lower = heading_text.lower()
        
        # Find content after heading
        content_parts = []
        current = heading.next_sibling
        count = 0
        while current and count < 10:
            if hasattr(current, 'name'):
                if current.name == 'p':
                    text = clean_text(current.get_text())
                    if text and len(text) > 20:
                        content_parts.append(text)
                elif current.name in ['ul', 'ol']:
                    content_parts.append(clean_text(current.get_text()))
                elif current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    break
            current = current.next_sibling
            count += 1
        
        if content_parts:
            info[heading_lower] = ' '.join(content_parts)
    
    return info

def research_listing(slug: str, name: str) -> Optional[Dict[str, str]]:
    """Research listing on nelsoncounty.com"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/"
    ]
    
    for url in urls:
        try:
            print(f"  Researching: {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract useful sections
                sections = {}
                headings = soup.find_all(['h2', 'h3', 'h4'])
                
                for heading in headings:
                    heading_text = clean_text(heading.get_text())
                    heading_lower = heading_text.lower()
                    
                    # Skip generic headings
                    if any(skip in heading_lower for skip in ['contact', 'address', 'phone', 'hours', 'location']):
                        continue
                    
                    # Get content after heading
                    content_parts = []
                    current = heading.next_sibling
                    count = 0
                    while current and count < 15:
                        if hasattr(current, 'name'):
                            if current.name == 'p':
                                text = clean_text(current.get_text())
                                if text and len(text) > 30:
                                    content_parts.append(text)
                            elif current.name in ['ul', 'ol']:
                                list_text = clean_text(current.get_text())
                                if list_text:
                                    content_parts.append(list_text)
                            elif current.name in ['h1', 'h2', 'h3']:
                                break
                        current = current.next_sibling
                        count += 1
                    
                    if content_parts and len(' '.join(content_parts)) > 100:
                        sections[heading_text] = ' '.join(content_parts)
                
                if sections:
                    return sections
                    
        except Exception as e:
            print(f"  Error researching {url}: {e}")
            continue
    
    return None

def rewrite_description(current_desc: str, donor_info: Dict, research_info: Optional[Dict]) -> str:
    """Rewrite description as a concise, well-written summary"""
    # Start with current description
    desc = clean_text(current_desc)
    
    # Remove redundant information that should be in accordions
    # Keep only the core summary
    
    # If description is too long or contains details, condense it
    sentences = re.split(r'[.!?]+', desc)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
    
    # Keep first 2-3 sentences that are summary-like
    summary_sentences = []
    for sent in sentences[:3]:
        # Skip sentences that are too detailed or contain specific info better suited for accordions
        if len(sent) < 200 and not any(word in sent.lower() for word in ['phone', 'address', 'located at', 'call us']):
            summary_sentences.append(sent)
    
    if summary_sentences:
        return '. '.join(summary_sentences) + '.'
    
    return desc[:300] + '...' if len(desc) > 300 else desc

def create_accordions(donor_info: Dict, research_info: Optional[Dict], listing: Dict) -> List[Tuple[str, str]]:
    """
    Create accordion panels with sensible titles.
    Returns list of (title, content) tuples.
    Only include really important, non-redundant information.
    """
    accordions = []
    
    # Don't include redundant info (phone, address, etc. are in fields)
    redundant_keywords = ['phone', 'address', 'location', 'contact information', 'directions', 'call us', 'find us']
    
    # Check research info first (most current)
    if research_info:
        for title, content in research_info.items():
            title_lower = title.lower()
            content_lower = content.lower()
            
            # Skip if redundant
            if any(keyword in title_lower or keyword in content_lower for keyword in redundant_keywords):
                continue
            
            # Skip if too short or generic
            if len(content) < 100:
                continue
            
            # Only add if it's really important
            if any(keyword in title_lower for keyword in ['history', 'story', 'about', 'experience', 'what to', 'rules', 'guidelines', 'trail', 'parking', 'accessibility']):
                accordions.append((title, content))
    
    # Check donor info
    if donor_info:
        for key, value in donor_info.items():
            if key == 'content':
                continue
            
            key_lower = key.lower()
            value_lower = value.lower()
            
            # Skip if redundant
            if any(keyword in key_lower or keyword in value_lower for keyword in redundant_keywords):
                continue
            
            # Skip if too short
            if len(value) < 100:
                continue
            
            # Only add if important
            if any(keyword in key_lower for keyword in ['history', 'story', 'about', 'experience', 'what to', 'rules', 'guidelines']):
                accordions.append((key.title(), value))
    
    # Limit to 4 accordions max
    return accordions[:4]

def process_listings():
    """Process all listings"""
    # Read consolidated CSV
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    
    # Read donor CSV and create lookup by title/slug
    donor_lookup = {}
    print("Reading donor CSV...")
    with open(donor_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title', '').strip()
            permalink = row.get('Permalink', '').strip()
            content = row.get('Content', '').strip()
            
            if title:
                # Extract slug from permalink
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
    
    print(f"Loaded {len(donor_lookup)} donor entries")
    
    # Read consolidated CSV
    listings = []
    with open(consolidated_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"Processing {len(listings)} listings...")
    
    # Process each listing
    updated_listings = []
    for i, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        slug = listing.get('slug', '').strip()
        current_desc = listing.get('description', '').strip()
        
        print(f"\n[{i}/{len(listings)}] {name}")
        
        # Find donor info
        donor_info = {}
        if name:
            donor_entry = donor_lookup.get(name.lower())
            if not donor_entry and slug:
                donor_entry = donor_lookup.get(slug.lower())
            
            if donor_entry and donor_entry.get('content'):
                donor_info = extract_content_from_donor(donor_entry['content'])
                print(f"  Found donor info: {len(donor_info)} sections")
        
        # Research on nelsoncounty.com (only if needed)
        research_info = None
        if slug:
            research_info = research_listing(slug, name)
            if research_info:
                print(f"  Found research info: {len(research_info)} sections")
            time.sleep(0.5)  # Be nice to the server
        
        # Rewrite description
        new_desc = rewrite_description(current_desc, donor_info, research_info)
        listing['description'] = new_desc
        print(f"  Description rewritten: {len(new_desc)} chars")
        
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
                print(f"  Added accordion: {title}")
        
        if not accordions:
            print(f"  No accordions added (no important non-redundant info)")
        
        updated_listings.append(listing)
    
    # Write updated CSV
    output_file = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        if updated_listings:
            writer = csv.DictWriter(f, fieldnames=updated_listings[0].keys())
            writer.writeheader()
            writer.writerows(updated_listings)
    
    print(f"\n✅ Complete! Wrote {len(updated_listings)} listings to {output_file}")

if __name__ == '__main__':
    process_listings()
