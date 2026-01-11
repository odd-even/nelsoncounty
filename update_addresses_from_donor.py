#!/usr/bin/env python3
"""
Update addresses in FINAL CSV by matching with donor CSV by slug.
Extracts addresses from donor CSV's Content and _nectar_portfolio_extra_content fields.
"""

import csv
import re
import urllib.parse
from typing import Dict, List, Optional, Tuple

def extract_address_from_text(text: str) -> Optional[str]:
    """Extract address from text content, filtering out livery service addresses."""
    if not text:
        return None
    
    # First, clean HTML tags but preserve structure
    text_clean = re.sub(r'<br\s*/?>', ' ', text, flags=re.IGNORECASE)
    text_clean = re.sub(r'</?[^>]+>', ' ', text_clean)
    
    # Common address patterns - try most specific first
    # Pattern 1: Street address with street type, City, State ZIP (most specific)
    pattern1 = r'(\d+\s+[A-Za-z0-9\s\.,#\-]+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Lane|Ln\.?|Drive|Dr\.?|Boulevard|Blvd\.?|Court|Ct\.?|Way|Circle|Cir\.?|Highway|Hwy\.?|Route|Rt\.?|Parkway|Pkwy\.?)[\s,]+[A-Za-z\s]+,\s*VA\s+\d{5})'
    
    # Pattern 2: Street address, City, State ZIP (more flexible)
    pattern2 = r'(\d+\s+[A-Za-z0-9\s\.,#\-]+,\s*[A-Za-z\s]+,\s*VA\s+\d{5})'
    
    # Pattern 3: Address with any state abbreviation
    pattern3 = r'(\d+\s+[A-Za-z0-9\s\.,#\-]+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Lane|Ln\.?|Drive|Dr\.?|Highway|Hwy\.?|Route|Rt\.?)[\s,]+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5})'
    
    # Find all potential addresses with context
    all_addresses = []
    for pattern in [pattern1, pattern2, pattern3]:
        for match in re.finditer(pattern, text_clean, re.IGNORECASE | re.MULTILINE):
            addr = match.group(1).strip()
            # Use larger context window (500 chars before, 300 after)
            start_pos = max(0, match.start() - 500)
            end_pos = min(len(text_clean), match.end() + 300)
            context = text_clean[start_pos:end_pos].lower()
            
            # Check if this address is for a livery service, rental, or other business
            # Look for business names and service types that indicate it's not the main listing
            livery_indicators = [
                r'livery',
                r'canoe\s+livery',
                r'kayak\s+livery',
                r'boat\s+livery',
                r'rental\s+service',
                r'shuttle\s+service',
                r'james\s+river\s+runners',
                r'james\s+river\s+reeling',
                r'state\s+park.*?(?:canoe|kayak|rafting|tubing)',
                r'(?:llc|inc|corp)\s+[^.]*' + re.escape(addr[:20].lower()),
                r'book\s+a\s+trip',
                r'rafting\s+trips',
                r'tubing\s+trips',
            ]
            
            is_livery = False
            for indicator in livery_indicators:
                if re.search(indicator, context, re.IGNORECASE):
                    is_livery = True
                    break
            
            # Check if address appears right after a business name that suggests it's a service
            # Look for pattern: "Business Name\nAddress" or "Business Name Address"
            addr_start = match.start()
            before_addr = text_clean[max(0, addr_start - 100):addr_start].strip()
            business_name_patterns = [
                r'(?:llc|inc|corp|livery|runners|reeling)\s*$',
                r'state\s+park\s*$',
            ]
            for pattern in business_name_patterns:
                if re.search(pattern, before_addr, re.IGNORECASE):
                    is_livery = True
                    break
            
            # Also check if address appears near phone numbers that mention services
            phone_nearby = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', context)
            if phone_nearby:
                phone_context = text_clean[max(0, phone_nearby.start() - 200):min(len(text_clean), phone_nearby.end() + 400)].lower()
                service_keywords = ['livery', 'rental', 'service', 'canoe', 'kayak', 'rafting', 'tubing', 'shuttle', 'book a trip', 'trips']
                if any(kw in phone_context for kw in service_keywords):
                    is_livery = True
            
            if not is_livery:
                all_addresses.append({
                    'address': addr,
                    'position': match.start(),
                    'context': context
                })
    
    if not all_addresses:
        return None
    
    # Prefer addresses that appear earlier in the content (likely main listing address)
    # or in structured sections
    all_addresses.sort(key=lambda x: x['position'])
    
    # Try to find the first non-livery address
    for addr_info in all_addresses:
        addr = addr_info['address']
        
        # Remove any leading/trailing text that looks like description
        prefixes_to_remove = [
            r'^24 hours a day\.[^.]*\.\s*',  # "24 hours a day. ..."
            r'^Outboard motor[^.]*\.\s*',  # "Outboard motor..."
            r'^Electric motors[^.]*\.\s*',  # "Electric motors..."
            r'^.*?Address\s+',  # "Address 11581..." -> "11581..."
            r'^\d+\s+(?:east|west|north|south|mile|miles)[^.]*\.\s*',  # "56 east for 6.3 miles..."
            r'^.*?to\s+[A-Za-z\s]+\.\s*Address\s+',  # "to Crabtree Falls. Address..."
        ]
        for prefix in prefixes_to_remove:
            addr = re.sub(prefix, '', addr, flags=re.IGNORECASE)
        
        # Also remove any trailing descriptive text after the ZIP code
        # Keep only: number, street, city, state, zip
        addr = re.sub(r'(\d{5}).*$', r'\1', addr)  # Keep only up to ZIP code
        
        # Clean up extra whitespace
        addr = re.sub(r'\s+', ' ', addr).strip()
        
        # Fix common typos
        addr = re.sub(r'\bLovington\b', 'Lovingston', addr, flags=re.IGNORECASE)
        
        # Only return if it looks like a valid address (has number, street, city, state, zip)
        if re.search(r'\d+\s+[A-Za-z]', addr) and re.search(r'VA\s+\d{5}', addr, re.IGNORECASE):
            return addr
    
    return None

