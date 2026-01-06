/**
 * Generate Framer CMS Pages Script
 * 
 * This script fetches listings from Google Sheets and generates
 * individual page code for each listing that can be used in Framer CMS.
 * 
 * Usage:
 *   node generate_framer_cms_pages.js
 * 
 * Output:
 *   - Creates a "framer-cms-pages" directory with individual page files
 *   - Generates a summary JSON file with all listings data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec';
const OUTPUT_DIR = path.join(__dirname, 'framer-cms-pages');
const BACKUP_DIR = path.join(__dirname, 'framer-cms-pages-backup');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create backup of existing files if they exist
if (fs.existsSync(OUTPUT_DIR) && fs.readdirSync(OUTPUT_DIR).length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${BACKUP_DIR}-${timestamp}`;
    console.log(`📦 Backing up existing files to ${backupPath}...`);
    fs.mkdirSync(backupPath, { recursive: true });
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(file => {
        fs.copyFileSync(
            path.join(OUTPUT_DIR, file),
            path.join(backupPath, file)
        );
    });
    console.log(`✅ Backup complete: ${files.length} files`);
}

/**
 * Fetch listings from Google Sheets via Apps Script
 */
function fetchListingsFromGoogleSheets() {
    return new Promise((resolve, reject) => {
        const url = new URL(GOOGLE_APPS_SCRIPT_URL);
        url.searchParams.append('t', Date.now());
        
        https.get(url.toString(), (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.listings && Array.isArray(json.listings)) {
                        resolve(json.listings);
                    } else {
                        reject(new Error('Invalid response format: missing listings array'));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Sanitize text for use in React/JSX
 */
function sanitizeForJSX(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

/**
 * Generate React/TSX component code for a single listing page
 */
function generateListingPageCode(listing) {
    const {
        id,
        name,
        slug,
        type,
        category,
        area,
        description,
        detailedDescription,
        customHtml,
        image1,
        image1Desc,
        image2,
        image2Desc,
        image3,
        image3Desc,
        website,
        phone,
        address,
        amenities,
        featured,
        directionsLink,
        googleMapsUrl
    } = listing;

    const amenitiesList = Array.isArray(amenities) ? amenities : (amenities ? amenities.split(';').map(a => a.trim()) : []);
    const hasMultipleImages = !!(image2 || image3);
    
    return `import { Page } from "framer"
import { addPropertyControls, ControlType } from "framer"

/**
 * ${sanitizeForJSX(name)} - Listing Page
 * 
 * Generated automatically from Google Sheets listing data.
 * Slug: ${slug || 'no-slug'}
 * ID: ${id}
 */

export default function ${slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : 'Listing' + id}Page() {
    return (
        <Page
            name="${sanitizeForJSX(name)}"
            width={375}
            height={812}
            defaultEffect="none"
        >
            <div style={styles.container}>
                {/* Hero Image */}
                ${image1 ? `<img 
                    src="${image1}" 
                    alt="${sanitizeForJSX(image1Desc || name)}"
                    style={styles.heroImage}
                />` : ''}
                
                {/* Content Section */}
                <div style={styles.content}>
                    {/* Title */}
                    <h1 style={styles.title}>${sanitizeForJSX(name)}</h1>
                    
                    {/* Badges */}
                    <div style={styles.badges}>
                        ${type ? `<span style={styles.badge}>${sanitizeForJSX(type)}</span>` : ''}
                        ${area ? `<span style={styles.badge}>${sanitizeForJSX(area)}</span>` : ''}
                        ${featured ? `<span style={styles.featuredBadge}>Featured</span>` : ''}
                    </div>
                    
                    {/* Description */}
                    ${description ? `<p style={styles.description}>${sanitizeForJSX(description)}</p>` : ''}
                    
                    {/* Detailed Description */}
                    ${detailedDescription ? `<div style={styles.detailedDescription}>
                        <p>${sanitizeForJSX(detailedDescription)}</p>
                    </div>` : ''}
                    
                    {/* Custom HTML */}
                    ${customHtml ? `<div style={styles.customHtml} dangerouslySetInnerHTML={{ __html: \`${customHtml.replace(/`/g, '\\`')}\` }} />` : ''}
                    
                    {/* Additional Images */}
                    ${hasMultipleImages ? `<div style={styles.imageGrid}>
                        ${image2 ? `<img 
                            src="${image2}" 
                            alt="${sanitizeForJSX(image2Desc || name)}"
                            style={styles.gridImage}
                        />` : ''}
                        ${image3 ? `<img 
                            src="${image3}" 
                            alt="${sanitizeForJSX(image3Desc || name)}"
                            style={styles.gridImage}
                        />` : ''}
                    </div>` : ''}
                    
                    {/* Amenities */}
                    ${amenitiesList.length > 0 ? `<div style={styles.amenities}>
                        <h3 style={styles.sectionTitle}>Amenities</h3>
                        <div style={styles.amenitiesList}>
                            ${amenitiesList.map(amenity => 
                                `<span key="${sanitizeForJSX(amenity)}" style={styles.amenityPill}>
                                    ${sanitizeForJSX(amenity)}
                                </span>`
                            ).join('\n                            ')}
                        </div>
                    </div>` : ''}
                    
                    {/* Contact Information */}
                    <div style={styles.contact}>
                        ${address ? `<div style={styles.contactItem}>
                            <strong>Address:</strong> ${sanitizeForJSX(address)}
                        </div>` : ''}
                        ${phone ? `<div style={styles.contactItem}>
                            <strong>Phone:</strong> <a href="tel:${phone.replace(/\D/g, '')}" style={styles.link}>${sanitizeForJSX(phone)}</a>
                        </div>` : ''}
                        ${website ? `<div style={styles.contactItem}>
                            <strong>Website:</strong> <a href="${website}" target="_blank" rel="noopener noreferrer" style={styles.link}>Visit Website</a>
                        </div>` : ''}
                        ${directionsLink || googleMapsUrl ? `<div style={styles.contactItem}>
                            <a href="${directionsLink || googleMapsUrl}" target="_blank" rel="noopener noreferrer" style={styles.directionsButton}>
                                Get Directions
                            </a>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </Page>
    )
}

const styles = {
    container: {
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
    },
    heroImage: {
        width: '100%',
        height: '300px',
        objectFit: 'cover',
    },
    content: {
        padding: '24px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '12px',
        color: '#212529',
    },
    badges: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '16px',
    },
    badge: {
        padding: '6px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '16px',
        fontSize: '12px',
        color: '#212529',
    },
    featuredBadge: {
        padding: '6px 12px',
        backgroundColor: '#bbc236',
        borderRadius: '16px',
        fontSize: '12px',
        color: '#ffffff',
        fontWeight: '600',
    },
    description: {
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#212529',
        marginBottom: '16px',
    },
    detailedDescription: {
        fontSize: '15px',
        lineHeight: '1.6',
        color: '#6c757d',
        marginBottom: '24px',
    },
    customHtml: {
        marginBottom: '24px',
    },
    imageGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px',
    },
    gridImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        borderRadius: '8px',
    },
    amenities: {
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#212529',
    },
    amenitiesList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    amenityPill: {
        padding: '6px 12px',
        backgroundColor: '#e8f5e9',
        borderRadius: '16px',
        fontSize: '13px',
        color: '#2d6a4f',
    },
    contact: {
        borderTop: '1px solid #e8e8e8',
        paddingTop: '24px',
    },
    contactItem: {
        marginBottom: '12px',
        fontSize: '15px',
        color: '#212529',
    },
    link: {
        color: '#2d6a4f',
        textDecoration: 'none',
    },
    directionsButton: {
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#2d6a4f',
        color: '#ffffff',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: '600',
        marginTop: '8px',
    },
}

// Property controls for Framer CMS
addPropertyControls(${slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : 'Listing' + id}Page, {
    // Add any custom controls here if needed
})
`;
}

/**
 * Generate a summary JSON file with all listings
 */
function generateSummaryFile(listings) {
    const summary = {
        generatedAt: new Date().toISOString(),
        totalListings: listings.length,
        listings: listings.map(listing => ({
            id: listing.id,
            name: listing.name,
            slug: listing.slug,
            type: listing.type,
            category: listing.category,
            area: listing.area,
            featured: listing.featured,
            hasImages: !!(listing.image1 || listing.image2 || listing.image3),
            hasWebsite: !!listing.website,
            hasPhone: !!listing.phone,
            hasAddress: !!listing.address,
            amenitiesCount: Array.isArray(listing.amenities) 
                ? listing.amenities.length 
                : (listing.amenities ? listing.amenities.split(';').length : 0)
        }))
    };
    
    const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Summary file created: ${summaryPath}`);
}

/**
 * Main execution function
 */
async function main() {
    console.log('🚀 Starting Framer CMS page generation...\n');
    
    try {
        // Fetch listings from Google Sheets
        console.log('📥 Fetching listings from Google Sheets...');
        const listings = await fetchListingsFromGoogleSheets();
        console.log(`✅ Fetched ${listings.length} listings\n`);
        
        // Generate page files
        console.log('📝 Generating page files...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const listing of listings) {
            try {
                const slug = listing.slug || `listing-${listing.id}`;
                const filename = `${slug}.tsx`;
                const filepath = path.join(OUTPUT_DIR, filename);
                
                const code = generateListingPageCode(listing);
                fs.writeFileSync(filepath, code);
                
                successCount++;
                if (successCount % 10 === 0) {
                    process.stdout.write('.');
                }
            } catch (error) {
                console.error(`\n❌ Error generating page for ${listing.name}:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`\n✅ Generated ${successCount} page files`);
        if (errorCount > 0) {
            console.log(`⚠️  ${errorCount} errors encountered`);
        }
        
        // Generate summary file
        generateSummaryFile(listings);
        
        console.log(`\n✨ Complete! Files saved to: ${OUTPUT_DIR}`);
        console.log(`\n📋 Next steps:`);
        console.log(`   1. Review the generated files in: ${OUTPUT_DIR}`);
        console.log(`   2. Copy individual .tsx files to your Framer project`);
        console.log(`   3. Import and use them in your Framer CMS`);
        
    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { fetchListingsFromGoogleSheets, generateListingPageCode };


