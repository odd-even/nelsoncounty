# Framer Code Components - Complete Guide

This guide explains all the code components you need for your Framer site and how they work together.

---

## 🎯 Essential Components (Required)

### 1. **AdventureDirectory** - Main Component
**File:** `framer_code_component.tsx`  
**Purpose:** Embeds your `frontpage_framer.html` in an iframe  
**Where to use:** On your "Find Your Adventure" page

**What it does:**
- Embeds the adventure directory iframe
- Handles dynamic height resizing
- Manages scroll behavior
- Communicates with iframe via postMessage

**Code:**
```tsx
import React, { useState, useRef, useEffect } from "react"

export default function AdventureDirectory() {
  const [iframeHeight, setIframeHeight] = useState(800)
  const iframeRef = useRef(null)

  useEffect(() => {
    function handleMessage(event) {
      if (event.data && event.data.type === 'resize') {
        const height = event.data.height
        if (typeof height === 'number' && height > 0 && height < 10000) {
          setIframeHeight(height)
        }
      }
      
      if (event.data && event.data.type === 'scrollToTop') {
        if (iframeRef.current) {
          iframeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          setTimeout(() => {
            if (iframeRef.current) {
              const rect = iframeRef.current.getBoundingClientRect()
              window.scrollTo({ top: window.scrollY + rect.top, behavior: 'smooth' })
            }
          }, 50)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (iframeRef.current) {
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
      const finalHeight = Math.max(viewportHeight, Math.max(400, iframeHeight))
      iframeRef.current.style.height = finalHeight + 'px'
      iframeRef.current.style.maxHeight = viewportHeight * 1.1 + 'px'
      iframeRef.current.style.overflow = 'hidden'
      iframeRef.current.style.scrollMarginTop = '0px'
      iframeRef.current.style.scrollSnapAlign = 'start'
      iframeRef.current.style.scrollSnapStop = 'always'
    }
  }, [iframeHeight])

  useEffect(() => {
    if (!iframeRef.current || typeof window === 'undefined') return

    let scrollEndTimeout: number | null = null
    let isRecentering = false
    let lastScrollY = window.scrollY
    const ALLOWED_PAST = 400
    const SCROLL_STOP_DELAY = 200

    const handleScroll = () => {
      lastScrollY = window.scrollY
      
      if (scrollEndTimeout) {
        clearTimeout(scrollEndTimeout)
      }
      
      scrollEndTimeout = setTimeout(() => {
        if (!iframeRef.current || isRecentering) return

        const rect = iframeRef.current.getBoundingClientRect()
        const iframeTop = rect.top
        const iframeBottom = rect.bottom
        const viewportHeight = window.innerHeight

        const bottomIsVisible = iframeBottom <= viewportHeight + 50
        
        if (!bottomIsVisible && iframeTop < -ALLOWED_PAST) {
          isRecentering = true
          iframeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          
          setTimeout(() => {
            isRecentering = false
          }, 500)
        }
        
        scrollEndTimeout = null
      }, SCROLL_STOP_DELAY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout)
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      id="adventure-directory-iframe"
      src="https://odd-even.github.io/nelsoncounty/frontpage_framer.html"
      style={{
        width: '100%',
        height: '800px',
        border: 'none',
        minHeight: '400px',
        maxHeight: '110vh',
        overflow: 'hidden'
      }}
      title="Adventure Directory"
    />
  )
}
```

**Setup:**
1. Create new file in Framer: `AdventureDirectory.tsx`
2. Copy the code above
3. Add to your "Find Your Adventure" page
4. That's it! The iframe will load automatically

---

## 🔗 Optional Components (Recommended)

### 2. **URLParamsHelper** - URL Parameter Support
**File:** `framer-url-params-helper.tsx`  
**Purpose:** Helps pass URL parameters to the iframe  
**Where to use:** On pages that link to filtered views

