# Quick Start: ChatGPT API Rewrite

## 🚀 Ready to Go!

You have a ChatGPT API key. Here's how to use it:

### Step 1: Install OpenAI Library (if needed)
```bash
pip install openai
```

### Step 2: Run the Script
```bash
python3 ai_rewrite_accordions_one_by_one.py
```

### Step 3: Follow the Prompts

When the script runs:
1. **Choose API**: Type `openai` or `chatgpt`
2. **Enter API Key**: Paste your ChatGPT API key
3. **Choose Mode**:
   - `1` = Process all listings (automated)
   - `2` = Process specific range (e.g., test first 10)
   - `3` = Interactive (review each one - RECOMMENDED for first run)

### Recommended: Start with Interactive Mode

```
Choose option: 3
```

This lets you:
- Review each listing before processing
- See the rewritten content
- Skip any you don't want to process
- Quit anytime with 'q'

### Example Session

```
$ python3 ai_rewrite_accordions_one_by_one.py

Available API providers:
  1. Claude (Anthropic) - Best quality
  2. ChatGPT/OpenAI - Excellent quality
  3. Gemini (Google) - FREE, excellent quality

Choose API provider (claude/openai/gemini): openai

Enter your OPENAI API key: sk-...

📂 Loading CSV: CSV/A - to merge- listings-2026-01-02-rewritten.csv
✅ Loaded 388 listings

Processing options:
  1. Process all listings
  2. Process specific range (e.g., 1-10)
  3. Process one listing at a time (interactive)

Choose option: 3

================================================================================
Listing 1/388: Blue Ridge Tunnel
================================================================================
Process this listing? (y/n/skip to next/q to quit): y

📝 Processing: Blue Ridge Tunnel (Hikes & Trails)
   🔄 Rewriting: Trail Information
   ✅ Rewritten successfully
      Original length: 150 chars
      New length: 320 chars
   🔄 Rewriting: Trail Features & Amenities
   ✅ Rewritten successfully
   💾 Saved to CSV
```

## 💡 Tips

1. **Start Small**: Test with 5-10 listings first (option 2, range 0-5)
2. **Review Quality**: Check a few rewritten accordions before processing all
3. **Save Progress**: Script auto-saves, but you can stop anytime (Ctrl+C)
4. **Cost**: ~$0.01-0.02 per accordion = ~$6-13 for all 654 accordions

## 🔒 Security

Your API key is:
- Only used during script execution
- Not saved anywhere
- Can be set as environment variable: `export OPENAI_API_KEY="your-key"`

## ✅ Ready?

Just run:
```bash
python3 ai_rewrite_accordions_one_by_one.py
```

And follow the prompts!
