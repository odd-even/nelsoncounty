import csv
import re

# Get all listings from donor sheet that have "Pet Friendly" in categories or mentions
donor_file = 'CSV/framer-cms-export.csv'
donor_pet_friendly = {}

with open(donor_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('name', '') or row.get('Name', '') or row.get('title', '')
        categories = row.get('originalCategories', '') or row.get('categories', '') or ''
        desc = row.get('description', '') or row.get('detailedDescription', '') or ''
        amenities = row.get('amenities', '') or ''
        
        # Check if pet-friendly in categories or mentioned in description/amenities
        is_pet_friendly = False
        reason = []
        
        if 'Pet Friendly' in categories or 'Pet-Friendly' in categories:
            is_pet_friendly = True
            reason.append('In categories')
        
        if re.search(r'pet.?friendly', desc, re.IGNORECASE):
            is_pet_friendly = True
            reason.append('In description')
        
        if re.search(r'pet.?friendly', amenities, re.IGNORECASE):
            is_pet_friendly = True
            reason.append('In amenities')
        
        if is_pet_friendly:
            donor_pet_friendly[name.lower()] = {
                'name': name,
                'categories': categories,
                'description': desc[:200],
                'amenities': amenities,
                'reason': '; '.join(reason)
            }

print(f'Found {len(donor_pet_friendly)} listings marked as pet-friendly in donor sheet\n')

# Now check final CSV for these listings
final_file = 'CSV/final_listings_PERFECT.csv'
conflicts = []
final_listings = {}

# First, load all final CSV listings
with open(final_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('name', '')
        final_listings[name.lower()] = {
            'name': name,
            'detailedDescription': row.get('detailedDescription', ''),
            'amenities': row.get('amenities', '')
        }

# Now match donor pet-friendly listings with final CSV
for donor_name_lower, donor_info in donor_pet_friendly.items():
    matched = False
    
    # Try to find matching listing in final CSV
    for final_name_lower, final_info in final_listings.items():
        # Check if names match (either way)
        if (donor_name_lower in final_name_lower or 
            final_name_lower in donor_name_lower or
            donor_info['name'].lower() == final_info['name'].lower()):
            
            matched = True
            detailed_desc = final_info['detailedDescription']
            
            # Check if final CSV says "Pet-Friendly? No"
            if re.search(r'Pet-Friendly\?\s*</strong>\s*No', detailed_desc, re.IGNORECASE):
                conflicts.append({
                    'name': final_info['name'],
                    'donor_name': donor_info['name'],
                    'donor_reason': donor_info['reason'],
                    'donor_categories': donor_info['categories'],
                    'donor_amenities': donor_info['amenities'],
                    'final_amenities': final_info['amenities'],
                    'final_desc_snippet': detailed_desc[:400]
                })
            break

print('=' * 80)
print('CONFLICTS: Donor says Pet-Friendly but Final CSV says Pet-Friendly? No')
print('=' * 80)
print(f'\nFound {len(conflicts)} conflicts\n')

for i, conflict in enumerate(conflicts, 1):
    print(f'{i}. {conflict["name"]}')
    print(f'   Donor name: {conflict["donor_name"]}')
    print(f'   Donor reason: {conflict["donor_reason"]}')
    print(f'   Donor categories: {conflict["donor_categories"]}')
    print(f'   Final CSV description snippet: {conflict["final_desc_snippet"][:200]}...')
    print()

# Save report
with open('PET_FRIENDLY_DONOR_CONFLICTS_REPORT.txt', 'w', encoding='utf-8') as f:
    f.write('=' * 80 + '\n')
    f.write('PET-FRIENDLY CONFLICTS: DONOR SAYS YES, FINAL CSV SAYS NO\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Total conflicts found: {len(conflicts)}\n\n')
    
    for i, conflict in enumerate(conflicts, 1):
        f.write(f'{i}. {conflict["name"]}\n')
        f.write(f'   Donor sheet name: {conflict["donor_name"]}\n')
        f.write(f'   Donor indicates pet-friendly because: {conflict["donor_reason"]}\n')
        f.write(f'   Donor categories: {conflict["donor_categories"]}\n')
        f.write(f'   Final CSV says: Pet-Friendly? No\n')
        f.write(f'   ACTION: Change Final CSV from "Pet-Friendly? No" to "Pet-Friendly? Yes"\n')
        f.write(f'   ACTION: Ensure "Pet Friendly" is in amenities column\n\n')

print(f'\nReport saved to PET_FRIENDLY_DONOR_CONFLICTS_REPORT.txt')


