# Updated Framer Components - Working Version

## ⚠️ Important: Replace Your Old Components

If URL parameters aren't working, you're likely using outdated components. Use these **updated versions** instead.

---

## ✅ Component 1: AdventureDirectory (UPDATED)

**File:** `AdventureDirectory.tsx`  
**What's New:** 
- ✅ Reads URL parameters from Framer page automatically
- ✅ Passes them to iframe via URL and postMessage
- ✅ Updates when URL changes

**Installation:**
1. Delete your old `AdventureDirectory.tsx` (if it exists)
2. Create new file: `AdventureDirectory.tsx`
3. Copy code from `AdventureDirectory-UPDATED.tsx`
4. Add to "Find Your Adventure" page

---

## ✅ Component 2: URLParamsHelper (UPDATED)

**File:** `URLParamsHelper.tsx`  
**What's New:**
- ✅ Responds to iframe requests
- ✅ Proactively sends parameters when URL changes
- ✅ Multiple fallback methods for reliability

**Installation:**
1. Delete your old `URLParamsHelper.tsx` (if it exists)
2. Create new file: `URLParamsHelper.tsx`
3. Copy code from `URLParamsHelper-UPDATED.tsx`
4. Add to "Find Your Adventure" page (same page as AdventureDirectory)

---

## 🔧 How They Work Together

```
┌─────────────────────────────────────────┐
│  Framer Page: "Find Your Adventure"     │
│  URL: /find-your-adventure?category=taste│
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ URLParamsHelper (invisible)     │   │
│  │ - Reads: ?category=taste        │   │
│  │ - Sends to iframe               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ AdventureDirectory              │   │
│  │ - Reads: ?category=taste        │   │
│  │ - Updates iframe URL            │   │
│  │ - Sends postMessage             │   │
│  └─────────────────────────────────┘   │
│         │                                │
│         │ iframe                         │
│         ↓                                │
│  ┌─────────────────────────────────┐   │
│  │ frontpage_framer.html           │   │
│  │ - Receives: ?category=taste     │   │
│  │ - Filters listings              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📋 Quick Setup (5 minutes)

### Step 1: Delete Old Components
- Delete any old `AdventureDirectory.tsx`
- Delete any old `URLParamsHelper.tsx`

### Step 2: Create AdventureDirectory
1. Code tab → New File → `AdventureDirectory.tsx`
2. Copy from `AdventureDirectory-UPDATED.tsx`
3. Save

### Step 3: Create URLParamsHelper
1. Code tab → New File → `URLParamsHelper.tsx`
2. Copy from `URLParamsHelper-UPDATED.tsx`
3. Save

### Step 4: Add to Page
1. Go to "Find Your Adventure" page
2. Add `AdventureDirectory` component
3. Add `URLParamsHelper` component (invisible, but needed)
4. Save

### Step 5: Test
1. Preview your page
2. Add `?category=community` to the URL
3. The iframe should filter to community listings

---

## 🎯 Key Differences from Old Version

### Old Version Problems:
- ❌ Only used `category` prop (not URL params)
- ❌ Didn't read from Framer page URL
- ❌ Didn't update when URL changed

### New Version Fixes:
- ✅ Reads ALL URL parameters automatically
- ✅ Updates iframe URL with parameters
- ✅ Sends postMessage for immediate updates
- ✅ Works with Framer's navigation

---

## 🔍 Testing URL Parameters

After installing, test these URLs:

```
/find-your-adventure?category=community
/find-your-adventure?category=taste
/find-your-adventure?type=Winery
/find-your-adventure?area=Nellysford
/find-your-adventure?search=wine
/find-your-adventure?featured=true
```

All should work now!

---

## 🐛 Troubleshooting

**If parameters still don't work:**

1. **Check component names:**
   - Must be exactly: `AdventureDirectory.tsx`
   - Must be exactly: `URLParamsHelper.tsx`

2. **Check iframe ID:**
   - Must be: `adventure-directory-iframe`
   - Check in browser DevTools → Elements

3. **Check browser console:**
   - Look for postMessage logs
   - Should see: "📨 Requesting URL parameters..."
   - Should see: "🎯 Setting category filter from URL"

4. **Verify components are on page:**
   - Both components must be on "Find Your Adventure" page
   - URLParamsHelper can be anywhere (it's invisible)

5. **Hard refresh:**
   - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Clears cache

---

## ✅ Verification Checklist

- [ ] Deleted old components
- [ ] Created new `AdventureDirectory.tsx` (from UPDATED file)
- [ ] Created new `URLParamsHelper.tsx` (from UPDATED file)
- [ ] Both added to "Find Your Adventure" page
- [ ] Tested with `?category=community` in URL
- [ ] Iframe filters correctly

---

## 📝 File Locations

- Updated components are in: `Framer Code Snippets/`
  - `AdventureDirectory-UPDATED.tsx`
  - `URLParamsHelper-UPDATED.tsx`

Copy these to your Framer project!

