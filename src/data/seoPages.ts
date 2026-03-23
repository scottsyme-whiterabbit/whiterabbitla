export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoPage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  location: string;
  serviceType: string;
  heroHeadline: string;
  heroSubheadline: string;
  introParagraph: string;
  bodyParagraphs: string[];
  /** Optional city-specific paragraphs that replace the generic template body when provided */
  citySpecificContent?: string[];
  midCtaText: string;
  ctaText: string;
  socialProof: string;
  socialProofAttribution: string;
  faqs: FaqItem[];
}

const locations = [
  "Los Angeles",
  "Beverly Hills",
  "Hollywood",
  "Santa Monica",
  "Malibu",
  "West Hollywood",
  "Bel Air",
  "Pasadena",
  "Orange County",
  "San Diego",
  "Las Vegas",
  "Calabasas",
  "Miami",
  "New York",
  "Austin",
  "Chicago",
  "Dallas",
  "San Francisco",
  "Scottsdale",
  "Nashville",
  "Aspen",
  "Houston",
  "Seattle",
  "Denver",
  "Atlanta",
  "Boston",
  "Washington DC",
  "Philadelphia",
  "Portland",
  "Napa Valley",
  "Palm Springs",
  "The Hamptons",
  "Greenwich",
  "Park City",
  "Hillsborough",
  "San Mateo",
  "Burlingame",
  "Atherton",
  "Palo Alto",
  "Woodside",
  "Los Altos",
  "Menlo Park",
  "Saratoga",
  "Los Gatos",
  "Tiburon",
  "Mill Valley",
  "Palm Beach",
  "Naples",
  "Montecito",
  "Newport Beach",
  "Coronado",
  "Nantucket",
  "Martha's Vineyard",
  "Jupiter",
  "Sarasota",
  "Vail",
  "Jackson Hole",
  "Sun Valley",
  "Lake Tahoe",
  "Telluride",
  "Coral Gables",
  "Highland Park",
  "River Oaks",
  "Buckhead",
  "Winnetka",
  "Short Hills",
  "Potomac",
  "Paradise Valley",
  "Sonoma",
  "Carmel-by-the-Sea",
  "Santa Barbara",
  "Pacific Palisades",
  "Brentwood",
  "Manhattan Beach",
  "Laguna Beach",
  "Downtown LA",
  "Studio City",
  "Encino",
  "Long Beach",
  "Burbank",
  "Westlake Village",
  "Thousand Oaks",
  "Rancho Palos Verdes",
  "Silver Lake",
  "Los Feliz",
  "San Antonio",
  "Fort Worth",
  "Charleston",
  "Minneapolis",
] as const;

// Market tiers determine which service types are generated per location
// Tier 1: LA-area (all 15 services) — home market, full coverage
const tier1Markets = new Set([
  "Los Angeles", "Beverly Hills", "Hollywood", "Santa Monica", "Malibu",
  "West Hollywood", "Bel Air", "Pasadena", "Calabasas", "Pacific Palisades",
  "Brentwood", "Manhattan Beach", "Downtown LA", "Studio City", "Burbank",
  "Long Beach", "Silver Lake", "Los Feliz", "Encino", "Westlake Village",
  "Thousand Oaks", "Rancho Palos Verdes", "Laguna Beach", "Orange County",
]);

// Tier 2: Major metros + affluent enclaves (top 8 services)
const tier2Markets = new Set([
  "San Diego", "Las Vegas", "Miami", "New York", "Austin", "Chicago",
  "Dallas", "San Francisco", "Scottsdale", "Nashville", "Houston",
  "Seattle", "Denver", "Atlanta", "Boston", "Washington DC", "Philadelphia",
  "Palm Springs", "Santa Barbara", "Montecito", "Newport Beach",
  "Napa Valley", "The Hamptons", "Aspen", "Park City", "Palm Beach",
  "Coral Gables", "Highland Park", "River Oaks", "Buckhead", "Portland",
  "Coronado", "Fort Worth", "San Antonio", "Charleston", "Minneapolis",
]);

// Tier 2 gets these service types
const tier2ServiceKeys = new Set([
  "corporate-event-magician", "private-party-magician", "wedding-magician",
  "close-up-magician", "private-magic-show", "holiday-party-magician",
  "charity-gala-magician", "golf-tournament-magician",
]);

// Tier 3 (all remaining markets) gets only the top 5
const tier3ServiceKeys = new Set([
  "corporate-event-magician", "private-party-magician", "wedding-magician",
  "close-up-magician", "private-magic-show",
]);

const premiereLocations = new Set([
  "Los Angeles", "Beverly Hills", "Hollywood", "Santa Monica", "Malibu",
  "West Hollywood", "Bel Air", "Pasadena", "Calabasas", "Pacific Palisades",
  "Brentwood", "Manhattan Beach", "Downtown LA", "Studio City", "Burbank",
  "Long Beach", "Silver Lake", "Los Feliz",
]);

function shouldGeneratePage(location: string, serviceKey: string): boolean {
  if (serviceKey === "premiere-red-carpet-magician") return premiereLocations.has(location);
  if (tier1Markets.has(location)) return true;
  if (tier2Markets.has(location)) return tier2ServiceKeys.has(serviceKey);
  return tier3ServiceKeys.has(serviceKey);
}

// Region assignments for content variation
type Region = "socal" | "norcal" | "centralcal" | "southwest" | "mountain" | "texas" | "southeast" | "florida" | "northeast" | "midwest" | "pnw";

const locationRegion: Record<string, Region> = {
  "Los Angeles": "socal", "Beverly Hills": "socal", "Hollywood": "socal", "Santa Monica": "socal",
  "Malibu": "socal", "West Hollywood": "socal", "Bel Air": "socal", "Pasadena": "socal",
  "Orange County": "socal", "San Diego": "socal", "Calabasas": "socal",
  "Pacific Palisades": "socal", "Brentwood": "socal", "Manhattan Beach": "socal",
  "Laguna Beach": "socal", "Downtown LA": "socal", "Studio City": "socal", "Encino": "socal",
  "Long Beach": "socal", "Burbank": "socal", "Westlake Village": "socal",
  "Thousand Oaks": "socal", "Rancho Palos Verdes": "socal", "Silver Lake": "socal",
  "Los Feliz": "socal", "Newport Beach": "socal", "Coronado": "socal",
  "San Francisco": "norcal", "Hillsborough": "norcal", "San Mateo": "norcal",
  "Burlingame": "norcal", "Atherton": "norcal", "Palo Alto": "norcal", "Woodside": "norcal",
  "Los Altos": "norcal", "Menlo Park": "norcal", "Saratoga": "norcal", "Los Gatos": "norcal",
  "Tiburon": "norcal", "Mill Valley": "norcal", "Napa Valley": "norcal", "Sonoma": "norcal",
  "Carmel-by-the-Sea": "norcal", "Lake Tahoe": "norcal",
  "Santa Barbara": "centralcal", "Montecito": "centralcal", "Palm Springs": "centralcal",
  "Las Vegas": "southwest", "Scottsdale": "southwest", "Paradise Valley": "southwest",
  "Aspen": "mountain", "Vail": "mountain", "Park City": "mountain", "Jackson Hole": "mountain",
  "Sun Valley": "mountain", "Telluride": "mountain", "Denver": "mountain",
  "Dallas": "texas", "Highland Park": "texas", "Houston": "texas", "River Oaks": "texas",
  "Austin": "texas", "Fort Worth": "texas", "San Antonio": "texas",
  "Atlanta": "southeast", "Buckhead": "southeast", "Nashville": "southeast", "Charleston": "southeast",
  "Miami": "florida", "Coral Gables": "florida", "Palm Beach": "florida", "Naples": "florida",
  "Jupiter": "florida", "Sarasota": "florida",
  "New York": "northeast", "The Hamptons": "northeast", "Greenwich": "northeast",
  "Nantucket": "northeast", "Martha's Vineyard": "northeast", "Short Hills": "northeast",
  "Boston": "northeast", "Washington DC": "northeast", "Potomac": "northeast",
  "Philadelphia": "northeast", "Winnetka": "midwest",
  "Chicago": "midwest", "Minneapolis": "midwest",
  "Seattle": "pnw", "Portland": "pnw",
};

// Region-specific content hooks that get woven into body text for uniqueness
const regionHooks: Record<Region, { eventCulture: string; travelNote: string; audienceStyle: string }> = {
  socal: {
    eventCulture: "In a city where world-class entertainment is the baseline expectation, your guests have seen it all — studio premieres, private screenings, exclusive launches. That's what makes White Rabbit different: the magic is intimate, personal, and impossible to fake a reaction to, even for the most jaded LA audience.",
    travelNote: "Based right here in Los Angeles, Scott is available throughout Southern California with zero travel coordination needed.",
    audienceStyle: "Southern California audiences appreciate sophistication without pretension — effortless cool backed by genuine craft.",
  },
  norcal: {
    eventCulture: "Northern California's culture of innovation means your guests are analytical, curious, and hard to impress with surface-level entertainment. White Rabbit thrives in exactly this environment — Scott's mentalism and psychological magic challenge the sharpest minds in the room, and the reactions from tech executives who 'know there must be an explanation' are the most rewarding moments of any performance.",
    travelNote: "Scott travels regularly from Los Angeles to the Bay Area and Northern California wine country. Travel coordination is handled seamlessly.",
    audienceStyle: "Bay Area audiences bring an intellectual curiosity that makes the mentalism and mind-reading portions of the performance especially electric.",
  },
  centralcal: {
    eventCulture: "The Central Coast's blend of old-money elegance and relaxed sophistication creates the perfect atmosphere for White Rabbit. Events here prioritize quality over flash, and the magic matches — intimate, refined, and calibrated for guests who value substance.",
    travelNote: "Just a short trip from LA, Scott regularly performs at venues throughout Santa Barbara, Montecito, and Palm Springs.",
    audienceStyle: "Central Coast audiences appreciate understated excellence — the kind of entertainment that feels effortless because every detail has been carefully considered.",
  },
  southwest: {
    eventCulture: "The Southwest's resort culture creates events where guests expect a premium experience from arrival to departure. White Rabbit fills the entertainment gap that most resort events miss — the personal, interactive moments between cocktails and dinner that transform a nice evening into an unforgettable one.",
    travelNote: "Scott frequently performs throughout Arizona and Nevada, with seamless travel coordination from Los Angeles.",
    audienceStyle: "Desert audiences bring a relaxed warmth that makes the interactive elements of close-up magic feel like a conversation between friends — guests lean in rather than sit back.",
  },
  mountain: {
    eventCulture: "Mountain resort events carry a specific energy: guests have traveled to be there, the setting is extraordinary, and there's an expectation that every element of the experience matches the surroundings. White Rabbit delivers entertainment worthy of the destination — intimate, personal, and as memorable as the scenery.",
    travelNote: "Scott travels nationally for select engagements and has performed at events throughout the Mountain West resort communities.",
    audienceStyle: "Resort audiences are already in an elevated mood — away from daily routines, open to new experiences, and primed for the kind of wonder that close-up magic delivers.",
  },
  texas: {
    eventCulture: "Texas hospitality sets a high bar: events are generous, guests are warm, and entertainment is expected to deliver. White Rabbit meets that standard with world-class magic that matches the scale of Texas celebrations while keeping the intimate, personal touch that makes every guest feel like the most important person in the room.",
    travelNote: "Scott regularly performs across Texas, with direct flights from Los Angeles to all major markets. Travel coordination is completely seamless.",
    audienceStyle: "Texas audiences are generous with their enthusiasm — they lean in, they react big, and they make every performance feel like a hometown show.",
  },
  southeast: {
    eventCulture: "Southern events run on charm, hospitality, and the understanding that how you make people feel matters more than anything on the agenda. White Rabbit fits perfectly into this tradition — Scott's magic creates the kind of genuine, personal moments that Southern hosts value most.",
    travelNote: "Scott travels from Los Angeles for select engagements throughout the Southeast, with seamless coordination for destination events.",
    audienceStyle: "Southern audiences appreciate storytelling and personal connection — the conversational style of White Rabbit's close-up magic resonates deeply with guests who value authenticity.",
  },
  florida: {
    eventCulture: "Florida's year-round event culture and international clientele demand entertainment that transcends language and cultural barriers. Close-up magic is universal — the gasps, the laughter, the wide-eyed amazement translate instantly whether your guests are from Palm Beach or São Paulo.",
    travelNote: "Scott frequently travels to Florida for private events, corporate galas, and destination celebrations. Travel logistics are handled completely.",
    audienceStyle: "Florida audiences bring a cosmopolitan energy — worldly, well-traveled, and delighted when they encounter something genuinely new.",
  },
  northeast: {
    eventCulture: "The Northeast's events carry a specific sophistication: guests are discerning, attention spans are earned, and quality is assumed rather than advertised. White Rabbit thrives in exactly this environment — Scott's craft-level magic and sharp mentalism earn respect from the most discerning audiences in the country.",
    travelNote: "Scott regularly travels to the Northeast corridor for private and corporate events. Direct flights from Los Angeles make coordination seamless.",
    audienceStyle: "Northeastern audiences bring a healthy skepticism that makes the impossible moments land even harder — when a New York audience gasps, you know you've earned it.",
  },
  midwest: {
    eventCulture: "Midwest events balance warmth with high standards. Guests are generous, welcoming, and genuinely engaged — they don't need to be convinced to have a good time, but they absolutely know the difference between good entertainment and great entertainment. White Rabbit delivers the latter.",
    travelNote: "Scott travels from Los Angeles to serve clients throughout the Midwest, with direct flights to all major markets.",
    audienceStyle: "Midwest audiences are the most rewarding to perform for — genuinely warm, fully present, and unafraid to show amazement.",
  },
  pnw: {
    eventCulture: "The Pacific Northwest's creative, independent culture means your guests value authenticity over spectacle. White Rabbit's close-up magic is exactly that — no elaborate stage setups, no flashy productions, just genuine artistry performed inches from your guests' hands.",
    travelNote: "Scott regularly travels to Seattle and Portland from Los Angeles. Short direct flights make coordination easy.",
    audienceStyle: "Pacific Northwest audiences bring an artistic sensibility and appreciation for craft that elevates every performance — they notice the details, and the details are where White Rabbit shines.",
  },
};

