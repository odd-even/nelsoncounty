#!/usr/bin/env python3
"""Test extraction for Blue Ridge Tunnel"""

import requests
from bs4 import BeautifulSoup
import re

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

url = "https://nelsoncounty.com/blue-ridge-tunnel/"
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
response = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(response.content, 'html.parser')

# Find h3 headings
print("=== H3 HEADINGS ===")
for h3 in soup.find_all('h3'):
    print(f"H3: {clean_text(h3.get_text())}")
    # Find next div with content
    next_div = h3.find_next('div')
    if next_div:
        classes = ' '.join(next_div.get('class', []))
        print(f"  Next div classes: {classes}")
        text = clean_text(next_div.get_text()[:200])
        print(f"  Text preview: {text}...")
    print()
