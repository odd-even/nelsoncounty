#!/usr/bin/env python3
"""
Properly format FAQ accordions from original content
"""

import csv
import re

def format_faq_from_original(content: str) -> str:
    """Format FAQ content properly - identify the actual question"""
    if not content:
        return ""
    
    # Remove existing bold formatting
    content = re.sub(r'\*\*', '', content)
    
    # The Blue Ridge Tunnel FAQ: "Is the trail suitable for wheelchairs. The trail is crushed gravel..."
    # Only "Is the trail suitable for wheelchairs" is the question
    # Everything else is the answer/info
    
    # Split by sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    formatted_parts = []
    
    # Find the question (starts with Is/Are/What/etc and is short)
    question_found = False
    
    for i, sentence in enumerate(sentences):
        sentence = sentence.strip()
        if not sentence:
            continue
        
        # Check if this is a question
        is_question = False
        if sentence.endswith('?'):
            is_question = True
        elif re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should)', sentence, re.IGNORECASE):
            # Short sentence starting with question word is likely a question
            if len(sentence) < 100 and not question_found:
                is_question = True
        
        if is_question and not question_found:
            # Format question
            question = sentence.rstrip('.')
            if not question.endswith('?'):
                question += '?'
            formatted_parts.append(f"**{question}**")
            question_found = True
            
            # Collect all following sentences as answer
            answer_parts = []
            for j in range(i + 1, len(sentences)):
                next_sent = sentences[j].strip()
                if next_sent:
                    answer_parts.append(next_sent)
            
            if answer_parts:
                formatted_parts.append(' '.join(answer_parts))
            break
        elif not question_found:
            # No question found yet, might be intro
            formatted_parts.append(sentence)
    
    # If no question found, return original with proper spacing
    if not question_found:
        return content
    
    result = '\n\n'.join(formatted_parts)
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()

def main():
    print("=" * 80)
    print("FIXING FAQ FORMATTING PROPERLY")
    print("=" * 80)
    
    # Load consolidated to get original content
    with open('CSV/A - to merge- listings-2026-01-02-consolidated.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        original_listings = list(reader)
    
    original_lookup = {}
    for listing in original_listings:
        name = listing.get('name', '').strip()
        if name:
            original_lookup[name] = listing
    
    # Load rewritten
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        listings = list(reader)
    
    changes = []
    
    for listing in listings:
        name = listing.get('name', '').strip()
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if content and ('faq' in title.lower() or 'frequently asked' in title.lower() or 'question' in title.lower()):
                # Get original content
                original = original_lookup.get(name)
                if original:
                    orig_content = original.get(f'accordionPanel{i}Content', '').strip()
                    if orig_content:
                        # Format from original
                        formatted = format_faq_from_original(orig_content)
                    else:
                        # Format from current
                        formatted = format_faq_from_original(content)
                else:
                    formatted = format_faq_from_original(content)
                
                if formatted != content:
                    listing[f'accordionPanel{i}Content'] = formatted
                    changes.append(f"{name}: Fixed FAQ formatting")
                    print(f"  ✓ {name}: Fixed FAQ")
    
    # Write updated CSV
    print(f"\nWriting updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ FORMATTING COMPLETE!")
    print(f"   Total FAQ accordions fixed: {len(changes)}")

if __name__ == '__main__':
    main()
