# Example Links from Framer Pages

Here are practical examples of how to link to category-filtered views from any page in your Framer site.

## 📍 Example Scenario

**From:** Any page (e.g., "Home", "About", "Contact", etc.)  
**To:** "Find Your Adventure" page with category filter

---

## 🎯 Method 1: Using Framer's Built-in Link Feature (Easiest)

### Example: Link from "Home" page to "Community" category

1. **On your Home page**, create a button or text element
2. **Select the element** → Right-click → "Link to Page"
3. **Select:** "Find Your Adventure" page
4. **Add URL parameter:** `?category=community`

**Result:** When clicked, navigates to:
```
https://your-site.framer.website/find-your-adventure?category=community
```

### Visual Example:

```
┌─────────────────────────────────────┐
│  Home Page                          │
│                                     │
│  [Explore Community] ← Button      │
│  (Links to: /find-your-adventure   │
│   ?category=community)              │
└─────────────────────────────────────┘
              ↓ Click
┌─────────────────────────────────────┐
│  Find Your Adventure Page           │
│  (Filtered to: Community)          │
└─────────────────────────────────────┘
```

---

## 🔗 Method 2: Navigation Menu Example

### Example: Category links in main navigation

**Navigation Bar Component:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Home] [Find Adventure ▼] [About] [Contact]               │
│              │                                               │
│              ├─ [All Adventures]                            │
│              ├─ [Community] → ?category=community           │
│              ├─ [Taste] → ?category=taste                   │
│              ├─ [Experience] → ?category=experience        │
│              ├─ [Outdoor] → ?category=outdoor               │
│              ├─ [Culture] → ?category=culture               │
│              └─ [Stay] → ?category=stay                     │
└─────────────────────────────────────────────────────────────┘
```

**Setup:**
- Each dropdown item links to "Find Your Adventure" page
- Add respective `?category=xxx` parameter to each link

---

## 📱 Method 3: Hero Section Links

### Example: Category cards on homepage

**Home Page Hero Section:**

```
┌─────────────────────────────────────────────────────────┐
│  Welcome to Nelson County                              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 🏘️        │  │ 🍷        │  │ 🏔️        │           │
│  │ Community │  │ Taste     │  │ Outdoor   │           │
│  │           │  │           │  │           │           │
│  │ [Explore] │  │ [Explore] │  │ [Explore] │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 🎭        │  │ 🏛️        │  │ 🛏️        │           │
│  │ Experience│  │ Culture   │  │ Stay      │           │
│  │           │  │           │  │           │           │
│  │ [Explore] │  │ [Explore] │  │ [Explore] │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────┘
```

**Link Setup:**
- "Community" card → `/find-your-adventure?category=community`
- "Taste" card → `/find-your-adventure?category=taste`
- "Outdoor" card → `/find-your-adventure?category=outdoor`
- etc.

---

## 🎨 Method 4: Using Code Component (Advanced)

### Example: Dynamic category link component

**Create a file:** `CategoryLinkButton.tsx`

```tsx
import React from "react"
import { addPropertyControls, ControlType } from "framer"

