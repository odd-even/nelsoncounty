# AI Accordion Content Rewrite Plan

## 📋 Executive Summary

**Problem**: Accordion content is poorly written with:
- Choppy, incomplete sentences
- Missing punctuation and proper grammar
- Incomplete information (e.g., "roughly 1" instead of "roughly 1 hour")
- Poor flow and readability
- Question-answer format that doesn't read naturally

**Solution**: Complete AI-powered rewrite of all accordion content using Claude/GPT-4 to produce human-quality, flowing prose.

---

## 🎯 Quality Standards

### Target Quality Metrics:
1. **Readability**: Natural, flowing sentences that read like human-written content
2. **Completeness**: All information properly conveyed (no "roughly 1" → "roughly 1 hour")
3. **Grammar**: Proper punctuation, capitalization, sentence structure
4. **Flow**: Smooth transitions between ideas, no choppy fragments
5. **Relevance**: Content specific to the listing, not generic area info
6. **Format**: Proper formatting for FAQs, lists, and structured content

### Example Transformation:

**Before:**
```
Is the trail suitable for wheelchairs. The trail is crushed gravel. The east trail has little change in elevation.
```

**After:**
```
The Blue Ridge Tunnel trail features a crushed gravel surface that provides good accessibility. The east trail section has minimal elevation change, making it more suitable for wheelchair users. However, the western section includes some steep inclines that may present challenges. Visitors with mobility concerns should contact the park for specific accessibility information.
```

---

## 🔍 Current State Analysis

### Content Issues Identified:

1. **Incomplete Sentences**
   - "Walking at a comfortable pace, the hike to the western portal and back will take roughly 1."
   - Missing units (hours, minutes, miles)

2. **Choppy Question-Answer Format**
   - "Is the trail suitable for wheelchairs. The trail is crushed gravel."
   - Should be rewritten as flowing prose

3. **Missing Context**
   - Fragments without proper introduction or context
   - Information presented without logical flow

4. **Poor Grammar**
   - Missing punctuation
   - Incorrect capitalization
   - Run-on sentences

5. **Generic Content**
   - Some accordions contain area information not specific to the listing

---

## 🏗️ Implementation Strategy

### Phase 1: Setup & Preparation

#### 1.1 API Configuration
- **Option A**: Use OpenAI API (GPT-4 or GPT-4 Turbo)
  - Cost: ~$0.01-0.03 per accordion
  - Quality: Excellent
  - Speed: Fast
  
- **Option B**: Use Anthropic Claude API
  - Cost: ~$0.015-0.04 per accordion
  - Quality: Excellent (better for longer content)
  - Speed: Fast

- **Option C**: Use local LLM (if available)
  - Cost: Free
  - Quality: Variable
  - Speed: Slower

**Recommendation**: Start with Claude API (Anthropic) for best quality-to-cost ratio.

#### 1.2 Data Preparation
- Load all listings from CSV
- Extract all accordion content
- Categorize by accordion type (Trail Information, Menu, History, etc.)
- Identify content that needs complete rewrite vs. minor fixes

#### 1.3 Prompt Engineering
Create specialized prompts for different accordion types:

**Trail Information Prompt:**
```
You are a professional travel writer. Rewrite the following trail information into clear, engaging, and informative prose. Ensure all measurements are complete (add units like "hours", "miles", etc.). Use proper grammar, punctuation, and sentence structure. Write in a natural, flowing style that reads like human-written content.

Original content:
{content}

Listing name: {name}
Listing type: {type}
Accordion title: {title}

Rewrite this content to be:
- Complete and informative
- Properly formatted with correct grammar
- Flowing and natural to read
- Specific to this listing
- Professional and engaging
```

**Menu/Offerings Prompt:**
```
You are a professional restaurant writer. Rewrite the following menu information into clear, appetizing prose. Ensure all information is complete and properly formatted.

Original content:
{content}

Listing name: {name}
Listing type: {type}

Rewrite this content to be:
- Complete sentences with proper grammar
- Appetizing and descriptive
- Well-organized and easy to read
- Specific to this restaurant
```

**History/Background Prompt:**
```
You are a professional historian and travel writer. Rewrite the following historical information into engaging, well-written prose.

Original content:
{content}

Listing name: {name}
Listing type: {type}

Rewrite this content to be:
- Complete and informative
- Engaging and well-written
- Properly formatted with correct grammar
- Flowing narrative style
```

### Phase 2: Batch Processing

#### 2.1 Processing Strategy
- **Batch Size**: Process 10-20 listings at a time
- **Rate Limiting**: Respect API rate limits
- **Error Handling**: Retry failed requests, log errors
- **Progress Tracking**: Save progress after each batch

