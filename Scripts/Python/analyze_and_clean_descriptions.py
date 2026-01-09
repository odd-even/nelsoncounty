#!/usr/bin/env python3
"""
Analyze description vs detailedDescription columns
Remove redundant detailedDescriptions that don't add value
Check accuracy and clean up duplicates intelligently
"""

import csv
import sys
import os
import re
import time
from openai import OpenAI

# Add user site-packages to path
user_site = os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages')
if os.path.exists(user_site) and user_site not in sys.path:
    sys.path.insert(0, user_site)


def get_api_key():
    """Get OpenAI API key from environment or prompt"""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        api_key = input("Enter your OpenAI API key: ").strip()
        if api_key:
            os.environ['OPENAI_API_KEY'] = api_key
    return api_key


def analyze_description_pair(description, detailed_description, listing_name, listing_type, api_key):
    """
    Use AI to analyze if detailedDescription adds value or is redundant
    Returns: (should_keep, reason, accuracy_notes, recommendations)
    """
    if not api_key:
        return None, "No API key", "", ""
    
    client = OpenAI(api_key=api_key)
    
    prompt = f"""You are analyzing two description fields for a listing called "{listing_name}" (Type: {listing_type}).

SHORT DESCRIPTION:
{description}

DETAILED DESCRIPTION:
{detailed_description}

Please analyze these descriptions and answer the following:

1. Does the detailedDescription provide SIGNIFICANTLY MORE information than the short description?
   - If they are essentially the same or the detailedDescription only adds minor details, it's redundant.
   - If the detailedDescription adds substantial context, examples, history, or important details, keep it.

2. Are there any inaccuracies or inconsistencies between the two descriptions?

3. Are there duplicate or redundant sentences/phrases within the detailedDescription itself?

4. Does the short description accurately summarize the key points from the detailedDescription?

Respond in this exact format:
KEEP: [yes/no]
REASON: [brief explanation]
ACCURACY: [any accuracy issues found]
DUPLICATES: [any duplicate content within detailedDescription]
RECOMMENDATION: [what should be done - keep detailedDescription, remove it, or edit it]
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a content quality analyst. Be thorough and precise."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        result = response.choices[0].message.content.strip()
        
        # Parse response
        keep = "yes" in result.lower() if "KEEP:" in result else None
        reason = ""
        accuracy = ""
        duplicates = ""
        recommendation = ""
        
        for line in result.split('\n'):
            if line.startswith('KEEP:'):
                keep = "yes" in line.lower()
            elif line.startswith('REASON:'):
                reason = line.replace('REASON:', '').strip()
            elif line.startswith('ACCURACY:'):
                accuracy = line.replace('ACCURACY:', '').strip()
            elif line.startswith('DUPLICATES:'):
                duplicates = line.replace('DUPLICATES:', '').strip()
            elif line.startswith('RECOMMENDATION:'):
                recommendation = line.replace('RECOMMENDATION:', '').strip()
        
        return keep, reason, accuracy, duplicates, recommendation, result
        
    except Exception as e:
        return None, f"Error: {str(e)}", "", "", "", ""


def load_donor_csv(donor_path):
    """Load donor CSV for accuracy checking"""
    donor_data = {}
    
    if not os.path.exists(donor_path):
        return donor_data
    
    with open(donor_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('Slug', '').strip().lower() or row.get('slug', '').strip().lower()
            
            if not slug:
                permalink = row.get('Permalink', '').strip()
                if permalink:
                    match = re.search(r'/explore/([^/]+)', permalink)
                    if match:
                        slug = match.group(1).lower()
            
            if slug:
                name = row.get('Title', '').strip() or row.get('name', '').strip()
                extra_content = row.get('_nectar_portfolio_extra_content', '').strip()
                preview_content = row.get('_nectar_portfolio_extra_content_preview', '').strip()
                combined = f"{preview_content} {extra_content}".strip()
                
                if combined:
                    donor_data[slug] = {
                        'name': name,
                        'content': combined
                    }
    
    return donor_data


def check_accuracy_against_donor(description, detailed_description, donor_content, listing_name, api_key):
    """
    Check if descriptions accurately reflect donor content
    """
    if not api_key or not donor_content:
        return "", ""
    
    client = OpenAI(api_key=api_key)
    
    prompt = f"""Compare these descriptions for "{listing_name}" against the original source content:

