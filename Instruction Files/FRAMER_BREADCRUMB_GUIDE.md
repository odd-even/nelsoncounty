# Breadcrumb Component Guide

## 📋 Overview

The `Breadcrumb.tsx` component creates navigation breadcrumbs that link back to filtered views of your adventure directory.

**Example Output:**
```
Home > Outdoor > Biking
Home > Taste > Winery > Nellysford
```

---

## 🚀 Installation

1. **Create file in Framer:**
   - Code tab → New File → `Breadcrumb.tsx`
   - Copy code from `Breadcrumb.tsx`

2. **Add to listing pages:**
   - Add the `Breadcrumb` component to your listing pages
   - Connect to CMS fields (see below)

---

## 🔗 How It Works

The component:
1. Reads `category`, `type`, and `area` from your CMS data
2. Generates breadcrumb links automatically
3. Links to filtered views: `/find-your-adventure?category=outdoor&type=Biking`
4. Updates the iframe when clicked (if on same page)

---

## 📝 Usage

### Method 1: Connect to CMS Fields (Recommended)

1. **Add component to listing page**
2. **Connect properties:**
   - `category` → Connect to CMS field: `category`
   - `type` → Connect to CMS field: `type`
   - `area` → Connect to CMS field: `area` (optional)

3. **Done!** Breadcrumbs generate automatically

### Method 2: Manual Entry

1. **Add component to page**
2. **Set properties manually:**
   - Category: `outdoor`
   - Type: `Biking`
   - Area: `Nellysford` (optional)

---

## 🎨 Customization

### Properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `category` | String | `""` | Category (e.g., "outdoor", "taste") |
| `type` | String | `""` | Type (e.g., "Biking", "Winery") |
| `area` | String | `""` | Area (e.g., "Nellysford", "Afton") |
| `homeLabel` | String | `"Home"` | Label for home link |
| `homeUrl` | String | `"/"` | URL for home link |
| `showHome` | Boolean | `true` | Show/hide home link |
| `separator` | String | `"›"` | Separator character |

---

## 📍 Examples

### Example 1: Basic Breadcrumb
```
Category: outdoor
Type: Biking

Output: Home > Outdoor > Biking
```

### Example 2: With Area
```
Category: taste
Type: Winery
Area: Nellysford

Output: Home > Taste > Winery > Nellysford
```

### Example 3: Category Only
```
Category: community

Output: Home > Community
```

---

## 🔧 How Links Work

### Category Link:
- Links to: `/find-your-adventure?category=outdoor`
- Filters to all listings in that category

### Type Link:
- Links to: `/find-your-adventure?category=outdoor&type=Biking`
- Filters to that specific type within the category

### Area Link:
- Links to: `/find-your-adventure?category=outdoor&type=Biking&area=Nellysford`
- Filters to that area with all previous filters

---

## 💡 Best Practices

1. **Connect to CMS:** Use CMS field connections for automatic updates
2. **Consistent Placement:** Put breadcrumbs at the top of listing pages
3. **Home Link:** Keep home link to navigate back to main site
4. **Last Item:** The last breadcrumb is bold (current page)

---

## 🎯 Integration with Adventure Directory

The breadcrumb component works seamlessly with your `AdventureDirectory` component:

1. **Clicking a breadcrumb:**
   - Updates the page URL
   - Sends postMessage to iframe
   - Filters the adventure directory automatically

2. **If on "Find Your Adventure" page:**
   - Updates iframe filter immediately
   - No page reload needed

3. **If on separate listing page:**
   - Navigates to filtered view
   - Shows filtered results

---

## 🐛 Troubleshooting

**Breadcrumbs not showing:**
- Check that at least one field (category/type/area) has a value
- Verify component is added to page

**Links not working:**
- Check that "Find Your Adventure" page exists
- Verify URL format matches your site structure
- Check browser console for errors

**Wrong capitalization:**
- Category is auto-capitalized (outdoor → Outdoor)
- Type uses exact value from CMS
- Area uses exact value from CMS

---

## 📋 Quick Setup Checklist

- [ ] Created `Breadcrumb.tsx` file in Framer
- [ ] Added component to listing pages
- [ ] Connected to CMS fields (category, type, area)
- [ ] Tested breadcrumb links
- [ ] Verified filters work correctly

---

## 🎨 Styling

The component uses:
- **Home/Category/Type links:** Green (#2d6a4f) with hover effect
- **Last item:** Dark gray (#212529), bold
- **Separator:** Light gray (#9aa0a6)
- **Font size:** 14px

You can override styles using the `style` prop or modify the component code.

---

## ✅ That's It!

The breadcrumb component is ready to use. Just connect it to your CMS fields and it will automatically generate navigation breadcrumbs that link back to filtered views.

