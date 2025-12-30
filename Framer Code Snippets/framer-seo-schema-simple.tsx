import { addPropertyControls, ControlType } from "framer"
import { useEffect } from "react"

/**
 * SEO Schema Component - Simplified Version
 * 
 * This version is optimized for Framer compatibility.
 * It injects Schema.org JSON-LD and meta tags into the document head.
 */

interface SEOProps {
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

export default function SEOSchemaSimple(props: SEOProps) {
  const {
    pageType = "listing",
    name = "",
    type = "",
    area = "",
    description = "",
    image1 = "",
    website = "",
    phone = "",
    address = "",
    amenities = "",
    canonicalUrl = "",
    metaTitle = "",
    metaDescription = "",
    breadcrumb = ""
  } = props

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || typeof document === "undefined") return

    const head = document.head

    // Helper to get or create meta tag
    const getOrCreateMeta = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null
      if (!element) {
        element = document.createElement("meta")
        if (attribute.startsWith("property")) {
          element.setAttribute("property", attribute.split(":")[1])
        } else {
          element.setAttribute("name", attribute)
        }
        head.appendChild(element)
      }
      element.setAttribute("content", value)
    }

    // Helper to get or create link tag
    const getOrCreateLink = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
      if (!element) {
        element = document.createElement("link")
        element.setAttribute("rel", rel)
        head.appendChild(element)
      }
      element.setAttribute("href", href)
    }

    // Meta tags
    if (metaTitle) {
      getOrCreateMeta('meta[property="og:title"]', "property:og:title", metaTitle)
      getOrCreateMeta('meta[name="twitter:title"]', "name:twitter:title", metaTitle)
    }

    if (metaDescription) {
      getOrCreateMeta('meta[name="description"]', "name:description", metaDescription)
      getOrCreateMeta('meta[property="og:description"]', "property:og:description", metaDescription)
      getOrCreateMeta('meta[name="twitter:description"]', "name:twitter:description", metaDescription)
    }

    if (canonicalUrl) {
      getOrCreateLink("canonical", canonicalUrl)
    }

    // Generate schema
    const generateSchema = () => {
      if (pageType === "listing" && name) {
        // Determine schema type
        let schemaType = "LocalBusiness"
        const typeLower = type.toLowerCase()
        if (typeLower.includes("winery") || typeLower.includes("vineyard")) schemaType = "Winery"
        else if (typeLower.includes("brewery") || typeLower.includes("cider")) schemaType = "Brewery"
        else if (typeLower.includes("distillery")) schemaType = "Distillery"
        else if (typeLower.includes("restaurant")) schemaType = "Restaurant"
        else if (typeLower.includes("coffee") || typeLower.includes("café") || typeLower.includes("cafe")) schemaType = "CafeOrCoffeeShop"
        else if (typeLower.includes("hotel") || typeLower.includes("resort")) schemaType = "Hotel"
        else if (typeLower.includes("hiking") || typeLower.includes("trail")) schemaType = "TouristAttraction"

        // Parse address
        let addressObj: any = null
        if (address) {
          const parts = address.split(",").map(p => p.trim())
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

        // Build schema
        const schema: any = {
          "@context": "https://schema.org",
          "@type": schemaType,
          name: name,
          description: description || "",
          url: website || canonicalUrl || "",
          image: image1 || undefined,
          telephone: phone || undefined,
          address: addressObj
        }

        // Add amenities
        if (amenities) {
          const amenityList = amenities.split(";").map(a => a.trim()).filter(a => a)
          if (amenityList.length > 0) {
            schema.additionalProperty = amenityList.map((amenity: string) => ({
              "@type": "PropertyValue",
              name: "Amenity",
              value: amenity
            }))
          }
        }

        return schema
      } else if (pageType === "directory" || pageType === "type") {
        return {
          "@context": "https://schema.org",
          "@type": pageType === "type" ? "CollectionPage" : "TouristDestination",
          name: name || "Nelson County Directory",
          description: description || "",
          url: canonicalUrl || ""
        }
      }
      return null
    }

    const schema = generateSchema()

    // Inject schema script
    if (schema) {
      let script = document.getElementById("framer-seo-schema") as HTMLScriptElement | null
      if (!script) {
        script = document.createElement("script")
        script.id = "framer-seo-schema"
        script.type = "application/ld+json"
        head.appendChild(script)
      }
      script.textContent = JSON.stringify(schema, null, 2)
    }
  }, [
    pageType,
    name,
    type,
    area,
    description,
    image1,
    website,
    phone,
    address,
    amenities,
    canonicalUrl,
    metaTitle,
    metaDescription,
    breadcrumb
  ])

  // Return a minimal visible element so Framer recognizes it
  return <div style={{ width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
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

