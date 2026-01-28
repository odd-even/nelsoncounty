import csv
import re
import shutil
from datetime import datetime

# Read donor sheet to find listings with explicit Pet-Friendly? No or Yes
donor_file = 'CSV/framer-cms-export.csv'
donor_explicit_pet_friendly = {}

with open(donor_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('name', '') or row.get('Name', '') or row.get('title', '')
        desc = row.get('detailedDescription', '') or row.get('description', '') or ''
        
        # Check for explicit "Pet-Friendly? No" or "Pet-Friendly? Yes"
        if re.search(r'Pet-Friendly\?\s*(</strong>)?\s*No', desc, re.IGNORECASE):
            donor_explicit_pet_friendly[name.lower()] = 'No'
        elif re.search(r'Pet-Friendly\?\s*(</strong>)?\s*Yes', desc, re.IGNORECASE):
            donor_explicit_pet_friendly[name.lower()] = 'Yes'

print(f'Found {len(donor_explicit_pet_friendly)} listings with explicit Pet-Friendly? in donor sheet\n')

# Read final CSV
final_file = 'CSV/final_listings_PERFECT.csv'
backup_file = f'CSV/final_listings_PERFECT.csv.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'

# Create backup
shutil.copy2(final_file, backup_file)
print(f'Created backup: {backup_file}\n')

# Process final CSV
rows_updated = []
rows_unchanged = []

with open(final_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

for row in rows:
    name = row.get('name', '')
    detailed_desc = row.get('detailedDescription', '')
    original_desc = detailed_desc
    
    # Check if this listing has explicit Pet-Friendly? in donor
    name_lower = name.lower()
    has_explicit_in_donor = False
    
    for donor_name, donor_status in donor_explicit_pet_friendly.items():
        if name_lower in donor_name or donor_name in name_lower:
            has_explicit_in_donor = True
            break
    
    # If donor doesn't have explicit Pet-Friendly?, remove the line from detailedDescription
    if not has_explicit_in_donor:
        # Remove Pet-Friendly? line (with various formats)
        # Pattern: <strong>Pet-Friendly? </strong> No or Yes (with optional </strong>)
        patterns = [
            r'<strong>Pet-Friendly\?\s*</strong>\s*(No|Yes)',
            r'<strong>Pet-Friendly\?\s*(No|Yes)',
            r'Pet-Friendly\?\s*</strong>\s*(No|Yes)',
            r'Pet-Friendly\?\s*(No|Yes)',
        ]
        
        for pattern in patterns:
            detailed_desc = re.sub(pattern, '', detailed_desc, flags=re.IGNORECASE)
        
        # Clean up any double <br> tags that might result
        detailed_desc = re.sub(r'<br>\s*<br>\s*<br>+', '<br><br>', detailed_desc)
        detailed_desc = re.sub(r'<br>\s*<br>\s*<br>', '<br><br>', detailed_desc)
        
        if detailed_desc != original_desc:
            row['detailedDescription'] = detailed_desc
            rows_updated.append({
                'name': name,
                'original': original_desc[:200] + '...' if len(original_desc) > 200 else original_desc,
                'updated': detailed_desc[:200] + '...' if len(detailed_desc) > 200 else detailed_desc
            })
        else:
            rows_unchanged.append(name)
    else:
        rows_unchanged.append(name)

# Write updated CSV
with open(final_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print('=' * 80)
print('PET-FRIENDLY LINE REMOVAL REPORT')
print('=' * 80)
print(f'\nTotal listings processed: {len(rows)}')
print(f'Listings with explicit Pet-Friendly? in donor: {len(donor_explicit_pet_friendly)}')
print(f'Listings updated (Pet-Friendly? line removed): {len(rows_updated)}')
print(f'Listings unchanged: {len(rows_unchanged)}')

# Save detailed report
report_file = 'PET_FRIENDLY_LINE_REMOVAL_REPORT.txt'
with open(report_file, 'w', encoding='utf-8') as f:
    f.write('=' * 80 + '\n')
    f.write('PET-FRIENDLY LINE REMOVAL REPORT\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n')
    f.write(f'Total listings processed: {len(rows)}\n')
    f.write(f'Listings with explicit Pet-Friendly? in donor: {len(donor_explicit_pet_friendly)}\n')
    f.write(f'Listings updated (Pet-Friendly? line removed): {len(rows_updated)}\n')
    f.write(f'Listings unchanged: {len(rows_unchanged)}\n\n')
    
    f.write('=' * 80 + '\n')
    f.write('LISTINGS WITH EXPLICIT Pet-Friendly? IN DONOR (KEPT)\n')
    f.write('=' * 80 + '\n\n')
    for donor_name, status in sorted(donor_explicit_pet_friendly.items()):
        f.write(f'{donor_name}: {status}\n')
    
    f.write('\n' + '=' * 80 + '\n')
    f.write('LISTINGS UPDATED (Pet-Friendly? LINE REMOVED)\n')
    f.write('=' * 80 + '\n\n')
    for item in rows_updated[:50]:  # First 50
        f.write(f'{item["name"]}\n')
        f.write(f'  Original snippet: ...{item["original"]}\n')
        f.write(f'  Updated snippet: ...{item["updated"]}\n\n')
    
    if len(rows_updated) > 50:
        f.write(f'... and {len(rows_updated) - 50} more listings updated\n\n')
    
    f.write('\n' + '=' * 80 + '\n')
    f.write('SUMMARY\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'For listings that did NOT have explicit "Pet-Friendly? No" or "Pet-Friendly? Yes"\n')
    f.write(f'in the donor sheet, the Pet-Friendly? line has been removed from detailedDescription.\n\n')
    f.write(f'Backup saved to: {backup_file}\n')

print(f'\nDetailed report saved to: {report_file}')
print(f'\nFirst 10 listings updated:')
for item in rows_updated[:10]:
    print(f'  - {item["name"]}')
