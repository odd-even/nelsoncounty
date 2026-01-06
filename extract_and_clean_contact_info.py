#!/usr/bin/env python3
"""
Extract websites, phones, and addresses from accordions/descriptions
- Add to proper CSV fields if missing
- Remove redundant info from accordions if already in fields
- Move info from accordions to fields if not already there
"""

import csv
import re

def normalize_phone(phone: str) -> str:
    """Normalize phone number format"""
    if not phone:
        return ""
    # Remove all non-digits
    digits = re.sub(r'\D', '', phone)
    if len(digits) == 10:
        return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"
    return phone.strip()

def normalize_website(url: str) -> str:
    """Normalize website URL"""
    if not url:
        return ""
    url = url.strip()
    # Add https:// if missing
    if not url.startswith(('http://', 'https://')):
        if url.startswith('www.'):
            url = 'https://' + url
        elif '.' in url and not url.startswith('http'):
            url = 'https://' + url
    return url

def extract_contact_info(text: str):
    """Extract websites, phones, and addresses from text"""
    if not text:
        return {'websites': [], 'phones': [], 'addresses': []}
    
    # Website patterns
    website_patterns = [
        r'https?://[\w\-\.]+(?:\.[a-z]{2,})+(?:/[\w\-\./?=&#]*)?',
        r'www\.[\w\-\.]+(?:\.[a-z]{2,})+(?:/[\w\-\./?=&#]*)?',
        r'[\w\-]+\.(?:com|org|net|edu|gov|io|co|us)(?:/[\w\-\./?=&#]*)?',
    ]
    
    websites = []
    for pattern in website_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            # Clean up common prefixes/suffixes
            match = match.rstrip('.,;:')
            if match not in websites:
                websites.append(match)
    
    # Phone patterns
    phone_pattern = r'(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, text)
    phones = [normalize_phone(p) for p in phones if p]
    
    # Address patterns
    address_patterns = [
        r'\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Road|Highway|Drive|Lane|Avenue|Boulevard|Way|Loop|Court|Parkway|Hwy)[^,]*,\s*[A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5}',
        r'\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Road|Highway|Drive|Lane|Avenue|Boulevard|Way|Loop|Court|Parkway|Hwy)[^.]*',
    ]
    
    addresses = []
    for pattern in address_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            match = match.strip().rstrip('.,;:')
            if len(match) > 10 and match not in addresses:
                addresses.append(match)
    
    return {
        'websites': websites,
        'phones': phones,
        'addresses': addresses
    }

def remove_contact_info_from_text(text: str, website: str = None, phone: str = None, address: str = None) -> str:
    """Remove contact info from text if it matches what's in the fields"""
    if not text:
        return text
    
    result = text
    
    # Remove website
    if website:
        # Try various formats
        website_variations = [
            website,
            website.replace('https://', '').replace('http://', ''),
            website.replace('https://', 'www.'),
            website.split('/')[0] if '/' in website else website,
        ]
        for var in website_variations:
            if var:
                # Remove website with common prefixes/suffixes
                patterns = [
                    rf'\b{re.escape(var)}\b',
                    rf'{re.escape(var)}\.com',
                    rf'www\.{re.escape(var.replace("www.", ""))}',
                ]
                for pattern in patterns:
                    result = re.sub(pattern, '', result, flags=re.IGNORECASE)
    
    # Remove phone
    if phone:
        # Normalize phone for matching
        phone_digits = re.sub(r'\D', '', phone)
        if phone_digits:
            # Try to find and remove phone in various formats
            phone_patterns = [
                rf'\(?{phone_digits[0:3]}\)?\s*-?\s*{phone_digits[3:6]}\s*-?\s*{phone_digits[6:10]}',
                rf'{phone_digits[0:3]}-{phone_digits[3:6]}-{phone_digits[6:10]}',
                rf'{phone_digits[0:3]}\.{phone_digits[3:6]}\.{phone_digits[6:10]}',
            ]
            for pattern in phone_patterns:
                result = re.sub(pattern, '', result)
    
    # Remove address
    if address:
        # Extract key parts of address
        address_parts = address.split(',')
        if address_parts:
            street = address_parts[0].strip()
            if street:
                # Remove street address
                result = re.sub(re.escape(street), '', result, flags=re.IGNORECASE)
    
    # Clean up extra whitespace and punctuation
    result = re.sub(r'\s+', ' ', result)
    result = re.sub(r'\s*[|]\s*', ' ', result)  # Remove pipe separators
    result = re.sub(r'\s*Contact:\s*', '', result, flags=re.IGNORECASE)
    result = re.sub(r'\s*Location:\s*', '', result, flags=re.IGNORECASE)
    result = re.sub(r'\s*Hours:\s*', '', result, flags=re.IGNORECASE)
    result = re.sub(r'\s*Phone:\s*', '', result, flags=re.IGNORECASE)
    result = re.sub(r'\s*Website:\s*', '', result, flags=re.IGNORECASE)
    result = re.sub(r'\s*,\s*,', ',', result)  # Remove double commas
    result = re.sub(r'\s*\.\s*\.', '.', result)  # Remove double periods
    result = result.strip()
    
    return result

