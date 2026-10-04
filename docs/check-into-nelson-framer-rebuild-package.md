# Check Into Nelson — Framer Rebuild Package

Use this document with **Framer AI** (or a human builder) to rebuild the campaign page natively on nelsoncounty.com, without showing GitHub Pages URLs on hover.

**Live reference (current HTML):**  
https://visit.nelsoncounty.com/

**Repo source:** `check-into-nelson.html`  
**Current Framer iframe wrapper:** `embeds/check-into-nelson-framer.html`

**Public asset host (use these absolute URLs — Framer AI can fetch them):**  
`https://visit.nelsoncounty.com/`

---

## Asset catalog (absolute URLs for Framer AI)

Framer AI / Assets panel: paste or download from these URLs. Do **not** use relative `assets/...` paths.

### Local campaign photos (GitHub Pages)

| Use | Absolute URL |
|-----|----------------|
| Hero slide 1 / Farmhouse stay / chip | https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg |
| Hero slide 2 / Tunnel (local) | https://visit.nelsoncounty.com/assets/check-into-nelson/blue-ridge-tunnel.jpg |
| Hero slide 3 / Campground stay / chip | https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg |

### Partner photos (ImageKit — already public CDN)

| Partner | Feature / hero-size | Chip 80×80 | Timeline 400×400 |
|---------|---------------------|------------|------------------|
| Flying Fox | https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-1200,h-820,fo-auto,q-75 | https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-80,h-80,fo-auto,q-70 | https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-400,h-400,fo-auto,q-75 |
| Glass Hollow | https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-1200,h-820,fo-auto,q-75 | https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-80,h-80,fo-auto,q-70 | https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-400,h-400,fo-auto,q-75 |
| Blue Ridge Tunnel | https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-1200,h-820,fo-auto,q-75 | https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-80,h-80,fo-auto,q-70 | https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-400,h-400,fo-auto,q-75 |
| Devils Backbone Brewing | https://ik.imagekit.io/OE/nelson-county/listings/devils-backbone-brewing-company-image1_xOCX-_l34?tr=w-1200,h-820,fo-auto,q-75 | — | https://ik.imagekit.io/OE/nelson-county/listings/devils-backbone-brewing-company-image1_xOCX-_l34?tr=w-400,h-400,fo-auto,q-75 |
| Reliable Rides (scenic stand-in) | https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-1200,h-820,fo-auto,q-75 | https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-80,h-80,fo-auto,q-70 | https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-400,h-400,fo-auto,q-75 |
| Crabtree Falls | — | — | https://ik.imagekit.io/OE/nelson-county/listings/crabtree-falls-image1_IXQ2lOEKu?tr=w-400,h-400,fo-auto,q-75 |
| Spy Rock | — | — | https://ik.imagekit.io/OE/nelson-county/listings/spy-rock-image1_1KwRYk5CN?tr=w-400,h-400,fo-auto,q-75 |
| Tye River | — | — | https://ik.imagekit.io/OE/nelson-county/listings/tye-river-image1_obd32khA6?tr=w-400,h-400,fo-auto,q-75 |

### Optional PDFs (footer / guides)

| File | Absolute URL |
|------|----------------|
| Bus tour flyer | https://ik.imagekit.io/OE/nelson-county/Bus-Tour-Flyer-8.5x11.pdf |
| Visitor card | https://ik.imagekit.io/OE/nelson-county/Nelson-County-Visitor-Card.pdf |

### Code assets (absolute URLs — Framer AI can open / fetch)

Use **GitHub Pages** for anything an Embed or `<script src>` / `<link>` should load in the browser.  
Use **raw.githubusercontent.com** when Framer AI should read the source text.

