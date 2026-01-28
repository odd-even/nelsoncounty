#!/usr/bin/env python3
"""
Apply verified address fixes to final_listings_PERFECT.csv
"""

import csv
import shutil
from datetime import datetime

# Address fixes mapping: listing name -> new address
ADDRESS_FIXES = {
    "Fishing the James River": "Route 626, Wingina, VA 24599",
    "Blue Ridge Parkway Loops": "Milepost 16, Blue Ridge Parkway, Afton, VA 22920",
    "Kids in Parks: Rockfish River Trailhead": "1368 Rockfish Valley Highway, Nellysford, VA 22958",
    "Montebello Country Store & Cafe": "15072 Crabtree Falls Highway, Montebello, VA 24464",
    "Nine Ridges Retreat": "13638 Crabtree Falls Highway, Tyro, VA 22976",
    "North Fork of the Piney River": "Route 827, Massies Mill, Virginia 22976, USA",
    "Mac's Country Store": "7023 Patrick Henry Highway, Roseland, VA 22967",
    "Mac's Country Store": "7023 Patrick Henry Highway, Roseland, VA 22967",  # Curly apostrophe
    "Nelson 151": "Nelson 151 craft beverage trail Nellysford",
    "Tinkerland Farm": "Route 151 & Bryant Lane, Roseland, VA 22967",
    "Virginia Blue Ridge Railway Trail": "3124 Patrick Henry Highway, Piney River, VA 22964",
    "Kids in Parks: Virginia Blue Ridge Railway Trail": "3124 Patrick Henry Highway, Piney River, VA 22964",
    "Humpback Rocks": "5.8 Blue Ridge Parkway, Lyndhurst, VA 22952",
    "Stoney Creek Golf Course": "Route 664, Nellysford, VA 22958",
    "Graves Grocery & Deli": "1779 Rockfish Valley Highway, Nellysford, VA 22958",
    "Pharsalia": "2333 Pharsalia Road, Tyro, VA 22976",
    "Village Antiques": "605 Front Street, Lovingston, VA 22949",
    "Heart of Nelson": "611 Front Street, Lovingston, VA 22949",
    "James River": "",  # Remove address - leave blank
    "Bold Rock Hard Cider": "1020 Rockfish Valley Highway, Nellysford, VA 22958",
    "Colleen Deli": "4071 Thomas Nelson Highway, Arrington, VA 22922",
    "Nelson Scoops": "8203 Thomas Nelson Highway, Lovingston, VA 22949",
    "Fishing at Montebello": "15072 Crabtree Falls Highway, Montebello, VA 24464",
    "Tennis": "6919 Thomas Nelson Highway, Lovingston, VA 22949",
}

def apply_address_fixes():
    csv_file = "CSV/final_listings_PERFECT.csv"
    backup_file = f"CSV/final_listings_PERFECT_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    # Create backup
    shutil.copy2(csv_file, backup_file)
    print(f"Created backup: {backup_file}")
    
    # Read CSV
    rows = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    # Apply fixes
    updated_count = 0
    for row in rows:
        name = row.get('name', '').strip()
        if name in ADDRESS_FIXES:
            old_address = row.get('address', '').strip()
            new_address = ADDRESS_FIXES[name]
            row['address'] = new_address
            updated_count += 1
            print(f"Updated: {name}")
            print(f"  Old: {old_address}")
            print(f"  New: {new_address}")
            print()
    
    # Write updated CSV
    with open(csv_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\nTotal addresses updated: {updated_count}")
    print(f"CSV file updated: {csv_file}")

if __name__ == "__main__":
    apply_address_fixes()

