# Admin Panel Accordion Editing Update

## Summary
Updated the admin panel to allow editing of accordion panel content directly in the data table.

## Changes Made

### 1. Table Header (`index-sheets.html`)
- **Removed:** `detailedDescription` column header
- **Added:** 8 new accordion columns:
  - Accordion Panel 1 Title
  - Accordion Panel 1 Content
  - Accordion Panel 2 Title
  - Accordion Panel 2 Content
  - Accordion Panel 3 Title
  - Accordion Panel 3 Content
  - Accordion Panel 4 Title
  - Accordion Panel 4 Content

### 2. Filter Row (`index-sheets.html`)
- **Removed:** Filter input for `detailedDescription`
- **Added:** Filter inputs for all 8 accordion fields

### 3. Table Row Rendering (`admin.js`)
- **Removed:** `detailedDescription` textarea cell
- **Added:** 8 new cells for accordion panels:
  - Title fields: Text inputs with placeholders
  - Content fields: Textareas with placeholders
  - All fields have `data-field` attributes for automatic saving

### 4. CSV Export (`admin.js`)
- **Removed:** `detailedDescription` from CSV headers and export
- **Added:** All 8 accordion fields to CSV export:
  - `accordionPanel1Title`, `accordionPanel1Content`
  - `accordionPanel2Title`, `accordionPanel2Content`
  - `accordionPanel3Title`, `accordionPanel3Content`
  - `accordionPanel4Title`, `accordionPanel4Content`

### 5. CSS Styling (`admin.css`)
- **Added:** Styles for accordion cells:
  - `.cell-accordion-title`: 150-200px width, 12px font
  - `.cell-accordion-content`: 250-350px width, 80px min-height textarea
  - Textareas are resizable and preserve whitespace

## How It Works

### Editing Accordion Content
1. Navigate to the **Data Table** tab in the admin panel
2. Scroll horizontally to find the accordion columns (after Featured column)
3. Edit accordion panel titles and content directly in the table cells
4. Click **Save Changes** to persist your edits

### Automatic Saving
The save function automatically detects and saves all fields with `data-field` attributes, including the new accordion fields. No additional code changes needed.

### CSV Export
When exporting to CSV, all accordion fields are included in the export file, maintaining the same structure as the consolidated CSV format.

## Field Structure

Each accordion panel has two fields:
- **Title**: Short text input (e.g., "History", "Menu & Offerings", "Contact & Location")
- **Content**: Multi-line textarea for the panel content

## Notes

- The `detailedDescription` column has been removed from the table view but may still exist in the data structure for backward compatibility
- Accordion fields are optional - listings can have 0-4 panels
- Empty accordion fields are exported as empty strings in CSV
- All accordion content is plain text (no HTML) as per the consolidation process

## Testing

To verify the update works:
1. Open the admin panel
2. Navigate to Data Table tab
3. Verify you see 8 new accordion columns
4. Edit an accordion field and save
5. Export to CSV and verify accordion fields are included