| Code asset | What it’s for | Browser / Embed URL (GitHub Pages) | Source text URL (raw) |
|------------|---------------|--------------------------------------|------------------------|
| Full campaign page | Visual + behavior reference; full-page or itinerary embed | https://visit.nelsoncounty.com/ | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/check-into-nelson.html |
| Embed with `?embed=1` | Framer iframe src (bump `&v=` after deploys) | https://visit.nelsoncounty.com/?embed=1&v=20261003a | (same HTML source as above) |
| Framer embed wrapper | Parent iframe + height/scroll/viewport/exit `postMessage` script — paste into Framer Embed | https://visit.nelsoncounty.com/embeds/check-into-nelson-framer.html | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/embeds/check-into-nelson-framer.html |
| This rebuild package | Full Framer AI brief | — | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-framer-rebuild-package.md |
| Website copy deck | Alternate copy source | — | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-website-copy.md |
| Footer CSS | Only if reusing exported footer styles | https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer.css | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/assets/check-into-nelson/nelsoncounty-footer.css |
| Footer bridge CSS | CIN + footer tweaks | https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer-bridge.css | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/assets/check-into-nelson/nelsoncounty-footer-bridge.css |
| Footer JS | Footer Subscribe / interactions | https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer.js | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/assets/check-into-nelson/nelsoncounty-footer.js |
| Footer HTML fragment | Reference markup (prefer site Framer footer) | https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer.fragment.html | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/assets/check-into-nelson/nelsoncounty-footer.fragment.html |
| Footer sprites | SVG sprite reference | https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer-sprites.svg.html | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/assets/check-into-nelson/nelsoncounty-footer-sprites.svg.html |
| Legacy script shell | Older script host page (optional) | https://visit.nelsoncounty.com/check-into-nelson-script.html | https://raw.githubusercontent.com/odd-even/nelsoncounty/main/check-into-nelson-script.html |

**How Framer AI should use code assets**
1. Open the **raw** URL, read the file, and adapt / paste into Custom Code or an Embed.
2. For a live Embed `src`, use the **GitHub Pages** URL (not raw).
3. Prefer the **site’s existing Framer header/footer** over re-embedding `nelsoncounty-footer.*` unless you are matching the HTML page 1:1.
4. Small helpers (copy button, sticky bar) are also inlined in **Part C** below — those can be pasted directly without fetching.

### Live page preview (visual reference)

https://visit.nelsoncounty.com/

---

## How to use with Framer AI

1. Create a new Framer page (suggested path: `/check-into-nelson`).
2. Paste **Part A — Master Prompt** into Framer AI first (it includes image + code asset URLs).
3. Optionally tell Framer AI to fetch:  
   `https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-framer-rebuild-package.md`
4. Paste **Part B — Section Specs** one section at a time (or all at once if the model can handle it).
5. Paste **Part C — Code Snippets**, or have Framer AI pull the embed wrapper from the raw URL in the code catalog.
6. For the interactive itinerary + exit popup, either:
   - keep a slim HTML embed (recommended short-term), or
   - rebuild later as a Code Component.

**Asset tip:** If Framer AI cannot remote-fetch images, manually upload from the absolute image URLs above. For code, open the raw URL → copy → paste into Custom Code / Embed.

---

# Part A — Master Prompt (copy/paste into Framer AI)

