#!/usr/bin/env python3
"""
Fix incorrect towns and address formats in listings
Ensures all addresses use correct Nelson County towns and proper formatting
"""

import csv
import re
import sys
import os
from datetime import datetime

# Valid Nelson County towns (unincorporated communities)
VALID_TOWNS = {
    'Afton', 'Arrington', 'Faber', 'Gladstone', 'Lovingston',
    'Massies Mill', 'Montebello', 'Nellysford', 'Norwood',
    'Piney River', 'Roseland', 'Schuyler', 'Shipman', 'Tyro', 'Wingina'
}

# ZIP code to town mapping for Nelson County
ZIP_TO_TOWN = {
    '22920': 'Afton',
    '22949': 'Lovingston',
    '22958': 'Nellysford',  # Wintergreen Resort area
    '22967': 'Roseland',    # Wintergreen Resort area
    '22969': 'Schuyler',
    '24464': 'Montebello',
    # Add more as needed
}

# Known corrections
TOWN_CORRECTIONS = {
    # Note: Wintergreen and Wintergreen Resort are valid areas, keep them
    'Virginia': None,  # Too generic, needs specific town
    'Commonwealth of Virginia': None,  # Not a valid area
}


def extract_zip_from_address(address):
    """Extract ZIP code from address"""
    if not address:
        return None
    # Look for 5-digit ZIP code
    match = re.search(r'\b(\d{5})\b', address)
    if match:
        return match.group(1)
    return None


def extract_town_from_address(address):
    """Extract town name from address"""
    if not address:
        return None
    
    # Pattern: "Street, Town, VA ZIP" or "Town, VA ZIP" or "Town, Virginia, ZIP"
    parts = [p.strip() for p in address.split(',')]
    
    if len(parts) >= 2:
        # Check if second-to-last part is a state abbreviation
        if len(parts) >= 3:
            # Format: "Street, Town, VA ZIP"
            town = parts[-2]
            if town.upper() in ['VA', 'VIRGINIA']:
                # Actually the state, try previous part
                if len(parts) >= 4:
                    town = parts[-3]
                else:
                    return None
        else:
            # Format: "Town, VA ZIP" or "Town, Virginia, ZIP"
            town = parts[0]
            if town.upper() in ['VA', 'VIRGINIA']:
                return None
        
        # Clean up town name
        town = town.strip()
        # Remove "Virginia" if it's part of the town name
        town = re.sub(r'\s+Virginia\s*$', '', town, flags=re.IGNORECASE)
        town = re.sub(r'^Virginia\s*,?\s*', '', town, flags=re.IGNORECASE)
        return town.strip() if town else None
    
    return None


def fix_address_format(address, correct_town=None):
    """Fix address format to standard: 'Street, Town, VA ZIP'"""
    if not address:
        return address
    
    # If it's just a town name, format it properly
    if address and ',' not in address:
        # Might be just "Town" or "Town Virginia"
        address = re.sub(r'\s+Virginia\s*$', '', address, flags=re.IGNORECASE)
        address = address.strip()
        # Extract ZIP if present
        zip_match = re.search(r'\b(\d{5})\b', address)
        zip_code = zip_match.group(1) if zip_match else None
        town = re.sub(r'\s+\d{5}\s*$', '', address).strip()
        
        if zip_code:
            return f"{town}, VA {zip_code}"
        else:
            return address
    
    # Extract components
    parts = [p.strip() for p in address.split(',')]
    zip_code = extract_zip_from_address(address)
    
    # Determine correct town
    if correct_town:
        town = correct_town
    else:
        town = extract_town_from_address(address)
        if not town and zip_code and zip_code in ZIP_TO_TOWN:
            town = ZIP_TO_TOWN[zip_code]
    
    if not town:
        return address  # Can't fix without town info
    
    # Fix town name if it's in corrections
    if town in TOWN_CORRECTIONS:
        new_town = TOWN_CORRECTIONS[town]
        if new_town:
            town = new_town
        else:
            # Need to determine from ZIP or other context
            if zip_code and zip_code in ZIP_TO_TOWN:
                town = ZIP_TO_TOWN[zip_code]
            else:
                return address  # Can't determine correct town
    
    # Rebuild address
    if len(parts) >= 3:
        # Has street address
        street = ', '.join(parts[:-2])
        return f"{street}, {town}, VA {zip_code}" if zip_code else f"{street}, {town}, VA"
    else:
        # Just town
        return f"{town}, VA {zip_code}" if zip_code else f"{town}, VA"


