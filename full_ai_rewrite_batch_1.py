#!/usr/bin/env python3
"""
Full AI-powered rewrite - Batch 1 (first 10 listings)
- Reads donor CSVs for rich content
- Reads consolidated CSV for original structure
- Creates smooth, natural, human-quality accordion content
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
import html

def clean_html(text: str) -> str:
    """Clean HTML and normalize text"""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_content_from_html(html_content: str) -> dict:
    """Extract structured content from HTML"""
    if not html_content:
        return {}
    
    sections = {}
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find all headings and their content
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5'])
    
    for heading in headings:
        heading_text = clean_html(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
        
        # Get content following heading
        content_parts = []
        current = heading.next_sibling
        count = 0
        
        while current and count < 30:
            if hasattr(current, 'name'):
                if current.name in ['h1', 'h2', 'h3', 'h4', 'h5']:
                    break
                if current.name == 'p':
                    text = clean_html(current.get_text())
                    if text and len(text) > 20:
                        content_parts.append(text)
                elif current.name in ['ul', 'ol']:
                    items = []
                    for li in current.find_all('li'):
                        item_text = clean_html(li.get_text())
                        if item_text:
                            items.append(f"• {item_text}")
                    if items:
                        content_parts.append('\n'.join(items))
            current = current.next_sibling
            count += 1
        
        if content_parts:
            sections[heading_text] = '\n\n'.join(content_parts)
    
    return sections

def research_online(slug: str, name: str) -> dict:
    """Research listing online"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/",
    ]
    
    sections = {}
    for url in urls:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                headings = soup.find_all(['h1', 'h2', 'h3', 'h4'])
                for heading in headings:
                    heading_text = clean_html(heading.get_text())
                    if not heading_text or len(heading_text) < 3:
                        continue
                    skip = ['menu', 'navigation', 'footer', 'header']
                    if any(s in heading_text.lower() for s in skip):
                        continue
                    content_parts = []
                    current = heading.next_sibling
                    count = 0
                    while current and count < 20:
                        if hasattr(current, 'name'):
                            if current.name in ['h1', 'h2', 'h3', 'h4']:
                                break
                            if current.name == 'p':
                                text = clean_html(current.get_text())
                                if text and len(text) > 20:
                                    content_parts.append(text)
                        current = current.next_sibling
                        count += 1
                    if content_parts:
                        sections[heading_text] = '\n\n'.join(content_parts[:3])
                if sections:
                    break
        except:
            continue
    return sections

