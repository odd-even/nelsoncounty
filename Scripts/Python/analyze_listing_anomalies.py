#!/usr/bin/env python3
"""
Comprehensive analysis of all listings for anomalies, wrong field data, mismatches, and nonsensical info
Generates a detailed report without making any changes
"""

import csv
import re
import os
import sys
from datetime import datetime
from urllib.parse import urlparse

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)


def is_valid_url(url):
    """Check if string is a valid URL"""
    if not url or not isinstance(url, str):
        return False
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def is_valid_phone(phone):
    """Check if string looks like a phone number"""
    if not phone or not isinstance(phone, str):
        return False
    # Remove common formatting
    digits = re.sub(r'[^\d+]', '', phone)
    # Should have 10+ digits (with or without country code)
    return len(digits) >= 10


def is_valid_email(email):
    """Check if string looks like an email"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def extract_urls(text):
    """Extract URLs from text"""
    if not text:
        return []
    # Pattern for URLs
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    return re.findall(url_pattern, text)


def check_field_anomalies(listing):
    """Check for data in wrong fields, format issues, etc."""
    issues = []
    name = listing.get('name', 'Unknown')
    
    # Check website field
    website = listing.get('website', '').strip()
    if website:
        if not is_valid_url(website):
            if website.startswith('www.'):
                issues.append(f"Website missing protocol: '{website}' (should be https://www...)")
            elif '@' in website and not website.startswith('mailto:'):
                issues.append(f"Email in website field: '{website}'")
            elif is_valid_phone(website):
                issues.append(f"Phone number in website field: '{website}'")
            else:
                issues.append(f"Invalid website format: '{website}'")
    
    # Check phone field
    phone = listing.get('phone', '').strip()
    if phone:
        if is_valid_url(phone):
            issues.append(f"URL in phone field: '{phone}'")
        elif '@' in phone and not phone.startswith('mailto:'):
            issues.append(f"Email in phone field: '{phone}'")
        elif not is_valid_phone(phone):
            issues.append(f"Invalid phone format: '{phone}'")
    
    # Check address field
    address = listing.get('address', '').strip()
    if address:
        # Check if address contains URLs
        urls = extract_urls(address)
        if urls:
            issues.append(f"URL(s) in address field: {', '.join(urls)}")
        # Check if address contains email
        if '@' in address and not address.startswith('mailto:'):
            emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', address)
            if emails:
                issues.append(f"Email(s) in address field: {', '.join(emails)}")
        # Check if address is suspiciously short (might be wrong data)
        if len(address) < 10 and address not in ['Full address available on booking site']:
            issues.append(f"Address suspiciously short: '{address}'")
    
    # Check description for URLs that should be in website field
    description = listing.get('description', '')
    detailed_desc = listing.get('detailedDescription', '')
    desc_text = (description + ' ' + detailed_desc).strip()
    if desc_text:
        urls = extract_urls(desc_text)
        # If URLs found in description but no website, might be an issue
        if urls and not website:
            issues.append(f"URL(s) in description but no website field: {', '.join(urls[:3])}")
    
    # Check for email addresses in wrong fields
    if description:
        emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', description)
        if emails:
            issues.append(f"Email(s) in description: {', '.join(emails)}")
    
    # Check type/area/category consistency
    listing_type = listing.get('type', '').strip()
    area = listing.get('area', '').strip()
    category = listing.get('category', '').strip()
    
    # Check if type seems wrong for the name/description
    if name and listing_type:
        name_lower = name.lower()
        type_lower = listing_type.lower()
        
        # Check for obvious mismatches
        if 'restaurant' in name_lower and 'restaurant' not in type_lower and 'taste' not in category.lower():
            issues.append(f"Name suggests restaurant but type is '{listing_type}'")
        if 'brewery' in name_lower and 'brewery' not in type_lower and 'brewery' not in description.lower():
            issues.append(f"Name suggests brewery but type is '{listing_type}'")
        if 'winery' in name_lower and 'winery' not in type_lower and 'winery' not in description.lower():
            issues.append(f"Name suggests winery but type is '{listing_type}'")
        if 'lodging' in type_lower or 'hotel' in type_lower or 'inn' in type_lower:
            if 'restaurant' in name_lower and 'lodging' not in name_lower:
                issues.append(f"Name suggests restaurant but type is '{listing_type}'")
    
    # Check area vs address consistency
    if address and area:
        address_lower = address.lower()
        area_lower = area.lower()
        
        # Valid areas
        valid_areas = ['afton', 'lovingston', 'nellysford', 'montebello', 'roseland', 'schuyler', 
                      'wintergreen', 'wintergreen resort', 'arrington', 'faber', 'gladstone', 
                      'massies mill', 'norwood', 'piney river', 'shipman', 'tyro', 'wingina']
        
        # Check if area is in address
        if area_lower not in ['wintergreen', 'wintergreen resort']:  # Wintergreen is special
            if area_lower in valid_areas and area_lower not in address_lower:
                # This might be okay, but flag for review
                pass
        
        # Check if address mentions a different area
        for valid_area in valid_areas:
            if valid_area in address_lower and area_lower != valid_area and area_lower not in ['wintergreen', 'wintergreen resort']:
                if area_lower not in valid_areas:  # Only flag if current area is invalid
                    issues.append(f"Address mentions '{valid_area}' but area field is '{area}'")
    
    # Check for empty critical fields when they should have data
    if not description or len(description.strip()) < 20:
        if listing_type and listing_type.lower() not in ['', 'unknown']:
            issues.append(f"Description is very short or empty ({len(description.strip())} chars)")
    
    # Check for duplicate content between description and detailedDescription
    if description and detailed_desc:
        desc_words = set(re.findall(r'\b\w{4,}\b', description.lower()))
        detailed_words = set(re.findall(r'\b\w{4,}\b', detailed_desc.lower()))
        if len(desc_words) > 0 and len(detailed_words) > 0:
            overlap = len(desc_words & detailed_words) / max(len(desc_words), len(detailed_words))
            if overlap > 0.8:  # 80% overlap
                issues.append(f"Description and detailedDescription are very similar (possible duplication)")
    
    # Check slug format
    slug = listing.get('slug', '').strip()
    if slug:
        if not re.match(r'^[a-z0-9-]+$', slug):
            issues.append(f"Slug has invalid characters: '{slug}' (should be lowercase, numbers, hyphens only)")
        if slug.startswith('-') or slug.endswith('-'):
            issues.append(f"Slug starts or ends with hyphen: '{slug}'")
        if '--' in slug:
            issues.append(f"Slug has double hyphens: '{slug}'")
    
    # Check for HTML/formatting artifacts
    html_tags = re.findall(r'<[^>]+>', description + ' ' + detailed_desc)
    if html_tags:
        # Filter out allowed <a> tags
        non_link_tags = [tag for tag in html_tags if not tag.startswith('<a') and not tag.startswith('</a')]
        if non_link_tags:
            issues.append(f"HTML tags in description (excluding links): {', '.join(set(non_link_tags[:3]))}")
    
    # Check for remaining shortcodes
    shortcodes = re.findall(r'\[[^\]]+\]', description + ' ' + detailed_desc)
    if shortcodes:
        issues.append(f"Shortcodes/formatting artifacts found: {', '.join(set(shortcodes[:3]))}")
    
    # Check for placeholder text
    placeholder_patterns = [
        r'\blorem\s+ipsum\b',
        r'\bplaceholder\b',
        r'\bsample\s+text\b',
        r'\btest\s+content\b'
    ]
    for pattern in placeholder_patterns:
        if re.search(pattern, description + ' ' + detailed_desc, re.IGNORECASE):
            issues.append(f"Placeholder text found: matches '{pattern}'")
    
    # Check for incomplete sentences (ending with ... or very short)
    if description and description.strip().endswith('...'):
        issues.append("Description ends with ellipsis (may be incomplete)")
    
    # Check image URLs
    for i in [1, 2, 3]:
        image = listing.get(f'image{i}', '').strip()
        if image:
            if not is_valid_url(image) and not image.startswith('data:image'):
                if not image.startswith('/'):
                    issues.append(f"Image{i} doesn't look like a valid URL: '{image[:50]}...'")
    
    # Check directionsLink
    directions = listing.get('directionsLink', '').strip()
    if directions:
        if not is_valid_url(directions):
            issues.append(f"directionsLink is not a valid URL: '{directions}'")
    
    # Check googleMapsUrl
    maps_url = listing.get('googleMapsUrl', '').strip()
    if maps_url:
        if not is_valid_url(maps_url):
            issues.append(f"googleMapsUrl is not a valid URL: '{maps_url}'")
    
    return issues


def check_data_consistency(listing):
    """Check for logical inconsistencies and mismatches"""
    issues = []
    name = listing.get('name', 'Unknown')
    
    # Check if name matches slug
    slug = listing.get('slug', '').strip()
    if name and slug:
        # Generate expected slug from name
        expected_slug = name.lower()
        expected_slug = re.sub(r'[^a-z0-9]+', '-', expected_slug)
        expected_slug = re.sub(r'-+', '-', expected_slug)
        expected_slug = expected_slug.strip('-')
        
        # Allow some variation but flag major differences
        if slug and expected_slug:
            # Check if slug is completely different (not just shortened)
            if slug not in expected_slug and expected_slug not in slug:
                # Check similarity
                common_chars = sum(1 for a, b in zip(slug, expected_slug) if a == b)
                similarity = common_chars / max(len(slug), len(expected_slug)) if max(len(slug), len(expected_slug)) > 0 else 0
                if similarity < 0.5:
                    issues.append(f"Slug '{slug}' doesn't match name '{name}' (expected similar to '{expected_slug}')")
    
    # Check type vs category consistency
    listing_type = listing.get('type', '').strip()
    category = listing.get('category', '').strip()
    
    # Common type-category mappings
    type_category_map = {
        'restaurant': 'taste',
        'café': 'taste',
        'coffee shop': 'taste',
        'brewery': 'taste',
        'winery': 'taste',
        'lodging': 'stay',
        'hotel': 'stay',
        'inn': 'stay',
        'cabin': 'stay',
        'hike': 'outdoor',
        'trail': 'outdoor',
        'attraction': 'experience'
    }
    
    if listing_type and category:
        type_lower = listing_type.lower()
        category_lower = category.lower()
        
        # Check if type suggests a category that doesn't match
        for type_key, expected_cat in type_category_map.items():
            if type_key in type_lower and expected_cat not in category_lower:
                # This might be okay, but worth flagging
                pass
    
    # Check if description mentions type but type field is different
    description = (listing.get('description', '') + ' ' + listing.get('detailedDescription', '')).lower()
    if listing_type and description:
        type_words = listing_type.lower().split()
        # Check if description contradicts the type
        if 'restaurant' in listing_type.lower() and 'lodging' in description and 'restaurant' not in description:
            issues.append(f"Type is '{listing_type}' but description emphasizes lodging")
        if 'lodging' in listing_type.lower() and 'restaurant' in description and 'lodging' not in description:
            issues.append(f"Type is '{listing_type}' but description emphasizes restaurant")
    
    return issues


def check_content_quality(listing):
    """Check for low quality, nonsensical, or problematic content"""
    issues = []
    name = listing.get('name', 'Unknown')
    
    description = listing.get('description', '').strip()
    detailed_desc = listing.get('detailedDescription', '').strip()
    
    # Check for very short descriptions
    if description and len(description) < 30:
        issues.append(f"Description is very short ({len(description)} chars)")
    
    # Check for descriptions that are just the name repeated
    if description and name:
        desc_lower = description.lower()
        name_lower = name.lower()
        # Remove common words
        name_words = set(re.findall(r'\b\w{3,}\b', name_lower))
        desc_words = set(re.findall(r'\b\w{3,}\b', desc_lower))
        if name_words and len(desc_words) > 0:
            overlap = len(name_words & desc_words) / len(name_words) if name_words else 0
            if overlap > 0.7 and len(description) < 100:
                issues.append(f"Description mostly repeats the name")
    
    # Check for nonsensical combinations
    if description:
        # Check for contradictory information
        desc_lower = description.lower()
        if 'restaurant' in desc_lower and 'lodging' in desc_lower and 'restaurant' not in listing.get('type', '').lower():
            if 'lodging' not in listing.get('type', '').lower():
                issues.append("Description mentions both restaurant and lodging but type doesn't reflect this")
    
    # Check for incomplete information
    if description and description.endswith('...'):
        issues.append("Description appears incomplete (ends with ellipsis)")
    
    # Check for formatting issues
    if description or detailed_desc:
        text = (description + ' ' + detailed_desc).strip()
        # Multiple spaces
        if '  ' in text:
            issues.append("Multiple consecutive spaces found")
        # Multiple line breaks
        if '\n\n\n' in text:
            issues.append("Multiple consecutive line breaks found")
    
    # Check for URLs that should be clickable but aren't formatted
    if description or detailed_desc:
        text = description + ' ' + detailed_desc
        # Find URLs that aren't in <a> tags
        urls = extract_urls(text)
        for url in urls:
            if url not in detailed_desc or '<a' not in detailed_desc:
                # URL might need to be formatted as link
                pass
    
    return issues


def main():
    # Find the most recent cleaned CSV
    csv_files = [
        'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean-wintergreen-restored-id-fixed.csv',
        'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean-wintergreen-restored.csv',
        'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean.csv',
        'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final.csv',
        'CSV/jan12listings-2026-01-12-3-cleaned.csv',
        'CSV/jan12listings-2026-01-12-3.csv'
    ]
    
    input_csv = None
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            input_csv = csv_file
            break
    
    if not input_csv:
        print("❌ No CSV file found")
        sys.exit(1)
    
    report_file = 'CSV/LISTING_ANOMALIES_REPORT.txt'
    
    print(f"📖 Analyzing: {input_csv}")
    print()
    
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"✅ Loaded {len(listings)} listings")
    print()
    print("🔍 Analyzing for anomalies...")
    print()
    
    all_issues = []
    
    # Check for shared addresses (requires all listings loaded)
    shared_addresses = {}
    for listing in listings:
        address = listing.get('address', '').strip()
        if address and address not in ['Full address available on booking site']:
            # Normalize address for comparison (remove extra spaces, case insensitive)
            normalized = re.sub(r'\s+', ' ', address.lower().strip())
            if normalized not in shared_addresses:
                shared_addresses[normalized] = []
            shared_addresses[normalized].append({
                'name': listing.get('name', 'Unknown'),
                'slug': listing.get('slug', ''),
                'type': listing.get('type', ''),
                'address': address
            })
    
    # Find addresses shared by multiple listings
    duplicate_addresses = {addr: listings_list for addr, listings_list in shared_addresses.items() if len(listings_list) > 1}
    
    for listing in listings:
        name = listing.get('name', 'Unknown')
        slug = listing.get('slug', '')
        
        # Check for various issues
        field_issues = check_field_anomalies(listing)
        consistency_issues = check_data_consistency(listing)
        quality_issues = check_content_quality(listing)
        
        # Check if this listing shares an address with others
        address = listing.get('address', '').strip()
        if address and address not in ['Full address available on booking site']:
            normalized = re.sub(r'\s+', ' ', address.lower().strip())
            if normalized in duplicate_addresses:
                other_listings = [l for l in duplicate_addresses[normalized] if l['slug'] != slug]
                if other_listings:
                    other_names = ', '.join([l['name'] for l in other_listings])
                    field_issues.append(f"Address is shared with other listing(s): {other_names}")
        
        all_issues_for_listing = field_issues + consistency_issues + quality_issues
        
        if all_issues_for_listing:
            all_issues.append({
                'name': name,
                'slug': slug,
                'issues': all_issues_for_listing,
                'listing': listing
            })
    
    # Write comprehensive report
    print(f"📝 Writing report to: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as report:
        report.write("=" * 80 + "\n")
        report.write("COMPREHENSIVE LISTING ANOMALIES REPORT\n")
        report.write("=" * 80 + "\n\n")
        report.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.write(f"Total listings analyzed: {len(listings)}\n")
        report.write(f"Listings with issues: {len(all_issues)}\n")
        
        # Add shared addresses section
        if duplicate_addresses:
            report.write(f"Addresses shared by multiple listings: {len(duplicate_addresses)} addresses\n")
        report.write("\n")
        
        # Add shared addresses summary
        if duplicate_addresses:
            report.write("SHARED ADDRESSES SUMMARY:\n")
            report.write("-" * 80 + "\n\n")
            for addr, listings_list in sorted(duplicate_addresses.items(), key=lambda x: len(x[1]), reverse=True):
                report.write(f"Address: {listings_list[0]['address']}\n")
                report.write(f"  Shared by {len(listings_list)} listings:\n")
                for listing_info in listings_list:
                    report.write(f"    - {listing_info['name']} ({listing_info['slug']}) - Type: {listing_info['type']}\n")
                report.write("\n")
            report.write("=" * 80 + "\n\n")
        
        if all_issues:
            # Group by issue type
            issue_types = {}
            for item in all_issues:
                for issue in item['issues']:
                    issue_type = issue.split(':')[0] if ':' in issue else 'Other'
                    if issue_type not in issue_types:
                        issue_types[issue_type] = []
                    issue_types[issue_type].append({
                        'name': item['name'],
                        'slug': item['slug'],
                        'issue': issue
                    })
            
            report.write("ISSUE SUMMARY BY TYPE:\n")
            report.write("-" * 80 + "\n\n")
            for issue_type, items in sorted(issue_types.items(), key=lambda x: len(x[1]), reverse=True):
                report.write(f"{issue_type}: {len(items)} occurrences\n")
            report.write("\n" + "=" * 80 + "\n\n")
            
            report.write("DETAILED ISSUES BY LISTING:\n")
            report.write("-" * 80 + "\n\n")
            
            for item in all_issues:
                report.write(f"{item['name']} ({item['slug']})\n")
                report.write("-" * 80 + "\n")
                
                for issue in item['issues']:
                    report.write(f"  ⚠️  {issue}\n")
                
                # Show relevant fields
                listing = item['listing']
                report.write(f"\n  Current Data:\n")
                report.write(f"    Type: {listing.get('type', '')}\n")
                report.write(f"    Category: {listing.get('category', '')}\n")
                report.write(f"    Area: {listing.get('area', '')}\n")
                report.write(f"    Address: {listing.get('address', '')[:100]}\n")
                report.write(f"    Phone: {listing.get('phone', '')}\n")
                report.write(f"    Website: {listing.get('website', '')[:100]}\n")
                report.write(f"    Description: {listing.get('description', '')[:150]}...\n")
                if listing.get('detailedDescription'):
                    report.write(f"    Detailed Description: {listing.get('detailedDescription', '')[:150]}...\n")
                
                report.write("\n" + "=" * 80 + "\n\n")
        else:
            report.write("✅ No anomalies found! All listings look good.\n")
    
    print("=" * 80)
    print("✅ ANALYSIS COMPLETE!")
    print("=" * 80)
    print(f"   - Listings analyzed: {len(listings)}")
    print(f"   - Listings with issues: {len(all_issues)}")
    print(f"   - Report: {report_file}")


if __name__ == '__main__':
    main()
