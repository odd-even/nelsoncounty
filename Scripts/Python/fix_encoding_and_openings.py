#!/usr/bin/env python3
"""
Fix encoding issues for Google Sheets compatibility and remove repetitive openings
- Simplifies encoding to be Google Sheets compatible
- Fixes repetitive openings like "Escape to", "Discover", etc.
"""

import csv
import sys
import os
import re
import time
import unicodedata
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


def simplify_for_google_sheets(text):
    """
    Simplify text encoding for Google Sheets compatibility
    Google Sheets handles UTF-8 well, but we need to fix mis-encoded sequences
    """
    if not text:
        return text
    
    # Fix mis-encoded sequences (these are the real problems)
    char_map = {
        'Äô': "'",
        'â€™': "'",
        'â€œ': '"',
        'â€\x9d': '"',
        'â€"': '-',  # Em dash to regular dash for simplicity
        'â€"': '-',  # En dash to regular dash
        'â€¦': '...',  # Ellipsis to three dots
    }
    
    # Apply fixes
    for bad, good in char_map.items():
        text = text.replace(bad, good)
    
    # Fix HTML entities
    try:
        text = unescape(text)
    except:
        pass
    
    # Normalize Unicode - use NFC to preserve accented characters properly
    # Google Sheets supports UTF-8, so é, café, etc. will work fine
    text = unicodedata.normalize('NFC', text)
    
    # Remove control characters (but keep accented chars like é)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Ensure valid UTF-8 (this preserves accented characters)
    try:
        text = text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    except:
        pass
    
    # Remove replacement characters
    text = text.replace('\ufffd', '')
    
    return text


def rewrite_repetitive_opening(current_description, listing_name, listing_type, api_key):
    """
    Rewrite description to remove repetitive openings like "Escape to"
    """
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""Rewrite the description for "{listing_name}" (a {listing_type}) to remove the repetitive opening phrase and make it more natural and varied.

Current description:
{current_description}

Requirements:
- Remove repetitive openings like "Escape to", "Discover", "Experience", "Nestled", "Welcome to"
- PREFER starting with the business/place name: "{listing_name} is..." or "{listing_name} offers..."
- Alternative natural openings: location, what it is, what it offers, or a direct factual statement
- Keep it compact: 150-300 characters (2-4 sentences)
- Maintain all important factual information
- Make it natural and human-sounding, not formulaic
- Use varied sentence structures

Rewritten description (natural opening, no repetitive phrases):"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional copywriter who writes natural, varied descriptions without repetitive formulaic phrases. You prefer starting with business names or direct statements."},
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
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL.csv'
    output_file = input_file.replace('.csv', '-google-sheets-ready.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    # Get API key from environment
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  OPENAI_API_KEY not found in environment.")
        api_key = input("Enter your ChatGPT API key: ").strip()
        if not api_key:
            print("❌ API key required")
            sys.exit(1)
    
    print(f"📖 Reading CSV: {input_file}")
    
    rows = []
    fieldnames = None
    
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ No headers found in CSV")
            return False
        
        print(f"✅ Found {len(fieldnames)} columns")
        
        # Text fields to fix
        text_fields = [
            'description', 'detailedDescription', 'customHtml',
            'accordionPanel1Content', 'accordionPanel2Content',
            'accordionPanel3Content', 'accordionPanel4Content',
            'accordionPanel1Title', 'accordionPanel2Title',
            'accordionPanel3Title', 'accordionPanel4Title',
            'image1Desc', 'image2Desc', 'image3Desc', 'name', 'address'
        ]
        
        # Find repetitive openings
        repetitive = []
        
        for i, row in enumerate(reader, 2):
            desc = row.get('description', '').strip()
            name = row.get('name', 'Unknown')
            
            # Check for repetitive openings
            desc_lower = desc.lower()
            if desc_lower.startswith(('escape to', 'discover', 'experience', 'nestled', 'welcome to')):
                repetitive.append({
                    'row': row,
                    'name': name,
                    'description': desc
                })
            
            # Fix encoding in all text fields
            for field in text_fields:
                if field in fieldnames:
                    value = row.get(field, '')
                    if value:
                        row[field] = simplify_for_google_sheets(value)
            
            rows.append(row)
    
    print(f"✅ Processed {len(rows)} rows")
    print(f"📊 Found {len(repetitive)} descriptions with repetitive openings")
    
    # Show examples
    if repetitive:
        print("\n📋 Examples of repetitive openings:")
        for item in repetitive[:5]:
            print(f"  {item['name']}: {item['description'][:80]}...")
    
    # Check if output file exists to resume (before processing)
    existing_slugs = set()
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                existing_slugs = set(row.get('slug', '').strip().lower() for row in reader if row.get('slug', '').strip())
            if existing_slugs:
                print(f"   📋 Found existing output with {len(existing_slugs)} listings - will skip those")
        except:
            pass
    
    # Auto-proceed to fix repetitive openings
    if repetitive:
        print(f"\n⚠️  Ready to fix {len(repetitive)} repetitive openings")
        print("   Proceeding automatically...")
        
        # Fix repetitive openings
        print(f"\n🔄 Fixing {len(repetitive)} repetitive openings...")
        
        fixed_count = 0
        repetitive_slugs = {item['row'].get('slug', '').strip().lower() for item in repetitive}
        
        for row in rows:
            slug = row.get('slug', '').strip().lower()
            if slug in repetitive_slugs:
                # Skip if already processed
                if slug in existing_slugs:
                    continue
                
                name = row.get('name', 'Unknown')
                listing_type = row.get('type', '')
                desc = row.get('description', '').strip()
                
                print(f"\n   🔄 Fixing: {name}")
                print(f"      Current: {desc[:80]}...")
                
                rewritten = rewrite_repetitive_opening(desc, name, listing_type, api_key)
                row['description'] = rewritten
                fixed_count += 1
                
                print(f"      ✅ Rewritten ({len(desc)} → {len(rewritten)} chars)")
                print(f"      New opening: {rewritten[:80]}...")
                
                time.sleep(1)
        
        print(f"\n✅ Fixed {fixed_count} repetitive openings")
    
    # Write fixed CSV (append if resuming, otherwise write)
    mode = 'a' if existing_slugs and os.path.exists(output_file) else 'w'
    
    print(f"\n💾 Writing Google Sheets-compatible CSV: {output_file}")
    
    with open(output_file, mode, encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(
            f, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_MINIMAL
        )
        
        # Only write header if starting fresh
        if mode == 'w':
            writer.writeheader()
        
        for row in rows:
            slug = row.get('slug', '').strip().lower()
            # Skip if already written
            if slug in existing_slugs:
                continue
            writer.writerow(row)
    
    print(f"✅ Fixed CSV written successfully")
    print(f"\n📋 This file:")
    print(f"   - Google Sheets compatible encoding")
    print(f"   - Fixed repetitive openings")
    print(f"   - Proper CSV escaping")
    
    return True


if __name__ == '__main__':
    main()
