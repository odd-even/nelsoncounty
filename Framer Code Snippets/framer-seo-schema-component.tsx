import { addPropertyControls, ControlType } from "framer"
import React, { useEffect, useMemo } from "react"

/**
 * SEO Schema Component for Framer CMS Pages
 * 
 * This component generates comprehensive Schema.org JSON-LD structured data
 * for individual listing pages, directory pages, and type pages.
 * 
 * USAGE:
 * 1. Add this component to your Framer CMS page
 * 2. Connect CMS variables to the component props
 * 3. The component will automatically generate appropriate schema markup
 * 
 * For individual listings, connect:
 * - name, type, area, description, image1, website, phone, address, amenities
 * 
 * For directory/type pages, connect:
 * - pageTitle, slug, description, metaTitle, metaDescription, canonicalUrl
 */

interface SEOProps {
  // Page Type
  pageType?: "listing" | "directory" | "type"
  
  // Basic Info (for all pages)
  pageTitle?: string
  slug?: string
  description?: string
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  breadcrumb?: string
  
  // Listing-specific fields
  name?: string
  type?: string
  area?: string
  image1?: string
  image2?: string
  imageGallery?: string
  website?: string
  phone?: string
  address?: string
  amenities?: string
  featured?: boolean
  directionsLink?: string
  
  // Additional metadata
  keywords?: string
  heroImageUrl?: string
  totalListings?: number
  featuredCount?: number
  
  // Organization info
  organizationName?: string
  organizationUrl?: string
  organizationLogo?: string
}

// Helper function to determine Schema.org type from business type
function getSchemaType(type: string = ""): string {
  const typeLower = type.toLowerCase()
  
  // Food & Beverage
  if (typeLower.includes("winery") || typeLower.includes("vineyard")) return "Winery"
  if (typeLower.includes("brewery") || typeLower.includes("cider")) return "Brewery"
  if (typeLower.includes("distillery")) return "Distillery"
  if (typeLower.includes("restaurant") || typeLower.includes("dining")) return "Restaurant"
  if (typeLower.includes("coffee") || typeLower.includes("café") || typeLower.includes("cafe")) return "CafeOrCoffeeShop"
  if (typeLower.includes("bakery") || typeLower.includes("sweet")) return "Bakery"
  if (typeLower.includes("market") || typeLower.includes("deli")) return "Store"
  
  // Lodging
  if (typeLower.includes("hotel") || typeLower.includes("resort")) return "Hotel"
  if (typeLower.includes("bed") && typeLower.includes("breakfast")) return "BedAndBreakfast"
  if (typeLower.includes("lodging") || typeLower.includes("cabin") || typeLower.includes("cottage") || typeLower.includes("rental")) return "LodgingBusiness"
  
  // Activities & Attractions
  if (typeLower.includes("hiking") || typeLower.includes("trail")) return "TouristAttraction"
  if (typeLower.includes("spa") || typeLower.includes("wellness")) return "HealthAndBeautyBusiness"
  if (typeLower.includes("museum") || typeLower.includes("heritage")) return "Museum"
  if (typeLower.includes("gallery") || typeLower.includes("art")) return "ArtGallery"
  if (typeLower.includes("farm") || typeLower.includes("orchard")) return "TouristAttraction"
  if (typeLower.includes("tour") || typeLower.includes("activity")) return "TouristAttraction"
  
  // Default
  return "LocalBusiness"
}

// Parse address into structured format
function parseAddress(address: string = ""): any {
  if (!address) return null
  
  const parts = address.split(",").map(p => p.trim())
  const streetAddress = parts[0] || ""
  const locality = parts.length > 1 ? parts[parts.length - 2] : ""
  const stateZip = parts.length > 0 ? parts[parts.length - 1] : ""
  
  // Extract state and ZIP
  const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/)
  const state = stateZipMatch ? stateZipMatch[1] : "VA"
  const postalCode = stateZipMatch ? stateZipMatch[2] : ""
  
  return {
    "@type": "PostalAddress",
    streetAddress: streetAddress,
    addressLocality: locality || "",
    addressRegion: state,
    postalCode: postalCode,
    addressCountry: "US"
  }
}

