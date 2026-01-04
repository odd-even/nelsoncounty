# Google Sheets Update Instructions

## Problem
- Data is misaligned in admin panel
- Accordion columns appear in Google Sheets but are empty
- Some columns may be shifted

## Solution

### Step 1: Update Google Apps Script
1. Open your Google Apps Script editor
2. Copy the ENTIRE contents of `Instruction Files/COMPLETE-GOOGLE-APPS-SCRIPT.gs`
3. Paste it into your Apps Script editor (replace everything)
4. **Save** the script
5. **Redeploy** as Web App:
   - Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the new deployment URL and update it in `admin.js` if needed

### Step 2: Clear and Rebuild Google Sheet
The `replaceAllListings` function will:
- Clear the entire sheet
- Create new headers with all 36 columns (including accordions)
- Write all data with proper alignment

**Important:** Make sure to download a CSV backup first!

### Step 3: Verify Data Flow
1. Open browser console (F12)
2. In admin panel, click "Save All to Google Sheets"
3. Check console for debug messages:
   - `📤 Sending to Google Sheets - First listing sample:` - Should show accordion data
   - If accordion data shows as "(missing)", the CSV import isn't working

### Step 4: If Accordion Data is Missing
The issue is in CSV import. Check:
1. Upload CSV again and check console for:
   - `📊 CSV Parse - Headers:` - Should show 36 headers
   - `🔍 First listing raw row keys:` - Should include accordion fields
   - `🔍 Accordion fields in row:` - Should show accordion data

## Expected Column Order (36 columns)
1. id
2. name
3. slug
4. type
5. category
6. area
7. description
8. detailedDescription (hidden in admin but in data)
9. customHtml
10. image1
11. image1Desc
12. image1FileId
13. image2
14. image2Desc
15. image2FileId
16. image3
17. image3Desc
18. image3FileId
19. website
20. phone
21. address
22. authorName
23. publishedDate
24. modifiedDate
25. directionsLink
26. amenities
27. featured
28. googleMapsUrl
29. accordionPanel1Title
30. accordionPanel1Content
31. accordionPanel2Title
32. accordionPanel2Content
33. accordionPanel3Title
34. accordionPanel3Content
35. accordionPanel4Title
36. accordionPanel4Content

## Notes
- `detailedDescription` is kept in the script because it's in your CSV
- It's hidden in the admin panel (display:none) but still in the data
- The script will create all 36 columns when you save
- Old columns in Google Sheets will be cleared automatically

