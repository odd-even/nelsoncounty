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
    strokeWidth,
    cultureIcon,
    communityIcon,
    tasteIcon,
    experienceIcon,
    outdoorIcon,
    stayIcon,
    // Activity type icons
    activitiesIcon,
    artArtisansIcon,
    bedAndBreakfastIcon,
    bikingIcon,
    breweriesCideriesIcon,
    cabinsCottagesIcon,
    campgroundsGlampingIcon,
    canoeingIcon,
    coffeeShopsIcon,
    distilleriesIcon,
    farmsOrchardsIcon,
    fishingIcon,
    golfIcon,
    guidedToursIcon,
    hikesTrailsIcon,
    horsebackRidingIcon,
    marketsDelisIcon,
    motelsInnsIcon,
    museumsHeritageIcon,
    restaurantsIcon,
    swimmingIcon,
    vacationRentalsIcon,
    vineyardsWineriesIcon,
    wholeHouseRentalsIcon,
    customCategories,
    showPreview,
}) {
    // Load Lucide icons dynamically (if lucide-react is installed)
    const [lucideIcons, setLucideIcons] = React.useState(null)
    
    React.useEffect(() => {
        // Try to load lucide-react dynamically
        import("lucide-react")
            .then((Lucide) => {
                if (Lucide && Lucide.Star) {
                    setLucideIcons({
                        // Activity type icons from your mapping
                        Star: Lucide.Star,
                        Anvil: Lucide.Anvil,
                        BedDouble: Lucide.BedDouble,
                        Bike: Lucide.Bike,
                        Beer: Lucide.Beer,
                        House: Lucide.House,
                        FlameKindling: Lucide.FlameKindling,
                        Sailboat: Lucide.Sailboat,
                        Coffee: Lucide.Coffee,
                        BottleWine: Lucide.BottleWine || Lucide.Wine,
                        Fish: Lucide.Fish,
                        TreeDeciduous: Lucide.TreeDeciduous,
                        Wallpaper: Lucide.Wallpaper,
                        MountainSnow: Lucide.MountainSnow,
                        CircleStar: Lucide.CircleStar,
                        ShoppingBasket: Lucide.ShoppingBasket,
                        Bed: Lucide.Bed,
                        ChefHat: Lucide.ChefHat,
                        Waves: Lucide.Waves,
                        Wine: Lucide.Wine,
                        HouseHeart: Lucide.HouseHeart,
                        // Legacy icons (keep for backward compatibility)
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
        // Phosphor icons
        globe: P.Globe,
        users: P.Users,
        forkknife: P.ForkKnife,
        sparkle: P.Sparkle,
        mountains: P.Mountains,
        mappin: P.MapPin,
        beermug: P.BeerStein || P.Beer,
        barrel: P.Cylinder,
        brewery: P.Factory,
        heart: P.Heart,
        camera: P.Camera,
        musicnote: P.MusicNote,
        campfire: P.Campfire,
        tent: P.Tent,
        car: P.Car,
        tree: P.Tree,
        sun: P.Sun,
        moon: P.Moon,
        bookmark: P.Bookmark,
        shoppingbag: P.ShoppingBag,
        ticket: P.Ticket,
        // Outdoor & Adventure
        fishing: P.Fish,
        hiking: P.PersonSimpleHike,
        swimming: P.SwimmingPool,
        golf: P.Golf,
        skiing: P.Snowflake,
        climbing: P.Tree,
        // Food & Drink
        bakery: P.Cookie,
        distillery: P.BeerBottle,
        // Activities
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
        // Lucide icons - exact names from your image (these override Phosphor icons with same names)
        star: "lucide-star",
        anvil: "lucide-anvil",
        beddouble: "lucide-beddouble",
        bike: "lucide-bike",
        beer: "lucide-beer",
        house: "lucide-house",
        flamekindling: "lucide-flamekindling",
        sailboat: "lucide-sailboat",
        coffee: "lucide-coffee",
        bottlewine: "lucide-bottlewine",
        fish: "lucide-fish",
        treedeciduous: "lucide-treedeciduous",
        wallpaper: "lucide-wallpaper",
        mountainsnow: "lucide-mountainsnow",
        circlestar: "lucide-circlestar",
        shoppingbasket: "lucide-shoppingbasket",
        bed: "lucide-bed",
        chefhat: "lucide-chefhat",
        waves: "lucide-waves",
        wine: "lucide-wine",
        househeart: "lucide-househeart",
        // Legacy Lucide icons
        kayak: "lucide-kayak",
        backpack: "lucide-backpack",
        mountain: "lucide-mountain",
        utensils: "lucide-utensils",
        hotel: "lucide-hotel",
        landmark: "lucide-landmark",
        theater: "lucide-theater",
        caravan: "lucide-caravan",
        lifebuoy: "lucide-lifebuoy",
        vegan: "lucide-vegan",
        kayaking: "lucide-kayak",
        restaurant: "lucide-utensils",
        museum: "lucide-landmark",
    }

    // Build category map - start with default categories
    const categoryMap = {}
    
    // Helper to extract icon key from formatted string (e.g., "anvil - Art & Artisans" → "anvil")
    const extractIconKey = (iconKey) => {
        if (!iconKey) return null
        // If it's formatted as "iconname - Activity Name", extract just the icon name
        const match = iconKey.match(/^([^-]+?)(?:\s*-\s*|$)/)
        return match ? match[1].trim() : iconKey.trim()
    }
    
    // Helper to get icon value (handles Lucide marker and formatted strings)
    const getIconValue = (iconKey) => {
        const cleanKey = extractIconKey(iconKey)
        return iconMap[cleanKey] || null
    }
    
    categoryMap.culture = getIconValue(cultureIcon) || P.Globe
    categoryMap.community = getIconValue(communityIcon) || P.Users
    categoryMap.taste = getIconValue(tasteIcon) || P.ForkKnife
    categoryMap.experience = getIconValue(experienceIcon) || P.Sparkle
    categoryMap.outdoor = getIconValue(outdoorIcon) || P.Mountains
    categoryMap.stay = getIconValue(stayIcon) || P.House
    
    // Activity type mappings
    categoryMap.activities = getIconValue(activitiesIcon) || getIconValue("star - Activities") || P.Star
    categoryMap["artartisans"] = getIconValue(artArtisansIcon) || getIconValue("anvil - Art & Artisans") || P.Hammer
    categoryMap["bedandbreakfast"] = getIconValue(bedAndBreakfastIcon) || getIconValue("beddouble - Bed and Breakfast") || P.Bed
    categoryMap.biking = getIconValue(bikingIcon) || getIconValue("bike - Biking") || P.Bicycle
    categoryMap["breweriescideries"] = getIconValue(breweriesCideriesIcon) || getIconValue("beer - Breweries & Cideries") || P.Beer
    categoryMap["cabinscottages"] = getIconValue(cabinsCottagesIcon) || getIconValue("house - Cabins & Cottages") || P.House
    categoryMap["campgroundsglamping"] = getIconValue(campgroundsGlampingIcon) || getIconValue("flamekindling - Campgrounds & Glamping") || P.Campfire
    categoryMap.canoeing = getIconValue(canoeingIcon) || getIconValue("sailboat - Canoeing") || P.Waves
    categoryMap["coffeeshops"] = getIconValue(coffeeShopsIcon) || getIconValue("coffee - Coffee Shops") || P.Coffee
    categoryMap.distilleries = getIconValue(distilleriesIcon) || getIconValue("bottlewine - Distilleries") || P.Wine
    categoryMap["farmsorchards"] = getIconValue(farmsOrchardsIcon) || getIconValue("beer - Farms & Orchards") || P.Beer
    categoryMap.fishing = getIconValue(fishingIcon) || getIconValue("fish - Fishing") || P.Fish
    categoryMap.golf = getIconValue(golfIcon) || getIconValue("treedeciduous - Golf") || P.Tree
    categoryMap["guidedtours"] = getIconValue(guidedToursIcon) || getIconValue("wallpaper - Guided Tours") || P.Image
    categoryMap["hikestrails"] = getIconValue(hikesTrailsIcon) || getIconValue("mountainsnow - Hikes & Trails") || P.Mountains
    categoryMap["horsebackriding"] = getIconValue(horsebackRidingIcon) || getIconValue("circlestar - Horseback Riding") || P.Star
    categoryMap["marketsdelis"] = getIconValue(marketsDelisIcon) || getIconValue("shoppingbasket - Markets & Delis") || P.ShoppingBag
    categoryMap["motelsinns"] = getIconValue(motelsInnsIcon) || getIconValue("bed - Motels & Inns") || P.Bed
    categoryMap["museumsheritage"] = getIconValue(museumsHeritageIcon) || getIconValue("star - Museums & Heritage") || P.Star
    categoryMap.restaurants = getIconValue(restaurantsIcon) || getIconValue("chefhat - Restaurants") || P.ForkKnife
    categoryMap.swimming = getIconValue(swimmingIcon) || getIconValue("waves - Swimming") || P.Waves
    categoryMap["vacationrentals"] = getIconValue(vacationRentalsIcon) || getIconValue("househeart - Vacation Rentals") || P.House
    categoryMap["vineyardswineries"] = getIconValue(vineyardsWineriesIcon) || getIconValue("wine - Vineyards & Wineries") || P.Wine
    categoryMap["wholehouserentals"] = getIconValue(wholeHouseRentalsIcon) || getIconValue("househeart - Whole House Rentals") || P.House
    
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
        // Lucide icons - exact names from your image
        "lucide-star": lucideIcons?.Star || P.Star,
        "lucide-anvil": lucideIcons?.Anvil || P.Hammer,
        "lucide-beddouble": lucideIcons?.BedDouble || P.Bed,
        "lucide-bike": lucideIcons?.Bike || P.Bicycle,
        "lucide-beer": lucideIcons?.Beer || P.BeerStein || P.Beer,
        "lucide-house": lucideIcons?.House || P.House,
        "lucide-flamekindling": lucideIcons?.FlameKindling || P.Campfire,
        "lucide-sailboat": lucideIcons?.Sailboat || P.Sailboat || P.Waves,
        "lucide-coffee": lucideIcons?.Coffee || P.Coffee,
        "lucide-bottlewine": lucideIcons?.BottleWine || lucideIcons?.Wine || P.Wine,
        "lucide-fish": lucideIcons?.Fish || P.Fish,
        "lucide-treedeciduous": lucideIcons?.TreeDeciduous || P.Tree,
        "lucide-wallpaper": lucideIcons?.Wallpaper || P.Image,
        "lucide-mountainsnow": lucideIcons?.MountainSnow || P.Mountains,
        "lucide-circlestar": lucideIcons?.CircleStar || P.Star,
        "lucide-shoppingbasket": lucideIcons?.ShoppingBasket || P.ShoppingBag,
        "lucide-bed": lucideIcons?.Bed || P.Bed,
        "lucide-chefhat": lucideIcons?.ChefHat || P.ForkKnife,
        "lucide-waves": lucideIcons?.Waves || P.Waves,
        "lucide-wine": lucideIcons?.Wine || P.Wine,
        "lucide-househeart": lucideIcons?.HouseHeart || P.House,
        // Legacy Lucide icons (keep for backward compatibility)
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
    const hasLucide = lucideIcons !== null && lucideIcons.Star !== undefined

    // Helper to check if an icon is actually a Lucide icon (not a Phosphor fallback)
    const isLucideIconComponent = (iconComponent) => {
        if (!hasLucide || !iconComponent || typeof iconComponent !== 'function') {
            return false
        }
        // Check if it's one of our loaded Lucide icons by comparing to the lucideIcons object
        if (lucideIcons) {
            const lucideIconValues = Object.values(lucideIcons)
            return lucideIconValues.includes(iconComponent)
        }
        return false
    }

    // Priority 1: Check if type matches a category in the map
    if (cleanType && categoryMap[cleanType]) {
        const iconValue = categoryMap[cleanType]
        if (typeof iconValue === 'string' && iconValue.startsWith('lucide-')) {
            Icon = lucideIconMap[iconValue] || P.Sun
            useLucide = isLucideIconComponent(Icon)
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
            useLucide = isLucideIconComponent(Icon)
        } else if (typeof iconValue === 'function' || React.isValidElement(iconValue)) {
            // Handle React components
            Icon = iconValue
        } else {
            Icon = iconValue
        }
    }
    // Priority 3: If no type/category match, try to use the first available category icon as fallback
    // This helps when testing icons in preview mode or when type/category aren't set
    if (Icon === P.Sun && (!cleanType || !categoryMap[cleanType]) && (!cleanCategory || !categoryMap[cleanCategory])) {
        // Use the first category icon that's set (for preview purposes)
        const categoryIcons = [
            { key: cultureIcon, name: 'culture' },
            { key: communityIcon, name: 'community' },
            { key: tasteIcon, name: 'taste' },
            { key: experienceIcon, name: 'experience' },
            { key: outdoorIcon, name: 'outdoor' },
            { key: stayIcon, name: 'stay' }
        ]
        
        for (const { key } of categoryIcons) {
            if (key) {
                const iconValue = getIconValue(key)
                if (typeof iconValue === 'string' && iconValue.startsWith('lucide-')) {
                    Icon = lucideIconMap[iconValue] || P.Sun
                    useLucide = isLucideIconComponent(Icon)
                    if (Icon !== P.Sun) break
                } else if (iconValue && (typeof iconValue === 'function' || React.isValidElement(iconValue))) {
                    Icon = iconValue
                    if (Icon !== P.Sun) break
                }
            }
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
            // Also check iconOptions for formatted strings
            if (previewIconKey === "sun") {
                for (const option of iconOptions) {
                    const optionKey = extractIconKey(option)
                    if (optionKey === previewIconKey || getIconValue(option) === categoryMap[cleanType]) {
                        previewIconKey = option
                        break
                    }
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
            // Also check iconOptions for formatted strings
            if (previewIconKey === "sun") {
                for (const option of iconOptions) {
                    const optionKey = extractIconKey(option)
                    if (optionKey === previewIconKey || getIconValue(option) === categoryMap[cleanCategory]) {
                        previewIconKey = option
                        break
                    }
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
                    <Icon size={size * 1.5} color={color} strokeWidth={strokeWidth || 2} />
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
                <Icon size={size} color={color} strokeWidth={strokeWidth || 2} />
            ) : (
                <Icon size={size} color={color} weight="regular" />
            )}
        </div>
    )
}

const iconOptions = [
    // Lucide Icons - Activity Mapping (from your image)
    "star - Activities",
    "anvil - Art & Artisans",
    "beddouble - Bed and Breakfast",
    "bike - Biking",
    "beer - Breweries & Cideries",
    "house - Cabins & Cottages",
    "flamekindling - Campgrounds & Glamping",
    "sailboat - Canoeing",
    "coffee - Coffee Shops",
    "bottlewine - Distilleries",
    "beer - Farms & Orchards",
    "fish - Fishing",
    "treedeciduous - Golf",
    "wallpaper - Guided Tours",
    "mountainsnow - Hikes & Trails",
    "circlestar - Horseback Riding",
    "shoppingbasket - Markets & Delis",
    "bed - Motels & Inns",
    "star - Museums & Heritage",
    "chefhat - Restaurants",
    "waves - Swimming",
    "househeart - Vacation Rentals",
    "wine - Vineyards & Wineries",
    "househeart - Whole House Rentals",
    // Legacy Lucide icons
    "kayak",
    "kayaking",
    "backpack",
    "mountain",
    "utensils",
    "hotel",
    "landmark",
    "museum",
    "theater",
    "caravan",
    "lifebuoy",
    "vegan",
    "restaurant",
    // Phosphor icons
    "globe",
    "users",
    "forkknife",
    "sparkle",
    "mountains",
    "mappin",
    "beermug",
    "barrel",
    "brewery",
    "heart",
    "camera",
    "musicnote",
    "campfire",
    "tent",
    "car",
    "tree",
    "sun",
    "moon",
    "bookmark",
    "shoppingbag",
    "ticket",
    // Outdoor & Adventure
    "fishing",
    "hiking",
    "swimming",
    "golf",
    "skiing",
    "climbing",
    // Food & Drink
    "bakery",
    "distillery",
    // Activities
    "gallery",
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
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        description: "Stroke thickness for Lucide icons (1-5)",
        defaultValue: 2,
        min: 1,
        max: 5,
        step: 0.5,
        displayStepper: true,
    },
    cultureIcon: {
        type: ControlType.Enum,
        title: "Culture",
        options: iconOptions,
        defaultValue: "globe",
    },
    communityIcon: {
        type: ControlType.Enum,
        title: "Community",
        options: iconOptions,
        defaultValue: "users",
    },
    tasteIcon: {
        type: ControlType.Enum,
        title: "Taste",
        options: iconOptions,
        defaultValue: "forkknife",
    },
    experienceIcon: {
        type: ControlType.Enum,
        title: "Experience",
        options: iconOptions,
        defaultValue: "sparkle",
    },
    outdoorIcon: {
        type: ControlType.Enum,
        title: "Outdoor",
        options: iconOptions,
        defaultValue: "mountains",
    },
    stayIcon: {
        type: ControlType.Enum,
        title: "Stay",
        options: iconOptions,
        defaultValue: "house",
    },
    // Activity Type Icons
    activitiesIcon: {
        type: ControlType.Enum,
        title: "Activities",
        options: iconOptions,
        defaultValue: "star - Activities",
    },
    artArtisansIcon: {
        type: ControlType.Enum,
        title: "Art & Artisans",
        options: iconOptions,
        defaultValue: "anvil - Art & Artisans",
    },
    bedAndBreakfastIcon: {
        type: ControlType.Enum,
        title: "Bed and Breakfast",
        options: iconOptions,
        defaultValue: "beddouble - Bed and Breakfast",
    },
    bikingIcon: {
        type: ControlType.Enum,
        title: "Biking",
        options: iconOptions,
        defaultValue: "bike - Biking",
    },
    breweriesCideriesIcon: {
        type: ControlType.Enum,
        title: "Breweries & Cideries",
        options: iconOptions,
        defaultValue: "beer - Breweries & Cideries",
    },
    cabinsCottagesIcon: {
        type: ControlType.Enum,
        title: "Cabins & Cottages",
        options: iconOptions,
        defaultValue: "house - Cabins & Cottages",
    },
    campgroundsGlampingIcon: {
        type: ControlType.Enum,
        title: "Campgrounds & Glamping",
        options: iconOptions,
        defaultValue: "flamekindling - Campgrounds & Glamping",
    },
    canoeingIcon: {
        type: ControlType.Enum,
        title: "Canoeing",
        options: iconOptions,
        defaultValue: "sailboat - Canoeing",
    },
    coffeeShopsIcon: {
        type: ControlType.Enum,
        title: "Coffee Shops",
        options: iconOptions,
        defaultValue: "coffee - Coffee Shops",
    },
    distilleriesIcon: {
        type: ControlType.Enum,
        title: "Distilleries",
        options: iconOptions,
        defaultValue: "bottlewine - Distilleries",
    },
    farmsOrchardsIcon: {
        type: ControlType.Enum,
        title: "Farms & Orchards",
        options: iconOptions,
        defaultValue: "beer - Farms & Orchards",
    },
    fishingIcon: {
        type: ControlType.Enum,
        title: "Fishing",
        options: iconOptions,
        defaultValue: "fish - Fishing",
    },
    golfIcon: {
        type: ControlType.Enum,
        title: "Golf",
        options: iconOptions,
        defaultValue: "treedeciduous - Golf",
    },
    guidedToursIcon: {
        type: ControlType.Enum,
        title: "Guided Tours",
        options: iconOptions,
        defaultValue: "wallpaper - Guided Tours",
    },
    hikesTrailsIcon: {
        type: ControlType.Enum,
        title: "Hikes & Trails",
        options: iconOptions,
        defaultValue: "mountainsnow - Hikes & Trails",
    },
    horsebackRidingIcon: {
        type: ControlType.Enum,
        title: "Horseback Riding",
        options: iconOptions,
        defaultValue: "circlestar - Horseback Riding",
    },
    marketsDelisIcon: {
        type: ControlType.Enum,
        title: "Markets & Delis",
        options: iconOptions,
        defaultValue: "shoppingbasket - Markets & Delis",
    },
    motelsInnsIcon: {
        type: ControlType.Enum,
        title: "Motels & Inns",
        options: iconOptions,
        defaultValue: "bed - Motels & Inns",
    },
    museumsHeritageIcon: {
        type: ControlType.Enum,
        title: "Museums & Heritage",
        options: iconOptions,
        defaultValue: "star - Museums & Heritage",
    },
    restaurantsIcon: {
        type: ControlType.Enum,
        title: "Restaurants",
        options: iconOptions,
        defaultValue: "chefhat - Restaurants",
    },
    swimmingIcon: {
        type: ControlType.Enum,
        title: "Swimming",
        options: iconOptions,
        defaultValue: "waves - Swimming",
    },
    vacationRentalsIcon: {
        type: ControlType.Enum,
        title: "Vacation Rentals",
        options: iconOptions,
        defaultValue: "househeart - Vacation Rentals",
    },
    vineyardsWineriesIcon: {
        type: ControlType.Enum,
        title: "Vineyards & Wineries",
        options: iconOptions,
        defaultValue: "wine - Vineyards & Wineries",
    },
    wholeHouseRentalsIcon: {
        type: ControlType.Enum,
        title: "Whole House Rentals",
        options: iconOptions,
        defaultValue: "househeart - Whole House Rentals",
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
