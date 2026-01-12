#!/usr/bin/env python3
"""
Clean up messy formatting from Nectar/WordPress fields in CSV listings
Removes VC shortcodes, HTML entities, Nectar formatting artifacts, excessive whitespace, etc.
"""

import csv
import re
import sys
import os

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)


def clean_text(text):
    """Clean up text by removing formatting artifacts and normalizing whitespace"""
    if not text or not isinstance(text, str):
        return text
    
    cleaned = text
    
    # Remove Nectar formatting artifacts
    # Pattern: [split_line_heading ...] - match everything until closing bracket or end
    # Handle both [split_line_heading...] and incomplete ones
    cleaned = re.sub(r'\[split_line_heading[^\]]*\]', '', cleaned, flags=re.IGNORECASE)
    # Handle incomplete shortcodes (no closing bracket)
    cleaned = re.sub(r'\[split_line_heading[^\]]*$', '', cleaned, flags=re.IGNORECASE | re.MULTILINE)
    # Remove individual nectar attributes
    cleaned = re.sub(r'line_reveal_by_space[^=\s]*\s*=\s*"[^"]*"', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'line_reveal_by_space[^=\s]*\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'text_effect\s*=\s*"[^"]*"', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'text_effect\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'font_style\s*=\s*"[^"]*"', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'font_style\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'stagger_animation\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'content_alignment\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'mobile_content_alignment\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'animation_type\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'link_target\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'text_content\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'font_size\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'text_color\s*=\s*[^\s\]]+', '', cleaned, flags=re.IGNORECASE)
    # Remove image_with_animation shortcodes
    cleaned = re.sub(r'\[image_with_animation[^\]]*\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[image_with_animation[^\]]*$', '', cleaned, flags=re.IGNORECASE | re.MULTILINE)
    
    # Remove VC shortcodes (Visual Composer)
    cleaned = re.sub(r'\[/?vc_[^\]]+\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[/?[a-z]+_[^\]]+\]', '', cleaned, flags=re.IGNORECASE)
    
    # Remove WordPress shortcodes
    cleaned = re.sub(r'\[caption[^\]]*\].*?\[/caption\]', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'\[gallery[^\]]*\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[embed[^\]]*\].*?\[/embed\]', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove HTML comments
    cleaned = re.sub(r'<!--.*?-->', '', cleaned, flags=re.DOTALL)
    
    # Decode HTML entities (but preserve <a> tags in detailedDescription)
    # Only decode if it's not part of an <a> tag
    def decode_entities(match):
        entity = match.group(0)
        if entity == '&amp;':
            return '&'
        elif entity == '&lt;':
            return '<'
        elif entity == '&gt;':
            return '>'
        elif entity == '&quot;':
            return '"'
        elif entity.startswith('&#'):
            try:
                num = int(entity[2:-1])
                return chr(num)
            except:
                return entity
        return entity
    
    # Only decode entities that are NOT inside <a> tags
    # This is a simplified approach - decode all, then we'll preserve <a> tags
    cleaned = re.sub(r'&amp;', '&', cleaned)
    cleaned = re.sub(r'&lt;', '<', cleaned)
    cleaned = re.sub(r'&gt;', '>', cleaned)
    cleaned = re.sub(r'&quot;', '"', cleaned)
    cleaned = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), cleaned)
    
    # Remove HTML tags from description (but keep <a> tags in detailedDescription)
    # We'll handle this differently for description vs detailedDescription
    
    # Normalize whitespace
    # Replace multiple spaces with single space
    cleaned = re.sub(r' +', ' ', cleaned)
    # Replace multiple line breaks (3+) with double line break
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    # Remove leading/trailing whitespace from each line
    lines = cleaned.split('\n')
    cleaned = '\n'.join(line.strip() for line in lines)
    # Remove leading/trailing whitespace overall
    cleaned = cleaned.strip()
    
    return cleaned


def clean_description_field(text):
    """Clean description field - remove ALL HTML tags"""
    if not text:
        return text
    
    cleaned = clean_text(text)
    
    # Remove all HTML tags from description
    cleaned = re.sub(r'<[^>]+>', '', cleaned)
    
    return cleaned