export default function CategoryLinkButton({ 
    category, 
    label,
    style 
}: { 
    category: string
    label?: string
    style?: React.CSSProperties 
}) {
    const handleClick = () => {
        // Update iframe if it exists
        const iframe = document.getElementById("adventure-directory-iframe") as HTMLIFrameElement
        if (iframe) {
            const currentSrc = iframe.src.split('?')[0]
            iframe.src = `${currentSrc}?category=${category}`
            
            // Also send postMessage
            iframe.contentWindow?.postMessage({
                type: 'setCategory',
                category: category
            }, '*')
        }
        
        // Navigate to Find Your Adventure page
        window.location.href = `/find-your-adventure?category=${category}`
    }
    
    return (
        <button 
            onClick={handleClick}
            style={{
                padding: '12px 24px',
                backgroundColor: '#2d6a4f',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                ...style
            }}
        >
            {label || category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
    )
}

addPropertyControls(CategoryLinkButton, {
    category: {
        type: ControlType.Enum,
        options: ["community", "taste", "experience", "outdoor", "culture", "stay"],
        defaultValue: "community"
    },
    label: {
        type: ControlType.String,
        defaultValue: ""
    }
})
```

**Usage:**
- Add component to any page
- Set category and label in Framer
- Clicking navigates and filters automatically

---

## 📋 Complete Link Reference

### All Category Links:

| Category | Link URL |
|----------|----------|
| All Categories | `/find-your-adventure` |
| Community | `/find-your-adventure?category=community` |
| Taste | `/find-your-adventure?category=taste` |
| Experience | `/find-your-adventure?category=experience` |
| Outdoor | `/find-your-adventure?category=outdoor` |
| Culture | `/find-your-adventure?category=culture` |
| Stay | `/find-your-adventure?category=stay` |

---

## 🎯 Real-World Example: Home Page

**Home Page Structure:**

```
┌─────────────────────────────────────────────────────┐
│  Header: [Logo] [Find Adventure] [About] [Contact] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Hero Section:                                     │
│  "Discover Nelson County"                          │
│                                                     │
│  [Explore All Adventures]                         │
│  → Links to: /find-your-adventure                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Category Grid:                                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ 🏘️ Community │  │ 🍷 Taste      │              │
│  │              │  │              │              │
│  │ Local shops, │  │ Wineries,    │              │
│  │ markets, and │  │ breweries,    │              │
│  │ services     │  │ restaurants   │              │
│  │              │  │              │              │
│  │ [View All →] │  │ [View All →] │              │
│  └──────────────┘  └──────────────┘              │
│  → /find-your-     → /find-your-                  │
│    adventure?        adventure?                    │
│    category=         category=taste                │
│    community                                       │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ 🏔️ Outdoor   │  │ 🎭 Experience│              │
│  │              │  │              │              │
│  │ Hiking,      │  │ Tours,      │              │
│  │ biking, and   │  │ workshops,   │              │
│  │ adventures   │  │ activities   │              │
│  │              │  │              │              │
│  │ [View All →] │  │ [View All →] │              │
│  └──────────────┘  └──────────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Consistent Naming:** Use the same category names everywhere:
   - `community`, `taste`, `experience`, `outdoor`, `culture`, `stay`

2. **Visual Indicators:** Add emojis/icons to match categories:
   - 🏘️ Community
   - 🍷 Taste
   - 🏔️ Outdoor
   - 🎭 Experience
   - 🏛️ Culture
   - 🛏️ Stay

3. **Breadcrumbs:** On "Find Your Adventure" page, show current filter:
   ```
   Home > Find Your Adventure > Community
   ```

4. **Back Navigation:** Make sure "Back" button preserves filter:
   - Use Framer's history/navigation features
   - Or add `?category=xxx` to back links

---

## ✅ Testing Checklist

- [ ] Click link from Home page → Should filter to category
- [ ] Click link from About page → Should filter to category
- [ ] Click link from Contact page → Should filter to category
- [ ] Direct URL access works: `/find-your-adventure?category=community`
- [ ] Browser back button works correctly
- [ ] Mobile navigation works
- [ ] Iframe updates correctly when link clicked

---

## 🐛 Troubleshooting

**Link doesn't filter:**
- Check URL parameter is correct: `?category=community` (not `?Category=Community`)
- Verify iframe is loading `frontpage_framer.html`
- Check browser console for errors

**Iframe doesn't update:**
- Make sure iframe ID matches: `adventure-directory-iframe`
- Check postMessage is being sent (Network tab)
- Try hard refresh (Cmd+Shift+R)

**Navigation doesn't work:**
- Verify page name matches: "Find Your Adventure"
- Check Framer's link settings
- Test with direct URL first