```text
Build a marketing landing page for the Nelson County tourism campaign “Check Into Nelson”.

GOAL
- Native Framer page on nelsoncounty.com so in-page links show nelsoncounty.com URLs (not github.io).
- Match the look/feel of the existing HTML campaign (clean, editorial, not a dashboard).
- Site header/nav and site footer come from the existing Nelson County Framer site — do not rebuild those inside this page body.

ASSETS — DOWNLOAD / USE THESE ABSOLUTE URLS (do not invent placeholders)
Hero / lodging photos:
- https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg
- https://visit.nelsoncounty.com/assets/check-into-nelson/blue-ridge-tunnel.jpg
- https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg

Partner feature images (ImageKit CDN):
- Flying Fox: https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-1200,h-820,fo-auto,q-75
- Glass Hollow: https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-1200,h-820,fo-auto,q-75
- Blue Ridge Tunnel: https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-1200,h-820,fo-auto,q-75
- Devils Backbone: https://ik.imagekit.io/OE/nelson-county/listings/devils-backbone-brewing-company-image1_xOCX-_l34?tr=w-1200,h-820,fo-auto,q-75
- Reliable Rides: https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-1200,h-820,fo-auto,q-75

Partner chip thumbs (80×80):
- Flying Fox: https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-80,h-80,fo-auto,q-70
- Glass Hollow: https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-80,h-80,fo-auto,q-70
- Tunnel: https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-80,h-80,fo-auto,q-70
- Reliable Rides: https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-80,h-80,fo-auto,q-70
- Farmhouse chip: https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg
- Campground chip: https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg

Visual reference page: https://visit.nelsoncounty.com/

CODE ASSETS — FETCH THESE IF YOU NEED SOURCE (use raw URLs to read; Pages URLs for Embed src)
- Full page HTML source: https://raw.githubusercontent.com/odd-even/nelsoncounty/main/check-into-nelson.html
- Framer embed wrapper (iframe + parent postMessage): https://raw.githubusercontent.com/odd-even/nelsoncounty/main/embeds/check-into-nelson-framer.html
- Live embed src: https://visit.nelsoncounty.com/?embed=1&v=20261003a
- This package (raw): https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-framer-rebuild-package.md
- Footer CSS (only if needed): https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer.css
- Footer JS (only if needed): https://visit.nelsoncounty.com/assets/check-into-nelson/nelsoncounty-footer.js
Do not reinvent the itinerary/drag-drop from scratch — embed the live page or adapt from the HTML source above.

BRAND / DESIGN SYSTEM
- Font: Satoshi (400/500/700) for UI/body. Use Poppins ExtraBold (800) only for “NELSON” in the promo code lockup if available; otherwise Satoshi 700.
- Colors:
  - Ink #333333
  - Black #111111
  - Muted #666666
  - Line #ECECEC
  - White #FFFFFF
  - Nelson green #2D6A4F (promo code)
  - Category accents:
    Stay #57D1AE / text #1A7A62
    Taste #E5675C / text #B33A32
    Culture #8B5CF6 / text #5B21B6
    Experience #F1B918 / text #8A6500
    Community #A3BB12 / text #5C6B0A
    Outdoor #7575B5 / text #45458A
- Content max-width: 1500px
- Section padding: generous vertical rhythm (~56–96px)
- Border radius: 20px for cards/media; pills 999px for buttons
- Buttons: pill shape, solid dark (#111) primary, outline secondary, light/ghost variants for hero on dark media
- Avoid purple-gradient AI look, cream+terracotta cliché, dense newspaper layout, and card clutter in the hero

HERO RULES
- Full-bleed edge-to-edge hero image/slideshow (not an inset card)
- First viewport: brand/campaign name, one tagline, one short lede, CTA group, dominant image. No stats strip, no schedule, no address block in the hero.
- Campaign name is the hero signal: “Check Into Nelson”
- Tagline: “Stay Longer. Experience More.”

PAGE STRUCTURE (in order)
1. Hero (slideshow + promo panel)
2. Partner strip (jump chips)
3. Intro / The getaway
4. Choose your stay (2 lodging cards)
5. Build your experience (partner features)
6. Itinerary embed slot (interactive builder — keep as embed for now)
7. Passport / LoyalBrew
8. Promo code section
9. Closing book CTA
(Footer is site-wide Framer footer)

CMS
Create a CMS collection “CIN Partners” with fields listed in the package. Bind stay cards + experience features + partner chips to it where possible. Put the absolute image URLs above into each CMS image field (or upload them into Framer Assets from those URLs).

INTERACTIONS (Framer-native where possible)
- Hero image slideshow autoplay ~5.5s with dots
- Scroll reveals: fade/rise sections as they enter view (respect reduced motion)
- Promo code copy-to-clipboard (Custom Code snippet provided)
- Sticky bottom promo bar after scrolling past hero, hide near promo section and on small screens (Custom Code or Framer sticky)
- In-page anchors use https://visit.nelsoncounty.com/#section-id (or relative page hash) so hover URLs are clean

DO NOT rebuild the full drag-and-drop itinerary in Framer Components yet.
Leave a full-width Embed slot labeled “Itinerary” that can load the existing HTML itinerary (or full page) temporarily.

PROMO CODE
Literal code string: CHECKINTONELSON
Visual lockup colors: CHECKIN + TO in green #2D6A4F, NELSON heavier weight.

ANALYTICS
GA4 property G-9GZ2Y2JTC9 (site may already load it). Track clicks with data attributes listed in the package.
```

---

# Part B — Section Specs (copy/paste)

## 1) Hero

**Layout:** Full-bleed background slideshow. Bottom-aligned content. Desktop: 2 columns — main copy left, promo aside right.

**Copy**
- H1: Check Into Nelson
- Tagline: Stay Longer. Experience More.
- Lede: Trade the rushed day trip for a few days of Blue Ridge views, local wine, creative experiences, and outdoor adventure — with room to slow down.
- Primary CTA: Choose Your Stay → `#stay`
- Secondary CTA: Explore the Experience → `#experience`

**Promo aside**
- Label: Promo code
- Title: Save with CHECKINTONELSON
- Body: Participating businesses are offering special incentives to help you stay longer and experience more of Nelson County. Copy the code before you book.
- Code pill: CHECKINTONELSON + Copy button

**Images (hero slides) — pull from these URLs**
1. Farmhouse at Veritas — https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg
2. Blue Ridge Tunnel — https://visit.nelsoncounty.com/assets/check-into-nelson/blue-ridge-tunnel.jpg
3. Devils Backbone — https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg

