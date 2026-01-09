#!/usr/bin/env python3
"""
Extract full content from nectar fields in donor CSV and pages CSV
Format into 1-2 nice paragraphs for descriptions
"""

import csv
import sys
import os
import re
import time
from html import unescape

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

# No OpenAI needed - we're just formatting existing content into paragraphs, not rewriting


def extract_text_from_html(html_content):
    """Extract plain text from HTML content"""
    if not html_content:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html_content)
    text = unescape(text)
    text = ' '.join(text.split())
    return text.strip()


def extract_youtube_from_vc_content(vc_content):
    """
    Extract YouTube URL from VC content before text extraction
    Returns (youtube_url, cleaned_content) or (None, vc_content)
    """
    if not vc_content:
        return None, vc_content
    
    youtube_url = None
    cleaned_content = vc_content
    
    # Pattern to match YouTube video IDs from various formats
    youtube_patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
    ]
    
    # Check for iframe embeds
    iframe_pattern = r'<iframe[^>]*src=["\']([^"\']*youtube[^"\']*)["\']'
    
    iframe_matches = list(re.finditer(iframe_pattern, vc_content, re.IGNORECASE))
    for match in iframe_matches:
        iframe_src = match.group(1)
        # Extract video ID from iframe src
        for pattern in youtube_patterns:
            id_match = re.search(pattern, iframe_src, re.IGNORECASE)
            if id_match:
                video_id = id_match.group(1)
                youtube_url = f'https://www.youtube.com/watch?v={video_id}'
                # Remove the entire iframe tag
                cleaned_content = cleaned_content.replace(match.group(0), '').strip()
                break
        if youtube_url:
            break
    
    # If no iframe, try direct URL patterns in the content
    if not youtube_url:
        for pattern in youtube_patterns:
            matches = list(re.finditer(pattern, vc_content, re.IGNORECASE))
            if matches:
                video_id = matches[0].group(1)
                youtube_url = f'https://www.youtube.com/watch?v={video_id}'
                # Remove the URL from content
                cleaned_content = re.sub(pattern, '', cleaned_content, flags=re.IGNORECASE).strip()
                break
    
    return youtube_url, cleaned_content


def extract_text_from_vc_row(vc_content):
    """Extract plain text from Visual Composer shortcode content"""
    if not vc_content:
        return ""
    # Remove Visual Composer shortcode tags like [vc_row ...]
    text = re.sub(r'\[/?[^\]]+\]', ' ', vc_content)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode HTML entities
    text = unescape(text)
    # Clean up whitespace
    text = ' '.join(text.split())
    return text.strip()


def load_donor_csv(donor_path):
    """Load donor CSV and extract all nectar content"""
    donor_data = {}
    donor_youtube = {}  # Store YouTube URLs separately
    
    if not os.path.exists(donor_path):
        print(f"⚠️  Donor CSV not found: {donor_path}")
        return donor_data, donor_youtube
    
    print(f"📖 Loading donor CSV: {donor_path}")
    
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('Slug', '').strip().lower()
            if slug:
                # Get all nectar fields
                nectar_extra = row.get('_nectar_portfolio_extra_content', '').strip()
                nectar_preview = row.get('_nectar_portfolio_extra_content_preview', '').strip()
                nectar_excerpt = row.get('_nectar_project_excerpt', '').strip()
                
                # Also get standard fields
                content = row.get('Content', '').strip()
                excerpt = row.get('Excerpt', '').strip()
                
                # Extract YouTube links before text extraction
                youtube_url = None
                for field_content in [nectar_extra, nectar_preview, content]:
                    if field_content:
                        yt_url, _ = extract_youtube_from_vc_content(field_content)
                        if yt_url:
                            youtube_url = yt_url
                            break
                
                # Extract text from each field (after YouTube extraction)
                nectar_extra_text = extract_text_from_vc_row(nectar_extra) if nectar_extra else ""
                nectar_preview_text = extract_text_from_vc_row(nectar_preview) if nectar_preview else ""
                nectar_excerpt_text = nectar_excerpt if nectar_excerpt else ""
                content_text = extract_text_from_html(content) if content else ""
                excerpt_text = extract_text_from_html(excerpt) if excerpt else ""
                
                # Combine all content - prioritize nectar fields
                parts = []
                if nectar_extra_text:
                    parts.append(nectar_extra_text)
                if nectar_preview_text:
                    parts.append(nectar_preview_text)
                if nectar_excerpt_text:
                    parts.append(nectar_excerpt_text)
                if excerpt_text:
                    parts.append(excerpt_text)
                if content_text:
                    parts.append(content_text)
                
                full_content = ' '.join(parts).strip()
                if full_content:
                    donor_data[slug] = full_content
                    if youtube_url:
                        donor_youtube[slug] = youtube_url
    
    print(f"✅ Loaded {len(donor_data)} entries from donor CSV")
    return donor_data, donor_youtube


