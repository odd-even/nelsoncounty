# Debugging "No Rich Results Detected" Issue

## 🔍 Quick Diagnosis Steps

### Step 1: Check if Schema is in HTML Source

**This is the most important test!**

1. **Open your published Framer page**
2. **Right-click → "View Page Source"** (NOT "Inspect Element")
3. **Press Cmd+F (Mac) or Ctrl+F (Windows)**
4. **Search for:** `"@context": "https://schema.org"`
5. **Search for:** `framer-seo-schema`

**If you DON'T see the schema in the source:**
- The component isn't running
- Props aren't connected
- Component isn't on the page

**If you DO see the schema:**
- Schema is being injected correctly
- Issue might be with schema format or Google's crawler

### Step 2: Verify Component is on Page

1. **In Framer, check:**
   - Is `SEOSchemaComponent` actually on the page?
   - Are the props connected to CMS fields?
   - Do the props have values (not empty)?

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors
   - Look for the debug log: `✅ Injected schema`

### Step 3: Check Schema Format

View the schema in page source and verify:
- ✅ Has `"@context": "https://schema.org"`
- ✅ Has `"@type"` (like "Winery", "Restaurant", etc.)
- ✅ Has `"name"` field
- ✅ JSON is valid (no syntax errors)
- ✅ URLs are absolute (start with http:// or https://)

### Step 4: Test with Schema.org Validator

1. Go to: https://validator.schema.org/
2. Paste your URL
3. See if it detects the schema
4. Check for validation errors

## 🐛 Common Issues & Fixes

### Issue: Schema not in page source

**Causes:**
- Component not on page
- Props not connected
- Component returning null/error

**Fix:**
1. Verify component is on the page
2. Check all required props have values
3. Check browser console for errors
4. Make sure page is published (not just preview)

### Issue: Schema in source but Google doesn't detect it

**Causes:**
- Schema format is invalid
- Missing required fields
- URLs are relative instead of absolute
- Schema type doesn't match content

**Fix:**
1. Validate schema at https://validator.schema.org/
2. Check all required fields are present
3. Ensure URLs are absolute
4. Verify schema type matches your business type

### Issue: Component runs but schema disappears

**Causes:**
- Framer is removing/overwriting scripts
- Component cleanup is removing schema

**Fix:**
- The component now re-injects schema multiple times
- Check that schemas array has content

## 🔧 Debugging Checklist

- [ ] Component is on the page
- [ ] All props are connected to CMS fields
- [ ] Props have values (not empty)
- [ ] Schema appears in page source (View Source, not Inspect)
- [ ] Schema has valid JSON format
- [ ] Schema has `@context` and `@type`
- [ ] Schema has required fields (name, address for LocalBusiness)
- [ ] URLs are absolute (not relative)
- [ ] Page is published (not just preview)
- [ ] No JavaScript errors in console

## 🧪 Quick Test Script

Paste this in browser console (F12 → Console):

```javascript
// Check if schema exists
const schemas = document.querySelectorAll('script[type="application/ld+json"]')
console.log('Found', schemas.length, 'schema scripts')

schemas.forEach((script, i) => {
  try {
    const data = JSON.parse(script.textContent)
    console.log(`Schema ${i+1}:`, {
      type: data['@type'],
      name: data.name,
      hasAddress: !!data.address,
      hasPhone: !!data.telephone,
      hasUrl: !!data.url
    })
  } catch (e) {
    console.error('Invalid JSON in schema', i+1, e)
  }
})

// Check if component is running
const testDiv = document.querySelector('div[aria-hidden="true"][style*="display: none"]')
console.log('Component element found:', !!testDiv)
```

## 📋 What Google's Crawler Sees

Google's crawler sees:
- ✅ Initial HTML source (what's in "View Page Source")
- ✅ JavaScript-rendered content (after JS executes)
- ❌ Content that requires user interaction

**Important:** If schema is only injected via JavaScript and not in initial HTML, Google might not see it immediately. The component now injects it multiple times to ensure it's present.

## 🚀 Next Steps

1. **Check page source** - Most important step
2. **If schema is there:** Test with Schema.org validator
3. **If schema is NOT there:** Check component setup
4. **Verify props:** Make sure all required fields have values
5. **Re-test:** After fixes, wait a few minutes and test again

## 💡 Pro Tip

Google's Rich Results Test caches results. If you just made changes:
1. Click "Test Live URL" (not cached version)
2. Or wait a few minutes for cache to clear
3. Or use "Fetch as Google" in Search Console