Upload into Framer Assets from those URLs (or set Image fills to the URLs directly if supported).

**Section ID for anchors:** (page top is fine; stay/experience IDs below)

---

## 2) Partner strip

**Eyebrow/label:** Participating partners

**Chips (image + name → scroll to feature)**

| Label | Anchor | Image URL |
|-------|--------|-----------|
| Farmhouse at Veritas | `#feature-farmhouse` | https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg |
| Devils Backbone Campground | `#feature-devils-backbone-camp` | https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg |
| Flying Fox Vineyard | `#feature-flying-fox` | https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-80,h-80,fo-auto,q-70 |
| Glass Hollow Studio | `#feature-glass-hollow` | https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-80,h-80,fo-auto,q-70 |
| Blue Ridge Tunnel | `#feature-tunnel` | https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-80,h-80,fo-auto,q-70 |
| Reliable Rides | `#feature-rides` | https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-80,h-80,fo-auto,q-70 |

Horizontal wrap row of pill chips with small square thumbnails.

---

## 3) Intro (`#about`)

**Eyebrow:** The getaway  
**Title:** A Blue Ridge getaway that gives you time to enjoy it  
**Body:** Nelson County is close enough for an easy drive, but it deserves more than a quick visit. Check in during the week, settle into the scenery, and experience the county at your own pace — tasting local wine, visiting makers, exploring the outdoors, and discovering places worth lingering over.  
**Aside:** With participating lodging, attractions, and experiences gathered in one place, planning your stay is simple.

---

## 4) Choose your stay (`#stay`)

**Eyebrow:** Choose your stay  
**Title:** Two home bases. One promo code.  
**Copy:** Plan a two-night escape or settle in for three or four days. Participating businesses offer special incentives with CHECKINTONELSON to help you stay longer and experience more.

### Card A — `#feature-farmhouse`
- Offer: Special incentive with CHECKINTONELSON
- Title: Farmhouse at Veritas
- Copy: Wake up in the heart of Virginia wine country. Vineyard views, thoughtful hospitality, and an ideal home base for exploring Nelson County.
- CTA: Book the Farmhouse → https://www.veritasfarmhouse.com/
- Image: https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg

### Card B — `#feature-devils-backbone-camp`
- Offer: Special incentive with CHECKINTONELSON
- Title: Devils Backbone Campground
- Copy: Settle into the Blue Ridge where outdoor stays, mountain scenery, craft beverage experiences, and on-site agritourism come together.
- CTA: Book Your Stay → https://www.dbbrewingcompany.com/camp-at-basecamp
- Image: https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg

---

## 5) Build your experience (`#experience`)

**Eyebrow:** Build your experience  
**Title:** Stay longer. Choose what fits your pace.  
**Copy:** Stay for two nights or make it a three- to four-day getaway. Mix sip, create, explore, and get-around stops into a trip that feels like your own.

### Feature blocks (alternate image left/right)

**Flying Fox** `#feature-flying-fox` · badge Sip · cat taste  
- Role: Wine country  
- Copy: Discover thoughtfully made Virginia wine in a relaxed, character-filled setting. Stop in for a tasting, take in the atmosphere, and enjoy another side of Nelson County wine country.  
- Meta: CHECKINTONELSON · Special incentive  
- CTAs: Visit Flying Fox Vineyard → https://www.flyingfoxvineyard.com/  
  View on nelsoncounty.com → https://nelsoncounty.com/explore/flying-fox-vineyards  
- Image: https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-1200,h-820,fo-auto,q-75

**Glass Hollow** `#feature-glass-hollow` · badge Create · cat culture  
- Role: Hands-on artistry  
- Copy: Add something hands-on to your stay. Experience local artistry, explore the glassblowing process, and create a memorable stop beyond the traditional tasting room.  
- Meta: CHECKINTONELSON · Special incentive when booking  
- CTAs: Explore Glass Hollow Studio → https://www.glasshollow.com/visit  
  View on nelsoncounty.com → https://nelsoncounty.com/explore/glasshollow  
- Image: https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-1200,h-820,fo-auto,q-75

**Blue Ridge Tunnel** `#feature-tunnel` · badge Explore · cat outdoor  
- Role: Historic outdoors  
- Copy: Walk through one of Nelson County’s most distinctive historic attractions — a memorable mix of mountain scenery, local history, and outdoor exploration.  
- CTAs: Plan Your Visit → https://nelsoncounty.com/explore/blue-ridge-tunnel/  
  Add to your sample stay → `#itinerary`  
