#!/usr/bin/env python3
"""
Fix nonsensical information in newly added listings
Reads from donor source and fixes incomplete, duplicate, or problematic descriptions
"""

import csv
import re
import sys
import os
import json
from datetime import datetime

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    import openai
except ImportError:
    print("❌ openai package not found. Install with: pip install openai")
    sys.exit(1)


def get_api_key():
    """Get OpenAI API key from environment"""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY not found in environment")
        return None
    return api_key


def load_donor_csv(donor_path):
    """Load donor CSV and index by name/slug"""
    donor_listings = {}
    
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('Title') or row.get('title') or row.get('Name') or row.get('name', '')
            slug = row.get('Slug') or row.get('slug', '')
            permalink = row.get('Permalink', '')
            
            if name:
                donor_listings[name] = row
            if slug:
                donor_listings[slug] = row
            # Extract slug from permalink if needed
            if permalink and 'explore/' in permalink:
                slug_from_url = permalink.split('explore/')[-1].split('/')[0]
                if slug_from_url:
                    donor_listings[slug_from_url] = row
    
    return donor_listings


def extract_text_from_nectar(nectar_content):
    """Extract readable text from nectar VC shortcodes"""
    if not nectar_content:
        return ''
    
    # Remove all VC shortcodes
    cleaned = re.sub(r'\[vc_[^\]]+\]', '', nectar_content, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[/?[a-z]+_[^\]]+\]', '', cleaned, flags=re.IGNORECASE)
    
    # Remove HTML tags but preserve text
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    
    # Decode HTML entities
    cleaned = cleaned.replace('&amp;', '&')
    cleaned = cleaned.replace('&lt;', '<')
    cleaned = cleaned.replace('&gt;', '>')
    cleaned = cleaned.replace('&quot;', '"')
    cleaned = cleaned.replace('&nbsp;', ' ')
    
    # Normalize whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = cleaned.strip()
    
    return cleaned


