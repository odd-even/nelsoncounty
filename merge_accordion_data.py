#!/usr/bin/env python3
"""
Merge accordion data from Donor and Pages CSV files into the "to merge" CSV.
Matches by slug and extracts relevant information not already in the target file.
Creates 2-4 accordion panels with rewritten, smooth content.
"""

import csv
import re
import html
from html.parser import HTMLParser
from typing import Dict, List, Optional, Tuple
import html.parser

class HTMLTextExtractor(HTMLParser):
    """Extract clean text from HTML content."""
    def __init__(self):
        super().__init__()
        self.text = []
        self.in_script = False
        self.in_style = False
        
    def handle_starttag(self, tag, attrs):
        if tag.lower() in ['script', 'style']:
            self.in_script = True if tag.lower() == 'script' else False
            self.in_style = True if tag.lower() == 'style' else False
            
    def handle_endtag(self, tag):
        if tag.lower() in ['script', 'style']:
            self.in_script = False
            self.in_style = False
        elif tag.lower() in ['p', 'div', 'br']:
            self.text.append(' ')
            
    def handle_data(self, data):
        if not self.in_script and not self.in_style:
            self.text.append(data.strip())
            
    def get_text(self):
        text = ' '.join(self.text)
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

def extract_text_from_html(html_content: str) -> str:
    """Extract clean text from HTML."""
    if not html_content:
        return ""
    parser = HTMLTextExtractor()
    parser.feed(html_content)
    return parser.get_text()

def extract_contact_info(content: str) -> Dict[str, str]:
    """Extract contact information from HTML content."""
    info = {}
    
    # Extract phone numbers
    phone_patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'tel:([\d\-\(\)\s]+)',
        r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})'
    ]
    for pattern in phone_patterns:
        matches = re.findall(pattern, content)
        if matches:
            info['phone'] = matches[0] if isinstance(matches[0], str) else matches[0]
            break
    
    # Extract addresses
    address_patterns = [
        r'(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Highway|Hwy|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Way|Circle|Cir)[^<]*)',
        r'([A-Za-z\s]+,\s*VA\s+\d{5})',
    ]
    for pattern in address_patterns:
        matches = re.findall(pattern, content)
        if matches:
            info['address'] = matches[0].strip()
            break
    
    # Extract website URLs
    url_patterns = [
        r'href=["\'](https?://[^"\']+)["\']',
        r'(https?://[^\s<>"]+)',
    ]
    for pattern in url_patterns:
        matches = re.findall(pattern, content)
        if matches:
            info['website'] = matches[0]
            break
    
    return info

