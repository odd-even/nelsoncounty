import csv
import re
import shutil
from datetime import datetime

# Files
donor_file = 'CSV/framer-cms-export.csv'
final_file = 'CSV/final_listings_PERFECT.csv'
backup_file = f'CSV/final_listings_PERFECT.csv.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'

print('=' * 80)
print('FIXING PET-FRIENDLY BASED ON DONOR SHEET (AUTHORITATIVE SOURCE)')
print('=' * 80)
print()

# Step 1: Load donor sheet data
print('Step 1: Loading donor sheet data...')
donor_data = {}

with open(donor_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('name', '') or row.get('Name', '') or row.get('title', '')
        if not name:
            continue
        
        desc = row.get('description', '') or row.get('detailedDescription', '') or ''
        categories = row.get('originalCategories', '') or row.get('categories', '') or ''
        amenities = row.get('amenities', '') or ''
        
        # Determine pet-friendly status from donor
        pet_friendly_status = None  # None = not specified, 'yes' = yes, 'no' = no
        
        # Check for explicit "Pet-Friendly? No" or "Yes" in description
        if re.search(r'Pet-Friendly\?\s*(</strong>)?\s*No', desc, re.IGNORECASE):
            pet_friendly_status = 'no'
        elif re.search(r'Pet-Friendly\?\s*(</strong>)?\s*Yes', desc, re.IGNORECASE):
            pet_friendly_status = 'yes'
        # Check for "Pet Friendly" in categories (schema structure)
        elif 'Pet Friendly' in categories or 'Pet-Friendly' in categories:
            pet_friendly_status = 'yes'
        # Check for pet-friendly in amenities or description text
        elif re.search(r'pet.?friendly', amenities, re.IGNORECASE) or re.search(r'pet.?friendly', desc, re.IGNORECASE):
            pet_friendly_status = 'yes'
        
        donor_data[name.lower()] = {
            'name': name,
            'pet_friendly_status': pet_friendly_status,
            'categories': categories,
            'description': desc[:100]
        }

print(f'  Loaded {len(donor_data)} listings from donor sheet')
print(f'  Found {sum(1 for d in donor_data.values() if d["pet_friendly_status"] == "yes")} listings marked as pet-friendly')
print(f'  Found {sum(1 for d in donor_data.values() if d["pet_friendly_status"] == "no")} listings explicitly marked as NOT pet-friendly')
print(f'  Found {sum(1 for d in donor_data.values() if d["pet_friendly_status"] is None)} listings with no pet-friendly specification')
print()

# Step 2: Process final CSV
print('Step 2: Processing final CSV...')

# Create backup
shutil.copy2(final_file, backup_file)
print(f'  Created backup: {backup_file}')

rows_to_update = []
rows_processed = 0
removed_pet_friendly_line = []
changed_no_to_yes = []
changed_yes_to_no = []
kept_as_is = []

with open(final_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    
    for row in reader:
        rows_processed += 1
        name = row.get('name', '')
        detailed_desc = row.get('detailedDescription', '')
        amenities = row.get('amenities', '')
        
        if not name:
            rows_to_update.append(row)
            continue
        
        # Try to match with donor
        name_lower = name.lower()
        donor_match = None
        
        for donor_name_lower, donor_info in donor_data.items():
            if (name_lower == donor_name_lower or 
                name_lower in donor_name_lower or 
                donor_name_lower in name_lower):
                donor_match = donor_info
                break
        
        # Check if row has pet-friendly line in description (various formats)
        has_pet_friendly_line = bool(re.search(r'<strong>Pet-Friendly\?\s*</strong>', detailed_desc, re.IGNORECASE))
        
        if has_pet_friendly_line:
            if donor_match and donor_match['pet_friendly_status'] is not None:
                # Donor has explicit status - update the line to match
                # Check current status (could be Yes, No, N/A, or other text)
                current_has_yes = bool(re.search(r'Pet-Friendly\?\s*</strong>\s*Yes', detailed_desc, re.IGNORECASE))
                current_has_no = bool(re.search(r'Pet-Friendly\?\s*</strong>\s*No', detailed_desc, re.IGNORECASE))
                
                if donor_match['pet_friendly_status'] == 'yes':
                    if current_has_no or (not current_has_yes):
                        # Change to Yes (replace whatever is there)
                        detailed_desc = re.sub(
                            r'<strong>Pet-Friendly\?\s*</strong>\s*[^<]*',
                            '<strong>Pet-Friendly? </strong> Yes',
                            detailed_desc,
                            flags=re.IGNORECASE
                        )
                        row['detailedDescription'] = detailed_desc
                        changed_no_to_yes.append(name)
                    else:
                        kept_as_is.append(name)
                elif donor_match['pet_friendly_status'] == 'no':
                    if current_has_yes or (not current_has_no):
                        # Change to No
                        detailed_desc = re.sub(
                            r'<strong>Pet-Friendly\?\s*</strong>\s*[^<]*',
                            '<strong>Pet-Friendly? </strong> No',
                            detailed_desc,
                            flags=re.IGNORECASE
                        )
                        row['detailedDescription'] = detailed_desc
                        changed_yes_to_no.append(name)
                    else:
                        kept_as_is.append(name)
            else:
                # Donor doesn't specify - remove the pet-friendly line
                # Remove the entire line including surrounding <br> tags
                # Match: <br><strong>Pet-Friendly? </strong> anything up to next <br> or end
                detailed_desc = re.sub(
                    r'<br>\s*<strong>Pet-Friendly\?\s*</strong>\s*[^<]*\s*<br>',
                    '',
                    detailed_desc,
                    flags=re.IGNORECASE
                )
                # Also handle if it's at the end
                detailed_desc = re.sub(
                    r'<br>\s*<strong>Pet-Friendly\?\s*</strong>\s*[^<]*\s*</p>',
                    '</p>',
                    detailed_desc,
                    flags=re.IGNORECASE
                )
                # Handle standalone
                detailed_desc = re.sub(
                    r'<strong>Pet-Friendly\?\s*</strong>\s*[^<]*',
                    '',
                    detailed_desc,
                    flags=re.IGNORECASE
                )
                
                row['detailedDescription'] = detailed_desc
                removed_pet_friendly_line.append(name)
        
        rows_to_update.append(row)

# Step 3: Write updated CSV
print('Step 3: Writing updated CSV...')

with open(final_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows_to_update)

print(f'  Updated {rows_processed} rows')
print()

# Step 4: Report
print('=' * 80)
print('SUMMARY OF CHANGES')
print('=' * 80)
print()
print(f'Removed pet-friendly line (donor did not specify): {len(removed_pet_friendly_line)}')
for name in removed_pet_friendly_line[:10]:
    print(f'  - {name}')
if len(removed_pet_friendly_line) > 10:
    print(f'  ... and {len(removed_pet_friendly_line) - 10} more')
print()

print(f'Changed "No" to "Yes" (donor says pet-friendly): {len(changed_no_to_yes)}')
for name in changed_no_to_yes:
    print(f'  - {name}')
print()

print(f'Changed "Yes" to "No" (donor says NOT pet-friendly): {len(changed_yes_to_no)}')
for name in changed_yes_to_no:
    print(f'  - {name}')
print()

print(f'Kept as-is (already matches donor): {len(kept_as_is)}')
print()

# Save detailed report
report_file = 'PET_FRIENDLY_FIXES_REPORT.txt'
with open(report_file, 'w', encoding='utf-8') as f:
    f.write('=' * 80 + '\n')
    f.write('PET-FRIENDLY FIXES BASED ON DONOR SHEET\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n\n')
    
    f.write(f'Total rows processed: {rows_processed}\n')
    f.write(f'Backup created: {backup_file}\n\n')
    
    f.write('=' * 80 + '\n')
    f.write('REMOVED PET-FRIENDLY LINE (Donor did not specify)\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Total: {len(removed_pet_friendly_line)}\n\n')
    for name in removed_pet_friendly_line:
        f.write(f'  - {name}\n')
    f.write('\n')
    
    f.write('=' * 80 + '\n')
    f.write('CHANGED "No" TO "Yes" (Donor says pet-friendly)\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Total: {len(changed_no_to_yes)}\n\n')
    for name in changed_no_to_yes:
        f.write(f'  - {name}\n')
    f.write('\n')
    
    f.write('=' * 80 + '\n')
    f.write('CHANGED "Yes" TO "No" (Donor says NOT pet-friendly)\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Total: {len(changed_yes_to_no)}\n\n')
    for name in changed_yes_to_no:
        f.write(f'  - {name}\n')
    f.write('\n')

print(f'Detailed report saved to: {report_file}')
print()
print('=' * 80)
print('COMPLETE')
print('=' * 80)