def fix_description_with_ai(listing, donor_content, api_key):
    """Use AI to fix incomplete or problematic descriptions"""
    if not api_key:
        return None, None
    
    client = openai.OpenAI(api_key=api_key)
    
    name = listing.get('name', 'Unknown')
    current_desc = listing.get('description', '')
    current_detailed = listing.get('detailedDescription', '')
    
    # Get donor content
    donor_desc = ''
    donor_nectar = ''
    if donor_content:
        donor_desc = donor_content.get('description', '')
        donor_nectar = extract_text_from_nectar(donor_content.get('nectar_content', ''))
    
    context = f"""You are fixing a listing description for a tourism website.

Listing Name: {name}
Type: {listing.get('type', '')}
Area: {listing.get('area', '')}

Current Description: {current_desc}

Current Detailed Description: {current_detailed if current_detailed else '(empty)'}

Original Donor Description: {donor_desc[:1000] if donor_desc else '(not available)'}

Original Donor Nectar Content (extracted text): {donor_nectar[:1000] if donor_nectar else '(not available)'}

Please:
1. Create a complete, engaging description (2-3 sentences) that doesn't cut off mid-sentence
2. If the current description is incomplete, use the donor content to complete it
3. Remove any duplicate text
4. Fix grammatical errors
5. Create a detailedDescription if there's additional valuable information in the donor content, otherwise leave it empty
6. Ensure descriptions are natural and readable

Respond in JSON:
{{
    "description": "complete fixed description",
    "detailedDescription": "detailed description or empty string if no additional info",
    "changes_made": ["change1", "change2"]
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a content editor fixing incomplete or problematic listing descriptions for a tourism website."},
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result.get('description', ''), result.get('detailedDescription', '')
    except Exception as e:
        print(f"   ⚠️  AI fix error: {e}")
        return None, None


def fix_duplicate_text(text):
    """Remove duplicate sentences/phrases"""
    if not text:
        return text
    
    sentences = re.split(r'[.!?]\s+', text)
    seen = set()
    unique_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        # Normalize for comparison (lowercase, remove extra spaces)
        normalized = re.sub(r'\s+', ' ', sentence.lower())
        if normalized not in seen:
            seen.add(normalized)
            unique_sentences.append(sentence)
    
    # Rejoin with periods
    return '. '.join(unique_sentences) + ('.' if text.rstrip().endswith('.') else '')


def fix_grammar_errors(text):
    """Fix common grammatical errors"""
    if not text:
        return text
    
    # Fix common errors found in the report
    fixes = [
        (r'\bIf you looking\b', 'If you are looking'),
        (r'\bproudly serve\b', 'proudly serves'),  # Subject-verb agreement
        (r'\s+\.\.\.\s*$', ''),  # Remove trailing ellipsis
    ]
    
    for pattern, replacement in fixes:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    return text


def main():
    api_key = get_api_key()
    if not api_key:
        print("❌ Cannot proceed without API key")
        sys.exit(1)
    
    # File paths
    input_csv = 'CSV/jan12listings-2026-01-12-3-cleaned.csv'
    donor_csv = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    output_csv = input_csv.replace('.csv', '-fixed-nonsensical.csv')
    report_file = 'CSV/NONSENSICAL_FIXES_REPORT.txt'
    
    # Newly added listings
    new_listings = [
        "Rapunzel's Coffee & Books", "Sweet Bliss Bakery", "Terrace Café",
        "Blue Mountain Brewery", "Big Tiny House", "Cottage at Pines End",
        "Retreat at Crabtree Falls", "Inn at Blue Mountain Brewery",
        "Carriage House at Stagebridge Farm", "Wine Cottage",
        "Blue Ridge Farm and Wedding Venue", "Castor Cabin",
        "Lewis Catherine House", "Mountain House INN",
        "Haven at Devils Backbone Camp", "Branch at Afton Mountain Retreat",
        "Bungalow at Afton Mountain Retreat", "HeartRock Retreat & Homestead",
        "Wooder House", "Ash House at Holland Hill", "Afton House",
        "LITTLE FARMHOUSE", "Fairway Chalet", "Cottage at River Circle Farm",
        "Retreat at Three Ridges", "Brown Bear Lodge", "Treetops Lodge",
        "Ski House", "View at Crawfords Edge", "Goldfinch",
        "Celadon Acres Farm", "A. Bryant Family Farm", "Heart of Nelson",
        "Afton Peak"
    ]
    
    print("📖 Loading CSVs...")
    
    # Load cleaned listings
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        all_listings = list(reader)
    
    # Load donor
    donor_listings = load_donor_csv(donor_csv)
    
    print(f"✅ Loaded {len(all_listings)} listings")
    print(f"✅ Loaded {len(donor_listings)} donor listings")
    print()
    
    # Find listings to fix
    listings_to_fix = []
    for listing in all_listings:
        if listing.get('name') in new_listings:
            listings_to_fix.append(listing)
    
    print(f"🔧 Fixing {len(listings_to_fix)} newly added listings...")
    print()
    
    fixes_made = []
    
    for i, listing in enumerate(listings_to_fix, 1):
        name = listing.get('name', 'Unknown')
        slug = listing.get('slug', '')
        original_desc = listing.get('description', '')
        original_detailed = listing.get('detailedDescription', '')
        
        print(f"[{i}/{len(listings_to_fix)}] Fixing: {name}")
        
        # Get donor content
        donor_content = None
        donor_row = donor_listings.get(name) or donor_listings.get(slug)
        if donor_row:
            donor_content = {
                'description': donor_row.get('Description', '') or donor_row.get('description', ''),
                'nectar_content': donor_row.get('_nectar_portfolio_extra_content', '') or donor_row.get('_nectar_portfolio_extra_content_preview', '')
            }
        
        # Apply quick fixes first
        fixed_desc = fix_duplicate_text(original_desc)
        fixed_desc = fix_grammar_errors(fixed_desc)
        fixed_detailed = original_detailed
        
        # Use AI to fix if still problematic
        needs_ai_fix = False
        
        # Check if description is incomplete (ends with ... or very short)
        if fixed_desc and (fixed_desc.rstrip().endswith('...') or len(fixed_desc.strip()) < 80):
            needs_ai_fix = True
        
        # Check for grammatical errors
        if re.search(r'\bIf you looking\b', fixed_desc, re.IGNORECASE):
            needs_ai_fix = True
        
        if needs_ai_fix:
            print(f"   🤖 Using AI to fix...")
            ai_desc, ai_detailed = fix_description_with_ai(listing, donor_content, api_key)
            if ai_desc:
                fixed_desc = ai_desc
            if ai_detailed is not None:
                fixed_detailed = ai_detailed
        
        # Update listing
        changes = []
        if fixed_desc != original_desc:
            listing['description'] = fixed_desc
            changes.append('description')
        if fixed_detailed != original_detailed:
            listing['detailedDescription'] = fixed_detailed
            changes.append('detailedDescription')
        
        if changes:
            fixes_made.append({
                'name': name,
                'slug': slug,
                'fields': changes,
                'desc_before': original_desc[:200],
                'desc_after': fixed_desc[:200],
                'detailed_before': original_detailed[:200] if original_detailed else '',
                'detailed_after': fixed_detailed[:200] if fixed_detailed else ''
            })
            print(f"   ✅ Fixed: {', '.join(changes)}")
        else:
            print(f"   ℹ️  No changes needed")
        
        print()
    
    # Write fixed CSV
    print(f"💾 Writing fixed CSV to: {output_csv}")
    with open(output_csv, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(all_listings)
    
    print(f"✅ Fixed CSV saved")
    print()
    
    # Write report
    print(f"📝 Writing fix report to: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as report:
        report.write("=" * 70 + "\n")
        report.write("NONSENSICAL INFORMATION FIXES REPORT\n")
        report.write("=" * 70 + "\n\n")
        report.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.write(f"Listings fixed: {len(fixes_made)}\n\n")
        
        if fixes_made:
            report.write("LISTINGS FIXED:\n")
            report.write("-" * 70 + "\n\n")
            
            for item in fixes_made:
                report.write(f"{item['name']} ({item['slug']})\n")
                report.write("-" * 70 + "\n")
                report.write(f"Fields fixed: {', '.join(item['fields'])}\n\n")
                
                if 'description' in item['fields']:
                    report.write("DESCRIPTION:\n")
                    report.write(f"Before: {item['desc_before']}...\n")
                    report.write(f"After:  {item['desc_after']}...\n\n")
                
                if 'detailedDescription' in item['fields']:
                    report.write("DETAILED DESCRIPTION:\n")
                    report.write(f"Before: {item['detailed_before']}...\n")
                    report.write(f"After:  {item['detailed_after']}...\n\n")
                
                report.write("=" * 70 + "\n\n")
        else:
            report.write("No fixes needed - all listings were already good!\n")
    
    print("=" * 70)
    print("✅ FIXES COMPLETE!")
    print("=" * 70)
    print(f"   - Fixed CSV: {output_csv}")
    print(f"   - Report: {report_file}")
    print(f"   - Listings fixed: {len(fixes_made)}")


if __name__ == '__main__':
    main()
