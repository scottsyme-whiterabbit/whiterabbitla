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
] as const;

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
};

function getVenueContext(location: string, serviceKey: string): string {
  const venues = locationVenues[location];
  if (!venues) return "";

  switch (serviceKey) {
    case "corporate-event-magician":
      return `Whether it's a product launch at ${venues.culture[2]}, a client appreciation dinner at ${venues.dining[0]}, or a gala at ${venues.hotels[0]}, White Rabbit brings the same world-class presence to every room in ${location}.`;
    case "private-party-magician":
      return `From penthouse celebrations overlooking ${venues.culture[1]} to intimate dinner parties after an evening at ${venues.dining[1]}, ${location}'s finest hosts know: the entertainment is what separates a nice night from an unforgettable one.`;
    case "wedding-magician":
      return `${location}'s most sought-after wedding venues, from ${venues.hotels[1]} to ${venues.hotels[2]}, deserve entertainment that matches their elegance. White Rabbit is the cocktail hour experience that lives up to the setting.`;
    case "close-up-magician":
      return `Picture it: guests mingling in the lobby of ${venues.hotels[0]}, or gathered around the bar at ${venues.dining[2]}, and then something impossible happens in their hands. That's the White Rabbit effect, and it's why ${location}'s most discerning hosts keep coming back.`;
    case "private-magic-show":
      return `Imagine transforming a private dining room at ${venues.dining[0]} or the event space at ${venues.hotels[0]} into an intimate theater. The Private Magic Show brings a level of sophistication that feels right at home in ${location}'s most refined spaces.`;
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
      answer: `White Rabbit delivers a luxury entertainment experience, not just tricks. Scott is a member of the world-famous Magic Castle® in Hollywood, the most prestigious private club for magicians on earth. Combined with world-class sleight of hand and the kind of guest engagement that transforms events, it's why Netflix, Disney, Morgan Stanley, and Rolls Royce trust White Rabbit with their most important moments.`,
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
        answer: "Absolutely. Scott tailors every performance to your event's goals, audience, and tone. Whether it's incorporating your company's messaging into a reveal or matching the energy of your event theme, every detail is considered.",
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
  };

  return [...(serviceSpecific[serviceKey] || []), ...shared];
}

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
        `Whether it's a cocktail hour performance where Scott moves table to table creating jaw-dropping moments, or a full parlor show that transforms your venue into an intimate theater, every detail is tailored to your event's goals, audience, and energy. This isn't one-size-fits-all entertainment. This is White Rabbit.`,
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
      intro = `Looking for a close-up magician in ${location}? Close-up magic is the most powerful form of entertainment because it's personal. It happens right there in your hands, inches from your face, and no amount of replaying will reveal the secret. White Rabbit brings world-class sleight of hand directly to your guests, creating moments that feel like encountering real magic.`;
      body = [
        `There's a reason the world's most exclusive events feature close-up magic: it creates genuine human connection. When Scott Syme approaches a group, within sixty seconds they're united. Executives and interns, introverts and extroverts, all sharing the same moment of pure, unfiltered amazement. No other entertainment does this.`,
        `A proud member of the world-famous Magic Castle® in Hollywood, Scott's close-up work blends card magic, mentalism, and psychological illusion into seamless, conversational performances. Guests don't just watch. They participate. They shuffle the deck, they choose the card, they hold the impossible object. It's interactive in a way that makes every person feel like the star of the show.`,
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

  const faqs = generateFaqs(location, service.key);

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
    midCtaText: midCta,
    ctaText: `Book White Rabbit for Your ${location} Event`,
    socialProof: testimonial.quote,
    socialProofAttribution: testimonial.attribution,
    faqs,
  };
}

export const seoPages: SeoPage[] = locations.flatMap((location) =>
  serviceTypes.map((service) => generatePage(location, service))
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
