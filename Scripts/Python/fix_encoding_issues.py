#!/usr/bin/env python3
"""
Fix encoding issues in CSV descriptions
Cleans up malformed characters and ensures proper UTF-8 encoding
"""

import csv
import sys
import os
import re
from html import unescape

def fix_encoding_issues(input_path, output_path):
    """Fix encoding issues in CSV file"""
    
    print(f"📖 Reading CSV: {input_path}")
    
    rows = []
    fieldnames = None
    
    # Common encoding fixes
    encoding_fixes = {
        # Common mis-encoded characters
        'Äô': "'",
        'â€™': "'",  # Apostrophe (most common)
        'â€œ': '"',  # Left double quotation mark
        'â€\x9d': '"',  # Right double quotation mark  
        'â€"': '—',  # Em dash
        'â€"': '–',  # En dash
        'â€¦': '…',  # Ellipsis
        # Fix individual characters that might be part of sequences
        'Ä': '',  # Remove if standalone
        'ô': "'",  # Often part of mis-encoded apostrophe
        # Fix common Windows-1252 to UTF-8 issues
        '\x80': '€',
        '\x82': '‚',
        '\x83': 'ƒ',
        '\x84': '„',
        '\x85': '…',
        '\x86': '†',
        '\x87': '‡',
        '\x88': 'ˆ',
        '\x89': '‰',
        '\x8a': 'Š',
        '\x8b': '‹',
        '\x8c': 'Œ',
        '\x8e': 'Ž',
        '\x91': ''',
        '\x92': ''',
        '\x93': '"',
        '\x94': '"',
        '\x95': '•',
        '\x96': '–',
        '\x97': '—',
        '\x98': '˜',
        '\x99': '™',
        '\x9a': 'š',
        '\x9b': '›',
        '\x9c': 'œ',
        '\x9e': 'ž',
        '\x9f': 'Ÿ',
    }
    
    with open(input_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ No headers found in CSV")
            return False
        
        print(f"✅ Found {len(fieldnames)} columns")
        
        fixed_count = 0
        
        for i, row in enumerate(reader, 2):
            # Fix description field (most likely to have encoding issues)
            desc = row.get('description', '')
            if desc:
                original_desc = desc
                
                # Apply encoding fixes
                for bad_char, good_char in encoding_fixes.items():
                    if bad_char in desc:
                        desc = desc.replace(bad_char, good_char)
                
                # Fix HTML entities that might be double-encoded
                try:
                    # Try to decode HTML entities
                    desc = unescape(desc)
                except:
                    pass
                
                # Remove any remaining control characters except newlines/tabs
                desc = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', desc)
                
                # Clean up any remaining weird characters
                # Keep only printable characters, newlines, and common punctuation
                desc = ''.join(char for char in desc if ord(char) < 0x10000 and (
                    char.isprintable() or char in '\n\t'
                ))
                
                if desc != original_desc:
                    row['description'] = desc
                    fixed_count += 1
                    if fixed_count <= 5:
                        print(f"   Fixed encoding in: {row.get('name', 'Unknown')}")
            
            # Also check other text fields
            text_fields = ['detailedDescription', 'customHtml', 'accordionPanel1Content', 
                          'accordionPanel2Content', 'accordionPanel3Content', 'accordionPanel4Content']
            
            for field in text_fields:
                value = row.get(field, '')
                if value:
                    original_value = value
                    
                    # Apply same fixes
                    for bad_char, good_char in encoding_fixes.items():
                        if bad_char in value:
                            value = value.replace(bad_char, good_char)
                    
                    try:
                        value = unescape(value)
                    except:
                        pass
                    
                    value = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', value)
                    value = ''.join(char for char in value if ord(char) < 0x10000 and (
                        char.isprintable() or char in '\n\t'
                    ))
                    
                    if value != original_value:
                        row[field] = value
            
            rows.append(row)
    
    print(f"✅ Processed {len(rows)} rows")
    print(f"   Fixed encoding in {fixed_count} descriptions")
    
    # Write fixed CSV
    print(f"\n💾 Writing fixed CSV: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(
            f, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_MINIMAL
        )
        writer.writeheader()
        
        for row in rows:
            writer.writerow(row)
    
    print(f"✅ Fixed CSV written successfully")
    return True


def main():
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned.csv'
    output_file = input_file.replace('.csv', '-encoding-fixed.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    if fix_encoding_issues(input_file, output_file):
        print(f"\n✅ Complete! Encoding-fixed CSV saved to: {output_file}")
    else:
        print(f"\n❌ Failed to fix encoding")
        sys.exit(1)


if __name__ == '__main__':
    main()
