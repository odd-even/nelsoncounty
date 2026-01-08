#!/usr/bin/env python3
"""
Find and move addresses/phone numbers from descriptions to correct fields
Clean up descriptions to sound natural after removal
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
    """Load donor CSV into a slug-to-data map"""
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
                donor_data[slug] = {
                    'phone': row.get('Phone', '').strip() or row.get('phone', '').strip(),
                    'address': row.get('Address', '').strip() or row.get('address', '').strip(),
                }
    
    print(f"✅ Loaded {len(donor_data)} entries from donor CSV")
    return donor_data


def extract_phone_from_text(text):
    """Extract phone number from text"""
    # Phone patterns: (434) 263-1234, 434-263-1234, 434.263.1234, 434 263 1234
    patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            # Clean up the phone number
            phone = re.sub(r'[^\d]', '', matches[0])
            if len(phone) == 10:
                return f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
    
    return None


def extract_address_from_text(text):
    """Extract address from text"""
    # Look for address patterns - be more specific to avoid false positives
    address_patterns = [
        # "at 123 Main Street, City, VA" or "located at 123 Main Street"
        r'(?:at|located\s+at|on)\s+(\d+\s+[A-Z][^.!?]{5,50}(?:Street|Road|Highway|Route|Avenue|Drive|Lane|Way|Court|Circle|Loop|Boulevard)[^.!?]{0,40}(?:,\s*[A-Z][^.!?]{0,30})?(?:,\s*VA|,\s*Virginia))',
        # "123 Main Street, City, VA" (standalone)
        r'(\d+\s+[A-Z][^.!?]{5,50}(?:Street|Road|Highway|Route|Avenue|Drive|Lane|Way|Court|Circle|Loop|Boulevard)[^.!?]{0,40}(?:,\s*[A-Z][^.!?]{0,30})?(?:,\s*VA|,\s*Virginia))',
    ]
    
    for pattern in address_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Clean up the address
            addr = matches[0].strip()
            # Remove leading "at", "located at", or "on"
            addr = re.sub(r'^(at|located\s+at|on)\s+', '', addr, flags=re.IGNORECASE)
            # Only return if it looks like a real address (has number and street name)
            if re.search(r'\d+\s+[A-Z]', addr):
                return addr.strip()
    
    return None


def clean_description_after_removal(description, removed_text, api_key):
    """
    Clean up description after removing address/phone to make it sound natural
    """
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""The following description contains address/phone information that has been moved to separate fields. Clean it up to sound natural without that information.

Original description:
{description}

Removed information (address/phone):
{removed_text}

Requirements:
- Remove the address/phone information naturally
- Fix any awkward phrasing that results from the removal
- Keep the description flowing and natural
- Maintain all other important information
- Do not add new information

Cleaned description:"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional copywriter who fixes awkward phrasing in descriptions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=400
        )
        
        cleaned = response.choices[0].message.content.strip()
        return cleaned
    except Exception as e:
        print(f"   ❌ Error calling ChatGPT: {e}")
        return description


def main():
    csv_path = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings.csv'
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
    
    # Load donor CSV for reference
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
    
    # Find listings with phone/address in descriptions
    print("\n🔍 Checking for phone numbers and addresses in descriptions...")
    
    issues = []
    for listing in listings:
        desc = listing.get('description', '').strip()
        phone = listing.get('phone', '').strip()
        address = listing.get('address', '').strip()
        slug = listing.get('slug', '').strip().lower()
        name = listing.get('name', '')
        
        # Check for phone in description
        phone_in_desc = extract_phone_from_text(desc)
        if phone_in_desc:
            # Only fix if current phone field is empty or different
            if not phone or phone != phone_in_desc:
                issues.append({
                    'listing': listing,
                    'type': 'phone',
                    'found': phone_in_desc,
                    'current': phone
                })
        
        # Check for address in description
        address_in_desc = extract_address_from_text(desc)
        if address_in_desc:
            # Only fix if current address field is empty or different
            if not address or address.lower() not in address_in_desc.lower():
                # Check donor CSV for correct address
                donor_info = donor_data.get(slug, {})
                donor_address = donor_info.get('address', '')
                
                issues.append({
                    'listing': listing,
                    'type': 'address',
                    'found': address_in_desc,
                    'current': address,
                    'donor_address': donor_address
                })
    
    print(f"\n📊 Found {len(issues)} listings with phone/address in descriptions")
    
    if len(issues) == 0:
        print("✅ No issues found!")
        return
    
    # Show examples
    print("\n📋 Examples:")
    for i, issue in enumerate(issues[:5], 1):
        name = issue['listing'].get('name', 'Unknown')
        print(f"\n{i}. {name} - {issue['type']}")
        print(f"   Found in description: {issue['found']}")
        print(f"   Current field: {issue['current'] or '(empty)'}")
        if issue.get('donor_address'):
            print(f"   Donor CSV has: {issue['donor_address']}")
    
    # Auto-proceed
    print(f"\n⚠️  Ready to fix {len(issues)} listings")
    print("   Proceeding automatically...")
    
    # Fix issues
    print(f"\n🔄 Fixing {len(issues)} listings...")
    
    output_path = csv_path.replace('.csv', '-cleaned.csv')
    
    fixed_count = 0
    
    # Create set of slugs with issues
    issue_slugs = {issue['listing'].get('slug', '').strip().lower() for issue in issues}
    
    with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for listing in listings:
            slug = listing.get('slug', '').strip().lower()
            desc = listing.get('description', '').strip()
            phone = listing.get('phone', '').strip()
            address = listing.get('address', '').strip()
            name = listing.get('name', 'Unknown')
            
            # Check if this listing has issues
            if slug in issue_slugs:
                issue = next((i for i in issues if i['listing'].get('slug', '').strip().lower() == slug), None)
                
                if issue:
                    print(f"\n   🔄 Fixing: {name}")
                    
                    # Extract phone/address from description
                    if issue['type'] == 'phone':
                        found_phone = issue['found']
                        # Use donor phone if available, otherwise use found phone
                        donor_info = donor_data.get(slug, {})
                        donor_phone = donor_info.get('phone', '')
                        final_phone = donor_phone if donor_phone else found_phone
                        
                        if not phone or phone != final_phone:
                            listing['phone'] = final_phone
                            print(f"      ✅ Set phone: {final_phone}")
                        
                        # Remove phone from description and clean up
                        desc_without_phone = re.sub(
                            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
                            '',
                            desc
                        )
                        cleaned_desc = clean_description_after_removal(desc_without_phone, found_phone, api_key)
                        listing['description'] = cleaned_desc
                        print(f"      ✅ Cleaned description")
                        time.sleep(1)
                    
                    elif issue['type'] == 'address':
                        found_address = issue['found']
                        # Use donor address if available, otherwise use found address
                        donor_info = donor_data.get(slug, {})
                        donor_address = donor_info.get('address', '')
                        final_address = donor_address if donor_address else found_address
                        
                        if not address or address.lower() not in final_address.lower():
                            listing['address'] = final_address
                            print(f"      ✅ Set address: {final_address[:60]}...")
                        
                        # Remove address from description and clean up
                        # Remove the address pattern
                        desc_without_addr = re.sub(
                            re.escape(found_address),
                            '',
                            desc,
                            flags=re.IGNORECASE
                        )
                        cleaned_desc = clean_description_after_removal(desc_without_addr, found_address, api_key)
                        listing['description'] = cleaned_desc
                        print(f"      ✅ Cleaned description")
                        time.sleep(1)
                    
                    fixed_count += 1
            
            writer.writerow(listing)
    
    print(f"\n✅ Complete!")
    print(f"   Fixed: {fixed_count} listings")
    print(f"   Output file: {output_path}")


if __name__ == '__main__':
    main()