def extract_sections_from_content(content: str) -> List[Dict[str, str]]:
    """Extract meaningful sections from HTML/Visual Composer content for accordion panels."""
    sections = []
    
    if not content:
        return sections
    
    # Extract from toggle sections FIRST (FAQ/accordion style content in Pages) - highest priority
    toggle_pattern = r'\[toggle[^\]]*title=["\']([^"\']+)["\'][^\]]*\](.*?)\[/toggle\]'
    toggles = re.findall(toggle_pattern, content, re.IGNORECASE | re.DOTALL)
    
    used_content = []
    
    # Process toggles first
    for toggle_title, toggle_content in toggles:
        if len(sections) >= 4:
            break
        
        toggle_text = extract_text_from_html(toggle_content)
        
        # Skip if too short or duplicate
        if not toggle_text or len(toggle_text) < 60:
            continue
        if toggle_text[:150] in used_content:
            continue
        
        # Clean up toggle title
        title = toggle_title.strip()
        title = re.sub(r'&amp;', '&', title)  # Fix HTML entities
        title = re.sub(r'&nbsp;', ' ', title)
        
        # Use the toggle title or determine appropriate title
        if not title or len(title) > 50:
            # Determine title based on content
            text_lower = toggle_text.lower()
            if any(word in text_lower for word in ['history', 'historic', 'engineer', 'built', 'constructed', 'crozet']):
                title = 'History'
            elif any(word in text_lower for word in ['rule', 'regulation', 'prohibited', 'allowed', 'illegal']):
                title = 'Rules & Guidelines'
            elif any(word in text_lower for word in ['bring', 'equipment', 'flashlight', 'headlamp', 'gear']):
                title = 'What To Bring'
            elif any(word in text_lower for word in ['hour', 'open', 'closed', 'time']):
                title = 'Hours & Information'
            else:
                title = 'Information'
        
        sections.append({
            'title': title,
            'content': toggle_text[:600]
        })
        used_content.append(toggle_text[:150])
    
    # Extract from vc_column_text blocks (Visual Composer format)
    vc_text_pattern = r'\[vc_column_text[^\]]*\](.*?)\[/vc_column_text\]'
    vc_texts = re.findall(vc_text_pattern, content, re.IGNORECASE | re.DOTALL)
    
    # Process each vc_column_text block
    for vc_text in vc_texts:
        if len(sections) >= 4:
            break
        
        # Extract text from the block
        text_content = extract_text_from_html(vc_text)
        
        # Skip if too short or duplicate
        if not text_content or len(text_content) < 60:
            continue
        if text_content[:150] in used_content:
            continue
        
        # Check if this block contains a heading (like "The Details" or "Contact Information")
        heading_match = re.search(r'(The Details|Details|About|Contact Information|Contact|Hours|Menu|Events|Experience)', vc_text, re.IGNORECASE)
        
        if heading_match:
            heading = heading_match.group(1)
            # Extract content after the heading
            after_heading = vc_text[heading_match.end():]
            text_after = extract_text_from_html(after_heading)
            
            if text_after and len(text_after) > 40:
                # Determine title
                if 'contact' in heading.lower():
                    title = 'Contact & Location'
                elif 'details' in heading.lower() or 'about' in heading.lower():
                    title = 'About'
                elif 'hours' in heading.lower():
                    title = 'Hours & Information'
                elif 'menu' in heading.lower():
                    title = 'Menu & Offerings'
                elif 'event' in heading.lower():
                    title = 'Events & Activities'
                else:
                    title = 'Information'
                
                sections.append({
                    'title': title,
                    'content': text_after[:600]
                })
                used_content.append(text_after[:150])
        else:
            # No heading, but still meaningful content
            # Determine title based on content
            text_lower = text_content.lower()
            title = 'Experience'
            if any(word in text_lower for word in ['hours', 'open', 'closed', 'monday', 'tuesday', 'wednesday']):
                title = 'Hours & Information'
            elif any(word in text_lower for word in ['menu', 'serve', 'offer', 'feature', 'specialty']):
                title = 'Menu & Offerings'
            elif any(word in text_lower for word in ['event', 'music', 'live', 'host', 'show']):
                title = 'Events & Activities'
            elif any(word in text_lower for word in ['address', 'phone', 'location', 'contact']):
                title = 'Contact & Location'
            
            sections.append({
                'title': title,
                'content': text_content[:500]
            })
            used_content.append(text_content[:150])
    
    # Extract from toggle sections (FAQ/accordion style content in Pages) - do this early for priority
    if len(sections) < 4:
        toggle_pattern = r'\[toggle[^\]]*title=["\']([^"\']+)["\'][^\]]*\](.*?)\[/toggle\]'
        toggles = re.findall(toggle_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for toggle_title, toggle_content in toggles:
            if len(sections) >= 4:
                break
            
            toggle_text = extract_text_from_html(toggle_content)
            
            # Skip if too short or duplicate
            if not toggle_text or len(toggle_text) < 60:
                continue
            if toggle_text[:150] in used_content:
                continue
            
            # Clean up toggle title
            title = toggle_title.strip()
            title = re.sub(r'&amp;', '&', title)  # Fix HTML entities
            title = re.sub(r'&nbsp;', ' ', title)
            
            # Use the toggle title or determine appropriate title
            if not title or len(title) > 50:
                # Determine title based on content
                text_lower = toggle_text.lower()
                if any(word in text_lower for word in ['history', 'historic', 'engineer', 'built', 'constructed', 'crozet']):
                    title = 'History'
                elif any(word in text_lower for word in ['rule', 'regulation', 'prohibited', 'allowed', 'illegal']):
                    title = 'Rules & Guidelines'
                elif any(word in text_lower for word in ['bring', 'equipment', 'flashlight', 'headlamp', 'gear']):
                    title = 'What To Bring'
                elif any(word in text_lower for word in ['hour', 'open', 'closed', 'time']):
                    title = 'Hours & Information'
                else:
                    title = 'Information'
            
            sections.append({
                'title': title,
                'content': toggle_text[:600]
            })
            used_content.append(toggle_text[:150])
    
    # Also try HTML patterns if VC didn't yield enough
    if len(sections) < 4:
        # Extract "The Details" section - look for heading followed by paragraph
        details_pattern = r'(?:The Details|Details|About)[^<]*</h[1-6]>[^<]*<p[^>]*>(.*?)</p>'
        details_match = re.search(details_pattern, content, re.IGNORECASE | re.DOTALL)
        if details_match:
            details_text = extract_text_from_html(details_match.group(1))
            if details_text and len(details_text) > 30 and details_text[:150] not in used_content:
                sections.append({
                    'title': 'About',
                    'content': details_text[:600]
                })
                used_content.append(details_text[:150])
        
        # Extract "Contact Information" section
        contact_pattern = r'Contact Information[^<]*</h[1-6]>[^<]*<p[^>]*>(.*?)</p>'
        contact_match = re.search(contact_pattern, content, re.IGNORECASE | re.DOTALL)
        if contact_match:
            contact_text = extract_text_from_html(contact_match.group(1))
            if contact_text and len(contact_text) > 20 and contact_text[:150] not in used_content:
                sections.append({
                    'title': 'Contact & Location',
                    'content': contact_text[:400]
                })
                used_content.append(contact_text[:150])
    
    # Extract from toggle sections (FAQ/accordion style content in Pages) - do this BEFORE paragraphs
    if len(sections) < 4:
        toggle_pattern = r'\[toggle[^\]]*title=["\']([^"\']+)["\'][^\]]*\](.*?)\[/toggle\]'
        toggles = re.findall(toggle_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for toggle_title, toggle_content in toggles:
            if len(sections) >= 4:
                break
            
            toggle_text = extract_text_from_html(toggle_content)
            
            # Skip if too short or duplicate
            if not toggle_text or len(toggle_text) < 60:
                continue
            if toggle_text[:150] in used_content:
                continue
            
            # Clean up toggle title
            title = toggle_title.strip()
            title = re.sub(r'&amp;', '&', title)  # Fix HTML entities
            title = re.sub(r'&nbsp;', ' ', title)
            
            # Use the toggle title or determine appropriate title
            if not title or len(title) > 50:
                # Determine title based on content
                text_lower = toggle_text.lower()
                if any(word in text_lower for word in ['history', 'historic', 'engineer', 'built', 'constructed', 'crozet']):
                    title = 'History'
                elif any(word in text_lower for word in ['rule', 'regulation', 'prohibited', 'allowed', 'illegal']):
                    title = 'Rules & Guidelines'
                elif any(word in text_lower for word in ['bring', 'equipment', 'flashlight', 'headlamp', 'gear']):
                    title = 'What To Bring'
                elif any(word in text_lower for word in ['hour', 'open', 'closed', 'time']):
                    title = 'Hours & Information'
                else:
                    title = 'Information'
            
            sections.append({
                'title': title,
                'content': toggle_text[:600]
            })
            used_content.append(toggle_text[:150])
    
    # Extract from regular HTML paragraphs if still need more
    if len(sections) < 4:
        para_pattern = r'<p[^>]*>(.*?)</p>'
        paragraphs = re.findall(para_pattern, content, re.IGNORECASE | re.DOTALL)
        
        for para in paragraphs:
            if len(sections) >= 4:
                break
                
            para_text = extract_text_from_html(para)
            
            # Skip if too short, empty, or duplicate
            if not para_text or len(para_text) < 80:
                continue
            if para_text[:150] in used_content:
                continue
            
            # Determine title based on content
            title = 'Experience'
            para_lower = para_text.lower()
            if any(word in para_lower for word in ['hours', 'open', 'closed', 'monday', 'tuesday']):
                title = 'Hours & Information'
            elif any(word in para_lower for word in ['menu', 'serve', 'offer', 'feature']):
                title = 'Menu & Offerings'
            elif any(word in para_lower for word in ['event', 'music', 'live', 'host']):
                title = 'Events & Activities'
            
            sections.append({
                'title': title,
                'content': para_text[:500]
            })
            used_content.append(para_text[:150])
    
    return sections[:4]  # Max 4 sections

def create_accordion_content(sections: List[Dict[str, str]], existing_data: Dict) -> Tuple[str, str, str, str, str, str, str, str]:
    """
    Create 2-4 accordion panels from extracted sections.
    Returns tuple of (panel1Title, panel1Content, panel2Title, panel2Content, panel3Title, panel3Content, panel4Title, panel4Content)
    """
    panels = ['', '', '', '']
    titles = ['', '', '', '']
    
    # Filter out info that's already in existing data (but be less aggressive)
    existing_text = ' '.join([
        existing_data.get('description', ''),
        existing_data.get('detailedDescription', ''),
    ]).lower()
    
    # Only check for substantial overlap, not exact matches
    existing_words = set(existing_text.split())
    
    panel_count = 0
    for section in sections[:4]:
        if panel_count >= 4:
            break
            
        section_content = section.get('content', '')
        section_title = section.get('title', '')
        
        # Skip if too short
        if len(section_content) < 50:
            continue
        
        # Check for substantial overlap (more than 70% word overlap means it's likely duplicate)
        section_words = set(section_content.lower().split())
        if len(section_words) > 0:
            overlap_ratio = len(section_words & existing_words) / len(section_words)
            if overlap_ratio > 0.7 and len(section_content) < 200:  # Only skip if very similar AND short
                continue
        
        # Rewrite content to be smooth and accordion-friendly
        rewritten = rewrite_for_accordion(section_content, section_title)
        
        if rewritten and len(rewritten) > 30:
            titles[panel_count] = section_title
            panels[panel_count] = rewritten
            panel_count += 1
    
    return titles[0], panels[0], titles[1], panels[1], titles[2], panels[2], titles[3], panels[3]

def rewrite_for_accordion(content: str, title: str) -> str:
    """Rewrite content to be clean, smooth, and sound human."""
    if not content:
        return ""
    
    # Remove all HTML tags and entities first
    content = re.sub(r'<[^>]+>', ' ', content)  # Remove HTML tags
    content = html.unescape(content)  # Decode HTML entities
    
    # Remove common artifacts from Visual Composer and shortcodes
    content = re.sub(r'\[vc_[^\]]+\]', ' ', content)
    content = re.sub(r'\[/[^\]]+\]', ' ', content)
    content = re.sub(r'\[[^\]]+\]', ' ', content)  # Remove any remaining shortcodes
    
    # Clean up whitespace
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Remove leading/trailing punctuation that doesn't make sense
    content = re.sub(r'^[,\s\.;:]+', '', content)
    content = re.sub(r'[,\s\.;:]+$', '', content)
    
    # Split into sentences for better processing
    # First, normalize sentence endings
    content = re.sub(r'\.\s*\.', '.', content)  # Remove double periods
    content = re.sub(r'([.!?])\s*([a-z])', r'\1 \2', content)  # Ensure space after sentence
    
    # Split into sentences
    sentences = re.split(r'([.!?]+\s*)', content)
    rewritten_sentences = []
    
    for i in range(0, len(sentences), 2):
        if i >= len(sentences):
            break
        sentence = sentences[i].strip()
        punctuation = sentences[i+1].strip() if i+1 < len(sentences) else '. '
        
        if not sentence:
            continue
        
        # Clean up the sentence
        sentence = re.sub(r'\s+', ' ', sentence)
        sentence = sentence.strip()
        
        # Remove trailing punctuation from sentence (we'll add it back)
        sentence = re.sub(r'[.!?]+$', '', sentence)
        
        # Capitalize first letter of sentence
        if sentence:
            # Handle quotes at the start
            if sentence.startswith('"') or sentence.startswith("'"):
                if len(sentence) > 1 and sentence[1].islower():
                    sentence = sentence[0] + sentence[1].upper() + sentence[2:]
            elif sentence[0].islower():
                sentence = sentence[0].upper() + sentence[1:]
        
        # Ensure sentence has proper ending
        if not punctuation or punctuation not in ['. ', '! ', '? ']:
            punctuation = '. '
        
        rewritten_sentences.append(sentence + punctuation)
    
    content = ''.join(rewritten_sentences)
    
    # Fix spacing issues - be careful with quotes and punctuation
    # Fix quotes and punctuation together - handle closing quotes with punctuation
    content = re.sub(r'(["\'])\s+([,\.;:!?])', r'\1\2', content)  # Remove space between quote and punctuation
    content = re.sub(r'([,\.;:!?])\s+(["\'])', r'\1\2', content)  # Remove space between punctuation and closing quote
    content = re.sub(r'([,\.;:!?])\s+(["\'])', r'\1\2', content)  # Remove space between punctuation and closing quote (again for safety)
    content = re.sub(r'\s+(["\'])', r'\1', content)  # Remove space before quotes
    content = re.sub(r'(["\'])\s+', r'\1 ', content)  # Ensure space after opening quote (but not before punctuation)
    # Fix punctuation spacing (but preserve quotes) - do this after quote fixes
    content = re.sub(r'\s+([,\.;:!?])', r'\1', content)  # Remove space before punctuation
    content = re.sub(r'([,\.;:!?])\s*([,\.;:!?])', r'\1', content)  # Remove duplicate punctuation
    content = re.sub(r'([a-z])([A-Z])', r'\1 \2', content)  # Add space between words
    # Final cleanup - remove any remaining awkward spacing around quotes
    content = re.sub(r'(["\'])\s+(["\'])', r'\1\2', content)  # Remove space between quotes
    content = re.sub(r'\s+', ' ', content)  # Normalize all whitespace
    
    # Fix sentence capitalization - capitalize after sentence endings
    content = re.sub(r'([.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), content)
    
    # Final cleanup
    content = content.strip()
    
    # Ensure it starts with a capital letter
    if content:
        if content[0].islower():
            content = content[0].upper() + content[1:]
        # Handle quotes at start
        elif (content.startswith('"') or content.startswith("'")) and len(content) > 1:
            if content[1].islower():
                content = content[0] + content[1].upper() + content[2:]
    
    # Ensure it ends with proper punctuation
    if content and content[-1] not in '.!?':
        content += '.'
    
    # Make it sound more natural - rewrite awkward phrases
    # Fix common business writing issues
    content = re.sub(r'\bwe have\b', 'we offer', content, flags=re.IGNORECASE)
    content = re.sub(r'\bwe are\b', 'we\'re', content, flags=re.IGNORECASE)
    content = re.sub(r'\bcome get\b', 'stop by for', content, flags=re.IGNORECASE)
    content = re.sub(r'\bLocated in\b', 'Find us at', content, flags=re.IGNORECASE)
    content = re.sub(r'\bLocated at\b', 'Find us at', content, flags=re.IGNORECASE)
    content = re.sub(r'\bYou can\b', 'Visitors can', content, flags=re.IGNORECASE)
    
    # Fix spacing around punctuation again after replacements
    content = re.sub(r'\s+([,\.;:!?])', r'\1', content)
    content = re.sub(r'([,\.;:!?])\s+', r'\1 ', content)
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    # Limit length for accordion (reasonable paragraph length)
    if len(content) > 500:
        # Try to cut at sentence boundary
        sentences = re.split(r'([.!?]+\s*)', content[:600])
        if len(sentences) > 2:
            # Take complete sentences
            result = ''
            for i in range(0, len(sentences)-2, 2):
                if len(result + sentences[i] + sentences[i+1]) > 500:
                    break
                result += sentences[i] + sentences[i+1]
            content = result.strip()
            if content and content[-1] not in '.!?':
                content += '.'
        else:
            content = content[:500]
            # Try to end at word boundary
            last_space = content.rfind(' ')
            if last_space > 400:
                content = content[:last_space] + '...'
            else:
                content = content[:500] + '...'
    
    # Final polish - fix any remaining quote/punctuation issues
    # Handle the specific case of punctuation followed by space and quote (including curly quotes)
    # Match any quote character (straight or curly)
    content = re.sub(r'([,\.;:!?])\s+(["\u201c\u201d\u2018\u2019])', r'\1\2', content)  # Remove space between punctuation and quote
    content = re.sub(r'(["\u201c\u201d\u2018\u2019])\s+([,\.;:!?])', r'\1\2', content)  # Remove space between quote and punctuation
    # Fix any remaining awkward spacing
    content = re.sub(r'\s+', ' ', content)
    content = content.strip()
    
    return content

def load_csv_data(filename: str) -> List[Dict]:
    """Load CSV file and return as list of dictionaries."""
    data = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data = list(reader)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
    return data

def find_matching_entry(slug: str, data_list: List[Dict], slug_column: str = 'Slug') -> Optional[Dict]:
    """Find entry matching slug in data list."""
    for entry in data_list:
        if entry.get(slug_column, '').lower() == slug.lower():
            return entry
    return None

def process_batch(to_merge_data: List[Dict], donor_data: List[Dict], pages_data: List[Dict], 
                  start_idx: int, end_idx: int) -> List[Dict]:
    """Process a batch of rows (25 at a time)."""
    processed = []
    
    for i in range(start_idx, min(end_idx, len(to_merge_data))):
        row = to_merge_data[i].copy()
        slug = row.get('slug', '').strip('"')
        
        if not slug:
            processed.append(row)
            continue
        
        # Find matching entry in donor file
        donor_match = find_matching_entry(slug, donor_data, 'Slug')
        
        # Try to find in Pages file - first by slug, then by name
        pages_match = find_matching_entry(slug, pages_data, 'Slug')
        
        # If no slug match, try matching by name (for area/category pages)
        if not pages_match and row.get('name'):
            listing_name = row.get('name', '').lower().strip()
            for pages_row in pages_data:
                pages_title = pages_row.get('Title', '').lower().strip()
                pages_slug = pages_row.get('Slug', '').lower().strip()
                pages_content = pages_row.get('Content', '')
                
                # Check if listing name matches page title or if it's an area match
                if (listing_name == pages_title or 
                    listing_name in pages_title or 
                    pages_title in listing_name or
                    # Check if listing area matches page (e.g., "Afton" area -> "Afton" page)
                    (row.get('area', '').lower().strip() == pages_title and len(pages_content) > 1000)):
                    pages_match = pages_row
                    break
        
        # Extract accordion content
        accordion_sections = []
        
        if donor_match:
            # Try multiple content columns
            content = (donor_match.get('Content', '') or 
                     donor_match.get('_nectar_portfolio_extra_content', '') or
                     donor_match.get('_nectar_portfolio_extra_content_preview', ''))
            if content:
                sections = extract_sections_from_content(content)
                accordion_sections.extend(sections)
        
        if pages_match:
            content = pages_match.get('Content', '')
            if content:
                sections = extract_sections_from_content(content)
                # Only add if not duplicate
                for section in sections:
                    if section not in accordion_sections:
                        accordion_sections.append(section)
        
        # Create accordion panels
        if accordion_sections:
            title1, content1, title2, content2, title3, content3, title4, content4 = create_accordion_content(accordion_sections, row)
            
            # Add accordion columns (up to 4 panels)
            row['accordionPanel1Title'] = title1 if title1 else ''
            row['accordionPanel1Content'] = content1 if content1 else ''
            row['accordionPanel2Title'] = title2 if title2 else ''
            row['accordionPanel2Content'] = content2 if content2 else ''
            row['accordionPanel3Title'] = title3 if title3 else ''
            row['accordionPanel3Content'] = content3 if content3 else ''
            row['accordionPanel4Title'] = title4 if title4 else ''
            row['accordionPanel4Content'] = content4 if content4 else ''
        else:
            # Add empty columns
            row['accordionPanel1Title'] = ''
            row['accordionPanel1Content'] = ''
            row['accordionPanel2Title'] = ''
            row['accordionPanel2Content'] = ''
            row['accordionPanel3Title'] = ''
            row['accordionPanel3Content'] = ''
            row['accordionPanel4Title'] = ''
            row['accordionPanel4Content'] = ''
        
        processed.append(row)
    
    return processed

def main():
    """Main processing function."""
    print("Loading CSV files...")
    
    # Load all data
    to_merge_data = load_csv_data('CSV/A - to merge- listings-2026-01-02.csv')
    donor_data = load_csv_data('CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv')
    pages_data = load_csv_data('CSV/A - Pages-Export-2026-January-04-1331.csv')
    
    print(f"Loaded {len(to_merge_data)} rows from 'to merge' file")
    print(f"Loaded {len(donor_data)} rows from 'Donor' file")
    print(f"Loaded {len(pages_data)} rows from 'Pages' file")
    
    # Process in batches of 25
    batch_size = 25
    total_rows = len(to_merge_data)
    all_processed = []
    
    print(f"\nProcessing {total_rows} rows in batches of {batch_size}...")
    
    for start_idx in range(1, total_rows, batch_size):  # Start at 1 to skip header
        end_idx = min(start_idx + batch_size, total_rows)
        print(f"Processing rows {start_idx} to {end_idx}...")
        
        batch = process_batch(to_merge_data, donor_data, pages_data, start_idx, end_idx)
        all_processed.extend(batch)
        
        print(f"  ✓ Processed {len(batch)} rows")
    
    # Write output
    output_file = 'CSV/A - to merge- listings-2026-01-02-merged.csv'
    
    if all_processed:
        # Get fieldnames from first row + new accordion columns
        fieldnames = list(to_merge_data[0].keys()) + [
            'accordionPanel1Title', 'accordionPanel1Content',
            'accordionPanel2Title', 'accordionPanel2Content',
            'accordionPanel3Title', 'accordionPanel3Content',
            'accordionPanel4Title', 'accordionPanel4Content'
        ]
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_processed)
        
        print(f"\n✓ Successfully wrote {len(all_processed)} rows to {output_file}")
    else:
        print("No data processed!")

if __name__ == '__main__':
    main()

