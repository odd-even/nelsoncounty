import { addPropertyControls, ControlType } from "framer"

/**
 * SIMPLE TEST VERSION - Use this to verify the component works
 * If this logs, then we know code components work on your page
 */

export default function SEOSchemaTest() {
  console.log("✅ TEST COMPONENT IS RUNNING!")
  console.log("If you see this, code components work on your page")
  
  // Try to inject schema immediately
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const head = document.head
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Test Page",
      description: "This is a test to verify schema injection works"
    })
    head.appendChild(script)
    console.log("✅ Schema script injected!")
  }
  
  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#2d6a4f", 
      color: "white",
      borderRadius: "8px",
      margin: "20px"
    }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        ✅ SEO Test Component
      </div>
      <div style={{ fontSize: "12px" }}>
        Check console (F12) for logs. If you see logs, the component is working!
      </div>
    </div>
  )
}

addPropertyControls(SEOSchemaTest, {
  // No props needed for test
})

