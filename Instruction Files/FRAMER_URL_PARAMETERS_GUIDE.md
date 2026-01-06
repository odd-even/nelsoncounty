# URL Parameters Guide for frontpage_framer.html

Your adventure directory supports multiple URL parameters for filtering and navigation. Here's a complete list:

---

## 🎯 Filter Parameters

### 1. **`category`** - Filter by Category
**Example:** `?category=community`

**Values:**
- `community` - Community listings
- `taste` - Food & drink listings
- `experience` - Experience listings
- `outdoor` - Outdoor activities
- `culture` - Cultural attractions
- `stay` - Lodging options

**Usage:**
```
/find-your-adventure?category=community
/find-your-adventure?category=taste
```

---

### 2. **`type`** - Filter by Specific Type
**Example:** `?type=Winery`

**Values:** Any type from your listings (e.g., "Winery", "Brewery", "Hiking", "Museum", etc.)

**Usage:**
```
/find-your-adventure?type=Winery
/find-your-adventure?type=Brewery
/find-your-adventure?type=Hiking
```

**Note:** This will also set the category filter automatically based on the type.

---

### 3. **`area`** - Filter by Area/Location
**Example:** `?area=Nellysford`

**Values:** Any area from your listings (e.g., "Nellysford", "Afton", "Wintergreen", "Lovingston", etc.)

**Usage:**
```
/find-your-adventure?area=Nellysford
/find-your-adventure?area=Afton
```

---

### 4. **`featured`** - Show Only Featured Listings
**Example:** `?featured=true`

**Values:**
- `true` - Show only featured listings
- `false` or omit - Show all listings

**Usage:**
```
/find-your-adventure?featured=true
```

---

### 5. **`amenity`** - Filter by Amenity
**Example:** `?amenity=Pet-Friendly`

**Values:** Any amenity from your listings (e.g., "Pet-Friendly", "Kid-Friendly", "Free", "Outdoor Seating", etc.)

**Usage:**
```
/find-your-adventure?amenity=Pet-Friendly
/find-your-adventure?amenity=Kid-Friendly
/find-your-adventure?amenity=Free
```

---

### 6. **`search`** - Search Query
**Example:** `?search=wine`

**Values:** Any search term (will search in listing names, descriptions, etc.)

**Usage:**
```
/find-your-adventure?search=wine
/find-your-adventure?search=hiking%20trail
```

**Note:** Use `%20` for spaces or `+` for spaces in URLs.

---

## 📍 Navigation Parameters

### 7. **`listing`** - Show Specific Listing
**Example:** `?listing=sweet-bliss-bakery`

**Values:** 
- Listing ID
- Listing slug
- Listing name (partial match works)

**Usage:**
```
/find-your-adventure?listing=sweet-bliss-bakery
/find-your-adventure?listing=1
/find-your-adventure?listing=Sweet%20Bliss%20Bakery
```

**Note:** This takes priority over other filters and will show only that listing.

---

### 8. **`legacy_url`** or **`wordpress_url`** or **`url`** - Legacy URL Matching
**Example:** `?legacy_url=https://old-site.com/breweries/devils-backbone`

**Values:** Any legacy WordPress or old website URL

**Usage:**
```
/find-your-adventure?legacy_url=https://old-site.com/breweries/devils-backbone
/find-your-adventure?wordpress_url=/breweries/devils-backbone
```

**Note:** This will find and display the matching listing if it exists.

---

## 🔗 Combining Parameters

You can combine multiple parameters:

### Examples:

**Category + Search:**
```
/find-your-adventure?category=taste&search=wine
```

**Type + Area:**
```
/find-your-adventure?type=Winery&area=Nellysford
```

**Category + Amenity:**
```
/find-your-adventure?category=taste&amenity=Pet-Friendly
```

**Featured + Category:**
```
/find-your-adventure?category=outdoor&featured=true
```

**Search + Area:**
```
/find-your-adventure?search=hiking&area=Afton
```

**Multiple Filters:**
```
/find-your-adventure?category=outdoor&area=Afton&amenity=Pet-Friendly&featured=true
```

---

## 📋 Complete Parameter Reference

| Parameter | Type | Example Values | Description |
|-----------|------|----------------|-------------|
| `category` | Filter | `community`, `taste`, `experience`, `outdoor`, `culture`, `stay` | Filter by category |
| `type` | Filter | `Winery`, `Brewery`, `Hiking`, `Museum`, etc. | Filter by specific type |
| `area` | Filter | `Nellysford`, `Afton`, `Wintergreen`, etc. | Filter by location/area |
| `amenity` | Filter | `Pet-Friendly`, `Kid-Friendly`, `Free`, etc. | Filter by amenity |
| `featured` | Filter | `true` | Show only featured listings |
| `search` | Filter | Any text | Search query |
| `listing` | Navigation | Listing ID, slug, or name | Show specific listing |
| `legacy_url` | Navigation | Old URL | Find listing by legacy URL |
| `wordpress_url` | Navigation | Old WordPress URL | Find listing by WordPress URL |
| `url` | Navigation | Old URL | Alias for legacy_url |

---

## 🎯 Common Use Cases

### Link to Community Category:
```
/find-your-adventure?category=community
```

### Link to Featured Wineries:
```
/find-your-adventure?type=Winery&featured=true
```

### Link to Outdoor Activities in Afton:
```
/find-your-adventure?category=outdoor&area=Afton
```

### Search for "hiking":
```
/find-your-adventure?search=hiking
```

### Show Specific Listing:
```
/find-your-adventure?listing=sweet-bliss-bakery
```

---

## 💡 Tips

1. **URL Encoding:** Use `%20` for spaces or `+` for spaces in search terms
2. **Case Sensitivity:** Category values are lowercase, type values match your data exactly
3. **Priority:** The `listing` parameter takes priority over all filters
4. **Multiple Filters:** Combine filters with `&` (e.g., `?category=taste&area=Nellysford`)

---

## 🔧 Using in Framer

### Method 1: Framer's "Link to Page"
1. Select your button/text
2. Use "Link to Page" feature
3. Link to "Find Your Adventure" page
4. Add URL parameters: `?category=community`

### Method 2: CategoryLink Component
Use the `CategoryLink` component with the `category` prop set.

### Method 3: Direct URL
Navigate directly to: `/find-your-adventure?category=community`

---

## 🐛 Troubleshooting

**Parameter not working:**
- Check spelling (category values are lowercase)
- Verify the value exists in your data
- Check browser console for errors

**Multiple parameters:**
- Use `&` to separate: `?category=taste&area=Nellysford`
- Don't use spaces in URLs (use `%20` or `+`)

**Listing not found:**
- Try using the slug instead of name
- Check the listing ID in your admin panel
- Verify the listing exists in your data

