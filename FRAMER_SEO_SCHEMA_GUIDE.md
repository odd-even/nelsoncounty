# Framer SEO Schema Component Guide

This guide explains how to set up robust SEO using Schema.org structured data in your Framer CMS pages.

## 📋 Overview

The SEO Schema Component automatically generates:
- **Schema.org JSON-LD** structured data for search engines
- **Open Graph** meta tags for social sharing
- **Twitter Card** meta tags
- **Breadcrumb** structured data
- **Canonical URLs** for duplicate content prevention

## 🚀 Quick Start

### Step 1: Add the Component to Your Framer Project

1. Open your Framer project
2. Go to the **Code** tab
3. Click **"+ New File"**
4. Name it `framer-seo-schema-component.tsx`
5. Copy the entire code from `Framer Code Snippets/framer-seo-schema-component.tsx`
6. Save the file

### Step 2: Add to Your CMS Page

1. Open your CMS page (listing, directory, or type page)
2. Add a **Code Component** to the page
3. Import and use the component:

```tsx
import SEOSchemaComponent from "./framer-seo-schema-component"

export default function MyListingPage(props) {
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
        featured={props.featured}
        canonicalUrl={props.wordpressUrl || `https://www.nelsoncounty-va.gov/explore/${props.slug}`}
        metaTitle={props.metaTitle || `${props.name} | Nelson County, Virginia`}
        metaDescription={props.metaDescription || props.description}
        breadcrumb={`Home > ${props.area} > ${props.name}`}
      />
      {/* Rest of your page content */}
    </>
  )
}
```

## 📊 Page Types

### 1. Individual Listing Pages

For pages showing a single business/attraction:

```tsx
<SEOSchemaComponent
  pageType="listing"
  name={props.name}
  type={props.type}
  area={props.area}
  description={props.description}
  image1={props.image1}
  image2={props.image2}
  website={props.website}
  phone={props.phone}
  address={props.address}
  amenities={props.amenities}
  featured={props.featured}
  canonicalUrl={props.wordpressUrl}
  metaTitle={`${props.name} | ${props.type} in ${props.area}, Virginia`}
  metaDescription={props.description}
  breadcrumb={`Home > ${props.area} > ${props.name}`}
/>
```

**Schema Types Generated:**
- `Winery` for vineyards/wineries
- `Brewery` for breweries/cideries
- `Distillery` for distilleries
- `Restaurant` for restaurants
- `CafeOrCoffeeShop` for coffee shops
- `Bakery` for bakeries
- `Hotel`, `BedAndBreakfast`, `LodgingBusiness` for accommodations
- `TouristAttraction` for hiking trails, attractions
- `Museum`, `ArtGallery` for cultural sites
- `LocalBusiness` as default

### 2. Directory Pages (by Area)

For pages showing all listings in an area (e.g., "Wintergreen", "Afton"):

```tsx
<SEOSchemaComponent
  pageType="directory"
  pageTitle={props.pageTitle}
  slug={props.slug}
  description={props.description}
  canonicalUrl={props.canonicalUrl}
  metaTitle={props.metaTitle}
  metaDescription={props.metaDescription}
  breadcrumb={props.breadcrumb}
  heroImageUrl={props.heroImageUrl}
  totalListings={props.totalListings}
  featuredCount={props.featuredCount}
/>
```

**Schema Type:** `TouristDestination`

### 3. Type Pages (by Category)

For pages showing all listings of a type (e.g., "Wineries", "Hiking Trails"):

```tsx
<SEOSchemaComponent
  pageType="type"
  pageTitle={props.pageTitle}
  slug={props.slug}
  description={props.description}
  canonicalUrl={props.canonicalUrl}
  metaTitle={props.metaTitle}
  metaDescription={props.metaDescription}
  breadcrumb={props.breadcrumb}
  heroImageUrl={props.heroImageUrl}
  totalListings={props.totalListings}
/>
```

**Schema Type:** `CollectionPage`

## 🔗 Connecting CMS Variables

### For Individual Listings

Connect these CMS fields to the component:

| CMS Field | Component Prop | Required |
|-----------|---------------|----------|
| `name` | `name` | ✅ Yes |
| `type` | `type` | ✅ Yes |
| `area` | `area` | ✅ Yes |
| `description` | `description` | ✅ Yes |
| `image1` | `image1` | ✅ Yes |
| `image2` | `image2` | ⚪ Optional |
| `website` | `website` | ⚪ Optional |
| `phone` | `phone` | ⚪ Optional |
| `address` | `address` | ⚪ Optional |
| `amenities` | `amenities` | ⚪ Optional |
| `featured` | `featured` | ⚪ Optional |
| `slug` | `slug` | ✅ Yes (for canonical) |
| `wordpressUrl` | `canonicalUrl` | ✅ Yes |

### For Directory/Type Pages

Connect these CMS fields:

| CMS Field | Component Prop | Required |
|-----------|---------------|----------|
| `Page Title` | `pageTitle` | ✅ Yes |
| `Slug` | `slug` | ✅ Yes |
| `Description` | `description` | ✅ Yes |
| `Meta Title` | `metaTitle` | ✅ Yes |
| `Meta Description` | `metaDescription` | ✅ Yes |
| `Canonical URL` | `canonicalUrl` | ✅ Yes |
| `Breadcrumb` | `breadcrumb` | ⚪ Optional |
| `Hero Image URL` | `heroImageUrl` | ⚪ Optional |
| `Total Listings` | `totalListings` | ⚪ Optional |

## 📝 Example: Complete Listing Page

```tsx
import { Page } from "framer"
import SEOSchemaComponent from "./framer-seo-schema-component"