// Curated luxury venue references per location for authentic local SEO
const locationVenues: Record<string, { dining: string[]; hotels: string[]; culture: string[] }> = {
  "Los Angeles": {
    dining: ["Hillstone", "Bestia", "Catch LA"],
    hotels: ["The West Hollywood EDITION", "Shutters on the Beach", "The Beverly Hilton"],
    culture: ["The Getty Center", "Chateau Marmont", "LACMA"],
  },
  "Beverly Hills": {
    dining: ["Spago", "Matsuhisa", "The Polo Lounge at The Beverly Hills Hotel"],
    hotels: ["The Peninsula Beverly Hills", "Waldorf Astoria Beverly Hills", "Montage Beverly Hills"],
    culture: ["Rodeo Drive", "Kith Beverly Hills", "The Maybourne"],
  },
  "Hollywood": {
    dining: ["Musso & Frank Grill", "Mama Shelter", "Mother Wolf"],
    hotels: ["The Hollywood Roosevelt", "1 Hotel West Hollywood", "Sunset Tower Hotel"],
    culture: ["The Fonda Theatre", "Hollywood Bowl", "NeueHouse Hollywood"],
  },
  "Santa Monica": {
    dining: ["Giorgio Baldi", "Elephante", "Hillstone Santa Monica"],
    hotels: ["Shutters on the Beach", "Casa del Mar", "The Shore Hotel"],
    culture: ["Santa Monica Proper", "Palisades Village", "Margo Leavin Gallery"],
  },
  "Malibu": {
    dining: ["Nobu Malibu", "Soho House Malibu", "Taverna Tony"],
    hotels: ["The Surfrider Malibu", "Calamigos Guest Ranch", "Malibu Beach Inn"],
    culture: ["Malibu Country Mart", "The Getty Villa", "Point Dume"],
  },
  "West Hollywood": {
    dining: ["Craig's", "Catch LA", "Cecconi's"],
    hotels: ["The West Hollywood EDITION", "Sunset Tower Hotel", "Pendry West Hollywood"],
    culture: ["Melrose Place", "The Sunset Strip", "Pacific Design Center"],
  },
  "Bel Air": {
    dining: ["Wolfgang Puck at Hotel Bel-Air", "Bel-Air Bar & Grill", "Katsuya Brentwood"],
    hotels: ["Hotel Bel-Air", "The Bel-Air Bay Club", "W Los Angeles"],
    culture: ["The Getty Center", "Bel-Air Country Club", "Stone Canyon"],
  },
  "Pasadena": {
    dining: ["The Raymond", "Café Beaujolais", "Union Restaurant"],
    hotels: ["The Langham Huntington", "Hotel Constance", "Pasadena Hotel & Pool"],
    culture: ["The Norton Simon Museum", "Old Town Pasadena", "The Gamble House"],
  },
  "Orange County": {
    dining: ["Selanne Steak Tavern", "Marché Moderne", "The Beachcomber at Crystal Cove"],
    hotels: ["Montage Laguna Beach", "The Resort at Pelican Hill", "Waldorf Astoria Monarch Beach"],
    culture: ["Fashion Island", "South Coast Plaza", "Laguna Beach art galleries"],
  },
  "San Diego": {
    dining: ["Juniper & Ivy", "Born & Raised", "Addison"],
    hotels: ["The Lodge at Torrey Pines", "Hotel del Coronado", "Pendry San Diego"],
    culture: ["The Gaslamp Quarter", "La Jolla Cove", "Balboa Park"],
  },
  "Las Vegas": {
    dining: ["Carbone", "Catch Las Vegas", "Nobu at Caesars Palace"],
    hotels: ["Bellagio", "The Wynn", "Encore at Wynn"],
    culture: ["The ARIA Fine Art Collection", "The Venetian", "Resorts World"],
  },
  "Calabasas": {
    dining: ["Sagebrush Cantina", "Toscanova", "The Six Chow House"],
    hotels: ["The Anza", "Calabasas Inn", "Four Seasons Westlake Village"],
    culture: ["The Commons at Calabasas", "Malibu Creek State Park", "King Gillette Ranch"],
  },
  "Miami": {
    dining: ["Carbone Miami", "Major Food Group's ZZ's", "Papi Steak"],
    hotels: ["Faena Hotel", "The Setai", "Four Seasons Surf Club"],
    culture: ["Design District", "Wynwood Walls", "Pérez Art Museum"],
  },
  "New York": {
    dining: ["Le Bernardin", "Eleven Madison Park", "Carbone"],
    hotels: ["The Mark", "Aman New York", "The Carlyle"],
    culture: ["The Met", "MoMA", "The Standard High Line"],
  },
  "Austin": {
    dining: ["Uchi", "Emmer & Rye", "Lenoir"],
    hotels: ["Hotel Saint Cecilia", "The Line Austin", "Commodore Perry Estate"],
    culture: ["South Congress", "The Contemporary Austin", "Rainey Street"],
  },
  "Chicago": {
    dining: ["Alinea", "Girl & The Goat", "RPM Italian"],
    hotels: ["The Peninsula Chicago", "Soho House Chicago", "The Langham"],
    culture: ["The Art Institute", "Millennium Park", "The Chicago Riverwalk"],
  },
  "Dallas": {
    dining: ["Nobu Dallas", "Flora Street Café", "Town Hearth"],
    hotels: ["The Joule", "The Ritz-Carlton Dallas", "Hotel Crescent Court"],
    culture: ["The Dallas Arts District", "Highland Park Village", "The Nasher Sculpture Center"],
  },
  "San Francisco": {
    dining: ["Quince", "Lazy Bear", "Cotogna"],
    hotels: ["The St. Regis San Francisco", "Proper Hotel", "The Ritz-Carlton"],
    culture: ["SFMOMA", "The Presidio", "Pacific Heights"],
  },
  "Scottsdale": {
    dining: ["Steak 44", "Café Monarch", "Talavera at Four Seasons"],
    hotels: ["The Phoenician", "Andaz Scottsdale", "Four Seasons Scottsdale"],
    culture: ["Old Town Scottsdale", "Scottsdale Museum of Contemporary Art", "Camelback Mountain"],
  },
  "Nashville": {
    dining: ["Catbird Seat", "The 404 Kitchen", "Husk Nashville"],
    hotels: ["The Hermitage Hotel", "1 Hotel Nashville", "Noelle Nashville"],
    culture: ["The Gulch", "12South", "The Frist Art Museum"],
  },
  "Aspen": {
    dining: ["Matsuhisa Aspen", "Element 47", "Betula Aspen"],
    hotels: ["The Little Nell", "The St. Regis Aspen", "Hotel Jerome"],
    culture: ["Aspen Art Museum", "Wagner Park", "Aspen Mountain"],
  },
  "Houston": {
    dining: ["March", "Underbelly Hospitality", "Le Jardinier"],
    hotels: ["Hotel Granduca", "La Colombe d'Or", "The Post Oak Hotel"],
    culture: ["The Museum District", "River Oaks", "The Menil Collection"],
  },
  "Seattle": {
    dining: ["Canlis", "The Walrus and the Carpenter", "Bateau"],
    hotels: ["The Edgewater", "Hotel Sorrento", "Thompson Seattle"],
    culture: ["Pike Place Market", "Chihuly Garden and Glass", "Capitol Hill"],
  },
  "Denver": {
    dining: ["Frasca Food and Wine", "Beckon", "Guard and Grace"],
    hotels: ["The Crawford Hotel", "Halcyon", "The Ramble Hotel"],
    culture: ["Larimer Square", "Denver Art Museum", "RiNo Art District"],
  },
  "Atlanta": {
    dining: ["Bacchanalia", "Lazy Betty", "Staplehouse"],
    hotels: ["The St. Regis Atlanta", "Four Seasons Hotel Atlanta", "The Whitley"],
    culture: ["Buckhead", "The High Museum of Art", "Ponce City Market"],
  },
  "Boston": {
    dining: ["Menton", "O Ya", "No. 9 Park"],
    hotels: ["The Newbury Boston", "XV Beacon", "Four Seasons One Dalton"],
    culture: ["Beacon Hill", "The Isabella Stewart Gardner Museum", "Back Bay"],
  },
  "Washington DC": {
    dining: ["The Inn at Little Washington", "Minibar by José Andrés", "Fiola"],
    hotels: ["The Watergate Hotel", "Rosewood Washington DC", "The Hay-Adams"],
    culture: ["Georgetown", "The Smithsonian", "The Kennedy Center"],
  },
  "Philadelphia": {
    dining: ["Vetri Cucina", "Zahav", "Vernick Food & Drink"],
    hotels: ["The Rittenhouse Hotel", "Four Seasons Philadelphia", "Hotel Palomar"],
    culture: ["Rittenhouse Square", "The Philadelphia Museum of Art", "Old City"],
  },
  "Portland": {
    dining: ["Canard", "Langbaan", "Castagna"],
    hotels: ["Sentinel Hotel", "Hotel deLuxe", "The Woodlark"],
    culture: ["The Pearl District", "Portland Art Museum", "Alberta Arts District"],
  },
  "Napa Valley": {
    dining: ["The French Laundry", "Bottega", "Press"],
    hotels: ["Meadowood Napa Valley", "Calistoga Ranch", "Carneros Resort"],
    culture: ["Yountville", "The Hess Collection", "Napa Valley Wine Train"],
  },
  "Palm Springs": {
    dining: ["Workshop Kitchen + Bar", "Spencer's Restaurant", "Miro's"],
    hotels: ["The Parker Palm Springs", "L'Horizon Resort", "The Ritz-Carlton Rancho Mirage"],
    culture: ["Palm Canyon Drive", "Palm Springs Art Museum", "Sunnylands"],
  },
  "The Hamptons": {
    dining: ["Nick & Toni's", "Topping Rose House", "Almond"],
    hotels: ["Topping Rose House", "The Baker House", "Gurney's Montauk"],
    culture: ["Main Street Southampton", "Parrish Art Museum", "Montauk"],
  },
  "Greenwich": {
    dining: ["L'Escale", "The Ginger Man", "Elm Street Oyster House"],
    hotels: ["The Delamar", "J House Greenwich", "The Greenwich Hotel"],
    culture: ["Greenwich Avenue", "Bruce Museum", "Belle Haven"],
  },
  "Park City": {
    dining: ["Handle", "Riverhorse on Main", "Firewood"],
    hotels: ["Montage Deer Valley", "The St. Regis Deer Valley", "Waldorf Astoria Park City"],
    culture: ["Main Street Park City", "Sundance Film Festival", "Deer Valley Resort"],
  },
  "Hillsborough": {
    dining: ["Piacere", "Koi Palace", "Viognier at Draeger's"],
    hotels: ["The Westin San Francisco Airport", "San Francisco Airport Marriott Waterfront", "Hotel Marques de Riscal"],
    culture: ["Crystal Springs Golf Course", "Hillsborough Concours d'Elegance", "Sawyer Camp Trail"],
  },
  "San Mateo": {
    dining: ["Viognier", "All Spice", "Chez Shea"],
    hotels: ["San Mateo Marriott", "The Dylan Hotel", "Bay Landing Hotel"],
    culture: ["CuriOdyssey", "San Mateo Central Park", "Hillsdale Shopping Center"],
  },
  "Burlingame": {
    dining: ["Il Fornaio Burlingame", "Sapore Italiano", "Steelhead Brewing"],
    hotels: ["Hyatt Regency SFO", "The Waterfront Hotel", "Embassy Suites SFO"],
    culture: ["Burlingame Avenue", "Bayside Park", "Broadway Avenue"],
  },
  "Atherton": {
    dining: ["Village Pub", "Madera at Rosewood", "Selby's"],
    hotels: ["Rosewood Sand Hill", "Park James Hotel", "Four Seasons East Palo Alto"],
    culture: ["Holbrook-Palmer Park", "Menlo Circus Club", "Allied Arts Guild"],
  },
  "Palo Alto": {
    dining: ["Protégé", "Evvia Estiatorio", "Madera at Rosewood"],
    hotels: ["Nobu Hotel Palo Alto", "Four Seasons Hotel Silicon Valley", "Rosewood Sand Hill"],
    culture: ["Stanford University", "Palo Alto Art Center", "University Avenue"],
  },
  "Woodside": {
    dining: ["The Village Pub", "Buck's of Woodside", "The Alpine Inn"],
    hotels: ["Rosewood Sand Hill", "The Ritz-Carlton Half Moon Bay", "Costanoa"],
    culture: ["Filoli Historic House", "Wunderlich County Park", "The Mountain Winery"],
  },
  "Los Altos": {
    dining: ["Ambiance", "Chef Chu's", "Los Altos Grill"],
    hotels: ["Residence Inn Los Altos", "Shashi Hotel Mountain View", "AC Hotel San Jose"],
    culture: ["Los Altos History Museum", "Downtown Los Altos", "Rancho San Antonio"],
  },
  "Menlo Park": {
    dining: ["Madera at Rosewood", "Café Borrone", "Camper"],
    hotels: ["Rosewood Sand Hill", "Stanford Park Hotel", "Hotel Lucent"],
    culture: ["Allied Arts Guild", "Burgess Park", "Santa Cruz Avenue"],
  },
  "Saratoga": {
    dining: ["The Basin", "Plumed Horse", "La Fondue"],
    hotels: ["The Toll House Hotel", "Hotel Valencia Santana Row", "The Fairmont San Jose"],
    culture: ["The Mountain Winery", "Montalvo Arts Center", "Hakone Gardens"],
  },
  "Los Gatos": {
    dining: ["Manresa", "Nick's on Main", "Forbes Mill Steakhouse"],
    hotels: ["Hotel Los Gatos", "Toll House Hotel", "Nestldown"],
    culture: ["Los Gatos Creek Trail", "Testarossa Winery", "Downtown Los Gatos"],
  },
  "Tiburon": {
    dining: ["Sam's Anchor Café", "Servino Ristorante", "Luna Blu"],
    hotels: ["The Lodge at Tiburon", "Waters Edge Hotel", "Casa Madrona"],
    culture: ["Angel Island", "Tiburon Boardwalk", "Old St. Hilary's"],
  },
  "Mill Valley": {
    dining: ["Buckeye Roadhouse", "Sol Food", "Molina"],
    hotels: ["Mill Valley Inn", "Acqua Hotel", "Mountain Home Inn"],
    culture: ["Mill Valley Lumber Yard", "Muir Woods", "Sweetwater Music Hall"],
  },
  "Palm Beach": {
    dining: ["Café Boulud", "Buccan", "Renato's"],
    hotels: ["The Breakers", "Four Seasons Resort Palm Beach", "The Colony Hotel"],
    culture: ["Worth Avenue", "The Norton Museum of Art", "Mar-a-Lago Club"],
  },
  "Naples": {
    dining: ["The Bay House", "Barbatella", "USS Nemo"],
    hotels: ["The Ritz-Carlton Naples", "Inn on Fifth", "LaPlaya Beach & Golf Resort"],
    culture: ["Third Street South", "The Baker Museum", "Port Royal"],
  },
  "Montecito": {
    dining: ["Lucky's Steakhouse", "Tre Lune", "Oliver's"],
    hotels: ["Rosewood Miramar Beach", "San Ysidro Ranch", "Four Seasons Resort The Biltmore"],
    culture: ["Coast Village Road", "Lotusland", "Butterfly Beach"],
  },
  "Newport Beach": {
    dining: ["The Cannery", "Mastro's Ocean Club", "Fig & Olive"],
    hotels: ["Balboa Bay Resort", "The Resort at Pelican Hill", "Lido House"],
    culture: ["Balboa Island", "Fashion Island", "Crystal Cove State Park"],
  },
  "Coronado": {
    dining: ["1500 Ocean", "Stake Chophouse", "Coronado Boathouse"],
    hotels: ["Hotel del Coronado", "Loews Coronado Bay", "Glorietta Bay Inn"],
    culture: ["Coronado Ferry Landing", "Orange Avenue", "Silver Strand"],
  },
  "Nantucket": {
    dining: ["The Chanticleer", "Galley Beach", "Topper's at The Wauwinet"],
    hotels: ["The Wauwinet", "White Elephant", "Greydon House"],
    culture: ["Brant Point", "Nantucket Whaling Museum", "Cisco Brewers"],
  },
  "Martha's Vineyard": {
    dining: ["Atria", "The Red Cat Kitchen", "Beach Road"],
    hotels: ["Harbor View Hotel", "Winnetu Oceanside Resort", "Nobnocket Boutique Inn"],
    culture: ["Edgartown", "Menemsha Harbor", "Aquinnah Cliffs"],
  },
  "Jupiter": {
    dining: ["1000 North", "Guanabanas", "Cafe des Artistes"],
    hotels: ["Jupiter Beach Resort", "PGA National Resort", "Wyndham Grand Jupiter"],
    culture: ["Jupiter Inlet Lighthouse", "Blowing Rocks Preserve", "Jupiter Island"],
  },
  "Sarasota": {
    dining: ["Jack Dusty", "Indigenous", "Bijou Café"],
    hotels: ["The Ritz-Carlton Sarasota", "The Resort at Longboat Key Club", "Art Ovation Hotel"],
    culture: ["St. Armands Circle", "The Ringling Museum", "Longboat Key"],
  },
  "Vail": {
    dining: ["Sweet Basil", "Mountain Standard", "La Tour"],
    hotels: ["The Sebastian", "Four Seasons Resort Vail", "The Arrabelle at Vail Square"],
    culture: ["Vail Village", "Vail Mountain", "Gerald R. Ford Amphitheater"],
  },
  "Jackson Hole": {
    dining: ["The Kitchen", "Snake River Grill", "Café Genevieve"],
    hotels: ["Four Seasons Resort Jackson Hole", "Amangani", "Hotel Jackson"],
    culture: ["Jackson Town Square", "National Museum of Wildlife Art", "Grand Teton National Park"],
  },
  "Sun Valley": {
    dining: ["The Roundhouse", "Gretchen's", "Ketchum Grill"],
    hotels: ["Sun Valley Lodge", "Limelight Hotel Ketchum", "Knob Hill Inn"],
    culture: ["Ketchum", "Sun Valley Center for the Arts", "Bald Mountain"],
  },
  "Lake Tahoe": {
    dining: ["Lone Eagle Grille", "Wolfdale's", "Soule Domain"],
    hotels: ["The Ritz-Carlton Lake Tahoe", "Edgewood Tahoe", "Hyatt Regency Lake Tahoe"],
    culture: ["Emerald Bay", "Heavenly Village", "Squaw Valley"],
  },
  "Telluride": {
    dining: ["Allred's", "La Marmotte", "Chop House"],
    hotels: ["Madeline Hotel & Residences", "The Hotel Telluride", "Lumière Hotel"],
    culture: ["Telluride Film Festival", "Main Street Telluride", "Bear Creek Falls"],
  },
  "Coral Gables": {
    dining: ["Christy's", "Ortanique", "Bulla Gastrobar"],
    hotels: ["The Biltmore Hotel", "JW Marriott Miami Turnberry", "Hyatt Regency Coral Gables"],
    culture: ["Miracle Mile", "Venetian Pool", "Fairchild Tropical Botanic Garden"],
  },
  "Highland Park": {
    dining: ["Hillstone", "Al Biernat's", "Beverley's Bistro"],
    hotels: ["The Adolphus", "Hotel Crescent Court", "The Joule"],
    culture: ["Highland Park Village", "Turtle Creek", "Dallas Country Club"],
  },
  "River Oaks": {
    dining: ["Le Jardinier", "March", "Steak 48"],
    hotels: ["The Post Oak Hotel", "Hotel Granduca", "La Colombe d'Or"],
    culture: ["River Oaks Country Club", "The Menil Collection", "River Oaks District"],
  },
  "Buckhead": {
    dining: ["Bones", "Chops Lobster Bar", "Aria"],
    hotels: ["The St. Regis Atlanta", "Waldorf Astoria Atlanta Buckhead", "The Whitley"],
    culture: ["Buckhead Village District", "Atlanta History Center", "Chastain Park"],
  },
  "Winnetka": {
    dining: ["Mino's", "Avli", "Prairie Grass Café"],
    hotels: ["The Deer Path Inn", "Hotel Marques", "Renaissance North Shore"],
    culture: ["Winnetka Community House", "North Shore Country Club", "Green Bay Trail"],
  },
  "Short Hills": {
    dining: ["The Stirling Club", "Restaurant Serenade", "Terra"],
    hotels: ["The Hilton Short Hills", "The Grand Summit Hotel", "Hotel Indigo"],
    culture: ["The Mall at Short Hills", "Cora Hartshorn Arboretum", "Millburn Main Street"],
  },
  "Potomac": {
    dining: ["Old Angler's Inn", "Founding Farmers", "Passionfish"],
    hotels: ["Salamander Resort", "The Ritz-Carlton Tysons Corner", "The Inn at Perry Cabin"],
    culture: ["Congressional Country Club", "Great Falls", "Potomac Village"],
  },
  "Paradise Valley": {
    dining: ["Elements at Sanctuary", "LON's at The Hermosa", "Talavera"],
    hotels: ["Sanctuary on Camelback Mountain", "The Hermosa Inn", "Mountain Shadows"],
    culture: ["Camelback Mountain", "Paradise Valley Country Club", "Mummy Mountain"],
  },
  "Sonoma": {
    dining: ["The Girl & The Fig", "Café La Haye", "El Dorado Kitchen"],
    hotels: ["MacArthur Place", "Fairmont Sonoma Mission Inn", "The Lodge at Sonoma"],
    culture: ["Sonoma Plaza", "Buena Vista Winery", "The Barracks"],
  },
  "Carmel-by-the-Sea": {
    dining: ["Aubergine at L'Auberge Carmel", "Casanova", "La Bicyclette"],
    hotels: ["L'Auberge Carmel", "The Lodge at Pebble Beach", "Bernardus Lodge & Spa"],
    culture: ["Ocean Avenue", "Pebble Beach", "Point Lobos State Reserve"],
  },
  "Santa Barbara": {
    dining: ["The Lark", "Bouchon", "Yoichi's"],
    hotels: ["Belmond El Encanto", "The Ritz-Carlton Bacara", "Kimpton Canary Hotel"],
    culture: ["State Street", "Santa Barbara Museum of Art", "Stearns Wharf"],
  },
  "Pacific Palisades": {
    dining: ["Palisades Garden Café", "Draycott", "The Palisades Village"],
    hotels: ["The Bel-Air Bay Club", "Shutters on the Beach", "Hotel Casa del Mar"],
    culture: ["The Getty Villa", "Self-Realization Fellowship Lake Shrine", "Palisades Village"],
  },
  "Brentwood": {
    dining: ["Katsuya Brentwood", "Baltaire", "Farmshop"],
    hotels: ["Hotel Bel-Air", "W Los Angeles", "The Brentwood Inn"],
    culture: ["The Getty Center", "San Vicente Boulevard", "Brentwood Country Club"],
  },
  "Manhattan Beach": {
    dining: ["The Strand House", "Love & Salt", "MB Post"],
    hotels: ["Shade Hotel", "Manhattan Beach Marriott", "The Belamar Hotel"],
    culture: ["Manhattan Beach Pier", "The Strand", "Metlox Plaza"],
  },
  "Laguna Beach": {
    dining: ["The Cliff Restaurant", "Splashes at Surf & Sand", "Broadway by Amar Santana"],
    hotels: ["Montage Laguna Beach", "The Ranch at Laguna Beach", "Surf & Sand Resort"],
    culture: ["Laguna Art Museum", "Heisler Park", "Crystal Cove State Park"],
  },
  "Downtown LA": {
    dining: ["Otium", "Bestia", "71Above"],
    hotels: ["The NoMad Los Angeles", "Proper Hotel Downtown LA", "The Hoxton"],
    culture: ["The Broad", "Walt Disney Concert Hall", "Arts District"],
  },
  "Studio City": {
    dining: ["Firefly", "Aroma Coffee & Tea", "Vitello's"],
    hotels: ["Sportsmen's Lodge", "The Garland", "The Beverly Garland"],
    culture: ["Tujunga Village", "Fryman Canyon", "CBS Studio Center"],
  },
  "Encino": {
    dining: ["Katsu-Ya Encino", "Gasolina Café", "Buca di Beppo"],
    hotels: ["Hilton Woodland Hills", "Warner Center Marriott", "The Garland"],
    culture: ["Balboa Park", "Encino Commons", "Los Encinos State Historic Park"],
  },
  "Long Beach": {
    dining: ["L'Opera Ristorante", "The Attic on Broadway", "Michael's on Naples"],
    hotels: ["The Queen Mary", "Hotel Maya", "The Westin Long Beach"],
    culture: ["The Queen Mary", "Museum of Latin American Art", "Naples Island"],
  },
  "Burbank": {
    dining: ["Castaway", "Porto's Bakery", "Smokehouse Restaurant"],
    hotels: ["Hotel Amarano", "Marriott Burbank Airport", "The Castaway"],
    culture: ["Warner Bros. Studio Tour", "Walt Disney Studios", "Magnolia Park"],
  },
  "Westlake Village": {
    dining: ["Mastro's Steakhouse", "Boccaccio's", "Zin Bistro"],
    hotels: ["Four Seasons Westlake Village", "Westlake Village Inn", "Hyatt Regency Westlake"],
    culture: ["Westlake Village Lake", "The Landing", "The Promenade at Westlake"],
  },
  "Thousand Oaks": {
    dining: ["Mastro's Steakhouse", "Stonefire Grill", "Margo's"],
    hotels: ["Thousand Oaks Inn", "Hyatt Regency Westlake", "The Oaks Hotel"],
    culture: ["Sherwood Country Club", "The Civic Arts Plaza", "Gardens of the World"],
  },
  "Rancho Palos Verdes": {
    dining: ["Mar'sel at Terranea", "The Catalina Kitchen", "Nelson's at Terranea"],
    hotels: ["Terranea Resort", "The Palos Verdes Inn", "Best Western Plus Palos Verdes"],
    culture: ["Trump National Golf Club", "Point Vicente Lighthouse", "Abalone Cove"],
  },
  "Silver Lake": {
    dining: ["Botanica", "Night + Market Song", "Pine & Crane"],
    hotels: ["The Silver Lake Pool & Inn", "Palihotel", "Hotel Covell"],
    culture: ["Silver Lake Reservoir", "Sunset Junction", "The Edendale"],
  },
  "Los Feliz": {
    dining: ["Little Dom's", "Alcove Café", "Figaro Bistrot"],
    hotels: ["The Hotel & Spa", "Best Western Plus Atrium Inn", "The Moment Hotel"],
    culture: ["Griffith Observatory", "The Greek Theatre", "Vermont Avenue"],
  },
  "San Antonio": {
    dining: ["Mixtli", "Biga on the Banks", "Cured at Pearl"],
    hotels: ["Hotel Emma", "The St. Anthony Hotel", "La Cantera Resort"],
    culture: ["The Pearl District", "The Briscoe Western Art Museum", "San Antonio River Walk"],
  },
  "Fort Worth": {
    dining: ["Lonesome Dove Western Bistro", "Grace", "B&B Butchers"],
    hotels: ["The Ashton Hotel", "The Worthington Renaissance", "Hotel Drover"],
    culture: ["Kimbell Art Museum", "Sundance Square", "The Stockyards"],
  },
  "Charleston": {
    dining: ["FIG", "Husk", "The Ordinary"],
    hotels: ["Belmond Charleston Place", "The Dewberry", "The Spectator Hotel"],
    culture: ["King Street", "Boone Hall Plantation", "Rainbow Row"],
  },
  "Minneapolis": {
    dining: ["Spoon and Stable", "Owamni", "Alma"],
    hotels: ["The Hewing Hotel", "Hotel Ivy", "The Marquette Hotel"],
    culture: ["Minneapolis Institute of Art", "The Walker Art Center", "Mill City Museum"],
  },
};

function getVenueContext(location: string, serviceKey: string): string {
  const venues = locationVenues[location];
  if (!venues) return "";

  switch (serviceKey) {
    case "corporate-event-magician":
      return `A product launch at ${venues.culture[2]}, a client appreciation dinner at ${venues.dining[0]}, a gala at ${venues.hotels[0]} — White Rabbit brings the same world-class presence to every room in ${location}.`;
    case "private-party-magician":
      return `From penthouse celebrations overlooking ${venues.culture[1]} to intimate dinner parties after an evening at ${venues.dining[1]}, ${location}'s finest hosts know: the entertainment is what separates a nice night from an unforgettable one.`;
    case "wedding-magician":
      return `${location}'s most sought-after wedding venues, from ${venues.hotels[1]} to ${venues.hotels[2]}, deserve entertainment that matches their elegance. White Rabbit is the cocktail hour experience that lives up to the setting.`;
    case "close-up-magician":
      return `Picture it: guests mingling in the lobby of ${venues.hotels[0]}, or gathered around the bar at ${venues.dining[2]}, and then something impossible happens in their hands. That's the White Rabbit effect, and it's why ${location}'s most discerning hosts keep coming back.`;
    case "private-magic-show":
      return `Imagine transforming a private dining room at ${venues.dining[0]} or the event space at ${venues.hotels[0]} into an intimate theater. The Private Magic Show brings a level of sophistication that feels right at home in ${location}'s most refined spaces.`;
    case "golf-tournament-magician":
      return `The post-round reception at ${venues.culture[2]}, the awards dinner at ${venues.hotels[0]} — White Rabbit fills the gap between the last putt and the first toast with something your players will actually remember.`;
    case "charity-gala-magician":
      return `From black-tie fundraisers at ${venues.hotels[1]} to intimate donor dinners at ${venues.dining[0]}, White Rabbit creates the kind of moments that loosen wallets and warm hearts across ${location}'s most prestigious philanthropic events.`;
    case "holiday-party-magician":
      return `Your team celebrating at ${venues.hotels[0]}, an intimate gathering at ${venues.dining[1]} — wherever the party lands, White Rabbit transforms your ${location} holiday party from "nice" to "legendary."`;
    case "trade-show-magician":
      return `On a crowded expo floor near ${venues.culture[2]}, your booth needs a competitive edge. White Rabbit draws crowds, holds attention, and turns foot traffic into qualified leads at ${location}'s biggest trade shows and brand activations.`;
    case "rehearsal-dinner-magician":
      return `Picture your closest friends and family gathered at ${venues.dining[0]} or the private dining room at ${venues.hotels[2]}, the night before the big day. White Rabbit makes that intimate evening as magical as the wedding itself.`;
    case "halloween-party-magician":
      return `From haunted soirées at ${venues.hotels[0]} to costumed gatherings at ${venues.dining[2]}, White Rabbit adds a layer of genuine mystery and dark wonder to ${location}'s most atmospheric Halloween celebrations.`;
     case "christmas-party-magician":
      return `The company holiday party at ${venues.hotels[1]}, a New Year's Eve celebration at ${venues.dining[0]} — White Rabbit brings the kind of magic that makes the season truly feel special in ${location}.`;
    case "premiere-red-carpet-magician":
      return `From after-parties at ${venues.hotels[0]} to screening receptions at ${venues.culture[2]}, White Rabbit brings the kind of entertainment that gives industry veterans in ${location} something they haven't experienced in years: genuine surprise.`;
    case "dmc-entertainment":
      return `An incentive trip welcome reception at ${venues.hotels[0]}, a VIP dinner at ${venues.dining[0]}, a group activity at ${venues.culture[1]} — White Rabbit fits right into the curated ${location} itineraries that destination management companies build for their top-tier clients.`;
    case "resident-event-magician":
      return `From luxury apartment communities near ${venues.culture[1]} to high-rise buildings overlooking ${venues.culture[0]}, White Rabbit transforms standard resident socials in ${location} into the kind of events that drive attendance, build community, and make residents proud of where they live.`;
    default:
      return "";
  }
}

const serviceTypes = [
  {
    key: "corporate-event-magician",
    label: "Corporate Event Magician",
    category: "Corporate Events",
  },
  {
    key: "private-party-magician",
    label: "Private Party Magician",
    category: "Private Events",
  },
  {
    key: "wedding-magician",
    label: "Wedding Magician",
    category: "Weddings",
  },
  {
    key: "close-up-magician",
    label: "Close-Up Magician",
    category: "Close-Up Magic",
  },
  {
    key: "private-magic-show",
    label: "Private Magic Show",
    category: "Private Magic Shows",
  },
  {
    key: "golf-tournament-magician",
    label: "Golf Tournament Magician",
    category: "Golf Tournaments",
  },
  {
    key: "charity-gala-magician",
    label: "Charity Gala Magician",
    category: "Charity Galas",
  },
  {
    key: "holiday-party-magician",
    label: "Holiday Party Magician",
    category: "Holiday Parties",
  },
  {
    key: "trade-show-magician",
    label: "Trade Show Magician",
    category: "Trade Shows",
  },
  {
    key: "rehearsal-dinner-magician",
    label: "Rehearsal Dinner Magician",
    category: "Rehearsal Dinners",
  },
  {
    key: "halloween-party-magician",
    label: "Halloween Party Magician",
    category: "Halloween Events",
  },
  {
    key: "christmas-party-magician",
    label: "Christmas Party Magician",
    category: "Christmas & NYE",
  },
  {
    key: "premiere-red-carpet-magician",
    label: "Premiere & Red Carpet Magician",
    category: "Premieres & Production",
  },
  {
    key: "dmc-entertainment",
    label: "DMC Entertainment & Magician",
    category: "DMC & Incentive Travel",
  },
  {
    key: "resident-event-magician",
    label: "Resident Event Magician",
    category: "Resident Events",
  },
] as const;

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const testimonials = [
  {
    quote: "Scott performed at a 200-person event for us and the guests absolutely LOVED him and were amazed by his talents. I could not recommend him more! We can't wait to have him back.",
    attribution: "Jamie I., Morgan Stanley Event",
  },
  {
    quote: "Scott put on an amazing show at our Holiday Party, all the guests loved him and were blown away! 2nd year in a row hiring him and he knocks it out of the park both times!",
    attribution: "Taylor R., Corporate Holiday Party",
  },
  {
    quote: "Saw him at a private event and absolutely crushed it!! Jaws were hitting the floor so hard the downstairs neighbors started wondering what was going down.",
    attribution: "Mohammad R., Private Event Guest",
  },
  {
    quote: "Scott was so amazing. He elevated our party in ways I didn't expect, and he was everyone's favorite part. Absolutely worth it.",
    attribution: "Zara M., Private Party Host",
  },
  {
    quote: "Scott takes a unique and personalized approach to his craft! I don't want to give anything away so all I can say is BOOK WHITE RABBIT! You won't regret it.",
    attribution: "Kenneth R., Private Show Guest",
  },
];

