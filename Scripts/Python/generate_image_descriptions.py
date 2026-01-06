#!/usr/bin/env python3
"""
Generate alt descriptions for all images in the CSV using AI.
Uses Google Apps Script endpoint that's already configured.
Max 15 words per description.
"""

import csv
import sys
import time
import json
import urllib.request
import urllib.parse
from pathlib import Path

# Google Apps Script URL (from index-sheets.html)
GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec'

def generate_image_description(image_url):
    """Call Google Apps Script to generate image description"""
    try:
        # Use GET request to avoid CORS preflight
        params = urllib.parse.urlencode({
            'action': 'generateImageDescription',
            'imageUrl': image_url,
            't': int(time.time() * 1000)
        })
        url = f"{GOOGLE_APPS_SCRIPT_URL}?{params}"
        
        request = urllib.request.Request(url)
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode())
        
        if result.get('success'):
            description = result.get('description', '').strip()
            # Ensure max 15 words
            words = description.split()
            if len(words) > 15:
                description = ' '.join(words[:15])
            return description
        else:
            error = result.get('error', 'Unknown error')
            print(f"    ⚠️  Error: {error}")
            return None
            
    except Exception as e:
        print(f"    ❌ Exception: {str(e)}")
        return None

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
    failed = []
    
    # First pass: collect all images that need descriptions
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
        
        for row_num, row in enumerate(reader, start=2):
            if len(row) > max(image1_idx, image2_idx, image3_idx):
                name = row[name_idx].strip() if len(row) > name_idx else ''
                
                # Check each image
                for img_num, img_idx, desc_idx in [(1, image1_idx, image1Desc_idx), 
                                                   (2, image2_idx, image2Desc_idx), 
                                                   (3, image3_idx, image3Desc_idx)]:
                    img_url = row[img_idx].strip() if len(row) > img_idx else ''
                    desc = row[desc_idx].strip() if len(row) > desc_idx else ''
                    
                    # Only process if image exists but description doesn't
                    if img_url and not desc:
                        # Only process ImageKit URLs (external URLs might not work well)
                        if 'ik.imagekit.io' in img_url:
                            updates.append({
                                'row_num': row_num,
                                'row': row,
                                'name': name,
                                'image_num': img_num,
                                'image_url': img_url,
                                'desc_idx': desc_idx
                            })
            
            rows.append(row)
    
    if not updates:
        print("✅ All images already have descriptions!")
        return
    
    print(f"\nFound {len(updates)} images missing descriptions")
    print(f"Generating descriptions (max 15 words each)...\n")
    
    # Generate descriptions
    success_count = 0
    for i, update in enumerate(updates, 1):
        print(f"[{i}/{len(updates)}] {update['name']} - Image {update['image_num']}")
        print(f"  URL: {update['image_url'][:70]}...")
        
        description = generate_image_description(update['image_url'])
        
        if description:
            word_count = len(description.split())
            if word_count > 15:
                words = description.split()[:15]
                description = ' '.join(words)
            
            # Update the row
            update['row'][update['desc_idx']] = description
            success_count += 1
            
            word_count = len(description.split())
            print(f"  ✅ Generated ({word_count} words): {description[:80]}...")
        else:
            failed.append({
                'name': update['name'],
                'image_num': update['image_num'],
                'url': update['image_url']
            })
            print(f"  ❌ Failed to generate description")
        
        # Rate limiting - wait 1 second between requests
        if i < len(updates):
            time.sleep(1)
        
        print()
    
    # Write updated CSV
    print(f"\nWriting updated CSV to {output_file.name}...")
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        
        # Create a map of updated rows
        updated_rows = {}
        for update in updates:
            row_num = update['row_num']
            updated_rows[row_num] = update['row']
        
        # Write all rows (using updated versions where available)
        for idx, row in enumerate(rows, start=2):
            if idx in updated_rows:
                writer.writerow(updated_rows[idx])
            else:
                writer.writerow(row)
    
    print(f"\n✅ Done!")
    print(f"  - Successfully generated: {success_count} descriptions")
    print(f"  - Failed: {len(failed)} images")
    
    if failed:
        print(f"\n⚠️  Failed to generate descriptions for:")
        for item in failed[:10]:
            print(f"  - {item['name']} (Image {item['image_num']})")
        if len(failed) > 10:
            print(f"  ... and {len(failed) - 10} more")

if __name__ == '__main__':
    main()

