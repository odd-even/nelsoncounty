#!/usr/bin/env python3
"""
Properly format FAQ accordions by identifying questions and answers correctly
"""

import csv
import re

def format_faq_content(content: str) -> str:
    """Format FAQ content - identify questions and format with bold and line breaks"""
    if not content:
        return ""
    
    # The Blue Ridge Tunnel FAQ has: "Is the trail suitable for wheelchairs. The trail is crushed gravel..."
    # Need to identify questions (even without ?) and their answers
    
    # Split by sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    formatted_parts = []
    i = 0
    
    while i < len(sentences):
        sentence = sentences[i].strip()
        if not sentence:
            i += 1
            continue
        
        # Check if this sentence is a question
        # Questions typically start with: Is, Are, What, Where, When, How, Can, Do, Does, Will, Should
        question_starters = r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should|May|Must|Would|Could)'
        
        is_question = False
        if sentence.endswith('?'):
            is_question = True
        elif re.match(question_starters, sentence, re.IGNORECASE):
            # Check if it's a short statement that sounds like a question
            # And the next sentence provides an answer (doesn't start with question word)
            if len(sentence) < 80:  # Questions are usually shorter
                if i + 1 < len(sentences):
                    next_sent = sentences[i + 1].strip()
                    # If next sentence doesn't start with question word, this is likely a question
                    if not re.match(question_starters, next_sent, re.IGNORECASE):
                        is_question = True
        
        if is_question:
            # Format question
            question = sentence.rstrip('.')
            if not question.endswith('?'):
                question += '?'
            formatted_parts.append(f"**{question}**")
            
            # Collect answer sentences
            answer_parts = []
            i += 1
            while i < len(sentences):
                next_sent = sentences[i].strip()
                if not next_sent:
                    i += 1
                    continue
                
                # Stop if we hit another question
                if next_sent.endswith('?') or re.match(question_starters, next_sent, re.IGNORECASE):
                    break
                
                answer_parts.append(next_sent)
                i += 1
            
            # Add answer
            if answer_parts:
                formatted_parts.append(' '.join(answer_parts))
            
            # Blank line after Q&A
            formatted_parts.append('')
        else:
            # Regular content - might be intro
            formatted_parts.append(sentence)
            i += 1
    
    result = '\n\n'.join(formatted_parts)
    
    # Clean up extra blank lines
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = result.strip()
    
    return result

def main():
    print("=" * 80)
    print("PROPERLY FORMATTING FAQ ACCORDIONS")
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
                    print(f"  ✓ {name}: Formatted FAQ accordion")
    
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
