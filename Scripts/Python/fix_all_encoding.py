#!/usr/bin/env python3
"""
Comprehensive encoding fix - normalizes all text and ensures proper UTF-8
Fixes common encoding issues including Äô and other mis-encoded characters
"""

import csv
import sys
import os
import re
import unicodedata
from html import unescape

def normalize_text(text):
    """Normalize text to fix encoding issues"""
    if not text:
        return text
    
    # First, try to fix common encoding issues
    # Common Windows-1252 to UTF-8 mis-encodings
    fixes = {
        # Apostrophes and quotes
        'Äô': "'",
        'â€™': "'",
        'â€˜': "'",
        'â€™': "'",
        # Double quotes
        'â€œ': '"',
        'â€\x9d': '"',
        'â€\x9c': '"',
        'â€\x9d': '"',
        # Dashes
        'â€"': '—',  # Em dash
        'â€"': '–',  # En dash
        # Ellipsis
        'â€¦': '…',
        # Other common issues
        'Ã©': 'é',
        'Ã¨': 'è',
        'Ãª': 'ê',
        'Ã': 'à',
        'Ã¡': 'á',
        'Ã³': 'ó',
        'Ãº': 'ú',
        'Ã±': 'ñ',
        'Ã': 'ç',
    }
    
    # Apply fixes
    for bad, good in fixes.items():
        text = text.replace(bad, good)
    
    # Fix HTML entities
    try:
        text = unescape(text)
    except:
        pass
    
    # Normalize Unicode (NFKC normalization)
    text = unicodedata.normalize('NFKC', text)
    
    # Remove control characters except newlines and tabs
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Remove any remaining problematic byte sequences
    # Keep only valid UTF-8 characters
    try:
        # Re-encode to ensure valid UTF-8
        text = text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    except:
        pass
    
    # Remove any characters that are replacement characters (indicating encoding issues)
    text = text.replace('\ufffd', '')  # Unicode replacement character
    
    return text


def fix_all_encoding(input_path, output_path):
    """Fix all encoding issues in CSV"""
    
    print(f"📖 Reading CSV: {input_path}")
    
    rows = []
    fieldnames = None
    fixed_count = 0
    
    with open(input_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ No headers found in CSV")
            return False
        
        print(f"✅ Found {len(fieldnames)} columns")
        
        # Text fields that might have encoding issues
        text_fields = [
            'description', 'detailedDescription', 'customHtml',
            'accordionPanel1Content', 'accordionPanel2Content',
            'accordionPanel3Content', 'accordionPanel4Content',
            'accordionPanel1Title', 'accordionPanel2Title',
            'accordionPanel3Title', 'accordionPanel4Title',
            'image1Desc', 'image2Desc', 'image3Desc',
            'name', 'address'
        ]
        
        for i, row in enumerate(reader, 2):
            row_fixed = False
            
            for field in text_fields:
                if field in fieldnames:
                    value = row.get(field, '')
                    if value:
                        original = value
                        normalized = normalize_text(value)
                        
                        if normalized != original:
                            row[field] = normalized
                            row_fixed = True
                            if not fixed_count:
                                print(f"   Example fix in {row.get('name', 'Unknown')}: {field}")
                                print(f"      Before: {original[:80]}...")
                                print(f"      After: {normalized[:80]}...")
            
            if row_fixed:
                fixed_count += 1
            
            rows.append(row)
    
    print(f"✅ Processed {len(rows)} rows")
    print(f"   Fixed encoding in {fixed_count} rows")
    
    # Write fixed CSV with proper UTF-8 encoding
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
    
    if fix_all_encoding(input_file, output_file):
        print(f"\n✅ Complete! Encoding-fixed CSV saved to: {output_file}")
        print(f"\n📋 This file:")
        print(f"   - Fixes encoding issues like 'Äô' and other mis-encoded characters")
        print(f"   - Normalizes all text to proper UTF-8")
        print(f"   - Removes control characters and invalid byte sequences")
    else:
        print(f"\n❌ Failed to fix encoding")
        sys.exit(1)


if __name__ == '__main__':
    main()
