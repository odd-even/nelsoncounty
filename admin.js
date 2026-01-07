const initialData = 
{
  "listings": [
    {
      "id": "1",
      "name": "Devil's Backbone Brewing Company",
      "type": "Brewery",
      "area": "Wintergreen",
      "description": "Award-winning craft brewery nestled at the base of the Blue Ridge Mountains. Enjoy locally-brewed beers, live music, and mountain views from the outdoor beer garden.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://dbbrewingcompany.com",
      "phone": "(434) 361-1001",
      "address": "200 Mosbys Run, Roseland, VA 22967",
      "amenities": ["Pet-Friendly", "Outdoor Seating", "Live Music", "Food Available"],
      "featured": true
    },
    {
      "id": "2",
      "name": "Crabtree Falls Trail",
      "type": "Hiking",
      "area": "Montebello",
      "description": "Virginia's highest vertical-drop cascading waterfall. This moderate 3-mile round trip hike features stunning overlooks and is especially beautiful in fall foliage season.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.fs.usda.gov/recarea/gwj/recarea/?recid=73957",
      "phone": "(540) 291-2188",
      "address": "Crabtree Falls Hwy, Montebello, VA 24464",
      "amenities": ["Free", "Kid-Friendly", "Scenic Views", "Photography"],
      "featured": true
    },
    {
      "id": "3",
      "name": "Wintergreen Resort",
      "type": "Outdoor",
      "area": "Wintergreen",
      "description": "Four-season mountain resort offering skiing, snowboarding, mountain biking, hiking, golf, and spa services. Stunning Blue Ridge Mountain views year-round.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.wintergreenresort.com",
      "phone": "(434) 325-2200",
      "address": "39 Mountain Inn Loop, Wintergreen, VA 22958",
      "amenities": ["Kid-Friendly", "Seasonal", "Wheelchair Accessible", "Lessons Available"],
      "featured": true
    },
    {
      "id": "4",
      "name": "Blue Mountain Brewery",
      "type": "Brewery",
      "area": "Afton",
      "description": "Farm brewery and taproom with an on-site hop yard. Full restaurant menu featuring locally-sourced ingredients and spectacular mountain views from multiple decks.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.bluemountainbrewery.com",
      "phone": "(540) 456-8020",
      "address": "9519 Critzers Shop Rd, Afton, VA 22920",
      "amenities": ["Pet-Friendly", "Outdoor Seating", "Food Available", "Live Music"],
      "featured": false
    },
    {
      "id": "5",
      "name": "The Plunge at Wintergreen",
      "type": "Outdoor",
      "area": "Wintergreen",
      "description": "Outdoor aquatic complex featuring water slides, lazy river, zero-entry pool, and lap pool. Perfect family summer destination with mountain views.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.wintergreenresort.com/play/the-plunge",
      "phone": "(434) 325-8169",
      "address": "Wintergreen Dr, Wintergreen, VA 22958",
      "amenities": ["Kid-Friendly", "Seasonal", "Wheelchair Accessible", "Lifeguards"],
      "featured": false
    },
    {
      "id": "6",
      "name": "Rockfish Valley Trail",
      "type": "Hiking",
      "area": "Nellysford",
      "description": "Easy 2-mile paved trail perfect for walking, jogging, or biking. Follows Rockfish River with mountain views and connects to local breweries and shops.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.nelsoncounty-va.gov/facilities/facility/details/Rockfish-Valley-Trail-25",
      "phone": "(434) 263-7015",
      "address": "Rockfish Valley Hwy, Nellysford, VA 22958",
      "amenities": ["Free", "Kid-Friendly", "Pet-Friendly", "Wheelchair Accessible", "Biking"],
      "featured": false
    },
    {
      "id": "7",
      "name": "Wild Wolf Brewing Company",
      "type": "Brewery",
      "area": "Nellysford",
      "description": "Craft brewery with full kitchen, outdoor patio, and kid-friendly atmosphere. Known for creative seasonal beers and live music on weekends.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.wildwolfbeer.com",
      "phone": "(434) 361-0088",
      "address": "2773 Rockfish Valley Hwy, Nellysford, VA 22958",
      "amenities": ["Kid-Friendly", "Pet-Friendly", "Outdoor Seating", "Food Available", "Live Music"],
      "featured": false
    },
    {
      "id": "8",
      "name": "Stoney Creek Golf Course",
      "type": "Outdoor",
      "area": "Wintergreen",
      "description": "Championship 18-hole golf course designed by Rees Jones. Features dramatic elevation changes, mountain views, and challenging play for all skill levels.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.wintergreenresort.com/play/golf",
      "phone": "(434) 325-8250",
      "address": "Wintergreen Dr, Wintergreen, VA 22958",
      "amenities": ["Seasonal", "Pro Shop", "Lessons Available", "Cart Rental"],
      "featured": false
    },
    {
      "id": "9",
      "name": "Humpback Rocks Trail",
      "type": "Hiking",
      "area": "Afton",
      "description": "Challenging 2-mile hike to stunning 360-degree Blue Ridge views. Part of the Appalachian Trail with rocky terrain and rewarding summit panoramas.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.nps.gov/blri/planyourvisit/humpback-rocks.htm",
      "phone": "(540) 943-5187",
      "address": "Milepost 5.8, Blue Ridge Parkway, Afton, VA 22920",
      "amenities": ["Free", "Scenic Views", "Photography", "Appalachian Trail"],
      "featured": true
    },
    {
      "id": "10",
      "name": "Veritas Vineyards",
      "type": "Winery",
      "area": "Afton",
      "description": "Award-winning winery with stunning views of the Blue Ridge foothills. Offers tastings, tours, and a beautiful outdoor pavilion for events.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.veritaswines.com",
      "phone": "(540) 456-8000",
      "address": "151 Veritas Ln, Afton, VA 22920",
      "amenities": ["Pet-Friendly", "Outdoor Seating", "Tours Available", "Events"],
      "featured": false
    },
    {
      "id": "11",
      "name": "Bold Rock Hard Cider",
      "type": "Cidery",
      "area": "Nellysford",
      "description": "Virginia's first cidery and taproom featuring handcrafted hard ciders made from fresh-pressed Virginia apples. Enjoy live music on the outdoor stage with mountain views, lawn games, and seasonal cider releases. The expansive grounds include a tasting room, outdoor pavilion, and food trucks.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.boldrock.com",
      "phone": "(434) 361-1030",
      "address": "1020 Rockfish Valley Hwy, Nellysford, VA 22958",
      "amenities": ["Pet-Friendly", "Outdoor Seating", "Live Music", "Kid-Friendly", "Tours Available", "Food Available"],
      "featured": true
    },
    {
      "id": "12",
      "name": "Spy Rock",
      "type": "Hiking",
      "area": "Montebello",
      "description": "A moderately challenging 3.7-mile out-and-back trail leading to stunning 360-degree views from a rocky outcrop. Popular spot for sunrise and sunset photography. The trail passes through beautiful hardwood forest and offers glimpses of wildlife. Best visited in spring for wildflowers or fall for foliage.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.hikingupward.com/GWNF/SpyRock",
      "phone": "(540) 291-2188",
      "address": "Spy Rock Rd, Montebello, VA 24464",
      "amenities": ["Free", "Scenic Views", "Photography", "Kid-Friendly"],
      "featured": false
    },
    {
      "id": "13",
      "name": "Pharsalia",
      "type": "Farm & Orchard",
      "area": "Lovingston",
      "description": "Working farm and educational center offering farm tours, workshops, and seasonal events. Visit the farm store for locally-raised grass-fed beef, pastured pork, and farm-fresh eggs. Popular destination for school field trips and agritourism. Beautiful historic property with walking trails and picnic areas.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.pharsalia.org",
      "phone": "(434) 277-5050",
      "address": "3735 Variety Mills Rd, Lovingston, VA 22949",
      "amenities": ["Kid-Friendly", "Tours Available", "Events", "Seasonal", "Free"],
      "featured": false
    },
    {
      "id": "14",
      "name": "Swannanoa Palace",
      "type": "Attraction",
      "area": "Afton",
      "description": "Historic Italian Renaissance-style marble mansion built in 1912 atop Afton Mountain. Offers guided tours showcasing Tiffany stained glass windows, marble columns, and panoramic mountain views. Rich history includes its time as a country club and art school. Perfect for architecture enthusiasts and history buffs.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.swannanoavalley.org",
      "phone": "(434) 325-5539",
      "address": "3051 Swannanoa Dr, Afton, VA 22920",
      "amenities": ["Tours Available", "Photography", "Scenic Views", "Wheelchair Accessible"],
      "featured": false
    },
    {
      "id": "15",
      "name": "Tye River Gap Trail",
      "type": "Hiking",
      "area": "Roseland",
      "description": "Moderate 2.4-mile trail following the historic Tye River through scenic forest. Features multiple creek crossings, swimming holes, and remnants of old railroad grade. Great for families and dogs. Less crowded than other area trails. Best visited in summer for swimming and wading opportunities.",
      "image1": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "image2": "https://www.adventurebook.com/connect/wp-content/uploads/sites/2/2021/10/Adventure-Ideas.jpg",
      "website": "https://www.nelsoncounty-va.gov/trails",
      "phone": "(434) 263-7015",
      "address": "Tye River Gap, VA-56, Roseland, VA 22967",
      "amenities": ["Free", "Pet-Friendly", "Kid-Friendly", "Scenic Views", "Seasonal"],
      "featured": false
    }
  ],
  "filterOptions": {
    "types": ["Brewery", "Winery", "Cidery", "Hiking", "Outdoor", "Indoor Activity", "Attraction", "Farm & Orchard"],
    "areas": ["Afton", "Wintergreen", "Lovingston", "Nellysford", "Montebello", "Arrington", "Roseland"],
    "amenities": ["Kid-Friendly", "Pet-Friendly", "Wheelchair Accessible", "Free", "Seasonal", "Outdoor Seating", "Food Available", "Live Music", "Tours Available", "Events", "Photography", "Scenic Views", "Biking", "Appalachian Trail", "Pro Shop", "Lessons Available", "Cart Rental", "Lifeguards"]
  }
}
;

const REMOVED_LISTING_FIELDS = [
    'imageGallery',
    'amenitiesTags',
    'wordpressUrl',
    'authorEmail',
    'authorUsername',
    'authorId',
    'status',
    'commentStatus',
    'pingStatus',
    'originalCategories',
    'originalAttributes',
    'dataConfidence',
    'notes',
    'descriptionSource',
    'amenitiesGuessed',
    'missingFields'
];

function sanitizeListing(listing) {
    if (!listing || typeof listing !== 'object') return listing;
    
    const galleryImage = listing.imageGallery;
    if (!listing.image3 && galleryImage) {
        listing.image3 = galleryImage;
    }
    
    REMOVED_LISTING_FIELDS.forEach(function(field) {
        if (field in listing) {
            delete listing[field];
        }
    });
    delete listing.imageGallery;
    
    return listing;
}

function normalizeFilterValue(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed;
}

// Load categories from localStorage (synced between admin and front page)
function loadCategoriesFromStorage() {
    try {
        const stored = localStorage.getItem('nelsonCounty_categories');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error loading categories from storage:', e);
    }
    return null;
}

// Save categories to localStorage (synced between admin and front page)
function saveCategoriesToStorage(categories) {
    try {
        localStorage.setItem('nelsonCounty_categories', JSON.stringify(categories));
        return true;
    } catch (e) {
        console.error('Error saving categories to storage:', e);
        return false;
    }
}

// ===========================================
// ICON MAPPING MANAGEMENT (synced between admin and front page)
// ===========================================
function loadIconMappingsFromStorage() {
    try {
        const stored = localStorage.getItem('nelsonCounty_iconMappings');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error loading icon mappings from storage:', e);
    }
    return null;
}

function saveIconMappingsToStorage(iconMappings) {
    try {
        localStorage.setItem('nelsonCounty_iconMappings', JSON.stringify(iconMappings));
        return true;
    } catch (e) {
        console.error('Error saving icon mappings to storage:', e);
        return false;
    }
}

// Default icon mappings - comprehensive list (merged from admin and front page)
const DEFAULT_ICON_MAPPINGS = {
    'Wine': 'icon-wine',
    'Winery': 'icon-wine',
    'Beer': 'icon-beer',
    'Brewery': 'icon-beer',
    'Spirits': 'icon-spirits',
    'Distillery': 'icon-spirits',
    'Cocktails': 'icon-cocktail',
    'Cocktail Bar': 'icon-cocktail',
    'Coffee': 'icon-coffee',
    'Coffee Shop': 'icon-coffee',
    'Café': 'icon-coffee',
    'Tea': 'icon-tea',
    'Tea Room': 'icon-tea',
    'Restaurant': 'icon-restaurant',
    'Dining': 'icon-restaurant',
    'Bakery': 'icon-bakery',
    'Patisserie': 'icon-bakery',
    'Cheese': 'icon-cheese',
    'Fromagerie': 'icon-cheese',
    'Chocolate': 'icon-chocolate',
    'Chocolatier': 'icon-chocolate',
    'Museum': 'icon-museum',
    'Art': 'icon-art',
    'Art Gallery': 'icon-gallery',
    'Gallery': 'icon-gallery',
    'Hiking': 'icon-hiking',
    'Hike': 'icon-hiking',
    'Trail': 'icon-hiking',
    'Cycling': 'icon-cycling',
    'Bike': 'icon-cycling',
    'Activity': 'icon-activity',
    'Activities': 'icon-activity',
    'Outdoor': 'icon-outdoor',
    'Outdoor Activity': 'icon-outdoor',
    'Kayaking': 'icon-kayaking',
    'Kayak': 'icon-kayaking',
    'Spa': 'icon-spa',
    'Wellness': 'icon-wellness',
    'Health': 'icon-wellness',
    'Shopping': 'icon-shopping',
    'Shop': 'icon-shopping',
    'Market': 'icon-market',
    'Farmers Market': 'icon-market',
    'Concert': 'icon-concert',
    'Music': 'icon-concert',
    'Theater': 'icon-theater',
    'Theatre': 'icon-theater',
    'Cinema': 'icon-cinema',
    'Movie': 'icon-cinema',
    'Film': 'icon-cinema',
    'Festival': 'icon-festival',
    'Event': 'icon-festival',
    'Hotel': 'icon-lodging',
    'Lodging': 'icon-lodging',
    'B&B': 'icon-lodging',
    'BnB': 'icon-lodging',
    'Inn': 'icon-lodging',
    'Cabin': 'icon-lodging',
    'Camping': 'icon-lodging',
    'Transport': 'icon-transport',
    'Transportation': 'icon-transport',
    'Train': 'icon-train',
    'Railway': 'icon-train',
    'Boat': 'icon-boat',
    'Ferry': 'icon-boat',
    'Scenic': 'icon-scenic',
    'Viewpoint': 'icon-viewpoint',
    'Lookout': 'icon-viewpoint',
    'Park': 'icon-park',
    'Garden': 'icon-garden',
    'Beach': 'icon-beach',
    'History': 'icon-history',
    'Historical': 'icon-history',
    'Heritage': 'icon-history',
    'Culture': 'icon-culture',
    'Cultural': 'icon-culture',
    'Architecture': 'icon-architecture',
    'Building': 'icon-architecture',
    'Local': 'icon-local',
    'Tour': 'icon-tour',
    'Guided Tour': 'icon-tour',
    'Workshop': 'icon-workshop',
    'Class': 'icon-class',
    'Course': 'icon-class',
    'Food': 'icon-food',
    'Cuisine': 'icon-food',
    'Cidery': 'icon-cidery',
    'Cider': 'icon-cidery',
    'Indoor Activity': 'icon-indoor',
    'Indoor': 'icon-indoor',
    'Attraction': 'icon-attraction',
    'Attractions': 'icon-attraction',
    'Farm & Orchard': 'icon-farm',
    'Farm': 'icon-farm',
    'Orchard': 'icon-farm'
};

// Initialize icon mappings from storage or defaults
let ICON_MAPPINGS = loadIconMappingsFromStorage();
if (!ICON_MAPPINGS || Object.keys(ICON_MAPPINGS).length === 0) {
    ICON_MAPPINGS = DEFAULT_ICON_MAPPINGS;
    saveIconMappingsToStorage(ICON_MAPPINGS);
}

// Default category definitions - comprehensive list based on user requirements
const DEFAULT_TYPE_CATEGORIES = {
    'taste': {
        emoji: '☕',
        name: 'Taste',
        description: 'Food and drink experiences of all kinds.',
        icon: 'icon-food',
        types: ['Restaurant', 'Café', 'Coffee Shop', 'Bakery', 'Brewery', 'Winery', 'Cidery', 'Distillery', 'Bar', 'Cocktail Bar', 'Food Market', 'Farmers Market', 'Food Tour', 'Cooking Class', 'Local Specialty', 'Street Food', 'Fine Dining']
    },
    'stay': {
        emoji: '🏠',
        name: 'Stay',
        description: 'Places to sleep or retreat.',
        icon: 'icon-lodging',
        types: ['Lodging', 'Hotel', 'Resort', 'B&B', 'BnB', 'Inn', 'Cabin', 'Camping', 'Glamping', 'Hostel', 'Boutique Stay', 'Treehouse', 'Unique Stay', 'Airbnb', 'Lodge', 'Boat', 'Entire House', 'House Stay', 'House Rental', 'Vacation Rental', 'Rental', 'Apartment', 'Condo', 'Cottage', 'Villa', 'Home', 'Property']
    },
    'outdoor': {
        emoji: '⛰️',
        name: 'Outdoor',
        description: 'Nature, adventure, and recreation outside.',
        icon: 'icon-outdoor',
        types: ['Hiking', 'Outdoor', 'Outdoor Activity', 'Park', 'Beach', 'Trail', 'Camping', 'Climbing', 'Water Sports', 'Skiing', 'Scenic Drive', 'Viewpoint', 'Nature Walk', 'Biking', 'Cycling', 'Kayaking', 'Kayak', 'Farm & Orchard', 'National Park', 'Hike']
    },
    'culture': {
        emoji: '🎭',
        name: 'Culture',
        description: 'Art, heritage, people, and traditions.',
        icon: 'icon-culture',
        types: ['Museum', 'Gallery', 'Art Gallery', 'Art', 'Architecture', 'Landmark', 'Historical Site', 'Festival', 'Cultural Tour', 'Craft', 'Music', 'Theater', 'Theatre', 'Dance', 'Attraction', 'Attractions', 'Local Craft', 'Cultural Site']
    },
    'experience': {
        emoji: '🛼',
        name: 'Experience',
        description: 'Fun, entertainment, and activities.',
        icon: 'icon-activity',
        types: ['Activity', 'Activities', 'Indoor Activity', 'Event', 'Nightlife', 'Club', 'Amusement Park', 'Arcade', 'Live Show', 'Interactive Experience', 'Workshop', 'Tour', 'Entertainment']
    },
    'community': {
        emoji: '💛',
        name: 'Community',
        description: 'Local people, causes, and collectives.',
        icon: 'icon-local',
        types: ['Community', 'Community Project', 'Volunteer Work', 'Local Profile', 'Maker', 'Story', 'Collective']
    }
};

// Initialize TYPE_CATEGORIES from localStorage or defaults
let TYPE_CATEGORIES = loadCategoriesFromStorage() || DEFAULT_TYPE_CATEGORIES;

// Ensure we always have the default structure and icons
if (!TYPE_CATEGORIES || Object.keys(TYPE_CATEGORIES).length === 0) {
    TYPE_CATEGORIES = JSON.parse(JSON.stringify(DEFAULT_TYPE_CATEGORIES));
    saveCategoriesToStorage(TYPE_CATEGORIES);
} else {
    // Ensure all categories have icons from defaults
    let needsUpdate = false;
    for (const categoryKey in DEFAULT_TYPE_CATEGORIES) {
        if (TYPE_CATEGORIES[categoryKey]) {
            // If category exists but doesn't have an icon, set it from defaults
            if (!TYPE_CATEGORIES[categoryKey].icon && DEFAULT_TYPE_CATEGORIES[categoryKey].icon) {
                TYPE_CATEGORIES[categoryKey].icon = DEFAULT_TYPE_CATEGORIES[categoryKey].icon;
                needsUpdate = true;
            }
        } else {
            // If category is missing, add it from defaults
            TYPE_CATEGORIES[categoryKey] = JSON.parse(JSON.stringify(DEFAULT_TYPE_CATEGORIES[categoryKey]));
            needsUpdate = true;
        }
    }
    // Save updated categories if we made changes
    if (needsUpdate) {
        saveCategoriesToStorage(TYPE_CATEGORIES);
    }
}

// Keyword mappings for automatic category assignment based on type content
// Used when exact type match is not found in category types array
const TYPE_KEYWORD_MAPPINGS = {
    'taste': ['coffee', 'cafe', 'café', 'restaurant', 'food', 'dining', 'bakery', 'brewery', 'winery', 'cidery', 'distillery', 'bar', 'cocktail', 'market', 'food', 'cuisine', 'cooking', 'chef', 'meal', 'eat', 'drink', 'beverage', 'wine', 'beer', 'spirit', 'liquor', 'tea', 'espresso', 'latte', 'pizza', 'burger', 'sandwich', 'deli', 'grocery', 'farmers market', 'food tour', 'culinary'],
    'stay': ['hotel', 'lodging', 'resort', 'inn', 'bed and breakfast', 'bnb', 'cabin', 'camping', 'glamping', 'hostel', 'boutique stay', 'treehouse', 'unique stay', 'airbnb', 'lodge', 'accommodation', 'room', 'suite', 'retreat', 'getaway', 'entire house', 'house stay', 'house rental', 'vacation rental', 'rental', 'apartment', 'condo', 'cottage', 'villa', 'home', 'property', 'entire', 'house', 'vacation', 'short term rental', 'str', 'vrbo', 'booking', 'reservation'],
    'outdoor': ['hiking', 'hike', 'trail', 'park', 'beach', 'outdoor', 'nature', 'camping', 'climbing', 'water sports', 'skiing', 'snow', 'scenic', 'viewpoint', 'lookout', 'nature walk', 'biking', 'cycling', 'bike', 'kayaking', 'kayak', 'canoe', 'paddle', 'fishing', 'hunting', 'wildlife', 'forest', 'mountain', 'river', 'lake', 'national park', 'state park', 'garden', 'botanical'],
    'culture': ['museum', 'gallery', 'art', 'architecture', 'landmark', 'historical', 'history', 'heritage', 'festival', 'cultural', 'craft', 'music', 'theater', 'theatre', 'dance', 'performance', 'concert', 'show', 'exhibit', 'exhibition', 'monument', 'memorial', 'site', 'attraction', 'local craft', 'cultural site', 'tradition'],
    'experience': ['activity', 'activities', 'indoor activity', 'indoor', 'event', 'nightlife', 'club', 'amusement', 'arcade', 'live show', 'interactive', 'entertainment', 'fun', 'play', 'game', 'adventure', 'experience', 'tour', 'excursion'],
    'community': ['community', 'volunteer', 'local profile', 'maker', 'story', 'collective', 'group', 'organization', 'nonprofit', 'non-profit', 'charity', 'cause', 'initiative', 'foundation', 'association', 'society', 'network', 'community project', 'volunteer work']
};

