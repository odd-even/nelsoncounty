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
    schema = {
      "@context": "https://schema.org",
      "@type": props.pageType === "type" ? "CollectionPage" : "TouristDestination",
      name: props.name || "Nelson County Directory",
      description: props.description || "",
      url: props.canonicalUrl || ""
    }
  }
  
  if (!schema) return
  
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
  
  const schemaJson = JSON.stringify(schema, null, 2)
  script.textContent = schemaJson
  
  // Also try to ensure it's in the DOM by checking immediately
  // This helps with crawlers that check very early
  if (script.parentNode !== head) {
    head.insertBefore(script, head.firstChild)
  }
  
  // Force a synchronous update
  script.setAttribute("data-schema-injected", "true")
}

export default function SEOSchemaSimple(props: SimpleSEOProps) {
  console.log("🚀 SEO Component: Starting", { 
    pageType: props.pageType,
    hasName: !!props.name,
    hasPageTitle: !!props.metaTitle
  })
  
  // Inject schema IMMEDIATELY (synchronous) - before useEffect
  // Try multiple times to catch it as early as possible
  injectSchemaImmediately(props)
  
  // Also try on next tick (in case DOM isn't ready)
  if (typeof window !== "undefined") {
    setTimeout(() => injectSchemaImmediately(props), 0)
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
    
    if (props.pageType === "listing" && props.name) {
      // Determine schema type
      let schemaType = "LocalBusiness"
      const typeLower = (props.type || "").toLowerCase()
      if (typeLower.includes("winery") || typeLower.includes("vineyard")) schemaType = "Winery"
      else if (typeLower.includes("brewery") || typeLower.includes("cider")) schemaType = "Brewery"
      else if (typeLower.includes("distillery")) schemaType = "Distillery"
      else if (typeLower.includes("restaurant")) schemaType = "Restaurant"
      else if (typeLower.includes("coffee") || typeLower.includes("café") || typeLower.includes("cafe")) schemaType = "CafeOrCoffeeShop"
      else if (typeLower.includes("hotel") || typeLower.includes("resort")) schemaType = "Hotel"
      else if (typeLower.includes("hiking") || typeLower.includes("trail")) schemaType = "TouristAttraction"
      
      // Parse address
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
      
      // Add amenities
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
      // Directory or type page
      schema = {
        "@context": "https://schema.org",
        "@type": props.pageType === "type" ? "CollectionPage" : "TouristDestination",
        name: props.name || "Nelson County Directory",
        description: props.description || "",
        url: props.canonicalUrl || ""
      }
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
    
    const schemaJson = JSON.stringify(schema, null, 2)
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
    if (props.metaTitle) {
      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null
      if (!ogTitle) {
        ogTitle = document.createElement("meta")
        ogTitle.setAttribute("property", "og:title")
        head.appendChild(ogTitle)
      }
      ogTitle.setAttribute("content", props.metaTitle)
      
      if (document.title !== props.metaTitle) {
        document.title = props.metaTitle
      }
    }
    
    if (props.metaDescription) {
      let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
      if (!desc) {
        desc = document.createElement("meta")
        desc.setAttribute("name", "description")
        head.appendChild(desc)
      }
      desc.setAttribute("content", props.metaDescription)
      
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
      if (!ogDesc) {
        ogDesc = document.createElement("meta")
        ogDesc.setAttribute("property", "og:description")
        head.appendChild(ogDesc)
      }
      ogDesc.setAttribute("content", props.metaDescription)
    }
    
    if (props.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!canonical) {
        canonical = document.createElement("link")
        canonical.setAttribute("rel", "canonical")
        head.appendChild(canonical)
      }
      canonical.setAttribute("href", props.canonicalUrl)
    }
    
    // Re-apply after delays to override Framer defaults
    setTimeout(() => {
      if (props.metaTitle) {
        const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
        if (og) og.setAttribute("content", props.metaTitle)
        if (document.title !== props.metaTitle) document.title = props.metaTitle
      }
      if (props.metaDescription) {
        const desc = document.querySelector('meta[name="description"]') as HTMLMetaElement
        if (desc) desc.setAttribute("content", props.metaDescription)
        const og = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
        if (og) og.setAttribute("content", props.metaDescription)
      }
    }, 500)
    
    setTimeout(() => {
      if (props.metaTitle) {
        const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
        if (og) og.setAttribute("content", props.metaTitle)
        if (document.title !== props.metaTitle) document.title = props.metaTitle
      }
      if (props.metaDescription) {
        const desc = document.querySelector('meta[name="description"]') as HTMLMetaElement
        if (desc) desc.setAttribute("content", props.metaDescription)
        const og = document.querySelector('meta[property="og:description"]') as HTMLMetaElement
        if (og) og.setAttribute("content", props.metaDescription)
      }
    }, 1000)
    
  }, [
    props.pageType,
    props.name,
    props.type,
    props.description,
    props.image1,
    props.website,
    props.phone,
    props.address,
    props.amenities,
    props.canonicalUrl,
    props.metaTitle,
    props.metaDescription
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

