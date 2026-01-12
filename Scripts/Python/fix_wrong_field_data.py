#!/usr/bin/env python3
"""
Fix data that is in the wrong fields
IMPORTANT: Does NOT change slugs - preserves them exactly as they are
"""

import csv
import re
import os
import sys
from datetime import datetime

def is_valid_phone(phone):
    """Check if string looks like a phone number"""
    if not phone or not isinstance(phone, str):
        return False
    digits = re.sub(r'[^\d]', '', phone)
    return len(digits) >= 10 and len(digits) <= 15

def is_valid_url(url):
    """Check if string is a valid URL"""
    if not url or not isinstance(url, str):
        return False
    return url.startswith('http://') or url.startswith('https://')

def extract_urls(text):
    """Extract URLs from text"""
    if not text:
        return []
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    return re.findall(url_pattern, text)

def format_phone(phone_str):
    """Format phone number consistently"""
    digits = re.sub(r'[^\d]', '', phone_str)
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    return phone_str  # Return as-is if can't format

def main():
    input_csv = 'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean-wintergreen-restored-id-fixed-anomalies-fixed.csv'
    output_csv = 'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean-wintergreen-restored-id-fixed-anomalies-fixed-wrong-fields-fixed.csv'
    report_file = 'CSV/WRONG_FIELD_FIXES_REPORT.txt'
    
    if not os.path.exists(input_csv):
        print(f"❌ Input file not found: {input_csv}")
        sys.exit(1)
    
    print(f"📖 Reading: {input_csv}")
    
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        listings = list(reader)
    
    print(f"✅ Loaded {len(listings)} listings")
    print()
    
    changes = []
    fixed_count = 0
    
    for listing in listings:
        name = listing.get('name', 'Unknown')
        slug = listing.get('slug', '')
        listing_changes = []
        
        # 1. Extract phone numbers from description if phone field is empty
        phone_field = listing.get('phone', '').strip()
        description = listing.get('description', '').strip()
        detailed_desc = listing.get('detailedDescription', '').strip()
        combined_text = (description + ' ' + detailed_desc).strip()
        
        if not phone_field and combined_text:
            phone_patterns = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', combined_text)
            if phone_patterns:
                phone = phone_patterns[0]
                if is_valid_phone(phone):
                    formatted_phone = format_phone(phone)
                    listing_changes.append({
                        'field': 'phone',
                        'old': '',
                        'new': formatted_phone,
                        'reason': 'Extracted from description'
                    })
                    listing['phone'] = formatted_phone
        
        # 2. Extract website URLs from description if website field is empty
        website = listing.get('website', '').strip()
        if not website and combined_text:
            urls = extract_urls(combined_text)
            # Filter out Google Maps links and Wikipedia links (those are OK in descriptions)
            non_maps_urls = [
                url for url in urls 
                if 'google.com/maps' not in url 
                and 'goo.gl/maps' not in url
                and 'wikipedia.org' not in url
                and 'en.wikipedia.org' not in url
            ]
            if non_maps_urls:
                # Take the first non-maps URL that looks like a main website
                main_url = non_maps_urls[0]
                listing_changes.append({
                    'field': 'website',
                    'old': '',
                    'new': main_url,
                    'reason': 'Extracted from description'
                })
                listing['website'] = main_url
        
        # 3. Move very long descriptions to detailedDescription
        if description and len(description) > 500:
            if not detailed_desc:
                # Move full description to detailedDescription, truncate description
                listing_changes.append({
                    'field': 'detailedDescription',
                    'old': '',
                    'new': description,
                    'reason': 'Moved from description (too long)'
                })
                listing_changes.append({
                    'field': 'description',
                    'old': description,
                    'new': description[:200] + '...',
                    'reason': 'Truncated (moved full text to detailedDescription)'
                })
                listing['detailedDescription'] = description
                listing['description'] = description[:200] + '...'
            elif len(description) > len(detailed_desc) * 2:
                # Description is much longer than detailedDescription - might be swapped
                # But be conservative - only if description is clearly too long
                if len(description) > 600:
                    # Swap them
                    old_desc = description
                    old_detailed = detailed_desc
                    listing_changes.append({
                        'field': 'description',
                        'old': old_desc[:100] + '...',
                        'new': old_detailed[:100] + '...',
                        'reason': 'Swapped with detailedDescription (description was too long)'
                    })
                    listing_changes.append({
                        'field': 'detailedDescription',
                        'old': old_detailed[:100] + '...',
                        'new': old_desc[:100] + '...',
                        'reason': 'Swapped with description'
                    })
                    listing['description'] = old_detailed
                    listing['detailedDescription'] = old_desc
        
        # 4. Remove duplicate address from description (if address is in description)
        address = listing.get('address', '').strip()
        if description and address:
            address_words = set(re.findall(r'\b\w{4,}\b', address.lower()))
            desc_words = set(re.findall(r'\b\w{4,}\b', description.lower()))
            if address_words and len(address_words & desc_words) >= 4:
                # Address appears to be duplicated in description
                # Try to remove it (be conservative)
                # For now, just note it - too risky to auto-remove
                pass
        
        if listing_changes:
            changes.append({
                'name': name,
                'slug': slug,
                'changes': listing_changes
            })
            fixed_count += 1
    
    # Write fixed CSV
    print(f"📝 Writing fixed CSV: {output_csv}")
    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(listings)
    
    # Write report
    print(f"📝 Writing report: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("WRONG FIELD DATA FIXES REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total listings processed: {len(listings)}\n")
        f.write(f"Listings fixed: {fixed_count}\n")
        f.write(f"Total changes made: {sum(len(c['changes']) for c in changes)}\n\n")
        
        f.write("IMPORTANT: All slugs were preserved exactly as they were.\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("DETAILED CHANGES\n")
        f.write("=" * 80 + "\n\n")
        
        if changes:
            for change in changes:
                f.write(f"{change['name']} ({change['slug']})\n")
                f.write("-" * 80 + "\n")
                for item in change['changes']:
                    f.write(f"  Field: {item['field']}\n")
                    f.write(f"    Reason: {item['reason']}\n")
                    f.write(f"    Old: {item['old'][:150] if len(str(item['old'])) > 150 else item['old']}\n")
                    f.write(f"    New: {item['new'][:150] if len(str(item['new'])) > 150 else item['new']}\n")
                f.write("\n")
        else:
            f.write("No changes were made.\n")
    
    print()
    print("=" * 80)
    print("✅ FIXES COMPLETE!")
    print("=" * 80)
    print(f"   - Listings processed: {len(listings)}")
    print(f"   - Listings fixed: {fixed_count}")
    print(f"   - Total changes: {sum(len(c['changes']) for c in changes)}")
    print(f"   - Output CSV: {output_csv}")
    print(f"   - Report: {report_file}")
    print()
    print("⚠️  IMPORTANT: All slugs were preserved exactly as they were.")


if __name__ == '__main__':
    main()
