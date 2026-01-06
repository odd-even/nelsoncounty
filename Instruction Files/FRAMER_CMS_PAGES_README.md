# Generate Framer CMS Pages

This tool generates individual Framer CMS page components for each listing in your Google Sheets database.

## 📁 Files Created

- **`generate_framer_cms_pages.js`** - Node.js script (command-line version)
- **`generate_framer_cms_pages.html`** - Browser-based version (easier to use)
- **`framer-cms-pages/`** - Output directory (created automatically)

## 🚀 Quick Start

### Option 1: Browser Version (Recommended)

1. Open `generate_framer_cms_pages.html` in your web browser
2. Click the "Generate Pages" button
3. Wait for the pages to be generated
4. Download individual files or use the "Download All" button

### Option 2: Node.js Version

```bash
node generate_framer_cms_pages.js
```

This will:
- Fetch all listings from Google Sheets
- Generate individual `.tsx` files for each listing
- Save them to the `framer-cms-pages/` directory
- Create a backup of existing files if they exist
- Generate a `summary.json` file with metadata

## 📋 What Gets Generated

For each listing, the script creates a React/TypeScript component file (`[slug].tsx`) that includes:

- ✅ Hero image display
- ✅ Title and badges (type, area, featured)
- ✅ Description and detailed description
- ✅ Custom HTML content (if present)
- ✅ Image gallery (if multiple images)
- ✅ Amenities list with styled pills
- ✅ Contact information (address, phone, website)
- ✅ Directions button with Google Maps link
- ✅ Responsive styling
- ✅ Framer Page component wrapper

## 🎨 Styling

The generated pages use a clean, modern design with:
- Forest green theme (`#2d6a4f`) matching your site
- Responsive layout
- Styled amenity pills
- Featured badge styling
- Mobile-friendly design

## 📝 Using in Framer

1. **Copy the generated `.tsx` files** to your Framer project's code directory
2. **Import the components** in your Framer pages
3. **Add to CMS** - You can use these as templates for Framer CMS collections

### Example Usage in Framer:

```tsx
import { ListingPage } from "./framer-cms-pages/sweet-bliss-bakery"

export default function MyPage() {
    return <ListingPage />
}
```

## 🔧 Customization

You can modify the `generateListingPageCode()` function in either file to:
- Change styling
- Add/remove sections
- Modify layout
- Add custom components

## 📊 Output Files

- **Individual `.tsx` files** - One per listing (named by slug)
- **`summary.json`** - Metadata about all generated pages
- **Backup directory** - Previous versions are automatically backed up

## ⚠️ Notes

- The script fetches data from your Google Sheets via Apps Script
- Make sure your Google Apps Script URL is configured correctly
- Generated files are TypeScript/React compatible with Framer
- All text is sanitized for safe JSX rendering
- Images use the URLs from your Google Sheets data

## 🐛 Troubleshooting

**If pages don't generate:**
- Check that Google Apps Script URL is correct
- Verify your Google Sheets has the required columns
- Check browser console for errors (browser version)
- Check terminal output (Node.js version)

**If styling looks off:**
- Make sure Framer supports inline styles (it does)
- Check that all required Framer imports are available
- Verify image URLs are accessible

## 📞 Support

If you encounter issues:
1. Check the browser console or terminal output
2. Verify your Google Sheets data structure
3. Ensure all required fields are present in listings


