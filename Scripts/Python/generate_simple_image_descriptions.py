#!/usr/bin/env python3
"""
Generate simple alt descriptions for images based on listing name and image position.
This is much faster than AI generation and creates SEO-friendly descriptions.
Max 15 words per description.
"""

import csv
import sys
from pathlib import Path

def generate_simple_description(listing_name, image_num, description_text=''):
    """Generate a simple description from listing name and image number"""
    # Base descriptions
    image_descriptions = {
        1: 'Exterior view of {name}',
        2: 'Interior view of {name}',
        3: 'Additional photo of {name}'
    }
    
    # Get base description
    base_desc = image_descriptions.get(image_num, f'Photo of {listing_name}')
    
    # If there's description text, try to extract keywords
    if description_text:
        desc_lower = description_text.lower()
        # Check for keywords to make description more specific
        if any(word in desc_lower for word in ['coffee', 'cafe', 'bakery', 'restaurant', 'dining']):
            base_desc = f'Dining area at {listing_name}' if image_num > 1 else f'Exterior of {listing_name} restaurant'
        elif any(word in desc_lower for word in ['cabin', 'cottage', 'lodge', 'house', 'rental']):
            base_desc = f'Interior of {listing_name}' if image_num > 1 else f'Exterior view of {listing_name}'
        elif any(word in desc_lower for word in ['trail', 'hike', 'outdoor', 'nature']):
            base_desc = f'Scenic view from {listing_name}'
        elif any(word in desc_lower for word in ['vineyard', 'winery', 'tasting']):
            base_desc = f'Tasting room at {listing_name}' if image_num > 1 else f'Vineyard at {listing_name}'
        elif any(word in desc_lower for word in ['brewery', 'beer', 'cider']):
            base_desc = f'Taproom at {listing_name}' if image_num > 1 else f'Exterior of {listing_name} brewery'
        elif any(word in desc_lower for word in ['market', 'deli', 'store', 'grocery']):
            base_desc = f'Interior of {listing_name}' if image_num > 1 else f'Storefront of {listing_name}'
        elif any(word in desc_lower for word in ['farm', 'orchard']):
            base_desc = f'Farm view at {listing_name}' if image_num > 1 else f'Exterior of {listing_name} farm'
        elif any(word in desc_lower for word in ['museum', 'heritage', 'historical']):
            base_desc = f'Exhibit at {listing_name}' if image_num > 1 else f'Exterior of {listing_name} museum'
    
    # Format with listing name
    description = base_desc.format(name=listing_name)
    
    # Ensure max 15 words
    words = description.split()
    if len(words) > 15:
        description = ' '.join(words[:15])
    
    return description

def main():
    input_file = Path('listings-2025-11-13-14-merged.csv')
    output_file = Path('listings-2025-11-13-14-merged.csv')
    
    if not input_file.exists():
        print(f"Error: {input_file} not found")
        sys.exit(1)
    
    print(f"Reading {input_file.name}...")
    
    rows = []
    header = None
    updates = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        image1_idx = header.index('image1')
        image2_idx = header.index('image2')
        image3_idx = header.index('image3')
        image1Desc_idx = header.index('image1Desc')
        image2Desc_idx = header.index('image2Desc')
        image3Desc_idx = header.index('image3Desc')
        name_idx = header.index('name')
        desc_idx = header.index('description') if 'description' in header else None
        type_idx = header.index('type') if 'type' in header else None
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) > max(image1_idx, image2_idx, image3_idx):
                name = row[name_idx].strip() if len(row) > name_idx else ''
                description = row[desc_idx].strip() if desc_idx and len(row) > desc_idx else ''
                listing_type = row[type_idx].strip() if type_idx and len(row) > type_idx else ''
                
                # Check each image
                for img_num, img_idx, desc_idx_col in [(1, image1_idx, image1Desc_idx), 
                                                       (2, image2_idx, image2Desc_idx), 
                                                       (3, image3_idx, image3Desc_idx)]:
                    img_url = row[img_idx].strip() if len(row) > img_idx else ''
                    desc = row[desc_idx_col].strip() if len(row) > desc_idx_col else ''
                    
                    # Only process if image exists but description doesn't
                    if img_url and not desc and name:
                        # Generate simple description
                        new_description = generate_simple_description(name, img_num, description or listing_type)
                        
                        # Update the row
                        row[desc_idx_col] = new_description
                        
                        updates.append({
                            'row_num': row_num,
                            'name': name,
                            'image_num': img_num,
                            'description': new_description
                        })
            
            rows.append(row)
    
    if not updates:
        print("✅ All images already have descriptions!")
        return
    
    print(f"\nFound {len(updates)} images missing descriptions")
    print(f"Generating simple descriptions based on listing names...\n")
    
    # Show examples
    print("Sample descriptions to be generated:")
    for update in updates[:10]:
        word_count = len(update['description'].split())
        print(f"  {update['name']} - Image {update['image_num']}: \"{update['description']}\" ({word_count} words)")
    if len(updates) > 10:
        print(f"  ... and {len(updates) - 10} more\n")
    
    # Write updated CSV
    print(f"Writing updated CSV to {output_file.name}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"\n✅ Done! Generated {len(updates)} descriptions.")
    print(f"  All descriptions are max 15 words and SEO-friendly.")
    print(f"  You can refine specific ones later using AI if needed.")

if __name__ == '__main__':
    main()