- Image: https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-1200,h-820,fo-auto,q-75

**Devils Backbone** `#feature-devils-backbone` · badge Experience more · cat experience  
- Role: Craft & agritourism  
- Copy: Beyond the campground, explore agricultural and craft beverage culture — working greenhouses, locally grown ingredients, and the Basecamp experience.  
- CTAs: Explore Devils Backbone → https://www.dbbrewingcompany.com/  
  View on nelsoncounty.com → https://nelsoncounty.com/explore/devils-backbone-brewing-company  
- Image: https://ik.imagekit.io/OE/nelson-county/listings/devils-backbone-brewing-company-image1_xOCX-_l34?tr=w-1200,h-820,fo-auto,q-75

**Reliable Rides** `#feature-rides` · badge Get around · cat community  
- Role: Transportation  
- Copy: Spend less time thinking about transportation and more time enjoying your stay. Reliable Rides can help you travel safely and conveniently between participating stops.  
- Meta: CHECKINTONELSON when arranging your ride  
- CTAs: Arrange Transportation → `#book`  
  See it on the timeline → `#itinerary`  
- Image: https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-1200,h-820,fo-auto,q-75

---

## 6) Itinerary (`#itinerary`) — EMBED SLOT

**Native Framer chrome around the embed:**
- Eyebrow: Sample stay  
- Title: Build a flexible stay  
- Copy: Pick your check-in and check-out dates, then drag experiences to reshape the plan. Nelson moves at your speed.

**Embed:** full-width Embed component. Short-term src:

```text
https://visit.nelsoncounty.com/?embed=1&v=20261003a#itinerary
```

Better mid-term: extract itinerary-only HTML later so the rest of the page is 100% Framer and only this block is github-hosted.

**Why embed:** calendar, 2–4 night length rules, drag-and-drop timeline, localStorage + shareable URL params are ~1k lines of JS — do not recreate in Framer layers yet.

---

## 7) Passport (`#passport`)

**Eyebrow:** Loyalty · Powered by LoyalBrew  
**Title:** Collect stamps while you stay longer  
**Copy:** A free digital passport for Check Into Nelson. Check in at participating stops, earn stamps, and unlock a campaign reward — no app download required.

**Steps**
1. Open your passport — Launch the Check Into Nelson passport in LoyalBrew from this page or a partner QR code.
2. Check in at each stop — GPS check-in or photo upload claims a stamp at lodging, sip, create, explore, and ride stops.
3. Earn your reward — Complete the passport to unlock the campaign gift. Pair visits with CHECKINTONELSON for special partner incentives.

**CTAs**
- Open digital passport → https://www.loyalbrew.com/ (replace with live trail URL when ready)
- See sample stay → `#itinerary`

Optional: decorative stamp-card preview (static is fine).

---

## 8) Promo (`#promo`)

**Title:** Save with CHECKINTONELSON  
**Copy:** Participating businesses are offering special incentives to help you stay longer and experience more of Nelson County.

**Perks**
- Use code CHECKINTONELSON
- Receive 15% off participating lodging
- Access additional offers from participating wineries, experiences, and transportation partners
- Enter or mention the code when booking or checking out through each partner

**Code pill + Copy button**  
**Fine print link:** View all participating partners → `#experience`

---

## 9) Book / close (`#book`)

**Title:** Ready when you are  
**Copy:** Choose a home base, build your days, and use CHECKINTONELSON with participating partners.  
**CTAs:** Choose Your Stay → `#stay` · Explore Participating Partners → `#experience`

---

## Sticky promo bar (site overlay / page component)

Show after scrolling past hero; hide when `#promo` is on screen; hide below ~720px width.

- Text: Use CHECKINTONELSON
- Buttons: Copy · Sample stay → `#itinerary`

---

# Part C — Code Snippets (transfer to Framer)

Small helpers are inlined below. For larger files, prefer fetching the absolute URLs from the **Code assets** catalog (raw = read source, GitHub Pages = Embed `src`).

**Fetch-first shortcuts for Framer AI**
```text
Read these and adapt into the project:
1) https://raw.githubusercontent.com/odd-even/nelsoncounty/main/embeds/check-into-nelson-framer.html
2) https://raw.githubusercontent.com/odd-even/nelsoncounty/main/check-into-nelson.html
3) https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-framer-rebuild-package.md
Embed src for itinerary/full page:
https://visit.nelsoncounty.com/?embed=1&v=20261003a
```

