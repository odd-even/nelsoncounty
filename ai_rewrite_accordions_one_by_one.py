#!/usr/bin/env python3
"""
Rewrite accordion content using Claude or ChatGPT API
Processes one listing at a time for quality control
"""

import csv
import json
import time
import os
import sys
from pathlib import Path

# Add user site-packages to path (for pip --user installs)
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

# Try to import API libraries
try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    print("⚠️  Anthropic library not installed. Install with: pip install anthropic")

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("⚠️  OpenAI library not installed. Install with: pip install openai")

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    print("⚠️  Google Generative AI library not installed. Install with: pip install google-generativeai")


def get_prompt_for_accordion(content, title, listing_name, listing_type, description):
    """Create a specialized prompt based on accordion type"""
    
    base_prompt = f"""You are a professional travel and tourism writer. Rewrite the following accordion content into clear, engaging, and informative prose.

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


def rewrite_with_claude(content, title, listing_name, listing_type, description, api_key):
    """Rewrite content using Claude API"""
    if not HAS_ANTHROPIC:
        raise ImportError("Anthropic library not installed")
    
    client = anthropic.Anthropic(api_key=api_key)
    
    prompt = get_prompt_for_accordion(content, title, listing_name, listing_type, description)
    
    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        rewritten = message.content[0].text.strip()
        return rewritten
    except Exception as e:
        print(f"   ❌ Error with Claude: {e}")
        return None


def rewrite_with_openai(content, title, listing_name, listing_type, description, api_key):
    """Rewrite content using OpenAI API"""
    if not HAS_OPENAI:
        raise ImportError("OpenAI library not installed")
    
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


def rewrite_with_gemini(content, title, listing_name, listing_type, description, api_key):
    """Rewrite content using Google Gemini API (FREE)"""
    if not HAS_GEMINI:
        raise ImportError("Google Generative AI library not installed")
    
    genai.configure(api_key=api_key)
    
    prompt = get_prompt_for_accordion(content, title, listing_name, listing_type, description)
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        rewritten = response.text.strip()
        return rewritten
    except Exception as e:
        print(f"   ❌ Error with Gemini: {e}")
        return None


def process_listing(listing, api_provider, api_key, start_index=0, max_listings=None):
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
        
        print(f"   🔄 Rewriting: {title}")
        
        # Choose API provider
        try:
            if api_provider.lower() == 'claude':
                rewritten = rewrite_with_claude(content, title, name, listing_type, description, api_key)
            elif api_provider.lower() == 'openai' or api_provider.lower() == 'chatgpt':
                rewritten = rewrite_with_openai(content, title, name, listing_type, description, api_key)
            elif api_provider.lower() == 'gemini':
                rewritten = rewrite_with_gemini(content, title, name, listing_type, description, api_key)
            else:
                print(f"   ❌ Unknown API provider: {api_provider}")
                continue
            
            if rewritten:
                listing[f'accordionPanel{i}Content'] = rewritten
                updated = True
                print(f"   ✅ Rewritten successfully")
                print(f"      Original length: {len(content)} chars")
                print(f"      New length: {len(rewritten)} chars")
            else:
                print(f"   ⚠️  Failed to rewrite, keeping original")
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
            continue
        
        # Rate limiting (especially for Gemini: 15 requests/min)
        if api_provider.lower() == 'gemini':
            time.sleep(4)  # 15 requests/min = 4 seconds between requests
        else:
            time.sleep(1)  # 1 second for other APIs
    
    return updated


def main():
    """Main processing function"""
    print("=" * 80)
    print("AI ACCORDION REWRITE - ONE LISTING AT A TIME")
    print("=" * 80)
    
    # Get API provider
    print("\nAvailable API providers:")
    print("  1. Claude (Anthropic) - Best quality")
    print("  2. ChatGPT/OpenAI - Excellent quality")
    print("  3. Gemini (Google) - FREE, excellent quality")
    
    api_provider = input("\nChoose API provider (claude/openai/gemini): ").strip().lower()
    
    if api_provider not in ['claude', 'openai', 'chatgpt', 'gemini']:
        print("❌ Invalid API provider")
        return
    
    # Get API key
    api_key = os.getenv(f"{api_provider.upper()}_API_KEY")
    if not api_key:
        api_key = input(f"\nEnter your {api_provider.upper()} API key: ").strip()
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
    
    # Ask for processing options
    print("\nProcessing options:")
    print("  1. Process all listings")
    print("  2. Process specific range (e.g., 1-10)")
    print("  3. Process one listing at a time (interactive)")
    
    choice = input("\nChoose option (1/2/3): ").strip()
    
    start_idx = 0
    end_idx = len(listings)
    
    if choice == '2':
        start = input("Start index (0-based): ").strip()
        end = input("End index (exclusive): ").strip()
        try:
            start_idx = int(start)
            end_idx = int(end)
        except ValueError:
            print("❌ Invalid range")
            return
    elif choice == '3':
        # Interactive mode
        pass
    else:
        # Process all
        pass
    
    # Process listings
    processed = 0
    updated_count = 0
    
    if choice == '3':
        # Interactive mode - one at a time
        idx = start_idx
        while idx < end_idx:
            listing = listings[idx]
            name = listing.get('name', '').strip()
            
            print(f"\n{'=' * 80}")
            print(f"Listing {idx + 1}/{len(listings)}: {name}")
            print(f"{'=' * 80}")
            
            response = input("Process this listing? (y/n/skip to next/q to quit): ").strip().lower()
            
            if response == 'q':
                break
            elif response == 'n':
                idx += 1
                continue
            elif response == 'y':
                updated = process_listing(listing, api_provider, api_key)
                if updated:
                    updated_count += 1
                    # Save after each listing
                    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
                        writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
                        writer.writeheader()
                        writer.writerows(listings)
                    print(f"   💾 Saved to CSV")
                processed += 1
                idx += 1
            else:
                idx += 1
    else:
        # Batch mode
        for idx in range(start_idx, end_idx):
            listing = listings[idx]
            updated = process_listing(listing, api_provider, api_key)
            if updated:
                updated_count += 1
            
            processed += 1
            
            # Save every 10 listings
            if processed % 10 == 0:
                print(f"\n💾 Saving progress... ({processed}/{end_idx - start_idx} processed)")
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
    print(f"{'=' * 80}")


if __name__ == '__main__':
    main()
