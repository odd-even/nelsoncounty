import * as React from "react"

import { addPropertyControls, ControlType } from "framer"

import * as P from "phosphor-react"

// Lucide icons will be loaded dynamically
// Note: lucide-react must be installed in your Framer project
// Install via: npm install lucide-react

export default function ActivityIcon({
    type,
    category,
    size,
    color,
    cultureIcon,
    communityIcon,
    tasteIcon,
    experienceIcon,
    outdoorIcon,
    stayIcon,
    customCategories,
    showPreview,
}) {
    // Load Lucide icons dynamically (if lucide-react is installed)
    const [lucideIcons, setLucideIcons] = React.useState(null)
    
    React.useEffect(() => {
        // Try to load lucide-react dynamically
        import("lucide-react")
            .then((Lucide) => {
                if (Lucide && Lucide.Beer) {
                    setLucideIcons({
                        Beer: Lucide.Beer,
                        Kayak: Lucide.Kayak,
                        Backpack: Lucide.Backpack,
                        Mountain: Lucide.Mountain,
                        Utensils: Lucide.Utensils,
                        Hotel: Lucide.Hotel,
                        Landmark: Lucide.Landmark,
                        Theater: Lucide.Theater,
                        Caravan: Lucide.Caravan,
                        LifeBuoy: Lucide.LifeBuoy,
                        Vegan: Lucide.Vegan,
                    })
                    console.log("✅ Lucide icons loaded successfully")
                }
            })
            .catch(() => {
                // Silently fail - will use Phosphor fallbacks
                console.warn("⚠️ lucide-react not installed. Install it to use Lucide icons: npm install lucide-react")
            })
    }, [])

    // Helper function to clean/normalize category/type names
    const cleanName = (name) => {
        return name
            ?.toLowerCase()
            ?.trim()
            ?.replace(/[^a-z]/g, "") || ""
    }

    // Map dropdown values → actual icon components
    const iconMap = {
        globe: P.Globe,
        users: P.Users,
        forkknife: P.ForkKnife,
        sparkle: P.Sparkle,
        mountains: P.Mountains,
        house: P.House,
        mappin: P.MapPin,
        wine: P.Wine,
        beermug: "lucide-beer", // Uses Lucide Beer icon (beer mug)
        barrel: P.Cylinder,
        brewery: P.Factory,
        bike: P.Bicycle,
        heart: P.Heart,
        coffee: P.Coffee,
        camera: P.Camera,
        musicnote: P.MusicNote,
        campfire: P.Campfire,
        tent: P.Tent,
        // Lucide icons - better alternatives
        kayak: P.Waves, // Different from kayaking
        backpack: "lucide-backpack",
        mountain: "lucide-mountain",
        utensils: P.ForkKnife, // Different from restaurant
        hotel: "lucide-hotel",
        landmark: P.Building, // Different from museum
        theater: "lucide-theater",
        caravan: "lucide-caravan",
        lifebuoy: "lucide-lifebuoy",
        vegan: "lucide-vegan",
        car: P.Car,
        tree: P.Tree,
        sun: P.Sun,
        moon: P.Moon,
        star: P.Star,
        bookmark: P.Bookmark,
        shoppingbag: P.ShoppingBag,
        ticket: P.Ticket,
        // Outdoor & Adventure
        fishing: P.Fish,
        hiking: P.PersonSimpleHike,
        swimming: P.SwimmingPool,
        golf: P.Golf,
        skiing: P.Snowflake,
        kayaking: "lucide-kayak", // Use Lucide Kayak
        climbing: P.Tree, // Different from mountains
        // Food & Drink
        restaurant: "lucide-utensils", // Use Lucide Utensils
        bakery: P.Cookie,
        distillery: P.BeerBottle,
        // Activities
        museum: "lucide-landmark", // Use Lucide Landmark
        gallery: P.PaintBrush,
        festival: P.Confetti,
        // Nature & Places
        park: P.Tree,
        beach: P.Waves,
        farm: P.Barn,
        orchard: P.Apple,
        // Sports & Recreation
        sports: P.Basketball,
        tennis: P.Target,
        // Misc
        resort: P.PalmTree,
        attraction: P.Star,
        tour: P.NavigationArrow,
        event: P.Calendar,
        shop: P.Storefront,
    }

    // Build category map - start with default categories
    const categoryMap = {}
    
    // Helper to get icon value (handles Lucide marker)
    const getIconValue = (iconKey) => {
        return iconMap[iconKey] || null
    }
    
    categoryMap.culture = getIconValue(cultureIcon) || P.Globe
    categoryMap.community = getIconValue(communityIcon) || P.Users
    categoryMap.taste = getIconValue(tasteIcon) || P.ForkKnife
    categoryMap.experience = getIconValue(experienceIcon) || P.Sparkle
    categoryMap.outdoor = getIconValue(outdoorIcon) || P.Mountains
    categoryMap.stay = getIconValue(stayIcon) || P.House
    
    // Add custom categories if provided
    if (customCategories && Array.isArray(customCategories)) {
        customCategories.forEach((cat) => {
            if (cat && cat.name && cat.icon) {
                const cleanCatName = cleanName(cat.name)
                const iconValue = getIconValue(cat.icon)
                if (iconValue) {
                    categoryMap[cleanCatName] = iconValue
                }
            }
        })
    }

    // Map Lucide icon markers to actual components (with fallbacks if not available)
    const lucideIconMap = {
        "lucide-beer": lucideIcons?.Beer || P.BeerStein || P.Beer,
        "lucide-kayak": lucideIcons?.Kayak || P.Waves,
        "lucide-backpack": lucideIcons?.Backpack || P.Bag,
        "lucide-mountain": lucideIcons?.Mountain || P.Mountains,
        "lucide-utensils": lucideIcons?.Utensils || P.ForkKnife,
        "lucide-hotel": lucideIcons?.Hotel || P.Bed,
        "lucide-landmark": lucideIcons?.Landmark || P.Building,
        "lucide-theater": lucideIcons?.Theater || P.Mask,
        "lucide-caravan": lucideIcons?.Caravan || P.Car,
        "lucide-lifebuoy": lucideIcons?.LifeBuoy || P.Circle,
        "lucide-vegan": lucideIcons?.Vegan || P.Leaf,
    }

    // Try to find icon: first check type, then fallback to category
    let Icon = P.Sun // Default fallback
    let useLucide = false
    
    const cleanType = cleanName(type)
    const cleanCategory = cleanName(category)
    
    // Check if Lucide is available
    const hasLucide = lucideIcons !== null && lucideIcons.Beer !== undefined

    // Priority 1: Check if type matches a category in the map
    if (cleanType && categoryMap[cleanType]) {
        const iconValue = categoryMap[cleanType]
        if (typeof iconValue === 'string' && iconValue.startsWith('lucide-')) {
            Icon = lucideIconMap[iconValue] || P.Sun
            // Check if we actually got a Lucide icon (not a fallback)
            const isLucideIcon = hasLucide && Icon && 
                                 typeof Icon === 'function' && 
                                 Icon !== P.Sun && Icon !== P.Waves && 
                                 Icon !== P.Drop && Icon !== P.Bag && Icon !== P.ShoppingBag && 
                                 Icon !== P.Mountains && Icon !== P.ForkKnife && Icon !== P.Bed && 
                                 Icon !== P.House && Icon !== P.Building && Icon !== P.Mask && 
                                 Icon !== P.Users && Icon !== P.Car && Icon !== P.Circle && 
                                 Icon !== P.Leaf && Icon !== P.Tree && Icon !== P.BeerStein && 
                                 Icon !== P.Beer && Icon !== P.BeerBottle
            useLucide = isLucideIcon
        } else if (typeof iconValue === 'function' || React.isValidElement(iconValue)) {
            // Handle React components
            Icon = iconValue
        } else {
            Icon = iconValue
        }
    }
    // Priority 2: Check if category matches a category in the map
    else if (cleanCategory && categoryMap[cleanCategory]) {
        const iconValue = categoryMap[cleanCategory]
        if (typeof iconValue === 'string' && iconValue.startsWith('lucide-')) {
            Icon = lucideIconMap[iconValue] || P.Sun
            // Check if we actually got a Lucide icon (not a fallback)
            const isLucideIcon = hasLucide && Icon && 
                                 typeof Icon === 'function' && 
                                 Icon !== P.Sun && Icon !== P.Waves && 
                                 Icon !== P.Drop && Icon !== P.Bag && Icon !== P.ShoppingBag && 
                                 Icon !== P.Mountains && Icon !== P.ForkKnife && Icon !== P.Bed && 
                                 Icon !== P.House && Icon !== P.Building && Icon !== P.Mask && 
                                 Icon !== P.Users && Icon !== P.Car && Icon !== P.Circle && 
                                 Icon !== P.Leaf && Icon !== P.Tree && Icon !== P.BeerStein && 
                                 Icon !== P.Beer && Icon !== P.BeerBottle
            useLucide = isLucideIcon
        } else if (typeof iconValue === 'function' || React.isValidElement(iconValue)) {
            // Handle React components
            Icon = iconValue
        } else {
            Icon = iconValue
        }
    }

    // If showPreview is true, show a larger preview with label
    if (showPreview) {
        // Find which icon key is currently selected
        let previewIconKey = "sun"
        if (cleanType && categoryMap[cleanType]) {
            // Find the key that maps to this icon
            for (const [key, value] of Object.entries(iconMap)) {
                if (value === categoryMap[cleanType] || 
                    (typeof value === 'string' && value.startsWith('lucide-') && 
                     lucideIconMap[value] === categoryMap[cleanType])) {
                    previewIconKey = key
                    break
                }
            }
        } else if (cleanCategory && categoryMap[cleanCategory]) {
            for (const [key, value] of Object.entries(iconMap)) {
                if (value === categoryMap[cleanCategory] || 
                    (typeof value === 'string' && value.startsWith('lucide-') && 
                     lucideIconMap[value] === categoryMap[cleanCategory])) {
                    previewIconKey = key
                    break
                }
            }
        }
        
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px",
                    gap: "12px",
                    border: "1px dashed #ddd",
                    borderRadius: "8px",
                }}
            >
                <div
                    style={{
                        fontSize: "11px",
                        color: "#999",
                        textTransform: "capitalize",
                        fontWeight: 500,
                    }}
                >
                    Preview: {previewIconKey}
                </div>
                {useLucide ? (
                    <Icon size={size * 1.5} color={color} />
                ) : (
                    <Icon size={size * 1.5} color={color} weight="regular" />
                )}
            </div>
        )
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {useLucide ? (
                <Icon size={size} color={color} />
            ) : (
                <Icon size={size} color={color} weight="regular" />
            )}
        </div>
    )
}