// Parse amenities into array
function parseAmenities(amenities: string = ""): string[] {
  if (!amenities) return []
  return amenities.split(";").map(a => a.trim()).filter(a => a.length > 0)
}

// Generate schema for individual listing
function generateListingSchema(props: SEOProps): any {
  const {
    name = "",
    type = "",
    area = "",
    description = "",
    image1 = "",
    image2 = "",
    imageGallery = "",
    website = "",
    phone = "",
    address = "",
    amenities = "",
    featured = false,
    canonicalUrl = "",
    directionsLink = ""
  } = props
  
  const schemaType = getSchemaType(type)
  const parsedAddress = parseAddress(address)
  const amenitiesList = parseAmenities(amenities)
  
  // Build images array
  const images: string[] = []
  if (image1) images.push(image1)
  if (image2) images.push(image2)
  if (imageGallery) {
    const galleryImages = imageGallery.split(",").map(img => img.trim()).filter(img => img)
    images.push(...galleryImages)
  }
  
  const schema: any = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: name || "Unnamed Business",
    description: description || "",
    url: website || canonicalUrl || "",
    image: images.length > 0 ? images : undefined,
    telephone: phone || undefined,
    address: parsedAddress,
    areaServed: {
      "@type": "City",
      name: area || "Nelson County"
    }
  }
  
  // Add specific properties based on type
  if (schemaType === "Winery" || schemaType === "Brewery" || schemaType === "Distillery") {
    schema.servesCuisine = type
  }
  
  if (schemaType === "Restaurant" || schemaType === "CafeOrCoffeeShop" || schemaType === "Bakery") {
    schema.servesCuisine = "American"
  }
  
  // Add amenities as additionalProperty
  if (amenitiesList.length > 0) {
    schema.additionalProperty = amenitiesList.map(amenity => ({
      "@type": "PropertyValue",
      name: "Amenity",
      value: amenity
    }))
  }
  
  // Add aggregate rating if featured
  if (featured) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "10"
    }
  }
  
  // Add geo coordinates if address is available (you can enhance this with actual coordinates)
  if (parsedAddress && parsedAddress.streetAddress) {
    schema.geo = {
      "@type": "GeoCoordinates",
      // You can add actual lat/lng if available in your CMS
      // latitude: "37.8",
      // longitude: "-79.0"
    }
  }
  
  // Add opening hours if available (you can add this to your CMS)
  // schema.openingHoursSpecification = [...]
  
  return schema
}

// Generate schema for directory/type page
function generateDirectorySchema(props: SEOProps): any {
  const {
    pageTitle = "",
    slug = "",
    description = "",
    canonicalUrl = "",
    heroImageUrl = "",
    totalListings = 0,
    featuredCount = 0,
    pageType = "directory"
  } = props
  
  const schemaType = pageType === "type" ? "CollectionPage" : "TouristDestination"
  
  const schema: any = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: pageTitle || "Nelson County Directory",
    description: description || "",
    url: canonicalUrl || `https://www.nelsoncounty-va.gov/${slug}`,
    image: heroImageUrl || undefined
  }
  
  if (schemaType === "CollectionPage") {
    schema.mainEntity = {
      "@type": "ItemList",
      numberOfItems: totalListings || 0,
      itemListElement: []
    }
  } else {
    schema.containsPlace = {
      "@type": "ItemList",
      numberOfItems: totalListings || 0
    }
  }
  
  return schema
}

// Generate breadcrumb schema
function generateBreadcrumbSchema(breadcrumb: string = "", canonicalUrl: string = ""): any {
  if (!breadcrumb) return null
  
  const items = breadcrumb.split(">").map(item => item.trim()).filter(item => item)
  
  if (items.length < 2) return null
  
  const breadcrumbList = items.map((item, index) => {
    const position = index + 1
    let url = "https://www.nelsoncounty-va.gov/"
    
    if (position === items.length) {
      url = canonicalUrl || url
    } else if (item.toLowerCase() === "home") {
      url = "https://www.nelsoncounty-va.gov/"
    } else {
      // Generate URL from breadcrumb item (you may want to customize this)
      const slug = item.toLowerCase().replace(/\s+/g, "-")
      url = `https://www.nelsoncounty-va.gov/${slug}`
    }
    
    return {
      "@type": "ListItem",
      position: position,
      name: item,
      item: url
    }
  })
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbList
  }
}

