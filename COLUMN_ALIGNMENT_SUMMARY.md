# Column Alignment Summary

## Consolidated CSV (35 columns)
1. id
2. name
3. slug
4. type
5. category
6. area
7. description
8. customHtml
9. image1
10. image1Desc
11. image1FileId
12. image2
13. image2Desc
14. image2FileId
15. image3
16. image3Desc
17. image3FileId
18. website
19. phone
20. address
21. authorName
22. publishedDate
23. modifiedDate
24. directionsLink
25. amenities
26. featured
27. googleMapsUrl
28. accordionPanel1Title
29. accordionPanel1Content
30. accordionPanel2Title
31. accordionPanel2Content
32. accordionPanel3Title
33. accordionPanel3Content
34. accordionPanel4Title
35. accordionPanel4Content

## Admin Panel Table (37 columns - includes hidden detailedDescription + actions)
Same as CSV but:
- Position 8: detailedDescription (HIDDEN, display:none)
- Position 9: customHtml (shifted from CSV position 8)
- Position 37: actions

## Google Apps Script (35 columns - matches CSV)
✅ FIXED: Removed detailedDescription from CANONICAL_LISTING_HEADERS

## Issues to Check:
1. Table headers alignment - verify headers match data cells
2. Accordion data not showing - check if data is in listing objects
3. Edit modal not showing accordion - check if editListing populates fields

## Debug Logging Added:
- renderDataTable: Logs accordion data for first listing
- editListing: Logs accordion data when opening edit modal
- loadDataFromGoogleSheets: Logs accordion data from Google Sheets
- mapCSVRowToListing (index-sheets.html): Logs accordion mapping during CSV upload
