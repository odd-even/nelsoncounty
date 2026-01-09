#!/usr/bin/env python3
"""
Combine encoding fixes with proper CSV escaping
Creates a final clean CSV file
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
    
    # Common encoding fixes
    fixes = {
        'Äô': "'",
        'â€™': "'",
        'â€œ': '"',
        'â€\x9d': '"',
        'â€"': '—',  # Em dash
        'â€"': '–',  # En dash
        'â€¦': '…',
    }
    
    for bad, good in fixes.items():
        text = text.replace(bad, good)
    
    try:
        text = unescape(text)
    except:
        pass
    
    text = unicodedata.normalize('NFKC', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    try:
        text = text.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    except:
        pass
    
    text = text.replace('\ufffd', '')
    return text


def main():
    # Use the properly escaped file as input
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-properly-escaped.csv'
    output_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL.csv'
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    print('🔧 Applying encoding fixes to properly escaped CSV...')
    print()
    
    text_fields = [
        'description', 'detailedDescription', 'customHtml',
        'accordionPanel1Content', 'accordionPanel2Content',
        'accordionPanel3Content', 'accordionPanel4Content',
        'accordionPanel1Title', 'accordionPanel2Title',
        'accordionPanel3Title', 'accordionPanel4Title',
        'image1Desc', 'image2Desc', 'image3Desc', 'name', 'address'
    ]
    
    fixed_count = 0
    
    with open(input_file, 'r', encoding='utf-8', errors='replace') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(
                outfile, 
                fieldnames=fieldnames, 
                quoting=csv.QUOTE_MINIMAL
            )
            writer.writeheader()
            
            for row in reader:
                row_fixed = False
                for field in text_fields:
                    if field in fieldnames:
                        value = row.get(field, '')
                        if value:
                            normalized = normalize_text(value)
                            if normalized != value:
                                row[field] = normalized
                                row_fixed = True
                if row_fixed:
                    fixed_count += 1
                writer.writerow(row)
    
    print(f'✅ Fixed encoding in {fixed_count} rows')
    print(f'✅ Final CSV saved to: {output_file}')
    print()
    print('This file has:')
    print('  - Proper CSV escaping (prevents column misalignment)')
    print('  - Fixed encoding issues (removes Äô and other mis-encoded chars)')
    print('  - All address/phone cleaning changes preserved')


if __name__ == '__main__':
    main()