## C1) Page Custom Code — Promo copy helper

Paste in Framer **Page → Custom Code → End of body** (or a Code Override). Adjust selectors to match your Framer layer IDs/classes.

```html
<script>
(function () {
  var CODE = "CHECKINTONELSON";

  function flash(btn) {
    if (!btn) return;
    var original = btn.textContent;
    btn.textContent = "Copied";
    window.setTimeout(function () { btn.textContent = original; }, 1600);
  }

  function copyCode(btn) {
    var done = function () { flash(btn); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(CODE).then(done).catch(function () {
        window.prompt("Copy code:", CODE);
      });
    } else {
      window.prompt("Copy code:", CODE);
      done();
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest
      ? e.target.closest("[data-cin-copy], #copyPromo, #copyPromoHero, #stickyCopy")
      : null;
    if (!btn) return;
    e.preventDefault();
    copyCode(btn);
  });
})();
</script>
```

In Framer, set Copy buttons to `data-cin-copy` (or keep those IDs).

---

## C2) Sticky promo show/hide

```html
<script>
(function () {
  var sticky = document.getElementById("stickyPromo"); // or your Framer id
  var hero = document.querySelector("[data-cin-hero]") || document.querySelector("header, section");
  var promo = document.getElementById("promo") || document.querySelector("[data-cin-promo]");
  if (!sticky) return;

  function update() {
    var pastHero = window.scrollY > (hero ? hero.offsetHeight * 0.65 : 400);
    var nearPromo = false;
    if (promo) {
      var r = promo.getBoundingClientRect();
      nearPromo = r.top < window.innerHeight && r.bottom > 0;
    }
    var show = pastHero && !nearPromo && window.innerWidth >= 720;
    sticky.style.opacity = show ? "1" : "0";
    sticky.style.pointerEvents = show ? "auto" : "none";
    sticky.setAttribute("aria-hidden", show ? "false" : "true");
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
</script>
```

---

## C3) Clean public hash links (avoid github.io in status bar)

On a **native Framer page** hosted on nelsoncounty.com, use:

```text
#stay
#experience
#itinerary
#passport
#promo
#book
#about
#feature-farmhouse
...
```

Framer will resolve these to `https://visit.nelsoncounty.com/#stay` automatically.

If any Embed still points at github.io, **do not** use raw `#` links inside that embed for marketing chrome — keep marketing sections native Framer.

---

## C4) Temporary full-page Embed (current approach)

If you are not ready to rebuild sections natively yet, keep using this Embed (update `v=` after HTML deploys):

```html
<div id="check-into-nelson-embed" style="width:100%;max-width:100%;margin:0;padding:0;">
  <iframe
    id="check-into-nelson-frame"
    src="https://visit.nelsoncounty.com/?embed=1&v=20261003a"
    title="Check Into Nelson — Stay Longer. Experience More."
    loading="eager"
    referrerpolicy="no-referrer-when-downgrade"
    allow="clipboard-write"
    style="width:100%;border:0;display:block;min-height:3200px;background:#ffffff;"
  ></iframe>
</div>
<script>
  (function () {
    var frame = document.getElementById("check-into-nelson-frame");
    if (!frame) return;
    var HEADER_OFFSET = 96; // Framer site header height — tune this
    var viewportRaf = 0;

    function postViewport() {
      if (!frame.contentWindow) return;
      var rect = frame.getBoundingClientRect();
      try {
        frame.contentWindow.postMessage({
          type: "checkIntoNelsonViewport",
          viewportTop: Math.max(0, -rect.top),
          viewportHeight: window.innerHeight || 700
        }, "*");
      } catch (err) {}
    }

    function scheduleViewport() {
      if (viewportRaf) return;
      viewportRaf = requestAnimationFrame(function () {
        viewportRaf = 0;
        postViewport();
      });
    }

    window.addEventListener("scroll", scheduleViewport, { passive: true });
    window.addEventListener("resize", scheduleViewport);
    frame.addEventListener("load", scheduleViewport);
    scheduleViewport();

    window.addEventListener("message", function (event) {
      var data = event && event.data;
      if (!data || !data.type) return;

      if (data.type === "checkIntoNelsonReady") {
        scheduleViewport();
        return;
      }

      if (data.type === "checkIntoNelsonHeight") {
        var height = Number(data.height);
        if (!height || height < 600) return;
        frame.style.height = Math.ceil(height) + "px";
        scheduleViewport();
        return;
      }

      if (data.type === "checkIntoNelsonScrollTo") {
        var y = Number(data.y);
        if (!isFinite(y)) return;
        var rect = frame.getBoundingClientRect();
        var top = window.scrollY + rect.top + y - HEADER_OFFSET;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        return;
      }

      if (data.type === "checkIntoNelsonTravelFrom") {
        try {
          if (window.dataLayer) {
            window.dataLayer.push({
              event: "cin_travel_from",
              travel_from: data.origin,
              travel_from_custom: data.custom || ""
            });
          }
        } catch (err) {}
        try {
          if (typeof gtag === "function") {
            gtag("event", "cin_travel_from", {
              travel_from: data.origin,
              travel_from_custom: data.custom || ""
            });
          }
        } catch (err2) {}
      }
    });
  })();
</script>
```

