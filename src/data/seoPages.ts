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
    "Clients in Beverly Hills include Netflix, Disney, Morgan Stanley, Rolls-Royce, Who What Wear, Pistola Denim, Compass, and Taittinger Champagne. The events tend to be high-end corporate galas, luxury brand activations, and private estate dinners — the kind of rooms where the entertainment has to match the invite list. Scott's close-up magic and mentalism are built for exactly this environment: sophisticated, conversational, and impossible to dismiss.",
  ],
  "beverly-hills--private-party-magician": [
    "Private parties in Beverly Hills aren't casual. They're curated. The host has thought about the wine, the lighting, the playlist — and the entertainment needs to meet that same standard. White Rabbit has performed at private estate dinners throughout the 90210 where guests included executives from Netflix, Disney, and Compass. The magic is designed for adults with taste: no props, no gimmicks, just impossible moments happening in your guests' hands while they hold a glass of Taittinger.",
    "Scott has performed at intimate gatherings at The Beverly Hilton and private residences in the flats and Trousdale Estates. Whether it's a milestone birthday for 30 or a seated dinner for 80, the magic scales without losing what makes it work — the personal, one-on-one moments that make every guest feel like the evening was designed for them.",
  ],
  "beverly-hills--wedding-magician": [
    "Beverly Hills weddings are held at venues that demand world-class everything — The Beverly Hilton, Montage Beverly Hills, The Peninsula. The entertainment has to belong in that room. White Rabbit's cocktail hour magic is built for five-star settings: Scott moves through the crowd creating intimate moments of wonder for small groups, connecting guests from both families before they find their seats. No stage, no announcements — just elegant, interactive magic that feels right at home next to the champagne.",
    "Couples who book White Rabbit for Beverly Hills weddings often pair cocktail hour magic with a Private Magic Show at the rehearsal dinner. It gives the immediate family and wedding party an intimate, high-energy experience the night before — and by the time the ceremony arrives, both families are already bonded over something extraordinary.",
  ],
  "beverly-hills--close-up-magician": [
    "Close-up magic in Beverly Hills needs to hold up in rooms where the guests have seen everything. Scott has performed for audiences that include entertainment executives, luxury brand founders, and clients of Compass Beverly Hills — people who are used to being impressed and rarely are. The magic works because it's not a show you watch from a distance. It happens in your hands, with your ring, your phone, your choices. That's what cuts through the Beverly Hills filter.",
    "From brand activations for Who What Wear and Pistola Denim to private client events for Taittinger Champagne, Scott's close-up work is designed for the cocktail-hour format that Beverly Hills events favor: standing, mingling, drinks in hand. He reaches 80 to 120 guests in a standard cocktail hour, and the reactions carry — one group gasps, and suddenly the next group is pulling him over.",
  ],
  "beverly-hills--private-magic-show": [
    "The Private Magic Show transforms any Beverly Hills venue — a private dining room at The Beverly Hilton, an estate in Trousdale, a rooftop at Waldorf Astoria — into an intimate theater. Scott brings professional lighting, a curated soundtrack, and 45 minutes of material that gets standing ovations from audiences who don't stand for anything. This is the centerpiece experience that defines the White Rabbit brand: elegant, interactive, and designed to feel like a luxury experience, not just a magic act.",
    "Beverly Hills clients who've hosted the Private Magic Show include executives from Netflix, Disney, and Morgan Stanley. The format works for groups of 20 to 150 — large enough to generate real energy, intimate enough that every guest feels like part of the story. Most Beverly Hills bookings pair the show with roaming close-up magic during cocktail hour for two completely different experiences in one evening.",
  ],
  "beverly-hills--holiday-party-magician": [
    "Holiday parties in Beverly Hills compete with every other invitation on the calendar — and your guests' calendars are full. The entertainment is what separates a forgettable cocktail hour from the party everyone talks about through January. Scott has performed holiday events for clients including Netflix, Disney, and Morgan Stanley at venues like The Beverly Hilton, where the magic turned a standard corporate holiday party into the most talked-about event of the season.",
    "White Rabbit's close-up magic is perfectly suited for the Beverly Hills holiday format: standing receptions, circulating champagne, and guests who need a reason to put their phones down. Scott moves through the room creating shared moments of wonder that break down barriers between departments, clients, and plus-ones. By the time dinner is called, the energy in the room is electric.",
  ],
  "beverly-hills--charity-gala-magician": [
    "Beverly Hills galas attract donors who attend a dozen fundraisers a year. The entertainment has to do more than fill time — it has to shift the emotional temperature of the room before the ask. Scott has performed at charity events alongside brands like Taittinger Champagne and at venues including The Beverly Hilton, where his cocktail-hour magic created the kind of warmth and connection that translates directly to generosity when the paddle goes up.",
    "White Rabbit has also served as MC and auctioneer at fundraisers, including a record-breaking event for FosterAll. The combination of world-class entertainment and professional hosting eliminates the need for a separate emcee while keeping energy high through the live auction. For Beverly Hills nonprofits, that dual capability is a significant advantage.",
  ],
  "beverly-hills--trade-show-magician": [
    "Trade shows and brand activations in Beverly Hills attract a sophisticated audience that doesn't stop for generic booth entertainment. Scott has worked activations for luxury brands including Who What Wear, Pistola Denim, and Taittinger Champagne — environments where the magic has to feel on-brand, not bolted on. He weaves product messaging into close-up routines so naturally that attendees don't realize they're being marketed to. They just know they can't walk away.",
    "The format works for experiential pop-ups on Rodeo Drive, brand launch events at The Beverly Hilton, and private showroom activations throughout the Golden Triangle. Scott draws crowds, holds attention, and creates the kind of organic social content that luxury brands actually want their audience sharing.",
  ],
  "beverly-hills--rehearsal-dinner-magician": [
    "The Beverly Hills rehearsal dinner is where the wedding weekend truly begins — and the guest list is the most important room you'll gather all weekend. Scott has performed rehearsal dinners at venues throughout Beverly Hills where the magic served as the perfect icebreaker between families meeting for the first time. A full Private Magic Show at the rehearsal dinner gives your closest people a high-energy, intimate experience that sets the tone for everything that follows.",
    "Couples who book White Rabbit for the rehearsal dinner often add cocktail hour magic at the wedding reception the next day. By the time the ceremony arrives, both families are already connected — they bonded over something extraordinary the night before, and that energy carries through the entire weekend.",
  ],
  "beverly-hills--halloween-party-magician": [
    "Halloween in Beverly Hills means private estate parties where the production value rivals a studio set. The entertainment has to match. White Rabbit leans into the uncanny — mentalism, mind reading, and eerie coincidences that feel genuinely supernatural on the one night when everyone wants to believe. Scott has performed Halloween events at private residences throughout Beverly Hills where the magic blurred the line between performance and genuine mystery.",
    "The format works beautifully for costumed cocktail parties, seated dinner shows with a dark aesthetic, and roaming performances through elaborately decorated estates. Scott adjusts the tone to match the atmosphere — darker, more psychological, with effects that leave guests questioning what's real.",
  ],
  "beverly-hills--christmas-party-magician": [
    "Christmas parties in Beverly Hills need to feel special — not just another holiday gathering with the same playlist and open bar. Scott has performed holiday events for clients including Netflix and Disney at venues like The Beverly Hilton, where the magic transformed a corporate Christmas party into the event everyone referenced for the rest of the year. Close-up magic during cocktail hour creates shared moments that break down the end-of-year formality and get people genuinely connecting.",
    "For New Year's Eve celebrations, Scott brings a different energy — higher tempo, bigger reactions, countdown-ready. Whether it's a seated dinner party for 30 or a standing reception for 200, White Rabbit delivers the kind of entertainment that makes your Beverly Hills holiday event the one people actually want to attend.",
  ],
  "beverly-hills--premiere-red-carpet-magician": [
    "Beverly Hills premieres and industry events attract the most entertainment-savvy audiences in the world. These are people who work in the business of creating wonder — and they're the hardest to genuinely surprise. Scott has performed at after-parties and private industry events throughout Beverly Hills where the reactions from showrunners, producers, and talent were the same as anyone else's: pure, unfiltered amazement. Close-up magic bypasses the industry filter because it happens in your hands, not on a screen.",
    "White Rabbit has consulted for America's Got Talent and Disney Channel, and performed for executives at Netflix, Paramount, and Lionsgate. That industry credibility means Scott belongs in the room — he understands the culture, reads the energy, and delivers entertainment that impresses people who are professionally hard to impress.",
  ],
  "beverly-hills--dmc-entertainment": [
    "Destination management companies building Beverly Hills itineraries for incentive trips and VIP groups need entertainment that matches the caliber of the venues — The Beverly Hilton, Montage, The Peninsula. White Rabbit fits seamlessly into curated programs: welcome reception entertainment, VIP dinner performances, and private experiences that give groups something they can't get anywhere else. Scott arrives ready to perform with zero setup, fitting into whatever the DMC has planned.",
    "Clients who've booked White Rabbit through DMC partnerships include groups hosted by Morgan Stanley, Rolls-Royce, and Rivian. The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time — it breaks the ice instantly and gives people a shared experience to reference for the rest of the trip.",
  ],
  "beverly-hills--golf-tournament-magician": [
    "Golf tournaments at Beverly Hills-area clubs attract players who expect a premium experience from tee time through the awards dinner. White Rabbit fills the post-round gap — that awkward window between the last putt and the first toast — with roaming close-up magic that keeps players engaged, energized, and talking. Scott has performed at country club events throughout the Westside where the magic at the 19th hole became the most talked-about part of the day.",
    "Scott also stations at signature holes where groups back up, turning dead wait time into the highlight of the round. And he can serve as MC for the awards dinner, managing the flow from cocktails through trophies with the same polish he brings to corporate galas for clients like Morgan Stanley and Rolls-Royce.",
  ],
  "beverly-hills--resident-event-magician": [
    "Luxury residential communities in Beverly Hills — from high-rise buildings on Wilshire to boutique developments in the flats — need resident events that actually drive attendance and build community. White Rabbit transforms standard resident socials into the kind of evenings that make people proud of where they live. Scott's close-up magic creates genuine interaction between neighbors who might otherwise never connect beyond a nod in the elevator.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just world-class entertainment that fits into whatever space your community has — a rooftop lounge, a courtyard, a clubroom. Property managers report measurably higher attendance and resident satisfaction scores when White Rabbit is on the calendar.",
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
