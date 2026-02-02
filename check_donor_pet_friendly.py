import csv
import re

# Get all 76 anomalous listings with their current status
anomalies = []
with open('CSV/final_listings_PERFECT.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row.get('type', '') not in ['Cabins & Cottages', 'Motels & Inns', 'Whole House Rentals', 'Lodging']:
            continue
        detailed_desc = row.get('detailedDescription', '')
        amenities = row.get('amenities', '')
        if re.search(r'Pet-Friendly\?\s*</strong>\s*No', detailed_desc, re.IGNORECASE) and 'Pet Friendly' in amenities:
            anomalies.append({
                'name': row.get('name', ''),
                'slug': row.get('slug', ''),
                'current_desc': detailed_desc
            })

print(f'Checking {len(anomalies)} listings in donor sheet for "Pet-Friendly? No"...\n')

# Check donor sheet
donor_file = 'CSV/framer-cms-export.csv'
donor_matches = {}

with open(donor_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = row.get('name', '') or row.get('Name', '') or row.get('title', '')
        desc = row.get('detailedDescription', '') or row.get('description', '') or ''
        
        # Check for Pet-Friendly? No in various formats
        if re.search(r'Pet-Friendly\?\s*(</strong>)?\s*No', desc, re.IGNORECASE):
            donor_matches[name.lower()] = {
                'name': name,
                'description': desc,
                'has_no': True
            }
        elif re.search(r'Pet-Friendly\?\s*(</strong>)?\s*Yes', desc, re.IGNORECASE):
            donor_matches[name.lower()] = {
                'name': name,
                'description': desc,
                'has_no': False
            }

# Match anomalies with donor
pet_friendly_no_in_donor = []
pet_friendly_yes_in_donor = []
no_mention_in_donor = []

for anomaly in anomalies:
    anomaly_name_lower = anomaly['name'].lower()
    matched = False
    
    for donor_name, donor_info in donor_matches.items():
        if anomaly_name_lower in donor_name or donor_name in anomaly_name_lower:
            matched = True
            if donor_info['has_no']:
                pet_friendly_no_in_donor.append({
                    'name': anomaly['name'],
                    'donor_name': donor_info['name']
                })
            else:
                pet_friendly_yes_in_donor.append({
                    'name': anomaly['name'],
                    'donor_name': donor_info['name']
                })
            break
    
    if not matched:
        no_mention_in_donor.append(anomaly['name'])

print('=' * 80)
print('DONOR SHEET ANALYSIS - AUTHORITATIVE SOURCE')
print('=' * 80)
print(f'\nListings with "Pet-Friendly? No" in donor sheet (AUTHORITATIVE - NOT PET FRIENDLY): {len(pet_friendly_no_in_donor)}')
for item in pet_friendly_no_in_donor[:20]:
    name_str = item['name']
    donor_str = item['donor_name']
    print(f'  - {name_str} (donor: {donor_str})')
if len(pet_friendly_no_in_donor) > 20:
    print(f'  ... and {len(pet_friendly_no_in_donor) - 20} more')

print(f'\nListings with "Pet-Friendly? Yes" in donor sheet: {len(pet_friendly_yes_in_donor)}')
for item in pet_friendly_yes_in_donor[:10]:
    name_str = item['name']
    donor_str = item['donor_name']
    print(f'  - {name_str} (donor: {donor_str})')
if len(pet_friendly_yes_in_donor) > 10:
    print(f'  ... and {len(pet_friendly_yes_in_donor) - 10} more')

print(f'\nListings with no pet-friendly mention in donor sheet: {len(no_mention_in_donor)}')
for name in no_mention_in_donor[:10]:
    print(f'  - {name}')
if len(no_mention_in_donor) > 10:
    print(f'  ... and {len(no_mention_in_donor) - 10} more')

print(f'\nTotal: {len(pet_friendly_no_in_donor) + len(pet_friendly_yes_in_donor) + len(no_mention_in_donor)}')

# Save detailed report
with open('PET_FRIENDLY_DONOR_ANALYSIS.txt', 'w', encoding='utf-8') as f:
    f.write('=' * 80 + '\n')
    f.write('PET-FRIENDLY ANOMALIES - DONOR SHEET ANALYSIS (AUTHORITATIVE)\n')
    f.write('=' * 80 + '\n\n')
    
    f.write(f'Total anomalous listings: {len(anomalies)}\n')
    f.write(f'Listings with "Pet-Friendly? No" in donor: {len(pet_friendly_no_in_donor)}\n')
    f.write(f'Listings with "Pet-Friendly? Yes" in donor: {len(pet_friendly_yes_in_donor)}\n')
    f.write(f'Listings with no mention in donor: {len(no_mention_in_donor)}\n\n')
    
    f.write('=' * 80 + '\n')
    f.write('LISTINGS WITH "Pet-Friendly? No" IN DONOR (REMOVE FROM AMENITIES)\n')
    f.write('=' * 80 + '\n\n')
    for item in pet_friendly_no_in_donor:
        f.write(f"{item['name']}\n")
        f.write(f"  Donor sheet name: {item['donor_name']}\n")
        f.write(f"  ACTION: Remove 'Pet Friendly' from amenities column\n\n")
    
    f.write('=' * 80 + '\n')
    f.write('LISTINGS WITH "Pet-Friendly? Yes" IN DONOR (KEEP IN AMENITIES)\n')
    f.write('=' * 80 + '\n\n')
    for item in pet_friendly_yes_in_donor:
        f.write(f"{item['name']}\n")
        f.write(f"  Donor sheet name: {item['donor_name']}\n")
        f.write(f"  ACTION: Change description from 'No' to 'Yes'\n\n")
    
    f.write('=' * 80 + '\n')
    f.write('LISTINGS WITH NO MENTION IN DONOR (NEEDS MANUAL REVIEW)\n')
    f.write('=' * 80 + '\n\n')
    for name in no_mention_in_donor:
        f.write(f"{name}\n")
        f.write(f"  ACTION: Manual review needed - check other sources\n\n")

print('\nDetailed report saved to PET_FRIENDLY_DONOR_ANALYSIS.txt')


