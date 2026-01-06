#!/usr/bin/env python3
"""
Improve sentence flow in all accordions - V2
- Rewrite choppy, list-like content into smooth, flowing sentences
"""

import csv
import re

def rewrite_for_smooth_flow(content: str, title: str) -> str:
    """Rewrite content into smooth, flowing sentences"""
    if not content or len(content) < 30:
        return content
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    
    # Filter out empty sentences
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    if not sentences:
        return content
    
    # For short, choppy sentences, combine them into flowing prose
    if len(sentences) <= 4 and all(len(s) < 100 for s in sentences):
        # Analyze sentence patterns
        combined_sentences = []
        i = 0
        
        while i < len(sentences):
            sent = sentences[i].strip()
            if not sent:
                i += 1
                continue
            
            sent_lower = sent.lower()
            
            # Pattern 1: "Convenience store and gas. Deli open for..."
            if i == 0 and ('convenience store' in sent_lower or 'store' in sent_lower) and 'gas' in sent_lower:
                if i + 1 < len(sentences):
                    next_sent = sentences[i + 1].lower()
                    if 'deli' in next_sent or 'open' in next_sent:
                        # Combine: "Convenience store and gas with a deli open for..."
                        next_sent_orig = sentences[i + 1]
                        if 'deli open' in next_sent:
                            combined_sentences.append(f"{sent} with a deli {next_sent_orig.split('deli', 1)[1].strip()}")
                        else:
                            combined_sentences.append(f"{sent}, {next_sent_orig.lower()}")
                        i += 2
                        continue
            
            # Pattern 2: "Deli open for breakfast and lunch. Specialties include..."
            if 'deli' in sent_lower and 'open' in sent_lower:
                if i + 1 < len(sentences):
                    next_sent = sentences[i + 1].lower()
                    if 'specialties' in next_sent or 'features' in next_sent or 'includes' in next_sent:
                        next_sent_orig = sentences[i + 1]
                        combined_sentences.append(f"{sent}. {next_sent_orig}")
                        i += 2
                        continue
            
            # Pattern 3: "Store description. Hours info."
            if i == 0 and len(sent) < 60:
                if i + 1 < len(sentences) and len(sentences[i + 1]) < 60:
                    next_sent = sentences[i + 1]
                    # Check if they can be combined
                    if not next_sent.lower().startswith(('specialties', 'features', 'includes', 'offers')):
                        combined_sentences.append(f"{sent}, {next_sent.lower()}")
                        i += 2
                        continue
            
            # Default: keep sentence as is
            combined_sentences.append(sent)
            i += 1
        
        # Now improve the combined sentences
        result = []
        for sent in combined_sentences:
            sent = sent.strip()
            if not sent:
                continue
            
            # Fix common issues
            # Remove duplicate "and" or "with"
            sent = re.sub(r'\s+and\s+and\s+', ' and ', sent, flags=re.IGNORECASE)
            sent = re.sub(r'\s+with\s+a\s+with\s+', ' with a ', sent, flags=re.IGNORECASE)
            
            # Fix missing periods
            if not sent.endswith(('.', '!', '?')):
                sent += '.'
            
            # Ensure proper capitalization
            if sent and sent[0].islower():
                sent = sent[0].upper() + sent[1:]
            
            result.append(sent)
        
        final = ' '.join(result)
        
        # Final cleanup
        final = re.sub(r'\s+', ' ', final)
        final = re.sub(r'\.\s*\.', '.', final)  # Remove double periods
        final = final.strip()
        
        return final
    
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
    print("IMPROVING SENTENCE FLOW IN ALL ACCORDIONS - V2")
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
                short_sentences = [s for s in sentences if len(s.strip()) < 80]
                
                # Rewrite for better flow
                new_content = rewrite_for_smooth_flow(content, title)
                if new_content != content:
                    listing[f'accordionPanel{i}Content'] = new_content
                    updated = True
        
        if updated:
            updated_count += 1
            if updated_count <= 20:  # Show first 20
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