// Map individual types to categories (case-insensitive)
// Uses exact match first, then keyword matching, then default fallback
// Also checks for category override on listing
function getCategoryForType(type, listing) {
    // If listing has a category override, use it
    if (listing && listing.category) {
        return listing.category;
    }
    
    if (!type) return null;
    const normalizedType = normalizeFilterValue(type).toLowerCase();
    
    // Step 1: Try exact match (case-insensitive) against category types arrays
    for (const categoryKey in TYPE_CATEGORIES) {
        const category = TYPE_CATEGORIES[categoryKey];
        if (category.types.some(function(catType) {
            return catType.toLowerCase() === normalizedType;
        })) {
            return categoryKey;
        }
    }
    
    // Step 2: Try keyword-based matching if exact match failed
    // Check if the type contains keywords that suggest a category
    for (const categoryKey in TYPE_KEYWORD_MAPPINGS) {
        const keywords = TYPE_KEYWORD_MAPPINGS[categoryKey];
        if (keywords.some(function(keyword) {
            return normalizedType.indexOf(keyword.toLowerCase()) > -1;
        })) {
            return categoryKey;
        }
    }
    
        // Step 3: Default fallback for unmapped types
        return 'experience'; // Default to Experience
}

// Diagnostic function: Check which types don't have categories assigned
function checkUnassignedTypes() {
    if (!data || !data.listings) {
        console.log('⚠️ No data available to check types');
        return;
    }
    
    // Get all unique types from listings
    const allTypes = [];
    const typeCounts = {};
    data.listings.forEach(function(listing) {
        if (listing.type) {
            if (typeCounts[listing.type]) {
                typeCounts[listing.type]++;
            } else {
                typeCounts[listing.type] = 1;
                allTypes.push(listing.type);
            }
        }
    });
    
    // Check each type to see if it has a category assigned
    const unassignedTypes = [];
    const categoryAssignments = {};
    
    allTypes.forEach(function(type) {
        // Create a mock listing to test category assignment
        const mockListing = { type: type };
        const category = getCategoryForType(type, mockListing);
        
        if (!category) {
            unassignedTypes.push(type);
        } else {
            if (!categoryAssignments[category]) {
                categoryAssignments[category] = [];
            }
            categoryAssignments[category].push({
                type: type,
                count: typeCounts[type]
            });
        }
    });
    
    // Log results
    console.log('📊 Type Category Assignment Report:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Total unique types:', allTypes.length);
    console.log('');
    
    // Show types by category
    console.log('✅ Types with categories assigned:');
    for (const categoryKey in categoryAssignments) {
        const category = TYPE_CATEGORIES[categoryKey];
        const categoryName = category ? category.name : categoryKey;
        console.log(`  ${categoryName} (${categoryKey}):`);
        categoryAssignments[categoryKey].forEach(function(item) {
            console.log(`    - ${item.type} (${item.count} listing${item.count !== 1 ? 's' : ''})`);
        });
    }
    console.log('');
    
    // Show unassigned types (should be none if everything is working)
    if (unassignedTypes.length > 0) {
        console.log('⚠️ Types without categories (falling back to default "experience"):');
        unassignedTypes.forEach(function(type) {
            console.log(`  - ${type} (${typeCounts[type]} listing${typeCounts[type] !== 1 ? 's' : ''})`);
        });
    } else {
        console.log('✅ All types have categories assigned!');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Also check types from filterOptions that might not be in listings yet
    if (data.filterOptions && data.filterOptions.types) {
        const filterTypes = data.filterOptions.types;
        const filterTypesNotInListings = filterTypes.filter(function(type) {
            return allTypes.indexOf(type) === -1;
        });
        
        if (filterTypesNotInListings.length > 0) {
            console.log('');
            console.log('ℹ️ Types in filterOptions but not in current listings:');
            filterTypesNotInListings.forEach(function(type) {
                const category = getCategoryForType(type, { type: type });
                const categoryName = category && TYPE_CATEGORIES[category] ? TYPE_CATEGORIES[category].name : (category || 'experience (default)');
                console.log(`  - ${type} → ${categoryName}`);
            });
        }
    }
}

function collectUsedFilterOptions(listings) {
    const types = [];
    const areas = [];
    const amenities = [];
    
    const typeSet = new Set();
    const areaSet = new Set();
    const amenitySet = new Set();
    
    (Array.isArray(listings) ? listings : []).forEach(function(listing) {
        if (listing && typeof listing === 'object') {
            const type = normalizeFilterValue(listing.type);
            if (type && !typeSet.has(type)) {
                typeSet.add(type);
                types.push(type);
            }
            
            const area = normalizeFilterValue(listing.area);
            if (area && !areaSet.has(area)) {
                areaSet.add(area);
                areas.push(area);
            }
            
            let listingAmenities = [];
            if (Array.isArray(listing.amenities)) {
                listingAmenities = listing.amenities;
            } else if (typeof listing.amenities === 'string') {
                listingAmenities = listing.amenities.split(/[,;]+/).map(function(value) { return value.trim(); });
            }
            
            listingAmenities.forEach(function(rawAmenity) {
                const amenity = normalizeFilterValue(rawAmenity);
                if (amenity && !amenitySet.has(amenity)) {
                    amenitySet.add(amenity);
                    amenities.push(amenity);
                }
            });
        }
    });
    
    return { types: types, areas: areas, amenities: amenities };
}

function mergeOptionsPreservingOrder(existing, required) {
    const existingArray = Array.isArray(existing) ? existing.map(normalizeFilterValue) : [];
    const requiredArray = Array.isArray(required) ? required.map(normalizeFilterValue).filter(function(value) { return value.length > 0; }) : [];
    const requiredSet = new Set(requiredArray);
    
    const keptExisting = existingArray.filter(function(value) { return value && requiredSet.has(value); });
    const missing = requiredArray.filter(function(value) { return keptExisting.indexOf(value) === -1; });
    
    return keptExisting.concat(missing);
}

function sanitizeFilterOptions(existingOptions, listings) {
    const usage = collectUsedFilterOptions(listings);
    const options = existingOptions || {};
    
    return {
        types: mergeOptionsPreservingOrder(options.types, usage.types),
        areas: mergeOptionsPreservingOrder(options.areas, usage.areas),
        amenities: mergeOptionsPreservingOrder(options.amenities, usage.amenities)
    };
}

function haveDifferentValues(previous, next) {
    const prevArray = Array.isArray(previous) ? previous : [];
    const nextArray = Array.isArray(next) ? next : [];
    
    if (prevArray.length !== nextArray.length) return true;
    for (let i = 0; i < prevArray.length; i++) {
        if (prevArray[i] !== nextArray[i]) {
            return true;
        }
    }
    return false;
}

function refreshFilterSelect(selectId, values) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const defaultOption = select.querySelector('option[value=""]');
    if (!select.dataset.placeholderText) {
        if (defaultOption) {
            select.dataset.placeholderText = defaultOption.textContent;
        } else if (select.getAttribute('data-placeholder')) {
            select.dataset.placeholderText = select.getAttribute('data-placeholder');
        } else {
            select.dataset.placeholderText = 'All';
        }
    }
    
    const placeholderText = select.dataset.placeholderText || 'All';
    const currentValue = select.value;
    const safeValues = Array.isArray(values) ? values : [];
    
    select.innerHTML = '';
    
    const firstOption = document.createElement('option');
    firstOption.value = '';
    firstOption.textContent = placeholderText;
    select.appendChild(firstOption);
    
    safeValues.forEach(function(value) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
    
    if (safeValues.indexOf(currentValue) > -1) {
        select.value = currentValue;
    } else {
        select.value = '';
    }
}

function applyFilterOptionCleanup(existingOptions) {
    if (typeof data === 'undefined') return false;
    
    data.listings = (data.listings || []).map(function(listing) {
        return sanitizeListing(listing);
    });
    
    const sanitized = sanitizeFilterOptions(existingOptions || data.filterOptions, data.listings);
    const typesChanged = haveDifferentValues(data.filterOptions && data.filterOptions.types, sanitized.types);
    const areasChanged = haveDifferentValues(data.filterOptions && data.filterOptions.areas, sanitized.areas);
    const amenitiesChanged = haveDifferentValues(data.filterOptions && data.filterOptions.amenities, sanitized.amenities);
    
    const hasChanges = typesChanged || areasChanged || amenitiesChanged;
    
    data.filterOptions = sanitized;
    
    if (hasChanges) {
        saveFilterOptions();
    }
    
    updateTypeDropdown();
    updateAreaDropdown();
    renderAmenitiesCheckboxes();
    populateAdminFilters();
    populatePreviewFilters();
    
    if (hasChanges) {
        renderSettings();
    }
    
    return hasChanges;
}

initialData.filterOptions = sanitizeFilterOptions(initialData.filterOptions, initialData.listings);

// =================================
// GOOGLE SHEETS CONFIGURATION
// =================================
        // Step 1: Get your Google Sheet's published CSV URL (optional - used as fallback)
        // File → Share → Publish to web → CSV → Copy URL
        const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?gid=0&single=true&output=csv';
        
        // Step 2: Your Google Apps Script Web App URL (REQUIRED for read/write)
        // This URL is already configured and working!
        const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzu1ukNVAwEPf_xWoerojDRDGWmsCYanERrc_yZsAq1XnUskOgq1usxY0JNx2c3EiKvGA/exec';
        const IMAGEKIT_PUBLIC_KEY = 'public_bEXbACd1Av+LMd7EASiu/x25f4o=';
        const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/OE';
        const IMAGEKIT_AUTH_ACTION = 'getImageKitUploadParams';
        
        // Initialize data with initialData (will be updated from Google Sheets on load)
        let data = JSON.parse(JSON.stringify(initialData));
        data.listings = (data.listings || []).map(function(listing) {
            return sanitizeListing(listing);
        });
        
        // Load saved filterOptions from localStorage if available
        const savedFilterOptions = localStorage.getItem('nelsonCounty_filterOptions');
        if (savedFilterOptions) {
            try {
                const parsedFilterOptions = JSON.parse(savedFilterOptions);
                data.filterOptions = sanitizeFilterOptions(parsedFilterOptions, data.listings);
            } catch (e) {
                console.error('Error loading saved filterOptions:', e);
                data.filterOptions = sanitizeFilterOptions(data.filterOptions, data.listings);
            }
        } else {
            data.filterOptions = sanitizeFilterOptions(data.filterOptions, data.listings);
        }
        
        let deleteConfirmId = null;
        let deleteConfirmTimeout = null;
        
        // Helper function to parse CSV text into array of objects
        function parseCSV(csvText) {
            if (!csvText) return { headers: [], dataRows: [] };
            
            // Use a more robust CSV parsing approach
            // Split by newlines first, but handle quoted fields that span lines
            const rows = [];
            let currentRow = '';
            let inQuotes = false;
            
            for (let i = 0; i < csvText.length; i++) {
                const char = csvText[i];
                const nextChar = csvText[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Escaped quote
                        currentRow += '"';
                        i++;
                    } else {
                        // Toggle quote state
                        inQuotes = !inQuotes;
                        currentRow += char;
                    }
                } else if ((char === '\n' || (char === '\r' && nextChar !== '\n')) && !inQuotes) {
                    // End of row (only if not in quotes)
                    if (char === '\r' && nextChar === '\n') {
                        i++; // Skip the \n after \r
                    }
                    if (currentRow.trim().length > 0) {
                        rows.push(currentRow);
                    }
                    currentRow = '';
                } else {
                    currentRow += char;
                }
            }
            // Push the last row
            if (currentRow.trim().length > 0) {
                rows.push(currentRow);
            }
            
            const filteredRows = rows.filter(row => row.trim().length > 0);
            if (filteredRows.length === 0) return { headers: [], dataRows: [] };
            
            const parseCSVLine = (line) => {
                const values = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];
                    
                    if (char === '"') {
                        if (inQuotes && nextChar === '"') {
                            // Escaped quote inside quoted field
                            current += '"';
                            i++; // Skip next quote
                        } else {
                            // Toggle quote state - don't add quote to current
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        // Only split on comma if NOT inside quotes
                        values.push(current);
                        current = '';
                    } else {
                        // Add character to current value
                        current += char;
                    }
                }
                // Push the last value (after final comma or end of line)
                values.push(current);
                
                // Clean up values: trim whitespace and remove surrounding quotes
                return values.map(value => {
                    value = value.trim();
                    // Remove surrounding quotes if present
                    if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
                        value = value.slice(1, -1);
                    }
                    // Replace escaped quotes (double quotes become single)
                    value = value.replace(/""/g, '"');
                    return value;
                });
            };
            
            const headers = parseCSVLine(filteredRows[0]).filter(Boolean);
            const dataRows = [];
            
            // Debug: Log header count and key columns
            console.log('📊 CSV Parse - Headers:', headers.length);
            console.log('   Key columns:', {
                customHtml: headers.indexOf('customHtml'),
                accordionPanel1Title: headers.indexOf('accordionPanel1Title'),
                accordionPanel1Content: headers.indexOf('accordionPanel1Content')
            });
            
            for (let i = 1; i < filteredRows.length; i++) {
                const values = parseCSVLine(filteredRows[i]);
                
                // CRITICAL: Validate column count matches
                if (values.length !== headers.length) {
                    console.error('❌ CRITICAL: Column count mismatch in row', i + 1, ':', {
                        expected: headers.length,
                        got: values.length,
                        difference: values.length - headers.length,
                        'This will cause column misalignment!': 'FIX NEEDED'
                    });
                    // Skip this row to prevent data corruption
                    console.warn('⚠️ Skipping row', i + 1, 'due to column mismatch');
                    continue;
                }
                
                if (!values.some(v => v && v.trim())) continue;
                
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = (values[index] !== undefined) ? values[index] : '';
                });
                
                // Debug: Log first row's key fields
                if (i === 1 && row.name) {
                    console.log('🔍 First data row sample:', {
                        name: row.name,
                        customHtml: row.customHtml?.substring(0, 50) || '(empty)',
                        accordionPanel1Title: row.accordionPanel1Title?.substring(0, 50) || '(empty)',
                        accordionPanel1Content: row.accordionPanel1Content?.substring(0, 50) || '(empty)'
                    });
                }
                
                dataRows.push(row);
            }
            
            return { headers, dataRows };
        }
        
        // Map CSV row to listing object
        function slugify(value) {
            return (value || '')
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
        
        function mapCSVRowToListing(row) {
            const normalizedRow = {};
            if (row && typeof row === 'object') {
                Object.keys(row).forEach(function(key) {
                    if (key === undefined || key === null) return;
                    const normalizedKey = String(key).trim().toLowerCase();
                    if (normalizedKey) {
                        normalizedRow[normalizedKey] = row[key];
                    }
                });
            }
            
            // Debug: Log raw row keys for first listing
            if (row && row.name && !window._csvDebugLogged) {
                console.log('🔍 First listing raw row keys:', Object.keys(row));
                console.log('🔍 Normalized keys sample:', Object.keys(normalizedRow).slice(0, 10));
                console.log('🔍 Accordion fields in row:', {
                    accordionPanel1Title: row.accordionPanel1Title?.substring(0, 50) || '(not found)',
                    accordionPanel1Content: row.accordionPanel1Content?.substring(0, 50) || '(not found)',
                    customHtml: row.customHtml?.substring(0, 50) || '(not found)'
                });
                console.log('🔍 Checking normalizedRow for accordion keys:');
                console.log('   accordionpanel1title exists?', 'accordionpanel1title' in normalizedRow);
                console.log('   accordionpanel1title value:', normalizedRow['accordionpanel1title']?.substring(0, 50) || '(not found)');
                console.log('   accordionpanel1content exists?', 'accordionpanel1content' in normalizedRow);
                console.log('   accordionpanel1content value:', normalizedRow['accordionpanel1content']?.substring(0, 50) || '(not found)');
                window._csvDebugLogged = true;
            }
            
            const getField = (fieldName, altNames = []) => {
                const names = [fieldName, ...altNames];
                for (const name of names) {
                    const normalizedName = String(name).trim().toLowerCase();
                    if (!normalizedName) continue;
                    if (Object.prototype.hasOwnProperty.call(normalizedRow, normalizedName)) {
                        const value = normalizedRow[normalizedName];
                        if (value !== undefined && value !== null) {
                            return String(value).trim();
                        }
                    }
                }
                return '';
            };
            
            const parseList = (value) => {
                if (!value) return [];
                return value.split(/[,;]/).map(a => a.trim()).filter(Boolean);
            };
            
            const featuredStr = getField('Featured', ['featured']);
            const detailedDescriptionValue = getField('Detailed Description', [
                'detaileddescription',
                'detailed description',
                'long description',
                'longdescription',
                'full description',
                'fulldescription',
                'detail description',
                'detaildescription',
                'extended description',
                'extendeddescription'
            ]);
            const image3Value = getField('Image3', ['image3', 'Image 3', 'Photo 3', 'photo3', 'Photo3', 'Third Photo', 'Tertiary Photo']);
            const galleryValue = getField('imageGallery', ['ImageGallery', 'Image Gallery', 'gallery', 'Gallery']);
            
            const googleMapsUrlField = getField('Google Maps URL', ['Google Map URL', 'Google Maps Link', 'Maps URL', 'Map URL', 'Google Maps', 'googleMapsUrl', 'google_maps_url', 'map url', 'maps link']);
            const directionsLinkField = getField('directionsLink', ['Directions Link', 'Directions URL', 'Map Link', 'map directions', 'directions url']);
            
            const categoryValue = getField('Category', ['category']);
            
            const listing = {
                id: getField('ID', ['id', 'Id']),
                name: getField('Title', ['Name', 'name', 'title']) || getField('name'),
                type: getField('Type', ['type']),
                category: categoryValue || undefined, // Only set if provided
                area: getField('Area', ['area']),
                description: getField('Description', ['description', 'Desc', 'desc']),
                detailedDescription: detailedDescriptionValue,
                image1: getField('Photo', ['photo', 'Image', 'image', 'Image1', 'image1', 'Image 1']),
                image2: getField('Image2', ['image2', 'Image 2', 'Photo 2', 'photo2', 'Photo2', 'Second Photo', 'Secondary Photo']),
                image3: image3Value || galleryValue,
                website: getField('External Website', ['Website', 'website', 'URL', 'url', 'website url', 'site url', 'business website', 'website link']),
                phone: getField('Phone', ['phone', 'phone number', 'business phone', 'contact phone', 'primary phone']),
                address: getField('Address', ['address', 'street address', 'business address', 'physical address', 'location']),
                amenities: parseList(getField('Amenities', ['amenities', 'Amenity'])),
                featured: featuredStr === 'TRUE' || featuredStr === 'true' || featuredStr === '1' || featuredStr === 'Yes' || featuredStr === 'yes',
                slug: getField('slug'),
                authorName: getField('authorName', ['Author Name', 'Author', 'author', 'contributor', 'contributor name']),
                publishedDate: getField('publishedDate', ['Published Date', 'Created Date', 'createdDate', 'Date Created', 'publishDate', 'created on']),
                modifiedDate: getField('modifiedDate', ['Modified Date', 'Updated Date', 'updatedDate', 'Date Updated', 'editedDate', 'Edited Date', 'last updated', 'last modified']),
                directionsLink: directionsLinkField || googleMapsUrlField || '',
                customHtml: getField('Custom HTML', ['customHtml', 'Custom HTML', 'custom html', 'CustomHtml']),
                image1Desc: getField('Image1Desc', ['image1Desc', 'Image 1 Desc', 'Image1 Description', 'image1 description']),
                image1FileId: getField('Image1FileId', ['image1FileId', 'Image 1 File ID', 'Image1 File ID', 'image1 file id']),
                image2Desc: getField('Image2Desc', ['image2Desc', 'Image 2 Desc', 'Image2 Description', 'image2 description']),
                image2FileId: getField('Image2FileId', ['image2FileId', 'Image 2 File ID', 'Image2 File ID', 'image2 file id']),
                image3Desc: getField('Image3Desc', ['image3Desc', 'Image 3 Desc', 'Image3 Description', 'image3 description']),
                image3FileId: getField('Image3FileId', ['image3FileId', 'Image 3 File ID', 'Image3 File ID', 'image3 file id']),
                googleMapsUrl: googleMapsUrlField || '',
                accordionPanel1Title: (() => {
                    const val = getField('accordionPanel1Title', ['AccordionPanel1Title', 'Accordion Panel 1 Title', 'accordion panel 1 title']);
                    if (row && row.name && !window._accordionDebugLogged) {
                        console.log('🎯 accordionPanel1Title mapping:', {
                            'row.accordionPanel1Title': row.accordionPanel1Title?.substring(0, 50) || '(not found)',
                            'normalizedRow.accordionpanel1title': normalizedRow['accordionpanel1title']?.substring(0, 50) || '(not found)',
                            'getField result': val?.substring(0, 50) || '(empty)'
                        });
                        window._accordionDebugLogged = true;
                    }
                    return val;
                })(),
                accordionPanel1Content: getField('accordionPanel1Content', ['AccordionPanel1Content', 'Accordion Panel 1 Content', 'accordion panel 1 content']),
                accordionPanel2Title: getField('accordionPanel2Title', ['AccordionPanel2Title', 'Accordion Panel 2 Title', 'accordion panel 2 title']),
                accordionPanel2Content: getField('accordionPanel2Content', ['AccordionPanel2Content', 'Accordion Panel 2 Content', 'accordion panel 2 content']),
                accordionPanel3Title: getField('accordionPanel3Title', ['AccordionPanel3Title', 'Accordion Panel 3 Title', 'accordion panel 3 title']),
                accordionPanel3Content: getField('accordionPanel3Content', ['AccordionPanel3Content', 'Accordion Panel 3 Content', 'accordion panel 3 content']),
                accordionPanel4Title: getField('accordionPanel4Title', ['AccordionPanel4Title', 'Accordion Panel 4 Title', 'accordion panel 4 title']),
                accordionPanel4Content: getField('accordionPanel4Content', ['AccordionPanel4Content', 'Accordion Panel 4 Content', 'accordion panel 4 content'])
            };
            
            if (!listing.slug && listing.name) {
                listing.slug = slugify(listing.name);
            }
            
            listing.googleMapsUrl = googleMapsUrlField || listing.directionsLink || '';
            if (!listing.directionsLink && listing.googleMapsUrl) {
                listing.directionsLink = listing.googleMapsUrl;
            }
            
            if (!listing.id && listing.name) {
                listing.id = listing.name.toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
            
            return sanitizeListing(listing);
        }
        
        // Update sync status UI
        function updateSyncStatus(success, message) {
            const statusBadge = document.getElementById('sheetsStatusBadge');
            const statusIcon = document.getElementById('sheetsStatusIcon');
            const statusText = document.getElementById('sheetsStatusText');
            const actionStatus = document.getElementById('sheetsActionStatus');
            const lastSync = document.getElementById('lastSyncTime');
            
            if (success) {
                statusBadge.style.background = '#34a853';
                statusIcon.textContent = '✓';
                statusText.textContent = 'Connected';
                lastSync.textContent = new Date().toLocaleTimeString();
            } else {
                statusBadge.style.background = '#ea4335';
                statusIcon.textContent = '✗';
                statusText.textContent = 'Error';
            }
            
            if (message) {
                actionStatus.textContent = message;
                setTimeout(() => {
                    actionStatus.textContent = '';
                }, 3000);
            }
        }
        
        // Load data from Google Sheets on page load
        // Tries Apps Script first (preferred), then CSV as fallback
        async function loadDataFromGoogleSheets() {
            updateSyncStatus(true, '🔄 Loading...');
            
            // Check if running from file:// protocol (local file)
            const isFileProtocol = window.location.protocol === 'file:';
            
            // Try Apps Script first (better format, already working)
            if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                try {
                    console.log('📊 Loading data from Google Sheets via Apps Script...');
                    const url = GOOGLE_APPS_SCRIPT_URL + '?t=' + Date.now();
                    let response;
                    
                    // If file:// protocol, use proxy immediately (CORS doesn't work with file://)
                    if (isFileProtocol) {
                        console.log('⚠️ Running from file://, using proxy...');
                        console.warn('⚠️ Note: Opening HTML files directly (file://) has CORS limitations.');
                        console.warn('   For best results, host this file on a web server (e.g., GitHub Pages, Netlify, or local server).');
                        
                        try {
                            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
                            response = await fetch(proxyUrl, {
                                method: 'GET',
                                mode: 'cors',
                                cache: 'no-cache'
                            });
                            
                            if (!response || !response.ok) {
                                throw new Error('Proxy request failed');
                            }
                        } catch (proxyError) {
                            console.error('❌ Proxy also failed due to CORS:', proxyError);
                            throw new Error('Cannot load from Apps Script when opening file directly. Please host on a web server or use CSV fallback.');
                        }
                    } else {
                        // Try direct fetch first (Apps Script should be configured for CORS)
                        try {
                            response = await fetch(url, {
                                method: 'GET',
                                mode: 'cors',
                                cache: 'no-cache',
                                credentials: 'omit'
                            });
                            
                            if (!response || !response.ok) {
                                throw new Error('Failed to fetch from Apps Script');
                            }
                        } catch (fetchError) {
                            // Check if it's a CORS error or network error
                            const isCorsError = fetchError.message.includes('CORS') || 
                                              fetchError.message.includes('access control') ||
                                              fetchError.message.includes('Failed to fetch') ||
                                              fetchError.name === 'TypeError';
                            
                            if (isCorsError) {
                                // Try proxy as fallback
                                try {
                                    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
                                    response = await fetch(proxyUrl, {
                                        method: 'GET',
                                        mode: 'cors',
                                        cache: 'no-cache'
                                    });
                                    
                                    if (!response || !response.ok) {
                                        throw new Error('Proxy also failed');
                                    }
                                } catch (proxyError) {
                                    console.error('Proxy also failed:', proxyError);
                                    throw new Error('Unable to fetch from Apps Script. Please check CORS configuration.');
                                }
                            } else {
                                throw fetchError;
                            }
                        }
                    }
                    
                    if (!response.ok) {
                        // Try to get error message from response
                        let errorMessage = `Failed to fetch from Apps Script (Status: ${response.status})`;
                        try {
                            const errorText = await response.text();
                            if (errorText) {
                                const errorJson = JSON.parse(errorText);
                                errorMessage = errorJson.error || errorMessage;
                            }
                        } catch (e) {
                            // If we can't parse error, use status code
                            if (response.status === 500) {
                                errorMessage = 'Apps Script returned 500 error - check your script for errors';
                            } else if (response.status === 403) {
                                errorMessage = 'Apps Script access denied - check permissions';
                            } else if (response.status === 404) {
                                errorMessage = 'Apps Script URL not found - check your URL';
                            }
                        }
                        throw new Error(errorMessage);
                    }
                    
                    const result = await response.json();
                    
                    if (result.success && result.listings && result.listings.length > 0) {
                        // Debug: Check first listing for accordion data
                        if (result.listings.length > 0 && !window._sheetsAccordionDebugLogged) {
                            const firstListing = result.listings[0];
                            console.log('🎯 loadDataFromGoogleSheets - First listing from Google Sheets:', firstListing.name);
                            console.log('   accordionPanel1Title:', firstListing.accordionPanel1Title?.substring(0, 50) || '(not found)');
                            console.log('   accordionPanel1Content:', firstListing.accordionPanel1Content?.substring(0, 50) || '(not found)');
                            console.log('   All keys containing "accordion":', Object.keys(firstListing).filter(k => k.includes('accordion')));
                            window._sheetsAccordionDebugLogged = true;
                        }
                        
                        const listings = result.listings.map(function(listing) {
                            return sanitizeListing(Object.assign({}, listing));
                        });
                        
                        // Preserve existing filterOptions when loading from Sheets
                        // Ensure data is initialized before accessing it
                        if (typeof data === 'undefined' || !data) {
                            data = JSON.parse(JSON.stringify(initialData));
                        }
                        const existingFilterOptions = data.filterOptions || initialData.filterOptions;
                        const sanitizedFilterOptions = sanitizeFilterOptions(existingFilterOptions, listings);
                        
                        data = {
                            listings: listings,
                            filterOptions: sanitizedFilterOptions
                        };
                        
                        applyFilterOptionCleanup(sanitizedFilterOptions);
                        
                        console.log('✅ Loaded ' + listings.length + ' listings from Google Sheets (Apps Script)');
                        updateSyncStatus(true, `✅ Loaded ${listings.length} listings`);
                        renderListings();
                        populateAdminFilters();
                        updateStats();
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error loading from Apps Script:', error);
                    
                    // Check what type of error it is
                    if (error.message.includes('500')) {
                        updateSyncStatus(false, '❌ Apps Script error (500) - falling back to CSV');
                        console.error('⚠️ Your Google Apps Script has an internal error. Check the Apps Script execution logs.');
                        console.error('   Error:', error.message);
                    } else if (error.message.includes('CORS') || error.message.includes('access control') || error.message.includes('Origin null')) {
                        updateSyncStatus(false, '⚠️ CORS error - retrying...');
                        // Only log CORS warning if it's a persistent issue
                        // (Suppress on first attempt, will retry via CSV fallback)
                        if (error.message.includes('Proxy also failed')) {
                            console.warn('⚠️ CORS Error: Your Google Apps Script may need CORS headers configured.\n' +
                                        'If this persists, add to your doGet function:\n' +
                                        'return ContentService\n' +
                                        '  .createTextOutput(JSON.stringify({success: true, listings: [...]}))\n' +
                                        '  .setMimeType(ContentService.MimeType.JSON);');
                        } else {
                            // First CORS attempt - just log briefly, will retry
                            console.log('⚠️ CORS blocked, trying proxy...');
                        }
                    } else {
                        updateSyncStatus(false, '❌ Connection error - falling back to CSV');
                        console.error('   Error:', error.message);
                    }
                    
                    console.log('⚠️ Falling back to CSV...');
                }
            }
            
            // Fallback to CSV if Apps Script fails or not configured
            if (GOOGLE_SHEET_CSV_URL && !GOOGLE_SHEET_CSV_URL.includes('YOUR_SHEET_ID')) {
                try {
                    const cacheBustUrl = GOOGLE_SHEET_CSV_URL + (GOOGLE_SHEET_CSV_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
                    console.log('📊 Loading data from Google Sheets CSV...');
                    
                    let response;
                    // If file:// protocol, try multiple approaches
                    if (isFileProtocol) {
                        // Try different proxy services
                        const proxies = [
                            'https://api.allorigins.win/raw?url=',
                            'https://corsproxy.io/?',
                            'https://cors-anywhere.herokuapp.com/'
                        ];
                        
                        let proxySuccess = false;
                        for (let i = 0; i < proxies.length && !proxySuccess; i++) {
                            try {
                                const proxyUrl = proxies[i] + encodeURIComponent(cacheBustUrl);
                                console.log(`🔄 Trying proxy ${i + 1}/${proxies.length}...`);
                                response = await fetch(proxyUrl, {
                                    method: 'GET',
                                    mode: 'cors',
                                    cache: 'no-cache'
                                });
                                
                                if (response && response.ok) {
                                    proxySuccess = true;
                                    console.log('✅ Proxy succeeded!');
                                    break;
                                }
                            } catch (proxyError) {
                                console.warn(`⚠️ Proxy ${i + 1} failed:`, proxyError.message);
                                continue;
                            }
                        }
                        
                        if (!proxySuccess) {
                            // Last resort: try direct fetch (will likely fail but worth trying)
                            console.warn('⚠️ All proxies failed, trying direct CSV fetch...');
                            try {
                                response = await fetch(cacheBustUrl, {
                                    method: 'GET',
                                    mode: 'no-cors'
                                });
                                // If no-cors, we can't verify success, so throw
                                throw new Error('Direct CSV fetch from file:// not possible');
                            } catch (directError) {
                                throw new Error('Cannot load CSV from file:// protocol. All methods failed.');
                            }
                        }
                    } else {
                        response = await fetch(cacheBustUrl);
                    }
                    
                    if (!response || !response.ok) {
                        throw new Error(`Failed to fetch CSV (Status: ${response?.status || 'unknown'})`);
                    }
                    
                    const csvText = await response.text();
                    const parsed = parseCSV(csvText);
                    
                    // Debug: Verify CSV parsing
                    if (parsed.headers && parsed.dataRows && parsed.dataRows.length > 0) {
                        console.log('📊 CSV Parsed:', {
                            headers: parsed.headers.length,
                            rows: parsed.dataRows.length,
                            firstRowKeys: Object.keys(parsed.dataRows[0]).length,
                            sampleHeaders: parsed.headers.slice(0, 10),
                            hasAccordion: parsed.headers.includes('accordionPanel1Title')
                        });
                    }
                    
                    if (parsed.dataRows && parsed.dataRows.length > 0) {
                            const listings = parsed.dataRows
                                .map(row => {
                                    const listing = mapCSVRowToListing(row);
                                    // Debug: Log if accordion data is found
                                    if (listing.name && listing.accordionPanel1Title) {
                                        console.log('✅ Accordion data mapped for:', listing.name, {
                                            title: listing.accordionPanel1Title.substring(0, 50),
                                            hasContent: !!listing.accordionPanel1Content
                                        });
                                    }
                                    return listing;
                                })
                            .filter(listing => listing.name); // Only keep listings with names
                        
                        // Extract filter options from listings
                        // Preserve existing filterOptions when loading from CSV
                        // Ensure data is initialized before accessing it
                        if (typeof data === 'undefined' || !data) {
                            data = JSON.parse(JSON.stringify(initialData));
                        }
                        const existingFilterOptions = data.filterOptions || initialData.filterOptions;
                        const sanitizedFilterOptions = sanitizeFilterOptions(existingFilterOptions, listings);
                        
                        data = {
                            listings: listings,
                            filterOptions: sanitizedFilterOptions
                        };
                        applyFilterOptionCleanup(sanitizedFilterOptions);
                        console.log('✅ Loaded ' + listings.length + ' listings from Google Sheets (CSV)');
                        updateSyncStatus(true, `✅ Loaded ${listings.length} listings (CSV)`);
                        renderListings();
                        populateAdminFilters();
                        updateStats();
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error loading from CSV:', error);
                    updateSyncStatus(false, '❌ CSV fetch failed');
                }
            }
            
            // If both fail, use initial data
            console.log('⚠️ Could not load from Google Sheets, using initial data');
            updateSyncStatus(false, '⚠️ Using local data only');
            
            // Show warning if running from file://
            if (isFileProtocol) {
                console.error('❌ IMPORTANT: Opening from file:// protocol has CORS restrictions.');
                console.error('   To fix this, run a local web server:');
                console.error('   1. Open Terminal in this folder');
                console.error('   2. Run: python3 -m http.server 8000');
                console.error('   3. Open: http://localhost:8000/index-sheets.html');
                console.error('   OR host on GitHub Pages / Netlify / etc.');
                
                // Show alert to user
                setTimeout(() => {
                    alert('⚠️ CORS Error\n\n' +
                          'Opening HTML files directly (file://) has browser restrictions.\n\n' +
                          'To fix:\n' +
                          '1. Open Terminal in this folder\n' +
                          '2. Run: python3 -m http.server 8000\n' +
                          '3. Open: http://localhost:8000/index-sheets.html\n\n' +
                          'For now, using local data only.');
                }, 1000);
            }
        }
        
        // Reload data from Google Sheets (manual refresh)
        window.reloadFromSheets = async function reloadFromSheets() {
            const confirmed = confirm('⚠️ Warning: Reloading from Google Sheets\n\n' +
                                    'This will override all changes you\'ve made in this admin panel.\n' +
                                    'Any unsaved changes will be lost.\n\n' +
                                    'Click OK to reload from Google Sheets and override local changes\n' +
                                    'Click Cancel to keep your local changes');
            if (!confirmed) {
                return;
            }
            // Status will be updated by loadDataFromGoogleSheets()
            await loadDataFromGoogleSheets();
        }
        
        /**
         * Shows a confirmation dialog recommending CSV backup before saving to Sheets
         * @param {number} listingCount - Number of listings to be saved
         * @returns {Promise<boolean>} - true if user confirmed, false if cancelled
         */
        function showBackupConfirmation(listingCount) {
            return new Promise((resolve) => {
                // Create modal overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
                
                // Create modal dialog
                const modal = document.createElement('div');
                modal.style.cssText = 'background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
                
                modal.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 24px;">⚠️ Backup Recommended</h2>
                        <p style="margin: 0 0 15px 0; color: #6c757d; line-height: 1.6;">
                            You're about to replace <strong>all existing data</strong> in Google Sheets with ${listingCount} listing(s).
                        </p>
                        <p style="margin: 0 0 20px 0; color: #6c757d; line-height: 1.6;">
                            <strong>We recommend downloading a CSV backup first</strong> in case you need to restore the previous data.
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                        <button id="backupCancelBtn" style="padding: 10px 20px; border: 1px solid #dee2e6; background: white; color: #212529; border-radius: 4px; cursor: pointer; font-weight: 500;">
                            Cancel
                        </button>
                        <button id="backupDownloadBtn" style="padding: 10px 20px; border: none; background: #4E6B52; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;">
                            📥 Download CSV Backup First
                        </button>
                        <button id="backupProceedBtn" style="padding: 10px 20px; border: none; background: #34a853; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;">
                            Proceed Without Backup
                        </button>
                    </div>
                `;
                
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                
                // Button handlers
                document.getElementById('backupCancelBtn').onclick = () => {
                    document.body.removeChild(overlay);
                    resolve(false);
                };
                
                document.getElementById('backupDownloadBtn').onclick = () => {
                    // Download CSV backup
                    downloadCSV();
                    // Wait a moment for download to start, then proceed
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        resolve(true);
                    }, 500);
                };
                
                document.getElementById('backupProceedBtn').onclick = () => {
                    document.body.removeChild(overlay);
                    resolve(true);
                };
                
                // Close on overlay click
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        document.body.removeChild(overlay);
                        resolve(false);
                    }
                };
            });
        }
        
        window.saveAllToSheets = async function saveAllToSheets() {
            if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                alert('⚠️ Google Sheets not configured. Please set up your Apps Script URL.');
                return;
            }
            
            if (!data.listings || data.listings.length === 0) {
                alert('⚠️ No listings to save.');
                return;
            }
            
            // Show confirmation dialog asking if they want to download CSV backup first
            const wantBackup = confirm('⚠️ You are about to replace ALL data in Google Sheets.\n\n' +
                                 'Would you like to download a CSV backup first?\n\n' +
                                 'Click OK to download CSV backup before saving\n' +
                                 'Click Cancel to skip backup and continue');
            
            if (wantBackup) {
                // Download CSV backup
                downloadCSV();
                // Wait a moment for download to start
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Now ask for confirmation to overwrite
            const confirmed = confirm('⚠️ Final Confirmation\n\n' +
                                    `You are about to replace all data in Google Sheets with ${data.listings.length} listing(s).\n\n` +
                                    'This action cannot be undone.\n\n' +
                                    'Click OK to save all listings to Google Sheets and overwrite existing data\n' +
                                    'Click Cancel to abort and keep Google Sheets unchanged');
            if (!confirmed) {
                return; // User cancelled
            }
            
            // Show "in progress" status
            updateSyncStatus(true, `💾 Saving ${data.listings.length} listings...`);
            
            try {
                // Send all listings at once with a "replaceAll" action
                // This tells the Apps Script to clear the sheet and replace with these listings
                // Debug: Log what we're sending to Google Sheets
                if (data.listings && data.listings.length > 0) {
                    const firstListing = data.listings[0];
                    console.log('📤 Sending to Google Sheets - First listing sample:', {
                        name: firstListing.name,
                        hasAccordionTitle: !!firstListing.accordionPanel1Title,
                        accordionTitle: firstListing.accordionPanel1Title?.substring(0, 50) || '(missing)',
                        hasAccordionContent: !!firstListing.accordionPanel1Content,
                        allKeys: Object.keys(firstListing).filter(k => k.includes('accordion')).join(', ') || '(none)'
                    });
                }
                
                const postData = JSON.stringify({
                    action: 'replaceAllListings',
                    listings: data.listings
                });
                
                let result = { success: false };
                
                // Try direct fetch first
                try {
                    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                        method: 'POST',
                        mode: 'cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: postData
                    });
                    
                    try {
                        const responseText = await response.text();
                        result = responseText ? JSON.parse(responseText) : { success: true };
                    } catch (e) {
                        result = { success: true }; // Assume success if no response
                    }
                } catch (corsError) {
                    console.log('Direct POST failed due to CORS, trying no-cors mode...');
                    
                    // Try no-cors mode - sends request but can't read response
                    try {
                        await fetch(GOOGLE_APPS_SCRIPT_URL, {
                            method: 'POST',
                            mode: 'no-cors',
                            body: postData  // Send raw JSON string
                        });
                        
                        // With no-cors, we can't read response, so assume success
                        result = { success: true };
                        console.log('Sent via no-cors mode (can\'t verify response)');
                    } catch (e) {
                        console.error('No-cors also failed:', e);
                        result = { success: false, error: 'Failed to connect to Google Sheets' };
                        alert('⚠️ Unable to save to Google Sheets. Changes saved locally only.\n\n' +
                              'This may be due to CORS restrictions. Your Apps Script may need to be configured to allow CORS.');
                    }
                }
                
                if (result.success) {
                    updateSyncStatus(true, `✅ Replaced all data in Google Sheets with ${data.listings.length} listings`);
                    alert(`✅ Successfully saved all ${data.listings.length} listings to Google Sheets!`);
                } else {
                    updateSyncStatus(false);
                    alert('❌ Error saving to Google Sheets: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error saving to Google Sheets:', error);
                updateSyncStatus(false, '❌ Save failed');
                alert('❌ Error saving to Google Sheets: ' + error.message);
            }
        }
        
        function renderListings(listings) {
            if (!listings) listings = data.listings;
            const grid = document.getElementById('listingsGrid');
            grid.innerHTML = '';
            
            // Sort listings by name (A-Z) before rendering
            const sortedListings = listings.slice().sort(function(a, b) {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                return aName.localeCompare(bName);
            });
            
            sortedListings.forEach(function(listing) {
                const card = document.createElement('div');
                card.className = 'listing-card';
                if (listing.featured) {
                    const badge = document.createElement('div');
                    badge.className = 'featured-badge';
                    badge.textContent = 'FEATURED';
                    card.appendChild(badge);
                }
                
                const img = document.createElement('img');
                img.src = listing.image1;
                img.alt = listing.name;
                img.className = 'listing-image';
                card.appendChild(img);
                
            const content = document.createElement('div');
                content.className = 'listing-content';
            
            const contactLines = [];
            if (listing.authorName) {
                contactLines.push('Author: ' + listing.authorName);
            }
            if (listing.publishedDate) {
                contactLines.push('Published: ' + listing.publishedDate);
            }
            if (listing.modifiedDate) {
                contactLines.push('Updated: ' + listing.modifiedDate);
            }
            if (listing.phone) {
                contactLines.push('Phone: ' + listing.phone);
            }
            if (listing.address) {
                contactLines.push('Address: ' + listing.address);
            }
            if (listing.directionsLink) {
                contactLines.push('Directions: <a href="' + listing.directionsLink + '" target="_blank" rel="noopener noreferrer">Open Map ↗</a>');
            }
            const contactHtml = contactLines.join('<br>');

                content.innerHTML = 
                    '<h3>' + listing.name + '</h3>' +
                    '<div class="listing-meta">' +
                    '<span class="badge badge-type ' + getIconClass(listing.type, listing) + '">' + listing.type + '</span>' +
                    '<span class="badge badge-area">' + listing.area + '</span>' +
                    '</div>' +
                    '<p class="listing-desc">' + listing.description + '</p>' +
                    '<div class="listing-amenities">' +
                    listing.amenities.slice(0, 4).map(function(a) { return '<span class="amenity">' + a + '</span>'; }).join('') +
                    (listing.amenities.length > 4 ? '<span class="amenity">+' + (listing.amenities.length - 4) + ' more</span>' : '') +
                    '</div>' +
                '<div class="listing-contact">' +
                (contactHtml || 'No contact details provided') +
                '</div>';
                
                const actions = document.createElement('div');
                actions.className = 'listing-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-edit';
                editBtn.textContent = 'Edit';
                editBtn.addEventListener('click', function() { 
                    editListing(listing.id); 
                });
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete';
                
                // Check if this listing is waiting for confirmation
                if (deleteConfirmId === listing.id) {
                    deleteBtn.textContent = 'Confirm Delete?';
                    deleteBtn.style.background = '#dc2626';
                } else {
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.style.background = '#E3795C';
                }
                
                deleteBtn.addEventListener('click', function() { 
                    deleteListing(listing.id); 
                });
                
                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                content.appendChild(actions);
                card.appendChild(content);
                grid.appendChild(card);
            });
            
            updateStats(listings);
        }
        
        function updateStats(listings) {
            if (!listings) listings = data.listings;
            document.getElementById('totalListings').textContent = listings.length;
            document.getElementById('featuredCount').textContent = listings.filter(function(l) { return l.featured; }).length;
            const uniqueAreas = {};
            listings.forEach(function(l) { uniqueAreas[l.area] = true; });
            document.getElementById('areasCount').textContent = Object.keys(uniqueAreas).length;
            const uniqueTypes = {};
            listings.forEach(function(l) { uniqueTypes[l.type] = true; });
            document.getElementById('typesCount').textContent = Object.keys(uniqueTypes).length;
        }
        
        let currentAdminTypeFilter = ''; // Track which category is currently active (empty string = "All Types")
        
        function filterListings() {
            const searchTerm = document.getElementById('adminSearchInput').value.toLowerCase().trim();
            const areaFilter = document.getElementById('adminAreaFilter').value;
            const amenityFilter = document.getElementById('adminAmenityFilter').value;
            
            const filtered = data.listings.filter(function(listing) {
                const searchableText = [
                    listing.name,
                    listing.slug,
                    listing.type,
                    listing.area,
                    listing.description,
                listing.detailedDescription,
                listing.address,
                listing.authorName,
                listing.publishedDate,
                listing.modifiedDate,
                listing.directionsLink,
                listing.amenities.join(' ')
                ].join(' ').toLowerCase();
                
                const matchesSearch = !searchTerm || searchableText.indexOf(searchTerm) > -1;
                // Check if type matches - either direct match or category match
                let matchesType = true;
                if (currentAdminTypeFilter) {
                    // Check if it's a category key
                    if (TYPE_CATEGORIES && TYPE_CATEGORIES[currentAdminTypeFilter]) {
                        // Use getCategoryForType to determine the listing's category
                        // This handles both automatic type mapping and category overrides
                        const listingCategory = getCategoryForType(listing.type, listing);
                        matchesType = listingCategory === currentAdminTypeFilter;
                        
                        // Debug logging
                        if (listingCategory !== currentAdminTypeFilter) {
                            // This listing doesn't match the selected category
                        }
                    } else {
                        // Direct type match (legacy support)
                        matchesType = listing.type === currentAdminTypeFilter;
                    }
                }
                const matchesArea = !areaFilter || listing.area === areaFilter;
                const matchesAmenity = !amenityFilter || listing.amenities.indexOf(amenityFilter) > -1;
                
                return matchesSearch && matchesType && matchesArea && matchesAmenity;
            });
            
            console.log('📊 filterListings result:', filtered.length, 'of', data.listings.length, 'listings match filter');
            if (currentAdminTypeFilter) {
                console.log('📊 Filtering by category:', currentAdminTypeFilter);
                console.log('📊 Sample filtered types:', filtered.slice(0, 5).map(function(l) {
                    return l.type + ' -> ' + getCategoryForType(l.type, l);
                }).join(', '));
            }
            
            renderListings(filtered);
        }
        
        window.filterAdminByType = function filterAdminByType(typeOrCategory) {
            currentAdminTypeFilter = typeOrCategory || '';
            
            console.log('🔍 filterAdminByType called with:', typeOrCategory, '| currentAdminTypeFilter:', currentAdminTypeFilter);
            console.log('📋 TYPE_CATEGORIES available:', TYPE_CATEGORIES ? 'YES' : 'NO');
            if (TYPE_CATEGORIES && typeOrCategory) {
                console.log('📋 Category exists in TYPE_CATEGORIES:', TYPE_CATEGORIES[typeOrCategory] ? 'YES' : 'NO');
            }
            
            // Update button active states - only one category should be active at a time
            const buttons = document.querySelectorAll('#adminTab .type-filter-btn');
            buttons.forEach(function(btn) {
                btn.classList.remove('active');
                // Check if it matches by type or category
                if (!typeOrCategory) {
                    // "All Types" button - activate if no filter
                    if (btn.dataset.type === '' && !btn.dataset.category) {
                        btn.classList.add('active');
                    }
                } else {
                    // Category button - activate if it matches the current filter
                    if (btn.dataset.category === typeOrCategory) {
                        btn.classList.add('active');
                    }
                }
            });
            
            // Call filterListings to apply the filter
            filterListings();
        }
        
        function clearAdminFilters() {
            document.getElementById('adminSearchInput').value = '';
            document.getElementById('adminAreaFilter').value = '';
            document.getElementById('adminAmenityFilter').value = '';
            currentAdminTypeFilter = '';
            
            // Reset quick filter buttons - only activate "All Types" button
            // Category buttons have both data-type="" and data-category, so we need to exclude those
            const buttons = document.querySelectorAll('#adminTab .type-filter-btn');
            buttons.forEach(function(btn) {
                btn.classList.remove('active');
                // Only activate "All Types" button: it has data-type="" but NO data-category attribute
                // OR it has the ID adminAllTypesBtn
                if ((btn.id === 'adminAllTypesBtn') || 
                    (btn.dataset.type === '' && !btn.dataset.category)) {
                    btn.classList.add('active');
                }
            });
            
            renderListings(data.listings);
        }
        
        function populateAdminFilters() {
            if (!data || !data.filterOptions) return;
            refreshFilterSelect('adminAreaFilter', data.filterOptions.areas);
            refreshFilterSelect('adminAmenityFilter', data.filterOptions.amenities);
            
            // Render type filter buttons dynamically based on usage
            if (data.listings) {
                renderAdminTypeFilterButtons(data.listings, '#adminTab .type-quick-filters'); // Show all categories
                
                // Make sure "All Types" button has correct handler after categories are rendered
                // Use ID selector first, then fallback to querySelector
                const allTypesBtn = document.getElementById('adminAllTypesBtn') || 
                                    document.querySelector('#adminTab .type-filter-btn[data-type=""]:not([data-category])');
                if (allTypesBtn) {
                    // Remove any existing onclick handlers
                    allTypesBtn.onclick = null;
                    // Remove any existing event listeners by cloning and replacing
                    const newAllTypesBtn = allTypesBtn.cloneNode(true);
                    allTypesBtn.parentNode.replaceChild(newAllTypesBtn, allTypesBtn);
                    // Set ID on new button
                    newAllTypesBtn.id = 'adminAllTypesBtn';
                    // Add handler
                    newAllTypesBtn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 All Types button clicked');
                        currentAdminTypeFilter = '';
                        filterAdminByType('');
                    };
                }
            }
        }

        function populatePreviewFilters() {
            if (!data || !data.filterOptions) return;
            refreshFilterSelect('previewAreaFilter', data.filterOptions.areas);
            refreshFilterSelect('previewAmenityFilter', data.filterOptions.amenities);
        }
        
        // Get all categories from TYPE_CATEGORIES
        // Returns ALL categories regardless of whether they have matching types in the data
        // Categories with matching types will have a count > 0
        function getCategoriesByUsage(listings) {
            // Initialize counts for all categories (0 if no listings)
            const categoryCounts = {};
            const categoryTypesMap = {};
            
            // Initialize all categories from TYPE_CATEGORIES
            for (const categoryKey in TYPE_CATEGORIES) {
                categoryCounts[categoryKey] = 0;
                categoryTypesMap[categoryKey] = [];
            }
            
            // Count listings for each category if we have listings
            if (listings && listings.length > 0) {
                listings.forEach(function(listing) {
                    if (listing.type) {
                        const listingCategory = getCategoryForType(listing.type, listing);
                        if (listingCategory && TYPE_CATEGORIES[listingCategory]) {
                            categoryCounts[listingCategory] = (categoryCounts[listingCategory] || 0) + 1;
                            // Track which types belong to this category
                            if (categoryTypesMap[listingCategory].indexOf(listing.type) === -1) {
                                categoryTypesMap[listingCategory].push(listing.type);
                            }
                        }
                    }
                });
            }
            
            // Convert all categories to array
            const categoriesArray = Object.keys(TYPE_CATEGORIES).map(function(categoryKey) {
                return {
                    key: categoryKey,
                    category: TYPE_CATEGORIES[categoryKey],
                    count: categoryCounts[categoryKey] || 0,
                    types: categoryTypesMap[categoryKey] || [] // Types found in data for this category
                };
            });
            
            // Sort by count (descending), then by category name (ascending) for ties
            categoriesArray.sort(function(a, b) {
                if (b.count !== a.count) {
                    return b.count - a.count; // Most used first
                }
                return a.category.name.localeCompare(b.category.name); // Alphabetical for ties
            });
            
            return categoriesArray;
        }
        
        // Dynamically render category filter buttons
        // Shows ALL categories from TYPE_CATEGORIES regardless of whether they have matching types
        function renderAdminTypeFilterButtons(listings, containerSelector, maxVisible) {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            
            // Get ALL categories (will show all regardless of usage)
            const categoriesByUsage = getCategoriesByUsage(listings || []);
            
            if (categoriesByUsage.length === 0) {
                console.log('⚠️ No categories defined in TYPE_CATEGORIES');
                return;
            }
            
            console.log('📊 Admin: All categories (showing all regardless of usage):', categoriesByUsage.map(function(c) {
                return c.category.name + ' (' + c.count + ' listings)';
            }).join(', '));
            
            // Show ALL categories - if maxVisible is not specified or is less than total, show all
            // Otherwise respect maxVisible but default to showing all
            const totalCategories = categoriesByUsage.length;
            const effectiveMaxVisible = maxVisible && maxVisible >= totalCategories ? maxVisible : totalCategories;
            
            const visibleCategories = categoriesByUsage.slice(0, effectiveMaxVisible);
            const hiddenCategories = categoriesByUsage.slice(effectiveMaxVisible);
            
            // Clear existing buttons (except "All Types" button)
            const existingButtons = container.querySelectorAll('.type-filter-btn[data-category]:not([data-category=""])');
            existingButtons.forEach(function(btn) {
                btn.remove();
            });
            
            // Remove existing expanded section and see-more button if they exist
            const existingExpanded = container.querySelector('.type-filters-expanded');
            const existingSeeMore = container.querySelector('.type-filter-see-more-btn');
            if (existingExpanded) existingExpanded.remove();
            if (existingSeeMore) existingSeeMore.remove();
            
            // Get the "All Types" button to insert after it
            const allTypeBtn = container.querySelector('.type-filter-btn[data-type=""]');
            
            // Render visible categories - insert them right after the "All Types" button
            visibleCategories.forEach(function(categoryInfo) {
                const btn = document.createElement('button');
                btn.className = 'type-filter-btn category-filter-btn';
                btn.setAttribute('data-category', categoryInfo.key);
                btn.setAttribute('data-type', ''); // Empty to indicate it's a category
                
                // Create button content with emoji and name
                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'category-emoji';
                emojiSpan.textContent = categoryInfo.category.emoji;
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'category-name';
                nameSpan.textContent = categoryInfo.category.name;
                
                btn.appendChild(emojiSpan);
                btn.appendChild(nameSpan);
                btn.title = categoryInfo.category.description;
                
                // When clicked, filter by all types in this category
                // Only one category can be active at a time
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Check if this category is already active
                    if (currentAdminTypeFilter === categoryInfo.key) {
                        // If clicking the same category, clear the filter and show "All Types"
                        console.log('🔄 Clearing category filter');
                        currentAdminTypeFilter = '';
                        filterAdminByType('');
                    } else {
                        // Clear previous selection and set this category as active
                        console.log('🎯 Filtering by category:', categoryInfo.key, categoryInfo.category.name);
                        currentAdminTypeFilter = categoryInfo.key;
                        filterAdminByType(categoryInfo.key);
                    }
                };
                
                if (allTypeBtn) {
                    // Insert after "All Types" button
                    if (allTypeBtn.nextSibling) {
                        container.insertBefore(btn, allTypeBtn.nextSibling);
                    } else {
                        // If "All Types" button is the last child, append after it
                        container.appendChild(btn);
                    }
                } else {
                    // If no "All Types" button, just append
                    container.appendChild(btn);
                }
            });
            
            // Render hidden categories in expandable section (if there are any)
            if (hiddenCategories.length > 0) {
                const expandedDiv = document.createElement('div');
                expandedDiv.className = 'type-filters-expanded';
                expandedDiv.style.display = 'none';
                
                hiddenCategories.forEach(function(categoryInfo) {
                    const btn = document.createElement('button');
                    btn.className = 'type-filter-btn category-filter-btn';
                    btn.setAttribute('data-category', categoryInfo.key);
                    btn.setAttribute('data-type', '');
                    
                    const emojiSpan = document.createElement('span');
                    emojiSpan.className = 'category-emoji';
                    emojiSpan.textContent = categoryInfo.category.emoji;
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'category-name';
                    nameSpan.textContent = categoryInfo.category.name;
                    
                    btn.appendChild(emojiSpan);
                    btn.appendChild(nameSpan);
                    btn.title = categoryInfo.category.description;
                    
                    // Only one category can be active at a time
                    btn.onclick = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check if this category is already active
                        if (currentAdminTypeFilter === categoryInfo.key) {
                            // If clicking the same category, clear the filter and show "All Types"
                            console.log('🔄 Clearing category filter (hidden category)');
                            currentAdminTypeFilter = '';
                            filterAdminByType('');
                        } else {
                            // Clear previous selection and set this category as active
                            console.log('🎯 Filtering by category (hidden):', categoryInfo.key, categoryInfo.category.name);
                            currentAdminTypeFilter = categoryInfo.key;
                            filterAdminByType(categoryInfo.key);
                        }
                    };
                    
                    expandedDiv.appendChild(btn);
                });
                
                container.appendChild(expandedDiv);
                
                // Add "See More" button
                const seeMoreBtn = document.createElement('button');
                seeMoreBtn.className = 'type-filter-see-more-btn';
                seeMoreBtn.onclick = function() {
                    toggleAdminTypeFilters();
                };
                seeMoreBtn.innerHTML = '<span class="see-more-text">See More</span><span class="see-less-text" style="display: none;">See Less</span>';
                container.appendChild(seeMoreBtn);
            }
        }
        
        // Toggle "See More" functionality for admin type filters
        function toggleAdminTypeFilters() {
            const container = document.querySelector('#adminTab .type-quick-filters');
            if (!container) return;
            
            const expanded = container.querySelector('.type-filters-expanded');
            const seeMoreBtn = container.querySelector('.type-filter-see-more-btn');
            
            if (expanded && seeMoreBtn) {
                const seeMoreTextSpan = seeMoreBtn.querySelector('.see-more-text');
                const seeLessTextSpan = seeMoreBtn.querySelector('.see-less-text');
                
                if (expanded.style.display === 'none' || !expanded.style.display) {
                    expanded.style.display = 'block';
                    if (seeMoreTextSpan) seeMoreTextSpan.style.display = 'none';
                    if (seeLessTextSpan) seeLessTextSpan.style.display = 'inline';
                } else {
                    expanded.style.display = 'none';
                    if (seeMoreTextSpan) seeMoreTextSpan.style.display = 'inline';
                    if (seeLessTextSpan) seeLessTextSpan.style.display = 'none';
                }
            }
        }
        
        // Make toggleAdminTypeFilters available globally
        window.toggleAdminTypeFilters = toggleAdminTypeFilters;
        
        function renderAmenitiesCheckboxes() {
            const container = document.getElementById('amenitiesCheckboxes');
            if (!container) return;
            
            // Ensure data is initialized
            if (typeof data === 'undefined' || !data || !data.filterOptions || !data.filterOptions.amenities) {
                console.warn('Data not initialized yet, skipping renderAmenitiesCheckboxes');
                return;
            }
            
            const amenities = data.filterOptions.amenities;
            container.innerHTML = amenities.map(function(amenity) {
                const id = 'amenity-' + amenity.replace(/\s+/g, '-');
                return '<div class="checkbox-item">' +
                    '<input type="checkbox" id="' + id + '" value="' + amenity + '" />' +
                    '<label for="' + id + '" style="font-weight: normal; margin: 0;">' + amenity + '</label>' +
                    '</div>';
            }).join('');
        }
        
        window.openAddModal = function openAddModal() {
            document.getElementById('modalTitle').textContent = 'Add New Listing';
            document.getElementById('listingForm').reset();
            document.getElementById('editingId').value = '';
            // Ensure dropdowns are populated with current options
            updateTypeDropdown();
            updateAreaDropdown();
            updateCategoryDropdown();
            renderAmenitiesCheckboxes();
            document.getElementById('listingModal').classList.add('active');
        }
        
        function editListing(id) {
            const listing = data.listings.find(function(l) { return l.id === id; });
            if (!listing) return;
            
            // Ensure dropdowns are populated with current options
            updateTypeDropdown();
            updateAreaDropdown();
            updateCategoryDropdown();
            renderAmenitiesCheckboxes();
            
            document.getElementById('modalTitle').textContent = 'Edit Listing';
            document.getElementById('editingId').value = id;
            document.getElementById('listingName').value = listing.name;
            document.getElementById('listingType').value = listing.type;
            document.getElementById('listingArea').value = listing.area;
            document.getElementById('listingDescription').value = listing.description;
            const customHtmlInput = document.getElementById('listingCustomHtml');
            if (customHtmlInput) customHtmlInput.value = listing.customHtml || '';
            const slugInput = document.getElementById('listingSlug');
            if (slugInput) slugInput.value = listing.slug || '';
            
            // Set category if it exists, otherwise leave blank for auto-assignment
            const categoryInput = document.getElementById('listingCategory');
            if (categoryInput) {
                categoryInput.value = listing.category || '';
            }
            document.getElementById('listingImage1').value = listing.image1;
            const image1DescInput = document.getElementById('listingImage1Desc');
            if (image1DescInput) image1DescInput.value = listing.image1Desc || '';
            document.getElementById('listingImage2').value = listing.image2 || '';
            const image2DescInput = document.getElementById('listingImage2Desc');
            if (image2DescInput) image2DescInput.value = listing.image2Desc || '';
            const image3Input = document.getElementById('listingImage3');
            if (image3Input) image3Input.value = listing.image3 || '';
            const image3DescInput = document.getElementById('listingImage3Desc');
            if (image3DescInput) image3DescInput.value = listing.image3Desc || '';
            document.getElementById('listingWebsite').value = listing.website;
            document.getElementById('listingPhone').value = listing.phone || '';
            document.getElementById('listingAddress').value = listing.address;
            const authorNameInput = document.getElementById('listingAuthorName');
            if (authorNameInput) authorNameInput.value = listing.authorName || '';
            const publishedInput = document.getElementById('listingPublishedDate');
            if (publishedInput) publishedInput.value = listing.publishedDate || '';
            const modifiedInput = document.getElementById('listingModifiedDate');
            if (modifiedInput) modifiedInput.value = listing.modifiedDate || '';
            const directionsInput = document.getElementById('listingDirectionsLink');
            if (directionsInput) directionsInput.value = listing.directionsLink || '';
            const videoLinkInput = document.getElementById('listingVideoLink');
            if (videoLinkInput) videoLinkInput.value = listing.videoLink || '';
            document.getElementById('listingFeatured').checked = listing.featured || false;
            
            // Set accordion fields
            const accordionPanel1TitleInput = document.getElementById('listingAccordionPanel1Title');
            if (accordionPanel1TitleInput) {
                accordionPanel1TitleInput.value = listing.accordionPanel1Title || '';
                // Debug: Log accordion data when editing
                if (listing.accordionPanel1Title && !window._editAccordionDebugLogged) {
                    console.log('🎯 editListing - Accordion data for:', listing.name);
                    console.log('   accordionPanel1Title:', listing.accordionPanel1Title?.substring(0, 50) || '(empty)');
                    console.log('   accordionPanel1Content:', listing.accordionPanel1Content?.substring(0, 50) || '(empty)');
                    console.log('   Setting input value to:', accordionPanel1TitleInput.value?.substring(0, 50) || '(empty)');
                    window._editAccordionDebugLogged = true;
                }
            }
            const accordionPanel1ContentInput = document.getElementById('listingAccordionPanel1Content');
            if (accordionPanel1ContentInput) accordionPanel1ContentInput.value = listing.accordionPanel1Content || '';
            const accordionPanel2TitleInput = document.getElementById('listingAccordionPanel2Title');
            if (accordionPanel2TitleInput) accordionPanel2TitleInput.value = listing.accordionPanel2Title || '';
            const accordionPanel2ContentInput = document.getElementById('listingAccordionPanel2Content');
            if (accordionPanel2ContentInput) accordionPanel2ContentInput.value = listing.accordionPanel2Content || '';
            const accordionPanel3TitleInput = document.getElementById('listingAccordionPanel3Title');
            if (accordionPanel3TitleInput) accordionPanel3TitleInput.value = listing.accordionPanel3Title || '';
            const accordionPanel3ContentInput = document.getElementById('listingAccordionPanel3Content');
            if (accordionPanel3ContentInput) accordionPanel3ContentInput.value = listing.accordionPanel3Content || '';
            const accordionPanel4TitleInput = document.getElementById('listingAccordionPanel4Title');
            if (accordionPanel4TitleInput) accordionPanel4TitleInput.value = listing.accordionPanel4Title || '';
            const accordionPanel4ContentInput = document.getElementById('listingAccordionPanel4Content');
            if (accordionPanel4ContentInput) accordionPanel4ContentInput.value = listing.accordionPanel4Content || '';
            
            const checkboxes = document.querySelectorAll('#amenitiesCheckboxes input[type="checkbox"]');
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = listing.amenities.indexOf(checkbox.value) > -1;
            });
            
            document.getElementById('listingModal').classList.add('active');
        }
        
        async function deleteListing(id) {
            const listing = data.listings.find(function(l) { return l.id === id; });
            
            if (!listing) {
                alert('Listing not found!');
                return;
            }
            
            // Check if this is the confirmation click
            if (deleteConfirmId === id) {
                // Confirmed - delete it
                deleteConfirmId = null;
                if (deleteConfirmTimeout) clearTimeout(deleteConfirmTimeout);
                
                // Delete from Google Sheets if configured
                if (GOOGLE_APPS_SCRIPT_URL && !GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
                    try {
                        // Try direct POST, fallback to form submission
                        const postData = JSON.stringify({
                            action: 'deleteListing',
                            listingId: id
                        });
                        
                        let result = { success: false };
                        
                        // Try direct fetch first
                        try {
                            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                method: 'POST',
                                mode: 'cors',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: postData
                            });
                            
                            const responseText = await response.text();
                            result = responseText ? JSON.parse(responseText) : { success: true };
                        } catch (corsError) {
                            // Use no-cors mode as fallback
                            try {
                                await fetch(GOOGLE_APPS_SCRIPT_URL, {
                                    method: 'POST',
                                    mode: 'no-cors',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: postData
                                });
                                result = { success: true };
                                console.log('Using no-cors mode for delete, assuming success');
                            } catch (e) {
                                result = { success: false, error: 'Failed to connect' };
                            }
                        }
                        
                        if (result.success) {
                            // Update local data
                            data.listings = data.listings.filter(function(l) { return l.id !== id; });
                            updateSyncStatus(true, '✅ Deleted from Google Sheets');
                            
                            // Reload from Google Sheets to sync
                            setTimeout(() => loadDataFromGoogleSheets(), 1000);
                        } else {
                            throw new Error(result.error || 'Delete failed');
                        }
                    } catch (error) {
                        console.error('Error deleting from Google Sheets:', error);
                        updateSyncStatus(false, '❌ Delete failed');
                        alert('⚠️ Failed to delete from Google Sheets: ' + error.message + '\n\nDeleted locally only.');
                        
                        // Still delete locally
                        data.listings = data.listings.filter(function(l) { return l.id !== id; });
                    }
                } else {
                    // No Google Sheets configured - delete locally only
                    data.listings = data.listings.filter(function(l) { return l.id !== id; });
                    alert('Deleted "' + listing.name + '" (Local only - configure Google Sheets to sync)');
                }
                
                applyFilterOptionCleanup();
                renderListings();
                
            } else {
                // First click - set confirmation needed
                deleteConfirmId = id;
                
                // Clear any existing timeout
                if (deleteConfirmTimeout) clearTimeout(deleteConfirmTimeout);
                
                // Re-render to update button text
                renderListings();
                
                // Reset after 3 seconds
                deleteConfirmTimeout = setTimeout(function() {
                    deleteConfirmId = null;
                    renderListings();
                }, 3000);
            }
        }
        
        function saveListing(event) {
            event.preventDefault();
            
            const getValue = function(id) {
                const el = document.getElementById(id);
                return el ? el.value : '';
            };
            
            const getChecked = function(id) {
                const el = document.getElementById(id);
                return el ? el.checked : false;
            };
            
            const checkboxes = document.querySelectorAll('#amenitiesCheckboxes input[type="checkbox"]:checked');
            const selectedAmenities = [];
            checkboxes.forEach(function(cb) { selectedAmenities.push(cb.value); });
            
            const editingId = document.getElementById('editingId').value;
            const isUpdate = !!editingId;
            const existingListing = isUpdate ? data.listings.find(function(l) { return l.id === editingId; }) : null;
            const generatedId = editingId || Date.now().toString();
            
            // Get category override, if provided
            const categoryOverride = getValue('listingCategory');
            
            const listingUpdates = {
                id: generatedId,
                name: getValue('listingName'),
                slug: getValue('listingSlug'),
                type: getValue('listingType'),
                area: getValue('listingArea'),
                description: getValue('listingDescription'),
                detailedDescription: '', // Field removed from UI, keep empty for backward compatibility
                image1: getValue('listingImage1'),
                image1Desc: getValue('listingImage1Desc'),
                image2: getValue('listingImage2'),
                image2Desc: getValue('listingImage2Desc'),
                image3: getValue('listingImage3'),
                image3Desc: getValue('listingImage3Desc'),
                website: getValue('listingWebsite'),
                phone: getValue('listingPhone'),
                address: getValue('listingAddress'),
                amenities: selectedAmenities,
                featured: getChecked('listingFeatured'),
                authorName: getValue('listingAuthorName'),
                publishedDate: getValue('listingPublishedDate'),
                modifiedDate: getValue('listingModifiedDate'),
                directionsLink: getValue('listingDirectionsLink'),
                googleMapsUrl: getValue('listingDirectionsLink'),
                category: categoryOverride || undefined, // Only save if explicitly set
                accordionPanel1Title: getValue('listingAccordionPanel1Title'),
                accordionPanel1Content: getValue('listingAccordionPanel1Content'),
                accordionPanel2Title: getValue('listingAccordionPanel2Title'),
                accordionPanel2Content: getValue('listingAccordionPanel2Content'),
                accordionPanel3Title: getValue('listingAccordionPanel3Title'),
                accordionPanel3Content: getValue('listingAccordionPanel3Content'),
                accordionPanel4Title: getValue('listingAccordionPanel4Title'),
                accordionPanel4Content: getValue('listingAccordionPanel4Content')
            };
            
            const listing = sanitizeListing(Object.assign({}, existingListing || {}, listingUpdates));
            
            if (!listing.slug && listing.name) {
                listing.slug = slugify(listing.name);
            }
            
            // Save locally only - user must click "Save All to Google Sheets" to sync
                        if (isUpdate) {
                            const index = data.listings.findIndex(function(l) { return l.id === editingId; });
                            if (index >= 0) {
                                data.listings[index] = listing;
                    alert('"' + listing.name + '" has been updated locally!\n\n💾 Click "Save All to Google Sheets" to sync changes.');
                        } else {
                            data.listings.push(listing);
                    alert('"' + listing.name + '" has been added locally!\n\n💾 Click "Save All to Google Sheets" to sync changes.');
                }
                    } else {
                        data.listings.push(listing);
                alert('"' + listing.name + '" has been added locally!\n\n💾 Click "Save All to Google Sheets" to sync changes.');
            }
            
            // Update filter options, refresh display, and close modal
            applyFilterOptionCleanup();
            renderListings();
            closeModal();
        }
        
        window.closeModal = function closeModal() {
            document.getElementById('listingModal').classList.remove('active');
        }
        
        function exportData() {
            const format = confirm('Choose Export Format\n\n' +
                                'Click OK to export as JSON data file\n' +
                                'Click Cancel to export full HTML admin backup');
            
            if (format) {
                const dataStr = JSON.stringify(data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'adventure-directory-data-' + new Date().toISOString().split('T')[0] + '.json';
                link.click();
                URL.revokeObjectURL(url);
                alert('JSON data exported! Check your downloads folder.');
            } else {
                const htmlContent = document.documentElement.outerHTML;
                const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(htmlBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'adventure-directory-admin-backup-' + new Date().toISOString().split('T')[0] + '.html';
                link.click();
                URL.revokeObjectURL(url);
                alert('Full admin backup exported! You can open this HTML file anytime to continue editing.');
            }
        }
        
        function quickExportJSON() {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'data-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
            alert('JSON file downloaded! This contains all your listing data.');
        }
        
        // Download JSON backup (same as quickExportJSON but with different naming)
        function downloadJSON() {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'nelson-county-listings-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            // Update status AFTER download completes
            setTimeout(() => {
                updateSyncStatus(true, '💾 JSON backup downloaded');
            }, 100);
        }
        
        document.getElementById('listingModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
        
        window.switchTab = function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function(content) { content.classList.remove('active'); });
            
            const header = document.querySelector('.header');
            
            if (tab === 'admin') {
                document.querySelectorAll('.tab-btn')[0].classList.add('active');
                document.getElementById('adminTab').classList.add('active');
                header.style.display = 'block';
            } else if (tab === 'data') {
                document.querySelectorAll('.tab-btn')[1].classList.add('active');
                document.getElementById('dataTab').classList.add('active');
                header.style.display = 'block';
                renderDataTable();
            } else if (tab === 'categories') {
                document.querySelectorAll('.tab-btn')[2].classList.add('active');
                document.getElementById('categoriesTab').classList.add('active');
                header.style.display = 'block';
                renderCategories();
            } else if (tab === 'settings') {
                document.querySelectorAll('.tab-btn')[3].classList.add('active');
                document.getElementById('settingsTab').classList.add('active');
                header.style.display = 'block';
                renderSettings();
            }
        }
        
        // ===========================================
        // SETTINGS MANAGEMENT FUNCTIONS
        // ===========================================
        function renderSettings() {
            renderTypesList();
            renderAreasList();
            renderAmenitiesList();
        }
        
        function renderTypesList() {
            const container = document.getElementById('typesList');
            if (!container) return;
            
            container.innerHTML = data.filterOptions.types.map(function(type, index) {
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">' +
                    '<span>' + type + '</span>' +
                    '<button onclick="removeType(' + index + ')" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        function renderAreasList() {
            const container = document.getElementById('areasList');
            if (!container) return;
            
            container.innerHTML = data.filterOptions.areas.map(function(area, index) {
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">' +
                    '<span>' + area + '</span>' +
                    '<button onclick="removeArea(' + index + ')" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        function renderAmenitiesList() {
            const container = document.getElementById('amenitiesList');
            if (!container) return;
            
            container.innerHTML = data.filterOptions.amenities.map(function(amenity, index) {
                return '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 4px;">' +
                    '<span>' + amenity + '</span>' +
                    '<button onclick="removeAmenity(' + index + ')" style="background: #dc3545; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>' +
                    '</div>';
            }).join('');
        }
        
        function addType() {
            const input = document.getElementById('newTypeInput');
            const value = input.value.trim();
            if (!value) return;
            
            if (data.filterOptions.types.indexOf(value) === -1) {
                data.filterOptions.types.push(value);
                saveFilterOptions();
                renderTypesList();
                updateTypeDropdown();
                input.value = '';
            } else {
                alert('This type already exists.');
            }
        }
        
        function removeType(index) {
            const confirmed = confirm('Remove Filter Type: "' + data.filterOptions.types[index] + '"\n\n' +
                                    'This will remove it from filter options but will not affect existing listings.\n\n' +
                                    'Click OK to remove this filter type\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                data.filterOptions.types.splice(index, 1);
                saveFilterOptions();
                renderTypesList();
                updateTypeDropdown();
            }
        }
        
        function addArea() {
            const input = document.getElementById('newAreaInput');
            const value = input.value.trim();
            if (!value) return;
            
            if (data.filterOptions.areas.indexOf(value) === -1) {
                data.filterOptions.areas.push(value);
                saveFilterOptions();
                renderAreasList();
                updateAreaDropdown();
                input.value = '';
            } else {
                alert('This area already exists.');
            }
        }
        
        function removeArea(index) {
            const confirmed = confirm('Remove Filter Area: "' + data.filterOptions.areas[index] + '"\n\n' +
                                    'This will remove it from filter options but will not affect existing listings.\n\n' +
                                    'Click OK to remove this filter area\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                data.filterOptions.areas.splice(index, 1);
                saveFilterOptions();
                renderAreasList();
                updateAreaDropdown();
            }
        }
        
        function addAmenity() {
            const input = document.getElementById('newAmenityInput');
            const value = input.value.trim();
            if (!value) return;
            
            if (data.filterOptions.amenities.indexOf(value) === -1) {
                data.filterOptions.amenities.push(value);
                saveFilterOptions();
                renderAmenitiesList();
                updateAmenitiesCheckboxes();
                input.value = '';
            } else {
                alert('This amenity already exists.');
            }
        }
        
        function removeAmenity(index) {
            const confirmed = confirm('Remove Filter Amenity: "' + data.filterOptions.amenities[index] + '"\n\n' +
                                    'This will remove it from filter options but will not affect existing listings.\n\n' +
                                    'Click OK to remove this filter amenity\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                data.filterOptions.amenities.splice(index, 1);
                saveFilterOptions();
                renderAmenitiesList();
                updateAmenitiesCheckboxes();
            }
        }
        
        // ===========================================
        // ICON MAPPING MANAGEMENT FUNCTIONS
        // ===========================================
        
        // List of available icon classes
        const AVAILABLE_ICONS = [
            'icon-wine', 'icon-beer', 'icon-spirits', 'icon-cocktail', 'icon-coffee', 'icon-tea',
            'icon-restaurant', 'icon-bakery', 'icon-cheese', 'icon-chocolate', 'icon-museum', 'icon-art',
            'icon-gallery', 'icon-hiking', 'icon-cycling', 'icon-activity', 'icon-kayaking', 'icon-spa',
            'icon-wellness', 'icon-shopping', 'icon-market', 'icon-concert', 'icon-theater', 'icon-cinema',
            'icon-festival', 'icon-hotel', 'icon-lodging', 'icon-transport', 'icon-train', 'icon-boat',
            'icon-scenic', 'icon-viewpoint', 'icon-park', 'icon-garden', 'icon-beach', 'icon-history',
            'icon-culture', 'icon-architecture', 'icon-local', 'icon-tour', 'icon-workshop', 'icon-class',
            'icon-food', 'icon-cidery', 'icon-indoor', 'icon-attraction', 'icon-farm', 'icon-outdoor',
            'icon-default'
        ];
        
        function renderIconMappings() {
            const container = document.getElementById('iconsList');
            if (!container) return;
            
            // Get sorted list of type-icon mappings
            const mappings = Object.keys(ICON_MAPPINGS).map(function(type) {
                return { type: type, icon: ICON_MAPPINGS[type] };
            }).sort(function(a, b) {
                return a.type.localeCompare(b.type);
            });
            
            if (mappings.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; padding: 20px; text-align: center;">No icon mappings found. Click "Add New Mapping" to create one.</p>';
                return;
            }
            
            // Create a temporary container to build the HTML safely
            const tempContainer = document.createElement('div');
            
            mappings.forEach(function(mapping, index) {
                const iconOptions = AVAILABLE_ICONS.map(function(icon) {
                    return '<option value="' + icon + '"' + (icon === mapping.icon ? ' selected' : '') + '>' + icon.replace('icon-', '') + '</option>';
                }).join('');
                
                // Escape type for HTML display only
                const escapedTypeForHTML = mapping.type.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                const item = document.createElement('div');
                item.className = 'icon-mapping-item';
                item.setAttribute('data-type', mapping.type); // Store actual type in data attribute
                item.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 15px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px;';
                
                item.innerHTML = '<div style="flex: 1;">' +
                    '<div style="font-weight: 600; color: #212529; margin-bottom: 5px;">' + escapedTypeForHTML + '</div>' +
                    '<div style="font-size: 12px; color: #6c757d;">Type</div>' +
                    '</div>' +
                    '<div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">' +
                    '<span class="badge-type ' + mapping.icon + '" style="width: 24px; height: 24px; display: inline-block;"></span>' +
                    '</div>' +
                    '<div style="flex: 1;">' +
                    '<select class="icon-select" style="width: 100%; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 14px;">' +
                    iconOptions +
                    '</select>' +
                    '</div>' +
                    '<button class="remove-icon-mapping-btn" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">Remove</button>';
                
                tempContainer.appendChild(item);
            });
            
            container.innerHTML = '';
            container.appendChild(tempContainer);
            
            // Attach event listeners after rendering
            container.querySelectorAll('.icon-select').forEach(function(select) {
                select.addEventListener('change', function() {
                    const item = this.closest('.icon-mapping-item');
                    const type = item.getAttribute('data-type');
                    const iconClass = this.value;
                    updateIconMapping(type, iconClass);
                });
            });
            
            container.querySelectorAll('.remove-icon-mapping-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const item = this.closest('.icon-mapping-item');
                    const type = item.getAttribute('data-type');
                    removeIconMapping(type);
                });
            });
        }
        
        window.updateIconMapping = function updateIconMapping(type, iconClass) {
            if (!type || !iconClass) return;
            
            ICON_MAPPINGS[type] = iconClass;
            saveIconMappingsToStorage(ICON_MAPPINGS);
            
            // Re-render to show updated icon
            renderIconMappings();
            
            // Update preview if we have listings displayed
            if (data && data.listings) {
                renderListings(data.listings);
                if (typeof renderPreview === 'function') {
                    renderPreview(data.listings);
                }
            }
        };
        
        window.addIconMapping = function addIconMapping() {
            const type = prompt('Enter the listing type name:');
            if (!type || !type.trim()) return;
            
            const trimmedType = type.trim();
            if (ICON_MAPPINGS[trimmedType]) {
                alert('This type already has an icon mapping. Use the edit function to change it.');
                return;
            }
            
            // Default to icon-default
            ICON_MAPPINGS[trimmedType] = 'icon-default';
            saveIconMappingsToStorage(ICON_MAPPINGS);
            renderIconMappings();
            
            // Scroll to the new mapping
            setTimeout(function() {
                const item = document.querySelector('.icon-mapping-item[data-type="' + trimmedType + '"]');
                if (item) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.style.background = '#fff3cd';
                    setTimeout(function() {
                        item.style.background = '#ffffff';
                    }, 2000);
                }
            }, 100);
        };
        
        window.removeIconMapping = function removeIconMapping(type) {
            if (!type) return;
            
            const confirmed = confirm('Remove icon mapping for type: "' + type + '"\n\n' +
                                    'This will remove the custom mapping. The type will use the default icon.\n\n' +
                                    'Click OK to remove this mapping\n' +
                                    'Click Cancel to keep it');
            if (confirmed) {
                delete ICON_MAPPINGS[type];
                saveIconMappingsToStorage(ICON_MAPPINGS);
                renderIconMappings();
                
                // Update preview if we have listings displayed
                if (data && data.listings) {
                    renderListings(data.listings);
                    if (typeof renderPreview === 'function') {
                        renderPreview(data.listings);
                    }
                }
            }
        };
        
        window.filterIconMappings = function filterIconMappings() {
            const searchTerm = document.getElementById('iconMappingSearch').value.toLowerCase().trim();
            const items = document.querySelectorAll('.icon-mapping-item');
            
            items.forEach(function(item) {
                const type = item.dataset.type.toLowerCase();
                const iconSelect = item.querySelector('.icon-select');
                const icon = iconSelect ? iconSelect.value.toLowerCase() : '';
                const matches = !searchTerm || type.indexOf(searchTerm) > -1 || icon.indexOf(searchTerm) > -1;
                item.style.display = matches ? 'flex' : 'none';
            });
        };
        
        window.resetIconMappingsToDefaults = function resetIconMappingsToDefaults() {
            const confirmed = confirm('Reset all icon mappings to defaults?\n\n' +
                                    'This will replace all current mappings with the default set.\n\n' +
                                    'Click OK to reset\n' +
                                    'Click Cancel to keep current mappings');
            if (confirmed) {
                ICON_MAPPINGS = JSON.parse(JSON.stringify(DEFAULT_ICON_MAPPINGS));
                saveIconMappingsToStorage(ICON_MAPPINGS);
                renderIconMappings();
                
                // Update preview if we have listings displayed
                if (data && data.listings) {
                    renderListings(data.listings);
                    if (typeof renderPreview === 'function') {
                        renderPreview(data.listings);
                    }
                }
            }
        };
        
        window.exportIconMappings = function exportIconMappings() {
            const dataStr = JSON.stringify(ICON_MAPPINGS, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'icon-mappings-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
        };
        
        window.importIconMappings = function importIconMappings(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported && typeof imported === 'object') {
                        const confirmed = confirm('Import icon mappings?\n\n' +
                                                'This will replace all current mappings with the imported ones.\n\n' +
                                                'Click OK to import\n' +
                                                'Click Cancel to cancel');
                        if (confirmed) {
                            ICON_MAPPINGS = imported;
                            saveIconMappingsToStorage(ICON_MAPPINGS);
                            renderIconMappings();
                            
                            // Update preview if we have listings displayed
                            if (data && data.listings) {
                                renderListings(data.listings);
                                if (typeof renderPreview === 'function') {
                                    renderPreview(data.listings);
                                }
                            }
                            
                            alert('Icon mappings imported successfully!');
                        }
                    } else {
                        alert('Invalid file format. Please import a valid JSON file.');
                    }
                } catch (err) {
                    alert('Error importing file: ' + err.message);
                }
            };
            reader.readAsText(file);
            event.target.value = ''; // Reset file input
        };
        
        function saveFilterOptions() {
            // Save to localStorage
            localStorage.setItem('nelsonCounty_filterOptions', JSON.stringify(data.filterOptions));
        }
        
        // ===========================================
        // CATEGORY MANAGEMENT FUNCTIONS
        // ===========================================
        function renderCategories() {
            const container = document.getElementById('categoriesList');
            if (!container) return;
            
            container.innerHTML = Object.keys(TYPE_CATEGORIES).map(function(categoryKey) {
                const category = TYPE_CATEGORIES[categoryKey];
                const typesHtml = category.types.map(function(type, typeIndex) {
                    return '<div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f8f9fa; border-radius: 4px; margin: 4px 0;">' +
                        '<span style="flex: 1;">' + type + '</span>' +
                        '<button onclick="removeTypeFromCategory(\'' + categoryKey + '\', ' + typeIndex + ')" style="background: #dc3545; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Remove</button>' +
                        '</div>';
                }).join('');
                
                return '<div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">' +
                    '<div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">' +
                    '<input type="text" id="categoryEmoji_' + categoryKey + '" value="' + category.emoji + '" style="width: 60px; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px; font-size: 24px; text-align: center;" onchange="updateCategory(\'' + categoryKey + '\')" placeholder="🎭" />' +
                    '<input type="text" id="categoryName_' + categoryKey + '" value="' + category.name + '" style="flex: 1; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px;" onchange="updateCategory(\'' + categoryKey + '\')" placeholder="Category Name" />' +
                    '</div>' +
                    '<div style="margin-bottom: 15px;">' +
                    '<textarea id="categoryDesc_' + categoryKey + '" style="width: 100%; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px; min-height: 60px;" onchange="updateCategory(\'' + categoryKey + '\')" placeholder="Category description">' + category.description + '</textarea>' +
                    '</div>' +
                    '<div style="margin-bottom: 15px;">' +
                    '<label style="display: block; margin-bottom: 8px; font-weight: 600; color: #212529;">Types in this category:</label>' +
                    '<div id="categoryTypes_' + categoryKey + '" style="max-height: 200px; overflow-y: auto; margin-bottom: 10px;">' + typesHtml + '</div>' +
                    '<div style="display: flex; gap: 10px;">' +
                    '<input type="text" id="newTypeForCategory_' + categoryKey + '" placeholder="Add type..." style="flex: 1; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px;" onkeypress="if(event.key===\'Enter\') addTypeToCategory(\'' + categoryKey + '\')" />' +
                    '<button onclick="addTypeToCategory(\'' + categoryKey + '\')" class="btn btn-success" style="padding: 8px 16px;">Add</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
            }).join('');
        }
        
        window.updateCategory = function updateCategory(categoryKey) {
            const category = TYPE_CATEGORIES[categoryKey];
            if (!category) return;
            
            category.emoji = document.getElementById('categoryEmoji_' + categoryKey).value.trim();
            category.name = document.getElementById('categoryName_' + categoryKey).value.trim();
            category.description = document.getElementById('categoryDesc_' + categoryKey).value.trim();
            
            // Note: Icons are set in DEFAULT_TYPE_CATEGORIES and not editable
            // If icon is missing, preserve it from defaults or use category key as fallback
            if (!category.icon && DEFAULT_TYPE_CATEGORIES[categoryKey]) {
                category.icon = DEFAULT_TYPE_CATEGORIES[categoryKey].icon || 'icon-default';
            }
            
            saveCategoriesToStorage(TYPE_CATEGORIES);
            renderCategories();
            
            // Refresh admin filters and listings to show updated category info
            if (data && data.listings) {
                populateAdminFilters();
                renderListings(data.listings);
            }
        };
        
        window.addTypeToCategory = function addTypeToCategory(categoryKey) {
            const input = document.getElementById('newTypeForCategory_' + categoryKey);
            const value = input.value.trim();
            if (!value) return;
            
            const category = TYPE_CATEGORIES[categoryKey];
            if (!category) return;
            
            if (category.types.indexOf(value) === -1) {
                category.types.push(value);
                saveCategoriesToStorage(TYPE_CATEGORIES);
                renderCategories();
                input.value = '';
            } else {
                alert('This type already exists in this category.');
            }
        };
        
        window.removeTypeFromCategory = function removeTypeFromCategory(categoryKey, typeIndex) {
            const category = TYPE_CATEGORIES[categoryKey];
            if (!category) return;
            
            const confirmed = confirm('Remove type "' + category.types[typeIndex] + '" from category "' + category.name + '"?\n\nThis will affect how listings are categorized.');
            if (confirmed) {
                category.types.splice(typeIndex, 1);
                saveCategoriesToStorage(TYPE_CATEGORIES);
                renderCategories();
            }
        };
        
        window.resetCategoriesToDefaults = function resetCategoriesToDefaults() {
            if (confirm('Reset all categories to default values? This will overwrite all your customizations.')) {
                TYPE_CATEGORIES = JSON.parse(JSON.stringify(DEFAULT_TYPE_CATEGORIES));
                saveCategoriesToStorage(TYPE_CATEGORIES);
                renderCategories();
                alert('Categories reset to defaults.');
            }
        };
        
        window.exportCategories = function exportCategories() {
            const blob = new Blob([JSON.stringify(TYPE_CATEGORIES, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'categories-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };
        
        window.importCategories = function importCategories(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported && typeof imported === 'object') {
                        if (confirm('Import categories? This will overwrite your current categories.')) {
                            TYPE_CATEGORIES = imported;
                            saveCategoriesToStorage(TYPE_CATEGORIES);
                            renderCategories();
                            alert('Categories imported successfully.');
                        }
                    } else {
                        alert('Invalid categories file.');
                    }
                } catch (error) {
                    alert('Error importing categories: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        function updateCategoryDropdown() {
            const select = document.getElementById('listingCategory');
            if (!select) return;
            
            const currentValue = select.value;
            select.innerHTML = '<option value="">Auto-assign from Type</option>' +
                Object.keys(TYPE_CATEGORIES).map(function(categoryKey) {
                    const category = TYPE_CATEGORIES[categoryKey];
                    return '<option value="' + categoryKey + '">' + category.emoji + ' ' + category.name + '</option>';
                }).join('');
            select.value = currentValue;
        }
        
        function updateTypeDropdown() {
            const select = document.getElementById('listingType');
            if (!select) return;
            
            // Ensure data is initialized
            if (typeof data === 'undefined' || !data || !data.filterOptions || !data.filterOptions.types) {
                console.warn('Data not initialized yet, skipping updateTypeDropdown');
                return;
            }
            
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Type</option>' +
                data.filterOptions.types.map(function(type) {
                    return '<option value="' + type + '">' + type + '</option>';
                }).join('');
            select.value = currentValue;
            
            // Update category dropdown when type changes
            updateCategoryDropdown();
        }
        
        function updateAreaDropdown() {
            const select = document.getElementById('listingArea');
            if (!select) return;
            
            // Ensure data is initialized
            if (typeof data === 'undefined' || !data || !data.filterOptions || !data.filterOptions.areas) {
                console.warn('Data not initialized yet, skipping updateAreaDropdown');
                return;
            }
            
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Area</option>' +
                data.filterOptions.areas.map(function(area) {
                    return '<option value="' + area + '">' + area + '</option>';
                }).join('');
            select.value = currentValue;
        }
        
        function updateAmenitiesCheckboxes() {
            renderAmenitiesCheckboxes();
        }

        async function fetchImageKitUploadParams() {
            const urlWithQuery = GOOGLE_APPS_SCRIPT_URL + '?action=' + encodeURIComponent(IMAGEKIT_AUTH_ACTION) + '&t=' + Date.now();
            
            try {
                const response = await fetch(urlWithQuery, { method: 'GET' });
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                const json = await response.json();
                if (!json || json.success === false) {
                    throw new Error((json && json.error) || 'Failed to fetch ImageKit upload params');
                }
                const data = json.data || json;
                if (!data || !data.token || !data.signature || !data.expire) {
                    throw new Error('Invalid ImageKit params response (missing fields)');
                }
                return data;
            } catch (getError) {
                console.warn('GET request for ImageKit params failed, falling back to POST:', getError);
                
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=' + encodeURIComponent(IMAGEKIT_AUTH_ACTION)
                });
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                const json = await response.json();
                if (!json || json.success === false) {
                    throw new Error((json && json.error) || 'Failed to fetch ImageKit upload params');
                }
                const data = json.data || json;
                if (!data || !data.token || !data.signature || !data.expire) {
                    throw new Error('Invalid ImageKit params response (missing fields)');
                }
                return data;
            }
        }

        async function uploadImageToImageKit(file, onProgress) {
            const { token, expire, signature, folder } = await fetchImageKitUploadParams();

            const form = new FormData();
            form.append('file', file);
            form.append('fileName', file.name);
            form.append('token', token);
            form.append('expire', expire);
            form.append('signature', signature);
            form.append('publicKey', IMAGEKIT_PUBLIC_KEY);
            form.append('useUniqueFileName', 'true');
            if (folder) form.append('folder', folder);

            const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
            const xhr = new XMLHttpRequest();

            const uploadPromise = new Promise(function(resolve, reject) {
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            reject(new Error(xhr.responseText || 'ImageKit upload failed'));
                        }
                    }
                };
                xhr.onerror = function() {
                    reject(new Error('Network error'));
                };
            });

            if (typeof onProgress === 'function') {
                xhr.upload.onprogress = function(event) {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        onProgress(percent);
                    }
                };
            }

            xhr.open('POST', uploadUrl);
            xhr.send(form);

            return uploadPromise;
        }

        function initImageUploadButtons() {
            document.querySelectorAll('.btn-upload-image').forEach(function(button) {
                button.addEventListener('click', function() {
                    const targetId = button.dataset.target;
                    const input = document.getElementById(targetId);
                    if (!input) return;

                    const filePicker = document.createElement('input');
                    filePicker.type = 'file';
                    filePicker.accept = 'image/*';

                    filePicker.onchange = async function() {
                        if (!filePicker.files || !filePicker.files[0]) return;
                        const file = filePicker.files[0];

                        button.disabled = true;
                        const originalText = button.textContent;
                        button.textContent = 'Uploading...';

                        try {
                            const result = await uploadImageToImageKit(file);
                            input.value = result.url || result.filePath || '';
                            alert('Image uploaded successfully!');
                        } catch (error) {
                            console.error('ImageKit upload error:', error);
                            alert('Image upload failed: ' + error.message);
                        } finally {
                            button.disabled = false;
                            button.textContent = originalText;
                        }
                    };

                    filePicker.click();
                });
            });
        }
        
        // Icon mapping function - uses shared icon mappings from localStorage
        // Changes made here will sync to front page automatically
        function getIconClass(type, listing) {
            if (!type) return 'icon-default';
            
            // Get the category for this type
            const categoryKey = getCategoryForType(type, listing);
            if (categoryKey && TYPE_CATEGORIES[categoryKey] && TYPE_CATEGORIES[categoryKey].icon) {
                return TYPE_CATEGORIES[categoryKey].icon;
            }
            
            // Fallback to default icon
            return 'icon-default';
        }
        
        function renderPreview(filteredListings) {
            const listings = filteredListings || data.listings;
            const grid = document.getElementById('previewGrid');
            grid.innerHTML = '';
            
            // Populate filter dropdowns
            populatePreviewFilters();
            
            // Update results count
            document.getElementById('previewResultsCount').textContent = 'Showing ' + listings.length + ' listing' + (listings.length !== 1 ? 's' : '');
            
            listings.forEach(function(listing) {
                const card = document.createElement('div');
                card.className = 'flip-card';
                
                let flipBackTimeout = null;
                
                card.onclick = function(e) {
                    // Don't flip if clicking on links or buttons inside
                    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
                        return;
                    }
                    
                    // Close all other flipped cards
                    document.querySelectorAll('.flip-card.flipped').forEach(function(otherCard) {
                        if (otherCard !== card) {
                            otherCard.classList.remove('flipped');
                        }
                    });
                    
                    this.classList.toggle('flipped');
                    const overlay = document.getElementById('flipOverlay');
                    if (this.classList.contains('flipped')) {
                        overlay.classList.add('active');
                        document.body.style.overflow = 'hidden'; // Prevent scrolling
                    } else {
                        overlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                    
                    if (flipBackTimeout) {
                        clearTimeout(flipBackTimeout);
                        flipBackTimeout = null;
                    }
                };
                
                const inner = document.createElement('div');
                inner.className = 'flip-card-inner';
                
                const front = document.createElement('div');
                front.className = 'flip-card-front';
                
                // Create scrollable image container
                const imgContainer = document.createElement('div');
                imgContainer.className = 'card-front-image-scroll';
                imgContainer.style.cssText = 'position: relative; width: 100%; height: 240px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none;';
                imgContainer.style.setProperty('-ms-overflow-style', 'none');
                
                const imgWrapper = document.createElement('div');
                imgWrapper.style.cssText = 'position: absolute; top: 0; left: 0; width: auto; height: 100%; display: flex;';
                
                // Count images
                const imageCount = (listing.image1 ? 1 : 0) + (listing.image2 ? 1 : 0) + (listing.image3 ? 1 : 0);
                
                // Add image1 if it exists
                if (listing.image1) {
                    const img1 = document.createElement('img');
                    img1.src = listing.image1;
                    img1.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img1.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img1);
                }
                
                // Add image2 if it exists
                if (listing.image2) {
                    const img2 = document.createElement('img');
                    img2.src = listing.image2;
                    img2.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img2.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img2);
                }
                
                // Add image3 if it exists
                if (listing.image3) {
                    const img3 = document.createElement('img');
                    img3.src = listing.image3;
                    img3.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    img3.onerror = function() {
                        this.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    };
                    imgWrapper.appendChild(img3);
                }
                
                // If no images, add fallback
                if (imageCount === 0) {
                    const img = document.createElement('img');
                    img.src = 'https://via.placeholder.com/400x400?text=No+Image';
                    img.style.cssText = 'position: relative; width: 100%; min-width: 100%; max-width: 100%; height: 240px; object-fit: cover; display: block; border-radius: 12px; flex-shrink: 0; scroll-snap-align: start;';
                    imgWrapper.appendChild(img);
                }
                
                // Set wrapper and image widths to accommodate all images side by side
                if (imageCount > 1) {
                    // Wait for container to have dimensions, then set wrapper and image widths
                    setTimeout(function() {
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        if (containerWidth > 0) {
                            imgWrapper.style.width = (containerWidth * imageCount) + 'px';
                            // Set each image to be exactly the container width
                            const images = imgWrapper.querySelectorAll('img');
                            images.forEach(function(img) {
                                img.style.width = containerWidth + 'px';
                                img.style.minWidth = containerWidth + 'px';
                                img.style.maxWidth = containerWidth + 'px';
                                img.style.height = '240px';
                            });
                        }
                    }, 10);
                }
                
                imgContainer.appendChild(imgWrapper);
                front.appendChild(imgContainer);
                
                // Add scroll arrows if there are multiple images
                if (imageCount > 1) {
                    let currentIndex = 0;
                    const totalImages = imageCount;
                    
                    // Right arrow (loops infinitely)
                    const rightArrow = document.createElement('div');
                    rightArrow.className = 'scroll-arrow scroll-arrow-right';
                    
                    rightArrow.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        currentIndex = (currentIndex + 1) % totalImages;
                        // Get the container width at click time
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        imgContainer.scrollTo({ left: currentIndex * containerWidth, behavior: 'smooth' });
                    });
                    
                    // Left arrow (loops infinitely)
                    const leftArrow = document.createElement('div');
                    leftArrow.className = 'scroll-arrow scroll-arrow-left';
                    
                    leftArrow.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        currentIndex = (currentIndex - 1 + totalImages) % totalImages;
                        // Get the container width at click time
                        const containerWidth = imgContainer.offsetWidth || imgContainer.clientWidth;
                        imgContainer.scrollTo({ left: currentIndex * containerWidth, behavior: 'smooth' });
                    });
                    
                    imgContainer.appendChild(rightArrow);
                    imgContainer.appendChild(leftArrow);
                }
                
                // Add card content below images
                const cardContent = document.createElement('div');
                cardContent.style.cssText = 'padding: 20px;';
                cardContent.innerHTML = 
                    '<h3 style="font-size: 20px; margin-bottom: 10px; color: var(--text-primary);">' + listing.name + '</h3>' +
                    '<div style="display: flex; gap: 8px; margin-bottom: 10px;">' +
                    '<span class="badge-type ' + getIconClass(listing.type, listing) + '" data-type="' + listing.type + '" onclick="filterByBadge(event, \'type\', \'' + listing.type + '\')">' + listing.type + '</span>' +
                    '<span class="badge-area" data-area="' + listing.area + '" onclick="filterByBadge(event, \'area\', \'' + listing.area + '\')">' + listing.area + '</span>' +
                    '</div>' +
                    '<p style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">' + listing.description.substring(0, 100) + '...</p>';
                
                front.appendChild(cardContent);
                
                const back = document.createElement('div');
                back.className = 'flip-card-back';
                
                // Build images HTML
                let imagesHTML = '<div class="flip-back-images">';
                imagesHTML += '<img src="' + listing.image1 + '" class="flip-back-image" />';
                if (listing.image2) {
                    imagesHTML += '<img src="' + listing.image2 + '" class="flip-back-image" />';
                }
                if (listing.image3) {
                    imagesHTML += '<img src="' + listing.image3 + '" class="flip-back-image" />';
                }
                imagesHTML += '</div>';
                
                // Build amenities HTML if they exist
                let amenitiesHTML = '';
                if (listing.amenities && listing.amenities.length > 0) {
                    amenitiesHTML = 
                        '<div class="flip-tags-container">' +
                        '<div class="flip-tags-title">Amenities</div>' +
                        '<div class="flip-tags-list">' +
                        listing.amenities.map(function(amenity) {
                            return '<span class="badge-type" style="font-size: 10px; padding: 3px 8px;">' + amenity + '</span>';
                        }).join('') +
                        '</div>' +
                        '</div>';
                }
                
                back.innerHTML = 
                    '<button class="flip-close-btn" onclick="event.stopPropagation(); this.closest(\'.flip-card\').classList.remove(\'flipped\'); document.getElementById(\'flipOverlay\').classList.remove(\'active\'); document.body.style.overflow = \'\';">&times;</button>' +
                    imagesHTML +
                    '<h3 style="font-size: 22px; margin-bottom: 12px; color: var(--text-primary);">' + listing.name + '</h3>' +
                    '<div style="display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap;">' +
                    '<span class="badge-type ' + getIconClass(listing.type, listing) + '">' + listing.type + '</span>' +
                    '<span class="badge-area">' + listing.area + '</span>' +
                    (listing.featured ? '<span class="badge-featured">Featured</span>' : '') +
                    '</div>' +
                    // Use detailedDescription if available, otherwise fall back to description
                    '<p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 15px; line-height: 1.6; white-space: pre-wrap;">' + (listing.detailedDescription && listing.detailedDescription.trim() ? listing.detailedDescription : listing.description) + '</p>' +
                    amenitiesHTML +
                    // Address with icon
                    '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(listing.address) + '" target="_blank" class="card-info-item" style="text-decoration: none; cursor: pointer;" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text" style="color: var(--text-secondary);">' + listing.address + '</div>' +
                    '</a>' +
                    // Phone with icon
                    (listing.phone ? 
                    '<a href="tel:' + listing.phone.replace(/[^0-9+]/g, '') + '" class="card-info-item" style="text-decoration: none; cursor: pointer;" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text" style="color: var(--text-secondary);">' + listing.phone + '</div>' +
                    '</a>' : '') +
                    // Website with icon
                    (listing.website ? 
                    '<a href="' + listing.website + '" target="_blank" class="card-info-item" style="text-decoration: none; cursor: pointer;" onclick="event.stopPropagation();">' +
                    '<div class="card-info-icon">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />' +
                    '</svg>' +
                    '</div>' +
                    '<div class="card-info-text" style="color: var(--text-secondary);">' + listing.website + '</div>' +
                    '</a>' : '') +
                    // Directions button (use directionsLink if available, otherwise generate Google Maps URL)
                    '<div style="margin-top: auto; padding-top: 15px;">' +
                    '<a href="' + (listing.directionsLink && listing.directionsLink.trim() ? listing.directionsLink : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(listing.address)) + '" target="_blank" style="width: 100%; background: #E3795C; color: white; padding: 12px; text-align: center; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="event.stopPropagation();">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />' +
                    '</svg>' +
                    'Open Map' +
                    '</a>' +
                    '</div>';
                
                inner.appendChild(front);
                inner.appendChild(back);
                card.appendChild(inner);
                grid.appendChild(card);
            });
        }
        
        let currentTypeFilter = '';
        
        function closeAllFlippedCards() {
            document.querySelectorAll('.flip-card.flipped').forEach(function(card) {
                card.classList.remove('flipped');
            });
            document.getElementById('flipOverlay').classList.remove('active');
            document.body.style.overflow = '';
        }
        
        function filterByBadge(event, filterType, value) {
            event.stopPropagation(); // Prevent card flip
            
            if (filterType === 'type') {
                currentTypeFilter = value;
                
                // Update button active states
                document.querySelectorAll('#previewTab .type-filter-btn').forEach(function(btn) {
                    btn.classList.remove('active');
                    if (btn.dataset.type === value) {
                        btn.classList.add('active');
                    }
                });
            } else if (filterType === 'area') {
                document.getElementById('previewAreaFilter').value = value;
            }
            
            filterPreview();
        }
        
        function filterPreview() {
            const searchTerm = document.getElementById('previewSearchInput').value.toLowerCase().trim();
            const areaFilter = document.getElementById('previewAreaFilter').value;
            const amenityFilter = document.getElementById('previewAmenityFilter').value;
            
            const filtered = data.listings.filter(function(listing) {
                // Search text
                const searchableText = [
                    listing.name,
                    listing.slug,
                    listing.type,
                    listing.area,
                    listing.description,
                    listing.detailedDescription,
                    listing.amenities.join(' ')
                ].join(' ').toLowerCase();
                
                const matchesSearch = !searchTerm || searchableText.indexOf(searchTerm) > -1;
                const matchesType = !currentTypeFilter || listing.type === currentTypeFilter;
                const matchesArea = !areaFilter || listing.area === areaFilter;
                const matchesAmenity = !amenityFilter || listing.amenities.indexOf(amenityFilter) > -1;
                
                return matchesSearch && matchesType && matchesArea && matchesAmenity;
            });
            
            renderPreview(filtered);
        }
        
        function clearPreviewFilters() {
            document.getElementById('previewSearchInput').value = '';
            document.getElementById('previewAreaFilter').value = '';
            document.getElementById('previewAmenityFilter').value = '';
            currentTypeFilter = '';
            
            // Reset quick filter buttons
            document.querySelectorAll('.type-filter-btn').forEach(function(btn) {
                btn.classList.remove('active');
                if (btn.dataset.type === '') {
                    btn.classList.add('active');
                }
            });
            
            renderPreview();
        }
        
        function renderDataTable() {
            const tbody = document.getElementById('dataTableBody');
            tbody.innerHTML = '';
            
            // Sort listings by name (A-Z) before rendering
            const sortedListings = data.listings.slice().sort(function(a, b) {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                return aName.localeCompare(bName);
            });
            
            sortedListings.forEach(function(listing, originalIndex) {
                // Find the original index in the unsorted array for data manipulation
                const index = data.listings.indexOf(listing);
                const safe = (value) => (value === undefined || value === null) ? '' : value;
                const safeArray = (value) => Array.isArray(value) ? value : [];
                
                const row = document.createElement('tr');
                row.setAttribute('data-index', index);
                
                // Build category dropdown options
                const categoryOptions = '<option value="">Auto-assign from Type</option>' +
                    Object.keys(TYPE_CATEGORIES).map(function(categoryKey) {
                        const category = TYPE_CATEGORIES[categoryKey];
                        const isSelected = safe(listing.category) === categoryKey;
                        return '<option value="' + categoryKey + '" ' + (isSelected ? 'selected' : '') + '>' + category.emoji + ' ' + category.name + '</option>';
                    }).join('');
                
                // Debug: Log accordion data for first listing when rendering table
                if (index === 0 && listing.name && !window._tableAccordionDebugLogged) {
                    console.log('🎯 renderDataTable - First listing accordion data:', listing.name);
                    console.log('   accordionPanel1Title:', listing.accordionPanel1Title?.substring(0, 50) || '(empty)');
                    console.log('   accordionPanel1Content:', listing.accordionPanel1Content?.substring(0, 50) || '(empty)');
                    console.log('   All accordion keys in listing:', Object.keys(listing).filter(k => k.includes('accordion')));
                    window._tableAccordionDebugLogged = true;
                }
                
                row.innerHTML = 
                    '<td class="cell-id"><input type="text" value="' + safe(listing.id) + '" data-field="id" /></td>' +
                    '<td class="cell-name"><input type="text" value="' + safe(listing.name) + '" data-field="name" /></td>' +
                    '<td class="cell-slug"><input type="text" value="' + safe(listing.slug) + '" data-field="slug" placeholder="auto" /></td>' +
                    '<td class="cell-type"><select data-field="type">' +
                        data.filterOptions.types.map(function(t) { return '<option value="' + t + '" ' + (safe(listing.type) === t ? 'selected' : '') + '>' + t + '</option>'; }).join('') +
                    '</select></td>' +
                    '<td class="cell-category"><select data-field="category">' + categoryOptions + '</select></td>' +
                    '<td class="cell-area"><select data-field="area">' +
                        data.filterOptions.areas.map(function(a) { return '<option value="' + a + '" ' + (safe(listing.area) === a ? 'selected' : '') + '>' + a + '</option>'; }).join('') +
                    '</select></td>' +
                    '<td class="cell-description"><textarea data-field="description">' + safe(listing.description) + '</textarea></td>' +
                    '<td class="cell-description-detailed" style="display: none;"><textarea data-field="detailedDescription">' + safe(listing.detailedDescription || '') + '</textarea></td>' +
                    '<td class="cell-customHtml"><textarea data-field="customHtml">' + safe(listing.customHtml || '') + '</textarea></td>' +
                    '<td class="cell-image"><input type="text" value="' + safe(listing.image1) + '" data-field="image1" placeholder="Image URL or base64" /></td>' +
                    '<td class="cell-image-desc"><input type="text" value="' + safe(listing.image1Desc || '') + '" data-field="image1Desc" placeholder="Image 1 Description" /></td>' +
                    '<td class="cell-image-fileid"><input type="text" value="' + safe(listing.image1FileId || '') + '" data-field="image1FileId" placeholder="Image 1 File ID" /></td>' +
                    '<td class="cell-image"><input type="text" value="' + safe(listing.image2) + '" data-field="image2" placeholder="Image URL or base64" /></td>' +
                    '<td class="cell-image-desc"><input type="text" value="' + safe(listing.image2Desc || '') + '" data-field="image2Desc" placeholder="Image 2 Description" /></td>' +
                    '<td class="cell-image-fileid"><input type="text" value="' + safe(listing.image2FileId || '') + '" data-field="image2FileId" placeholder="Image 2 File ID" /></td>' +
                    '<td class="cell-image"><input type="text" value="' + safe(listing.image3) + '" data-field="image3" placeholder="Image URL or base64" /></td>' +
                    '<td class="cell-image-desc"><input type="text" value="' + safe(listing.image3Desc || '') + '" data-field="image3Desc" placeholder="Image 3 Description" /></td>' +
                    '<td class="cell-image-fileid"><input type="text" value="' + safe(listing.image3FileId || '') + '" data-field="image3FileId" placeholder="Image 3 File ID" /></td>' +
                    '<td class="cell-website"><input type="url" value="' + safe(listing.website) + '" data-field="website" /></td>' +
                    '<td class="cell-phone"><input type="tel" value="' + safe(listing.phone) + '" data-field="phone" /></td>' +
                    '<td class="cell-address"><input type="text" value="' + safe(listing.address) + '" data-field="address" /></td>' +
                    '<td class="cell-author"><input type="text" value="' + safe(listing.authorName) + '" data-field="authorName" placeholder="Author name" /></td>' +
                    '<td class="cell-date"><input type="date" value="' + safe(listing.publishedDate) + '" data-field="publishedDate" /></td>' +
                    '<td class="cell-date"><input type="date" value="' + safe(listing.modifiedDate) + '" data-field="modifiedDate" /></td>' +
                    '<td class="cell-directions"><input type="url" value="' + safe(listing.directionsLink) + '" data-field="directionsLink" placeholder="https://..." /></td>' +
                    '<td class="cell-amenities"><textarea data-field="amenities">' + safeArray(listing.amenities).join(', ') + '</textarea></td>' +
                    '<td class="cell-featured"><input type="checkbox" ' + (listing.featured ? 'checked' : '') + ' data-field="featured" /></td>' +
                    '<td class="cell-googlemaps"><input type="url" value="' + safe(listing.googleMapsUrl || '') + '" data-field="googleMapsUrl" placeholder="Google Maps URL" /></td>' +
                    '<td class="cell-accordion-title"><input type="text" value="' + safe(listing.accordionPanel1Title || '') + '" data-field="accordionPanel1Title" placeholder="Panel 1 Title" /></td>' +
                    '<td class="cell-accordion-content"><textarea data-field="accordionPanel1Content" placeholder="Panel 1 Content">' + safe(listing.accordionPanel1Content || '') + '</textarea></td>' +
                    '<td class="cell-accordion-title"><input type="text" value="' + safe(listing.accordionPanel2Title || '') + '" data-field="accordionPanel2Title" placeholder="Panel 2 Title" /></td>' +
                    '<td class="cell-accordion-content"><textarea data-field="accordionPanel2Content" placeholder="Panel 2 Content">' + safe(listing.accordionPanel2Content || '') + '</textarea></td>' +
                    '<td class="cell-accordion-title"><input type="text" value="' + safe(listing.accordionPanel3Title || '') + '" data-field="accordionPanel3Title" placeholder="Panel 3 Title" /></td>' +
                    '<td class="cell-accordion-content"><textarea data-field="accordionPanel3Content" placeholder="Panel 3 Content">' + safe(listing.accordionPanel3Content || '') + '</textarea></td>' +
                    '<td class="cell-accordion-title"><input type="text" value="' + safe(listing.accordionPanel4Title || '') + '" data-field="accordionPanel4Title" placeholder="Panel 4 Title" /></td>' +
                    '<td class="cell-accordion-content"><textarea data-field="accordionPanel4Content" placeholder="Panel 4 Content">' + safe(listing.accordionPanel4Content || '') + '</textarea></td>' +
                    '<td class="cell-actions">' +
                        '<button class="btn-table-delete" onclick="deleteFromTable(' + index + ')" style="background: ' + (deleteConfirmId === listing.id ? '#dc2626' : '#E3795C') + ';">' +
                        (deleteConfirmId === listing.id ? 'Confirm?' : 'Delete') +
                        '</button>' +
                    '</td>';
                tbody.appendChild(row);
            });
        }
        
        function saveTableChanges() {
            const rows = Array.from(document.querySelectorAll('#dataTableBody tr'));
            let changeCount = 0;
            
            rows.forEach(function(row) {
                const index = parseInt(row.getAttribute('data-index'));
                const listing = data.listings[index];
                
                // Get all input fields
                const inputs = row.querySelectorAll('[data-field]');
                inputs.forEach(function(input) {
                    const field = input.getAttribute('data-field');
                    let newValue;
                    
                    if (input.type === 'checkbox') {
                        newValue = input.checked;
                    } else if (field === 'amenities') {
                        // Convert comma-separated string to array
                        newValue = input.value.split(',').map(function(a) { return a.trim(); }).filter(function(a) { return a.length > 0; });
                    } else if (field === 'category') {
                        // Handle category: empty string means no override (undefined), otherwise use the value
                        newValue = input.value.trim() || undefined;
                    } else {
                        newValue = input.value;
                    }
                    
                    // Compare arrays properly for amenities
                    if (field === 'amenities') {
                        if (JSON.stringify(listing[field]) !== JSON.stringify(newValue)) {
                            listing[field] = newValue;
                            changeCount++;
                        }
                    } else if (field === 'category') {
                        // Compare category properly (handle undefined vs empty string)
                        const currentCategory = listing[field] || undefined;
                        const newCategory = newValue || undefined;
                        if (currentCategory !== newCategory) {
                            listing[field] = newCategory;
                            changeCount++;
                        }
                    } else if (listing[field] !== newValue) {
                        listing[field] = newValue;
                        if (field === 'directionsLink') {
                            listing.googleMapsUrl = newValue;
                        }
                        changeCount++;
                    }
                });
            });
            
            // Update all views
            applyFilterOptionCleanup();
            renderListings();
            
            // Changes saved locally only - user must click "Save All to Google Sheets" to sync
            if (changeCount > 0) {
                alert('Table updated! ' + changeCount + ' field(s) changed locally.\n\n💾 Click "Save All to Google Sheets" to sync changes.');
            } else {
                alert('No changes detected.');
            }
        }
        
        function deleteFromTable(index) {
            const listing = data.listings[index];
            
            // Check if this is the confirmation click
            if (deleteConfirmId === listing.id) {
                // Confirmed - delete it
                data.listings.splice(index, 1);
                deleteConfirmId = null;
                if (deleteConfirmTimeout) clearTimeout(deleteConfirmTimeout);
                
                applyFilterOptionCleanup();
                renderDataTable();
                renderListings();
                
                alert('Deleted: ' + listing.name);
            } else {
                // First click - set confirmation needed
                deleteConfirmId = listing.id;
                
                // Clear any existing timeout
                if (deleteConfirmTimeout) clearTimeout(deleteConfirmTimeout);
                
                // Re-render to update button text
                renderDataTable();
                
                // Reset after 3 seconds
                deleteConfirmTimeout = setTimeout(function() {
                    deleteConfirmId = null;
                    renderDataTable();
                }, 3000);
            }
        }
        
        window.downloadCSV = function downloadCSV() {
            try {
                const escapeCsv = function(value) {
                    const str = value === undefined || value === null ? '' : String(value);
                    if (str === '') return '';
                    return '"' + str.replace(/"/g, '""') + '"';
                };
                
                const joinList = function(arr) {
                    if (!arr || !arr.length) return '';
                    return arr.join('; ');
                };
                
                const headers = [
                    'id', 'name', 'slug', 'type', 'category', 'area', 'description',
                    'customHtml',
                    'image1', 'image1Desc', 'image1FileId',
                    'image2', 'image2Desc', 'image2FileId',
                    'image3', 'image3Desc', 'image3FileId',
                    'website', 'phone', 'address',
                    'authorName', 'publishedDate', 'modifiedDate', 'directionsLink',
                    'amenities', 'featured', 'googleMapsUrl',
                    'accordionPanel1Title', 'accordionPanel1Content',
                    'accordionPanel2Title', 'accordionPanel2Content',
                    'accordionPanel3Title', 'accordionPanel3Content',
                    'accordionPanel4Title', 'accordionPanel4Content'
                ];
                
                const rows = data.listings.map(function(listing) {
                    return [
                        listing.id || '',
                        escapeCsv(listing.name || ''),
                        escapeCsv(listing.slug || ''),
                        listing.type || '',
                        listing.category || '', // Category field
                        listing.area || '',
                        escapeCsv(listing.description || ''),
                        escapeCsv(listing.detailedDescription || ''),
                        escapeCsv(listing.customHtml || ''),
                        escapeCsv(listing.image1 || ''),
                        escapeCsv(listing.image1Desc || ''),
                        escapeCsv(listing.image1FileId || ''),
                        escapeCsv(listing.image2 || ''),
                        escapeCsv(listing.image2Desc || ''),
                        escapeCsv(listing.image2FileId || ''),
                        escapeCsv(listing.image3 || ''),
                        escapeCsv(listing.image3Desc || ''),
                        escapeCsv(listing.image3FileId || ''),
                        listing.website || '',
                        listing.phone || '',
                        escapeCsv(listing.address || ''),
                        listing.authorName || '',
                        listing.publishedDate || '',
                        listing.modifiedDate || '',
                        listing.directionsLink || '',
                        escapeCsv(joinList(listing.amenities || [])),
                        listing.featured ? 'true' : 'false',
                        listing.googleMapsUrl || listing.directionsLink || '',
                        escapeCsv(listing.accordionPanel1Title || ''),
                        escapeCsv(listing.accordionPanel1Content || ''),
                        escapeCsv(listing.accordionPanel2Title || ''),
                        escapeCsv(listing.accordionPanel2Content || ''),
                        escapeCsv(listing.accordionPanel3Title || ''),
                        escapeCsv(listing.accordionPanel3Content || ''),
                        escapeCsv(listing.accordionPanel4Title || ''),
                        escapeCsv(listing.accordionPanel4Content || '')
                    ].join(',');
                });
                
                const csv = [headers.join(',')].concat(rows).join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'listings-' + new Date().toISOString().split('T')[0] + '.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // Update status AFTER download completes
                // Use setTimeout to ensure download has started
                setTimeout(() => {
                    updateSyncStatus(true, '✅ CSV backup downloaded');
                }, 100);
            } catch (error) {
                console.error('Error downloading CSV:', error);
                updateSyncStatus(false, '❌ CSV download failed');
                alert('Error downloading CSV: ' + error.message);
            }
        }
        
        function handleCSVUpload(event) {
            try {
                console.log('CSV upload started');
                const file = event.target.files[0];
                if (!file) {
                    console.log('No file selected');
                    return;
                }
                
                console.log('Reading file:', file.name);
                const reader = new FileReader();
                
                reader.onerror = function(error) {
                    console.error('File read error:', error);
                    alert('Error reading file: ' + error);
                };
                
                reader.onload = function(e) {
                    try {
                        console.log('File loaded, parsing CSV with header mapping...');
                        const text = e.target.result;
                        const parsed = parseCSV(text);
                        
                        if (!parsed || !parsed.headers || parsed.headers.length === 0) {
                            alert('CSV file is missing a header row. Please include column names in the first row of the CSV.');
                            return;
                        }
                        
                        console.log('Detected headers:', parsed.headers);
                        
                        const newListings = parsed.dataRows
                            .map(function(row, index) {
                                const listing = mapCSVRowToListing(row);
                                if (!listing.name && !listing.id) {
                                    console.warn('Skipping row', index + 2, '- missing required name/id field', row);
                                    return null;
                                }
                                return listing;
                            })
                            .filter(Boolean);
                        
                        console.log('Parsed listings:', newListings.length);
                        
                        if (newListings.length === 0) {
                            alert('No valid listings found in CSV file. Please verify the column names match the expected headers (e.g., "name", "type", "area").');
                            return;
                        }
                        
                        const confirmed = confirm('Upload CSV with ' + newListings.length + ' listings?\n\n' +
                                                '⚠️ This will replace all current listings with the CSV data.\n\n' +
                                                'Click OK to upload CSV and replace all current listings\n' +
                                                'Click Cancel to keep current listings unchanged');
                        if (confirmed) {
                            const existingFilterOptions = (data && data.filterOptions) ? data.filterOptions : (initialData.filterOptions || { types: [], areas: [], amenities: [] });
                            const sanitizedFilterOptions = sanitizeFilterOptions(existingFilterOptions, newListings);
                            
                            if (!data) {
                                data = { listings: [], filterOptions: { types: [], areas: [], amenities: [] } };
                            }
                            
                            data.listings = newListings.map(function(listing) {
                                return sanitizeListing(listing);
                            });
                            data.filterOptions = sanitizedFilterOptions;
                            
                            applyFilterOptionCleanup(sanitizedFilterOptions);
                            renderDataTable();
                            renderListings();
                            updateStats();
                            
                            // CSV imported locally only - user must click "Save All to Google Sheets" to sync
                            alert('CSV uploaded successfully! ' + newListings.length + ' listings imported locally.\n\n💾 Click "Save All to Google Sheets" to sync changes.');
                        }
                        
                        // Reset file input
                        event.target.value = '';
                        
                    } catch (parseError) {
                        console.error('Error parsing CSV:', parseError);
                        alert('Error parsing CSV file: ' + parseError.message);
                    }
                };
                
                reader.readAsText(file);
                
            } catch (error) {
                console.error('Error in handleCSVUpload:', error);
                alert('Error uploading CSV: ' + error.message);
            }
        }
        
        window.addEventListener("DOMContentLoaded", async function() {
            // Small delay to ensure everything is ready (especially important when script is external)
            await new Promise(resolve => setTimeout(resolve, 100));
            await loadDataFromGoogleSheets();
            
            // Diagnostic: Check which types don't have categories assigned
            checkUnassignedTypes();
            
            const nameInput = document.getElementById('listingName');
            const slugInput = document.getElementById('listingSlug');
            if (nameInput && slugInput) {
                const updateManualFlag = () => {
                    const autoSlug = slugify(nameInput.value);
                    slugInput.dataset.manual = (slugInput.value && slugInput.value !== autoSlug) ? 'true' : 'false';
                };
                
                const maybeAutoUpdateSlug = () => {
                    if (slugInput.dataset.manual !== 'true') {
                        slugInput.value = slugify(nameInput.value);
                    }
                    updateManualFlag();
                };
                
                updateManualFlag();
                
                nameInput.addEventListener('input', maybeAutoUpdateSlug);
                slugInput.addEventListener('input', updateManualFlag);
                slugInput.addEventListener('blur', () => {
                    if (!slugInput.value) {
                        slugInput.dataset.manual = 'false';
                        slugInput.value = slugify(nameInput.value);
                    }
                });
            }
            
            // Initialize form dropdowns with dynamic options
            updateTypeDropdown();
            updateAreaDropdown();
            renderAmenitiesCheckboxes();
            renderListings();
            updateStats();
            populateAdminFilters();
            populatePreviewFilters();
            initImageUploadButtons();
            
            // Add event listeners to quick filter buttons in admin tab
            // Skip category buttons (they have data-category attribute) - they have their own handlers
            document.querySelectorAll('#adminTab .type-filter-btn:not([data-category])').forEach(function(btn) {
                // Only handle buttons without data-category (like "All Types" button)
                // Category buttons are handled by their own onclick handlers set in renderAdminTypeFilterButtons
                
                // Remove any existing onclick handlers to avoid conflicts
                btn.onclick = null;
                
                btn.addEventListener('click', function() {
                    // Check if this is the "All Types" button
                    if (this.dataset.type === '' && !this.dataset.category) {
                        filterAdminByType('');
                    } else {
                        // Legacy individual type button (shouldn't exist with category system)
                        const type = this.dataset.type || '';
                        filterAdminByType(type);
                    }
                });
            });
        });
        
        // ===========================================
        // GITHUB INTEGRATION FUNCTIONS
        // ===========================================
        async function saveToGitHub() {
            const token = document.getElementById('githubToken').value.trim();
            const username = document.getElementById('githubUsername').value.trim();
            const repo = document.getElementById('githubRepo').value.trim();
            const path = document.getElementById('githubPath').value.trim();
            const statusDiv = document.getElementById('githubStatus');
            
            // Validation
            if (!token) {
                statusDiv.textContent = '❌ Please enter your GitHub token';
                statusDiv.style.color = '#dc3545';
                return;
            }
            if (!username || !repo || !path) {
                statusDiv.textContent = '❌ Please fill in all fields';
                statusDiv.style.color = '#dc3545';
                return;
            }
            
            try {
                statusDiv.textContent = '⏳ Saving to GitHub...';
                statusDiv.style.color = '#ffc107';
                
                // Get your data object (this already exists in your admin panel)
                const jsonData = data;
                
                // Convert to base64 (required by GitHub API)
                let content;
                try {
                    content = btoa(JSON.stringify(jsonData, null, 2));
                } catch (e) {
                    // If btoa fails due to special characters, use UTF-8 encoding
                    const jsonString = JSON.stringify(jsonData, null, 2);
                    content = btoa(unescape(encodeURIComponent(jsonString)));
                }
                
                // Check if file exists to get SHA (required for updates)
                const getUrl = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
                let sha = null;
                
                try {
                    const getRes = await fetch(getUrl, {
                        headers: { 
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (getRes.ok) {
                        const fileData = await getRes.json();
                        sha = fileData.sha;
                    }
                } catch (e) {
                    console.log('File does not exist yet, will create new file');
                }
                
                // Commit the file
                const commitMessage = `Update from admin panel - ${new Date().toISOString()}`;
                const putRes = await fetch(getUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        message: commitMessage,
                        content: content,
                        sha: sha
                    })
                });
                
                if (putRes.ok) {
                    const result = await putRes.json();
                    statusDiv.textContent = '✅ Successfully saved to GitHub!';
                    statusDiv.style.color = '#28a745';
                    
                    // Save config to localStorage so user doesn't have to re-enter
                    localStorage.setItem('github_username', username);
                    localStorage.setItem('github_repo', repo);
                    localStorage.setItem('github_path', path);
                    
                    console.log('File saved at:', result.content.html_url);
                } else {
                    const error = await putRes.json();
                    console.error('GitHub API Error:', error);
                    statusDiv.textContent = `❌ Error: ${error.message}`;
                    statusDiv.style.color = '#dc3545';
                }
                
            } catch (error) {
                console.error('Save to GitHub error:', error);
                statusDiv.textContent = `❌ Error: ${error.message}`;
                statusDiv.style.color = '#dc3545';
            }
        }
        
        function downloadJSON() {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'adventure-directory-data-' + new Date().toISOString().split('T')[0] + '.json';
            link.click();
            URL.revokeObjectURL(url);
            
            const statusDiv = document.getElementById('githubStatus');
            if (statusDiv) {
                statusDiv.textContent = '✅ JSON file downloaded!';
                statusDiv.style.color = '#28a745';
                setTimeout(() => { statusDiv.textContent = ''; }, 3000);
            }
        }
        
        // Load saved GitHub config from localStorage on page load
        document.addEventListener('DOMContentLoaded', function() {
            const savedUsername = localStorage.getItem('github_username');
            const savedRepo = localStorage.getItem('github_repo');
            const savedPath = localStorage.getItem('github_path');
            
            if (savedUsername) document.getElementById('githubUsername').value = savedUsername;
            if (savedRepo) document.getElementById('githubRepo').value = savedRepo;
            if (savedPath) document.getElementById('githubPath').value = savedPath;
        });
        
        // ===========================================        // EMAIL OTP AUTHENTICATION
        // ===========================================
        // 🔧 TESTING: Set to false to disable email OTP temporarily
        // Set to true to re-enable authentication
        const ENABLE_EMAIL_OTP = true; // 👈 Change to false to skip login
        
        // 🔐 CONFIGURATION: Authorized emails for OTP authentication
        // SECURITY NOTE: For better security, move this list to your Google Apps Script
        // and fetch it via an API call instead of storing it in the client code.
        const AUTHORIZED_EMAILS = [
            'ernest@oddplusevenstudio.com',
            'ernest@oddpluseven.com',
            'adam@oddpluseven.com',
            'rj@oddpluseven.com',
            'bniemeyer@nelsoncounty.org',
            'makelley@nelsoncounty.org',
            'esther@oddpluseven.com',
            // Add more authorized emails here (one per line, comma-separated)
            // Example: 'admin@example.com',
            // Example: 'user@example.com',
            // Example: 'team-member@example.com',
        ];
        
        // OTP Configuration
        const OTP_CONFIG = {
            length: 6,              // 6-digit OTP code
            expirationMinutes: 10,  // OTP expires after 10 minutes
            maxAttempts: 5,         // Max failed attempts before lockout
            rateLimitRequests: 3,   // Max OTP requests per 15 minutes
            rateLimitWindow: 15 * 60 * 1000 // 15 minutes in milliseconds
        };
        
        // SERVER-SIDE OTP: All OTP generation, storage, and validation happens on the server
        // Client-side functions below just communicate with the server
        
        // SERVER-SIDE OTP: Request OTP from server (no client-side generation)
        async function sendOTP(email) {
            try {
                // Client-side check first (quick rejection, but server validates too)
                if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
                    return {
                        success: false,
                        error: 'This email is not authorized to access the admin panel.'
                    };
                }
                
                // Request OTP from server (server generates, stores, and sends it)
                const params = new URLSearchParams({
                    action: 'sendOTP',
                    email: email
                });
                
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL + '?' + params.toString(), {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    throw new Error('Response not OK: ' + response.status);
                }
                
                const responseText = await response.text();
                const result = responseText ? JSON.parse(responseText) : { success: false, error: 'No response from server' };
                
                // Server handles all validation - just return the result
                return result;
            } catch (error) {
                console.error('Error sending OTP:', error);
                return {
                    success: false,
                    error: 'Network error. Please check your connection and try again.'
                };
            }
        }
        
        // SERVER-SIDE OTP: Verify OTP with server and get session token
        async function verifyOTP(email, code) {
            try {
                const params = new URLSearchParams({
                    action: 'verifyOTP',
                    email: email,
                    code: code
                });
                
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL + '?' + params.toString(), {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    throw new Error('Response not OK: ' + response.status);
                }
                
                const responseText = await response.text();
                const result = responseText ? JSON.parse(responseText) : { success: false, error: 'No response from server' };
                
                return result;
            } catch (error) {
                console.error('Error verifying OTP:', error);
                return {
                    success: false,
                    error: 'Network error. Please check your connection and try again.'
                };
            }
        }
        
        // Validate session token with server
        async function validateSessionWithServer(token) {
            try {
                const params = new URLSearchParams({
                    action: 'validateSession',
                    token: token
                });
                
                const response = await fetch(GOOGLE_APPS_SCRIPT_URL + '?' + params.toString(), {
                    method: 'GET',
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    return { valid: false, error: 'Session validation failed' };
                }
                
                const responseText = await response.text();
                const result = responseText ? JSON.parse(responseText) : { valid: false, error: 'No response from server' };
                
                return result;
            } catch (error) {
                console.error('Error validating session:', error);
                return { valid: false, error: 'Network error' };
            }
        }
        
        // Initialize email OTP login form
        function initializeEmailOTP() {
            console.log('✅ Email OTP authentication initialized');
            
            // Hide loading message if it exists
            const loadingMessage = document.getElementById('loadingMessage');
            if (loadingMessage) {
                loadingMessage.style.display = 'none';
            }
        }
        
        // Handle email submission and OTP sending
        window.handleEmailSubmit = async function handleEmailSubmit() {
            const emailInput = document.getElementById('emailInput');
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            const emailForm = document.getElementById('emailForm');
            const otpForm = document.getElementById('otpForm');
            
            if (!emailInput || !emailInput.value) {
                errorText.textContent = 'Please enter your email address.';
                errorDiv.style.display = 'block';
                return;
            }
            
            const email = emailInput.value.trim().toLowerCase();
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errorText.textContent = 'Please enter a valid email address.';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Hide error
            errorDiv.style.display = 'none';
            
            // Show loading state
            const submitBtn = emailForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending code...';
            
            try {
                const result = await sendOTP(email);
                
                if (result.success) {
                    // Hide email form, show OTP form
                    emailForm.style.display = 'none';
                    otpForm.style.display = 'block';
                    
                    // Set email in OTP form
                    const emailDisplay = document.getElementById('emailDisplay');
                    if (emailDisplay) {
                        emailDisplay.textContent = email;
                    }
                    
                    // Store email for verification
                    otpForm.dataset.email = email;
                    
                    // Focus OTP input
                    const otpInput = document.getElementById('otpInput');
                    if (otpInput) {
                        otpInput.focus();
                    }
                    
                    // Show success message
                    errorText.textContent = `Verification code sent to ${email}`;
                    errorText.style.color = '#22c55e';
                    errorDiv.style.display = 'block';
                    
                    // Reset button
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                } else {
                    errorText.textContent = result.error || 'Failed to send verification code.';
                    errorText.style.color = '#dc3545';
                    errorDiv.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } catch (error) {
                console.error('Error sending OTP:', error);
                errorText.textContent = 'An error occurred. Please try again.';
                errorText.style.color = '#dc3545';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        };
        
        // Handle OTP verification
        window.handleOTPSubmit = async function handleOTPSubmit() {
            const otpInput = document.getElementById('otpInput');
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            const otpForm = document.getElementById('otpForm');
            
            if (!otpInput || !otpInput.value) {
                errorText.textContent = 'Please enter the verification code.';
                errorText.style.color = '#dc3545';
                errorDiv.style.display = 'block';
                return;
            }
            
            const code = otpInput.value.trim();
            const email = otpForm.dataset.email;
            
            if (!email) {
                errorText.textContent = 'Session expired. Please start over.';
                errorText.style.color = '#dc3545';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Hide error
            errorDiv.style.display = 'none';
            
            // Show loading state
            const submitBtn = otpForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
            
            try {
                // Verify OTP with server (returns session token if successful)
                const result = await verifyOTP(email, code);
                
                if (result.success && result.sessionToken) {
                    // Success - store SERVER-GENERATED session token
                    const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
                    const sessionData = {
                        email: email,
                        name: email.split('@')[0],
                        token: result.sessionToken, // Server-generated token
                        expires: Date.now() + SESSION_EXPIRATION_MS
                    };
                    localStorage.setItem('adminAuthSession', JSON.stringify(sessionData));
                    
                    // Also store in sessionStorage for backward compatibility
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminEmail', email);
                    sessionStorage.setItem('adminName', email.split('@')[0]);
                    
                    // Success - hide login overlay
                    const overlay = document.getElementById('loginOverlay');
                    overlay.style.display = 'none';
                    
                    // Show success message briefly
                    const overlayContent = overlay.querySelector('.login-container');
                    overlayContent.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <div style="color: #22c55e; font-size: 48px; margin-bottom: 20px;">✓</div>
                            <h2 style="color: #4E6B52; margin: 0 0 10px 0;">Welcome!</h2>
                            <p style="color: #6c757d; margin: 0;">Loading admin panel...</p>
                        </div>
                    `;
                    
                    setTimeout(() => {
                        overlay.style.display = 'none';
                    }, 1000);
                } else {
                    errorText.textContent = result.error || 'Invalid verification code.';
                    errorText.style.color = '#dc3545';
                    errorDiv.style.display = 'block';
                    
                    // Clear OTP input
                    otpInput.value = '';
                    otpInput.focus();
                    
                    // Shake animation
                    const overlay = document.getElementById('loginOverlay');
                    overlay.style.animation = 'shake 0.5s';
                    setTimeout(() => { overlay.style.animation = ''; }, 500);
                    
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            } catch (error) {
                console.error('Error verifying OTP:', error);
                errorText.textContent = 'An error occurred. Please try again.';
                errorText.style.color = '#dc3545';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        };
        
        // Resend OTP code
        window.resendOTP = async function resendOTP() {
            const otpForm = document.getElementById('otpForm');
            const email = otpForm.dataset.email;
            
            if (!email) {
                alert('Session expired. Please start over.');
                return;
            }
            
            const result = await sendOTP(email);
            
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            
            if (result.success) {
                errorText.textContent = `New verification code sent to ${email}`;
                errorText.style.color = '#22c55e';
                errorDiv.style.display = 'block';
            } else {
                errorText.textContent = result.error || 'Failed to resend code.';
                errorText.style.color = '#dc3545';
                errorDiv.style.display = 'block';
            }
        };
        
        // Check if user is already logged in
        // Run immediately and also on load to catch any timing issues
        async function checkAuthStatus() {
            // 🔧 TESTING: Skip authentication if disabled
            if (!ENABLE_EMAIL_OTP) {
                console.log('⚠️ Email OTP disabled for testing - skipping login');
                // Set flag in localStorage for immediate hiding on next page load
                localStorage.setItem('skipAuth', 'true');
                const overlay = document.getElementById('loginOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
                document.body.classList.add('logged-in');
                return; // Skip all auth checks
            }
            
            // Auth is enabled - ALWAYS clear skipAuth flag and any old auth data
            localStorage.removeItem('skipAuth');
            localStorage.removeItem('adminLoggedIn');
            
            // Helper to get persistent session with SERVER VALIDATION
            // Note: validateSessionWithServer must be accessible (defined at top level)
            async function getAuthSession() {
                try {
                    const sessionData = localStorage.getItem('adminAuthSession');
                    if (!sessionData) {
                        return null;
                    }
                    
                    const session = JSON.parse(sessionData);
                    
                    // Check if expired (client-side check first)
                    if (Date.now() > session.expires) {
                        localStorage.removeItem('adminAuthSession');
                        return null;
                    }
                    
                    // CRITICAL: Validate session token with server (non-blocking)
                    if (session.token && typeof validateSessionWithServer === 'function') {
                        try {
                            const validation = await validateSessionWithServer(session.token);
                            if (!validation.valid) {
                                // Server says token is invalid - clear it
                                localStorage.removeItem('adminAuthSession');
                                sessionStorage.clear();
                                return null;
                            }
                            // Server validated - update email from server response
                            session.email = validation.email || session.email;
                        } catch (validationError) {
                            // Network error - allow session through but log error
                            console.warn('Session validation failed (network error), allowing session:', validationError);
                            // Don't clear session on network error - allow through
                        }
                    } else if (!session.token) {
                        // Old session without token - invalidate it
                        localStorage.removeItem('adminAuthSession');
                        return null;
                    }
                    
                    return session;
                } catch (e) {
                    console.error('Error in getAuthSession:', e);
                    localStorage.removeItem('adminAuthSession');
                    return null;
                }
            }
            
            // Check for persistent session (SERVER-VALIDATED)
            // Use await since checkAuthStatus is async
            let session = null;
            let persistentEmail = null;
            let persistentLoggedIn = false;
            
            try {
                session = await getAuthSession();
                persistentEmail = session ? session.email : null;
                persistentLoggedIn = session !== null;
            } catch (e) {
                console.error('Error getting auth session:', e);
                session = null;
                persistentEmail = null;
                persistentLoggedIn = false;
            }
            
            // Also check sessionStorage for backward compatibility
            const sessionStorageLoggedIn = sessionStorage.getItem('adminLoggedIn');
            const sessionStorageEmail = sessionStorage.getItem('adminEmail');
            
            // Use server-validated session if available, otherwise fallback to sessionStorage
            // This handles cases where server validation fails due to network issues
            let isLoggedIn = persistentLoggedIn;
            let adminEmail = persistentEmail;
            
            // Fallback to sessionStorage if server validation failed but sessionStorage exists
            if (!isLoggedIn && sessionStorageLoggedIn === 'true' && sessionStorageEmail) {
                console.log('⚠️ Server validation failed, but sessionStorage has session - using it');
                isLoggedIn = true;
                adminEmail = sessionStorageEmail;
            }
            
            // If logged in but no email (old session), force logout
            if ((sessionStorageLoggedIn === 'true' || persistentLoggedIn) && !adminEmail) {
                console.log('Detected old session. Forcing logout for email OTP.');
                sessionStorage.clear();
                localStorage.removeItem('adminAuthSession');
                // Fall through to show login
            }
            
            // Check if properly logged in with valid session
            const overlay = document.getElementById('loginOverlay');
            
            // Check if email is authorized
            const isAuthorized = adminEmail && AUTHORIZED_EMAILS.includes(adminEmail.toLowerCase());
            
            console.log('🔍 admin.js checkAuthStatus:', {
                isLoggedIn: isLoggedIn,
                adminEmail: adminEmail,
                isAuthorized: isAuthorized,
                authorizedEmails: AUTHORIZED_EMAILS
            });
            
            if (isLoggedIn && adminEmail && isAuthorized) {
                // Valid session - hide login overlay
                console.log('✅ admin.js: Valid session found for:', adminEmail);
                console.log('✅ admin.js: Hiding login overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                    overlay.setAttribute('style', 'display: none !important;');
                    console.log('✅ admin.js: Login overlay hidden (with !important)');
                } else {
                    console.error('❌ admin.js: Login overlay element not found!');
                }
                document.body.classList.add('logged-in');
                console.log('✅ admin.js: Added logged-in class to body');
                
                // Ensure sessionStorage is also set for backward compatibility
                if (!sessionStorageLoggedIn) {
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminEmail', adminEmail);
                    sessionStorage.setItem('adminName', adminEmail.split('@')[0]);
                }
                
                // Show admin content
                const header = document.querySelector('.header');
                const tabs = document.querySelector('.tabs');
                if (header) {
                    header.style.display = '';
                    console.log('✅ Header shown');
                }
                if (tabs) {
                    tabs.style.display = '';
                    console.log('✅ Tabs shown');
                }
            } else {
                // Not logged in - show login overlay and initialize
                console.log('🔒 No valid session - showing login overlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }
                document.body.classList.remove('logged-in');
                
                // Clear any stale session data
                sessionStorage.clear();
                localStorage.removeItem('adminAuthSession');
                
                // Initialize email OTP when page loads
                // Wait a bit for the page to fully render
                setTimeout(function() {
                    initializeEmailOTP();
                }, 500);
            }
        }
        
        // Run check immediately (in case DOM is already ready)
        // Run checkAuthStatus (async function)
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', function() {
                checkAuthStatus();
            });
        } else {
            checkAuthStatus();
        }
        
        // Also run on full page load as backup
        window.addEventListener('load', function() {
            checkAuthStatus();
        });
        
        // Test and diagnostic functions
        function testGoogleSignIn() {
            console.log('🧪 Testing Google Sign-In configuration...');
            const origin = window.location.origin;
            const clientId = GOOGLE_OAUTH_CLIENT_ID;
            
            console.log('📍 Current origin:', origin);
            console.log('🔑 Client ID:', clientId);
            console.log('🌐 Google script loaded:', typeof google !== 'undefined' ? '✅ Yes' : '❌ No');
            
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: clientId,
                        callback: function(response) {
                            console.log('✅ Test successful! Got credential response');
                            alert('✅ Test successful! Google Sign-In is working.\n\nIf you see this, your configuration is correct!');
                        },
                        auto_select: false
                    });
                    
                    // Try to render a test button
                    const testDiv = document.createElement('div');
                    document.body.appendChild(testDiv);
                    
                    google.accounts.id.renderButton(testDiv, {
                        theme: 'filled_blue',
                        size: 'large',
                        text: 'signin_with'
                    });
                    
                    console.log('✅ Test button rendered - configuration is correct!');
                    alert('✅ Test successful! Google Sign-In button rendered.\n\nYour configuration is working correctly!\n\nIf you still don\'t see the button on the login screen, wait 1-2 minutes for Google\'s servers to update.');
                    
                    // Remove test button
                    setTimeout(() => testDiv.remove(), 5000);
                } catch (error) {
                    console.error('❌ Test failed:', error);
                    alert('❌ Test failed: ' + error.message + '\n\nThis usually means:\n1. Your domain isn\'t authorized yet (wait 1-5 minutes)\n2. Or there\'s a configuration issue\n\nCheck the console for details.');
                }
            } else {
                alert('❌ Google Identity Services script not loaded.\n\nCheck:\n1. Your internet connection\n2. Browser console for errors\n3. That the script tag is in the HTML');
            }
        }
        
        function checkOAuthConfig() {
            const origin = window.location.origin;
            const clientId = GOOGLE_OAUTH_CLIENT_ID;
            
            const config = {
                origin: origin,
                clientId: clientId,
                googleLoaded: typeof google !== 'undefined',
                buttonContainer: document.getElementById('googleSignInContainer') ? 'exists' : 'missing',
                authorizedEmails: AUTHORIZED_EMAILS.length
            };
            
            console.log('📋 OAuth Configuration Check:', config);
            
            let message = '📋 OAuth Configuration:\n\n';
            message += `Domain: ${origin}\n`;
            message += `Client ID: ${clientId.substring(0, 20)}...\n`;
            message += `Google Script: ${config.googleLoaded ? '✅ Loaded' : '❌ Not loaded'}\n`;
            message += `Button Container: ${config.buttonContainer}\n`;
            message += `Authorized Emails: ${config.authorizedEmails}\n\n`;
            
            if (config.googleLoaded) {
                message += '✅ Google script is loaded\n';
            } else {
                message += '❌ Google script not loaded - check internet connection\n';
            }
            
            message += `\nMake sure "${origin}" is added to Google Cloud Console → Authorized JavaScript origins`;
            
            alert(message);
            console.log('Full config:', config);
        }
        
        // Update diagnostic info on load
        function updateDiagnostics() {
            const diagSection = document.getElementById('diagnosticSection');
            if (diagSection) {
                document.getElementById('diagOrigin').textContent = window.location.origin;
                document.getElementById('diagClientId').textContent = GOOGLE_OAUTH_CLIENT_ID.substring(0, 30) + '...';
                document.getElementById('diagGoogleLoaded').textContent = typeof google !== 'undefined' ? '✅ Yes' : '❌ No';
                document.getElementById('diagContainer').textContent = document.getElementById('googleSignInContainer') ? '✅ Found' : '❌ Missing';
                
                const status = typeof google !== 'undefined' && document.getElementById('googleSignInContainer') ? '✅ Ready' : '⏳ Waiting...';
                document.getElementById('diagStatus').textContent = status;
                
                // Show diagnostic section
                diagSection.style.display = 'block';
            }
        }
        
        // Logout function
        window.logout = function logout() {
            // Clear all session data
            sessionStorage.clear();
            
            // Clear all localStorage auth data
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('skipAuth');
            
            // Remove logged-in class from body
            document.body.classList.remove('logged-in');
            
            // Show login overlay
            const overlay = document.getElementById('loginOverlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
            
            // Reload page to show login screen
            location.reload();
        }
        
        // Ensure all functions are available immediately
        console.log('✅ admin.js loaded successfully');
        console.log('✅ Functions available:', {
            reloadFromSheets: typeof window.reloadFromSheets,
            saveAllToSheets: typeof window.saveAllToSheets,
            downloadCSV: typeof window.downloadCSV,
            openAddModal: typeof window.openAddModal,
            logout: typeof window.logout,
            switchTab: typeof window.switchTab,
            filterAdminByType: typeof window.filterAdminByType,
            closeModal: typeof window.closeModal
        });