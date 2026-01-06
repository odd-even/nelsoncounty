#!/usr/bin/env python3
"""
Review all accordion titles for redundancy and relevance
- Check for duplicate titles in the same listing
- Check if titles make sense for the listing type
- Suggest fixes
"""

import csv
import re

def is_title_relevant(title: str, listing_type: str) -> bool:
    """Check if accordion title makes sense for this listing type"""
    if not title:
        return False
    
    title_lower = title.lower()
    listing_type_lower = listing_type.lower()
    
    # Titles that don't make sense for certain listing types
    inappropriate_titles = {
        'hikes & trails': ['menu & offerings', 'hours & information', 'menu', 'offerings'],
        'restaurants': ['trail information', 'what to bring', 'rules & guidelines'],
        'markets & delis': ['trail information', 'what to bring', 'rules & guidelines'],
        'coffee shops': ['trail information', 'what to bring', 'rules & guidelines'],
        'breweries & cideries': ['trail information', 'what to bring', 'rules & guidelines'],
        'cabins & cottages': ['menu & offerings', 'menu'],
        'whole house rentals': ['menu & offerings', 'menu'],
        'bed and breakfast': ['menu & offerings', 'menu'],
    }
    
    for listing_type_key, bad_titles in inappropriate_titles.items():
        if listing_type_key in listing_type_lower:
            if any(bad_title in title_lower for bad_title in bad_titles):
                return False
    
    return True

def suggest_better_title(title: str, listing_type: str, content: str) -> str:
    """Suggest a better title based on content and listing type"""
    if not title or not content:
        return title
    
    title_lower = title.lower()
    content_lower = content.lower()
    listing_type_lower = listing_type.lower()
    
    # Check content to suggest better title
    if 'menu' in content_lower or 'specialties' in content_lower or 'serves' in content_lower:
        if 'menu' not in title_lower:
            return 'Menu & Offerings'
    
    if 'hour' in content_lower or 'open' in content_lower:
        if 'hour' not in title_lower:
            return 'Hours & Information'
    
    if 'history' in content_lower or 'background' in content_lower:
        if 'history' not in title_lower:
            return 'History & Background'
    
    if 'rule' in content_lower or 'guideline' in content_lower:
        if 'rule' not in title_lower:
            return 'Rules & Guidelines'
    
    if 'faq' in content_lower or 'question' in content_lower:
        if 'faq' not in title_lower and 'question' not in title_lower:
            return 'Frequently Asked Questions'
    
    if 'amenit' in content_lower or 'feature' in content_lower:
        if 'amenit' not in title_lower:
            return 'Amenities & Features'
    
    # For hikes & trails
    if 'hikes & trails' in listing_type_lower:
        if 'information' in title_lower and 'trail' not in title_lower:
            return 'Trail Information'
        if 'what to' in title_lower and 'bring' not in title_lower:
            return 'What to Bring'
    
    return title

def review_all_titles():
    """Review all accordion titles"""
    print("=" * 80)
    print("REVIEWING ALL ACCORDION TITLES")
    print("Checking for redundancy and relevance")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"\nReviewing {len(listings)} listings...")
    print("=" * 80)
    
    issues = []
    duplicates = []
    irrelevant = []
    
    for listing in listings:
        name = listing.get('name', '').strip()
        listing_type = listing.get('type', '').strip()
        
        # Collect all titles for this listing
        titles = []
        title_to_panel = {}
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if title and content:
                titles.append(title)
                title_to_panel[title] = i
        
        # Check for duplicates
        seen_titles = {}
        for title in titles:
            if title in seen_titles:
                duplicates.append({
                    'listing': name,
                    'type': listing_type,
                    'title': title,
                    'panels': [seen_titles[title], title_to_panel[title]]
                })
            else:
                seen_titles[title] = title_to_panel[title]
        
        # Check for irrelevant titles
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if title and content:
                if not is_title_relevant(title, listing_type):
                    irrelevant.append({
                        'listing': name,
                        'type': listing_type,
                        'title': title,
                        'panel': i
                    })
    
    # Report issues
    print(f"\n📊 REVIEW RESULTS:")
    print("=" * 80)
    
    if duplicates:
        print(f"\n⚠️  DUPLICATE TITLES FOUND: {len(duplicates)}")
        for dup in duplicates[:20]:  # Show first 20
            print(f"  - {dup['listing']} ({dup['type']}):")
            print(f"    '{dup['title']}' appears in panels {dup['panels']}")
    else:
        print("\n✅ No duplicate titles found")
    
    if irrelevant:
        print(f"\n⚠️  IRRELEVANT TITLES FOUND: {len(irrelevant)}")
        for irr in irrelevant[:20]:  # Show first 20
            print(f"  - {irr['listing']} ({irr['type']}):")
            print(f"    Panel {irr['panel']}: '{irr['title']}' doesn't make sense for this listing type")
    else:
        print("\n✅ All titles are relevant to their listing types")
    
    print(f"\n{'=' * 80}")
    print(f"Total issues found: {len(duplicates)} duplicates, {len(irrelevant)} irrelevant")
    
    return duplicates, irrelevant

