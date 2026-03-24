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
    "Beverly Hills corporate events attract the most discerning clients in entertainment, finance, and luxury brands like Morgan Stanley, Rolls-Royce, and Compass. These aren't crowds impressed by card tricks; they're sophisticated professionals who've seen every type of performer. Close-up magic performed by someone who understands their world, who reads the room with precision and adapts on the fly, cuts through the noise of a high-stakes event.",
    "The venues here — Spago, the Peninsula Beverly Hills, the Maybourne — draw an industry-heavy crowd that expects excellence without pretension. Scott brings that same caliber of professionalism to intimate dinners for Who What Wear editors and Pistola Denim executives, moving through Michelin-starred dining rooms or sprawling mansion terraces with the kind of confidence that comes from years working with A-list clientele. Your guests won't just remember the magic; they'll remember the moment Scott turned a tense networking moment into genuine connection and laughter, right there at their table.",
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
  // ── Studio City ─────────────────────────────────────────────────────
  "studio-city--corporate-event-magician": [
    "Corporate events in Studio City are industry events by default. CBS Radford is right there, post-production houses line Ventura Boulevard, and the guest list at any company gathering is half people who work in entertainment. That makes the audience both the best and the hardest to perform for — they know what goes into a production, they've seen performers work, and they're not going to fake a reaction. When Scott's close-up magic genuinely surprises them, the response is real, and it spreads fast.",
    "Scott performs at corporate events throughout Studio City — venue receptions, restaurant buyouts along Ventura, and company parties at local spaces. The magic is designed for a crowd that appreciates craft. No gimmicks, no overselling. Just impossible things happening in their hands, performed by someone who belongs in a room full of people who do this for a living.",
  ],
  "studio-city--private-party-magician": [
    "Private parties in Studio City happen in the hills above Ventura Boulevard — homes with canyon views, backyards that feel like private venues, and guest lists full of writers, producers, editors, and the people who keep the entertainment industry running. Scott performs at these parties regularly, and the energy is always the same: a crowd that's socially sharp, professionally skeptical, and absolutely delighted when the magic is real.",
    "Wrap parties, birthday dinners, holiday gatherings, backyard celebrations — the Studio City party scene is casual but the standards are high. Scott's close-up magic fits the vibe: no stage, no production, just roaming through small groups and creating moments that stop conversations. The reactions from industry people who know how hard it is to fool an audience are some of the best Scott gets anywhere.",
  ],
  "studio-city--wedding-magician": [
    "Weddings in Studio City tend to be personal and relaxed — backyard ceremonies, receptions at local restaurants, and cocktail hours where the guest list is curated rather than sprawling. Scott's cocktail hour magic fits that intimacy. He moves through the crowd performing for small groups, connecting families who are meeting for the first time, and creating moments that set the tone for the evening without competing with the couple's vision.",
    "The Studio City crowd appreciates entertainment that feels genuine rather than performative. Scott's close-up magic is warm, interactive, and designed for mixed-age groups where industry people and out-of-town family stand in the same circle. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party a high-energy, intimate experience the night before.",
  ],
  "studio-city--close-up-magician": [
    "Close-up magic in Studio City hits different because the audience knows entertainment. They work in it, they produce it, they can tell when something is scripted versus when something is genuinely impossible. Scott's close-up magic is the latter — cards, borrowed objects, mentalism effects that happen six inches from their face and leave no explanation. The reactions from a Studio City crowd are visceral because they know what they're watching shouldn't be possible.",
    "The format works everywhere in Studio City — backyard parties in the hills, cocktail hours at restaurants along Ventura, corporate receptions at local venues. Scott moves through small groups, performs for four to eight people at a time, and the word spreads. By the end of the evening, people are finding him to ask for one more effect. That's what happens when close-up magic is performed well for an audience that actually understands the craft.",
  ],
  "studio-city--private-magic-show": [
    "The Private Magic Show in a Studio City living room, backyard, or private venue feels like a screening of something nobody else has seen. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations. The show is built to feel cinematic, which resonates with a Studio City audience that thinks in terms of story, pacing, and production value — and recognizes quality when they see it.",
    "For Studio City events, the Private Magic Show often follows roaming cocktail hour magic, giving guests two completely different experiences in one evening. The close-up magic is social and spontaneous. The show is theatrical and builds to a finale that earns a genuine standing ovation from people who don't give those out easily.",
  ],
  "studio-city--mentalist": [
    "Mentalism plays incredibly well in Studio City because the audience is analytical and competitive. Writers, producers, editors — they're pattern-matchers by profession. They watch Scott like they're looking for the tell, convinced they'll catch it. When he reads a thought or predicts a choice before it's made, the reaction hits harder because they genuinely believed they'd figure it out. They don't.",
    "Private dinners, corporate events, and backyard parties in Studio City are natural fits for mentalism. The effects are cerebral, the presentation is clean, and the audience participation is real. It's the kind of entertainment that earns respect from a crowd that creates entertainment professionally — and that's the highest compliment this neighborhood gives.",
  ],
  "studio-city--corporate-event-entertainer": [
    "Corporate entertainment in Studio City needs to clear a higher bar than most markets. The audience works in entertainment, so they've seen every format, every performer type, and every attempt to make a company party fun. Scott's close-up magic during cocktail hour cuts through that fatigue because it's personal, interactive, and genuinely impossible to explain. Real reactions happen, and they carry across the room.",
    "For production companies, post-production houses, and agencies based in Studio City, White Rabbit is the kind of booking that earns credibility with the team. People who spend their days creating content for millions get genuinely surprised by something happening right in front of them. That's a hard thing to pull off, and Scott does it consistently.",
  ],
  "studio-city--charity-gala-magician": [
    "Charity events in Studio City draw from the local entertainment industry community — producers, writers, post-production professionals, and their families. The entertainment at a Studio City fundraiser needs to feel genuine and high-quality, not like filler between the silent auction and the ask. Scott's cocktail hour magic creates real connection between donors, and the energy builds naturally. By the time the host speaks, the room is already warm and generous.",
    "The format works at Studio City restaurants, event venues, and private homes in the hills. Roaming magic during the reception gets people engaged, and if there's a live auction, the crowd is buzzing by the time bidding starts. Scott has also served as MC and auctioneer at fundraising events, keeping the flow tight and the energy consistent.",
  ],
  "studio-city--holiday-party-magician": [
    "Holiday parties in Studio City are wrap-season celebrations, post-production team dinners, and neighborhood gatherings where the guest list is mostly people who've been working long hours on set or in edit bays all year. They deserve a party that's actually fun, not just an open bar and a playlist. Scott's close-up magic gives people something to bond over that has nothing to do with work — genuine reactions, shared amazement, and a reason to put their phone down.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready. Whether it's a small dinner in the hills or a standing party at a Ventura Boulevard restaurant, White Rabbit makes your Studio City holiday event the one people talk about in January. December dates fill fast, especially during wrap season.",
  ],
  "studio-city--trade-show-magician": [
    "Trade shows and industry events near Studio City — including expos and conferences throughout the San Fernando Valley — draw a crowd that's been on the floor all day. Scott's close-up magic stops people at your booth, resets their attention, and gives your team a captive audience that's actually engaged. The magic can incorporate your product or messaging naturally, and with an entertainment-industry-adjacent crowd, the quality of the performance reflects directly on your brand.",
    "The format works for product launches, brand activations, and experiential marketing events targeting the Studio City and Valley market. Scott's booth magic is fast, polished, and designed for a crowd that knows when something is genuine. Exhibitors report significantly more foot traffic and better conversations when White Rabbit is part of the setup.",
  ],
  "studio-city--rehearsal-dinner-magician": [
    "Rehearsal dinners in Studio City happen at restaurants along Ventura Boulevard, private dining rooms, and homes in the hills. The guest list is small — immediate family and the wedding party — and the evening is supposed to bring two families together. Scott's close-up magic does that naturally. He moves table to table, creating moments that connect people who just met an hour ago, and the industry crowd appreciates the craft behind what he does.",
    "For couples hosting their rehearsal dinner in Studio City, Scott also offers the full Private Magic Show — 30 to 45 minutes of high-energy, interactive performance for the closest people in your life. It sets the tone for the whole wedding weekend and gives guests a shared experience that has nothing to do with seating charts.",
  ],
  "studio-city--halloween-party-magician": [
    "Halloween in Studio City has a specific energy — the neighborhood goes all in, the hills get dark early, and the parties lean into atmosphere. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. For a crowd that works in entertainment, the fact that they can't figure out the method makes it hit even harder.",
    "The format works for adult Halloween parties, themed dinners, and backyard gatherings where the host wants the entertainment to match the mood. Studio City's canyon homes provide a natural backdrop for something atmospheric, and Scott's material is sophisticated enough for a crowd that creates horror and thriller content for a living.",
  ],
  "studio-city--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Studio City are end-of-year celebrations for production teams, post-production houses, and industry families who've earned a real party. Scott's close-up magic during cocktail hour gives people something warm and communal to bond over. The reactions are genuine, and they set the tone for the rest of the evening — which matters when the crowd has been grinding through a production schedule all fall.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a dinner party in the hills or a standing reception at a local venue, White Rabbit makes your Studio City holiday event the one people reference through awards season. December dates fill fast in this market.",
  ],
  "studio-city--premiere-red-carpet-magician": [
    "Studio City is where a lot of entertainment gets made — CBS Radford, post-production houses, editing bays — and the wrap parties and industry celebrations happen locally. Scott's close-up magic works at these events because the crowd creates entertainment for a living and doesn't react to things that aren't genuinely impressive. When the magic lands with writers, producers, and editors, the reactions are authentic in a way that matters to this audience.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Lionsgate. Scott belongs in industry rooms, and Studio City is full of them. The magic is polished, the interactions are genuine, and the host gets credit for booking something that surprised a roomful of people who thought they were unsurprisable.",
  ],
  "studio-city--dmc-entertainment": [
    "Destination management companies bringing groups to the Studio City area — for studio tours, production visits, or Valley-based corporate retreats — want entertainment that captures the neighborhood's creative energy. White Rabbit fits into curated itineraries: welcome reception magic at local venues, dinner performances at restaurants along Ventura, and VIP experiences that give groups something memorable during networking hours.",
    "The magic works especially well during networking moments where attendees from different offices are meeting for the first time. Studio City's relaxed, industry-adjacent energy makes people open and present, and close-up magic takes advantage of that. Guests bond over shared amazement and leave with a story that has nothing to do with the conference agenda.",
  ],
  "studio-city--golf-tournament-magician": [
    "Golf tournaments at courses near Studio City and throughout the San Fernando Valley host their post-round receptions at clubhouses and local venues. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day, especially with an industry crowd that's competitive about everything.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using a Studio City venue for the evening program, having entertainment and hosting handled by the same person keeps the night moving and the energy consistent.",
  ],
  "studio-city--resident-event-magician": [
    "Studio City's apartment communities and residential developments want events that get residents out of their units and into the common spaces. The typical resident here works in entertainment or adjacent industries, and they need a real reason to show up on a weeknight. Scott's close-up magic gives them that reason — and a reason to stay longer than they planned, actually talking to their neighbors.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV requirements. Just polished entertainment that fits into whatever space your building has — a rooftop, a pool deck, a clubroom. Property managers report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar.",
  ],
  // ── Silver Lake ─────────────────────────────────────────────────────
  "silver-lake--corporate-event-magician": [
    "Corporate events in Silver Lake don't feel corporate. They happen at creative agencies, coworking spaces, and rented venues where the dress code is optional and the guest list is designers, writers, filmmakers, and people who'd rather quit than sit through a PowerPoint. Scott's close-up magic works in these rooms because it doesn't feel like corporate entertainment. It feels like something strange and wonderful happening at a party — which is exactly what it is.",
    "The Silver Lake crowd is skeptical of anything too polished or produced, which is why close-up magic and mentalism land so well here. There's no stage, no spotlight, no announcements. Just Scott moving through the room performing for small groups, and the reactions spreading organically. When someone who prides themselves on not being easily impressed grabs their friend's arm and says 'you have to see this,' that's the Silver Lake effect.",
  ],
  "silver-lake--private-party-magician": [
    "Private parties in Silver Lake happen in hillside bungalows, loft apartments, and backyards with string lights and a carefully curated playlist. The hosts here put real thought into the evening — the food, the drinks, the guest list — and they want entertainment that matches that intention without overwhelming it. Scott performs in Silver Lake regularly for house parties and birthday celebrations where the magic blends into the evening rather than taking it over.",
    "The crowd is younger, creative, and honest in their reactions. They're not going to fake amazement, which makes the genuine reactions even better. Scott's close-up magic is conversational, interactive, and designed for people standing in small groups with a natural wine in hand. The effects are impossible, the vibe is relaxed, and nobody feels like they're watching a show — they feel like something unexplainable just happened to them personally.",
  ],
  "silver-lake--wedding-magician": [
    "Silver Lake weddings are personal, intentional, and designed by couples who care about every detail. Venues like The Paramour Estate and Elysian set a tone that generic entertainment would ruin. Scott's cocktail hour magic fits the aesthetic — he moves through the crowd performing for small groups, creating moments of genuine wonder that connect guests without a microphone or a stage. The magic feels like a secret woven into the evening.",
    "The Silver Lake wedding crowd values authenticity, and Scott's close-up magic delivers that. Nothing scripted, nothing cheesy, nothing that makes guests cringe. Just real reactions from real people who are standing together with drinks, meeting each other for the first time. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party an intimate, high-energy experience the night before.",
  ],
  "silver-lake--close-up-magician": [
    "Close-up magic in Silver Lake works because this neighborhood values things that are real, handmade, and a little bit weird. Scott's close-up magic is all of that — cards, borrowed objects, mentalism effects that happen in your hands and leave no explanation. The Silver Lake audience doesn't want to be dazzled from across a room. They want something to happen right in front of them that they can't explain, and then they want to talk about it with their friends for the next hour.",
    "House parties, gallery openings, creative agency events, and intimate receptions are all natural fits. Scott moves through small groups, performs for four to eight people at a time, and the reactions carry. One group loses it, the next group comes over, and suddenly the magic is the conversation. In a neighborhood that's seen every DJ, every photo booth, and every acoustic guitar guy, close-up magic is the thing people haven't experienced — and it shows in their reactions.",
  ],
  "silver-lake--private-magic-show": [
    "The Private Magic Show in a Silver Lake setting — a loft cleared for 40 guests, a backyard under string lights, a private room at a local venue — feels like an underground experience you stumbled into. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations. The show is theatrical and intimate, which pairs well with Silver Lake's appetite for things that feel discovered rather than marketed.",
    "For Silver Lake events, the show often follows roaming cocktail hour magic, giving guests two completely different experiences. The close-up magic is spontaneous and social. The show is cinematic and builds to a finish that earns a genuine standing ovation from an audience that doesn't hand those out freely. It's the kind of evening that makes guests feel like they were part of something special.",
  ],
  "silver-lake--mentalist": [
    "Mentalism in Silver Lake plays well because this crowd is curious and analytical. Creatives, writers, designers — they want to understand how things work, and when they can't, it sticks with them. When Scott reads a thought or predicts a choice before it's made, the Silver Lake audience doesn't just react — they obsess. They'll spend the rest of the party trying to figure it out, and the fact that they can't is what makes it memorable.",
    "Private dinners, creative agency events, and house parties in Silver Lake are natural fits for mentalism. The effects are cerebral, the presentation is understated, and the audience participation is real. It's the kind of entertainment that earns respect from a crowd that values substance over spectacle.",
  ],
  "silver-lake--corporate-event-entertainer": [
    "Corporate events in Silver Lake are creative industry gatherings — agency parties, startup celebrations, design studio milestones. The crowd is allergic to anything that feels forced or formulaic. Scott's close-up magic during cocktail hour gives guests a shared experience that actually connects people. No announcements, no programming, just real reactions happening in small groups that ripple across the room.",
    "For creative companies in Silver Lake, White Rabbit is the kind of booking that generates genuine buzz. People talk about it the next day, they text each other about it, they try to describe what happened and can't quite get there. That's the value — it creates something real in a neighborhood that can smell something fake from a block away.",
  ],
  "silver-lake--charity-gala-magician": [
    "Charity events in Silver Lake tend to be community-driven — local nonprofits, arts organizations, and causes that the neighborhood cares about personally. The entertainment needs to feel genuine, not corporate. Scott's cocktail hour magic creates warmth between donors and guests, and the energy builds naturally. By the time the ask comes, people are connected to each other and to the evening in a way that makes generosity feel easy.",
    "The format works at Silver Lake venues, galleries, and private homes. Roaming magic during the reception builds genuine engagement, and Scott's style — conversational, warm, and nothing like a typical fundraiser performer — matches what Silver Lake expects from an evening out.",
  ],
  "silver-lake--holiday-party-magician": [
    "Holiday parties in Silver Lake are house parties, agency celebrations, and neighborhood gatherings where the host wants something better than a playlist and a drink table. Scott's close-up magic gives people something unexpected to bond over — real reactions, real surprise, and the kind of shared experience that turns a good party into the one everyone talks about through the new year.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready. Whether it's 20 people in a bungalow or 80 at a rented venue, White Rabbit makes your Silver Lake holiday event the one people actually remember. December dates fill fast in every market.",
  ],
  "silver-lake--trade-show-magician": [
    "Trade shows and creative industry events near Silver Lake attract a design-savvy, visually literate crowd that's been walking the floor all day. Scott's close-up magic stops them — not with volume, but with something genuinely impossible happening at arm's length. The magic can incorporate your product or messaging naturally, and the Silver Lake audience responds to authenticity, so the integration has to feel organic rather than forced.",
    "The format works for brand activations, pop-up events, and experiential marketing targeting the eastside creative community. Exhibitors report more foot traffic and higher-quality engagement when White Rabbit is part of the setup. For a crowd that curates everything, having a magician at your booth signals that your brand gets it.",
  ],
  "silver-lake--rehearsal-dinner-magician": [
    "Rehearsal dinners in Silver Lake happen at local restaurants, private dining rooms, and homes in the hills. The guest list is small and the evening is supposed to feel warm and personal. Scott's close-up magic moves table to table, creating moments that connect two families who may be meeting for the first time. The Silver Lake setting — relaxed, intimate, intentional — makes those connections feel natural rather than forced.",
    "For couples hosting their rehearsal dinner in Silver Lake, Scott also offers the full Private Magic Show — 30 to 45 minutes of high-energy, interactive performance for the closest people in your life. Venues like The Paramour Estate and Elysian work beautifully for both the dinner and the show.",
  ],
  "silver-lake--halloween-party-magician": [
    "Halloween in Silver Lake is a neighborhood-wide event — the costumes are creative, the parties run late, and the bar for what counts as interesting is high. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. For a crowd that values the strange and the unexplainable, Halloween mentalism is a perfect fit.",
    "The format works for adult Halloween parties, themed dinners, and house parties where the host wants the entertainment to feel atmospheric and real. Silver Lake's hillside homes, dim lighting, and October energy provide a natural backdrop for something that stays with people past the Uber ride home.",
  ],
  "silver-lake--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Silver Lake are intimate gatherings — house parties, agency celebrations, and dinner parties where the guest list is curated. Scott's close-up magic during cocktail hour gives people something genuine to bond over. The reactions are real, the connections are warm, and the evening has a center of gravity that goes beyond the usual holiday party formula.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, midnight-ready material. Whether it's a small dinner in the hills or a standing party at a local venue, White Rabbit makes your Silver Lake holiday event the one people talk about in January. December dates fill fast.",
  ],
  "silver-lake--premiere-red-carpet-magician": [
    "Silver Lake hosts indie screenings, gallery openings, and creative industry events where the crowd is filmmakers, artists, musicians, and the people who champion independent work. Scott's close-up magic works in these rooms because it's not a production — it's a moment. Something impossible happening in your hands while you're standing in a gallery or at an after-party. The reactions from Silver Lake's creative community are genuine and unguarded in a way that bigger industry events rarely produce.",
    "White Rabbit has worked with Netflix, Disney, and Paramount, but Scott's style fits indie rooms just as naturally. He reads the energy, matches the crowd, and delivers something that earns real reactions from people who spend their lives making things that are supposed to surprise other people.",
  ],
  "silver-lake--dmc-entertainment": [
    "Destination management companies bringing groups to Silver Lake and the LA eastside want entertainment that captures the neighborhood's creative, independent energy. White Rabbit fits into curated eastside itineraries: welcome reception magic at local venues, dinner performances at restaurants, and VIP experiences that give groups something genuinely memorable during networking hours.",
    "The magic works especially well during networking moments where attendees are meeting for the first time. Silver Lake's relaxed, creative energy makes people open and curious, and close-up magic takes advantage of that. Guests bond over shared amazement and leave with a story that feels like something that could only happen in this neighborhood.",
  ],
  "silver-lake--golf-tournament-magician": [
    "Golf events near Silver Lake and the eastside host their post-round receptions at clubhouses and local venues. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic becomes the most talked-about part of the day, and Scott's style — conversational, sharp, zero cheese — fits the eastside energy.",
    "Scott also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. For tournament organizers using an eastside venue for the evening program, having entertainment and hosting handled by the same person keeps the night moving and the energy consistent.",
  ],
  "silver-lake--resident-event-magician": [
    "Silver Lake's apartment communities and residential buildings want events that actually get people to show up. The typical resident here is a younger creative professional — a designer, a writer, someone in production — and they need a real reason to come to a building event. Scott's close-up magic gives them that reason and a reason to stay longer than they planned, actually meeting their neighbors for the first time.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV. Just polished entertainment that fits into whatever space your building has — a rooftop, a courtyard, a common room. Property managers report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar.",
  ],
  // ── Miami ───────────────────────────────────────────────────────────
  "miami--corporate-event-magician": [
    "Art Basel weekend galas at the Faena, Vizcaya mansion dinners for Latin American business leaders, South Beach corporate retreats that double as luxury experiences. When international executives and Miami's entrepreneurial elite gather at The Surf Club or in Coral Gables estates, they expect entertainment that matches the caliber of the setting. Scott Syme flies in regularly from Los Angeles to perform at these high-level events, bringing the same magic he does for Fortune 500 companies and entertainment industry players.",
    "White Rabbit magic at a Miami corporate event isn't just about the sleight of hand — it's about reading a room full of international business travelers and creating moments of genuine wonder in the midst of deal-making and networking. Close-up magic works beautifully in the intimate settings where Miami's real business happens: waterfront dinners, private hotel suites, and poolside receptions where genuine connection matters more than flashy production. Scott understands Miami's pace and energy, and his work translates seamlessly across the cultural and business backgrounds you'll have in the room.",
  ],
  "miami--private-party-magician": [
    "Private parties in Miami happen on waterfront terraces, in penthouse living rooms overlooking Biscayne Bay, on yachts, and at estates in Coral Gables and Miami Beach. The hosts care about the experience — the food, the drinks, the guest list — and they want entertainment that matches the effort without overwhelming the evening. Scott flies in from LA for Miami private parties, and the format works beautifully: roaming close-up magic for small groups, no stage, no setup, just impossible things happening while guests hold a cocktail.",
    "Miami is one of Scott's most requested travel destinations for private events. Birthday milestones, engagement celebrations, holiday gatherings, Art Basel parties — the magic fits any format because it adapts to the crowd and the space. The reactions from Miami audiences are loud, warm, and contagious. One group loses it, the next group comes over, and the party has a pulse it didn't have ten minutes ago.",
  ],
  "miami--wedding-magician": [
    "Miami weddings are stunning — waterfront ceremonies, cocktail hours at venues like The Surf Club, Faena Hotel, and Vizcaya, and receptions that run late with the ocean breeze coming through. Scott's cocktail hour magic fits the beauty of these events. He moves through the crowd performing for small groups while the sunset does its thing behind them, and the reactions spread naturally. Guests bond over something unexpected, and by dinner, the energy is warm and connected.",
    "Scott flies in from LA for Miami wedding bookings and coordinates travel seamlessly. The magic is designed for mixed-age, multicultural guest lists — which describes most Miami weddings perfectly. He reads the room, adjusts his energy, and creates moments that work for everyone from the bride's abuela to the groom's college roommates. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party an intimate, high-energy experience the night before.",
  ],
  "miami--close-up-magician": [
    "Close-up magic in Miami works because the events here are built around being outside, standing close, and socializing. Rooftop terraces, poolside receptions, waterfront cocktail hours — guests are in small groups with drinks, talking, and open to something unexpected. Scott moves through these spaces performing for clusters of four to eight people, and the Miami crowd reacts big. Cards, borrowed objects, mentalism — everything happens in their hands and they can't process it.",
    "Scott flies in from LA for Miami close-up magic bookings, and the city's event scene is a natural fit for the format. No stage, no AV, no setup — just Scott working the room and creating moments that guests replay for each other the rest of the night. The warmth of Miami audiences makes every reaction contagious, and by the end of cocktail hour, most of the room has either seen something or heard about it from someone who did.",
  ],
  "miami--private-magic-show": [
    "The Private Magic Show in a Miami setting — a private event space at Faena, a living room in a Coral Gables estate, a yacht salon, a rooftop with the skyline behind it — feels exclusive and cinematic. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that gets standing ovations. The show is theatrical, interactive, and built for an audience that appreciates something crafted and intentional.",
    "Scott flies in from LA for Miami Private Magic Show bookings. For events outside Los Angeles, production needs are coordinated with the host or their event team — Scott brings the performance, and the venue provides the power and the space. The show pairs beautifully with roaming cocktail hour magic, giving guests two completely different experiences in one evening.",
  ],
  "miami--mentalist": [
    "Mentalism in Miami plays well because the crowd is expressive and competitive. Finance people, entrepreneurs, hospitality executives — they watch Scott closely, convinced they'll catch something. When he reads a thought or predicts a choice before it's made, the reactions are explosive because this crowd genuinely believed they had it figured out. They didn't, and that's what makes it memorable.",
    "Corporate retreats in South Beach, private dinners in Coral Gables, and VIP receptions at waterfront venues are all natural fits for mentalism. Scott flies in from LA and the format works in any Miami setting — a boardroom, a private dining room, a terrace with the water behind him. The effects are cerebral, the presentation is clean, and the audience participation is real.",
  ],
  "miami--corporate-event-entertainer": [
    "Miami corporate events need entertainment that matches the city's energy — warm, social, and high-impact. Scott's close-up magic during cocktail hour gives guests a shared experience that actually breaks through the networking small talk. Real reactions, real surprise, and the kind of moments that get mentioned in follow-up emails. He flies in from LA for Miami corporate bookings and the format works at hotels, waterfront venues, and private event spaces throughout the city.",
    "For companies hosting client appreciation events, team retreats, or holiday parties in Miami, White Rabbit is the booking that makes the evening feel different from every other cocktail reception. The magic is polished, the interactions are genuine, and the host gets credit for finding something their guests haven't seen before.",
  ],
  "miami--charity-gala-magician": [
    "Charity galas in Miami are major events — waterfront ballrooms, donor lists that expect world-class everything, and an evening that needs to feel worthy of the cause and the crowd. Scott's cocktail hour magic creates genuine connection between donors. Strangers bond over something unexpected, the mood turns generous, and the ask lands differently when the room already feels alive. Scott flies in from LA for Miami gala bookings.",
    "The format works at Miami's iconic venues — hotel ballrooms, waterfront estates, museum event spaces. Roaming magic during the reception builds warmth, and if there's a live auction, the crowd is already engaged by the time bidding starts. The entertainment serves the fundraising goal without ever feeling like a sales pitch.",
  ],
  "miami--holiday-party-magician": [
    "Holiday parties in Miami have a different flavor than the rest of the country — outdoor venues, warm weather, and a crowd that's ready to celebrate. Scott's close-up magic gives people something to bond over that isn't work talk. Real reactions, real laughter, and a shared experience that makes the evening feel special rather than obligatory. He flies in from LA for Miami holiday bookings, and December dates fill fast.",
    "For New Year's Eve in Miami, Scott brings his highest energy — fast pace, big reveals, countdown-ready material. Whether it's a rooftop party in South Beach or a private estate dinner in Coral Gables, White Rabbit makes your Miami holiday event the one people reference well into January.",
  ],
  "miami--trade-show-magician": [
    "Trade shows and conventions in Miami — the Convention Center, hotel expo spaces throughout South Beach and Downtown — draw crowds from across the Americas. Scott's close-up magic stops people at your booth, resets their attention, and gives your team a captive audience that's genuinely engaged. The magic can incorporate your product or messaging naturally, and the multicultural Miami audience responds well to entertainment that's visual, interactive, and doesn't depend on language.",
    "Scott flies in from LA for Miami trade show bookings. Exhibitors report significantly more foot traffic and higher-quality conversations when White Rabbit is part of their booth strategy. For brands looking to stand out on a crowded expo floor, a magician who can draw a crowd and hold it is worth more than another banner.",
  ],
  "miami--rehearsal-dinner-magician": [
    "Rehearsal dinners in Miami happen at waterfront restaurants, private dining rooms at hotels like The Surf Club and Faena, and family homes in Coral Gables and Coconut Grove. The guest list is small — immediate family and the wedding party — and the evening is supposed to bring two families together. Scott's close-up magic does that naturally, moving table to table and creating moments that connect people who just met.",
    "Scott flies in from LA for Miami rehearsal dinner bookings. For couples who want the full experience, he offers a Private Magic Show — 30 to 45 minutes of high-energy, interactive performance for the closest people in your life. The warmth of a Miami evening paired with an intimate show creates something guests remember separately from the wedding itself.",
  ],
  "miami--halloween-party-magician": [
    "Halloween parties in Miami lean into atmosphere — rooftop events with the skyline lit up, estate parties in Coral Gables, themed gatherings at South Beach venues. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. It's sophisticated dark wonder for a city that knows how to throw a party.",
    "Scott flies in from LA for Miami Halloween bookings. The format works for adult Halloween parties, themed dinners, and cocktail events where the host wants the entertainment to match the mood. Miami's natural warmth and energy make the darker material hit differently — there's a contrast between the tropical setting and the uncanny effects that stays with people.",
  ],
  "miami--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Miami are outdoor celebrations, waterfront dinners, and rooftop parties where the weather cooperates and the energy is high. Scott's close-up magic during cocktail hour gives guests something warm and genuine to bond over. The reactions are real, and they set the tone for the rest of the evening. He flies in from LA for Miami holiday bookings.",
    "For New Year's Eve in Miami, Scott brings his highest energy — fast pace, big reveals, midnight-ready material. Whether it's a seated dinner overlooking the water or a standing party for 200 at a South Beach hotel, White Rabbit makes your Miami holiday event the one people talk about well into the new year. December and NYE dates fill early — reach out sooner rather than later.",
  ],
  "miami--premiere-red-carpet-magician": [
    "Miami hosts Art Basel events, film festival parties, music industry gatherings, and brand activations that draw a national and international crowd. Scott's close-up magic works at VIP receptions, after-parties, and private gatherings where the audience is creative professionals, collectors, and industry people who appreciate something unexpected. The magic is polished enough for any venue and interactive enough to break through the usual scene.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott flies in from LA for Miami industry events and fits into the energy of the room — no production, no disruption, just world-class magic during the moments when people are gathered and open to something real.",
  ],
  "miami--dmc-entertainment": [
    "Destination management companies bringing groups to Miami want entertainment that captures the city's energy — waterfront luxury, Latin flair, and a pace that's social and warm. White Rabbit fits into curated Miami itineraries: welcome reception magic at South Beach hotels, dinner performances at waterfront restaurants, and VIP experiences that give groups something genuinely memorable between conference sessions.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. Miami's social energy makes people open and present, and close-up magic takes advantage of that. Guests bond quickly over shared amazement and leave with a story that has nothing to do with the agenda. Scott flies in from LA and coordinates with DMC teams on timing and logistics.",
  ],
  "miami--golf-tournament-magician": [
    "Golf tournaments at Miami-area courses — Doral, Key Biscayne, Coral Gables — host their post-round receptions at clubhouses and waterfront venues. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day.",
    "Scott flies in from LA for Miami golf tournament bookings and also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. The Miami golf crowd is social, competitive, and ready to be entertained — close-up magic that's sharp and interactive fits that energy perfectly.",
  ],
  "miami--resident-event-magician": [
    "Miami's luxury condo towers — Brickell, South Beach, Sunny Isles, Coconut Grove — want resident events that actually get people out of their units and into the common spaces. The typical resident in a high-end Miami building is successful, social, and selective about how they spend an evening. Scott's close-up magic gives them a reason to come downstairs — and a reason to stay.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV. Just polished entertainment that fits into whatever space your building has — a rooftop pool deck, a residents' lounge, a waterfront terrace. Property managers report stronger turnout and more genuine resident interaction when White Rabbit is on the calendar. Scott flies in from LA for Miami residential bookings.",
  ],
  // ── Las Vegas ───────────────────────────────────────────────────────
  "las-vegas--corporate-event-magician": [
    "The irony of doing magic in Vegas is that people assume they've seen it all. They've watched the big stage shows, the residency acts, the guys on the Strip with the cards. But close-up magic and mentalism are a completely different experience — something impossible happening six inches from your face, with your ring, your card, your phone. No stage, no curtain, no distance. That's what makes it hit harder than anything on the Strip, and that's why corporate event planners in Vegas keep booking Scott.",
    "Scott flies in from LA regularly for Las Vegas corporate events — private dinners at Wynn and Bellagio, company receptions at Aria, and VIP hospitality suites during conventions. The Vegas corporate crowd is a mix of executives, clients, and attendees who've been on the convention floor all day and need something that actually wakes them up. Close-up magic does that in about 90 seconds.",
  ],
  "las-vegas--private-party-magician": [
    "Private parties in Las Vegas happen in high-roller suites, penthouse rentals, and private dining rooms at resort restaurants. The guest counts are often small — 20 to 60 people — and the host wants the evening to feel exclusive and memorable. Scott's roaming close-up magic fits that energy. He arrives, reads the room, and starts performing for small groups without any announcement. The reactions carry across the suite, and by the end of the night, every guest has a story.",
    "Scott flies in from LA for Vegas private party bookings. Birthday milestones, bachelor and bachelorette dinners, celebration weekends, and private gatherings where the host wants something better than bottle service and a DJ. The Vegas audience is primed for entertainment, which means the reactions are big and the energy builds fast.",
  ],
  "las-vegas--wedding-magician": [
    "Las Vegas weddings range from intimate ceremonies at Red Rock Canyon resorts to grand celebrations at the Bellagio, Wynn, and Aria. Scott's cocktail hour magic fits both ends of that spectrum. He moves through the crowd performing for small groups — close-up magic and mentalism that connect guests and create genuine moments of wonder while the venue does its thing in the background.",
    "The Vegas wedding crowd comes from everywhere, which means the guest list is diverse and the icebreaking matters more than usual. Scott's magic is the fastest way to get strangers talking. He flies in from LA for Vegas wedding bookings and coordinates with planners and venue teams seamlessly. He's also available for rehearsal dinners, where a Private Magic Show gives the immediate family and wedding party a high-energy experience the night before.",
  ],
  "las-vegas--close-up-magician": [
    "Close-up magic in Las Vegas is a different conversation than the stage shows on the Strip. Those are spectacles you watch from Row 12. Close-up magic happens in your hands — your card, your borrowed watch, your phone showing something that shouldn't be there. The Vegas audience thinks they know magic because they've seen a Cirque show and a guy at a casino bar. Then Scott performs for them at a private event and they realize they've never actually experienced magic up close. The reactions are some of the loudest Scott gets anywhere.",
    "Scott flies in from LA for Vegas close-up magic bookings. The format works at private dinners, VIP receptions, trade show hospitality suites, and cocktail hours at resort venues. No stage, no setup — just Scott moving through the room, and every group getting two to three minutes of something they'll be talking about on the flight home.",
  ],
  "las-vegas--private-magic-show": [
    "The Private Magic Show in a Las Vegas setting — a private suite at Wynn, a resort event space, a penthouse overlooking the Strip — feels like something exclusive that the big casino shows can't touch. It's intimate, interactive, and built for 20 to 150 people who are sitting close enough to see every detail. Scott brings professional lighting, a curated soundtrack, and 30 to 45 minutes of material that earns standing ovations from audiences who walked in thinking they'd seen magic before.",
    "For Las Vegas events, the Private Magic Show often follows roaming cocktail hour magic, giving guests two completely different experiences. Scott flies in from LA and coordinates production with the venue. The show reflects the same level of craft that earned him a membership at the Magic Castle — every effect is rehearsed, every transition is clean, and the audience never sees the work behind it.",
  ],
  "las-vegas--mentalist": [
    "Mentalism in Las Vegas is a strong play because the audience is already in a heightened state. They're in Vegas, they're out of their routine, and they're primed to have their mind blown. When Scott reads a thought or predicts a choice before it's made, the Vegas crowd reacts bigger and faster than almost any other market. They came to be amazed, and mentalism delivers that in a way that feels personal rather than produced.",
    "Corporate dinners, VIP receptions, and private events at Wynn, Bellagio, and Aria are all natural fits. Scott flies in from LA for Vegas mentalism bookings. The effects are cerebral, the presentation is polished, and the audience participation is real. It's a completely different experience from anything on the Strip, and that's exactly the point.",
  ],
  "las-vegas--corporate-event-entertainer": [
    "Corporate entertainment in Las Vegas has a specific challenge: the city itself is the entertainment. Your event is competing with every restaurant, show, and casino on the Strip. Scott's close-up magic during cocktail hour wins that competition because it's happening right in front of your guests, it's personal, and they can't get it anywhere else — not even in Vegas. The reactions are genuine, the connections are real, and the event has a story.",
    "Scott flies in from LA for Vegas corporate bookings and has performed at private events at Wynn, Bellagio, and Aria. For companies hosting client dinners, incentive trips, or convention after-parties, White Rabbit is the entertainment that makes your event the one people remember — not the casino, not the steakhouse, your event.",
  ],
  "las-vegas--charity-gala-magician": [
    "Charity galas in Las Vegas attract donors from across the country, and the entertainment needs to match the venue and the stakes. Scott's cocktail hour magic creates genuine warmth between donors who may be meeting for the first time. The energy builds naturally, and by the time the ask comes, the room is connected and generous. Scott flies in from LA for Vegas gala bookings.",
    "The format works at resort ballrooms, private event spaces, and hotel venues throughout the city. Roaming magic during the reception builds momentum, and if there's a live auction, the crowd is already engaged. Scott has also served as MC and auctioneer at fundraising events, keeping the flow tight and the energy high through the giving portion of the evening.",
  ],
  "las-vegas--holiday-party-magician": [
    "Holiday parties in Las Vegas are company celebrations, incentive trip dinners, and private gatherings at resort venues where the host wants the evening to stand out from everything else happening in the city. Scott's close-up magic gives guests something personal and unexpected — a shared experience that makes the party feel like the highlight of the trip, not just another dinner at a nice restaurant.",
    "For New Year's Eve in Vegas, Scott brings his highest energy — fast pace, big reveals, midnight-ready material. He flies in from LA and December dates fill fast, especially for corporate groups booking convention-adjacent holiday events. The Vegas NYE crowd is ready to celebrate, and White Rabbit gives them a reason to remember your party specifically.",
  ],
  "las-vegas--trade-show-magician": [
    "Trade shows are the lifeblood of Las Vegas — CES, conventions at the Venetian Expo, industry events at every major resort. The expo floor is a war for attention, and most booths lose that war. Scott's close-up magic changes the equation. Within minutes, a crowd forms at your booth, attention spans reset, and your team has a captive audience that's genuinely engaged. The magic can incorporate your product messaging naturally, and the ROI shows up in lead counts.",
    "Scott flies in from LA for Vegas trade show bookings and has worked with brands on experiential booth activations. The format is designed for the expo floor — quick-hit routines that hook passersby, custom reveals that feature your product, and a presence that makes your booth the one people tell their colleagues about at the hotel bar that night. In a city built on spectacle, close-up magic at arm's length is the thing people don't expect.",
  ],
  "las-vegas--rehearsal-dinner-magician": [
    "Rehearsal dinners in Las Vegas happen at resort restaurants, private dining rooms at Wynn, Bellagio, and Aria, and boutique venues off the Strip. The guest list is small — immediate family and the wedding party — and many of them just flew in from different cities. Scott's close-up magic brings the group together fast. He moves table to table creating moments that connect two families before the wedding even starts.",
    "Scott flies in from LA for Vegas rehearsal dinner bookings. For couples who want the full experience, he offers a Private Magic Show — 30 to 45 minutes of high-energy, interactive performance for the closest people in your life. In Vegas, where entertainment is everywhere, having something private and personal for your inner circle feels even more special.",
  ],
  "las-vegas--halloween-party-magician": [
    "Halloween parties in Las Vegas go big — themed events at resort venues, private parties in penthouse suites, and gatherings where the production value is already high. Scott's mentalism and mind-reading material takes on a darker edge on Halloween: thoughts read with unsettling accuracy, predictions that shouldn't be possible, effects that feel genuinely supernatural. In a city where spectacle is the baseline, something intimate and eerie stands out.",
    "Scott flies in from LA for Vegas Halloween bookings. The format works for adult Halloween parties, themed dinners, and VIP events where the host wants the entertainment to match the atmosphere. The contrast between Vegas flash and quiet, personal mentalism is what makes it hit — people remember the thing that surprised them, not the thing that was loud.",
  ],
  "las-vegas--christmas-party-magician": [
    "Christmas parties and New Year's Eve events in Las Vegas are high-energy celebrations — company dinners at resort restaurants, holiday galas at hotel ballrooms, and private parties in suites overlooking the Strip. Scott's close-up magic during cocktail hour gives guests something genuine and personal to bond over. In a city that never stops, a moment of real human connection actually stands out.",
    "For New Year's Eve in Vegas, Scott brings his highest energy — fast pace, big reveals, countdown-ready material. He flies in from LA and NYE dates book fast. Whether it's a seated dinner for 40 or a standing party for 300, White Rabbit makes your Vegas holiday event the one people talk about on the flight home.",
  ],
  "las-vegas--premiere-red-carpet-magician": [
    "Las Vegas hosts premieres, celebrity events, and entertainment industry gatherings throughout the year — award show after-parties, residency launches, and private events at resort venues. Scott's close-up magic works at VIP receptions and after-parties because it's personal and unexpected in a city where everyone's surrounded by entertainment. He reads the room, matches the energy, and delivers something that surprises people who thought Vegas had shown them everything.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott flies in from LA for Vegas industry events and fits into VIP rooms naturally — no production, no disruption, just world-class magic during the moments when people are gathered and open to something real.",
  ],
  "las-vegas--dmc-entertainment": [
    "Destination management companies bringing groups to Las Vegas want entertainment that stands out from the Strip's noise. White Rabbit fits into curated Vegas itineraries: welcome reception magic at resort venues, dinner performances at private restaurants, and VIP experiences during hospitality events that give groups something personal and memorable between convention sessions.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. In Vegas, everyone's in a good mood and open to new experiences, which makes close-up magic land even harder. Guests bond over shared amazement and leave with a story that has nothing to do with the conference agenda. Scott flies in from LA and coordinates with DMC teams on timing and logistics.",
  ],
  "las-vegas--golf-tournament-magician": [
    "Golf tournaments at Las Vegas courses — Shadow Creek, TPC Summerlin, Wynn Golf Club — host their post-round receptions at clubhouses and resort venues. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day.",
    "Scott flies in from LA for Vegas golf tournament bookings and also serves as MC for the awards dinner, keeping the flow tight from cocktails through trophies. The Vegas golf crowd is there to enjoy themselves, and close-up magic that's sharp, social, and impossible to figure out fits that energy perfectly.",
  ],
  "las-vegas--resident-event-magician": [
    "Las Vegas's luxury residential communities — Summerlin, Henderson, and the high-rise condos on the Strip — want resident events that feel different from what's available outside the front door. The typical resident in a high-end Vegas building or community has access to every show and restaurant in the city, so the event entertainment needs to offer something they can't get at a casino. Scott's close-up magic is exactly that — personal, intimate, and happening in their hands.",
    "The format is simple: Scott arrives during the cocktail hour and moves through the room performing for small groups. No stage, no setup, no AV. Just polished entertainment that fits into whatever space your community has — a clubhouse, a pool deck, a residents' lounge. Property managers report stronger turnout and more genuine interaction when White Rabbit is on the calendar. Scott flies in from LA for Vegas residential bookings.",
  ],
  // ── Brentwood ────────────────────────────────────────────────────────
  "brentwood--corporate-event-magician": [
    "Corporate events in Brentwood are rare — and that's the point. When they happen, they're intimate executive dinners, partner retreats, or client appreciation evenings hosted at private homes or members-only spots along San Vicente. The guest list is small and the expectations are high. Scott's close-up magic fits these settings because it's personal, quiet, and impossible to ignore when it's happening in your hands across the dinner table.",
    "The Brentwood corporate crowd is senior-level — managing partners, C-suite executives, entertainment lawyers. These aren't people who want a show. They want something that sparks real conversation and gives the evening a moment everyone remembers. Scott reads the room, matches the energy, and delivers magic that feels like it belongs at the table, not on a stage.",
  ],
  "brentwood--private-party-magician": [
    "Private parties in Brentwood happen at homes — birthday dinners on patios, anniversary celebrations in living rooms, holiday gatherings in backyards along San Vicente or in the Brentwood Park neighborhood. The hosts put effort into every detail: the flowers, the wine, the guest list. Scott's close-up magic fits that same energy. He moves through the party performing for small groups, and the reactions ripple through the room naturally.",
    "Brentwood parties tend to be smaller and more intentional than what you'd see in Hollywood or WeHo. Twenty to fifty guests, people who know each other, and a host who wants the night to feel special without being over-the-top. That's exactly where close-up magic and mentalism work best — no stage, no microphone, just something impossible happening while guests hold a glass of wine.",
  ],
  "brentwood--wedding-magician": [
    "Brentwood weddings are refined and personal — garden ceremonies at private estates, cocktail hours under old trees, and receptions that feel like a really good dinner party. Scott's cocktail hour magic fits beautifully here because it matches the intimacy of the setting. He performs for small groups while guests mingle, and by the time everyone sits for dinner, strangers feel like friends.",
    "The Getty Center sits right at the edge of Brentwood, and weddings in the area carry that same sense of quiet beauty. Scott works with couples to tailor the magic to their crowd — family-friendly for mixed-age guest lists, more mind-reading and mentalism for groups that skew older and more sophisticated. He's also available for rehearsal dinners, where the smaller group makes the magic even more personal.",
  ],
  "brentwood--close-up-magician": [
    "Close-up magic is made for Brentwood. The events here are intimate — small guest counts, beautiful homes, and people standing close together with drinks. Scott moves through these spaces performing for groups of four to eight, using cards, borrowed objects, and mentalism that happens right in their hands. No stage, no setup, no disruption to the evening's flow.",
    "Brentwood guests are sharp and well-traveled, which makes the reactions even better. When someone who's seen everything gets genuinely fooled — really, visibly stunned — it changes the energy of the whole room. That's what close-up magic does in a setting like this. It gives people something real to react to, and those reactions become the highlight of the party.",
  ],
  "brentwood--private-magic-show": [
    "A Private Magic Show in a Brentwood living room or garden is one of the best settings Scott performs in. The audience is close, the room is beautiful, and the intimacy makes every moment land harder. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your living room becomes a private theater. It's mentalism, storytelling, and audience interaction designed for people who appreciate something crafted.",
    "These shows work for milestone birthdays, anniversary dinners, holiday gatherings, or any night where the host wants to give their guests something they've never experienced before. In Brentwood, the expectations are always high and the guest lists are always curated — which is exactly the audience this show is built for. Standing ovations in living rooms happen more often than you'd think.",
  ],
  "brentwood--golf-tournament-magician": [
    "Golf tournaments near Brentwood — at Bel-Air Country Club, Riviera Country Club, and Brentwood Country Club — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the day.",
    "Scott also serves as MC for the awards dinner when needed, keeping the flow tight from cocktails through trophies. The Brentwood golf crowd is there to enjoy themselves, and close-up magic that's sharp, social, and impossible to figure out fits that energy perfectly. Sponsors get genuine face time with their audience, and players get a story they'll retell at the next round.",
  ],
  "brentwood--charity-gala-magician": [
    "Charity galas in Brentwood tend to be smaller and more personal than the big downtown or Beverly Hills fundraisers. They happen at private homes, at the Brentwood Country Club, or at venues along San Vicente. The crowd is generous and engaged, and they've attended enough galas to know when the entertainment is generic. Scott's close-up magic during the cocktail hour gives guests something genuine to bond over before the program begins.",
    "The magic also serves the fundraising goals. When guests are energized and connected, they bid higher and give more freely. Scott works the room during cocktail hour, then transitions to a short stage set if the program calls for it. The format is flexible, and for Brentwood's intimate gala scene, that flexibility matters.",
  ],
  "brentwood--holiday-party-magician": [
    "Holiday parties in Brentwood are home-hosted affairs — Thanksgiving dinners that spill onto the patio, Christmas gatherings around the fireplace, New Year's Eve parties where the guest count is fifty people who actually know each other. Scott's close-up magic adds something unexpected to these evenings without changing the vibe. He moves through the party, performs for small groups, and lets the reactions do the work.",
    "The Brentwood holiday crowd doesn't want a production. They want something personal and memorable that fits the warmth of the evening. Mentalism and close-up magic are perfect for this — quiet enough for a living room, powerful enough that people are still texting the host about it the next morning.",
  ],
  "brentwood--trade-show-magician": [
    "Trade shows aren't typical Brentwood events, but brands based in the neighborhood — production companies, talent agencies, wellness brands — regularly exhibit at conventions across LA and beyond. White Rabbit brings foot traffic to your booth with close-up magic that stops people mid-aisle. Within minutes, a crowd forms, and your sales team has a warm audience ready to hear the pitch.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic isn't just entertainment — it's a conversation starter that leads directly to your brand. The format works for any booth size, and Scott coordinates with your team on timing, flow, and goals before the event.",
  ],
  "brentwood--mentalist": [
    "Mentalism in a Brentwood living room is an experience people don't forget. Scott reads thoughts, predicts decisions, and reveals details that shouldn't be possible — all without props, gimmicks, or anything that looks like a magic show. It's psychological, it's personal, and in an intimate Brentwood setting, it feels like something genuinely unexplainable is happening.",
    "The Brentwood crowd is smart, successful, and used to being in control. Mentalism works on them because it challenges that control in a way that's thrilling, not threatening. When a managing partner or studio head can't explain how Scott knew what they were thinking, the room comes alive. It's the kind of moment that becomes the story of the party.",
  ],
  "brentwood--rehearsal-dinner-magician": [
    "Rehearsal dinners in Brentwood are intimate by nature — close family, the wedding party, maybe thirty or forty people at a restaurant or private home. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He reads the room, keeps it warm and personal, and creates moments that the wedding party will reference during toasts the next afternoon.",
    "The magic works especially well at rehearsal dinners because the audience is small and connected. Everyone knows each other, the mood is celebratory, and people are relaxed enough to be genuinely surprised. Scott tailors the experience to the couple and their crowd, making the rehearsal dinner feel like its own event, not just a preview.",
  ],
  "brentwood--halloween-party-magician": [
    "Halloween in Brentwood means neighborhood parties, costume dinners, and gatherings where the hosts go all-in on atmosphere. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little bit eerie in the best way. It's not a haunted house. It's something real and unexplainable happening right in front of you.",
    "The format works for adult Halloween parties, themed dinners, and any gathering where the host wants the entertainment to match the atmosphere. In Brentwood's quiet, leafy setting, the contrast between the beautiful home and something genuinely mysterious happening at the dinner table makes the experience hit even harder.",
  ],
  "brentwood--christmas-party-magician": [
    "Christmas parties and New Year's Eve gatherings in Brentwood are warm, home-hosted celebrations — fireplaces, good wine, and guests who've known each other for years. Scott's close-up magic adds a spark to these evenings without changing the tone. He performs for small groups during cocktails, and the reactions spread naturally. By dessert, everyone's talking about what they saw.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for twenty or a standing party for eighty, the magic gives the evening a focal point that isn't the TV countdown. Brentwood NYE hosts want something memorable, and White Rabbit delivers exactly that.",
  ],
  "brentwood--premiere-red-carpet-magician": [
    "Brentwood is home to some of the biggest names in entertainment, and industry events happen here in private — screening parties, wrap celebrations, and intimate gatherings where the guest list reads like end credits. Scott's close-up magic fits these events because it's personal and low-key. No production, no disruption, just impossible moments during the cocktail hour.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott performs regularly in Brentwood for entertainment industry clients who want something their guests haven't seen before. In a neighborhood full of people who make entertainment for a living, that's a high bar — and it's exactly where Scott operates best.",
  ],
  "brentwood--dmc-entertainment": [
    "Brentwood isn't a typical DMC destination, but for groups doing a curated LA experience — visiting the Getty Center, dining along San Vicente, or attending a private event in the neighborhood — White Rabbit adds an entertainment layer that makes the itinerary unforgettable. Scott performs during welcome receptions, private dinners, and intimate group gatherings.",
    "The magic works especially well for incentive travel groups and executive retreats where the attendees are high-level and hard to impress. Close-up magic and mentalism cut through the usual entertainment options and give people something genuinely surprising to talk about over dinner. Scott coordinates with DMC teams on timing and logistics.",
  ],
  "brentwood--resident-event-magician": [
    "Brentwood's luxury residential communities and condo buildings want resident events that feel special — not another wine and cheese night. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who've never spoken are laughing together over something impossible they just witnessed.",
    "The format requires no stage, no AV, no setup beyond a place for people to stand and talk. It fits into clubhouse events, pool deck gatherings, and any community space. Property managers and HOA boards consistently report that White Rabbit nights get the highest turnout and the most positive feedback of any resident event on the calendar.",
  ],
  // ── Los Feliz ────────────────────────────────────────────────────────
  "los-feliz--corporate-event-magician": [
    "Corporate events in Los Feliz don't look like corporate events anywhere else in LA. They happen at creative agencies, production offices, and restaurants along Vermont and Hillhurst — and the guest list is writers, designers, producers, and musicians who work in the neighborhood. Scott's close-up magic works in these settings because it feels organic, not corporate. He reads the room, matches the energy, and delivers something that surprises people who are hard to surprise.",
    "The Los Feliz crowd is culturally tuned-in and skeptical of anything that feels too polished or packaged. That's exactly why mentalism and close-up magic land so well here. It's raw, it's personal, and it doesn't look like entertainment — it looks like something genuinely unexplainable happening at the cocktail hour. That's what gets this crowd talking.",
  ],
  "los-feliz--private-party-magician": [
    "Private parties in Los Feliz happen at hillside homes with canyon views, bungalows near Griffith Park, and apartments where the living room doubles as the venue. The hosts care about the details — the playlist, the food, the guest list — and they want entertainment that feels like a discovery, not a booking. Scott's close-up magic fits that vibe. He shows up, moves through the party, and within minutes, people are pulling their friends over to see what just happened.",
    "Los Feliz parties tend to be smaller and more curated than what you'd see on the Westside. Twenty to sixty guests, people who know each other, and a host who wants the evening to have a moment everyone remembers. Close-up magic and mentalism are perfect for that — no stage, no microphone, just something impossible happening while someone holds a borrowed coin.",
  ],
  "los-feliz--wedding-magician": [
    "Los Feliz weddings have character — venues like The Ebell, Griffith Park event spaces, and hillside homes with old Hollywood architecture. The couples getting married here tend to want something personal and offbeat rather than a cookie-cutter reception. Scott's cocktail hour magic fits that sensibility. He performs for small groups while guests mingle, and by dinner, strangers feel connected over something they can't explain.",
    "Scott works with couples to tailor the magic to their crowd. Mixed-age guest lists, creative industry friends, out-of-town family — the magic adapts to whoever's in the room. He's also available for rehearsal dinners, where the smaller group makes the experience even more intimate. Los Feliz weddings are about personality, and White Rabbit adds exactly that.",
  ],
  "los-feliz--close-up-magician": [
    "Close-up magic is a natural fit for Los Feliz events. The gatherings here are intimate, the spaces are interesting, and the guests are curious by nature. Scott moves through the room performing for groups of four to eight — cards, borrowed objects, mentalism — and every piece happens right in their hands. No stage, no props, no production. Just something impossible happening six inches from someone's face.",
    "The Los Feliz crowd appreciates things that feel authentic and unexpected. Close-up magic hits both marks. When an actor or a director or a musician gets genuinely fooled — really can't figure it out — the reaction is electric. Those moments become the highlight of the party, and they're the reason hosts in Los Feliz keep booking White Rabbit.",
  ],
  "los-feliz--private-magic-show": [
    "A Private Magic Show in a Los Feliz living room or backyard is an experience that fits the neighborhood perfectly — intimate, artistic, and unlike anything your guests have seen before. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show is mentalism, storytelling, and audience interaction designed for people who appreciate craft.",
    "Los Feliz homes have great bones for these shows — high ceilings, character, interesting architecture. The audience sits close, the energy builds, and by the end, you're getting a standing ovation in your own living room. These shows work for milestone birthdays, anniversary dinners, holiday gatherings, or any night where the host wants to give their guests something unforgettable.",
  ],
  "los-feliz--golf-tournament-magician": [
    "Golf tournaments near Los Feliz — at courses in Griffith Park and nearby clubs — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the tournament day.",
    "Scott also serves as MC for the awards dinner when needed, keeping the flow tight from cocktails through trophies. The format is flexible: roaming magic during cocktails, a short stage set during dinner, or both. Sponsors get genuine face time with their audience, and players get a story that's better than any hole-in-one they didn't make.",
  ],
  "los-feliz--charity-gala-magician": [
    "Charity galas in Los Feliz tend to be community-driven — arts organizations, neighborhood causes, school fundraisers — with guest lists full of people who live in the area and care about the mission. Scott's close-up magic during the cocktail hour gives guests something to bond over before the program begins. When people are energized and connected, they bid higher and give more freely.",
    "The magic works as both entertainment and a social lubricant. Scott reads the room, keeps the energy warm, and creates moments that make guests feel like the evening is already special before the speeches start. For a Los Feliz gala crowd that values authenticity, that's exactly the right tone.",
  ],
  "los-feliz--holiday-party-magician": [
    "Holiday parties in Los Feliz are home-hosted and personal — Thanksgiving dinners that run long, Christmas gatherings with the fireplace going, New Year's Eve parties where the guest count is manageable and everyone knows each other. Scott's close-up magic adds something unexpected to these evenings. He moves through the party, performs for small groups, and the reactions ripple through the room without disrupting the vibe.",
    "The Los Feliz holiday crowd doesn't want a production. They want something genuine and memorable that fits the warmth of the evening. Mentalism and close-up magic are perfect for that — quiet enough for a living room, powerful enough that people are still texting the host about it the next morning.",
  ],
  "los-feliz--trade-show-magician": [
    "Los Feliz is home to creative agencies, production companies, and brands that regularly exhibit at conventions and expos across LA and beyond. White Rabbit brings foot traffic to your booth with close-up magic that stops people mid-aisle. Within minutes, a crowd forms, your sales team has warm leads, and your booth is the one people are telling their colleagues about.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic isn't just a spectacle — it's a conversation starter that leads directly to your brand. The format works for any booth size and any industry. Scott coordinates with your team on timing, flow, and goals before the event.",
  ],
  "los-feliz--mentalist": [
    "Mentalism in a Los Feliz living room is something special. Scott reads thoughts, predicts decisions, and reveals details that shouldn't be possible — all without props or anything that looks like a magic show. It's psychological, it's personal, and in an intimate Los Feliz setting with a smart, culturally aware audience, it feels like encountering something genuinely unexplainable.",
    "The Los Feliz crowd — actors, writers, musicians, directors — is used to being entertained professionally. They know how stories work, they understand performance, and they're not easy to fool. Mentalism works on them because it operates on a different level. When Scott knows what someone was thinking, the room goes quiet for a second before it erupts. That moment is why people book White Rabbit.",
  ],
  "los-feliz--rehearsal-dinner-magician": [
    "Rehearsal dinners in Los Feliz are intimate — close family, the wedding party, maybe thirty people at a neighborhood restaurant or someone's home. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He keeps it warm and personal, and creates moments that the wedding party will reference during toasts the next afternoon.",
    "The magic works especially well at rehearsal dinners because the audience is small and connected. Everyone knows each other, the mood is celebratory, and people are relaxed enough to be genuinely surprised. In a neighborhood as charming as Los Feliz, the evening already has character — Scott just adds a moment nobody saw coming.",
  ],
  "los-feliz--halloween-party-magician": [
    "Halloween in Los Feliz is a neighborhood event — the streets come alive, the houses go all-out, and the house parties are some of the best in LA. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little eerie in the best way. It's not a haunted house. It's something real and unexplainable happening at the dinner table.",
    "The Los Feliz Halloween crowd goes hard on atmosphere, and Scott matches that energy. The format works for costume parties, themed dinners, and any gathering where the host wants entertainment that feels like it belongs in the neighborhood's spooky, artistic spirit.",
  ],
  "los-feliz--christmas-party-magician": [
    "Christmas and New Year's Eve in Los Feliz are cozy, home-hosted celebrations — candles, good food, and guests who've known each other for years. Scott's close-up magic adds a spark to these evenings without changing the tone. He performs for small groups during cocktails, and by dessert, everyone's trading stories about what they saw.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for twenty or a standing party for sixty, the magic gives the evening a focal point that isn't the TV countdown. Los Feliz NYE hosts want something memorable, and White Rabbit delivers.",
  ],
  "los-feliz--premiere-red-carpet-magician": [
    "Los Feliz is home to actors, directors, writers, and producers — and industry events happen here regularly. Screening parties, wrap celebrations, and intimate gatherings where the guest list is people who make entertainment for a living. Scott's close-up magic fits these events because it's personal and low-key. No production, no disruption, just impossible moments during the cocktail hour that genuinely surprise an audience that's seen it all.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. In a neighborhood full of people who understand performance, Scott's magic stands out because it doesn't feel like a performance. It feels like something that shouldn't be possible, and that's what gets the Los Feliz crowd talking.",
  ],
  "los-feliz--dmc-entertainment": [
    "Los Feliz isn't a typical DMC stop, but for groups doing a curated LA experience — visiting Griffith Observatory, exploring the neighborhood's old Hollywood architecture, dining along Hillhurst or Vermont — White Rabbit adds an entertainment layer that makes the evening unforgettable. Scott performs during welcome receptions, private dinners, and intimate group gatherings.",
    "The magic works especially well for incentive travel groups and executive retreats where the attendees are culturally aware and hard to impress. Close-up magic and mentalism cut through the usual entertainment options and give people something genuinely surprising to talk about. Scott coordinates with DMC teams on timing, venue, and logistics.",
  ],
  "los-feliz--resident-event-magician": [
    "Los Feliz has a mix of apartment buildings, condo communities, and hillside neighborhoods where resident events bring people together. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who've only waved at each other are laughing together over something impossible they just witnessed.",
    "The format requires no stage, no AV, no setup. It fits into community rooms, courtyard gatherings, rooftop events, and any space where people can stand and talk. For a neighborhood that values community and authenticity, White Rabbit resident events consistently get strong turnout and genuine enthusiasm.",
  ],
  // ── Manhattan Beach ──────────────────────────────────────────────────
  "manhattan-beach--corporate-event-magician": [
    "Corporate events in Manhattan Beach have a different feel than what you'd find in Century City or Downtown — they happen at oceanfront restaurants like The Strand House, at company beach houses, or at rooftop venues where the Pacific is right there. The guest list is tech executives, startup founders, and South Bay professionals who work hard and want their events to match the lifestyle. Scott's close-up magic fits because it's social, casual, and sharp — no stage, no formality, just impossible things happening while people hold a drink and watch the sunset.",
    "The Manhattan Beach corporate crowd doesn't want a stiff cocktail hour. They want energy, conversation, and something that makes the evening feel different from every other company dinner. Close-up magic and mentalism deliver that. Scott reads the room, matches the relaxed-but-affluent vibe, and gives people a reason to put their phones down and actually talk to each other.",
  ],
  "manhattan-beach--private-party-magician": [
    "Private parties in Manhattan Beach happen at beach houses, backyard patios with ocean views, and rooftop decks where the breeze comes off the water. The hosts put effort into the food and the drinks, and the guest list is tight — neighbors, close friends, people who surf together on weekends. Scott's close-up magic fits the energy of these gatherings perfectly. He moves through the party performing for small groups, and the reactions spread naturally. No stage, no microphone, just something impossible happening while someone holds a borrowed ring.",
    "Manhattan Beach parties are casual but the expectations are high. These are people who've traveled, who've been to great events, and who know the difference between generic entertainment and something genuinely surprising. Close-up magic and mentalism hit that mark every time. By the end of the night, the magic is what everyone's talking about on the walk home.",
  ],
  "manhattan-beach--wedding-magician": [
    "Manhattan Beach weddings are beautiful — ocean ceremony backdrops, cocktail hours on patios with the sunset behind them, and receptions that feel like the best dinner party you've ever attended. Scott's cocktail hour magic fits the beauty of these events without competing with it. He performs for small groups while guests mingle, and by dinner, strangers from different sides of the aisle feel connected over something they can't explain.",
    "The South Bay wedding crowd is young, fun, and social — which means the reactions to close-up magic are loud and genuine. Scott works with couples to tailor the experience to their guest list and timeline. He's also available for rehearsal dinners, where the smaller group makes the magic even more personal. Manhattan Beach weddings already have the setting — White Rabbit adds the moment.",
  ],
  "manhattan-beach--close-up-magician": [
    "Close-up magic is a perfect match for Manhattan Beach events. Everything here is social and outdoors — patios, rooftops, beach house living rooms with the doors open. Scott moves through these spaces performing for groups of four to eight, using cards, borrowed objects, and mentalism that happens right in their hands. The casual energy of the South Bay makes people relaxed and open, which means the reactions are big and genuine.",
    "The Manhattan Beach crowd is athletic, successful, and competitive — which makes close-up magic even more fun. When someone can't figure out how it happened, their friends won't let them live it down. Those moments become the stories people retell at the next neighborhood barbecue, and that's exactly why hosts in the South Bay keep booking White Rabbit.",
  ],
  "manhattan-beach--private-magic-show": [
    "A Private Magic Show in a Manhattan Beach living room or backyard — ocean breeze, string lights, a group of forty friends sitting close — is one of the best settings for this format. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your beach house becomes a private theater. The show is mentalism, storytelling, and audience interaction that gets standing ovations in living rooms.",
    "These shows work for milestone birthdays, anniversary celebrations, holiday gatherings, or any night where the host wants to give their guests something they've never experienced. The Manhattan Beach setting adds atmosphere that money can't buy — the sound of waves, the salt air, and something impossible happening right in front of you.",
  ],
  "manhattan-beach--golf-tournament-magician": [
    "Golf tournaments at South Bay courses — Manhattan Beach, Palos Verdes, and nearby clubs — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the tournament day.",
    "Scott also serves as MC for the awards dinner when needed, keeping the flow tight from cocktails through trophies. The South Bay golf crowd is competitive and social, and close-up magic that's sharp and impossible to figure out fits that energy perfectly. Sponsors get genuine face time with their audience, and players get a story better than their scorecard.",
  ],
  "manhattan-beach--charity-gala-magician": [
    "Charity galas in Manhattan Beach are community events — school fundraisers, local nonprofit dinners, and beach community causes that bring the neighborhood together. Scott's close-up magic during the cocktail hour gives guests something to bond over before the program begins. When people are energized and connected, they bid higher and give more freely. That's not a theory — it's what hosts tell Scott after every gala.",
    "The format is flexible: roaming magic during cocktails, a short stage set during dinner, or both. For the Manhattan Beach gala crowd — generous, social, and used to attending these events — the magic provides something unexpected that makes this year's event stand out from last year's.",
  ],
  "manhattan-beach--holiday-party-magician": [
    "Holiday parties in Manhattan Beach are backyard affairs and beach house gatherings — lights on the patio, good food, and guests who live within walking distance. Scott's close-up magic adds something unexpected to these evenings without changing the relaxed South Bay vibe. He moves through the party, performs for small groups, and the reactions spread naturally.",
    "The Manhattan Beach holiday crowd wants something memorable that fits the warmth of the evening. Mentalism and close-up magic are perfect — casual enough for a beach house, powerful enough that people are still texting the host about it the next morning. Christmas parties, Thanksgiving gatherings, New Year's Eve — the format works for all of it.",
  ],
  "manhattan-beach--trade-show-magician": [
    "Manhattan Beach is home to tech companies, creative agencies, and startups that regularly exhibit at conferences across LA and beyond. White Rabbit brings foot traffic to your booth with close-up magic that stops people mid-aisle. Within minutes, a crowd forms, your sales team has warm leads, and your booth is the one people are talking about at the hotel bar that night.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic leads directly to your brand. The format works for any booth size and any industry. Scott coordinates with your team on timing, flow, and goals before the event.",
  ],
  "manhattan-beach--mentalist": [
    "Mentalism at a Manhattan Beach dinner party or corporate event is an experience people don't forget. Scott reads thoughts, predicts decisions, and reveals details that shouldn't be possible — all without props or anything that looks like a magic show. In the relaxed South Bay setting, where people are open and social, the reactions to mentalism are some of the biggest Scott gets anywhere in LA.",
    "The Manhattan Beach crowd is smart, successful, and used to being in control. Mentalism works on them because it challenges that control in a way that's thrilling and fun. When a tech CEO or a pro athlete can't explain how Scott knew what they were thinking, the room loses it. That's the kind of moment that makes a party legendary.",
  ],
  "manhattan-beach--rehearsal-dinner-magician": [
    "Rehearsal dinners in Manhattan Beach are intimate and relaxed — close family and the wedding party at a local restaurant or someone's beach house. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He keeps it warm and personal, and creates moments that get referenced in toasts the next afternoon.",
    "The magic works especially well at rehearsal dinners because the audience is small and connected. Everyone knows each other, the mood is celebratory, and the South Bay setting keeps everyone relaxed and open. Scott tailors the experience to the couple and their crowd, making the rehearsal dinner feel like its own event.",
  ],
  "manhattan-beach--halloween-party-magician": [
    "Halloween in Manhattan Beach means neighborhood parties, costume gatherings at beach houses, and themed dinners where the hosts go all-in. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little eerie in the best way. It's not a haunted house. It's something real and unexplainable happening at the dinner table.",
    "The South Bay Halloween crowd is fun and competitive about their parties, which means the entertainment needs to match. Scott brings the right energy — mysterious enough for the theme, social enough for the setting. The format works for costume parties, themed dinners, and any gathering where the host wants their party to be the one people talk about.",
  ],
  "manhattan-beach--christmas-party-magician": [
    "Christmas and New Year's Eve in Manhattan Beach are beach house celebrations — string lights on the patio, good wine, and guests who live down the street. Scott's close-up magic adds a spark to these evenings without changing the relaxed tone. He performs for small groups during cocktails, and by dessert, the magic is what everyone's talking about.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for twenty or a standing party for eighty, the magic gives the evening its own identity. Manhattan Beach NYE hosts want something better than a DJ and a champagne toast — White Rabbit delivers.",
  ],
  "manhattan-beach--premiere-red-carpet-magician": [
    "Manhattan Beach isn't Hollywood, but plenty of entertainment industry people live in the South Bay and host industry events at home — screening parties, wrap celebrations, and gatherings where the guest list includes people who make content for a living. Scott's close-up magic fits these events because it's personal and surprising. No production, no disruption, just impossible moments that genuinely fool an audience that understands entertainment.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott performs in the South Bay regularly for industry clients who want something their guests haven't seen before, and the beach house setting makes every reaction feel more genuine.",
  ],
  "manhattan-beach--dmc-entertainment": [
    "Manhattan Beach isn't a typical DMC destination, but for groups doing a curated LA beach experience — South Bay tours, ocean-view dinners, team-building retreats — White Rabbit adds entertainment that makes the evening unforgettable. Scott performs during welcome receptions, private dinners, and group gatherings at local restaurants and beach venues.",
    "The magic works especially well for incentive travel groups where attendees are relaxed from a day at the beach and open to something unexpected. Close-up magic and mentalism cut through the usual entertainment options and give people something genuinely surprising to talk about. Scott coordinates with DMC teams on timing and logistics.",
  ],
  "manhattan-beach--resident-event-magician": [
    "Manhattan Beach's condo communities and residential buildings want events that bring neighbors together in a real way — not another mixer with a cheese plate. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who've only nodded at each other in the elevator are laughing together over something impossible.",
    "The format requires no stage, no AV, no setup. It fits into clubhouse events, pool deck gatherings, rooftop receptions, and any community space. Property managers in the South Bay consistently report that White Rabbit events get stronger turnout and more positive feedback than any other resident programming on the calendar.",
  ],
  // ── Encino ───────────────────────────────────────────────────────────
  "encino--corporate-event-magician": [
    "Corporate events in Encino happen at restaurants along Ventura Boulevard, at private estates in the Encino Hills, and at Valley-based companies that want to host clients somewhere comfortable and impressive. The guest list tends to be senior professionals — entertainment executives, financial advisors, real estate developers — who live in the Valley because they want space without giving up access. Scott's close-up magic fits these events because it's polished and personal without being fussy.",
    "The Encino corporate crowd is successful and well-traveled but doesn't want anything pretentious. They want entertainment that sparks real conversation and gives the evening a moment everyone remembers. Scott reads the room, keeps it sharp, and delivers magic that feels like it belongs at the dinner table, not on a stage somewhere.",
  ],
  "encino--private-party-magician": [
    "Private parties in Encino happen at sprawling Valley estates — big backyards, pools, and enough space that the party spreads out naturally. Birthday milestones, anniversary celebrations, holiday gatherings, graduation parties — the hosts put effort into the details and want entertainment that matches without trying too hard. Scott's close-up magic fits perfectly. He moves through the party performing for small groups, and the reactions ripple through the yard naturally.",
    "Encino parties are bigger than what you'd see in Bel Air or Brentwood — fifty to a hundred guests is common — but the vibe is warmer and more relaxed. People know each other, kids are running around, and the host wants something that works for everyone. Close-up magic and mentalism hit that mark because they adapt to whoever's watching. The reactions from teenagers are different from the reactions from grandparents, and both are genuine.",
  ],
  "encino--wedding-magician": [
    "Encino weddings often happen at estates and private venues in the Hills — garden ceremonies, cocktail hours on the patio, and receptions under string lights in backyards that feel like private parks. Scott's cocktail hour magic fits the beauty of these settings. He performs for small groups while guests mingle, and by dinner, strangers from different sides of the aisle feel like old friends.",
    "The Valley wedding crowd is mixed-age and family-oriented, which is exactly where close-up magic works best. Scott reads the room, adjusts his energy for different groups, and creates moments that work for everyone from the bride's grandmother to the groom's college roommates. He's also available for rehearsal dinners, where the smaller group makes the magic even more personal.",
  ],
  "encino--close-up-magician": [
    "Close-up magic is a natural fit for Encino events. The gatherings are social, the spaces are big, and the guests are standing around with drinks in beautiful backyards. Scott moves through these settings performing for groups of four to eight — cards, borrowed objects, mentalism — and every piece happens right in their hands. No stage, no setup, no disruption to the party's flow.",
    "The Encino crowd is sharp and successful but unpretentious, which makes the reactions even better. When someone who runs a production company or manages a hedge fund gets genuinely fooled — really can't figure it out — the reaction is loud, genuine, and contagious. Those moments become the highlight of the party.",
  ],
  "encino--private-magic-show": [
    "A Private Magic Show in an Encino living room or backyard is one of Scott's favorite settings. The estates here have the space for it — high ceilings, beautiful outdoor areas, room for forty or fifty guests to sit comfortably. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your home becomes a private theater. The show is mentalism, storytelling, and audience interaction designed for people who appreciate something crafted.",
    "These shows work for milestone birthdays, anniversary dinners, holiday gatherings, or any night where the host wants to give their guests something they've never experienced. In Encino, the big houses and big yards mean you can do this properly — and standing ovations in living rooms happen more often than you'd expect.",
  ],
  "encino--golf-tournament-magician": [
    "Golf tournaments at Valley courses — Encino, Braemar, and nearby clubs — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the tournament day.",
    "Scott also serves as MC for the awards dinner when needed, keeping the flow tight from cocktails through trophies. The Encino golf crowd is there to enjoy themselves, and close-up magic that's sharp and impossible to figure out fits that energy perfectly. Sponsors get genuine face time with their audience, and players get a story better than their scorecard.",
  ],
  "encino--charity-gala-magician": [
    "Charity galas in Encino are community events — school fundraisers, synagogue galas, local nonprofit dinners, and neighborhood causes that bring the Valley's generous families together. Scott's close-up magic during the cocktail hour gives guests something to bond over before the program begins. When people are energized and connected, they bid higher and give more freely.",
    "The format is flexible: roaming magic during cocktails, a short stage set during dinner, or both. For the Encino gala crowd — generous, family-oriented, and used to attending these events — the magic provides something unexpected that makes this year's event the one people remember.",
  ],
  "encino--holiday-party-magician": [
    "Holiday parties in Encino are home-hosted celebrations on a bigger scale than most neighborhoods — big houses, big guest lists, and hosts who go all-in on making the evening special. Scott's close-up magic adds something unexpected without competing with the party. He moves through the room, performs for small groups, and the reactions become the soundtrack of the evening.",
    "The Encino holiday crowd wants something memorable that fits the warmth of the evening. Mentalism and close-up magic are perfect — they work in living rooms, backyards, and poolside patios equally well. Christmas parties, Hanukkah celebrations, New Year's Eve — the format adapts to whatever the host has planned.",
  ],
  "encino--trade-show-magician": [
    "Encino is home to production companies, financial firms, and businesses that regularly exhibit at conventions and expos across LA. White Rabbit brings foot traffic to your booth with close-up magic that stops people mid-aisle. Within minutes, a crowd forms, your sales team has warm leads, and your booth is the one people are telling their colleagues about.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic leads directly to your brand. The format works for any booth size and any industry. Scott coordinates with your team on timing, flow, and goals before the event.",
  ],
  "encino--mentalist": [
    "Mentalism in an Encino living room — reading thoughts, predicting decisions, revealing details that shouldn't be possible — is an experience that stops a party cold in the best way. Scott does all of this without props, gimmicks, or anything that looks like a magic show. It's psychological, it's personal, and in a room full of smart, successful Valley professionals, it feels like encountering something that genuinely shouldn't be possible.",
    "The Encino crowd is used to being in control — running companies, managing deals, making decisions. Mentalism works on them because it challenges that control in a way that's thrilling and fun. When a managing partner or studio executive can't explain how Scott knew what they were thinking, the room comes alive.",
  ],
  "encino--rehearsal-dinner-magician": [
    "Rehearsal dinners in Encino are intimate family affairs — close relatives, the wedding party, maybe thirty or forty people at a restaurant on Ventura Boulevard or at someone's home in the Hills. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He keeps it warm and personal, and creates moments that get referenced in toasts the next afternoon.",
    "The magic works especially well at rehearsal dinners because the audience is small and connected. Everyone knows each other, the mood is celebratory, and people are relaxed enough to be genuinely surprised. Scott tailors the experience to the couple and their crowd, making the rehearsal dinner feel like its own event.",
  ],
  "encino--halloween-party-magician": [
    "Halloween in Encino means big neighborhood parties, costume gatherings at Valley estates, and themed dinners where the hosts go all-in on atmosphere. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little eerie in the best way. The big Encino backyards and dimly lit patios make the setting even better.",
    "The format works for adult Halloween parties, family-friendly gatherings, and themed dinners. In a neighborhood where the houses and yards are big enough to create real atmosphere, the contrast between the beautiful setting and something genuinely mysterious happening in your hands makes the experience hit harder.",
  ],
  "encino--christmas-party-magician": [
    "Christmas and New Year's Eve in Encino are big, warm celebrations — houses lit up, extended family, and guest lists that run deep. Scott's close-up magic adds a spark to these evenings without changing the tone. He performs for small groups during cocktails, and by dessert, the magic is what everyone's talking about.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for thirty or a standing party for a hundred, the magic gives the evening a focal point that isn't the TV countdown. Encino NYE hosts want something their guests will remember — White Rabbit delivers.",
  ],
  "encino--premiere-red-carpet-magician": [
    "Encino is home to entertainment executives, producers, and industry professionals who host screenings, wrap parties, and celebrations at their Valley estates. Scott's close-up magic fits these events because it's personal and low-key — no production, no disruption, just impossible moments during the cocktail hour that genuinely surprise people who work in entertainment for a living.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott performs in the Valley regularly for industry clients who want something their guests haven't seen before. In a neighborhood full of people who know how hard it is to genuinely surprise an audience, that's a high bar — and it's exactly where Scott operates best.",
  ],
  "encino--dmc-entertainment": [
    "Encino isn't a typical DMC destination, but for groups doing a curated Valley or greater LA experience, White Rabbit adds entertainment that makes the evening unforgettable. Scott performs during welcome receptions, private dinners, and group gatherings at local restaurants and private estates.",
    "The magic works especially well for incentive travel groups and executive retreats where the attendees are senior-level and hard to impress. Close-up magic and mentalism give people something genuinely surprising to talk about over dinner. Scott coordinates with DMC teams on timing, venue, and logistics.",
  ],
  "encino--resident-event-magician": [
    "Encino's luxury condo buildings and gated communities want resident events that feel special — not another wine and cheese night with a folding table. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who've lived on the same street for years are sharing a moment of real connection.",
    "The format requires no stage, no AV, no setup. It fits into clubhouse events, pool deck gatherings, and any community space. Property managers and HOA boards in Encino consistently report that White Rabbit events get the highest turnout and the most positive feedback of any resident programming on the calendar.",
  ],
  // ── Pacific Palisades ────────────────────────────────────────────────
  "pacific-palisades--corporate-event-magician": [
    "Corporate events in Pacific Palisades are rare and intentional — executive dinners at canyon estates, partner retreats hosted at private homes, and client appreciation evenings where the guest list is small and the view is the Pacific. The Palisades crowd is senior-level, family-oriented, and unimpressed by anything that feels like a production. Scott's close-up magic fits because it's personal, conversational, and sharp enough to surprise people who've been to a thousand events.",
    "The format works beautifully here: Scott moves through the gathering performing for small groups during cocktails or between courses, and the magic sparks exactly the kind of conversation the host was hoping for. No stage, no AV, no formality — just something impossible happening while the sun sets behind the ocean.",
  ],
  "pacific-palisades--private-party-magician": [
    "Private parties in Pacific Palisades happen at canyon homes, oceanview estates, and backyards where the Pacific is the backdrop. Birthday milestones, anniversary celebrations, holiday gatherings — the hosts care about every detail and want entertainment that matches the setting without overwhelming it. Scott's close-up magic is perfect for this. He moves through the party performing for small groups, and the reactions spread naturally across the yard.",
    "The Palisades community is tight-knit despite the wealth — neighbors know each other, families socialize together, and the parties have a warmth that's different from Beverly Hills or Brentwood. Close-up magic and mentalism fit that warmth because they're social by nature. One group reacts, the next group comes over, and suddenly the whole party has a pulse.",
  ],
  "pacific-palisades--wedding-magician": [
    "Palisades weddings are stunning — canyon ceremony sites, cocktail hours overlooking the ocean, and receptions at homes where the setting does most of the work. Scott's cocktail hour magic fits the beauty of these events without competing with it. He performs for small groups while guests mingle, and by dinner, people who just met are already friends because they shared something they can't explain.",
    "The wedding crowd in the Palisades is often a mix of local families and out-of-town guests who can't believe the setting. Scott works with couples to tailor the magic to their guest list — family-friendly for mixed-age crowds, more mentalism for groups that skew sophisticated. He's also available for rehearsal dinners, where the smaller group makes the experience even more intimate.",
  ],
  "pacific-palisades--close-up-magician": [
    "Close-up magic is made for Pacific Palisades events. Everything here is intimate and outdoors — patios, gardens, canyon decks with ocean views. Scott moves through these spaces performing for groups of four to eight, using cards, borrowed objects, and mentalism that happens right in their hands. The relaxed, outdoorsy energy of the Palisades makes people open and present, which means the reactions are genuine and contagious.",
    "The Palisades crowd is smart, well-traveled, and not easily impressed — which makes it even better when they are. When a venture capitalist or a studio head gets genuinely fooled six inches from their face, the reaction is real, and everyone around them feels it. Those moments become the story of the party.",
  ],
  "pacific-palisades--private-magic-show": [
    "A Private Magic Show in a Palisades living room or backyard — ocean air, string lights, forty friends sitting close — is one of the most beautiful settings for this format. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your home becomes a private theater. The show is mentalism, storytelling, and audience interaction that earns standing ovations in living rooms.",
    "These shows work for milestone birthdays, anniversary dinners, holiday gatherings, or any evening where the host wants to give their guests something unforgettable. The Palisades setting adds atmosphere you can't manufacture — the sound of the canyon, the ocean in the distance, and something impossible happening right in front of you.",
  ],
  "pacific-palisades--golf-tournament-magician": [
    "Golf tournaments at Westside courses near the Palisades — Riviera Country Club, Brentwood Country Club — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the tournament.",
    "Scott also serves as MC for the awards dinner when needed, keeping the flow tight from cocktails through trophies. The Palisades golf crowd is competitive and social, and close-up magic that's sharp and impossible to figure out fits that energy perfectly.",
  ],
  "pacific-palisades--charity-gala-magician": [
    "Charity galas in the Palisades are community-driven — school fundraisers, environmental causes, neighborhood rebuilding efforts, and local nonprofit events that bring the community together. Scott's close-up magic during the cocktail hour gives guests something to bond over before the program begins. When people are energized and connected, they bid higher and give more freely.",
    "The Palisades community came together after the 2025 fires, and that sense of resilience shows up at these events. People are generous, they're proud of their neighborhood, and they show up for each other. Scott's magic adds warmth and energy to evenings that already have heart.",
  ],
  "pacific-palisades--holiday-party-magician": [
    "Holiday parties in the Palisades are home-hosted celebrations — Thanksgiving dinners that spill onto the patio, Christmas gatherings with ocean views, New Year's Eve parties where the guest count is manageable and the vibe is warm. Scott's close-up magic adds something unexpected to these evenings without changing the tone. He moves through the party, performs for small groups, and lets the reactions do the work.",
    "The Palisades holiday crowd wants something memorable that fits the warmth of the evening. Mentalism and close-up magic are perfect — quiet enough for a living room, powerful enough that people are still texting the host about it the next morning.",
  ],
  "pacific-palisades--trade-show-magician": [
    "Pacific Palisades is home to professionals and executives who regularly represent their companies at conventions and expos across LA and beyond. White Rabbit brings foot traffic to your booth with close-up magic that stops people mid-aisle. Within minutes, a crowd forms, your sales team has warm leads, and your booth is the one people remember.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic leads directly to your brand. The format works for any booth size and any industry. Scott coordinates with your team on timing, flow, and goals before the event.",
  ],
  "pacific-palisades--mentalist": [
    "Mentalism at a Palisades dinner party is an experience people replay in their heads for weeks. Scott reads thoughts, predicts decisions, and reveals details that shouldn't be possible — all without props or anything that looks like a magic show. In the intimate Palisades setting, where the guest count is small and everyone is paying attention, the impact of real mentalism is staggering.",
    "The Palisades crowd is sharp, successful, and used to being the smartest person in the room. Mentalism works on them because it challenges that in a way that's thrilling and fun. When Scott knows what someone was thinking — really knows — the room goes quiet for a beat before it erupts. That's the moment that makes a party legendary.",
  ],
  "pacific-palisades--rehearsal-dinner-magician": [
    "Rehearsal dinners in the Palisades are intimate — close family, the wedding party, maybe thirty people at a local restaurant or someone's canyon home. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He keeps it warm and personal, and creates moments that get referenced in toasts the next afternoon.",
    "The magic works especially well at rehearsal dinners because the audience is small and connected. In a setting as beautiful as the Palisades, the evening already has character — Scott just adds a moment nobody saw coming.",
  ],
  "pacific-palisades--halloween-party-magician": [
    "Halloween in the Palisades is a neighborhood event — families during the day, adult parties at night, and canyon homes that make the perfect backdrop for something mysterious. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little eerie when you're sitting on a canyon deck after dark.",
    "The format works for costume parties, themed dinners, and any gathering where the host wants entertainment that matches the atmosphere. The Palisades setting — dark canyons, ocean sounds, quiet streets — makes the mysterious elements of mentalism land even harder.",
  ],
  "pacific-palisades--christmas-party-magician": [
    "Christmas and New Year's Eve in the Palisades are cozy, home-hosted celebrations — fireplaces, good wine, ocean views, and guests who are part of the community. Scott's close-up magic adds a spark to these evenings without changing the relaxed coastal tone. He performs for small groups during cocktails, and by dessert, the magic is what everyone's talking about.",
    "For New Year's Eve, Scott brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for twenty or a standing party for eighty, the magic gives the evening a focal point. Palisades NYE hosts want something memorable, and White Rabbit delivers.",
  ],
  "pacific-palisades--premiere-red-carpet-magician": [
    "Pacific Palisades is home to entertainment executives, producers, and A-list talent who host industry events at their canyon and oceanview estates. Screening parties, wrap celebrations, and intimate gatherings where the guest list is people who make entertainment for a living. Scott's close-up magic fits these events because it's personal and low-key — no production, no disruption, just impossible moments that surprise an audience that's genuinely hard to fool.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott performs on the Westside regularly for industry clients who want something their guests haven't seen before. The Palisades setting — beautiful, private, intimate — makes every reaction feel more genuine.",
  ],
  "pacific-palisades--dmc-entertainment": [
    "Pacific Palisades isn't a typical DMC stop, but for groups doing a curated coastal LA experience — Malibu to Santa Monica itineraries, oceanview dinners, executive retreats at canyon estates — White Rabbit adds entertainment that makes the evening unforgettable. Scott performs during welcome receptions, private dinners, and intimate group gatherings.",
    "The magic works especially well for incentive travel groups where the setting is already stunning and the attendees are senior-level. Close-up magic and mentalism give people something genuinely surprising that matches the beauty of the Palisades. Scott coordinates with DMC teams on timing and logistics.",
  ],
  "pacific-palisades--resident-event-magician": [
    "Pacific Palisades residential communities and canyon neighborhoods want events that bring people together — especially as the community continues to rebuild and reconnect after the 2025 fires. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors are laughing together over something impossible they just witnessed.",
    "The format requires no stage, no AV, no setup. It fits into community gatherings, block parties, clubhouse events, and any space where people can stand and talk. For a neighborhood that values community and connection, White Rabbit events consistently bring people together in a way that feels real.",
  ],
  // ── San Francisco ────────────────────────────────────────────────────
  "san-francisco--corporate-event-magician": [
    "Product launches in SoMa that need to land perfectly, holiday parties for engineering teams that value authenticity, investor dinners in Pacific Heights where old money meets venture capital. Companies flying Scott in from Los Angeles understand that close-up magic performed at the right moment can shift the entire energy of an event: a tense product reveal becomes a conversation starter, a formal investor dinner becomes memorable. The tech world appreciates craft and precision, and that's exactly what White Rabbit delivers.",
    "Whether your event is at an Embarcadero waterfront venue, a Nob Hill private dining room, or a Moscone Center trade show, Scott has worked across San Francisco's corporate scene and understands what resonates with your specific crowd. Team offsites for the companies reshaping the world, holiday parties where engineers actually want to engage with entertainment, investor dinners where Scott's close-up magic becomes the memorable highlight — these are the moments that matter.",
  ],
  "san-francisco--private-party-magician": [
    "Private parties in San Francisco happen at Pacific Heights mansions, SoMa lofts, and homes with views of the Bay that make you forget you're in a city. The hosts tend to be tech founders, venture capitalists, and old-money families who entertain often and want something their guests haven't seen. Scott's close-up magic fits because it's personal, surprising, and doesn't require any setup in spaces where the architecture is already doing the heavy lifting.",
    "Scott flies in from LA for San Francisco private party bookings, and the city is one of his most requested travel markets. Birthday milestones, engagement celebrations, holiday gatherings — the magic adapts to whatever the host has planned. The SF crowd reacts big once they let their guard down, and close-up magic is the fastest way to get there.",
  ],
  "san-francisco--wedding-magician": [
    "San Francisco weddings are gorgeous — Nob Hill venues, waterfront celebrations along the Embarcadero, wine country-adjacent rehearsal dinners in Napa and Sonoma. Scott's cocktail hour magic fits the beauty of these settings without competing with them. He performs for small groups while guests mingle, and by dinner, strangers from different sides of the aisle feel connected over something they can't explain.",
    "The SF wedding market draws couples who care about every detail — the venue, the menu, the playlist — and they want entertainment that matches that intention. Scott flies in from LA for San Francisco wedding bookings and coordinates travel seamlessly. He's also available for rehearsal dinners, where the smaller group makes the magic even more personal. Wine country rehearsal dinners with close-up magic are a combination that always works.",
  ],
  "san-francisco--close-up-magician": [
    "Close-up magic in San Francisco works because the events here are built around socializing in beautiful spaces — rooftop bars, gallery openings, hotel lobbies, and private dining rooms with Bay views. Scott moves through these settings performing for groups of four to eight, using cards, borrowed objects, and mentalism that happens right in their hands. No stage, no AV, no production — just something impossible happening six inches from your face.",
    "The San Francisco crowd is curious, well-educated, and used to being around innovation — which makes them the perfect audience for close-up magic. They want to understand how it works, they watch closely, and when they still can't figure it out, the reaction is genuine and loud. Scott flies in from LA regularly, and SF is one of his most requested travel markets for close-up magic.",
  ],
  "san-francisco--private-magic-show": [
    "A Private Magic Show in a Pacific Heights living room, a SoMa loft, or a private event space overlooking the Bay is an experience that fits San Francisco's appreciation for craft and originality. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show is mentalism, storytelling, and audience interaction designed for people who appreciate something intentional.",
    "These shows work for milestone birthdays, investor dinners, team celebrations, and any evening where the host wants to give their guests something they've never experienced. Scott flies in from LA for these bookings, and the intimate format travels perfectly — no bulky production, just world-class performance that fills whatever room you put it in.",
  ],
  "san-francisco--golf-tournament-magician": [
    "Golf tournaments at Bay Area courses — Olympic Club, TPC Harding Park, and Peninsula clubs — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the tournament day.",
    "Scott flies in from LA for San Francisco golf tournament bookings and also serves as MC for the awards dinner when needed. The Bay Area golf crowd is competitive and social, and close-up magic that's sharp and impossible to figure out fits that energy perfectly. Sponsors get genuine face time with their audience, and players get a story better than their scorecard.",
  ],
  "san-francisco--charity-gala-magician": [
    "San Francisco has one of the strongest charity gala scenes in the country — old-money Pacific Heights fundraisers, tech industry philanthropic events, and nonprofit galas at iconic venues. Scott's close-up magic during the cocktail hour gives guests something to bond over before the program begins. When people are energized and connected, they bid higher and give more freely.",
    "The SF gala crowd is generous and engaged, but they've attended enough of these events to know when the entertainment is phoned in. Scott's magic provides something unexpected — personal, interactive, and genuinely surprising — that makes this year's gala the one people remember. He flies in from LA and coordinates with event teams on timing and format.",
  ],
  "san-francisco--holiday-party-magician": [
    "Holiday parties in San Francisco are a major corporate event — tech companies, law firms, and financial institutions host end-of-year celebrations at hotels, restaurants, and private event spaces across the city. Scott's close-up magic during the cocktail hour gives employees and clients something genuine to bond over. It breaks the ice faster than an open bar and creates moments people are still talking about when they're back at their desks in January.",
    "Scott flies in from LA for San Francisco holiday party bookings — it's one of his busiest travel routes during Q4. The format works for seated dinners of thirty and standing cocktail parties of three hundred. Christmas parties, Hanukkah celebrations, New Year's Eve — White Rabbit makes your company holiday event the one people actually look forward to next year.",
  ],
  "san-francisco--trade-show-magician": [
    "San Francisco hosts major tech conferences and trade shows throughout the year — Dreamforce, TechCrunch, industry-specific expos at Moscone Center. White Rabbit brings foot traffic to your booth with close-up magic that stops people mid-aisle. Within minutes, a crowd forms, your sales team has warm leads, and your booth is the one people are telling their colleagues about at the hotel bar.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic isn't just a spectacle — it's a conversation starter that leads directly to your brand. The tech conference crowd is hard to stop, but impossible magic in their hands does it every time. Scott flies in from LA for SF trade show bookings and coordinates with your team on timing, flow, and goals.",
  ],
  "san-francisco--mentalist": [
    "Mentalism at a San Francisco dinner party or corporate event is an experience that sticks. Scott reads thoughts, predicts decisions, and reveals details that shouldn't be possible — all without props or anything that looks like a magic show. In a city full of people who build technology for a living, encountering something that genuinely can't be explained creates a reaction you don't see very often.",
    "The SF crowd is analytical, curious, and competitive about figuring things out. Mentalism works on them because it operates outside the framework they're used to. When a CTO or a venture partner can't explain how Scott knew what they were thinking, the room shifts. That moment — the one where the smartest person in the room has no answer — is what makes mentalism unforgettable.",
  ],
  "san-francisco--rehearsal-dinner-magician": [
    "Rehearsal dinners in San Francisco are intimate — close family, the wedding party, maybe thirty people at a restaurant in North Beach or a private dining room on Nob Hill. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He keeps it warm and personal, and creates moments that get referenced in toasts the next afternoon.",
    "Scott flies in from LA for San Francisco rehearsal dinner bookings, and wine country rehearsal dinners in Napa or Sonoma are also a natural fit. The smaller group makes the magic even more personal, and the relaxed pre-wedding energy means guests are open and ready to be surprised.",
  ],
  "san-francisco--halloween-party-magician": [
    "Halloween in San Francisco has its own energy — costume parties, themed dinners, and gatherings where the hosts go all-in on atmosphere. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little eerie in the best way. The fog rolling in off the Bay doesn't hurt either.",
    "The format works for adult Halloween parties, themed corporate events, and any gathering where the host wants entertainment that matches the atmosphere. Scott flies in from LA for San Francisco Halloween bookings, and the city's natural moodiness makes mentalism land even harder than usual.",
  ],
  "san-francisco--christmas-party-magician": [
    "Christmas and New Year's Eve in San Francisco are major corporate and social events — company dinners at hotel ballrooms, private celebrations at Pacific Heights homes, and NYE parties overlooking the Bay. Scott's close-up magic adds a spark to these evenings that guests remember long after the decorations come down. He performs for small groups during cocktails, and the reactions spread naturally.",
    "Scott flies in from LA for San Francisco holiday bookings — Q4 is his busiest travel season to the Bay Area. For New Year's Eve, he brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for forty or a standing party for three hundred, White Rabbit makes your SF holiday event the one people talk about.",
  ],
  "san-francisco--premiere-red-carpet-magician": [
    "San Francisco hosts film festivals, tech launch events, and industry parties where the guest list includes people who shape culture and commerce. Scott's close-up magic fits VIP receptions and after-parties because it's personal and unexpected — no production, no disruption, just impossible moments during the cocktail hour that genuinely surprise an audience used to spectacle.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott flies in from LA for San Francisco industry events and fits into VIP rooms naturally. In a city that prides itself on seeing the future first, something genuinely unexplainable happening in your hands still gets the biggest reaction in the room.",
  ],
  "san-francisco--dmc-entertainment": [
    "Destination management companies bringing groups to San Francisco want entertainment that stands out from the typical cable car tour and Fisherman's Wharf dinner. White Rabbit fits into curated SF itineraries: welcome reception magic at hotel venues, dinner performances at private restaurants, and VIP experiences that give groups something personal and memorable between conference sessions.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. Close-up magic breaks the ice faster than any icebreaker exercise, and guests bond over shared amazement rather than awkward small talk. Scott flies in from LA and coordinates with DMC teams on timing and logistics.",
  ],
  "san-francisco--resident-event-magician": [
    "San Francisco's luxury condo buildings and residential communities — Pacific Heights, Russian Hill, the waterfront high-rises — want resident events that feel different from the usual wine and cheese mixer. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who ride the same elevator every day are actually talking to each other.",
    "The format requires no stage, no AV, no setup. It fits into lobby events, rooftop gatherings, and any community space. Property managers in San Francisco consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming. Scott flies in from LA for these bookings.",
  ],
  // ── Chicago ──────────────────────────────────────────────────────────
  "chicago--corporate-event-magician": [
    "Chicago is one of the best corporate event cities in the country — Fortune 500 headquarters, major law firms, financial institutions, and a business culture that actually invests in entertaining clients and employees. Events happen along the Magnificent Mile, in Loop hotel ballrooms, at private dining rooms in River North, and at rooftop venues overlooking the lakefront. Scott flies in from LA for Chicago corporate bookings regularly, and the city's event energy makes every performance hit harder.",
    "The Chicago corporate crowd is warm, social, and competitive — Midwestern hospitality meets big-city sophistication. Close-up magic works at these events because it matches that energy: sharp, interactive, and built for a room where people actually want to talk to each other. Scott moves through the cocktail hour performing for small groups, and within minutes, VPs and clients who were making small talk are sharing a genuine moment of amazement.",
  ],
  "chicago--private-party-magician": [
    "Private parties in Chicago happen at Gold Coast mansions, Lincoln Park townhouses, and lakefront condos with skyline views that stop you mid-sentence. The hosts care about the details — the food, the drinks, the guest list — and they want entertainment that matches the effort without feeling like a corporate booking. Scott's close-up magic fits perfectly. He moves through the party performing for small groups, and the reactions spread naturally from the living room to the kitchen to the rooftop.",
    "Scott flies in from LA for Chicago private party bookings, and the city's social energy makes it one of his favorite travel markets. Birthday milestones, anniversary celebrations, holiday gatherings — Chicago hosts go big, and the audiences are warm, loud, and genuinely fun to perform for. The reactions here are some of the best Scott gets anywhere in the country.",
  ],
  "chicago--wedding-magician": [
    "Chicago weddings are beautiful — lakefront venues, historic ballrooms, rooftop ceremonies with the skyline behind them, and cocktail hours where the architecture does half the work. Scott's cocktail hour magic fits the beauty of these settings. He performs for small groups while guests mingle, and by dinner, strangers from different sides of the aisle feel connected over something they can't explain.",
    "Scott flies in from LA for Chicago wedding bookings and coordinates travel seamlessly. The Chicago wedding crowd is fun, social, and ready to have a good time — which means the reactions to close-up magic are loud and genuine. He's also available for rehearsal dinners, where the smaller group makes the magic even more personal. Chicago rehearsal dinners at neighborhood Italian restaurants are a combination that always works.",
  ],
  "chicago--close-up-magician": [
    "Close-up magic in Chicago works because the event culture here is built around being social. Cocktail hours run long, people actually talk to each other, and the energy in the room is warm from the moment guests arrive. Scott moves through these settings performing for groups of four to eight — cards, borrowed objects, mentalism — and everything happens right in their hands. No stage, no AV, no setup.",
    "The Chicago crowd reacts big. There's no playing it cool, no pretending they're not amazed. When something impossible happens in their hands, they shout, they grab their friend's arm, they call people over from across the room. That energy is contagious, and by the end of cocktail hour, most of the room has either experienced the magic or heard about it from someone who did. Scott flies in from LA regularly for Chicago close-up magic bookings.",
  ],
  "chicago--private-magic-show": [
    "A Private Magic Show in a Gold Coast living room, a Lincoln Park townhouse, or a private event space overlooking Lake Michigan is an experience that fits Chicago's love of great entertainment. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show is mentalism, storytelling, and audience interaction that gets standing ovations.",
    "These shows work for milestone birthdays, investor dinners, team celebrations, and any evening where the host wants something their guests have never experienced. Scott flies in from LA for these bookings, and the intimate format travels perfectly — no bulky production, just world-class performance that fills whatever room you put it in.",
  ],
  "chicago--golf-tournament-magician": [
    "Golf tournaments at Chicago-area courses — Medinah, Olympia Fields, Cog Hill — host their post-round receptions at the clubhouse. White Rabbit fills the gap between the last putt and the first toast with roaming close-up magic that keeps players and sponsors engaged. The 19th-hole magic consistently becomes the most talked-about part of the tournament day.",
    "Scott flies in from LA for Chicago golf tournament bookings and also serves as MC for the awards dinner when needed. The Midwest golf crowd is there to have a good time, and close-up magic that's sharp and impossible to figure out fits that energy perfectly. Sponsors get genuine face time with their audience, and players get a story better than their scorecard.",
  ],
  "chicago--charity-gala-magician": [
    "Chicago has one of the strongest charity gala scenes in the country — Gold Coast fundraisers, corporate-sponsored galas at downtown hotels, and nonprofit events that draw hundreds of the city's most generous donors. Scott's close-up magic during the cocktail hour gives guests something to bond over before the program begins. When people are energized and connected, they bid higher and give more freely.",
    "The Chicago gala crowd is generous, well-dressed, and used to attending these events — which means the entertainment needs to offer something they haven't seen before. Scott's magic provides exactly that: personal, interactive, and genuinely surprising. He flies in from LA and coordinates with event teams on timing and format.",
  ],
  "chicago--holiday-party-magician": [
    "Holiday parties in Chicago are a big deal — the city takes end-of-year celebrations seriously. Corporate dinners at downtown hotels, law firm parties in private dining rooms, and company-wide events at venues along the Magnificent Mile. Scott's close-up magic during the cocktail hour gives employees and clients something genuine to bond over. It breaks the ice and creates moments people are still talking about when they're back at their desks in January.",
    "Scott flies in from LA for Chicago holiday party bookings — it's one of his busiest travel routes during Q4. Christmas parties, Hanukkah celebrations, New Year's Eve — the format works for seated dinners and standing cocktail parties equally well. Chicago holiday hosts go big, and White Rabbit matches that energy.",
  ],
  "chicago--trade-show-magician": [
    "Chicago hosts some of the biggest trade shows in the country at McCormick Place — and the competition for booth traffic is fierce. White Rabbit brings people to your booth with close-up magic that stops attendees mid-aisle. Within minutes, a crowd forms, your sales team has warm leads, and your booth is the one people are telling their colleagues about at dinner.",
    "Scott customizes routines to feature your product or messaging in the reveal, so the magic leads directly to your brand. The trade show crowd at McCormick Place is there to see everything, which means you need something that actually stops them. Impossible magic in their hands does it every time. Scott flies in from LA and coordinates with your team on timing, flow, and goals.",
  ],
  "chicago--mentalist": [
    "Mentalism at a Chicago dinner party or corporate event is an experience that sticks. Scott reads thoughts, predicts decisions, and reveals details that shouldn't be possible — all without props or anything that looks like a magic show. The Chicago crowd is smart, social, and direct — when something genuinely unexplainable happens, they don't hide their reaction. They lose it.",
    "That directness is what makes performing mentalism in Chicago so rewarding. There's no pretense, no playing it cool. When a managing partner or a Fortune 500 executive can't explain how Scott knew what they were thinking, the whole table hears about it. Scott flies in from LA for Chicago mentalism bookings, and the city is one of his favorite audiences in the country.",
  ],
  "chicago--rehearsal-dinner-magician": [
    "Rehearsal dinners in Chicago are intimate — close family, the wedding party, maybe thirty people at a neighborhood restaurant in Lincoln Park or a private dining room downtown. Scott's close-up magic during cocktails gives the group something to bond over the night before the big day. He keeps it warm and personal, and creates moments that get referenced in toasts the next afternoon.",
    "Scott flies in from LA for Chicago rehearsal dinner bookings. The smaller group makes the magic even more personal, and the celebratory pre-wedding energy means guests are open and ready to be surprised. Chicago rehearsal dinner crowds are warm and vocal, which makes every reaction contagious.",
  ],
  "chicago--halloween-party-magician": [
    "Halloween in Chicago has serious energy — costume parties, themed dinners, and gatherings where the hosts go all-in on atmosphere. Scott's mentalism and close-up magic fit the Halloween mood perfectly — mind-reading, predictions, and impossible moments that feel a little eerie in the best way. A dark October evening in a Gold Coast brownstone with mentalism happening at the dinner table is a combination that works every time.",
    "The format works for adult Halloween parties, themed corporate events, and any gathering where the host wants entertainment that matches the atmosphere. Scott flies in from LA for Chicago Halloween bookings.",
  ],
  "chicago--christmas-party-magician": [
    "Christmas and New Year's Eve in Chicago are major events — the city does the holidays right. Company dinners at Michigan Avenue hotels, private celebrations in Gold Coast homes, and NYE parties overlooking the lakefront. Scott's close-up magic adds something to these evenings that guests remember long after the decorations come down.",
    "Scott flies in from LA for Chicago holiday bookings — Q4 is his busiest travel season to the Midwest. For New Year's Eve, he brings higher energy — faster pace, bigger reveals, countdown-ready material. Whether it's a seated dinner for forty or a standing party for three hundred, White Rabbit makes your Chicago holiday event the one people talk about all year.",
  ],
  "chicago--premiere-red-carpet-magician": [
    "Chicago hosts film festivals, media events, product launches, and industry parties where the guest list includes people who shape business and culture. Scott's close-up magic fits VIP receptions and launch events because it's personal and unexpected — no production, no disruption, just impossible moments during the cocktail hour that genuinely surprise a crowd that's seen plenty of entertainment.",
    "White Rabbit has worked with Netflix, Disney, Paramount, and Rolls-Royce. Scott flies in from LA for Chicago industry events and fits into VIP settings naturally. The magic works because it's real and personal in a way that stage shows and DJs can't match.",
  ],
  "chicago--dmc-entertainment": [
    "Destination management companies bringing groups to Chicago want entertainment that stands out from the architecture tour and deep-dish dinner. White Rabbit fits into curated Chicago itineraries: welcome reception magic at downtown hotels, dinner performances at private restaurants, and VIP experiences that give groups something personal and memorable between convention sessions at McCormick Place.",
    "The magic works especially well during networking moments where attendees from different offices or regions are meeting for the first time. Close-up magic breaks the ice faster than any icebreaker exercise, and guests bond over shared amazement rather than awkward small talk. Scott flies in from LA and coordinates with DMC teams on timing and logistics.",
  ],
  "chicago--resident-event-magician": [
    "Chicago's luxury high-rises and condo buildings — Gold Coast, Streeterville, Lincoln Park, the lakefront towers — want resident events that feel different from the usual lobby mixer. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who ride the same elevator every day are actually connecting over something real.",
    "The format requires no stage, no AV, no setup. It fits into lobby events, rooftop gatherings, party rooms, and any community space. Property managers in Chicago consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming. Scott flies in from LA for these bookings.",
  ],
  // ── Long Beach ─────────────────────────────────────────────────────────
  "long-beach--corporate-event-magician": [
    "Long Beach has its own corporate identity — the convention center pulls major trade shows and conferences, and companies along Ocean Boulevard and in the downtown corridor host events that feel different from the typical LA corporate booking. There's a port city energy here, a directness that makes the cocktail hour more social and less stiff. Scott performs at Long Beach corporate events regularly, and the audiences are engaged from the first moment.",
    "The Long Beach Convention Center is a workhorse venue, but the corporate events that happen in the restaurants and hotel ballrooms around it are where close-up magic really shines. Scott moves through these receptions performing for small groups of executives, clients, and partners, and within minutes the room loosens up in a way that no keynote speaker or team-building exercise can match.",
  ],
  "long-beach--private-party-magician": [
    "Private parties in Long Beach happen at Belmont Shore bungalows, Naples Island waterfront homes, and Bixby Knolls houses with backyards big enough to host fifty people comfortably. The vibe is more relaxed than the Westside — hosts care about their guests having a great time, not about impressing anyone. Scott's close-up magic fits this energy perfectly. He moves through the party, performing for small groups, and the reactions spread naturally from the patio to the living room.",
    "Long Beach has a strong community feel — people know their neighbors, friend groups overlap, and parties tend to be warm and social rather than scene-y. That's the perfect environment for close-up magic because it's built on connection. When Scott makes something impossible happen in someone's hands, the whole group reacts together, and those shared moments become the stories people tell for months.",
  ],
  "long-beach--wedding-magician": [
    "Long Beach weddings have a waterfront beauty that's hard to beat — venues along the marina, celebrations near Shoreline Village, and receptions with harbor views and ocean air. Scott's cocktail hour magic fits these settings naturally. While guests mingle with drinks in hand and the sun drops behind the breakwater, he performs for small groups, and by the time everyone sits down for dinner, strangers from opposite sides of the aisle feel like old friends.",
    "The Long Beach wedding crowd is fun and unpretentious — people are there to celebrate, not to be seen. That energy makes the magic land harder because there's no coolness barrier to break through. Guests react big, they call friends over, they grab the couple to come watch. Scott is available for rehearsal dinners too, where the smaller group makes the magic even more personal and the waterfront restaurant settings are ideal.",
  ],
  "long-beach--close-up-magician": [
    "Close-up magic in Long Beach works because the city's event culture is genuinely social. People here actually talk to each other at parties — there's a warmth and directness that you don't always get in LA proper. Scott performs for groups of four to eight, using cards, borrowed objects, and mentalism, and everything happens right in their hands. No stage, no microphone, no setup required.",
    "The reactions Scott gets in Long Beach are some of his favorites. There's no pretending to be unimpressed, no playing it cool. When something impossible happens inches from someone's face, they shout, they grab their friend, they make everyone at the party come watch. That energy spreads through the room fast, and by the end of cocktail hour, the magic is the thing everyone's talking about.",
  ],
  "long-beach--private-magic-show": [
    "A Private Magic Show in a Naples Island living room, a Belmont Shore home, or a private event space overlooking the Long Beach marina is an experience that fits the city's love of intimate, social entertainment. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show blends mentalism, storytelling, and audience interaction into something that gets standing ovations every time.",
    "These shows work for milestone birthdays, anniversary celebrations, dinner parties, and any evening where the host wants to give their guests something they've never experienced. The intimate format is perfect for Long Beach — no big production, no bulky equipment, just world-class performance that fills whatever room you put it in. Guests leave talking about the show, not the appetizers.",
  ],
  "long-beach--mentalist": [
    "Mentalism in Long Beach hits differently because the audiences are smart and engaged without being cynical about it. Scott reads body language, predicts decisions, and reveals thoughts that people were certain they kept private — and the Long Beach crowd reacts with genuine amazement rather than trying to figure out the method. That openness makes every performance electric.",
    "Whether it's a corporate reception at a downtown hotel, a private dinner in Naples Island, or a house party in Belmont Shore, mentalism creates conversation that lasts well beyond the event. Guests spend the rest of the night debating how it works, testing each other, and retelling what happened to anyone who missed it. It's the kind of entertainment that gives your event a story.",
  ],
  "long-beach--trade-show-magician": [
    "The Long Beach Convention Center hosts major trade shows and conferences throughout the year, and the competition for booth traffic is real. Scott draws crowds to your booth using custom magic routines that incorporate your product or messaging into the performance. People stop to watch, stay to engage, and leave remembering your brand because the experience was genuinely surprising.",
    "Scott works with your team before the show to build routines around your key talking points. The magic creates a natural opening for your sales team to start conversations with warm, engaged prospects instead of cold badge-scanners walking past. Booth traffic increases measurably, and the quality of those interactions goes up even more. He's performed at trade shows across the country and knows how to work a convention floor.",
  ],
  "long-beach--cocktail-hour-magician": [
    "Cocktail hour in Long Beach — whether it's a wedding reception near the waterfront, a corporate mixer at a downtown venue, or a private party in Belmont Shore — is when the magic does its best work. Scott moves through the room performing for small groups, and the energy builds naturally. One table is laughing in disbelief, the group next to them leans in to see what's happening, and suddenly the whole room has a buzz that no playlist or open bar can create.",
    "The format is flexible and requires zero setup. Scott arrives, reads the room, and starts performing where the energy is right. He adjusts to the crowd — more mentalism for a sophisticated corporate group, more visual magic for a lively birthday party. Long Beach cocktail hours have a relaxed social energy that makes them some of Scott's favorite events to work.",
  ],
  "long-beach--corporate-dinner-magician": [
    "Corporate dinners in Long Beach happen at waterfront restaurants, hotel private dining rooms, and venues near the convention center where the food is excellent and the conversation matters. Scott performs between courses, moving from table to table with close-up magic that gives each group their own impossible moment. The magic breaks down the hierarchy — suddenly the CEO and the new hire are reacting to the same thing, and the table dynamic shifts.",
    "These performances are quiet, sophisticated, and built for the intimate setting of a seated dinner. Scott reads the room and adjusts — more mentalism for an executive group, more interactive magic for a team celebration. The Long Beach dining scene is strong enough that hosts put real thought into these evenings, and the entertainment should match that effort.",
  ],
  "long-beach--birthday-party-magician": [
    "Birthday parties in Long Beach — whether it's a 40th at a Belmont Shore house, a surprise 50th at a Naples Island home, or a 30th at a restaurant near the marina — deserve entertainment that makes the guest of honor feel like the star. Scott's close-up magic and mentalism create moments that center on the birthday person while engaging everyone in the room. It's personal, surprising, and completely different from anything a DJ or photo booth can offer.",
    "The Long Beach birthday crowd is social and expressive — when something impossible happens, the reactions are loud, genuine, and contagious. Scott can perform roaming magic during the party or deliver a 30-minute private show that brings everyone together for a shared experience. Either way, the birthday person gets a night their guests will be talking about for years.",
  ],
  "long-beach--holiday-party-magician": [
    "Holiday parties in Long Beach — corporate celebrations at downtown venues, neighborhood gatherings in Belmont Shore, and private parties in homes throughout the coastal neighborhoods — need entertainment that works for mixed crowds. Scott's close-up magic is perfect because it meets people where they are. He moves through the party performing for small groups, and the magic creates instant connection between coworkers, neighbors, and guests who just met.",
    "The holiday season in Long Beach has a laid-back warmth that makes parties feel more genuine than obligatory. Scott matches that energy — his performances are social and interactive, not showy or theatrical. By the end of the evening, the magic is what everyone's talking about, and the host gets credit for finding something that actually brought people together instead of just filling time.",
  ],
  "long-beach--fundraiser-gala-magician": [
    "Fundraiser galas in Long Beach draw from the city's mix of corporate leaders, arts community supporters, and civic-minded residents who show up ready to give and have a good time. Scott's close-up magic during cocktail hour warms up the room before the ask, creating a generous, connected energy that carries into the program. When donors are genuinely enjoying themselves, they give more freely.",
    "The format works in any gala setting — hotel ballrooms, museum spaces, waterfront venues, or private estates. Scott moves through the crowd performing for small groups, and the reactions create a buzz that spreads through the room. Gala organizers in Long Beach consistently report that the magic helps with table energy and keeps the evening feeling special rather than transactional.",
  ],
  "long-beach--brand-activation-magician": [
    "Brand activations in Long Beach happen at waterfront locations, convention center events, pop-ups in the East Village Arts District, and launch parties at venues near the marina. Scott creates custom magic routines built around your product or brand message — the reveal isn't just surprising, it's your product. Audiences engage because the experience is genuinely entertaining, not because they're being pitched.",
    "The Long Beach market responds well to activations that feel authentic rather than produced. Scott's approach works because the magic creates real moments of connection between your brand and potential customers. People share these experiences on social media not because you asked them to, but because something genuinely amazing just happened in their hands and they want to show their friends.",
  ],
  "long-beach--whiskey-tasting-magician": [
    "Whiskey tastings and spirits events in Long Beach — at craft cocktail bars downtown, private collections in Naples Island homes, and tasting rooms near the waterfront — pair naturally with close-up magic. Both require attention, appreciation for craft, and a willingness to be surprised. Scott performs between pours, and the magic gives guests something to react to together while the whiskey gives them something to sip on. The combination slows the evening down in the best way.",
    "The Long Beach spirits crowd is curious and social — they want to know the story behind what they're drinking and they're genuinely interested in watching something skillful happen up close. Scott's sleight of hand has the same precision they're looking for in a well-made cocktail, and the mentalism adds a layer that turns a tasting into an experience people remember for the story, not just the bourbon.",
  ],
  "long-beach--house-party-magician": [
    "House parties in Long Beach are the real deal — Belmont Shore bungalows with string lights in the backyard, Naples Island homes where the canals are right there, Bixby Knolls houses with enough room for the whole neighborhood to show up. Scott's close-up magic is built for exactly this setting. No stage, no microphone, just impossible things happening in people's hands while they're holding a drink and standing in the kitchen.",
    "The Long Beach house party vibe is warm, casual, and genuinely social — people come to hang out, not to be seen. Scott reads that energy and matches it perfectly. He starts with one group, the reactions draw people over, and within twenty minutes, the whole party has a different buzz. Guests who came knowing nobody leave feeling like they shared something with the room. That's the magic doing what it does best.",
  ],
  "long-beach--resident-event-magician": [
    "Long Beach's waterfront condos, marina-adjacent complexes, and luxury apartment buildings along Ocean Boulevard want resident events that feel different from the usual lobby mixer. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who share a building but never talk are actually connecting over something real.",
    "The format requires no stage, no AV, no setup — it fits into community rooms, rooftop terraces, pool areas, and any common space. Property managers in Long Beach consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming they've tried. It's the kind of event that makes people glad they live where they live.",
  ],
  // ── Dallas ─────────────────────────────────────────────────────────────
  "dallas--corporate-event-magician": [
    "Dallas is one of the strongest corporate event markets in the country — oil and gas headquarters, financial firms, a growing tech corridor, and a business culture that actually invests in making events memorable. Corporate parties happen in Uptown high-rises, Arts District venues, and private dining rooms across the city, and the budgets are real. Scott flies in from LA for Dallas corporate bookings, and the audiences are warm, competitive, and ready to be impressed.",
    "The Dallas corporate crowd works hard and plays hard — they want entertainment that matches the energy they put into everything else. Close-up magic works at these events because it's interactive and personal. Scott moves through the cocktail hour performing for small groups of executives, clients, and partners, and within minutes the room has a buzz that no band or DJ can create. When the CFO and the new client are both laughing at the same impossible moment, that's a business relationship that just got stronger.",
  ],
  "dallas--private-party-magician": [
    "Private parties in Dallas happen at Highland Park estates, Preston Hollow mansions, and Uptown penthouses where the hosts go big on everything — the catering, the décor, the guest list. Scott's close-up magic matches that generosity. He moves through the party performing for small groups, and the reactions spread from the living room to the backyard to the bar. Dallas hosts are competitive about their events, and White Rabbit gives them something their friends haven't seen.",
    "The Dallas private party crowd is social, expressive, and genuinely fun to perform for. There's no playing it cool — when something impossible happens in someone's hands, the whole room hears about it. Birthday milestones, anniversary celebrations, holiday gatherings, housewarming parties — Scott flies in from LA for these bookings and the Texas hospitality makes every show hit harder.",
  ],
  "dallas--wedding-magician": [
    "Dallas weddings are big, beautiful, and planned down to the last detail — venues in the Design District, ceremonies at Highland Park churches, receptions at hotel ballrooms where the production value is serious. Scott's cocktail hour magic fits right into this polish. While guests mingle between the ceremony and reception, he performs for small groups, and by the time everyone sits down for dinner, the aunt from Houston and the college roommate from Chicago feel like they've known each other for years.",
    "The Dallas wedding crowd wants to celebrate — loudly, genuinely, and without holding back. That energy makes close-up magic land perfectly because there's no reserve to break through. Guests react big, they pull the bride and groom over to watch, they tell the story at brunch the next morning. Scott flies in from LA for Dallas wedding bookings and is available for rehearsal dinners too, where the smaller group makes the magic even more personal.",
  ],
  "dallas--close-up-magician": [
    "Close-up magic in Dallas works because the city's social energy is real — people here actually engage with each other at events. There's a warmth and directness that comes with Texas hospitality, and it makes every performance more fun. Scott performs for groups of four to eight using cards, borrowed objects, and mentalism, and everything happens right in their hands. No stage, no AV, no setup needed.",
    "The reactions Scott gets in Dallas are some of the best anywhere. When something impossible happens inches from someone's face, they don't try to hide their amazement — they shout, they grab the person next to them, they make the whole party come watch. That energy is contagious, and by the end of cocktail hour, the magic is the thing everyone's talking about. Scott flies in from LA regularly for Dallas close-up magic bookings.",
  ],
  "dallas--private-magic-show": [
    "A Private Magic Show in a Highland Park living room, a Preston Hollow estate, or a private event space in the Design District is an experience that fits Dallas's appetite for world-class entertainment. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show blends mentalism, storytelling, and audience interaction into something that gets standing ovations every time.",
    "These shows work for milestone birthdays, investor dinners, team celebrations, and any evening where the host wants to give their guests something genuinely unforgettable. Dallas hosts appreciate quality and they can tell when they're getting the real thing. Scott flies in from LA for these bookings, and the intimate format travels perfectly — no bulky production, just world-class performance.",
  ],
  "dallas--mentalist": [
    "Mentalism in Dallas hits hard because the audiences are smart, successful, and used to being the sharpest person in the room. When Scott reads their body language, predicts their decisions, and reveals thoughts they were certain they kept private, the reaction is visceral — these are people who aren't easily fooled, and watching them realize they can't explain what just happened is electric.",
    "Whether it's an executive dinner in Uptown, a private party in Highland Park, or a corporate reception at an Arts District venue, mentalism creates conversation that lasts well beyond the event. Guests spend the rest of the night debating how it works, testing each other, and retelling what happened to anyone who missed it. Scott flies in from LA for Dallas mentalism bookings.",
  ],
  "dallas--trade-show-magician": [
    "Dallas hosts major trade shows and conventions throughout the year, and the competition for booth traffic is fierce. Scott draws crowds to your booth using custom magic routines that incorporate your product or messaging into the performance. People stop to watch, stay to engage, and leave remembering your brand because the experience was genuinely surprising — not just another giveaway pen.",
    "Scott works with your team before the show to build routines around your key talking points. The magic creates a natural opening for your sales team to start conversations with warm, engaged prospects instead of cold badge-scanners walking past. He's performed at trade shows across the country and knows how to work a convention floor. Scott flies in from LA and coordinates logistics with your team in advance.",
  ],
  "dallas--cocktail-hour-magician": [
    "Cocktail hour in Dallas — whether it's a wedding reception at a Design District venue, a corporate mixer in Uptown, or a private party at a Preston Hollow estate — is when close-up magic does its best work. Scott moves through the room performing for small groups, and the energy builds naturally. One group is laughing in disbelief, the people next to them lean in to see what's happening, and suddenly the whole room has a buzz that no playlist can create.",
    "The format is flexible and requires zero setup. Scott arrives, reads the room, and starts performing where the energy is right. Dallas cocktail hours have a social warmth that makes them some of his favorite events to work — people here don't hold back, and that makes the magic land every single time.",
  ],
  "dallas--corporate-dinner-magician": [
    "Corporate dinners in Dallas happen at Uptown steakhouses, Arts District private dining rooms, and hotel venues where the food is serious and the relationships matter. Scott performs between courses, moving from table to table with close-up magic that gives each group their own impossible moment. The magic breaks down the hierarchy — suddenly the managing partner and the associate are reacting to the same thing, and the table feels different.",
    "These performances are sophisticated, quiet, and built for the intimate setting of a seated dinner. Scott reads the room and adjusts — more mentalism for a buttoned-up executive group, more interactive magic for a team celebration. Dallas takes its corporate dining seriously, and the entertainment should match that effort. Scott flies in from LA for these bookings.",
  ],
  "dallas--birthday-party-magician": [
    "Birthday parties in Dallas — whether it's a 40th at a Highland Park mansion, a surprise 50th in Preston Hollow, or a 30th at an Uptown restaurant — go big by nature. The hosts want the best, and the guests expect to be impressed. Scott's close-up magic and mentalism deliver entertainment that makes the birthday person feel like the star while giving every guest their own moment of amazement.",
    "The Dallas birthday crowd is expressive and social — when something impossible happens, the reactions are loud, genuine, and contagious. Scott can perform roaming magic during the party or deliver a 30-minute private show that brings everyone together. Either way, the birthday person gets a night their guests will be talking about at every dinner party for the next year.",
  ],
  "dallas--holiday-party-magician": [
    "Holiday parties in Dallas — corporate celebrations in Uptown, neighborhood gatherings in Highland Park, and private parties at Preston Hollow estates — are serious productions. The hosts put real effort in, and the entertainment needs to match. Scott's close-up magic works for mixed crowds because it meets people where they are. He moves through the party performing for small groups, and the magic creates instant connection between coworkers, clients, and guests who just met.",
    "Dallas holiday party energy is warm and generous — people are there to celebrate, and they bring their full personality to the evening. Scott matches that energy with performances that are social, interactive, and built for a crowd that doesn't hold back. By the end of the night, the magic is what everyone's talking about, and the host gets credit for finding entertainment that actually brought people together.",
  ],
  "dallas--fundraiser-gala-magician": [
    "Dallas has one of the strongest fundraiser gala cultures in the country — the city's philanthropic community is generous, competitive, and invested in making these events memorable. Scott's close-up magic during cocktail hour warms up the room before the ask, creating a connected, energized atmosphere that carries into the program. When donors are genuinely enjoying themselves, they give more freely.",
    "The format works in any gala setting — hotel ballrooms, museum spaces, estate gardens, or country club venues. Scott moves through the crowd performing for small groups, and the reactions create a buzz that spreads through the room. Dallas gala organizers consistently report that the magic helps with energy and donor engagement. Scott flies in from LA for these bookings.",
  ],
  "dallas--brand-activation-magician": [
    "Brand activations in Dallas happen at pop-up locations across Uptown and the Design District, launch events at Deep Ellum venues, and corporate showcases in the Arts District. Scott creates custom magic routines built around your product or brand message — the reveal isn't just surprising, it's your product. Audiences engage because the experience is genuinely entertaining, not because they're being pitched.",
    "The Dallas market responds to activations that feel premium and confident — no gimmicks, just quality. Scott's approach works because the magic creates real moments of connection between your brand and potential customers. People share these experiences because something genuinely amazing just happened in their hands, and they want to show their friends. Scott flies in from LA and coordinates with your marketing team in advance.",
  ],
  "dallas--whiskey-tasting-magician": [
    "Whiskey tastings and spirits events in Dallas — at Uptown cocktail bars, private collections in Preston Hollow, and tasting rooms in the Design District — pair naturally with close-up magic. Both require attention, appreciation for craft, and a willingness to be surprised. Scott performs between pours, and the magic gives guests something to react to together while the bourbon gives them something to sip on.",
    "The Dallas spirits crowd takes their whiskey seriously and they appreciate skill in any form. Scott's sleight of hand has the same precision they're looking for in a well-aged pour, and the mentalism adds a layer that turns a tasting into an experience people remember for the story, not just the whiskey. The combination slows the evening down in the best way.",
  ],
  "dallas--house-party-magician": [
    "House parties in Dallas go big — Highland Park homes with backyards that could host a small wedding, Preston Hollow estates where the outdoor kitchen is nicer than most restaurants, Uptown condos where the rooftop is the real venue. Scott's close-up magic is built for exactly this setting. No stage, no microphone, just impossible things happening in people's hands while they're holding a drink and standing by the pool.",
    "The Dallas house party energy is warm, loud, and genuinely social — Texas hospitality in full effect. Scott reads that energy and matches it perfectly. He starts with one group, the reactions draw people over, and within twenty minutes, the whole party has a different buzz. Guests leave talking about the magic, not the brisket — and in Dallas, that's saying something.",
  ],
  "dallas--resident-event-magician": [
    "Dallas's luxury high-rises and condo buildings — Uptown towers, Turtle Creek residences, Victory Park complexes — want resident events that feel different from the usual lobby mixer. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who ride the same elevator every day are actually connecting over something real.",
    "The format requires no stage, no AV, no setup — it fits into lobbies, rooftop terraces, pool decks, and any common space. Property managers in Dallas consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming. Scott flies in from LA for these bookings.",
  ],
  // ── Houston ────────────────────────────────────────────────────────────
  "houston--corporate-event-magician": [
    "Houston is the energy capital of the world, and the corporate event scene matches that scale — oil and gas companies, engineering firms, international energy conglomerates, and a growing tech sector that all invest heavily in client entertainment and employee appreciation events. Corporate parties happen in downtown hotel ballrooms, Galleria-area venues, and private dining rooms across the city. Scott flies in from LA for Houston corporate bookings, and the audiences are warm, social, and ready to be impressed.",
    "The Houston corporate crowd is international, accomplished, and used to doing business over dinner and drinks. Close-up magic works at these events because it creates genuine connection in a room full of people who might speak different languages but all react the same way to something impossible happening in their hands. Scott moves through the cocktail hour performing for small groups, and within minutes, clients and executives who were making polite conversation are sharing a real moment together.",
  ],
  "houston--private-party-magician": [
    "Private parties in Houston happen at River Oaks estates, Memorial mansions, and West University homes where the hosts put serious thought into every detail. Houston hospitality is legendary — the food is abundant, the drinks are strong, and the guest list is personal. Scott's close-up magic matches that generosity. He moves through the party performing for small groups, and the reactions spread from the formal living room to the backyard to wherever the real party ends up.",
    "Houston hosts are warm and competitive — they want their guests to have the best night possible, and they want to be the person who found the entertainment nobody else has booked. Scott flies in from LA for these events, and the Texas warmth makes every performance better. Birthday milestones, anniversary celebrations, holiday gatherings — the reactions here are loud, genuine, and exactly what makes performing in Houston so much fun.",
  ],
  "houston--wedding-magician": [
    "Houston weddings are polished, personal, and planned with serious attention to detail — venues in the Museum District, ceremonies at Heights churches, receptions at hotel ballrooms where the production value is real. Scott's cocktail hour magic fits right into this effort. While guests mingle between the ceremony and reception, he performs for small groups, and by the time everyone sits down for dinner, the groom's college buddies and the bride's coworkers feel like they've been friends for years.",
    "The Houston wedding crowd is generous and expressive — when something impossible happens, they don't hold back. Guests react big, they pull the couple over to watch, they tell the story at brunch the next day. Scott flies in from LA for Houston wedding bookings and is available for rehearsal dinners too, where the smaller group and the relaxed setting make the magic even more personal.",
  ],
  "houston--close-up-magician": [
    "Close-up magic in Houston works because the city's social culture is built on genuine connection. People here talk to each other — really talk, not just network. There's a warmth that comes with Houston hospitality, and it makes every performance more fun. Scott performs for groups of four to eight using cards, borrowed objects, and mentalism, and everything happens right in their hands. No stage, no AV, no setup needed.",
    "The reactions Scott gets in Houston are consistently some of his best. There's no pretending to be unimpressed — when something impossible happens inches from someone's face, they shout, they grab the person next to them, they insist everyone at the party come see what just happened. That energy is contagious, and by the end of cocktail hour, the magic is the thing everyone's talking about.",
  ],
  "houston--private-magic-show": [
    "A Private Magic Show in a River Oaks living room, a Memorial estate, or a private event space in the Museum District is an experience that matches Houston's appetite for world-class entertainment. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show blends mentalism, storytelling, and audience interaction into something that gets standing ovations every time.",
    "These shows work for milestone birthdays, investor dinners, team celebrations, and any evening where the host wants to give their guests something genuinely unforgettable. Houston audiences appreciate quality — they can tell the difference between good and great, and they respond accordingly. Scott flies in from LA for these bookings, and the intimate format travels perfectly.",
  ],
  "houston--mentalist": [
    "Mentalism in Houston connects hard because the audiences are sharp, successful, and used to being the most capable person in the room. Engineers, surgeons, energy executives — Scott reads their body language, predicts their decisions, and reveals thoughts they were certain they kept private. Watching people who solve complex problems for a living realize they can't explain what just happened is one of the best reactions in live entertainment.",
    "Whether it's a corporate reception downtown, a private dinner in River Oaks, or a house party in the Heights, mentalism creates conversation that lasts well beyond the event. Guests spend the rest of the night debating how it works, testing each other, and retelling what happened. The international business community in Houston adds another layer — mentalism crosses language barriers in a way that few other forms of entertainment can.",
  ],
  "houston--trade-show-magician": [
    "Houston hosts major industry trade shows and conferences — energy, medical, engineering — and the competition for booth traffic is fierce. Scott draws crowds to your booth using custom magic routines that incorporate your product or messaging into the performance. Attendees stop to watch, stay to engage, and leave remembering your brand because the experience was genuinely surprising.",
    "Scott works with your team before the show to build routines around your key talking points. The magic creates a natural opening for your sales team to start conversations with warm, engaged prospects instead of cold badge-scanners walking past. He's performed at trade shows across the country and knows how to work a convention floor. Scott flies in from LA and coordinates logistics with your team in advance.",
  ],
  "houston--cocktail-hour-magician": [
    "Cocktail hour in Houston — whether it's a wedding reception in the Museum District, a corporate mixer in the Galleria area, or a private party at a River Oaks estate — is when close-up magic does its best work. Scott moves through the room performing for small groups, and the energy builds naturally. One group is laughing in disbelief, the people next to them lean in to see what's happening, and the whole room picks up a buzz that no playlist can create.",
    "The format is flexible and requires zero setup. Scott arrives, reads the room, and starts performing where the energy is right. Houston cocktail hours have a social warmth that makes them some of his favorite events — people here are genuinely hospitable, and that openness makes the magic land every single time.",
  ],
  "houston--corporate-dinner-magician": [
    "Corporate dinners in Houston happen at steakhouses downtown, private dining rooms in the Galleria area, and hotel venues where the food is serious and the relationships matter. The city's international business community means these dinners often include guests from different countries and cultures, and close-up magic is one of the few forms of entertainment that connects across every barrier. Scott performs between courses, and the shared amazement creates genuine bonding.",
    "These performances are sophisticated, conversational, and built for the intimate setting of a seated dinner. Scott reads the room and adjusts — more mentalism for an executive group, more interactive magic for a team celebration. Houston takes its corporate dining seriously, and the entertainment should match that effort. Scott flies in from LA for these bookings.",
  ],
  "houston--birthday-party-magician": [
    "Birthday parties in Houston go big — a 40th at a River Oaks estate, a surprise 50th in Memorial, a 30th at a Heights restaurant with the whole friend group. The hosts want the best, and the guests expect to have a great time. Scott's close-up magic and mentalism deliver entertainment that makes the birthday person feel like the star while giving every guest their own moment of amazement.",
    "The Houston birthday crowd is expressive and social — when something impossible happens, the reactions are loud, genuine, and contagious. Scott can perform roaming magic during the party or deliver a 30-minute private show that brings everyone together. Either way, the birthday person gets a night their guests will be talking about for months.",
  ],
  "houston--holiday-party-magician": [
    "Holiday parties in Houston — corporate celebrations downtown, neighborhood gatherings in West University, and private parties at Memorial and River Oaks homes — are serious productions. Houston hosts put real effort into these events, and the entertainment needs to match. Scott's close-up magic works for mixed crowds because it meets people where they are. He moves through the party performing for small groups, and the magic creates instant connection between coworkers, clients, and guests who just met.",
    "Houston holiday party energy is warm and generous — people bring their full personality and their best attitude to these events. Scott matches that energy with performances that are social, interactive, and built for a crowd that wants to have a good time. By the end of the night, the magic is what everyone remembers, and the host gets credit for finding entertainment that actually brought the room together.",
  ],
  "houston--fundraiser-gala-magician": [
    "Houston has one of the most active philanthropic communities in the country — the gala scene is serious, well-funded, and competitive. Medical center foundations, energy industry charities, arts organizations, and community nonprofits all host events where the entertainment matters. Scott's close-up magic during cocktail hour warms up the room before the ask, creating a generous, connected atmosphere that carries into the program.",
    "The format works in any gala setting — hotel ballrooms, museum spaces, country club venues, or private estates. Scott moves through the crowd performing for small groups, and the reactions create energy that spreads through the room. Houston gala organizers consistently report that the magic helps with donor engagement and keeps the evening feeling special. Scott flies in from LA for these bookings.",
  ],
  "houston--brand-activation-magician": [
    "Brand activations in Houston happen at pop-up locations across Midtown and the Heights, launch events in EaDo, and corporate showcases in the Galleria area. Scott creates custom magic routines built around your product or brand message — the reveal isn't just surprising, it's your product. Audiences engage because the experience is genuinely entertaining, not because they're being sold to.",
    "The Houston market is sophisticated and diverse — activations need to feel authentic and high-quality to cut through. Scott's approach works because the magic creates real moments of connection between your brand and potential customers. People share these experiences because something genuinely amazing just happened in their hands. Scott flies in from LA and coordinates with your marketing team in advance.",
  ],
  "houston--whiskey-tasting-magician": [
    "Whiskey tastings and spirits events in Houston — at cocktail bars in Midtown, private collections in River Oaks, and tasting rooms in the Heights — pair naturally with close-up magic. Both require attention, appreciation for craft, and a willingness to be surprised. Scott performs between pours, and the magic gives guests something to react to together while the bourbon gives them something to sip on.",
    "The Houston spirits crowd is knowledgeable and social — they appreciate craft in any form, whether it's a well-aged whiskey or a perfectly executed sleight of hand. The mentalism adds a layer that turns a tasting into an experience people remember for the story, not just the pour. The combination slows the evening down in the best way.",
  ],
  "houston--house-party-magician": [
    "House parties in Houston go big — River Oaks homes with outdoor living spaces that rival most venues, Memorial estates with pools and patios built for entertaining, Heights bungalows where the backyard cookout turns into a proper party. Scott's close-up magic is built for exactly this setting. No stage, no microphone, just impossible things happening in people's hands while they're holding a drink and standing by the grill.",
    "The Houston house party vibe is warm, loud, and genuinely social — Texas hospitality at its best. Scott reads that energy and matches it perfectly. He starts with one group, the reactions draw people over, and within twenty minutes, the whole party has a different buzz. Guests leave talking about the magic, not the brisket — and in Houston, that's the highest compliment you can get.",
  ],
  "houston--resident-event-magician": [
    "Houston's luxury high-rises and condo buildings — Galleria towers, River Oaks residences, downtown complexes — want resident events that feel different from the usual lobby mixer. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who ride the same elevator every day are actually connecting over something real.",
    "The format requires no stage, no AV, no setup — it fits into lobbies, rooftop terraces, pool decks, and any common space. Property managers in Houston consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming. Scott flies in from LA for these bookings.",
  ],
  // ── Atlanta ────────────────────────────────────────────────────────────
  "atlanta--corporate-event-magician": [
    "Atlanta is a corporate powerhouse — Coca-Cola, Delta, Home Depot, UPS, and a growing wave of tech and film industry companies all call this city home. The corporate event scene here is active and well-funded, with parties in Buckhead hotels, Midtown rooftops, and private venues across the city. Scott flies in from LA for Atlanta corporate bookings, and the audiences bring a mix of Southern warmth and big-city sharpness that makes every performance hit.",
    "The Atlanta corporate crowd is social, relationship-driven, and genuinely invested in making events feel personal. Close-up magic works here because it creates real connection — Scott moves through the cocktail hour performing for small groups, and within minutes, clients and executives who were exchanging business cards are sharing a moment of genuine amazement. That's harder to manufacture than any team-building exercise, and it sticks longer.",
  ],
  "atlanta--private-party-magician": [
    "Private parties in Atlanta happen at Buckhead mansions, Druid Hills estates, and Virginia-Highland homes where the hosts put serious effort into making their guests feel taken care of. Southern hospitality is real here — the food is generous, the bar is open, and the entertainment matters. Scott's close-up magic fits that spirit. He moves through the party performing for small groups, and the reactions spread naturally from the living room to the patio.",
    "Atlanta hosts are proud of their events and they want their guests talking about the night for weeks. Scott flies in from LA for these bookings, and the Southern warmth makes every performance better. Birthday milestones, anniversary celebrations, holiday gatherings — the reactions in Atlanta are big, genuine, and contagious. People here don't hold back when something amazing happens in their hands.",
  ],
  "atlanta--wedding-magician": [
    "Atlanta weddings are beautiful — venues near Piedmont Park, historic spaces in Midtown, garden ceremonies in Buckhead, and receptions where the production value is high and the hospitality is even higher. Scott's cocktail hour magic fits these celebrations naturally. While guests mingle with drinks in hand, he performs for small groups, and by the time everyone sits down for dinner, the groom's fraternity brothers and the bride's work friends feel like they've known each other for years.",
    "The Atlanta wedding crowd is expressive and fun — when something impossible happens, they react big, they grab the couple to come watch, they tell the story at the after-party. Scott flies in from LA for Atlanta wedding bookings and is available for rehearsal dinners too, where the smaller group and the relaxed setting make the magic even more personal. Southern weddings already have warmth built in — the magic just gives it a spark.",
  ],
  "atlanta--close-up-magician": [
    "Close-up magic in Atlanta works because the city's social culture runs on genuine connection. People here are warm, direct, and actually interested in each other — not just networking. Scott performs for groups of four to eight using cards, borrowed objects, and mentalism, and everything happens right in their hands. No stage, no AV, no setup required.",
    "The reactions Scott gets in Atlanta are consistently great. There's no pretending to be unimpressed — when something impossible happens inches from someone's face, they shout, they grab their friend, they make everyone at the party come see. That energy spreads through the room fast. Scott flies in from LA regularly for Atlanta close-up magic bookings, and the Southern hospitality makes every event feel like performing for friends.",
  ],
  "atlanta--private-magic-show": [
    "A Private Magic Show in a Buckhead living room, a Druid Hills estate, or a private event space in Midtown is an experience that matches Atlanta's love of great entertainment. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show blends mentalism, storytelling, and audience interaction into something that gets standing ovations every time.",
    "These shows work for milestone birthdays, investor dinners, team celebrations, and any evening where the host wants to give their guests something they've never experienced. Atlanta audiences appreciate quality and they respond with the kind of energy that makes performing here a pleasure. Scott flies in from LA for these bookings, and the intimate format travels perfectly.",
  ],
  "atlanta--mentalist": [
    "Mentalism in Atlanta connects because the audiences are accomplished, curious, and genuinely open to being surprised. Scott reads body language, predicts decisions, and reveals thoughts that people were certain they kept private — and the Atlanta crowd reacts with real amazement rather than trying to figure out the method. That openness, combined with the city's natural warmth, makes every performance electric.",
    "Whether it's a corporate reception in Buckhead, a private dinner in Druid Hills, or a house party in Virginia-Highland, mentalism creates conversation that lasts well beyond the event. Guests spend the rest of the night debating how it works, testing each other, and retelling what happened to anyone who missed it. Scott flies in from LA for Atlanta mentalism bookings.",
  ],
  "atlanta--trade-show-magician": [
    "Atlanta hosts major trade shows and conventions at the Georgia World Congress Center and venues throughout the city, and the competition for booth traffic is real. Scott draws crowds to your booth using custom magic routines that incorporate your product or messaging into the performance. Attendees stop to watch, stay to engage, and leave remembering your brand because the experience was genuinely surprising.",
    "Scott works with your team before the show to build routines around your key talking points. The magic creates a natural opening for your sales team to start conversations with warm, engaged prospects instead of cold badge-scanners walking past. He flies in from LA and coordinates logistics with your team in advance.",
  ],
  "atlanta--cocktail-hour-magician": [
    "Cocktail hour in Atlanta — whether it's a wedding reception near Piedmont Park, a corporate mixer in Buckhead, or a private party at a Druid Hills estate — is when close-up magic does its best work. Scott moves through the room performing for small groups, and the energy builds naturally. One group is laughing in disbelief, the people next to them lean in to see what's happening, and the whole room picks up a buzz that no DJ can create.",
    "The format is flexible and requires zero setup. Scott arrives, reads the room, and starts performing where the energy is right. Atlanta cocktail hours have a social warmth that makes them some of his favorite events — people here are genuinely hospitable, and that openness makes the magic land every single time.",
  ],
  "atlanta--corporate-dinner-magician": [
    "Corporate dinners in Atlanta happen at Buckhead steakhouses, Midtown private dining rooms, and hotel venues where the food is excellent and the relationships matter. Scott performs between courses, moving from table to table with close-up magic that gives each group their own impossible moment. The magic breaks down the corporate hierarchy — suddenly the VP and the new hire are reacting to the same thing, and the table dynamic shifts.",
    "These performances are sophisticated, conversational, and built for the intimate setting of a seated dinner. Scott reads the room and adjusts — more mentalism for an executive group, more interactive magic for a team celebration. Atlanta takes its dining seriously, and the entertainment should match that effort. Scott flies in from LA for these bookings.",
  ],
  "atlanta--birthday-party-magician": [
    "Birthday parties in Atlanta — whether it's a 40th at a Buckhead mansion, a surprise 50th in Druid Hills, or a 30th at a Midtown restaurant — deserve entertainment that makes the guest of honor feel like the star. Scott's close-up magic and mentalism create moments that center on the birthday person while giving every guest their own moment of amazement.",
    "The Atlanta birthday crowd is social and expressive — when something impossible happens, the reactions are loud, genuine, and contagious. Scott can perform roaming magic during the party or deliver a 30-minute private show that brings everyone together. Either way, the birthday person gets a night their guests will be talking about for months.",
  ],
  "atlanta--holiday-party-magician": [
    "Holiday parties in Atlanta — corporate celebrations in Buckhead, neighborhood gatherings in Virginia-Highland, and private parties at Druid Hills and Morningside homes — need entertainment that works for mixed crowds. Scott's close-up magic is perfect because it meets people where they are. He moves through the party performing for small groups, and the magic creates instant connection between coworkers, neighbors, and guests who just met.",
    "Atlanta holiday party energy is warm and generous — Southern hospitality meets big-city style. Scott matches that energy with performances that are social, interactive, and built for a crowd that genuinely wants to have a good time. By the end of the night, the magic is what everyone remembers, and the host gets credit for finding entertainment that actually brought the room together.",
  ],
  "atlanta--fundraiser-gala-magician": [
    "Atlanta has a strong gala culture — corporate foundations, arts organizations, medical nonprofits, and community groups all host fundraiser events where the entertainment matters. The city's philanthropic community is generous and engaged, and they show up ready to give and have a good time. Scott's close-up magic during cocktail hour warms up the room before the ask, creating a connected energy that carries into the program.",
    "The format works in any gala setting — hotel ballrooms, museum spaces, country club venues, or private estates. Scott moves through the crowd performing for small groups, and the reactions create a buzz that spreads through the room. Atlanta gala organizers consistently report that the magic helps with energy and donor engagement. Scott flies in from LA for these bookings.",
  ],
  "atlanta--brand-activation-magician": [
    "Brand activations in Atlanta happen at pop-up locations in Midtown and the Beltline area, launch events in Ponce City Market, and corporate showcases in Buckhead. Scott creates custom magic routines built around your product or brand message — the reveal isn't just surprising, it's your product. Audiences engage because the experience is genuinely entertaining, not because they're being pitched.",
    "The Atlanta market is diverse, savvy, and growing fast — activations need to feel authentic and high-quality to cut through. Scott's approach works because the magic creates real moments of connection between your brand and potential customers. People share these experiences because something genuinely amazing just happened in their hands. Scott flies in from LA and coordinates with your marketing team in advance.",
  ],
  "atlanta--whiskey-tasting-magician": [
    "Whiskey tastings and spirits events in Atlanta — at cocktail bars in Midtown, private collections in Buckhead, and tasting rooms along the Beltline — pair naturally with close-up magic. Both require attention, appreciation for craft, and a willingness to be surprised. Scott performs between pours, and the magic gives guests something to react to together while the bourbon gives them something to sip on.",
    "The Atlanta spirits crowd is knowledgeable and social — they appreciate good craft in any form, and watching someone perform genuine sleight of hand up close hits the same nerve as tasting something perfectly made. The mentalism adds a layer that turns a tasting into an experience people remember for the story, not just the pour.",
  ],
  "atlanta--house-party-magician": [
    "House parties in Atlanta are the real deal — Buckhead homes with backyards built for entertaining, Virginia-Highland bungalows where the porch party spills inside, Druid Hills estates where fifty people feels intimate. Scott's close-up magic is built for exactly this setting. No stage, no microphone, just impossible things happening in people's hands while they're holding a drink and catching up with friends.",
    "The Atlanta house party vibe is warm, loud, and genuinely social — Southern hospitality in full effect. Scott reads that energy and matches it perfectly. He starts with one group, the reactions draw people over, and within twenty minutes, the whole party has a different buzz. Guests who came knowing nobody leave feeling like they shared something with the room.",
  ],
  "atlanta--resident-event-magician": [
    "Atlanta's luxury high-rises and condo buildings — Buckhead towers, Midtown complexes, downtown residences — want resident events that feel different from the usual lobby mixer. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who share a building but never talk are actually connecting over something real.",
     "The format requires no stage, no AV, no setup — it fits into lobbies, rooftop terraces, pool decks, and any common space. Property managers in Atlanta consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming. Scott flies in from LA for these bookings.",
  ],
  // ── Nashville ──────────────────────────────────────────────────────────
  "nashville--corporate-event-magician": [
    "Nashville's corporate scene has exploded — HCA, Bridgestone, AllianceBernstein, and a growing wave of tech and healthcare companies have turned this city into one of the South's biggest business hubs. Corporate events here happen at downtown hotels, rooftop venues in the Gulch, and private spaces around Music Row, and the audiences bring a mix of Southern friendliness and real professional sharpness. Scott flies in from LA for Nashville corporate bookings, and the energy in these rooms is always great.",
    "The Nashville corporate crowd knows how to have a good time — this is a city built on hospitality and entertainment, so the bar for what counts as a memorable event is high. Close-up magic works because it's different from the live music everyone expects. Scott moves through the cocktail hour performing for small groups, and within minutes, executives and clients who were making small talk are genuinely laughing together over something impossible that just happened in their hands.",
  ],
  "nashville--private-party-magician": [
    "Private parties in Nashville happen at Belle Meade estates, Green Hills homes, and beautifully restored houses in 12South and Germantown where the hosts go all in on making their guests feel welcome. Nashville hospitality is genuine — the food is incredible, the drinks are flowing, and people actually want to connect. Scott's close-up magic fits that energy perfectly. He moves through the party performing for small groups, and the reactions spread through the house naturally.",
    "Nashville hosts care about their events and they want their guests to walk away with a real experience, not just another party. Scott flies in from LA for these bookings, and the Southern warmth makes every performance better. Birthday milestones, anniversary dinners, holiday gatherings — people in Nashville react big and they mean it. When something impossible happens three inches from someone's face, they don't try to play it cool.",
  ],
  "nashville--wedding-magician": [
    "Nashville weddings are a production — gorgeous venues around Music Row, garden settings in Belle Meade, historic spaces in East Nashville, and receptions where the food, the music, and the details all matter. Scott's cocktail hour magic fits these celebrations naturally. While guests mingle with bourbon in hand, he performs for small groups, and by the time everyone finds their seats, the groom's college friends and the bride's Nashville crew feel like they've been hanging out for years.",
    "The Nashville wedding crowd is fun and expressive — this is a city that knows how to celebrate, and when something impossible happens during cocktail hour, the reactions are loud and genuine. Scott flies in from LA for Nashville wedding bookings and is available for rehearsal dinners too, where the smaller group and the relaxed setting make the magic even more personal. Nashville weddings already have great energy — the magic just focuses it.",
  ],
  "nashville--close-up-magician": [
    "Close-up magic in Nashville works because the social culture here is built on real warmth. People aren't networking at each other — they're actually interested in connecting. Scott performs for groups of four to eight using cards, borrowed objects, and mentalism, and everything happens right in their hands. No stage, no sound system, no setup required.",
    "The reactions in Nashville are some of the best anywhere. When something impossible happens inches from someone's face, they don't hold back — they grab their friend, they yell across the room, they make everyone come see what just happened. That energy is contagious and it changes the whole feel of the event. Scott flies in from LA regularly for Nashville close-up magic bookings.",
  ],
  "nashville--private-magic-show": [
    "A Private Magic Show in a Belle Meade living room, a Green Hills estate, or a private event space in Germantown is an experience Nashville audiences love because this city already understands great entertainment. Scott brings professional lighting and a curated soundtrack, and for 30 to 45 minutes, your space becomes a private theater. The show blends mentalism, storytelling, and audience interaction into something that earns standing ovations every time.",
    "These shows work for milestone birthdays, investor dinners, team celebrations, and any evening where the host wants to give their guests something completely different. Nashville audiences are used to world-class performances — they live in Music City — and they respond to magic with the same genuine enthusiasm they bring to a great show at the Ryman. Scott flies in from LA for these bookings.",
  ],
  "nashville--mentalist": [
    "Mentalism in Nashville connects because the audiences are smart, creative, and genuinely open to being surprised. Scott reads body language, predicts decisions, and reveals thoughts that people were certain they kept private — and the Nashville crowd reacts with real wonder rather than trying to crack the code. There's an openness here that makes every performance feel electric.",
    "Whether it's a corporate reception in the Gulch, a private dinner in Belle Meade, or a house party in East Nashville, mentalism creates conversation that lasts well beyond the event. Guests spend the rest of the night testing each other, debating how it works, and retelling what happened to anyone who wasn't watching. Scott flies in from LA for Nashville mentalism bookings.",
  ],
  "nashville--trade-show-magician": [
    "Nashville hosts major conventions and trade shows at Music City Center and venues throughout downtown, and the competition for booth traffic is real. Scott draws crowds to your booth using custom magic routines that incorporate your product or messaging into the performance. Attendees stop to watch, stay to engage, and leave remembering your brand because the experience was genuinely surprising — not just another booth with a screen and some brochures.",
    "Scott works with your team before the show to build routines around your key talking points. The magic creates a natural opening for your sales team to start real conversations with warm, engaged prospects instead of cold badge-scanners walking past. He flies in from LA and coordinates logistics in advance so your team can focus on selling.",
  ],
  "nashville--cocktail-hour-magician": [
    "Cocktail hour in Nashville — whether it's a wedding reception near Music Row, a corporate mixer in the Gulch, or a private party at a Belle Meade estate — is when close-up magic does its best work. Scott moves through the room performing for small groups, and the energy builds naturally. One group is laughing in disbelief, the people next to them lean in to see what's happening, and the whole room picks up a buzz that makes the evening feel different from the start.",
    "Nashville cocktail hours have a warmth that makes them some of Scott's favorite events. People here are genuinely social — not just polite, but actually interested in each other. That openness makes the magic land harder and spread faster through the room. Scott flies in from LA and the format requires zero setup.",
  ],
  "nashville--corporate-dinner-magician": [
    "Corporate dinners in Nashville happen at downtown steakhouses, private dining rooms in the Gulch, and hotel venues where the hospitality is serious and the relationships matter. Scott performs between courses, moving from table to table with close-up magic that gives each group their own impossible moment. The magic breaks down corporate hierarchy — suddenly the CEO and the newest team member are reacting to the same thing, and the dinner conversation opens up.",
    "These performances are sophisticated, conversational, and built for the intimate setting of a seated dinner. Scott reads the room and adjusts — more mentalism for an executive group, more interactive magic for a team celebration. Nashville takes its dining and hospitality seriously, and the entertainment should match. Scott flies in from LA for these bookings.",
  ],
  "nashville--birthday-party-magician": [
    "Birthday parties in Nashville — whether it's a 40th at a Belle Meade estate, a surprise 50th in Green Hills, or a 30th at a 12South restaurant — deserve entertainment that makes the guest of honor feel like the center of the night. Scott's close-up magic and mentalism create moments that spotlight the birthday person while giving every guest their own experience.",
    "The Nashville birthday crowd is social and expressive — when something impossible happens, the reactions are loud, real, and contagious. Scott can perform roaming magic during the party or deliver a 30-minute private show that brings everyone together. Either way, the birthday person gets a night their friends will be talking about for months.",
  ],
  "nashville--holiday-party-magician": [
    "Holiday parties in Nashville — corporate celebrations downtown, neighborhood gatherings in East Nashville, and private parties at Belle Meade and Green Hills homes — need entertainment that works for mixed crowds who may not all know each other. Scott's close-up magic is perfect because it meets people where they are. He moves through the party performing for small groups, and the magic creates instant connection between coworkers, neighbors, and guests who just arrived.",
    "Nashville holiday party energy is generous and warm — this city knows how to throw a party and people come ready to have a good time. Scott matches that energy with performances that are social, interactive, and built for a crowd that doesn't need convincing. By the end of the night, the magic is what everyone remembers, and the host gets credit for finding something genuinely different.",
  ],
  "nashville--fundraiser-gala-magician": [
    "Nashville has a strong gala scene — healthcare foundations, music industry nonprofits, arts organizations, and community groups all host fundraiser events where the entertainment has to earn its place on the program. The city's philanthropic community is generous and they show up ready to give and have a genuinely good evening. Scott's close-up magic during cocktail hour warms up the room before the ask, creating a connected energy that carries into the program and the paddle raise.",
    "The format works in any gala setting — hotel ballrooms, museum spaces, historic venues, or private estates. Scott moves through the crowd performing for small groups, and the reactions create a buzz that loosens the room up before the serious part of the evening. Nashville gala organizers appreciate entertainment that helps with energy and donor engagement without being over the top. Scott flies in from LA for these bookings.",
  ],
  "nashville--brand-activation-magician": [
    "Brand activations in Nashville happen at pop-ups in the Gulch, launch events in Germantown, and retail spaces along 12South and East Nashville where the foot traffic is young, creative, and hard to impress. Scott creates custom magic routines built around your product or brand message — the reveal isn't just surprising, it's your product. Audiences engage because the experience is genuinely entertaining, not because they're being sold to.",
    "The Nashville market is growing fast, culturally savvy, and values authenticity — activations need to feel real to cut through. Scott's approach works because the magic creates genuine moments of connection between your brand and potential customers. People share these experiences because something actually amazing just happened right in front of them. Scott flies in from LA and coordinates with your marketing team in advance.",
  ],
  "nashville--whiskey-tasting-magician": [
    "Whiskey tastings and spirits events in Nashville — at cocktail bars downtown, private bourbon collections in Belle Meade, and tasting rooms in Germantown — pair naturally with close-up magic. Nashville takes its whiskey seriously, and the craft behind great sleight of hand hits the same nerve as watching someone pour a perfect old fashioned. Scott performs between pours, and the magic gives guests something to react to together while the bourbon gives them something to sip on.",
    "The Nashville spirits crowd is knowledgeable and social — they appreciate craft in any form and they're not shy about showing it. Watching genuine sleight of hand up close, inches from your glass, creates the same kind of respect you'd give a master distiller explaining their process. The mentalism adds a layer that turns a tasting into a night people talk about for the story, not just the pour.",
  ],
  "nashville--house-party-magician": [
    "House parties in Nashville are great — Belle Meade homes with backyards built for entertaining, East Nashville bungalows where the porch party spills inside, Green Hills houses where forty people feels like family. Scott's close-up magic is built for exactly this. No stage, no microphone, just impossible things happening in people's hands while they're holding a drink and catching up with friends.",
    "The Nashville house party vibe is warm, loud, and genuinely fun — Southern hospitality cranked up to full volume. Scott reads that energy and matches it perfectly. He starts with one group, the reactions draw people over, and within twenty minutes, the whole party has a different buzz. Guests who came knowing nobody leave feeling like they shared something with the room.",
  ],
  "nashville--resident-event-magician": [
    "Nashville's luxury high-rises and condo buildings — downtown towers, Gulch complexes, Midtown residences — want resident events that feel different from the usual lobby happy hour. Scott's close-up magic gives residents something genuinely surprising and social. He moves through the room performing for small groups, and by the end of the evening, neighbors who've shared an elevator for months but never spoken are actually connecting over something real.",
    "The format requires no stage, no AV, no setup — it fits into lobbies, rooftop terraces, pool decks, and any common space. Property managers in Nashville consistently report that White Rabbit events get stronger turnout and more genuine interaction than any other resident programming. Scott flies in from LA for these bookings.",
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
