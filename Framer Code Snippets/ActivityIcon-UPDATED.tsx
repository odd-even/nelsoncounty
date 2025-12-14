import * as React from "react"

import { addPropertyControls, ControlType } from "framer"

import * as P from "phosphor-react"

export default function ActivityIcon({
    type,
    size,
    color,
    cultureIcon,
    communityIcon,
    tasteIcon,
    experienceIcon,
    outdoorIcon,
    stayIcon,
}) {
    // Clean the CMS category
    const clean = type
        ?.toLowerCase()
        ?.trim()
        ?.replace(/[^a-z]/g, "")

    // Category → selected Framer icon (or fallback to Phosphor)
    const categoryMap = {
        culture: cultureIcon || P.Globe,
        community: communityIcon || P.Users,
        taste: tasteIcon || P.ForkKnife,
        experience: experienceIcon || P.Sparkle,
        outdoor: outdoorIcon || P.Mountains,
        stay: stayIcon || P.House,
    }

    // Get the icon for this category
    const SelectedIcon = categoryMap[clean] || P.MapPin

    // Check if it's a React element (from ComponentInstance) or a component
    const isReactElement = React.isValidElement(SelectedIcon)

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: size,
                height: size,
                color: color,
            }}
        >
            {isReactElement ? (
                // If it's a React element (Framer icon component), render it directly
                SelectedIcon
            ) : (
                // If it's a Phosphor component, render it with props
                <SelectedIcon 
                    size={size} 
                    color={color} 
                    weight="regular"
                    width={size}
                    height={size}
                />
            )}
        </div>
    )
}

addPropertyControls(ActivityIcon, {
    type: {
        type: ControlType.String,
        title: "Activity",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 24,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000",
    },
    cultureIcon: {
        type: ControlType.ComponentInstance,
        title: "Culture",
    },
    communityIcon: {
        type: ControlType.ComponentInstance,
        title: "Community",
    },
    tasteIcon: {
        type: ControlType.ComponentInstance,
        title: "Taste",
    },
    experienceIcon: {
        type: ControlType.ComponentInstance,
        title: "Experience",
    },
    outdoorIcon: {
        type: ControlType.ComponentInstance,
        title: "Outdoor",
    },
    stayIcon: {
        type: ControlType.ComponentInstance,
        title: "Stay",
    },
})
