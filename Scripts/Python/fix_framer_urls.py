#!/usr/bin/env python3
"""
Fix image URLs in CSV to ensure Framer can import them successfully.
- Ensures all URLs are valid HTTP/HTTPS URLs or completely empty
- Removes any whitespace, newlines, or control characters
- Handles multiple URLs separated by semicolons
- Validates URL format before keeping
"""

import csv
import re
from urllib.parse import urlparse

def is_valid_url(url):
    """Check if URL is valid for Framer"""
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    if not url:
        return False
    
    # Must be HTTP/HTTPS URL (Framer needs absolute URLs)
    if url.startswith('http://') or url.startswith('https://'):
        try:
            result = urlparse(url)
            # Must have netloc (domain)
            if result.netloc:
                return True
        except:
            pass
    
    # Data URLs are also valid
    if url.startswith('data:'):
        return True
    
    return False

def clean_url(url):
    """Clean and validate URL"""
    if not url:
        return ''
    
    url = str(url).strip()
    
    # Remove any control characters except allowed ones
    url = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', url)
    
    # If multiple URLs separated by semicolon, take the first valid one
    if ';' in url:
        parts = url.split(';')
        for part in parts:
            cleaned = part.strip()
            if is_valid_url(cleaned):
                return cleaned
        # If none are valid, return empty
        return ''
    
    # Remove newlines, tabs, etc.
    url = re.sub(r'[\n\r\t]', '', url)
    
    # Validate
    if is_valid_url(url):
        return url
    
    # If not valid, return empty
    return ''

def main():
    input_file = 'listings-2025-11-13-14-merged.csv'
    output_file = 'listings-2025-11-13-14-merged.csv'
    
    rows = []
    updates = []
    fieldnames = None
    
    print('=== FIXING IMAGE URLS FOR FRAMER ===\n')
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row_num, row in enumerate(reader, start=2):
            # Clean up None values
            cleaned_row = {}
            for key in fieldnames:
                value = row.get(key, '')
                if value is None:
                    cleaned_row[key] = ''
                else:
                    cleaned_row[key] = str(value)
            
            # Process image fields
            for field in ['image1', 'image2', 'image3']:
                if field not in cleaned_row:
                    cleaned_row[field] = ''
                
                original_url = cleaned_row.get(field, '').strip()
                cleaned_url = clean_url(original_url)
                
                if cleaned_url != original_url:
                    updates.append({
                        'row': row_num,
                        'name': cleaned_row.get('name', 'Unknown'),
                        'field': field,
                        'old': original_url[:80] if original_url else '(empty)',
                        'new': cleaned_url[:80] if cleaned_url else '(empty)'
                    })
                    cleaned_row[field] = cleaned_url
            
            rows.append(cleaned_row)
    
    if updates:
        print(f'Found {len(updates)} URLs to fix:\n')
        for update in updates[:20]:
            print(f'Row {update["row"]}: {update["name"]}')
            print(f'  Field: {update["field"]}')
            print(f'  {update["old"]} → {update["new"]}')
            print()
        if len(updates) > 20:
            print(f'... and {len(updates) - 20} more\n')
    else:
        print('✅ No URLs need fixing!\n')
    
    # Write updated CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f'✅ Updated CSV file: {output_file}')
    print(f'   Fixed {len(updates)} image URL fields')
    print()
    print('The CSV should now import successfully into Framer!')
    
    # Final verification
    print('\n=== VERIFICATION ===')
    problematic = []
    with open(output_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row_num, row in enumerate(reader, start=2):
            for field in ['image1', 'image2', 'image3']:
                url = row.get(field, '').strip() if row.get(field) else ''
                if url and not is_valid_url(url):
                    problematic.append({
                        'row': row_num,
                        'name': row.get('name', 'Unknown'),
                        'field': field,
                        'url': url[:60]
                    })
    
    if problematic:
        print(f'⚠️  Found {len(problematic)} still problematic URLs:')
        for item in problematic:
            print(f'  Row {item["row"]}: {item["name"]} - {item["field"]}')
            print(f'    URL: {item["url"]}')
    else:
        print('✅ All image URLs are valid for Framer!')

if __name__ == '__main__':
    main()

