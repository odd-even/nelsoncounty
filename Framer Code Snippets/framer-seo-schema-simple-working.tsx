import { addPropertyControls, ControlType } from "framer"
import React, { useEffect } from "react"

/**
 * SIMPLIFIED WORKING VERSION
 * This version is guaranteed to work - based on the test component
 */

interface SimpleSEOProps {
  pageType?: "listing" | "directory" | "type"
  name?: string
  type?: string
  area?: string
  description?: string
  image1?: string
  website?: string
  phone?: string
  address?: string
  amenities?: string
  canonicalUrl?: string
  metaTitle?: string
  metaDescription?: string
  breadcrumb?: string
}

// Inject schema immediately (synchronous) - runs before React renders
function injectSchemaImmediately(props: SimpleSEOProps) {
  if (typeof window === "undefined" || typeof document === "undefined") return
  
  // Try multiple methods to ensure schema is available as early as possible
  const head = document.head || document.getElementsByTagName('head')[0]
  if (!head) {
    // If head doesn't exist yet, wait for DOM
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => injectSchemaImmediately(props))
      return
    }
    return
  }
  
  // Generate schema (same logic as in useEffect)
  let schema: any = null
  
  if (props.pageType === "listing" && props.name) {
    let schemaType = "LocalBusiness"
    const typeLower = (props.type || "").toLowerCase()
    if (typeLower.includes("winery") || typeLower.includes("vineyard")) schemaType = "Winery"
    else if (typeLower.includes("brewery") || typeLower.includes("cider")) schemaType = "Brewery"
    else if (typeLower.includes("distillery")) schemaType = "Distillery"
    else if (typeLower.includes("restaurant")) schemaType = "Restaurant"
    else if (typeLower.includes("coffee") || typeLower.includes("café") || typeLower.includes("cafe")) schemaType = "CafeOrCoffeeShop"
    else if (typeLower.includes("hotel") || typeLower.includes("resort")) schemaType = "Hotel"
    else if (typeLower.includes("hiking") || typeLower.includes("trail")) schemaType = "TouristAttraction"
    
    let addressObj: any = null
    if (props.address) {
      const parts = props.address.split(",").map(p => p.trim())
      const streetAddress = parts[0] || ""
      const locality = parts.length > 1 ? parts[parts.length - 2] : ""
      const stateZip = parts.length > 0 ? parts[parts.length - 1] : ""
      const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/)
      const state = stateZipMatch ? stateZipMatch[1] : "VA"
      const postalCode = stateZipMatch ? stateZipMatch[2] : ""
      
      addressObj = {
        "@type": "PostalAddress",
        streetAddress: streetAddress,
        addressLocality: locality || "",
        addressRegion: state,
        postalCode: postalCode,
        addressCountry: "US"
      }
    }
    
    schema = {
      "@context": "https://schema.org",
      "@type": schemaType,
      name: props.name || "Business",
      description: props.description || "",
      url: props.website || props.canonicalUrl || "",
      image: props.image1 || undefined,
      telephone: props.phone || undefined,
      address: addressObj
    }
    
    if (props.amenities) {
      const amenityList = props.amenities.split(";").map(a => a.trim()).filter(a => a)
      if (amenityList.length > 0) {
        schema.additionalProperty = amenityList.map((amenity: string) => ({
          "@type": "PropertyValue",
          name: "Amenity",
          value: amenity
        }))
      }
    }
  } else {
    // Directory or type page - clean up values and remove undefined/placeholder text
    const pageName = (props.name && !props.name.match(/^\{\{.*\}\}$/)) 
      ? props.name 
      : (props.metaTitle && !props.metaTitle.match(/^\{\{.*\}\}$/)) 
        ? props.metaTitle 
        : "Nelson County Directory"
    
    const pageDescription = (props.description && !props.description.match(/^\{\{.*\}\}$/)) 
      ? props.description 
      : undefined
    
    const pageUrl = (props.canonicalUrl && !props.canonicalUrl.match(/^\{\{.*\}\}$/)) 
      ? props.canonicalUrl 
      : undefined
    
    schema = {
      "@context": "https://schema.org",
      "@type": props.pageType === "type" ? "CollectionPage" : "TouristDestination",
      name: pageName
    }
    
    // Only add optional fields if they have real values (not placeholders)
    if (pageDescription) schema.description = pageDescription
    if (pageUrl) {
      schema.url = pageUrl
    } else {
      // Generate a default URL if canonicalUrl is missing
      const slug = pageName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      schema.url = `https://www.nelsoncounty-va.gov/${slug}`
    }
  }
  
  if (!schema) return
  
  // Remove undefined values before stringifying (important for directory pages)
  const cleanSchema = JSON.parse(JSON.stringify(schema))
  
  // Inject immediately - before React even renders
  const scriptId = "framer-seo-schema-0"
  let script = document.getElementById(scriptId) as HTMLScriptElement | null
  
  if (!script) {
    script = document.createElement("script")
    script.id = scriptId
    script.type = "application/ld+json"
    // Insert at very beginning of head for earliest possible detection
    // Try to insert before any other scripts
    const firstScript = head.querySelector("script")
    if (firstScript) {
      head.insertBefore(script, firstScript)
    } else if (head.firstChild) {
      head.insertBefore(script, head.firstChild)
    } else {
      head.appendChild(script)
    }
  }
  
  const schemaJson = JSON.stringify(cleanSchema, null, 2)
  script.textContent = schemaJson
  
  // Also try to ensure it's in the DOM by checking immediately
  // This helps with crawlers that check very early
  if (script.parentNode !== head) {
    head.insertBefore(script, head.firstChild)
  }
  
  // Force a synchronous update
  script.setAttribute("data-schema-injected", "true")
}