**Important:** Full-page iframe will still show github.io on hover for links *inside* the iframe. To eliminate git links for marketing CTAs, rebuild those sections in Framer (Part B) and only embed the itinerary.

---

## C5) Itinerary-only embed (recommended hybrid)

Framer page owns hero → experience → passport → promo → book.  
Only `#itinerary` is an Embed loading the GitHub page scrolled to the itinerary (or a future `itinerary-embed.html`).

Until itinerary is extracted, use:

```text
https://visit.nelsoncounty.com/?embed=1&v=20261003a#itinerary
```

and give the iframe a large min-height, or keep height postMessage from C4.

---

## C6) GA4 / tracking attributes

Site GA4: `G-9GZ2Y2JTC9`

Add these `data-track` values on CTAs (wire in Framer/GTM if desired):

| data-track | Where |
|------------|--------|
| `cta_choose_stay` | Hero + book primary |
| `cta_explore_experience` | Hero secondary |
| `cta_explore_partners` | Book secondary |
| `cta_sample_stay` | Sticky sample stay |
| `cta_open_passport` | Passport CTAs |
| `copy_promo_code` | All Copy buttons |
| `partner_outbound` | Partner book/visit buttons (+ `data-partner`) |
| `see_all_activities` | Empty-day / activities CTAs |

Partner slugs for `data-partner`:  
`farmhouse`, `devils-backbone-camp`, `flying-fox`, `glass-hollow`, `blue-ridge-tunnel`, `devils-backbone`, `reliable-rides`, `crabtree-falls`, `spy-rock`, `tye-river`

Exit-intent analytics event (if keeping HTML exit popup):  
`cin_travel_from` with `travel_from`, `travel_from_custom`

---

# Part D — CMS collection schema (Framer)

**Collection name:** `CIN Partners`

| Field | Type | Example |
|-------|------|---------|
| Name | String | Flying Fox Vineyard |
| Slug | String | flying-fox |
| Role | String | Wine country |
| Badge | String | Sip |
| Category | Option | stay / taste / culture / experience / community / outdoor |
| Summary | Long text | … |
| Offer note | String | Special incentive |
| Image | Image / URL | Absolute URL from Asset catalog (GitHub Pages or ImageKit) |
| Primary CTA label | String | Visit Flying Fox Vineyard |
| Primary CTA URL | Link | https://www.flyingfoxvineyard.com/ |
| Secondary CTA label | String | View on nelsoncounty.com |
| Secondary CTA URL | Link | https://nelsoncounty.com/explore/… |
| Show in partner strip | Boolean | true |
| Show as stay card | Boolean | false |
| Sort order | Number | 1 |

---

# Part E — Build order checklist

- [ ] New Framer page `/check-into-nelson` using site header/footer
- [ ] Import images from Asset catalog absolute URLs (GitHub Pages + ImageKit)
- [ ] Apply design tokens (colors, Satoshi, 1500 max width, pill buttons)
- [ ] Build Hero + slideshow + promo aside
- [ ] Partner strip, Intro, Stay cards, Experience features
- [ ] Passport, Promo, Book sections
- [ ] Add `#` section IDs matching this package
- [ ] Add Copy button Custom Code (C1)
- [ ] Add sticky promo (C2) or Framer sticky equivalent
- [ ] Embed itinerary slot (C5) temporarily
- [ ] Replace LoyalBrew URL when live
- [ ] Publish and verify hover URLs show `nelsoncounty.com/...#...`
- [ ] Later: extract itinerary-only embed; remove github.io from marketing chrome entirely

---

# Part F — What stays on GitHub vs Framer

