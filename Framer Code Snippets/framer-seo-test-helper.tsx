import { addPropertyControls, ControlType } from "framer"
import { useEffect } from "react"

/**
 * SEO Test Helper Component
 * 
 * Add this component to your page during development to see
 * what schema and meta tags are being generated.
 * 
 * This component logs all SEO data to the browser console
 * and displays a visual indicator on the page.
 */

interface SEOTestHelperProps {
  enabled?: boolean
  showVisual?: boolean
}

export default function SEOTestHelper(props: SEOTestHelperProps) {
  const { enabled = true, showVisual = true } = props

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof document === "undefined") return

    console.log("🔍 SEO Test Helper - Checking page SEO...")
    console.log("=" .repeat(50))

    // Check Schema.org JSON-LD
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]')
    console.log(`📊 Schema Scripts Found: ${schemaScripts.length}`)
    
    schemaScripts.forEach((script, i) => {
      try {
        const data = JSON.parse(script.textContent || "")
        console.log(`\nSchema ${i + 1}:`)
        console.log(`  Type: ${data["@type"]}`)
        console.log(`  Name: ${data.name || "N/A"}`)
        if (data.address) {
          console.log(`  Address: ${data.address.streetAddress || ""}, ${data.address.addressLocality || ""}`)
        }
        if (data.telephone) console.log(`  Phone: ${data.telephone}`)
        if (data.url) console.log(`  URL: ${data.url}`)
        console.log(`  Full Schema:`, data)
      } catch (e) {
        console.error(`❌ Invalid JSON in schema script ${i + 1}:`, e)
      }
    })

    // Check Meta Tags
    console.log("\n📋 Meta Tags:")
    const metaTags = {
      description: document.querySelector('meta[name="description"]')?.getAttribute("content") || "NOT FOUND",
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "NOT FOUND",
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "NOT FOUND",
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "NOT FOUND",
      twitterTitle: document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || "NOT FOUND",
      twitterDescription: document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") || "NOT FOUND",
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "NOT FOUND"
    }
    
    Object.entries(metaTags).forEach(([key, value]) => {
      const status = value === "NOT FOUND" ? "❌" : "✅"
      console.log(`  ${status} ${key}: ${value}`)
    })

    // Check Document Title
    console.log(`\n📄 Document Title: ${document.title}`)

    // Summary
    console.log("\n" + "=".repeat(50))
    const schemaCount = schemaScripts.length
    const metaCount = Object.values(metaTags).filter(v => v !== "NOT FOUND").length
    const totalMeta = Object.keys(metaTags).length
    
    console.log(`\n📈 Summary:`)
    console.log(`  Schema scripts: ${schemaCount} ${schemaCount > 0 ? "✅" : "❌"}`)
    console.log(`  Meta tags: ${metaCount}/${totalMeta} ${metaCount === totalMeta ? "✅" : "⚠️"}`)
    
    if (schemaCount === 0) {
      console.warn("⚠️  No schema scripts found! Make sure SEOSchemaComponent is on the page.")
    }
    if (metaCount < totalMeta) {
      console.warn("⚠️  Some meta tags are missing. Check your component props.")
    }
    if (schemaCount > 0 && metaCount === totalMeta) {
      console.log("✅ All SEO elements detected!")
    }

    console.log("\n💡 Tip: Test your page at https://search.google.com/test/rich-results")
    console.log("=".repeat(50))
  }, [enabled])

  if (!showVisual) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "#2d6a4f",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        maxWidth: "300px"
      }}
    >
      <div style={{ fontWeight: "600", marginBottom: "4px" }}>🔍 SEO Test Helper</div>
      <div style={{ fontSize: "11px", opacity: 0.9 }}>
        Check browser console (F12) for detailed SEO analysis
      </div>
      <div style={{ fontSize: "10px", marginTop: "8px", opacity: 0.8 }}>
        Open DevTools → Console tab
      </div>
    </div>
  )
}

addPropertyControls(SEOTestHelper, {
  enabled: {
    type: ControlType.Boolean,
    title: "Enabled",
    defaultValue: true
  },
  showVisual: {
    type: ControlType.Boolean,
    title: "Show Visual Indicator",
    defaultValue: true
  }
})