export default function ListingPage(props) {
  // Build breadcrumb
  const breadcrumb = `Home > ${props.area || "Nelson County"} > ${props.name || "Listing"}`
  
  // Build canonical URL
  const canonicalUrl = props.wordpressUrl || 
    `https://www.nelsoncounty-va.gov/explore/${props.slug || "listing"}`
  
  // Build meta title
  const metaTitle = props.metaTitle || 
    `${props.name || "Listing"} | ${props.type || "Business"} in ${props.area || "Nelson County"}, Virginia`
  
  // Build meta description
  const metaDescription = props.metaDescription || 
    props.description || 
    `Visit ${props.name || "this listing"} in ${props.area || "Nelson County"}, Virginia. ${props.description || ""}`
  
  return (
    <Page>
      {/* SEO Component - should be near the top */}
      <SEOSchemaComponent
        pageType="listing"
        name={props.name}
        type={props.type}
        area={props.area}
        description={props.description}
        image1={props.image1}
        image2={props.image2}
        website={props.website}
        phone={props.phone}
        address={props.address}
        amenities={props.amenities}
        featured={props.featured === "TRUE" || props.featured === true}
        canonicalUrl={canonicalUrl}
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        breadcrumb={breadcrumb}
      />
      
      {/* Your page content */}
      <div>
        <h1>{props.name}</h1>
        <p>{props.description}</p>
        {/* ... rest of your content ... */}
      </div>
    </Page>
  )
}
```

## 🎯 Schema Types Supported

The component automatically maps business types to appropriate Schema.org types:

### Food & Beverage
- **Wineries** → `Winery`
- **Breweries/Cideries** → `Brewery`
- **Distilleries** → `Distillery`
- **Restaurants** → `Restaurant`
- **Coffee Shops** → `CafeOrCoffeeShop`
- **Bakeries** → `Bakery`
- **Markets/Delis** → `Store`

### Lodging
- **Hotels/Resorts** → `Hotel`
- **Bed & Breakfasts** → `BedAndBreakfast`
- **Cabins/Cottages/Rentals** → `LodgingBusiness`

### Activities & Attractions
- **Hiking Trails** → `TouristAttraction`
- **Museums** → `Museum`
- **Art Galleries** → `ArtGallery`
- **Farms/Orchards** → `TouristAttraction`
- **Tours/Activities** → `TouristAttraction`
- **Spas/Wellness** → `HealthAndBeautyBusiness`

### Default
- **Other businesses** → `LocalBusiness`

## ✅ What Gets Generated

### 1. Schema.org JSON-LD

For listings, the component generates structured data including:
- Business name, description, URL
- Address (parsed into street, city, state, ZIP)
- Phone number
- Images
- Business type (Winery, Restaurant, etc.)
- Amenities (as `additionalProperty`)
- Area served
- Aggregate rating (if featured)

### 2. Meta Tags

- `<meta name="description">` - Search engine description
- `<meta property="og:title">` - Open Graph title
- `<meta property="og:description">` - Open Graph description
- `<meta name="twitter:title">` - Twitter Card title
- `<meta name="twitter:description">` - Twitter Card description
- `<link rel="canonical">` - Canonical URL

### 3. Breadcrumb Schema

If breadcrumb is provided, generates `BreadcrumbList` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.nelsoncounty-va.gov/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Afton",
      "item": "https://www.nelsoncounty-va.gov/afton"
    }
  ]
}
```

## 🔍 Testing Your Schema

### Google Rich Results Test
1. Visit: https://search.google.com/test/rich-results
2. Enter your page URL
3. Check for any errors or warnings

### Schema.org Validator
1. Visit: https://validator.schema.org/
2. Enter your page URL
3. Verify all schema types are recognized

### Google Search Console
1. Submit your sitemap
2. Monitor "Enhancements" section
3. Check for structured data errors

## 🎨 Customization

### Adding Custom Schema Properties

Edit the `generateListingSchema` function in the component to add:
- Opening hours
- Price ranges
- Reviews/ratings
- Geo coordinates
- Additional business-specific properties

### Example: Adding Opening Hours

```tsx
// In generateListingSchema function
if (openingHours) {
  schema.openingHoursSpecification = parseOpeningHours(openingHours)
}
```

## 📱 Best Practices

1. **Always include canonical URLs** - Prevents duplicate content issues
2. **Use descriptive meta descriptions** - 150-160 characters, include location
3. **Include high-quality images** - At least 1200x630px for social sharing
4. **Keep breadcrumbs consistent** - Use the same format across all pages
5. **Test regularly** - Use Google's testing tools to verify schema

## 🐛 Troubleshooting

### Schema not appearing
- Check that the component is rendered (not hidden)
- Verify CMS variables are connected correctly
- Check browser console for JSON parsing errors

### Wrong schema type
- Verify the `type` field matches expected values
- Check the `getSchemaType` function mapping
- Add custom mappings if needed

### Missing data
- Ensure all required CMS fields are populated
- Check for empty strings vs. null values
- Verify image URLs are accessible

## 📚 Additional Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Structured Data Guide](https://developers.google.com/search/docs/appearance/structured-data)
- [Framer CMS Documentation](https://www.framer.com/developers/cms/)

## 💡 Tips

1. **Use consistent naming** - Keep CMS field names consistent across all pages
2. **Validate early** - Test schema on a few pages before rolling out
3. **Monitor performance** - Check Google Search Console for schema errors
4. **Keep it updated** - Update schema as your data structure evolves

