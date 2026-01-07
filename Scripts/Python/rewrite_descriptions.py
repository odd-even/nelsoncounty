#!/usr/bin/env python3
"""
Review and rewrite descriptions in CSV file
Matches with donor CSV by slug and uses ChatGPT to rewrite problematic descriptions
"""

import csv
import json
import time
import os
import sys
import re
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


def extract_text_from_html(html_content):
    """Extract plain text from HTML content"""
    if not html_content:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', html_content)
    # Decode HTML entities
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")
    text = text.replace('&nbsp;', ' ')
    # Clean up whitespace
    text = ' '.join(text.split())
    return text.strip()


def has_duplication(text):
    """Check if text has obvious duplication"""
    if not text or len(text) < 50:
        return False
    
    # Split into sentences
    sentences = re.split(r'[.!?]\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) < 2:
        return False
    
    # Check for exact duplicate sentences
    seen = set()
    for sentence in sentences:
        sentence_lower = sentence.lower().strip()
        if len(sentence_lower) > 20:  # Only check substantial sentences
            if sentence_lower in seen:
                return True
            seen.add(sentence_lower)
    
    # Check for very similar consecutive sentences (80% similarity)
    for i in range(len(sentences) - 1):
        s1 = sentences[i].lower()
        s2 = sentences[i + 1].lower()
        if len(s1) > 30 and len(s2) > 30:
            # Simple similarity check
            words1 = set(s1.split())
            words2 = set(s2.split())
            if len(words1) > 0 and len(words2) > 0:
                similarity = len(words1 & words2) / len(words1 | words2)
                if similarity > 0.8:
                    return True
    
    # Check if entire description is duplicated (first half matches second half)
    if len(text) > 100:
        mid = len(text) // 2
        first_half = text[:mid].lower().strip()
        second_half = text[mid:].lower().strip()
        # Remove leading/trailing punctuation
        first_half = re.sub(r'^[^\w]+|[^\w]+$', '', first_half)
        second_half = re.sub(r'^[^\w]+|[^\w]+$', '', second_half)
        
        if len(first_half) > 50 and len(second_half) > 50:
            # Check if they're very similar
            words1 = set(first_half.split())
            words2 = set(second_half.split())
            if len(words1) > 0 and len(words2) > 0:
                similarity = len(words1 & words2) / len(words1 | words2)
                if similarity > 0.75:
                    return True
    
    return False


def is_problematic_description(description):
    """Check if description has issues that need rewriting"""
    if not description or len(description.strip()) < 20:
        return False, "Too short"
    
    # Check for duplication
    if has_duplication(description):
        return True, "Has duplication"
    
    # Check for weird/nonsensical content
    # Check for irrelevant historical information that doesn't belong
    weird_patterns = [
        r'Lovingston is a great destination for history buffs',
        r'National Register of Historic Places',
        r'Historic District and the courthouse'
    ]
    for pattern in weird_patterns:
        if re.search(pattern, description, re.IGNORECASE):
            return True, "Contains irrelevant historical information"
    
    # Check for very repetitive content (same words repeated many times)
    words = description.lower().split()
    if len(words) > 10:
        word_counts = {}
        for word in words:
            if len(word) > 3:  # Only count substantial words
                word_counts[word] = word_counts.get(word, 0) + 1
        # If any word appears more than 30% of the time, it's repetitive
        max_count = max(word_counts.values()) if word_counts else 0
        if max_count > len(words) * 0.3:
            return True, "Highly repetitive content"
    
    return False, "OK"


def rewrite_description_with_chatgpt(current_description, donor_content, listing_name, listing_type, api_key):
    """Use ChatGPT to rewrite a description"""
    if not api_key:
        return None
    
    client = openai.OpenAI(api_key=api_key)
    
    # Prepare context
    donor_text = extract_text_from_html(donor_content) if donor_content else ""
    
    prompt = f"""You are a professional copywriter rewriting a business description for a tourism directory.

LISTING NAME: {listing_name}
LISTING TYPE: {listing_type}

CURRENT DESCRIPTION (has issues with duplication or poor wording):
{current_description}

ORIGINAL SOURCE CONTENT (from donor):
{donor_text[:1000] if donor_text else "(No original content available)"}

TASK:
Rewrite the description to be:
- Natural, flowing, and professional
- Free of duplication or repetition
- Concise but informative (2-4 sentences, 100-200 words)
- Engaging and inviting
- Accurate to the original source content

Write ONLY the rewritten description, nothing else. Do not include quotes or explanations."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional copywriter specializing in tourism and business descriptions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        rewritten = response.choices[0].message.content.strip()
        
        # Remove quotes if present
        rewritten = rewritten.strip('"').strip("'").strip()
        
        return rewritten
        
    except Exception as e:
        print(f"   ❌ ChatGPT API error: {e}")
        return None


def load_donor_csv(donor_path):
    """Load donor CSV and create slug -> content mapping"""
    donor_data = {}
    
    print(f"📂 Loading donor CSV: {donor_path}")
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('Slug', '').strip()
            if slug:
                # Get content from Content or Excerpt field
                content = row.get('Content', '').strip() or row.get('Excerpt', '').strip()
                title = row.get('Title', '').strip()
                donor_data[slug] = {
                    'content': content,
                    'title': title
                }
    
    print(f"✅ Loaded {len(donor_data)} entries from donor CSV")
    return donor_data


def main():
    """Main processing function"""
    print("=" * 80)
    print("DESCRIPTION REVIEW AND REWRITE")
    print("=" * 80)
    
    # Get API key from environment variable
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        print("   Set it with: export OPENAI_API_KEY='your-key-here'")
        print("   Or run: OPENAI_API_KEY='your-key' python3 rewrite_descriptions.py")
        return
    
    # File paths
    csv_path = 'CSV/listings-2026-01-07-4.csv'
    donor_path = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    if not os.path.exists(donor_path):
        print(f"❌ Donor CSV file not found: {donor_path}")
        return
    
    # Load donor data
    donor_data = load_donor_csv(donor_path)
    
    # Load current CSV
    print(f"\n📂 Loading CSV: {csv_path}")
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
        fieldnames = reader.fieldnames
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Review all descriptions
    print(f"\n🔍 Reviewing descriptions...")
    problematic = []
    
    for idx, listing in enumerate(listings):
        description = listing.get('description', '').strip()
        slug = listing.get('slug', '').strip()
        name = listing.get('name', '').strip()
        
        if not description:
            continue
        
        is_problem, reason = is_problematic_description(description)
        if is_problem:
            problematic.append({
                'index': idx,
                'listing': listing,
                'slug': slug,
                'name': name,
                'description': description,
                'reason': reason
            })
    
    print(f"\n📊 Review Results:")
    print(f"   ✅ Total listings: {len(listings)}")
    print(f"   ⚠️  Problematic descriptions: {len(problematic)}")
    
    if len(problematic) == 0:
        print("\n✅ No problematic descriptions found!")
        return
    
    # Show first few problematic ones
    print(f"\n⚠️  Problematic descriptions (first 10):")
    for item in problematic[:10]:
        desc_preview = item['description'][:100] + "..." if len(item['description']) > 100 else item['description']
        print(f"   {item['index']}: {item['name']} - {item['reason']}")
        print(f"      Preview: {desc_preview}")
    
    # Auto-proceed (can be changed to ask for confirmation if needed)
    print(f"\n{'=' * 80}")
    print(f"Found {len(problematic)} problematic descriptions. Proceeding with rewrite...")
    # Uncomment below to ask for confirmation:
    # response = input(f"Found {len(problematic)} problematic descriptions. Rewrite them? (yes/no): ")
    # if response.lower() not in ['yes', 'y']:
    #     print("Cancelled.")
    #     return
    
    # Process each problematic description
    print(f"\n{'=' * 80}")
    print(f"Rewriting {len(problematic)} descriptions...")
    print(f"{'=' * 80}")
    
    updated_count = 0
    failed_count = 0
    
    for i, item in enumerate(problematic, 1):
        listing = item['listing']
        slug = item['slug']
        name = item['name']
        current_desc = item['description']
        
        print(f"\n[{i}/{len(problematic)}] {name} (slug: {slug})")
        print(f"   Issue: {item['reason']}")
        print(f"   Current: {current_desc[:150]}...")
        
        # Get donor content
        donor_info = donor_data.get(slug, {})
        donor_content = donor_info.get('content', '')
        
        if not donor_content:
            print(f"   ⚠️  No donor content found for slug: {slug}")
            # Still try to rewrite with just the current description
            donor_content = ""
        
        # Rewrite with ChatGPT
        listing_type = listing.get('type', '').strip()
        rewritten = rewrite_description_with_chatgpt(
            current_desc,
            donor_content,
            name,
            listing_type,
            api_key
        )
        
        if rewritten:
            # Update the listing
            listing['description'] = rewritten
            updated_count += 1
            print(f"   ✅ Rewritten successfully")
            print(f"      New: {rewritten[:150]}...")
        else:
            failed_count += 1
            print(f"   ❌ Failed to rewrite, keeping original")
        
        # Rate limiting
        time.sleep(1)
        
        # Save every 10 listings
        if i % 10 == 0:
            print(f"\n💾 Saving progress... ({i}/{len(problematic)} processed)")
            output_path = csv_path.replace('.csv', '-rewritten.csv')
            with open(output_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
                writer.writeheader()
                writer.writerows(listings)
    
    # Final save
    print(f"\n💾 Saving final results...")
    output_path = csv_path.replace('.csv', '-rewritten.csv')
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(listings)
    
    print(f"\n{'=' * 80}")
    print(f"✅ COMPLETE!")
    print(f"   Processed: {len(problematic)} descriptions")
    print(f"   Updated: {updated_count}")
    print(f"   Failed: {failed_count}")
    print(f"   Output: {output_path}")
    print(f"{'=' * 80}")


if __name__ == '__main__':
    main()
