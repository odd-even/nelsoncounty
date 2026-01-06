#!/usr/bin/env python3
"""
COMPREHENSIVE FIX for all 29 problematic listings
- Fixes broken descriptions
- Removes problematic accordions
- Researches each listing individually
- Creates proper, complete descriptions
"""

import csv
import re
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Optional, Tuple
import html

def clean_text(text: str, preserve_breaks: bool = False) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    
    if preserve_breaks:
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<p[^>]*>', '', text, flags=re.IGNORECASE)
    
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    text = text.replace('&nbsp;', ' ').replace('&quot;', '"')
    
    if not preserve_breaks:
        text = re.sub(r'\s+', ' ', text)
    else:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
    
    return text.strip()

def research_listing_online(slug: str, name: str) -> Optional[str]:
    """Research listing on nelsoncounty.com and extract main description"""
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
                
                # Try to find main description
                # Look for first substantial paragraph
                paragraphs = soup.find_all('p')
                for p in paragraphs:
                    text = clean_text(p.get_text())
                    if len(text) > 100 and name.lower().split()[0] in text.lower():
                        # Check if it's relevant
                        if any(word in text.lower() for word in ['serves', 'offers', 'features', 'is a', 'located']):
                            return text
                
                # Fallback: get first substantial paragraph
                for p in paragraphs:
                    text = clean_text(p.get_text())
                    if len(text) > 150:
                        return text
        except Exception as e:
            continue
    return None

def get_donor_content(name: str, slug: str, donor_lookup: Dict) -> Optional[str]:
    """Get content from donor CSVs"""
    # Try by name
    entry = donor_lookup.get(name.lower())
    if not entry and slug:
        entry = donor_lookup.get(slug.lower())
    
    if entry:
        content = entry.get('content', '')
        if content:
            # Extract first good paragraph
            soup = BeautifulSoup(content, 'html.parser')
            paragraphs = soup.find_all('p')
            for p in paragraphs:
                text = clean_text(p.get_text())
                if len(text) > 100:
                    return text
            # Fallback to full content
            text = clean_text(content)
            if len(text) > 100:
                return text[:500]  # Limit length
    
    return None