def load_pages_csv(pages_path):
    """Load pages CSV and extract content"""
    pages_data = {}
    pages_youtube = {}  # Store YouTube URLs separately
    
    if not os.path.exists(pages_path):
        print(f"⚠️  Pages CSV not found: {pages_path}")
        return pages_data, pages_youtube
    
    print(f"📖 Loading pages CSV: {pages_path}")
    
    with open(pages_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('Slug', '').strip().lower()
            if slug:
                # Get all content fields
                content = row.get('Content', '').strip()
                excerpt = row.get('Excerpt', '').strip()
                
                # Check for nectar fields
                nectar_extra = row.get('_nectar_portfolio_extra_content', '').strip()
                nectar_preview = row.get('_nectar_portfolio_extra_content_preview', '').strip()
                
                # Extract YouTube links before text extraction
                youtube_url = None
                for field_content in [content, nectar_extra, nectar_preview]:
                    if field_content:
                        yt_url, _ = extract_youtube_from_vc_content(field_content)
                        if yt_url:
                            youtube_url = yt_url
                            break
                
                # Extract text - pages CSV Content field contains VC shortcodes, so use VC extraction
                content_text = extract_text_from_vc_row(content) if content else ""
                excerpt_text = extract_text_from_html(excerpt) if excerpt else ""
                nectar_extra_text = extract_text_from_vc_row(nectar_extra) if nectar_extra else ""
                nectar_preview_text = extract_text_from_vc_row(nectar_preview) if nectar_preview else ""
                
                # Combine
                parts = []
                if nectar_extra_text:
                    parts.append(nectar_extra_text)
                if nectar_preview_text:
                    parts.append(nectar_preview_text)
                if content_text:
                    parts.append(content_text)
                if excerpt_text:
                    parts.append(excerpt_text)
                
                full_content = ' '.join(parts).strip()
                if full_content:
                    pages_data[slug] = full_content
                    if youtube_url:
                        pages_youtube[slug] = youtube_url
    
    print(f"✅ Loaded {len(pages_data)} entries from pages CSV")
    return pages_data, pages_youtube


def detect_other_listing_names(text, current_listing_name):
    """
    Detect if text contains names of other businesses/listings
    Returns the position where another listing starts, or None
    """
    if not current_listing_name or not text:
        return None
    
    # Extract key words from current listing name (exclude common words)
    common_words = {'the', 'and', 'or', 'of', 'for', 'with', 'coffee', 'restaurant', 'market', 'inn', 'vineyard'}
    current_words = set(word.lower() for word in current_listing_name.split() 
                       if len(word) > 2 and word.lower() not in common_words)
    
    # Look for business names that typically start with a proper noun followed by possessive or descriptive words
    # Pattern: Capitalized word + 's (possessive) or Capitalized words that look like business names
    # Examples: "Rapunzel's", "Blue Ridge", "Trager Brothers"
    business_name_patterns = [
        r"\b([A-Z][a-z]+'s)\s+[A-Z][a-z]+",  # "Rapunzel's Coffee"
        r'\b([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:Coffee|Restaurant|Market|Inn|Vineyard|Brewery|Shop|Store)',  # "Blue Ridge Coffee"
    ]
    
    for pattern in business_name_patterns:
        matches = list(re.finditer(pattern, text))
        for match in matches:
            potential_name = match.group(1)
            potential_words = set(word.lower().rstrip("'s") for word in potential_name.split() if len(word) > 2)
            
            # If this potential name has significant overlap with current name, it's probably the same listing
            overlap = len(current_words & potential_words)
            if overlap >= 1:  # Even one word overlap might be the same
                continue
            
            # Check if this looks like a business name
            pos = match.start()
            if pos > 200:  # Not at the very beginning (allow some description first)
                before = text[max(0, pos-100):pos]
                # Check if it appears after a sentence ending, contact info, or on a new line
                if (re.search(r'[.!?]\s+$', before) or 
                    re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', before[-50:]) or  # Phone number before
                    '\n' in before[-30:]):
                    # This might be a new listing
                    # Look backwards to find the sentence boundary
                    sentence_end = re.search(r'[.!?]\s+', text[:pos])
                    if sentence_end:
                        return sentence_end.end()
    
    return None


def remove_contact_info_from_end(text, listing_name=None):
    """
    Remove phone numbers, addresses, and contact info from the end of text
    Also stop at natural ending markers and content from other listings
    """
    if not text:
        return text
    
    # First, check if we've moved to another listing
    other_listing_pos = detect_other_listing_names(text, listing_name)
    if other_listing_pos:
        text = text[:other_listing_pos].strip()
    
    # Only look for contact info in the last 40% of the text to avoid cutting off descriptive content
    text_length = len(text)
    contact_section_start = int(text_length * 0.6)  # Last 40% of text
    
    # Patterns that clearly indicate contact info section (high confidence)
    high_confidence_markers = [
        r'\b(?:contact\s+information|contact\s+info)\s*[:\.,]?',  # "Contact Information" header
        r'\b(?:for\s+more\s+information|contact\s+us|call\s+us|visit\s+us|reach\s+us|get\s+in\s+touch|find\s+us)\s*[:\.,]',
        r'(?:phone|call|tel)[\s:]+(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})',
        r'(?:address|mailing\s+address)[\s:]+',
        r'\b(?:P\.?O\.?\s*Box|PO\s*Box)\s+\d+',
        r'\b(?:please\s+visit|visit\s+us|check\s+out|learn\s+more|see\s+more)\s+(?:our\s+)?(?:website|site|page)',
        r'\bto\s+(?:learn|support|visit|contact|call)',
    ]
    
    # Patterns that suggest contact info but need context (lower confidence)
    # Only match these in the last portion
    lower_confidence_markers = [
        r'\b(?:located\s+at|find\s+us\s+at)\s+\d+\s+[A-Z][^.!?]{5,50}(?:Street|Road|Highway|Route|Avenue|Drive|Lane|Way|Court|Circle|Loop|Boulevard)',
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',  # Standalone phone numbers
    ]
    
    # Pattern for address + phone number together (high confidence contact block)
    # More flexible pattern to catch variations like "486 Front St" (St instead of Street)
    contact_block_pattern = r'\d+\s+[A-Z][^.!?]{3,60}(?:Street|St|Road|Rd|Highway|Hwy|Route|Rt|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Loop|Boulevard|Blvd)[^.!?]{0,60}(?:,\s*[A-Z][a-z]+[^.!?]{0,30})?(?:,\s*VA|,\s*Virginia)?\s+\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
    
    # Also check for address and phone separately but close together (within 100 chars)
    address_pattern = r'\d+\s+[A-Z][^.!?]{3,60}(?:Street|St|Road|Rd|Highway|Hwy|Route|Rt|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Loop|Boulevard|Blvd)[^.!?]{0,60}(?:,\s*[A-Z][a-z]+[^.!?]{0,30})?(?:,\s*VA|,\s*Virginia)?'
    phone_pattern = r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
    
    # Patterns that suggest we've moved to another listing or section
    section_markers = [
        r'\n\s*(?:Related|See\s+Also|More\s+Information|Next|Previous|Back\s+to)',
        r'\b(?:Click\s+here|Learn\s+more|Read\s+more|View\s+all)',
    ]
    
    # If we have a listing name, look for it appearing again (might indicate we've looped)
    if listing_name:
        # Extract key words from listing name (2+ words)
        name_words = listing_name.split()
        if len(name_words) >= 2:
            # Look for the listing name appearing again after it's already been mentioned
            # This might indicate we've moved to a new section
            name_pattern = r'\b' + re.escape(' '.join(name_words[:2])) + r'\b'
            matches = list(re.finditer(name_pattern, text, re.IGNORECASE))
            if len(matches) > 1:
                # If the name appears multiple times, check if there's a large gap
                # suggesting we've moved to a different section
                for i in range(1, len(matches)):
                    gap = matches[i].start() - matches[i-1].end()
                    if gap > 500:  # Large gap suggests different section
                        # Cut at the second occurrence
                        text = text[:matches[i].start()].strip()
                        break
    
    # Find the earliest ending marker
    earliest_end = len(text)
    
    # Check for contact block (address + phone) - highest priority
    contact_block_matches = list(re.finditer(contact_block_pattern, text, re.IGNORECASE))
    if contact_block_matches:
        first_match_pos = contact_block_matches[0].start()
        before_text = text[:first_match_pos]
        sentence_endings = list(re.finditer(r'[.!?]\s+', before_text))
        if sentence_endings:
            earliest_end = min(earliest_end, sentence_endings[-1].end())
        else:
            earliest_end = min(earliest_end, first_match_pos)
    else:
        # Check for address and phone separately but close together
        addr_matches = list(re.finditer(address_pattern, text, re.IGNORECASE))
        phone_matches = list(re.finditer(phone_pattern, text))
        if addr_matches and phone_matches:
            for addr_match in addr_matches:
                addr_end = addr_match.end()
                # Look for phone within 100 chars after address
                for phone_match in phone_matches:
                    if phone_match.start() >= addr_end and phone_match.start() <= addr_end + 100:
                        # Found address + phone close together
                        first_match_pos = addr_match.start()
                        before_text = text[:first_match_pos]
                        sentence_endings = list(re.finditer(r'[.!?]\s+', before_text))
                        if sentence_endings:
                            earliest_end = min(earliest_end, sentence_endings[-1].end())
                        else:
                            earliest_end = min(earliest_end, first_match_pos)
                        break
                if earliest_end < len(text):
                    break
    
    # Check high confidence markers anywhere in text
    for pattern in high_confidence_markers:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        if matches:
            for match in matches:
                first_match_pos = match.start()
                before_text = text[:first_match_pos]
                sentence_endings = list(re.finditer(r'[.!?]\s+', before_text))
                if sentence_endings:
                    earliest_end = min(earliest_end, sentence_endings[-1].end())
                    break
                else:
                    earliest_end = min(earliest_end, first_match_pos)
                    break
    
    # Check lower confidence markers only in the last portion
    for pattern in lower_confidence_markers:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        if matches:
            for match in matches:
                if match.start() >= contact_section_start:
                    first_match_pos = match.start()
                    before_text = text[:first_match_pos]
                    sentence_endings = list(re.finditer(r'[.!?]\s+', before_text))
                    if sentence_endings:
                        earliest_end = min(earliest_end, sentence_endings[-1].end())
                        break
                    else:
                        earliest_end = min(earliest_end, first_match_pos)
                        break
    
    # Check for section markers
    for pattern in section_markers:
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        if matches:
            first_match_pos = matches[0].start()
            before_text = text[:first_match_pos]
            sentence_endings = list(re.finditer(r'[.!?]\s+', before_text))
            if sentence_endings:
                earliest_end = min(earliest_end, sentence_endings[-1].end())
            else:
                earliest_end = min(earliest_end, first_match_pos)
    
    # If we found an ending marker, truncate there
    if earliest_end < len(text):
        text = text[:earliest_end].strip()
        # Make sure it ends with proper punctuation
        if text and text[-1] not in '.!?':
            # Find the last sentence ending
            last_sentence = re.search(r'[.!?]\s*$', text)
            if last_sentence:
                text = text[:last_sentence.end()].strip()
    
    return text


def extract_youtube_url(text):
    """
    Extract YouTube video URL from text
    Returns (youtube_url, cleaned_text) or (None, text)
    """
    if not text:
        return None, text
    
    # Pattern to match YouTube video IDs from various formats
    youtube_patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
    ]
    
    # Also check for iframe embeds
    iframe_pattern = r'<iframe[^>]*src=["\']([^"\']*youtube[^"\']*)["\']'
    
    video_id = None
    cleaned_text = text
    
    # Try iframe first
    iframe_matches = re.finditer(iframe_pattern, text, re.IGNORECASE)
    for match in iframe_matches:
        iframe_src = match.group(1)
        # Extract video ID from iframe src
        for pattern in youtube_patterns:
            id_match = re.search(pattern, iframe_src, re.IGNORECASE)
            if id_match:
                video_id = id_match.group(1)
                # Remove the entire iframe tag
                cleaned_text = cleaned_text.replace(match.group(0), '').strip()
                break
        if video_id:
            break
    
    # If no iframe, try direct URL patterns
    if not video_id:
        for pattern in youtube_patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if matches:
                video_id = matches[0].group(1)
                # Remove the URL from text
                cleaned_text = re.sub(pattern, '', cleaned_text, flags=re.IGNORECASE).strip()
                break
    
    if video_id:
        # Return standard YouTube URL format
        youtube_url = f'https://www.youtube.com/watch?v={video_id}'
        # Clean up extra whitespace and newlines
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        return youtube_url, cleaned_text
    
    return None, text


