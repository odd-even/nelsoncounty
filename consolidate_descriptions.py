#!/usr/bin/env python3
"""
Consolidate description and detailedDescription columns into a single comprehensive description.
Also incorporates key information from accordion panels to create a complete listing summary.
"""

import csv
import re
from typing import Dict, List

def clean_text(text: str) -> str:
    """Clean and normalize text."""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text

def extract_key_info_from_accordion(row: Dict) -> List[str]:
    """Extract the most important information from accordion panels."""
    key_info = []
    
    # Priority order for accordion panels (most important first)
    panel_priorities = [
        ('accordionPanel1Content', 'accordionPanel1Title'),
        ('accordionPanel2Content', 'accordionPanel2Title'),
        ('accordionPanel3Content', 'accordionPanel3Title'),
        ('accordionPanel4Content', 'accordionPanel4Title'),
    ]
    
    for content_key, title_key in panel_priorities:
        content = row.get(content_key, '').strip()
        title = row.get(title_key, '').strip()
        
        if not content:
            continue
        
        # Skip generic or less useful content
        skip_patterns = [
            r'photos.*courtesy',
            r'\*lodging descriptions.*provided by',
            r'staff on site',
            r'pet-friendly',
            r'find us at',
            r'we want your visit.*trouble-free',
            r'before you arrive',
            r'observe the rules',
            r'please become familiar',
        ]
        
        should_skip = False
        for pattern in skip_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                should_skip = True
                break
        
        if should_skip:
            continue
        
        # Extract key sentences or phrases
        # Look for important information based on title
        if any(word in title.lower() for word in ['history', 'about', 'experience']):
            # Take first 1-2 sentences
            sentences = re.split(r'([.!?]+\s+)', content)
            if len(sentences) >= 3:
                key_info.append(''.join(sentences[:3]).strip())
            else:
                key_info.append(content[:200].strip())
        elif any(word in title.lower() for word in ['hours', 'information']):
            # Take key details (but skip if it's just contact info)
            if not re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', content):  # Skip if contains phone
                if len(content) < 150:
                    key_info.append(content)
                else:
                    # Extract first sentence or key phrases
                    sentences = re.split(r'([.!?]+\s+)', content)
                    if len(sentences) >= 2:
                        key_info.append(''.join(sentences[:2]).strip())
        elif 'contact' in title.lower():
            # Skip contact info - it's redundant with address/phone columns
            continue
        elif any(word in title.lower() for word in ['menu', 'offerings', 'feature']):
            # Take first sentence
            sentences = re.split(r'([.!?]\s+)', content)
            if len(sentences) >= 2:
                key_info.append(''.join(sentences[:2]).strip())
        else:
            # For other types, take first meaningful sentence
            if len(content) > 100:
                sentences = re.split(r'([.!?]\s+)', content)
                if len(sentences) >= 2:
                    key_info.append(''.join(sentences[:2]).strip())
            else:
                key_info.append(content)
    
    return key_info

