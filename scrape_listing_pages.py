#!/usr/bin/env python3
"""
Scrape nelsoncounty.com listing pages to extract additional information
and create accordion HTML for the customHtml field.
"""

import csv
import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Optional

def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text

def extract_section_content(soup: BeautifulSoup, section_title: str) -> Optional[str]:
    """Extract content from a section by looking for headings"""
    # Look for headings that might contain the section title
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        # Check if heading matches or contains the section title
        if section_title.lower() in heading_text.lower():
            # Get content after this heading until next heading of same or higher level
            content = []
            current = heading.next_sibling
            
            while current:
                if isinstance(current, str):
                    text = clean_text(current)
                    if text:
                        content.append(text)
                elif hasattr(current, 'name'):
                    if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                        # Stop at next heading
                        break
                    elif current.name == 'p':
                        text = clean_text(current.get_text())
                        if text:
                            content.append(f"<p>{text}</p>")
                    elif current.name == 'ul':
                        content.append(str(current))
                    elif current.name == 'ol':
                        content.append(str(current))
                    elif current.name == 'div' and current.get('class'):
                        # Check for specific content divs
                        text = clean_text(current.get_text())
                        if text and len(text) > 50:
                            content.append(f"<div>{text}</div>")
                
                current = current.next_sibling
            
            if content:
                return '\n'.join(content)
    
    return None