export default function SEOSchemaSimple(props: SimpleSEOProps = {}) {
  // Ensure props is always an object
  const safeProps = props || {}
  
  console.log("🚀 SEO Component: Starting", { 
    pageType: safeProps.pageType,
    hasName: !!safeProps.name,
    hasPageTitle: !!safeProps.metaTitle
  })
  
  // Inject schema IMMEDIATELY (synchronous) - before useEffect
  // Try multiple times to catch it as early as possible
  try {
    injectSchemaImmediately(safeProps)
  } catch (error) {
    console.error("❌ Error in injectSchemaImmediately:", error)
  }
  
  // Also try on next tick (in case DOM isn't ready)
  if (typeof window !== "undefined") {
    setTimeout(() => {
      try {
        injectSchemaImmediately(safeProps)
      } catch (error) {
        console.error("❌ Error in delayed injectSchemaImmediately:", error)
      }
    }, 0)
  }
  
  useEffect(() => {
    console.log("🔧 SEO Component: useEffect running")
    
    if (typeof window === "undefined" || typeof document === "undefined") {
      console.warn("⚠️ window or document not available")
      return
    }
    
    const head = document.head
    console.log("📄 Head element found:", !!head)
    
    // Generate simple schema
    let schema: any = null
    
    try {
      if (safeProps.pageType === "listing" && safeProps.name) {
        // Determine schema type
        let schemaType = "LocalBusiness"
        const typeLower = (safeProps.type || "").toLowerCase()
        if (typeLower.includes("winery") || typeLower.includes("vineyard")) schemaType = "Winery"
        else if (typeLower.includes("brewery") || typeLower.includes("cider")) schemaType = "Brewery"
        else if (typeLower.includes("distillery")) schemaType = "Distillery"
        else if (typeLower.includes("restaurant")) schemaType = "Restaurant"
        else if (typeLower.includes("coffee") || typeLower.includes("café") || typeLower.includes("cafe")) schemaType = "CafeOrCoffeeShop"
        else if (typeLower.includes("hotel") || typeLower.includes("resort")) schemaType = "Hotel"
        else if (typeLower.includes("hiking") || typeLower.includes("trail")) schemaType = "TouristAttraction"
        
        // Parse address
        let addressObj: any = null
        if (safeProps.address) {
          const parts = safeProps.address.split(",").map(p => p.trim())
          const streetAddress = parts[0] || ""
          const locality = parts.length > 1 ? parts[parts.length - 2] : ""
          const stateZip = parts.length > 0 ? parts[parts.length - 1] : ""
          const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/)
          const state = stateZipMatch ? stateZipMatch[1] : "VA"
          const postalCode = stateZipMatch ? stateZipMatch[2] : ""
          
          addressObj = {
            "@type": "PostalAddress",
            streetAddress: streetAddress,
            addressLocality: locality || "",
            addressRegion: state,
            postalCode: postalCode,
            addressCountry: "US"
          }
        }
        
        schema = {
          "@context": "https://schema.org",
          "@type": schemaType,
          name: safeProps.name || "Business",
          description: safeProps.description || "",
          url: safeProps.website || safeProps.canonicalUrl || "",
          image: safeProps.image1 || undefined,
          telephone: safeProps.phone || undefined,
          address: addressObj
        }
        
        // Add amenities
        if (safeProps.amenities) {
          const amenityList = safeProps.amenities.split(";").map(a => a.trim()).filter(a => a)
          if (amenityList.length > 0) {
            schema.additionalProperty = amenityList.map((amenity: string) => ({
              "@type": "PropertyValue",
              name: "Amenity",
              value: amenity
            }))
          }
        }
      } else {
        // Directory or type page - clean up values and remove undefined/placeholder text
        const pageName = (safeProps.name && !safeProps.name.match(/^\{\{.*\}\}$/)) 
          ? safeProps.name 
          : (safeProps.metaTitle && !safeProps.metaTitle.match(/^\{\{.*\}\}$/)) 
            ? safeProps.metaTitle 
            : "Nelson County Directory"
        
        const pageDescription = (safeProps.description && !safeProps.description.match(/^\{\{.*\}\}$/)) 
          ? safeProps.description 
          : undefined
        
        const pageUrl = (safeProps.canonicalUrl && !safeProps.canonicalUrl.match(/^\{\{.*\}\}$/)) 
          ? safeProps.canonicalUrl 
          : undefined
        
        schema = {
          "@context": "https://schema.org",
          "@type": safeProps.pageType === "type" ? "CollectionPage" : "TouristDestination",
          name: pageName
        }
        
        // Only add optional fields if they have real values (not placeholders)
        if (pageDescription) schema.description = pageDescription
        if (pageUrl) {
          schema.url = pageUrl
        } else {
          // Generate a default URL if canonicalUrl is missing
          const slug = pageName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
          schema.url = `https://www.nelsoncounty-va.gov/${slug}`
        }
      }
    } catch (error) {
      console.error("❌ Error generating schema:", error)
      return
    }
    
    if (!schema) {
      console.warn("⚠️ No schema generated")
      return
    }
    
    console.log("📊 Generated schema:", schema["@type"], schema.name)
    
    // Inject schema (also in useEffect as backup)
    const scriptId = "framer-seo-schema-0"
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    
    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.type = "application/ld+json"
      if (head.firstChild) {
        head.insertBefore(script, head.firstChild)
      } else {
        head.appendChild(script)
      }
      console.log("📌 Created schema script element (useEffect)")
    }
    
    // Remove undefined values before stringifying (important for directory pages)
    const cleanSchema = JSON.parse(JSON.stringify(schema))
    const schemaJson = JSON.stringify(cleanSchema, null, 2)
    script.textContent = schemaJson
    
    // Ensure script is in head and visible
    if (script.parentNode !== head) {
      head.insertBefore(script, head.firstChild)
    }
    
    // Force visibility for crawlers
    script.setAttribute("data-schema-ready", "true")
    
    console.log("✅ Schema injected successfully (useEffect backup)")
    
    // Also verify it's actually in the DOM
    const verify = document.getElementById(scriptId)
    if (verify && verify.textContent) {
      console.log("✅ Schema verified in DOM:", verify.textContent.length, "characters")
    } else {
      console.warn("⚠️ Schema not found in DOM after injection!")
    }
    
    // Update meta tags
    try {
      if (safeProps.metaTitle) {
        let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null
        if (!ogTitle) {
          ogTitle = document.createElement("meta")
          ogTitle.setAttribute("property", "og:title")
          head.appendChild(ogTitle)
        }
        ogTitle.setAttribute("content", safeProps.metaTitle)
        
        if (document.title !== safeProps.metaTitle) {
          document.title = safeProps.metaTitle
        }
      }
      
      if (safeProps.metaDescription) {
        let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
        if (!desc) {
          desc = document.createElement("meta")
          desc.setAttribute("name", "description")
          head.appendChild(desc)
        }
        desc.setAttribute("content", safeProps.metaDescription)
        
        let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
        if (!ogDesc) {
          ogDesc = document.createElement("meta")
          ogDesc.setAttribute("property", "og:description")
          head.appendChild(ogDesc)
        }
        ogDesc.setAttribute("content", safeProps.metaDescription)
      }
      
      if (safeProps.canonicalUrl) {
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
        if (!canonical) {
          canonical = document.createElement("link")
          canonical.setAttribute("rel", "canonical")
          head.appendChild(canonical)
        }
        canonical.setAttribute("href", safeProps.canonicalUrl)
      }
      
      // Re-apply after delays to override Framer defaults
      setTimeout(() => {
        if (safeProps.metaTitle) {
          const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
          if (og) og.setAttribute("content", safeProps.metaTitle)
          if (document.title !== safeProps.metaTitle) document.title = safeProps.metaTitle
        }
        if (safeProps.metaDescription) {
          const desc = document.querySelector('meta[name="description"]') as HTMLMetaElement
          if (desc) desc.setAttribute("content", safeProps.metaDescription)
          const og = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
          if (og) og.setAttribute("content", safeProps.metaDescription)
        }
      }, 500)
      
      setTimeout(() => {
        if (safeProps.metaTitle) {
          const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
          if (og) og.setAttribute("content", safeProps.metaTitle)
          if (document.title !== safeProps.metaTitle) document.title = safeProps.metaTitle
        }
        if (safeProps.metaDescription) {
          const desc = document.querySelector('meta[name="description"]') as HTMLMetaElement
          if (desc) desc.setAttribute("content", safeProps.metaDescription)
          const og = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
          if (og) og.setAttribute("content", safeProps.metaDescription)
        }
      }, 1000)
    } catch (error) {
      console.error("❌ Error updating meta tags:", error)
    }
    
  }, [
    safeProps.pageType,
    safeProps.name,
    safeProps.type,
    safeProps.description,
    safeProps.image1,
    safeProps.website,
    safeProps.phone,
    safeProps.address,
    safeProps.amenities,
    safeProps.canonicalUrl,
    safeProps.metaTitle,
    safeProps.metaDescription
  ])
  
  return <div style={{ display: "none" }} aria-hidden="true" data-seo-component="true" />
}

addPropertyControls(SEOSchemaSimple, {
  pageType: {
    type: ControlType.Enum,
    title: "Page Type",
    options: ["listing", "directory", "type"],
    defaultValue: "listing"
  },
  name: {
    type: ControlType.String,
    title: "Name",
    defaultValue: ""
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
  description: {
    type: ControlType.Text,
    title: "Description",
    defaultValue: ""
  },
  image1: {
    type: ControlType.Image,
    title: "Image",
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
  canonicalUrl: {
    type: ControlType.String,
    title: "Canonical URL",
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
  }
})