def extract_phone_from_text(text: str) -> Optional[str]:
    """Extract phone number from text."""
    if not text:
        return None
    
    # Phone patterns
    patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # (434) 263-6660 or 434-263-6660
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',  # 434-263-6660
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if matches:
            phone = matches[0].strip()
            # Format consistently
            phone = re.sub(r'[^\d]', '', phone)
            if len(phone) == 10:
                return f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
    
    return None

def normalize_slug(slug: str) -> str:
    """Normalize slug for comparison."""
    return slug.lower().strip()

def generate_google_maps_url(address: str) -> str:
    """Generate Google Maps location/search URL (not directions)."""
    encoded = urllib.parse.quote(address)
    return f"https://www.google.com/maps/search/?api=1&query={encoded}"

def format_address(address: str) -> str:
    """Format address consistently."""
    if not address:
        return ""
    
    # Clean up whitespace
    address = re.sub(r'\s+', ' ', address).strip()
    
    # Ensure proper comma spacing
    address = re.sub(r',\s*', ', ', address)
    
    # Capitalize state abbreviation if lowercase
    address = re.sub(r',\s*va\s+(\d)', r', VA \1', address, flags=re.IGNORECASE)
    
    return address

def load_donor_csv(filename: str) -> Dict[str, Dict]:
    """Load donor CSV and index by slug."""
    donor_data = {}
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = normalize_slug(row.get('Slug', ''))
            if not slug:
                continue
            
            # Extract address from Content and _nectar_portfolio_extra_content
            content = row.get('Content', '') or ''
            extra_content = row.get('_nectar_portfolio_extra_content', '') or ''
            combined_content = content + ' ' + extra_content
            
            address = extract_address_from_text(combined_content)
            phone = extract_phone_from_text(combined_content)
            
            donor_data[slug] = {
                'title': row.get('Title', ''),
                'address': address,
                'phone': phone,
                'content': combined_content[:500] if combined_content else ''  # Store snippet for debugging
            }
    
    return donor_data