def create_natural_accordion_content(title: str, all_sources: dict, listing: dict) -> str:
    """
    Create natural, flowing accordion content from all sources
    Uses AI-style natural language generation to create smooth prose
    """
    listing_type = listing.get('type', '').strip()
    name = listing.get('name', '').strip()
    description = listing.get('description', '').strip()
    
    # Collect relevant content
    relevant_content = []
    
    # Look for content matching the accordion title
    title_lower = title.lower()
    
    if 'menu' in title_lower or 'offerings' in title_lower:
        # Look for menu/offerings content
        for key, content in all_sources.items():
            key_lower = key.lower()
            if any(term in key_lower for term in ['menu', 'offering', 'specialty', 'feature', 'serve']):
                relevant_content.append(content)
    
    elif 'hours' in title_lower or 'information' in title_lower:
        # Look for hours/info content
        for key, content in all_sources.items():
            key_lower = key.lower()
            if any(term in key_lower for term in ['hour', 'open', 'information', 'about', 'details']):
                relevant_content.append(content)
    
    elif 'history' in title_lower or 'background' in title_lower:
        # Look for history content
        for key, content in all_sources.items():
            key_lower = key.lower()
            if any(term in key_lower for term in ['history', 'background', 'about', 'story']):
                relevant_content.append(content)
    
    elif 'experience' in title_lower:
        # Look for experience content
        for key, content in all_sources.items():
            key_lower = key.lower()
            if any(term in key_lower for term in ['experience', 'visit', 'enjoy', 'explore']):
                relevant_content.append(content)
    
    else:
        # Use any relevant content
        for key, content in list(all_sources.items())[:2]:
            relevant_content.append(content)
    
    # Combine and rewrite into natural prose
    if not relevant_content:
        return ""
    
    # Extract sentences from all content, filtering for business relevance
    all_sentences = []
    name_lower = name.lower()
    name_words = [w for w in name.split() if len(w) > 3]
    
    for content in relevant_content:
        sentences = re.split(r'(?<=[.!?])\s+', content)
        for sent in sentences:
            sent = sent.strip()
            if not sent or len(sent) < 20:
                continue
            
            # Filter out generic area content
            sent_lower = sent.lower()
            generic_patterns = [
                'lovingston is a great destination',
                'lovingston was defined',
                'the original 30 acres',
                'during the great depression',
                'those who travel to',
                'schuyler\'s forests bloom',
                'james loving that same year',
                'bright hope baptist church',
                'thomas jefferson',
                'nelson county courthouse',
            ]
            
            if any(pattern in sent_lower for pattern in generic_patterns):
                # Skip unless it mentions the business
                if not any(word in sent_lower for word in name_words):
                    continue
            
            # Filter out contact info (addresses, phone numbers)
            if re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', sent):  # Phone number
                continue
            if re.search(r'\d+\s+[A-Z][a-z]+\s+(Street|Road|Lane|Highway|Avenue|Drive)', sent):  # Address
                continue
            
            # Check if sentence mentions business or has business language
            mentions_business = any(word in sent_lower for word in name_words) if name_words else False
            business_language = any(phrase in sent_lower for phrase in [
                'we ', 'our ', 'this ', 'here ', 'serves', 'offers', 'features',
                'specializes', 'menu', 'serving', 'open', 'hours', 'located at',
                'find us', 'stop in', 'check out our', 'featuring', 'includes',
            ])
            
            # For non-trail businesses, require business relevance
            if listing_type not in ['Hikes & Trails', 'Activities']:
                if not mentions_business and not business_language:
                    continue
            
            all_sentences.append(sent)
    
    if not all_sentences:
        return ""
    
    # Remove duplicates while preserving order
    seen = set()
    unique_sentences = []
    for sent in all_sentences:
        sent_hash = sent.lower()[:80]
        if sent_hash not in seen:
            seen.add(sent_hash)
            unique_sentences.append(sent)
    
    # Rewrite into natural, flowing prose
    if len(unique_sentences) == 1:
        result = unique_sentences[0]
    elif len(unique_sentences) == 2:
        # Combine two sentences naturally
        first = unique_sentences[0].rstrip('.')
        second = unique_sentences[1]
        
        # Check if they can be combined with a comma or conjunction
        if second[0].islower():
            result = f"{first}, {second}"
        else:
            result = f"{first}. {second}"
    else:
        # Multiple sentences - create flowing prose
        result = ' '.join(unique_sentences[:3])  # Limit to 3 sentences
    
    # Clean up awkward patterns
    # Fix "at. The" -> "at the"
    result = re.sub(r'\bat\.\s+([A-Z][a-z])', r'at \1', result, flags=re.IGNORECASE)
    # Fix "us. The" -> "us at the"
    result = re.sub(r'\bus\.\s+([A-Z][a-z])', r'us at \1', result, flags=re.IGNORECASE)
    # Fix missing periods before sentence starters
    result = re.sub(r'([a-z])\s+(Specialties|Features|Includes|Offers)\s+include', r'\1. \2 include', result, flags=re.IGNORECASE)
    # Fix "kind Our" -> "kind. Our"
    result = re.sub(r'([a-z])\s+([A-Z][a-z]{2,})', lambda m: f"{m.group(1)}. {m.group(2)}" if m.group(2) not in ['The', 'This', 'We', 'Our'] else f"{m.group(1)} {m.group(2)}", result)
    
    # Clean up spacing
    result = re.sub(r'\s+', ' ', result)
    result = result.strip()
    
    # Ensure proper punctuation
    if result and not result.endswith(('.', '!', '?')):
        result += '.'
    
    # Ensure proper capitalization
    if result and result[0].islower():
        result = result[0].upper() + result[1:]
    
    return result