function generateFaqs(location: string, serviceKey: string): FaqItem[] {
  const shared: FaqItem[] = [
    {
      question: `How far in advance should I book a magician in ${location}?`,
      answer: `We recommend booking 2–4 weeks in advance, especially during peak event season (October–December and April–June). Popular dates fill quickly. Contact us as soon as you have a date in mind and we'll confirm availability within 24 hours.`,
    },
    {
      question: `What makes White Rabbit different from other magicians in ${location}?`,
      answer: `White Rabbit delivers a luxury entertainment experience, not just tricks. Scott is a member of the world-famous Magic Castle® in Hollywood, the most prestigious private club for magicians on earth. Combined with world-class mentalism, interactive magic, and the kind of guest engagement that transforms events, it's why Netflix, Disney, Morgan Stanley, and Rolls Royce trust White Rabbit with their most important moments.`,
    },
  ];

  const serviceSpecific: Record<string, FaqItem[]> = {
    "corporate-event-magician": [
      {
        question: "What type of corporate events is White Rabbit best suited for?",
        answer: "Cocktail receptions, holiday parties, product launches, executive retreats, client appreciation events, trade shows, and galas. Scott's close-up magic is designed to break the ice and create genuine connections between guests, perfect for networking-heavy events.",
      },
      {
        question: "Can the performance be customized with our company branding?",
        answer: "Absolutely. Scott tailors every performance to your event's goals, audience, and tone. He can incorporate your company's messaging into a reveal, match the energy of your event theme, or build custom routines around your brand story. Every detail is considered.",
      },
    ],
    "private-party-magician": [
      {
        question: "What size private party is ideal for a magician?",
        answer: "White Rabbit performs for intimate gatherings of 6 guests up to celebrations of 200+. For smaller groups, the magic becomes intensely personal. For larger parties, Scott moves through the room creating pockets of wonder everywhere he goes.",
      },
      {
        question: "What occasions work best for hiring a private party magician?",
        answer: "Milestone birthdays, anniversary dinners, engagement parties, holiday gatherings, housewarming celebrations, dinner parties, and bachelorette events. Any occasion where you want your guests talking about your party for years to come.",
      },
    ],
    "wedding-magician": [
      {
        question: "When during the wedding does the magician perform?",
        answer: "Cocktail hour is the most popular window. It's the perfect time to break the ice between guests from different parts of your life. Scott can also perform during the reception or as a pre-dinner show. We work with your timeline to find the ideal moment.",
      },
      {
        question: "Is the magic appropriate for all ages at a wedding?",
        answer: "Yes. Every performance is elegant, sophisticated, and family-friendly. No cheesy props, no pulling rabbits from hats. Just beautiful, intimate moments of wonder that feel right at home at a black-tie celebration.",
      },
    ],
    "close-up-magician": [
      {
        question: "What is close-up magic and how does it work at events?",
        answer: "Close-up magic happens right in your guests' hands: cards, coins, borrowed objects. Scott moves through the room performing for small groups of 4 to 8 people at a time, creating intimate, jaw-dropping moments. It's interactive, personal, and the most powerful form of live entertainment.",
      },
      {
        question: "How long does a close-up magic performance typically last?",
        answer: "Most clients book 2–3 hours of roaming close-up magic for cocktail hours and receptions. Each small group gets about 8–10 minutes of dedicated performance. Custom timing is always available based on your event's needs.",
      },
    ],
    "private-magic-show": [
      {
        question: "What is included in a Private Magic Show?",
        answer: "A curated 45-minute theatrical performance featuring close-up magic, mentalism, and audience interaction. In the greater Los Angeles area, full production support is included: professional lighting, sound design, and staging to transform your space into an intimate theater.",
      },
      {
        question: "How many guests can attend a Private Magic Show?",
        answer: "The Private Magic Show is designed for groups of 20 to 120 guests. This range ensures every person feels connected to the performance, close enough to see every detail, intimate enough to feel like they're part of something special.",
      },
    ],
    "golf-tournament-magician": [
      {
        question: "When does the magician perform at a golf tournament?",
        answer: "There are three key windows. First, on the course itself: Scott can station at a signature hole and perform close-up magic for groups waiting at the tee, turning a five-minute backup into the most talked-about hole of the day. Second, during the post-round reception as golfers come off the course. Third, as MC and host during dinner and awards. One performer covers the entire day.",
      },
      {
        question: "Is the magic appropriate for a golf crowd?",
        answer: "Absolutely. Scott's style is sophisticated, conversational, and perfectly calibrated for the country club environment. Think whiskey-in-hand, blazer-on entertainment — not kids' birthday party tricks. It's the kind of experience that feels right at home at a private club.",
      },
    ],
    "charity-gala-magician": [
      {
        question: "How does a magician enhance a charity gala or fundraiser?",
        answer: "Magic creates an atmosphere of generosity and delight. When guests are amazed and emotionally engaged, they give more freely. Scott's roaming close-up magic during cocktail hour warms the room before the ask, and a parlor show before the paddle raise can electrify the energy in the room.",
      },
      {
        question: "Can the performance tie into our fundraising mission?",
        answer: "Yes. Scott tailors every performance to your organization's tone and goals. He can weave your mission into a mentalism reveal, create a 'wow moment' that transitions into the live auction, or build the entire show around your cause. The magic serves your event's purpose, not the other way around.",
      },
    ],
    "holiday-party-magician": [
      {
        question: "How far in advance should we book for a holiday party?",
        answer: "Holiday season (October through January) is by far the busiest time. We recommend booking at least 6–8 weeks in advance for December dates. Many companies rebook the following year's holiday party the week after the current one. Early planning is essential.",
      },
      {
        question: "What makes a holiday party magician different from a regular DJ or band?",
        answer: "A DJ provides background music. A magician creates moments. Scott moves through the room creating personal, interactive experiences for every guest — the kind of entertainment people actually talk about the next day at the office. It's the difference between a party and an event.",
      },
    ],
    "trade-show-magician": [
      {
        question: "How does a magician help at a trade show or brand activation?",
        answer: "A skilled trade show magician draws crowds to your booth, holds their attention, and weaves your product messaging into the performance. Scott can incorporate your brand story, product demos, or key talking points into the magic, turning passive attendees into engaged prospects.",
      },
      {
        question: "Can the magic incorporate our product or brand messaging?",
        answer: "Absolutely. Scott specializes in custom routines that organically feature your product, logo, or key message. The magic becomes a vehicle for your brand story — memorable, shareable, and far more effective than a standard booth demo.",
      },
    ],
    "rehearsal-dinner-magician": [
      {
        question: "Is magic appropriate for a rehearsal dinner?",
        answer: "It's perfect. Rehearsal dinners are intimate, emotional, and full of people meeting for the first time. Close-up magic breaks the ice instantly, giving both families something to bond over before the big day. It sets the tone for the entire wedding weekend.",
      },
      {
        question: "How long does the performance last at a rehearsal dinner?",
        answer: "Most couples book 1–2 hours of roaming magic during cocktails and dinner. Scott moves table to table, creating personal moments for each group. It's subtle, elegant, and never interrupts the flow of the evening.",
      },
    ],
    "halloween-party-magician": [
      {
        question: "What kind of magic works for a Halloween event?",
        answer: "Scott leans into the mysterious and uncanny: mentalism, mind reading, and eerie coincidences that feel genuinely supernatural. It's sophisticated dark wonder, not jump scares. Think séance energy meets world-class psychological magic. Perfect for adult Halloween parties where atmosphere matters.",
      },
      {
        question: "Does Scott dress in costume for Halloween events?",
        answer: "Scott's signature style already carries a dark, mysterious elegance that fits Halloween naturally. He can lean further into the theme with styling that matches your event's aesthetic, but the real magic is in the performance itself — the kind of 'how did he know that' moments that feel especially eerie on Halloween.",
      },
    ],
    "christmas-party-magician": [
      {
        question: "Is White Rabbit available for New Year's Eve events too?",
        answer: "Yes. Scott performs at both Christmas parties and New Year's Eve celebrations. NYE events are particularly popular — magic at midnight creates an unforgettable transition into the new year. Book early, as December 31 fills first.",
      },
      {
        question: "What size Christmas party works best for a magician?",
        answer: "From intimate office gatherings of 20 to grand company celebrations of 500+, White Rabbit scales to fit. For larger events, Scott provides roaming close-up magic during cocktails. For more intimate groups, a seated parlor show can serve as the evening's centerpiece.",
      },
    ],
    "premiere-red-carpet-magician": [
      {
        question: "What kind of Hollywood events does White Rabbit perform at?",
        answer: "Premiere after-parties, wrap parties, screening receptions, studio events, award show celebrations, brand activations, and VIP lounges. Any industry event where you want guests talking about the experience instead of checking their phones.",
      },
      {
        question: "Can Scott perform in VIP areas and green rooms?",
        answer: "Absolutely. Close-up magic is designed for exactly these environments: intimate spaces, small groups, no stage or setup required. Scott moves through VIP sections, green rooms, and cocktail areas creating personal moments of astonishment for talent, executives, and guests alike.",
      },
    ],
    "dmc-entertainment": [
      {
        question: "How does White Rabbit work with DMCs and destination management companies?",
        answer: "White Rabbit fits right into the curated itineraries DMCs build for incentive trips, corporate retreats, and VIP group experiences. Scott arrives ready to perform with zero setup, fitting into welcome receptions, dinner programs, team-building sessions, and post-excursion gatherings. Many DMCs add White Rabbit as a signature local entertainment option for their Los Angeles and nationwide programs.",
      },
      {
        question: "What types of incentive trip events work best for a magician?",
        answer: "Welcome receptions, farewell dinners, awards galas, VIP breakout sessions, and exclusive group activities. Close-up magic is especially effective during networking moments where attendees from different offices or regions are meeting for the first time. It breaks the ice instantly and creates shared memories that reinforce the trip's purpose.",
      },
    ],
    "resident-event-magician": [
      {
        question: "What kind of resident events work best for a magician?",
        answer: "Quarterly socials, holiday parties, move-in welcome events, pool parties, rooftop cocktail nights, and resident appreciation evenings. The format works beautifully for any gathering where you want residents to interact, engage, and actually enjoy themselves. The magic gives people a reason to show up and a reason to stay.",
      },
      {
        question: "Is this appropriate for an apartment community?",
        answer: "Absolutely. Scott's style is sophisticated, conversational, and designed for adult audiences. This is not a children's entertainer. It's world-class close-up magic and mentalism that creates genuine connection between neighbors. Think cocktail party energy, not birthday party energy. NetVendor approved and fully insured for hassle-free booking.",
      },
    ],
  };

  return [...(serviceSpecific[serviceKey] || []), ...shared];
}

/**
 * City-specific content overrides. Key format: "{city-slug}--{service-key}"
 * When provided, these paragraphs are included as citySpecificContent on the page,
 * allowing the renderer to supplement or replace generic template body text.
 * 
 * Example:
 *   "beverly-hills--corporate-event-magician": [
 *     "Beverly Hills corporate events demand a level of polish...",
 *     "From Rodeo Drive product launches to private dinners at The Peninsula...",
 *   ],
 */
