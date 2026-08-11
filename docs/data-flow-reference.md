# Nelson County Directory — Reference Sheet

Companion to `docs/data-flow.mmd`. Same numbering. Print or attach side-by-side.

---

## 1.0  Who edits what

### 1.1  Nelson staff (authorized emails only)
- **Listings** — add / edit / remove via the admin panel, then click **Save to Sheets**.
- **Framer site** — open the Framer project, **Sync** the Listings CMS from Google Sheets, then **Publish**.
- Does **not** edit: GitHub repo code, Apps Script code, the exporter script, or the workflow YAML.

### 1.2  Build partner (Odd+Even — repo / PR access)
- Admin UI source — `index.html`, `admin.css`
- Directory page — `frontpage_framer.html`
- Exporter script — `scripts/sheets_csv_to_json.mjs`
- Scheduled workflow — `.github/workflows/export-sheet.yml`
- Apps Script web app — project lives in Google Drive
- Escalation point if anything in 3.x or 5.x is failing.

### 1.3  Automatic — nobody clicks
The GitHub Action in **3.4** runs on a schedule (every 5 minutes). No human action triggers it during normal operation.

---

## 2.0  Staff workflow (do these in order)

### 2.1  Open admin
- URL: **https://odd-even.github.io/nelsoncounty/**
- The home page IS the admin panel. Bookmark it.

### 2.2  Log in (email OTP)
1. Type your authorized email.
2. Click **Send Verification Code**.
3. Check email; copy the 6-digit code.
4. Enter the code, click **Verify Code**.
- New colleague can't log in? Have an admin add their email in **Settings → Authorized Emails → Sync to Server**.

### 2.3  Edit listing
- Use search / sort / column filters in the table.
- Click any row to open the editor, or click **+ Add Listing**.
- Editable fields include name, type, area, address, hours, description, photos, website, phone, social links, video embed, and "Custom HTML (Framer Only)".

### 2.4  Save to Sheets
- Click the green **Save to Sheets** button (top-right of the admin panel).
- A spinner appears, then a green check + "Last Sync" timestamp updates.
- A red error means the change did **not** save — check connection and retry.

### 2.5  Framer — Sync Listings CMS
1. Open the Nelson County Framer project.
2. Open the **Listings** CMS collection in the left panel.
3. Click **Sync** (or **Refresh from Google Sheets**) on the data source.
4. Wait for "Up to date."

### 2.6  Framer — Publish
- Click the blue **Publish** button (top-right of Framer).
- Wait for "Published" confirmation.
- This refreshes the Framer-rendered pages (homepage, listing detail pages, etc.). The directory iframe (4.2) updates automatically within ~5 minutes regardless.

---

## 3.0  Automatic backend (after Save to Sheets)

### 3.1  Apps Script (web app)
- Receives the Save request from the admin panel and writes the row into the Google Sheet.
- Also handles email OTP send + verify against the authorized-email allowlist.
- Deployed URL is referenced inside `index.html` (variable `GOOGLE_APPS_SCRIPT_URL`).

### 3.2  Google Sheet (master data)
- Single source of truth.
- One row per listing.
- Read by both the admin panel and the Framer Listings CMS.

### 3.3  Published CSV
- Sheet → **File → Share → Publish to web**, format CSV.
- Public **read-only** URL (no login).
- Separate from "who can edit the Sheet" — publishing is intentionally public.

### 3.4  GitHub Action — `.github/workflows/export-sheet.yml`
Runs the exporter (3.5) on three triggers:
- **Cron** — every 5 minutes.
- **workflow_dispatch** — manual run from the Actions tab.
- **Push to `main`** — only when the exporter script or this YAML file changes.

