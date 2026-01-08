#!/usr/bin/env python3
"""
Fix duplication and redundancy in description fields
Uses ChatGPT API to rewrite bloated/redundant descriptions
"""

import csv
import json
import time
import os
import sys
import re
from pathlib import Path
from difflib import SequenceMatcher
from collections import Counter

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    print("⚠️  OpenAI library not installed. Install with: pip install openai")
    sys.exit(1)


def similarity_ratio(str1, str2):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()


def check_duplication_and_redundancy(text):
    """
    Check for duplication and redundancy in text
    Returns a list of issues found
    """
    if not text or len(text) < 50:
        return []
    
    issues = []
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) < 2:
        return []
    
    # Check for duplicate or very similar sentences
    for i, sent1 in enumerate(sentences):
        for j, sent2 in enumerate(sentences[i+1:], start=i+1):
            if len(sent1) > 20 and len(sent2) > 20:
                similarity = similarity_ratio(sent1, sent2)
                if similarity > 0.7:  # Very similar sentences
                    issues.append(f"Similar sentences ({similarity:.2f}): '{sent1[:50]}...' and '{sent2[:50]}...'")
    
    # Check for repeated phrases (3+ words) - more sensitive
    words = text.lower().split()
    phrases = []
    for i in range(len(words) - 2):
        phrase = ' '.join(words[i:i+3])
        phrases.append(phrase)
    
    phrase_counts = Counter(phrases)
    repeated_phrases = [(phrase, count) for phrase, count in phrase_counts.items() if count > 1]
    
    if repeated_phrases:
        top_repeats = sorted(repeated_phrases, key=lambda x: x[1], reverse=True)[:5]
        for phrase, count in top_repeats:
            if len(phrase) > 10:  # Only meaningful phrases
                issues.append(f"Repeated phrase ({count}x): '{phrase}'")
    
    # Check for key words/phrases that appear too frequently (indicating redundancy)
    # Look for important nouns/phrases that repeat
    important_words = []
    for word in words:
        if len(word) > 4:  # Substantial words
            important_words.append(word)
    
    word_counts = Counter(important_words)
    frequent_words = [(word, count) for word, count in word_counts.items() if count > 2]
    
    if frequent_words:
        top_frequent = sorted(frequent_words, key=lambda x: x[1], reverse=True)[:3]
        for word, count in top_frequent:
            if count > len(important_words) * 0.1:  # Appears in >10% of substantial words
                issues.append(f"Overused word ({count}x): '{word}'")
    
    # Check for overlapping content between sentences (same concepts in different words)
    # Extract key nouns/phrases from each sentence
    for i, sent1 in enumerate(sentences):
        for j, sent2 in enumerate(sentences[i+1:], start=i+1):
            if len(sent1) > 30 and len(sent2) > 30:
                # Extract key words (nouns, important terms)
                words1 = set([w for w in sent1.lower().split() if len(w) > 4])
                words2 = set([w for w in sent2.lower().split() if len(w) > 4])
                
                # Check overlap
                if len(words1) > 0 and len(words2) > 0:
                    overlap = len(words1 & words2)
                    overlap_ratio = overlap / min(len(words1), len(words2))
                    
                    # If >40% of key words overlap, likely redundant
                    if overlap_ratio > 0.4 and overlap >= 3:
                        issues.append(f"Overlapping content between sentences: {overlap} shared key words ({overlap_ratio:.1%} overlap)")
    
    return issues


def is_problematic_description(description):
    """Check if description has duplication or redundancy issues"""
    if not description or len(description.strip()) < 50:
        return False
    
    issues = check_duplication_and_redundancy(description)
    
    # Also check for obvious redundancy patterns
    # Multiple sentences that likely say the same thing
    sentences = re.split(r'[.!?]+', description)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) >= 2:
        # Check if sentences have high word overlap (redundancy)
        for i, sent1 in enumerate(sentences):
            for j, sent2 in enumerate(sentences[i+1:], start=i+1):
                if len(sent1) > 30 and len(sent2) > 30:
                    words1 = set([w.lower() for w in sent1.split() if len(w) > 4])
                    words2 = set([w.lower() for w in sent2.split() if len(w) > 4])
                    
                    if len(words1) > 0 and len(words2) > 0:
                        overlap = len(words1 & words2)
                        overlap_ratio = overlap / min(len(words1), len(words2))
                        
                        # High overlap suggests redundancy
                        if overlap_ratio > 0.4 and overlap >= 3:
                            return True
    
    return len(issues) > 0


