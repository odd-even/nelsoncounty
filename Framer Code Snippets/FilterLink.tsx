// Framer Code Component - Filter Link
// Wrap any element (image, button, text, etc.) to make it navigate to the directory with filters
//
// Setup:
// 1. In Framer, go to Code tab and create a new file called "FilterLink.tsx"
// 2. Copy this entire file
// 3. Add it to your page and wrap it around any element you want to make clickable
// 4. Set the filter properties in the property panel
//
// Usage:
// - Wrap an image, button, or any element with this component, OR
// - Set the "Text" property to display text directly (useful for header nav links)
// - Set filter properties (category, type, area, amenity, search, featured)
// - When clicked, it will navigate to /find-your-adventure with those filters applied

import { addPropertyControls, ControlType } from "framer"
import React, { useState, useEffect, useRef } from "react"

type Props = {
    children?: React.ReactNode
    text?: string
    category?: string
    type?: string
    area?: string
    amenity?: string
    search?: string
    featured?: boolean
    targetUrl?: string
    width?: number | string
    height?: number | string
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    display?: string
    textColor?: string
    fontSize?: number | string
    fontWeight?: number | string
    textAlign?: string
    textDecoration?: string
    fontFamily?: string
}

export default function FilterLink(props: Props) {
    const {
        children,
        text = '',
        category = '',
        type = '',
        area = '',
        amenity = '',
        search = '',
        featured = false,
        targetUrl = '/find-your-adventure',
        width = '100%',
        height = '100%',
        backgroundColor = 'transparent',
        borderRadius = 0,
        padding = 0,
        display = 'inline-block',
        textColor = '#000000',
        fontSize = 16,
        fontWeight = 'normal',
        textAlign = 'left',
        textDecoration = 'none',
        fontFamily: fontFamilyProp
    } = props

    // Get font from Framer document body
    const [bodyFontFamily, setBodyFontFamily] = useState<string>('')
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && document.body) {
            const computedStyle = window.getComputedStyle(document.body)
            const font = computedStyle.getPropertyValue('font-family')
            if (font) {
                setBodyFontFamily(font.trim())
            }
        }
    }, [])

    // Force color override using direct DOM manipulation to ensure it takes precedence
    useEffect(() => {
        if (containerRef.current && typeof window !== 'undefined') {
            containerRef.current.style.setProperty('color', textColor, 'important')
        }
    }, [textColor])

    // Use prop fontFamily if provided, otherwise use body font, otherwise fallback
    const fontFamily = fontFamilyProp && fontFamilyProp !== 'inherit' 
        ? fontFamilyProp 
        : (bodyFontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')

    // Only run on client-side
    if (typeof window === 'undefined') {
        return (
            <div style={{ 
                width, 
                height, 
                backgroundColor, 
                borderRadius, 
                padding, 
                display,
                color: textColor,
                fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
                fontWeight: typeof fontWeight === 'number' ? fontWeight : fontWeight,
                textAlign: textAlign as any,
                textDecoration: textDecoration,
                fontFamily: fontFamily
            }}>
                {text || children}
            </div>
        )
    }

    const handleClick = (e: React.MouseEvent) => {
        // Only run on client-side
        if (typeof window === 'undefined') {
            return
        }

        // Build filter params object (only include non-empty values)
        const filterParams: Record<string, string> = {}
        
        if (category && category.trim()) {
            filterParams.category = category.trim().toLowerCase()
        }
        if (type && type.trim()) {
            filterParams.type = type.trim()
        }
        if (area && area.trim()) {
            filterParams.area = area.trim()
        }
        if (amenity && amenity.trim()) {
            filterParams.amenity = amenity.trim()
        }
        if (search && search.trim()) {
            filterParams.search = search.trim()
        }
        if (featured) {
            filterParams.featured = 'true'
        }

        // Only proceed if we have at least one filter
        if (Object.keys(filterParams).length === 0) {
            console.warn('⚠️ FilterLink: No filters specified, navigating without filters')
            const currentPath = window.location.pathname
            const targetPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`
            if (currentPath !== targetPath) {
                window.location.href = targetUrl
            }
            return
        }

        console.log('🔗 FilterLink clicked, navigating to:', targetUrl, 'with filters:', filterParams)

        // Store filter params in sessionStorage (same method as breadcrumbs)
        // AdventureDirectory will pick this up and send to iframe
        try {
            const paramsString = JSON.stringify(filterParams)
            sessionStorage.setItem('__pendingBreadcrumbFilter', paramsString)
            console.log('✅ FilterLink: Stored filter for AdventureDirectory:', filterParams)

            // If we're already on the find-your-adventure page, try to send directly to iframe
            // Retry a few times in case iframe is still loading
            let attempts = 0
            const maxAttempts = 10
            const trySendDirectly = () => {
                try {
                    const iframe = document.getElementById('adventure-directory-iframe') as HTMLIFrameElement
                    if (iframe && iframe.contentWindow) {
                        console.log('🔗 FilterLink: Already on find-your-adventure page - sending filter immediately')
                        // Send directly to iframe
                        iframe.contentWindow.postMessage({
                            type: 'applyFilter',
                            params: filterParams,
                            source: 'filterLink'
                        }, '*')
                        console.log('✅ FilterLink: Sent filter directly to iframe')
                        // Clear stored filter since we sent it directly
                        sessionStorage.removeItem('__pendingBreadcrumbFilter')
                        return
                    }
                } catch (e) {
                    console.warn('⚠️ FilterLink: Error sending filter directly:', e)
                }

                attempts++
                if (attempts < maxAttempts) {
                    setTimeout(trySendDirectly, 100)
                }
            }

            // Try sending directly if on same page
            trySendDirectly()

            // Only navigate if we're NOT already on the target page
            // This prevents unnecessary reloads that interrupt the direct postMessage
            const currentPath = window.location.pathname
            const targetPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`
            
            if (currentPath !== targetPath) {
                // Navigate to clean URL (no parameters)
                window.location.href = targetUrl
            } else {
                console.log('🔗 FilterLink: Already on target page, skipping navigation')
            }
        } catch (e) {
            console.warn('⚠️ FilterLink: Error storing filter:', e)
            // Fallback: navigate without filters (only if not already on target page)
            const currentPath = window.location.pathname
            const targetPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`
            if (currentPath !== targetPath) {
                window.location.href = targetUrl
            }
        }
    }

    // Wrap children in a clickable div
    return (
        <div
            ref={containerRef}
            onClick={handleClick}
            style={{
                cursor: 'pointer',
                display: display,
                width: width,
                height: height,
                backgroundColor: backgroundColor,
                borderRadius: borderRadius,
                padding: padding,
                boxSizing: 'border-box',
                color: textColor, // Will be overridden with !important via useEffect
                fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
                fontWeight: typeof fontWeight === 'number' ? fontWeight : fontWeight,
                textAlign: textAlign as any,
                textDecoration: textDecoration,
                fontFamily: fontFamily
            }}
        >
            {text || children}
        </div>
    )
}

// Property controls for Framer
addPropertyControls(FilterLink, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
        description: "The element to wrap (image, button, text, etc.)"
    },
    category: {
        type: ControlType.String,
        title: "Category",
        description: "Filter by category (e.g., 'outdoor', 'stay', 'taste', 'culture')",
        placeholder: "outdoor"
    },
    type: {
        type: ControlType.String,
        title: "Type",
        description: "Filter by type (e.g., 'Biking', 'Hiking', 'Restaurant')",
        placeholder: "Biking"
    },
    area: {
        type: ControlType.String,
        title: "Area",
        description: "Filter by area (e.g., 'Charlottesville', 'Nelson County')",
        placeholder: "Charlottesville"
    },
    amenity: {
        type: ControlType.String,
        title: "Amenity",
        description: "Filter by amenity (e.g., 'Pet-Friendly', 'Outdoor Seating')",
        placeholder: "Pet-Friendly"
    },
    search: {
        type: ControlType.String,
        title: "Search",
        description: "Search term to filter by",
        placeholder: "wine"
    },
    featured: {
        type: ControlType.Boolean,
        title: "Featured Only",
        description: "Show only featured listings",
        defaultValue: false
    },
    targetUrl: {
        type: ControlType.String,
        title: "Target URL",
        description: "URL to navigate to (default: /find-your-adventure)",
        defaultValue: "/find-your-adventure",
        placeholder: "/find-your-adventure"
    },
    width: {
        type: ControlType.String,
        title: "Width",
        description: "Width of the clickable area (e.g., '100%', '200px')",
        defaultValue: "100%",
        placeholder: "100%"
    },
    height: {
        type: ControlType.String,
        title: "Height",
        description: "Height of the clickable area (e.g., '100%', '50px')",
        defaultValue: "100%",
        placeholder: "100%"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        description: "Background color (use transparent to make invisible)",
        defaultValue: "transparent"
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        description: "Border radius in pixels",
        defaultValue: 0,
        min: 0,
        max: 100
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        description: "Padding in pixels",
        defaultValue: 0,
        min: 0,
        max: 100
    },
    display: {
        type: ControlType.Enum,
        title: "Display",
        description: "CSS display property",
        options: ["inline-block", "block", "flex", "inline-flex", "inline"],
        optionTitles: ["Inline Block", "Block", "Flex", "Inline Flex", "Inline"],
        defaultValue: "inline-block"
    },
    text: {
        type: ControlType.String,
        title: "Text",
        description: "Text to display (leave empty to use wrapped content)",
        placeholder: "e.g., Find Adventures"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color of the text",
        defaultValue: "#000000"
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        description: "Font size in pixels",
        defaultValue: 16,
        min: 8,
        max: 100
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        description: "Font weight",
        options: ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
        optionTitles: ["Normal", "Bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
        defaultValue: "normal"
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        description: "Text alignment",
        options: ["left", "center", "right", "justify"],
        optionTitles: ["Left", "Center", "Right", "Justify"],
        defaultValue: "left"
    },
    textDecoration: {
        type: ControlType.Enum,
        title: "Text Decoration",
        description: "Text decoration (underline, etc.)",
        options: ["none", "underline", "overline", "line-through"],
        optionTitles: ["None", "Underline", "Overline", "Line Through"],
        defaultValue: "none"
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        description: "Font family (leave empty to use Framer document body font)",
        defaultValue: "",
        placeholder: "Auto (uses document body font)"
    }
})