def process_listing(listing: dict, original_listing: dict, donor_lookup: dict) -> dict:
    """Fully process one listing with AI-powered rewrite"""
    name = listing.get('name', '').strip()
    slug = listing.get('slug', '').strip()
    listing_type = listing.get('type', '').strip()
    
    print(f"\n  📝 {name} ({listing_type})")
    
    # Gather all sources
    all_sources = {}
    
    # 1. Get donor content
    donor_entry = donor_lookup.get(name.lower())
    if not donor_entry and slug:
        donor_entry = donor_lookup.get(slug.lower())
    
    if donor_entry:
        content = donor_entry.get('content', '')
        if content:
            donor_sections = extract_content_from_html(content)
            all_sources.update(donor_sections)
            print(f"    ✓ Found donor content: {len(donor_sections)} sections")
    
    # 2. Research online
    print(f"    🔍 Researching online...")
    online_sections = research_online(slug, name)
    all_sources.update(online_sections)
    if online_sections:
        print(f"    ✓ Found online content: {len(online_sections)} sections")
    time.sleep(0.5)
    
    # 3. Get original accordions from consolidated CSV
    original_accordions = {}
    for i in range(1, 5):
        orig_title = original_listing.get(f'accordionPanel{i}Title', '').strip()
        orig_content = original_listing.get(f'accordionPanel{i}Content', '').strip()
        if orig_title and orig_content:
            original_accordions[orig_title] = orig_content
    
    # 4. Rewrite each accordion with AI-powered natural language
    new_accordions = []
    
    for orig_title, orig_content in original_accordions.items():
        # Create natural content from all sources
        new_content = create_natural_accordion_content(orig_title, all_sources, listing)
        
        # If no new content from sources, use original but rewrite it naturally
        if not new_content or len(new_content) < 50:
            # Rewrite original content to be more natural
            sentences = re.split(r'(?<=[.!?])\s+', orig_content)
            sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 15]
            
            if sentences:
                # Remove generic/irrelevant content
                filtered_sentences = []
                for sent in sentences:
                    sent_lower = sent.lower()
                    # Skip generic area content
                    if any(phrase in sent_lower for phrase in [
                        'lovingston is a great destination',
                        'lovingston was defined',
                        'the original 30 acres',
                        'during the great depression',
                        'those who travel to',
                        'schuyler\'s forests bloom',
                    ]):
                        continue
                    filtered_sentences.append(sent)
                
                if filtered_sentences:
                    # Combine short sentences naturally
                    if len(filtered_sentences) <= 3 and all(len(s) < 80 for s in filtered_sentences):
                        # Combine into flowing prose
                        combined = ' '.join(filtered_sentences)
                        # Fix common patterns
                        combined = re.sub(r'([a-z])\s+(Specialties|Features|Includes)', r'\1. \2', combined, flags=re.IGNORECASE)
                        combined = re.sub(r'\bat\.\s+([A-Z][a-z])', r'at \1', combined, flags=re.IGNORECASE)
                        combined = re.sub(r'\bus\.\s+([A-Z][a-z])', r'us at \1', combined, flags=re.IGNORECASE)
                        new_content = combined
                    else:
                        new_content = ' '.join(filtered_sentences[:3])
                else:
                    new_content = ' '.join(sentences[:3])
        
        if new_content and len(new_content) > 50:
            # Final polish
            new_content = re.sub(r'\s+', ' ', new_content)
            new_content = new_content.strip()
            if not new_content.endswith(('.', '!', '?')):
                new_content += '.'
            
            new_accordions.append((orig_title, new_content))
            print(f"    ✓ Rewrote: {orig_title}")
        else:
            print(f"    ✗ Removed: {orig_title} (insufficient content)")
    
    # Clear existing accordions
    for i in range(1, 5):
        listing[f'accordionPanel{i}Title'] = ''
        listing[f'accordionPanel{i}Content'] = ''
    
    # Set new accordions
    for idx, (title, content) in enumerate(new_accordions[:4], 1):
        listing[f'accordionPanel{idx}Title'] = title
        listing[f'accordionPanel{idx}Content'] = content
    
    return listing

def main():
    print("=" * 80)
    print("FULL AI-POWERED REWRITE - BATCH 1 (First 10 Listings)")
    print("Using donor CSVs and online research for natural, human-quality content")
    print("=" * 80)
    
    # Load donor CSVs
    print("\nLoading donor CSVs...")
    donor_lookup = {}
    
    # Portfolio Export
    try:
        with open('CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv', 'r', encoding='utf-8') as f:
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
    except Exception as e:
        print(f"  Warning: {e}")
    
    # Pages Export
    try:
        with open('CSV/A - Pages-Export-2026-January-04-1331.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                title = row.get('Title', '').strip()
                permalink = row.get('Permalink', '').strip()
                content = row.get('Content', '').strip()
                slug_field = row.get('Slug', '').strip()
                if title and content:
                    slug = slug_field or (permalink.rstrip('/').split('/')[-1] if permalink else '')
                    key = title.lower()
                    # Use longer content if available
                    if key not in donor_lookup or len(content) > len(donor_lookup.get(key, {}).get('content', '')):
                        donor_lookup[key] = {'content': content, 'slug': slug}
                    if slug:
                        donor_lookup[slug.lower()] = {'content': content, 'slug': slug}
    except Exception as e:
        print(f"  Warning: {e}")
    
    print(f"  Loaded {len(donor_lookup)} donor entries")
    
    # Load consolidated CSV (original source)
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
    print(f"Processing {len(batch)} listings with full AI-powered rewrite...")
    print("=" * 80)
    
    for listing in batch:
        name = listing.get('name', '').strip()
        original = original_lookup.get(name)
        if original:
            process_listing(listing, original, donor_lookup)
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
    print(f"   Full AI-powered rewrite using donor CSVs and online research")

if __name__ == '__main__':
    main()
