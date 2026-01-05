// Framer Code Component - Amenity Pills
// Use this as a Code Component in your CMS pages
// 
// Setup:
// 1. In Framer, go to Code tab and create a new file
// 2. Copy this entire file
// 3. Add it to your CMS page as a Code Component
// 4. Connect it to your CMS field (text field with comma-separated values)
//
// Usage:
// - Connect the "text" property to your CMS field
// - Or pass text directly as a prop
// - The component will automatically split by commas and render as pills

import { addPropertyControls, ControlType } from "framer"
import React from "react"

// Default styling values
const defaultStyles = {
    backgroundColor: '#f3f4f6',
    textColor: '#374151',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    gap: '8px',
    borderWidth: '0px',
    borderColor: '#d1d5db',
    borderStyle: 'solid'
}

type Props = {
    text?: string
    backgroundColor?: string
    textColor?: string
    padding?: string
    borderRadius?: string
    fontSize?: string
    fontWeight?: string
    gap?: string
    borderWidth?: string
    borderColor?: string
    borderStyle?: string
}

export default function AmenityPills(props: Props) {
    const {
        text = '',
        backgroundColor = defaultStyles.backgroundColor,
        textColor = defaultStyles.textColor,
        padding = defaultStyles.padding,
        borderRadius = defaultStyles.borderRadius,
        fontSize = defaultStyles.fontSize,
        fontWeight = defaultStyles.fontWeight,
        gap = defaultStyles.gap,
        borderWidth = defaultStyles.borderWidth,
        borderColor = defaultStyles.borderColor,
        borderStyle = defaultStyles.borderStyle
    } = props

    // Split text by commas and/or newlines, then filter out empty strings
    // If no commas/newlines, treat entire text as single amenity
    const parts = text
        .split(/[,\n\r]+/) // Split by commas, newlines, or carriage returns
        .map(part => part.trim())
        .filter(part => part.length > 0)

    // If no valid parts, show placeholder
    if (parts.length === 0) {
        return (
            <div style={{ display: 'inline-block' }}>
                {text || 'No text provided'}
            </div>
        )
    }

    // Helper to store filter params for AdventureDirectory to pick up after navigation
    const storeFilterForIframe = (params: Record<string, string>) => {
        if (typeof window === 'undefined') return
        
        try {
            // Store in sessionStorage (persists across navigation in same session)
            // AdventureDirectory will check this and send to iframe
            const paramsString = JSON.stringify(params)
            sessionStorage.setItem('__pendingBreadcrumbFilter', paramsString)
            console.log('🏷️ ✅ Stored amenity filter for AdventureDirectory:', params)
            
            // If we're already on the find-your-adventure page, try to send directly to iframe
            // Retry a few times in case iframe is still loading
            let attempts = 0
            const maxAttempts = 10
            const trySendDirectly = () => {
                try {
                    const iframe = document.getElementById('adventure-directory-iframe') as HTMLIFrameElement
                    if (iframe && iframe.contentWindow) {
                        console.log('🏷️ Already on find-your-adventure page - sending filter immediately')
                        // Send directly to iframe
                        iframe.contentWindow.postMessage({
                            type: 'applyFilter',
                            params: params,
                            source: 'amenity'
                        }, '*')
                        console.log('🏷️ ✅ Sent amenity filter directly to iframe')
                        // Clear stored filter since we sent it directly
                        sessionStorage.removeItem('__pendingBreadcrumbFilter')
                        return
                    }
                } catch (e) {
                    console.warn('🏷️ Error sending filter directly:', e)
                }
                
                attempts++
                if (attempts < maxAttempts) {
                    setTimeout(trySendDirectly, 100)
                }
            }
            
            // Try sending directly if on same page
            trySendDirectly()
        } catch (e) {
            console.warn('🏷️ Error storing filter:', e)
        }
    }

    // Handle click on amenity pill
    const handleAmenityClick = (amenity: string) => {
        // Only run on client-side
        if (typeof window === 'undefined') {
            return
        }
        
        // Build clean URL (no parameters)
        const cleanUrl = '/find-your-adventure'
        
        console.log('🏷️ Amenity clicked, navigating to:', cleanUrl, 'with filter:', { amenity })
        
        // Store filter params in sessionStorage before navigation
        // AdventureDirectory will check this after navigation and send to iframe
        storeFilterForIframe({ amenity: amenity })
        
        // Navigate to clean URL (no parameters)
        window.location.href = cleanUrl
    }

    // Render as pills
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: gap,
                alignItems: 'center',
            }}
        >
            {parts.map((part, index) => (
                <span
                    key={index}
                    onClick={() => handleAmenityClick(part)}
                    style={{
                        display: 'inline-block',
                        backgroundColor: backgroundColor,
                        color: textColor,
                        padding: padding,
                        borderRadius: borderRadius,
                        fontSize: fontSize,
                        fontWeight: fontWeight,
                        lineHeight: '1.4',
                        whiteSpace: 'nowrap',
                        margin: 0,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderWidth: borderWidth,
                        borderColor: borderColor,
                        borderStyle: borderStyle
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.85'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                >
                    {part}
                </span>
            ))}
        </div>
    )
}

// Property controls for Framer
addPropertyControls(AmenityPills, {
    text: {
        type: ControlType.String,
        title: "Text",
        description: "Comma-separated text (e.g., 'Pet-Friendly, Outdoor Seating')",
        defaultValue: "Pet-Friendly, Outdoor Seating, Tours Available",
        placeholder: "Enter comma-separated text..."
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: defaultStyles.backgroundColor
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: defaultStyles.textColor
    },
    padding: {
        type: ControlType.String,
        title: "Padding",
        defaultValue: defaultStyles.padding,
        placeholder: "6px 12px"
    },
    borderRadius: {
        type: ControlType.String,
        title: "Border Radius",
        defaultValue: defaultStyles.borderRadius,
        placeholder: "20px"
    },
    fontSize: {
        type: ControlType.String,
        title: "Font Size",
        defaultValue: defaultStyles.fontSize,
        placeholder: "13px"
    },
    fontWeight: {
        type: ControlType.String,
        title: "Font Weight",
        defaultValue: defaultStyles.fontWeight,
        placeholder: "500"
    },
    gap: {
        type: ControlType.String,
        title: "Gap Between Pills",
        defaultValue: defaultStyles.gap,
        placeholder: "8px"
    },
    borderWidth: {
        type: ControlType.String,
        title: "Border Width",
        defaultValue: defaultStyles.borderWidth,
        placeholder: "0px, 1px, 2px, etc."
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: defaultStyles.borderColor
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        options: ["solid", "dashed", "dotted", "double", "none"],
        optionTitles: ["Solid", "Dashed", "Dotted", "Double", "None"],
        defaultValue: "solid"
    }
})

