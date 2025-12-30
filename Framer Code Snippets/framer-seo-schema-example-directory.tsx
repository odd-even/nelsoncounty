import { Page, addPropertyControls, ControlType } from "framer"
import SEOSchemaComponent from "./framer-seo-schema-component"

/**
 * Example: Directory Page (by Area) with SEO
 * 
 * This is a complete example of how to use the SEO Schema Component
 * on a directory page showing all listings in an area (e.g., "Wintergreen", "Afton").
 * 
 * SETUP:
 * 1. Copy this file to your Framer project
 * 2. Connect your CMS collection fields to the props
 * 3. Customize the layout/styling as needed
 */

interface DirectoryPageProps {
  // CMS Fields - connect these to your CMS collection
  pageTitle?: string
  slug?: string
  area?: string
  description?: string
  metaTitle?: string
  metaDescription?: string
  breadcrumb?: string
  canonicalUrl?: string
  heroImageUrl?: string
  totalListings?: number
  featuredCount?: number
  keywords?: string
}

export default function DirectoryPageExample(props: DirectoryPageProps) {
  const {
    pageTitle = "Area Directory",
    slug = "",
    area = "",
    description = "",
    metaTitle = "",
    metaDescription = "",
    breadcrumb = "",
    canonicalUrl = "",
    heroImageUrl = "",
    totalListings = 0,
    featuredCount = 0
  } = props

  // Build derived values
  const finalCanonicalUrl = canonicalUrl || `https://www.nelsoncounty-va.gov/${slug}`
  const finalMetaTitle = metaTitle || `${pageTitle} | Nelson County, Virginia`
  const finalMetaDescription = metaDescription || description || `Explore ${pageTitle} in Nelson County, Virginia.`
  const finalBreadcrumb = breadcrumb || `Home > ${pageTitle}`

  return (
    <Page>
      {/* SEO Component - Must be included for schema markup */}
      <SEOSchemaComponent
        pageType="directory"
        pageTitle={pageTitle}
        slug={slug}
        description={description}
        canonicalUrl={finalCanonicalUrl}
        metaTitle={finalMetaTitle}
        metaDescription={finalMetaDescription}
        breadcrumb={finalBreadcrumb}
        heroImageUrl={heroImageUrl}
        totalListings={totalListings}
        featuredCount={featuredCount}
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
              {featuredCount > 0 && ` • ${featuredCount} featured`}
            </p>
          )}
        </div>

        {/* Description */}
        {description && (
          <div style={styles.description}>
            <p>{description}</p>
          </div>
        )}

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{totalListings}</div>
            <div style={styles.statLabel}>Total Listings</div>
          </div>
          {featuredCount > 0 && (
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{featuredCount}</div>
              <div style={styles.statLabel}>Featured</div>
            </div>
          )}
        </div>

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
  stats: {
    display: "flex",
    gap: "32px",
    marginBottom: "40px",
    padding: "24px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px"
  },
  statItem: {
    textAlign: "center"
  },
  statNumber: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#2d6a4f",
    marginBottom: "8px"
  },
  statLabel: {
    fontSize: "14px",
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
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
addPropertyControls(DirectoryPageExample, {
  pageTitle: {
    type: ControlType.String,
    title: "Page Title",
    defaultValue: "Area Directory"
  },
  slug: {
    type: ControlType.String,
    title: "Slug",
    defaultValue: ""
  },
  area: {
    type: ControlType.String,
    title: "Area",
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
  featuredCount: {
    type: ControlType.Number,
    title: "Featured Count",
    defaultValue: 0
  }
})