def consolidate_description(row: Dict) -> str:
    """Create a comprehensive description from all available sources."""
    name = row.get('name', '').strip()
    desc = clean_text(row.get('description', ''))
    detailed = clean_text(row.get('detailedDescription', ''))
    
    # Start with the base description
    parts = []
    
    # Use description as the opening (it's usually the shorter, punchier version)
    if desc:
        parts.append(desc)
    
    # Add detailed description if it adds substantial new information
    if detailed:
        # Check if detailed adds new info beyond description
        if desc:
            desc_words = set(desc.lower().split())
            detailed_words = set(detailed.lower().split())
            
            # If detailed has significant new content (more than 30% new words)
            if len(detailed_words) > 0:
                new_words = detailed_words - desc_words
                new_ratio = len(new_words) / len(detailed_words)
                
                if new_ratio > 0.3 or len(detailed) > len(desc) * 1.5:
                    # Check if detailed is just an expansion of desc
                    if not detailed.lower().startswith(desc.lower()[:50].lower()):
                        # Extract the new part
                        # Try to find where detailed diverges from desc
                        detailed_lower = detailed.lower()
                        desc_lower = desc.lower()
                        
                        # If detailed contains desc, take what comes after
                        if desc_lower in detailed_lower:
                            idx = detailed_lower.find(desc_lower)
                            if idx > -1:
                                new_part = detailed[idx + len(desc):].strip()
                                if new_part and len(new_part) > 50:
                                    parts.append(new_part)
                            else:
                                parts.append(detailed)
                        else:
                            parts.append(detailed)
        else:
            # No description, use detailed
            parts.append(detailed)
    
    # Extract key info from accordion panels
    accordion_info = extract_key_info_from_accordion(row)
    
    # Add accordion info if it adds value (prioritize history, about, experience)
    for info in accordion_info[:2]:  # Limit to 2 most important pieces
        if info:
            # Check if this info is already covered
            info_lower = info.lower()
            existing_text = ' '.join(parts).lower()
            
            # Skip if too similar to existing content
            info_words = set(info_lower.split())
            existing_words = set(existing_text.split())
            
            if len(info_words) > 0:
                overlap = len(info_words & existing_words) / len(info_words)
                if overlap < 0.5:  # Only add if less than 50% overlap
                    # Clean up the info snippet
                    info_clean = info.strip()
                    # Remove leading fragments
                    if info_clean.startswith('(') or info_clean.startswith('and '):
                        # Try to extract a complete sentence
                        sentences = re.split(r'([.!?]+\s+)', info_clean)
                        if len(sentences) >= 2:
                            info_clean = ''.join(sentences[1:]).strip()  # Skip first fragment
                    
                    if info_clean and len(info_clean) > 40:
                        parts.append(info_clean)
    
    # Combine all parts into a smooth narrative
    consolidated = ' '.join(parts)
    
    # Clean up
    consolidated = re.sub(r'\s+', ' ', consolidated)
    consolidated = consolidated.strip()
    
    # Remove duplicate sentences (simple check)
    sentences = re.split(r'([.!?]+\s+)', consolidated)
    seen_sentences = set()
    unique_sentences = []
    for i in range(0, len(sentences), 2):
        if i >= len(sentences):
            break
        sentence = sentences[i].strip()
        punctuation = sentences[i+1] if i+1 < len(sentences) else '. '
        
        if not sentence:
            continue
        
        # Skip incomplete sentences (ending with numbers or single words)
        if re.search(r'\s+\d+\.?\s*$', sentence) or len(sentence.split()) < 3:
            continue
        
        # Check for duplicates (normalize for comparison)
        sentence_normalized = re.sub(r'[^\w\s]', '', sentence.lower())
        if sentence_normalized not in seen_sentences and len(sentence_normalized) > 20:
            seen_sentences.add(sentence_normalized)
            unique_sentences.append(sentence + punctuation)
    
    consolidated = ''.join(unique_sentences)
    
    # Ensure proper sentence structure
    # Fix spacing around punctuation
    consolidated = re.sub(r'\s+([,\.;:!?])', r'\1', consolidated)
    consolidated = re.sub(r'([,\.;:!?])\s*([,\.;:!?])', r'\1', consolidated)
    consolidated = re.sub(r'([a-z])([A-Z])', r'\1 \2', consolidated)
    consolidated = re.sub(r'\s+', ' ', consolidated)
    
    # Fix sentence capitalization
    consolidated = re.sub(r'([.!?]\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), consolidated)
    
    # Ensure it starts with capital and ends with punctuation
    if consolidated:
        if consolidated[0].islower():
            consolidated = consolidated[0].upper() + consolidated[1:]
        # Handle quotes at start
        if (consolidated.startswith('"') or consolidated.startswith("'")) and len(consolidated) > 1:
            if consolidated[1].islower():
                consolidated = consolidated[0] + consolidated[1].upper() + consolidated[2:]
    
    # Fix double punctuation and trailing issues
    # Remove any trailing spaces and periods first
    consolidated = consolidated.rstrip(' .')
    
    # Fix double periods anywhere
    consolidated = re.sub(r'\.\s*\.', '.', consolidated)
    consolidated = re.sub(r'\.\s*\.\s*$', '.', consolidated)
    
    # Remove incomplete trailing sentences
    if consolidated:
        # Check if ends with incomplete sentence (like "roughly 1.")
        if re.search(r'\s+\d+\.?\s*$', consolidated):
            # Remove the incomplete sentence
            consolidated = re.sub(r'[^.!?]*\s+\d+\.?\s*$', '', consolidated)
            consolidated = consolidated.strip()
    
    # Ensure it ends with proper punctuation (but not double)
    if consolidated:
        consolidated = consolidated.rstrip(' .')
        if consolidated[-1] not in '.!?':
            consolidated += '.'
    
    # Limit length to reasonable size (aim for 300-600 words, but be flexible)
    # Roughly 2000-4000 characters for a good summary
    if len(consolidated) > 4000:
        # Try to cut at sentence boundary
        sentences = re.split(r'([.!?]+\s+)', consolidated[:4500])
        if len(sentences) > 2:
            consolidated = ''.join(sentences[:-1])
            if consolidated and consolidated[-1] not in '.!?':
                consolidated += '.'
        else:
            consolidated = consolidated[:4000] + '...'
    
    return consolidated

def main():
    """Main processing function."""
    input_file = 'CSV/A - to merge- listings-2026-01-02-merged.csv'
    output_file = 'CSV/A - to merge- listings-2026-01-02-consolidated.csv'
    
    print("Loading CSV file...")
    
    rows = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Remove description and detailedDescription, keep only one description
        new_fieldnames = []
        for field in fieldnames:
            if field not in ['description', 'detailedDescription']:
                new_fieldnames.append(field)
            elif field == 'description':
                # Keep description but we'll replace it
                if 'description' not in new_fieldnames:
                    new_fieldnames.append('description')
        
        print(f"Processing {len(list(reader))} rows...")
        f.seek(0)
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader):
            if i % 50 == 0:
                print(f"  Processing row {i+1}...")
            
            # Consolidate descriptions
            consolidated_desc = consolidate_description(row)
            
            # Replace description with consolidated version
            row['description'] = consolidated_desc
            # Remove detailedDescription from the row
            if 'detailedDescription' in row:
                del row['detailedDescription']
            
            rows.append(row)
    
    # Write output
    print(f"\nWriting consolidated CSV to {output_file}...")
    
    # Get fieldnames without detailedDescription
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        output_fieldnames = [f for f in reader.fieldnames if f != 'detailedDescription']
    
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=output_fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✓ Successfully wrote {len(rows)} rows to {output_file}")
    print(f"✓ Consolidated descriptions from description + detailedDescription + accordion content")

if __name__ == '__main__':
    main()

