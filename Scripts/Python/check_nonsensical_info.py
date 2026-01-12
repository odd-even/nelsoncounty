#!/usr/bin/env python3
"""
Check newly added listings for nonsensical information
Compares with donor source and uses AI to validate content quality
"""

import csv
import re
import sys
import os
import json
from datetime import datetime

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    import openai
except ImportError:
    print("❌ openai package not found. Install with: pip install openai")
    sys.exit(1)


def get_api_key():
    """Get OpenAI API key from environment"""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  OPENAI_API_KEY not found in environment")
        print("   Please set it with: export OPENAI_API_KEY='your-key'")
        return None
    return api_key


def load_donor_csv(donor_path):
    """Load donor CSV and index by name/slug"""
    donor_listings = {}
    
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Try multiple name fields
            name = row.get('Title') or row.get('title') or row.get('Name') or row.get('name', '')
            slug = row.get('Slug') or row.get('slug', '')
            
            if name:
                donor_listings[name] = row
            if slug:
                donor_listings[slug] = row
    
    return donor_listings


def get_donor_content(donor_listings, listing_name, listing_slug):
    """Get original content from donor CSV for a listing"""
    # Try to find by name first
    donor = donor_listings.get(listing_name)
    if not donor:
        # Try by slug
        donor = donor_listings.get(listing_slug)
    
    if not donor:
        return None
    
    # Get nectar content fields
    nectar_content = donor.get('_nectar_portfolio_extra_content', '') or donor.get('_nectar_portfolio_extra_content_preview', '')
    description = donor.get('Description', '') or donor.get('description', '')
    title = donor.get('Title', '') or donor.get('title', '')
    
    return {
        'title': title,
        'description': description,
        'nectar_content': nectar_content,
        'full_row': donor
    }