def format_content_into_paragraphs(source_content, listing_name=None):
    """
    Format source content into 1-2 nice paragraphs without editing/rewriting
    Just breaks the content into natural paragraph breaks, preserving all original text
    Also removes contact info from the end and stops at natural boundaries
    Also extracts YouTube links
    """
    if not source_content:
        return "", None
    
    # First, extract YouTube links if present
    youtube_url, text = extract_youtube_url(source_content)
    
    # Then, remove contact info from the end and stop at natural boundaries
    text = remove_contact_info_from_end(text, listing_name)
    
    # Clean up the content first - normalize whitespace but preserve structure
    text = ' '.join(text.split())  # Normalize whitespace
    
    # Replace any double quotes with single quotes for Google Sheets compatibility
    text = text.replace('"', "'")
    text = text.replace('"', "'")
    text = text.replace('"', "'")
    
    # Split into sentences using regex
    # Match sentence endings (. ! ?) followed by space and capital letter or end of string
    sentence_pattern = r'([.!?])\s+([A-Z])'
    
    # Find all sentence breaks
    sentences = []
    last_end = 0
    
    for match in re.finditer(sentence_pattern, text):
        # Add the sentence up to and including the punctuation
        sentence_end = match.end(1) + 1
        sentences.append(text[last_end:sentence_end].strip())
        last_end = sentence_end
    
    # Add the last sentence
    if last_end < len(text):
        sentences.append(text[last_end:].strip())
    
    # Filter out empty sentences
    sentences = [s for s in sentences if s]
    
    if not sentences:
        return text.strip()
    
    # Group sentences into 1-2 paragraphs
    # Target: ~200-400 characters per paragraph, or 3-5 sentences
    paragraphs = []
    current_para = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence)
        
        # If we already have one paragraph and adding this would make it too long,
        # or if we have 4+ sentences, start a new paragraph
        if len(paragraphs) == 0 and (current_length + sentence_length > 400 or len(current_para) >= 5):
            paragraphs.append(' '.join(current_para))
            current_para = [sentence]
            current_length = sentence_length
        elif len(paragraphs) == 1:
            # We already have one paragraph, add everything else to second paragraph
            current_para.append(sentence)
            current_length += sentence_length + 1
        else:
            # Still building first paragraph
            current_para.append(sentence)
            current_length += sentence_length + 1
    
    # Add the last paragraph
    if current_para:
        paragraphs.append(' '.join(current_para))
    
    # Limit to 2 paragraphs max - if more, combine middle ones
    if len(paragraphs) > 2:
        first_para = ' '.join(paragraphs[:-1])
        paragraphs = [first_para, paragraphs[-1]]
    
    # Join paragraphs with double newline
    formatted = '\n\n'.join(paragraphs)
    
    return formatted.strip(), youtube_url


