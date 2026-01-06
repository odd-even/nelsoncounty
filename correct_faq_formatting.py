#!/usr/bin/env python3
"""
Correctly format FAQ accordions by properly identifying questions vs answers
"""

import csv
import re

def format_faq_content(content: str) -> str:
    """Format FAQ - identify questions (even without ?) and format properly"""
    if not content:
        return ""
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    formatted_parts = []
    i = 0
    
    while i < len(sentences):
        sentence = sentences[i].strip()
        if not sentence:
            i += 1
            continue
        
        # Question indicators - must start with question word AND be short/clear question
        question_patterns = [
            r'^Is\s+[^.]+\?',  # "Is...?"
            r'^Is\s+[^.]{1,80}\.',  # "Is..." (short, ends with period - likely question)
            r'^Are\s+[^.]+\?',
            r'^Are\s+[^.]{1,80}\.',
            r'^What\s+[^.]+\?',
            r'^Where\s+[^.]+\?',
            r'^When\s+[^.]+\?',
            r'^How\s+[^.]+\?',
            r'^Can\s+[^.]+\?',
            r'^Do\s+[^.]+\?',
            r'^Does\s+[^.]+\?',
            r'^Will\s+[^.]+\?',
            r'^Should\s+[^.]+\?',
        ]
        
        is_question = False
        for pattern in question_patterns:
            if re.match(pattern, sentence, re.IGNORECASE):
                is_question = True
                break
        
        # Also check: ends with ? is definitely a question
        if sentence.endswith('?'):
            is_question = True
        
        if is_question:
            # Format question
            question = sentence.rstrip('.')
            if not question.endswith('?'):
                question += '?'
            formatted_parts.append(f"**{question}**")
            
            # Collect answer sentences (until next question or end)
            answer_parts = []
            i += 1
            while i < len(sentences):
                next_sent = sentences[i].strip()
                if not next_sent:
                    i += 1
                    continue
                
                # Check if next sentence is a question
                next_is_question = False
                if next_sent.endswith('?'):
                    next_is_question = True
                else:
                    for pattern in question_patterns:
                        if re.match(pattern, next_sent, re.IGNORECASE):
                            next_is_question = True
                            break
                
                if next_is_question:
                    break
                
                answer_parts.append(next_sent)
                i += 1
            
            # Add answer
            if answer_parts:
                formatted_parts.append(' '.join(answer_parts))
            
            # Blank line after Q&A
            formatted_parts.append('')
        else:
            # Not a question - might be intro text or continuation
            # If it's the first thing and short, might be intro
            if len(formatted_parts) == 0 and len(sentence) < 100:
                formatted_parts.append(sentence)
            else:
                # This shouldn't happen in FAQ - but keep it
                formatted_parts.append(sentence)
            i += 1
    
    result = '\n\n'.join(formatted_parts)
    
    # Clean up
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = result.strip()
    
    return result

def main():
    print("=" * 80)
    print("CORRECTLY FORMATTING FAQ ACCORDIONS")
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
                    changes.append(f"{name}: Formatted FAQ")
                    print(f"  ✓ {name}: Formatted FAQ")
    
    # Write updated CSV
    print(f"\nWriting updated CSV...")
    with open('CSV/A - to merge- listings-2026-01-02-rewritten.csv', 'w', encoding='utf-8', newline='') as f:
        if listings:
            writer = csv.DictWriter(f, fieldnames=listings[0].keys(), quoting=csv.QUOTE_ALL)
            writer.writeheader()
            writer.writerows(listings)
    
    print(f"\n✅ FORMATTING COMPLETE!")
    print(f"   Total FAQ accordions formatted: {len(changes)}")

if __name__ == '__main__':
    main()
