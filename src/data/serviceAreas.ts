// Service area data with city photos and regional grouping

export interface ServiceArea {
  city: string;
  slug: string;
  region: string;
  photo: string; // Unsplash photo URL
  tagline: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const serviceAreaRegions = [
  "Southern California",
  "Northern California",
  "West Coast",
  "Mountain & Resort",
  "Southwest",
  "Texas",
  "Southeast",
  "Northeast",
  "Midwest",
  "National",
] as const;

const cityData: { city: string; region: string; photo: string; tagline: string }[] = [
  // Southern California
  { city: "Los Angeles", region: "Southern California", photo: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&h=400&fit=crop", tagline: "Home base — from Hollywood premieres to Bel Air estates" }, // Griffith Observatory skyline
  { city: "Beverly Hills", region: "Southern California", photo: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&h=400&fit=crop", tagline: "Rodeo Drive galas and private estate soirées" }, // Rodeo Drive
  { city: "Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=400&fit=crop", tagline: "Studio events, wrap parties and red carpet nights" }, // Hollywood Sign
  { city: "Santa Monica", region: "Southern California", photo: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=400&fit=crop", tagline: "Oceanfront receptions and beachside celebrations" }, // Santa Monica Pier
  { city: "Malibu", region: "Southern California", photo: "https://images.unsplash.com/photo-1531756716853-09a60d38d820?w=600&h=400&fit=crop", tagline: "Cliffside mansions and PCH-view events" }, // Malibu coast PCH
  { city: "West Hollywood", region: "Southern California", photo: "https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=600&h=400&fit=crop", tagline: "Sunset Strip venues and members-only clubs" }, // Sunset Strip neon
  { city: "Bel Air", region: "Southern California", photo: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop", tagline: "Ultra-private estate entertainment" }, // Luxury estate
  { city: "Pasadena", region: "Southern California", photo: "https://images.unsplash.com/photo-1597589827317-4c6d6e690c38?w=600&h=400&fit=crop", tagline: "Historic venues and garden celebrations" }, // Pasadena City Hall
  { city: "Calabasas", region: "Southern California", photo: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop", tagline: "Celebrity neighborhoods and gated community events" }, // Luxury home
  { city: "Orange County", region: "Southern California", photo: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=600&h=400&fit=crop", tagline: "Newport Coast galas and Laguna Beach gatherings" }, // Laguna Beach coastline
  { city: "San Diego", region: "Southern California", photo: "https://images.unsplash.com/photo-1538097304804-2a1b932466a9?w=600&h=400&fit=crop", tagline: "Waterfront conventions and La Jolla retreats" }, // San Diego skyline waterfront
  { city: "Newport Beach", region: "Southern California", photo: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop", tagline: "Harbor-view receptions and yacht club events" }, // Harbor/boats
  { city: "Montecito", region: "Southern California", photo: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop", tagline: "Oprah-neighbor-level private affairs" }, // Spanish-style estate
  { city: "Palm Springs", region: "Southern California", photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", tagline: "Mid-century modern retreats and desert galas" }, // Palm Springs mountains/palms
  { city: "Coronado", region: "Southern California", photo: "https://images.unsplash.com/photo-1563991655280-cb95c90ca0e6?w=600&h=400&fit=crop", tagline: "Island elegance at the Hotel del Coronado and beyond" }, // Hotel del Coronado
  { city: "Santa Barbara", region: "Southern California", photo: "https://images.unsplash.com/photo-1527168027773-0cc890c4f42e?w=600&h=400&fit=crop", tagline: "American Riviera weddings and wine country affairs" }, // Santa Barbara courthouse/red roofs

  // Northern California
  { city: "San Francisco", region: "Northern California", photo: "https://images.unsplash.com/photo-1521464302861-ce943915d1c3?w=600&h=400&fit=crop", tagline: "Tech galas and Pacific Heights soirées" }, // Golden Gate Bridge
  { city: "Napa Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop", tagline: "Vineyard dinners and winery estate events" }, // Napa vineyards
  { city: "Hillsborough", region: "Northern California", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "Peninsula estate entertainment" }, // Luxury estate
  { city: "San Mateo", region: "Northern California", photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop", tagline: "Silicon Valley corporate celebrations" }, // Modern office towers
  { city: "Burlingame", region: "Northern California", photo: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop", tagline: "Bayside corporate events" }, // Charming downtown
  { city: "Atherton", region: "Northern California", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "America's most exclusive zip code celebrations" }, // Grand estate
  { city: "Palo Alto", region: "Northern California", photo: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=600&h=400&fit=crop", tagline: "Venture capital dinners and tech founder parties" }, // Stanford campus
  { city: "Woodside", region: "Northern California", photo: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop", tagline: "Redwood estate gatherings" }, // Redwood trees/estate
  { city: "Los Altos", region: "Northern California", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Silicon Valley private parties" }, // Luxury home
  { city: "Menlo Park", region: "Northern California", photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", tagline: "Tech campus events and founder dinners" }, // Modern campus
  { city: "Saratoga", region: "Northern California", photo: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop", tagline: "Foothill estate celebrations" }, // Hillside estate
  { city: "Los Gatos", region: "Northern California", photo: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop", tagline: "Wine country adjacent luxury events" }, // Charming downtown
  { city: "Tiburon", region: "Northern California", photo: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop", tagline: "Waterfront Marin County affairs" }, // Bay waterfront
  { city: "Mill Valley", region: "Northern California", photo: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=400&fit=crop", tagline: "Redwood-shaded private events" }, // Muir Woods redwoods
  { city: "Sonoma", region: "Northern California", photo: "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&h=400&fit=crop", tagline: "Wine country retreats and harvest dinners" }, // Sonoma vineyards
  { city: "Carmel-by-the-Sea", region: "Northern California", photo: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop", tagline: "Coastal luxury weddings and intimate gatherings" }, // Carmel coast

  // West Coast
  { city: "Seattle", region: "West Coast", photo: "https://images.unsplash.com/photo-1502175353174-a7a70e73b4c3?w=600&h=400&fit=crop", tagline: "Pacific Northwest corporate galas" }, // Space Needle skyline
  { city: "Portland", region: "West Coast", photo: "https://images.unsplash.com/photo-1535581652167-3a26c90c4880?w=600&h=400&fit=crop", tagline: "Creative industry celebrations" }, // Portland bridges

  // Mountain & Resort
  { city: "Las Vegas", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=600&h=400&fit=crop", tagline: "Casino nights, conventions and VIP suites" }, // Vegas Strip at night
  { city: "Aspen", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1548587665-54e41d2e7e13?w=600&h=400&fit=crop", tagline: "Ski lodge celebrations and mountain retreats" }, // Aspen mountains
  { city: "Vail", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1609139003551-ee40f5f74a12?w=600&h=400&fit=crop", tagline: "Alpine luxury and aprés-ski entertainment" }, // Vail village snow
  { city: "Park City", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop", tagline: "Sundance season parties and mountain estates" }, // Mountain resort town
  { city: "Jackson Hole", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=400&fit=crop", tagline: "Grand Teton backdrop private events" }, // Grand Tetons
  { city: "Sun Valley", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=600&h=400&fit=crop", tagline: "Idaho's billionaire playground celebrations" }, // Mountain valley
  { city: "Lake Tahoe", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=600&h=400&fit=crop", tagline: "Lakeside lodges and mountain-view galas" }, // Lake Tahoe blue water
  { city: "Telluride", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=400&fit=crop", tagline: "Remote luxury in the Colorado Rockies" }, // Mountain peaks
  { city: "Denver", region: "Mountain & Resort", photo: "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=600&h=400&fit=crop", tagline: "Mile-high corporate events and galas" }, // Denver skyline with mountains

  // Southwest
  { city: "Scottsdale", region: "Southwest", photo: "https://images.unsplash.com/photo-1558645836-e44122a743ee?w=600&h=400&fit=crop", tagline: "Desert resort incentive trips and golf outings" }, // Scottsdale desert resort
  { city: "Paradise Valley", region: "Southwest", photo: "https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&h=400&fit=crop", tagline: "Arizona's most exclusive enclave" }, // Desert landscape/Camelback
  { city: "Austin", region: "Southwest", photo: "https://images.unsplash.com/photo-1588993608830-fae41e74e8c1?w=600&h=400&fit=crop", tagline: "SXSW parties and tech industry celebrations" }, // Austin skyline/Congress Ave

  // Texas
  { city: "Dallas", region: "Texas", photo: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=600&h=400&fit=crop", tagline: "Highland Park galas and corporate affairs" }, // Dallas skyline Reunion Tower
  { city: "Houston", region: "Texas", photo: "https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=600&h=400&fit=crop", tagline: "River Oaks estate parties and energy sector events" }, // Houston skyline
  { city: "Highland Park", region: "Texas", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "Dallas's premier neighborhood celebrations" }, // Luxury estate
  { city: "River Oaks", region: "Texas", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "Houston's luxury district events" }, // Grand estate

  // Southeast
  { city: "Miami", region: "Southeast", photo: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=600&h=400&fit=crop", tagline: "South Beach parties and Brickell penthouse events" }, // Miami Beach/Ocean Drive
  { city: "Nashville", region: "Southeast", photo: "https://images.unsplash.com/photo-1545419913-775d54a0b4e4?w=600&h=400&fit=crop", tagline: "Music Row celebrations and bourbon bar receptions" }, // Nashville Broadway neon
  { city: "Atlanta", region: "Southeast", photo: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop", tagline: "Buckhead galas and Midtown corporate events" }, // Atlanta skyline
  { city: "Palm Beach", region: "Southeast", photo: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop", tagline: "The Breakers and Worth Avenue private affairs" }, // Palm-lined Worth Avenue
  { city: "Naples", region: "Southeast", photo: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop", tagline: "Gulf Coast luxury community celebrations" }, // Naples Pier sunset
  { city: "Coral Gables", region: "Southeast", photo: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop", tagline: "Biltmore elegance and coral rock estates" }, // Biltmore Hotel
  { city: "Jupiter", region: "Southeast", photo: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop", tagline: "Exclusive Florida coastal celebrations" }, // Jupiter lighthouse/beach
  { city: "Sarasota", region: "Southeast", photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", tagline: "Ringling-era elegance and barrier island events" }, // Sarasota beach
  { city: "Buckhead", region: "Southeast", photo: "https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop", tagline: "Atlanta's most prestigious neighborhood events" }, // Buckhead/Atlanta skyline
  { city: "Nantucket", region: "Northeast", photo: "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=600&h=400&fit=crop", tagline: "Island getaway celebrations" }, // Nantucket cottages
  { city: "Martha's Vineyard", region: "Northeast", photo: "https://images.unsplash.com/photo-1561466937-d2741f9b9011?w=600&h=400&fit=crop", tagline: "Coastal New England estate parties" }, // Coastal lighthouse

  // Northeast
  { city: "New York", region: "Northeast", photo: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop", tagline: "Manhattan penthouses and Hamptons estates" }, // NYC skyline/Central Park
  { city: "The Hamptons", region: "Northeast", photo: "https://images.unsplash.com/photo-1499793983394-12dec4e73116?w=600&h=400&fit=crop", tagline: "East End summer celebrations and benefit galas" }, // Hamptons beach
  { city: "Greenwich", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "Gold Coast estate entertainment" }, // Grand estate
  { city: "Boston", region: "Northeast", photo: "https://images.unsplash.com/photo-1573226541948-89e5e2b86e97?w=600&h=400&fit=crop", tagline: "Back Bay galas and Cambridge celebrations" }, // Boston waterfront/brownstones
  { city: "Washington DC", region: "Northeast", photo: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=400&fit=crop", tagline: "Embassy dinners and Georgetown receptions" }, // Capitol/monuments
  { city: "Philadelphia", region: "Northeast", photo: "https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?w=600&h=400&fit=crop", tagline: "Main Line estates and Center City galas" }, // Philadelphia skyline
  { city: "Short Hills", region: "Northeast", photo: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", tagline: "New Jersey's luxury enclave celebrations" }, // Grand estate
  { city: "Potomac", region: "Northeast", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop", tagline: "DC-area estate events and charity galas" }, // Luxury estate

  // Midwest
  { city: "Chicago", region: "Midwest", photo: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop", tagline: "Gold Coast penthouses and Lake Shore galas" }, // Chicago skyline/Bean
  { city: "Winnetka", region: "Midwest", photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop", tagline: "North Shore estate celebrations" }, // Estate home
];

export const serviceAreas: ServiceArea[] = cityData.map((c) => ({
  ...c,
  slug: slugify(c.city),
}));

export const getAreasByRegion = () => {
  const grouped: Record<string, ServiceArea[]> = {};
  for (const area of serviceAreas) {
    if (!grouped[area.region]) grouped[area.region] = [];
    grouped[area.region].push(area);
  }
  return grouped;
};

export const getAreaBySlug = (slug: string) =>
  serviceAreas.find((a) => a.slug === slug);