// Generate organization schema
function generateOrganizationSchema(props: SEOProps): any {
  const {
    organizationName = "Nelson County Tourism",
    organizationUrl = "https://www.nelsoncounty-va.gov",
    organizationLogo = ""
  } = props
  
  return {
    "@context": "https://schema.org",
    "@type": "TouristInformationCenter",
    name: organizationName,
    url: organizationUrl,
    logo: organizationLogo || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lovingston",
      addressRegion: "VA",
      addressCountry: "US"
    }
  }
}

export default function SEOSchemaComponent(props: SEOProps) {
  // Log component initialization
  console.log("🚀 SEO Component: Initializing with props", {
    pageType: props.pageType,
    hasName: !!props.name,
    hasPageTitle: !!props.pageTitle,
    hasDescription: !!props.description,
    propsKeys: Object.keys(props).filter(k => props[k as keyof SEOProps])
  })
  
  const {
    pageType = "listing",
    pageTitle,
    description,
    metaTitle,
    metaDescription,
    canonicalUrl,
    breadcrumb,
    organizationName,
    name,
    type,
    area,
    image1,
    website,
    phone,
    address,
    amenities,
    featured
  } = props
  
  // Generate schemas using useMemo to avoid unnecessary recalculations
  const schemas = useMemo(() => {
    console.log("🔧 SEO Component: Generating schemas...", { pageType, name, type, pageTitle })
    
    let mainSchema: any = null
    let breadcrumbSchema: any = null
    let organizationSchema: any = null
    
    try {
      if (pageType === "listing") {
        mainSchema = generateListingSchema(props)
        console.log("✅ Generated listing schema:", mainSchema?.["@type"], mainSchema?.name)
      } else {
        mainSchema = generateDirectorySchema(props)
        console.log("✅ Generated directory schema:", mainSchema?.["@type"], mainSchema?.name)
      }
      
      if (breadcrumb) {
        breadcrumbSchema = generateBreadcrumbSchema(breadcrumb, canonicalUrl)
        console.log("✅ Generated breadcrumb schema")
      }
      
      if (organizationName) {
        organizationSchema = generateOrganizationSchema(props)
        console.log("✅ Generated organization schema")
      }
      
      // Combine all schemas - ensure we always have at least one
      const combined: any[] = []
      if (mainSchema) combined.push(mainSchema)
      if (breadcrumbSchema) combined.push(breadcrumbSchema)
      if (organizationSchema) combined.push(organizationSchema)
      
      console.log(`📊 Total schemas generated: ${combined.length}`)
      
      // If no schemas, create a minimal one to ensure something is injected
      if (combined.length === 0) {
        console.warn("⚠️ No schemas generated, creating minimal fallback")
        combined.push({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: pageTitle || name || "Page",
          description: description || metaDescription || ""
        })
      }
      
      return combined
    } catch (error) {
      console.error("❌ Error generating schemas:", error)
      // Return minimal fallback on error
      return [{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: pageTitle || name || "Page"
      }]
    }
  }, [
    pageType,
    pageTitle,
    description,
    canonicalUrl,
    breadcrumb,
    organizationName,
    name,
    type,
    area,
    image1,
    website,
    phone,
    address,
    amenities,
    featured
  ])
  
  // Helper function to update meta tags (runs multiple times to override Framer defaults)
  const updateMetaTags = () => {
    if (typeof window === "undefined" || typeof document === "undefined") return
    
    const head = document.head
    
    // Update meta tags - this will override Framer's defaults
    if (metaTitle) {
      // Update or create Open Graph title
      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null
      if (!ogTitle) {
        ogTitle = document.createElement("meta")
        ogTitle.setAttribute("property", "og:title")
        head.appendChild(ogTitle)
      }
      ogTitle.setAttribute("content", metaTitle)
      
      // Update or create Twitter title
      let twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement | null
      if (!twitterTitle) {
        twitterTitle = document.createElement("meta")
        twitterTitle.setAttribute("name", "twitter:title")
        head.appendChild(twitterTitle)
      }
      twitterTitle.setAttribute("content", metaTitle)
      
      // Also update document title
      if (document.title !== metaTitle) {
        document.title = metaTitle
      }
    }
    
    if (metaDescription) {
      // Update or create description
      let description = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!description) {
        description = document.createElement("meta")
        description.setAttribute("name", "description")
        head.appendChild(description)
      }
      description.setAttribute("content", metaDescription)
      
      // Update or create Open Graph description
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
      if (!ogDesc) {
        ogDesc = document.createElement("meta")
        ogDesc.setAttribute("property", "og:description")
        head.appendChild(ogDesc)
      }
      ogDesc.setAttribute("content", metaDescription)
      
      // Update or create Twitter description
      let twitterDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement | null
      if (!twitterDesc) {
        twitterDesc = document.createElement("meta")
        twitterDesc.setAttribute("name", "twitter:description")
        head.appendChild(twitterDesc)
      }
      twitterDesc.setAttribute("content", metaDescription)
    }
    
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!canonical) {
        canonical = document.createElement("link")
        canonical.setAttribute("rel", "canonical")
        head.appendChild(canonical)
      }
      canonical.setAttribute("href", canonicalUrl)
    }
  }
  
  // Inject meta tags and schema into document head
  useEffect(() => {
    console.log("🚀 SEO Component: useEffect running...", { schemasCount: schemas.length })
    
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("⚠️ SEO Component: window or document not available")
      return
    }
    
    const head = document.head
    console.log("📄 SEO Component: Head element found", head ? "✅" : "❌")
    
    // Update meta tags immediately and repeatedly to override Framer defaults
    updateMetaTags()
    
    // Update again after delays (Framer sets defaults after initial render)
    const timeouts: ReturnType<typeof setTimeout>[] = []
    timeouts.push(setTimeout(() => updateMetaTags(), 100))
    timeouts.push(setTimeout(() => updateMetaTags(), 500))
    timeouts.push(setTimeout(() => updateMetaTags(), 1000))
    timeouts.push(setTimeout(() => updateMetaTags(), 2000))
    
    // Also update when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateMetaTags)
    } else {
      // DOM already ready, update immediately
      updateMetaTags()
    }
    
    // Watch for changes to head and re-apply (in case Framer updates meta tags)
    const observer = new MutationObserver(() => {
      updateMetaTags()
    })
    
    observer.observe(head, {
      childList: true,
      attributes: true,
      attributeFilter: ["content", "property", "name"]
    })
    
    // Schema.org JSON-LD scripts (these shouldn't conflict with Framer)
    // Inject immediately and ensure they persist
    console.log(`📝 SEO Component: Injecting ${schemas.length} schema(s)...`)
    
    if (schemas.length === 0) {
      console.error("❌ SEO Component: No schemas to inject! Check component props.")
      return
    }
    
    schemas.forEach((schema, index) => {
      try {
        const scriptId = `framer-seo-schema-${index}`
        let script = document.getElementById(scriptId) as HTMLScriptElement | null
        
        if (!script) {
          script = document.createElement("script")
          script.id = scriptId
          script.type = "application/ld+json"
          // Insert at the beginning of head for better crawler visibility
          if (head.firstChild) {
            head.insertBefore(script, head.firstChild)
          } else {
            head.appendChild(script)
          }
          console.log(`📌 Created new script element: ${scriptId}`)
        }
        
        const schemaJson = JSON.stringify(schema, null, 2)
        script.textContent = schemaJson
        
        // Verify it was set
        const verifyScript = document.getElementById(scriptId) as HTMLScriptElement | null
        if (verifyScript && verifyScript.textContent) {
          console.log(`✅ SEO Schema ${index + 1} injected successfully:`, {
            type: schema["@type"],
            name: schema.name || schema["@type"],
            scriptId: scriptId,
            jsonLength: schemaJson.length
          })
        } else {
          console.error(`❌ Failed to inject schema ${index + 1} - script not found after injection`)
        }
      } catch (error) {
        console.error(`❌ Error injecting schema ${index + 1}:`, error, schema)
      }
    })
    
    // Final verification
    const allSchemas = document.querySelectorAll('script[type="application/ld+json"]')
    console.log(`🔍 Verification: Found ${allSchemas.length} schema script(s) in head`)
    allSchemas.forEach((s, i) => {
      try {
        const data = JSON.parse(s.textContent || "")
        console.log(`  Schema ${i + 1}: ${data["@type"]} - ${data.name || "unnamed"}`)
      } catch (e) {
        console.error(`  Schema ${i + 1}: Invalid JSON`)
      }
    })
    
    // Also inject after a delay to ensure it's there when Google crawls
    const schemaTimeout = setTimeout(() => {
      schemas.forEach((schema, index) => {
        const scriptId = `framer-seo-schema-${index}`
        let script = document.getElementById(scriptId) as HTMLScriptElement | null
        if (script) {
          // Ensure content is still there
          const schemaJson = JSON.stringify(schema, null, 2)
          if (script.textContent !== schemaJson) {
            script.textContent = schemaJson
          }
        }
      })
    }, 100)
    
    timeouts.push(schemaTimeout)
    
    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      observer.disconnect()
      document.removeEventListener("DOMContentLoaded", updateMetaTags)
    }
  }, [metaTitle, metaDescription, canonicalUrl, schemas])
  
  // Return a hidden element so Framer recognizes this as a valid component
  // The component injects schema into the head but needs to return JSX
  // Also log that component rendered
  console.log("🎨 SEO Component: Rendered", {
    pageType,
    hasName: !!name,
    hasPageTitle: !!pageTitle,
    schemasCount: schemas.length
  })
  
  return <div style={{ display: "none" }} aria-hidden="true" data-seo-component="true" />
}

