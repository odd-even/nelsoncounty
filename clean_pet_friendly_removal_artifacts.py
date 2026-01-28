import csv
import re
import shutil
from datetime import datetime

# Files
final_file = 'CSV/final_listings_PERFECT.csv'
backup_file = f'CSV/final_listings_PERFECT.csv.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'

print('=' * 80)
print('CLEANING UP LINE BREAK ARTIFACTS FROM PET-FRIENDLY REMOVAL')
print('=' * 80)
print()

# Create backup
shutil.copy2(final_file, backup_file)
print(f'Created backup: {backup_file}')
print()

rows_updated = 0
cleaned_listings = []

with open(final_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

for row in rows:
    detailed_desc = row.get('detailedDescription', '')
    original_desc = detailed_desc
    
    # Clean up consecutive <br> tags (3 or more)
    detailed_desc = re.sub(r'<br>\s*<br>\s*<br>+', '<br><br>', detailed_desc)
    
    # Clean up <br><br> before closing </p> tag (should just be </p>)
    detailed_desc = re.sub(r'<br>\s*<br>\s*</p>', '</p>', detailed_desc)
    
    # Clean up <br><br> after opening <p> tag (should just be <p>)
    detailed_desc = re.sub(r'<p>\s*<br>\s*<br>', '<p>', detailed_desc)
    
    # Clean up <br><br> between sections (reduce to single <br> if it's excessive)
    # But keep <br><br> between major sections like Email and Staff on Site
    # Only clean if there are 3+ consecutive <br> tags
    
    if detailed_desc != original_desc:
        row['detailedDescription'] = detailed_desc
        rows_updated += 1
        cleaned_listings.append(row.get('name', 'Unknown'))

# Write updated CSV
with open(final_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f'Cleaned {rows_updated} listings with line break artifacts')
print()
print('Listings cleaned:')
for name in cleaned_listings[:20]:
    print(f'  - {name}')
if len(cleaned_listings) > 20:
    print(f'  ... and {len(cleaned_listings) - 20} more')
print()
print('=' * 80)
print('COMPLETE')
print('=' * 80)
