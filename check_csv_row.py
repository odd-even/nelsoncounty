#!/usr/bin/env python3
"""Check the specific problematic row in the CSV"""

import csv

# Read the CSV and find the problematic row
with open('CSV/listings-2026-01-15-FINAL.csv', 'r', encoding='utf-8') as f:
    # Read as raw lines first
    lines = f.readlines()
    
    # Find Allen Creek (should be around line 34-35 accounting for header)
    for i, line in enumerate(lines[1:35], start=2):  # Skip header
        if 'allen-creek-nature-preserve' in line.lower():
            print(f'Found at line {i}')
            print(f'Line length: {len(line)} chars')
            comma_count = line.count(',')
            quote_count = line.count('"')
            newline_char = '\n'
            newline_count = line.count(newline_char)
            print(f'Comma count: {comma_count}')
            print(f'Quote count: {quote_count}')
            print(f'Newline count: {newline_count}')
            print()
            print('Raw line (first 500 chars):')
            print(repr(line[:500]))
            print()
            print('Raw line (last 200 chars):')
            print(repr(line[-200:]))
            break

# Now parse it properly
print('\n' + '='*60)
print('Parsing with csv module:')
print('='*60)

with open('CSV/listings-2026-01-15-FINAL.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    
    # Find Allen Creek
    for i, row in enumerate(rows, 1):
        if row.get('slug') == 'allen-creek-nature-preserve':
            print(f'Row {i+1}: Allen Creek Nature Preserve')
            print(f'Total fields in row dict: {len(row)}')
            print(f'Expected fields: {len(reader.fieldnames)}')
            print()
            
            # Check detailedDescription specifically
            dd = row.get('detailedDescription', '')
            print(f'detailedDescription:')
            print(f'  Length: {len(dd)}')
            has_commas = ',' in dd
            has_quotes = '"' in dd
            has_newlines = '\n' in dd
            print(f'  Has commas: {has_commas}')
            print(f'  Has quotes: {has_quotes}')
            print(f'  Has newlines: {has_newlines}')
            if dd:
                print(f'  First 200 chars: {repr(dd[:200])}')
            break
