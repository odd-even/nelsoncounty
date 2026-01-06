#!/usr/bin/env python3
"""
Focused AI rewrite - Only process trails, hikes, biking, fishing, outdoor, and culture listings
Skip listings with minimal content
"""

import csv
import json
import time
import os
import sys
from pathlib import Path

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


def should_process_listing(listing):
    """Determine if listing should be processed"""
    listing_type = listing.get('type', '').strip().lower()
    category = listing.get('category', '').strip().lower()
    name = listing.get('name', '').strip().lower()
    
    # EXCLUDE all housing/rental types
    exclude_types = [
        'cabins & cottages',
        'whole house rentals',
        'bed and breakfast',
        'vacation rentals',
        'rental',
        'cottage',
        'cabin',
        'lodging',
        'accommodation'
    ]
    
    if any(exclude in listing_type for exclude in exclude_types):
        return False, "Housing/rental type - skipped"
    
    # Also exclude by category
    if category in ['stay']:
        return False, "Stay category - skipped"
    
    # Focus types (more specific)
    focus_types = [
        'hikes & trails',
        'activities',
        'fishing'
    ]
    
    # Focus categories
    focus_categories = [
        'outdoor',
        'experience',
        'culture'
    ]
    
    # Keywords in name
    focus_keywords = [
        'trail', 'hike', 'hiking', 'bike', 'biking', 'fishing', 'fisher',
        'river', 'mountain', 'park', 'nature', 'outdoor', 'adventure',
        'museum', 'gallery', 'art', 'history', 'historic', 'cultural',
        'swannanoa', 'soaring', 'skiing', 'snowboarding', 'tennis'
    ]
    
    # Exclude markets/delis unless they have outdoor keywords
    if 'market' in listing_type or 'deli' in listing_type:
        if not any(kw in name for kw in ['fishing', 'outdoor', 'hiking', 'trail']):
            return False, "Market/Deli without outdoor focus"
    
    # Check if type matches
    type_match = any(ft in listing_type for ft in focus_types)
    
    # Check if category matches
    category_match = any(fc in category for fc in focus_categories)
    
    # Check if name has keywords
    name_match = any(keyword in name for keyword in focus_keywords)
    
    # Must match at least one
    if not (type_match or category_match or name_match):
        return False, "Doesn't match focus types"
    
    # Check if has enough content to process
    total_content_length = 0
    accordion_count = 0
    
    for i in range(1, 5):
        title = listing.get(f'accordionPanel{i}Title', '').strip()
        content = listing.get(f'accordionPanel{i}Content', '').strip()
        if title and content:
            accordion_count += 1
            total_content_length += len(content)
    
    # Skip if too little content (already good or empty)
    if accordion_count == 0:
        return False, "No accordions"
    
    if total_content_length < 100:
        return False, "Too little content"
    
    # Skip if already rewritten (content is long and complete)
    if total_content_length > 2000 and accordion_count > 0:
        # Check if content looks already rewritten (long AND has proper sentences)
        avg_length = total_content_length / accordion_count
        if avg_length > 600:
            # Also check for proper sentence structure
            sample_content = listing.get('accordionPanel1Content', '').strip()
            if sample_content and sample_content.count('.') > 3:
                return False, "Already rewritten"
    
    return True, "Ready to process"


def get_prompt_for_accordion(content, title, listing_name, listing_type, description):
    """Create a specialized prompt based on accordion type"""
    
    base_prompt = f"""You are a professional travel and outdoor recreation writer. Rewrite the following accordion content into clear, engaging, and informative prose.

CRITICAL REQUIREMENTS:
- Complete all incomplete sentences (e.g., "roughly 1" → "roughly 1 hour", "One way mileage is 2" → "One way mileage is 2.25 miles")
- Use proper grammar, punctuation, and sentence structure
- Write in flowing, natural prose (NOT question-answer format - convert questions to statements)
- Ensure all measurements include proper units
- Make it read like professional travel writing
- Be specific to this listing, not generic area information
- Maintain all factual information accurately

Listing Name: {listing_name}
Listing Type: {listing_type}
Listing Description: {description[:200] if description else 'N/A'}
Accordion Title: {title}

Original Content:
{content}

Rewrite this content to be professional, complete, engaging, and flowing. Do NOT use question-answer format - write as flowing prose."""

    return base_prompt