const citySpecificOverrides: Record<string, string[]> = {
  // ── Beverly Hills ───────────────────────────────────────────────────
  "beverly-hills--corporate-event-magician": [
    "Beverly Hills corporate events operate on a different frequency. The guest list includes people who've attended premieres, sat courtside, and dined at every Michelin-starred restaurant on the Westside. Standard entertainment doesn't register. White Rabbit does — because close-up magic performed inches from a guest's hands bypasses every filter. Scott has performed at The Beverly Hilton for corporate galas where 400 executives watched a ballroom go silent, phones face-down, within 90 seconds of the first effect.",
    "Clients in Beverly Hills include Netflix, Disney, Morgan Stanley, Rolls-Royce, Who What Wear, Pistola Denim, Compass, and Taittinger Champagne. The events tend to be high-end corporate galas, luxury brand activations, and private estate dinners — rooms where the entertainment has to match the invite list. Scott's close-up magic and mentalism are built for exactly this environment: sophisticated, conversational, and impossible to dismiss.",
  ],
  "beverly-hills--private-party-magician": [
    "Private parties in Beverly Hills aren't casual. They're curated. The host has thought about the wine, the lighting, the playlist — and the entertainment needs to meet that same standard. White Rabbit has performed at private estate dinners throughout the 90210 where guests included executives from Netflix, Disney, and Compass. The magic is designed for adults with taste: no props, no gimmicks, just impossible moments happening in your guests' hands while they hold a glass of Taittinger.",
    "Scott has performed at intimate gatherings at The Beverly Hilton and private residences in the flats and Trousdale Estates. Whether it's a milestone birthday for 30 or a seated dinner for 80, the magic scales without losing what makes it work — the personal, one-on-one moments that make every guest feel like the evening was built around them.",
  ],
  "beverly-hills--wedding-magician": [
    "Beverly Hills weddings happen at venues that demand world-class everything — The Beverly Hilton, Montage Beverly Hills, The Peninsula. The entertainment has to belong in that room. White Rabbit's cocktail hour magic is built for five-star settings: Scott moves through the crowd creating intimate moments of wonder for small groups, connecting guests from both families before they find their seats. No stage, no announcements — just elegant, interactive magic that feels right at home next to the champagne.",
    "Couples who book White Rabbit for Beverly Hills weddings often pair cocktail hour magic with a Private Magic Show at the rehearsal dinner. It gives the immediate family and wedding party an intimate, high-energy experience the night before — and by the time the ceremony arrives, both families are already bonded over something extraordinary.",
  ],
  "beverly-hills--close-up-magician": [
    "Close-up magic in Beverly Hills needs to hold up in rooms where the guests have seen everything. Scott has performed for audiences that include entertainment executives, luxury brand founders, and clients of Compass Beverly Hills — people who are used to being impressed and rarely are. The magic works because it's not a show you watch from a distance. It happens in your hands, with your ring, your phone, your choices. That's what cuts through the Beverly Hills filter.",
    "From brand activations for Who What Wear and Pistola Denim to private client events for Taittinger Champagne, Scott's close-up work is designed for the cocktail-hour format that Beverly Hills events favor: standing, mingling, drinks in hand. He reaches 80 to 120 guests in a standard cocktail hour, and the reactions carry — one group gasps, and suddenly the next group is pulling him over.",
  ],
  "beverly-hills--private-magic-show": [
    "The Private Magic Show turns any Beverly Hills venue — a private dining room at The Beverly Hilton, an estate in Trousdale, a rooftop at Waldorf Astoria — into an intimate theater. Scott brings professional lighting, a curated soundtrack, and 45 minutes of material that gets standing ovations from audiences who don't stand for anything. This is the experience that defines the White Rabbit brand: elegant, interactive, and designed to feel like something you'd find at a private members' club.",
    "Beverly Hills clients who've hosted the Private Magic Show include executives from Netflix, Disney, and Morgan Stanley. The format works for groups of 20 to 150 — large enough to generate real energy, intimate enough that every guest feels like part of the story. Most Beverly Hills bookings pair the show with roaming close-up magic during cocktail hour, giving guests two completely different experiences in one evening.",
  ],
  "beverly-hills--holiday-party-magician": [
    "Holiday parties in Beverly Hills compete with every other invitation on the calendar — and your guests' calendars are full. The entertainment is what separates a forgettable cocktail hour from the party everyone talks about through January. Scott has performed holiday events for clients including Netflix, Disney, and Morgan Stanley at venues like The Beverly Hilton, where the magic turned a standard corporate holiday party into the most talked-about event of the season.",
    "White Rabbit's close-up magic is a natural fit for the Beverly Hills holiday format: standing receptions, circulating champagne, and guests who need a reason to put their phones down. Scott moves through the room creating shared moments of wonder that get people genuinely connecting — across departments, across companies, across the room. By the time dinner is called, the energy is electric.",
  ],
  "beverly-hills--charity-gala-magician": [
    "Beverly Hills galas attract donors who attend a dozen fundraisers a year. The entertainment has to do more than fill time — it has to warm the room before the ask. Scott has performed at charity events alongside brands like Taittinger Champagne and at venues including The Beverly Hilton, where his cocktail-hour magic created the kind of connection that translates directly to generosity when the paddle goes up.",
    "White Rabbit has also served as MC and auctioneer at fundraisers, including a record-breaking event for FosterAll. Having world-class entertainment and professional hosting in one person means you don't need a separate emcee, and the energy stays high straight through the live auction. For Beverly Hills nonprofits, that's a real advantage.",
  ],
  "beverly-hills--trade-show-magician": [
    "Trade shows and brand activations in Beverly Hills attract a sophisticated audience that doesn't stop for generic booth entertainment. Scott has worked activations for luxury brands including Who What Wear, Pistola Denim, and Taittinger Champagne — environments where the magic has to feel on-brand, not bolted on. He weaves product messaging into close-up routines so naturally that attendees don't realize they're being marketed to. They just know they can't walk away.",
    "The format works for experiential pop-ups on Rodeo Drive, brand launch events at The Beverly Hilton, and private showroom activations throughout the Golden Triangle. Scott draws crowds, holds attention, and creates the kind of organic social content that luxury brands actually want their audience sharing.",
  ],
  "beverly-hills--rehearsal-dinner-magician": [
    "The Beverly Hills rehearsal dinner is where the wedding weekend truly begins — and the guest list is the most important room you'll gather all weekend. Scott has performed rehearsal dinners at venues throughout Beverly Hills where the magic was the perfect icebreaker between families meeting for the first time. A full Private Magic Show at the rehearsal dinner gives your closest people a high-energy, intimate experience that sets the tone for everything that follows.",
    "Couples who book White Rabbit for the rehearsal dinner often add cocktail hour magic at the wedding reception the next day. By the time the ceremony arrives, both families are already connected — they bonded over something extraordinary the night before, and that energy carries through the entire weekend.",
  ],
  "beverly-hills--halloween-party-magician": [
    "Halloween in Beverly Hills means private estate parties where the production value rivals a studio set. The entertainment has to match. White Rabbit leans into the uncanny — mentalism, mind reading, and eerie coincidences that feel genuinely supernatural on the one night when everyone wants to believe. Scott has performed Halloween events at private residences throughout Beverly Hills where the magic blurred the line between performance and genuine mystery.",
    "The format works beautifully for costumed cocktail parties, seated dinner shows with a dark aesthetic, and roaming performances through elaborately decorated estates. Scott adjusts the tone to match the atmosphere — darker, more psychological, with effects that leave guests questioning what's real.",
  ],
  "beverly-hills--christmas-party-magician": [
    "Christmas parties in Beverly Hills need to feel special — not another holiday gathering with the same playlist and open bar. Scott has performed holiday events for clients including Netflix and Disney at venues like The Beverly Hilton, where the magic turned a corporate Christmas party into the event everyone referenced for the rest of the year. Close-up magic during cocktail hour creates shared moments that get people out of end-of-year mode and genuinely connecting.",
    "For New Year's Eve celebrations, Scott brings a different energy — higher tempo, bigger reactions, countdown-ready. Whether it's a seated dinner party for 30 or a standing reception for 200, White Rabbit is the kind of entertainment that makes your Beverly Hills holiday event the one people actually want to attend.",
  ],
  "beverly-hills--premiere-red-carpet-magician": [
    "Beverly Hills premieres and industry events attract the most entertainment-savvy audiences in the world. These are people who work in the business of creating wonder — and they're the hardest to genuinely surprise. Scott has performed at after-parties and private industry events throughout Beverly Hills where the reactions from showrunners, producers, and talent were the same as anyone else's: pure, unfiltered amazement. Close-up magic bypasses the industry filter because it happens in your hands, not on a screen.",
    "White Rabbit has consulted for America's Got Talent and Disney Channel, and performed for executives at Netflix, Paramount, and Lionsgate. That industry credibility means Scott belongs in the room — he understands the culture, reads the energy, and delivers something that impresses people who are professionally hard to impress.",
  ],
  "beverly-hills--dmc-entertainment": [
    "Destination management companies building Beverly Hills itineraries for incentive trips and VIP groups need entertainment that matches the caliber of the venues — The Beverly Hilton, Montage, The Peninsula. White Rabbit fits right into curated programs: welcome reception entertainment, VIP dinner performances, and private experiences that give groups something they can't get anywhere else. Scott arrives ready to perform with zero setup, fitting into whatever the DMC has planned.",
    "Clients who've booked White Rabbit through DMC partnerships include groups hosted by Morgan Stanley, Rolls-Royce, and Rivian. The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time — it breaks the ice instantly and gives people a shared experience to reference for the rest of the trip.",
  ],
  "beverly-hills--golf-tournament-magician": [
    "Golf tournaments at Beverly Hills-area clubs attract players who expect a premium experience from tee time through the awards dinner. White Rabbit fills the post-round gap — that awkward window between the last putt and the first toast — with roaming close-up magic that keeps players engaged and talking. Scott has performed at country club events throughout the Westside where the magic at the 19th hole became the most talked-about part of the day.",
    "Scott also stations at signature holes where groups back up, turning dead wait time into the highlight of the round. He can serve as MC for the awards dinner too, managing the flow from cocktails through trophies with the same polish he brings to corporate galas for clients like Morgan Stanley and Rolls-Royce.",
  ],
  "beverly-hills--resident-event-magician": [
    "Luxury residential communities in Beverly Hills — from high-rise buildings on Wilshire to boutique developments in the flats — want resident events that actually drive attendance. White Rabbit turns a standard resident social into the kind of evening that makes people proud of where they live. Scott's close-up magic gets neighbors genuinely interacting — people who might otherwise never connect beyond a nod in the elevator.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just world-class entertainment that fits into whatever space your community has — a rooftop lounge, a courtyard, a clubroom. Property managers report measurably higher attendance and resident satisfaction scores when White Rabbit is on the calendar.",
  ],
  // ── Downtown LA ─────────────────────────────────────────────────────
  "downtown-la--corporate-event-magician": [
    "Downtown LA corporate events pull a different crowd than the Westside. The guest list skews finance, legal, and creative — attorneys from Grand Avenue firms, partners from DTLA financial groups, and the arts district crowd that moved downtown because they wanted something grittier than Beverly Hills. Scott has performed at the Jonathan Club and the Los Angeles Athletic Club for corporate dinners where the magic had to match the room: sharp, smart, and zero fluff.",
    "The DTLA hotel scene — Proper Hotel, NoMad, The Hoxton — hosts a steady stream of corporate receptions and client dinners where the entertainment needs to feel current, not corporate. Scott's close-up magic and mentalism fit that energy perfectly. He reads the room, matches the vibe, and gives guests something to talk about that isn't the quarterly numbers.",
  ],
  "downtown-la--private-party-magician": [
    "Private parties in Downtown LA happen in lofts, rooftops, and converted warehouse spaces where the setting already feels like an event. The entertainment has to keep up. Scott has performed at private dinners at the Jonathan Club and birthday celebrations in Arts District lofts where the crowd was a mix of creatives, finance people, and downtown regulars who've seen plenty of LA nightlife and aren't easily impressed.",
    "The magic works in these spaces because it doesn't need a stage or a spotlight. Scott moves through the room with a deck of cards and whatever your guests happen to have on them — rings, phones, a pen. The reactions are real and they carry across the room. By the end of the night, people who came as strangers are swapping numbers and talking about the thing they just saw.",
  ],
  "downtown-la--wedding-magician": [
    "DTLA weddings have their own aesthetic — industrial venues, rooftop ceremonies, receptions at places like Vibiana or The Majestic Downtown. The entertainment has to feel like it belongs in the space, not like it wandered in from a country club. White Rabbit's cocktail hour magic is built for exactly this: Scott moves through the crowd creating small moments of wonder for groups of four to six, connecting guests from both families before anyone finds their seat.",
    "Couples who choose Downtown LA venues tend to care about the details. They picked the venue for a reason, they thought about the cocktails, and they want entertainment that matches. Scott's close-up magic is sophisticated enough for a black-tie reception and relaxed enough for a rooftop party — it reads the room and adjusts.",
  ],
  "downtown-la--close-up-magician": [
    "Close-up magic in Downtown LA works because the events here are built around proximity. Rooftop cocktail hours, seated dinners at the Jonathan Club, standing receptions at Proper Hotel — guests are close together, drinks in hand, ready to be engaged. Scott moves through these spaces performing for small groups, and the reactions are loud enough to pull in the next group before he even gets there.",
    "The DTLA audience is a mix you don't get anywhere else in LA — attorneys, tech founders, gallery owners, and the arts district creative crowd. They're sharp, they're skeptical, and they love being proven wrong. Close-up mentalism and interactive magic hit different with this audience because they actually try to figure it out, and they can't.",
  ],
  "downtown-la--private-magic-show": [
    "The Private Magic Show turns any DTLA space — a private dining room at the Jonathan Club, an event space at NoMad, a loft in the Arts District — into an intimate theater. Scott brings professional lighting, a curated soundtrack, and 45 minutes of material that gets standing ovations. The show is designed to feel like something you'd stumble into at a private members' club, not a corporate awards dinner.",
    "For Downtown LA clients, the show pairs well with the roaming close-up magic during cocktail hour. Guests get two completely different experiences in one evening — the intimate, in-your-hands magic during drinks, then a full theatrical performance that pulls the room together. Most DTLA bookings run this way.",
  ],
  "downtown-la--holiday-party-magician": [
    "Holiday parties in Downtown LA tend to happen at venues with character — the Jonathan Club, rooftop spaces at Proper Hotel, converted lofts in the Arts District. The crowd is a mix of law firms, financial companies, and creative agencies, and the entertainment needs to work for all of them. Scott's close-up magic is the one thing that gets the quiet analyst and the outgoing account exec reacting the same way: genuine, involuntary amazement.",
    "DTLA holiday parties compete with every other option in the city during December, and most of them blur together. White Rabbit is the reason people remember yours. Scott moves through the room during cocktail hour, and by the time dinner is called, the energy in the room is completely different than when people walked in.",
  ],
  "downtown-la--charity-gala-magician": [
    "Downtown LA galas pull donors from the financial district, the legal community, and the arts world — people who attend fundraisers regularly and know the difference between an event that's going through the motions and one that actually moves the room. Scott has performed at charity events at venues like the Los Angeles Athletic Club where the cocktail-hour magic warmed the room in a way that made the ask land harder.",
    "White Rabbit has also served as MC and auctioneer at fundraisers, including a record-breaking event for FosterAll. For DTLA nonprofits, having the entertainment and the emcee be the same person keeps the energy consistent and the night moving without awkward handoffs between speakers.",
  ],
  "downtown-la--trade-show-magician": [
    "Trade shows and brand activations in Downtown LA — at the Convention Center, in Arts District pop-up spaces, at hotel event floors — need something that stops foot traffic. Scott has worked activations where the close-up magic drew crowds to the booth within minutes, held their attention, and gave them a reason to stay long enough to hear the pitch. He weaves product messaging into the routines so naturally that people don't realize they're being marketed to.",
    "The DTLA audience at trade shows is different from the convention crowd in other cities. They're local, they're busy, and they don't stop for generic booth entertainment. Scott gives them a reason to stop — and a story to tell their colleagues when they get back to the office.",
  ],
  "downtown-la--rehearsal-dinner-magician": [
    "DTLA rehearsal dinners happen at restaurants and private dining rooms throughout the neighborhood — places like Bestia, 71Above, or a private room at the Jonathan Club. The guest list is tight: immediate family and the wedding party, meeting each other properly for the first time. Scott's close-up magic is the perfect icebreaker for this room — it gives people something to react to together, and suddenly two families that just met are laughing and grabbing each other's arms.",
    "A full Private Magic Show at the rehearsal dinner gives the closest people in the couple's life a high-energy experience the night before the wedding. By the time the ceremony starts, both families already have a shared story — and that carries through the whole weekend.",
  ],
  "downtown-la--halloween-party-magician": [
    "Halloween in Downtown LA means loft parties, rooftop events, and warehouse gatherings where the production value is high and the crowd is ready for something weird. White Rabbit leans into the uncanny for Halloween — mentalism, mind reading, eerie coincidences that feel genuinely supernatural. Scott has performed Halloween events in DTLA where the Arts District setting made the whole thing feel more real, more atmospheric, like the magic belonged to the building itself.",
    "The format works for costumed cocktail parties, seated dinner shows with a dark aesthetic, and roaming performances through industrial spaces. Scott reads the atmosphere and adjusts — darker, more psychological, the kind of effects that make people look over their shoulder on the way home.",
  ],
  "downtown-la--christmas-party-magician": [
    "Christmas parties in Downtown LA happen at the Jonathan Club, rooftop venues, hotel event spaces at Proper and NoMad, and converted lofts throughout the Arts District. The crowd is mostly law firms, financial companies, and creative agencies wrapping up the year. Scott's close-up magic during cocktail hour gets people out of end-of-year mode and genuinely connecting — across departments, across seniority levels, across the room.",
    "For New Year's Eve celebrations, Scott brings a different energy — higher tempo, bigger reactions, countdown-ready. Whether it's a seated dinner for 30 or a standing reception for 200, White Rabbit is the reason your DTLA holiday event stands out from every other December invite.",
  ],
  "downtown-la--premiere-red-carpet-magician": [
    "Downtown LA has become a hub for premieres, screenings, and industry events — venues like The Theatre at Ace Hotel, the Orpheum, and private event spaces throughout the neighborhood host everything from film premieres to streaming launch parties. Scott has performed at industry after-parties where the audience included producers, talent, and executives who work in the business of creating spectacle. Close-up magic cuts through that filter because it happens in your hands, not on a screen.",
    "White Rabbit has consulted for America's Got Talent and Disney Channel, and performed for executives at Netflix, Paramount, and Lionsgate. That industry credibility means Scott reads the room correctly at DTLA industry events — he knows the culture, matches the energy, and delivers something that genuinely surprises people who are professionally hard to surprise.",
  ],
  "downtown-la--dmc-entertainment": [
    "Destination management companies building Downtown LA itineraries for corporate groups and incentive trips need entertainment that matches the neighborhood's energy — grittier, more creative, more current than the Westside. White Rabbit fits right into curated programs at venues like the Jonathan Club, Proper Hotel, and Arts District event spaces. Scott arrives ready to perform with zero setup, fitting into whatever the DMC has planned for the evening.",
    "The magic works especially well during welcome receptions and networking dinners where attendees from different offices or cities are meeting for the first time. It breaks the ice instantly and gives people a shared experience to reference for the rest of the trip. Clients who've booked White Rabbit through DMC partnerships include groups hosted by Morgan Stanley and Rolls-Royce.",
  ],
  "downtown-la--golf-tournament-magician": [
    "Golf tournaments near Downtown LA — at clubs throughout the greater LA area — often host their awards dinners and post-round receptions at DTLA venues like the Jonathan Club or the Los Angeles Athletic Club. White Rabbit fills the post-round gap with roaming close-up magic that keeps players engaged and talking. Scott has performed at country club events where the magic at the 19th hole became the most talked-about part of the day.",
    "Scott also serves as MC for the awards dinner, managing the flow from cocktails through trophies with the same polish he brings to corporate galas. For tournament organizers using a DTLA venue for the evening program, having the entertainment and the host be the same person keeps the night tight and the energy consistent.",
  ],
  "downtown-la--resident-event-magician": [
    "Downtown LA's luxury high-rises and loft communities — along South Park, the Arts District, and the Financial District — want resident events that actually get people to show up. Scott's close-up magic gets neighbors genuinely interacting, not just standing around a lobby bar making small talk. The reactions are real and they carry — someone gasps on one side of the lounge, and suddenly everyone wants to see what happened.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just polished, sophisticated entertainment that fits into whatever space your building has — a rooftop deck, a courtyard, a clubroom. Property managers report higher attendance and stronger resident engagement when White Rabbit is on the calendar.",
  ],
  // ── West Hollywood ──────────────────────────────────────────────────
  "west-hollywood--corporate-event-magician": [
    "West Hollywood corporate events don't feel corporate. They feel like parties that happen to have a company behind them. The guest list is entertainment industry, fashion brands, PR firms, and creative agencies — people who spend their days producing content and their nights at places like Soho House. Scott has performed at Soho House West Hollywood for corporate events where the crowd was mostly producers, publicists, and brand directors. The magic had to match the room: cool, sharp, and zero cheese.",
    "Brands like Who What Wear, Pistola Denim, and Hard Cut Vodka have booked Scott for WeHo events. These aren't boardroom presentations — they're rooftop receptions, brand dinners at Arden, and launch parties where the entertainment needs to feel like it belongs on the guest list. Scott's close-up magic and mentalism hit right with this crowd because it's interactive, unexpected, and gives people something real to post about.",
  ],
  "west-hollywood--private-party-magician": [
    "Private parties in West Hollywood run late, run loud, and attract a crowd that's hard to impress. Stylists, producers, publicists, and the kind of people who've been to every opening and every after-party on the Sunset Strip. Scott has performed at private dinners and birthday celebrations throughout WeHo where the magic cut through the noise because it happened right in people's hands — no stage, no announcement, just impossible things happening while they held their drink.",
    "Scott has performed at Soho House West Hollywood and at the speakeasy Rideau inside Arden restaurant. The WeHo energy is different from Beverly Hills — more edgy, more spontaneous, more late-night. The magic matches that. Scott reads the room and adjusts: faster pace, bigger reactions, the kind of effects that make someone grab their friend's arm and say 'you have to see this.'",
  ],
  "west-hollywood--wedding-magician": [
    "WeHo weddings tend to be stylish, unconventional, and designed by people who care about aesthetics. The venues — rooftop spaces, boutique hotels, private restaurants along Melrose and Santa Monica Boulevard — set a tone that generic entertainment would ruin. White Rabbit's cocktail hour magic is built for this: Scott moves through the crowd creating small moments of wonder that connect guests from both sides before dinner, without a microphone or a stage.",
    "Couples who choose West Hollywood for their wedding want the evening to feel curated, not produced. Scott's close-up magic fits that vision — it's personal, conversational, and sophisticated enough for any venue in the neighborhood. He's also available for rehearsal dinners, where a full Private Magic Show gives the immediate family and wedding party an intimate, high-energy experience the night before.",
  ],
  "west-hollywood--close-up-magician": [
    "Close-up magic in West Hollywood works because the events here are built around proximity and conversation. Standing receptions at Soho House, seated dinners at Arden, cocktail hours on hotel rooftops — guests are close together, drinks in hand, and open to something unexpected. Scott moves through these spaces performing for small groups, and the reactions spread fast. One table gasps, the next one waves him over.",
    "The WeHo crowd — young creative professionals, entertainment industry, fashion — brings a specific energy to close-up magic. They're engaged, they're curious, and they react big. Scott has performed for brands like Who What Wear and Pistola Denim in West Hollywood, and the magic is calibrated for this audience: fast, smart, and designed for people who'd rather participate than spectate.",
  ],
  "west-hollywood--private-magic-show": [
    "The Private Magic Show in a West Hollywood venue — a private room at Soho House, an event space at Pendry, the speakeasy Rideau inside Arden — feels like stumbling into something you weren't supposed to find. Scott brings professional lighting, a curated soundtrack, and 45 minutes of material that gets standing ovations from audiences who are genuinely difficult to impress. The show is designed to feel like a members-only experience, not a corporate program.",
    "For WeHo clients, the show pairs well with roaming close-up magic during the cocktail hour. Guests get two completely different experiences in one evening — the intimate, in-your-hands magic during drinks, then a full theatrical performance that pulls the room together. The WeHo crowd loves this format because it feels like a real event, not a hired act.",
  ],
  "west-hollywood--holiday-party-magician": [
    "Holiday parties in West Hollywood compete with every other invite in a city that doesn't slow down in December. The entertainment is what makes yours the one people actually talk about. Scott has performed holiday events for brands and creative agencies throughout WeHo where the close-up magic during cocktail hour got people connecting across departments and friend groups in a way that small talk never does.",
    "The WeHo holiday party format — standing receptions, rooftop bars, venues along the Sunset Strip — is perfect for close-up magic. Scott moves through the room, and by the time someone suggests moving to the next bar, nobody wants to leave. That's the difference between background music and White Rabbit.",
  ],
  "west-hollywood--charity-gala-magician": [
    "West Hollywood galas attract a donor base from the entertainment and fashion industries — people who attend fundraisers regularly and expect the evening to feel like an event, not an obligation. Scott has performed at charity events throughout WeHo where the cocktail-hour magic warmed the room before the ask in a way that speeches alone can't do. When people are laughing and grabbing each other's arms, the generosity follows.",
    "White Rabbit has also served as MC and auctioneer at fundraisers, including a record-breaking event for FosterAll. For WeHo nonprofits, having the entertainment and the emcee be the same person keeps the energy moving and eliminates awkward transitions between the fun part and the fundraising part.",
  ],
  "west-hollywood--trade-show-magician": [
    "Brand activations and experiential events in West Hollywood attract an audience that doesn't stop for anything ordinary. Scott has worked activations for Who What Wear, Pistola Denim, and Hard Cut Vodka — environments where the magic has to feel like part of the brand, not something bolted on at the last minute. He weaves product messaging into close-up routines so naturally that people don't realize they're being marketed to. They just know they can't look away.",
    "The format works for pop-up events on Melrose, launch parties at WeHo hotels, and private showroom activations throughout the neighborhood. Scott draws crowds, holds attention, and creates the kind of organic content that brands actually want on social — real reactions, real amazement, nothing staged.",
  ],
  "west-hollywood--rehearsal-dinner-magician": [
    "WeHo rehearsal dinners happen at restaurants and private dining rooms throughout the neighborhood — intimate spaces where both families are in the same room for the first time. Scott's close-up magic is the perfect icebreaker. Within minutes, the groom's college friends and the bride's parents are laughing together over something impossible that just happened in someone's hands. That connection carries through the whole wedding weekend.",
    "A full Private Magic Show at the rehearsal dinner — in a private room at Soho House or the speakeasy Rideau inside Arden — gives the closest people in the couple's life a high-energy, intimate experience the night before the big day. Couples who book this often add cocktail hour magic at the reception too.",
  ],
  "west-hollywood--halloween-party-magician": [
    "Halloween in West Hollywood is its own thing. The neighborhood goes all-in, and private parties throughout WeHo match that energy with production value, costumes, and a crowd that's ready for something genuinely weird. White Rabbit leans into the uncanny — mentalism, mind reading, eerie coincidences that feel supernatural. Scott has performed Halloween events in WeHo where the magic blurred the line between performance and something nobody could explain.",
    "The format works for costumed cocktail parties, rooftop gatherings, and late-night events where the atmosphere is already charged. Scott reads the room and dials it darker — more psychological, more unsettling, the kind of effects that stick with people on the drive home.",
  ],
  "west-hollywood--christmas-party-magician": [
    "Christmas parties in West Hollywood tend to be less traditional and more creative — agency parties, fashion brand celebrations, entertainment industry wrap parties at venues along the Strip. Scott's close-up magic during cocktail hour gets people out of year-end mode and genuinely engaging with each other. The reactions are real, and they spread across the room fast.",
    "For New Year's Eve, Scott brings a different energy — higher tempo, bigger reactions, countdown-ready. Whether it's a seated dinner at a WeHo restaurant or a standing reception for 200 at a hotel rooftop, White Rabbit is the reason your holiday event is the one people remember.",
  ],
  "west-hollywood--premiere-red-carpet-magician": [
    "West Hollywood is ground zero for industry events — premieres, screenings, wrap parties, and the after-parties that follow. The audience at these events works in entertainment and they've seen every trick in the book, which is exactly why close-up magic hits so hard. It happens in their hands, not on a screen, and the reactions from showrunners and producers are the same as everyone else's: genuine, involuntary amazement.",
    "Scott has performed at Soho House West Hollywood for industry events and has consulted for America's Got Talent and Disney Channel. That credibility means he belongs in the room. He reads the energy, matches the crowd, and delivers something that surprises people whose job it is to produce surprises.",
  ],
  "west-hollywood--dmc-entertainment": [
    "Destination management companies bringing groups to West Hollywood want entertainment that captures the neighborhood's energy — trend-forward, creative, and nothing like what their guests get at home. White Rabbit fits right into curated WeHo itineraries: welcome reception entertainment at Soho House, VIP dinner performances at Arden, and private experiences at boutique hotels that give groups something they'll talk about for the rest of the trip.",
    "The magic works especially well during networking moments where attendees from different offices are meeting for the first time. It breaks the ice instantly and gives people a shared story. Scott arrives ready to perform with zero setup, fitting into whatever the DMC has planned.",
  ],
  "west-hollywood--golf-tournament-magician": [
    "Golf tournaments near West Hollywood often host their post-round receptions and awards dinners at WeHo venues — hotel event spaces, private clubs, and restaurants along the Strip. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players engaged and talking. The magic at the 19th hole consistently becomes the most talked-about part of the day.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a WeHo venue for the evening program, having the entertainment and the host be the same person means the energy stays consistent all night.",
  ],
  "west-hollywood--resident-event-magician": [
    "West Hollywood's luxury apartment communities and condo buildings want resident events that match the neighborhood's energy — creative, social, and worth showing up for. Scott's close-up magic gets residents genuinely interacting, not just standing around a pool deck making small talk. The reactions are real and contagious — someone on one side of the lounge gasps, and suddenly everyone wants to see what's happening.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just polished entertainment that fits into whatever space your building has — a rooftop bar, a courtyard, a clubroom. Property managers in WeHo report stronger turnout and more engaged residents when White Rabbit is on the calendar.",
  ],
  // ── Malibu ──────────────────────────────────────────────────────────
  "malibu--corporate-event-magician": [
    "Corporate events in Malibu don't look like corporate events anywhere else. They happen at private estates along PCH, oceanview properties with 30 guests max, and beachfront homes where the CEO is also the host. Scott has performed for network executives and entertainment industry clients at Malibu estates where the magic had to match the setting — relaxed, intimate, and polished enough for a room full of people who run studios and greenlight shows.",
    "Netflix and Disney executives have hired Scott for private dinners in Malibu. The format that works best here is roaming close-up magic during cocktail hour on the deck, then a seated show after dinner while the sun goes down. Small guest lists mean every person in the room gets a personal experience. That's the advantage of Malibu events — the intimacy makes the magic hit harder.",
  ],
  "malibu--private-party-magician": [
    "Private parties in Malibu happen at home. Beachfront estates, canyon properties, PCH compounds where the driveway is longer than most city blocks. The guest list is usually 20 to 50 — entertainment executives, producers, neighbors who happen to be household names. Scott has performed at these gatherings and the magic works because the setting is already extraordinary. Adding close-up magic to a Malibu sunset dinner takes an incredible evening and makes it one people talk about for months.",
    "The vibe in Malibu is relaxed luxury. Nobody's dressed up, nobody's performing — except Scott. He moves through the room with a deck of cards and whatever guests have on them, creating impossible moments in a setting that already feels like a movie. The reactions are real, unguarded, and exactly what Malibu hosts are looking for: genuine wonder without any production overhead.",
  ],
  "malibu--wedding-magician": [
    "Malibu weddings happen at some of the most beautiful venues in the country — cliffside estates, beachfront properties, and intimate restaurants along PCH. The entertainment has to belong in that setting. White Rabbit's cocktail hour magic is built for Malibu's outdoor, relaxed energy: Scott moves through the crowd creating small moments of wonder for groups of four to six, connecting guests from both families while the ocean does the rest.",
    "Guest lists in Malibu tend to run smaller and more intimate than Westside LA weddings, which means every guest gets more time with Scott. Couples who choose Malibu want the evening to feel effortless and personal — that's exactly what close-up magic delivers. No stage, no microphone, just elegant interaction that feels like part of the evening, not an interruption.",
  ],
  "malibu--close-up-magician": [
    "Close-up magic in Malibu works because the events here are intimate by design. Dinner parties at beachfront estates, cocktail hours on ocean-facing decks, small gatherings where everybody knows everybody — or is about to. Scott moves through these spaces performing for groups of three to six, and in a room of 30 people, everyone gets a personal experience. That's the Malibu advantage.",
    "The crowd here is entertainment industry, mostly. Producers, executives, showrunners — people who create spectacle for a living and are genuinely hard to catch off guard. Close-up magic cuts through that because it happens in their hands. There's no screen, no editing, no camera angle to hide behind. Just something impossible happening six inches from their face. That's what gets a Netflix exec to put down their phone.",
  ],
  "malibu--private-magic-show": [
    "The Private Magic Show in a Malibu estate feels like discovering a secret performance in someone's living room. Scott brings professional lighting, a curated soundtrack, and 45 minutes of material that turns a beachfront living room or a canyon great room into an intimate theater. The show is designed to feel like a private members' club experience — elegant, interactive, and built for audiences of 20 to 80 who are used to seeing the best of everything.",
    "For Malibu clients, the show often follows an hour of roaming close-up magic during cocktail hour on the deck. Guests get two completely different experiences in one evening — the personal, in-your-hands magic while the sun sets, then a full theatrical performance after dinner. Netflix and Disney executives have hosted this format, and the reactions are the same every time: standing ovations from people who don't stand for much.",
  ],
  "malibu--holiday-party-magician": [
    "Holiday parties in Malibu are private affairs — estate dinners, beachfront gatherings, intimate celebrations where the guest list is tight and the host cares about every detail. Scott has performed holiday events at Malibu homes where the crowd was entertainment executives and industry friends winding down the year. The close-up magic during cocktail hour gives people something real to bond over, which matters when the guest list is small enough that every interaction counts.",
    "The Malibu holiday format — standing drinks on the deck, then a seated dinner inside — is perfect for White Rabbit. Scott works the outdoor cocktail hour, then can transition into a Private Magic Show after dinner. It gives the evening a shape and a climax that a playlist alone can't provide.",
  ],
  "malibu--charity-gala-magician": [
    "Charity events in Malibu tend to be intimate — private estate fundraisers, beach house benefit dinners, and donor gatherings where the guest list is 40 to 80 of the host's closest connections. Scott's cocktail-hour magic warms the room before the ask in a way that speeches can't. When people are laughing and genuinely connecting, the generosity follows. It's a simple equation, and it works every time.",
    "White Rabbit has served as MC and auctioneer at fundraisers, including a record-breaking event for FosterAll. For Malibu nonprofits hosting at private estates, having the entertainment and the emcee be the same person keeps the evening tight and the energy consistent from cocktails through the live auction.",
  ],
  "malibu--trade-show-magician": [
    "Brand activations and experiential events in Malibu attract a high-end audience — entertainment executives, luxury brand clients, and the Malibu community itself. Scott has worked private brand events where the close-up magic drew attention naturally, gave people a reason to stay and engage, and created organic social content that felt authentic to the setting. No booth, no banner — just impossible moments happening on a Malibu deck.",
    "The format works for product launches at beachfront properties, intimate brand dinners, and VIP experiences where the guest list is small and every impression matters. Scott reads the room and matches the relaxed Malibu energy while delivering reactions that are anything but relaxed.",
  ],
  "malibu--rehearsal-dinner-magician": [
    "Malibu rehearsal dinners happen at oceanfront restaurants, estate dining rooms, and private homes along PCH. The guest list is tight — immediate family and wedding party, maybe 25 to 40 people, many of them meeting for the first time. Scott's close-up magic is the perfect icebreaker for this room. Within minutes, the groom's best friend and the bride's mother are laughing together over something impossible that just happened in someone's hands.",
    "A full Private Magic Show at the rehearsal dinner turns the evening into its own event — not just a prelude to the wedding, but a standalone experience that both families will remember independently. Couples who book this often add cocktail hour magic at the reception the next day.",
  ],
  "malibu--halloween-party-magician": [
    "Halloween in Malibu means private estate parties with ocean views and a crowd that's ready for something genuinely eerie. White Rabbit leans into the uncanny — mentalism, mind reading, coincidences that feel supernatural. In a Malibu canyon house at night, with the fog rolling in off the Pacific, the atmosphere does half the work. Scott has performed Halloween events at Malibu estates where the magic felt less like a performance and more like something the house itself was doing.",
    "The format works for intimate costumed dinners, estate cocktail parties, and late-night gatherings where the setting is already atmospheric. Scott reads the room and adjusts — darker, more psychological, the kind of effects that stick with people on the drive home down PCH.",
  ],
  "malibu--christmas-party-magician": [
    "Christmas parties in Malibu are private, intimate, and nothing like the corporate holiday parties happening in the rest of LA. They're estate dinners for 20 to 50, beachfront gatherings where the host has thought about every detail. Scott's close-up magic during cocktail hour gives the evening a centerpiece — something real for guests to bond over while the fire pit burns and the ocean does its thing.",
    "For New Year's Eve, Scott brings a different energy — higher tempo, bigger reactions, countdown-ready. Whether it's a seated dinner at a PCH estate or a standing reception overlooking the water, White Rabbit makes your Malibu holiday event the one people remember.",
  ],
  "malibu--premiere-red-carpet-magician": [
    "Malibu hosts more private industry events than people realize — screening after-parties at producer estates, wrap celebrations at beachfront homes, and intimate gatherings where the guest list is the kind of people whose names roll in the credits. Scott has performed at these events and the close-up magic works because it bypasses the industry filter. It happens in your hands, not on a screen, and the reactions from producers and talent are genuine and involuntary.",
    "White Rabbit has consulted for America's Got Talent and Disney Channel, and performed for executives at Netflix and Paramount. That credibility means Scott belongs in these Malibu rooms — he reads the energy, keeps it low-key, and delivers something that genuinely surprises people whose entire career is built on creating surprises.",
  ],
  "malibu--dmc-entertainment": [
    "Destination management companies bringing VIP groups to Malibu want entertainment that matches the exclusivity of the setting. White Rabbit fits into curated Malibu itineraries: welcome reception magic at a beachfront estate, dinner performances at private venues along PCH, and intimate experiences that give groups something they can't get anywhere else. Scott arrives ready to perform with zero setup — no stage, no AV, nothing that disrupts the setting.",
    "The magic works especially well during networking dinners where attendees from different offices or cities are meeting for the first time. Malibu's relaxed energy makes people open and present, and the close-up magic takes advantage of that. Guests bond faster, connect deeper, and leave with a shared story.",
  ],
  "malibu--golf-tournament-magician": [
    "Golf tournaments near Malibu — at clubs throughout the coastal corridor — often host post-round receptions at private venues in the area. White Rabbit fills the gap between the last putt and the awards dinner with roaming close-up magic that keeps players engaged and talking. In Malibu's relaxed setting, the magic feels like a natural extension of the day — conversational, personal, and impossible to ignore.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Malibu venue for the evening program, having the entertainment and the host be the same person keeps the night moving and the energy consistent.",
  ],
  "malibu--resident-event-magician": [
    "Malibu's residential communities — gated estates, beachfront compounds, and private enclaves along PCH — want resident events that match the exclusivity of the address. Scott's close-up magic gets neighbors genuinely interacting in a community where privacy is the default. The reactions are real and they carry — someone on one side of the terrace gasps, and suddenly the whole gathering shifts toward whatever just happened.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the group performing for small clusters. No stage, no setup, no AV. Just polished entertainment that fits the Malibu setting — intimate, personal, and designed for a crowd that values quality over spectacle. HOA event coordinators report higher attendance and genuine community connection when White Rabbit is on the calendar.",
  ],
  // ── Hollywood ───────────────────────────────────────────────────────
  "hollywood--corporate-event-magician": [
    "Corporate events in Hollywood are industry events, whether they call themselves that or not. The guest list is talent agencies, production companies, studio marketing teams, and the people who greenlight what everyone else watches. Scott has performed for Morgan Stanley at a private client event in the Hollywood Hills, and at industry dinners and corporate receptions throughout the neighborhood where the crowd was mostly people who create entertainment for a living — and they reacted the same way everyone does when close-up magic happens six inches from their face: total, unguarded amazement.",
    "Hollywood corporate events happen at venues like the Hollywood Roosevelt, NeueHouse, and private screening rooms throughout the neighborhood. The entertainment needs to match that setting — sharp, current, and zero cheese. Scott's close-up magic and mentalism are built for rooms where everyone thinks they've seen everything. They haven't seen this.",
  ],
  "hollywood--private-party-magician": [
    "The Hollywood Hills house party scene is a real market. Wrap parties after a show gets picked up, pilot pickup celebrations, birthday dinners for producers and showrunners — small groups of 30 to 80 in stunning homes with city views. Scott has performed at these gatherings and the magic works because it matches the energy of the room: intimate, fun, and designed for people who are already in a good mood and ready to be amazed.",
    "The crowd at Hollywood Hills house parties is entertainment industry, mostly. Writers, directors, actors, and the agents and managers who keep it all moving. They're smart, they're skeptical, and they love when someone proves them wrong. Scott's close-up magic gives them exactly that — impossible moments happening in their hands, in their living room, with their drink. The reactions are loud, real, and contagious.",
  ],
  "hollywood--wedding-magician": [
    "Hollywood weddings happen at venues with character — the Hollywood Roosevelt, historic theaters, rooftop spaces with skyline views. The couples who choose Hollywood want their wedding to feel like an event, not a template. White Rabbit's cocktail hour magic fits that vision: Scott moves through the crowd creating small moments of wonder that connect guests from both sides before dinner, without a stage or a microphone.",
    "Guest lists at Hollywood weddings often include industry people alongside family and college friends — a mix that can be tricky to blend. Close-up magic solves that instantly. Within minutes, a showrunner and someone's aunt from Ohio are grabbing each other's arms over the same impossible card trick. That's the icebreaker no playlist can provide.",
  ],
  "hollywood--close-up-magician": [
    "Close-up magic in Hollywood works because the audience brings something most crowds don't: genuine curiosity about how things are made. Producers, editors, writers — they watch the hands, they think about the method, they're sure they'll catch something. They never do. Scott has performed for industry crowds in the Hollywood Hills where the sharpest minds in the room spent the whole night trying to figure out one effect and couldn't get close.",
    "The format fits Hollywood events perfectly — standing cocktail hours, house parties in the Hills, seated dinners at restaurants like Mother Wolf or Musso & Frank. Scott moves through the room performing for small groups, and the reactions carry. One table loses their mind, the next one waves him over. In a 60-minute cocktail hour, he reaches 80 to 120 guests.",
  ],
  "hollywood--private-magic-show": [
    "The Private Magic Show in a Hollywood Hills living room or a private event space at the Hollywood Roosevelt feels like stumbling into a secret show that wasn't on the schedule. Scott brings professional lighting, a curated soundtrack, and 45 minutes of material that gets standing ovations from audiences who work in show business. The show is theatrical, interactive, and built for groups of 20 to 120 who know good production when they see it.",
    "For Hollywood clients, the show often follows an hour of roaming close-up magic during the cocktail hour. Guests get two completely different experiences in one evening — the personal, in-your-hands magic while people mingle, then a full performance that pulls the room together. Industry audiences love this format because they appreciate the craft behind it.",
  ],
  "hollywood--holiday-party-magician": [
    "Holiday parties in Hollywood are wrap-season celebrations, agency parties, and production company end-of-year events. The crowd has been to a hundred holiday parties and most of them blur together. Scott's close-up magic during cocktail hour is the thing that makes yours different — real reactions, real connection, and something people actually text each other about the next morning instead of just another open bar they attended.",
    "The Hollywood holiday format — standing receptions at venues like the Hollywood Roosevelt or private spaces in the Hills — is perfect for roaming magic. Scott works the room, and by the time dinner or speeches happen, the energy is completely different than when people walked in. That's the part no DJ can deliver.",
  ],
  "hollywood--charity-gala-magician": [
    "Hollywood charity events attract donors from the entertainment industry — people who attend fundraisers regularly and know what a going-through-the-motions evening feels like. Scott's cocktail-hour magic warms the room before the ask in a way that a cocktail hour alone can't. When people are laughing and genuinely connecting over something they just witnessed, the generosity follows naturally.",
    "White Rabbit has served as MC and auctioneer at fundraisers, including a record-breaking event for FosterAll. For Hollywood nonprofits, having the entertainment and the emcee be the same person keeps the evening moving without awkward transitions between the fun part and the fundraising part.",
  ],
  "hollywood--trade-show-magician": [
    "Brand activations and experiential events in Hollywood attract an audience that works in the entertainment industry and knows production value when they see it. Scott has worked activations where the close-up magic drew crowds, held attention, and created organic social content — real reactions, nothing staged. He weaves product messaging into routines so naturally that people engage with the brand without realizing that's what's happening.",
    "The format works for pop-up events on Hollywood Boulevard, brand launches at hotel event spaces, and private showroom activations. Hollywood crowds are tough to stop — they're moving fast and they've seen a lot. Scott gives them a reason to stop, stay, and pay attention.",
  ],
  "hollywood--rehearsal-dinner-magician": [
    "Hollywood rehearsal dinners happen at restaurants and private dining rooms throughout the neighborhood — intimate spaces where both families are in the same room for the first time. Scott's close-up magic breaks the ice faster than any cocktail hour small talk. Within minutes, the groom's writing partner and the bride's parents are laughing together over something impossible that just happened in someone's hands.",
    "A full Private Magic Show at the rehearsal dinner — in a private room at a Hollywood restaurant or a Hills living room — gives the closest people in the couple's life a high-energy experience the night before the big day. It turns the rehearsal dinner into its own standalone event, not just a warmup.",
  ],
  "hollywood--halloween-party-magician": [
    "Halloween in Hollywood is practically a professional obligation. The Hills house party scene goes all-in, and the crowd expects something that matches the production value of the costumes and the setting. White Rabbit leans into the uncanny — mentalism, mind reading, eerie coincidences that feel genuinely supernatural. Scott has performed Halloween events at Hollywood Hills estates where the city lights below and the fog rolling through the canyon made the whole thing feel like a scene from a movie nobody wrote.",
    "The format works for costumed cocktail parties, intimate dinner shows with a dark aesthetic, and roaming performances through homes where every room has a different vibe. Scott reads the atmosphere and adjusts — darker, more psychological, the kind of effects that make people look at each other and say 'how is that possible.'",
  ],
  "hollywood--christmas-party-magician": [
    "Christmas parties in Hollywood are production company wrap parties, agency celebrations, and industry gatherings where the year's wins get toasted properly. Scott's close-up magic during cocktail hour gives people something real to bond over — not work talk, not industry gossip, just genuine amazement happening in their hands. The reactions cut through the end-of-year fatigue and get the room actually engaged.",
    "For New Year's Eve, Scott brings a different energy — higher tempo, bigger reactions, countdown-ready. Whether it's a seated dinner in the Hills or a standing reception at a Hollywood venue, White Rabbit is the reason your holiday event is the one people reference for the rest of January.",
  ],
  "hollywood--premiere-red-carpet-magician": [
    "Hollywood premieres, screening after-parties, and industry wrap events are Scott's backyard. He's performed at private events throughout the neighborhood where the audience was the people who make the shows — writers' room celebrations, pilot pickup parties, and post-premiere gatherings where the guest list reads like a credits scroll. Close-up magic works in these rooms because it's not something you watch from a distance. It happens in your hands, and the reactions from people who create entertainment professionally are the realest you'll see.",
    "White Rabbit has consulted for America's Got Talent and Disney Channel, and performed for executives at Netflix, Paramount, and Lionsgate. That credibility means Scott belongs in Hollywood industry rooms. He reads the energy, matches the crowd, and delivers something that genuinely surprises people who spend their careers producing surprises for everyone else.",
  ],
  "hollywood--dmc-entertainment": [
    "Destination management companies bringing groups to Hollywood want entertainment that captures the neighborhood's energy — creative, industry-adjacent, and nothing generic. White Rabbit fits into curated Hollywood itineraries: welcome reception magic at the Hollywood Roosevelt, dinner performances at private venues in the Hills, and VIP experiences that give groups something they'll talk about for the rest of the trip.",
    "The magic works especially well during networking moments where attendees from different offices are meeting for the first time. Hollywood's casual energy makes people open and present, and close-up magic takes advantage of that. Guests bond quickly and leave with a shared story that has nothing to do with the conference agenda.",
  ],
  "hollywood--golf-tournament-magician": [
    "Golf tournaments near Hollywood often host their post-round receptions and awards dinners at venues in the area — hotel event spaces, private clubs, and restaurants. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players engaged. The magic at the 19th hole consistently becomes the most talked-about part of the day, especially with an industry crowd that's competitive about everything, including who can figure out the trick first. Nobody can.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Hollywood venue for the evening program, having the entertainment and the host be the same person keeps the night moving and the energy consistent.",
  ],
  "hollywood--resident-event-magician": [
    "Hollywood's luxury apartment buildings and condo communities — along Franklin, in the Hills-adjacent high-rises, and throughout the neighborhood — want resident events that actually get people to show up. The typical resident here works in entertainment or adjacent industries, and they've seen enough generic event programming to know what's worth their time. Scott's close-up magic gives them a reason to come downstairs — and a reason to stay.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV. Just polished entertainment that fits into whatever space your building has — a rooftop lounge, a pool deck, a lobby. Property managers report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar.",
  ],
  // ── Pasadena ────────────────────────────────────────────────────────
  "pasadena--corporate-event-magician": [
    "Corporate events in Pasadena have a different feel than anything on the Westside. The venues are historic — places like The Langham Huntington, where Scott has performed a private show — and the crowd tends to be more traditional. Law firms, financial advisors, old-line companies that have been hosting holiday dinners and client appreciation events in the same ballrooms for decades. The entertainment needs to match that tone: polished, smart, and respectful of the room without being boring.",
    "Scott's close-up magic works well in Pasadena corporate settings because it's refined but never stuffy. He reads the room, adjusts his energy, and gives guests something genuinely surprising without disrupting the evening's flow. The reactions from Pasadena crowds are interesting — they start reserved and end up being some of the loudest in the room once the magic hits.",
  ],
  "pasadena--private-party-magician": [
    "Private parties in Pasadena tend to happen at beautiful older homes — Craftsman estates, properties near the Arroyo, houses in the San Rafael hills with views that go on forever. The guest lists are smaller and more curated than a typical LA party. Twenty to fifty people, everyone knows each other, and the host wants the evening to feel special without being overdone. Scott's roaming close-up magic fits that energy perfectly — intimate, conversational, and designed for groups where every guest matters.",
    "The Pasadena crowd is a different audience than Hollywood or WeHo. They're refined, they appreciate craft, and they respond to magic that's smart rather than flashy. Scott has performed for families in the area who've been hosting dinner parties for years and wanted something their guests hadn't seen before. The reactions are genuine, and the conversations that start during the magic carry through the rest of the night.",
  ],
  "pasadena--wedding-magician": [
    "Pasadena weddings have a classic elegance that's hard to find in other parts of LA. Historic venues, traditional ceremonies, guest lists where multiple generations sit at the same table. Scott has performed cocktail hour magic at a wedding at The Langham Huntington, and the format works beautifully in these settings — he moves through the crowd creating moments of wonder that bring together families who are meeting for the first time.",
    "The magic is designed for mixed-age groups, which matters in Pasadena more than most markets. Grandparents and college friends get the same quality of experience, just calibrated differently for each group. Scott also offers a Private Magic Show for rehearsal dinners — a high-energy, intimate performance for the immediate family and wedding party that sets the tone for the entire weekend.",
  ],
  "pasadena--close-up-magician": [
    "Close-up magic in Pasadena works because the events here tend to be intimate and conversational. Standing receptions at historic venues, seated dinners at country clubs, cocktail hours in private gardens. Guests are close together, engaged in real conversation, and open to something unexpected. Scott moves through these spaces performing for small groups with cards, coins, borrowed objects — and the reactions carry across the room.",
    "The Pasadena audience appreciates craftsmanship. They notice the details, they ask smart questions, and they're genuinely impressed when something impossible happens right in front of them. Scott has performed at The Langham Huntington and at private events throughout the Rose Bowl area, and the feedback from Pasadena crowds is consistently among the strongest he gets.",
  ],
  "pasadena--private-magic-show": [
    "The Private Magic Show in a Pasadena setting — a ballroom at The Langham, a private dining room at a country club, or a living room in a historic home — has a specific energy. The audience sits close, the lighting is cinematic, and the show is built for a crowd that appreciates sophistication. Scott performed a private show at The Langham Huntington, and the intimate format paired with Pasadena's classic venues creates something that feels like a members-only event.",
    "The show runs 30 to 45 minutes and includes mentalism, audience participation, and a finale that gets standing ovations. For Pasadena events, the tone skews elegant — less nightclub, more supper club. Scott brings his own lighting and sound, and the production quality matches venues that have their own standards for what belongs in the room.",
  ],
  "pasadena--mentalist": [
    "Mentalism plays well in Pasadena because the crowd pays attention. They're analytical, they're curious, and they don't let things go easily. When Scott reads someone's thought or predicts a choice before it's made, Pasadena audiences lean in harder than most. They want to understand how it works, and the fact that they can't is what makes it stick.",
    "Corporate dinners, fundraiser galas, and private estate events in the Pasadena area are natural fits for mentalism. The effects are cerebral, the presentation is refined, and the audience participation feels genuine because Scott pulls from the crowd rather than using plants or setups. It's the kind of entertainment that matches Pasadena's intellectual energy.",
  ],
  "pasadena--corporate-event-entertainer": [
    "Pasadena corporate events — holiday parties at The Langham, client dinners at country clubs, awards galas for professional associations — need entertainment that respects the room. Scott's close-up magic during cocktail hour gives guests a shared experience that breaks the ice without being gimmicky. The magic is polished, the interactions are warm, and the energy builds naturally as word spreads through the room.",
    "For companies hosting annual events in Pasadena, White Rabbit becomes part of the tradition. Several clients rebook year after year because the entertainment consistently gets mentioned in post-event feedback. The Pasadena corporate crowd values quality and consistency, and Scott delivers both.",
  ],
  "pasadena--charity-gala-magician": [
    "Charity galas in Pasadena are serious fundraising events — old-money families, established nonprofits, and donor lists that go back decades. The entertainment needs to feel worthy of the cause and the crowd. Scott's cocktail hour magic creates the kind of emotional warmth that makes donors feel connected to each other and to the mission. By the time the ask comes, the room is already in a generous mood.",
    "Scott has performed at fundraising events at venues throughout Pasadena, including The Langham Huntington. The format works especially well for galas: roaming magic during the reception builds energy, and if there's a live auction, the crowd is already buzzing by the time the auctioneer starts. Pasadena's philanthropic community responds well to entertainment that feels sophisticated rather than showy.",
  ],
  "pasadena--holiday-party-magician": [
    "Holiday parties are a big part of Pasadena's corporate and social calendar. Companies host annual celebrations at The Langham, at country clubs near the Rose Bowl, and at private estates in San Marino and Linda Vista. Scott's close-up magic turns the usual holiday party formula into something people actually talk about afterward. He works the room during cocktail hour, giving small groups a few minutes of magic that gets real reactions — not polite smiles, real ones.",
    "The Pasadena holiday crowd appreciates tradition, but they also appreciate being surprised. Scott's magic threads that needle: it's classy enough for a seated dinner with the firm's partners and fun enough to get the holiday party committee excited about next year. December dates in the Pasadena area fill early, especially for venues like The Langham.",
  ],
  "pasadena--trade-show-magician": [
    "Trade shows and conventions at the Pasadena Convention Center draw a specific crowd — attendees who've been walking the floor all day and need a reason to stop at your booth. Scott's close-up magic creates that reason. Within minutes, a small crowd forms, attention spans reset, and your team has a captive audience that's already in a good mood. The magic can incorporate your product or messaging naturally, so the entertainment serves the business goal.",
    "The format works for expos, industry conferences, and product launches in the Pasadena area. Scott's presence makes your booth the one people remember at the end of the day. Exhibitors report significantly more foot traffic and higher-quality conversations when White Rabbit is part of their booth strategy.",
  ],
  "pasadena--rehearsal-dinner-magician": [
    "Rehearsal dinners in Pasadena happen at historic restaurants, private dining rooms at The Langham, and family homes that have hosted generations of gatherings. The guest list is small — immediate family and the wedding party — and the evening is supposed to feel warm and personal. Scott's close-up magic is a natural fit: he moves table to table creating moments that bring both families together before anyone walks down the aisle.",
    "For couples hosting their rehearsal dinner in Pasadena, Scott also offers the full Private Magic Show — a 30- to 45-minute performance that gives the intimate group a high-energy, shared experience the night before the wedding. It sets the tone for the whole weekend and gives guests stories to tell that have nothing to do with seating charts.",
  ],
  "pasadena--halloween-party-magician": [
    "Halloween in Pasadena has its own character — the neighborhood goes all in on atmosphere, from decorated Craftsman porches to themed dinner parties in historic homes. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural in a candlelit room. It's sophisticated dark wonder, not costume-store gimmicks.",
    "The format works for adult Halloween parties, themed dinner events, and cocktail gatherings where the host wants the entertainment to match the atmosphere. Pasadena's older homes provide the perfect setting — there's already mystery in the architecture. Scott just adds to it.",
  ],
  "pasadena--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Pasadena are classic celebrations — seated dinners at country clubs, holiday gatherings at The Langham, and house parties in the neighborhoods around the Rose Bowl. Scott's close-up magic during cocktail hour gives guests something warm and communal to bond over. The reactions are genuine, and they set the tone for the rest of the evening.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's an intimate dinner for 30 or a standing reception for 200, White Rabbit makes your Pasadena holiday event the one people talk about well into the new year. December dates fill fast in this market.",
  ],
  "pasadena--premiere-red-carpet-magician": [
    "Pasadena hosts industry events tied to the Rose Bowl, major conventions, and award-season gatherings that draw entertainment industry professionals from across LA. Scott's close-up magic works at after-parties, VIP receptions, and private gatherings where the crowd includes executives, producers, and industry decision-makers. The magic is polished enough for any venue in the area and interactive enough to break through the usual industry small talk.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Lionsgate, and that credibility carries weight in rooms full of entertainment professionals. Scott reads the energy and matches the crowd — Pasadena industry events have a different rhythm than Hollywood, and the magic adjusts accordingly.",
  ],
  "pasadena--dmc-entertainment": [
    "Destination management companies bringing groups to Pasadena — for the Rose Bowl, for conventions, for corporate retreats — want entertainment that captures the area's character without feeling touristy. White Rabbit fits into curated Pasadena itineraries: welcome reception magic at The Langham, dinner performances at private venues, and VIP experiences that give groups something memorable during their downtime.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. Pasadena's relaxed, refined energy makes people open and present, and close-up magic takes advantage of that. Guests bond quickly and leave with a shared story that has nothing to do with the conference agenda.",
  ],
  "pasadena--golf-tournament-magician": [
    "Golf tournaments near Pasadena — Brookside, Annandale, courses throughout the San Gabriel Valley — host their post-round receptions at clubhouses and nearby venues. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Pasadena venue for the evening program, having entertainment and hosting handled by the same person keeps the night moving and the energy consistent. The Pasadena golf crowd responds well to magic that's smart and social — it fits the clubhouse atmosphere.",
  ],
  "pasadena--resident-event-magician": [
    "Pasadena's luxury residential buildings and condominium communities want resident events that actually get people out of their units. The typical resident here is a professional, often older and more established than renters on the Westside, and they've seen enough generic event programming to know what's worth their evening. Scott's close-up magic gives them a reason to come downstairs — and a reason to stay.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just polished entertainment that fits into whatever space your building has — a courtyard, a rooftop terrace, a clubroom. Property managers in Pasadena report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar.",
  ],
  // ── Santa Monica ────────────────────────────────────────────────────
  "santa-monica--corporate-event-magician": [
    "Corporate events in Santa Monica feel different from the rest of LA. The dress code is looser, the venues lean into the ocean, and the guest lists are full of tech founders, startup teams, and creative agency people who spend their days in open-plan offices along Silicon Beach. Scott's close-up magic works well in this environment because it matches the energy — smart, interactive, and zero formality. He reads the room and gives groups something genuinely surprising without slowing down the evening.",
    "Beachfront corporate events, oceanview rooftop receptions, and company parties at hotels along Ocean Avenue are the typical Santa Monica bookings. The crowd is younger than most corporate audiences and harder to impress with generic entertainment. They've done the photo booth. They've done the DJ. Close-up magic and mentalism hit different because it's personal, it's live, and nobody can figure out how it works.",
  ],
  "santa-monica--private-party-magician": [
    "Private parties in Santa Monica have a casual-luxury energy that's hard to fake. The host spent real money on the evening, but everyone's in jeans and the shoes came off an hour ago. Scott fits right into that vibe — he shows up polished but relaxed, reads the room, and starts performing for small groups without any announcement. The magic is close-up, conversational, and designed for people standing around with a drink, not sitting in rows watching a stage.",
    "Santa Monica house parties, birthday dinners at oceanview restaurants, and rooftop gatherings near the pier are all natural fits. The crowd here tends to be younger professionals, creative types, and tech people who want their party to feel different without being overdone. Scott gives them that — genuine reactions, real connection between guests, and a story to tell the next morning.",
  ],
  "santa-monica--wedding-magician": [
    "Santa Monica weddings tend to be relaxed and beautiful — outdoor ceremonies near the water, cocktail hours with ocean views, receptions where the breeze carries the music. Scott's cocktail hour magic fits that atmosphere perfectly. He moves through the crowd performing for small groups while the sun sets behind them, and the reactions spread naturally. Guests bond over something unexpected, and by the time dinner starts, the energy in the room is warm and connected.",
    "The casual-luxury vibe of a Santa Monica wedding means the entertainment should feel effortless, not produced. Scott's close-up magic is exactly that — no stage, no microphone, just impossible things happening in people's hands while they hold a glass of champagne. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party an intimate, high-energy experience the night before.",
  ],
  "santa-monica--close-up-magician": [
    "Close-up magic in Santa Monica works because the events here are built around standing, mingling, and conversation. Rooftop receptions, beachfront cocktail hours, tech company happy hours — guests are in small groups with drinks, talking, and open to something unexpected. Scott moves through these spaces performing for clusters of four to eight people, and the reactions carry. One group gasps, the next one waves him over.",
    "The Santa Monica crowd — younger professionals, startup founders, creative agency people — brings a specific energy to close-up magic. They're curious, they ask questions, and they react big when something genuinely impossible happens in their hands. Cards, borrowed objects, mentalism effects that make people grab their friend's arm. It's the kind of entertainment that gives people something real to talk about, which is more than most event programming can say.",
  ],
  "santa-monica--private-magic-show": [
    "The Private Magic Show in a Santa Monica setting — a private event space, an oceanview suite, a living room in a house near the bluffs — feels like something you stumbled into that you weren't supposed to find. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations. The show is built to feel cinematic and intimate, which pairs well with Santa Monica's laid-back luxury.",
    "For Santa Monica events, the Private Magic Show often follows roaming cocktail hour magic, giving guests two completely different experiences in one night. The close-up magic is social and spontaneous. The show is theatrical and builds to a finish that gets people out of their seats. Together, they cover the full evening and leave guests talking about it on the drive home.",
  ],
  "santa-monica--mentalist": [
    "Mentalism plays well with the Santa Monica crowd because they're analytical. Tech founders, engineers, startup people — they want to figure it out, and the fact that they can't is what makes it stick. When Scott reads a thought or predicts a choice before it's made, the reaction from a room full of smart, skeptical people is louder than you'd expect. They lean in harder because they think they should be able to crack it.",
    "Corporate dinners, company offsites, and private events along the Santa Monica coast are natural fits for mentalism. The effects are cerebral, the presentation is clean, and the audience participation is genuine. It's the kind of entertainment that matches the intellectual energy of Silicon Beach without feeling like a corporate program.",
  ],
  "santa-monica--corporate-event-entertainer": [
    "Santa Monica corporate events — tech company parties, agency celebrations, startup milestones — need entertainment that doesn't feel like entertainment. The crowd here is allergic to anything that feels forced or corporate. Scott's close-up magic during cocktail hour gives guests a shared experience that breaks the ice naturally. No announcements, no stage, just real reactions happening in small groups that spread across the room.",
    "For companies along Silicon Beach, White Rabbit is the kind of booking that shows up in Slack channels the next morning. People post about it, they tag each other, they try to describe what happened and can't quite get there. That's the value — it creates genuine buzz, not the polite kind.",
  ],
  "santa-monica--charity-gala-magician": [
    "Charity galas in Santa Monica bring together the local tech community, creative professionals, and established donors who care about the cause and care about how the evening feels. Scott's cocktail hour magic creates the kind of energy that makes donors feel connected to each other and to the room. By the time the ask comes, people are already in a generous mood because the evening has been genuinely special, not just another fundraiser with a silent auction.",
    "The format works well at Santa Monica venues — hotel ballrooms, oceanview event spaces, private homes near the bluffs. Roaming magic during the reception builds warmth, and if there's a live auction, the crowd is already engaged by the time bidding starts. The entertainment serves the fundraising goal without ever feeling like a sales pitch.",
  ],
  "santa-monica--holiday-party-magician": [
    "Holiday parties at Santa Monica tech companies and creative agencies tend to be less formal than their DTLA or Beverly Hills counterparts — but the expectations are just as high. The team has had a long year, and the party needs to feel worth showing up for. Scott's close-up magic gives people something to bond over that isn't work talk. Real reactions, real laughter, and a shared experience that makes the evening feel different from every other holiday party they've attended.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner overlooking the ocean or a rooftop reception for 200, White Rabbit makes your Santa Monica holiday event the one people actually remember. December dates fill fast, especially in this market.",
  ],
  "santa-monica--trade-show-magician": [
    "Trade shows and expos in Santa Monica draw a tech-savvy, attention-scarce crowd that's been walking the floor all day. They've seen every booth, every demo, every branded giveaway. Scott's close-up magic stops them. Within minutes, a small crowd forms, attention spans reset, and your team has a captive audience that's already in a good mood. The magic can incorporate your product or messaging naturally, so the entertainment serves the business goal without feeling forced.",
    "The format works for conferences, product launches, and industry events in the Santa Monica area. Exhibitors report significantly more foot traffic and higher-quality conversations when White Rabbit is part of their booth strategy. For a crowd that prides itself on being hard to impress, that says something.",
  ],
  "santa-monica--rehearsal-dinner-magician": [
    "Rehearsal dinners in Santa Monica happen at oceanview restaurants, private dining rooms at hotels along the coast, and family homes near the beach. The guest list is small — immediate family and the wedding party — and the evening is supposed to feel warm and personal. Scott's close-up magic is a natural fit: he moves table to table creating moments that bring both families together before anyone walks down the aisle.",
    "For couples hosting their rehearsal dinner in Santa Monica, Scott also offers the full Private Magic Show — a 30- to 45-minute performance that gives the intimate group a high-energy, shared experience the night before the wedding. The casual Santa Monica atmosphere paired with a polished show creates something guests remember separately from the wedding itself.",
  ],
  "santa-monica--halloween-party-magician": [
    "Halloween parties in Santa Monica lean into atmosphere — the ocean fog, the cooler weather, the kind of October evening that already feels cinematic. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. It's sophisticated dark wonder, not plastic skulls and jump scares.",
    "The format works for adult Halloween parties, themed dinners, and cocktail gatherings where the host wants the entertainment to match the mood. Santa Monica's beachside setting adds a natural moodiness that most LA neighborhoods don't have in October. Scott leans into that energy and gives guests something that stays with them past the Uber ride home.",
  ],
  "santa-monica--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Santa Monica range from intimate team dinners at oceanview restaurants to full company celebrations at hotels along the coast. Scott's close-up magic during cocktail hour gives guests something warm and communal to bond over — real reactions, real laughter, the kind of shared experience that makes the evening feel special rather than obligatory.",
    "For New Year's Eve, Scott brings higher energy and countdown-ready material. Whether it's 30 people at a private dinner or 200 on a rooftop, White Rabbit makes your Santa Monica holiday event the one people reference well into January. December and NYE dates in Santa Monica fill early — reach out sooner rather than later.",
  ],
  "santa-monica--premiere-red-carpet-magician": [
    "Santa Monica hosts industry screenings, premieres at local theaters, and after-parties that draw entertainment and tech professionals from across the Westside. Scott's close-up magic works at VIP receptions, wrap parties, and private gatherings where the crowd is a mix of creative executives, tech founders, and industry adjacent people who appreciate something unexpected. The magic is polished enough for any venue and interactive enough to break through the usual small talk.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Lionsgate, and that credibility carries weight in rooms where entertainment is the business. Scott reads the energy, matches the crowd, and delivers something that surprises people who spend their careers creating content for everyone else.",
  ],
  "santa-monica--dmc-entertainment": [
    "Destination management companies bringing groups to Santa Monica want entertainment that captures the area's character — the beachfront energy, the Silicon Beach innovation scene, the casual luxury that defines the Westside. White Rabbit fits into curated Santa Monica itineraries: welcome reception magic at oceanview hotels, dinner performances at private restaurants, and VIP experiences during group outings that give attendees something memorable between sessions.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. Santa Monica's relaxed energy makes people open and present, and close-up magic takes advantage of that. Guests bond quickly and leave with a shared story that has nothing to do with the conference agenda.",
  ],
  "santa-monica--golf-tournament-magician": [
    "Golf tournaments along the Santa Monica and Westside coast host their post-round receptions at clubhouses and nearby oceanview venues. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day, especially with a crowd that's competitive about everything.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Santa Monica venue for the evening program, having entertainment and hosting handled by the same person keeps the night moving and the energy consistent.",
  ],
  "santa-monica--resident-event-magician": [
    "Santa Monica's luxury apartment buildings and condo communities — along Ocean Avenue, in the neighborhoods near Montana, and throughout the city — want resident events that actually get people to show up. The typical resident here is a younger professional, often in tech or creative industries, and they need a real reason to come downstairs on a weeknight. Scott's close-up magic gives them that reason and a reason to stay longer than they planned.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just polished entertainment that fits into whatever space your building has — a rooftop lounge, a pool deck, a courtyard. Property managers report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar.",
  ],
  // ── Calabasas ───────────────────────────────────────────────────────
  "calabasas--corporate-event-magician": [
    "Corporate events in Calabasas happen behind gates. Private estates in Hidden Hills, homes in The Oaks, country club dining rooms where the guest list is small and the expectations are enormous. Scott performed for Rolls-Royce in Calabasas — a private VIP event for 30 guests where the magic had to match the brand. That's the standard out here. The crowd is executives, athletes, and families who are used to the best of everything, and they can tell the difference between good entertainment and great entertainment in about ten seconds.",
    "Scott's close-up magic works in Calabasas because it's personal and refined. No stage, no microphone, no production crew taking over someone's living room. Just polished, impossible things happening in people's hands while they hold a glass of wine. The reactions from this crowd are interesting — they start guarded and end up being some of the most vocal audiences Scott works for. When the magic is real, it doesn't matter how many events you've been to.",
  ],
  "calabasas--private-party-magician": [
    "Private parties in Calabasas are estate events. The host has a beautiful home, a curated guest list of 20 to 60 people, and they want the evening to feel extraordinary without being overdone. Scott's roaming close-up magic fits that energy — he arrives early, meets the host, reads the room, and starts performing for small groups once guests settle in. No announcement, no fanfare. Just magic happening naturally as part of the evening.",
    "The Calabasas crowd — entertainment executives, athletes, old-money families in Hidden Hills and The Oaks — has high standards and low patience for anything generic. Milestone birthdays, anniversary celebrations, holiday gatherings — these hosts want their guests to leave saying the party was incredible, and Scott consistently delivers that. The reactions are genuine, and in a community where word travels fast, one great performance leads to the next booking.",
  ],
  "calabasas--wedding-magician": [
    "Weddings in Calabasas tend to be private estate affairs — beautiful properties, manicured grounds, and guest lists where everyone knows each other. Scott's cocktail hour magic fits the intimacy of these events. He moves through the crowd performing for small groups, connecting families who are meeting for the first time, and creating moments of genuine wonder that set the tone for the rest of the evening.",
    "The Calabasas wedding audience expects polish. The venue is perfect, the flowers are perfect, and the entertainment needs to match. Scott's close-up magic is refined, warm, and designed for mixed-age groups where grandparents and college friends are standing in the same circle. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party a high-energy, intimate experience the night before.",
  ],
  "calabasas--close-up-magician": [
    "Close-up magic in Calabasas works because the events are intimate. Small guest counts, private homes, and a crowd that's standing close together with drinks in hand. Scott performs for groups of four to eight people — cards, borrowed objects, mentalism effects that make someone's jaw actually drop. The reactions carry across the room, and in a Calabasas living room or backyard, that means everyone hears it.",
    "The audience here is used to being around high-end experiences, which makes the close-up format even more effective. They're not easily impressed by production value or spectacle. But something impossible happening six inches from their face, with their own ring or their own phone? That gets them every time. Scott performed for Rolls-Royce in Calabasas, and the close-up magic was the centerpiece of the evening because it created real, personal moments for each guest.",
  ],
  "calabasas--private-magic-show": [
    "The Private Magic Show in a Calabasas estate — a living room cleared for 40 guests, a backyard set with bistro lighting, a screening room repurposed for the evening — feels exclusive in a way that matches the neighborhood. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations. The show is designed to feel like a members-only experience, intimate and cinematic.",
    "For Calabasas audiences, the Private Magic Show often pairs with roaming close-up magic during the cocktail hour, giving guests two distinct experiences in one evening. The close-up magic is social and spontaneous. The show is theatrical and builds to a finale that gets people on their feet. Rolls-Royce, Netflix, and Disney executives have all seen Scott perform, and the show reflects that level of craft — every effect is rehearsed, every transition is clean.",
  ],
  "calabasas--mentalist": [
    "Mentalism plays exceptionally well in Calabasas because the audience is sharp. Entertainment executives, business owners, athletes — they're competitive, they pay attention, and they want to figure it out. When Scott reads a thought or predicts a choice before it's made, this crowd reacts harder than most because they genuinely believed they'd catch him. They don't.",
    "Private dinners, estate parties, and milestone celebrations in Hidden Hills and The Oaks are natural fits for mentalism. The effects are cerebral, the presentation is polished, and the audience participation is genuine. It's the kind of entertainment that matches the sophistication of the setting without feeling like a corporate program. People talk about it for weeks.",
  ],
  "calabasas--corporate-event-entertainer": [
    "Corporate entertaining in Calabasas looks different than downtown or the Westside. It happens at private estates, country clubs, and exclusive venues where the guest count is small and the host knows every person in the room. Scott's close-up magic during cocktail hour gives guests a shared experience that breaks through the usual small talk. The reactions are real, the connections are genuine, and the host looks like a genius for booking it.",
    "Scott performed for Rolls-Royce in Calabasas — a brand that doesn't settle for anything less than world-class. That's the expectation out here, and White Rabbit meets it consistently. For companies hosting client events, team celebrations, or executive dinners in the Calabasas area, the entertainment needs to feel worthy of the setting. Close-up magic and mentalism deliver that without any of the setup or production headaches.",
  ],
  "calabasas--charity-gala-magician": [
    "Charity galas in Calabasas draw from the local community of high-net-worth families, entertainment executives, and athletes who are generous but selective about where they spend their evenings. The entertainment needs to feel worthy of their time and the cause. Scott's cocktail hour magic creates genuine warmth in the room — donors connect with each other, the mood becomes generous, and the ask lands differently when people feel that good about the evening.",
    "The format works well at Calabasas country clubs, private estates, and event venues where the guest count is focused. Roaming magic during the reception builds energy, and if there's a live auction, the crowd is already buzzing by the time bidding starts. Scott has also served as MC and auctioneer at fundraising events, keeping the flow tight and the energy high through the giving portion of the evening.",
  ],
  "calabasas--holiday-party-magician": [
    "Holiday parties in Calabasas are private affairs — home gatherings in Hidden Hills, dinner parties in The Oaks, and neighborhood celebrations where the guest list is tight and the evening matters. Scott's close-up magic turns the usual holiday formula into something people actually talk about the next day. He works the room during cocktail hour, giving small groups a few minutes of magic that gets genuine reactions — not polite smiles, the real thing.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready. Whether it's an intimate dinner for 20 or a standing party for 100, White Rabbit makes your Calabasas holiday event the one people reference well into January. December dates fill early, especially for private estate bookings.",
  ],
  "calabasas--trade-show-magician": [
    "Trade shows and brand activations in the Calabasas area attract a premium audience — affluent consumers, industry professionals, and high-net-worth families who are used to polished experiences. Scott's close-up magic creates foot traffic and holds attention in ways that traditional booth setups can't match. The magic can incorporate your product or messaging naturally, and the crowd engagement is genuine rather than forced.",
    "The format works for product launches, brand activations, and experiential marketing events targeting the Calabasas and western San Fernando Valley market. Scott performed for Rolls-Royce in the area, and the magic was specifically designed to match the brand's identity — sophisticated, memorable, and worth talking about. That same approach applies to any brand looking to make an impression with this audience.",
  ],
  "calabasas--rehearsal-dinner-magician": [
    "Rehearsal dinners in Calabasas happen at private homes, country club dining rooms, and restaurants in the area where the guest list is immediate family and the wedding party. The evening is intimate and emotional, and Scott's close-up magic is a natural icebreaker — he moves table to table creating moments that bring both families together before anyone walks down the aisle.",
    "For couples hosting their rehearsal dinner in Calabasas, Scott also offers the full Private Magic Show — a 30- to 45-minute performance that gives the intimate group a high-energy, shared experience the night before the wedding. In a setting this personal, the show hits differently than it would at a larger event. Every reaction is visible, every moment is shared, and the evening becomes its own memory separate from the wedding.",
  ],
  "calabasas--halloween-party-magician": [
    "Halloween parties in Calabasas happen at estates where the production value is already high — decorated grounds, themed rooms, hosts who go all in on the evening. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural in a candlelit room. It's sophisticated dark wonder that matches the effort the host put into the night.",
    "The format works for adult Halloween parties, themed dinner events, and gatherings where the host wants the entertainment to match the atmosphere. Calabasas homes provide the perfect setting — there's already drama in the architecture. Scott adds to it with effects that make people question what's actually possible.",
  ],
  "calabasas--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Calabasas are private home celebrations — intimate dinners, family gatherings, and neighborhood parties where the host wants the evening to feel special. Scott's close-up magic during cocktail hour gives guests something warm and genuine to bond over. The reactions are real, and they set the tone for the rest of the night.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's 20 people around a dinner table or 80 in a backyard, White Rabbit makes your Calabasas holiday event the one people talk about well into the new year. December dates fill fast for private estate bookings.",
  ],
  "calabasas--premiere-red-carpet-magician": [
    "Calabasas is home to entertainment executives, producers, and athletes who host private screening events, viewing parties, and industry gatherings at their estates. Scott's close-up magic works at these events because the crowd is small, the expectations are high, and the magic is personal. He reads the room, matches the energy, and delivers something that surprises people who spend their careers in entertainment.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce — brands that the Calabasas audience knows and respects. That credibility means Scott belongs in these rooms. The magic is polished, the interactions are genuine, and the host gets credit for finding something their guests haven't seen before.",
  ],
  "calabasas--dmc-entertainment": [
    "Destination management companies bringing VIP groups to the Calabasas area want entertainment that captures the exclusive, private-estate energy of the community. White Rabbit fits into curated luxury itineraries: welcome reception magic at private venues, dinner performances at country clubs, and VIP experiences that give groups something memorable during their downtime.",
    "The magic works especially well during networking moments where attendees from different backgrounds are meeting for the first time. Calabasas's relaxed luxury makes people open and present, and close-up magic takes advantage of that. Guests bond quickly over shared amazement and leave with a story that has nothing to do with the conference agenda.",
  ],
  "calabasas--golf-tournament-magician": [
    "Golf tournaments at courses in the Calabasas area — and throughout the western San Fernando Valley — host their post-round receptions at clubhouses and private venues where the crowd is affluent and competitive. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Calabasas venue for the evening program, having entertainment and hosting handled by the same person keeps the night moving and the energy consistent. The Calabasas golf crowd responds well to magic that's personal and sharp — it fits the clubhouse atmosphere.",
  ],
  "calabasas--resident-event-magician": [
    "Calabasas's gated communities and luxury residential developments want resident events that actually bring people together. The typical resident here is a high-net-worth professional, often in entertainment or business, and they've seen enough generic programming to know what's worth their evening. Scott's close-up magic gives them a reason to attend — and a reason to stay and actually talk to their neighbors.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just polished entertainment that fits into whatever space your community has — a clubhouse, a pool area, a private courtyard. HOA managers and community directors report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar.",
  ],
  // ── New York ────────────────────────────────────────────────────────
  "new-york--corporate-event-magician": [
    "Corporate events in New York operate at a different speed. The timelines are tight, the guests are skeptical, and the entertainment has about 90 seconds to prove it belongs in the room. Scott flies in from LA for New York bookings regularly, and the Manhattan corporate crowd is one of his favorite audiences to work — because when the magic lands with people who've seen everything, the reactions are massive. Wall Street holiday parties, Midtown client dinners, rooftop receptions with skyline views — Scott's close-up magic cuts through the noise because it happens right in front of you and you can't explain it away.",
    "The pace of a New York corporate event demands a performer who reads the room fast and adjusts on the fly. Scott does that. He's worked events where the cocktail hour started 30 minutes late and the CEO wanted to squeeze in remarks, and the magic still covered the room because he knows how to compress and expand without losing quality. The New York crowd respects that kind of professionalism.",
  ],
  "new-york--private-party-magician": [
    "Private parties in New York — penthouses in Tribeca, brownstone dinners in the West Village, rooftop gatherings in Brooklyn — attract a crowd that's hard to impress and fast to judge. Scott flies in from LA for these bookings, and the energy he brings matches the city. His close-up magic is fast, sharp, and designed for people who are standing with a drink, mid-conversation, and not expecting to have their mind blown. That's exactly when it hits hardest.",
    "The New York private party scene rewards entertainment that feels organic rather than produced. No stage, no announcement, just Scott moving through the room creating moments that stop conversations and start new ones. Birthday milestones, holiday dinners, engagement celebrations — the format is the same, and the reactions from Manhattan crowds are some of the loudest and most genuine Scott gets anywhere in the country.",
  ],
  "new-york--wedding-magician": [
    "Scott performed at Cipriani 25 Broadway for a wedding cocktail hour — one of New York's most iconic venues, with a guest list that included finance executives, fashion people, and families who've been hosting events in the city for decades. The magic had to match the room, and it did. Close-up magic during a New York wedding cocktail hour works because guests are standing, mingling, and waiting — the perfect audience for two to three minutes of something impossible happening in their hands.",
    "New York weddings operate on tight timelines and the entertainment can't slow anything down. Scott reads the coordinator's cues, works within the flow, and covers the room without needing a microphone or a stage. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party an intimate, high-energy experience the night before. For couples booking a New York wedding, Scott flies in from LA and coordinates travel seamlessly.",
  ],
  "new-york--close-up-magician": [
    "Close-up magic in New York works because New Yorkers are the best audience for it. They're skeptical, they're direct, and when something genuinely impossible happens six inches from their face, they don't hold back. The reactions in Manhattan are louder and more visceral than almost any other market Scott works. Cards, borrowed objects, mentalism effects — everything happens in their hands, and they can't process it.",
    "Scott has performed at Cipriani 25 Broadway and at private events throughout Manhattan. The close-up format fits New York perfectly — no stage, no setup, no AV. Just Scott moving through a cocktail hour or reception, performing for small groups who came in thinking they'd seen everything. Rooftop receptions, private dining rooms, hotel event spaces — the magic adapts to whatever the venue is. The only constant is the reactions.",
  ],
  "new-york--private-magic-show": [
    "The Private Magic Show in a New York setting — a private event space in Midtown, a loft in Soho, a penthouse with skyline views — feels like something exclusive and cinematic. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations from audiences who genuinely thought they couldn't be surprised. The show is theatrical, interactive, and built to make a room full of New Yorkers forget they're supposed to be jaded.",
    "For New York events, the Private Magic Show often follows roaming cocktail hour magic, giving guests two completely different experiences in one evening. Scott flies in from LA for these bookings and handles all production needs. The show reflects the same level of craft that earned him a membership at the Magic Castle and performances for Netflix, Disney, and Morgan Stanley.",
  ],
  "new-york--mentalist": [
    "Mentalism in New York is a different game. The audience is analytical, competitive, and convinced they'll figure it out. Finance people, lawyers, media executives — they watch Scott like they're looking for the tell. When he reads a thought or predicts a choice before it's made, the reaction hits harder because they genuinely believed they'd catch it. They don't, and that's what makes it stick.",
    "Corporate dinners, private events, and VIP receptions in Manhattan are natural fits for mentalism. The effects are cerebral, the presentation is clean, and the audience participation is real. Scott flies in from LA for New York mentalism bookings, and the format works in any venue — a boardroom, a private dining room, a rooftop with the city behind him.",
  ],
  "new-york--corporate-event-entertainer": [
    "New York corporate events need entertainment that earns its place in the room. The guest list is senior, the venue is expensive, and nobody has time for anything that feels like filler. Scott's close-up magic during cocktail hour gives guests a shared experience that actually breaks through the usual networking small talk. Real reactions, real surprise, and the kind of moments that get mentioned in the Monday morning debrief.",
    "Scott flies in from LA for New York corporate bookings and has performed for clients including Morgan Stanley, Netflix, and Rolls-Royce. The magic is calibrated for a Manhattan audience — fast, smart, and zero tolerance for anything cheesy. It works at Wall Street holiday parties, Midtown client receptions, and company celebrations where the entertainment reflects the caliber of the organization.",
  ],
  "new-york--charity-gala-magician": [
    "Charity galas in New York are high-stakes fundraising events with donor lists that expect world-class everything. The entertainment has to match the venue, the cause, and the crowd. Scott's cocktail hour magic creates genuine connection between donors — strangers bond over something unexpected, the mood turns generous, and the ask lands differently when the room feels that alive. By the time the auctioneer starts, the energy is already there.",
    "Scott has performed at iconic New York venues and for organizations where the fundraising goals are serious. He flies in from LA for gala bookings and coordinates seamlessly with event teams. The format works: roaming magic during the reception, optional Private Magic Show before the live auction, and an energy in the room that translates directly to higher bids and happier donors.",
  ],
  "new-york--holiday-party-magician": [
    "Holiday parties in New York — Wall Street firm celebrations, agency gatherings in Midtown, tech company events in Chelsea — have a problem: everyone's been to a hundred of them. Scott's close-up magic fixes that. He works the room during cocktail hour, giving small groups a few minutes of something genuinely impossible, and by the end of the night, the party has a story. People don't remember the open bar. They remember the thing they can't explain.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. He flies in from LA for holiday bookings and December dates fill fast, especially in the New York market. The Manhattan crowd is the most skeptical audience in the country, which makes the reactions even better when the magic hits.",
  ],
  "new-york--trade-show-magician": [
    "Trade shows in New York — Javits Center, industry events throughout Manhattan — draw crowds that have been walking the floor all day and ignoring booths on autopilot. Scott's close-up magic breaks that pattern. Within minutes, a crowd forms at your booth, attention spans reset, and your team has a captive audience that's actually engaged. The magic can incorporate your product or messaging naturally, and the ROI shows up in lead counts.",
    "The New York trade show crowd is sharp and impatient, which means the magic has to be fast and undeniable. Scott's booth magic is designed for exactly that environment — quick hits that hook passersby, custom reveals that feature your brand, and a presence that makes your booth the one people remember. He flies in from LA for New York trade show bookings and has worked with major brands on experiential activations.",
  ],
  "new-york--rehearsal-dinner-magician": [
    "Rehearsal dinners in New York happen at private dining rooms in the Village, restaurants in Tribeca, and hotel event spaces throughout Manhattan. The guest list is small — immediate family and the wedding party — and the evening is supposed to bring two families together before the big day. Scott's close-up magic does that naturally. He moves table to table, creating moments that connect people who just met an hour ago.",
    "Scott performed wedding cocktail hour magic at Cipriani 25 Broadway, and the rehearsal dinner format is even more intimate. For couples who want the full experience, he offers a Private Magic Show — 30 to 45 minutes of high-energy, interactive performance for the closest people in your life. He flies in from LA and handles all logistics seamlessly.",
  ],
  "new-york--halloween-party-magician": [
    "Halloween in New York already has atmosphere — the city gets dark early in October, the streets have energy, and the parties go late. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. It's sophisticated dark wonder for a city that takes Halloween seriously.",
    "The format works for adult Halloween parties, themed dinners, and rooftop gatherings where the host wants the entertainment to match the mood. Scott flies in from LA for October bookings, and New York's natural edge in late fall makes the mentalism hit harder than it would at a poolside party in Malibu. Different energy, different audience, same result — people talking about it for weeks.",
  ],
  "new-york--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in New York set the bar for the rest of the country. Wall Street firms, media companies, law firms, and tech startups all throw holiday events that are supposed to feel like the most important party of the year. Scott's close-up magic during cocktail hour makes sure they actually are. He works the room, gives groups something genuinely surprising, and the energy carries through the entire evening.",
    "For New Year's Eve in Manhattan, Scott brings his highest energy — fast pace, big reveals, midnight-ready material. He flies in from LA for holiday bookings and December dates fill fast. The New York holiday crowd is tough and jaded, which makes the reactions even more satisfying when the magic lands. And it always lands.",
  ],
  "new-york--premiere-red-carpet-magician": [
    "New York premieres, screening after-parties, and industry events draw a crowd that works in entertainment, media, and publishing — people who produce content for a living and don't impress easily. Scott's close-up magic works in these rooms because it's not a performance you watch from across the room. It happens in your hands, and the reaction is involuntary. That authenticity is what makes it work with a New York industry crowd.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Lionsgate. Scott flies in from LA for New York industry events and fits into the energy of the room — no setup, no production, just polished magic that earns genuine reactions from people who spend their careers creating surprise for everyone else.",
  ],
  "new-york--dmc-entertainment": [
    "Destination management companies bringing groups to New York want entertainment that captures the city's energy without being a cliché. White Rabbit fits into curated Manhattan itineraries: welcome reception magic at iconic venues, dinner performances at private restaurants, and VIP experiences that give groups something memorable during networking hours. Scott flies in from LA and coordinates with DMC teams to make logistics seamless.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. New York's pace can be intimidating, and close-up magic breaks through that wall immediately. Guests bond over something unexpected and leave with a shared story that has nothing to do with the conference agenda.",
  ],
  "new-york--golf-tournament-magician": [
    "Golf tournaments in the New York area host their post-round receptions at clubhouses and venues throughout Westchester, Long Island, and New Jersey. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day, especially with a finance crowd that's competitive about everything.",
    "Scott flies in from LA for New York golf tournament bookings and also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. The New York golf crowd responds well to magic that's sharp and social — it matches the clubhouse energy and gives players something to talk about besides their handicap.",
  ],
  "new-york--resident-event-magician": [
    "New York's luxury residential buildings — Upper East Side co-ops, Tribeca condos, new developments in Hudson Yards — want resident events that get people out of their apartments and into the common spaces. The typical resident in a high-end Manhattan building is successful, busy, and selective about how they spend a weeknight. Scott's close-up magic gives them a reason to come downstairs — and a reason to stay.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV. Just polished entertainment that fits into whatever space your building has — a rooftop lounge, a residents' club, a lobby. Property managers report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar. Scott flies in from LA for New York residential bookings.",
  ],
  // ── Joshua Tree ─────────────────────────────────────────────────────
  "joshua-tree--corporate-event-magician": [
    "Scott performed for Rivian at a corporate event in Joshua Tree — a desert retreat where the team spent the day outdoors and the evening around fire pits under more stars than most of them had ever seen. That's the kind of corporate event that happens out here. Not a hotel ballroom. Not a conference center. A boutique resort or a rented property in the middle of the desert, where the whole point is getting people out of their usual environment and into something different.",
    "Close-up magic works in Joshua Tree because the setting already has people paying attention. Small groups gathered around a fire, drinks in hand, no phones buzzing — Scott moves between clusters performing mentalism and close-up effects that feel even more impossible when there's nothing around but desert and sky. He drives out from LA for Joshua Tree bookings regularly and knows the rhythm of these retreats.",
  ],
  "joshua-tree--private-party-magician": [
    "Private parties in Joshua Tree happen at rented estates, boutique properties like The Joshua Tree House, and desert homes where the host has put real thought into the weekend. Guest counts are small — 15 to 40 people — and the vibe is relaxed luxury. Poolside during the day, fire pits at night, and somewhere in between, Scott shows up and starts performing for small groups without any announcement. The desert setting strips away all the usual noise, and the magic hits harder because of it.",
    "The Joshua Tree crowd is creative, intentional, and looking for something that matches the effort they put into the gathering. Scott's close-up magic and mentalism fit that energy — personal, unexpected, and designed for intimate groups where every guest matters. He drives from LA and handles the logistics. The host just needs to tell him when people will be gathered and where the bar is.",
  ],
  "joshua-tree--wedding-magician": [
    "Desert weddings in Joshua Tree are their own category. The ceremony happens at golden hour with the rocks behind you, cocktail hour is poolside at a rented estate or a boutique venue like Sacred Sands, and the reception runs late under the stars. Scott's cocktail hour magic fits the intimacy of these events perfectly — he moves through small groups performing close-up magic while the desert cools off and the light changes. The reactions carry across the pool deck, and by dinner, guests have stories to tell.",
    "Joshua Tree weddings tend to be smaller and more personal than city weddings, which means every guest's experience matters more. Scott reads the room, adjusts to the pace of the evening, and creates moments of genuine wonder without disrupting the flow. He's also available for rehearsal dinners and welcome parties — a Private Magic Show the night before gives the immediate family and wedding party something high-energy and unforgettable to kick off the weekend.",
  ],
  "joshua-tree--close-up-magician": [
    "Close-up magic in the desert feels different than close-up magic anywhere else. There's no background noise, no competing entertainment, no screens. Just a small group of people gathered around a fire pit or standing by the pool, watching something impossible happen in their hands. Scott performed for Rivian in Joshua Tree, and the intimacy of the desert setting made the reactions bigger and more personal than a hotel ballroom could ever produce.",
    "The format is simple — Scott moves between groups of four to eight people, performing with cards, borrowed objects, and mentalism effects that leave people speechless. In Joshua Tree, the gaps between groups are filled with guests retelling what just happened to people who missed it. The magic becomes the conversation, and in a setting where people came to actually connect, that's exactly what a host wants.",
  ],
  "joshua-tree--private-magic-show": [
    "The Private Magic Show in a Joshua Tree setting — a living room at a rented estate, a cleared patio under the stars, a boutique resort event space — feels like a secret you stumbled into. Scott brings professional lighting and a curated soundtrack, and the desert silence outside makes the show feel even more cinematic. Thirty to 45 minutes of mentalism, audience participation, and a finale that gets people on their feet. In a setting this intimate, every reaction is visible and every moment is shared.",
    "For Joshua Tree events, the Private Magic Show often caps a day of activities — hiking, poolside relaxation, a long dinner — and gives the group a shared peak experience to end the evening. Scott drives from LA and handles all production. The show works indoors or outdoors, though an outdoor show under Joshua Tree stars is something guests talk about for years.",
  ],
  "joshua-tree--mentalist": [
    "Mentalism in the desert feels different. There's something about the quiet, the sky, and the isolation that makes mind-reading and prediction effects land with more weight. When Scott tells someone what they're thinking while the group is gathered around a fire pit in Joshua Tree, it doesn't feel like a trick. It feels real. The setting does half the work, and Scott does the rest.",
    "Scott performed for Rivian at a Joshua Tree retreat where mentalism was the centerpiece of the evening entertainment. The format works for corporate offsites, private gatherings, and luxury retreat events where the guest count is small and the audience is fully present. No phones, no distractions, just impossible things happening in real time.",
  ],
  "joshua-tree--corporate-event-entertainer": [
    "Corporate retreats in Joshua Tree are designed to get teams out of the office and into a headspace where they actually connect. The venues — AutoCamp, boutique desert resorts, rented estates — set the tone. Scott's close-up magic during the evening reception or dinner adds something no team-building exercise can: genuine shared amazement. People who spent the day in workshops bond over something unexpected, and the barriers come down fast.",
    "Scott performed for Rivian in Joshua Tree, and the magic fit the retreat energy perfectly — relaxed but intentional, polished but not corporate. He drives from LA for Joshua Tree bookings and understands the rhythm of these events. The magic happens during the moments when people are standing around, and that's when the real connections form.",
  ],
  "joshua-tree--charity-gala-magician": [
    "Charity events in Joshua Tree tend to be intimate fundraising dinners — private estate gatherings, boutique resort benefits, and desert experiences where the guest list is small and the donors are generous. Scott's close-up magic during the reception creates warmth and connection between people before the ask comes. In a setting this intimate, every guest's experience matters, and the magic makes each person feel individually engaged.",
    "The desert atmosphere adds something to the fundraising energy that's hard to replicate in a city ballroom. Guests are relaxed, present, and genuinely connected to the evening. Scott's roaming magic builds on that, and by the time the host or auctioneer speaks, the room is already in a giving mood. He drives from LA and coordinates with event teams to fit seamlessly into the evening's flow.",
  ],
  "joshua-tree--holiday-party-magician": [
    "Holiday gatherings in Joshua Tree are desert escapes — friends or colleagues renting a property for a long weekend, companies booking a boutique resort for their annual celebration, families gathering at a desert home for the holidays. Scott's close-up magic fits the relaxed pace of these events. He moves through small groups performing around the pool, at dinner, by the fire pit — wherever people are gathered with a drink and time to spare.",
    "The desert in December has its own magic — cool evenings, clear skies, and a pace that lets people actually enjoy each other's company. Scott adds to that with entertainment that feels personal and genuine. For New Year's Eve desert gatherings, he brings higher energy and countdown-ready material. He drives from LA and Joshua Tree holiday dates book early, especially for weekend retreats.",
  ],
  "joshua-tree--trade-show-magician": [
    "Trade shows and brand activations in the Joshua Tree area attract a niche, high-value audience — wellness brands, outdoor companies, creative industries holding experiential events in the desert. Scott's close-up magic creates engagement that feels natural in these settings. The magic can incorporate your product or messaging, and the intimate desert environment means every interaction carries more weight than it would on a convention floor.",
    "For experiential marketing events and brand activations at Joshua Tree venues, White Rabbit adds a layer of wonder that matches the setting. Scott performed for Rivian in the area, and the magic was designed to complement the brand's identity — innovative, authentic, and worth talking about. That same approach works for any brand looking to make an impression with a curated desert audience.",
  ],
  "joshua-tree--rehearsal-dinner-magician": [
    "Rehearsal dinners in Joshua Tree happen at rented estates, boutique resort dining spaces, and desert patios where the guest list is the people who matter most. Scott's close-up magic moves table to table, creating moments that connect two families who may be meeting for the first time — in a setting that's already relaxed and beautiful. The desert removes all the usual wedding-weekend stress, and the magic adds something warm and memorable.",
    "For couples hosting their rehearsal dinner in Joshua Tree, Scott also offers the full Private Magic Show — 30 to 45 minutes of high-energy, interactive performance under the desert sky. It gives the intimate group a shared experience that sets the tone for the entire wedding weekend. He drives from LA and coordinates timing with the couple's weekend itinerary.",
  ],
  "joshua-tree--halloween-party-magician": [
    "Halloween in the desert is genuinely eerie in a way that no city party can replicate. The silence, the darkness, the landscape — it's already unsettling in the best possible way. Scott's mentalism and mind-reading material takes on a real edge in Joshua Tree: thoughts read by firelight, predictions written hours earlier that match choices made in the moment, effects that feel supernatural when there's nothing around but rocks and stars.",
    "The format works for adult Halloween gatherings, themed desert dinners, and weekend retreat parties where the host wants the entertainment to match the atmosphere. Scott drives from LA and the October desert provides a natural backdrop that makes every effect land harder. No fog machines needed — the setting does the work.",
  ],
  "joshua-tree--christmas-party-magician": [
    "Christmas and New Year's gatherings in Joshua Tree are desert retreats — friends renting a property, families gathering at a desert home, companies booking a boutique resort for a holiday offsite. The cool December desert air, clear skies, and fire pit gatherings create an atmosphere that's warm and intimate. Scott's close-up magic fits right into that energy — moving between groups, performing by firelight, creating shared moments that make the evening feel special.",
    "For New Year's Eve desert celebrations, Scott brings higher energy and countdown-ready material. Whether it's 15 people at a rented house or 60 at a resort, the magic gives the evening a center of gravity. He drives from LA and December dates in Joshua Tree book early, especially for weekend retreats.",
  ],
  "joshua-tree--premiere-red-carpet-magician": [
    "Joshua Tree hosts industry retreats, creative off-sites, and private screenings for entertainment and media companies looking to get their teams out of the city. Scott's close-up magic works at these events because the setting strips away all the usual industry armor — no one's networking in the desert, they're just present. The magic takes advantage of that openness, and the reactions from entertainment professionals in a relaxed desert setting are more genuine than anything you'd get at a Hollywood rooftop.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rivian. Scott drives from LA for Joshua Tree industry events and fits into the retreat energy — no production, no disruption, just world-class magic during the moments when people are gathered and open to something unexpected.",
  ],
  "joshua-tree--dmc-entertainment": [
    "Destination management companies bringing groups to Joshua Tree want entertainment that matches the desert experience — intimate, unexpected, and nothing you'd find at a city hotel. White Rabbit fits into curated Joshua Tree itineraries: welcome reception magic at resort properties, dinner performances at rented estates, and fire-pit entertainment that gives groups something genuinely memorable between daytime activities.",
    "The magic works especially well during evening gatherings where attendees are unwinding from the day. The desert pace makes people open and present, and close-up magic takes advantage of that. Guests bond over shared amazement and leave with a story that has nothing to do with the conference agenda. Scott drives from LA and coordinates with DMC teams on timing and logistics.",
  ],
  "joshua-tree--golf-tournament-magician": [
    "Golf events in the Joshua Tree and desert area host their post-round receptions at clubhouses and resort venues where the crowd is ready to relax and celebrate. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The desert setting adds atmosphere, and the 19th-hole magic becomes the most talked-about part of the day.",
    "Scott drives from LA for desert golf tournament bookings and also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. The desert golf crowd is there to enjoy themselves, and magic that's social, interactive, and impossible to figure out fits that energy perfectly.",
  ],
  "joshua-tree--resident-event-magician": [
    "Joshua Tree's boutique residential communities and desert developments want events that bring residents together in a setting that already feels special. Scott's close-up magic adds a layer of wonder to poolside gatherings, community dinners, and desert evening events. The format is simple — he moves through small groups performing for four to eight people at a time, and the reactions carry across the intimate desert setting.",
    "No stage, no setup, no AV requirements. Just polished entertainment that fits into the outdoor spaces and communal areas that define desert living. Scott drives from LA for Joshua Tree residential bookings, and property managers report that magic-focused events consistently draw the strongest turnout and the most genuine resident interaction.",
  ],
  // ── Bel Air ─────────────────────────────────────────────────────────
  "bel-air--corporate-event-magician": [
    "Corporate events in Bel-Air don't look like corporate events anywhere else. They happen at private estates behind gates on Stone Canyon Road, at Hotel Bel-Air, and in homes where the guest list is deliberately small. The entertainment has to match that level of intention — polished, personal, and nothing that feels like it was pulled from an event catalog. Scott performs regularly in Bel-Air for hosts who want their guests genuinely surprised, not just entertained.",
    "Close-up magic works in Bel-Air because the setting demands intimacy. Groups of four to eight people get a few minutes of impossible things happening in their hands — cards, borrowed objects, mentalism — and the reactions carry through the room because the room is never very large. The crowd here is executives, investors, and people who are used to the best of everything. They know the difference immediately, and Scott delivers.",
  ],
  "bel-air--private-party-magician": [
    "Private parties in Bel-Air are estate events. Beautiful homes, manicured gardens, and guest lists where every person was invited for a reason. Scott performs regularly in the neighborhood for hosts who want the evening to feel extraordinary without being loud or overdone. He arrives early, meets the host, reads the layout, and starts performing for small groups once guests settle in. No announcement, no fanfare — just magic happening naturally as part of the evening.",
    "The Bel-Air crowd expects discretion and quality in equal measure. Birthday milestones, anniversary dinners, holiday gatherings, intimate celebrations — Scott's close-up magic fits the scale and the sophistication of these events. The reactions are genuine, and in a community where word travels through personal recommendation, one great performance leads to the next.",
  ],
  "bel-air--wedding-magician": [
    "Bel-Air weddings are among the most beautiful in Los Angeles — private estate ceremonies, garden receptions, cocktail hours on terraces overlooking the canyon. Scott's cocktail hour magic fits the intimacy of these events. He moves through the crowd performing for small groups, connecting families who are meeting for the first time, and creating moments of wonder that set the tone for the rest of the evening without competing with the setting.",
    "The entertainment at a Bel-Air wedding needs to feel like it belongs — refined, warm, and never louder than the evening calls for. Scott's close-up magic is exactly that. He reads the room, adjusts his energy to the crowd, and gives guests something memorable that doesn't require a stage or a microphone. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party an intimate, high-energy experience the night before.",
  ],
  "bel-air--close-up-magician": [
    "Close-up magic in Bel-Air works because every event here is intimate. Small guest counts, private homes, and a setting where people are standing close together in a garden or a living room with a drink in hand. Scott performs for groups of four to eight — cards, borrowed objects, mentalism effects that make someone's jaw drop. In a Bel-Air living room, everyone hears the reaction, and everyone wants to know what just happened.",
    "The audience in Bel-Air is used to extraordinary experiences, which makes close-up magic even more effective. They're not easily impressed by spectacle or production value. But something impossible happening six inches from their face, with their own ring or their own phone? That gets them every time. Scott performs regularly in the neighborhood, and the close-up format is the one that resonates most with Bel-Air hosts and their guests.",
  ],
  "bel-air--private-magic-show": [
    "The Private Magic Show in a Bel-Air estate — a living room cleared for 30 guests, a garden set with string lights, a screening room repurposed for the evening — feels like a private performance you weren't supposed to find. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations. The show is designed to feel exclusive and cinematic, which matches the way Bel-Air hosts think about their events.",
    "For Bel-Air gatherings, the Private Magic Show often follows roaming close-up magic during cocktail hour, giving guests two distinct experiences in one evening. The close-up magic is social and spontaneous. The show is theatrical and builds to a finish that gets people on their feet. In a home where every detail has been considered, the show feels like it was designed specifically for that room — because it was.",
  ],
  "bel-air--mentalist": [
    "Mentalism in Bel-Air plays well because the audience is sharp and private. Business leaders, entertainment executives, investors — they pay attention, they're skeptical, and they don't give away reactions easily. When Scott reads a thought or predicts a choice before it's made, the response is strong precisely because this crowd doesn't react to things that aren't genuinely impressive. They can't figure it out, and that's what makes it stick.",
    "Private dinners, estate parties, and milestone celebrations in Bel-Air are natural fits for mentalism. The effects are cerebral, the presentation is refined, and the audience participation is real. It's the kind of entertainment that matches the sophistication of the neighborhood without feeling like a corporate program.",
  ],
  "bel-air--corporate-event-entertainer": [
    "Corporate entertaining in Bel-Air means private estate dinners, client appreciation events at Hotel Bel-Air, and intimate gatherings where the guest count is small and the host knows every person in the room. Scott's close-up magic during cocktail hour gives guests a shared experience that breaks through the usual small talk. The reactions are real, the connections are genuine, and the host looks like they put serious thought into the evening — because they did.",
    "The Bel-Air standard is quiet excellence. The entertainment shouldn't announce itself; it should earn its place in the room. Scott's close-up magic and mentalism do that — he reads the crowd, matches the energy, and delivers something that leaves an impression without ever being too much. For companies hosting clients or executives in Bel-Air, that's exactly the right calibration.",
  ],
  "bel-air--charity-gala-magician": [
    "Charity events in Bel-Air draw from the neighborhood's community of philanthropists, entertainment executives, and established families who give generously but expect the evening to match their standards. Scott's cocktail hour magic creates genuine warmth between donors — strangers connect over something unexpected, the mood turns generous, and the ask lands differently when people feel that good about the evening.",
    "The format works well at Bel-Air estates and Hotel Bel-Air, where the guest count is focused and the setting is already beautiful. Roaming magic during the reception builds energy, and if there's a live auction, the crowd is already engaged by the time bidding starts. Scott has served as MC and auctioneer at fundraising events, keeping the flow tight and the energy high through the giving portion of the evening.",
  ],
  "bel-air--holiday-party-magician": [
    "Holiday parties in Bel-Air are private affairs — estate dinners, neighborhood gatherings, and celebrations where the guest list is tight and the evening matters. Scott's close-up magic turns the usual holiday formula into something people actually talk about the next day. He works the room during cocktail hour, giving small groups a few minutes of magic that gets genuine reactions — the kind that carry across a living room and make other guests come over to see what happened.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready. Whether it's an intimate dinner for 20 or a garden party for 80, White Rabbit makes your Bel-Air holiday event the one people reference well into January. December dates fill early, especially for private estate bookings in this neighborhood.",
  ],
  "bel-air--trade-show-magician": [
    "Brand activations and private product events in Bel-Air target an ultra-high-net-worth audience that responds to experiences, not pitches. Scott's close-up magic creates genuine engagement — guests interact with the magic, they interact with each other, and the brand benefits from the energy in the room. The magic can incorporate your product or messaging naturally, and the intimate Bel-Air setting means every interaction carries real weight.",
    "For luxury brands hosting experiential events at Bel-Air estates or Hotel Bel-Air, White Rabbit adds something that a DJ or photo booth never could — real, personal moments of amazement that guests associate with your brand. Scott has performed for Rolls-Royce, Netflix, and Disney at private events, and the magic is designed to match premium brand standards.",
  ],
  "bel-air--rehearsal-dinner-magician": [
    "Rehearsal dinners in Bel-Air happen at private estates, Hotel Bel-Air, and homes where the guest list is immediate family and the wedding party. The evening is intimate and emotional, and Scott's close-up magic is a natural icebreaker — he moves table to table creating moments that connect two families before anyone walks down the aisle. In a setting this personal, every reaction is visible and every moment is shared.",
    "For couples hosting their rehearsal dinner in Bel-Air, Scott also offers the full Private Magic Show — 30 to 45 minutes of high-energy, interactive performance for the closest people in your life. The intimacy of a Bel-Air home paired with a polished show creates something guests remember as its own highlight of the wedding weekend.",
  ],
  "bel-air--halloween-party-magician": [
    "Halloween parties at Bel-Air estates already have atmosphere — gated driveways, candlelit gardens, homes with enough architecture to feel cinematic after dark. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. It's sophisticated dark wonder that matches the setting without resorting to costume-store gimmicks.",
    "The format works for adult Halloween parties, themed dinners, and intimate gatherings where the host wants the entertainment to feel real. Bel-Air homes provide the perfect backdrop — there's already drama in the gates, the hedges, the long driveways. Scott adds to it with effects that make people question what's actually happening.",
  ],
  "bel-air--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Bel-Air are private home celebrations — intimate dinners, estate parties, and holiday gatherings where the host wants the evening to feel genuinely special. Scott's close-up magic during cocktail hour gives guests something warm to bond over. The reactions are real, the connections are genuine, and the evening has a center of gravity that goes beyond the usual holiday party formula.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, midnight-ready material. Whether it's 20 people around a dinner table or 60 in a garden, White Rabbit makes your Bel-Air holiday event the one people talk about well into the new year. December dates fill fast for private estate bookings.",
  ],
  "bel-air--premiere-red-carpet-magician": [
    "Bel-Air is home to entertainment executives, studio heads, and producers who host private screening events, viewing parties, and industry gatherings at their estates. Scott's close-up magic works at these events because the crowd is small, the expectations are high, and the magic is personal. He reads the room, matches the energy, and delivers something that surprises people who spend their careers creating entertainment for everyone else.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Morgan Stanley. That credibility means Scott belongs in Bel-Air industry rooms. The magic is polished, the interactions are genuine, and the host gets credit for finding something their guests haven't experienced before.",
  ],
  "bel-air--dmc-entertainment": [
    "Destination management companies bringing VIP groups to Bel-Air want entertainment that captures the neighborhood's exclusive, private-estate energy. White Rabbit fits into curated luxury itineraries: welcome reception magic at Hotel Bel-Air, dinner performances at private venues, and VIP experiences that give groups something genuinely memorable during their Los Angeles stay.",
    "The magic works especially well during networking moments where attendees from different backgrounds are meeting for the first time. Bel-Air's quiet luxury makes people relaxed and present, and close-up magic takes advantage of that openness. Guests bond over shared amazement and leave with a story that has nothing to do with the conference agenda.",
  ],
  "bel-air--golf-tournament-magician": [
    "Golf events at clubs in the Bel-Air area host their post-round receptions at clubhouses and private venues where the crowd is affluent and social. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Bel-Air venue for the evening program, having entertainment and hosting handled by the same person keeps the night moving and the energy consistent. The Bel-Air golf crowd responds well to magic that's personal, refined, and impossible to figure out.",
  ],
  "bel-air--resident-event-magician": [
    "Bel-Air's residential communities and homeowner associations occasionally host neighborhood events — garden parties, holiday gatherings, community dinners — where the goal is bringing neighbors together in a setting worthy of the address. Scott's close-up magic gives residents a reason to attend and a reason to stay. The magic is personal, the interactions are warm, and the evening becomes something people actually talk about afterward.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the gathering performing for small groups. No stage, no setup, no AV. Just polished entertainment that fits into whatever space is available — a garden, a pool area, a clubhouse. The Bel-Air standard is quiet excellence, and White Rabbit delivers exactly that.",
  ],
};

