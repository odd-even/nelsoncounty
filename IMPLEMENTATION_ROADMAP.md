# AI Accordion Rewrite - Implementation Roadmap

## 🎯 Goal
Rewrite ALL 654 accordion panels with AI to produce human-quality, flowing prose that reads naturally and professionally.

---

## 📋 Current Problems (Examples)

### Example 1: Blue Ridge Tunnel
**Current (BAD):**
```
Is the trail suitable for wheelchairs. The trail is crushed gravel. The east trail has little change in elevation.
```

**Target (GOOD):**
```
The Blue Ridge Tunnel trail features a crushed gravel surface suitable for most wheelchairs and mobility devices. The east trail section offers minimal elevation change, making it particularly accessible. However, visitors should be aware that some sections include steep inclines that may present challenges. For specific accessibility needs, contact the park office.
```

### Example 2: Blue Ridge Tunnel - Trail Information
**Current (BAD):**
```
Walking at a comfortable pace, the hike to the western portal and back will take roughly 1. The trail is crushed gravel; there are some steep inclines. One way mileage is 2.
```

**Target (GOOD):**
```
Walking at a comfortable pace, the round-trip hike to the western portal and back takes approximately 1 hour. The trail features a crushed gravel surface with some steep inclines, particularly on the western section. The one-way distance is 2.25 miles, making the total round-trip distance 4.5 miles.
```

---

## 🚀 Implementation Options

### Option 1: Full AI Rewrite (RECOMMENDED)
**Approach**: Use Claude/GPT-4 to completely rewrite every accordion from scratch

**Pros:**
- Highest quality output
- Natural, flowing prose
- Handles all edge cases
- Consistent style

**Cons:**
- Requires API key and cost (~$5-15)
- Takes 2-4 hours to process all

**Cost**: ~$5-15 for all 654 accordions
**Time**: 2-4 hours processing + 2-3 hours review

### Option 2: Hybrid Approach
**Approach**: Use AI for problematic content, fix simple issues with scripts

**Pros:**
- Lower cost
- Faster for simple fixes

**Cons:**
- Inconsistent quality
- Still need AI for complex rewrites
- More complex logic

**Cost**: ~$2-5
**Time**: 3-5 hours

### Option 3: Manual Review + AI Batch
**Approach**: Identify worst content, batch process with AI

**Pros:**
- Focus on worst offenders
- Lower cost

**Cons:**
- May miss issues
- Inconsistent quality

**Cost**: ~$1-3
**Time**: 2-3 hours

---

## 💻 Technical Implementation

### Step 1: Choose API Provider

**Claude (Anthropic) - RECOMMENDED**
- Model: `claude-3-5-sonnet-20241022`
- Cost: ~$0.004 per accordion
- Quality: Excellent
- API: https://docs.anthropic.com/

**OpenAI**
- Model: `gpt-4-turbo-preview` or `gpt-4o`
- Cost: ~$0.01 per accordion
- Quality: Excellent
- API: https://platform.openai.com/

### Step 2: Create Rewrite Script

**Script Features:**
1. Load CSV with all listings
2. For each accordion:
   - Analyze content type
   - Select appropriate prompt
   - Call AI API
   - Validate output
   - Save to CSV
3. Progress tracking
4. Error handling & retries
5. Batch processing (10-20 at a time)

### Step 3: Prompt Templates

**Trail Information:**
```
You are a professional travel and outdoor recreation writer. Rewrite the following trail information into clear, engaging, and informative prose. 

CRITICAL REQUIREMENTS:
- Complete all incomplete sentences (e.g., "roughly 1" → "roughly 1 hour")
- Use proper grammar, punctuation, and sentence structure
- Write in flowing, natural prose (not question-answer format)
- Ensure all measurements include units
- Make it read like professional travel writing

Original content:
{content}

Listing: {name} ({type})
Accordion title: {title}

Rewrite this content to be professional, complete, and engaging.
```

**Menu/Offerings:**
```
You are a professional restaurant and food writer. Rewrite the following menu information into clear, appetizing prose.

CRITICAL REQUIREMENTS:
- Complete sentences with proper grammar
- Appetizing and descriptive language
- Well-organized and easy to read
- Specific to this restaurant/establishment

Original content:
{content}

Listing: {name} ({type})

Rewrite this content professionally.
```

**General Information:**
```
You are a professional travel and tourism writer. Rewrite the following information into clear, engaging prose.

CRITICAL REQUIREMENTS:
- Complete all sentences properly
- Use proper grammar and punctuation
- Write in flowing, natural style
- Ensure all information is complete

Original content:
{content}

Listing: {name} ({type})
Accordion title: {title}

Rewrite this content professionally.
```

---

## 📊 Processing Plan

### Phase 1: Setup (30 min)
1. Get API key (Claude or OpenAI)
2. Install required packages
3. Create rewrite script
4. Test on 5 listings

### Phase 2: Batch Processing (2-4 hours)
1. Process in batches of 20 listings
2. Save progress after each batch
3. Monitor for errors
4. Review sample outputs

### Phase 3: Quality Review (2-3 hours)
1. Review random samples
2. Check for completeness
3. Verify grammar and flow
4. Make manual corrections if needed

### Phase 4: Finalization (1 hour)
1. Final validation
2. Export updated CSV
3. Generate quality report

---

## ✅ Quality Checklist

After rewrite, each accordion should:
- [ ] Read naturally (not choppy)
- [ ] Have complete sentences
- [ ] Include all units (hours, miles, etc.)
- [ ] Use proper grammar and punctuation
- [ ] Flow smoothly between ideas
- [ ] Be specific to the listing
- [ ] Be engaging and professional

---

## 🎯 Success Metrics

**Before:**
- Choppy, incomplete sentences
- Missing information
- Poor grammar
- Question-answer format

**After:**
- Flowing, natural prose
- Complete information
- Perfect grammar
- Professional travel writing style

---

## 🚦 Ready to Start?

**Next Steps:**
1. **Choose API**: Claude (recommended) or OpenAI
2. **Get API Key**: Sign up at anthropic.com or openai.com
3. **I'll create the script** with all prompts and processing logic
4. **Test on 10 listings** first
5. **Process all 654 accordions**

**Estimated Total:**
- Cost: $5-15
- Time: 6-8 hours (mostly automated)
- Quality: Professional, human-written level

---

**Which API would you like to use?** I recommend Claude for best quality-to-cost ratio.