**What it does:**
- Listens for URL parameters on the Framer page
- Sends them to the iframe via postMessage
- Enables category filtering from links

**Code:**
```tsx
import { useEffect } from "react"

export default function URLParamsHelper() {
  useEffect(() => {
    // Get URL parameters from current page
    const urlParams = new URLSearchParams(window.location.search)
    const category = urlParams.get('category')
    
    if (category) {
      // Find the iframe and send category
      const iframe = document.getElementById('adventure-directory-iframe') as HTMLIFrameElement
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'setCategory',
          category: category
        }, '*')
      }
    }
    
    // Also listen for URL changes (if using Framer navigation)
    const handleLocationChange = () => {
      const newParams = new URLSearchParams(window.location.search)
      const newCategory = newParams.get('category')
      const iframe = document.getElementById('adventure-directory-iframe') as HTMLIFrameElement
      if (iframe?.contentWindow && newCategory) {
        iframe.contentWindow.postMessage({
          type: 'setCategory',
          category: newCategory
        }, '*')
      }
    }
    
    // Check URL on mount and when it changes
    window.addEventListener('popstate', handleLocationChange)
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])
  
  return null // This component doesn't render anything
}
```

**Setup:**
1. Create file: `URLParamsHelper.tsx`
2. Add to your "Find Your Adventure" page (same page as AdventureDirectory)
3. It works automatically - no configuration needed

---

### 3. **CategoryLink** - Category Filter Buttons
**File:** `framer-category-links.tsx`  
**Purpose:** Creates clickable buttons that filter by category  
**Where to use:** On any page where you want category filter buttons

**What it does:**
- Creates a styled button for each category
- Updates the iframe when clicked
- Can navigate to filtered view

**Code:**
```tsx
import React, { useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

export default function CategoryLink({ 
    category, 
    label, 
    iframeId = "adventure-directory-iframe",
    style 
}: { 
    category: string
    label?: string
    iframeId?: string
    style?: React.CSSProperties 
}) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        
        // Update iframe src
        const iframe = document.getElementById(iframeId) as HTMLIFrameElement
        if (iframe) {
            const currentSrc = iframe.src.split('?')[0]
            const newUrl = `${currentSrc}?category=${category}`
            iframe.src = newUrl
            
            // Send postMessage
            iframe.contentWindow?.postMessage({
                type: 'setCategory',
                category: category,
                source: 'framer-category-link'
            }, '*')
        }
        
        // Navigate to Find Your Adventure page
        window.location.href = `/find-your-adventure?category=${category}`
    }
    
    const categoryLabels: Record<string, string> = {
        community: "Community",
        taste: "Taste",
        experience: "Experience",
        outdoor: "Outdoor",
        culture: "Culture",
        stay: "Stay"
    }
    
    const displayLabel = label || categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)
    
    return (
        <a
            href={`#category-${category}`}
            onClick={handleClick}
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#2d6a4f',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                ...style
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1b4332'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2d6a4f'
            }}
        >
            {displayLabel}
        </a>
    )
}