def fix_issues(duplicates, irrelevant):
    """Fix duplicate and irrelevant titles"""
    print("\n" + "=" * 80)
    print("FIXING ISSUES")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    fixed = 0
    
    # Create lookup for issues
    dup_lookup = {}
    for dup in duplicates:
        key = dup['listing']
        if key not in dup_lookup:
            dup_lookup[key] = []
        dup_lookup[key].append(dup)
    
    irr_lookup = {}
    for irr in irrelevant:
        key = irr['listing']
        if key not in irr_lookup:
            irr_lookup[key] = []
        irr_lookup[key].append(irr)
    
    for listing in listings:
        name = listing.get('name', '').strip()
        listing_type = listing.get('type', '').strip()
        
        # Fix duplicates - keep first occurrence, remove or rename others
        if name in dup_lookup:
            for dup in dup_lookup[name]:
                panels = dup['panels']
                # Keep first panel, remove content from duplicate panels
                for panel_num in panels[1:]:  # Skip first one
                    listing[f'accordionPanel{panel_num}Title'] = ''
                    listing[f'accordionPanel{panel_num}Content'] = ''
                    fixed += 1
                    print(f"  ✓ {name}: Removed duplicate '{dup['title']}' from panel {panel_num}")
        
        # Fix irrelevant titles - suggest better ones or remove
        if name in irr_lookup:
            for irr in irr_lookup[name]:
                panel_num = irr['panel']
                content = listing.get(f'accordionPanel{panel_num}Content', '').strip()
                
                if content:
                    # Try to suggest better title
                    better_title = suggest_better_title(irr['title'], listing_type, content)
                    if better_title != irr['title']:
                        listing[f'accordionPanel{panel_num}Title'] = better_title
                        fixed += 1
                        print(f"  ✓ {name}: Changed '{irr['title']}' to '{better_title}'")
                    else:
                        # Remove if can't find better title
                        listing[f'accordionPanel{panel_num}Title'] = ''
                        listing[f'accordionPanel{panel_num}Content'] = ''
                        fixed += 1
                        print(f"  ✓ {name}: Removed irrelevant '{irr['title']}'")
    
    # Reorganize accordions (remove empty ones, compact)
    for listing in listings:
        accordions = []
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            if title and content:
                accordions.append((title, content))
        
        # Clear all
        for i in range(1, 5):
            listing[f'accordionPanel{i}Title'] = ''
            listing[f'accordionPanel{i}Content'] = ''
        
        # Set compacted
        for idx, (title, content) in enumerate(accordions[:4], 1):
            listing[f'accordionPanel{idx}Title'] = title
            listing[f'accordionPanel{idx}Content'] = content
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ FIXES COMPLETE!")
    print(f"   Fixed {fixed} issues")

def main():
    duplicates, irrelevant = review_all_titles()
    
    if duplicates or irrelevant:
        print(f"\n{'=' * 80}")
        response = input("Fix these issues? (y/n): ").strip().lower()
        if response == 'y':
            fix_issues(duplicates, irrelevant)
        else:
            print("\nSkipping fixes. Review complete.")
    else:
        print("\n✅ No issues found! All titles are good.")

if __name__ == '__main__':
    main()
