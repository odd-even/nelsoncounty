# Setup Guide: AI Accordion Rewrite

## 🚀 Quick Start

### Step 1: Install Required Libraries

**For Claude:**
```bash
pip install anthropic
```

**For ChatGPT/OpenAI:**
```bash
pip install openai
```

**For Gemini (FREE):**
```bash
pip install google-generativeai
```

### Step 2: Get API Keys

#### Option A: Claude (Anthropic)
1. Go to: https://console.anthropic.com/
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Copy the key

#### Option B: ChatGPT/OpenAI
1. Go to: https://platform.openai.com/
2. Sign up / Log in
3. Go to API Keys
4. Create new key
5. Copy the key

#### Option C: Gemini (FREE - Recommended)
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Create API key (FREE, no credit card needed)
4. Copy the key

### Step 3: Run the Script

```bash
python3 ai_rewrite_accordions_one_by_one.py
```

The script will:
1. Ask which API you want to use
2. Ask for your API key
3. Ask how you want to process (all, range, or one-by-one)
4. Process each listing
5. Save progress automatically

---

## 📋 Processing Modes

### Mode 1: Process All (Automated)
- Processes all 388 listings automatically
- Saves every 10 listings
- Best for: Full rewrite when you're confident

### Mode 2: Process Range
- Process specific listings (e.g., 1-10, 50-100)
- Good for: Testing or processing in chunks

### Mode 3: Interactive (One at a Time)
- Shows each listing
- You choose: Process (y), Skip (n), or Quit (q)
- Saves after each listing
- Best for: Quality control and review

---

## 💡 Usage Examples

### Example 1: Test with Gemini (Free)
```bash
# Install
pip install google-generativeai

# Run script
python3 ai_rewrite_accordions_one_by_one.py

# Choose: gemini
# Enter API key when prompted
# Choose: 2 (range)
# Enter: 0 to 5 (test first 5 listings)
```

### Example 2: Process All with Claude
```bash
# Install
pip install anthropic

# Set API key as environment variable (optional)
export ANTHROPIC_API_KEY="your-key-here"

# Run script
python3 ai_rewrite_accordions_one_by_one.py

# Choose: claude
# Choose: 1 (process all)
```

### Example 3: Interactive Review
```bash
python3 ai_rewrite_accordions_one_by_one.py

# Choose: gemini (or claude/openai)
# Choose: 3 (interactive)
# Review each listing before processing
```

---

## 🔒 Security: API Keys

### Option 1: Environment Variable (Recommended)
```bash
# Set before running
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# Script will automatically use it
```

### Option 2: Enter When Prompted
- Script will ask for key if not in environment
- Key is not saved anywhere

### Option 3: .env File (Advanced)
Create `.env` file:
```
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
```

Then use `python-dotenv` to load it.

---

## ⚙️ Configuration

### Rate Limiting
- **Gemini**: 15 requests/min (4 second delay)
- **Claude**: No strict limit (1 second delay)
- **OpenAI**: Rate limits vary (1 second delay)

### Model Selection
You can modify the script to use different models:
- Claude: `claude-3-5-sonnet-20241022` (best quality)
- OpenAI: `gpt-4-turbo-preview` or `gpt-4o`
- Gemini: `gemini-1.5-flash` (fast, free) or `gemini-1.5-pro` (better quality)

---

## 📊 Cost Estimates

### Gemini (FREE)
- **Cost**: $0
- **Rate**: 15 requests/min
- **Time**: ~45 minutes for all 654 accordions

### Claude
- **Cost**: ~$5-10 for all accordions
- **Rate**: Fast
- **Time**: ~30 minutes

### OpenAI
- **Cost**: ~$10-15 for all accordions
- **Rate**: Fast
- **Time**: ~30 minutes

---

## ✅ Quality Check

After processing, review a few samples:
1. Check for complete sentences
2. Verify measurements have units
3. Ensure flowing prose (not question-answer)
4. Confirm grammar and punctuation

---

## 🐛 Troubleshooting

### "Library not installed"
```bash
pip install anthropic openai google-generativeai
```

### "API key invalid"
- Check key is correct
- Verify key has proper permissions
- For Gemini: Make sure it's enabled in Google AI Studio

### "Rate limit exceeded"
- Wait a few minutes
- For Gemini: Use 4+ second delays
- Process in smaller batches

### "Connection error"
- Check internet connection
- Verify API service is up
- Try again after a moment

---

## 🎯 Recommended Workflow

1. **Start with Gemini (FREE)** - Test on 5-10 listings
2. **Review quality** - Check if output meets standards
3. **If good**: Process all with Gemini (FREE)
4. **If need better**: Switch to Claude (paid but excellent)

---

## 📝 Notes

- Script saves progress automatically
- Original content is preserved until rewritten
- You can stop and resume anytime
- Each accordion is rewritten individually for quality

---

**Ready to start?** Run the script and follow the prompts!