def rewrite_with_openai(content, title, listing_name, listing_type, description, api_key):
    """Rewrite content using OpenAI API"""
    client = openai.OpenAI(api_key=api_key)
    
    prompt = get_prompt_for_accordion(content, title, listing_name, listing_type, description)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=2000
        )
        
        rewritten = response.choices[0].message.content.strip()
        return rewritten
    except Exception as e:
        print(f"   ❌ Error with OpenAI: {e}")
        return None


def process_listing(listing, api_key):
    """Process a single listing's accordions"""
    name = listing.get('name', '').strip()
    listing_type = listing.get('type', '').strip()
    description = listing.get('description', '').strip()
    
    print(f"\n📝 Processing: {name} ({listing_type})")
    
    updated = False
    
    for i in range(1, 5):
        title = listing.get(f'accordionPanel{i}Title', '').strip()
        content = listing.get(f'accordionPanel{i}Content', '').strip()
        
        if not title or not content:
            continue
        
        # Skip if already rewritten (long, flowing content)
        # Check if content is already well-written (long AND has proper sentence structure)
        if len(content) > 600 and content.count('.') > 3:
            print(f"   ⏭️  Skipping {title} (already rewritten)")
            continue
        
        print(f"   🔄 Rewriting: {title}")
        
        try:
            rewritten = rewrite_with_openai(content, title, name, listing_type, description, api_key)
            
            if rewritten:
                listing[f'accordionPanel{i}Content'] = rewritten
                updated = True
                print(f"   ✅ Rewritten successfully")
                print(f"      Original: {len(content)} chars → New: {len(rewritten)} chars")
            else:
                print(f"   ⚠️  Failed to rewrite, keeping original")
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
            continue
        
        # Rate limiting
        time.sleep(1)
    
    return updated


def main():
    """Main processing function"""
    print("=" * 80)
    print("FOCUSED AI ACCORDION REWRITE")
    print("Focus: Trails, Hikes, Biking, Fishing, Outdoor, Culture")
    print("=" * 80)
    
    # Get API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        api_key = "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"
    
    if not api_key:
        print("❌ API key required")
        return
    
    # Load CSV
    csv_path = 'CSV/A - to merge- listings-2026-01-02-rewritten.csv'
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    print(f"\n📂 Loading CSV: {csv_path}")
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Filter listings
    print(f"\n🔍 Filtering listings...")
    to_process = []
    skipped = []
    
    for idx, listing in enumerate(listings):
        should_process, reason = should_process_listing(listing)
        if should_process:
            to_process.append((idx, listing))
        else:
            skipped.append((idx, listing.get('name', '').strip(), reason))
    
    print(f"\n📊 Filter Results:")
    print(f"   ✅ To process: {len(to_process)} listings")
    print(f"   ⏭️  Skipped: {len(skipped)} listings")
    
    if len(skipped) > 0:
        print(f"\n⏭️  Skipped listings (first 10):")
        for idx, name, reason in skipped[:10]:
            print(f"   {idx}: {name} - {reason}")
    
    if len(to_process) == 0:
        print("\n✅ No listings to process!")
        return
    
    # Process listings
    print(f"\n{'=' * 80}")
    print(f"Processing {len(to_process)} listings...")
    print(f"{'=' * 80}")
    
    processed = 0
    updated_count = 0
    
    for idx, listing in to_process:
        updated = process_listing(listing, api_key)
        if updated:
            updated_count += 1
        
        processed += 1
        
        # Save every 10 listings
        if processed % 10 == 0:
            print(f"\n💾 Saving progress... ({processed}/{len(to_process)} processed)")
            with open(csv_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
                writer.writeheader()
                writer.writerows(listings)
    
    # Final save
    print(f"\n💾 Saving final results...")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(listings)
    
    print(f"\n{'=' * 80}")
    print(f"✅ PROCESSING COMPLETE!")
    print(f"   Processed: {processed} listings")
    print(f"   Updated: {updated_count} listings")
    print(f"   Skipped: {len(skipped)} listings")
    print(f"{'=' * 80}")


if __name__ == '__main__':
    main()