SHORT DESCRIPTION:
{description}

DETAILED DESCRIPTION:
{detailed_description}

ORIGINAL SOURCE CONTENT:
{donor_content[:2000]}

Are there any significant inaccuracies, missing important information, or misrepresentations?
Respond with:
ACCURACY_ISSUES: [any problems found, or "none" if accurate]
MISSING_INFO: [important information from source that's missing, or "none"]
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a fact-checker. Identify inaccuracies and missing information."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300
        )
        
        result = response.choices[0].message.content.strip()
        
        accuracy_issues = ""
        missing_info = ""
        
        for line in result.split('\n'):
            if line.startswith('ACCURACY_ISSUES:'):
                accuracy_issues = line.replace('ACCURACY_ISSUES:', '').strip()
            elif line.startswith('MISSING_INFO:'):
                missing_info = line.replace('MISSING_INFO:', '').strip()
        
        return accuracy_issues, missing_info
        
    except Exception as e:
        return f"Error: {str(e)}", ""


def main():
    current_file = 'CSV/listings-2026-01-07-2-final_clean-no-duplication-updated-from-donor-natural-openings-cleaned-FINAL-google-sheets-ready-no-quotes-full-nectar-content-reviewed-fixed-with-short-summaries-with-links.csv'
    donor_file = 'CSV/A - Donor - Portfolio-Export-2026-January-02-1652.csv'
    output_file = current_file.replace('.csv', '-cleaned-descriptions.csv')
    report_file = 'CSV/DESCRIPTION_CLEANUP_REPORT.txt'
    
    if not os.path.exists(current_file):
        print(f"❌ Current file not found: {current_file}")
        sys.exit(1)
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("❌ API key required")
        sys.exit(1)
    
    print(f"📖 Loading donor CSV: {donor_file}")
    donor_data = load_donor_csv(donor_file)
    print(f"✅ Loaded {len(donor_data)} listings from donor")
    print()
    
    print(f"📖 Loading current CSV: {current_file}")
    listings = []
    with open(current_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        for row in reader:
            listings.append(row)
    
    print(f"✅ Loaded {len(listings)} listings")
    print()
    
    # Filter to listings with both description and detailedDescription
    listings_to_check = []
    for listing in listings:
        desc = listing.get('description', '').strip()
        detailed = listing.get('detailedDescription', '').strip()
        
        if desc and detailed:
            # Only check if detailedDescription is not much longer (might be redundant)
            # Or if it's similar length (definitely check)
            desc_len = len(desc)
            detailed_len = len(detailed)
            
            # Check if detailed is less than 2x the length of desc (might be redundant)
            if detailed_len < desc_len * 2 or detailed_len < 200:
                listings_to_check.append(listing)
    
    print(f"🔍 Found {len(listings_to_check)} listings to analyze (with potentially redundant detailedDescription)")
    print()
    
    print(f"🤖 Analyzing with AI (this will take a while)...")
    print()
    
    changes_report = []
    removed_count = 0
    kept_count = 0
    accuracy_issues_found = []
    
    for i, listing in enumerate(listings_to_check, 1):
        name = listing.get('name', 'Unknown')
        slug = listing.get('slug', '')
        listing_type = listing.get('type', '')
        desc = listing.get('description', '').strip()
        detailed = listing.get('detailedDescription', '').strip()
        
        print(f"[{i}/{len(listings_to_check)}] Analyzing: {name}")
        
        # Analyze the pair
        keep, reason, accuracy, duplicates, recommendation, full_result = analyze_description_pair(
            desc, detailed, name, listing_type, api_key
        )
        
        # Check accuracy against donor if available
        donor_content = None
        accuracy_issues = ""
        missing_info = ""
        
        if slug and slug.lower() in donor_data:
            donor_content = donor_data[slug.lower()]['content']
            accuracy_issues, missing_info = check_accuracy_against_donor(
                desc, detailed, donor_content, name, api_key
            )
        
        # Make decision
        should_remove = False
        
        if keep is False:
            should_remove = True
            removed_count += 1
        elif keep is True:
            kept_count += 1
        else:
            # If unclear, check similarity manually
            if detailed_len < desc_len * 1.5:  # Very similar length
                should_remove = True
                removed_count += 1
            else:
                kept_count += 1
        
        # Record changes
        if should_remove:
            listing['detailedDescription'] = ''  # Clear it
        
        changes_report.append({
            'name': name,
            'slug': slug,
            'action': 'REMOVED' if should_remove else 'KEPT',
            'reason': reason,
            'accuracy': accuracy,
            'accuracy_issues': accuracy_issues,
            'missing_info': missing_info,
            'duplicates': duplicates,
            'recommendation': recommendation,
            'desc_len': len(desc),
            'detailed_len': len(detailed),
            'full_analysis': full_result
        })
        
        # Rate limiting
        time.sleep(1.5)
    
    print()
    print(f"✅ Analysis complete!")
    print(f"   Removed: {removed_count} redundant detailedDescriptions")
    print(f"   Kept: {kept_count} valuable detailedDescriptions")
    print()
    
    # Write output CSV
    print(f"💾 Writing cleaned CSV to: {output_file}")
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for listing in listings:
            writer.writerow(listing)
    
    print(f"✅ Output saved")
    print()
    
    # Write detailed report
    print(f"📝 Writing report to: {report_file}")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('=' * 80 + '\n')
        f.write('DESCRIPTION CLEANUP REPORT\n')
        f.write('=' * 80 + '\n\n')
        f.write(f'Total listings analyzed: {len(changes_report)}\n')
        f.write(f'Removed (redundant): {removed_count}\n')
        f.write(f'Kept (valuable): {kept_count}\n')
        f.write(f'Accuracy issues found: {sum(1 for r in changes_report if r.get("accuracy_issues") and "none" not in r.get("accuracy_issues", "").lower())}\n\n')
        f.write('=' * 80 + '\n\n')
        
        for i, report in enumerate(changes_report, 1):
            f.write(f'{i}. {report["name"]} ({report["slug"]})\n')
            f.write(f'   Action: {report["action"]}\n')
            f.write(f'   Description length: {report["desc_len"]} chars\n')
            f.write(f'   DetailedDescription length: {report["detailed_len"]} chars\n')
            f.write(f'   Reason: {report["reason"]}\n')
            
            if report.get('accuracy_issues') and 'none' not in report.get('accuracy_issues', '').lower():
                f.write(f'   ⚠️  Accuracy Issues: {report["accuracy_issues"]}\n')
            
            if report.get('missing_info') and 'none' not in report.get('missing_info', '').lower():
                f.write(f'   ⚠️  Missing Info: {report["missing_info"]}\n')
            
            if report.get('duplicates') and 'none' not in report.get('duplicates', '').lower():
                f.write(f'   ⚠️  Duplicates: {report["duplicates"]}\n')
            
            f.write(f'   Recommendation: {report["recommendation"]}\n')
            f.write(f'\n   Full AI Analysis:\n   {report["full_analysis"]}\n')
            f.write('\n' + '-' * 80 + '\n\n')
    
    print(f"✅ Report saved")
    print()
    print("=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"Listings analyzed: {len(changes_report)}")
    print(f"Removed redundant: {removed_count}")
    print(f"Kept valuable: {kept_count}")
    print()
    print("Check the report file for detailed analysis of each listing.")
    print()


if __name__ == '__main__':
    main()
