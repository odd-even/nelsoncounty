#!/usr/bin/env python3
"""
AI-powered rewrite of accordion content - V2
- Creates truly smooth, natural, human-quality sentences
- Rewrites choppy content into flowing prose
"""

import csv
import re

def create_smooth_sentence(parts: list, context: str = "") -> str:
    """Combine sentence parts into a smooth, natural sentence"""
    if not parts:
        return ""
    
    # Remove empty parts
    parts = [p.strip() for p in parts if p.strip()]
    
    if len(parts) == 1:
        return parts[0]
    
    # Pattern matching for common structures
    combined = parts[0]
    
    for i, part in enumerate(parts[1:], 1):
        part_lower = part.lower()
        
        # If part starts with a verb or action, connect with "and" or comma
        if part_lower.startswith(('open', 'serving', 'features', 'offers', 'includes', 'specialties')):
            if 'specialties' in part_lower or 'features' in part_lower:
                combined += f". {part.capitalize()}"
            elif 'open' in part_lower:
                # Extract the time info
                time_match = re.search(r'open\s+(.+?)(?:\.|$)', part, re.IGNORECASE)
                if time_match:
                    time_info = time_match.group(1).strip()
                    combined += f", with a deli open {time_info}."
                else:
                    combined += f". {part.capitalize()}"
            else:
                combined += f", {part.lower()}"
        else:
            combined += f". {part.capitalize()}"
    
    return combined

def ai_rewrite_content(content: str, title: str, listing_type: str, business_name: str) -> str:
    """
    AI-style rewrite of content into smooth, natural sentences
    """
    if not content or len(content) < 30:
        return content
    
    # Step 1: Fix any missing punctuation first
    sentence_starters = ['Specialties', 'Features', 'Includes', 'Offers', 'Hours', 'Open', 'Located', 'Find', 'Stop']
    for starter in sentence_starters:
        content = re.sub(rf'([a-z])\s+{starter}', rf'\1. {starter}', content, flags=re.IGNORECASE)
    
    # Step 2: Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
    
    if not sentences:
        return content
    
    # Step 3: Rewrite based on specific patterns
    rewritten_sentences = []
    
    i = 0
    while i < len(sentences):
        sent = sentences[i].strip()
        if not sent:
            i += 1
            continue
        
        sent_lower = sent.lower()
        
        # Pattern 1: "Convenience store and gas. Deli open for breakfast and lunch. Specialties include..."
        if i == 0 and ('convenience store' in sent_lower or ('store' in sent_lower and 'gas' in sent_lower)):
            parts_to_combine = [sent]
            
            # Look ahead for deli and specialties
            if i + 1 < len(sentences):
                next_sent = sentences[i + 1].lower()
                if 'deli' in next_sent and 'open' in next_sent:
                    parts_to_combine.append(sentences[i + 1])
                    
                    if i + 2 < len(sentences):
                        third_sent = sentences[i + 2].lower()
                        if 'specialties' in third_sent or 'features' in third_sent:
                            parts_to_combine.append(sentences[i + 2])
                            
                            # Create smooth combined sentence
                            if 'convenience store' in sent_lower:
                                # Extract time from deli sentence
                                deli_sent = sentences[i + 1]
                                time_match = re.search(r'open\s+(.+?)(?:\.|$)', deli_sent, re.IGNORECASE)
                                time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
                                
                                # Extract specialties
                                specialties_sent = sentences[i + 2]
                                specialties_match = re.search(r'(?:specialties|features)\s+include\s+(.+?)(?:\.|$)', specialties_sent, re.IGNORECASE)
                                specialties = specialties_match.group(1).strip() if specialties_match else ""
                                
                                rewritten = f"This convenience store and gas station features a deli open {time_info}. Specialties include {specialties}."
                                rewritten_sentences.append(rewritten)
                                i += 3
                                continue
                    
                    # Just deli, no specialties
                    if len(parts_to_combine) == 2:
                        deli_sent = sentences[i + 1]
                        time_match = re.search(r'open\s+(.+?)(?:\.|$)', deli_sent, re.IGNORECASE)
                        time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
                        
                        rewritten = f"This convenience store and gas station features a deli open {time_info}."
                        rewritten_sentences.append(rewritten)
                        i += 2
                        continue
        
        # Pattern 2: "Deli open for breakfast and lunch. Specialties include..."
        if 'deli' in sent_lower and 'open' in sent_lower:
            if i + 1 < len(sentences):
                next_sent = sentences[i + 1].lower()
                if 'specialties' in next_sent or 'features' in next_sent:
                    time_match = re.search(r'open\s+(.+?)(?:\.|$)', sent, re.IGNORECASE)
                    time_info = time_match.group(1).strip() if time_match else "for breakfast and lunch"
                    
                    specialties_sent = sentences[i + 1]
                    specialties_match = re.search(r'(?:specialties|features)\s+include\s+(.+?)(?:\.|$)', specialties_sent, re.IGNORECASE)
                    specialties = specialties_match.group(1).strip() if specialties_match else ""
                    
                    rewritten = f"The deli is open {time_info}, and specialties include {specialties}."
                    rewritten_sentences.append(rewritten)
                    i += 2
                    continue
        
        # Pattern 3: Short choppy sentences
        if len(sent) < 50 and i + 1 < len(sentences):
            next_sent = sentences[i + 1]
            if len(next_sent) < 50 and not next_sent.lower().startswith(('specialties', 'features', 'includes', 'offers')):
                # Try natural combination
                if sent.endswith(('.', '!', '?')):
                    rewritten_sentences.append(f"{sent} {next_sent.lower()}")
                else:
                    rewritten_sentences.append(f"{sent}, {next_sent.lower()}")
                i += 2
                continue
        
        # Default: keep sentence but ensure it's complete
        if not sent.endswith(('.', '!', '?')):
            sent += '.'
        
        rewritten_sentences.append(sent)
        i += 1
    
    # Step 4: Combine into final text
    result = ' '.join(rewritten_sentences)
    
    # Step 5: Final polish
    # Remove double periods
    result = re.sub(r'\.\s*\.', '.', result)
    # Fix spacing
    result = re.sub(r'\s+', ' ', result)
    # Ensure proper capitalization
    if result and result[0].islower():
        result = result[0].upper() + result[1:]
    # Ensure ending punctuation
    if result and not result.endswith(('.', '!', '?')):
        result += '.'
    
    return result.strip()

def process_all_accordions():
    """Process all accordions with AI-style rewriting"""
    print("=" * 80)
    print("AI-POWERED ACCORDION REWRITE - V2")
    print("Creating smooth, natural, human-quality sentences")
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
        listing_type = listing.get('type', '').strip()
        updated = False
        
        for i in range(1, 5):
            title = listing.get(f'accordionPanel{i}Title', '').strip()
            content = listing.get(f'accordionPanel{i}Content', '').strip()
            
            if title and content:
                # Check if content needs rewriting (choppy or short sentences)
                sentences = re.split(r'(?<=[.!?])\s+', content)
                short_sentences = [s for s in sentences if len(s.strip()) < 80]
                
                # Only rewrite if there are short, choppy sentences
                if len(short_sentences) >= 2:
                    # Rewrite with AI-style processing
                    new_content = ai_rewrite_content(content, title, listing_type, name)
                    
                    if new_content != content:
                        listing[f'accordionPanel{i}Content'] = new_content
                        updated = True
        
        if updated:
            updated_count += 1
            if updated_count <= 30:  # Show first 30
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
    print(f"   Updated {updated_count} listings with AI-powered rewriting")

if __name__ == '__main__':
    process_all_accordions()
