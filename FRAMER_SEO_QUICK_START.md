# Framer SEO Schema - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Copy the Component

1. Open your Framer project
2. Go to **Code** tab → **"+ New File"**
3. Name it: `framer-seo-schema-component.tsx`
4. Copy the code from `Framer Code Snippets/framer-seo-schema-component.tsx`
5. Save

### Step 2: Add to Your CMS Page

In your CMS page component, import and use it:

```tsx
import SEOSchemaComponent from "./framer-seo-schema-component"

export default function MyPage(props) {
  return (
    <>
      <SEOSchemaComponent
        pageType="listing"
        name={props.name}
        type={props.type}
        area={props.area}
        description={props.description}
        image1={props.image1}
        website={props.website}
        phone={props.phone}
        address={props.address}
        amenities={props.amenities}
        canonicalUrl={props.wordpressUrl}
        metaTitle={`${props.name} | ${props.type} in ${props.area}, Virginia`}
        metaDescription={props.description}
      />
      {/* Your page content */}
    </>
  )
}
```

### Step 3: Connect CMS Variables

In Framer's CMS editor:
1. Select your page
2. Find the `SEOSchemaComponent` in the canvas
3. Connect each CMS field to the corresponding prop

**Required for Listings:**
- `name` → CMS field: `name`
- `type` → CMS field: `type`
- `area` → CMS field: `area`
- `description` → CMS field: `description`
- `image1` → CMS field: `image1`
- `canonicalUrl` → CMS field: `wordpressUrl` or build from `slug`

**Optional but Recommended:**
- `website` → CMS field: `website`
- `phone` → CMS field: `phone`
- `address` → CMS field: `address`
- `amenities` → CMS field: `amenities`
- `metaTitle` → CMS field: `metaTitle` or build dynamically
- `metaDescription` → CMS field: `metaDescription` or use `description`

## 📋 CMS Field Mapping Reference

### Individual Listing Pages

| Component Prop | CMS Field Name | Example Value |
|----------------|----------------|---------------|
| `pageType` | (set to "listing") | "listing" |
| `name` | `name` | "Afton Mountain Vineyards" |
| `type` | `type` | "Vineyards & Wineries" |
| `area` | `area` | "Afton" |
| `description` | `description` | "One of Virginia's pioneer..." |
| `image1` | `image1` | (image URL) |
| `website` | `website` | "https://www.aftonmountainvineyards.com" |
| `phone` | `phone` | "(540) 456-8667" |
| `address` | `address` | "234 Vineyard Lane, Afton, VA 22920" |
| `amenities` | `amenities` | "Outdoor Seating; Scenic Views; Wine" |
| `canonicalUrl` | `wordpressUrl` | "https://nelsoncounty.com/explore/..." |
| `metaTitle` | (build or use field) | "Afton Mountain Vineyards \| Winery in Afton, Virginia" |
| `metaDescription` | `description` or `metaDescription` | (description text) |

### Directory Pages (by Area)

| Component Prop | CMS Field Name | Example Value |
|----------------|----------------|---------------|
| `pageType` | (set to "directory") | "directory" |
| `pageTitle` | `Page Title` | "Wintergreen Resort" |
| `slug` | `Slug` | "wintergreen-resort" |
| `description` | `Description` | "Premier year-round mountain resort..." |
| `canonicalUrl` | `Canonical URL` | "https://www.nelsoncounty-va.gov/wintergreen-resort" |
| `metaTitle` | `Meta Title` | "Wintergreen Resort \| Nelson County, Virginia" |
| `metaDescription` | `Meta Description` | "Experience Wintergreen Resort..." |
| `breadcrumb` | `Breadcrumb` | "Home > Wintergreen Resort" |
| `totalListings` | `Total Listings` | 93 |

### Type Pages (by Category)

| Component Prop | CMS Field Name | Example Value |
|----------------|----------------|---------------|
| `pageType` | (set to "type") | "type" |
| `pageTitle` | `Page Title` | "Cabins & Cottages" |
| `slug` | `Slug` | "cabins-and-cottages" |
| `description` | `Description` | "Escape to rustic mountain cabins..." |
| `canonicalUrl` | `Canonical URL` | "https://www.nelsoncounty-va.gov/cabins-and-cottages" |
| `metaTitle` | `Meta Title` | "Cabins & Cottages \| Nelson County, Virginia" |
| `metaDescription` | `Meta Description` | "Discover cabins & cottages options..." |
| `breadcrumb` | `Breadcrumb` | "Home > Cabins & Cottages" |
| `totalListings` | `Total Listings` | 104 |

## ✅ What Gets Generated

### 1. Schema.org JSON-LD

The component automatically generates structured data like:

```json
{
  "@context": "https://schema.org",
  "@type": "Winery",
  "name": "Afton Mountain Vineyards",
  "description": "...",
  "url": "https://www.aftonmountainvineyards.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "234 Vineyard Lane",
    "addressLocality": "Afton",
    "addressRegion": "VA",
    "postalCode": "22920"
  },
  "telephone": "(540) 456-8667"
}
```

### 2. Meta Tags

- `<meta name="description">` - Search description
- `<meta property="og:title">` - Social sharing title
- `<meta property="og:description">` - Social sharing description
- `<link rel="canonical">` - Canonical URL

### 3. Breadcrumb Schema

If breadcrumb is provided, generates navigation breadcrumbs for search engines.

## 🧪 Testing

After setting up, test your schema:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Enter your page URL
   - Check for errors

2. **Schema.org Validator**: https://validator.schema.org/
   - Enter your page URL
   - Verify schema types

## 🎯 Common Patterns

### Pattern 1: Build Meta Title Dynamically

```tsx
const metaTitle = props.metaTitle || 
  `${props.name} | ${props.type} in ${props.area}, Virginia`
```

### Pattern 2: Build Canonical URL

```tsx
const canonicalUrl = props.wordpressUrl || 
  `https://www.nelsoncounty-va.gov/explore/${props.slug}`
```

### Pattern 3: Build Breadcrumb

```tsx
const breadcrumb = `Home > ${props.area} > ${props.name}`
```

## 🐛 Troubleshooting

**Schema not appearing?**
- Make sure component is rendered (not conditionally hidden)
- Check that CMS variables are connected
- Verify data is not empty

**Wrong schema type?**
- Check the `type` field value
- Review the `getSchemaType` function mapping
- Add custom mapping if needed

**Missing data?**
- Ensure CMS fields are populated
- Check for empty strings vs null
- Verify image URLs are accessible

## 📚 Next Steps

- Read the full guide: `FRAMER_SEO_SCHEMA_GUIDE.md`
- See examples: `framer-seo-schema-example-*.tsx`
- Customize schema types as needed