#### 2.2 Quality Checks
After each batch:
1. Review sample outputs
2. Check for completeness
3. Verify grammar and flow
4. Ensure no information loss
5. Confirm relevance to listing

### Phase 3: Post-Processing

#### 3.1 Content Validation
- Check for missing information
- Verify measurements have units
- Ensure proper formatting
- Remove any generic/irrelevant content

#### 3.2 Formatting
- Format FAQs properly (bold questions, proper spacing)
- Format lists with proper bullets/numbers
- Ensure consistent style across all accordions

---

## 💻 Technical Implementation

### Script Structure:

```python
# ai_accordion_rewrite.py

1. Load CSV with all listings
2. For each listing:
   a. Extract accordion content
   b. Determine accordion type
   c. Select appropriate prompt template
   d. Call AI API with prompt
   e. Save rewritten content
   f. Log progress
3. Save updated CSV
4. Generate quality report
```

### Key Functions:

1. `analyze_accordion_type(title, content)` - Determine what type of content
2. `get_prompt_template(accordion_type)` - Get appropriate prompt
3. `call_ai_api(prompt, content, listing_info)` - Make API call
4. `validate_rewritten_content(original, rewritten)` - Quality checks
5. `format_content(content, accordion_type)` - Post-processing formatting

### API Integration:

**Claude API Example:**
```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2000,
    messages=[{
        "role": "user",
        "content": prompt
    }]
)

rewritten_content = response.content[0].text
```

**OpenAI API Example:**
```python
import openai

client = openai.OpenAI(api_key="your-api-key")

response = client.chat.completions.create(
    model="gpt-4-turbo-preview",
    messages=[{
        "role": "user",
        "content": prompt
    }],
    temperature=0.7,
    max_tokens=2000
)

rewritten_content = response.choices[0].message.content
```

---

## 📊 Cost Estimation

### Assumptions:
- 388 listings
- Average 2.5 accordions per listing = ~970 accordions
- Average 200 tokens per accordion rewrite
- Average 500 tokens per prompt

### Cost Breakdown:

**Claude 3.5 Sonnet:**
- Input: 970 × 500 tokens × $3/1M = $1.46
- Output: 970 × 200 tokens × $15/1M = $2.91
- **Total: ~$4.37**

**GPT-4 Turbo:**
- Input: 970 × 500 tokens × $10/1M = $4.85
- Output: 970 × 200 tokens × $30/1M = $5.82
- **Total: ~$10.67**

**Recommendation**: Use Claude 3.5 Sonnet for best quality-to-cost ratio.

---

## 🚀 Execution Plan

### Step 1: Create Rewrite Script (2-3 hours)
- Set up API integration
- Create prompt templates
- Implement batch processing
- Add error handling and logging

### Step 2: Test on Sample (1 hour)
- Process 10-20 listings
- Review quality
- Refine prompts if needed
- Adjust parameters

### Step 3: Full Processing (2-4 hours)
- Process all listings in batches
- Monitor progress
- Handle errors
- Save progress regularly

### Step 4: Quality Review (2-3 hours)
- Review sample outputs
- Check for issues
- Make manual corrections if needed
- Generate final report

### Step 5: Final Validation (1 hour)
- Spot check random samples
- Verify formatting
- Ensure completeness
- Final CSV export

**Total Estimated Time: 8-12 hours**
**Total Estimated Cost: $5-15**

---

## ✅ Success Criteria

1. **Quality**: All content reads naturally, like human-written prose
2. **Completeness**: No missing information or incomplete sentences
3. **Grammar**: Proper punctuation, capitalization, sentence structure
4. **Relevance**: Content specific to each listing
5. **Format**: Proper formatting for FAQs, lists, etc.
6. **Consistency**: Consistent style across all accordions

---

## 🔄 Rollback Plan

1. Keep original CSV as backup
2. Save progress after each batch
3. Maintain version control
4. Ability to revert to original if needed

---

## 📝 Next Steps

1. **Approve this plan**
2. **Set up API keys** (Claude or OpenAI)
3. **Create rewrite script** with prompt templates
4. **Test on 10-20 listings**
5. **Review and refine**
6. **Process all listings**
7. **Quality review and finalization**

---

## 🎯 Expected Outcome

After completion, all accordion content will be:
- ✅ Human-quality, flowing prose
- ✅ Complete and informative
- ✅ Properly formatted
- ✅ Grammar-perfect
- ✅ Engaging and professional
- ✅ Specific to each listing

**Ready to proceed?** Let me know which API you'd like to use, and I'll create the rewrite script!