| Piece | Framer-native | Keep HTML/GitHub |
|-------|---------------|------------------|
| Header / footer | ✅ | |
| Hero, intro, stay, features, passport, promo, book | ✅ | |
| Partner CMS | ✅ | |
| Promo copy + sticky | ✅ (light Custom Code) | |
| Scroll reveals | ✅ Framer Scroll Animations | optional |
| Itinerary builder | | ✅ embed |
| Exit-intent travel popup | | ✅ embed (or defer) |
| Full current page iframe | stopgap only | shows git links |

---

# Part G — Short Framer AI follow-up prompts

**Prompt: Stay cards**
```text
Create two lodging cards in a 2-column grid for Farmhouse at Veritas and Devils Backbone Campground. Use these image URLs exactly:
- https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg
- https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg
Use 20px radius, image on top, offer eyebrow in stay-green text, dark pill CTA. Book URLs: https://www.veritasfarmhouse.com/ and https://www.dbbrewingcompany.com/camp-at-basecamp
```

**Prompt: Experience features**
```text
Create five alternating image/text partner feature rows. Use these image URLs exactly:
- Flying Fox: https://ik.imagekit.io/OE/nelson-county/listings/flying-fox-vineyards-image1_QyaP87PFD?tr=w-1200,h-820,fo-auto,q-75
- Glass Hollow: https://ik.imagekit.io/OE/nelson-county/listings/glass-hollow-studio-gallery-image1_P9hwkSskV?tr=w-1200,h-820,fo-auto,q-75
- Blue Ridge Tunnel: https://ik.imagekit.io/OE/nelson-county/listings/blue-ridge-tunnel-image1_PrnI6PqE9?tr=w-1200,h-820,fo-auto,q-75
- Devils Backbone: https://ik.imagekit.io/OE/nelson-county/listings/devils-backbone-brewing-company-image1_xOCX-_l34?tr=w-1200,h-820,fo-auto,q-75
- Reliable Rides: https://ik.imagekit.io/OE/nelson-county/listings/veritas-vineyards-winery-image1_nHivj3-nt?tr=w-1200,h-820,fo-auto,q-75
Use category badge colors from the package. Include primary + outline secondary CTAs.
```

**Prompt: Promo section**
```text
Build a centered promo section titled Save with CHECKINTONELSON, four perk bullets, a large code pill with Copy button (data-cin-copy), and a fine-print link to #experience. Code color #2D6A4F.
```

**Prompt: Pull assets**
```text
Import all campaign images from these absolute URLs into Framer Assets (download if remote fill is blocked), then bind them to the hero slideshow, partner chips, stay cards, and experience features. Do not use placeholder images.
Hero:
https://visit.nelsoncounty.com/assets/check-into-nelson/farmhouse-veritas.jpg
https://visit.nelsoncounty.com/assets/check-into-nelson/blue-ridge-tunnel.jpg
https://visit.nelsoncounty.com/assets/check-into-nelson/devils-backbone.jpg
Also fetch code sources if needed:
https://raw.githubusercontent.com/odd-even/nelsoncounty/main/embeds/check-into-nelson-framer.html
https://raw.githubusercontent.com/odd-even/nelsoncounty/main/check-into-nelson.html
```

**Prompt: Pull embed wrapper**
```text
Open https://raw.githubusercontent.com/odd-even/nelsoncounty/main/embeds/check-into-nelson-framer.html and paste it into a Framer Embed (or Custom Code) for the itinerary section. Keep the iframe src as https://visit.nelsoncounty.com/?embed=1&v=20261003a and preserve the postMessage height/scroll/viewport handlers.
```

**Prompt: Remove git links**
```text
Ensure every in-page navigation link on this Framer page uses on-page hashes (#stay, #experience, etc.) so the browser status bar shows nelsoncounty.com, not github.io. Do not wrap the whole page in a GitHub iframe. Only the itinerary block may be an Embed.
```

---

# Reference files in this repo

- Full page: https://visit.nelsoncounty.com/  
  Source: https://raw.githubusercontent.com/odd-even/nelsoncounty/main/check-into-nelson.html
- Embed wrapper: https://visit.nelsoncounty.com/embeds/check-into-nelson-framer.html  
  Source: https://raw.githubusercontent.com/odd-even/nelsoncounty/main/embeds/check-into-nelson-framer.html
- This package (raw): https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-framer-rebuild-package.md
- Copy deck (raw): https://raw.githubusercontent.com/odd-even/nelsoncounty/main/docs/check-into-nelson-website-copy.md
- Photos folder: https://visit.nelsoncounty.com/assets/check-into-nelson/
- ImageKit base: https://ik.imagekit.io/OE/nelson-county/

---

*End of package.*
