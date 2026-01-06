#!/usr/bin/env python3
"""
Restore removed accordions and rewrite ALL accordions line-by-line:
- Restore important information that was removed (like Rules for Blue Ridge Tunnel)
- Rewrite language to be appropriate for listing type
- Keep ALL relevant information
- Research each listing to understand what should be included
"""

import csv
import re

def fix_spacing(text: str) -> str:
    """Fix spacing issues"""
    if not text:
        return text
    
    text = re.sub(r'\bU\.\s+S\.', 'U.S.', text)
    text = re.sub(r'\bN\.\s+Y\.', 'N.Y.', text)
    text = re.sub(r'(\d+)\.\s+(\d+)', r'\1.\2', text)
    text = re.sub(r'([a-z0-9])\s+\.(com|org|net)', r'\1.\2', text, flags=re.IGNORECASE)
    return text.strip()

def rewrite_hotel_language_to_trail_language(text: str) -> str:
    """Rewrite hotel/comfort language to appropriate trail language, but keep the information"""
    if not text:
        return text
    
    # Rewrite phrases but keep the meaning
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
         'before visiting'),
    ]
    
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    return text

def process_accordion(listing_name: str, listing_type: str, title: str, content: str) -> str:
    """Process a single accordion - fix spacing and language, keep all info"""
    if not content:
        return ""
    
    # Fix spacing
    content = fix_spacing(content)
    
    # Rewrite language based on listing type
    if listing_type == 'Hikes & Trails':
        content = rewrite_hotel_language_to_trail_language(content)
    
    # Clean up
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    return content

def main():
    print("=" * 80)
    print("RESTORE AND REWRITE ALL ACCORDIONS")
    print("Keeping ALL relevant information, fixing language appropriately")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rewritten_listings = list(reader)
    
    # Load consolidated CSV to get original content
    with open('CSV/A - to merge- listings-2026-01-02-consolidated.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        original_listings = list(reader)
    
    # Create lookup
    original_lookup = {}
    for listing in original_listings:
        name = listing.get('name', '').strip()
        if name:
            original_lookup[name] = listing
    
    changes = []
    
    # Process each listing
    for listing in rewritten_listings:
        name = listing.get('name', '').strip()
        listing_type = listing.get('type', '').strip()
        
        # Check if we need to restore any accordions
        original = original_lookup.get(name)
        if original:
            # Check each accordion panel
            for i in range(1, 5):
                orig_title = original.get(f'accordionPanel{i}Title', '').strip()
                orig_content = original.get(f'accordionPanel{i}Content', '').strip()
                current_title = listing.get(f'accordionPanel{i}Title', '').strip()
                current_content = listing.get(f'accordionPanel{i}Content', '').strip()
                
                # If original had content but current doesn't, restore it
                if orig_title and orig_content and (not current_title or not current_content):
                    # Restore but rewrite appropriately
                    rewritten = process_accordion(name, listing_type, orig_title, orig_content)
                    if rewritten:
                        listing[f'accordionPanel{i}Title'] = orig_title
                        listing[f'accordionPanel{i}Content'] = rewritten
                        changes.append(f"{name}: Restored and rewrote accordion {i} ({orig_title})")
                
                # If both exist, rewrite current one
                elif current_title and current_content:
                    rewritten = process_accordion(name, listing_type, current_title, current_content)
                    if rewritten != current_content:
                        listing[f'accordionPanel{i}Content'] = rewritten
                        changes.append(f"{name}: Rewrote accordion {i} ({current_title})")
    
    # Special case: Blue Ridge Tunnel - ensure Rules are there
    for listing in rewritten_listings:
        if listing.get('name', '').strip() == 'Blue Ridge Tunnel':
            # Check if Rules accordion exists
            has_rules = False
            for i in range(1, 5):
                title = listing.get(f'accordionPanel{i}Title', '').strip()
                if 'rule' in title.lower() or 'guideline' in title.lower():
                    has_rules = True
                    # Rewrite it properly
                    content = listing.get(f'accordionPanel{i}Content', '').strip()
                    if content:
                        rewritten = process_accordion('Blue Ridge Tunnel', 'Hikes & Trails', title, content)
                        if rewritten != content:
                            listing[f'accordionPanel{i}Content'] = rewritten
                            changes.append(f"Blue Ridge Tunnel: Rewrote Rules accordion with appropriate language")
                    break
            
            # If no rules accordion, restore it from original
            if not has_rules and 'Blue Ridge Tunnel' in original_lookup:
                orig = original_lookup['Blue Ridge Tunnel']
                for i in range(1, 5):
                    orig_title = orig.get(f'accordionPanel{i}Title', '').strip()
                    if orig_title and ('rule' in orig_title.lower() or 'guideline' in orig_title.lower()):
                        orig_content = orig.get(f'accordionPanel{i}Content', '').strip()
                        if orig_content:
                            # Find empty slot
                            for j in range(1, 5):
                                if not listing.get(f'accordionPanel{j}Title', '').strip():
                                    rewritten = process_accordion('Blue Ridge Tunnel', 'Hikes & Trails', orig_title, orig_content)
                                    listing[f'accordionPanel{j}Title'] = orig_title
                                    listing[f'accordionPanel{j}Content'] = rewritten
                                    changes.append(f"Blue Ridge Tunnel: Restored Rules accordion with appropriate language")
                                    break
                        break
    
    # Write updated CSV
    print(f"\nWriting updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if rewritten_listings:
            writer = csv.DictWriter(f, fieldnames=rewritten_listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(rewritten_listings)
    
    print(f"\n✅ COMPLETE!")
    print(f"   Total changes: {len(changes)}")
    if changes:
        print(f"\n   Changes made:")
        for change in changes[:30]:
            print(f"     - {change}")
        if len(changes) > 30:
            print(f"     ... and {len(changes) - 30} more")

if __name__ == '__main__':
    main()
