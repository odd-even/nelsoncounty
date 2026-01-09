#!/usr/bin/env python3
"""
Extract inline text links from donor CSV nectar fields
Format them as <a> tags in detailedDescription column
Convert nelsoncounty.com links to /explore/slug format
"""

import csv
import sys
import os
import re
from html import unescape
from urllib.parse import urlparse, parse_qs

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)


def extract_text_from_vc_row(vc_content):
    """Extract text from Visual Composer shortcode content, preserving links"""
    if not vc_content:
        return ""
    
    # First, extract and preserve anchor tags
    # We'll process these separately
    text = vc_content
    
    # Remove Visual Composer shortcode tags like [vc_row ...] but keep content
    text = re.sub(r'\[/?vc_[^\]]+\]', ' ', text)
    text = re.sub(r'\[/?[^\]]+\]', ' ', text)
    
    # Decode HTML entities
    text = unescape(text)
    
    # Clean up whitespace but preserve structure
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_links_from_content(content):
    """
    Extract all links from content (HTML anchor tags)
    Returns list of dicts with 'url', 'text', 'full_match'
    """
    if not content:
        return []
    
    links = []
    # Pattern to match <a> tags
    link_pattern = r'<a[^>]*href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>'
    
    for match in re.finditer(link_pattern, content, re.IGNORECASE):
        url = match.group(1).strip()
        text = match.group(2).strip()
        full_match = match.group(0)
        
        # Skip tel: and mailto: links
        if url.startswith('tel:') or url.startswith('mailto:'):
            continue
        
        links.append({
            'url': url,
            'text': text,
            'full_match': full_match
        })
    
    return links


def convert_to_internal_link(url, all_slugs):
    """
    Convert nelsoncounty.com/explore/[slug] links to /explore/slug format
    Returns (is_internal, converted_url) tuple
    """
    url_lower = url.lower()
    
    # Check if it's a nelsoncounty or adventurebook.com link
    if 'nelsoncounty.com' in url_lower or 'adventurebook.com' in url_lower:
        # Try to extract slug from URL
        # Pattern: .../explore/[slug] or .../explore/[slug]/
        explore_match = re.search(r'/explore/([^/?]+)', url_lower)
        if explore_match:
            slug = explore_match.group(1)
            # Check if this slug exists in our listings
            if slug.lower() in all_slugs:
                return True, f'/explore/{slug}'
            else:
                # Still convert to internal format even if slug not found
                return True, f'/explore/{slug}'
    
    return False, url


def format_link_in_text(text, link_info, is_internal, converted_url):
    """
    Replace link in text with properly formatted <a> tag
    """
    url = converted_url if is_internal else link_info['url']
    link_text = link_info['text']
    
    # Create the <a> tag
    if is_internal:
        # Internal link - reference style
        return f'<a href="{url}">{link_text}</a>'
    else:
        # External link - full URL with target="_blank"
        return f'<a href="{url}" target="_blank" rel="noopener noreferrer">{link_text}</a>'


def process_detailed_description(detailed_desc, donor_content, all_slugs):
    """
    Process detailedDescription to add links from donor content
    """
    if not detailed_desc or not donor_content:
        return detailed_desc
    
    # Extract links from donor content
    links = extract_links_from_content(donor_content)
    
    if not links:
        return detailed_desc
    
    # Process each link
    result = detailed_desc
    
    for link_info in links:
        # Check if link text appears in detailed description
        link_text = link_info['text']
        
        # Try to find the link text in the description
        # Use word boundaries to avoid partial matches
        pattern = re.escape(link_text)
        
        # Check if already formatted as a link
        if f'<a href=' in result and link_text in result:
            # Check if this specific link is already there
            if link_info['url'] in result or (link_info['url'].replace('https://', '').replace('http://', '') in result):
                continue
        
        # Check if it's an internal link
        is_internal, converted_url = convert_to_internal_link(link_info['url'], all_slugs)
        
        # Create formatted link
        formatted_link = format_link_in_text(result, link_info, is_internal, converted_url)
        
        # Replace the link text with formatted link
        # Use word boundary to avoid partial matches
        # But be flexible - might need to match without exact word boundaries
        if link_text in result:
            # Replace first occurrence
            result = result.replace(link_text, formatted_link, 1)
        else:
            # Try case-insensitive match
            pattern = re.compile(re.escape(link_text), re.IGNORECASE)
            if pattern.search(result):
                result = pattern.sub(formatted_link, result, count=1)
    
    return result


