#!/usr/bin/env python3
"""
Fix CSV for Google Sheets - replace quotes in descriptions with alternatives
This ensures Google Sheets can parse the CSV correctly
"""

import csv
import sys
import os
import re

def replace_quotes_in_text(text):
    """
    Replace problematic quotes in text with alternatives
    This prevents CSV parsing issues in Google Sheets
    """
    if not text:
        return text
    
    # Replace straight quotes with alternatives that won't break CSV parsing
    # Use single quotes or remove quotes entirely for simplicity
    # Actually, let's use curly quotes which are less likely to cause issues
    # Or better: replace with single quotes or remove entirely
    
    # Replace " with ' (single quote) - simpler and less likely to cause issues
    text = text.replace('"', "'")
    
    # Also replace smart quotes
    text = text.replace('"', "'")
    text = text.replace('"', "'")
    text = text.replace(''', "'")
    text = text.replace(''', "'")
    
    return text


def main():
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready.csv'
    output_file = input_file.replace('.csv', '-no-quotes.csv')
    
    problem_slugs = ['subway', 'creekside', 'waltons-mountain-museum', 'wintergreen-getaway-for-families']
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    print(f"📖 Reading CSV: {input_file}")
    
    rows = []
    fieldnames = None
    fixed_count = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        if not fieldnames:
            print("❌ No headers found in CSV")
            return False
        
        print(f"✅ Found {len(fieldnames)} columns")
        
        # Text fields that might have quotes
        text_fields = [
            'description', 'detailedDescription', 'customHtml',
            'accordionPanel1Content', 'accordionPanel2Content',
            'accordionPanel3Content', 'accordionPanel4Content',
            'accordionPanel1Title', 'accordionPanel2Title',
            'accordionPanel3Title', 'accordionPanel4Title',
            'image1Desc', 'image2Desc', 'image3Desc', 'name', 'address'
        ]
        
        for i, row in enumerate(reader, 2):
            slug = row.get('slug', '').strip().lower()
            is_problem = slug in problem_slugs
            
            # Fix quotes in all text fields
            for field in text_fields:
                if field in fieldnames:
                    value = row.get(field, '')
                    if value and ('"' in value or '"' in value or '"' in value):
                        original = value
                        fixed = replace_quotes_in_text(value)
                        row[field] = fixed
                        if is_problem:
                            fixed_count += 1
                            if fixed_count <= 4:
                                print(f"   Fixed quotes in {row.get('name', 'Unknown')}: {field}")
                                print(f"      Before: {original[:80]}...")
                                print(f"      After: {fixed[:80]}...")
            
            rows.append(row)
    
    print(f"✅ Processed {len(rows)} rows")
    print(f"   Fixed quotes in {fixed_count} fields")
    
    # Write with QUOTE_MINIMAL (standard CSV)
    print(f"\n💾 Writing CSV: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(
            f, 
            fieldnames=fieldnames,
            quoting=csv.QUOTE_MINIMAL  # Standard CSV quoting
        )
        writer.writeheader()
        
        for row in rows:
            writer.writerow(row)
    
    print(f"✅ Fixed CSV written successfully")
    
    # Verify problematic listings
    print(f"\n🔍 Verifying problematic listings...")
    with open(output_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('slug', '').strip().lower()
            if slug in problem_slugs:
                name = row.get('name', 'Unknown')
                desc = row.get('description', '')
                print(f"  {name}:")
                print(f"    Description: {desc[:150]}...")
                print(f"    Quotes in desc: {desc.count(chr(34))} (should be 0)")
                print()
    
    print(f"\n✅ Complete! Fixed CSV saved to: {output_file}")
    print(f"\n📋 This file:")
    print(f"   - Replaced all quotes in descriptions with single quotes")
    print(f"   - Uses standard CSV quoting (QUOTE_MINIMAL)")
    print(f"   - Should fix Google Sheets column alignment issues")
    
    return True


if __name__ == '__main__':
    main()