addPropertyControls(CategoryLink, {
    category: {
        type: ControlType.Enum,
        title: "Category",
        options: ["community", "taste", "experience", "outdoor", "culture", "stay"],
        optionTitles: ["Community", "Taste", "Experience", "Outdoor", "Culture", "Stay"],
        defaultValue: "community"
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Leave empty for default"
    },
    iframeId: {
        type: ControlType.String,
        title: "Iframe ID",
        defaultValue: "adventure-directory-iframe"
    }
})
```

**Setup:**
1. Create file: `CategoryLink.tsx`
2. Add multiple instances to your page
3. Set each to a different category
4. Style as needed

---

## 🎨 Optional Styling Components

### 4. **AmenityPills** - Styled Amenity Display
**File:** `framer-amenity-pills-component.tsx`  
**Purpose:** Styles amenity text as pills/badges  
**Where to use:** If you display amenities in Framer (not in iframe)

**Note:** This is only needed if you're displaying amenities outside the iframe. The iframe already styles amenities.

---

## 📋 Component Checklist

### Minimum Required:
- [x] **AdventureDirectory** - Main iframe component

### Recommended:
- [ ] **URLParamsHelper** - For URL parameter support
- [ ] **CategoryLink** - For category filter buttons

### Optional:
- [ ] **AmenityPills** - Only if displaying amenities outside iframe

---

## 🔧 How They Work Together

```
┌─────────────────────────────────────────┐
│  Framer Page: "Find Your Adventure"    │
│                                         │
│  ┌─────────────────────────────────┐ │
│  │ URLParamsHelper (invisible)     │ │
│  │ - Reads URL params              │ │
│  │ - Sends to iframe               │ │
│  └─────────────────────────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐ │
│  │ AdventureDirectory              │ │
│  │ - Embeds iframe                 │ │
│  │ - Handles resize                │ │
│  │ - Manages scroll                │ │
│  └─────────────────────────────────┘ │
│         │                              │
│         │ iframe                       │
│         ↓                              │
│  ┌─────────────────────────────────┐ │
│  │ frontpage_framer.html           │ │
│  │ - Loads listings                │ │
│  │ - Filters by category          │ │
│  │ - Displays results             │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Other Pages (Home, About, etc.)         │
│                                         │
│  ┌─────────────────────────────────┐ │
│  │ CategoryLink buttons            │ │
│  │ - Community                     │ │
│  │ - Taste                          │ │
│  │ - Experience                     │ │
│  │ - etc.                           │ │
│  └─────────────────────────────────┘ │
│         │                              │
│         │ Links to:                    │
│         │ /find-your-adventure?        │
│         │ category=xxx                │
│         ↓                              │
│  ┌─────────────────────────────────┐ │
│  │ "Find Your Adventure" page      │ │
│  │ (with URLParamsHelper)          │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Setup Steps

1. **Create AdventureDirectory component:**
   - File → New → Code Component
   - Name: `AdventureDirectory`
   - Copy code from section 1 above
   - Add to "Find Your Adventure" page

2. **Create URLParamsHelper (optional but recommended):**
   - File → New → Code Component
   - Name: `URLParamsHelper`
   - Copy code from section 2 above
   - Add to "Find Your Adventure" page (same page as AdventureDirectory)

3. **Create CategoryLink (optional):**
   - File → New → Code Component
   - Name: `CategoryLink`
   - Copy code from section 3 above
   - Add instances to pages where you want category buttons

4. **Test:**
   - Open "Find Your Adventure" page
   - Verify iframe loads
   - Test category links if you added them

---

## 🐛 Troubleshooting

**Iframe doesn't load:**
- Check URL: `https://odd-even.github.io/nelsoncounty/frontpage_framer.html`
- Verify component is added to page
- Check browser console for errors

**Category filtering doesn't work:**
- Make sure URLParamsHelper is on the page
- Check iframe ID matches: `adventure-directory-iframe`
- Verify URL parameters are being passed

**Component errors:**
- Make sure you're using TypeScript (.tsx) files
- Check imports are correct
- Verify React hooks are imported

---

## 📝 File Summary

| File | Required? | Purpose |
|------|-----------|---------|
| `AdventureDirectory.tsx` | ✅ Yes | Main iframe component |
| `URLParamsHelper.tsx` | ⭐ Recommended | URL parameter support |
| `CategoryLink.tsx` | ⭐ Recommended | Category filter buttons |
| `AmenityPills.tsx` | ❌ Optional | Only if displaying amenities outside iframe |

---

## 💡 Pro Tips

1. **Start Simple:** Just add AdventureDirectory first, then add others as needed
2. **Test Incrementally:** Add one component at a time and test
3. **Use Framer's Built-in Links:** You can also use Framer's "Link to Page" feature with URL parameters instead of CategoryLink
4. **Check Console:** Browser console will show postMessage communication for debugging