def load_donor_csv(donor_path):
    """Load donor CSV and extract nectar content with links"""
    donor_data = {}
    
    if not os.path.exists(donor_path):
        print(f"⚠️  Donor file not found: {donor_path}")
        return donor_data
    
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Try different slug field names
            slug = row.get('Slug', '').strip().lower() or row.get('slug', '').strip().lower()
            
            # If no slug, try to extract from Permalink
            if not slug:
                permalink = row.get('Permalink', '').strip()
                if permalink:
                    # Extract slug from URL like https://nelsoncounty.com/explore/rapunzels-coffee-books/
                    match = re.search(r'/explore/([^/]+)', permalink)
                    if match:
                        slug = match.group(1).lower()
            
            name = row.get('Title', '').strip() or row.get('name', '').strip()
            
            if not slug:
                continue
            
            # Get nectar content
            extra_content = row.get('_nectar_portfolio_extra_content', '').strip()
            preview_content = row.get('_nectar_portfolio_extra_content_preview', '').strip()
            
            # Combine both fields (preview first, then extra)
            combined_content = f"{preview_content} {extra_content}".strip()
            
            if combined_content:
                donor_data[slug] = {
                    'name': name,
                    'content': combined_content
                }
    
    return donor_data


def main():
    current_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content-reviewed-fixed-with-short-summaries.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    output_file = current_file.replace('.csv', '-with-links.csv')
    
    if not os.path.exists(current_file):
        print(f"❌ Current file not found: {current_file}")
        sys.exit(1)
    
    print(f"📖 Loading donor CSV: {donor_file}")
    donor_data = load_donor_csv(donor_file)
    print(f"✅ Loaded content for {len(donor_data)} listings from donor")
    print()
    
    print(f"📖 Loading current CSV: {current_file}")
    listings = []
    with open(current_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    print()
    
    # Build slug lookup for internal link validation
    all_slugs = {}
    for listing in listings:
        slug = listing.get('slug', '').strip().lower()
        if slug:
            all_slugs[slug] = listing.get('name', '')
    
    print(f"🔄 Processing links...")
    
    changes_report = []
    updated_count = 0
    
    for listing in listings:
        slug = listing.get('slug', '').strip().lower()
        name = listing.get('name', 'Unknown')
        detailed_desc = listing.get('detailedDescription', '').strip()
        
        if not slug or not detailed_desc:
            continue
        
        # Get donor content for this listing
        donor_content = None
        if slug in donor_data:
            donor_content = donor_data[slug]['content']
        else:
            # Try to find by name
            for donor_slug, donor_info in donor_data.items():
                if donor_info['name'].lower() == name.lower():
                    donor_content = donor_info['content']
                    break
        
        if not donor_content:
            continue
        
        # Extract links from donor content
        links = extract_links_from_content(donor_content)
        
        if not links:
            continue
        
        # Process the detailed description
        original_desc = detailed_desc
        updated_desc = process_detailed_description(detailed_desc, donor_content, all_slugs)
        
        if updated_desc != original_desc:
            listing['detailedDescription'] = updated_desc
            updated_count += 1
            
            # Report changes
            link_count = len(links)
            internal_count = sum(1 for link in links if convert_to_internal_link(link['url'], all_slugs)[0])
            external_count = link_count - internal_count
            
            changes_report.append({
                'name': name,
                'slug': slug,
                'links_added': link_count,
                'internal': internal_count,
                'external': external_count,
                'sample_links': [{'text': l['text'], 'url': l['url']} for l in links[:3]]
            })
    
    print(f"   Updated: {updated_count} listings with links")
    print()
    
    # Write output
    print(f"💾 Writing output to: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for listing in listings:
            writer.writerow(listing)
    
    print(f"✅ Complete! Output saved to: {output_file}")
    print()
    
    # Print detailed report
    print("=" * 80)
    print("📊 DETAILED CHANGES REPORT")
    print("=" * 80)
    print()
    
    total_links = sum(r['links_added'] for r in changes_report)
    total_internal = sum(r['internal'] for r in changes_report)
    total_external = sum(r['external'] for r in changes_report)
    
    print(f"Summary:")
    print(f"  Total listings updated: {updated_count}")
    print(f"  Total links added: {total_links}")
    print(f"  Internal links (nelsoncounty): {total_internal}")
    print(f"  External links: {total_external}")
    print()
    
    print("Sample changes (first 20):")
    print()
    
    for i, report in enumerate(changes_report[:20]):
        print(f"{i+1}. {report['name']} ({report['slug']})")
        print(f"   Links added: {report['links_added']} ({report['internal']} internal, {report['external']} external)")
        for link in report['sample_links']:
            is_internal, converted = convert_to_internal_link(link['url'], all_slugs)
            if is_internal:
                print(f"      - \"{link['text']}\" → {converted} (internal)")
            else:
                print(f"      - \"{link['text']}\" → {link['url']} (external)")
        print()
    
    if len(changes_report) > 20:
        print(f"... and {len(changes_report) - 20} more listings")
        print()
    
    print("=" * 80)
    print("✅ All links have been formatted in detailedDescription column")
    print("   - Internal nelsoncounty links converted to /explore/slug format")
    print("   - External links formatted with target=\"_blank\" rel=\"noopener noreferrer\"")
    print()


if __name__ == '__main__':
    main()
