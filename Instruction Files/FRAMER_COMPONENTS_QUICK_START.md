# Framer Components Quick Start

## ✅ What You Need (Minimum)

### 1. AdventureDirectory Component
**This is the ONLY required component** - it embeds your adventure directory.

**Create in Framer:**
- File → New → Code Component
- Name: `AdventureDirectory`
- Copy the code below:

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

**Add to page:**
- Go to your "Find Your Adventure" page
- Add the AdventureDirectory component
- Done! The iframe will load automatically

---

## ⭐ Recommended Addition

### 2. URLParamsHelper Component
**Helps category links work properly** - enables URL parameter filtering

**Create in Framer:**
- File → New → Code Component
- Name: `URLParamsHelper`
- Copy the code below:

```tsx
import { useEffect } from "react"

export default function URLParamsHelper() {
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'getUrlParams' && event.data.source === 'adventure-directory') {
                const params: Record<string, string> = {}
                const searchParams = new URLSearchParams(window.location.search)
                
                for (const [key, value] of searchParams.entries()) {
                    params[key] = value
                }
                
                // Send response back to iframe
                if (event.source && event.source !== window) {
                    (event.source as Window).postMessage({
                        type: 'urlParamsResponse',
                        params: params
                    }, event.origin)
                }
            }
        }

        window.addEventListener('message', handleMessage)

        return () => {
            window.removeEventListener('message', handleMessage)
        }
    }, [])

    return null // This component doesn't render anything
}
```

**Add to page:**
- Same page as AdventureDirectory ("Find Your Adventure")
- It's invisible - just add it and it works automatically

---

## 🎯 Summary

### Minimum Setup (Will Work):
1. ✅ **AdventureDirectory** component on "Find Your Adventure" page

### Recommended Setup (Better):
1. ✅ **AdventureDirectory** component
2. ✅ **URLParamsHelper** component (same page)

### For Category Links:
- Use Framer's built-in "Link to Page" feature
- Link to "Find Your Adventure" page
- Add URL parameter: `?category=community` (or taste, experience, etc.)

---

## 📝 Component Checklist

Copy this checklist:

```
ESSENTIAL:
[ ] AdventureDirectory.tsx - Main iframe component

RECOMMENDED:
[ ] URLParamsHelper.tsx - URL parameter support

OPTIONAL (for category buttons):
[ ] CategoryLink.tsx - Only if you want custom category buttons
```

---

## 🚀 Quick Setup (5 minutes)

1. **Create AdventureDirectory:**
   - Code tab → New File → `AdventureDirectory.tsx`
   - Copy code from above
   - Add to "Find Your Adventure" page

2. **Create URLParamsHelper:**
   - Code tab → New File → `URLParamsHelper.tsx`
   - Copy code from above
   - Add to "Find Your Adventure" page (same page)

3. **Test:**
   - Preview your "Find Your Adventure" page
   - You should see the adventure directory load

4. **Add Category Links (Optional):**
   - Create buttons/text on other pages
   - Use Framer's "Link to Page"
   - Link to "Find Your Adventure"
   - Add `?category=community` etc. to URL

---

## ❓ What Each Component Does

**AdventureDirectory:**
- Embeds your `frontpage_framer.html` in an iframe
- Handles dynamic resizing
- Manages scroll behavior
- **Required** - without this, nothing works

**URLParamsHelper:**
- Listens for URL parameters
- Passes them to the iframe
- Enables category filtering from links
- **Recommended** - makes category links work

**CategoryLink:**
- Creates styled buttons for categories
- Updates iframe when clicked
- **Optional** - you can use Framer's built-in links instead

---

## 🐛 Troubleshooting

**Iframe doesn't show:**
- Check component is added to page
- Verify URL: `https://odd-even.github.io/nelsoncounty/frontpage_framer.html`
- Check browser console for errors

**Category links don't work:**
- Make sure URLParamsHelper is on the page
- Check URL parameter format: `?category=community` (lowercase)
- Verify iframe ID: `adventure-directory-iframe`

**Component errors:**
- Make sure file extension is `.tsx` (TypeScript)
- Check React imports are correct
- Verify you're using Code Components (not Overrides)

---

## 📚 Full Documentation

See `FRAMER_COMPONENTS_GUIDE.md` for complete details on all components.

