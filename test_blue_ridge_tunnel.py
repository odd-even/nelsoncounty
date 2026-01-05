#!/usr/bin/env python3
"""Test script to see the HTML structure of Blue Ridge Tunnel page"""

import requests
from bs4 import BeautifulSoup

url = "https://nelsoncounty.com/blue-ridge-tunnel/"
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}

response = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(response.content, 'html.parser')

# Find all headings
print("=== HEADINGS ===")
for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
    print(f"{heading.name}: {heading.get_text().strip()[:100]}")

# Find sections with "History", "Rules", "FAQ", etc.
print("\n=== LOOKING FOR SECTIONS ===")
for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
    text = heading.get_text().strip().lower()
    if any(word in text for word in ['history', 'rules', 'faq', 'directions', 'bring', 'trail', 'hours']):
        print(f"\nFound: {heading.name} - {heading.get_text().strip()}")
        # Get next few siblings
        current = heading.next_sibling
        count = 0
        while current and count < 5:
            if hasattr(current, 'name'):
                print(f"  {current.name}: {str(current)[:200]}")
            current = current.next_sibling
            count += 1