function generatePage(location: string, service: typeof serviceTypes[number]): SeoPage {
  const slug = `${slugify(location)}-${service.key}`;

  // Rotate testimonials based on slug hash for variety
  const hashIndex = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % testimonials.length;
  const testimonial = testimonials[hashIndex];

  let intro: string;
  let body: string[];
  let heroHeadline: string;
  let heroSub: string;
  let midCta: string;

  switch (service.key) {
    case "corporate-event-magician":
      heroHeadline = `Hire a Corporate Event Magician in ${location}`;
      heroSub = `The entertainment your guests will actually remember, and your competitors will wish they'd booked first.`;
      midCta = `Check Availability for Your ${location} Event`;
      intro = `Looking for a corporate event magician in ${location}? You've found the one your guests will be talking about Monday morning. White Rabbit delivers world-class close-up magic and mentalism for Fortune 500 galas, product launches, holiday parties, and executive retreats. The kind of entertainment that makes your event feel like a first-class experience.`;
      body = [
        `Here's the problem with most corporate entertainment: it's forgettable. A DJ nobody dances to. A comedian who doesn't read the room. Background noise. White Rabbit is the opposite. Scott Syme walks into your event and within minutes, your CEO is laughing, your clients are leaning in, and strangers are bonding over something they can't explain. That's not a party trick. That's a business advantage.`,
        `Scott Syme is a proud member of the world-famous Magic Castle® in Hollywood, the most prestigious private club for magicians on earth. He has performed for Netflix, Disney, Morgan Stanley, Rolls Royce, Paramount, Rivian, YouTube, and dozens of private clients who demand nothing less than extraordinary. His close-up magic and mentalism are specifically designed for the corporate environment: sophisticated, conversational, and calibrated to break the ice faster than any open bar ever could.`,
        `Scott can perform during cocktail hour, moving table to table creating jaw-dropping moments, or deliver a full parlor show that transforms your venue into an intimate theater. Every detail is tailored to your event's goals, audience, and energy. This isn't one-size-fits-all entertainment. This is White Rabbit.`,
        `Based in Los Angeles and available throughout ${location} and beyond. Limited dates available. The best events book 4 to 8 weeks in advance.`,
      ];
      break;

    case "private-party-magician":
      heroHeadline = `Private Party Magician in ${location}`;
      heroSub = `Give your guests a night they'll retell for years, not just another party they attended.`;
      midCta = `Book Your ${location} Private Event`;
      intro = `Searching for a magician for your private party in ${location}? The best parties aren't remembered for the venue or the menu. They're remembered for how they made people feel. White Rabbit transforms birthday celebrations, anniversary dinners, holiday gatherings, and house parties into evenings your guests will never stop talking about.`;
      body = [
        `Picture this: your guests are gathered close, drinks in hand, when impossible things start happening inches from their fingertips. A card they merely thought of appears in a sealed envelope. A borrowed ring vanishes and reappears inside a locked box that's been sitting in plain sight all evening. The room erupts. Not polite applause, but genuine, wide-eyed, "how is this possible" astonishment.`,
        `Scott Syme is a member of the world-famous Magic Castle® in Hollywood, the most exclusive private club for magicians in the world. But he doesn't just perform tricks. He creates an atmosphere. The lighting shifts, a curated soundtrack sets the mood, and suddenly your living room feels like a private members' club. Every guest feels like the most important person in the room. That's the difference between hiring a magician and hiring White Rabbit.`,
        `Perfect for milestone birthdays (30th, 40th, 50th), engagement parties, holiday gatherings, dinner parties, housewarming celebrations, and any occasion that deserves to be extraordinary. Available for intimate groups of 6 to celebrations of 200+ across ${location}.`,
        `Your guests will leave with something no gift bag can match: the feeling of genuine wonder and a story they'll tell at every dinner party for the next decade. Dates fill quickly. Inquire now to lock in your preferred date.`,
      ];
      break;

    case "wedding-magician":
      heroHeadline = `Wedding Magician in ${location}`;
      heroSub = `The cocktail hour entertainment that makes your wedding unforgettable, for all the right reasons.`;
      midCta = `Check Wedding Date Availability`;
      intro = `Planning a wedding in ${location} and want entertainment that actually brings your guests together? White Rabbit's cocktail hour magic is the secret weapon couples wish they'd known about sooner. While your guests mingle and the champagne flows, Scott Syme creates moments of pure, joyful astonishment that turn strangers into friends before they even find their seats.`;
      body = [
        `Here's what nobody tells you about weddings: cocktail hour is make-or-break. It's the moment when your college friends meet your partner's family, when coworkers meet cousins, when everyone is standing around wondering what to do. Close-up magic solves this instantly. Within seconds, people who've never met are gasping, laughing, and bonding over something extraordinary.`,
        `Scott is a proud member of the world-famous Magic Castle® in Hollywood, performing at the highest level of the craft. Every performance is elegant, sophisticated, and perfectly calibrated for the tone of your celebration. No cheesy props. No interrupting toasts. No pulling rabbits out of hats. Just beautiful, intimate moments of wonder that feel right at home at a five-star venue, because that's where White Rabbit belongs.`,
        `Scott has performed at weddings across ${location}. From clifftop ceremonies to grand ballroom receptions. Each performance is tailored to your guest count, timeline, and vision. Cocktail hour roaming magic, a pre-dinner parlor show, or both: whatever your celebration needs to feel complete.`,
        `Couples consistently say that hiring White Rabbit was the single best entertainment decision they made. Peak wedding season dates (May through October) book months in advance. Reach out now to secure your date.`,
      ];
      break;

    case "close-up-magician":
      heroHeadline = `Close-Up Magician in ${location}`;
      heroSub = `Magic that happens right in your hands. Intimate, impossible, and absolutely unforgettable.`;
      midCta = `Hire a Close-Up Magician in ${location}`;
      intro = `Looking for a close-up magician in ${location}? Close-up magic is the most powerful form of entertainment because it's personal. It happens right there in your hands, inches from your face, and no amount of replaying will reveal the secret. White Rabbit brings world-class interactive magic directly to your guests, creating moments that feel like encountering real magic.`;
      body = [
        `There's a reason the world's most exclusive events feature close-up magic: it creates genuine human connection. When Scott Syme approaches a group, within sixty seconds they're united. Executives and interns, introverts and extroverts, all sharing the same moment of pure, unfiltered amazement. No other entertainment does this.`,
        `A proud member of the world-famous Magic Castle® in Hollywood, Scott's close-up work blends interactive magic, mentalism, and mind reading into seamless, conversational performances. Guests don't just watch. They participate. They make impossible choices, they hold objects that vanish and reappear, they experience moments that defy explanation. It's interactive in a way that makes every person feel like the star of the show.`,
        `Perfect for cocktail hours, dinner parties, VIP lounges, restaurant activations, hotel lobbies, brand activations, trade shows, and any ${location} event where you want guests mingling, laughing, and completely present in the moment.`,
        `Available for events of any size across ${location}. Most clients book 2 to 4 hours of roaming close-up magic, though custom packages are available. Inquire now. The calendar fills fast, especially during event season.`,
      ];
      break;

    case "private-magic-show":
      heroHeadline = `Private Magic Show in ${location}`;
      heroSub = `A curated 45-minute theatrical experience your guests will be buzzing about for months.`;
      midCta = `Book a Private Magic Show in ${location}`;
      intro = `Looking for a show-stopping performance for your ${location} event? The White Rabbit Private Magic Show is a curated 45-minute theatrical experience: part magic show, part one-man theater, part collective hallucination. Designed for groups of 20 to 120, it transforms any space into an intimate venue where the impossible feels inevitable and every guest is part of the story.`;
      body = [
        `A member of the world-famous Magic Castle® in Hollywood, Scott brings elite-level craft to every stage. Imagine emerald curtains, warm lighting, and a curated soundtrack that pulls your guests into another world before the first trick even begins. Then Scott takes the stage, and for the next 45 minutes, reality gets beautifully unreliable. Cards defy physics. Minds are read with unsettling accuracy. Objects appear in places they have no business being. And the audience? They're not just watching. They're screaming, laughing, and grabbing each other's arms.`,
        `The Private Magic Show isn't background entertainment. It's the centerpiece of your evening. It's the thing your guests will text each other about the next morning. It's the reason they'll RSVP "yes" to your next event before you even send the invitation. That's the ROI of extraordinary entertainment.`,
        `White Rabbit provides full production support: professional lighting, sound design, and staging, turning your venue, living room, or corporate conference room into a world-class performance space. Every show is tailored to your audience, your space, and the feeling you want to create.`,
        `Based in Los Angeles and available for events across ${location} and beyond. The Private Magic Show is our most requested experience. Book early to secure your preferred date.`,
      ];
      break;

    case "golf-tournament-magician":
      heroHeadline = `Golf Tournament Magician in ${location}`;
      heroSub = `Fill the post-round dead zone with something your players will actually remember.`;
      midCta = `Book Entertainment for Your ${location} Golf Event`;
      intro = `Planning a golf tournament in ${location} and wondering what happens after the last putt drops? That awkward window between the round and the awards dinner is where most events lose momentum. White Rabbit fills it with world-class close-up magic and hosting that keeps your players engaged, entertained, and talking about your event long after the trophies are handed out.`;
      body = [
        `Here's the truth about golf tournaments: the golf is great, but the post-round experience is where loyalty is built. Your players remember the 19th hole more than the 18th. Scott Syme transforms that dead zone into the highlight of the day with roaming close-up magic during cocktails, mentalism that reads the room, and the kind of energy that turns strangers into friends.`,
        `But the entertainment can start on the course itself. One of the most effective formats is stationing a magician at a signature hole where groups inevitably back up. Instead of standing around for five minutes waiting for the group ahead to clear, your players get a close-up magic performance right at the tee box. It turns dead time into the most talked-about moment of the round, and players arrive at the 19th hole already buzzing about the entertainment.`,
        `Scott is a proud member of the world-famous Magic Castle® in Hollywood, and his style is perfectly calibrated for the country club environment. Sophisticated, conversational, whiskey-in-hand entertainment that feels like it belongs at a private club. No stage required. No cheesy props. Just a master craftsman moving through the room creating impossible moments that spark genuine connection.`,
        `Beyond the magic, Scott also serves as a professional MC and host, managing the flow from cocktail hour through dinner, awards, and auction. It's a hybrid offering that eliminates the need for a separate emcee while keeping energy high and pacing tight.`,
        `Available for charity tournaments, corporate golf outings, member-guest events, and private club celebrations across ${location}. Limited dates during peak golf season (April–October). Inquire now.`,
      ];
      break;

    case "charity-gala-magician":
      heroHeadline = `Magician for Charity Galas in ${location}`;
      heroSub = `The entertainment that warms the room before the ask — and keeps wallets open all night.`;
      midCta = `Book Entertainment for Your ${location} Gala`;
      intro = `Planning a fundraiser or charity gala in ${location}? The entertainment you choose sets the emotional temperature of the entire evening. White Rabbit delivers world-class close-up magic and mentalism that creates an atmosphere of generosity, delight, and genuine human connection — exactly the energy you need before the paddle goes up.`;
      body = [
        `The best galas don't just raise money. They create an emotional experience that makes donors feel proud, connected, and eager to give. That's where White Rabbit comes in. During cocktail hour, Scott moves through the room performing intimate close-up magic for small groups. By the time guests sit down for dinner, the energy in the room is electric. Strangers have bonded. The mood is generous. The ask lands differently when people feel that good.`,
        `Scott is a member of the world-famous Magic Castle® in Hollywood and has performed for Netflix, Disney, Morgan Stanley, and Rolls Royce. His presence at your gala signals to donors that this is a world-class event, the kind of evening where extraordinary things happen, including extraordinary generosity.`,
        `Scott can also perform a pre-auction parlor show that electrifies the room right before the live auction, creating a surge of energy that translates directly to higher bids. Every element of the performance is tailored to serve your fundraising goals.`,
        `Available for nonprofit galas, charity auctions, philanthropic dinners, and fundraising events across ${location}. Dates during gala season (September–December) fill early. Reach out now.`,
      ];
      break;

    case "holiday-party-magician":
      heroHeadline = `Holiday Party Magician in ${location}`;
      heroSub = `Turn your holiday party from "nice" to the event everyone talks about until next December.`;
      midCta = `Book Your ${location} Holiday Party Entertainment`;
      intro = `Looking for holiday party entertainment in ${location} that your team will actually remember? Forget the generic DJ. Forget the awkward karaoke. White Rabbit delivers the kind of sophisticated, interactive entertainment that makes your holiday party the highlight of the year, and the reason people RSVP to next year's before you even send the invite.`;
      body = [
        `Holiday parties have a problem: everyone's been to a hundred of them, and they all blur together. The same playlist. The same small talk. The same "that was nice" on the way home. White Rabbit fixes that. Scott Syme moves through the room performing close-up magic that turns coworkers into friends, breaks down departmental silos, and gives everyone a shared experience they'll be retelling at the coffee machine for months.`,
        `A member of the world-famous Magic Castle® in Hollywood, Scott's style is elegant, warm, and perfectly suited for the holiday atmosphere. An intimate team dinner of 15 or a company-wide celebration of 500 — the magic scales beautifully. And the best part? No setup, no teardown, no sound check. Just a world-class entertainer who arrives ready to make your party unforgettable.`,
        `Don't underestimate the ROI of a great holiday party. Employee retention, team morale, client relationships — they all improve when people associate your company with extraordinary experiences. That's what White Rabbit delivers.`,
        `Holiday season (October through January) is our busiest period. December dates fill months in advance. Many clients rebook the following year immediately after their event. Plan early to secure your preferred date in ${location}.`,
      ];
      break;

    case "trade-show-magician":
      heroHeadline = `Trade Show Magician in ${location}`;
      heroSub = `Stop blending in. Start drawing crowds. Turn booth traffic into qualified leads.`;
      midCta = `Book a Trade Show Magician in ${location}`;
      intro = `Exhibiting at a trade show in ${location} and tired of watching attendees walk past your booth? White Rabbit is the competitive edge that stops people in their tracks. Scott Syme blends world-class close-up magic with your brand messaging to draw crowds, hold attention, and turn passive foot traffic into engaged, qualified prospects.`;
      body = [
        `Trade shows are brutal. You've spent thousands on the booth, the travel, the team — and most attendees walk right past without a second glance. A trade show magician changes the equation entirely. Scott draws a crowd within minutes, holds their attention with jaw-dropping close-up magic, and weaves your product story or key messaging into the performance so naturally that attendees don't even realize they're being marketed to. They just know they can't look away.`,
        `Scott is a member of the world-famous Magic Castle® in Hollywood, and his trade show work is specifically designed for the expo floor environment. Quick-hit routines that hook passersby, custom reveals that feature your product, and a magnetic presence that makes your booth the one everyone's talking about at the after-party.`,
        `The math is simple: more booth traffic = more leads = more ROI. Clients report 3-5x the foot traffic at their booth when White Rabbit is performing. And it goes beyond quantity — the quality of engagement is on a completely different level when people are amazed and emotionally connected to your brand experience.`,
        `Available for trade shows, conferences, brand activations, product launches, and experiential marketing events across ${location}. Book early for major industry events. Custom messaging integration is included.`,
      ];
      break;

    case "rehearsal-dinner-magician":
      heroHeadline = `Rehearsal Dinner Magician in ${location}`;
      heroSub = `The night before the big day deserves its own magic.`;
      midCta = `Book Entertainment for Your ${location} Rehearsal Dinner`;
      intro = `Planning a rehearsal dinner in ${location}? The rehearsal dinner is where the wedding weekend truly begins — and it's often the most intimate, emotional gathering of the entire celebration. White Rabbit transforms that evening into something unforgettable with close-up magic that brings both families together before they even reach the altar.`;
      body = [
        `Here's what makes a rehearsal dinner uniquely special: it's the first time both families are in the same room, together, with no ceremony to attend and no schedule to follow. It's relaxed, emotional, and full of first introductions. Close-up magic is the perfect icebreaker. Within minutes of Scott arriving, your aunt is bonding with their grandmother over a card trick, and the best man is buying drinks for the maid of honor after a mind-reading routine that left them both speechless.`,
        `Scott is a proud member of the world-famous Magic Castle® in Hollywood, and his style is warm, intimate, and perfectly suited for the rehearsal dinner atmosphere. He moves table to table, creating personal moments for each group — never interrupting toasts, never pulling focus from the couple. Just elegant, conversational magic that makes the evening feel special.`,
        `The rehearsal dinner sets the tone for the entire wedding weekend. When guests arrive at the ceremony the next day, they're already connected, already energized, already talking about the incredible evening they shared. That's the White Rabbit effect.`,
        `Available for rehearsal dinners, welcome parties, and wedding weekend events across ${location}. Wedding season dates (May–October) book quickly. Couples who book the rehearsal dinner often add White Rabbit to the wedding reception too. Inquire now.`,
      ];
      break;

    case "halloween-party-magician":
      heroHeadline = `Halloween Party Magician in ${location}`;
      heroSub = `Dark wonder, genuine mystery, and the kind of magic that feels real on the night when anything seems possible.`;
      midCta = `Book Halloween Entertainment in ${location}`;
      intro = `Hosting a Halloween party in ${location}? Skip the generic costume party and give your guests an evening of genuine mystery. White Rabbit leans into the uncanny — mentalism, mind reading, and eerie coincidences that feel genuinely supernatural. On the one night of the year when everyone wants to believe in magic, Scott Syme delivers the real thing.`;
      body = [
        `Halloween parties are everywhere. But a Halloween experience? That's rare. White Rabbit transforms your gathering into something atmospheric and unforgettable. Picture this: dim lighting, a curated soundtrack, and a magician who seems to know things he shouldn't. Cards appear in impossible places. Thoughts are read with unsettling accuracy. A borrowed object vanishes and reappears somewhere that makes no sense — unless, of course, something genuinely strange is happening.`,
        `Scott is a member of the world-famous Magic Castle® in Hollywood, and his mentalism and mind reading takes on a different dimension during Halloween. The same routines that amaze at corporate events become genuinely eerie when performed by candlelight on October 31st. It's sophisticated dark wonder, not jump scares. Think séance energy meets world-class magic.`,
        `Perfect for adult Halloween parties, haunted dinners, costume galas, and spooky cocktail events. Scott's style naturally carries a dark elegance that fits the season without resorting to gimmicks. The atmosphere is built into the performance.`,
        `October dates fill quickly — Halloween weekend especially. Book early to bring the uncanny to your ${location} Halloween celebration.`,
      ];
      break;

    case "christmas-party-magician":
      heroHeadline = `Christmas & New Year's Eve Magician in ${location}`;
      heroSub = `Make the holidays truly magical — the kind of celebration your guests will toast to for years.`;
      midCta = `Book Holiday Season Entertainment in ${location}`;
      intro = `Looking for a magician for your Christmas party or New Year's Eve celebration in ${location}? The holiday season deserves entertainment that matches the magic of the moment. White Rabbit delivers warm, sophisticated close-up magic and mentalism that brings people together during the most wonderful — and most socially complicated — time of the year.`;
      body = [
        `Christmas parties and New Year's Eve events share a common challenge: high expectations. People want the evening to feel special, festive, and genuinely memorable. A good playlist isn't enough. White Rabbit delivers the "wow" factor that turns your celebration from pleasant to legendary. Scott moves through the room performing intimate close-up magic that gives every guest their own personal moment of wonder.`,
        `A member of the world-famous Magic Castle® in Hollywood, Scott's style is warm, celebratory, and perfectly suited for the holiday atmosphere. A seated dinner where he visits each table, a cocktail party where he floats between groups — the magic creates the kind of shared joy that defines the holidays at their best.`,
        `For New Year's Eve, Scott can build toward a midnight crescendo — a grand finale of mentalism and magic that makes the countdown feel like the culmination of something extraordinary. It's the difference between watching the ball drop on a screen and being part of something you'll remember forever.`,
        `December is our busiest month. Christmas party dates book 2–3 months in advance. New Year's Eve is a single-night event that fills first. If you're planning a holiday celebration in ${location}, reach out now to secure your date.`,
      ];
      break;

    case "premiere-red-carpet-magician":
      heroHeadline = `Premiere & Red Carpet Entertainment in ${location}`;
      heroSub = `The after-party entertainment that gives Hollywood's most jaded guests something they've never seen before.`;
      midCta = `Book Entertainment for Your ${location} Premiere or Studio Event`;
      intro = `Looking for entertainment for a premiere after-party, wrap party, or studio event in ${location}? Hollywood events need entertainment that matches the creative caliber of the work. White Rabbit delivers world-class close-up magic and mentalism that transforms industry events from predictable to unforgettable. Trusted by Netflix, Paramount, Lionsgate, and Disney.`;
      body = [
        `Every premiere after-party in ${location} follows the same playbook: open bar, DJ, step-and-repeat. Your guests have been to this party a hundred times. Close-up magic breaks the formula. Scott Syme moves through the VIP section, the green room, the cocktail area, creating moments of genuine astonishment that give directors, producers, and talent something they rarely experience at their own celebrations: surprise.`,
        `Scott is a member of the world-famous Magic Castle® in Hollywood and has performed for Netflix, Paramount, Lionsgate, and Disney. He understands the industry room. He knows that the EP doesn't want to be put on the spot, that the agent is there to network, and that the crew is ready to have the time of their lives. He reads each group and meets them exactly where they are.`,
        `Perfect for premiere after-parties, wrap parties, screening receptions, award show celebrations, studio holiday events, brand activations, and VIP lounges. No stage, no sound system, no setup time. Just a world-class entertainer who arrives and transforms the energy of the room.`,
        `Available for industry events across ${location}. Premiere and awards season dates (September through March) book quickly. Inquire now to secure your date.`,
      ];
      break;

    case "dmc-entertainment":
      heroHeadline = `DMC Entertainment & Magician in ${location}`;
      heroSub = `The local entertainment your incentive trip attendees will remember long after they check out.`;
      midCta = `Add White Rabbit to Your ${location} Program`;
      intro = `Building a ${location} itinerary for an incentive trip, corporate retreat, or VIP group experience? White Rabbit gives destination management companies a premium, turnkey entertainment option that transforms welcome receptions, farewell dinners, and group activities. No stage, no setup, no risk. Just world-class close-up magic and mentalism that creates genuine connection between attendees from the moment they arrive.`;
      body = [
        `DMCs know the challenge: every incentive trip needs a "wow" moment that justifies the investment. The excursion is great. The restaurant is great. But what makes attendees say "that was the best company trip I've ever been on"? It's the unexpected. It's walking into a welcome reception in ${location} and having a performer approach your group with something that stops the room. Within minutes, VPs from different offices who've never met are laughing together, bonded over something they can't explain.`,
        `Scott Syme is a member of the world-famous Magic Castle® in Hollywood and has performed for Netflix, Disney, Morgan Stanley, Rolls Royce, and the kind of private clientele that demands flawless execution. His close-up magic and mentalism require zero infrastructure: no stage, no sound system, no power. He integrates into any venue, any format, any timeline. For DMCs, that means one less vendor to coordinate and one more reason attendees will rave about the program.`,
        `The most effective format for incentive trips is a two-touch approach. First, roaming close-up magic during the welcome cocktail reception, breaking the ice across teams and regions. Then, a curated Private Magic Show as a surprise entertainment element during the farewell dinner. The first touch warms the room. The second closes the trip with a standing ovation. Together, they create the kind of program that gets DMCs rebookings and referrals.`,
        `White Rabbit is based in Los Angeles and travels nationwide. Close-up magic, mentalism, and professional sound equipment travel anywhere. Full theatrical staging (lighting and curtains) is available for greater Los Angeles events. Inquire about availability for your upcoming ${location} programs.`,
      ];
      break;

    case "resident-event-magician":
      heroHeadline = `Resident Event Magician in ${location}`;
      heroSub = `The entertainment upgrade that turns standard resident socials into the events your community talks about for months.`;
      midCta = `Book Resident Event Entertainment in ${location}`;
      intro = `Looking for entertainment for your ${location} apartment community's resident events? White Rabbit delivers world-class magic shows and close-up entertainment that transforms standard socials into the highest-attended, most talked-about events your building has ever hosted. NetVendor approved, fully insured, and turnkey. One vendor, zero headaches.`;
      body = [
        `Here's the reality of resident events: your residents have seen the same wine-and-cheese format at every building they've ever lived in. Attendance is low because nothing on the flyer is worth getting off the couch for. A professional magic show changes that equation instantly. When your residents see "Private Magic Show" on the invite, they show up. And when they experience it, they tell their neighbors who missed it. That's how you build real community.`,
        `Scott Syme is a member of the world-famous Magic Castle® in Hollywood, a NetVendor approved vendor, and fully insured. He has performed for Netflix, Disney, Morgan Stanley, Rolls Royce, and hundreds of private events. His style is sophisticated, conversational, and designed for adult audiences. No balloon animals. No cheesy props. Just elegant, interactive magic and mentalism that makes your residents feel like they're attending a private show at an exclusive members' club.`,
        `The format is simple and flexible. For Southern California properties, Scott brings a full turnkey production: emerald curtains, professional lighting, a curated soundtrack, and a 45-minute theatrical show that transforms your clubhouse, rooftop, or common area into a private theater. For properties nationwide, he brings world-class close-up magic, mentalism, and professional sound that works in any space. Either way, setup takes 30 minutes, your team doesn't lift a finger, and the experience is unforgettable.`,
        `Properties that book White Rabbit see immediate results: record attendance, overwhelmingly positive resident feedback, and rebookings before the curtains come down. In a market where retention and resident satisfaction are everything, entertainment that actually builds community isn't a line item. It's a competitive advantage. Available across ${location}. Inquire now.`,
      ];
      break;

    default:
      heroHeadline = "";
      heroSub = "";
      midCta = "";
      intro = "";
      body = [];
  }

  // Inject local venue reference as the third body paragraph
  const venueContext = getVenueContext(location, service.key);
  if (venueContext) {
    body.splice(2, 0, venueContext);
  }

  // Inject region-specific content for uniqueness (after venue context)
  const region = locationRegion[location];
  if (region && regionHooks[region]) {
    const hooks = regionHooks[region];
    // Add region event culture context as a body paragraph
    body.push(hooks.eventCulture);
    // Add audience style note
    body.push(hooks.audienceStyle);
    // For non-local markets, add travel note
    if (!tier1Markets.has(location)) {
      body.push(hooks.travelNote);
    }
  }

  const faqs = generateFaqs(location, service.key);

  // Check for city-specific content overrides
  const overrideKey = `${slugify(location)}--${service.key}`;
  const cityContent = citySpecificOverrides[overrideKey];

  return {
    slug,
    title: `${service.label} in ${location}`,
    metaTitle: `${service.label} in ${location} | Hire White Rabbit Magic`,
    metaDescription: `Hire the best ${service.label.toLowerCase()} in ${location}. White Rabbit delivers luxury magic entertainment trusted by Netflix, Disney & Morgan Stanley. Check availability now.`,
    category: service.category,
    location,
    serviceType: service.label,
    heroHeadline,
    heroSubheadline: heroSub,
    introParagraph: intro,
    bodyParagraphs: body,
    ...(cityContent ? { citySpecificContent: cityContent } : {}),
    midCtaText: midCta,
    ctaText: `Book White Rabbit for Your ${location} Event`,
    socialProof: testimonial.quote,
    socialProofAttribution: testimonial.attribution,
    faqs,
  };
}

// premiereLocations is defined above in the tier system

export const seoPages: SeoPage[] = locations.flatMap((location) =>
  serviceTypes
    .filter((service) => shouldGeneratePage(location, service.key))
    .map((service) => generatePage(location, service))
);

export function getSeoPageBySlug(slug: string): SeoPage | undefined {
  return seoPages.find((page) => page.slug === slug);
}

export function getSeoPagesByCategory(category: string): SeoPage[] {
  return seoPages.filter((page) => page.category === category);
}

export function getSeoPagesByLocation(location: string): SeoPage[] {
  return seoPages.filter((page) => page.location === location);
}

export const seoCategories = serviceTypes.map((s) => s.category);
export const seoLocations = [...locations];