### 3.5  Exporter script — `scripts/sheets_csv_to_json.mjs`
1. Fetches the published CSV (3.3).
2. Parses CSV into the same row shape the admin panel uses.
3. **Omits rows where `private` is true** (so private listings never ship in the public JSON).
4. Writes `data/listings.json`.
5. Commits the change to git **only if the listing bytes actually changed** (skips timestamp-only churn so the repo doesn't get noisy commits).

### 3.6  `data/listings.json`
- Committed in the repo at `data/listings.json`.
- Served as a static file by GitHub Pages (3.7).
- Public/directory feed only — private listings are excluded at export time (admin still loads the full sheet).

### 3.7  GitHub Pages
- URL: **https://odd-even.github.io/nelsoncounty/**
- Hosts:
  - `index.html` (the admin panel)
  - `frontpage_framer.html` (the directory iframe)
  - `/data/listings.json` (the static feed)

> **End-to-end lag:** typically **2–7 minutes** from "Save to Sheets" to "visitor sees the change," assuming Framer Sync + Publish (2.5–2.6) are also done for non-iframe pages.

---

## 4.0  Public consumption (what visitors see)

### 4.1  Framer site
- Hosts **nelsoncounty.com**.
- Marketing pages and listing detail pages are built in Framer.
- Framer's Listings CMS reads the **same** Google Sheet (3.2).
- One Framer page embeds the directory iframe (4.2).

### 4.2  Directory iframe — `frontpage_framer.html`
- Searchable list of listings + Google Map view.
- Loaded inside Framer via `<iframe src="https://odd-even.github.io/nelsoncounty/frontpage_framer.html">`.

### 4.3  Data loader (in the iframe)
On page load, the iframe tries each data source below in order until one returns valid rows.

### 4.4  Source 1 — `data/listings.json` (PRIMARY)
- Fetched from the same origin under `/nelsoncounty/`.
- A cache-bust query parameter is appended each load.
- This is what's used **~99% of the time**.

### 4.5  Source 2 — live published Sheet CSV (fallback)
- Direct fetch from `docs.google.com`.
- Used if Source 1 is missing, returns an error, or returns no rows.

### 4.6  Source 3 — raw GitHub `data/config.json` (fallback)
- Used if both 4.4 and 4.5 fail.

### 4.7  Source 4 — embedded fallback array (last resort)
- ~15 listings hardcoded in `frontpage_framer.html`.
- Ensures the page is **never empty**, even if everything upstream is offline.
- If visitors see only ~15 listings, source 4 is in effect — alert the build partner.

### 4.8  Title + JSON-LD update
After rows load, the page runs:
- `updateHeadFromData()` — sets `<title>` and meta tags.
- `updateStructuredData()` — writes Schema.org JSON-LD into `<head>` (`TouristDestination` + a sample of place children).

### 4.9  Visitor
Sees the directory UI: cards, filters, search, and the map.

---

## 5.0  Audit trail (where to look if something looks wrong)

### 5.1  Sheet history
- Google Sheet → **File → Version history → See version history**.
- Shows every cell change, who, when. Can restore.

### 5.2  GitHub commits
- GitHub repo → commits filtered to `data/listings.json`.
- Shows exactly what JSON shipped and when.

### 5.3  GitHub Actions run logs
- GitHub repo → **Actions → Export Google Sheet to data/listings.json**.
- Each run's full log; useful when the exporter starts failing.

### 5.4  Apps Script execution log
- Apps Script project → **Executions** tab.
- Shows save errors and failed OTP attempts (subject to Google's retention).

---

## 6.0  If something breaks

### 6.1  Wrong listing data
Sheet (3.2) → version history → restore the row. JSON pipeline picks up automatically within 5 minutes.

### 6.2  Bad JSON shipped to listings.json
- `git revert` the offending commit on `data/listings.json`.
- The next scheduled run of 3.4 will repopulate from the current Sheet state.

### 6.3  Apps Script down
- Iframe falls through to **Source 2** live CSV (4.5). Public site keeps working.
- Editing is blocked until Apps Script returns. Build partner investigates 5.4.

### 6.4  Sheet or publish-to-web link down
- Iframe keeps showing the **last good `listings.json`** from Source 1 (4.4).
- Editing is blocked until the Sheet is reachable.

### 6.5  Total upstream outage
- Iframe falls all the way through to **Source 4** embedded listings (4.7).
- Page is degraded but never blank.

### 6.6  Framer embed broken (iframe doesn't appear on nelsoncounty.com)
- Directory is still reachable directly: **https://odd-even.github.io/nelsoncounty/frontpage_framer.html**
- Build partner reviews the Framer page that embeds the iframe.

---

## Glossary (quick)

- **Admin panel** — `index.html` on GitHub Pages; where staff edit listings.
- **Apps Script** — Google's automation glue between admin panel and Google Sheet.
- **Google Sheet** — master listings data.
- **CSV** — Sheet exported as a flat comma-separated file.
- **GitHub Action** — scheduled job that converts CSV to JSON.
- **`listings.json`** — the static file the public iframe reads.
- **GitHub Pages** — free static hosting for the admin and the iframe.
- **Framer** — design tool that builds the marketing site.
- **Framer CMS** — Framer's own data layer that reads the same Google Sheet.
- **iframe** — embedded "window" on the Framer page that shows the directory.
- **JSON-LD** — Schema.org structured data injected into the iframe's `<head>` for search engines.
