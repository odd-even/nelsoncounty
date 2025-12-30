import { Page, addPropertyControls, ControlType } from "framer"
import SEOSchemaComponent from "./framer-seo-schema-component"

/**
 * Example: Individual Listing Page with SEO
 * 
 * This is a complete example of how to use the SEO Schema Component
 * on an individual listing page in Framer CMS.
 * 
 * SETUP:
 * 1. Copy this file to your Framer project
 * 2. Connect your CMS collection fields to the props
 * 3. Customize the layout/styling as needed
 */

interface ListingPageProps {
  // CMS Fields - connect these to your CMS collection
  name?: string
  type?: string
  area?: string
  description?: string
  image1?: string
  image2?: string
  website?: string
  phone?: string
  address?: string
  amenities?: string
  featured?: boolean
  slug?: string
  wordpressUrl?: string
  metaTitle?: string
  metaDescription?: string
}

export default function ListingPageExample(props: ListingPageProps) {
  const {
    name = "Business Name",
    type = "Business Type",
    area = "Nelson County",
    description = "",
    image1 = "",
    website = "",
    phone = "",
    address = "",
    amenities = "",
    featured = false,
    slug = "",
    wordpressUrl = "",
    metaTitle = "",
    metaDescription = ""
  } = props

  // Build derived values
  const canonicalUrl = wordpressUrl || `https://www.nelsoncounty-va.gov/explore/${slug}`
  const finalMetaTitle = metaTitle || `${name} | ${type} in ${area}, Virginia`
  const finalMetaDescription = metaDescription || description || `Visit ${name} in ${area}, Virginia. ${description}`
  const breadcrumb = `Home > ${area} > ${name}`

  // Parse amenities (if semicolon-separated)
  const amenitiesList = amenities
    ? amenities.split(";").map(a => a.trim()).filter(a => a)
    : []

  return (
    <Page>
      {/* SEO Component - Must be included for schema markup */}
      <SEOSchemaComponent
        pageType="listing"
        name={name}
        type={type}
        area={area}
        description={description}
        image1={image1}
        website={website}
        phone={phone}
        address={address}
        amenities={amenities}
        featured={featured}
        canonicalUrl={canonicalUrl}
        metaTitle={finalMetaTitle}
        metaDescription={finalMetaDescription}
        breadcrumb={breadcrumb}
      />

      {/* Page Content */}
      <div style={styles.container}>
        {/* Hero Section */}
        {image1 && (
          <div style={styles.hero}>
            <img src={image1} alt={name} style={styles.heroImage} />
            {featured && (
              <div style={styles.featuredBadge}>Featured</div>
            )}
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{name}</h1>
          <div style={styles.badges}>
            <span style={styles.typeBadge}>{type}</span>
            <span style={styles.areaBadge}>{area}</span>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div style={styles.description}>
            <p>{description}</p>
          </div>
        )}

        {/* Amenities */}
        {amenitiesList.length > 0 && (
          <div style={styles.amenities}>
            <h2 style={styles.sectionTitle}>Amenities</h2>
            <div style={styles.amenitiesList}>
              {amenitiesList.map((amenity, index) => (
                <span key={index} style={styles.amenityPill}>
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div style={styles.contact}>
          <h2 style={styles.sectionTitle}>Contact Information</h2>
          {address && (
            <div style={styles.contactItem}>
              <strong>Address:</strong> {address}
            </div>
          )}
          {phone && (
            <div style={styles.contactItem}>
              <strong>Phone:</strong> <a href={`tel:${phone}`}>{phone}</a>
            </div>
          )}
          {website && (
            <div style={styles.contactItem}>
              <strong>Website:</strong>{" "}
              <a href={website} target="_blank" rel="noopener noreferrer">
                Visit Website
              </a>
            </div>
          )}
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
    position: "relative",
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
  featuredBadge: {
    position: "absolute",
    top: "20px",
    right: "20px",
    backgroundColor: "#bbc236",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },
  header: {
    marginBottom: "30px"
  },
  title: {
    fontSize: "48px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#212529"
  },
  badges: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap"
  },
  typeBadge: {
    backgroundColor: "#2d6a4f",
    color: "white",
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500"
  },
  areaBadge: {
    backgroundColor: "#f8f9fa",
    color: "#212529",
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    border: "1px solid #e8e8e8"
  },
  description: {
    fontSize: "18px",
    lineHeight: "1.7",
    color: "#6c757d",
    marginBottom: "40px"
  },
  amenities: {
    marginBottom: "40px"
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#212529"
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
  contact: {
    marginBottom: "40px"
  },
  contactItem: {
    fontSize: "16px",
    marginBottom: "12px",
    color: "#212529"
  }
}

// Property controls for Framer CMS
addPropertyControls(ListingPageExample, {
  name: {
    type: ControlType.String,
    title: "Business Name",
    defaultValue: "Business Name"
  },
  type: {
    type: ControlType.String,
    title: "Business Type",
    defaultValue: "Business Type"
  },
  area: {
    type: ControlType.String,
    title: "Area",
    defaultValue: "Nelson County"
  },
  description: {
    type: ControlType.Text,
    title: "Description",
    defaultValue: ""
  },
  image1: {
    type: ControlType.Image,
    title: "Primary Image"
  },
  website: {
    type: ControlType.String,
    title: "Website",
    defaultValue: ""
  },
  phone: {
    type: ControlType.String,
    title: "Phone",
    defaultValue: ""
  },
  address: {
    type: ControlType.String,
    title: "Address",
    defaultValue: ""
  },
  amenities: {
    type: ControlType.String,
    title: "Amenities (semicolon-separated)",
    defaultValue: ""
  },
  featured: {
    type: ControlType.Boolean,
    title: "Featured",
    defaultValue: false
  },
  slug: {
    type: ControlType.String,
    title: "Slug",
    defaultValue: ""
  },
  wordpressUrl: {
    type: ControlType.String,
    title: "WordPress URL (Canonical)",
    defaultValue: ""
  }
})