def load_final_csv(filename: str) -> List[Dict]:
    """Load FINAL CSV."""
    listings = []
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            listings.append(row)
    
    return listings

def compare_addresses(addr1: str, addr2: str) -> bool:
    """Compare two addresses to see if they're essentially the same."""
    if not addr1 or not addr2:
        return False
    
    # Normalize for comparison
    def normalize(addr):
        addr = addr.lower()
        addr = re.sub(r'[^\w\s]', '', addr)  # Remove punctuation
        addr = re.sub(r'\s+', ' ', addr).strip()
        return addr
    
    return normalize(addr1) == normalize(addr2)

def main():
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    final_file = 'CSV/FINAL I listings-2026-01-11.csv'
    output_file = 'CSV/FINAL I listings-2026-01-11-UPDATED.csv'
    
    print("Loading donor CSV...")
    donor_data = load_donor_csv(donor_file)
    print(f"Loaded {len(donor_data)} listings from donor CSV")
    
    print("Loading FINAL CSV...")
    final_listings = load_final_csv(final_file)
    print(f"Loaded {len(final_listings)} listings from FINAL CSV")
    
    changes = []
    matched_count = 0
    updated_count = 0
    
    for listing in final_listings:
        slug = normalize_slug(listing.get('slug', ''))
        if not slug:
            continue
        
        if slug in donor_data:
            matched_count += 1
            donor = donor_data[slug]
            current_address = listing.get('address', '').strip()
            donor_address = donor.get('address')
            
            if donor_address:
                # Format the donor address
                donor_address = format_address(donor_address)
                
                # Check if address needs updating
                if not compare_addresses(current_address, donor_address):
                    old_address = current_address
                    listing['address'] = donor_address
                    
                    # Update Google Maps URL
                    listing['googleMapsUrl'] = generate_google_maps_url(donor_address)
                    listing['directionsLink'] = generate_google_maps_url(donor_address)
                    
                    # Update phone if available and different
                    if donor.get('phone') and listing.get('phone', '').strip() != donor.get('phone'):
                        old_phone = listing.get('phone', '')
                        listing['phone'] = donor.get('phone')
                    else:
                        old_phone = None
                    
                    changes.append({
                        'slug': slug,
                        'name': listing.get('name', ''),
                        'old_address': old_address,
                        'new_address': donor_address,
                        'old_phone': old_phone,
                        'new_phone': donor.get('phone') if old_phone else None,
                        'donor_title': donor.get('title', '')
                    })
                    updated_count += 1
    
    print(f"\nMatched {matched_count} listings by slug")
    print(f"Updated {updated_count} addresses")
    
    # Write updated CSV
    if final_listings:
        fieldnames = final_listings[0].keys()
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(final_listings)
        print(f"\nUpdated CSV written to: {output_file}")
    
    # Generate report
    report_file = 'CSV/ADDRESS_UPDATE_REPORT.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("ADDRESS UPDATE REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Total listings matched by slug: {matched_count}\n")
        f.write(f"Total addresses updated: {updated_count}\n\n")
        
        if changes:
            f.write("DETAILED CHANGES:\n")
            f.write("-" * 80 + "\n\n")
            
            for i, change in enumerate(changes, 1):
                f.write(f"{i}. {change['name']} (slug: {change['slug']})\n")
                f.write(f"   Donor Title: {change['donor_title']}\n")
                f.write(f"   OLD Address: {change['old_address'] or '(empty)'}\n")
                f.write(f"   NEW Address: {change['new_address']}\n")
                if change['old_phone']:
                    f.write(f"   OLD Phone: {change['old_phone']}\n")
                    f.write(f"   NEW Phone: {change['new_phone']}\n")
                f.write(f"   Google Maps URL: {generate_google_maps_url(change['new_address'])}\n")
                f.write("\n")
        else:
            f.write("No addresses were updated.\n")
    
    print(f"\nReport written to: {report_file}")
    
    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    for change in changes:
        print(f"\n✓ {change['name']}")
        print(f"  Old: {change['old_address'] or '(empty)'}")
        print(f"  New: {change['new_address']}")

if __name__ == '__main__':
    main()

