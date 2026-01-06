#!/usr/bin/env python3
"""
Fix punctuation and formatting issues:
- Missing ending punctuation
- Missing spaces after periods
- Title running into sentences
- Address/info running into sentences
"""

import csv
import re

def fix_text(text: str) -> str:
    """Fix common formatting issues in text"""
    if not text:
        return text
    
    # Fix: Missing space after period (Word.Word -> Word. Word)
    text = re.sub(r'([a-z])(\.)([A-Z])', r'\1\2 \3', text)
    
    # Fix: Title running into word (LandingJames -> Landing James)
    # But be careful not to break proper compound words
    text = re.sub(r'([a-z])([A-Z][a-z]+)(River|Park|Road|Highway|Street|Drive|Lane|Court|Avenue|Boulevard|Way|Loop|Trail|Mountain|Creek|Ridge|Valley|County|State|Parkway)', r'\1 \2 \3', text)
    
    # Fix: Address running into sentence (add line break before addresses)
    # Pattern: sentence. Address on new line
    text = re.sub(r'([.!?])\s*(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Road|Highway|Drive|Lane|Avenue|Boulevard|Way|Loop|Court|Parkway))', r'\1\n\n\2', text)
    
    # Fix: Phone numbers running into text
    text = re.sub(r'([.!?])\s*(\d{3}-\d{3}-\d{4})', r'\1\n\n\2', text)
    text = re.sub(r'([.!?])\s*\((\d{3})\)\s*(\d{3}-\d{4})', r'\1\n\n(\2) \3', text)
    
    # Ensure ending punctuation for long content
    if len(text) > 100 and text[-1] not in '.!?' and '\n' not in text[-50:]:
        # Check if it ends with a complete thought
        if text[-1] not in ',;:':
            text += '.'
    
    return text.strip()

def main():
    print("=" * 80)
    print("FIXING PUNCTUATION AND FORMATTING ISSUES")
    print("=" * 80)
    
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    fixes_made = []
    
    for listing in listings:
        name = listing.get('name', '').strip()
        
        # Fix description
        desc = listing.get('description', '').strip()
        if desc:
            new_desc = fix_text(desc)
            if new_desc != desc:
                listing['description'] = new_desc
                fixes_made.append(f"{name} - description")
        
        # Fix accordions
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if content:
                new_content = fix_text(content)
                if new_content != content:
                    listing[f'accordionPanel{i}Content'] = new_content
                    fixes_made.append(f"{name} - accordion {i}: {title}")
    
    # Manual fixes for specific issues found
    print("\nApplying manual fixes...")
    
    for listing in listings:
        name = listing.get('name', '').strip()
        
        # Tennis - Fix accordion 1 (address running into sentence)
        if name == 'Tennis':
            content = listing.get('accordionPanel1Content', '').strip()
            if '6919 Thomas Nelson Highway' in content and '\n\n' not in content[:100]:
                # Split address from sentence
                content = content.replace(
                    'school events.\n\n6919',
                    'school events.\n\n6919'
                ).replace(
                    'school events.6919',
                    'school events.\n\n6919'
                ).replace(
                    'school events. 6919',
                    'school events.\n\n6919'
                )
                listing['accordionPanel1Content'] = content
                fixes_made.append(f"{name} - accordion 1: Fixed address formatting")
            
            # Fix accordion 2 (missing ending punctuation)
            content2 = listing.get('accordionPanel2Content', '').strip()
            if content2 and content2[-1] not in '.!?' and len(content2) > 100:
                if 'Route 664' in content2:
                    # Split address
                    content2 = content2.replace(
                        'courts.\n\nRoute',
                        'courts.\n\nRoute'
                    ).replace(
                        'courts.Route',
                        'courts.\n\nRoute'
                    ).replace(
                        'courts. Route',
                        'courts.\n\nRoute'
                    )
                    if content2[-1] not in '.!?':
                        content2 += '.'
                    listing['accordionPanel2Content'] = content2
                    fixes_made.append(f"{name} - accordion 2: Fixed ending punctuation and address")
        
        # Glass Hollow Studio - Fix accordion 2
        elif name == 'Glass Hollow Studio & Gallery':
            content = listing.get('accordionPanel2Content', '').strip()
            if content and content[-1] not in '.!?' and len(content) > 100:
                content += '.'
                listing['accordionPanel2Content'] = content
                fixes_made.append(f"{name} - accordion 2: Added ending punctuation")
        
        # Blue Ridge Parkway Loops - Fix accordion 1
        elif name == 'Blue Ridge Parkway Loops':
            content = listing.get('accordionPanel1Content', '').strip()
            if content and content[-1] not in '.!?' and len(content) > 50:
                content += '.'
                listing['accordionPanel1Content'] = content
                fixes_made.append(f"{name} - accordion 1: Added ending punctuation")
        
        # James River - Fix accordion 1 (LandingJames River)
        elif name == 'James River':
            content = listing.get('accordionPanel1Content', '').strip()
            if 'LandingJames River' in content:
                content = content.replace('LandingJames River', 'Landing. James River')
                if content[-1] not in '.!?':
                    content += '.'
                listing['accordionPanel1Content'] = content
                fixes_made.append(f"{name} - accordion 1: Fixed 'LandingJames River' and added punctuation")
        
        # Tye River - Fix accordion 1 (days/yr.Difficulty)
        elif name == 'Tye River':
            content = listing.get('accordionPanel1Content', '').strip()
            if 'days/yr.Difficulty' in content:
                content = content.replace('days/yr.Difficulty', 'days/yr. Difficulty')
                listing['accordionPanel1Content'] = content
                fixes_made.append(f"{name} - accordion 1: Fixed missing space after period")
        
        # Fishing the James River - Fix accordion 4
        elif name == 'Fishing the James River':
            content = listing.get('accordionPanel4Content', '').strip()
            if content and 'points.Bank' in content:
                content = content.replace('points.Bank', 'points. Bank')
                listing['accordionPanel4Content'] = content
                fixes_made.append(f"{name} - accordion 4: Fixed missing space after period")
        
        # Nelson 29 - Fix description (S at start)
        elif name == 'Nelson 29':
            desc = listing.get('description', '').strip()
            if desc.startswith('29 connecting'):
                # This is fine, but check if it needs ending punctuation
                if desc[-1] not in '.!?' and len(desc) > 50:
                    desc += '.'
                    listing['description'] = desc
                    fixes_made.append(f"{name} - description: Added ending punctuation")
        
        # Village Inn - Fix description (S at start)
        elif name == 'Village Inn':
            desc = listing.get('description', '').strip()
            if 'U.S.' in desc and desc.count('U.S.') > 1:
                # Fix duplicate U.S.
                desc = re.sub(r'U\.S\.\s+U\.S\.', 'U.S.', desc)
                if desc[-1] not in '.!?':
                    desc += '.'
                listing['description'] = desc
                fixes_made.append(f"{name} - description: Fixed duplicate U.S. and added punctuation")
    
    # Write fixed CSV
    print(f"\nWriting fixes to CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ FIXES COMPLETE!")
    print(f"   Total fixes made: {len(fixes_made)}")
    if fixes_made:
        print("\n   Fixed items:")
        for fix in fixes_made[:20]:
            print(f"     - {fix}")
        if len(fixes_made) > 20:
            print(f"     ... and {len(fixes_made) - 20} more")

if __name__ == '__main__':
    main()