def check_for_nonsensical_info(listing, donor_content, api_key):
    """Use AI to check if listing content is nonsensical"""
    if not api_key:
        return None
    
    client = openai.OpenAI(api_key=api_key)
    
    name = listing.get('name', 'Unknown')
    desc = listing.get('description', '')
    detailed = listing.get('detailedDescription', '')
    
    # Build context
    context = f"Listing Name: {name}\n"
    context += f"Type: {listing.get('type', '')}\n"
    context += f"Area: {listing.get('area', '')}\n"
    
    if donor_content:
        context += f"\nOriginal Donor Description: {donor_content.get('description', '')[:500]}\n"
        context += f"Original Donor Nectar Content: {donor_content.get('nectar_content', '')[:500]}\n"
    
    context += f"\nCurrent Description: {desc}\n"
    if detailed:
        context += f"Current Detailed Description: {detailed[:500]}\n"
    
    prompt = f"""You are reviewing a listing entry for a tourism website. Check the following listing for nonsensical, incomplete, or problematic information.

{context}

Please analyze this listing and identify:
1. Is the description complete and meaningful, or does it cut off mid-sentence?
2. Does the description make sense for the type of business/attraction listed?
3. Are there any obvious errors, typos, or formatting issues?
4. Does the detailed description add value, or is it redundant/empty?
5. Are there any references to other businesses or content that seem out of place?
6. Is the information consistent between description and detailedDescription?

Respond in JSON format:
{{
    "has_issues": true/false,
    "issues": ["issue1", "issue2"],
    "severity": "low/medium/high",
    "recommendations": ["recommendation1", "recommendation2"],
    "description_quality": "good/fair/poor",
    "detailed_description_quality": "good/fair/poor/empty"
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a content quality reviewer for a tourism website. Analyze listings for completeness, accuracy, and readability."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"   ⚠️  AI analysis error: {e}")
        return None


def main():
    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("⚠️  Continuing without AI validation (manual checks only)")
    
    # File paths
    cleaned_csv = 'CSV/jan12listings-2026-01-12-3-cleaned.csv'
    donor_csv = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    output_report = 'CSV/NONSENSICAL_INFO_REPORT.txt'
    
    if not os.path.exists(cleaned_csv):
        print(f"❌ Cleaned CSV not found: {cleaned_csv}")
        sys.exit(1)
    
    if not os.path.exists(donor_csv):
        print(f"❌ Donor CSV not found: {donor_csv}")
        sys.exit(1)
    
    # Newly added listings from report
    new_listings = [
        "Rapunzel's Coffee & Books", "Sweet Bliss Bakery", "Terrace Café",
        "Blue Mountain Brewery", "Big Tiny House", "Cottage at Pines End",
        "Retreat at Crabtree Falls", "Inn at Blue Mountain Brewery",
        "Carriage House at Stagebridge Farm", "Wine Cottage",
        "Blue Ridge Farm and Wedding Venue", "Castor Cabin",
        "Lewis Catherine House", "Mountain House INN",
        "Haven at Devils Backbone Camp", "Branch at Afton Mountain Retreat",
        "Bungalow at Afton Mountain Retreat", "HeartRock Retreat & Homestead",
        "Wooder House", "Ash House at Holland Hill", "Afton House",
        "LITTLE FARMHOUSE", "Fairway Chalet", "Cottage at River Circle Farm",
        "Retreat at Three Ridges", "Brown Bear Lodge", "Treetops Lodge",
        "Ski House", "View at Crawfords Edge", "Goldfinch",
        "Celadon Acres Farm", "A. Bryant Family Farm", "Heart of Nelson",
        "Afton Peak"
    ]
    
    print("📖 Loading CSVs...")
    
    # Load cleaned listings
    with open(cleaned_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        cleaned_listings = {row.get('name'): row for row in reader}
    
    # Load donor listings
    donor_listings = load_donor_csv(donor_csv)
    
    print(f"✅ Loaded {len(cleaned_listings)} cleaned listings")
    print(f"✅ Loaded {len(donor_listings)} donor listings")
    print()
    
    # Find newly added listings in cleaned CSV
    listings_to_check = []
    for name in new_listings:
        if name in cleaned_listings:
            listings_to_check.append(cleaned_listings[name])
        else:
            print(f"⚠️  {name} not found in cleaned CSV")
    
    print(f"🔍 Checking {len(listings_to_check)} newly added listings...")
    print()
    
    issues_found = []
    
    for i, listing in enumerate(listings_to_check, 1):
        name = listing.get('name', 'Unknown')
        slug = listing.get('slug', '')
        desc = listing.get('description', '')
        detailed = listing.get('detailedDescription', '')
        
        print(f"[{i}/{len(listings_to_check)}] Checking: {name}")
        
        # Get donor content
        donor_content = get_donor_content(donor_listings, name, slug)
        
        # Manual checks
        manual_issues = []
        
        # Check for incomplete descriptions (cut off mid-sentence)
        if desc and desc.strip() and not desc.rstrip().endswith(('.', '!', '?', '...')):
            # Check if it ends with common cutoff words
            cutoff_words = ['st', 'th', 'ing', 'ed', 'ly', 'and', 'or', 'the', 'a', 'an']
            last_words = desc.strip().split()[-3:]
            if any(word.lower() in cutoff_words for word in last_words):
                manual_issues.append('Description may be cut off mid-sentence')
        
        # Check for very short descriptions
        if desc and len(desc.strip()) < 50:
            manual_issues.append(f'Description is very short ({len(desc.strip())} chars)')
        
        # Check for empty detailedDescription when description is also short
        if not detailed and len(desc.strip()) < 100:
            manual_issues.append('No detailedDescription and description is short')
        
        # Check for placeholder text or artifacts
        placeholder_patterns = [
            r'lorem ipsum',
            r'placeholder',
            r'\[.*?\]',  # Remaining shortcodes
            r'&nbsp;',
            r'<!--.*?-->'
        ]
        for pattern in placeholder_patterns:
            if re.search(pattern, desc + (detailed or ''), re.IGNORECASE):
                manual_issues.append(f'Contains placeholder/artifact text: {pattern}')
        
        # AI check
        ai_analysis = None
        if api_key:
            print(f"   🤖 Running AI analysis...")
            ai_analysis = check_for_nonsensical_info(listing, donor_content, api_key)
            if ai_analysis and ai_analysis.get('has_issues'):
                print(f"   ⚠️  AI found issues: {ai_analysis.get('severity', 'unknown')} severity")
        
        if manual_issues or (ai_analysis and ai_analysis.get('has_issues')):
            issues_found.append({
                'name': name,
                'slug': slug,
                'manual_issues': manual_issues,
                'ai_analysis': ai_analysis,
                'description': desc,
                'detailedDescription': detailed,
                'donor_content': donor_content
            })
            print(f"   ⚠️  Issues found")
        else:
            print(f"   ✅ Looks good")
        
        print()
    
    # Write report
    print(f"📝 Writing report to: {output_report}")
    with open(output_report, 'w', encoding='utf-8') as report:
        report.write("=" * 70 + "\n")
        report.write("NONSENSICAL INFORMATION CHECK REPORT\n")
        report.write("=" * 70 + "\n\n")
        report.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report.write(f"Listings checked: {len(listings_to_check)}\n")
        report.write(f"Listings with issues: {len(issues_found)}\n\n")
        
        if issues_found:
            report.write("LISTINGS WITH ISSUES:\n")
            report.write("-" * 70 + "\n\n")
            
            for item in issues_found:
                report.write(f"{item['name']} ({item['slug']})\n")
                report.write("-" * 70 + "\n")
                
                if item['manual_issues']:
                    report.write("Manual Checks:\n")
                    for issue in item['manual_issues']:
                        report.write(f"  ⚠️  {issue}\n")
                    report.write("\n")
                
                if item['ai_analysis']:
                    report.write("AI Analysis:\n")
                    report.write(f"  Severity: {item['ai_analysis'].get('severity', 'unknown')}\n")
                    report.write(f"  Description Quality: {item['ai_analysis'].get('description_quality', 'unknown')}\n")
                    report.write(f"  Detailed Description Quality: {item['ai_analysis'].get('detailed_description_quality', 'unknown')}\n")
                    if item['ai_analysis'].get('issues'):
                        report.write("  Issues:\n")
                        for issue in item['ai_analysis']['issues']:
                            report.write(f"    - {issue}\n")
                    if item['ai_analysis'].get('recommendations'):
                        report.write("  Recommendations:\n")
                        for rec in item['ai_analysis']['recommendations']:
                            report.write(f"    - {rec}\n")
                    report.write("\n")
                
                report.write(f"Current Description ({len(item['description'])} chars):\n")
                report.write(f"  {item['description'][:300]}...\n\n")
                
                if item['detailedDescription']:
                    report.write(f"Current Detailed Description ({len(item['detailedDescription'])} chars):\n")
                    report.write(f"  {item['detailedDescription'][:300]}...\n\n")
                
                if item['donor_content']:
                    report.write("Donor Source Content:\n")
                    if item['donor_content'].get('description'):
                        report.write(f"  Description: {item['donor_content']['description'][:300]}...\n")
                    if item['donor_content'].get('nectar_content'):
                        report.write(f"  Nectar Content: {item['donor_content']['nectar_content'][:300]}...\n")
                
                report.write("\n" + "=" * 70 + "\n\n")
        else:
            report.write("✅ No issues found! All listings look good.\n")
    
    print("=" * 70)
    print("✅ CHECK COMPLETE!")
    print("=" * 70)
    print(f"   - Listings checked: {len(listings_to_check)}")
    print(f"   - Listings with issues: {len(issues_found)}")
    print(f"   - Report: {output_report}")


if __name__ == '__main__':
    main()