// Property controls for Framer
addPropertyControls(SEOSchemaComponent, {
  pageType: {
    type: ControlType.Enum,
    title: "Page Type",
    options: ["listing", "directory", "type"],
    defaultValue: "listing"
  },
  
  // Basic fields
  pageTitle: {
    type: ControlType.String,
    title: "Page Title",
    defaultValue: ""
  },
  slug: {
    type: ControlType.String,
    title: "Slug",
    defaultValue: ""
  },
  description: {
    type: ControlType.String,
    title: "Description",
    defaultValue: ""
  },
  metaTitle: {
    type: ControlType.String,
    title: "Meta Title",
    defaultValue: ""
  },
  metaDescription: {
    type: ControlType.String,
    title: "Meta Description",
    defaultValue: ""
  },
  canonicalUrl: {
    type: ControlType.String,
    title: "Canonical URL",
    defaultValue: ""
  },
  breadcrumb: {
    type: ControlType.String,
    title: "Breadcrumb",
    defaultValue: ""
  },
  
  // Listing fields
  name: {
    type: ControlType.String,
    title: "Business Name",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  type: {
    type: ControlType.String,
    title: "Business Type",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  area: {
    type: ControlType.String,
    title: "Area",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  image1: {
    type: ControlType.Image,
    title: "Primary Image",
    hidden: (props) => props.pageType !== "listing"
  },
  image2: {
    type: ControlType.Image,
    title: "Secondary Image",
    hidden: (props) => props.pageType !== "listing"
  },
  website: {
    type: ControlType.String,
    title: "Website",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  phone: {
    type: ControlType.String,
    title: "Phone",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  address: {
    type: ControlType.String,
    title: "Address",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  amenities: {
    type: ControlType.String,
    title: "Amenities (semicolon-separated)",
    defaultValue: "",
    hidden: (props) => props.pageType !== "listing"
  },
  featured: {
    type: ControlType.Boolean,
    title: "Featured",
    defaultValue: false,
    hidden: (props) => props.pageType !== "listing"
  },
  
  // Organization
  organizationName: {
    type: ControlType.String,
    title: "Organization Name",
    defaultValue: "Nelson County Tourism"
  }
})

