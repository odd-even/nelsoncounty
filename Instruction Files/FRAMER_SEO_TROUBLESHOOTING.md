# Framer SEO Component - Troubleshooting

## Error: "Component file does not exist"

This error typically means Framer can't find or load your component file. Here's how to fix it:

### Solution 1: Verify File Location

1. **In Framer**, go to the **Code** tab
2. Make sure the file `framer-seo-schema-component.tsx` exists in your project
3. Check that the file is in the root of your Code directory (not in a subfolder)

### Solution 2: Check Import Path

If you're importing the component in another file, make sure the path is correct:

**Correct:**
```tsx
import SEOSchemaComponent from "./framer-seo-schema-component"
```

**Incorrect:**
```tsx
import SEOSchemaComponent from "./Framer Code Snippets/framer-seo-schema-component"  // ❌ Wrong path
import SEOSchemaComponent from "../framer-seo-schema-component"  // ❌ Wrong if in same directory
```

### Solution 3: Refresh Framer

1. **Save the file** (Cmd/Ctrl + S)
2. **Close and reopen** the file in Framer
3. **Refresh Framer** by closing and reopening the project
4. Check the **Code** tab for any red error indicators

### Solution 4: Check File Name

Make sure the file name matches exactly:
- ✅ `framer-seo-schema-component.tsx`
- ❌ `framer-seo-schema-component.ts` (missing 'x')
- ❌ `FramerSeoSchemaComponent.tsx` (wrong name)
- ❌ `framer-seo-schema-component.tsx.tsx` (double extension)

### Solution 5: Verify Default Export

Make sure your component has a default export:

```tsx
export default function SEOSchemaComponent(props: SEOProps) {
  // ... component code
}
```

### Solution 6: Check for Syntax Errors

1. Open the file in Framer's Code editor
2. Look for **red error indicators** in the left margin
3. Hover over errors to see what's wrong
4. Fix any TypeScript/React errors

### Solution 7: Recreate the File

If nothing else works:

1. **Delete** the existing file in Framer
2. **Create a new file** with the same name
3. **Copy the entire code** from the file
4. **Save** and try again

## Common Issues

### Issue: "Cannot find module 'framer'"

**This is normal!** The linter in your local editor doesn't have Framer's type definitions, but Framer itself does. This error won't prevent the component from working in Framer.

**Solution:** Ignore this error - it only appears in your local editor, not in Framer.

### Issue: "Cannot find module 'react'"

**This is also normal!** Framer provides React automatically, so you don't need to install it.

**Solution:** Ignore this error - Framer handles React internally.

### Issue: Component doesn't appear in Framer

1. Make sure the file is **saved** in Framer
2. Check that you're using **default export** (`export default`)
3. Verify the file has a `.tsx` extension
4. Try **refreshing** Framer

### Issue: Property controls don't show up

1. Make sure `addPropertyControls` is imported from "framer"
2. Verify the component name matches in both the function and `addPropertyControls`
3. Check that all property controls are properly defined

## Step-by-Step Setup Checklist

- [ ] File created in Framer's Code tab
- [ ] File named exactly: `framer-seo-schema-component.tsx`
- [ ] File saved (no unsaved changes indicator)
- [ ] No red error indicators in Framer's Code editor
- [ ] Component has `export default`
- [ ] Import path is correct (if importing elsewhere)
- [ ] Framer project refreshed/reloaded

## Still Having Issues?

1. **Check Framer's Console**: Look for error messages in Framer's developer console
2. **Simplify First**: Try using the component with minimal props to isolate the issue
3. **Compare with Working Component**: Look at other working components in your project to see the pattern
4. **Framer Support**: If all else fails, check Framer's documentation or support

## Quick Test

To quickly test if the component works:

1. Create a simple test file in Framer:
```tsx
import SEOSchemaComponent from "./framer-seo-schema-component"

export default function TestPage() {
  return (
    <SEOSchemaComponent
      pageType="listing"
      name="Test Business"
      type="Restaurant"
      area="Nelson County"
      description="Test description"
    />
  )
}
```

2. If this works, the component is fine - the issue is with how you're using it
3. If this doesn't work, there's an issue with the component file itself

