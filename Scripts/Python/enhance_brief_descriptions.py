#!/usr/bin/env python3
"""
Enhance brief/unhelpful descriptions by comparing with donor CSV
Uses ChatGPT to expand descriptions with more helpful information
"""

import csv
import json
import time
import os
import sys
import re
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
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)
    # Decode HTML entities
    text = unescape(text)
    # Clean up whitespace
    text = ' '.join(text.split())
    return text.strip()


def is_too_brief(description):
    """
    Check if description is too brief or unhelpful
    """
    if not description or len(description.strip()) < 50:
        return True
    
    desc = description.strip()
    
    # Very short descriptions
    if len(desc) < 150:
        return True
    
    # Short descriptions with few sentences (just facts, no context)
    sentences = re.split(r'[.!?]+', desc)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) <= 2 and len(desc) < 200:
        return True
    
    # Check if it's just a list of facts without helpful context
    # If it has many commas but few periods, might be too list-like
    if desc.count(',') > 3 and len(sentences) <= 2:
        return True
    
    return False


def enhance_description_with_chatgpt(current_description, donor_content, listing_name, listing_type, api_key):
    """
    Use ChatGPT to create a compact, appropriate description from donor content
    """
    client = openai.OpenAI(api_key=api_key)
    
    # Donor content is already extracted text (not HTML)
    donor_text = donor_content if donor_content else ""
    
    # Limit donor text to avoid token limits (but keep more for better summaries)
    if len(donor_text) > 3000:
        donor_text = donor_text[:3000] + "..."
    
    prompt = f"""Create a compact, helpful description for "{listing_name}" (a {listing_type}) based on the source material below.

Source material from donor CSV:
{donor_text if donor_text else "No source material available."}

Current description (for reference):
{current_description}

Requirements:
- Create a concise, engaging description suitable for a listing directory
- Use information from the source material to make it helpful and accurate
- Keep it compact: aim for 150-300 characters (2-4 sentences)
- Include key details: what visitors can expect, location/context, unique features
- Make it natural and flowing (not just a list of facts)
- Focus on what makes this place special or useful
- If source material is limited, enhance what's there appropriately
- Ensure it's appropriate for the listing type ({listing_type})
- IMPORTANT: Vary the opening - do NOT start with "Discover", "Experience", "Nestled", or other formulaic phrases
- PREFERRED: Start with the business/place name when natural, or use a direct statement about what it is
- Use varied openings: business name, location, what it offers, or a direct factual statement

Compact listing description:"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional travel and tourism writer who creates helpful, engaging descriptions that give visitors useful information about places and experiences."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        enhanced = response.choices[0].message.content.strip()
        return enhanced
    except Exception as e:
        print(f"   ❌ Error calling ChatGPT: {e}")
        return current_description


def extract_text_from_vc_row(vc_content):
    """Extract plain text from Visual Composer shortcode content"""
    if not vc_content:
        return ""
    # Remove Visual Composer shortcode tags like [vc_row ...]
    text = re.sub(r'\[/?[^\]]+\]', ' ', vc_content)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode HTML entities
    text = unescape(text)
    # Clean up whitespace
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
                # Check multiple fields for content
                content = row.get('Content', '').strip()
                excerpt = row.get('Excerpt', '').strip()
                
                # Check nectar extra content fields (these often have the actual page content)
                nectar_extra = row.get('_nectar_portfolio_extra_content', '').strip()
                nectar_preview = row.get('_nectar_portfolio_extra_content_preview', '').strip()
                nectar_excerpt = row.get('_nectar_project_excerpt', '').strip()
                
                # Extract text from each field
                content_text = extract_text_from_html(content) if content else ""
                excerpt_text = extract_text_from_html(excerpt) if excerpt else ""
                nectar_extra_text = extract_text_from_vc_row(nectar_extra) if nectar_extra else ""
                nectar_preview_text = extract_text_from_vc_row(nectar_preview) if nectar_preview else ""
                nectar_excerpt_text = nectar_excerpt if nectar_excerpt else ""
                
                # Combine all available content (prioritize nectar fields as they often have more complete content)
                parts = []
                if nectar_extra_text:
                    parts.append(nectar_extra_text)
                if nectar_preview_text and len(nectar_preview_text) > len(nectar_extra_text):
                    # Use preview if it's longer (more complete)
                    parts.append(nectar_preview_text)
                if nectar_excerpt_text:
                    parts.append(nectar_excerpt_text)
                if excerpt_text:
                    parts.append(excerpt_text)
                if content_text and len(content_text) > 50:  # Only add if substantial
                    parts.append(content_text)
                
                full_content = ' '.join(parts).strip()
                donor_data[slug] = full_content
    
    print(f"✅ Loaded {len(donor_data)} entries from donor CSV")
    return donor_data


def main():
    csv_path = 'CSV/listings-2026-01-07-2-final_clean-no-duplication.csv'
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
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Process ALL listings that have donor content
    print("\n🔍 Matching listings with donor CSV content...")
    listings_with_donor = []
    
    for listing in listings:
        slug = listing.get('slug', '').strip().lower()
        if slug and slug in donor_data:
            listings_with_donor.append(listing)
    
    print(f"\n📊 Found {len(listings_with_donor)} listings with donor CSV content")
    
    if len(listings_with_donor) == 0:
        print("⚠️  No listings matched with donor CSV!")
        return
    
    # Show examples
    print("\n📋 Sample listings to update:")
    for i, listing in enumerate(listings_with_donor[:5], 1):
        name = listing.get('name', 'Unknown')
        desc = listing.get('description', '')
        donor_len = len(donor_data.get(listing.get('slug', '').strip().lower(), ''))
        print(f"\n{i}. {name}")
        print(f"   Current: {desc[:80]}... ({len(desc)} chars)")
        print(f"   Donor content: {donor_len} chars available")
    
    # Auto-proceed
    print(f"\n⚠️  Ready to update {len(listings_with_donor)} descriptions using donor CSV content")
    print("   This will use your API key and may incur costs.")
    print("   Proceeding automatically...")
    
    # Update all listings with donor content
    print(f"\n🔄 Updating {len(listings_with_donor)} descriptions...")
    
    output_path = csv_path.replace('.csv', '-updated-from-donor.csv')
    
    updated_count = 0
    skipped_count = 0
    kept_original = 0
    
    # Create set of slugs with donor content for quick lookup
    donor_slugs = set(donor_data.keys())
    
    # Check if output file exists to resume
    existing_slugs = set()
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                existing_slugs = set(row.get('slug', '').strip().lower() for row in reader if row.get('slug', '').strip())
            if existing_slugs:
                print(f"   📋 Found existing output with {len(existing_slugs)} listings - will append remaining")
        except:
            pass
    
    # Open in append mode if resuming, otherwise write mode
    mode = 'a' if existing_slugs and os.path.exists(output_path) else 'w'
    
    with open(csv_path, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        with open(output_path, mode, encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            
            # Only write header if starting fresh
            if mode == 'w':
                writer.writeheader()
            
            for listing in listings:
                description = listing.get('description', '').strip()
                name = listing.get('name', 'Unknown')
                listing_type = listing.get('type', '')
                slug = listing.get('slug', '').strip().lower()
                
                # Skip if already processed
                if slug in existing_slugs:
                    continue
                
                # Update if we have donor content for this listing
                if slug in donor_slugs:
                    donor_content = donor_data.get(slug, '')
                    
                    if donor_content and len(donor_content.strip()) > 50:
                        print(f"\n   🔄 Updating: {name}")
                        print(f"      Current: {description[:80]}... ({len(description)} chars)")
                        print(f"      Donor content: {len(donor_content)} chars")
                        
                        try:
                            # Create compact description from donor content
                            enhanced = enhance_description_with_chatgpt(
                                description,
                                donor_content,
                                name,
                                listing_type,
                                api_key
                            )
                            
                            listing['description'] = enhanced
                            updated_count += 1
                            
                            print(f"      ✅ Updated ({len(description)} → {len(enhanced)} chars)")
                        except Exception as e:
                            print(f"      ⚠️  Error: {e} - keeping original")
                            enhanced_count = 0  # Reset if error
                        
                        # Rate limiting
                        time.sleep(1)
                    else:
                        # Donor content too short, skip
                        skipped_count += 1
                else:
                    # No donor content, keep original
                    kept_original += 1
                
                writer.writerow(listing)
    
    print(f"\n✅ Complete!")
    print(f"   Updated: {updated_count} descriptions from donor CSV")
    print(f"   Skipped: {skipped_count} listings (insufficient donor content)")
    print(f"   Kept original: {len(listings) - updated_count - skipped_count} listings (no donor match)")
    print(f"   Output file: {output_path}")


if __name__ == '__main__':
    main()