def rewrite_description_with_chatgpt(description, listing_name, api_key):
    """
    Use ChatGPT to rewrite a description, removing duplication and redundancy
    """
    client = openai.OpenAI(api_key=api_key)
    
    prompt = f"""Rewrite the following description for "{listing_name}" to eliminate all duplication, redundancy, and bloated phrasing. 

Requirements:
- Remove any repeated information, phrases, or concepts
- Eliminate redundant sentences that say the same thing
- Keep the description concise and clear
- Maintain all important factual information
- Write in natural, flowing prose
- Do NOT repeat the same information in different words

Original description:
{description}

Rewritten description (concise, no duplication):"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional copywriter who specializes in creating concise, clear descriptions without any redundancy or duplication."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        rewritten = response.choices[0].message.content.strip()
        return rewritten
    except Exception as e:
        print(f"   ❌ Error calling ChatGPT: {e}")
        return description


def main():
    csv_path = 'CSV/listings-2026-01-07-2-final_clean.csv'
    
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        sys.exit(1)
    
    # Get API key from environment or user
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  OPENAI_API_KEY not found in environment.")
        api_key = input("Enter your ChatGPT API key: ").strip()
        if not api_key:
            print("❌ API key required")
            sys.exit(1)
    
    print(f"📖 Loading CSV: {csv_path}")
    
    # Load CSV
    listings = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    
    # Identify problematic descriptions
    print("\n🔍 Analyzing descriptions for duplication and redundancy...")
    problematic = []
    
    for listing in listings:
        description = listing.get('description', '').strip()
        if is_problematic_description(description):
            issues = check_duplication_and_redundancy(description)
            problematic.append({
                'listing': listing,
                'issues': issues
            })
    
    print(f"\n📊 Found {len(problematic)} listings with duplication/redundancy issues")
    
    if len(problematic) == 0:
        print("✅ No problematic descriptions found!")
        return
    
    # Show examples
    print("\n📋 Examples of issues found:")
    for i, item in enumerate(problematic[:3], 1):
        listing = item['listing']
        name = listing.get('name', 'Unknown')
        desc = listing.get('description', '')[:150]
        print(f"\n{i}. {name}")
        print(f"   Issues: {len(item['issues'])}")
        for issue in item['issues'][:2]:
            print(f"   - {issue}")
        print(f"   Description: {desc}...")
    
    # Auto-proceed (non-interactive mode)
    print(f"\n⚠️  Ready to rewrite {len(problematic)} descriptions using ChatGPT API")
    print("   This will use your API key and may incur costs.")
    print("   Proceeding automatically...")
    
    # Rewrite problematic descriptions
    print(f"\n🔄 Rewriting {len(problematic)} descriptions...")
    
    output_path = csv_path.replace('.csv', '-no-duplication.csv')
    
    rewritten_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for listing in listings:
                description = listing.get('description', '').strip()
                
                # Check if this listing needs rewriting
                needs_rewrite = any(
                    p['listing'].get('slug') == listing.get('slug') 
                    for p in problematic
                )
                
                if needs_rewrite and is_problematic_description(description):
                    name = listing.get('name', 'Unknown')
                    print(f"\n   🔄 Rewriting: {name}")
                    
                    # Show issues
                    issues = check_duplication_and_redundancy(description)
                    if issues:
                        print(f"      Issues found: {len(issues)}")
                        for issue in issues[:2]:
                            print(f"      - {issue[:80]}...")
                    
                    # Rewrite with ChatGPT
                    rewritten = rewrite_description_with_chatgpt(
                        description, 
                        name, 
                        api_key
                    )
                    
                    listing['description'] = rewritten
                    rewritten_count += 1
                    
                    print(f"      ✅ Rewritten ({len(description)} → {len(rewritten)} chars)")
                    
                    # Rate limiting
                    time.sleep(1)
                else:
                    # Keep original
                    pass
                
                writer.writerow(listing)
    
    print(f"\n✅ Complete!")
    print(f"   Rewritten: {rewritten_count} descriptions")
    print(f"   Output file: {output_path}")


if __name__ == '__main__':
    main()