def extract_accordion_sections(soup: BeautifulSoup) -> Dict[str, str]:
    """Extract sections that should go in accordions"""
    sections = {}
    
    # Look for common section patterns - map to actual heading text we might find
    section_mappings = {
        'History': ['history'],
        'Rules': ['rules', 'regulations', 'guidelines', 'trail rules', 'park rules'],
        'FAQ': ['faq', 'frequently asked'],
        'Directions': ['directions', 'getting there'],
        'What To Bring': ['what to bring', 'what to pack'],
        'Trail Information': ['trail information', 'trail details'],
        'Hours': ['hours', 'open'],
        'Contact': ['contact'],
        'Maps': ['map', 'maps', 'trailhead']
    }
    
    # Find all headings h2-h6 (skip h1 as it's usually the title)
    headings = soup.find_all(['h2', 'h3', 'h4', 'h5', 'h6'])
    
    for heading in headings:
        heading_text = clean_text(heading.get_text())
        heading_lower = heading_text.lower()
        
        # Determine section name - check exact matches first
        section_name = None
        
        # Exact or near-exact matches
        if heading_lower == 'history':
            section_name = 'History'
        elif 'trail & park rules' in heading_lower or 'park rules' in heading_lower or ('rules' in heading_lower and 'trail' in heading_lower):
            section_name = 'Rules'
        elif heading_lower == 'faq' or 'frequently asked' in heading_lower:
            section_name = 'FAQ'
        elif 'what to bring' in heading_lower:
            section_name = 'What To Bring'
        elif 'directions' in heading_lower and 'map' not in heading_lower:
            section_name = 'Directions'
        elif 'trailhead map' in heading_lower or ('map' in heading_lower and 'trailhead' in heading_lower):
            section_name = 'Maps'
        elif 'hours' in heading_lower or ('open' in heading_lower and 'hours' in heading_lower):
            section_name = 'Hours'
        elif 'contact' in heading_lower:
            section_name = 'Contact'
        # Fallback to pattern matching
        elif not section_name:
            for name, patterns in section_mappings.items():
                if any(pattern in heading_lower for pattern in patterns):
                    section_name = name
                    break
        
        if section_name and section_name not in sections:
            content_parts = []
            
            # Find the next div after this heading (using find_next which searches all descendants)
            next_div = heading.find_next('div')
            if next_div:
                # Get all paragraphs, lists, sub-headings from this div and its children
                # But stop before the next major heading (h2 or h3)
                heading_level = int(heading.name[1]) if heading.name.startswith('h') else 6
                
                # Find all content elements in the div
                for elem in next_div.find_all(['p', 'ul', 'ol', 'h4', 'h5', 'h6', 'div', 'a', 'iframe', 'strong', 'em']):
                    # Skip if this element is inside another heading section
                    parent_heading = elem.find_parent(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                    if parent_heading and parent_heading != heading:
                        parent_level = int(parent_heading.name[1]) if parent_heading.name.startswith('h') else 6
                        if parent_level <= heading_level:
                            continue
                    
                    if elem.name == 'p':
                        text = clean_text(elem.get_text())
                        if text and len(text) > 10:
                            # Preserve any links or formatting
                            content_parts.append(str(elem))
                    elif elem.name in ['ul', 'ol']:
                        content_parts.append(str(elem))
                    elif elem.name in ['h4', 'h5', 'h6']:
                        text = clean_text(elem.get_text())
                        if text:
                            content_parts.append(f"<h{elem.name[1]}>{text}</h{elem.name[1]}>")
                    elif elem.name == 'div':
                        # Check if it contains an iframe (map/video)
                        if elem.find('iframe'):
                            content_parts.append(str(elem))
                        # Or if it has substantial text content
                        elif clean_text(elem.get_text()) and len(clean_text(elem.get_text())) > 100:
                            # Extract just the text, preserving structure
                            text = clean_text(elem.get_text())
                            content_parts.append(f"<div>{text}</div>")
                    elif elem.name == 'iframe':
                        content_parts.append(str(elem))
                    elif elem.name == 'a' and elem.get('href') and elem.parent.name != 'p':
                        # Standalone link
                        href = elem.get('href')
                        text = clean_text(elem.get_text())
                        if text:
                            content_parts.append(f'<p><a href="{href}">{text}</a></p>')
                
                # If we didn't find much, try getting text directly from the div
                if not content_parts or len(' '.join(content_parts)) < 100:
                    div_text = clean_text(next_div.get_text())
                    if div_text and len(div_text) > 100:
                        # Split into paragraphs
                        paragraphs = [p.strip() for p in div_text.split('\n') if p.strip() and len(p.strip()) > 20]
                        for para in paragraphs[:10]:  # Limit to first 10 paragraphs
                            content_parts.append(f"<p>{para}</p>")
            
            # If still no content, look for next few siblings
            if not content_parts:
                current = heading.next_sibling
                count = 0
                while current and count < 15:
                    if hasattr(current, 'name'):
                        if current.name == 'p':
                            text = clean_text(current.get_text())
                            if text and len(text) > 20:
                                content_parts.append(str(current))
                        elif current.name in ['ul', 'ol']:
                            content_parts.append(str(current))
                        elif current.name == 'div':
                            # Check div content
                            div_text = clean_text(current.get_text())
                            if div_text and len(div_text) > 50:
                                # Extract paragraphs from div
                                for p in current.find_all('p'):
                                    if p.get_text().strip():
                                        content_parts.append(str(p))
                        elif current.name in ['h1', 'h2', 'h3']:
                            # Stop at next major heading
                            break
                    current = current.next_sibling
                    count += 1
            
            if content_parts:
                sections[section_name] = '\n'.join(content_parts)
    
    return sections

def create_accordion_html(sections: Dict[str, str]) -> str:
    """Create accordion HTML from sections"""
    if not sections:
        return ""
    
    accordion_id = 0
    html_parts = ['<div class="listing-accordions">']
    
    for section_name, content in sections.items():
        accordion_id += 1
        accordion_id_str = f"accordion-{accordion_id}"
        
        html_parts.append(f'''
    <div class="accordion-item">
        <button class="accordion-header" type="button" aria-expanded="false" aria-controls="{accordion_id_str}">
            {section_name}
            <span class="accordion-icon">+</span>
        </button>
        <div class="accordion-content" id="{accordion_id_str}" hidden>
            <div class="accordion-body">
                {content}
            </div>
        </div>
    </div>
        ''')
    
    html_parts.append('</div>')
    
    # Add CSS for accordions
    css = '''
<style>
.listing-accordions {
    margin: 1.5rem 0;
}
.accordion-item {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    overflow: hidden;
}
.accordion-header {
    width: 100%;
    padding: 1rem 1.5rem;
    background: #f8f9fa;
    border: none;
    text-align: left;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s;
}
.accordion-header:hover {
    background: #e9ecef;
}
.accordion-header[aria-expanded="true"] .accordion-icon {
    transform: rotate(45deg);
}
.accordion-icon {
    font-size: 1.5rem;
    transition: transform 0.2s;
    color: #666;
}
.accordion-content {
    padding: 0;
}
.accordion-body {
    padding: 1.5rem;
    background: #fff;
}
.accordion-body p {
    margin: 0.75rem 0;
    line-height: 1.6;
}
.accordion-body ul, .accordion-body ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
}
.accordion-body a {
    color: #0066cc;
    text-decoration: underline;
}
.accordion-body a:hover {
    color: #004499;
}
</style>
<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const content = document.getElementById(this.getAttribute('aria-controls'));
            
            this.setAttribute('aria-expanded', !isExpanded);
            content.hidden = isExpanded;
        });
    });
});
</script>
    '''
    
    return css + '\n'.join(html_parts)

def scrape_listing_page(slug: str) -> Optional[Dict[str, str]]:
    """Scrape a listing page and extract additional sections"""
    # Try both URL formats
    urls = [
        f"https://nelsoncounty.com/{slug}/",
        f"https://nelsoncounty.com/explore/{slug}/"
    ]
    
    for url in urls:
        try:
            print(f"  Trying {url}...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract accordion sections
                sections = extract_accordion_sections(soup)
                
                if sections:
                    print(f"  ✓ Found {len(sections)} sections: {', '.join(sections.keys())}")
                    return sections
                else:
                    print(f"  - No additional sections found")
                    return None
                    
        except requests.RequestException as e:
            print(f"  ✗ Error: {e}")
            continue
        except Exception as e:
            print(f"  ✗ Error parsing: {e}")
            continue
    
    return None

def process_csv(input_file: str, output_file: str):
    """Process CSV and add accordion HTML to listings with additional info"""
    rows = []
    updated = 0
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row_num, row in enumerate(reader, start=2):
            slug = row.get('slug', '').strip()
            current_html = row.get('customHtml', '').strip()
            
            if not slug:
                rows.append(row)
                continue
            
            print(f"\n[{row_num}] {row.get('name', 'Unknown')} ({slug})")
            
            # Skip if already has customHtml
            if current_html and len(current_html) > 50:
                print(f"  - Already has customHtml, skipping")
                rows.append(row)
                continue
            
            # Scrape the page
            sections = scrape_listing_page(slug)
            
            if sections:
                accordion_html = create_accordion_html(sections)
                row['customHtml'] = accordion_html
                updated += 1
                print(f"  ✓ Added accordion HTML")
            else:
                print(f"  - No additional content found")
            
            rows.append(row)
            
            # Be nice to the server
            time.sleep(1)
    
    # Write results - use csv.QUOTE_ALL to properly handle multi-line content
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL, escapechar='\\')
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n✅ Processed {len(rows)} rows")
    print(f"✅ Updated {updated} listings with accordion HTML")

if __name__ == '__main__':
    input_file = 'listings-2025-12-30-2.csv'
    output_file = 'listings-2025-12-30-2.csv'
    
    process_csv(input_file, output_file)