def main():
    print("=" * 80)
    print("EXTRACTING AND CLEANING CONTACT INFO")
    print("=" * 80)
    
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    changes_made = []
    
    for listing in listings:
        name = listing.get('name', '').strip()
        current_website = listing.get('website', '').strip()
        current_phone = listing.get('phone', '').strip()
        current_address = listing.get('address', '').strip()
        
        # Check description
        desc = listing.get('description', '').strip()
        desc_info = extract_contact_info(desc) if desc else {'websites': [], 'phones': [], 'addresses': []}
        
        # Check accordions
        accordion_info = {'websites': [], 'phones': [], 'addresses': []}
        for i in range(1, 5):
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            if content:
                info = extract_contact_info(content)
                accordion_info['websites'].extend(info['websites'])
                accordion_info['phones'].extend(info['phones'])
                accordion_info['addresses'].extend(info['addresses'])
        
        # Process websites
        all_websites = desc_info['websites'] + accordion_info['websites']
        if all_websites and not current_website:
            # Use first valid website
            website = normalize_website(all_websites[0])
            listing['website'] = website
            changes_made.append(f"{name}: Added website {website}")
        
        # Process phones
        all_phones = desc_info['phones'] + accordion_info['phones']
        if all_phones and not current_phone:
            # Use first valid phone
            phone = normalize_phone(all_phones[0])
            listing['phone'] = phone
            changes_made.append(f"{name}: Added phone {phone}")
        
        # Process addresses (be more careful - only if clearly an address)
        all_addresses = desc_info['addresses'] + accordion_info['addresses']
        if all_addresses and not current_address:
            # Use first address that looks complete
            for addr in all_addresses:
                if len(addr) > 20 and any(word in addr.lower() for word in ['highway', 'road', 'street', 'drive', 'lane']):
                    listing['address'] = addr
                    changes_made.append(f"{name}: Added address {addr[:50]}...")
                    break
        
        # Now clean accordions - remove redundant info
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if content:
                # Get current field values (may have been updated above)
                website = listing.get('website', '').strip()
                phone = listing.get('phone', '').strip()
                address = listing.get('address', '').strip()
                
                # Remove redundant contact info
                cleaned = remove_contact_info_from_text(content, website, phone, address)
                
                # Also remove common contact info patterns
                # Remove "Contact: phone | website" patterns
                cleaned = re.sub(r'Contact:\s*[^|]+\s*\|\s*[^\n.]+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'Location:\s*[^\n.]+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'Hours:\s*[^\n.]+', '', cleaned, flags=re.IGNORECASE)
                
                # Clean up
                cleaned = re.sub(r'\s+', ' ', cleaned)
                cleaned = cleaned.strip()
                
                # Remove if content is now too short or just punctuation
                if len(cleaned) < 20 or cleaned in ['.', ',', '|', '-']:
                    listing[f'accordionPanel{i}Title'] = ''
                    listing[f'accordionPanel{i}Content'] = ''
                    if content != cleaned:
                        changes_made.append(f"{name}: Removed accordion {i} (redundant contact info)")
                elif cleaned != content:
                    listing[f'accordionPanel{i}Content'] = cleaned
                    changes_made.append(f"{name}: Cleaned accordion {i} ({title})")
    
    # Write updated CSV
    print(f"\nWriting changes to CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ PROCESSING COMPLETE!")
    print(f"   Total changes: {len(changes_made)}")
    if changes_made:
        print("\n   Changes made:")
        for change in changes_made[:30]:
            print(f"     - {change}")
        if len(changes_made) > 30:
            print(f"     ... and {len(changes_made) - 30} more")

if __name__ == '__main__':
    main()
