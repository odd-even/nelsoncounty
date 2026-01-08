#!/usr/bin/env python3
"""
Fix formulaic openings (Discover/Experience/Nestled) in descriptions
Re-rewrites 60% of them to start more naturally, often with business name
"""

import csv
import json
import time
import os
import sys
import re
import random
from pathlib import Path
from html import unescape

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("⚠️  OpenAI library not installed. Install with: pip install openai")
    sys.exit(1)


def extract_text_from_html(html_content):
    """Extract plain text from HTML content"""
    if not html_content:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html_content)
    text = unescape(text)
    text = ' '.join(text.split())
    return text.strip()


def extract_text_from_vc_row(vc_content):
    """Extract plain text from Visual Composer shortcode content"""
    if not vc_content:
        return ""
    text = re.sub(r'\[/?[^\]]+\]', ' ', vc_content)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = unescape(text)
    text = ' '.join(text.split())
    return text.strip()


def load_donor_csv(donor_path):
    """Load donor CSV into a slug-to-content map"""
    donor_data = {}
    
    if not os.path.exists(donor_path):
        print(f"⚠️  Donor CSV not found: {donor_path}")
        return donor_data
    
    print(f"📖 Loading donor CSV: {donor_path}")
    
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('Slug', '').strip().lower()
            if slug:
                content = row.get('Content', '').strip()
                excerpt = row.get('Excerpt', '').strip()
                nectar_extra = row.get('_nectar_portfolio_extra_content', '').strip()
                nectar_preview = row.get('_nectar_portfolio_extra_content_preview', '').strip()
                nectar_excerpt = row.get('_nectar_project_excerpt', '').strip()
                
                content_text = extract_text_from_html(content) if content else ""
                excerpt_text = extract_text_from_html(excerpt) if excerpt else ""
                nectar_extra_text = extract_text_from_vc_row(nectar_extra) if nectar_extra else ""
                nectar_preview_text = extract_text_from_vc_row(nectar_preview) if nectar_preview else ""
                nectar_excerpt_text = nectar_excerpt if nectar_excerpt else ""
                
                parts = []
                if nectar_extra_text:
                    parts.append(nectar_extra_text)
                if nectar_preview_text and len(nectar_preview_text) > len(nectar_extra_text):
                    parts.append(nectar_preview_text)
                if nectar_excerpt_text:
                    parts.append(nectar_excerpt_text)
                if excerpt_text:
                    parts.append(excerpt_text)
                if content_text and len(content_text) > 50:
                    parts.append(content_text)
                
                full_content = ' '.join(parts).strip()
                donor_data[slug] = full_content
    
    print(f"✅ Loaded {len(donor_data)} entries from donor CSV")
    return donor_data


def rewrite_with_natural_opening(current_description, donor_content, listing_name, listing_type, api_key):
    """
    Rewrite description to avoid formulaic openings and start more naturally
    """
    client = openai.OpenAI(api_key=api_key)
    
    donor_text = donor_content if donor_content else ""
    if len(donor_text) > 3000:
        donor_text = donor_text[:3000] + "..."
    
    prompt = f"""Rewrite the description for "{listing_name}" (a {listing_type}) to remove the formulaic opening and make it more natural.

Current description (has formulaic opening):
{current_description}

Source material from donor CSV:
{donor_text if donor_text else "No source material available."}

Requirements:
- Remove formulaic openings like "Discover", "Experience", "Nestled", "Welcome to", etc.
- PREFER starting with the business/place name when natural: "{listing_name} is..." or "{listing_name} offers..."
- Alternative natural openings: location, what it is, what it offers, or a direct factual statement
- Keep it compact: 150-300 characters (2-4 sentences)
- Maintain all important factual information
- Make it natural and human-sounding, not AI-generated
- Use varied sentence structures and openings

Rewritten description (natural opening, no formulaic phrases):"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional copywriter who writes natural, human-sounding descriptions without formulaic AI phrases. You prefer starting with business names or direct statements."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=500
        )
        
        rewritten = response.choices[0].message.content.strip()
        return rewritten
    except Exception as e:
        print(f"   ❌ Error calling ChatGPT: {e}")
        return current_description


def main():
    csv_path = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor.csv'
    donor_path = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        sys.exit(1)
    
    # Get API key from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  OPENAI_API_KEY not found in environment.")
        api_key = input("Enter your ChatGPT API key: ").strip()
        if not api_key:
            print("❌ API key required")
            sys.exit(1)
    
    # Load donor CSV
    donor_data = load_donor_csv(donor_path)
    
    print(f"\n📖 Loading CSV: {csv_path}")
    
    # Load CSV
    listings = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Find formulaic descriptions
    print("\n🔍 Finding formulaic descriptions...")
    formulaic = []
    
    for listing in listings:
        desc = listing.get('description', '').strip()
        if desc.lower().startswith(('discover', 'experience', 'nestled', 'welcome to')):
            formulaic.append(listing)
    
    print(f"\n📊 Found {len(formulaic)} formulaic descriptions")
    
    # Select 60% to fix
    target_count = int(len(formulaic) * 0.6)
    to_fix = random.sample(formulaic, min(target_count, len(formulaic)))
    
    print(f"🎯 Will fix {len(to_fix)} descriptions (60%)")
    
    # Show examples
    print("\n📋 Examples to fix:")
    for i, listing in enumerate(to_fix[:5], 1):
        name = listing.get('name', 'Unknown')
        desc = listing.get('description', '')
        print(f"\n{i}. {name}")
        print(f"   Current: {desc[:120]}...")
    
    # Create set of slugs to fix
    fix_slugs = {listing.get('slug', '').strip().lower() for listing in to_fix}
    
    # Auto-proceed
    print(f"\n⚠️  Ready to rewrite {len(to_fix)} descriptions")
    print("   Proceeding automatically...")
    
    # Rewrite formulaic descriptions
    print(f"\n🔄 Rewriting {len(to_fix)} descriptions...")
    
    output_path = csv_path.replace('.csv', '-natural-openings.csv')
    
    rewritten_count = 0
    
    with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for listing in listings:
            description = listing.get('description', '').strip()
            name = listing.get('name', 'Unknown')
            listing_type = listing.get('type', '')
            slug = listing.get('slug', '').strip().lower()
            
            # Rewrite if in the fix list
            if slug in fix_slugs:
                print(f"\n   🔄 Rewriting: {name}")
                print(f"      Current: {description[:80]}...")
                
                # Get donor content
                donor_content = donor_data.get(slug, '')
                
                # Rewrite with natural opening
                rewritten = rewrite_with_natural_opening(
                    description,
                    donor_content,
                    name,
                    listing_type,
                    api_key
                )
                
                listing['description'] = rewritten
                rewritten_count += 1
                
                print(f"      ✅ Rewritten ({len(description)} → {len(rewritten)} chars)")
                print(f"      New opening: {rewritten[:80]}...")
                
                # Rate limiting
                time.sleep(1)
            
            writer.writerow(listing)
    
    print(f"\n✅ Complete!")
    print(f"   Rewritten: {rewritten_count} descriptions")
    print(f"   Kept original: {len(listings) - rewritten_count} descriptions")
    print(f"   Output file: {output_path}")


if __name__ == '__main__':
    main()
