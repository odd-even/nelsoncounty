#!/usr/bin/env python3
"""
Format FAQ accordions with proper structure:
- Questions in bold
- Line breaks after questions
- Proper formatting for readability
"""

import csv
import re

def format_faq_content(content: str) -> str:
    """Format FAQ content with bold questions and proper line breaks"""
    if not content:
        return ""
    
    # Common question patterns
    question_patterns = [
        r'^([A-Z][^?.!]*\?)',  # Question ending with ?
        r'^([A-Z][^?.!]*\.)',   # Statement that might be a question
        r'^Is\s+[^?.!]+\?',     # "Is..." questions
        r'^Are\s+[^?.!]+\?',    # "Are..." questions
        r'^What\s+[^?.!]+\?',   # "What..." questions
        r'^Where\s+[^?.!]+\?',  # "Where..." questions
        r'^When\s+[^?.!]+\?',   # "When..." questions
        r'^How\s+[^?.!]+\?',    # "How..." questions
        r'^Can\s+[^?.!]+\?',    # "Can..." questions
        r'^Do\s+[^?.!]+\?',     # "Do..." questions
        r'^Does\s+[^?.!]+\?',   # "Does..." questions
    ]
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    formatted_lines = []
    current_question = None
    current_answer = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        # Check if this looks like a question
        is_question = False
        for pattern in question_patterns:
            if re.match(pattern, sentence, re.IGNORECASE):
                is_question = True
                break
        
        # Also check if sentence ends with ? and starts with capital
        if sentence.endswith('?') and sentence[0].isupper():
            is_question = True
        
        if is_question:
            # Save previous Q&A if exists
            if current_question:
                formatted_lines.append(f"**{current_question}**")
                if current_answer:
                    formatted_lines.append(' '.join(current_answer))
                formatted_lines.append('')  # Blank line
            
            # Start new question
            current_question = sentence
            current_answer = []
        else:
            # This is part of the answer
            if current_question:
                current_answer.append(sentence)
            else:
                # No question yet, might be intro text
                if not formatted_lines:
                    formatted_lines.append(sentence)
                else:
                    current_answer.append(sentence)
    
    # Add final Q&A
    if current_question:
        formatted_lines.append(f"**{current_question}**")
        if current_answer:
            formatted_lines.append(' '.join(current_answer))
    
    # If no questions found, try to identify them differently
    if not any('**' in line for line in formatted_lines):
        # Try splitting by periods that might be questions
        # Look for patterns like "Is the trail suitable for wheelchairs."
        lines = content.split('.')
        formatted_lines = []
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check if this might be a question (even without ?)
            if re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should)', line, re.IGNORECASE):
                if i > 0:
                    formatted_lines.append('')  # Blank line before question
                formatted_lines.append(f"**{line}.**")
            else:
                formatted_lines.append(line + '.')
    
    result = '\n\n'.join(formatted_lines)
    
    # Clean up extra blank lines
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = result.strip()
    
    return result

def main():
    print("=" * 80)
    print("FORMATTING FAQ ACCORDIONS")
    print("=" * 80)
    
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
                original = content
                formatted = format_faq_content(content)
                
                if formatted != original:
                    listing[f'accordionPanel{i}Content'] = formatted
                    changes.append(f"{name}: Formatted FAQ accordion {i}")
    
    # Write updated CSV
    print(f"\nWriting updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ FORMATTING COMPLETE!")
    print(f"   Total FAQ accordions formatted: {len(changes)}")
    
    if changes:
        print(f"\n   Formatted accordions:")
        for change in changes:
            print(f"     - {change}")

if __name__ == '__main__':
    main()