def fix_area_field(area, address, listing_name):
    """Fix area field to be a valid town, not a category or generic location"""
    if not area:
        return area
    
    # If area is a valid town, keep it
    if area in VALID_TOWNS:
        return area
    
    # Wintergreen and Wintergreen Resort are valid areas, keep them
    if area in ['Wintergreen', 'Wintergreen Resort']:
        return area
    
    # If area is a category (like "Art", "Coffee Shops"), try to get from address
    if area in ['Art', 'Coffee Shops', 'Cabins', 'Whole House Rentals']:
        town = extract_town_from_address(address)
        if town and town in VALID_TOWNS:
            return town
        # Try ZIP code
        zip_code = extract_zip_from_address(address)
        if zip_code and zip_code in ZIP_TO_TOWN:
            return ZIP_TO_TOWN[zip_code]
        return area  # Can't determine, leave as is
    
    # Check if area needs correction
    if area in TOWN_CORRECTIONS:
        new_area = TOWN_CORRECTIONS[area]
        if new_area:
            return new_area
        # Try to get from address
        town = extract_town_from_address(address)
        if town and town in VALID_TOWNS:
            return town
        zip_code = extract_zip_from_address(address)
        if zip_code and zip_code in ZIP_TO_TOWN:
            return ZIP_TO_TOWN[zip_code]
    
    # Check if area contains a valid town name
    for valid_town in VALID_TOWNS:
        if valid_town.lower() in area.lower():
            return valid_town
    
    return area  # Return as-is if can't determine


def main():
    input_csv = 'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final.csv'
    output_csv = input_csv.replace('.csv', '-towns-fixed.csv')
    report_file = 'CSV/TOWN_FIXES_REPORT.txt'
    
    if not os.path.exists(input_csv):
        print(f"❌ Input CSV not found: {input_csv}")
        sys.exit(1)
    
    print("📖 Loading CSV...")
    
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        listings = list(reader)
    
    print(f"✅ Loaded {len(listings)} listings")
    print()
    print("🔧 Fixing towns and addresses...")
    print()
    
    fixes_made = []
    
    for listing in listings:
        name = listing.get('name', 'Unknown')
        original_area = listing.get('area', '')
        original_address = listing.get('address', '')
        
        # Fix area
        fixed_area = fix_area_field(original_area, original_address, name)
        
        # Fix address
        fixed_address = fix_address_format(original_address, fixed_area if fixed_area in VALID_TOWNS else None)
        
        changes = []
        if fixed_area != original_area:
            listing['area'] = fixed_area
            changes.append('area')
        if fixed_address != original_address:
            listing['address'] = fixed_address
            changes.append('address')
        
        if changes:
            fixes_made.append({
                'name': name,
                'changes': changes,
                'area_before': original_area,
                'area_after': fixed_area,
                'address_before': original_address,
                'address_after': fixed_address
            })
            print(f"✅ {name}: Fixed {', '.join(changes)}")
    
    print()
    print(f"✅ Fixed {len(fixes_made)} listings")
    print()
    
    # Write fixed CSV
    print(f"💾 Writing fixed CSV to: {output_csv}")
    with open(output_csv, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(listings)
    
    print(f"✅ Fixed CSV saved")
    print()
    
    # Write report
    print(f"📝 Writing fix report to: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as report:
        report.write("=" * 70 + "\n")
        report.write("TOWN AND ADDRESS FIXES REPORT\n")
        report.write("=" * 70 + "\n\n")
        report.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.write(f"Listings fixed: {len(fixes_made)}\n\n")
        
        if fixes_made:
            report.write("LISTINGS FIXED:\n")
            report.write("-" * 70 + "\n\n")
            
            for item in fixes_made:
                report.write(f"{item['name']}\n")
                report.write("-" * 70 + "\n")
                report.write(f"Fields fixed: {', '.join(item['changes'])}\n\n")
                
                if 'area' in item['changes']:
                    report.write("AREA:\n")
                    report.write(f"Before: {item['area_before']}\n")
                    report.write(f"After:  {item['area_after']}\n\n")
                
                if 'address' in item['changes']:
                    report.write("ADDRESS:\n")
                    report.write(f"Before: {item['address_before']}\n")
                    report.write(f"After:  {item['address_after']}\n\n")
                
                report.write("=" * 70 + "\n\n")
        else:
            report.write("No fixes needed - all towns and addresses are correct!\n")
    
    print("=" * 70)
    print("✅ FIXES COMPLETE!")
    print("=" * 70)
    print(f"   - Fixed CSV: {output_csv}")
    print(f"   - Report: {report_file}")
    print(f"   - Listings fixed: {len(fixes_made)}")


if __name__ == '__main__':
    main()
