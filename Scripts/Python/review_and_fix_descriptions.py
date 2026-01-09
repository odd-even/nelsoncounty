#!/usr/bin/env python3
"""
Review and fix descriptions using ChatGPT:
- Check for cut off text
- Check for run-together sections that should be separated
- Check for phone numbers and addresses
- Light rewrite/reformat into sensible paragraphs
"""

import csv
import sys
import os
import re
import time
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


def detect_issues(description):
    """
    Detect common issues in descriptions
    Returns a list of issue descriptions
    """
    issues = []
    
    if not description:
        return issues
    
    # Check for phone numbers
    phone_pattern = r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'
    if re.search(phone_pattern, description):
        issues.append("Contains phone number")
    
    # Check for addresses (street addresses with numbers)
    address_pattern = r'\b\d+\s+[A-Z][^.!?]{5,50}(?:Street|St|Road|Rd|Highway|Hwy|Route|Rt|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Loop|Boulevard|Blvd)'
    if re.search(address_pattern, description, re.IGNORECASE):
        issues.append("Contains address")
    
    # Check for cut off text (ends abruptly without punctuation)
    if description and description[-1] not in '.!?':
        # Check if it ends mid-sentence (last 50 chars don't have sentence ending)
        last_portion = description[-50:]
        if not re.search(r'[.!?]\s*$', last_portion):
            issues.append("May be cut off (no ending punctuation)")
    
    # Check for run-together sections (very long paragraphs without breaks)
    paragraphs = description.split('\n\n')
    for para in paragraphs:
        if len(para) > 800:  # Very long paragraph
            issues.append("Very long paragraph (may need breaks)")
    
    # Check for incomplete sentences
    sentences = re.split(r'[.!?]\s+', description)
    for sentence in sentences:
        if len(sentence) > 0 and len(sentence) < 10:  # Very short sentence fragment
            issues.append("Contains very short sentence fragments")
            break
    
    return issues


def review_and_fix_description(description, listing_name, listing_type, api_key):
    """
    Use ChatGPT to review and lightly rewrite/fix description
    """
    client = openai.OpenAI(api_key=api_key)
    
    # Detect issues first
    issues = detect_issues(description)
    issues_text = ', '.join(issues) if issues else 'None detected'
    
    prompt = f"""Review and improve the following description for "{listing_name}" (a {listing_type}).

Current description:
{description}

Issues detected: {issues_text}

Please:
1. Read the ENTIRE description carefully to ensure nothing is cut off
2. Check that all sentences are complete and make sense
3. AGGRESSIVELY remove ALL phone numbers, addresses (including street addresses with numbers like "123 Main Street"), zip codes, and contact information - these belong in separate fields
4. Remove any text that appears after contact information markers like "Located at", "Find us at", "Contact", "Phone", etc.
5. Format into 1-2 well-structured paragraphs with natural breaks
6. Ensure proper paragraph separation (use double line breaks between paragraphs)
7. Make sure the description flows naturally and reads well as a whole
8. Do NOT add new information - only fix formatting, remove contact info, and ensure completeness
9. If the description seems cut off mid-sentence or incomplete, end it at the last complete sentence
10. Keep the original tone and style - only make minimal changes for clarity and formatting
11. Ensure the description ends with proper punctuation (period, exclamation, or question mark)

Return ONLY the improved description text. Do not include any notes or comments."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional editor who reviews and improves listing descriptions. You fix formatting issues, remove contact information, and ensure descriptions are complete and well-structured. You make minimal changes to preserve the original content."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        fixed = response.choices[0].message.content.strip()
        
        # Remove any note markers if present
        if '[NOTE:' in fixed:
            # Extract the note and the description
            note_match = re.search(r'\[NOTE:.*?\]', fixed)
            if note_match:
                note = note_match.group(0)
                fixed = fixed.replace(note, '').strip()
        
        # Replace any double quotes with single quotes for Google Sheets compatibility
        fixed = fixed.replace('"', "'")
        fixed = fixed.replace('"', "'")
        fixed = fixed.replace('"', "'")
        
        return fixed, issues
    except Exception as e:
        print(f"   ❌ Error calling ChatGPT: {e}")
        return None, issues


def main():
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content.csv'
    output_file = input_file.replace('.csv', '-reviewed-fixed.csv')
    
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
    
    print(f"📖 Loading CSV: {input_file}")
    
    listings = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Process listings
    print(f"\n🔄 Reviewing and fixing descriptions...")
    print(f"   This will process all {len(listings)} listings")
    print(f"   Estimated time: ~{len(listings) * 1.5 / 60:.1f} minutes")
    print()
    
    updated_count = 0
    error_count = 0
    issues_found = {}
    
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        
        for i, listing in enumerate(listings, 1):
            name = listing.get('name', 'Unknown')
            description = listing.get('description', '')
            listing_type = listing.get('type', '')
            
            # Process all listings, even short ones (they might need formatting)
            
            print(f"\n   [{i}/{len(listings)}] Reviewing: {name}")
            print(f"      Current length: {len(description)} chars")
            
            try:
                fixed_description, issues = review_and_fix_description(
                    description,
                    name,
                    listing_type,
                    api_key
                )
                
                if fixed_description:
                    # Track issues
                    if issues:
                        issues_found[name] = issues
                    
                    # Only update if there are actual changes
                    if fixed_description != description:
                        listing['description'] = fixed_description
                        updated_count += 1
                        print(f"      ✅ Fixed ({len(fixed_description)} chars)")
                        if issues:
                            print(f"      Issues found: {', '.join(issues)}")
                    else:
                        print(f"      ✓ No changes needed")
                else:
                    error_count += 1
                    print(f"      ⚠️  Failed to review - keeping original")
                
                time.sleep(1.5)  # Rate limiting
                
            except Exception as e:
                error_count += 1
                print(f"      ❌ Error: {e} - keeping original")
            
            writer.writerow(listing)
    
    print(f"\n✅ Complete!")
    print(f"   Updated: {updated_count} descriptions")
    print(f"   Errors: {error_count}")
    print(f"   Kept original: {len(listings) - updated_count - error_count}")
    print(f"   Output file: {output_file}")
    
    if issues_found:
        print(f"\n📋 Issues found in {len(issues_found)} listings:")
        for name, issues in list(issues_found.items())[:10]:
            print(f"   {name}: {', '.join(issues)}")
        if len(issues_found) > 10:
            print(f"   ... and {len(issues_found) - 10} more")


if __name__ == '__main__':
    main()
