# Testing What Search Engines See - SEO Schema Guide

## 🔍 Quick Testing Methods

### Method 1: View Page Source (Easiest)

1. **Publish your Framer page** (or use Preview mode)
2. **Open the page in a browser**
3. **Right-click → "View Page Source"** (or `Cmd+Option+U` on Mac, `Ctrl+U` on Windows)
4. **Search for:**
   - `"@context": "https://schema.org"` - Finds all Schema.org JSON-LD
   - `framer-seo-schema` - Finds the schema script tags
   - `meta name="description"` - Finds meta description
   - `og:title` - Finds Open Graph tags

### Method 2: Browser DevTools (Most Detailed)

1. **Open your page in Chrome/Firefox**
2. **Press F12** (or right-click → Inspect)
3. **Go to "Elements" tab**
4. **Expand `<head>` section**
5. **Look for:**
   - `<script type="application/ld+json">` tags
   - `<meta>` tags with your content
   - `<link rel="canonical">` tags

### Method 3: Google Rich Results Test (Recommended)

**This is what Google actually sees:**

1. **Visit:** https://search.google.com/test/rich-results
2. **Enter your published Framer page URL**
3. **Click "Test URL"**
4. **Review results:**
   - ✅ Green = Valid schema detected
   - ⚠️ Yellow = Warnings (usually okay)
   - ❌ Red = Errors (needs fixing)

**What to look for:**
- "LocalBusiness" or "Winery" or "Restaurant" detected
- Address, phone, website recognized
- Images detected
- No critical errors

### Method 4: Schema.org Validator

1. **Visit:** https://validator.schema.org/
2. **Enter your page URL**
3. **Click "Run Test"**
4. **Review the structured data:**
   - See all detected schema types
   - View the JSON structure
   - Check for validation errors

### Method 5: Facebook Sharing Debugger

**Tests Open Graph tags (social sharing):**

1. **Visit:** https://developers.facebook.com/tools/debug/
2. **Enter your page URL**
3. **Click "Debug"**
4. **See:**
   - Preview of how it looks when shared
   - All Open Graph tags detected
   - Image preview

### Method 6: Twitter Card Validator

**Tests Twitter Card tags:**

1. **Visit:** https://cards-dev.twitter.com/validator
2. **Enter your page URL**
3. **See preview of Twitter card**

## 🧪 Testing Checklist

### ✅ Schema.org JSON-LD
- [ ] Schema appears in page source
- [ ] `@context` is "https://schema.org"
- [ ] `@type` matches your business type (Winery, Restaurant, etc.)
- [ ] Name, description, address are present
- [ ] Phone and website URLs are correct
- [ ] Images are included

### ✅ Meta Tags
- [ ] `<meta name="description">` has your custom description
- [ ] `<meta property="og:title">` has your title
- [ ] `<meta property="og:description">` has your description
- [ ] `<meta property="og:image">` has an image (if provided)
- [ ] `<meta name="twitter:title">` is present
- [ ] `<meta name="twitter:description">` is present

### ✅ Canonical URL
- [ ] `<link rel="canonical">` is present
- [ ] URL is correct and absolute (not relative)

### ✅ Breadcrumb Schema (if using)
- [ ] BreadcrumbList schema appears
- [ ] All breadcrumb items have URLs
- [ ] Positions are sequential (1, 2, 3...)

## 🔧 Quick Test Script

Add this to your browser console (F12 → Console tab) to see what's detected:

```javascript
// Check for Schema.org JSON-LD
const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]')
console.log('📊 Schema Scripts Found:', schemaScripts.length)
schemaScripts.forEach((script, i) => {
  try {
    const data = JSON.parse(script.textContent)
    console.log(`Schema ${i + 1}:`, data['@type'], data.name || data['@type'])
  } catch (e) {
    console.error('Invalid JSON in schema script:', e)
  }
})

// Check meta tags
const metaTags = {
  description: document.querySelector('meta[name="description"]')?.content,
  ogTitle: document.querySelector('meta[property="og:title"]')?.content,
  ogDescription: document.querySelector('meta[property="og:description"]')?.content,
  canonical: document.querySelector('link[rel="canonical"]')?.href
}
console.log('📋 Meta Tags:', metaTags)

// Check document title
console.log('📄 Document Title:', document.title)
```

## 🐛 Common Issues & Fixes

### Issue: Schema not appearing
**Check:**
- Component is on the page
- Props are connected to CMS fields
- Page is published (not just preview)
- No JavaScript errors in console

### Issue: Meta tags showing Framer defaults
**Fix:**
- Component should override them automatically
- Check that `metaTitle` and `metaDescription` props have values
- Wait a few seconds - component updates at 100ms, 500ms, 1000ms, 2000ms

### Issue: Schema validation errors
**Check:**
- Required fields are present (name, address for LocalBusiness)
- URLs are absolute (start with http:// or https://)
- Images are accessible URLs
- Phone numbers are in correct format

## 📊 What Search Engines Actually See

Search engines see:
1. **HTML source** - The raw HTML with all tags
2. **Schema.org JSON-LD** - Structured data in `<script>` tags
3. **Meta tags** - Description, Open Graph, Twitter Cards
4. **Canonical URL** - Tells them the preferred version

They DON'T see:
- JavaScript-rendered content (unless pre-rendered)
- CSS styling
- Interactive elements

## 🎯 Best Practices for Testing

1. **Test on published pages** - Preview mode might not show everything
2. **Test multiple pages** - Different page types (listing, directory, type)
3. **Test after changes** - Clear cache and re-test
4. **Use multiple tools** - Google, Schema.org, Facebook, Twitter
5. **Check mobile** - Some tools have mobile previews

## 🔗 Useful Testing URLs

- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema.org Validator:** https://validator.schema.org/
- **Facebook Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
- **Google Search Console:** https://search.google.com/search-console (after setup)

## 📝 Testing Report Template

```
Page URL: _______________________
Page Type: [ ] Listing [ ] Directory [ ] Type

Schema Tests:
[ ] Schema appears in page source
[ ] Google Rich Results Test: PASS/FAIL
[ ] Schema.org Validator: PASS/FAIL
[ ] Schema type correct: ___________

Meta Tags:
[ ] Description present and correct
[ ] Open Graph tags present
[ ] Twitter tags present
[ ] Canonical URL correct

Social Sharing:
[ ] Facebook preview looks good
[ ] Twitter preview looks good
[ ] Image displays correctly

Issues Found:
_______________________
_______________________
```

## 🚀 Quick Start Testing

1. **Publish your Framer page**
2. **Copy the published URL**
3. **Paste into Google Rich Results Test**
4. **Review the results**
5. **Fix any errors shown**
6. **Re-test until all green ✅**

That's it! These tools show you exactly what search engines see.