def clean_detailed_description_field(text):
    """Clean detailedDescription field - preserve <a> tags but remove other HTML"""
    if not text:
        return text
    
    # First, preserve <a> tags by temporarily replacing them
    link_placeholders = []
    placeholder_pattern = '___LINK_PLACEHOLDER_{}___'
    
    def replace_link(match):
        link_placeholders.append(match.group(0))
        return placeholder_pattern.format(len(link_placeholders) - 1)
    
    # Replace all <a> tags with placeholders
    cleaned = re.sub(r'<a\s+[^>]*>.*?</a>', replace_link, text, flags=re.IGNORECASE | re.DOTALL)
    
    # Now clean the text (removes nectar artifacts, etc.)
    cleaned = clean_text(cleaned)
    
    # Remove non-<a> HTML tags
    cleaned = re.sub(r'<[^>]+>', '', cleaned)
    
    # Restore <a> tags
    for i, link in enumerate(link_placeholders):
        cleaned = cleaned.replace(placeholder_pattern.format(i), link)
    
    return cleaned


def main():
    input_file = 'CSV/jan12listings-2026-01-12-3.csv'
    output_file = input_file.replace('.csv', '-cleaned.csv')
    report_file = 'CSV/NECTAR_CLEANUP_REPORT.txt'
    
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"📖 Reading CSV: {input_file}")
    
    changes_made = []
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)
    
    print(f"✅ Loaded {len(rows)} listings")
    print()
    print("🧹 Cleaning formatting issues...")
    print()
    
    for i, row in enumerate(rows, start=2):
        name = row.get('name', 'Unknown')
        original_desc = row.get('description', '')
        original_detailed = row.get('detailedDescription', '')
        
        cleaned_desc = clean_description_field(original_desc)
        cleaned_detailed = clean_detailed_description_field(original_detailed)
        
        changes = []
        if cleaned_desc != original_desc:
            changes.append('description')
            row['description'] = cleaned_desc
        if cleaned_detailed != original_detailed:
            changes.append('detailedDescription')
            row['detailedDescription'] = cleaned_detailed
        
        if changes:
            changes_made.append({
                'row': i,
                'name': name,
                'fields': changes,
                'desc_before': original_desc[:200] if original_desc else '',
                'desc_after': cleaned_desc[:200] if cleaned_desc else '',
                'detailed_before': original_detailed[:200] if original_detailed else '',
                'detailed_after': cleaned_detailed[:200] if cleaned_detailed else ''
            })
    
    print(f"✅ Cleaned {len(changes_made)} listings")
    print()
    
    # Write cleaned CSV
    print(f"💾 Writing cleaned CSV to: {output_file}")
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✅ Cleaned CSV saved")
    print()
    
    # Write report
    print(f"📝 Writing cleanup report to: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as report:
        report.write("=" * 70 + "\n")
        report.write("NECTAR FORMATTING CLEANUP REPORT\n")
        report.write("=" * 70 + "\n\n")
        report.write(f"Total listings cleaned: {len(changes_made)}\n")
        report.write(f"Date: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        if changes_made:
            report.write("LISTINGS CLEANED:\n")
            report.write("-" * 70 + "\n\n")
            
            for item in changes_made:
                report.write(f"{item['row']}. {item['name']}\n")
                report.write(f"   Fields cleaned: {', '.join(item['fields'])}\n")
                
                if 'description' in item['fields']:
                    report.write(f"\n   DESCRIPTION:\n")
                    report.write(f"   Before: {item['desc_before']}...\n")
                    report.write(f"   After:  {item['desc_after']}...\n")
                
                if 'detailedDescription' in item['fields']:
                    report.write(f"\n   DETAILED DESCRIPTION:\n")
                    report.write(f"   Before: {item['detailed_before']}...\n")
                    report.write(f"   After:  {item['detailed_after']}...\n")
                
                report.write("\n")
        else:
            report.write("No formatting issues found - all listings were already clean!\n")
    
    print(f"✅ Report saved")
    print()
    print("=" * 70)
    print("✅ CLEANUP COMPLETE!")
    print("=" * 70)
    print(f"   - Cleaned CSV: {output_file}")
    print(f"   - Report: {report_file}")
    print(f"   - Listings cleaned: {len(changes_made)}")


if __name__ == '__main__':
    main()
