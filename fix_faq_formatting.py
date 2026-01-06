#!/usr/bin/env python3
"""
Properly format FAQ accordions:
- Identify actual questions
- Bold questions only
- Add line breaks after questions
- Format answers properly
"""

import csv
import re

def format_faq_content(content: str) -> str:
    """Format FAQ content with bold questions and proper structure"""
    if not content:
        return ""
    
    # Split by sentences
    # Look for question marks or statements that are clearly questions
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    formatted_parts = []
    i = 0
    
    while i < len(sentences):
        sentence = sentences[i].strip()
        if not sentence:
            i += 1
            continue
        
        # Check if this is a question
        is_question = False
        
        # Ends with question mark
        if sentence.endswith('?'):
            is_question = True
        # Starts with question words and is a statement (no period at end of original)
        elif re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should|May|Must)', sentence, re.IGNORECASE):
            # Check if next sentence provides answer (doesn't start with question word)
            if i + 1 < len(sentences):
                next_sent = sentences[i + 1].strip()
                if not re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should|May|Must)', next_sent, re.IGNORECASE):
                    # This might be a question without ?
                    # But be careful - only if it's short and sounds like a question
                    if len(sentence) < 100 and not sentence.endswith('.'):
                        is_question = True
        
        if is_question:
            # Format question in bold
            question = sentence.rstrip('.')
            if not question.endswith('?'):
                question += '?'
            formatted_parts.append(f"**{question}**")
            
            # Collect answer (next sentences until next question or end)
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
                elif re.match(r'^(Is|Are|What|Where|When|How|Can|Do|Does|Will|Should)', next_sent, re.IGNORECASE):
                    # Might be a question
                    if len(next_sent) < 100:
                        next_is_question = True
                
                if next_is_question:
                    break
                
                answer_parts.append(next_sent)
                i += 1
            
            if answer_parts:
                formatted_parts.append(' '.join(answer_parts))
            formatted_parts.append('')  # Blank line after Q&A
        else:
            # Regular sentence - might be intro text
            formatted_parts.append(sentence)
            i += 1
    
    result = '\n\n'.join(formatted_parts)
    
    # Clean up
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = result.strip()
    
    return result

def main():
    print("=" * 80)
    print("FIXING FAQ FORMATTING")
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
                    changes.append(f"{name}: Fixed FAQ formatting")
                    print(f"  ✓ {name}: Reformatted FAQ")
    
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
