#!/usr/bin/env python3
"""
FULL COMPLETE REWRITE OF ALL ACCORDIONS
- Reads all sources (donor CSV, consolidated CSV, online)
- Rewrites every accordion from scratch
- Creates natural, human-quality prose
- Handles all edge cases
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
import html

def clean_html(text: str) -> str:
    """Clean HTML"""
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
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5'])
    for heading in headings:
        heading_text = clean_html(heading.get_text())
        if not heading_text or len(heading_text) < 3:
            continue
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
    urls = [f"https://nelsoncounty.com/{slug}/", f"https://nelsoncounty.com/explore/{slug}/"]
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

def rewrite_into_natural_prose(content: str) -> str:
    """
    Complete rewrite into natural, human-quality prose
    Handles all awkward breaks and creates flowing sentences
    """
    if not content or len(content) < 30:
        return ""
    
    # Step 1: Fix ALL awkward breaks first
    fixes = [
        (r'\bis\.\s+the\s+', 'is the '),
        (r'\bwithin\.\s+the\s+', 'within the '),
        (r'\bat\.\s+the\s+', 'at the '),
        (r'\bto\.\s+the\s+', 'to the '),
        (r'\bout\.\s+the\s+', 'out the '),
        (r'\bthere\.\s+to\s+', 'there to '),
        (r'\bstore\.\s+too\.', 'store as well.'),
        (r'\bcoffee\.\s+We\s+source', 'coffee we source'),
        (r'\benhance\.\s+The\s+inherent', 'enhance the inherent'),
        (r'\bcheck\s+out\.\s+The\s+', 'check out the '),
        (r'\bgather\.\s+There\s+to', 'gather there to'),
        (r'\bdrive\s+to\.\s+The\s+', 'drive to the '),
    ]
    
    for pattern, replacement in fixes:
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    
    # Step 2: Handle specific patterns with complete rewrites
    content_lower = content.lower()
    
    # Pattern: "Serving Breakfast, Lunch & Dinner. Our famous fried chicken is the best around, and antiques sold within the store as well."
    if 'serving' in content_lower and 'famous fried chicken' in content_lower:
        meal_match = re.search(r'serving\s+([^.]*?)(?:\.|Our)', content, re.IGNORECASE)
        if meal_match:
            meals = meal_match.group(1).strip()
            meals = meals.replace('Breakfast', 'breakfast').replace('Lunch', 'lunch').replace('Dinner', 'dinner')
            meals = meals.replace(' & ', ', ').replace('&', ',')
            if not meals.endswith('dinner'):
                meals = meals.rstrip(',').strip()
            content = f'Serving {meals}. Our famous fried chicken is the best around, and antiques are sold within the store as well.'
    
    # Pattern: "Convenience store and gas. Deli open for breakfast and lunch. Specialties include..."
    if 'convenience store' in content_lower and 'gas' in content_lower and 'deli' in content_lower:
        time_match = re.search(r'open\s+(.+?)(?:\.|Specialties)', content, re.IGNORECASE)
        time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
        specialties_match = re.search(r'specialties\s+include\s+(.+?)(?:\.|$)', content, re.IGNORECASE)
        specialties = specialties_match.group(1).strip() if specialties_match else ""
        if specialties:
            content = f'This convenience store and gas station features a deli open {time_info}. Specialties include {specialties}.'
        else:
            content = f'This convenience store and gas station features a deli open {time_info}.'
    
    # Pattern: "Locally owned convenience and gas store. The Deli is open..."
    if 'locally owned' in content_lower and 'convenience' in content_lower and 'deli' in content_lower:
        time_match = re.search(r'open\s+(.+?)(?:\.|Specialties|$)', content, re.IGNORECASE)
        time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
        specialties_match = re.search(r'specialties\s+include\s+(.+?)(?:\.|$)', content, re.IGNORECASE)
        specialties = specialties_match.group(1).strip() if specialties_match else ""
        if specialties:
            content = f'This locally owned convenience store and gas station features a deli open {time_info}. Specialties include {specialties}.'
        else:
            content = f'This locally owned convenience store and gas station features a deli open {time_info}.'
    
    # Step 3: Split into sentences and ensure proper flow
    sentences = re.split(r'(?<=[.!?])\s+', content)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    if not sentences:
        return ""
    
    # Step 4: Combine short sentences naturally
    if len(sentences) <= 3 and all(len(s) < 100 for s in sentences):
        # Check if they can be combined
        combined = []
        i = 0
        while i < len(sentences):
            sent = sentences[i]
            sent_lower = sent.lower()
            
            # Look for patterns to combine
            if i + 1 < len(sentences):
                next_sent = sentences[i + 1].lower()
                
                # "Featuring X. Homemade Y." -> "Featuring X and homemade Y."
                if 'featuring' in sent_lower and 'homemade' in next_sent:
                    first = sent.rstrip('.')
                    second = sentences[i + 1].rstrip('.')
                    combined.append(f"{first} and {second.lower()}.")
                    i += 2
                    continue
                
                # "Find us at X. The Y." -> "Find us at the Y."
                if 'find us at' in sent_lower and next_sent.startswith('the '):
                    location = sentences[i + 1].lower()
                    combined.append(f"Find us at {location}")
                    i += 2
                    continue
            
            combined.append(sent)
            i += 1
        
        content = ' '.join(combined)
    
    # Step 5: Final cleanup
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Ensure proper capitalization
    if content and content[0].islower():
        content = content[0].upper() + content[1:]
    
    # Ensure ending punctuation
    if content and not content.endswith(('.', '!', '?')):
        content += '.'
    
    # Final check - remove if too short or meaningless
    if len(content) < 50:
        return ""
    
    return content

def create_accordion_from_sources(title: str, original_content: str, all_sources: dict, listing: dict) -> str:
    """Create natural accordion content from all available sources"""
    listing_type = listing.get('type', '').strip()
    name = listing.get('name', '').strip()
    
    # Collect all relevant sentences
    all_sentences = []
    
    # From original content
    if original_content:
        sentences = re.split(r'(?<=[.!?])\s+', original_content)
        for sent in sentences:
            sent = sent.strip()
            if sent and len(sent) > 15:
                all_sentences.append(sent)
    
    # From donor sources
    title_lower = title.lower()
    for key, content in all_sources.items():
        key_lower = key.lower()
        # Match content to accordion title
        if ('menu' in title_lower and any(t in key_lower for t in ['menu', 'offering', 'specialty', 'feature', 'serve'])) or \
           ('hour' in title_lower and any(t in key_lower for t in ['hour', 'open', 'information', 'about', 'details'])) or \
           ('experience' in title_lower and any(t in key_lower for t in ['experience', 'visit', 'enjoy'])) or \
           ('history' in title_lower and any(t in key_lower for t in ['history', 'background', 'about', 'story'])):
            sentences = re.split(r'(?<=[.!?])\s+', content)
            for sent in sentences:
                sent = sent.strip()
                if sent and len(sent) > 20:
                    all_sentences.append(sent)
    
    # Filter out generic/non-useful content
    filtered = []
    for sent in all_sentences:
        sent_lower = sent.lower()
        
        # Skip generic area content
        if any(phrase in sent_lower for phrase in [
            'lovingston is a great destination',
            'lovingston was defined',
            'the original 30 acres',
            'during the great depression',
            'those who travel to',
            'schuyler\'s forests bloom',
            'the history of nelson county',
            'visit the walton\'s mountain museum',
            'there\'s something to do',
            'if you\'d like to do a little shopping',
            'check out the nelson 151',
            'nelson 151\'s wineries',
            'live music performances, good food',
            'if you\'re planning on spending',
            'nelson farmer\'s market cooperative',
            'local vendors gather there',
        ]):
            continue
        
        # Skip incomplete fragments
        if len(sent) < 20:
            continue
        
        # Skip if just address/phone
        if re.match(r'^\d+\s+[^,]+,\s*[A-Z]{2}\s+\d{5}', sent.strip()):
            continue
        if re.match(r'^\(?\d{3}\)?\s*-?\s*\d{3}\s*-?\s*\d{4}', sent.strip()):
            continue
        
        filtered.append(sent)
    
    if not filtered:
        # Use original but rewrite it
        if original_content:
            return rewrite_into_natural_prose(original_content)
        return ""
    
    # Remove duplicates
    seen = set()
    unique = []
    for sent in filtered:
        sent_hash = sent.lower()[:100]
        if sent_hash not in seen:
            seen.add(sent_hash)
            unique.append(sent)
    
    # Combine and rewrite
    combined = ' '.join(unique[:3])
    return rewrite_into_natural_prose(combined)

def process_listing(listing: dict, original_listing: dict, donor_lookup: dict) -> dict:
    """Fully process one listing with complete rewrite"""
    name = listing.get('name', '').strip()
    slug = listing.get('slug', '').strip()
    
    # Gather all sources
    all_sources = {}
    
    # Get donor content
    donor_entry = donor_lookup.get(name.lower()) or donor_lookup.get(slug.lower())
    if donor_entry:
        content = donor_entry.get('content', '')
        if content:
            all_sources.update(extract_content_from_html(content))
    
    # Research online
    online_sections = research_online(slug, name)
    all_sources.update(online_sections)
    time.sleep(0.3)
    
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
        new_content = create_accordion_from_sources(orig_title, orig_content, all_sources, listing)
        if new_content and len(new_content) > 50:
            new_accordions.append((orig_title, new_content))
    
    # Clear and set
    for i in range(1, 5):
        listing[f'accordionPanel{i}Title'] = ''
        listing[f'accordionPanel{i}Content'] = ''
    
    for idx, (title, content) in enumerate(new_accordions[:4], 1):
        listing[f'accordionPanel{idx}Title'] = title
        listing[f'accordionPanel{idx}Content'] = content
    
    return listing

def main():
    print("=" * 80)
    print("FULL COMPLETE REWRITE OF ALL ACCORDIONS")
    print("Processing all listings with comprehensive rewrite")
    print("=" * 80)
    
    # Load donor CSVs
    print("\nLoading donor CSVs...")
    donor_lookup = {}
    
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
                    if key not in donor_lookup or len(content) > len(donor_lookup.get(key, {}).get('content', '')):
                        donor_lookup[key] = {'content': content, 'slug': slug}
                    if slug:
                        donor_lookup[slug.lower()] = {'content': content, 'slug': slug}
    except Exception as e:
        print(f"  Warning: {e}")
    
    print(f"  Loaded {len(donor_lookup)} donor entries")
    
    # Load consolidated CSV
    print("\nLoading consolidated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-consolidated.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        original_listings = list(reader)
    
    original_lookup = {listing.get('name', '').strip(): listing for listing in original_listings if listing.get('name', '').strip()}
    print(f"  Loaded {len(original_lookup)} original listings")
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    # Process ALL listings
    print(f"\n{'=' * 80}")
    print(f"Processing {len(listings)} listings with full rewrite...")
    print("=" * 80)
    
    for idx, listing in enumerate(listings, 1):
        name = listing.get('name', '').strip()
        original = original_lookup.get(name)
        if original:
            process_listing(listing, original, donor_lookup)
            if idx % 50 == 0:
                print(f"\n  Progress: {idx}/{len(listings)} listings processed...")
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ COMPLETE!")
    print(f"   Processed: {len(listings)} listings")
    print(f"   Full rewrite of all accordions completed")

if __name__ == '__main__':
    main()
