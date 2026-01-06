# Framer Components - Complete Install List

## 📋 Components to Install on "Find Your Adventure" Page

Install these **2 components** on your "Find Your Adventure" page:

---

## ✅ Component 1: AdventureDirectory

**File Name:** `AdventureDirectory.tsx`  
**Purpose:** Embeds the adventure directory iframe  
**Required:** ✅ Yes

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

---

## ✅ Component 2: URLParamsHelper

**File Name:** `URLParamsHelper.tsx`  
**Purpose:** Enables URL parameter passing to iframe (for category filtering)  
**Required:** ✅ Yes (for category links to work)

**Code:**

```tsx
import { useEffect } from "react"

export default function URLParamsHelper() {
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'getUrlParams' && event.data.source === 'find-your-adventure') {
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

---

## 📝 Installation Steps

### Step 1: Create AdventureDirectory Component

1. In Framer, go to **Code** tab
2. Click **+ New File**
3. Name it: `AdventureDirectory.tsx`
4. Copy the code from Component 1 above
5. Save (Cmd/Ctrl + S)

### Step 2: Create URLParamsHelper Component

1. In Framer, go to **Code** tab
2. Click **+ New File**
3. Name it: `URLParamsHelper.tsx`
4. Copy the code from Component 2 above
5. Save (Cmd/Ctrl + S)

### Step 3: Add Both to "Find Your Adventure" Page

1. Go to your **"Find Your Adventure"** page in Framer
2. Add **AdventureDirectory** component (this will show the iframe)
3. Add **URLParamsHelper** component (invisible, but needed for URL params)
4. Position doesn't matter for URLParamsHelper - it's invisible

---

## 🎯 Component Summary

| Component | File Name | Required? | Visible? | Purpose |
|-----------|-----------|-----------|----------|---------|
| AdventureDirectory | `AdventureDirectory.tsx` | ✅ Yes | ✅ Yes | Embeds the iframe |
| URLParamsHelper | `URLParamsHelper.tsx` | ✅ Yes | ❌ No | Handles URL parameters |

---

## ✅ Verification Checklist

After installing, verify:

- [ ] AdventureDirectory component is on "Find Your Adventure" page
- [ ] URLParamsHelper component is on "Find Your Adventure" page
- [ ] Iframe loads when you preview the page
- [ ] Category links work (if you've added them)

---

## 🔗 Optional: Category Links

If you want to add category filter buttons, you can also install:

**Component 3: CategoryLink** (Optional)
- File: `CategoryLink.tsx`
- Use if you want custom category buttons
- OR use Framer's built-in "Link to Page" feature instead

See `framer-category-links.tsx` for the code if needed.

---

## 🐛 Troubleshooting

**If iframe doesn't load:**
- Check AdventureDirectory component is added to page
- Verify URL: `https://odd-even.github.io/nelsoncounty/frontpage_framer.html`
- Check browser console for errors

**If category links don't work:**
- Make sure URLParamsHelper is on the same page
- Verify source matches: `'find-your-adventure'`
- Check iframe ID: `adventure-directory-iframe`

---

## 📚 That's It!

You only need **2 components** on your "Find Your Adventure" page:
1. ✅ AdventureDirectory (visible - shows the directory)
2. ✅ URLParamsHelper (invisible - handles URL params)

Everything else is optional!

