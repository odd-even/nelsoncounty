import { Page, addPropertyControls, ControlType } from "framer"
import SEOSchemaComponent from "./framer-seo-schema-component"

/**
 * Example: Type Page (by Category) with SEO
 * 
 * This is a complete example of how to use the SEO Schema Component
 * on a type page showing all listings of a category (e.g., "Wineries", "Hiking Trails").
 * 
 * SETUP:
 * 1. Copy this file to your Framer project
 * 2. Connect your CMS collection fields to the props
 * 3. Customize the layout/styling as needed
 */

interface TypePageProps {
  // CMS Fields - connect these to your CMS collection
  pageTitle?: string
  slug?: string
  type?: string
  description?: string
  metaTitle?: string
  metaDescription?: string
  breadcrumb?: string
  canonicalUrl?: string
  heroImageUrl?: string
  totalListings?: number
  topCategory?: string
  topAreas?: string
  commonAmenities?: string
}

export default function TypePageExample(props: TypePageProps) {
  const {
    pageTitle = "Type Directory",
    slug = "",
    type = "",
    description = "",
    metaTitle = "",
    metaDescription = "",
    breadcrumb = "",
    canonicalUrl = "",
    heroImageUrl = "",
    totalListings = 0,
    topCategory = "",
    topAreas = "",
    commonAmenities = ""
  } = props

  // Build derived values
  const finalCanonicalUrl = canonicalUrl || `https://www.nelsoncounty-va.gov/${slug}`
  const finalMetaTitle = metaTitle || `${pageTitle} | Nelson County, Virginia`
  const finalMetaDescription = metaDescription || description || `Discover ${pageTitle} in Nelson County, Virginia.`
  const finalBreadcrumb = breadcrumb || `Home > ${pageTitle}`

  // Parse areas and amenities
  const areasList = topAreas
    ? topAreas.split(",").map(a => a.trim()).filter(a => a)
    : []
  const amenitiesList = commonAmenities
    ? commonAmenities.split(",").map(a => a.trim()).filter(a => a)
    : []

  return (
    <Page>
      {/* SEO Component - Must be included for schema markup */}
      <SEOSchemaComponent
        pageType="type"
        pageTitle={pageTitle}
        slug={slug}
        description={description}
        canonicalUrl={finalCanonicalUrl}
        metaTitle={finalMetaTitle}
        metaDescription={finalMetaDescription}
        breadcrumb={finalBreadcrumb}
        heroImageUrl={heroImageUrl}
        totalListings={totalListings}
      />

      {/* Page Content */}
      <div style={styles.container}>
        {/* Hero Section */}
        {heroImageUrl && (
          <div style={styles.hero}>
            <img src={heroImageUrl} alt={pageTitle} style={styles.heroImage} />
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{pageTitle}</h1>
          {totalListings > 0 && (
            <p style={styles.subtitle}>
              {totalListings} {totalListings === 1 ? "listing" : "listings"} available
            </p>
          )}
        </div>

        {/* Description */}
        {description && (
          <div style={styles.description}>
            <p>{description}</p>
          </div>
        )}

        {/* Category Info */}
        {topCategory && (
          <div style={styles.categoryBadge}>
            <span style={styles.categoryLabel}>Category:</span>
            <span style={styles.categoryValue}>{topCategory}</span>
          </div>
        )}

        {/* Top Areas */}
        {areasList.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Popular Areas</h2>
            <div style={styles.areasList}>
              {areasList.map((area, index) => (
                <span key={index} style={styles.areaPill}>
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Common Amenities */}
        {amenitiesList.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Common Amenities</h2>
            <div style={styles.amenitiesList}>
              {amenitiesList.map((amenity, index) => (
                <span key={index} style={styles.amenityPill}>
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Note: In a real implementation, you would render your listings here */}
        <div style={styles.listingsPlaceholder}>
          <p>Listings would be rendered here</p>
          <p style={styles.note}>
            Connect this to your listings data source (CMS collection, API, etc.)
          </p>
        </div>
      </div>
    </Page>
  )
}

// Styling
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  hero: {
    width: "100%",
    height: "400px",
    marginBottom: "40px",
    borderRadius: "12px",
    overflow: "hidden"
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  header: {
    marginBottom: "30px"
  },
  title: {
    fontSize: "48px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#212529"
  },
  subtitle: {
    fontSize: "18px",
    color: "#6c757d",
    margin: 0
  },
  description: {
    fontSize: "18px",
    lineHeight: "1.7",
    color: "#6c757d",
    marginBottom: "40px"
  },
  categoryBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    backgroundColor: "#2d6a4f",
    color: "white",
    borderRadius: "8px",
    marginBottom: "40px"
  },
  categoryLabel: {
    fontSize: "14px",
    opacity: 0.9
  },
  categoryValue: {
    fontSize: "16px",
    fontWeight: "600"
  },
  section: {
    marginBottom: "40px"
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#212529"
  },
  areasList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  areaPill: {
    backgroundColor: "#f8f9fa",
    color: "#212529",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    border: "1px solid #e8e8e8"
  },
  amenitiesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  amenityPill: {
    backgroundColor: "#f8f9fa",
    color: "#212529",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    border: "1px solid #e8e8e8"
  },
  listingsPlaceholder: {
    padding: "60px 20px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    color: "#6c757d"
  },
  note: {
    fontSize: "14px",
    marginTop: "12px",
    fontStyle: "italic"
  }
}

// Property controls for Framer CMS
addPropertyControls(TypePageExample, {
  pageTitle: {
    type: ControlType.String,
    title: "Page Title",
    defaultValue: "Type Directory"
  },
  slug: {
    type: ControlType.String,
    title: "Slug",
    defaultValue: ""
  },
  type: {
    type: ControlType.String,
    title: "Type",
    defaultValue: ""
  },
  description: {
    type: ControlType.Text,
    title: "Description",
    defaultValue: ""
  },
  metaTitle: {
    type: ControlType.String,
    title: "Meta Title",
    defaultValue: ""
  },
  metaDescription: {
    type: ControlType.String,
    title: "Meta Description",
    defaultValue: ""
  },
  breadcrumb: {
    type: ControlType.String,
    title: "Breadcrumb",
    defaultValue: ""
  },
  canonicalUrl: {
    type: ControlType.String,
    title: "Canonical URL",
    defaultValue: ""
  },
  heroImageUrl: {
    type: ControlType.Image,
    title: "Hero Image"
  },
  totalListings: {
    type: ControlType.Number,
    title: "Total Listings",
    defaultValue: 0
  },
  topCategory: {
    type: ControlType.String,
    title: "Top Category",
    defaultValue: ""
  },
  topAreas: {
    type: ControlType.String,
    title: "Top Areas (comma-separated)",
    defaultValue: ""
  },
  commonAmenities: {
    type: ControlType.String,
    title: "Common Amenities (comma-separated)",
    defaultValue: ""
  }
})

