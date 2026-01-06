# Linking to Category-Filtered Views in Framer

Your `frontpage_framer.html` supports category filtering via URL parameters. Here are **3 ways** to link to these categories from within Framer:

## 🎯 Option 1: Update Your Existing Component (Recommended)

**Best for:** Making your existing AdventureDirectory component support categories

1. **Replace** your current `framer_code_component.tsx` with `framer-update-iframe-component.tsx`
2. This adds a `category` prop that you can set in Framer
3. Use Framer's **"Link to Page"** feature to link buttons/text to the same page with different category values

**How to use:**
- Add the component to your "Find Your Adventure" page
- Create buttons/links for each category
- Use Framer's "Link to Page" → Select your page → Add `?category=community` etc.

## 🔗 Option 2: Category Link Component

**Best for:** Adding category filter buttons on your page

1. Add `framer-category-links.tsx` to your Framer project
2. Create multiple instances of `CategoryLink` component
3. Set each one to a different category (community, taste, experience, etc.)
4. They'll automatically update the iframe when clicked

**Setup:**
```
CategoryLink (category: "community", label: "Community")
CategoryLink (category: "taste", label: "Taste")
CategoryLink (category: "experience", label: "Experience")
... etc
```

## 📝 Option 3: Simple Text Links (No Component Needed)

**Best for:** Quick setup with existing text/buttons

1. Select your text/button in Framer
2. Use Framer's **"Link to Page"** feature
3. Link to your "Find Your Adventure" page
4. Add URL parameters:
   - `?category=community`
   - `?category=taste`
   - `?category=experience`
   - etc.

**Note:** This works if your Framer page URL updates when you navigate. The iframe will read the URL parameter automatically.

## 🔧 How It Works

Your `frontpage_framer.html` already supports:
- ✅ URL parameters: `?category=community`
- ✅ PostMessage communication (for cross-origin iframes)
- ✅ Reading from parent window URL

The iframe will automatically detect and apply the category filter when:
1. The iframe URL has `?category=xxx`
2. The parent page URL has `?category=xxx` (via postMessage)
3. A postMessage is sent with `{ type: 'setCategory', category: 'xxx' }`

## 📋 Quick Setup Checklist

- [ ] Choose one of the 3 options above
- [ ] Add the component(s) to your Framer project
- [ ] Test clicking a category link
- [ ] Verify the iframe filters correctly

## 🎨 Styling Tips

- Use Framer's built-in button/text components
- Style them to match your site theme (#2d6a4f green)
- Group category links together (e.g., in a horizontal row)

## 💡 Pro Tips

1. **Multiple Pages Approach:** Create separate Framer pages for each category, each with the AdventureDirectory component set to that category
2. **Navigation Menu:** Add category links to your main navigation
3. **Breadcrumbs:** Show current category filter in breadcrumbs
4. **URL Sharing:** Users can share filtered URLs directly

## 🐛 Troubleshooting

**If category filter doesn't work:**
- Check browser console for errors
- Verify iframe src URL includes the category parameter
- Make sure postMessage is being sent (check Network tab)
- Test the direct URL: `frontpage_framer.html?category=community`

**If iframe doesn't update:**
- The iframe might be cached - try hard refresh (Cmd+Shift+R)
- Check that the iframe ID matches in your link component
- Verify cross-origin permissions allow postMessage