const iconOptions = [
    "globe",
    "users",
    "forkknife",
    "sparkle",
    "mountains",
    "house",
        "mappin",
        "wine",
        "beermug",
        "barrel",
        "brewery",
        "bike",
    "heart",
    "coffee",
    "camera",
    "musicnote",
    "campfire",
    "tent",
    "car",
    "tree",
    "sun",
    "moon",
    "star",
    "bookmark",
    "shoppingbag",
    "ticket",
    // Outdoor & Adventure
    "fishing",
    "hiking",
    "swimming",
    "golf",
    "skiing",
    "kayaking",
    "kayak",
    "backpack",
    "mountain",
    "climbing",
    "lifebuoy",
    // Food & Drink
    "restaurant",
    "utensils",
    "bakery",
    "distillery",
    "vegan",
    // Activities
    "museum",
    "landmark",
    "gallery",
    "theater",
    "festival",
    // Nature & Places
    "park",
    "beach",
    "farm",
    "orchard",
    // Sports & Recreation
    "sports",
    "tennis",
    // Misc
    "hotel",
    "caravan",
    "resort",
    "attraction",
    "tour",
    "event",
    "shop",
]

addPropertyControls(ActivityIcon, {
    type: {
        type: ControlType.String,
        title: "Type",
        description: "Specific activity type (e.g., 'Biking', 'Hiking') - checked first",
    },
    category: {
        type: ControlType.String,
        title: "Category",
        description: "Category name (e.g., 'outdoor', 'culture') - used as fallback",
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
        type: ControlType.Enum,
        title: "Culture",
        options: iconOptions,
        defaultValue: "globe",
        description: "💡 The icon previews automatically in the component above",
    },
    communityIcon: {
        type: ControlType.Enum,
        title: "Community",
        options: iconOptions,
        defaultValue: "users",
        description: "💡 The icon previews automatically in the component above",
    },
    tasteIcon: {
        type: ControlType.Enum,
        title: "Taste",
        options: iconOptions,
        defaultValue: "forkknife",
        description: "💡 The icon previews automatically in the component above",
    },
    experienceIcon: {
        type: ControlType.Enum,
        title: "Experience",
        options: iconOptions,
        defaultValue: "sparkle",
        description: "💡 The icon previews automatically in the component above",
    },
    outdoorIcon: {
        type: ControlType.Enum,
        title: "Outdoor",
        options: iconOptions,
        defaultValue: "mountains",
        description: "💡 The icon previews automatically in the component above",
    },
    stayIcon: {
        type: ControlType.Enum,
        title: "Stay",
        options: iconOptions,
        defaultValue: "house",
        description: "💡 The icon previews automatically in the component above",
    },
    showPreview: {
        type: ControlType.Boolean,
        title: "Show Large Preview",
        description: "Display a larger preview with icon name (helpful for choosing icons)",
        defaultValue: false,
    },
    customCategories: {
        type: ControlType.Array,
        title: "➕ Additional Categories",
        description: "Add new categories (e.g., 'Biking' with 'bike' icon)",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Category Name",
                    description: "Exact name from CMS (e.g., 'Biking')",
                    defaultValue: "",
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: iconOptions,
                    defaultValue: "mappin",
                },
            },
        },
        defaultValue: [],
    },
})
