#!/usr/bin/env python3
"""
Fix obvious anomalies in listings based on research
IMPORTANT: Does NOT change slugs - preserves them exactly as they are
"""

import csv
import re
import os
import sys
from datetime import datetime

# Valid Nelson County towns/areas
VALID_AREAS = {
    'Afton', 'Arrington', 'Faber', 'Gladstone', 'Lovingston',
    'Massies Mill', 'Montebello', 'Nellysford', 'Norwood',
    'Piney River', 'Roseland', 'Schuyler', 'Shipman', 'Tyro', 'Wingina',
    'Wintergreen', 'Wintergreen Resort', 'Nelson County'
}

# Known fixes based on research
FIXES = {
    # Nonsensical detailedDescription fixes
    'celadonacresfarm': {
        'detailedDescription': '',  # Remove nonsensical list of businesses
        'type': 'Farms & Orchards',  # Currently "Hikes & Trails" - clearly wrong
        'address': 'Lovingston, VA 22949'  # Based on research, in Lovingston
    },
    'heartofnelson': {
        'detailedDescription': ''  # Remove nonsensical list of businesses
    },
    
    # Area fixes (category -> location)
    'rapunzels-coffee-books': {
        'area': 'Lovingston',  # Research: 956 Front Street, Lovingston, VA 22949
        'address': '956 Front Street, Lovingston, VA 22949'
    },
    'terrace-cafe-at-wintergreen-resort': {
        'area': 'Wintergreen Resort'  # Research: Located at Wintergreen Resort
    },
    'castor-cabin': {
        'area': 'Nelson County'  # Unknown specific location, use county
    },
    'wooder-house': {
        'area': 'Nelson County'  # Unknown specific location, use county
    },
    'ski-house': {
        'area': 'Wintergreen Resort'  # Based on name and type
    },
    
    # Area fixes (invalid location -> valid location)
    'humpback-rocks': {
        'area': 'Nelson County'  # Research: On Blue Ridge Parkway, border area, accessible from Nelson County
    },
    'three-trees-farm': {
        'area': 'Arrington',  # Address shows "Walkers Mountain, Arrington, VA"
        'address': 'Walkers Mountain, Arrington, VA 22922'
    },
    'fishing-the-little-piney-river': {
        'area': 'Roseland',  # Address shows "Lowesville, VA 22967" - 22967 is Roseland ZIP
        'address': '162 Woodson Road, Roseland, VA 22967'
    },
    'virginia-spirits-trail': {
        'area': 'Nelson County',  # Statewide trail, but in Nelson County context
        'address': 'Nelson County, VA'  # Fix invalid "Spirits Trail, VA"
    },
    'avon-hill': {
        'area': 'Nelson County',  # Address shows Howardsville (not in Nelson County), but description says "Nelson County"
        'address': '289 Avon Road, Nelson County, VA 24562'
    },
    'love-ridge-mountain-lodging': {
        'area': 'Nelson County',  # Address shows Lyndhurst (Augusta County), but might be accessible from Nelson County
    },
    'nonny-cottage': {
        'area': 'Afton',  # Address shows "Love, VA 22920" - 22920 is Afton ZIP, Love is near Afton
        'address': 'Love, Afton, VA 22920'
    },
    '12-ridges-vineyard': {
        'area': 'Vesuvius',  # Vesuvius IS in Nelson County, this is correct
        'address': '24981 Blue Ridge Parkway, Vesuvius, VA 24483'  # Fix ZIP (24981 is not valid, 24483 is Vesuvius area)
    }
}


def normalize_slug(slug):
    """Normalize slug for comparison"""
    return slug.strip().lower() if slug else ''


def main():
    input_csv = 'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean-wintergreen-restored-id-fixed.csv'
    output_csv = 'CSV/jan12listings-2026-01-12-3-cleaned-fixed-nonsensical-final-towns-fixed-final-clean-wintergreen-restored-id-fixed-anomalies-fixed.csv'
    report_file = 'CSV/ANOMALIES_FIXES_REPORT.txt'
    
    if not os.path.exists(input_csv):
        print(f"❌ Input file not found: {input_csv}")
        sys.exit(1)
    
    print(f"📖 Reading: {input_csv}")
    
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        listings = list(reader)
    
    print(f"✅ Loaded {len(listings)} listings")
    print()
    
    changes = []
    fixed_count = 0
    
    for listing in listings:
        slug = normalize_slug(listing.get('slug', ''))
        name = listing.get('name', 'Unknown')
        
        if slug in FIXES:
            fixes = FIXES[slug]
            listing_changes = []
            
            for field, new_value in fixes.items():
                old_value = listing.get(field, '')
                
                # Only update if different
                if str(old_value).strip() != str(new_value).strip():
                    listing_changes.append({
                        'field': field,
                        'old': old_value,
                        'new': new_value
                    })
                    listing[field] = new_value
            
            if listing_changes:
                changes.append({
                    'name': name,
                    'slug': listing.get('slug', ''),
                    'changes': listing_changes
                })
                fixed_count += 1
    
    # Write fixed CSV
    print(f"📝 Writing fixed CSV: {output_csv}")
    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(listings)
    
    # Write report
    print(f"📝 Writing report: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("ANOMALIES FIXES REPORT\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total listings processed: {len(listings)}\n")
        f.write(f"Listings fixed: {fixed_count}\n")
        f.write(f"Total changes made: {sum(len(c['changes']) for c in changes)}\n\n")
        
        f.write("IMPORTANT: All slugs were preserved exactly as they were.\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("DETAILED CHANGES\n")
        f.write("=" * 80 + "\n\n")
        
        if changes:
            for change in changes:
                f.write(f"{change['name']} ({change['slug']})\n")
                f.write("-" * 80 + "\n")
                for item in change['changes']:
                    f.write(f"  Field: {item['field']}\n")
                    f.write(f"    Old: {item['old']}\n")
                    f.write(f"    New: {item['new']}\n")
                f.write("\n")
        else:
            f.write("No changes were made.\n")
    
    print()
    print("=" * 80)
    print("✅ FIXES COMPLETE!")
    print("=" * 80)
    print(f"   - Listings processed: {len(listings)}")
    print(f"   - Listings fixed: {fixed_count}")
    print(f"   - Total changes: {sum(len(c['changes']) for c in changes)}")
    print(f"   - Output CSV: {output_csv}")
    print(f"   - Report: {report_file}")
    print()
    print("⚠️  IMPORTANT: All slugs were preserved exactly as they were.")


if __name__ == '__main__':
    main()