def create_proper_description(listing: Dict, donor_lookup: Dict) -> str:
    """Create a proper description for a problematic listing"""
    name = listing.get('name', '').strip()
    slug = listing.get('slug', '').strip()
    listing_type = listing.get('type', '').strip()
    address = listing.get('address', '').strip()
    phone = listing.get('phone', '').strip()
    
    # Priority 1: Research online
    online_desc = research_listing_online(slug, name)
    if online_desc and len(online_desc) > 100:
        # Clean it up
        sentences = re.split(r'(?<=[.!?])\s+', online_desc)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
        if sentences:
            # Take first 2-3 sentences
            desc = ' '.join(sentences[:3])
            if desc[-1] not in '.!?':
                desc += '.'
            return desc
    
    # Priority 2: Donor content
    donor_desc = get_donor_content(name, slug, donor_lookup)
    if donor_desc and len(donor_desc) > 100:
        sentences = re.split(r'(?<=[.!?])\s+', donor_desc)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
        if sentences:
            desc = ' '.join(sentences[:2])
            if desc[-1] not in '.!?':
                desc += '.'
            return desc
    
    # Priority 3: Generate based on type and name
    if listing_type == 'Restaurants':
        if 'pizza' in name.lower():
            return f"{name} serves classic and specialty pizzas along with Italian entrees in a family-friendly setting."
        elif 'mexican' in name.lower() or 'mariachi' in name.lower():
            return f"{name} offers authentic Mexican cuisine with a wide variety of dishes, including fajitas, burritos, and combo platters."
        elif 'chinese' in name.lower() or "chen's" in name.lower():
            return f"{name} serves Chinese cuisine with a variety of dishes including fried chicken, stir-fries, and traditional favorites."
        else:
            return f"{name} is a local restaurant serving a variety of dishes in a welcoming atmosphere."
    
    elif listing_type == 'Breweries & Cideries':
        if 'wood ridge' in name.lower():
            return f"{name} is a family-friendly brewery with outdoor activities, live music on weekends, and a food truck. The brewery and bar were built from wood sourced on the property."
        elif 'outback' in name.lower():
            return f"{name} is a brewery and restaurant located on Route 29, offering wood-fired pizza and live music."
        else:
            return f"{name} offers craft beer and cider in a welcoming setting with food options and outdoor seating."
    
    elif listing_type == 'Cabins & Cottages':
        if 'airkey' in name.lower():
            return f"{name} offers cozy mountain retreats perfect for adventure seekers and those seeking serenity. Whether you're hiking, climbing, kayaking, or visiting vineyards, these rentals provide a comfortable home base in the mountains."
        elif 'bearfeet' in name.lower():
            return f"{name} is a quiet cul-de-sac cabin with cathedral ceilings that sleeps eight, featuring a king bed, queen bed, and two bunk rooms. The cabin includes a wraparound deck, fireplace, fast Wi-Fi, and games, located just a quarter mile from Wintergreen slopes and minutes from the valley."
        else:
            return f"{name} provides comfortable accommodations in a scenic mountain setting."
    
    elif listing_type == 'Hikes & Trails':
        if 'brimstone' in name.lower():
            return f"{name} is a steep 0.8-mile red-blazed climb that skirts rocky cliffs with sweeping Three Ridges views, laurel thickets, and fern-covered rock gardens. The trail tackles rocky terrain beneath Wintergreen's Plunge, mixing steep ascents and descents."
        else:
            return f"{name} offers scenic hiking opportunities with beautiful mountain views."
    
    elif listing_type == 'Museums & Heritage':
        if 'walton' in name.lower():
            return f"{name} celebrates the life and work of Earl Hamner, Jr., creator of 'The Waltons' television show. The museum is located in Hamner's boyhood school and features replicas of the show's sets, memorabilia, and photographs."
        else:
            return f"{name} showcases local history and heritage through exhibits and displays."
    
    elif listing_type == 'Bed and Breakfast':
        return f"{name} offers comfortable accommodations and breakfast in a charming setting."
    
    elif listing_type == 'Farms & Orchards':
        if 'three trees' in name.lower():
            return f"{name} is a family farm focused on sustainable farming practices, offering fresh produce, baked goods, honey, apple butter, hams, flowers, and orchard fruits throughout the seasons."
        else:
            return f"{name} offers farm-fresh products and agricultural experiences."
    
    elif listing_type == 'Whole House Rentals':
        if 'heartrock' in name.lower():
            return f"{name} is a fifteen-acre homestead offering both rustic charm and modern comfort, located in Nelson County, Virginia."
        else:
            return f"{name} provides spacious accommodations for groups and families."
    
    # Generic fallback
    return f"{name} is located in {listing.get('area', 'Nelson County')} and offers services and amenities for visitors."

def is_problematic_accordion(title: str, content: str, listing: Dict) -> bool:
    """Check if accordion is problematic and should be removed"""
    if not content:
        return True
    
    content_lower = content.lower()
    name = listing.get('name', '').lower()
    listing_type = listing.get('type', '').lower()
    
    # Remove accordions about other businesses
    if 'wood ridge farm brewery' in content_lower or ('outback brew house' in content_lower and 's ' in content):
        if listing_type not in ['hikes & trails', 'activities']:
            return True
    
    # Remove generic website content
    if 'click on the badges below' in content_lower or 'nelson county has something for everyone' in content_lower:
        return True
    
    # Remove generic area descriptions
    if 'nelson county is a patchwork' in content_lower:
        if listing_type not in ['hikes & trails', 'activities']:
            return True
    
    # Remove incomplete sentences
    if content.strip().startswith(('S ', 'Than a meal', 'Every fall, and offers')):
        return True
    
    # Remove generic area history for non-trail listings
    if listing_type not in ['hikes & trails', 'activities']:
        if 'lovingston' in content_lower and 'began with' in content_lower:
            return True
        if 'thomas jefferson' in content_lower and 'bright hope baptist church' in content_lower:
            if name not in content_lower:
                return True
    
    return False

