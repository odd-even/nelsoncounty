# Framer SEO Schema Setup - Complete Summary

## 📦 What's Been Created

You now have a complete SEO solution for your Framer CMS pages with Schema.org structured data. Here's what's included:

### Core Component
- **`framer-seo-schema-component.tsx`** - Main SEO component that generates schema markup and meta tags

### Example Components
- **`framer-seo-schema-example-listing.tsx`** - Complete example for individual listing pages
- **`framer-seo-schema-example-directory.tsx`** - Complete example for directory pages (by area)
- **`framer-seo-schema-example-type.tsx`** - Complete example for type pages (by category)

### Documentation
- **`FRAMER_SEO_SCHEMA_GUIDE.md`** - Comprehensive guide with all details
- **`FRAMER_SEO_QUICK_START.md`** - 5-minute quick start guide
- **`FRAMER_SEO_SETUP_SUMMARY.md`** - This file

## 🎯 What It Does

The SEO component automatically generates:

1. **Schema.org JSON-LD** structured data for:
   - Individual businesses (Winery, Restaurant, Brewery, etc.)
   - Directory pages (TouristDestination)
   - Type pages (CollectionPage)
   - Breadcrumb navigation

2. **Meta Tags** for:
   - Search engines (`<meta name="description">`)
   - Social sharing (Open Graph, Twitter Cards)
   - Canonical URLs

3. **Automatic Type Detection**:
   - Maps your business types to appropriate Schema.org types
   - Supports 20+ business categories
   - Extensible for custom types

## 🚀 Quick Start (3 Steps)

### 1. Copy Component to Framer
```
Framer Project → Code Tab → New File → framer-seo-schema-component.tsx
```

### 2. Add to Your CMS Page
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
        canonicalUrl={props.wordpressUrl}
        metaTitle={`${props.name} | ${props.type} in ${props.area}, Virginia`}
        metaDescription={props.description}
      />
      {/* Your page content */}
    </>
  )
}
```

### 3. Connect CMS Variables
In Framer's CMS editor, connect your CMS fields to the component props.

## 📊 Supported Schema Types

The component automatically detects and generates appropriate schema for:

### Food & Beverage
- ✅ Wineries → `Winery`
- ✅ Breweries/Cideries → `Brewery`
- ✅ Distilleries → `Distillery`
- ✅ Restaurants → `Restaurant`
- ✅ Coffee Shops → `CafeOrCoffeeShop`
- ✅ Bakeries → `Bakery`
- ✅ Markets/Delis → `Store`

### Lodging
- ✅ Hotels/Resorts → `Hotel`
- ✅ Bed & Breakfasts → `BedAndBreakfast`
- ✅ Cabins/Cottages/Rentals → `LodgingBusiness`

### Activities & Attractions
- ✅ Hiking Trails → `TouristAttraction`
- ✅ Museums → `Museum`
- ✅ Art Galleries → `ArtGallery`
- ✅ Farms/Orchards → `TouristAttraction`
- ✅ Tours/Activities → `TouristAttraction`
- ✅ Spas/Wellness → `HealthAndBeautyBusiness`

### Default
- ✅ Other businesses → `LocalBusiness`

## 📋 CMS Field Mapping

### For Individual Listings

| Your CMS Field | Component Prop | Required |
|----------------|---------------|----------|
| `name` | `name` | ✅ |
| `type` | `type` | ✅ |
| `area` | `area` | ✅ |
| `description` | `description` | ✅ |
| `image1` | `image1` | ✅ |
| `website` | `website` | ⚪ |
| `phone` | `phone` | ⚪ |
| `address` | `address` | ⚪ |
| `amenities` | `amenities` | ⚪ |
| `wordpressUrl` | `canonicalUrl` | ✅ |

### For Directory/Type Pages

| Your CMS Field | Component Prop | Required |
|----------------|---------------|----------|
| `Page Title` | `pageTitle` | ✅ |
| `Slug` | `slug` | ✅ |
| `Description` | `description` | ✅ |
| `Meta Title` | `metaTitle` | ✅ |
| `Meta Description` | `metaDescription` | ✅ |
| `Canonical URL` | `canonicalUrl` | ✅ |
| `Breadcrumb` | `breadcrumb` | ⚪ |

## ✅ Features

- ✅ **Automatic Schema Generation** - No manual JSON-LD coding needed
- ✅ **Type Detection** - Automatically maps business types to Schema.org types
- ✅ **Address Parsing** - Converts address strings to structured format
- ✅ **Amenity Support** - Converts amenity lists to structured data
- ✅ **Breadcrumb Schema** - Automatic breadcrumb navigation markup
- ✅ **Social Meta Tags** - Open Graph and Twitter Cards
- ✅ **Canonical URLs** - Prevents duplicate content issues
- ✅ **Framer CMS Integration** - Works seamlessly with Framer CMS variables
- ✅ **Zero Visual Impact** - Component doesn't render anything visible

## 🧪 Testing

After setup, test your schema:

1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Enter your page URL
   - Check for errors or warnings

2. **Schema.org Validator**
   - https://validator.schema.org/
   - Enter your page URL
   - Verify schema types are recognized

3. **Google Search Console**
   - Submit your sitemap
   - Monitor "Enhancements" section
   - Check for structured data errors

## 📚 Documentation Files

- **Quick Start**: `FRAMER_SEO_QUICK_START.md` - Get started in 5 minutes
- **Full Guide**: `FRAMER_SEO_SCHEMA_GUIDE.md` - Comprehensive documentation
- **Examples**: See `framer-seo-schema-example-*.tsx` files

## 🎨 Customization

### Adding Custom Schema Properties

Edit `generateListingSchema` function to add:
- Opening hours
- Price ranges
- Reviews/ratings
- Geo coordinates
- Custom business properties

### Adding New Schema Types

Edit `getSchemaType` function to add mappings:
```tsx
if (typeLower.includes("your-type")) return "YourSchemaType"
```

## 💡 Best Practices

1. **Always include canonical URLs** - Prevents duplicate content
2. **Use descriptive meta descriptions** - 150-160 characters, include location
3. **Include high-quality images** - At least 1200x630px for social sharing
4. **Keep breadcrumbs consistent** - Use same format across all pages
5. **Test regularly** - Use Google's testing tools to verify schema

## 🐛 Troubleshooting

### Schema not appearing?
- ✅ Check component is rendered (not conditionally hidden)
- ✅ Verify CMS variables are connected
- ✅ Check browser console for errors

### Wrong schema type?
- ✅ Verify `type` field matches expected values
- ✅ Check `getSchemaType` function mapping
- ✅ Add custom mapping if needed

### Missing data?
- ✅ Ensure all required CMS fields are populated
- ✅ Check for empty strings vs null values
- ✅ Verify image URLs are accessible

## 📞 Next Steps

1. **Copy the component** to your Framer project
2. **Add to one test page** to verify it works
3. **Connect CMS variables** for that page
4. **Test with Google's tools** to verify schema
5. **Roll out to all pages** once verified

## 🎉 You're All Set!

Your Framer CMS pages now have robust SEO with Schema.org structured data. The component will automatically generate appropriate schema markup based on your data, helping search engines understand and display your content better.

For detailed instructions, see:
- `FRAMER_SEO_QUICK_START.md` - Quick setup guide
- `FRAMER_SEO_SCHEMA_GUIDE.md` - Complete documentation