def main():
    input_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes.csv'
    donor_path = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    pages_path = 'CSV/A - Pages-Export-2026-January-04-1331.csv'
    output_file = input_file.replace('.csv', '-full-nectar-content.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        sys.exit(1)
    
    # No API key needed - we're just formatting, not rewriting
    
    # Load donor and pages CSV
    donor_data, donor_youtube = load_donor_csv(donor_path)
    pages_data, pages_youtube = load_pages_csv(pages_path)
    
    print(f"\n📖 Loading listings CSV: {input_file}")
    
    # Load listings
    listings = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Find listings with content available
    print("\n🔍 Matching listings with donor/pages content...")
    
    listings_to_update = []
    for listing in listings:
        slug = listing.get('slug', '').strip().lower()
        if slug:
            # Check both donor and pages
            donor_content = donor_data.get(slug, '')
            pages_content = pages_data.get(slug, '')
            
            # Get YouTube URLs
            donor_yt = donor_youtube.get(slug, '')
            pages_yt = pages_youtube.get(slug, '')
            
            # Prioritize pages CSV if it has substantial content (it's more comprehensive)
            # Otherwise use donor, or combine if both exist
            if pages_content and len(pages_content) > 100:
                # Pages CSV has content - use it (it's more comprehensive)
                content = pages_content
                youtube_url = pages_yt if pages_yt else donor_yt
                source = 'pages'
            elif donor_content and len(donor_content) > 100:
                # Only donor has content - use it
                content = donor_content
                youtube_url = donor_yt
                source = 'donor'
            else:
                # Neither has enough content
                content = ''
                youtube_url = pages_yt if pages_yt else donor_yt
                source = None
            
            if content and len(content) > 100:
                listings_to_update.append({
                    'listing': listing,
                    'content': content,
                    'youtube_url': youtube_url,
                    'source': source
                })
    
    print(f"\n📊 Found {len(listings_to_update)} listings with source content available")
    
    if len(listings_to_update) == 0:
        print("⚠️  No listings matched with source content!")
        return
    
    # Show examples
    print("\n📋 Sample listings to update:")
    for i, item in enumerate(listings_to_update[:5], 1):
        name = item['listing'].get('name', 'Unknown')
        content_len = len(item['content'])
        print(f"\n{i}. {name}")
        print(f"   Source content: {content_len} characters")
        print(f"   Preview: {item['content'][:150]}...")
    
    # Auto-proceed
    print(f"\n⚠️  Ready to format {len(listings_to_update)} descriptions")
    print("   Proceeding automatically...")
    
    # Process listings
    print(f"\n🔄 Formatting {len(listings_to_update)} descriptions...")
    
    updated_count = 0
    error_count = 0
    
    # Create set of slugs to update
    update_slugs = {item['listing'].get('slug', '').strip().lower() for item in listings_to_update}
    content_map = {item['listing'].get('slug', '').strip().lower(): item['content'] for item in listings_to_update}
    youtube_map = {item['listing'].get('slug', '').strip().lower(): item['youtube_url'] for item in listings_to_update if item['youtube_url']}
    
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        
        for listing in listings:
            slug = listing.get('slug', '').strip().lower()
            name = listing.get('name', 'Unknown')
            listing_type = listing.get('type', '')
            
            # Update if we have source content
            if slug in update_slugs:
                source_content = content_map[slug]
                
                print(f"\n   🔄 Formatting: {name}")
                print(f"      Source content: {len(source_content)} chars")
                
                try:
                    formatted, youtube_url_from_text = format_content_into_paragraphs(source_content, name)
                    
                    if formatted:
                        listing['description'] = formatted
                        
                        # Update videoLink - prioritize YouTube from source data, then from text extraction
                        youtube_url = youtube_map.get(slug, '') or youtube_url_from_text
                        if youtube_url:
                            listing['videoLink'] = youtube_url
                            print(f"      🎥 Found YouTube link: {youtube_url}")
                        
                        updated_count += 1
                        print(f"      ✅ Formatted ({len(formatted)} chars)")
                        print(f"      Preview: {formatted[:100]}...")
                    else:
                        error_count += 1
                        print(f"      ⚠️  Failed to format - keeping original")
                except Exception as e:
                    error_count += 1
                    print(f"      ❌ Error: {e} - keeping original")
            
            # Always write the listing, whether updated or not
            writer.writerow(listing)
    
    print(f"\n✅ Complete!")
    print(f"   Updated: {updated_count} descriptions")
    print(f"   Errors: {error_count}")
    print(f"   Kept original: {len(listings) - updated_count - error_count}")
    print(f"   Output file: {output_file}")


if __name__ == '__main__':
    main()