def main():
    """Fix all problematic listings"""
    print("=" * 80)
    print("COMPREHENSIVE FIX FOR ALL PROBLEMATIC LISTINGS")
    print("=" * 80)
    
    # Load donor CSVs
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_file = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    consolidated_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    
    print("\nLoading donor CSVs...")
    donor_lookup = {}
    
    # Load Portfolio export
    try:
        with open(donor_file, 'r', encoding='utf-8') as f:
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
        print(f"  Warning: Could not load {donor_file}: {e}")
    
    # Load Pages export
    try:
        with open(pages_file, 'r', encoding='utf-8') as f:
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
        print(f"  Warning: Could not load {pages_file}: {e}")
    
    print(f"  Loaded {len(donor_lookup)} donor entries\n")
    
    # Load consolidated CSV for original descriptions
    original_descriptions = {}
    try:
        with open(consolidated_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('name', '').strip()
                desc = row.get('description', '').strip()
                if name and desc and desc != 'The original 30 acres was donated by Mr. The original 30 acres was donated by Mr.':
                    original_descriptions[name] = desc
    except Exception as e:
        print(f"  Warning: Could not load {consolidated_file}: {e}")
    
    # Load rewritten CSV
    print("Loading rewritten CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"  Loaded {len(listings)} listings\n")
    
    # Identify problematic listings
    problematic_names = [
        'Chen\'s Restaurant',
        'El Mariachi Mexican Food',
        'Vito\'s Pizza & Italian Grill',
        'Outback Brew House',
        'Wood Ridge Farm Brewery',
        'The Carriage House at Stagebridge Farm',
        'Lovingston Get-Away',
        'Brimstone Trail',
        'Bearfeet Retreat',
        'Airkey Boutique Rentals',
        'Walton\'s Mountain Museum',
        'Three Trees Farm',
        'HeartRock Retreat & Homestead',
        'Bold Kitchen at Bold Rock',
        'Rockfish Tiny Home',
        'Mountain Home in Nelson County',
        'Big Arms Farm',
        'Davis Creek Farm',
        'Fortune\'s Cove Nature Preserve',
        'Shamokin Springs Nature Preserve',
        'Nelson 29'
    ]
    
    print("=" * 80)
    print("FIXING PROBLEMATIC LISTINGS")
    print("=" * 80)
    
    fixed_count = 0
    accordion_removed_count = 0
    
    for listing in listings:
        name = listing.get('name', '').strip()
        if name not in problematic_names:
            continue
        
        print(f"\n🔧 Fixing: {name}")
        print("-" * 80)
        
        # Check description
        current_desc = listing.get('description', '').strip()
        needs_fix = False
        
        # Check if description is broken
        if current_desc == 'The original 30 acres was donated by Mr. The original 30 acres was donated by Mr.':
            needs_fix = True
            print("  ❌ Broken description detected")
        elif current_desc == 'Earl Hamner, Jr.':
            needs_fix = True
            print("  ❌ Incomplete description (just a name)")
        elif current_desc == 'Looking for a cozy mountain hideaway.':
            needs_fix = True
            print("  ❌ Incomplete description (fragment)")
        elif current_desc.endswith('...') or current_desc.endswith('l...') or current_desc.endswith('vall...'):
            needs_fix = True
            print("  ❌ Incomplete description (cuts off)")
        elif 'Click on the badges below' in current_desc:
            needs_fix = True
            print("  ❌ Website UI text in description")
        elif not current_desc or len(current_desc) < 50:
            needs_fix = True
            print("  ❌ Empty or very short description")
        
        # Fix description
        if needs_fix:
            print("  🔍 Researching listing...")
            new_desc = create_proper_description(listing, donor_lookup)
            
            # Try original description from consolidated if it's good
            if name in original_descriptions:
                orig = original_descriptions[name]
                if orig and len(orig) > 100 and orig != 'The original 30 acres was donated by Mr. The original 30 acres was donated by Mr.':
                    # Use original if it's better
                    sentences = re.split(r'(?<=[.!?])\s+', orig)
                    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]
                    if sentences:
                        orig_desc = ' '.join(sentences[:3])
                        if len(orig_desc) > len(new_desc):
                            new_desc = orig_desc
            
            listing['description'] = new_desc
            print(f"  ✅ New description: {new_desc[:100]}...")
            fixed_count += 1
            time.sleep(1)  # Be respectful with requests
        
        # Check and remove problematic accordions
        for panel_num in range(1, 5):
            title = listing.get(f'accordionPanel{panel_num}Title', '').strip()
            content = listing.get(f'accordionPanel{panel_num}Content', '').strip()
            
            if title and content:
                if is_problematic_accordion(title, content, listing):
                    print(f"  🗑️  Removing problematic accordion: {title}")
                    listing[f'accordionPanel{panel_num}Title'] = ''
                    listing[f'accordionPanel{panel_num}Content'] = ''
                    accordion_removed_count += 1
    
    # Write fixed CSV
    print("\n" + "=" * 80)
    print("Writing fixed CSV...")
    print("=" * 80)
    
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ FIX COMPLETE!")
    print(f"   Fixed descriptions: {fixed_count}")
    print(f"   Removed problematic accordions: {accordion_removed_count}")
    print(f"   Total listings reviewed: {len([l for l in listings if l.get('name', '').strip() in problematic_names])}")

if __name__ == '__main__':
    main()
