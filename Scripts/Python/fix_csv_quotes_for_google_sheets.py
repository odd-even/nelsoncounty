#!/usr/bin/env python3
"""
Fix CSV quote escaping for Google Sheets compatibility
Some CSV parsers (like Google Sheets) have issues with certain quote patterns
This script ensures all quotes are properly escaped
"""

import csv
import sys
import os
import re

def fix_quotes_for_google_sheets(text):
    """
    Fix quotes in text to be Google Sheets compatible
    Replace straight quotes with escaped quotes where needed
    """
    if not text:
        return text
    
    # Replace any unescaped quotes within the text
    # Python's csv module will handle escaping, but we need to ensure
    # the text doesn't have problematic quote patterns
    
    # Replace smart quotes that might cause issues
    text = text.replace('"', '"')  # Left double quote
    text = text.replace('"', '"')  # Right double quote
    text = text.replace(''', "'")  # Left single quote
    text = text.replace(''', "'")  # Right single quote
    
    return text


def main():
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready.csv'
    output_file = input_file.replace('.csv', '-fixed-quotes.csv')
    
    problem_slugs = ['subway', 'creekside', 'waltons-mountain-museum', 'wintergreen-getaway-for-families']
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    print(f"📖 Reading CSV: {input_file}")
    
    rows = []
    fieldnames = None
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ No headers found in CSV")
            return False
        
        print(f"✅ Found {len(fieldnames)} columns")
        
        # Text fields that might have quote issues
        text_fields = [
            'description', 'detailedDescription', 'customHtml',
            'accordionPanel1Content', 'accordionPanel2Content',
            'accordionPanel3Content', 'accordionPanel4Content',
            'accordionPanel1Title', 'accordionPanel2Title',
            'accordionPanel3Title', 'accordionPanel4Title',
            'image1Desc', 'image2Desc', 'image3Desc', 'name', 'address'
        ]
        
        fixed_count = 0
        
        for i, row in enumerate(reader, 2):
            slug = row.get('slug', '').strip().lower()
            is_problem = slug in problem_slugs
            
            # Fix quotes in all text fields
            for field in text_fields:
                if field in fieldnames:
                    value = row.get(field, '')
                    if value:
                        original = value
                        fixed = fix_quotes_for_google_sheets(value)
                        if fixed != original:
                            row[field] = fixed
                            if is_problem:
                                fixed_count += 1
                                print(f"   Fixed quotes in {row.get('name', 'Unknown')}: {field}")
            
            rows.append(row)
    
    print(f"✅ Processed {len(rows)} rows")
    print(f"   Fixed quotes in {fixed_count} fields")
    
    # Write with proper CSV escaping - use QUOTE_ALL for problematic fields or QUOTE_MINIMAL
    # Actually, let's use QUOTE_NONNUMERIC to ensure all text fields are quoted
    print(f"\n💾 Writing CSV with proper quote escaping: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        # Use QUOTE_NONNUMERIC to quote all non-numeric fields
        # This ensures Google Sheets parses it correctly
        writer = csv.DictWriter(
            f, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_NONNUMERIC  # Quote all non-numeric fields
        )
        writer.writeheader()
        
        for row in rows:
            # Convert all values to strings for QUOTE_NONNUMERIC
            clean_row = {}
            for field in fieldnames:
                value = row.get(field, '')
                if value == '':
                    clean_row[field] = ''
                else:
                    clean_row[field] = str(value)
            writer.writerow(clean_row)
    
    print(f"✅ Fixed CSV written successfully")
    
    # Verify the problematic listings
    print(f"\n🔍 Verifying problematic listings...")
    with open(output_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('slug', '').strip().lower()
            if slug in problem_slugs:
                name = row.get('name', 'Unknown')
                desc = row.get('description', '')
                print(f"  {name}: description length {len(desc)}, quotes: {desc.count(chr(34))}")
    
    print(f"\n✅ Complete! Fixed CSV saved to: {output_file}")
    print(f"\n📋 This file uses QUOTE_NONNUMERIC which:")
    print(f"   - Quotes all text fields (prevents Google Sheets misparsing)")
    print(f"   - Properly escapes quotes within fields")
    print(f"   - Should fix column alignment issues")
    
    return True


if __name__ == '__main__':
    main()
