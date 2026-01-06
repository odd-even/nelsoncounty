#!/usr/bin/env python3
"""
Improve sentence flow in all accordions
- Rewrite choppy, list-like content into smooth, flowing sentences
"""

import csv
import re

def rewrite_for_smooth_flow(content: str, title: str) -> str:
    """Rewrite content into smooth, flowing sentences"""
    if not content or len(content) < 30:
        return content
    
    # First, fix missing periods before sentence starters
    sentence_starters = ['Specialties', 'Features', 'Includes', 'Offers', 'Hours', 'Open', 'Located', 'Find', 'Stop']
    for starter in sentence_starters:
        # Pattern: lowercase word followed by sentence starter (no period)
        content = re.sub(rf'([a-z])\s+{starter}', rf'\1. {starter}', content, flags=re.IGNORECASE)
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    # Filter out empty sentences
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    if not sentences:
        return content
    
    # For short, choppy sentences, combine them into flowing prose
    # Check if we have short sentences that need combining
    if len(sentences) <= 4:
        rewritten = []
        i = 0
        
        while i < len(sentences):
            sent = sentences[i].strip()
            if not sent:
                i += 1
                continue
            
            sent_lower = sent.lower()
            
            # Pattern 1: "Convenience store and gas. Deli open for breakfast and lunch. Specialties include..."
            if i == 0 and ('convenience store' in sent_lower or 'store' in sent_lower) and 'gas' in sent_lower:
                if i + 1 < len(sentences):
                    next_sent = sentences[i + 1].lower()
                    if 'deli' in next_sent and 'open' in next_sent:
                        # Combine first two: "Convenience store and gas with a deli open for..."
                        next_sent_orig = sentences[i + 1]
                        # Extract the deli part
                        if 'deli open' in next_sent:
                            # Extract everything after "deli open"
                            match = re.search(r'deli\s+open\s+(.+)', next_sent_orig, re.IGNORECASE)
                            if match:
                                rest = match.group(1).strip()
                                combined = f"{sent} with a deli open {rest}"
                            else:
                                combined = f"{sent}, {next_sent_orig.lower()}"
                        else:
                            combined = f"{sent}, {next_sent_orig.lower()}"
                        
                        # Check for third sentence about specialties
                        if i + 2 < len(sentences):
                            third_sent = sentences[i + 2].lower()
                            if 'specialties' in third_sent or 'features' in third_sent:
                                third_orig = sentences[i + 2]
                                # Ensure period after combined sentence
                                if not combined.endswith('.'):
                                    combined += '.'
                                rewritten.append(f"{combined} {third_orig}")
                                i += 3
                                continue
                        
                        # Ensure period after combined sentence
                        if not combined.endswith('.'):
                            combined += '.'
                        
                        rewritten.append(combined)
                        i += 2
                        continue
            
            # Pattern 2: "Deli open for breakfast and lunch. Specialties include..."
            if 'deli' in sent_lower and 'open' in sent_lower:
                if i + 1 < len(sentences):
                    next_sent = sentences[i + 1].lower()
                    if 'specialties' in next_sent or 'features' in next_sent:
                        next_sent_orig = sentences[i + 1]
                        rewritten.append(f"{sent}. {next_sent_orig}")
                        i += 2
                        continue
            
            # Pattern 3: Short sentences that can be combined
            if len(sent) < 60 and i + 1 < len(sentences):
                next_sent = sentences[i + 1]
                if len(next_sent) < 60 and not next_sent.lower().startswith(('specialties', 'features', 'includes', 'offers', 'hours')):
                    # Combine with comma
                    rewritten.append(f"{sent}, {next_sent.lower()}")
                    i += 2
                    continue
            
            # Default: keep sentence as is
            rewritten.append(sent)
            i += 1
        
        result = ' '.join(rewritten)
        
        # Clean up
        result = re.sub(r'\s+', ' ', result)
        result = re.sub(r'\.\s*\.', '.', result)  # Remove double periods
        
        # Fix missing periods before capitalized words that start sentences
        # Only fix if the capitalized word is likely a sentence starter
        sentence_starters = ['Specialties', 'Features', 'Includes', 'Offers', 'Hours', 'Open', 'Located', 'Find', 'Stop']
        for starter in sentence_starters:
            # Pattern: lowercase word followed by sentence starter (no period)
            result = re.sub(rf'([a-z])\s+{starter}', rf'\1. {starter}', result, flags=re.IGNORECASE)
        
        # Ensure ending punctuation
        if result and not result.endswith(('.', '!', '?')):
            result += '.'
        
        # Ensure proper capitalization
        if result and result[0].islower():
            result = result[0].upper() + result[1:]
        
        return result.strip()
    
    # For longer content, just ensure proper flow
    result = ' '.join(sentences)
    result = re.sub(r'\s+', ' ', result)
    result = result.strip()
    
    # Ensure ending punctuation
    if result and not result.endswith(('.', '!', '?')):
        result += '.'
    
    return result

def process_all_accordions():
    """Process all accordions to improve sentence flow"""
    print("=" * 80)
    print("IMPROVING SENTENCE FLOW IN ALL ACCORDIONS")
    print("=" * 80)
    
    # Load rewritten CSV
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    print(f"\nProcessing {len(listings)} listings...")
    print("=" * 80)
    
    updated_count = 0
    
    for listing in listings:
        name = listing.get('name', '').strip()
        updated = False
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if title and content:
                # Check if content needs improvement (choppy, short sentences)
                sentences = re.split(r'(?<=[.!?])\s+', content)
                short_sentences = [s for s in sentences if len(s.strip()) < 60]
                
                # Always rewrite for better flow if there are short sentences
                if len(short_sentences) >= 2:
                    # Rewrite for better flow
                    new_content = rewrite_for_smooth_flow(content, title)
                    if new_content != content:
                        listing[f'accordionPanel{i}Content'] = new_content
                        updated = True
        
        if updated:
            updated_count += 1
            print(f"  ✓ {name}")
    
    # Write updated CSV
    print(f"\n{'=' * 80}")
    print("Writing updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ COMPLETE!")
    print(f"   Updated {updated_count} listings with improved sentence flow")

if __name__ == '__main__':
    process_all_accordions()
