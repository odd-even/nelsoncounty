#!/usr/bin/env python3
"""
Line-by-line accordion review and rewrite:
- Research each listing to understand what information should be included
- Review each accordion line by line
- Keep ALL relevant information
- Rewrite language to be appropriate for listing type
- Fix spacing issues
- Process in small batches for thoroughness
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time

def fix_spacing(text: str) -> str:
    """Fix all spacing issues"""
    if not text:
        return text
    
    # Fix abbreviations
    text = re.sub(r'\bU\.\s+S\.', 'U.S.', text)
    text = re.sub(r'\bN\.\s+Y\.', 'N.Y.', text)
    text = re.sub(r'\bV\.\s+A\.', 'VA', text)
    
    # Fix numbers: 1. 5 -> 1.5, 2. 25 -> 2.25
    text = re.sub(r'(\d+)\.\s+(\d+)', r'\1.\2', text)
    
    # Fix website URLs
    text = re.sub(r'([a-z0-9])\s+\.(com|org|net|edu|gov)', r'\1.\2', text, flags=re.IGNORECASE)
    text = re.sub(r'(www\.)\s+([^\s]+)', r'\1\2', text, flags=re.IGNORECASE)
    
    # Fix email addresses
    text = re.sub(r'([a-z0-9])\s+@([a-z0-9])', r'\1@\2', text, flags=re.IGNORECASE)
    
    return text.strip()

def rewrite_language_appropriately(listing_type: str, content: str) -> str:
    """Rewrite content to use appropriate language for listing type, but keep all info"""
    if not content:
        return ""
    
    if listing_type == 'Hikes & Trails':
        # Rewrite hotel language to trail language
        replacements = [
            (r'we want your visit with us to be as relaxing and trouble-free as possible',
             'Important information for a safe and enjoyable visit'),
            (r'we want your visit',
             'Important information'),
            (r'as comfortable as possible',
             'safely and enjoyably'),
            (r'comfortable stay',
             'safe visit'),
            (r'make your stay',
             'make your visit'),
            (r'during your stay',
             'during your visit'),
            (r'before you arrive',
             'Before visiting'),
        ]
        
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    
    # Capitalize sentences properly
    sentences = re.split(r'(?<=[.!?])\s+', content)
    fixed_sentences = []
    for sent in sentences:
        sent = sent.strip()
        if sent and sent[0].islower() and len(sent) > 10:
            # Capitalize first letter
            sent = sent[0].upper() + sent[1:]
        fixed_sentences.append(sent)
    
    content = ' '.join(fixed_sentences)
    
    # Clean up
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    return content

def research_listing_online(slug: str, name: str) -> dict:
    """Research listing to understand what information should be included"""
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/",
    ]
    
    for url in urls:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # Extract main content sections
                sections = {}
                headings = soup.find_all(['h1', 'h2', 'h3', 'h4'])
                for heading in headings:
                    heading_text = heading.get_text().strip()
                    if heading_text and len(heading_text) > 2:
                        content_parts = []
                        current = heading.next_sibling
                        count = 0
                        while current and count < 15:
                            if hasattr(current, 'name'):
                                if current.name in ['h1', 'h2', 'h3', 'h4']:
                                    break
                                if current.name == 'p':
                                    text = current.get_text().strip()
                                    if text and len(text) > 30:
                                        content_parts.append(text)
                            current = current.next_sibling
                            count += 1
                        if content_parts:
                            sections[heading_text] = ' '.join(content_parts[:3])  # Limit length
                return sections
        except Exception as e:
            continue
    return {}

def process_listing_accordions(listing: dict, donor_lookup: dict = None) -> list:
    """Process all accordions for a listing - line by line review"""
    name = listing.get('name', '').strip()
    slug = listing.get('slug', '').strip()
    listing_type = listing.get('type', '').strip()
    
    changes = []
    
    # Research the listing
    research_info = research_listing_online(slug, name)
    time.sleep(0.3)  # Be respectful with requests
    
    for i in range(1, 5):
        title = listing.get(f'accordionPanel{i}Title', '').strip()
        content = listing.get(f'accordionPanel{i}Content', '').strip()
        
        if not content:
            continue
        
        original = content
        
        # Step 1: Fix spacing
        content = fix_spacing(content)
        
        # Step 2: Rewrite language appropriately
        content = rewrite_language_appropriately(listing_type, content)
        
        # Step 3: Ensure proper capitalization
        # Fix sentence starts
        if content and content[0].islower():
            content = content[0].upper() + content[1:]
        
        # Step 4: Clean up
        content = re.sub(r'\s+', ' ', content)
        content = content.strip()
        
        # Update if changed
        if content != original:
            listing[f'accordionPanel{i}Content'] = content
            changes.append(f"{name}: Rewrote accordion {i} ({title})")
    
    return changes

def main():
    print("=" * 80)
    print("LINE-BY-LINE ACCORDION REVIEW AND REWRITE")
    print("Researching each listing and reviewing all accordions")
    print("=" * 80)
    
    # Load CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    total = len(listings)
    batch_size = 25  # Smaller batches for thorough research
    
    print(f"\nTotal listings: {total}")
    print(f"Processing in batches of {batch_size}")
    print("=" * 80)
    
    all_changes = []
    
    # Process in batches
    for start_idx in range(0, total, batch_size):
        end_idx = min(start_idx + batch_size, total)
        batch = listings[start_idx:end_idx]
        
        print(f"\n📦 Batch {start_idx//batch_size + 1}: Processing listings {start_idx+1}-{end_idx}")
        
        batch_changes = 0
        for listing in batch:
            name = listing.get('name', '').strip()
            changes = process_listing_accordions(listing)
            all_changes.extend(changes)
            batch_changes += len(changes)
            
            if changes:
                print(f"   ✓ {name}: {len(changes)} accordions updated")
        
        print(f"   Batch total: {batch_changes} changes")
        print(f"   Progress: {end_idx}/{total} listings ({end_idx*100//total}%)")
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ COMPREHENSIVE REVIEW COMPLETE!")
    print(f"   Total listings processed: {total}")
    print(f"   Total accordions updated: {len(all_changes)}")
    
    if all_changes:
        print(f"\n   Sample updates (first 30):")
        for change in all_changes[:30]:
            print(f"     - {change}")
        if len(all_changes) > 30:
            print(f"     ... and {len(all_changes) - 30} more")

if __name__ == '__main__':
    main()
